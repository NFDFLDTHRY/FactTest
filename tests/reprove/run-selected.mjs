// D19 runner for the selected re-proof groups (design/materialization/D19-INTENDED-REPROVE-REOBSERVE.md section 4).
// Usage: node tests/reprove/run-selected.mjs --selection FILE --runbook FILE --kind build|browser|repo|source|cite --out DIR
// Runs, for every group of the selection whose runbook kind is KIND, the group's commands (sh -c, cwd = repository,
// @OUT@ = DIR), then evaluates every selected fact of the group against its runbook records: each record file (relative
// to DIR) must exist and meet its expectations (eq | absent | includes on a dotted path).  Writes DIR/results/<group>.json
// with the command exits, per-fact verdicts (PASS / FAIL) and the sha256 of every record.  Exit 1 when a command fails or
// a fact's expectation fails - a failed re-proof is evidence of DIFFER, never retried here.  Generic: names no fact.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const a = process.argv.slice(2); const o = {};
for (let i = 0; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const S = JSON.parse(readFileSync(o.selection, 'utf8')); const RB = JSON.parse(readFileSync(o.runbook, 'utf8'));
const get = (obj, path) => { if (path in (obj || {})) return obj[path]; const i = path.indexOf('.'); return i < 0 ? (obj || {})[path] : get((obj || {})[path.slice(0, i)], path.slice(i + 1)); };
const check = (rec, e) => { const v = get(rec, e.path);
  if ('absent' in e) return { ...e, observed: v === undefined ? '(absent)' : v, ok: (v === undefined) === e.absent };
  if ('includes' in e) return { ...e, observed: Array.isArray(v) ? `${v.length} entries` : v, ok: Array.isArray(v) && v.includes(e.includes) };
  return { ...e, observed: v, ok: JSON.stringify(v) === JSON.stringify(e.eq) }; };
mkdirSync(join(o.out, 'results'), { recursive: true }); mkdirSync(join(o.out, 'logs'), { recursive: true });
let bad = 0;
for (const [name, grp] of Object.entries(S.groups).filter(([n]) => RB.groups[n].kind === o.kind).sort()) {
  const spec = RB.groups[name]; const res = { tool: 'tests/reprove/run-selected.mjs', group: name, kind: spec.kind, started: new Date().toISOString(), commands: [], facts: {}, obligations: grp.obligations };
  let log = '';
  for (const c of spec.commands) {
    const cmd = c.replace(/@OUT@/g, o.out); const t0 = Date.now();
    const r = spawnSync('sh', ['-c', cmd], { encoding: 'utf8', maxBuffer: 1 << 28 });
    log += `$ ${cmd}\n${r.stdout || ''}${r.stderr || ''}[exit ${r.status}]\n`;
    res.commands.push({ command: cmd, exit: r.status, seconds: Math.round((Date.now() - t0) / 1000) });
    console.log(`${r.status === 0 ? 'PASS' : 'FAIL'} ${name}: ${cmd.slice(0, 110)} (${Math.round((Date.now() - t0) / 1000)} s)`);
    if (r.status !== 0) { bad++; break; }
  }
  writeFileSync(join(o.out, 'logs', `${name}.log`), log);
  for (const f of grp.facts) {
    const rb = RB.facts[f]; const recs = [];
    for (const r of rb.records) {
      const p = join(o.out, r.file);
      if (!existsSync(p)) { recs.push({ file: r.file, missing: true, ok: false }); continue; }
      const body = readFileSync(p); let rec = null; try { rec = JSON.parse(body); } catch { }
      const checks = r.expect.map(e => check(rec, e));
      recs.push({ file: r.file, sha256: createHash('sha256').update(body).digest('hex'), checks, ok: checks.every(c => c.ok) });
    }
    const ok = recs.every(r => r.ok); if (!ok) bad++;
    res.facts[f] = { probe: rb.probe, verdict: ok ? 'PASS' : 'FAIL', records: recs };
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${f}`);
  }
  res.finished = new Date().toISOString(); res.status = res.commands.every(c => c.exit === 0) && Object.values(res.facts).every(x => x.verdict === 'PASS') ? 'PASS' : 'FAIL';
  writeFileSync(join(o.out, 'results', `${name}.json`), JSON.stringify(res, null, 1) + '\n');
}
process.exit(bad ? 1 : 0);
