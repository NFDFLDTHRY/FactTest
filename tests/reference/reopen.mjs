// D14 authority frontier reopen (design/materialization/D14-INTENDED-FRONTIER-REOPEN.md).
// First-party node ESM; uses curl + git only.  For every AUTHORITY node of design/environment-map/graph.json:
//   1 CURRENT AUTHORITY   curl the published exact_url (a policy denial is evidence, never a harness failure); when the
//                         page opens, look for the cited fragment id in it
//   2 SOURCE FRONTIER     resolve the pinned branch tip (git ls-remote; a missing branch is followed through HEAD's
//                         symref), fetch the pinned bytes (verify the pin's sha256) and, if the tip moved, the tip bytes
//   3 FRAGMENT            is the cited fragment an id at the pin and at the tip?  explicit id / rst label / asciidoc
//                         anchor, or derived by the renderer's rule (Bikeshed dfn + IDL, markdown/mdbook, asciidoctor,
//                         Bikeshed headings); ABSENT otherwise
//   4 CLAUSE              locate the clause (locator line numbers, else the fragment's line) at the pin, extract its
//                         window, find the same text at the tip -> old->new locator; a changed window is a review
//                         candidate (EDITORIAL vs SEMANTIC is decided in ASCII, not here)
//   5 MATURITY            declared status in the source (Bikeshed Status/Group metadata) at pin and tip
//   6 COARSE              no fragment cited, or line-number-only locator -> nearest enclosing id proposed
// Exit 0 = the probe ran (every verdict, including UNREACHABLE, is evidence).  Usage:
//   node tests/reference/reopen.mjs <graph.json> <out dir> [--repo-root DIR]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { sha, norm, curlHead, curlGet, tip, fetchBlob as fetchBlobAt, ids, fragmentStatus, locatorCandidates, declaredStatus, lineRange } from './lib.mjs';

const argv = process.argv.slice(2);
const [graphPath, outDir] = argv;
const repoRoot = argv.includes('--repo-root') ? argv[argv.indexOf('--repo-root') + 1] : '.';
const g = JSON.parse(readFileSync(graphPath, 'utf8'));
const fetchBlob = (pin, commit) => fetchBlobAt(pin, commit, repoRoot);
function clause(pinText, tipText, pin, frag, same) {
  const P = pinText.split('\n'), T = tipText.split('\n');
  let range = lineRange(pin.locator), method = 'locator line numbers';
  if (!range && frag) { const fs = fragmentStatus(pinText, pin.path, frag); if (fs.line) { range = [fs.line, Math.min(P.length, fs.line + 24)]; method = 'fragment line + 24'; } }
  if (!range) return { method: 'none (no line locator, fragment not locatable)', status: same ? 'UNCHANGED (file identical)' : 'NO_CLAUSE_KEY' };
  const win = P.slice(range[0] - 1, range[1]).join('\n');
  const out = { method, pin_lines: range, window_sha256: sha(win), window_excerpt: win.slice(0, 1200) };
  if (same) return { ...out, status: 'UNCHANGED (file identical)', tip_lines: range };
  const target = norm(win);
  for (let i = 0; i < T.length; i++) {
    if (!norm(T[i]).startsWith(norm(P[range[0] - 1]).slice(0, 40))) continue;
    const cand = norm(T.slice(i, i + (range[1] - range[0] + 1)).join('\n'));
    if (cand === target) return { ...out, tip_lines: [i + 1, i + 1 + range[1] - range[0]], status: i + 1 === range[0] ? 'UNCHANGED (clause identical, same lines)' : 'MOVED (clause identical, new lines)' };
  }
  let anchorTip = null;
  if (frag) { const fs = fragmentStatus(tipText, pin.path, frag); if (fs.line) anchorTip = fs.line; }
  const tipWin = anchorTip ? T.slice(anchorTip - 1, anchorTip - 1 + (range[1] - range[0] + 1)).join('\n') : null;
  return { ...out, status: anchorTip ? 'CHANGED (review: EDITORIAL or SEMANTIC)' : 'NOT_FOUND_AT_TIP (review: REMOVED / SPLIT / MOVED)', tip_lines: anchorTip ? [anchorTip, anchorTip + range[1] - range[0]] : null, tip_excerpt: tipWin ? tipWin.slice(0, 1200) : null };
}

