// Fact epoch builder (first used by D21R; reusable by every delta that binds physical results to the graph).
// Usage: node tests/envmap/build-fact-epoch.mjs --spec FILE --graph FILE [--root DIR] [--identity DIR] --epoch E
//        --delta ID --commit STR --out FILE
// The spec is a delta-owned record { environment?, probes: [...], facts: [...] }.  Adds, without editing any earlier node:
//   ENV-<E>-HOST     when --identity DIR (a tests/reprove/identity.mjs capture) is given; otherwise spec.environment must
//                    name an existing ENVIRONMENT node
//   IMPL-*           each spec implementation (a repository path with no node yet; D23) before the probes need it
//   PROBE-*          each spec probe the graph does not yet hold (implemented_by an existing IMPLEMENTATION node)
//   EV-<E>-<FILE>    one sha256-bound EVIDENCE node per evidence file (paths relative to --root; a file several facts
//                    cite is one node; an evidence entry may name its own probe)
//   FACT-*           each spec fact with its PROBED_BY, EVIDENCED_BY, REQUIRES, IMPLEMENTED_BY and STALE_IF edges
// Generic: names no fact, probe, file or component of its own; the spec is its data.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const a = process.argv.slice(2); const o = { root: '.' };
for (let i = 0; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const J = p => JSON.parse(readFileSync(p, 'utf8'));
const S = J(o.spec), g = J(o.graph); const E = o.epoch;
const relpath = p => p.replace(/^\.\//, '');
const ids = new Set(g.nodes.map(n => n.id));
const nodes = [], edges = [];
const N = n => { if (ids.has(n.id)) throw new Error(`node already exists: ${n.id}`); ids.add(n.id); nodes.push(n); return n.id; };
const need = id => { if (!ids.has(id)) throw new Error(`unknown node: ${id}`); return id; };
const edge = (type, from, to, extra = {}) => edges.push({ type, from, to, ...extra });
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex');
let HOST = S.environment;
if (o.identity) {
  const host = J(join(o.identity, 'host.json')), tc = J(join(o.identity, 'toolchains.json')), repo = J(join(o.identity, 'repo.json'));
  const sets = J(join(o.root, 'tests/toolchain/proof-sets.json')).sets;
  const pin = (name) => { const t = tc.toolchains[name] || {}; return { channel: name, install_name: name, rustc: t.rustc, rustc_commit: t.commit, release: t.release, llvm: t.llvm, components: (t.components || []).map(c => c.replace(/-x86_64-unknown-linux-gnu$/, '')) }; };
  const hr = host.host_runtime || {};
  HOST = N({ id: `ENV-${E}-HOST`, class: 'ENVIRONMENT', environment_id: `ENV-${E}-HOST`, environment_class: 'PHYSICAL_HOST', toolchain: { stable: pin(sets.HOST_NATIVE_SET.toolchain), nightly: pin(sets.WASM64_KERNEL_SET.toolchain) },
    target: 'host (HOST_NATIVE_SET) and wasm64-unknown-unknown (WASM64_KERNEL_SET)', host_runtime: `node ${hr.node && hr.node.node} / ${hr.git} / Playwright ${hr.playwright && hr.playwright.version}`,
    versions: { node: `v${hr.node && hr.node.node}`, v8_node: hr.node && hr.node.v8, git: String(hr.git).replace(/^git version /, ''), playwright: hr.playwright && hr.playwright.version, os: host.os && host.os.release, kernel: host.os && host.os.uname,
      rustup_stable: tc.toolchains.stable && tc.toolchains.stable.rustc, rustup_nightly: tc.toolchains.nightly && tc.toolchains.nightly.rustc },
    flags: { rustflags: sets.WASM64_KERNEL_SET.rustflags }, build_profile: S.build_profile || 'none (records compared; cargo metadata only)', origin_security: null, permissions_policy: null,
    implementation_hardware_class: `${host.hardware && host.hardware.cpu}; ${host.hardware && host.hardware.logical_cpus} logical CPUs; GPU device node ${host.hardware && host.hardware.gpu_device_node}`,
    hardware: { gpu_device_node: host.hardware && host.hardware.gpu_device_node }, dependency_graph_identity: `workspace members ${(repo.workspace_members || []).join(',')}`,
    other_state: { repository_head: repo.head, installed_toolchains: tc.installed, network_egress: host.network_egress },
    identity_completeness: { missing: [], present: ['pinned toolchains (commit, components)', 'rustup names', 'node/V8', 'git', 'Playwright', 'OS/kernel', 'GPU device node', 'repository head and members'] },
    owner: `${relpath(o.identity)}/{host,toolchains,repo}.json`, note: `${E} environment identity (host of the run this epoch binds)` });
} else need(HOST);
for (const im of S.implementations || []) {
  if (ids.has(im.id)) continue;
  N({ id: im.id, class: 'IMPLEMENTATION', impl_id: im.id, repo_path: im.repo_path, commit: `introduced by ${o.delta} (integration commit in LEDGER AFTER)`, kind: im.kind, note: im.note, owner: im.owner || im.repo_path });
}
for (const p of S.probes || []) {
  if (ids.has(p.id)) continue;
  N({ id: p.id, class: 'PROBE', probe_id: p.id, proves_fact: S.facts.filter(f => f.probe === p.id).map(f => f.id), command_or_operation: p.command_or_operation, expected_observations: p.expected_observations, failure_meaning: p.failure_meaning, implemented_by: need(p.implemented_by), owner: p.implemented_by });
  edge('IMPLEMENTED_BY', p.id, p.implemented_by);
}
const own = `Factory receipt of ${o.delta}`;
const evByPath = new Map(); // a record cited by several facts is one EVIDENCE node
for (const f of S.facts) {
  need(f.probe);
  const evs = (f.evidence || []).map(ev => {
    if (evByPath.has(ev.path)) return evByPath.get(ev.path);
    // the id names the record's path inside the epoch's package (evidence/<E>/a/b.json -> EV-<E>-A-B); a record outside it
    // is named by its file name
    const inside = ev.path.replace(/^\.\//, '').replace(new RegExp(`^evidence/${E}/`), '');
    const id = `EV-${E}-` + (inside === ev.path ? ev.path.split('/').pop() : inside).replace(/\.[A-Za-z0-9]+$/, '').replace(/[^A-Za-z0-9]+/g, '-').toUpperCase(); const p = join(o.root, ev.path);
    N({ id, class: 'EVIDENCE', evidence_id: id, probe_ref: need(ev.probe || f.probe), environment_ref: HOST, artifact_identity: { path: ev.path, sha256: sha(p), bytes: readFileSync(p).length, locator: 'record', identity_source: 'sha256 of the committed record' }, observed_result: ev.observed_result, epoch: E, status: ev.status || 'RUN', evidence_class: ev.evidence_class || 'PHYSICAL_HOST', owner: own });
    evByPath.set(ev.path, id); return id;
  });
  N({ id: f.id, class: 'COMPUTATIONAL_FACT', fact_id: f.id, subject: f.subject, predicate: f.predicate, required_environment: f.required_environment || [], constraint_refs: f.constraint_refs || [], status: f.status, note: f.note, source_ref: f.source_ref, owner: `${E} (derived from the evidence named by its edges)` });
  edge('PROBED_BY', f.id, f.probe); for (const e of evs) edge('EVIDENCED_BY', f.id, e); edge('REQUIRES', f.id, HOST);
  for (const i of f.implemented_by || []) edge('IMPLEMENTED_BY', f.id, need(i));
  for (const s of f.stale_if || []) edge('STALE_IF', f.id, HOST, { condition: { dimension: s.dimension, relation: s.relation } });
}
const epoch = { schema: 'facttest-environment-map-epoch/1', epoch: E, delta: o.delta, commit: o.commit, summary: S.summary || `${S.facts.length} fact(s) bound to ${nodes.filter(n => n.class === 'EVIDENCE').length} evidence record(s)`, nodes, edges };
writeFileSync(o.out, JSON.stringify(epoch, null, 1) + '\n');
console.log(`${E}: ${nodes.length} nodes, ${edges.length} edges -> ${o.out}; facts ${S.facts.map(f => `${f.id} [${f.status}]`).join(', ')}`);
