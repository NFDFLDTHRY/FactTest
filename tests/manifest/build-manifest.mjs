// CURRENT EXECUTION MANIFEST builder (D21; design/materialization/D21-INTENDED-EXECUTION-MANIFEST.md).
// Usage: node tests/manifest/build-manifest.mjs --components FILE --graph FILE [--root DIR] [--rev REV] [--delta ID]
//        [--epoch D21] --out DIR
// Enumeration rule: the tree at REV (default HEAD) plus the LIVE-tier files the working tree adds beyond it (the machinery
// the current delta introduces); the current delta's own records - its receipts (--delta), its evidence package and
// epoch (--epoch), its observed record - are outputs of the delta and are never enumerated by its own manifest, so the
// manifest rebuilds byte-identically before and after integration.  A live tool reading the --epoch package is not
// reading history.
// Reconstructs, from the repository alone, what the current executable FactTest is:
//   files        every tracked path (git ls-files) is assigned to exactly one component of the reviewed register
//                (tests/manifest/components.json) by its most specific path entry; the rest is a finding
//   stations     which registered stations are authorized to change each component's files (factory/registry, literal
//                cover rule of factory/src/paths.rs), and which station/delta last receipted each file
//   crates       the Cargo-resolved dependency DAG (cargo metadata --no-deps --offline) fills the crate components'
//                dependencies and consumers; a declared consumer that cargo does not know is a finding
//   graph        IMPLEMENTATION nodes mapped to components; the current facts (not superseded, not resolved) that rest
//                on them, their probes, their evidence paths and their STALE_IF dimensions
//   tests        the test/script files that reference a component (path, crate name or template file name)
//   fixtures     fixture-tier files that no test, script, fixture command or cargo manifest reaches (dead fixtures)
//   findings     unassigned paths, live paths without an authorized station, live components without a test, without
//                a graph implementation, without a governing claim, without a consumer; implementation nodes whose
//                repository path does not exist; live tools that read historical evidence packages; required coverage
// Writes DIR/manifest.json and DIR/CURRENT-EXECUTION-MANIFEST.md (deterministic).  Generic: names no component.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const a = process.argv.slice(2); const o = { root: '.' };
for (let i = 0; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const J = p => JSON.parse(readFileSync(p, 'utf8'));
const git = args => { const r = spawnSync('git', ['-C', o.root, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 }); if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`); return r.stdout; };
const C = J(o.components); const g = J(o.graph);
const rev = git(['rev-parse', o.rev || 'HEAD']).trim();
const treeFiles = git(['ls-tree', '-r', '--name-only', rev]).split('\n').filter(Boolean);
const untracked = git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean);
const addedSince = o.rev ? git(['diff', '--name-only', '--diff-filter=A', rev]).split('\n').filter(Boolean) : [];
const candidates = new Set([...untracked, ...addedSince].filter(f => existsSync(join(o.root, f))));
const allFiles = [...new Set([...treeFiles, ...candidates])].sort();
const head = rev;

// ------------------------------------------------------------------ path assignment (most specific entry wins)
const covers = (s, p) => s === '*' || (s.endsWith('/') ? p.startsWith(s) : p === s);
const assign = new Map(); const ambiguous = [];
for (const f of allFiles) {
  let best = null, bestLen = -1, tie = [];
  for (const c of C.components) {
    if ((c.exclude || []).some(x => covers(x, f))) continue;
    for (const p of c.paths) if (covers(p, f)) { if (p.length > bestLen) { best = c.id; bestLen = p.length; tie = [c.id]; } else if (p.length === bestLen) tie.push(c.id); }
  }
  if (tie.length > 1) ambiguous.push(`${f}: ${tie.join(', ')}`);
  if (best) assign.set(f, best);
}
const LIVE = new Set(['PRODUCTION', 'FACTORY', 'TEST']);
const tierOf = f => (C.components.find(c => c.id === assign.get(f)) || {}).tier;
const addedLive = [...candidates].filter(f => LIVE.has(tierOf(f))).sort();
const files = [...new Set([...treeFiles, ...addedLive])].sort();
const fileSet = new Set(files);
const unassigned = files.filter(f => !assign.has(f));
const byComp = new Map(C.components.map(c => [c.id, []]));
for (const [f, id] of assign) if (fileSet.has(f)) byComp.get(id).push(f);

// ------------------------------------------------------------------ stations (registry) and receipts
const regDir = join(o.root, 'factory/registry/stations');
const stations = readdirSync(regDir).filter(f => f.endsWith('.json')).sort().map(f => J(join(regDir, f)));
const authorized = f => stations.filter(s => s.may_change.some(m => covers(m, f)) && !s.must_not_change.some(m => covers(m, f))).map(s => s.station_id);
const deltaOwned = f => /^factory\/(deltas|fixtures|receipts)\//.test(f);
// delta order = order in which each receipts directory entered the history
const revs = git(['rev-list', '--reverse', 'HEAD']).split('\n').filter(Boolean); const revIndex = new Map(revs.map((r, i) => [r, i]));
const recDir = join(o.root, 'factory/receipts');
const deltaOrder = new Map();
for (const d of readdirSync(recDir).sort()) { if (d === o.delta) continue; const c = git(['log', '--diff-filter=A', '--format=%H', '--', `factory/receipts/${d}`]).trim().split('\n').filter(Boolean).pop(); deltaOrder.set(d, c ? revIndex.get(c) : -1); }
const lastReceipt = new Map(); const receiptCount = new Map();
for (const d of [...deltaOrder.keys()].sort((x, y) => deltaOrder.get(x) - deltaOrder.get(y))) {
  for (const f of readdirSync(join(recDir, d)).filter(x => /^F.*\.json$/.test(x)).sort()) {
    const r = J(join(recDir, d, f));
    for (const p of r.changed_paths || []) { lastReceipt.set(p, { delta: r.delta_id, station: r.station_id, fixture: r.fixture_id }); receiptCount.set(p, (receiptCount.get(p) || 0) + 1); }
  }
}

// ------------------------------------------------------------------ cargo
let cargo = { packages: [] };
{ const r = spawnSync('cargo', ['+1.94.1', 'metadata', '--format-version', '1', '--no-deps', '--offline'], { cwd: o.root, encoding: 'utf8', maxBuffer: 1 << 28 }); if (r.status === 0) cargo = JSON.parse(r.stdout); }
const crateComp = new Map(C.components.filter(c => c.crate).map(c => [c.crate, c.id]));
const cargoDeps = new Map(cargo.packages.map(p => [p.name, p.dependencies.map(d => d.name).sort()]));
const cargoTargets = new Map(cargo.packages.map(p => [p.name, p.targets.map(t => `${t.kind.join('/')}:${t.name}`)]));

// ------------------------------------------------------------------ graph
const ids = new Map(g.nodes.map(n => [n.id, n]));
const superseded = new Set(g.edges.filter(e => e.type === 'SUPERSEDES').map(e => e.to));
const resolved = new Set(g.edges.filter(e => e.type === 'RECONCILES' && (ids.get(e.from) || {}).outcome === 'RESOLVED').map(e => e.to));
const current = n => !superseded.has(n.id) && !resolved.has(n.id);
const expand = rp => String(rp).split(' + ').flatMap(part => { const m = part.match(/^(.*)\{([^}]*)\}(.*)$/); return m ? m[2].split(',').map(x => m[1] + x.trim() + m[3]) : [part.trim()]; });
const implNodes = g.nodes.filter(n => n.class === 'IMPLEMENTATION');
const implPaths = new Map(implNodes.map(n => [n.id, expand(n.repo_path)]));
const implOfComp = new Map(); const implMissing = [];
for (const n of implNodes) {
  const comps = new Set();
  for (const p of implPaths.get(n.id)) {
    const hits = files.filter(f => covers(p.endsWith('/') ? p : p, f) || (!p.endsWith('/') && f.startsWith(p + '/')));
    if (!hits.length) implMissing.push(`${n.id}: ${p}`);
    for (const f of hits) if (assign.has(f)) comps.add(assign.get(f));
  }
  for (const c of comps) (implOfComp.get(c) || implOfComp.set(c, []).get(c)).push(n.id);
}
const out = (id, t) => g.edges.filter(e => e.from === id && e.type === t);
const inc = (id, t) => g.edges.filter(e => e.to === id && e.type === t);
const probesOfImpl = new Map(); for (const p of g.nodes.filter(n => n.class === 'PROBE')) (probesOfImpl.get(p.implemented_by) || probesOfImpl.set(p.implemented_by, []).get(p.implemented_by)).push(p.id);
function claims(compId) {
  const impls = implOfComp.get(compId) || []; const facts = new Set(); const probes = new Set(); const evidence = new Set(); const dims = new Set();
  for (const i of impls) {
    for (const e of inc(i, 'IMPLEMENTED_BY')) { const f = ids.get(e.from); if (f && f.class === 'COMPUTATIONAL_FACT' && current(f)) facts.add(f.id); }
    for (const p of probesOfImpl.get(i) || []) { probes.add(p); for (const e of inc(p, 'PROBED_BY')) { const f = ids.get(e.from); if (f && current(f)) facts.add(f.id); } }
  }
  for (const f of facts) {
    for (const e of out(f, 'PROBED_BY')) probes.add(e.to);
    for (const e of out(f, 'EVIDENCED_BY')) { const ev = ids.get(e.to); if (ev && ev.artifact_identity && ev.artifact_identity.path) evidence.add(ev.artifact_identity.path); }
    for (const e of out(f, 'STALE_IF')) dims.add(e.condition.dimension);
  }
  const byStatus = {}; for (const f of facts) { const s = ids.get(f).status; byStatus[s] = (byStatus[s] || 0) + 1; }
  return { implementations: impls.sort(), facts: [...facts].sort(), facts_by_status: byStatus, probes: [...probes].sort(), evidence: [...evidence].sort(), stale_dimensions: [...dims].sort() };
}

// ------------------------------------------------------------------ test references and fixture reachability
const isTestFile = f => /^(compiler\/kernel\/tests\/|factory\/tests\/|tests\/.*\.(sh|mjs)$|host\/harness\/.*\.mjs$|compiler\/[^/]+\/src\/tests_[^/]+\.rs$)/.test(f);
const testFiles = files.filter(isTestFile);
const texts = new Map(); const text = f => { if (!texts.has(f)) texts.set(f, readFileSync(join(o.root, f), 'utf8')); return texts.get(f); };
const fixtureJsonTexts = files.filter(f => /^factory\/fixtures\/.*\.json$/.test(f)).map(text);
function refsOf(c) {
  const keys = new Set(byComp.get(c.id) || []);
  if (c.crate) { keys.add(c.crate); keys.add(c.crate.replace(/-/g, '_')); }
  for (const f of byComp.get(c.id) || []) if (/templates\//.test(f)) keys.add(basename(f));
  const refs = [];
  for (const t of testFiles) { if (keys.has(t)) continue; const body = text(t); if ([...keys].some(k => body.includes(k))) refs.push(t); }
  return refs.sort();
}
const reachable = new Set();
for (const f of files) {
  if (!/^fixtures\//.test(f) || f.startsWith('fixtures/reference/')) continue;
  const b = basename(f); const hay = [...testFiles.map(text), ...fixtureJsonTexts];
  if (hay.some(t => t.includes(f) || (b.length >= 8 && t.includes(b)))) { reachable.add(f); continue; }
  // a cargo project: its src/ and Cargo.lock are reached through the manifest that names the project
  const parts = f.split('/'); for (let i = parts.length - 1; i > 1; i--) { const dir = parts.slice(0, i).join('/'); if (fileSet.has(dir + '/Cargo.toml') && hay.some(t => t.includes(dir + '/Cargo.toml') || t.includes(dir))) { reachable.add(f); break; } }
}
const deadFixtures = files.filter(f => /^fixtures\//.test(f) && !f.startsWith('fixtures/reference/') && !reachable.has(f));
const evidenceReaders = [];
for (const f of files) if (LIVE.has(tierOf(f)) && /\.(mjs|sh|rs|js|html)$/.test(f)) { const m = (text(f).match(/evidence\/D[0-9A-Z-]+\/[^'"` )]*/g) || []).filter(x => !o.epoch || !x.startsWith(`evidence/${o.epoch}/`)); if (m.length) evidenceReaders.push({ file: f, references: [...new Set(m)].sort() }); }

