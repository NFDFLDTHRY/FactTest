// Clause epoch builder (D15 onward; design/materialization/D15-INTENDED-FOUNDATIONAL-SEMANTICS.md section 4).
// Turns clause evidence (tests/reference/clauses.mjs output under evidence/<epoch>/clauses/) plus the clause manifest
// into an environment-map epoch:
//   CLAUSE (declared by the first epoch that uses it)  exact clause: authority, source {repo, commit, path, sha256},
//        locator {line_start, line_end, derivation, enclosing_section}, excerpt sha256, consequence, trace
//   CLAUSE_OF -> AUTHORITY, GROUNDS -> CONSTRAINT | COMPUTATIONAL_FACT, LEADS_TO -> CLAUSE, EXTRACTED_IN -> EVIDENCE
//   new AUTHORITY nodes (pins = the commit/sha the extraction read), new CONSTRAINT and COMPUTATIONAL_FACT nodes
// Generic: never names a clause, authority or trace itself.  Usage:
//   node tests/reference/build-clauses.mjs --clauses DIR --manifest FILE --epoch D15 --delta ID --commit SHA
//        [--declare] [--env-from FILE] [--harness-in GRAPH] --out FILE
// --harness-in (D16): when GRAPH already holds the extraction PROBE and IMPLEMENTATION (introduced by an earlier epoch),
// they are referenced, not re-created (epochs are add-only); without it the output is unchanged.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const a = process.argv.slice(2); const o = {};
for (let i = 0; i < a.length; i++) { const k = a[i].replace(/^--/, ''); if (a[i + 1] === undefined || a[i + 1].startsWith('--')) o[k] = true; else o[k] = a[++i]; }
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex');
const M = JSON.parse(readFileSync(o.manifest, 'utf8'));
const summary = JSON.parse(readFileSync(join(o.clauses, 'summary.json'), 'utf8'));
const E = o.epoch; const nodes = []; const edges = [];
const N = n => { nodes.push(n); return n.id; };
const edge = (type, from, to, extra = {}) => edges.push({ type, from, to, ...extra });
const recs = readdirSync(join(o.clauses, 'records')).sort().map(f => ({ path: join(o.clauses, 'records', f), r: JSON.parse(readFileSync(join(o.clauses, 'records', f), 'utf8')) }));
const bad = recs.filter(x => x.r.status !== 'VERIFIED');
if (bad.length) { console.error('refusing to build: unverified clauses ' + bad.map(x => x.r.id).join(' ')); process.exit(1); }

const ENV = `ENV-${E}-HOST`, PROBE = 'PROBE-CLAUSE-EXTRACT', IMPL = 'IMPL-REFERENCE-CLAUSES';
const existing = new Set(o['harness-in'] ? JSON.parse(readFileSync(o['harness-in'], 'utf8')).nodes.map(n => n.id) : []);
const reuse = existing.has(PROBE) && existing.has(IMPL);
N({ id: ENV, class: 'ENVIRONMENT', environment_id: ENV, environment_class: 'PHYSICAL_HOST', toolchain: null, target: 'authority sources (no build)', host_runtime: 'node + curl + git through the session proxy (sources only)',
  versions: null, flags: { channels: 'raw.githubusercontent.com bytes at each source tip; git ls-remote tips' }, build_profile: null, origin_security: null, permissions_policy: null,
  implementation_hardware_class: 'none (source extraction)', dependency_graph_identity: null, other_state: { network_egress: 'published renderings denied (unchanged since D14)' },
  identity_completeness: { missing: ['published renderings (policy)'], present: ['source commit + sha256 per clause'] }, owner: `evidence/${E}/clauses/summary.json`, note: `${E} clause extraction; observed ${summary.observed}` });
if (!reuse) N({ id: IMPL, class: 'IMPLEMENTATION', impl_id: IMPL, repo_path: 'tests/reference/{clauses.mjs,lib.mjs,build-clauses.mjs}', commit: `introduced by ${o.delta} (integration commit in LEDGER AFTER)`, kind: 'harness',
  note: 'exact-clause extraction at each source tip with phrase verification', owner: 'FactTest repository path tests/reference/' });
