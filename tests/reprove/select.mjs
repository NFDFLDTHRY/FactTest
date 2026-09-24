// D19 minimum affected physical test set (design/materialization/D19-INTENDED-REPROVE-REOBSERVE.md section 3).
// Usage: node tests/reprove/select.mjs --graph FILE --identity DIR --dimensions FILE --runbook FILE --obligations FILE
//        [--root DIR] [--pass D19] --out FILE
// For every CURRENT fact (not superseded, not resolved) whose status is RUN or OBS, decide from the graph whether its
// physical evidence still applies:
//   ENVIRONMENT     each STALE_IF (environment, dimension): the value recorded on the ENVIRONMENT node against the current
//                   identity capture (tests/reprove/identity.mjs), by the dimension rule (dimensions file): SAME | DRIFT |
//                   UNK (the recorded identity does not carry a comparable value)
//   IMPLEMENTATION  the repository paths of its IMPLEMENTED_BY implementations and of its probes' implementations changed
//                   after the commit that added its newest physical evidence (git log), or in the working tree
//   OBLIGATION      a reconciliation obligation addressed to this pass ("<pass>:", default D19, not revised) names it
// D20: once a claim was re-proved, the re-proof carried each of its stale conditions to the environments of the new
// evidence (same dimension and relation); such a carried condition supersedes the older one, which is not evaluated again
// (listed as superseded_conditions) - otherwise a drift the re-proof already answered would select the claim forever.
// A fact is SELECTED on any DRIFT, implementation change or obligation.  Each selected fact is mapped to the runbook group
// that re-proves it; a selected fact without a runbook entry is a [GAP] (it stays stale).  UNK dimensions are reported,
// never silently counted as SAME.  Generic: names no fact, environment or dimension outside the data files.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

const a = process.argv.slice(2); const o = { root: '.' };
for (let i = 0; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const J = p => JSON.parse(readFileSync(p, 'utf8'));
const g = J(o.graph); const DIM = J(o.dimensions).dimensions; const RB = J(o.runbook); const OB = J(o.obligations).obligations;
const I = { host: J(join(o.identity, 'host.json')), tc: J(join(o.identity, 'toolchains.json')), repo: J(join(o.identity, 'repo.json')),
  browser: { default: J(join(o.identity, 'browser-default.json')), gpu: J(join(o.identity, 'browser-gpu-flags.json')) }, tips: J(join(o.identity, 'tips.json')) };
const git = args => { const r = spawnSync('git', ['-C', o.root, ...args], { encoding: 'utf8', maxBuffer: 1 << 26 }); return r.status === 0 ? r.stdout.trim() : null; };
const ids = new Map(g.nodes.map(n => [n.id, n]));
const out = (id, t) => g.edges.filter(e => e.from === id && e.type === t);
const inc = (id, t) => g.edges.filter(e => e.to === id && e.type === t);
const superseded = new Set(g.edges.filter(e => e.type === 'SUPERSEDES').map(e => e.to));
const resolved = new Set(g.edges.filter(e => e.type === 'RECONCILES' && (ids.get(e.from) || {}).outcome === 'RESOLVED').map(e => e.to));
const get = (obj, path) => path.split('.').reduce((x, k) => (x == null ? undefined : x[k]), obj);
const firstPath = (obj, paths) => { for (const p of paths || []) { const v = get(obj, p); if (v !== undefined && v !== null && v !== '') return { path: p, value: v }; } return null; };
const expand = p => { const m = p.match(/\{([^}]*)\}/); return m ? m[1].split(',').flatMap(x => expand(p.slice(0, m.index) + x + p.slice(m.index + m[0].length))) : [p]; };
const hex = s => { const m = String(s || '').match(/\b([0-9a-f]{9,40})\b/); return m ? m[1].slice(0, 9) : null; };
const NORM = {
  semver: s => { const m = String(s).match(/(\d+)\.(\d+)\.(\d+)/); if (m) return m[0]; const n = String(s).match(/^v?(\d+)\b/); return n ? `${n[1]}.*` : null; },
  semver4: s => { const m = String(s).match(/\d+\.\d+\.\d+\.\d+/); return m ? m[0] : null; },
  chrome: s => { const m = String(s).match(/\d+\.\d+\.\d+\.\d+/); return m ? m[0] : null; },
  hex: s => hex(String(s).replace(/^@/, '')),
  text: s => String(s),
  origin: s => { const m = String(s).match(/^(https?:\/\/[^:/]+)/); return m ? m[1] : null; },
  bool: s => /^true/.test(String(s)) ? 'true' : /^false/.test(String(s)) ? 'false' : null };
