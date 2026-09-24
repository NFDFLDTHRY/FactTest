// D15 clause extraction (design/materialization/D15-INTENDED-FOUNDATIONAL-SEMANTICS.md).
// First-party node ESM (curl + git via tests/reference/lib.mjs).  Input: a clause manifest
// (tests/reference/<epoch>-clauses.json) naming, for each clause, its authority, source document, locator (a fragment
// id derived with the same renderer rules as the D14 reopen, or an anchor text), window length, and the exact phrases
// its stated consequence depends on (must_contain).  For every clause the tool fetches the source AT ITS CURRENT TIP,
// locates the clause, extracts the window, and verifies every phrase is present.  A phrase that is not in the source
// means the manifest claims something the authority does not say: the clause is TEXT_MISSING and the run exits 1
// (return to ASCII).  Output: evidence/<epoch>/clauses/{records/<id>.json, summary.json}.
// Usage: node tests/reference/clauses.mjs <manifest.json> <graph.json> <out dir>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { sha, norm, tip, fetchBlob, fragmentStatus, locatorCandidates } from './lib.mjs';

const [manifestPath, graphPath, outDir] = process.argv.slice(2);
const M = JSON.parse(readFileSync(manifestPath, 'utf8'));
const g = JSON.parse(readFileSync(graphPath, 'utf8'));
const authById = new Map(g.nodes.filter(n => n.class === 'AUTHORITY').map(n => [n.id, n]));
for (const a of M.new_authorities || []) authById.set(a.id, { id: a.id, reproducibility_pin: a.source, new: true });
const stripTags = s => s.replace(/<[^>]+>/g, ' ');
const srcCache = new Map();
function source(src) {
  const key = `${src.repo}#${src.branch}:${src.path}`;
  if (srcCache.has(key)) return srcCache.get(key);
  const t = tip(src.repo, src.branch || 'main');
  let res;
  if (!t.commit) res = { ok: false, detail: 'tip unresolved: ' + (t.detail || t.status) };
  else { const b = fetchBlob({ repo: src.repo, path: src.path }, t.commit); res = b.ok ? { ok: true, commit: t.commit, ref: t.ref || t.default_ref, text: b.body.toString('utf8'), sha256: sha(b.body), bytes: b.body.length } : { ok: false, detail: 'fetch ' + b.code }; }
  srcCache.set(key, res); return res;
}
mkdirSync(join(outDir, 'records'), { recursive: true });
const records = [];
for (const c of M.clauses) {
  const a = authById.get(c.authority);
  const pin = c.source || (a && a.reproducibility_pin) || {};
  const src = { repo: pin.repo, branch: pin.branch || 'main', path: pin.path };
  const rec = { id: c.id, trace: c.trace, authority: c.authority, authority_known: !!a, source: { repo: src.repo, branch: src.branch, path: src.path }, locator: { ...c.locator }, window: c.window, consequence: c.consequence };
  const s = src.repo ? source(src) : { ok: false, detail: 'no source for authority ' + c.authority };
  if (!a) rec.status = 'AUTHORITY_UNKNOWN';
  else if (!s.ok) { rec.status = 'SOURCE_UNFETCHED'; rec.detail = s.detail; }
  else {
    Object.assign(rec.source, { commit: s.commit, sha256: s.sha256, bytes: s.bytes });
    const lines = s.text.split('\n'); let line = null, derivation = null;
    if (c.locator.fragment) { const fs = fragmentStatus(s.text, src.path, c.locator.fragment); if (fs.line) { line = fs.line; derivation = fs.status + ' (' + fs.kind + ')'; } }
    else if (c.locator.text) {
      let from = 0;
      if (c.locator.after) { const i = lines.findIndex(l => l.includes(c.locator.after)); from = i >= 0 ? i : lines.length; }
      const i = lines.findIndex((l, k) => k >= from && l.includes(c.locator.text));
      if (i >= 0) { line = i + 1; derivation = 'anchor text' + (c.locator.after ? ' after "' + c.locator.after.slice(0, 40) + '"' : ''); }
    }
    if (!line) rec.status = 'LOCATOR_NOT_FOUND';
    else {
      const win = lines.slice(line - 1, line - 1 + c.window).join('\n');
      const hay = norm(win), hayStripped = norm(stripTags(win));
      const enc = locatorCandidates(s.text, src.path, line);
      rec.locator = { ...rec.locator, line_start: line, line_end: Math.min(lines.length, line + c.window - 1), derivation,
        enclosing_section: enc.section ? `${enc.section.id} (line ${enc.section.line})` : (enc.note || null) };
      rec.excerpt = win.length > 2500 ? win.slice(0, 2500) + '\n[...]' : win;
      rec.excerpt_sha256 = sha(Buffer.from(win));
      rec.must_contain = Object.fromEntries((c.must_contain || []).map(p => [p, hay.includes(norm(p)) || hayStripped.includes(norm(stripTags(p)))]));
      rec.status = Object.values(rec.must_contain).every(Boolean) ? 'VERIFIED' : 'TEXT_MISSING';
    }
  }
  records.push(rec);
  writeFileSync(join(outDir, 'records', c.id + '.json'), JSON.stringify(rec, null, 1) + '\n');
  console.log(`${rec.status.padEnd(18)} ${c.id}  ${c.authority}${rec.locator.line_start ? ' @' + rec.locator.line_start : ''}${rec.must_contain ? ' ' + Object.entries(rec.must_contain).filter(([, v]) => !v).map(([k]) => 'MISSING "' + k.slice(0, 50) + '"').join(' ') : ''}`);
}
const sources = [...srcCache.entries()].map(([k, v]) => ({ key: k, commit: v.commit || null, sha256: v.sha256 || null, bytes: v.bytes || null, ok: v.ok }));
const count = {}; for (const r of records) count[r.status] = (count[r.status] || 0) + 1;
const summary = { tool: 'tests/reference/clauses.mjs', manifest: manifestPath, observed: new Date().toISOString(), clauses: records.length, status: count, traces: [...new Set(records.map(r => r.trace))], sources };
writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 1) + '\n');
console.log(JSON.stringify(count));
process.exit(records.every(r => r.status === 'VERIFIED') ? 0 : 1);
