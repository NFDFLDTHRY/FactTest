// Reconciliation surface check (D18; design/materialization/D18-INTENDED-REPO-RECONCILIATION.md section 4).
// Usage: node tests/reconcile/surfaces.mjs <surfaces.json> [--root DIR] --out FILE
// Two physical checks on the working tree, each keyed to a reconciliation id:
//   annotated  every listed law document differs from the base commit by insertions only (git diff --numstat: 0 deleted
//              lines) and every inserted hunk begins (first non-blank added line) with the marker ('<delta> ANNOTATION')
//   surfaces   each file contains every must_contain text and no must_not_contain text (the stale current wording)
// Generic: the texts come from the surfaces file.  Exit 1 on any failure.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

const a = process.argv.slice(2); const o = { root: '.' }; const file = a[0];
for (let i = 1; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const S = JSON.parse(readFileSync(file, 'utf8'));
const git = args => spawnSync('git', ['-C', o.root, ...args], { encoding: 'utf8', maxBuffer: 1 << 26 });
const checks = []; const add = (check, bad, detail) => checks.push({ check, status: bad.length ? 'FAIL' : 'PASS', detail: bad.length ? bad.join('; ') : detail });
for (const f of S.annotated.files) {
  const ns = git(['diff', '--numstat', S.base, '--', f]).stdout.trim().split('\t');
  const added = Number(ns[0] || 0), deleted = Number(ns[1] || 0);
  const hunks = git(['diff', '-U0', S.base, '--', f]).stdout.split('\n@@').slice(1).map(h => h.split('\n').slice(1).filter(l => l.startsWith('+') && !l.startsWith('+++')).map(l => l.slice(1)));
  const bad = [];
  if (deleted) bad.push(`${deleted} deleted/modified lines`);
  if (!added) bad.push('no insertion');
  hunks.forEach((h, i) => { const first = h.find(l => l.trim()); if (first !== undefined && !first.startsWith(S.annotated.marker)) bad.push(`hunk ${i + 1} begins '${first.slice(0, 60)}'`); });
  add(`annotated:${f}`, bad, `+${added} -0 in ${hunks.length} hunk(s), each beginning '${S.annotated.marker}'`);
}
for (const s of S.surfaces) {
  const body = readFileSync(join(o.root, s.file), 'utf8'); const bad = [];
  for (const t of s.must_contain || []) if (!body.includes(t)) bad.push(`missing: ${t.slice(0, 80)}`);
  for (const t of s.must_not_contain || []) if (body.includes(t)) bad.push(`stale text present: ${t.slice(0, 80)}`);
  add(`${s.reconciliation}:${s.file}`, bad, `${(s.must_contain || []).length} present, ${(s.must_not_contain || []).length} absent`);
}
const status = checks.every(c => c.status === 'PASS') ? 'PASS' : 'FAIL';
mkdirSync(dirname(o.out), { recursive: true });
writeFileSync(o.out, JSON.stringify({ tool: 'tests/reconcile/surfaces.mjs', base: S.base, status, checks }, null, 1) + '\n');
for (const c of checks) if (c.status !== 'PASS') console.log(`FAIL ${c.check}: ${c.detail}`);
console.log(`${status} ${checks.length} surface checks`);
process.exit(status === 'PASS' ? 0 : 1);
