// Reconciliation epoch builder (D18 onward; design/materialization/D18-INTENDED-REPO-RECONCILIATION.md section 5).
// Joins a clause epoch fragment (tests/reference/build-clauses.mjs) with the reviewed reconciliation register
// (tests/reconcile/<epoch>-reconciliation.json) into one environment-map epoch that changes the CURRENT model without
// editing any earlier node:
//   RECONCILIATION  one node per register item: traversal (AUTHORITY CHANGED -> CONSTRAINT -> FACT -> IMPLEMENTATION
//                   CONTRACT -> ENVIRONMENT -> OLD PROBE SUFFICIENT? -> OLD EVIDENCE APPLICABLE?), outcome, surfaces
//   RECONCILES      RECONCILIATION -> every node the item re-examined
//   SUPERSEDES      successor -> superseded (same class; the edge names its reconciliation); the successor then carries
//                   every inheritable edge of the superseded node (register "inherits"), mapped through supersession
//   LEDGERED_IN     PROPOSED CONSTRAINT -> the project-law ledger authority {locator, reconciliation}
//   new AUTHORITY / COMPUTATIONAL_FACT / EVIDENCE nodes and the register's added edges
// Pins of new authorities are derived, never typed: from the superseded authority's pin, from a clause's extraction
// source, or from the sha256 of a file under --root.  Generic: names no item, node or document itself.  Usage:
//   node tests/reconcile/build-reconciliation.mjs [--clause-epoch FILE] --register FILE --graph FILE --root DIR
//        --epoch D18 --delta ID --commit STR [--declare] --out FILE
// D18R: the clause fragment, new authorities and ledger are optional (a repair register may carry none); supersession
// chains are followed through the SUPERSEDES edges already in the graph, so a later successor inherits every edge its
// predecessors carried.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const a = process.argv.slice(2); const o = { root: '.' };
for (let i = 0; i < a.length; i++) { const k = a[i].replace(/^--/, ''); if (a[i + 1] === undefined || a[i + 1].startsWith('--')) o[k] = true; else o[k] = a[++i]; }
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex');
const E = o.epoch;
const base = o['clause-epoch'] ? JSON.parse(readFileSync(o['clause-epoch'], 'utf8')) : { nodes: [], edges: [] };
const R = JSON.parse(readFileSync(o.register, 'utf8'));
const g = JSON.parse(readFileSync(o.graph, 'utf8'));
const nodes = [...base.nodes]; const edges = [...base.edges];
const N = n => { nodes.push(n); return n.id; };
const known = new Map([...g.nodes, ...base.nodes].map(n => [n.id, n]));
const node = id => { const n = known.get(id); if (!n) throw new Error(`unknown node ${id}`); return n; };
const owner = `${o.register} (reviewed; ${E})`;

