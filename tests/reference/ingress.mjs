// D14 technical reference ingress (design/materialization/D14-INTENDED-REFERENCE-RESCAN.md).
// First-party node ESM, no dependencies; uses curl, git and node only.
//
// The retrieval problem: the session egress policy denies every published authority host.  The route: a publisher
// that serves its rendering through GitHub Pages keeps that rendering byte-exactly in a gh-pages branch; the branch
// head is resolved with `git ls-remote` (exact commit identity through the session git proxy) and each file is
// fetched immutably by that commit from raw.githubusercontent.com (allowed by the policy).  Sources come from the
// publisher's default branch the same way.  Every copy is a REPRODUCIBILITY PIN (commit, git blob id, sha256,
// observation time) and never the current authority; a rendering taken from a Pages branch is NOT claimed to have
// been observed at the published host.
//
//   probe-hosts --routes R --map M --graph G --out F        published/route host reachability (denial is evidence)
//   fetch       --routes R --corpus D --register F --graph G ingest every route file; re-check the D11 pins
//   verify      --routes R --corpus D --register F --out F [--refetch]   corpus == register (sha256); refetch by commit
//   audit       --routes R --corpus D --register F --map M --graph G --out DIR   link audit + fragment audit
//   plan-check  --routes R --map M --graph G                every map link / graph URL resolves to a route or NO_ROUTE
//   epoch       --routes R --register F --audit DIR --graph G --commit C --delta ID --evidence-dir E --out F
//   annotate    --audit DIR [--dry-run] <law file>...  insertion-only D14 ANNOTATION lines under drifted citations
// Exit 0 = the operation ran (verdicts live in the files); non-zero = harness malfunction or a plan-check failure.
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const RAW = 'https://raw.githubusercontent.com';

function args(argv) { const o = { _: [] }; for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const v = argv[i + 1]; if (v === undefined || v.startsWith('--')) o[a.slice(2)] = true; else { o[a.slice(2)] = v; i++; } } else o._.push(a); } return o; }
const load = p => JSON.parse(readFileSync(p, 'utf8'));
function writeJson(p, v) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(v, null, 1) + '\n'); }
const sha256 = b => createHash('sha256').update(b).digest('hex');
const gitBlob = b => createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
const now = () => new Date().toISOString();

// ------------------------------------------------------------------------------------------------ network primitives
function curlHead(url) {
  const r = spawnSync('curl', ['-sS', '-o', '/dev/null', '-I', '--max-time', '25', '-w', '%{http_code}', url], { encoding: 'utf8' });
  const code = (r.stdout || '').trim();
  if (r.status === 0 && code && code !== '000') return { status: 'HTTP', http_code: Number(code) };
  const err = (r.stderr || '').trim();
  return { status: /403|CONNECT tunnel failed/.test(err) ? 'DENIED' : 'UNREACHABLE', detail: err.slice(0, 160) };
}
function curlGet(url) {
  const r = spawnSync('curl', ['-sS', '--max-time', '300', '-w', '\n%{http_code}', url], { encoding: 'buffer', maxBuffer: 256 << 20 });
  const buf = r.stdout || Buffer.alloc(0);
  const nl = buf.lastIndexOf(0x0a);
  const code = buf.subarray(nl + 1).toString().trim();
  const body = buf.subarray(0, nl);
  if (code !== '200') return { status: 'HTTP_' + (code || '000'), url, detail: String(r.stderr || '').trim().slice(0, 160) };
  // raw.githubusercontent answers a missing path with the text "404: Not Found" (14 bytes) behind some proxies
  if (body.length === 14 && body.toString() === '404: Not Found') return { status: 'HTTP_404', url };
  return { status: 'OK', url, body };
}
const tipCache = new Map();
function lsRemote(repo, ref) {
  const key = repo + '#' + ref;
  if (tipCache.has(key)) return tipCache.get(key);
  const r = spawnSync('git', ['ls-remote', `https://github.com/${repo}.git`, `refs/heads/${ref}`], { encoding: 'utf8', timeout: 180000 });
  let res;
  if (r.status !== 0) res = { status: 'UNREACHABLE', detail: (r.stderr || '').trim().slice(0, 160) };
  else { const head = (r.stdout.split('\t')[0] || '').trim(); res = head ? { status: 'OK', head, observed: now() } : { status: 'REF_ABSENT' }; }
  tipCache.set(key, res);
  return res;
}
function rawFetch(repo, commit, path) { return curlGet(`${RAW}/${repo}/${commit}/${path}`); }

