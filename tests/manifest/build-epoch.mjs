// D21 manifest epoch builder (design/materialization/D21-INTENDED-EXECUTION-MANIFEST.md section 5).
// Usage: node tests/manifest/build-epoch.mjs --manifest FILE --issues FILE --gate FILE --identity DIR --graph FILE
//        [--root DIR] --epoch D21 --delta ID --commit STR --out FILE
// Adds, without editing any earlier node:
//   ENV-<E>-HOST                   the host the manifest was computed on (tests/reprove/identity.mjs capture)
//   IMPL-<component>               one IMPLEMENTATION node per live component the graph did not yet cover
//   PROBE-EXECUTION-MANIFEST       the manifest builder + gate
//   EV-<E>-MANIFEST / -GATE / -ISSUES   sha256-bound evidence records
//   FACT-<E>-LIVE-SURFACES-ENUMERATED [OBS]  every tracked path tiered, every live component connected; IMPLEMENTED_BY
//                                  every live implementation node (old and new); STALE_IF repo.commit
//   FACT-<E>-ISSUES-CLASSIFIED [OBS]  every automated finding classified A..G before repair
// Generic: names no component or file of its own; the manifest and issue inventory are its data.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const a = process.argv.slice(2); const o = { root: '.' };
for (let i = 0; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const J = p => JSON.parse(readFileSync(p, 'utf8'));
const M = J(o.manifest), I = J(o.issues), G = J(o.gate), g = J(o.graph); const E = o.epoch;
const relpath = p => p.replace(/^\.\//, '');
const host = J(join(o.identity, 'host.json')), tc = J(join(o.identity, 'toolchains.json')), repo = J(join(o.identity, 'repo.json'));
const sets = J(join(o.root, 'tests/toolchain/proof-sets.json')).sets;
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex');
const ids = new Map(g.nodes.map(n => [n.id, n]));
const nodes = []; const edges = []; const keys = new Set(g.edges.map(e => JSON.stringify(e)));
const N = n => { nodes.push(n); return n.id; };
const edge = (type, from, to, extra = {}) => { const e = { type, from, to, ...extra }; const k = JSON.stringify(e); if (!keys.has(k)) { keys.add(k); edges.push(e); } };
const LIVE = new Set(['PRODUCTION', 'FACTORY', 'TEST']);
const HOST = `ENV-${E}-HOST`;
const pin = (name) => { const t = tc.toolchains[name] || {}; return { channel: name, install_name: name, rustc: t.rustc, rustc_commit: t.commit, release: t.release, llvm: t.llvm, components: (t.components || []).map(c => c.replace(/-x86_64-unknown-linux-gnu$/, '')) }; };
const hr = host.host_runtime || {};
N({ id: HOST, class: 'ENVIRONMENT', environment_id: HOST, environment_class: 'PHYSICAL_HOST', toolchain: { stable: pin(sets.HOST_NATIVE_SET.toolchain), nightly: pin(sets.WASM64_KERNEL_SET.toolchain) },
  target: 'host (HOST_NATIVE_SET) and wasm64-unknown-unknown (WASM64_KERNEL_SET)', host_runtime: `node ${hr.node && hr.node.node} / ${hr.git} / Playwright ${hr.playwright && hr.playwright.version}`,
  versions: { node: `v${hr.node && hr.node.node}`, v8_node: hr.node && hr.node.v8, git: String(hr.git).replace(/^git version /, ''), playwright: hr.playwright && hr.playwright.version, os: host.os && host.os.release, kernel: host.os && host.os.uname,
    rustup_stable: tc.toolchains.stable && tc.toolchains.stable.rustc, rustup_nightly: tc.toolchains.nightly && tc.toolchains.nightly.rustc },
  flags: { rustflags: sets.WASM64_KERNEL_SET.rustflags }, build_profile: 'none (manifest computed from the tree; cargo metadata only)', origin_security: null, permissions_policy: null,
  implementation_hardware_class: `${host.hardware && host.hardware.cpu}; ${host.hardware && host.hardware.logical_cpus} logical CPUs; GPU device node ${host.hardware && host.hardware.gpu_device_node}`,
  hardware: { gpu_device_node: host.hardware && host.hardware.gpu_device_node }, dependency_graph_identity: `workspace members ${(repo.workspace_members || []).join(',')}`,
  other_state: { repository_head: repo.head, installed_toolchains: tc.installed, network_egress: host.network_egress },
  identity_completeness: { missing: [], present: ['pinned toolchains (commit, components)', 'rustup names', 'node/V8', 'git', 'Playwright', 'OS/kernel', 'GPU device node', 'repository head and members'] },
  owner: `${relpath(o.identity)}/{host,toolchains,repo}.json`, note: `${E} environment identity (manifest computation host)` });
const IMPL_TOOL = `IMPL-${M.components.find(c => c.paths.includes('tests/manifest/')).id}`;
const newImpls = [];
for (const c of M.components.filter(c => LIVE.has(c.tier) && !c.graph.implementations.length && !c.historical_tool)) {
  const id = `IMPL-${c.id}`; if (ids.has(id)) continue;
  N({ id, class: 'IMPLEMENTATION', impl_id: id, repo_path: c.paths.join(' + '), commit: `enumerated by ${o.delta} at ${M.rev} (integration commit in LEDGER AFTER)`, kind: c.tier === 'PRODUCTION' ? (c.area === 'web' ? 'template' : 'compiler') : c.tier === 'FACTORY' ? 'factory' : 'harness',
    note: `${c.tier}: ${c.operation.slice(0, 200)}`, owner: `tests/manifest/components.json (${c.id})` });
  newImpls.push(id);
}
const PM = 'PROBE-EXECUTION-MANIFEST';
N({ id: PM, class: 'PROBE', probe_id: PM, proves_fact: [`FACT-${E}-LIVE-SURFACES-ENUMERATED`, `FACT-${E}-ISSUES-CLASSIFIED`], command_or_operation: 'node tests/manifest/build-manifest.mjs (git ls-files + cargo metadata + graph + receipts + registry -> manifest); node tests/manifest/gate.mjs (findings <-> issue inventory)',
  expected_observations: ['every tracked path assigned to one tier', 'every required coverage item live', 'every automated finding classified A..G'], failure_meaning: ['a live surface is outside the manifest, or a finding has no classification: repair may not begin (D21 PASS condition)'], implemented_by: IMPL_TOOL, owner: IMPL_TOOL });
edge('IMPLEMENTED_BY', PM, IMPL_TOOL);
const own = `Factory receipt of ${o.delta}`;
const ev = (file, observed, ok) => { const p = join(o.root, file); const id = `EV-${E}-` + file.split('/').pop().replace(/\.json$/, '').replace(/[^A-Za-z0-9]+/g, '-').toUpperCase();
  N({ id, class: 'EVIDENCE', evidence_id: id, probe_ref: PM, environment_ref: HOST, artifact_identity: { path: file, sha256: sha(p), bytes: readFileSync(p).length, locator: 'record', identity_source: 'sha256 of the committed record' }, observed_result: observed, epoch: E, status: ok ? 'RUN' : 'ERR', evidence_class: 'PHYSICAL_HOST', owner: own }); return id; };
const F = M.findings; const nf = Object.values(F).reduce((n, v) => n + v.length, 0);
const byClass = I.issues.reduce((m, is) => (m[is.class] = (m[is.class] || 0) + 1, m), {}); const byTask = I.issues.reduce((m, is) => (m[is.task] = (m[is.task] || 0) + 1, m), {});
const eM = ev(o['manifest-path'] || 'evidence/D21/manifest.json', `${M.tracked_files} tracked files at ${M.rev.slice(0, 9)} in ${M.components.length} components (${Object.entries(M.files_by_tier).map(([k, v]) => `${k} ${v}`).join(', ')}); ${nf} finding items`, true);
const eG = ev(o['gate-path'] || 'evidence/D21/gate.json', `${G.status}: ${G.checks.map(c => `${c.check} ${c.status}`).join(', ')}`, G.status === 'PASS');
const eI = ev(o['issues-path'] || 'evidence/D21/issues.json', `${I.issues.length} issues: ${Object.entries(byClass).sort().map(([k, v]) => `${k} ${v}`).join(', ')}; by task ${Object.entries(byTask).sort().map(([k, v]) => `${k} ${v}`).join(', ')}`, true);
const FS = `FACT-${E}-LIVE-SURFACES-ENUMERATED`, FI = `FACT-${E}-ISSUES-CLASSIFIED`;
const live = M.components.filter(c => LIVE.has(c.tier));
N({ id: FS, class: 'COMPUTATIONAL_FACT', fact_id: FS, subject: `current executable FactTest at ${M.rev.slice(0, 9)}`, predicate: `${M.tracked_files} tracked files tiered (${Object.entries(M.files_by_tier).map(([k, v]) => `${k} ${v}`).join(', ')}); ${live.length} live components (${live.filter(c => c.tier === 'PRODUCTION').length} production, ${live.filter(c => c.tier === 'FACTORY').length} factory, ${live.filter(c => c.tier === 'TEST').length} test), each with owner, consumer and station; required coverage complete; ${F.unassigned_paths.length} unassigned paths; ${F.live_components_without_governing_claim.length} live components had no governing claim before this epoch (now carried by this fact)`,
  required_environment: ['the canonical tree at the recorded head'], constraint_refs: [], status: G.status === 'PASS' ? 'OBS' : 'ERR', note: 'an enumeration, not an execution claim: D22-D26 execute the components', source_ref: relpath(o['manifest-path'] || 'evidence/D21/manifest.json'), owner: `${E} (derived from the evidence named by its edges)` });
N({ id: FI, class: 'COMPUTATIONAL_FACT', fact_id: FI, subject: `${E} issue inventory`, predicate: `${nf} automated finding items across ${Object.keys(F).length} finding kinds classified into ${I.issues.length} issues: ${Object.entries(byClass).sort().map(([k, v]) => `${k} ${v}`).join(', ')}; scheduled ${Object.entries(byTask).sort().map(([k, v]) => `${k} ${v}`).join(', ')}`,
  required_environment: [], constraint_refs: [], status: G.status === 'PASS' ? 'OBS' : 'ERR', note: 'classification precedes repair (GAP CLASSIFICATION LAW); each issue names its task and surfaces', source_ref: relpath(o['issues-path'] || 'evidence/D21/issues.json'), owner: `${E} (derived from the evidence named by its edges)` });
for (const [f, evs] of [[FS, [eM, eG]], [FI, [eI, eG]]]) { edge('PROBED_BY', f, PM); for (const e of evs) edge('EVIDENCED_BY', f, e); edge('REQUIRES', f, HOST); edge('IMPLEMENTED_BY', f, IMPL_TOOL); }
for (const c of live) for (const i of [...c.graph.implementations, ...(newImpls.includes(`IMPL-${c.id}`) ? [`IMPL-${c.id}`] : [])]) edge('IMPLEMENTED_BY', FS, i);
edge('STALE_IF', FS, HOST, { condition: { dimension: 'repo.commit', relation: 'any tracked file added, removed or moved' } });
edge('STALE_IF', FI, HOST, { condition: { dimension: 'repo.commit', relation: 'any change of a surface an issue names' } });
const epoch = { schema: 'facttest-environment-map-epoch/1', epoch: E, delta: o.delta, commit: o.commit, summary: `execution manifest: ${M.tracked_files} files, ${live.length} live components, ${newImpls.length} implementation nodes added, ${I.issues.length} issues classified (${Object.entries(byClass).sort().map(([k, v]) => `${k} ${v}`).join(', ')})`, nodes, edges };
writeFileSync(o.out, JSON.stringify(epoch, null, 1) + '\n');
console.log(`${E}: ${nodes.length} nodes, ${edges.length} edges -> ${o.out}; implementation nodes added ${newImpls.length}; issues ${I.issues.length}`);