// ------------------------------------------------------------------------------------------ run
mkdirSync(join(outDir, 'records'), { recursive: true });
const records = [];
for (const a of g.nodes.filter(n => n.class === 'AUTHORITY').sort((x, y) => x.id.localeCompare(y.id))) {
  const pin = a.reproducibility_pin || {};
  const rec = { authority: a.id, authority_class: a.authority_class, cited: { url: a.exact_url, fragment: a.exact_fragment, fragment_status_recorded: a.fragment_status, maturity_recorded: a.maturity, observed_recorded: a.observed_date, reopen_recorded: a.reopen_status }, pin };
  // 1 current authority
  if (/^https?:\/\//.test(a.exact_url)) {
    rec.published = curlHead(a.exact_url);
    if (rec.published.status === 'OPENED' && a.exact_fragment) {
      const page = curlGet(a.exact_url);
      rec.published.fragment = page.ok ? (new RegExp(`id=["']?${a.exact_fragment.replace(/^#/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'\\s>]`).test(page.body.toString()) ? 'PRESENT_PUBLISHED' : 'ABSENT_PUBLISHED') : 'PAGE_NOT_FETCHED';
    }
  } else if (/^file:\/\//.test(a.exact_url)) rec.published = { status: existsSync(a.exact_url.slice(7)) ? 'LOCAL_PRESENT' : 'LOCAL_ABSENT' };
  else rec.published = { status: 'REPOSITORY_LAW (read at canonical HEAD)' };
  // 2 source frontier
  let pinBytes = null, tipBytes = null;
  if (/^https:\/\/github\.com\//.test(pin.repo || '') && pin.commit && pin.path) {
    const isLocal = /NFDFLDTHRY\/FactTest/.test(pin.repo);
    const t = isLocal ? (() => { const r = spawnSync('git', ['-C', repoRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }); return { status: 'OK', ref: 'canonical HEAD', commit: r.stdout.trim() }; })() : tip(pin.repo, pin.branch || 'main');
    rec.source_tip = t;
    const pb = fetchBlob(pin, pin.commit);
    if (pb.ok) { pinBytes = pb.body; rec.pin_check = pin.sha256 ? (sha(pb.body) === pin.sha256 ? 'PIN_MATCH' : 'PIN_MISMATCH [ERR]') : 'PIN_HAS_NO_SHA'; rec.pin_sha256_observed = sha(pb.body); }
    else rec.pin_check = 'PIN_UNFETCHED (' + pb.code + ')';
    if (t.commit) {
      if (t.commit === pin.commit) { tipBytes = pinBytes; rec.tip_relation = 'TIP == PIN'; }
      else { const tb = fetchBlob(pin, t.commit); if (tb.ok) { tipBytes = tb.body; rec.tip_relation = sha(tb.body) === sha(pinBytes || Buffer.alloc(0)) ? 'TIP MOVED, FILE IDENTICAL' : 'TIP MOVED, FILE CHANGED'; rec.tip_sha256 = sha(tb.body); } else rec.tip_relation = 'TIP MOVED, FILE NOT AT TIP (' + tb.code + ')'; }
      if (t.status === 'BRANCH_ABSENT') rec.tip_relation += `; pinned branch ${pin.branch} absent, default ref ${t.default_ref}`;
    } else rec.tip_relation = 'TIP UNRESOLVED';
  } else if (/^file:\/\//.test(a.exact_url)) {
    const p = a.exact_url.slice(7).split('#')[0];
    if (existsSync(p)) { tipBytes = readFileSync(p); rec.tip_relation = pin.sha256 ? (sha(tipBytes) === pin.sha256 ? 'LOCAL FILE == PIN' : 'LOCAL FILE CHANGED') : 'LOCAL FILE (no pinned sha)'; rec.tip_sha256 = sha(tipBytes); pinBytes = pin.sha256 && sha(tipBytes) === pin.sha256 ? tipBytes : null; rec.pin_check = pinBytes ? 'PIN_MATCH' : 'PIN_NOT_REPRODUCIBLE_LOCALLY'; }
    else rec.tip_relation = 'LOCAL FILE ABSENT';
  } else rec.tip_relation = 'NO SOURCE PIN';
  // 3 fragment, 4 clause, 5 maturity, 6 coarse
  const frag = a.exact_fragment || null;
  if (pinBytes || tipBytes) {
    const pt = (pinBytes || tipBytes).toString('utf8'), tt = (tipBytes || pinBytes).toString('utf8');
    rec.fragment = { cited: a.exact_fragment || null, at_pin: fragmentStatus(pt, pin.path || '', frag), at_tip: fragmentStatus(tt, pin.path || '', frag) };
    rec.clause = clause(pt, tt, pin, frag, rec.tip_relation === 'TIP == PIN' || /FILE IDENTICAL|== PIN/.test(rec.tip_relation));
    rec.maturity = { declared_at_pin: declaredStatus(pt), declared_at_tip: declaredStatus(tt) };
    rec.maturity.drift = JSON.stringify(rec.maturity.declared_at_pin) === JSON.stringify(rec.maturity.declared_at_tip) ? 'NONE' : 'DECLARED STATUS CHANGED';
    const range = lineRange(pin.locator);
    if (!a.exact_fragment || rec.fragment.at_tip.status === 'ABSENT') {
      const at = range ? range[0] : (rec.clause && rec.clause.tip_lines ? rec.clause.tip_lines[0] : null);
      rec.coarse = { reason: !a.exact_fragment ? 'no fragment cited (document root)' : 'cited fragment absent at the source tip', clause_line: at,
        candidates: at ? locatorCandidates(tt, pin.path || '', at) : { note: 'no line locator: the clause position is not recorded in the pin' } };
    }
  }
  records.push(rec);
  writeFileSync(join(outDir, 'records', a.id + '.json'), JSON.stringify(rec, null, 1) + '\n');
  console.log(`${a.id}: published ${rec.published.status}; ${rec.tip_relation}; pin ${rec.pin_check || '-'}; fragment ${rec.fragment ? rec.fragment.at_pin.status + ' -> ' + rec.fragment.at_tip.status : '-'}; clause ${rec.clause ? rec.clause.status : '-'}`);
}
// ------------------------------------------------------------------------------------------ maturity registries
// WebAssembly CG/WG proposal phases (the process registry that says whether a proposal is standardized).
function proposalPhases() {
  const t = tip('https://github.com/WebAssembly/proposals', 'main');
  const pin = { repo: 'https://github.com/WebAssembly/proposals', path: 'README.md' };
  const b = t.commit ? fetchBlob(pin, t.commit) : { ok: false };
  const fin = t.commit ? fetchBlob({ ...pin, path: 'finished-proposals.md' }, t.commit) : { ok: false };
  const out = { registry: 'https://github.com/WebAssembly/proposals', commit: t.commit || null, readme_sha256: b.ok ? sha(b.body) : null, finished_sha256: fin.ok ? sha(fin.body) : null, phases: {}, finished: [] };
  if (b.ok) { let phase = null; for (const l of b.body.toString().split('\n')) { const h = l.match(/^###\s+Phase\s+(\d)/); if (h) phase = Number(h[1]); const row = l.match(/^\|\s*\[([^\]]+)\]/); if (row && phase !== null) out.phases[row[1].trim()] = phase; } }
  if (fin.ok) for (const l of fin.body.toString().split('\n')) { const row = l.match(/^\|\s*\[([^\]]+)\]/); if (row) out.finished.push(row[1].trim()); }
  return out;
}
const phases = proposalPhases();
writeFileSync(join(outDir, 'proposal-phases.json'), JSON.stringify(phases, null, 1) + '\n');
const count = f => { const t = {}; for (const r of records) { const k = f(r); t[k] = (t[k] || 0) + 1; } return t; };
const first = (cmd, args) => { const r = spawnSync(cmd, args, { encoding: 'utf8' }); return ((r.stdout || '') + (r.stderr || '')).split('\n')[0].trim(); };
const environment = { curl: first('curl', ['--version']), git: first('git', ['--version']), node: process.version,
  kernel_release: (() => { try { return readFileSync('/proc/sys/kernel/osrelease', 'utf8').trim(); } catch { return null; } })(),
  https_proxy_configured: !!process.env.HTTPS_PROXY, channels: { published_hosts: 'curl -I through the session proxy', source_tips: 'git ls-remote --symref', source_bytes: 'raw.githubusercontent.com / local git objects' } };
// hosts that matter to the frontier but are not an authority URL: public HTTPS test origin (githack), W3C TR / API
const extraHosts = ['https://raw.githack.com/', 'https://rawcdn.githack.com/', 'https://www.w3.org/TR/', 'https://api.w3.org/specifications', 'https://github.com/WebAssembly/proposals', 'https://raw.githubusercontent.com/WebAssembly/proposals/main/README.md']
  .map(u => ({ url: u, ...curlHead(u) }));
const summary = { tool: 'tests/reference/reopen.mjs', observed: new Date().toISOString(), graph: graphPath, environment, extra_hosts: extraHosts, authorities: records.length,
  published: count(r => r.published.status), tip_relation: count(r => (r.tip_relation || '').split(';')[0]), pin_check: count(r => r.pin_check || 'NONE'),
  fragment_at_tip: count(r => r.fragment ? r.fragment.at_tip.status : 'NO SOURCE'), clause: count(r => r.clause ? r.clause.status.split(' (')[0] : 'NO SOURCE'),
  maturity_drift: records.filter(r => r.maturity && r.maturity.drift !== 'NONE').map(r => r.authority),
  branch_absent: records.filter(r => /absent, default ref/.test(r.tip_relation || '')).map(r => r.authority),
  review_candidates: records.filter(r => r.clause && /^(CHANGED|NOT_FOUND|NO_CLAUSE_KEY)/.test(r.clause.status)).map(r => r.authority),
  fragment_absent: records.filter(r => r.fragment && r.fragment.at_tip.status === 'ABSENT').map(r => r.authority),
  coarse: records.filter(r => r.coarse).map(r => r.authority),
  denied_hosts: [...new Set(records.filter(r => /DENIED/.test(r.published.status)).map(r => new URL(r.cited.url).host))].sort() };
writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 1) + '\n');
console.log(JSON.stringify({ published: summary.published, tip_relation: summary.tip_relation, clause: summary.clause, fragment_at_tip: summary.fragment_at_tip }));
