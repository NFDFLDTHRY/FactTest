// Stage-directory audit (D18; design/materialization/D18-INTENDED-REPO-RECONCILIATION.md section 6).
// Usage: node tests/reconcile/stage-audit.mjs <workpiece root> --repo DIR --rev REV [--current NAME,...] --out FILE
// A stage directory (<root>/<W>-stage) is staging material outside the repository.  It is SUPERSEDED when every file
// in it (target/ and .git/ excluded) has a blob that is reachable from REV in the canonical repository; otherwise it is
// KEEP, listing the files whose content the canonical history does not hold.  CURRENT names are reported, not judged.
// Read-only: it removes nothing.
import { readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

const a = process.argv.slice(2); const o = {}; const root = a[0];
for (let i = 1; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const current = new Set((o.current || '').split(',').filter(Boolean));
const objs = new Set(spawnSync('git', ['-C', o.repo, 'rev-list', '--objects', o.rev], { encoding: 'utf8', maxBuffer: 1 << 28 }).stdout.split('\n').map(l => l.split(' ')[0]).filter(Boolean));
const walk = (d, rel = '') => readdirSync(join(d, rel)).sort().flatMap(n => { const r = rel ? `${rel}/${n}` : n; if (!rel && (n === 'target' || n === '.git')) return []; const st = statSync(join(d, r)); return st.isDirectory() ? walk(d, r) : st.isFile() ? [r] : []; });
const rows = [];
for (const s of readdirSync(root).filter(n => n.endsWith('-stage')).sort()) {
  const d = join(root, s); if (!statSync(d).isDirectory()) continue;
  if (current.has(s)) { rows.push({ stage: s, verdict: 'CURRENT' }); continue; }
  const files = walk(d);
  const h = spawnSync('git', ['hash-object', '--stdin-paths'], { cwd: d, input: files.join('\n') + '\n', encoding: 'utf8', maxBuffer: 1 << 28 }).stdout.trim().split('\n');
  const missing = files.filter((f, i) => !objs.has(h[i]));
  rows.push({ stage: s, files: files.length, not_in_history: missing, verdict: missing.length ? 'KEEP' : 'SUPERSEDED' });
}
const r = { tool: 'tests/reconcile/stage-audit.mjs', root, repo: o.repo, rev: o.rev, objects_reachable: objs.size, stages: rows };
mkdirSync(dirname(o.out), { recursive: true }); writeFileSync(o.out, JSON.stringify(r, null, 1) + '\n');
for (const x of rows) console.log(`${x.verdict.padEnd(10)} ${x.stage}${x.files !== undefined ? ` ${x.files} files, ${x.not_in_history.length} not in history` : ''}`);
