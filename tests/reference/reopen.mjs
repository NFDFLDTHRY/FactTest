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
import { createHash } from 'node:crypto';

const argv = process.argv.slice(2);
const [graphPath, outDir] = argv;
const repoRoot = argv.includes('--repo-root') ? argv[argv.indexOf('--repo-root') + 1] : '.';
const g = JSON.parse(readFileSync(graphPath, 'utf8'));
const sha = b => createHash('sha256').update(b).digest('hex');
const norm = s => s.replace(/\s+/g, ' ').trim();

function curlHead(url) {
  const r = spawnSync('curl', ['-sS', '-o', '/dev/null', '-I', '--max-time', '25', '-w', '%{http_code}', url], { encoding: 'utf8' });
  const code = (r.stdout || '').trim();
  if (r.status === 0 && code && code !== '000') return { status: Number(code) < 400 ? 'OPENED' : 'HTTP_' + code, http_code: Number(code) };
  const err = (r.stderr || '').trim();
  return { status: /403|CONNECT tunnel failed/.test(err) ? 'UNREACHABLE (DENIED by network policy)' : 'UNREACHABLE', detail: err.slice(0, 160) };
}
function curlGet(url) {
  const r = spawnSync('curl', ['-sS', '--max-time', '120', '-w', '\n%{http_code}', url], { encoding: 'buffer', maxBuffer: 256 << 20 });
  const buf = r.stdout || Buffer.alloc(0); const nl = buf.lastIndexOf(0x0a);
  const code = buf.slice(nl + 1).toString().trim();
  return code === '200' ? { ok: true, body: buf.slice(0, nl) } : { ok: false, code: code || '000' };
}
const tipCache = new Map();
function tip(repo, branch) {
  const key = repo + '#' + branch;
  if (tipCache.has(key)) return tipCache.get(key);
  let res;
  const r = spawnSync('git', ['ls-remote', '--symref', repo + '.git', 'HEAD', 'refs/heads/' + branch], { encoding: 'utf8', timeout: 180000 });
  if (r.status !== 0) res = { status: 'UNREACHABLE', detail: (r.stderr || '').trim().slice(0, 160) };
  else {
    const lines = r.stdout.split('\n').filter(Boolean);
    const want = lines.find(l => l.endsWith('\trefs/heads/' + branch));
    const sym = lines.find(l => l.startsWith('ref: '));
    const headLine = lines.find(l => l.endsWith('\tHEAD') && !l.startsWith('ref: '));
    if (want) res = { status: 'OK', ref: 'refs/heads/' + branch, commit: want.split('\t')[0] };
    else res = { status: 'BRANCH_ABSENT', ref: 'refs/heads/' + branch, default_ref: sym ? sym.slice(5).split('\t')[0] : null, commit: headLine ? headLine.split('\t')[0] : null };
  }
  tipCache.set(key, res); return res;
}
const blobCache = new Map();
function fetchBlob(pin, commit) {
  const key = `${pin.repo}@${commit}:${pin.path}`;
  if (blobCache.has(key)) return blobCache.get(key);
  let res;
  const m = (pin.repo || '').match(/github\.com\/([^/]+)\/([^/]+)$/);
  if (m && m[1] === 'NFDFLDTHRY') {
    const r = spawnSync('git', ['-C', repoRoot, 'show', `${commit}:${pin.path}`], { encoding: 'buffer', maxBuffer: 256 << 20 });
    res = r.status === 0 ? { ok: true, body: r.stdout, via: 'local git object' } : { ok: false, code: 'git show failed' };
  } else if (m) {
    res = { ...curlGet(`https://raw.githubusercontent.com/${m[1]}/${m[2]}/${commit}/${pin.path}`), via: 'raw.githubusercontent.com' };
  } else res = { ok: false, code: 'NOT_GITHUB' };
  blobCache.set(key, res); return res;
}

