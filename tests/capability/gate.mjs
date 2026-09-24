// D16 capability-universe gate (design/materialization/D16-INTENDED-CAPABILITY-UNIVERSE.md section 7).
// Usage: node tests/capability/gate.mjs --universe FILE --matrix FILE --census DIR --graph FILE [--out FILE]
// PASS only when:
//   g_rows_preserved        every CAPABILITY-MATRIX.md row is one family of the universe, in order, none added or dropped
//                           (missing support never deletes a target: CON-FT-002)
//   graph_families_match    the merged graph holds exactly those CAPABILITY_FAMILY nodes
//   steps_complete          every family answers all seven authority steps with CLAUSE (resolving CLAUSE nodes), a
//                           NONE_DEFINED clause that verified an absence, or an explicit GAP reason: no silent step
//   census_complete         every family with a census block has a Factory census record (EXPOSED/ABSENT/UNDETERMINED)
//   witnesses_resolve       every witness is a COMPUTATIONAL_FACT in the graph
//   classification_allowed  the reviewed classification is one the evidence allows (tests/capability/universe.json
//                           classification_rules); a family with an ERR witness is ERR
// Generic: names no family.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const a = process.argv.slice(2); const o = {};
for (let i = 0; i < a.length; i++) { const k = a[i].replace(/^--/, ''); if (a[i + 1] === undefined || a[i + 1].startsWith('--')) o[k] = true; else o[k] = a[++i]; }
const U = JSON.parse(readFileSync(o.universe, 'utf8'));
const g = JSON.parse(readFileSync(o.graph, 'utf8'));
const byId = new Map(g.nodes.map(n => [n.id, n]));
const rows = readFileSync(o.matrix, 'utf8').split('\n').filter(l => l.startsWith('| ') && !l.startsWith('| Capability family') && !l.startsWith('|---')).map(l => l.split('|')[1].trim());
const checks = []; const add = (check, bad, detail) => checks.push({ check, status: bad.length ? 'FAIL' : 'PASS', detail: bad.length ? bad.slice(0, 30).join('; ') : detail });
const fams = U.families;
const famRows = fams.map(f => f.matrix_row);
add('g_rows_preserved', rows.length === famRows.length && rows.every((r, i) => r === famRows[i]) ? [] : [`matrix ${rows.length} rows vs universe ${famRows.length}`, ...rows.filter(r => !famRows.includes(r)).map(r => 'missing ' + r), ...famRows.filter(r => !rows.includes(r)).map(r => 'extra ' + r)], `${rows.length} matrix rows = ${fams.length} families, in order`);
const gf = g.nodes.filter(n => n.class === 'CAPABILITY_FAMILY');
add('graph_families_match', [...fams.filter(f => !byId.has(f.id) || byId.get(f.id).class !== 'CAPABILITY_FAMILY' || byId.get(f.id).matrix_row !== f.matrix_row).map(f => 'graph lacks ' + f.id), ...gf.filter(n => !fams.some(f => f.id === n.id)).map(n => 'graph has extra ' + n.id)], `${gf.length} CAPABILITY_FAMILY nodes`);
const stepBad = [], stepCount = { CLAUSE: 0, NONE_DEFINED: 0, GAP: 0 };
for (const f of fams) for (const s of U.steps) {
  const x = f.steps[s];
  if (Array.isArray(x)) { if (!x.length || x.some(c => !byId.has(c) || byId.get(c).class !== 'CLAUSE')) stepBad.push(`${f.id}.${s} unresolved clause`); else stepCount.CLAUSE++; }
  else if (x && x.none_defined) { const c = byId.get(x.none_defined); if (!c || c.class !== 'CLAUSE' || !(c.absent_in_document || []).length) stepBad.push(`${f.id}.${s} none_defined without a verified-absence clause`); else stepCount.NONE_DEFINED++; }
  else if (x && x.gap && String(x.gap).trim()) stepCount.GAP++;
  else stepBad.push(`${f.id}.${s} silent`);
}
add('steps_complete', stepBad, JSON.stringify(stepCount));
const census = {}; const censusBad = [];
for (const f of fams.filter(f => f.census)) {
  const p = join(o.census, 'records', f.id + '.json');
  if (!existsSync(p)) { censusBad.push('no record ' + f.id); continue; }
  const r = JSON.parse(readFileSync(p, 'utf8')); census[f.id] = r.state;
  if (!['EXPOSED', 'ABSENT', 'UNDETERMINED'].includes(r.state)) censusBad.push(`${f.id} state ${r.state}`);
}
add('census_complete', censusBad, `${Object.keys(census).length} records`);
const witBad = fams.flatMap(f => f.witnesses.filter(w => !byId.has(w) || byId.get(w).class !== 'COMPUTATIONAL_FACT').map(w => `${f.id} -> ${w}`));
add('witnesses_resolve', witBad, `${fams.reduce((n, f) => n + f.witnesses.length, 0)} witness references`);
const VOC = ['RUN', 'OBS', 'GAP', 'ERR', 'UNK'];
const allowedOf = f => {
  const st = f.witnesses.map(w => byId.get(w)).filter(Boolean).map(n => n.status);
  const hasEv = w => g.edges.some(e => e.type === 'EVIDENCED_BY' && e.from === w);
  const runWitness = f.witnesses.some(w => byId.get(w) && byId.get(w).status === 'RUN' && hasEv(w));
  const c = census[f.id]; const allGap = U.steps.every(s => f.steps[s] && f.steps[s].gap);
  const allowed = new Set();
  if (st.includes('ERR')) return new Set(['ERR']);
  if (runWitness) allowed.add('RUN');
  if (c === 'ABSENT' || st.includes('GAP') || allGap) allowed.add('GAP');
  if (c === 'EXPOSED' || st.includes('OBS') || st.includes('RUN')) allowed.add('OBS');
  if (st.includes('UNK') || c === 'UNDETERMINED') allowed.add('UNK');
  return allowed;
};
const clsBad = []; const byClass = {};
for (const f of fams) {
  const al = allowedOf(f);
  if (!VOC.includes(f.classification) || !al.has(f.classification)) clsBad.push(`${f.id} ${f.classification} not in {${[...al].join(',')}} (census ${census[f.id] || 'none'})`);
  (byClass[f.classification] = byClass[f.classification] || []).push(f.id);
}
add('classification_allowed', clsBad, Object.entries(byClass).map(([k, v]) => `${k} ${v.length}`).join(', '));
const firstGap = Object.fromEntries(fams.map(f => [f.id, U.steps.find(s => !(Array.isArray(f.steps[s]) || (f.steps[s] && f.steps[s].none_defined))) || null]));
const status = checks.every(c => c.status === 'PASS') ? 'PASS' : 'FAIL';
const res = { tool: 'tests/capability/gate.mjs', status, checks, classification: Object.fromEntries(Object.entries(byClass).map(([k, v]) => [k, v])), census, step_status_counts: stepCount, first_gap_step: firstGap };
if (o.out) writeFileSync(o.out, JSON.stringify(res, null, 1) + '\n');
for (const c of checks) console.log(`${c.status} ${c.check}: ${c.detail}`);
console.log(status);
process.exit(status === 'PASS' ? 0 : 1);