// ------------------------------------------------------------------------------------------------ url resolution
function urlNoFrag(u) { const i = u.indexOf('#'); return i >= 0 ? u.slice(0, i) : u; }
function fragOf(u) { const i = u.indexOf('#'); return i >= 0 ? u.slice(i + 1) : null; }
function resolveUrl(routes, url) {
  const base = urlNoFrag(url);
  let best = null;
  for (const rule of routes.url_map) if (base.startsWith(rule.prefix) && (!best || rule.prefix.length > best.prefix.length)) best = rule;
  if (!best) return { route: 'NO_RULE', file: null };
  if (best.pages_root) {
    const rel = base.slice(best.prefix.length);
    const file = best.pages_root + (rel === '' ? 'index.html' : rel);
    const src = best.source_root && rel ? best.source_root + rel.replace(/\.html$/, '.rst') : null;
    return { route: 'PAGES_BRANCH', file, source: src, rule: best.prefix };
  }
  if (best.file === null) return { route: 'NO_ROUTE', file: null, source: null, rule: best.prefix, note: best.published_route };
  const isPublished = best.file.startsWith('published/');
  return { route: isPublished ? 'PAGES_BRANCH' : (best.published_route || 'SOURCE_ONLY'), file: best.file, source: best.source || (isPublished ? null : best.file), rule: best.prefix };
}
function mapLinks(mapPath) {
  const t = readFileSync(mapPath, 'utf8').split('\n'); let sec = '', label = ''; const out = [];
  for (const l of t) { if (l.startsWith('## ')) { sec = l.slice(3).trim(); continue; } if (/^https?:\/\//.test(l.trim())) out.push({ section: sec, label, url: l.trim() }); else if (l.trim().endsWith(':')) label = l.trim().slice(0, -1); }
  return out;
}
function graphAuthorities(graphPath) { return load(graphPath).nodes.filter(n => n.class === 'AUTHORITY').sort((a, b) => a.id.localeCompare(b.id)); }
const isNet = u => /^https?:\/\//.test(u || '');

// ------------------------------------------------------------------------------------------------ fragment checks
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function idsIn(text) { const s = new Set(); for (const m of text.matchAll(/\b(?:id|name)\s*=\s*["']?([^"'\s>]+)/g)) s.add(m[1]); return s; }
function candidates(text, frag) {
  const words = frag.replace(/^dom-/, '').split(/[-_.]/).filter(w => w.length > 3);
  const ids = [...idsIn(text)];
  const scored = ids.map(id => ({ id, score: words.filter(w => id.toLowerCase().includes(w.toLowerCase())).length })).filter(x => x.score > 0).sort((a, b) => b.score - a.score || a.id.length - b.id.length);
  return scored.slice(0, 6).map(x => x.id);
}
function explicitId(text, frag) { return new RegExp(`\\b(?:id|name)\\s*=\\s*["']?${esc(frag)}(?=["'\\s>])`).test(text); }
function checkFragment(text, format, frag) {
  if (!frag) return { status: 'NO_FRAGMENT_CITED' };
  if (format === 'html') return explicitId(text, frag) ? { status: 'VERIFIED_IN_PUBLISHED_RENDERING' } : { status: 'ABSENT_IN_PUBLISHED_RENDERING [ERR]', candidates: candidates(text, frag) };
  if (format === 'bs' || format === 'wattsi') {
    if (explicitId(text, frag)) return { status: 'PRESENT_IN_SOURCE' };
    if (format === 'wattsi') { const m = text.match(new RegExp(`data-x=["']${esc(frag).replace(/-/g, '[-]')}["']`, 'i')); if (m) return { status: 'DERIVED_FROM_DFN_UNVERIFIED', via: m[0] }; }
    const parts = frag.split('-');
    if (parts[0] === 'dom' && parts.length >= 3) {
      const iface = parts[1], member = parts.slice(2).join('-');
      const re = new RegExp(`<dfn[^>]*\\bfor\\s*=\\s*["']?[^"'>]*${esc(iface)}[^"'>]*["']?[^>]*>\\s*(?:<[^>]+>\\s*)*${esc(member).replace(/-/g, '[-_ ]?')}`, 'i');
      if (re.test(text)) return { status: 'DERIVED_FROM_DFN_UNVERIFIED', via: `dfn for=${iface} ${member}` };
    }
    const phrase = frag.replace(/^dom-/, '').split('-').join('[-_ ]');
    if (new RegExp(`<h[1-6][^>]*>\\s*(?:<[^>]+>\\s*)*${phrase}\\b`, 'i').test(text)) return { status: 'DERIVED_FROM_HEADING_UNVERIFIED', via: 'heading text' };
    if (new RegExp(`<dfn[^>]*>\\s*(?:<[^>]+>\\s*)*${phrase}\\b`, 'i').test(text)) return { status: 'DERIVED_FROM_DFN_UNVERIFIED', via: 'dfn text' };
    return { status: 'NOT_FOUND_IN_SOURCE [ERR]', candidates: candidates(text, frag) };
  }
  if (format === 'md') {
    const slug = s => s.toLowerCase().replace(/`/g, '').replace(/[^a-z0-9 _-]/g, '').trim().replace(/\s+/g, '-');
    for (const line of text.split('\n')) { const m = line.match(/^#{1,6}\s+(.*)$/); if (m && slug(m[1]) === frag) return { status: 'PRESENT_IN_SOURCE', via: 'heading slug: ' + m[1] }; }
    if (new RegExp(`\\{#${esc(frag)}\\}|<a name=["']${esc(frag)}["']|id=["']${esc(frag)}["']`).test(text)) return { status: 'PRESENT_IN_SOURCE', via: 'explicit anchor' };
    return { status: 'NOT_FOUND_IN_SOURCE [ERR]' };
  }
  if (format === 'adoc') {
    if (new RegExp(`\\[\\[${esc(frag)}\\]\\]`).test(text)) return { status: 'PRESENT_IN_SOURCE', via: 'anchor' };
    const bare = frag.replace(/^_/, '');
    const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]; const m = line.match(/^(?:={1,5}\s+(.*)|(\S.*)::\s*)$/); let title = m && (m[1] || m[2]);
      // setext-style titles (git documentation): a title line underlined by a run of - = ~ ^ of similar length
      if (!title && i + 1 < lines.length && /^[-=~^]{3,}\s*$/.test(lines[i + 1]) && Math.abs(lines[i + 1].trim().length - line.trim().length) <= 2 && line.trim()) title = line;
      if (title && slug(title) === bare) return { status: 'DERIVED_FROM_HEADING_UNVERIFIED', via: title.trim() };
    }
    return { status: 'NOT_FOUND_IN_SOURCE [ERR]' };
  }
  if (format === 'rst') return new RegExp(`^\\.\\. _${esc(frag)}:\\s*$`, 'm').test(text) ? { status: 'PRESENT_IN_SOURCE', via: 'label' } : { status: 'NOT_FOUND_IN_SOURCE [ERR]' };
  return { status: 'FORMAT_HAS_NO_FRAGMENTS' };
}

// ------------------------------------------------------------------------------------------------ probe-hosts
function probeHosts(o) {
  const routes = load(o.routes); const hosts = new Map();
  const addUrl = (u, from) => { if (!isNet(u)) return; const h = new URL(u).host; if (!hosts.has(h)) hosts.set(h, { host: h, sample_url: u, cited_by: new Set() }); hosts.get(h).cited_by.add(from); };
  for (const l of mapLinks(o.map)) addUrl(l.url, 'REFERENCE-AUTHORITY.md');
  for (const a of graphAuthorities(o.graph)) addUrl(a.exact_url, a.id);
  const published = [...hosts.values()].sort((a, b) => a.host.localeCompare(b.host)).map(h => ({ host: h.host, cited_by: [...h.cited_by].length + ' citations', probe: curlHead(h.sample_url), sample_url: h.sample_url }));
  const routeHosts = [
    { host: 'raw.githubusercontent.com', probe: curlHead(`${RAW}/WebAssembly/spec/main/README.md`), role: 'immutable file fetch by commit (allowed)' },
    { host: 'github.com (git smart-HTTP through the session git proxy)', probe: (() => { const r = lsRemote('WebAssembly/spec', 'gh-pages'); return { status: r.status === 'OK' ? 'OK' : r.status, head: r.head || null }; })(), role: 'branch head identity (git ls-remote), partial fetch' },
    { host: 'github.com (HTTPS page)', probe: curlHead('https://github.com/WebAssembly/spec'), role: 'not needed; recorded' },
    { host: 'codeload.github.com', probe: curlHead('https://codeload.github.com/WebAssembly/spec/tar.gz/main'), role: 'archive by commit; recorded' },
    { host: 'raw.githack.com', probe: curlHead('https://raw.githack.com/WebAssembly/spec/main/README.md'), role: 'D12 public-origin test path; recorded' },
  ];
  const proxy = (() => { const r = spawnSync('sh', ['-c', 'curl -sS "$HTTPS_PROXY/__agentproxy/status"'], { encoding: 'utf8' }); try { const j = JSON.parse(r.stdout); return { enabled: j.enabled, selective: j.selective, noProxy: j.noProxy }; } catch { return { detail: (r.stderr || r.stdout || '').slice(0, 120) }; } })();
  const out = { tool: 'tests/reference/ingress.mjs probe-hosts', observed: now(), law: routes.retrieval, proxy, published_hosts: published, route_hosts: routeHosts,
    denied_hosts: published.filter(h => h.probe.status === 'DENIED').map(h => h.host), reachable_hosts: published.filter(h => h.probe.status === 'HTTP').map(h => h.host),
    verdict: published.some(h => h.probe.status === 'DENIED') ? 'PUBLISHED_HOSTS_DENIED; ROUTE ' + (routeHosts[0].probe.status === 'HTTP' && routeHosts[1].probe.status === 'OK' ? 'AVAILABLE' : 'UNAVAILABLE') : 'PUBLISHED_HOSTS_REACHABLE' };
  writeJson(o.out, out);
  console.log(`probe-hosts: ${out.denied_hosts.length} denied [${out.denied_hosts.join(' ')}]; reachable [${out.reachable_hosts.join(' ')}]; ${out.verdict}`);
}

// ------------------------------------------------------------------------------------------------ fetch (ingest)
function fetchAll(o) {
  const routes = load(o.routes); const corpus = o.corpus; const graph = o.graph ? load(o.graph) : null;
  const repos = {};
  for (const [repo, spec] of Object.entries(routes.repos)) {
    repos[repo] = { published_ref: spec.published_ref || null, published_head: null, source_ref: spec.source_ref, source_head: null, published_host: spec.published_host || null, published_route: spec.published_ref ? 'PAGES_BRANCH' : (spec.published_route || 'NO_ROUTE') };
    if (spec.published_ref) { const r = lsRemote(repo, spec.published_ref); repos[repo].published_head = r.head || null; repos[repo].published_ls_remote = r; }
    const s = lsRemote(repo, spec.source_ref); repos[repo].source_head = s.head || null; repos[repo].source_ls_remote = s;
  }
  const files = []; let bytes = 0;
  for (const f of routes.files) {
    const R = repos[f.repo]; const isPub = f.kind === 'published';
    const ref = isPub ? R.published_ref : R.source_ref; const commit = isPub ? R.published_head : R.source_head;
    const rec = { id: f.id, kind: f.kind, format: f.format, repo: f.repo, ref, commit, path: f.path, store: f.store, note: f.note || null, stands_for: isPub ? (R.published_host || '') + f.path.replace(/(^|\/)index\.html$/, '$1') : null };
    if (!commit) { rec.status = 'NO_COMMIT: ' + JSON.stringify(isPub ? R.published_ls_remote : R.source_ls_remote); files.push(rec); console.log(`${f.id}: ${rec.status}`); continue; }
    let got = null; const tried = [];
    for (const p of [f.path, ...(f.alt_paths || [])]) { const r = rawFetch(f.repo, commit, p); tried.push(`${p}:${r.status}`); if (r.status === 'OK') { got = r; rec.path = p; break; } }
    if (!got) { rec.status = 'FETCH_FAILED: ' + tried.join(' '); files.push(rec); console.log(`${f.id}: ${rec.status}`); continue; }
    const dest = join(corpus, f.store); mkdirSync(dirname(dest), { recursive: true }); writeFileSync(dest, got.body);
    Object.assign(rec, { status: 'INGESTED', url: got.url, bytes: got.body.length, sha256: sha256(got.body), git_blob_sha1: gitBlob(got.body), fetched: now(), tried: tried.length > 1 ? tried : undefined });
    bytes += got.body.length; files.push(rec);
    console.log(`${f.id}: INGESTED ${got.body.length} bytes ${f.repo}@${commit.slice(0, 12)} ${rec.path}`);
  }
  // D11/D12 authority pins: re-fetch each pinned {commit, path}; compare with the pin's sha256 and with the tip copy
  const pins = [];
  if (graph) for (const a of graphAuthorities(o.graph)) {
    const p = a.reproducibility_pin; if (!p || !/^https:\/\/github\.com\//.test(p.repo || '')) continue;
    const repo = p.repo.replace('https://github.com/', ''); const tipFile = files.find(x => x.kind === 'source' && x.repo === repo && x.path === p.path && x.status === 'INGESTED');
    const rec = { authority: a.id, pin: { repo, commit: p.commit, path: p.path, sha256: p.sha256 }, tip_commit: repos[repo] ? repos[repo].source_head : null, tip_file: tipFile ? tipFile.store : null };
    if (repo === 'NFDFLDTHRY/FactTest') { rec.verdict = 'PROJECT_LAW (internal; not re-fetched)'; pins.push(rec); continue; }
    if (!tipFile) { rec.verdict = 'TIP_NOT_IN_ROUTES [GAP]'; pins.push(rec); continue; }
    if (rec.tip_commit === p.commit) { rec.pin_refetch = 'SAME_COMMIT_AS_TIP'; rec.pin_verdict = tipFile.sha256 === p.sha256 ? 'PIN_MATCH' : 'PIN_MISMATCH [ERR]'; rec.content_since_pin = 'UNCHANGED (same commit)'; }
    else {
      const r = rawFetch(repo, p.commit, p.path);
      if (r.status !== 'OK') { rec.pin_refetch = r.status; rec.pin_verdict = 'PIN_UNFETCHED [UNK]'; }
      else { const s = sha256(r.body); rec.pin_refetch = 'OK'; rec.pin_verdict = s === p.sha256 ? 'PIN_MATCH' : 'PIN_MISMATCH [ERR]'; rec.content_since_pin = tipFile.sha256 === s ? 'UNCHANGED (tip moved, same bytes)' : 'CHANGED_SINCE_PIN (tip ' + rec.tip_commit.slice(0, 12) + ')'; }
    }
    rec.verdict = rec.pin_verdict; pins.push(rec);
    console.log(`${a.id}: pin ${rec.pin_verdict}; ${rec.content_since_pin || ''}`);
  }
  const register = { schema: 'facttest-reference-register/1', law: routes.law, retrieval: routes.retrieval, ingested: now(), corpus_root: 'fixtures/reference', repos, files, authority_pins: pins,
    totals: { files: files.length, ingested: files.filter(f => f.status === 'INGESTED').length, published: files.filter(f => f.kind === 'published' && f.status === 'INGESTED').length, sources: files.filter(f => f.kind === 'source' && f.status === 'INGESTED').length, bytes,
      pins_rechecked: pins.length, pin_match: pins.filter(p => p.pin_verdict === 'PIN_MATCH').length, pin_mismatch: pins.filter(p => /MISMATCH/.test(p.pin_verdict || '')).length, content_changed_since_pin: pins.filter(p => /^CHANGED/.test(p.content_since_pin || '')).length } };
  writeJson(o.register, register);
  console.log(`fetch: ${register.totals.ingested}/${register.totals.files} files, ${bytes} bytes; pins ${register.totals.pin_match} match / ${register.totals.pin_mismatch} mismatch; content changed since pin: ${register.totals.content_changed_since_pin}`);
  if (register.totals.ingested !== register.totals.files) process.exitCode = 1;
}

// ------------------------------------------------------------------------------------------------ verify
function verify(o) {
  const routes = load(o.routes); const reg = load(o.register); const corpus = o.corpus; const checks = [];
  const regById = new Map(reg.files.map(f => [f.id, f]));
  for (const f of routes.files) { const r = regById.get(f.id); if (!r) checks.push({ file: f.id, check: 'registered', status: 'FAIL' }); }
  for (const r of reg.files) {
    if (r.status !== 'INGESTED') { checks.push({ file: r.id, check: 'ingested', status: 'FAIL', detail: r.status }); continue; }
    const p = join(corpus, r.store);
    if (!existsSync(p)) { checks.push({ file: r.id, check: 'present', status: 'FAIL', detail: r.store }); continue; }
    const b = readFileSync(p); const s = sha256(b);
    checks.push({ file: r.id, check: 'sha256_matches_register', status: s === r.sha256 && b.length === r.bytes ? 'PASS' : 'FAIL', detail: `${r.store} ${b.length} bytes` });
    if (gitBlob(b) !== r.git_blob_sha1) checks.push({ file: r.id, check: 'git_blob_matches_register', status: 'FAIL' });
    if (o.refetch) { const g = rawFetch(r.repo, r.commit, r.path); checks.push({ file: r.id, check: 'refetch_by_commit_identical', status: g.status === 'OK' && sha256(g.body) === r.sha256 ? 'PASS' : 'FAIL', detail: g.status === 'OK' ? `${r.repo}@${r.commit.slice(0, 12)} ${r.path}` : g.status }); }
  }
  const fails = checks.filter(c => c.status === 'FAIL');
  const out = { tool: 'tests/reference/ingress.mjs verify' + (o.refetch ? ' --refetch' : ''), observed: now(), register: o.register, register_sha256: sha256(readFileSync(o.register)), files: reg.files.length, checks: checks.length, failed: fails.length, verdict: fails.length ? 'FAIL' : 'PASS', failures: fails.slice(0, 50) };
  if (o.out) writeJson(o.out, out);
  console.log(`verify${o.refetch ? ' (refetch)' : ''}: ${out.verdict}; ${checks.length} checks, ${fails.length} failed`);
}

// ------------------------------------------------------------------------------------------------ audit
function readCorpus(corpus, store) { const p = join(corpus, store); return existsSync(p) ? readFileSync(p, 'utf8') : null; }
function fileFormat(routes, store) { const f = routes.files.find(x => x.store === store); return f ? f.format : (store.endsWith('.html') ? 'html' : 'unknown'); }
function auditLink(routes, corpus, reg, url) {
  const res = resolveUrl(routes, url); const frag = fragOf(url);
  const rec = { url, route: res.route, file: res.file, source: res.source || null, fragment: frag };
  if (!res.file) { rec.fragment_status = res.route === 'NO_ROUTE' ? 'NO_ROUTE [UNK]' : 'NO_RULE [GAP]'; rec.note = res.note || null; return rec; }
  const regf = reg.files.find(f => f.store === res.file); rec.commit = regf ? regf.commit : null; rec.file_sha256 = regf ? regf.sha256 : null;
  const text = readCorpus(corpus, res.file);
  if (text === null) { rec.fragment_status = 'FILE_MISSING [ERR]'; return rec; }
  const fmt = fileFormat(routes, res.file);
  const r = checkFragment(text, fmt, frag); Object.assign(rec, r, { fragment_status: r.status, checked_in: fmt });
  if (frag && res.source && res.source !== res.file) { const st = readCorpus(corpus, res.source); if (st !== null) { const sr = checkFragment(st, fileFormat(routes, res.source), frag); rec.source_fragment_status = sr.status; if (sr.via) rec.source_via = sr.via; } }
  return rec;
}
function audit(o) {
  const routes = load(o.routes); const reg = load(o.register); const corpus = o.corpus;
  const links = mapLinks(o.map).map(l => ({ ...l, ...auditLink(routes, corpus, reg, l.url) }));
  const tally = arr => { const t = {}; for (const x of arr) t[x] = (t[x] || 0) + 1; return t; };
  const linkAudit = { tool: 'tests/reference/ingress.mjs audit (REFERENCE-AUTHORITY.md links)', observed: now(), links: links.length, by_route: tally(links.map(l => l.route)), by_fragment_status: tally(links.map(l => l.fragment_status)), records: links };
  writeJson(join(o.out, 'link-audit.json'), linkAudit);
  const auths = graphAuthorities(o.graph).map(a => {
    const rec = { authority: a.id, exact_url: a.exact_url, exact_fragment: a.exact_fragment, d11_reopen_status: a.reopen_status, d11_fragment_status: a.fragment_status };
    if (!isNet(a.exact_url)) { rec.route = a.exact_url.startsWith('file:') ? 'LOCAL' : 'PROJECT_LAW'; rec.reopen = 'NOT_A_NETWORK_AUTHORITY'; rec.fragment_status = 'NOT_AUDITED'; return rec; }
    const link = auditLink(routes, corpus, reg, a.exact_url + (a.exact_fragment || ''));
    Object.assign(rec, { route: link.route, file: link.file, source: link.source, commit: link.commit, file_sha256: link.file_sha256, fragment_status: link.fragment_status, via: link.via || null, candidates: link.candidates || null, source_fragment_status: link.source_fragment_status || null, note: link.note || null });
    rec.reopen = link.route === 'PAGES_BRANCH' ? 'REOPENED_VIA_PAGES_BRANCH (not observed at host)' : link.route === 'NO_ROUTE' ? 'NO_ROUTE (source-pinned only)' : link.route === 'NO_RULE' ? 'NO_RULE [GAP]' : 'SOURCE_ONLY (published rendering has no route)';
    const pin = reg.authority_pins.find(p => p.authority === a.id); if (pin) { rec.pin_verdict = pin.pin_verdict; rec.content_since_pin = pin.content_since_pin || null; rec.tip_commit = pin.tip_commit; }
    rec.fact_status = /VERIFIED_IN_PUBLISHED|PRESENT_IN_SOURCE/.test(rec.fragment_status) ? 'RUN' : rec.fragment_status === 'NO_FRAGMENT_CITED' ? (link.file ? 'RUN' : 'UNK') : /DERIVED/.test(rec.fragment_status) ? 'OBS' : /NO_ROUTE|NO_RULE/.test(rec.fragment_status) ? 'UNK' : 'ERR';
    return rec;
  });
  const fragments = { tool: 'tests/reference/ingress.mjs audit (graph AUTHORITY nodes)', observed: now(), authorities: auths.length, by_route: tally(auths.map(a => a.route)), by_fragment_status: tally(auths.map(a => a.fragment_status)), by_fact_status: tally(auths.map(a => a.fact_status || 'n/a')), records: auths };
  writeJson(join(o.out, 'fragments.json'), fragments);
  const lines = ['D14 AUDIT', `links: ${links.length} ${JSON.stringify(linkAudit.by_fragment_status)}`, `authorities: ${auths.length} ${JSON.stringify(fragments.by_fragment_status)} facts ${JSON.stringify(fragments.by_fact_status)}`, '',
    ...links.map(l => `${(l.fragment_status || '').padEnd(36)} ${l.route.padEnd(13)} ${l.url}`), '', ...auths.map(a => `${(a.fragment_status || '').padEnd(36)} ${(a.route || '').padEnd(13)} ${a.authority} ${a.exact_url}${a.exact_fragment || ''}${a.candidates ? '  candidates: ' + a.candidates.join(',') : ''}`)];
  writeFileSync(join(o.out, 'audit.txt'), lines.join('\n') + '\n');
  console.log(lines.slice(0, 3).join('\n'));
}
function planCheck(o) {
  const routes = load(o.routes); const problems = [];
  for (const l of mapLinks(o.map)) { const r = resolveUrl(routes, l.url); if (r.route === 'NO_RULE') problems.push('map link without route rule: ' + l.url); }
  for (const a of graphAuthorities(o.graph)) if (isNet(a.exact_url)) { const r = resolveUrl(routes, a.exact_url); if (r.route === 'NO_RULE') problems.push(`${a.id} without route rule: ${a.exact_url}`); }
  for (const m of routes.url_map) for (const k of ['file', 'source']) if (m[k] && !routes.files.some(f => f.store === m[k])) problems.push(`url_map ${k} not ingested: ${m[k]}`);
  console.log(problems.length ? 'plan-check FAIL\n' + problems.join('\n') : `plan-check PASS: every REFERENCE-AUTHORITY.md link and graph authority URL resolves to a route or an explicit NO_ROUTE; ${routes.files.length} files`);
  if (problems.length) process.exit(1);
}

// ------------------------------------------------------------------------------------------------ epoch
function toolchainProbe(chan) { const r = spawnSync('rustc', [`+${chan}`, '-vV'], { encoding: 'utf8' }); const pick = k => (r.stdout.match(new RegExp('^' + k + ': (.*)$', 'm')) || [])[1] || null; return r.status === 0 ? { channel: chan, rustc: r.stdout.split('\n')[0], rustc_commit: pick('commit-hash'), llvm: pick('LLVM version') } : { channel: chan, error: (r.stderr || '').split('\n')[0] }; }
function ver(p, a) { const r = spawnSync(p, a, { encoding: 'utf8' }); return r.status === 0 ? (r.stdout || '').trim().split('\n')[0] : null; }
function epoch(o) {
  const routes = load(o.routes); const reg = load(o.register); const frag = load(join(o.audit, 'fragments.json')); const linkAudit = load(join(o.audit, 'link-audit.json')); const hosts = load(join(o['evidence-dir'], 'ingress', 'hosts.json'));
  const refetch = load(join(o['evidence-dir'], 'ingress', 'refetch.json'));
  const E = o['evidence-dir']; const D = o.delta; const C = o.commit;
  const ENV = 'ENV-D14-HOST-NETWORK', PROBE = 'PROBE-D14-REFERENCE-INGRESS', IMPL = 'IMPL-D14-REFERENCE-INGRESS', CORP = 'IMPL-D14-REFERENCE-CORPUS', CON = 'CON-EM-D14-001';
  const owner = `D14 (derived from the evidence named by its edges)`;
  const nodes = [], edges = [];
  nodes.push({ id: ENV, class: 'ENVIRONMENT', environment_id: ENV, environment_class: 'PHYSICAL_HOST',
    toolchain: { stable: toolchainProbe('1.94.1'), nightly: toolchainProbe('nightly-2026-09-24') }, target: 'x86_64-unknown-linux-gnu (host); network egress through the session proxy',
    host_runtime: `node ${ver('node', ['--version'])} / git ${ver('git', ['--version'])} / curl ${(ver('curl', ['--version']) || '').split(' ').slice(0, 2).join(' ')}`,
    versions: { node: ver('node', ['--version']), git: ver('git', ['--version']), curl: (ver('curl', ['--version']) || '').split(' ')[1] || null },
    flags: { network_egress_policy: { denied_hosts: hosts.denied_hosts, reachable_published_hosts: hosts.reachable_hosts, allowed_route_hosts: routes.retrieval.allowed_route_hosts, proxy: hosts.proxy } },
    build_profile: 'n/a', origin_security: null, permissions_policy: null, implementation_hardware_class: 'CPU only', dependency_graph_identity: null,
    other_state: { branch_heads: Object.fromEntries(Object.entries(reg.repos).map(([r, v]) => [r, { [v.published_ref || '-']: v.published_head, [v.source_ref]: v.source_head }])), register_sha256: refetch.register_sha256 },
    identity_completeness: { missing: ['CPU identity', 'proxy egress identity beyond host allow/deny'], present: ['network policy as observed per host', 'branch heads at ingest', 'toolchains', 'node/git/curl versions'] },
    owner: `${E}/ingress/hosts.json`, note: 'first epoch that records the egress policy per authority host and the Pages-branch route' });
  nodes.push({ id: IMPL, class: 'IMPLEMENTATION', impl_id: IMPL, repo_path: 'tests/reference/ingress.mjs + fixtures/reference/ROUTES.json', commit: `introduced by ${D} (integration commit in LEDGER AFTER)`, kind: 'harness', note: 'probe-hosts / fetch / verify / audit / plan-check / epoch; curl + git + node only', owner: 'FactTest repository path tests/reference/' });
  nodes.push({ id: CORP, class: 'IMPLEMENTATION', impl_id: CORP, repo_path: 'fixtures/reference/{REGISTER.json,published/,sources/}', commit: `introduced by ${D} (integration commit in LEDGER AFTER)`, kind: 'fixture_data', note: `${reg.totals.ingested} reproducibility copies (${reg.totals.published} published renderings from Pages branches, ${reg.totals.sources} sources), ${reg.totals.bytes} bytes; pins, never current authority`, owner: 'FactTest repository path fixtures/reference/' });
  nodes.push({ id: CON, class: 'CONSTRAINT', constraint_id: CON, statement: 'An authority copy in fixtures/reference/ is a reproducibility pin identified by repository, branch head commit, git blob id and sha256 at ingest time; a rendering taken from a GitHub Pages branch is never claimed to have been observed at the published host; the current authority remains the hyperlink in REFERENCE-AUTHORITY.md', authority_refs: [], scope: 'fixtures/reference/, tests/reference/, design/environment-map/', conflicts: [], ledger_status: 'PROPOSED', kind: 'project', owner: 'D14 (PROPOSED; returned to ASCII for law adoption)' });
  const facts = [];
  const fact = (id, predicate, status, extra = {}) => { const n = { id, class: 'COMPUTATIONAL_FACT', fact_id: id, subject: extra.subject || 'technical reference authorities of FactTest', predicate, required_environment: ['network egress policy of the session container (ENV-D14-HOST-NETWORK)'], constraint_refs: [CON], status, note: extra.note || null, source_ref: extra.source_ref || 'D14-OBSERVED', owner }; nodes.push(n); facts.push(id); return n; };
  const ev = (id, path, result) => nodes.push({ id, class: 'EVIDENCE', evidence_id: id, probe_ref: PROBE, environment_ref: ENV, artifact_identity: { path, sha256: null, locator: 'verdict/records', identity_source: 'sha256 of the committed file (bound after the station ran)' }, observed_result: result, epoch: 'D14', status: 'PENDING', status_after_bind: 'RUN', evidence_class: 'PHYSICAL_HOST', owner: `Factory receipt of ${D}` });
  ev('EV-D14-HOSTS', `${E}/ingress/hosts.json`, hosts.verdict);
  ev('EV-D14-REGISTER', `${E}/ingress/register.json`, `${reg.totals.ingested}/${reg.totals.files} ingested; pins ${reg.totals.pin_match} match, ${reg.totals.pin_mismatch} mismatch`);
  ev('EV-D14-REFETCH', `${E}/ingress/refetch.json`, `${refetch.verdict}: ${refetch.checks} checks, ${refetch.failed} failed`);
  ev('EV-D14-LINK-AUDIT', `${E}/audit/link-audit.json`, JSON.stringify(linkAudit.by_fragment_status));
  ev('EV-D14-FRAGMENTS', `${E}/audit/fragments.json`, JSON.stringify(frag.by_fragment_status));
  fact('FACT-D14-PUBLISHED-HOSTS-DENIED', `${hosts.denied_hosts.length} published authority hosts answer CONNECT 403 from the session egress proxy [${hosts.denied_hosts.join(' ')}]; reachable published hosts: [${hosts.reachable_hosts.join(' ') || 'none'}]; route hosts raw.githubusercontent.com and github.com git smart-HTTP are allowed`, hosts.denied_hosts.length ? 'RUN' : 'OBS', { source_ref: `${E}/ingress/hosts.json` });
  fact('FACT-D14-PAGES-BRANCH-ROUTE', `${reg.totals.published} published renderings were obtained byte-exactly from their publishers' gh-pages branches at the ls-remote head commits recorded in the register; none was observed at its published host`, 'RUN', { source_ref: `${E}/ingress/register.json` });
  fact('FACT-D14-CORPUS-INGESTED', `${reg.totals.ingested} of ${reg.totals.files} route files ingested into fixtures/reference (${reg.totals.bytes} bytes) with commit, git blob id and sha256 each`, reg.totals.ingested === reg.totals.files ? 'RUN' : 'ERR', { source_ref: `${E}/ingress/register.json` });
  fact('FACT-D14-CORPUS-REPRODUCIBLE', `every corpus file re-fetched by its recorded commit is byte-identical (${refetch.checks} checks, ${refetch.failed} failed)`, refetch.verdict === 'PASS' ? 'RUN' : 'ERR', { source_ref: `${E}/ingress/refetch.json` });
  fact('FACT-D14-D11-PINS-RECHECKED', `${reg.totals.pins_rechecked} D11/D12 authority pins re-fetched by commit: ${reg.totals.pin_match} match their recorded sha256, ${reg.totals.pin_mismatch} mismatch; ${reg.totals.content_changed_since_pin} pinned files changed at the current branch head`, reg.totals.pin_mismatch ? 'ERR' : 'RUN', { source_ref: `${E}/ingress/register.json` });
  const la = linkAudit.by_fragment_status; const bad = Object.entries(la).filter(([k]) => /ERR/.test(k)).reduce((s, [, v]) => s + v, 0);
  fact('FACT-D14-MAP-LINKS-AUDITED', `REFERENCE-AUTHORITY.md: ${linkAudit.links} links resolved through the route table: ${JSON.stringify(la)}; ${bad} fragment(s) not found where cited`, bad ? 'ERR' : 'RUN', { source_ref: `${E}/audit/link-audit.json` });
  for (const a of frag.records) {
    if (a.reopen === 'NOT_A_NETWORK_AUTHORITY') continue;
    const id = 'FACT-D14-REOPEN-' + a.authority.replace(/^AUTH-/, '');
    fact(id, `${a.exact_url}${a.exact_fragment || ''}: ${a.reopen}; fragment ${a.fragment_status}${a.via ? ' (' + a.via + ')' : ''}${a.candidates ? '; published ids near the cited fragment: ' + a.candidates.join(', ') : ''}${a.commit ? '; copy at ' + (a.file && a.file.startsWith('published/') ? 'gh-pages' : 'source') + '@' + a.commit.slice(0, 12) : ''}${a.pin_verdict ? '; D11 pin ' + a.pin_verdict : ''}${a.content_since_pin ? '; ' + a.content_since_pin : ''}`, a.fact_status, { subject: a.authority, source_ref: `${E}/audit/fragments.json` });
    edges.push({ type: 'AUTHORIZES', from: a.authority, to: id, note: 'D14 reopen observation of this authority (the fact restates the cited clause location at the copy commit)' });
    edges.push({ type: 'EVIDENCED_BY', from: id, to: 'EV-D14-FRAGMENTS' });
    edges.push({ type: 'STALE_IF', from: id, to: ENV, condition: { dimension: 'authority.source_commit', relation: 'changes' } });
  }
  nodes.push({ id: PROBE, class: 'PROBE', probe_id: PROBE, proves_fact: facts, command_or_operation: 'node tests/reference/ingress.mjs probe-hosts | fetch | verify --refetch | audit (S-FIXTURE ingest, S-BUILD evidence)', expected_observations: ['published hosts DENIED (CONNECT 403); route hosts allowed', 'every route file ingested with commit/blob/sha256', 'refetch by commit byte-identical', 'D11 pins re-fetched match', 'cited fragments present in the published rendering or source'], failure_meaning: ['a fragment absent in the published rendering = the citation drifted (ERR in law until corrected through S-ANNOTATE or an owner law delta)', 'refetch mismatch = the branch commit is not immutable content or the copy was altered', 'pin mismatch = the D11 pin identity is wrong'], implemented_by: IMPL, owner: 'tests/reference/ingress.mjs' });
  for (const f of facts) { edges.push({ type: 'PROBED_BY', from: f, to: PROBE }); edges.push({ type: 'REQUIRES', from: f, to: ENV }); }
  for (const [f, e] of [['FACT-D14-PUBLISHED-HOSTS-DENIED', 'EV-D14-HOSTS'], ['FACT-D14-PAGES-BRANCH-ROUTE', 'EV-D14-REGISTER'], ['FACT-D14-CORPUS-INGESTED', 'EV-D14-REGISTER'], ['FACT-D14-CORPUS-REPRODUCIBLE', 'EV-D14-REFETCH'], ['FACT-D14-D11-PINS-RECHECKED', 'EV-D14-REGISTER'], ['FACT-D14-MAP-LINKS-AUDITED', 'EV-D14-LINK-AUDIT']]) edges.push({ type: 'EVIDENCED_BY', from: f, to: e });
  edges.push({ type: 'STALE_IF', from: 'FACT-D14-PUBLISHED-HOSTS-DENIED', to: ENV, condition: { dimension: 'network_egress.policy', relation: 'changes' } });
  edges.push({ type: 'STALE_IF', from: 'FACT-D14-PAGES-BRANCH-ROUTE', to: ENV, condition: { dimension: 'network_egress.policy', relation: 'changes' } });
  edges.push({ type: 'IMPLEMENTED_BY', from: PROBE, to: IMPL });
  edges.push({ type: 'IMPLEMENTED_BY', from: 'FACT-D14-CORPUS-INGESTED', to: CORP });
  edges.push({ type: 'IMPLEMENTED_BY', from: CON, to: CORP });
  edges.push({ type: 'REQUIRES', from: CON, to: 'FACT-D14-CORPUS-REPRODUCIBLE' });
  for (const e of ['EV-D14-HOSTS', 'EV-D14-REGISTER', 'EV-D14-REFETCH', 'EV-D14-LINK-AUDIT', 'EV-D14-FRAGMENTS']) { edges.push({ type: 'BUILT_WITH', from: e, to: ENV }); edges.push({ type: 'EVIDENCED_BY', from: PROBE, to: e }); }
  edges.push({ type: 'INVALIDATED_BY', from: 'FACT-AUTHORITY-REOPEN-DENIED', to: 'EV-D14-REGISTER', note: 'D11 fact "clauses could only be taken from source pins" is superseded for the authorities with a Pages-branch route; the hosts themselves remain denied (FACT-D14-PUBLISHED-HOSTS-DENIED)' });
  const out = { schema: 'facttest-environment-map-epoch/1', epoch: 'D14', delta: D, commit: `${C} (canonical base; integration commit in LEDGER AFTER)`, summary: `technical reference rescan: egress denial recorded per host, Pages-branch route, ${reg.totals.ingested} authority copies ingested as pins, D11 pins re-checked, ${frag.records.filter(a => a.reopen !== 'NOT_A_NETWORK_AUTHORITY').length} authorities reopened with fragment verdicts; evidence bound after the stations ran`, nodes, edges };
  writeJson(o.out, out);
  console.log(`epoch: ${nodes.length} nodes, ${edges.length} edges -> ${o.out}`);
}

// ------------------------------------------------------------------------------------------------ annotate (S-ANNOTATE)
// Insertion-only: after every cited link whose fragment the audit found ABSENT in the published rendering, and after
// every existing D13 ANNOTATION of js-api #internal-storage, insert one "D14 ANNOTATION" line derived from the audit.
// Idempotent (a file that already carries the line for that fragment is left alone); never deletes or edits a line.
function annotate(o) {
  const linkAudit = load(join(o.audit, 'link-audit.json')); const frag = load(join(o.audit, 'fragments.json'));
  const absent = linkAudit.records.filter(r => /ABSENT_IN_PUBLISHED_RENDERING/.test(r.fragment_status));
  const storage = frag.records.find(a => a.authority === 'AUTH-WASM-JSAPI-STORAGE');
  const lineFor = (r) => `D14 ANNOTATION (fragment #${r.fragment}): reopened at the published rendering taken from the publisher's gh-pages branch @${(r.commit || '').slice(0, 12)} (fixtures/reference/${r.file}, evidence/D14/audit/link-audit.json): no element carries id "${r.fragment}"; nearest ids in that rendering: ${(r.candidates || []).slice(0, 4).map(c => '#' + c).join(', ')}.  The citation above is preserved exactly as written and is NOT asserted current [ERR] until an owner-approved law delta replaces the fragment; the rendering was not observed at the published host (egress denied).`;
  const storageLine = `D14 ANNOTATION (fragment #internal-storage): confirmed at the published rendering taken from WebAssembly/spec gh-pages@${(storage.commit || '').slice(0, 12)} (fixtures/reference/${storage.file}, evidence/D14/audit/fragments.json): no element carries id "internal-storage"; the section is <h2 id="webassembly-storage"> (also #store).  Historical citation preserved; NOT asserted current [ERR]; the rendering was not observed at the published host (egress denied).`;
  const report = [];
  for (const f of o._.slice(1)) {
    const lines = readFileSync(f, 'utf8').split('\n'); const out = []; let inserted = 0;
    for (let i = 0; i < lines.length; i++) {
      out.push(lines[i]);
      const l = lines[i].trim();
      if (/^D13 ANNOTATION \(fragment #internal-storage\)/.test(lines[i]) && !lines.some(x => x.startsWith('D14 ANNOTATION (fragment #internal-storage)'))) { out.push(storageLine); inserted++; continue; }
      const hit = absent.find(r => l === r.url);
      if (hit && !lines.some(x => x.startsWith(`D14 ANNOTATION (fragment #${hit.fragment})`)) && !out.slice(-1)[0].startsWith('D14 ANNOTATION')) {
        // keep an existing D13 annotation line directly under the link; insert after it
        if (i + 1 < lines.length && lines[i + 1].startsWith('D13 ANNOTATION')) { out.push(lines[i + 1]); i++; }
        out.push(hit.fragment === 'internal-storage' ? storageLine : lineFor(hit)); inserted++;
      }
    }
    if (inserted && !o['dry-run']) writeFileSync(f, out.join('\n'));
    report.push(`${f}: ${inserted} line(s) inserted${o['dry-run'] ? ' (dry run)' : ''}`);
  }
  console.log(report.join('\n'));
}

const o = args(process.argv.slice(2)); const sub = o._[0];
try {
  switch (sub) {
    case 'probe-hosts': probeHosts(o); break;
    case 'fetch': fetchAll(o); break;
    case 'verify': verify(o); break;
    case 'audit': audit(o); break;
    case 'plan-check': planCheck(o); break;
    case 'epoch': epoch(o); break;
    case 'annotate': annotate(o); break;
    default: console.error('usage: ingress.mjs <probe-hosts|fetch|verify|audit|plan-check|epoch> ...'); process.exit(2);
  }
} catch (e) { console.error('harness malfunction:', e && e.stack || e); process.exit(3); }
