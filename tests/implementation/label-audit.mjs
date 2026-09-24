// D17 label audit verifier (design/materialization/D17-INTENDED-IMPLEMENTATION-REALITY.md section 3).
// Usage: node tests/implementation/label-audit.mjs <label-audit.json> --graph FILE --clauses DIR [--root DIR] --out FILE
// Every finding names a pattern (implementation truth stated as standard, software GPU as hardware, flag as admission,
// one engine as universal, headless as installed, implementation pinned to a version it did not run), a verdict (OK or
// MISLABEL) and a location {file, text}.  The tool proves each location: the exact text occurs in that file of the
// working tree (line numbers and file sha256 recorded), and each cited evidence clause exists (graph CLAUSE node or a
// VERIFIED record in DIR).  It judges nothing: verdicts come from the reviewed audit file.  Exit 1 if any location or
// evidence does not resolve, or a MISLABEL lacks a correction.  Generic: names no finding itself.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const a = process.argv.slice(2); const o = { root: '.' }; const auditPath = a[0];
for (let i = 1; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const audit = JSON.parse(readFileSync(auditPath, 'utf8'));
const g = JSON.parse(readFileSync(o.graph, 'utf8'));
const graphClauses = new Set(g.nodes.filter(n => n.class === 'CLAUSE').map(n => n.id));
const recordOk = id => { const p = join(o.clauses, 'records', id + '.json'); return existsSync(p) && JSON.parse(readFileSync(p, 'utf8')).status === 'VERIFIED'; };
const results = []; let bad = 0;
for (const f of audit.findings) {
  const path = join(o.root, f.location.file);
  const r = { id: f.id, pattern: f.pattern, verdict: f.verdict, file: f.location.file, text: f.location.text };
  if (!audit.patterns.includes(f.pattern)) r.problem = 'unknown pattern';
  else if (!['OK', 'MISLABEL'].includes(f.verdict)) r.problem = 'unknown verdict';
  else if (!existsSync(path)) r.problem = 'file missing';
  else {
    const body = readFileSync(path, 'utf8'); const lines = body.split('\n');
    r.file_sha256 = createHash('sha256').update(body).digest('hex');
    r.lines = lines.map((l, i) => l.includes(f.location.text) ? i + 1 : 0).filter(Boolean);
    if (!r.lines.length) r.problem = 'text not found';
  }
  r.evidence = Object.fromEntries(f.evidence.map(c => [c, graphClauses.has(c) ? 'graph CLAUSE' : recordOk(c) ? 'VERIFIED record' : 'UNRESOLVED']));
  if (!r.problem && Object.values(r.evidence).includes('UNRESOLVED')) r.problem = 'evidence unresolved';
  if (!r.problem && f.verdict === 'MISLABEL' && !f.correction) r.problem = 'MISLABEL without correction';
  if (r.problem) bad++;
  results.push(r);
  console.log(`${r.problem ? 'FAIL ' + r.problem : 'OK  '} ${f.id} ${f.pattern} ${f.verdict} ${f.location.file}:${(r.lines || []).join(',')}`);
}
const count = {}; for (const r of results) { const k = `${r.pattern}/${r.verdict}`; count[k] = (count[k] || 0) + 1; }
const out = { tool: 'tests/implementation/label-audit.mjs', audit: auditPath, findings: results.length, mislabels: results.filter(r => r.verdict === 'MISLABEL').length, by_pattern_verdict: count, unresolved: bad, results };
mkdirSync(dirname(o.out), { recursive: true });
writeFileSync(o.out, JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify({ findings: out.findings, mislabels: out.mislabels, unresolved: bad }));
process.exit(bad ? 1 : 0);
