// Station authority census (D27).  Which registered stations may change a given path, and which forbid it?
// Usage: node tests/closure/station-authority-census.mjs --paths a,b,c [--rev REV] [--root DIR] --out FILE
// Restates the literal cover rule of factory/src/paths.rs ('*', 'dir/' or an exact file) over the station specs of
// factory/registry/stations/ - read from the tree at REV (git show) or from the working tree - and records, per path,
// the stations whose MAY CHANGE covers it and whose MUST NOT CHANGE does not, and the stations that forbid it.  A path
// with no authorizing station is a Factory machinery [GAP] (FACTORY-LAW.md: forge, test, register before use).
// Generic: names no station; exit 0 whenever the census ran (the record is the evidence).
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

const a = process.argv.slice(2); const o = { root: '.' };
for (let i = 0; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const covers = (s, p) => s === '*' || (s.endsWith('/') ? p.startsWith(s) : p === s);
const dir = 'factory/registry/stations';
let specs;
if (o.rev) {
  const ls = spawnSync('git', ['-C', o.root, 'ls-tree', '--name-only', o.rev, dir + '/'], { encoding: 'utf8' }).stdout.trim().split('\n').filter(f => f.endsWith('.json'));
  specs = ls.map(f => JSON.parse(spawnSync('git', ['-C', o.root, 'show', `${o.rev}:${f}`], { encoding: 'utf8' }).stdout));
} else specs = readdirSync(join(o.root, dir)).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(join(o.root, dir, f), 'utf8')));
const paths = o.paths.split(',').filter(Boolean);
const census = {};
for (const p of paths) {
  const may = specs.filter(s => s.may_change.some(m => covers(m, p)) && !s.must_not_change.some(m => covers(m, p))).map(s => s.station_id).sort();
  const forbid = specs.filter(s => s.must_not_change.some(m => covers(m, p))).map(s => s.station_id).sort();
  census[p] = { may_change_by: may, forbidden_by: forbid, authorized: may.length > 0 };
}
const rec = { tool: 'tests/closure/station-authority-census.mjs', tree: o.rev || 'working tree', stations: specs.map(s => s.station_id).sort(), paths: census, unauthorized_paths: paths.filter(p => !census[p].authorized) };
mkdirSync(dirname(o.out), { recursive: true }); writeFileSync(o.out, JSON.stringify(rec, null, 1) + '\n');
for (const p of paths) console.log(`${census[p].authorized ? 'AUTHORIZED' : 'NO STATION'} ${p}: may ${JSON.stringify(census[p].may_change_by)} forbid ${JSON.stringify(census[p].forbidden_by)}`);
