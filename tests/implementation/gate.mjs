// D17 implementation-reality gate (design/materialization/D17-INTENDED-IMPLEMENTATION-REALITY.md section 7).
// Usage: node tests/implementation/gate.mjs --reality FILE --label-audit FILE --labels FILE --kernel DIR --graph FILE
//        [--out FILE]
// PASS only when:
//   behaviors_in_graph        every reviewed behaviour is an IMPLEMENTATION_BEHAVIOR node with its SOURCED_BY clauses
//   census_absences_explained every capability family the census found ABSENT has its exposure fact EXPLAINED by a behaviour
//   labels_resolved           every label-audit location and evidence resolved; every MISLABEL is an [ERR] fact
//   kernel_difference_scoped  the two kernel builds differ only in the excluded custom sections
// Generic: names no behaviour, family or finding.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const a = process.argv.slice(2); const o = {};
for (let i = 0; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const R = JSON.parse(readFileSync(o.reality, 'utf8'));
const LA = JSON.parse(readFileSync(o['label-audit'], 'utf8'));
const labels = JSON.parse(readFileSync(o.labels, 'utf8'));
const sections = JSON.parse(readFileSync(join(o.kernel, 'sections.json'), 'utf8'));
const g = JSON.parse(readFileSync(o.graph, 'utf8'));
const byId = new Map(g.nodes.map(n => [n.id, n]));
const out = (id, t) => g.edges.filter(e => e.from === id && e.type === t);
const checks = []; const add = (check, bad, detail) => checks.push({ check, status: bad.length ? 'FAIL' : 'PASS', detail: bad.length ? bad.slice(0, 30).join('; ') : detail });
add('behaviors_in_graph', R.behaviors.flatMap(b => { const n = byId.get(b.id); if (!n || n.class !== 'IMPLEMENTATION_BEHAVIOR') return [`missing ${b.id}`]; const s = out(b.id, 'SOURCED_BY').map(e => e.to); return b.sources.filter(c => !s.includes(c)).map(c => `${b.id} lacks ${c}`); }), `${R.behaviors.length} behaviours`);
const explained = new Set(g.edges.filter(e => e.type === 'EXPLAINS').map(e => e.to));
const absent = g.nodes.filter(n => n.class === 'CAPABILITY_FAMILY' && n.census && n.census.state === 'ABSENT');
const unexplained = absent.filter(f => !out(f.id, 'WITNESSED_BY').some(e => explained.has(e.to) && / exposure in /.test(byId.get(e.to).subject || ''))).map(f => f.id);
add('census_absences_explained', unexplained, `${absent.length} ABSENT families, each exposure fact explained by an implementation behaviour`);
const mis = LA.findings.filter(f => f.verdict === 'MISLABEL');
add('labels_resolved', [...(labels.unresolved ? [`${labels.unresolved} unresolved locations`] : []), ...mis.filter(f => !byId.has(`FACT-${f.id}`) || byId.get(`FACT-${f.id}`).status !== 'ERR').map(f => `no ERR fact for ${f.id}`)], `${labels.findings} findings, ${mis.length} MISLABEL recorded as [ERR] facts`);
add('kernel_difference_scoped', sections.identical_excluding_custom && sections.differing_sections.every(s => sections.excluded_custom_sections.includes(s.replace(/^custom:/, ''))) ? [] : [`differing ${JSON.stringify(sections.differing_sections)}`], `differs only in ${JSON.stringify(sections.differing_sections)}`);
const status = checks.every(c => c.status === 'PASS') ? 'PASS' : 'FAIL';
if (o.out) writeFileSync(o.out, JSON.stringify({ tool: 'tests/implementation/gate.mjs', status, checks }, null, 1) + '\n');
for (const c of checks) console.log(`${c.status} ${c.check}: ${c.detail}`);
console.log(status);
process.exit(status === 'PASS' ? 0 : 1);