// ------------------------------------------------------------------ components
const comps = C.components.map(c => {
  const fs = (byComp.get(c.id) || []).sort();
  const auth = new Map(); const noStation = [];
  for (const f of fs) { const s = authorized(f); if (!s.length && !deltaOwned(f)) noStation.push(f); for (const x of s) auth.set(x, (auth.get(x) || 0) + 1); }
  const recs = {}; let last = null;
  for (const f of fs) { const r = lastReceipt.get(f); if (r) { recs[r.station] = (recs[r.station] || 0) + 1; if (!last || (deltaOrder.get(r.delta) || 0) >= (deltaOrder.get(last.delta) || 0)) last = r; } }
  const unreceipted = fs.filter(f => !lastReceipt.has(f) && !deltaOwned(f) && !candidates.has(f));
  const row = { ...c, files: fs.length, file_list: fs, authorized_stations: [...auth.keys()].sort(), files_without_authorized_station: noStation, receipted_by_station: recs, last_receipt: last, files_never_receipted: unreceipted, test_references: LIVE.has(c.tier) ? refsOf(c) : [], graph: claims(c.id) };
  if (c.crate) { row.cargo_dependencies = (cargoDeps.get(c.crate) || []).map(d => crateComp.get(d) || d); row.cargo_consumers = [...cargoDeps].filter(([, d]) => d.includes(c.crate)).map(([n]) => crateComp.get(n) || n).sort(); row.cargo_targets = cargoTargets.get(c.crate) || []; row.dependencies = row.cargo_dependencies; row.declared_consumers = c.consumers; row.consumers = [...new Set([...c.consumers, ...row.cargo_consumers])]; }
  return row;
});
const findings = {
  unassigned_paths: unassigned, ambiguous_assignments: ambiguous,
  live_files_without_authorized_station: comps.filter(c => LIVE.has(c.tier)).flatMap(c => c.files_without_authorized_station),
  live_files_never_receipted: comps.filter(c => LIVE.has(c.tier)).flatMap(c => c.files_never_receipted),
  live_components_without_test: comps.filter(c => LIVE.has(c.tier) && !c.historical_tool && !c.test_references.length && !(c.focused_tests || []).some(t => t !== 'none current')).map(c => c.id),
  live_components_without_graph_implementation: comps.filter(c => LIVE.has(c.tier) && !c.historical_tool && !c.graph.implementations.length).map(c => c.id),
  live_components_without_governing_claim: comps.filter(c => LIVE.has(c.tier) && !c.historical_tool && !c.graph.facts.length).map(c => c.id),
  components_without_consumer: comps.filter(c => !(c.consumers || []).length).map(c => c.id),
  components_without_owner: comps.filter(c => !(c.owner || []).length).map(c => c.id),
  implementation_paths_missing: implMissing.sort(),
  graph_implementations_unmapped: implNodes.filter(n => ![...implOfComp.values()].flat().includes(n.id)).map(n => n.id).sort(),
  declared_crate_consumers_unknown_to_cargo: comps.filter(c => c.crate).flatMap(c => c.declared_consumers.filter(d => /^[a-z-]+$/.test(d) && C.components.some(x => x.crate === 'factc-' + d || x.id === 'CRATE-' + d.toUpperCase()) && !c.cargo_consumers.some(x => x === 'CRATE-' + d.toUpperCase())).map(d => `${c.id} -> ${d}`)).sort(),
  dead_fixtures: deadFixtures,
  historical_tools: comps.filter(c => c.historical_tool).map(c => c.id),
  live_tools_reading_evidence_packages: evidenceReaders,
  required_coverage_missing: Object.entries(C.required_coverage).flatMap(([area, m]) => Object.entries(m).flatMap(([item, cs]) => cs.filter(id => !comps.find(c => c.id === id && LIVE.has(c.tier))).map(id => `${area} / ${item}: ${id}`))),
};
const tierCounts = {}; for (const c of comps) tierCounts[c.tier] = (tierCounts[c.tier] || 0) + c.files;
const manifest = { schema: 'facttest-execution-manifest/1', tool: 'tests/manifest/build-manifest.mjs', rev: head, enumerated: `the tree at ${head.slice(0, 9)} plus ${addedLive.length} live file(s) the working tree adds`, added_live_files: addedLive, excluded_current_delta: o.delta || null, tracked_files: files.length, graph_epochs: (g.epochs || []).map(e => e.epoch), stations: stations.map(s => `${s.station_id} v${s.version}`), tiers: C.tiers, files_by_tier: tierCounts, required_coverage: C.required_coverage, components: comps, findings };
mkdirSync(o.out, { recursive: true });
writeFileSync(join(o.out, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');

// ------------------------------------------------------------------ render
const L = []; const P = s => L.push(s);
P('# CURRENT EXECUTION MANIFEST'); P('');
P(`STATUS: GENERATED by tests/manifest/build-manifest.mjs from the tree at ${head} plus the ${addedLive.length} live file(s) the delta adds (${files.length} files; graph epochs ${manifest.graph_epochs.join(' ')}); never edited by hand.  Law: design/materialization/D21-INTENDED-EXECUTION-MANIFEST.md.  Issue inventory: tests/manifest/issues.json (classified A..G).`); P('');
P('## 1. Tiers'); P(''); P('```text');
for (const [t, d] of Object.entries(C.tiers)) P(`${t.padEnd(11)} ${String(tierCounts[t] || 0).padStart(5)} files  ${d}`);
P('```'); P('');
P('## 2. Required coverage'); P(''); P('```text');
for (const [area, m] of Object.entries(C.required_coverage)) for (const [item, cs] of Object.entries(m)) P(`${area.padEnd(13)} ${item.padEnd(24)} ${cs.join(', ')}`);
P('```'); P('');
const areas = [...new Set(comps.map(c => c.area))];
let n = 3;
for (const area of areas) {
  P(`## ${n++}. ${area}`); P('');
  for (const c of comps.filter(x => x.area === area)) {
    P(`### ${c.id}  [${c.tier}]${c.historical_tool ? ' (historical tool)' : ''}`); P(''); P('```text');
    const kv = (k, v) => { if (v === undefined || v === null || (Array.isArray(v) && !v.length)) return; const s = Array.isArray(v) ? v.join('; ') : typeof v === 'object' ? JSON.stringify(v) : String(v); P(`${k.padEnd(22)} ${s}`); };
    kv('paths', c.paths.concat((c.exclude || []).map(x => `(excluding ${x})`))); kv('files', `${c.files}${c.files_never_receipted.length ? `; never receipted: ${c.files_never_receipted.length}` : ''}`);
    kv('owner (law)', c.owner); kv('input', c.input); kv('operation', c.operation); kv('output', c.output);
    kv('dependencies', c.dependencies); kv('consumers', c.consumers); if (c.cargo_consumers) kv('cargo consumers', c.cargo_consumers);
    kv('station (authorized)', c.authorized_stations); kv('station (declared)', c.station); kv('last receipt', c.last_receipt ? `${c.last_receipt.delta} ${c.last_receipt.fixture} (${c.last_receipt.station})` : 'none'); kv('receipts by station', c.receipted_by_station);
    kv('fixture type', c.fixture_type); kv('toolchain / target', c.toolchain_target);
    kv('focused tests', c.focused_tests); kv('test references', c.test_references); kv('task regression', c.task_regression); kv('runtime probe', c.runtime_probe);
    kv('graph implementations', c.graph.implementations); kv('governing claims', c.graph.facts.length ? `${c.graph.facts.length} current (${Object.entries(c.graph.facts_by_status).map(([k, v]) => `${k} ${v}`).join(', ')}): ${c.graph.facts.join(', ')}` : 'none');
    kv('probes', c.graph.probes); kv('evidence', c.graph.evidence.length ? `${c.graph.evidence.length} records (${[...new Set(c.graph.evidence.map(p => p.split('/').slice(0, 2).join('/')))].join(', ')})` : 'none'); kv('stale dimensions', c.graph.stale_dimensions);
    if (c.note) kv('note', c.note);
    P('```'); P('');
  }
}
P(`## ${n}. Findings (automated; each is classified in tests/manifest/issues.json)`); P(''); P('```text');
for (const [k, v] of Object.entries(findings)) { P(`${k} (${v.length})`); for (const x of v) P(`  ${typeof x === 'string' ? x : `${x.file}: ${x.references.join(', ')}`}`); }
P('```');
writeFileSync(join(o.out, 'CURRENT-EXECUTION-MANIFEST.md'), L.join('\n') + '\n');
console.log(`manifest: ${files.length} files, ${comps.length} components (${Object.entries(tierCounts).map(([k, v]) => `${k} ${v}`).join(', ')}); findings ${Object.entries(findings).map(([k, v]) => `${k} ${v.length}`).join(', ')}`);
