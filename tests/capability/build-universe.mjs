// Capability-universe epoch builder (D16 onward; design/materialization/D16-INTENDED-CAPABILITY-UNIVERSE.md section 5).
// Joins (1) a clause epoch fragment built by tests/reference/build-clauses.mjs (CLAUSE nodes, new authorities,
// constraints, facts), (2) the universe manifest tests/capability/universe.json (one family per CAPABILITY-MATRIX.md row:
// the seven authority steps, witnesses, reviewed classification) and (3) the census evidence of
// tests/capability/census.mjs into one environment-map epoch:
//   CAPABILITY_FAMILY (declared by the first epoch that uses it)  one approved family of G with its matrix row
//        (current authority, admission contract, lifecycle/failure, evidence required), per-step trace status
//        (CLAUSE / NONE_DEFINED / GAP + reason), census state, witnesses and classification [RUN|OBS|GAP|ERR|UNK]
//   TRACE_STEP  CAPABILITY_FAMILY -> CLAUSE  {step}           the clause that answers that step of the family trace
//   WITNESSED_BY CAPABILITY_FAMILY -> COMPUTATIONAL_FACT       the facts (runtime evidence) the classification rests on
//   plus ENV-<epoch>-BROWSER, the census PROBE/IMPLEMENTATION, one EVIDENCE node and one [OBS] exposure fact per family.
// Generic: never names a family, clause or authority itself.  Usage:
//   node tests/capability/build-universe.mjs --clause-epoch FILE --universe FILE --census DIR --matrix FILE
//        --epoch D16 --delta ID --commit SHA [--declare] --out FILE
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const a = process.argv.slice(2); const o = {};
for (let i = 0; i < a.length; i++) { const k = a[i].replace(/^--/, ''); if (a[i + 1] === undefined || a[i + 1].startsWith('--')) o[k] = true; else o[k] = a[++i]; }
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex');
const E = o.epoch;
const base = JSON.parse(readFileSync(o['clause-epoch'], 'utf8'));
const U = JSON.parse(readFileSync(o.universe, 'utf8'));
const identity = JSON.parse(readFileSync(join(o.census, 'identity.json'), 'utf8'));
// the approved universe G, read from the matrix itself (first column = family, then authority, contract, lifecycle, evidence)
const matrix = new Map(readFileSync(o.matrix, 'utf8').split('\n').filter(l => l.startsWith('| ') && !l.startsWith('| Capability family') && !l.startsWith('|---'))
  .map(l => l.split('|').slice(1, -1).map(c => c.trim())).map(c => [c[0], { current_authority: c[1], admission_contract: c[2], lifecycle_failure: c[3], evidence_required: c[4] }]));
const nodes = [...base.nodes]; const edges = [...base.edges];
const N = n => { nodes.push(n); return n.id; };
const edge = (type, from, to, extra = {}) => edges.push({ type, from, to, ...extra });
const suffix = id => id.replace(/^CAP-/, '');

const ENV = `ENV-${E}-BROWSER`, PROBE = 'PROBE-CAPABILITY-CENSUS', IMPL = 'IMPL-CAPABILITY-CENSUS';
const v = identity.cdp_browser_version || {};
N({ id: ENV, class: 'ENVIRONMENT', environment_id: ENV, environment_class: 'PHYSICAL_BROWSER', toolchain: null, target: 'capability exposure census page (no bundle)',
  host_runtime: `Playwright-launched ${v.product || identity.playwright_browser_version} (${JSON.stringify(identity.launch)})`,
  versions: { product: v.product || null, revision: v.revision || null, js_engine: v.jsVersion || null, playwright_browser_version: identity.playwright_browser_version || null },
  flags: { launch: identity.launch }, build_profile: null,
  origin_security: { origin: identity.origin, secure_context: identity.page ? identity.page.isSecureContext : null, cross_origin_isolated: identity.page ? identity.page.crossOriginIsolated : null },
  permissions_policy: identity.page ? identity.page.policy_api : null, implementation_hardware_class: 'container without cameras, microphones, sensors, XR, HID/USB/serial/bluetooth devices or hardware GPU',
  dependency_graph_identity: null, other_state: { visibility: identity.page ? identity.page.visibilityState : null, focus: identity.page ? identity.page.hasFocus : null },
  identity_completeness: { missing: ['OS package set', 'GPU driver stack (none)'], present: ['browser product/revision/js engine', 'launch arguments', 'origin', 'secure context', 'isolation'] },
  owner: join(o.census, 'identity.json'), note: `${E} capability census; observed ${identity.observed}` });
N({ id: IMPL, class: 'IMPLEMENTATION', impl_id: IMPL, repo_path: 'tests/capability/census.mjs', commit: `introduced by ${o.delta} (integration commit in LEDGER AFTER)`, kind: 'harness',
  note: 'non-prompting exposure/discovery census driven by the universe manifest', owner: 'FactTest repository path tests/capability/' });
const probe = { id: PROBE, class: 'PROBE', probe_id: PROBE, proves_fact: [], command_or_operation: 'node tests/capability/census.mjs tests/capability/universe.json evidence/<epoch>/census',
  expected_observations: ['one record per family with a census block: EXPOSED / ABSENT / UNDETERMINED, discovery result, permission states, policy answers'],
  failure_meaning: ['a family whose recorded state differs from the reviewed classification returns to ASCII (tests/capability/gate.mjs)'], implemented_by: IMPL, owner: IMPL };
N(probe); edge('IMPLEMENTED_BY', PROBE, IMPL);

