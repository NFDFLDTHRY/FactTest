// D21 execution-manifest gate (design/materialization/D21-INTENDED-EXECUTION-MANIFEST.md section 6).
// Usage: node tests/manifest/gate.mjs --manifest FILE --issues FILE [--root DIR] [--out FILE]
// PASS only when:
//   every_path_tiered          no tracked path is unassigned or ambiguous
//   coverage_complete          every required item of the prompt maps to live components
//   live_components_connected  every live component has an owner, a consumer or terminal role and a declared station
//   findings_classified        every automated finding item is covered by exactly the issue inventory (no finding
//                              unclassified, no issue covering nothing)
//   issues_well_formed         every issue has a class A..G, a task (D22..D26, owner or none), existing surfaces and,
//                              for stale-documentation issues, a marker still present in the file while the issue is open
//                              and absent once its status starts with REPAIRED (D21 = this delta)
//   historical_not_executable  no live tool reads a historical evidence package except where an issue records it
// Generic: names no component, file or issue itself.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const a = process.argv.slice(2); const o = { root: '.' };
for (let i = 0; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const M = JSON.parse(readFileSync(o.manifest, 'utf8')); const I = JSON.parse(readFileSync(o.issues, 'utf8'));
const checks = []; const add = (check, bad, detail) => checks.push({ check, status: bad.length ? 'FAIL' : 'PASS', detail: bad.length ? bad.slice(0, 25).join('; ') : detail });
const F = M.findings; const LIVE = new Set(['PRODUCTION', 'FACTORY', 'TEST']);
add('every_path_tiered', [...F.unassigned_paths, ...F.ambiguous_assignments], `${M.tracked_files} tracked files assigned to ${M.components.length} components`);
add('coverage_complete', F.required_coverage_missing, `${Object.values(M.required_coverage).reduce((n, m) => n + Object.keys(m).length, 0)} required items covered by live components`);
add('live_components_connected', M.components.filter(c => LIVE.has(c.tier) && (!(c.owner || []).length || !(c.consumers || []).length || !c.station)).map(c => c.id), `${M.components.filter(c => LIVE.has(c.tier)).length} live components with owner, consumer and station`);
// findings <-> issues
const items = []; for (const [k, v] of Object.entries(F)) for (const x of v) items.push({ finding: k, item: typeof x === 'string' ? x : x.file });
const coveredBy = it => I.issues.filter(is => (is.covers || []).some(c => c.finding === it.finding && (c.item === '*' || c.item === it.item || (c.item.endsWith('*') && it.item.startsWith(c.item.slice(0, -1))))));
const unclassified = items.filter(it => !coveredBy(it).length).map(it => `${it.finding}: ${it.item}`);
const idle = I.issues.filter(is => (is.covers || []).length && !items.some(it => coveredBy(it).includes(is))).map(is => is.id);
add('findings_classified', [...unclassified, ...idle.map(x => `issue covers nothing: ${x}`)], `${items.length} finding items covered by ${I.issues.filter(is => (is.covers || []).length).length} issues; ${I.issues.length} issues in the inventory`);
const bad = [];
for (const is of I.issues) {
  if (!/^[A-G]$/.test(is.class)) bad.push(`${is.id}: class ${is.class}`);
  if (!/^(D2[1-6]|owner|none)$/.test(is.task)) bad.push(`${is.id}: task ${is.task}`);
  for (const s of is.surfaces || []) if (!existsSync(join(o.root, s))) bad.push(`${is.id}: surface ${s} absent`);
  // an open issue's marker (the stale text) is still in the file; a REPAIRED issue's marker is gone (D23)
  const repaired = /^REPAIRED\b/.test(is.status || '');
  for (const m of is.markers || []) { const body = existsSync(join(o.root, m.file)) ? readFileSync(join(o.root, m.file), 'utf8') : ''; const present = new RegExp(m.pattern).test(body); if (!repaired && !present) bad.push(`${is.id}: marker not found in ${m.file}`); if (repaired && present) bad.push(`${is.id}: repaired, but its marker is still in ${m.file}`); }
  if (!is.finding_text || !is.repair) bad.push(`${is.id}: finding_text or repair missing`);
}
add('issues_well_formed', bad, `${I.issues.length} issues: ${Object.entries(I.issues.reduce((m, is) => (m[is.class] = (m[is.class] || 0) + 1, m), {})).sort().map(([k, v]) => `${k} ${v}`).join(', ')}`);
add('historical_not_executable', F.live_tools_reading_evidence_packages.filter(r => !coveredBy({ finding: 'live_tools_reading_evidence_packages', item: r.file }).length).map(r => r.file), `${F.live_tools_reading_evidence_packages.length} live tool(s) reading evidence packages, each recorded as an issue`);
const status = checks.every(c => c.status === 'PASS') ? 'PASS' : 'FAIL';
if (o.out) { mkdirSync(dirname(o.out), { recursive: true }); writeFileSync(o.out, JSON.stringify({ tool: 'tests/manifest/gate.mjs', status, checks, issues_by_class: I.issues.reduce((m, is) => (m[is.class] = (m[is.class] || 0) + 1, m), {}), issues_by_task: I.issues.reduce((m, is) => (m[is.task] = (m[is.task] || 0) + 1, m), {}) }, null, 1) + '\n'); }
for (const c of checks) console.log(`${c.status} ${c.check}: ${c.detail}`);
console.log(status);
process.exit(status === 'PASS' ? 0 : 1);