for (const na of R.new_authorities || []) {
  const f = na.pin_from; let pin;
  if (f.authority) pin = { ...node(f.authority).reproducibility_pin, locator: na.pin_locator };
  else if (f.clause) { const c = node(f.clause); const s = JSON.parse(readFileSync(join(o.root, 'evidence', c.epoch, 'clauses', 'summary.json'), 'utf8'));
    pin = { repo: c.source.repo, commit: c.source.commit, path: c.source.path, sha256: c.source.sha256, observed: s.observed.slice(0, 10), locator: na.pin_locator }; }
  else if (f.file) pin = { repo: f.repo, branch: f.branch, commit: f.commit, path: f.file, sha256: sha(join(o.root, f.file)), observed: f.observed, locator: na.pin_locator };
  else throw new Error(`${na.id}: pin_from needs authority, clause or file`);
  N({ id: na.id, class: 'AUTHORITY', authority_id: na.id, title: na.title, exact_url: na.exact_url, exact_fragment: na.exact_fragment, authority_owner: na.authority_owner, authority_class: na.authority_class,
    maturity: na.maturity, observed_date: na.observed_date, reopen_status: na.reopen_status, reproducibility_pin: pin, extracted_consequence: na.extracted_consequence, fragment_status: na.fragment_status, owner: na.authority_owner });
  known.set(na.id, nodes[nodes.length - 1]);
}
for (const f of R.new_facts || []) {
  N({ id: f.id, class: 'COMPUTATIONAL_FACT', fact_id: f.id, subject: f.subject, predicate: f.predicate, required_environment: f.required_environment, constraint_refs: f.constraint_refs, status: f.status, note: f.note, source_ref: f.source_ref, owner: `${E} reconciliation (derived from the evidence named by its edges)` });
  known.set(f.id, nodes[nodes.length - 1]);
}
for (const ev of R.new_evidence || []) {
  const p = join(o.root, ev.path); const rec = JSON.parse(readFileSync(p, 'utf8'));
  N({ id: ev.id, class: 'EVIDENCE', evidence_id: ev.id, probe_ref: ev.probe_ref, environment_ref: ev.environment_ref,
    artifact_identity: { path: ev.path, sha256: sha(p), locator: ev.locator, identity_source: 'sha256 of the committed record' },
    observed_result: `${rec.verdict}: ${rec.reason}`, epoch: E, status: rec.verdict === 'PASS' ? 'RUN' : rec.verdict, evidence_class: 'PHYSICAL_HOST', owner: `Factory receipt of ${o.delta}` });
  known.set(ev.id, nodes[nodes.length - 1]);
}
for (const it of R.items) {
  N({ id: it.id, class: 'RECONCILIATION', reconciliation_id: it.id, subject: it.subject, traversal: it.traversal, outcome: it.outcome, surfaces: it.surfaces, note: it.note, new_probe_obligation: it.new_probe_obligation, owner });
  for (const s of it.reconciles) { node(s); edges.push({ type: 'RECONCILES', from: it.id, to: s }); }
}
const sup = new Map([...g.edges.filter(e => e.type === 'SUPERSEDES').map(e => [e.to, e.from]), ...R.supersessions.map(s => [s.old, s.new])]);
const cur = x => { let y = x; const seen = new Set(); while (sup.has(y) && !seen.has(y)) { seen.add(y); y = sup.get(y); } return y; };
for (const s of R.supersessions) { if (node(s.old).class !== node(s.new).class) throw new Error(`${s.new} -> ${s.old}: classes differ`); edges.push({ type: 'SUPERSEDES', from: s.new, to: s.old, reconciliation: s.reconciliation }); }
for (const e of R.add_edges || []) { node(e.from); node(e.to); edges.push(e); }
// inheritance: every inheritable edge touching a superseded node is carried by its current successor
const keys = new Set([...g.edges, ...edges].map(e => JSON.stringify(e)));
const pool = [...g.edges, ...edges].filter(e => e.type !== 'SUPERSEDES' && e.type !== 'RECONCILES');
let inherited = 0;
for (const s of R.supersessions) {
  const rule = R.inherits[node(s.old).class] || { out: [], in: [] };
  for (const x of pool) {
    if (!((x.from === s.old && rule.out.includes(x.type)) || (x.to === s.old && rule.in.includes(x.type)))) continue;
    const want = { ...x, from: cur(x.from), to: cur(x.to) }; const k = JSON.stringify(want);
    if (!keys.has(k)) { keys.add(k); edges.push(want); inherited++; }
  }
}
const L = R.ledger || { constraints: [] };
for (const c of L.constraints) { if (node(c).ledger_status !== 'PROPOSED') throw new Error(`${c} is not PROPOSED`); edges.push({ type: 'LEDGERED_IN', from: c, to: L.authority, locator: `${L.file} ${L.marker}: ${c}`, reconciliation: L.reconciliation }); }
const by = {}; for (const it of R.items) by[it.outcome] = (by[it.outcome] || 0) + 1;
const classes = [...new Set([...g.nodes, ...nodes].map(n => n.class))].filter(c => c !== 'RECONCILIATION').sort();
const epoch = { schema: 'facttest-environment-map-epoch/1', epoch: E, delta: o.delta, commit: o.commit,
  summary: `${R.items.length} reconciliations (${Object.entries(by).map(([k, n]) => `${k} ${n}`).join(', ')}); ${R.supersessions.length} supersessions (${inherited} inherited edges); ${L.constraints.length} constraints ledgered; ${base.nodes.filter(n => n.class === 'CLAUSE').length} clauses`,
  node_classes: o.declare ? { RECONCILIATION: { owner_rule: 'the reviewed reconciliation register (tests/reconcile/<epoch>-reconciliation.json)', required: ['reconciliation_id', 'subject', 'traversal', 'outcome', 'note'],
    outcome_vocabulary: Object.keys(R.outcomes), traversal_steps: R.traversal_steps } } : undefined,
  edge_semantics: o.declare ? {
    RECONCILES: { from: ['RECONCILIATION'], to: classes, meaning: 'the reconciliation re-examined that node against the later epochs (traversal and outcome on the RECONCILIATION node)' },
    SUPERSEDES: { from: ['AUTHORITY', 'COMPUTATIONAL_FACT'], to: ['AUTHORITY', 'COMPUTATIONAL_FACT'], requires: ['reconciliation'], inherits: R.inherits,
      meaning: 'the successor is the CURRENT statement; the superseded node stays as history (never edited); same class; the successor carries every inheritable edge of the superseded node, mapped through supersession' },
    LEDGERED_IN: { from: ['CONSTRAINT'], to: ['AUTHORITY'], requires: ['locator', 'reconciliation'], meaning: 'the PROPOSED constraint is recorded in that project-law ledger (current status LEDGER; the node keeps PROPOSED as history)' } } : undefined,
  nodes, edges };
writeFileSync(o.out, JSON.stringify(epoch, null, 1) + '\n');
console.log(`${E}: ${nodes.length} nodes, ${edges.length} edges -> ${o.out}; ${JSON.stringify(by)}; supersessions ${R.supersessions.length}; inherited ${inherited}; ledgered ${L.constraints.length}`);