if (!reuse) N({ id: PROBE, class: 'PROBE', probe_id: PROBE, proves_fact: [], command_or_operation: `node tests/reference/clauses.mjs tests/reference/<epoch>-clauses.json design/environment-map/graph.json evidence/<epoch>/clauses`,
  expected_observations: ['every manifest clause VERIFIED: located at the tip and every must_contain phrase present'], failure_meaning: ['a clause the authority does not (or no longer) say: the dependent constraint returns to ASCII'], implemented_by: IMPL, owner: IMPL });
if (!reuse) edge('IMPLEMENTED_BY', PROBE, IMPL);
const evSum = N({ id: `EV-${E}-CLAUSES-SUMMARY`, class: 'EVIDENCE', evidence_id: `EV-${E}-CLAUSES-SUMMARY`, probe_ref: PROBE, environment_ref: ENV,
  artifact_identity: { path: join(o.clauses, 'summary.json'), sha256: sha(join(o.clauses, 'summary.json')), locator: 'status, sources', identity_source: 'sha256 of the committed file' },
  observed_result: `${summary.clauses} clauses ${JSON.stringify(summary.status)} over ${summary.sources.length} sources`, epoch: E, status: 'RUN', evidence_class: 'PHYSICAL_HOST', owner: `Factory receipt of ${o.delta}` });
edge('EVIDENCED_BY', PROBE, evSum);
const FV = `FACT-${E}-CLAUSES-VERIFIED`;
N({ id: FV, class: 'COMPUTATIONAL_FACT', fact_id: FV, subject: `${E} clause manifest`, predicate: `every one of ${summary.clauses} manifest clauses is present at its source tip with each quoted phrase (the consequences stated on the CLAUSE nodes rest on text the authorities contain)`,
  required_environment: [], constraint_refs: [], status: 'RUN', note: 'source level only: published renderings unverified (network policy)', source_ref: join(o.clauses, 'summary.json'), owner: `${E} (derived from the evidence named by its edges)` });
if (!reuse) nodes.find(n => n.id === PROBE).proves_fact.push(FV);
edge('PROBED_BY', FV, PROBE); edge('EVIDENCED_BY', FV, evSum); edge('REQUIRES', FV, ENV);
edge('STALE_IF', FV, ENV, { condition: { dimension: 'authority.source_commit', relation: 'any clause source tip moves with the clause window changed' } });

