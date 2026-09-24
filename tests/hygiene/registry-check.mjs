// D13 registry check (design/materialization/D13-INTENDED-REPO-HYGIENE.md sections 2.1 and 3.1).
// Usage: node tests/hygiene/registry-check.mjs --base-rev REV [--out FILE]
// 1. every surface of every station spec in factory/registry/stations/ is literal (the rule of factory/src/paths.rs
//    validate_surface, restated);
// 2. for every station present at REV: the tracked files its MAY CHANGE covers are identical at REV and now (no
//    silent widening or narrowing of effective authority), and its MUST NOT CHANGE protects at least what it did.
// New stations (absent at REV) are listed; their authority was approved in ASCII.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
const a = process.argv.slice(2); const o = {}; for (let i = 0; i < a.length; i += 2) o[a[i].replace(/^--/, '')] = a[i + 1];
const git = (...args) => { const r = spawnSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 }); return r.status === 0 ? r.stdout : null; };
const covers = (s, p) => s === '*' || (s.endsWith('/') ? (s === '/' || p === s.slice(0, -1) || p.startsWith(s)) : p === s);
const literal = s => s === '*' || (s !== '' && !/[*?[\]{}\\]/.test(s) && !s.startsWith('/') && !s.replace(/\/$/, '').split('/').some(x => x === '' || x === '.' || x === '..'));
const files = git('ls-files').split('\n').filter(Boolean);
const dir = 'factory/registry/stations'; const checks = []; let ok = true;
const add = (check, pass, detail) => { checks.push({ check, status: pass ? 'PASS' : 'FAIL', detail }); if (!pass) ok = false; };
for (const f of readdirSync(dir).sort()) {
  const now = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const bad = ['may_read', 'may_change', 'must_not_change'].flatMap(k => (now[k] || []).filter(s => !literal(s)).map(s => `${k}:${s}`));
  add(`literal:${now.station_id}`, !bad.length, bad.join(' ') || 'all surfaces literal');
  const oldText = git('show', `${o['base-rev']}:${dir}/${f}`);
  if (!oldText) { add(`new_station:${now.station_id}`, true, `absent at ${o['base-rev']}; may_change ${JSON.stringify(now.may_change)}`); continue; }
  const old = JSON.parse(oldText);
  const eff = (surfs) => files.filter(p => surfs.some(s => covers(s, p)));
  const mcOld = eff(old.may_change), mcNow = eff(now.may_change);
  add(`effective_may_change_unchanged:${now.station_id}`, mcOld.join('\n') === mcNow.join('\n'), `${mcOld.length} tracked files at ${o['base-rev']} vs ${mcNow.length} now (v${old.version} -> v${now.version})`);
  const mnOld = eff(old.must_not_change), mnNow = new Set(eff(now.must_not_change));
  const lost = mnOld.filter(p => !mnNow.has(p));
  add(`must_not_change_not_weakened:${now.station_id}`, !lost.length, lost.length ? `no longer protected: ${lost.slice(0, 5).join(' ')}` : `${mnOld.length} -> ${mnNow.size} protected tracked files`);
}
const res = { tool: 'tests/hygiene/registry-check.mjs', base_rev: o['base-rev'], status: ok ? 'PASS' : 'FAIL', checks };
if (o.out) { mkdirSync(dirname(o.out), { recursive: true }); writeFileSync(o.out, JSON.stringify(res, null, 1) + '\n'); }
for (const c of checks) console.log(c.status, c.check, c.detail);
process.exit(ok ? 0 : 1);
