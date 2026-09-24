// Implementation-reality epoch builder (D17 onward; design/materialization/D17-INTENDED-IMPLEMENTATION-REALITY.md
// section 5).  Joins (1) a clause epoch fragment from tests/reference/build-clauses.mjs (implementation sources pinned to
// the versions FactTest ran), (2) tests/implementation/reality.json (implementation behaviours), (3) the label-audit
// evidence of tests/implementation/label-audit.mjs and (4) the kernel section comparison of
// tests/implementation/wasm-sections.mjs into one environment-map epoch that keeps three layers apart and connected:
//   standards law        CLAUSE / CONSTRAINT of standard authorities            (earlier epochs)
//   implementation       IMPLEMENTATION_BEHAVIOR, SOURCED_BY implementation-class CLAUSEs (declared here)
//   observed runtime     COMPUTATIONAL_FACT + EVIDENCE + ENVIRONMENT              (EXPLAINS, and STALE_IF edges added
//                        on the explained facts for the behaviour's environment dimension)
//   RELATES_TO_STANDARD  IMPLEMENTATION_BEHAVIOR -> CLAUSE | CONSTRAINT {relation}
// Generic: never names a behaviour, finding or clause itself.  Usage:
//   node tests/implementation/build-reality.mjs --clause-epoch FILE --reality FILE --label-audit FILE --labels FILE
//        --kernel DIR --graph FILE --epoch D17 --delta ID --commit SHA [--declare] --out FILE
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const a = process.argv.slice(2); const o = {};
for (let i = 0; i < a.length; i++) { const k = a[i].replace(/^--/, ''); if (a[i + 1] === undefined || a[i + 1].startsWith('--')) o[k] = true; else o[k] = a[++i]; }
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex');
const E = o.epoch;
const base = JSON.parse(readFileSync(o['clause-epoch'], 'utf8'));
const R = JSON.parse(readFileSync(o.reality, 'utf8'));
const LA = JSON.parse(readFileSync(o['label-audit'], 'utf8'));
const labels = JSON.parse(readFileSync(o.labels, 'utf8'));
const g = JSON.parse(readFileSync(o.graph, 'utf8'));
const secPath = join(o.kernel, 'sections.json'), buildsPath = join(o.kernel, 'builds.json');
const sections = JSON.parse(readFileSync(secPath, 'utf8')); const builds = JSON.parse(readFileSync(buildsPath, 'utf8'));
const nodes = [...base.nodes]; const edges = [...base.edges];
const N = n => { nodes.push(n); return n.id; };
const edge = (type, from, to, extra = {}) => edges.push({ type, from, to, ...extra });
const all = () => [...g.nodes, ...nodes];
const byId = id => all().find(n => n.id === id);

// kernel section identity (physical, Factory-built)
const ENV = `ENV-${E}-HOST`, TENV = `ENV-${E}-TOOLCHAIN`;
N({ id: TENV, class: 'ENVIRONMENT', environment_id: TENV, environment_class: 'PHYSICAL_HOST', toolchain: { nightly: { rustc: builds.rustc, cargo: builds.cargo, llvm: builds.llvm } }, target: 'wasm64-unknown-unknown (release, -Z build-std=core)',
  host_runtime: builds.host, versions: { rustc: builds.rustc, cargo: builds.cargo, llvm: builds.llvm }, flags: { rustflags: builds.rustflags }, build_profile: 'release',
  origin_security: null, permissions_policy: null, implementation_hardware_class: 'x86_64 container', dependency_graph_identity: 'factc-wasm-abi core-only graph (WASM64_KERNEL_SET)',
  other_state: { install_names: builds.builds.map(b => `${b.label}: ${b.install_path}`) }, identity_completeness: { missing: [], present: ['rustc/cargo/LLVM identity', 'install paths', 'RUSTFLAGS'] },
  owner: buildsPath, note: `${E} kernel builds under two install names of one toolchain` });
N({ id: 'IMPL-KERNEL-SECTIONS', class: 'IMPLEMENTATION', impl_id: 'IMPL-KERNEL-SECTIONS', repo_path: 'tests/implementation/wasm-sections.mjs', commit: `introduced by ${o.delta} (integration commit in LEDGER AFTER)`, kind: 'harness', note: 'section-level identity of wasm builds', owner: 'FactTest repository path tests/implementation/' });
const KF = R.kernel_identity.fact;
N({ id: 'PROBE-KERNEL-SECTIONS', class: 'PROBE', probe_id: 'PROBE-KERNEL-SECTIONS', proves_fact: [KF], command_or_operation: 'build the release kernel twice with the pinned nightly (its own install name, and bind-mounted under another name in a private mount namespace); compare sections with tests/implementation/wasm-sections.mjs',
  expected_observations: ['only custom sections differ; identity over the other sections equal'], failure_meaning: ['a code/data/type section depends on the install path: the kernel identity [GAP] stands unnarrowed'], implemented_by: 'IMPL-KERNEL-SECTIONS', owner: 'IMPL-KERNEL-SECTIONS' });