// new authorities: pin = the source the extraction actually read
const srcOf = new Map(summary.sources.map(s => [s.key, s]));
for (const na of M.new_authorities || []) {
  const s = srcOf.get(`${na.source.repo}#${na.source.branch}:${na.source.path}`);
  N({ id: na.id, class: 'AUTHORITY', authority_id: na.id, title: na.title, exact_url: na.exact_url, exact_fragment: na.exact_fragment, authority_owner: na.authority_owner, authority_class: na.authority_class,
    maturity: na.maturity, observed_date: 'never (published rendering not opened: host DENIED)', reopen_status: 'DENIED',
    reproducibility_pin: { repo: na.source.repo, branch: na.source.branch, commit: s ? s.commit : null, path: na.source.path, sha256: s ? s.sha256 : null, observed: summary.observed.slice(0, 10), locator: `clauses of ${E} (see CLAUSE nodes)` },
    extracted_consequence: na.extracted_consequence, fragment_status: na.exact_fragment ? 'CLAUSE-LEVEL (fragments live on the CLAUSE nodes)' : 'NOT_CITED (document level; clauses carry locators)', owner: na.authority_owner });
}
for (const { path, r } of recs) {
  const c = M.clauses.find(x => x.id === r.id);
  const ev = N({ id: `EV-${E}-${r.id}`, class: 'EVIDENCE', evidence_id: `EV-${E}-${r.id}`, probe_ref: PROBE, environment_ref: ENV,
    artifact_identity: { path, sha256: sha(path), locator: 'excerpt', identity_source: 'sha256 of the committed record' },
    observed_result: `VERIFIED at ${r.source.repo.replace('https://github.com/', '')}@${String(r.source.commit).slice(0, 10)} ${r.source.path}:${r.locator.line_start}-${r.locator.line_end}`, epoch: E, status: 'RUN', evidence_class: 'PHYSICAL_HOST', owner: `Factory receipt of ${o.delta}` });
  N({ id: r.id, class: 'CLAUSE', clause_id: r.id, authority_ref: r.authority, trace: r.trace, epoch: E,
    source: { repo: r.source.repo, commit: r.source.commit, path: r.source.path, sha256: r.source.sha256 },
    locator: { requested: c.locator, line_start: r.locator.line_start, line_end: r.locator.line_end, derivation: r.locator.derivation, enclosing_section: r.locator.enclosing_section },
    excerpt_sha256: r.excerpt_sha256, quoted: Object.keys(r.must_contain), ...(r.absent_in_document ? { absent_in_document: Object.keys(r.absent_in_document) } : {}),
    consequence: r.consequence, owner: `${o.manifest} (clause), ${path} (extraction)` });
  edge('CLAUSE_OF', r.id, r.authority); edge('EXTRACTED_IN', r.id, ev);
  for (const t of c.grounds || []) edge('GROUNDS', r.id, t);
  for (const t of c.leads_to || []) edge('LEADS_TO', r.id, t);
}
for (const k of M.constraints || []) {
  N({ id: k.id, class: 'CONSTRAINT', constraint_id: k.id, statement: k.statement, authority_refs: k.authority_refs, scope: k.scope, conflicts: k.conflicts || [], ledger_status: 'PROPOSED', kind: k.kind, owner: `${E} (proposed; not yet in CONSTRAINT-LEDGER.md: D18)` });
  for (const au of k.authority_refs) edge('AUTHORIZES', au, k.id);
  for (const cl of k.grounded_by || []) edge('GROUNDS', cl, k.id);
  for (const f of k.requires || []) edge('REQUIRES', k.id, f);
  for (const im of k.implemented_by || []) edge('IMPLEMENTED_BY', k.id, im);
}
for (const f of M.facts || []) {
  N({ id: f.id, class: 'COMPUTATIONAL_FACT', fact_id: f.id, subject: f.subject, predicate: f.predicate, required_environment: f.required_environment || [], constraint_refs: f.constraint_refs, status: f.status, note: f.note || null, source_ref: o.manifest, owner: `${E} (derived from the evidence named by its edges)` });
  edge('PROBED_BY', f.id, f.probe);
  for (const e of f.evidence) edge('EVIDENCED_BY', f.id, e);
  if (f.stale_if) edge('STALE_IF', f.id, f.stale_if.env, { condition: { dimension: f.stale_if.dimension, relation: f.stale_if.relation } });
  for (const im of f.implemented_by || []) edge('IMPLEMENTED_BY', f.id, im);
}
const epoch = { schema: 'facttest-environment-map-epoch/1', epoch: E, delta: o.delta, commit: o.commit, summary: `${recs.length} exact clauses over ${(M.new_authorities || []).length} new and existing authorities; traces ${Object.keys(M.traces).join(' ')}; ${(M.constraints || []).length} proposed constraints; ${(M.facts || []).length} facts`,
  node_classes: o.declare ? { CLAUSE: { owner_rule: 'the clause manifest (tests/reference/<epoch>-clauses.json) and its extraction evidence', required: ['clause_id', 'authority_ref', 'trace', 'epoch', 'source', 'locator', 'excerpt_sha256', 'quoted', 'consequence'] } } : undefined,
  edge_semantics: o.declare ? {
    CLAUSE_OF: { from: ['CLAUSE'], to: ['AUTHORITY'], meaning: 'the exact clause lives in the document identified by that authority' },
    GROUNDS: { from: ['CLAUSE'], to: ['CONSTRAINT', 'COMPUTATIONAL_FACT'], meaning: 'the clause text is the ground of that project constraint or fact' },
    LEADS_TO: { from: ['CLAUSE'], to: ['CLAUSE'], meaning: 'a sublink followed because it materially changes legality, lifecycle, failure, security, storage, admission or proof interpretation' },
    EXTRACTED_IN: { from: ['CLAUSE'], to: ['EVIDENCE'], meaning: 'the extraction record (source commit, sha256, excerpt) of the clause' } } : undefined,
  nodes, edges };
writeFileSync(o.out, JSON.stringify(epoch, null, 1) + '\n');
console.log(`${E}: ${nodes.length} nodes, ${edges.length} edges -> ${o.out}`);