const same = (r, c) => r === c || (r && r.endsWith('.*') && c && c.startsWith(r.slice(0, -1)));
const pinnedNames = Object.keys(I.tc.toolchains).filter(n => !['stable', 'nightly'].includes(n));
const installHint = (env, channel) => { const t = env.toolchain && env.toolchain[channel] || {}; if (t.install_name) return t.install_name.replace(/-x86_64-unknown-linux-gnu$/, '');
  const text = JSON.stringify({ t, o: env.other_state }); return pinnedNames.filter(n => (channel === 'nightly') === n.startsWith('nightly')).find(n => text.includes(n)) || channel; };
const browserOf = env => (JSON.stringify(env).includes('--enable-unsafe-webgpu') ? I.browser.gpu : I.browser.default);
const compName = c => String(c).split(/[\s(]/)[0].replace(/-x86_64-unknown-linux-gnu$/, '');

function evidenceCommit(f) {
  const evs = [...out(f.id, 'EVIDENCED_BY'), ...out(f.id, 'ADMITTED_BY')].map(e => ids.get(e.to)).filter(e => e && e.status === 'RUN' && String(e.evidence_class).startsWith('PHYSICAL'));
  const cs = [];
  for (const e of evs) {
    const a = e.artifact_identity || {}; const m = String(a.sha256 || '').match(/^git-commit:([0-9a-f]{40})$/);
    if (m) cs.push({ evidence: e.id, commit: m[1] });
    else if (a.path && existsSync(join(o.root, a.path))) { const c = git(['log', '--diff-filter=A', '--format=%H', '--', a.path]); if (c) cs.push({ evidence: e.id, commit: c.split('\n').pop() }); }
  }
  if (!cs.length) return { physical_evidence: evs.map(e => e.id), commit: null, newest_envs: [] };
  cs.sort((x, y) => Number(git(['rev-list', '--count', y.commit])) - Number(git(['rev-list', '--count', x.commit])));
  return { physical_evidence: evs.map(e => e.id), commit: cs[0].commit, newest: cs[0].evidence, newest_envs: [...new Set(cs.filter(c => c.commit === cs[0].commit).map(c => ids.get(c.evidence).environment_ref))] };
}
function implPaths(f) {
  const impls = [...out(f.id, 'IMPLEMENTED_BY').map(e => e.to), ...out(f.id, 'PROBED_BY').map(e => (ids.get(e.to) || {}).implemented_by)].filter(Boolean);
  return [...new Set(impls.flatMap(i => (ids.get(i) && ids.get(i).repo_path) ? expand(ids.get(i).repo_path) : []))].sort();
}
const dirty = I.repo.working_tree_changes.map(l => (l.match(/^[ MADRCU?!]{1,2}\s+(?:.* -> )?(.*)$/) || [])[1]).filter(Boolean).map(p => p.trim());
function changedSince(commit, paths) {
  if (!paths.length) return { commits: [], working_tree: [] };
  const commits = commit ? (git(['log', '--format=%h', `${commit}..HEAD`, '--', ...paths]) || '').split('\n').filter(Boolean) : [];
  const wt = dirty.filter(d => paths.some(p => d === p || d.startsWith(p.replace(/\/$/, '') + '/')));
  return { commits, working_tree: wt };
}
function resolve(dim, env, f, ev) {
  const D = DIM[dim]; if (!D) return { verdict: 'UNK', note: 'no rule for this dimension' };
  if (D.kind === 'unk') return { verdict: 'UNK', note: D.reason };
  if (D.kind === 'toolchain_commit' || D.kind === 'toolchain_release' || D.kind === 'toolchain_components' || D.kind === 'toolchain_install') {
    const t = env.toolchain && env.toolchain[D.channel]; const name = installHint(env, D.channel); const cur = I.tc.toolchains[name] || { absent: true };
    if (D.kind === 'toolchain_install') { const want = t && t.install_name; return want ? { verdict: I.tc.installed.some(x => x.startsWith(want)) ? 'SAME' : 'DRIFT', recorded: want, current: I.tc.installed } : { verdict: 'UNK', note: 'no install name recorded' }; }
    if (D.kind === 'toolchain_components') { const rec = t && t.components; if (!rec) return { verdict: 'UNK', note: 'no component list recorded' };
      const have = (cur.components || []).map(compName); const missing = rec.map(compName).filter(c => !have.includes(c));
      return { verdict: missing.length ? 'DRIFT' : 'SAME', recorded: rec, current: `${name}: ${have.join(', ')}`, note: missing.length ? `missing under ${name}: ${missing.join(', ')}` : undefined }; }
    if (D.kind === 'toolchain_release') { const rec = NORM.semver(t && (t.rustc || t.release) || ''); if (!rec) return { verdict: 'UNK', note: 'no release recorded' }; return { verdict: same(rec, cur.release) ? 'SAME' : 'DRIFT', recorded: rec, current: `${name}: ${cur.release}` }; }
    const rec = t ? (hex(t.rustc_commit) || hex(t.rustc)) : (D.channel === 'nightly' ? hex(env.versions && env.versions.rustc) : null);
    if (!rec) return { verdict: 'UNK', note: 'no rustc commit recorded' };
    const c = hex(cur.commit); const where = Object.entries(I.tc.toolchains).filter(([, v]) => hex(v.commit) === rec).map(([k]) => k);
    return { verdict: c === rec ? 'SAME' : 'DRIFT', recorded: rec, current: `${name}: ${c}`, note: c === rec ? undefined : `the rustup name ${name} now resolves to ${c}; ${rec} is installed as ${where.join(', ') || '(none)'}` };
  }
  if (D.kind === 'version') {
    const r = firstPath(env, D.recorded); const src = D.current.startsWith('host.') ? I.host : browserOf(env); const cur = get(src, D.current.replace(/^(host|browser)\./, ''));
    if (!r) return { verdict: 'UNK', note: `nothing recorded at ${D.recorded.join(' | ')}`, current: cur };
    const rn = NORM[D.normalize](r.value), cn = cur === undefined ? null : NORM[D.normalize](cur);
    if (!rn || !cn) return { verdict: 'UNK', note: `not comparable (${r.path}: ${JSON.stringify(r.value).slice(0, 80)})`, current: cur };
    return { verdict: same(rn, cn) ? 'SAME' : 'DRIFT', recorded: rn, current: cn };
  }
  if (D.kind === 'launch_flags') {
    const fl = env.flags || {}; const b = browserOf(env); const launch = b.launch || {};
    if (Array.isArray(fl.launch_args)) { const r = [...fl.launch_args].sort(), c = [...(launch.args || [])].sort(); return { verdict: JSON.stringify(r) === JSON.stringify(c) ? 'SAME' : 'DRIFT', recorded: r, current: c }; }
    if (fl.launch && typeof fl.launch === 'object') return { verdict: JSON.stringify(fl.launch) === JSON.stringify(launch) ? 'SAME' : 'DRIFT', recorded: fl.launch, current: launch };
    return { verdict: 'UNK', note: 'launch recorded as prose' };
  }
  if (D.kind === 'source_tips') {
    const ep = env.introduced_in; const tip = new Map(I.tips.pairs.map(p => [p.key, p]));
    let rec = [];
    const sp = ep && join(o.root, 'evidence', ep, 'clauses', 'summary.json');
    if (env.other_state && Array.isArray(env.other_state.sources)) rec = env.other_state.sources.filter(x => /#/.test(x.key)).map(x => ({ key: x.key, commit: x.commit }));
    else if (sp && existsSync(sp)) rec = J(sp).sources.map(s => { const m = s.key.match(/^(https:\/\/github\.com\/[^#@]+)#([^:]+):/); return m ? { key: `${m[1]}#${m[2]}`, commit: s.commit } : null; }).filter(Boolean);
    else rec = g.nodes.filter(n => n.class === 'AUTHORITY_REVISION' && n.epoch === ep && n.source && n.source.branch && /^https:\/\/github\.com\//.test(n.source.repo)).map(n => ({ key: `${n.source.repo}#${n.source.branch}`, commit: n.source.commit }));
    if (((env.other_state && Array.isArray(env.other_state.sources)) || (sp && existsSync(sp))) && !rec.length) return { verdict: 'SAME', note: 'every source of this epoch is pinned to a commit or an installed file' };
    if (!rec.length) return { verdict: 'UNK', note: 'no tip-read sources recorded for this environment' };
    const moved = [...new Set(rec.filter(x => { const t = tip.get(x.key); return !t || !t.tip || t.tip !== x.commit; }).map(x => { const t = tip.get(x.key); return `${x.key} ${String(x.commit).slice(0, 9)} -> ${t && t.tip ? t.tip.slice(0, 9) : 'UNRESOLVED'}`; }))];
    return { verdict: moved.length ? 'DRIFT' : 'SAME', recorded: `${rec.length} tip-read sources`, current: moved.length ? moved : 'every tip unchanged' };
  }
  if (D.kind === 'repo_paths') {
    const paths = D.paths === 'implementation' ? implPaths(f) : D.paths; const c = changedSince(ev.commit, paths);
    if (!ev.commit) return { verdict: 'UNK', note: 'evidence commit not determinable' };
    return { verdict: c.commits.length || c.working_tree.length ? 'DRIFT' : 'SAME', recorded: `paths at ${ev.commit.slice(0, 9)}`, current: c.commits.length || c.working_tree.length ? c : 'unchanged' };
  }
  return { verdict: 'UNK', note: `unknown kind ${D.kind}` };
}
// obligations addressed to this pass
const revised = r => g.edges.some(e => e.type === 'SUPERSEDES' && e.reconciliation === r && superseded.has(e.from));
const supBy = new Map(g.edges.filter(e => e.type === 'SUPERSEDES').map(e => [e.to, e.from]));
const currentOf = x => { const seen = new Set(); while (supBy.has(x) && !seen.has(x)) { seen.add(x); x = supBy.get(x); } return x; };
// obligation subjects are followed to their current successor (a reconciliation may name the node it superseded)
const obligations = g.nodes.filter(n => n.class === 'RECONCILIATION' && new RegExp(`^${o.pass || 'D19'}:`).test(n.new_probe_obligation || '') && !revised(n.id)).map(n => ({ reconciliation: n.id, obligation: n.new_probe_obligation, subjects: [...new Set(out(n.id, 'RECONCILES').map(e => currentOf(e.to)))].sort(), mapped: OB[n.id] || null }));
const unmapped = obligations.filter(x => !x.mapped).map(x => x.reconciliation);
// an obligation selects the subjects that its own groups re-prove; other subjects are reported, not silently re-proved
const byObligation = new Map(); const notReproved = [];
for (const ob of obligations) for (const s of ob.subjects) {
  const rb = RB.facts[s];
  if (ob.mapped && rb && ob.mapped.groups.includes(rb.group)) (byObligation.get(s) || byObligation.set(s, []).get(s)).push(ob.reconciliation);
  else if (ids.get(s) && ids.get(s).class === 'COMPUTATIONAL_FACT' && !superseded.has(s)) notReproved.push({ reconciliation: ob.reconciliation, fact: s, note: `not re-proved by ${ob.mapped ? ob.mapped.groups.join(', ') : '(unmapped)'}` });
}

const facts = [];
for (const f of g.nodes.filter(n => n.class === 'COMPUTATIONAL_FACT' && !superseded.has(n.id) && !resolved.has(n.id)).sort((x, y) => x.id.localeCompare(y.id))) {
  if (!['RUN', 'OBS'].includes(f.status)) { facts.push({ fact: f.id, status: f.status, selected: false, reason: 'boundary record (not an execution or observation claim)' }); continue; }
  const ev = evidenceCommit(f);
  const cond = e => `${e.condition.dimension}|${e.condition.relation}`; const stale = out(f.id, 'STALE_IF');
  const carried = new Set(stale.filter(e => ev.newest_envs.includes(e.to)).map(cond));
  const supersededConditions = stale.filter(e => !ev.newest_envs.includes(e.to) && carried.has(cond(e))).map(e => `${e.to} ${e.condition.dimension}`);
  const environment = stale.filter(e => !supersededConditions.includes(`${e.to} ${e.condition.dimension}`)).map(e => ({ environment: e.to, dimension: e.condition.dimension, ...resolve(e.condition.dimension, ids.get(e.to), f, ev) }));
  const paths = implPaths(f); const ch = changedSince(ev.commit, paths);
  const implementation = { evidence_commit: ev.commit, newest_evidence: ev.newest || null, physical_evidence: ev.physical_evidence, paths, changed_commits: ch.commits, changed_working_tree: ch.working_tree, verdict: !ev.commit ? (ev.physical_evidence.length ? 'UNDATED' : 'NO_PHYSICAL_EVIDENCE') : (ch.commits.length || ch.working_tree.length ? 'CHANGED' : 'UNCHANGED') };
  const obl = byObligation.get(f.id) || [];
  const reasons = [...(environment.some(x => x.verdict === 'DRIFT') ? ['ENVIRONMENT'] : []), ...(implementation.verdict === 'CHANGED' ? ['IMPLEMENTATION'] : []), ...(obl.length ? ['OBLIGATION'] : [])];
  const rb = RB.facts[f.id] || null;
  facts.push({ fact: f.id, status: f.status, selected: reasons.length > 0, reasons, obligations: obl, runbook: rb ? rb.group : null, gap: reasons.length > 0 && !rb ? 'no runbook entry: the fact stays stale' : undefined, environment, ...(supersededConditions.length ? { superseded_conditions: supersededConditions } : {}), implementation });
}
const sel = facts.filter(x => x.selected);
const groups = {};
for (const x of sel.filter(x => x.runbook)) (groups[x.runbook] = groups[x.runbook] || { kind: RB.groups[x.runbook].kind, facts: [], obligations: [] }).facts.push(x.fact);
for (const ob of obligations.filter(x => x.mapped)) for (const gname of ob.mapped.groups) { (groups[gname] = groups[gname] || { kind: RB.groups[gname].kind, facts: [], obligations: [] }).obligations.push(ob.reconciliation); }
const envPairs = facts.flatMap(x => x.environment || []);
const count = (arr, k) => arr.reduce((m, x) => (m[x[k]] = (m[x[k]] || 0) + 1, m), {});
const res = { tool: 'tests/reprove/select.mjs', graph_epoch: g.current_epoch, head: I.repo.head, working_tree_changes: I.repo.working_tree_changes,
  evaluated: facts.filter(x => x.environment).length, boundary_records: facts.filter(x => !x.environment).length, selected: sel.length,
  selected_by: { environment: sel.filter(x => x.reasons.includes('ENVIRONMENT')).length, implementation: sel.filter(x => x.reasons.includes('IMPLEMENTATION')).length, obligation: sel.filter(x => x.reasons.includes('OBLIGATION')).length },
  gaps: sel.filter(x => !x.runbook).map(x => x.fact), environment_pairs: count(envPairs, 'verdict'),
  drift: [...new Map(envPairs.filter(x => x.verdict === 'DRIFT').map(x => [`${x.environment} ${x.dimension}`, { environment: x.environment, dimension: x.dimension, recorded: x.recorded, current: x.current, note: x.note }])).values()],
  unk: [...new Set(envPairs.filter(x => x.verdict === 'UNK').map(x => `${x.environment} ${x.dimension}: ${x.note}`))].sort(),
  obligations, unmapped_obligations: unmapped, obligation_subjects_not_reproved: notReproved, groups, facts };
mkdirSync(dirname(o.out), { recursive: true }); writeFileSync(o.out, JSON.stringify(res, null, 1) + '\n');
console.log(`evaluated ${res.evaluated} current RUN/OBS facts: selected ${res.selected} (environment ${res.selected_by.environment}, implementation ${res.selected_by.implementation}, obligation ${res.selected_by.obligation}); gaps ${res.gaps.length}; environment pairs ${JSON.stringify(res.environment_pairs)}; groups ${Object.keys(groups).join(', ')}`);
if (unmapped.length) { console.error('unmapped obligations: ' + unmapped.join(' ')); process.exit(1); }
