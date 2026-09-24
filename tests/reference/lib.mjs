// Shared source-reading helpers for the technical reference review (D14 reopen, D15 clause extraction, later passes).
// First-party node ESM; curl + git only.  Extracted unchanged from tests/reference/reopen.mjs (D14) so every pass uses
// the SAME fragment-derivation rules: explicit ids, rst labels, asciidoc anchors, Bikeshed dfn/IDL/heading ids
// (including dfn-for / dfn-type on an enclosing block), WHATWG data-x ids, mdbook headings, asciidoctor sections.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

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
function fetchBlob(pin, commit, repoRoot = '.') {
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
    if (/\.adoc$/.test(path)) for (const x of l.matchAll(/\[\[([A-Za-z0-9_.:-]+)\]\]/g)) put(explicit, x[1], n, 'asciidoc anchor');   // D15: [[x]] is an anchor only in asciidoc (ECMA-262 slots and bibliography refs are not)
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

// D17: the identity of a clause source.  A branch tip (D15/D16 form, unchanged), a pinned commit (the implementation
// version FactTest actually ran), or an installed local file (a package version on this host).
function sourceKey(src) {
  if (src.local) return `local:${src.local}`;
  if (src.commit) return `${src.repo}@${src.commit}:${src.path}`;
  return `${src.repo}#${src.branch}:${src.path}`;
}

export { sha, norm, curlHead, curlGet, tip, fetchBlob, ids, fragmentStatus, locatorCandidates, declaredStatus, lineRange, sourceKey, SPEC_FORMAT };