// ------------------------------------------------------------------------------------------ fragment id derivation
const slugBikeshed = t => t.toLowerCase().replace(/<[^>]+>/g, '').replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
const slugMdbook = t => t.toLowerCase().replace(/`/g, '').replace(/[^a-z0-9 _-]/g, '').trim().replace(/ /g, '-');
const slugAdoc = t => '_' + t.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().replace(/ +/g, '_');
function ids(text, path) {
  const explicit = new Map(), derived = new Map();
  const lines = text.split('\n');
  const put = (m, id, line, kind) => { if (id && !m.has(id)) m.set(id, { line, kind }); };
  let blockFor = null, blockType = null;   // Bikeshed dfn-for / dfn-type declared on an enclosing <table>/<dl>/<div>
  lines.forEach((l, i) => {
    const n = i + 1;
    const bo = l.match(/<(table|dl|div|ul|section)\b([^>]*)>/);
    if (bo && /dfn-for\s*=|dfn-type\s*=/.test(bo[2])) { const f = bo[2].match(/dfn-for\s*=\s*(?:"([^"]+)"|([^\s>]+))/), t = bo[2].match(/dfn-type\s*=\s*(?:"([^"]+)"|([^\s>]+))/); blockFor = f ? (f[1] || f[2]) : null; blockType = t ? (t[1] || t[2]) : null; }
    if (/<\/(table|dl|div|ul|section)>/.test(l) && (blockFor || blockType)) { blockFor = null; blockType = null; }
    // asciidoctor setext section title (TITLE followed by a line of - = ~ ^ of the same length)
    if (/\.adoc$/.test(path) && i + 1 < lines.length && l.trim() && /^([-=~^])\1+$/.test(lines[i + 1].trim()) && lines[i + 1].trim().length === l.trim().length) put(derived, slugAdoc(l.trim()), n, 'asciidoctor setext section');
    for (const x of l.matchAll(/\bid\s*=\s*["']?([A-Za-z0-9_.:-]+)/g)) put(explicit, x[1], n, 'id attribute');
    for (const x of l.matchAll(/\{#([A-Za-z0-9_.:-]+)\}/g)) put(explicit, x[1], n, 'bikeshed heading id');
    const rst = l.match(/^\.\. _([A-Za-z0-9_.:-]+):\s*$/); if (rst) put(explicit, rst[1], n, 'rst label');
    for (const x of l.matchAll(/\[\[([A-Za-z0-9_.:-]+)\]\]/g)) put(explicit, x[1], n, 'asciidoc anchor');
    for (const x of l.matchAll(/<dfn([^>]*)>([\s\S]*?)<\/dfn>/g)) {
      const attrs0 = x[1], txt = x[2].replace(/<[^>]+>/g, '').trim();
      const dx = attrs0.match(/data-x\s*=\s*"([^"]+)"/);   // WHATWG (Wattsi): the id is the data-x value, lowercased
      if (dx) { put(derived, dx[1].toLowerCase().replace(/ /g, '-'), n, 'wattsi data-x'); continue; }
      const attrs = attrs0 + (blockFor && !/\bfor\s*=/.test(attrs0) ? ` for="${blockFor}"` : '') + (blockType ? ' ' + blockType : '');
      const forM = attrs.match(/\bfor\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/);
      const forV = forM ? (forM[1] || forM[2] || forM[3]).split(',')[0].trim() : null;
      const isIdl = /\b(method|attribute|dict-member|const|enum-value|interface|dictionary|enum|callback|typedef|namespace)\b/.test(attrs);
      const name = txt.replace(/\(.*\)$/, '').replace(/^"|"$/g, '');
      if (isIdl && forV) put(derived, 'dom-' + slugBikeshed(forV) + '-' + slugBikeshed(name), n, 'bikeshed IDL dfn');
      else if (isIdl) put(derived, slugBikeshed(name), n, 'bikeshed IDL dfn');
      else if (forV) { put(derived, slugBikeshed(forV) + '-' + slugBikeshed(name), n, 'bikeshed dfn (for)'); put(derived, 'dom-' + slugBikeshed(forV) + '-' + slugBikeshed(name), n, 'bikeshed dfn (for, dom- form)'); }
      else put(derived, slugBikeshed(name), n, 'bikeshed dfn');
    }
    const h = l.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/); if (h && !/\{#/.test(l)) { put(derived, slugMdbook(h[2]), n, 'markdown heading'); put(derived, slugBikeshed(h[2]), n, 'bikeshed markdown heading'); }
    const hh = l.match(/^<h[1-6][^>]*>(.*?)<\/h[1-6]>/); if (hh && !/\bid\s*=/.test(l)) put(derived, slugBikeshed(hh[1]), n, 'bikeshed <h> heading');
    const ad = l.match(/^={2,6}\s+(.+)$/); if (ad && /\.adoc$/.test(path)) put(derived, slugAdoc(ad[1]), n, 'asciidoctor section');
  });
  // dfn start tags whose attributes span lines (WHATWG HTML source style): data-x / id on the tag itself
  for (const x of text.matchAll(/<dfn\b([^>]*)>/g)) {
    if (!/\n/.test(x[1])) continue;
    const line = text.slice(0, x.index).split('\n').length;
    const dx = x[1].match(/data-x\s*=\s*"([^"]+)"/); if (dx) put(derived, dx[1].toLowerCase().replace(/ /g, '-'), line, 'wattsi data-x (multi-line tag)');
    const id = x[1].match(/\bid\s*=\s*"([^"]+)"/); if (id) put(explicit, id[1], line, 'id attribute (multi-line tag)');
  }
  // IDL blocks: interface / mixin / dictionary names and members (Bikeshed marks them up automatically)
  let cur = null;
  lines.forEach((l, i) => {
    const d = l.match(/^\s*(?:partial\s+)?(?:interface(?:\s+mixin)?|dictionary|namespace)\s+([A-Za-z_][A-Za-z0-9_]*)/);
    if (d) { cur = d[1]; put(derived, cur.toLowerCase(), i + 1, 'bikeshed IDL block'); return; }
    if (cur && /^\s*\};/.test(l)) { cur = null; return; }
    if (cur) {
      const mem = l.match(/([A-Za-z_][A-Za-z0-9_]*)\s*(\(|;|=)/);
      if (mem && !/^\s*(\/\/|\[)/.test(l)) put(derived, 'dom-' + cur.toLowerCase() + '-' + mem[1].toLowerCase(), i + 1, 'bikeshed IDL member');
    }
  });
  return { explicit, derived };
}
function fragmentStatus(text, path, frag) {
  if (!frag) return { status: 'NOT_CITED' };
  if (/^#+ /.test(frag)) {   // a markdown heading line cited as the locator (FactTest law files)
    const i = text.split('\n').findIndex(l => l.trim() === frag.trim());
    return i >= 0 ? { status: 'PRESENT_EXPLICIT', line: i + 1, kind: 'heading line' } : { status: 'ABSENT' };
  }
  const f = frag.replace(/^#/, '');
  const { explicit, derived } = ids(text, path);
  if (explicit.has(f)) return { status: 'PRESENT_EXPLICIT', ...explicit.get(f) };
  if (derived.has(f)) return { status: 'PRESENT_DERIVED', ...derived.get(f) };
  return { status: 'ABSENT' };
}
const SPEC_FORMAT = p => /\.(bs|html|rst|md|adoc)$/.test(p) || /(^|\/)source$/.test(p);
const SECTION_KINDS = /heading|section|rst label|asciidoc anchor/;
// Candidate published fragments for a clause cited by lines or by document root: the nearest preceding SECTION id
// (heading / label / anchor) and the nearest preceding DEFINITION id within 40 lines.  Candidates only: they are not
// verified against a published rendering.
function locatorCandidates(text, path, line) {
  if (!SPEC_FORMAT(path)) return { note: 'implementation source: line-anchored, no published fragment semantics' };
  const { explicit, derived } = ids(text, path);
  const T = text.split('\n'); let section = null, definition = null;
  const sectionLike = (id, v) => SECTION_KINDS.test(v.kind) || (v.kind.startsWith('id attribute') && /<h[1-6]\b/.test(T[v.line - 1] || ''));
  for (const [id, v] of [...explicit, ...derived]) {
    if (v.line > line) continue;
    if (sectionLike(id, v)) { if (!section || v.line > section.line) section = { id: '#' + id, ...v }; }
    else if (line - v.line <= 40 && !/IDL member|IDL block/.test(v.kind)) { if (!definition || v.line > definition.line) definition = { id: '#' + id, ...v }; }
  }
  return { section, definition };
}
function declaredStatus(text) {
  const st = text.match(/^Status:\s*(\S+)/m), grp = text.match(/^Group:\s*(\S+)/m), lvl = text.match(/^Level:\s*(\S+)/m);
  const out = {}; if (st) out.status = st[1]; if (grp) out.group = grp[1]; if (lvl) out.level = lvl[1];
  return Object.keys(out).length ? out : null;
}
function lineRange(locator) {
  const m = (locator || '').match(/lines?\s+(\d+)(?:\s*-\s*(\d+))?/);
  return m ? [Number(m[1]), Number(m[2] || m[1])] : null;
}
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