const ids = new Set(nodes.map(n => n.id));
const counts = {};
for (const f of U.families) {
  const row = matrix.get(f.matrix_row);
  if (!row) { console.error(`refusing to build: ${f.id} names matrix row "${f.matrix_row}" that CAPABILITY-MATRIX.md does not contain`); process.exit(1); }
  const witnesses = [...f.witnesses];
  let census = null;
  const recPath = join(o.census, 'records', f.id + '.json');
  if (f.census && existsSync(recPath)) {
    const r = JSON.parse(readFileSync(recPath, 'utf8'));
    census = { state: r.state, record: recPath };
    const ev = N({ id: `EV-${E}-CENSUS-${suffix(f.id)}`, class: 'EVIDENCE', evidence_id: `EV-${E}-CENSUS-${suffix(f.id)}`, probe_ref: PROBE, environment_ref: ENV,
      artifact_identity: { path: recPath, sha256: sha(recPath), locator: 'state, discovery, permissions, policy', identity_source: 'sha256 of the committed record' },
      observed_result: `${r.state}${r.discovery !== undefined ? ' discovery ' + JSON.stringify(r.discovery) : ''}`, epoch: E, status: 'RUN', evidence_class: 'PHYSICAL_BROWSER', owner: `Factory receipt of ${o.delta}` });
    const fid = `FACT-CAP-${suffix(f.id)}-EXPOSURE`;
    const perm = Object.entries(r.permissions || {}).map(([k, s]) => `${k}=${typeof s === 'string' ? s : (s && s.error) || JSON.stringify(s)}`).join(', ');
    const pol = Object.entries(r.policy || {}).map(([k, s]) => `${k}=${typeof s === 'boolean' ? s : (s && s.error) || JSON.stringify(s)}`).join(', ');
    N({ id: fid, class: 'COMPUTATIONAL_FACT', fact_id: fid, subject: `${f.matrix_row} exposure in ${ENV}`,
      predicate: `${r.state}: exposure ${JSON.stringify(r.exposure_expr)} -> ${JSON.stringify(r.exposed)}${r.discovery !== undefined ? '; non-prompting discovery -> ' + JSON.stringify(r.discovery) : ''}${perm ? '; permissions ' + perm : ''}${pol ? '; policy ' + pol : ''}`,
      required_environment: ['browser.revision', 'browser.flags', 'origin_security.secure_context'], constraint_refs: [], status: 'OBS',
      note: 'exposure/discovery only: never admission (CON-CAP-001)', source_ref: recPath, owner: `${E} (derived from the evidence named by its edges)` });
    probe.proves_fact.push(fid);
    edge('PROBED_BY', fid, PROBE); edge('EVIDENCED_BY', fid, ev); edge('REQUIRES', fid, ENV);
    edge('STALE_IF', fid, ENV, { condition: { dimension: 'browser.revision', relation: 'any other browser build, launch flag set or origin' } });
    witnesses.push(fid); ids.add(fid);
  }
  const steps = {};
  for (const s of U.steps) {
    const x = f.steps[s];
    if (Array.isArray(x)) { steps[s] = { status: 'CLAUSE', clauses: x }; for (const c of x) edge('TRACE_STEP', f.id, c, { step: s }); }
    else if (x && x.none_defined) { steps[s] = { status: 'NONE_DEFINED', clauses: [x.none_defined], reason: 'verified absent from the whole authority document (absent_in_document)' }; edge('TRACE_STEP', f.id, x.none_defined, { step: s, none_defined: true }); }
    else steps[s] = { status: 'GAP', clauses: [], reason: x && x.gap ? x.gap : 'not traced' };
  }
  N({ id: f.id, class: 'CAPABILITY_FAMILY', family_id: f.id, matrix_row: f.matrix_row, in_G: true, g_source: U.g_source, ...row, steps,
    census, classification: f.classification, rationale: f.rationale, run_parts: f.run_parts, maturity: f.maturity || null,
    owner: `${U.g_source} (approved universe; only an ASCII decision removes a row), ${o.universe} (trace + reviewed classification)` });
  for (const w of witnesses) edge('WITNESSED_BY', f.id, w);
  counts[f.classification] = (counts[f.classification] || 0) + 1;
}
const epoch = { schema: 'facttest-environment-map-epoch/1', epoch: E, delta: o.delta, commit: o.commit,
  summary: `${U.families.length} capability families (G = ${U.g_source}): ${Object.entries(counts).map(([k, n]) => `${k} ${n}`).join(', ')}; ${base.nodes.filter(n => n.class === 'CLAUSE').length} clauses; census in ${ENV}`,
  node_classes: o.declare ? { CAPABILITY_FAMILY: { owner_rule: 'CAPABILITY-MATRIX.md (the approved universe G) and the universe manifest tests/capability/universe.json', required: ['family_id', 'matrix_row', 'in_G', 'admission_contract', 'evidence_required', 'steps', 'classification', 'rationale'] } } : undefined,
  edge_semantics: o.declare ? {
    TRACE_STEP: { from: ['CAPABILITY_FAMILY'], to: ['CLAUSE'], requires: ['step'], meaning: 'the clause answers that step (API, SECURE_CONTEXT, PERMISSION_POLICY, REQUEST, FEATURES_LIMITS, LIFECYCLE, LOSS) of the family trace; none_defined marks a verified absence' },
    WITNESSED_BY: { from: ['CAPABILITY_FAMILY'], to: ['COMPUTATIONAL_FACT'], meaning: 'runtime/evidence facts on which the family classification rests' } } : undefined,
  nodes, edges };
writeFileSync(o.out, JSON.stringify(epoch, null, 1) + '\n');
console.log(`${E}: ${nodes.length} nodes, ${edges.length} edges -> ${o.out}; ${JSON.stringify(counts)}`);