edge('IMPLEMENTED_BY', 'PROBE-KERNEL-SECTIONS', 'IMPL-KERNEL-SECTIONS');
const evK = N({ id: `EV-${E}-KERNEL-SECTIONS`, class: 'EVIDENCE', evidence_id: `EV-${E}-KERNEL-SECTIONS`, probe_ref: 'PROBE-KERNEL-SECTIONS', environment_ref: TENV,
  artifact_identity: { path: secPath, sha256: sha(secPath), locator: 'comparison, differing_sections, identical_excluding_custom', identity_source: 'sha256 of the committed record' },
  observed_result: `whole files ${sections.whole_file_identical ? 'identical' : 'differ'}; differing sections ${JSON.stringify(sections.differing_sections)}; identical excluding ${JSON.stringify(sections.excluded_custom_sections)}: ${sections.identical_excluding_custom}`, epoch: E, status: 'RUN', evidence_class: 'PHYSICAL_HOST', owner: `Factory receipt of ${o.delta}` });
const narrowed = sections.identical_excluding_custom && sections.differing_sections.every(s => sections.excluded_custom_sections.includes(s.replace(/^custom:/, '')));
N({ id: KF, class: 'COMPUTATIONAL_FACT', fact_id: KF, subject: 'release kernel built with the pinned nightly under two rustup install names',
  predicate: narrowed ? `only the custom ${JSON.stringify(sections.differing_sections)} section differs; every other section is byte-identical (identity excluding it ${sections.builds[0].identity_excluding_custom}); whole-file sha256 ${sections.builds.map(b => b.sha256.slice(0, 16)).join(' vs ')}`
    : `sections other than the excluded custom sections differ: ${JSON.stringify(sections.differing_sections)}`,
  required_environment: ['toolchain.nightly.rustc_commit', 'toolchain.nightly.components'], constraint_refs: R.kernel_identity.constraint_refs, status: narrowed ? 'RUN' : 'ERR',
  note: `narrows ${R.kernel_identity.narrows}: the install path reaches debug names only`, source_ref: secPath, owner: `${E} (derived from the evidence named by its edges)` });
edge('PROBED_BY', KF, 'PROBE-KERNEL-SECTIONS'); edge('EVIDENCED_BY', KF, evK); edge('REQUIRES', KF, TENV);
edge('STALE_IF', KF, TENV, { condition: { dimension: 'toolchain.nightly.rustc_commit', relation: 'another nightly or codegen profile' } });

// label audit (reviewed findings, locations proven in the working tree)
N({ id: 'IMPL-LABEL-AUDIT', class: 'IMPLEMENTATION', impl_id: 'IMPL-LABEL-AUDIT', repo_path: 'tests/implementation/label-audit.mjs', commit: `introduced by ${o.delta} (integration commit in LEDGER AFTER)`, kind: 'harness', note: 'proves label-audit locations and evidence', owner: 'FactTest repository path tests/implementation/' });
const labelFacts = [];
const probeL = { id: 'PROBE-LABEL-AUDIT', class: 'PROBE', probe_id: 'PROBE-LABEL-AUDIT', proves_fact: labelFacts, command_or_operation: 'node tests/implementation/label-audit.mjs tests/implementation/label-audit.json --graph <graph> --clauses <clause evidence> --out evidence/<epoch>/labels/audit.json',
  expected_observations: ['every finding location found verbatim; every evidence clause resolved'], failure_meaning: ['a cited phrase moved or disappeared: the finding returns to review'], implemented_by: 'IMPL-LABEL-AUDIT', owner: 'IMPL-LABEL-AUDIT' };
N(probeL); edge('IMPLEMENTED_BY', 'PROBE-LABEL-AUDIT', 'IMPL-LABEL-AUDIT');
const labelsPath = o.labels;
const evL = N({ id: `EV-${E}-LABEL-AUDIT`, class: 'EVIDENCE', evidence_id: `EV-${E}-LABEL-AUDIT`, probe_ref: 'PROBE-LABEL-AUDIT', environment_ref: ENV,
  artifact_identity: { path: labelsPath, sha256: sha(labelsPath), locator: 'results', identity_source: 'sha256 of the committed record' },
  observed_result: `${labels.findings} findings, ${labels.mislabels} MISLABEL, ${labels.unresolved} unresolved`, epoch: E, status: 'RUN', evidence_class: 'PHYSICAL_HOST', owner: `Factory receipt of ${o.delta}` });
