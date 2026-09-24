// D19 re-proof epoch builder (design/materialization/D19-INTENDED-REPROVE-REOBSERVE.md section 5).
// Usage: node tests/reprove/build-reprove.mjs --graph FILE --selection FILE --evidence DIR --runbook FILE
//        --obligations FILE --dimensions FILE [--root DIR] --epoch D19 --delta ID --commit STR [--declare] --out FILE
// Turns the identity capture, the selection and the group results into the current evidence epoch:
//   ENVIRONMENT  the host as the proof sets bind it (pinned toolchains; rustup names recorded too), the browser for the
//                default launch and for the GPU flag set (incl. the executable actually launched), the authority sources
//                (every tip read, recorded on the node so a later selection can compare it)
//   EVIDENCE     one node per identity record, the selection record and every group record a re-proved fact rests on
//                (sha256 of the committed file; RUN when its expectations held, ERR otherwise)
//   edges        re-proved fact EVIDENCED_BY its records and STALE_IF the new environment in each dimension it was
//                already stale in; a failed re-proof is INVALIDATED_BY its record; FULFILLS (EVIDENCE -> RECONCILIATION)
//                for every obligation whose groups passed
//   facts        the environment identity, the executable launched and the minimum affected set (process facts of the
//                pass), each with its probe, evidence and environment
// Generic: names no fact of an earlier epoch; the runbook, obligations and dimension files carry the reviewed mappings.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const a = process.argv.slice(2); const o = { root: '.' };
for (let i = 0; i < a.length; i++) { const k = a[i].replace(/^--/, ''); if (a[i + 1] === undefined || a[i + 1].startsWith('--')) o[k] = true; else o[k] = a[++i]; }
const J = p => JSON.parse(readFileSync(p, 'utf8'));
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex');
const E = o.epoch; const g = J(o.graph); const SEL = J(o.selection); const RB = J(o.runbook); const DIM = J(o.dimensions).dimensions; const PR = RB.process;
const ev = o.evidence; const idp = f => join(ev, 'identity', f);
const host = J(idp('host.json')), tc = J(idp('toolchains.json')), repo = J(idp('repo.json')), tips = J(idp('tips.json'));
const br = { default: J(idp('browser-default.json')), gpu: J(idp('browser-gpu-flags.json')) };
const results = Object.fromEntries(readdirSync(join(ev, 'results')).filter(f => f.endsWith('.json')).sort().map(f => [f.replace(/\.json$/, ''), J(join(ev, 'results', f))]));
const sets = J(join(o.root, 'tests/toolchain/proof-sets.json')).sets;
const nodes = []; const edges = []; const keys = new Set(g.edges.map(e => JSON.stringify(e)));
const N = n => { nodes.push(n); return n.id; };
const edge = (type, from, to, extra = {}) => { const e = { type, from, to, ...extra }; const k = JSON.stringify(e); if (!keys.has(k)) { keys.add(k); edges.push(e); } };
const ids = new Map(g.nodes.map(n => [n.id, n]));
const relpath = p => p.replace(/^\.\//, '');
const own = `Factory receipt of ${o.delta}`;

// environments
const HOST = `ENV-${E}-HOST`, BD = `ENV-${E}-BROWSER-DEFAULT`, BG = `ENV-${E}-BROWSER-GPUFLAGS`, SRC = `ENV-${E}-SOURCES`;
const pin = (name) => { const t = tc.toolchains[name] || {}; return { channel: name, install_name: name, rustc: t.rustc, rustc_commit: t.commit, release: t.release, llvm: t.llvm, components: (t.components || []).map(c => c.replace(/-x86_64-unknown-linux-gnu$/, '')) }; };
const hr = host.host_runtime || {};
N({ id: HOST, class: 'ENVIRONMENT', environment_id: HOST, environment_class: 'PHYSICAL_HOST', toolchain: { stable: pin(sets.HOST_NATIVE_SET.toolchain), nightly: pin(sets.WASM64_KERNEL_SET.toolchain) },
  target: 'host (HOST_NATIVE_SET) and wasm64-unknown-unknown (WASM64_KERNEL_SET)', host_runtime: `node ${hr.node && hr.node.node} / ${hr.git} / Playwright ${hr.playwright && hr.playwright.version}`,
  versions: { node: `v${hr.node && hr.node.node}`, v8_node: hr.node && hr.node.v8, git: String(hr.git).replace(/^git version /, ''), playwright: hr.playwright && hr.playwright.version, os: host.os && host.os.release, kernel: host.os && host.os.uname,
    rustup_stable: tc.toolchains.stable && tc.toolchains.stable.rustc, rustup_nightly: tc.toolchains.nightly && tc.toolchains.nightly.rustc },
  flags: { rustflags: sets.WASM64_KERNEL_SET.rustflags }, build_profile: 'dev + release (proof sets)', origin_security: null, permissions_policy: null,
  implementation_hardware_class: `${host.hardware && host.hardware.cpu}; ${host.hardware && host.hardware.logical_cpus} logical CPUs; GPU device node ${host.hardware && host.hardware.gpu_device_node}`,
  hardware: { gpu_device_node: host.hardware && host.hardware.gpu_device_node }, dependency_graph_identity: `workspace members ${(repo.workspace_members || []).join(',')}`,
  other_state: { repository_head: repo.head, installed_toolchains: tc.installed, network_egress: host.network_egress },
  identity_completeness: { missing: [], present: ['pinned toolchains (commit, components)', 'rustup names', 'node/V8', 'git', 'Playwright', 'OS/kernel', 'GPU device node', 'repository head and members'] },
  owner: `${relpath(ev)}/identity/{host,toolchains,repo}.json`, note: `${E} environment identity (the proof sets' pinned toolchains)` });
for (const [id, b, label] of [[BD, br.default, 'default launch'], [BG, br.gpu, 'GPU flag set']]) {
  const v = b.cdp_browser_version || {}; const p = b.page || {}; const exe = [...new Set(((b.launched_executable || {}).processes || []).map(x => x.exe))];
  N({ id, class: 'ENVIRONMENT', environment_id: id, environment_class: 'PHYSICAL_BROWSER', toolchain: null, target: 'probe page (no bundle)', host_runtime: `${v.product} via Playwright ${hr.playwright && hr.playwright.version} (${exe.join(', ')})`,
    versions: { product: v.product, revision: v.revision, js_engine: v.jsVersion, userAgent: p.userAgent, playwright_browser_version: b.playwright_browser_version },
    flags: { launch: b.launch, launch_args: (b.launch && b.launch.args) || [] }, build_profile: null,
    origin_security: { origin: b.origin, secure_context: p.isSecureContext, cross_origin_isolated: p.crossOriginIsolated }, permissions_policy: null,
    implementation_hardware_class: p.adapter ? `software GPU: ${JSON.stringify(p.adapter.info)}` : 'no WebGPU adapter', hardware: { gpu_device_node: host.hardware && host.hardware.gpu_device_node },
    dependency_graph_identity: null, other_state: { launched_executable: exe, hardwareConcurrency: p.hardwareConcurrency },
    identity_completeness: { missing: [], present: ['CDP product/revision/jsVersion', 'launch options', 'executable launched', 'origin'] }, owner: `${relpath(ev)}/identity/${id === BD ? 'browser-default' : 'browser-gpu-flags'}.json`, note: `${E} browser identity (${label})` });
}
const srcs = new Map();
for (const d of existsSync(join(ev, 'clauses')) ? readdirSync(join(ev, 'clauses')).sort() : []) {
  const p = join(ev, 'clauses', d, 'summary.json'); if (!existsSync(p)) continue;
  for (const s of J(p).sources) { const m = s.key.match(/^(https:\/\/github\.com\/[^#@]+)#([^:]+):/); if (m) srcs.set(`${m[1]}#${m[2]}`, { key: `${m[1]}#${m[2]}`, commit: s.commit, read_by: `${d} clause re-verification` }); }
}
for (const t of tips.pairs) if (!srcs.has(t.key) && t.tip) srcs.set(t.key, { key: t.key, commit: t.tip, read_by: 'git ls-remote (identity capture)' });
N({ id: SRC, class: 'ENVIRONMENT', environment_id: SRC, environment_class: 'PHYSICAL_HOST', toolchain: null, target: 'authority sources (no build)', host_runtime: 'git ls-remote + raw source fetch through the session proxy',
  versions: { git: String(hr.git).replace(/^git version /, '') }, flags: null, build_profile: null, origin_security: null, permissions_policy: null, implementation_hardware_class: 'none (source observation)',
  dependency_graph_identity: null, other_state: { sources: [...srcs.values()].sort((x, y) => x.key.localeCompare(y.key)), network_egress: host.network_egress },
  identity_completeness: { missing: ['published renderings (policy)'], present: ['branch tip per source read'] }, owner: `${relpath(ev)}/identity/tips.json`, note: `${E} authority source tips` });

// harness, probes, identity/selection evidence
const IMPL = 'IMPL-REPROVE', PID = 'PROBE-ENV-IDENTITY', PSEL = 'PROBE-REPROOF-SELECTION';
const FID = `FACT-${E}-ENVIRONMENT-IDENTITY`, FEXE = `FACT-${E}-LAUNCHED-EXECUTABLE`, FSET = `FACT-${E}-MINIMUM-SET`;
// D20: a later re-proof epoch reuses the harness and probe nodes an earlier one introduced (epochs only add nodes)
if (!ids.has(IMPL)) N({ id: IMPL, class: 'IMPLEMENTATION', impl_id: IMPL, repo_path: 'tests/reprove/{identity.mjs,select.mjs,run-selected.mjs,lineage.mjs,build-reprove.mjs,gate.mjs,dimensions.json,runbook.json,obligations.json}', commit: `introduced by ${o.delta} (integration commit in LEDGER AFTER)`, kind: 'harness', note: 'environment identity capture, graph-driven minimum affected set, selected re-proof runner', owner: 'FactTest repository path tests/reprove/' });
if (!ids.has(PID)) N({ id: PID, class: 'PROBE', probe_id: PID, proves_fact: [FID, FEXE], command_or_operation: 'node tests/reprove/identity.mjs --graph <graph> --out <dir>: host identity, toolchains by rustup name, repository, browser identity (default + GPU flags, executable launched), authority source tips',
  expected_observations: ['every STALE_IF dimension of the current claims has a current value to compare with'], failure_meaning: ['a dimension cannot be observed: claims bound to it stay undecided [UNK]'], implemented_by: IMPL, owner: IMPL });
if (!ids.has(PSEL)) N({ id: PSEL, class: 'PROBE', probe_id: PSEL, proves_fact: [FSET], command_or_operation: 'node tests/reprove/select.mjs (graph + identity + git) -> selection; node tests/reprove/run-selected.mjs per kind -> results',
  expected_observations: ['every selected fact re-proved by its runbook group, every obligation addressed to the pass discharged'], failure_meaning: ['a selected fact fails its expectation: DIFFER, the claim is invalidated and returns to ASCII'], implemented_by: IMPL, owner: IMPL });
edge('IMPLEMENTED_BY', PID, IMPL); edge('IMPLEMENTED_BY', PSEL, IMPL);
const evNodes = new Map();
const evId = f => `EV-${E}-` + f.replace(/\.json$/, '').replace(/[^A-Za-z0-9]+/g, '-').toUpperCase();
const ensureEv = (file, probe, env, observed, ok) => { const id = evId(file); if (evNodes.has(id)) { const n = evNodes.get(id); if (!ok) n.status = 'ERR'; return id; }
  const p = join(ev, file); const n = { id, class: 'EVIDENCE', evidence_id: id, probe_ref: probe, environment_ref: env, artifact_identity: { path: `${relpath(ev)}/${file}`, sha256: sha(p), bytes: readFileSync(p).length, locator: 'record', identity_source: 'sha256 of the committed record' },
    observed_result: observed, epoch: E, status: ok ? 'RUN' : 'ERR', evidence_class: env === BD || env === BG ? 'PHYSICAL_BROWSER' : 'PHYSICAL_HOST', owner: own };
  N(n); evNodes.set(id, n); return id; };
const exeOf = b => [...new Set(((b.launched_executable || {}).processes || []).map(x => x.exe))];
const vOf = b => `${(b.cdp_browser_version || {}).product} ${(b.cdp_browser_version || {}).revision}`;
const eHost = ensureEv('identity/host.json', PID, HOST, `node ${hr.node && hr.node.node}, ${hr.git}, Playwright ${hr.playwright && hr.playwright.version}, GPU device node ${host.hardware && host.hardware.gpu_device_node}`, true);
const eTc = ensureEv('identity/toolchains.json', PID, HOST, Object.entries(tc.toolchains).map(([k, v]) => `${k} ${String(v.commit || 'absent').slice(0, 9)}`).join(', '), true);
const eRepo = ensureEv('identity/repo.json', PID, HOST, `head ${String(repo.head).slice(0, 9)}; ${(repo.workspace_members || []).length} workspace members; ${repo.working_tree_changes.length} working-tree changes`, true);
const eBd = ensureEv('identity/browser-default.json', PR.browser_probe, BD, `${vOf(br.default)}; launched ${exeOf(br.default).join(', ')}`, true);
const eBg = ensureEv('identity/browser-gpu-flags.json', PR.browser_probe, BG, `${vOf(br.gpu)}; launched ${exeOf(br.gpu).join(', ')}`, true);
const eTips = ensureEv('identity/tips.json', PID, SRC, `${tips.pairs.length} source tips; moved since recorded: ${tips.pairs.filter(t => t.tip && !t.recorded_commits.includes(t.tip)).length}`, true);
const eSel = ensureEv('selection.json', PSEL, HOST, `${SEL.evaluated} current RUN/OBS facts evaluated; selected ${SEL.selected} (environment ${SEL.selected_by.environment}, implementation ${SEL.selected_by.implementation}, obligation ${SEL.selected_by.obligation}); gaps ${SEL.gaps.length}; environment pairs ${JSON.stringify(SEL.environment_pairs)}`, true);

// re-proved facts
const envFor = (group, file, rec) => rec && rec.env ? { 'browser-default': BD, 'browser-gpu-flags': BG, host: HOST, sources: SRC }[rec.env] : RB.groups[group].env_kind === 'sources' ? SRC : RB.groups[group].env_kind === 'browser' ? (/gpu-flags/.test(file) ? BG : BD) : HOST;
let pass = 0, fail = 0; const groupEv = {};
for (const [gname, res] of Object.entries(results)) {
  for (const [f, r] of Object.entries(res.facts)) {
    if (!ids.has(f)) throw new Error(`unknown fact ${f}`);
    const rbRecs = RB.facts[f].records; const evs = [];
    for (const rec of r.records) {
      const spec = rbRecs.find(x => x.file === rec.file) || {};
      const id = ensureEv(rec.file, r.probe, envFor(gname, rec.file, spec), (rec.checks || []).map(c => `${c.path} ${c.ok ? 'holds' : 'FAILS'} (${JSON.stringify(c.observed)})`).join('; ') || 'record missing', rec.ok);
      evs.push(id); (groupEv[gname] = groupEv[gname] || new Set()).add(id);
    }
    if (r.verdict === 'PASS') { pass++; for (const id of evs) edge('EVIDENCED_BY', f, id); }
    else { fail++; for (const id of evs) edge('INVALIDATED_BY', f, id); }
    // stale conditions carried to the environment the fact was re-proved in
    const browserEnv = r.records.some(x => /gpu-flags/.test(x.file)) ? BG : BD;
    for (const s of g.edges.filter(e => e.type === 'STALE_IF' && e.from === f)) {
      const kind = (DIM[s.condition.dimension] || {}).env_kind || 'host';
      const env = kind === 'sources' ? SRC : kind === 'browser' ? browserEnv : HOST;
      if (r.verdict === 'PASS') edge('STALE_IF', f, env, { condition: { dimension: s.condition.dimension, relation: s.condition.relation } });
    }
  }
}
// process facts of the pass
const pairs = SEL.environment_pairs; const drift = SEL.drift.map(d => `${d.environment}:${d.dimension}`);
N({ id: FID, class: 'COMPUTATIONAL_FACT', fact_id: FID, subject: `${E} computational environment`, predicate: `the current environment matches the recorded identity on ${pairs.SAME || 0} of ${Object.values(pairs).reduce((x, y) => x + y, 0)} (environment, dimension) stale conditions of the current claims; drift on ${pairs.DRIFT || 0} (${drift.join(', ') || 'none'}); undecidable on ${pairs.UNK || 0} (the recorded identity carries no comparable value)`,
  required_environment: ['the proof sets\' pinned toolchains', 'chromium-headless-shell via the installed Playwright'], constraint_refs: PR.identity_constraints, status: 'RUN', note: 'drift selects the claims bound to it for re-proof (FACT-' + E + '-MINIMUM-SET); UNK pairs are listed in the selection record', source_ref: `${relpath(ev)}/selection.json`, owner: `${E} (derived from the evidence named by its edges)` });
N({ id: FEXE, class: 'COMPUTATIONAL_FACT', fact_id: FEXE, subject: `browser executable launched by Playwright ${hr.playwright && hr.playwright.version} (headless)`, predicate: `the default launch runs ${exeOf(br.default).join(', ')} and the GPU flag set runs ${exeOf(br.gpu).join(', ')} (process image under /proc), reporting ${(br.default.cdp_browser_version || {}).product}`,
  required_environment: ['Playwright headless launch'], constraint_refs: [], status: 'RUN', note: 'the D12 executable field named chromium.executablePath() instead (D18R R-53)', source_ref: `${relpath(ev)}/identity/browser-*.json`, owner: `${E} (derived from the evidence named by its edges)` });
N({ id: FSET, class: 'COMPUTATIONAL_FACT', fact_id: FSET, subject: `${E} minimum affected physical test set`, predicate: `${SEL.evaluated} current RUN/OBS facts evaluated against environment drift, implementation change and obligations: ${SEL.selected} selected (environment ${SEL.selected_by.environment}, implementation ${SEL.selected_by.implementation}, obligation ${SEL.selected_by.obligation}), ${pass} re-proved, ${fail} failed, ${SEL.gaps.length} without a runbook entry; the other ${SEL.evaluated - SEL.selected} keep their evidence (no drift, implementation unchanged)`,
  required_environment: [], constraint_refs: [], status: fail || SEL.gaps.length ? 'ERR' : 'RUN', note: `groups: ${Object.keys(SEL.groups).join(', ')}`, source_ref: `${relpath(ev)}/selection.json`, owner: `${E} (derived from the evidence named by its edges)` });
for (const [f, evs, env] of [[FID, [eHost, eTc, eRepo, eBd, eBg, eTips, eSel], HOST], [FEXE, [eBd, eBg], BD], [FSET, [eSel, ...Object.values(groupEv).flatMap(s => [...s])], HOST]]) {
  edge('PROBED_BY', f, f === FSET ? PSEL : f === FEXE ? PR.browser_probe : PID); for (const e of evs) edge('EVIDENCED_BY', f, e);
  edge('REQUIRES', f, env); edge('IMPLEMENTED_BY', f, IMPL);
}
edge('STALE_IF', FID, HOST, { condition: { dimension: 'toolchain.nightly.rustc_commit', relation: 'another pinned nightly' } });
edge('STALE_IF', FID, BD, { condition: { dimension: 'browser.revision', relation: 'another browser build' } });
edge('STALE_IF', FEXE, BD, { condition: { dimension: 'browser.revision', relation: 'another Playwright or browser build' } });
edge('STALE_IF', FSET, HOST, { condition: { dimension: 'repo.commit', relation: 'any later change of an implementation or environment' } });
for (const au of PR.executable_authorities) edge('AUTHORIZES', au, FEXE);
for (const cl of PR.executable_clauses) edge('GROUNDS', cl, FEXE);
// obligations discharged
const fulfilled = [];
for (const ob of SEL.obligations.filter(x => x.mapped)) {
  const okGroups = ob.mapped.groups.every(gr => results[gr] ? results[gr].status === 'PASS' : gr === 'identity');
  if (!okGroups) continue;
  const evs = ob.mapped.groups.flatMap(gr => groupEv[gr] ? [...groupEv[gr]] : gr === 'identity' ? [eBd, eBg] : []);
  for (const e of evs) edge('FULFILLS', e, ob.reconciliation, { obligation: ob.obligation });
  fulfilled.push(ob.reconciliation);
}
const epoch = { schema: 'facttest-environment-map-epoch/1', epoch: E, delta: o.delta, commit: o.commit,
  summary: `re-proof: ${SEL.selected} of ${SEL.evaluated} current RUN/OBS facts selected by environment drift, implementation change and obligations; ${pass} re-proved, ${fail} failed; obligations fulfilled ${fulfilled.join(', ') || 'none'}; environments ${[HOST, BD, BG, SRC].join(', ')}`,
  node_classes: undefined,
  edge_semantics: o.declare ? { FULFILLS: { from: ['EVIDENCE'], to: ['RECONCILIATION'], requires: ['obligation'], meaning: 'the evidence discharges the probe obligation the reconciliation addressed to a later pass' } } : undefined,
  nodes, edges };
writeFileSync(o.out, JSON.stringify(epoch, null, 1) + '\n');
console.log(`${E}: ${nodes.length} nodes, ${edges.length} edges -> ${o.out}; re-proved ${pass}, failed ${fail}; fulfilled ${fulfilled.join(' ')}`);
if (fail) process.exit(1);