for (const f of LA.findings.filter(x => x.verdict === 'MISLABEL')) {
  const r = labels.results.find(x => x.id === f.id);
  const id = `FACT-${f.id}`;
  N({ id, class: 'COMPUTATIONAL_FACT', fact_id: id, subject: `${f.pattern}: ${f.location.file}:${(r.lines || []).join(',')}`, predicate: `"${f.location.text}" ${f.note}`,
    required_environment: [], constraint_refs: [], status: 'ERR', note: `correction for D18: ${f.correction}`, source_ref: `${o['label-audit']} (${f.id})`, owner: `${E} (derived from the evidence named by its edges)` });
  labelFacts.push(id); edge('PROBED_BY', id, 'PROBE-LABEL-AUDIT'); edge('EVIDENCED_BY', id, evL);
}

// implementation behaviours: three layers, connected
const counts = {};
for (const b of R.behaviors) {
  N({ id: b.id, class: 'IMPLEMENTATION_BEHAVIOR', behavior_id: b.id, implementation: b.implementation, version: b.version, relation_to_standard: b.relation_to_standard, statement: b.statement,
    environment_dimension: b.environment_dimension, stale_if: b.stale_if, runtime_status: b.runtime_status, label: 'IMPLEMENTATION BEHAVIOUR: true of the named implementation version, never standards law',
    owner: `${o.reality} (reviewed), sources named by SOURCED_BY` });
  for (const c of b.sources) edge('SOURCED_BY', b.id, c);
  for (const s of b.standard) edge('RELATES_TO_STANDARD', b.id, s.ref, { relation: s.relation });
  for (const f of b.explains) {
    edge('EXPLAINS', b.id, f);
    // implementation-grounded stale condition on the observed fact, for every environment the fact requires
    const envs = [...g.edges, ...edges].filter(e => e.type === 'REQUIRES' && e.from === f && (byId(e.to) || {}).class === 'ENVIRONMENT').map(e => e.to);
    for (const env of [...new Set(envs)]) {
      const has = [...g.edges, ...edges].some(e => e.type === 'STALE_IF' && e.from === f && e.to === env && e.condition && e.condition.dimension === b.environment_dimension);
      if (!has) edge('STALE_IF', f, env, { condition: { dimension: b.environment_dimension, relation: `implementation: ${b.stale_if} (${b.id})` } });
    }
  }
  counts[b.relation_to_standard] = (counts[b.relation_to_standard] || 0) + 1;
}
const epoch = { schema: 'facttest-environment-map-epoch/1', epoch: E, delta: o.delta, commit: o.commit,
  summary: `${R.behaviors.length} implementation behaviours (${Object.entries(counts).map(([k, n]) => `${k} ${n}`).join(', ')}); ${base.nodes.filter(n => n.class === 'CLAUSE').length} implementation clauses pinned to the versions run; kernel section identity; ${labelFacts.length} MISLABEL findings`,
  node_classes: o.declare ? { IMPLEMENTATION_BEHAVIOR: { owner_rule: 'tests/implementation/reality.json (reviewed) and the implementation clauses it is SOURCED_BY', required: ['behavior_id', 'implementation', 'version', 'relation_to_standard', 'statement', 'environment_dimension', 'stale_if', 'runtime_status', 'label'],
    relation_vocabulary: R.relations, implementation_authority_classes: R.implementation_authority_classes, runtime_vocabulary: ['OBS', 'UNK'] } } : undefined,
  edge_semantics: o.declare ? {
    SOURCED_BY: { from: ['IMPLEMENTATION_BEHAVIOR'], to: ['CLAUSE'], meaning: 'the implementation source clause (pinned to the version run) that establishes the behaviour' },
    RELATES_TO_STANDARD: { from: ['IMPLEMENTATION_BEHAVIOR'], to: ['CLAUSE', 'CONSTRAINT'], requires: ['relation'], meaning: 'how the behaviour stands to standards law (conforms, host choice permitted, deviates, ...)' },
    EXPLAINS: { from: ['IMPLEMENTATION_BEHAVIOR'], to: ['COMPUTATIONAL_FACT'], meaning: 'the observed runtime fact this implementation behaviour accounts for' } } : undefined,
  nodes, edges };
writeFileSync(o.out, JSON.stringify(epoch, null, 1) + '\n');
console.log(`${E}: ${nodes.length} nodes, ${edges.length} edges -> ${o.out}; ${JSON.stringify(counts)}; label facts ${labelFacts.length}; kernel ${narrowed ? 'narrowed' : 'NOT narrowed'}`);
