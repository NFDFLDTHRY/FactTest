// D11 computational-environment map machinery (design/materialization/D11-INTENDED-ENVIRONMENT-MAP.md).
// First-party node ESM, no dependencies.  Generic over the node/edge classes declared INSIDE graph.json: this file knows
// class names, field names and edge semantics, never FactTest facts.
//   validate <graph> [--out FILE]        schema/owner/endpoint/edge-semantics checks (exit 1 = graph malformed)
//   query    <graph> --all --out DIR     Q01..Q15 (the STRUCTURAL QUESTIONS) as deterministic JSON answers
//   query    <graph> --q Qnn [--node ID] one question (to stdout)
//   stale    <graph> [--out FILE]        STALE_IF closure grouped by environment dimension
//   render   <graph> --out DIR           AUTHORITY-REGISTER.md and TRACEABILITY.md (deterministic text)
//   render-check <graph> --dir DIR [--out FILE]   re-render and byte-compare with the committed files
//   paths-probe <repo root> [--out FILE] evaluate every station surface with the literal covers() rule against git ls-files
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

function args(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { const k = a.slice(2); const v = argv[i + 1]; if (v === undefined || v.startsWith('--')) o[k] = true; else { o[k] = v; i++; } }
    else o._.push(a);
  }
  return o;
}
function load(p) { return JSON.parse(readFileSync(p, 'utf8')); }
function writeJson(p, v) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(v, null, 2) + '\n'); }
function byId(g) { const m = new Map(); for (const n of g.nodes) m.set(n.id, n); return m; }
function out(g, id, type) { return g.edges.filter(e => e.from === id && (!type || e.type === type)); }
function inc(g, id, type) { return g.edges.filter(e => e.to === id && (!type || e.type === type)); }
const sortIds = a => [...new Set(a)].sort();

// ------------------------------------------------------------------------------------------------ validate
function validate(g) {
  const checks = [];
  const add = (check, status, detail) => checks.push({ check, status, detail });
  const ids = byId(g);
  const dup = g.nodes.length - ids.size;
  add('node_ids_unique', dup === 0 ? 'PASS' : 'FAIL', dup === 0 ? `${g.nodes.length} nodes` : `${dup} duplicate ids`);
  const classes = g.node_classes || {};
  let badClass = [], missing = [], noOwner = [];
  for (const n of g.nodes) {
    const c = classes[n.class];
    if (!c) { badClass.push(n.id); continue; }
    for (const f of c.required) if (!(f in n)) missing.push(`${n.id}.${f}`);
    if (!n.owner) noOwner.push(n.id);
  }
  add('every_node_class_declared', badClass.length ? 'FAIL' : 'PASS', badClass.join(' '));
  add('required_fields_present', missing.length ? 'FAIL' : 'PASS', missing.slice(0, 20).join(' '));
  add('every_node_has_owner', noOwner.length ? 'FAIL' : 'PASS', noOwner.join(' '));
  const sem = g.edge_semantics || {};
  let badType = [], dangling = [], badEnds = [], noCond = [];
  for (const e of g.edges) {
    const s = sem[e.type];
    if (!s) { badType.push(e.type); continue; }
    const a = ids.get(e.from), b = ids.get(e.to);
    if (!a || !b) { dangling.push(`${e.type} ${e.from} -> ${e.to}`); continue; }
    if (!s.from.includes(a.class) || !s.to.includes(b.class)) badEnds.push(`${e.type} ${a.class}(${e.from}) -> ${b.class}(${e.to})`);
    for (const r of s.requires || []) if (!(r in e)) noCond.push(`${e.type} ${e.from} -> ${e.to} lacks ${r}`);
  }
  add('every_edge_type_has_semantics', badType.length ? 'FAIL' : 'PASS', sortIds(badType).join(' '));
  add('no_dangling_edges', dangling.length ? 'FAIL' : 'PASS', dangling.slice(0, 20).join('; '));
  add('edge_endpoints_match_semantics', badEnds.length ? 'FAIL' : 'PASS', badEnds.slice(0, 20).join('; '));
  add('conditional_edges_carry_condition', noCond.length ? 'FAIL' : 'PASS', noCond.slice(0, 20).join('; '));
  // class-specific laws
  const auth = g.nodes.filter(n => n.class === 'AUTHORITY');
  const pinConflated = auth.filter(n => n.reopen_status === 'DENIED' && n.reproducibility_pin && n.observed_date === n.reproducibility_pin.observed);
  add('authority_pin_separate_from_current', pinConflated.length ? 'FAIL' : 'PASS', pinConflated.map(n => n.id).join(' ') || 'DENIED reopen never inherits the pin date');
  const authNoUrl = auth.filter(n => !n.exact_url);
  add('authority_has_exact_url', authNoUrl.length ? 'FAIL' : 'PASS', authNoUrl.map(n => n.id).join(' '));
  const implAsAuth = g.nodes.filter(n => n.class === 'IMPLEMENTATION' && ('authority_class' in n)).concat(auth.filter(n => 'repo_path' in n));
  add('authority_not_implementation', implAsAuth.length ? 'FAIL' : 'PASS', implAsAuth.map(n => n.id).join(' '));
  const probes = g.nodes.filter(n => n.class === 'PROBE');
  const probeBad = probes.filter(p => !p.proves_fact.length || p.proves_fact.some(f => !ids.has(f) || ids.get(f).class !== 'COMPUTATIONAL_FACT'));
  add('probe_proves_resolvable_facts', probeBad.length ? 'FAIL' : 'PASS', probeBad.map(p => p.id).join(' '));
  const probeNoFail = probes.filter(p => !p.failure_meaning.length);
  add('probe_states_failure_meaning', probeNoFail.length ? 'FAIL' : 'PASS', probeNoFail.map(p => p.id).join(' '));
  const evs = g.nodes.filter(n => n.class === 'EVIDENCE');
  const evNoEnv = evs.filter(e => !ids.has(e.environment_ref) || ids.get(e.environment_ref).class !== 'ENVIRONMENT');
  add('evidence_has_environment', evNoEnv.length ? 'FAIL' : 'PASS', evNoEnv.map(e => e.id).join(' '));
  const evNoProbe = evs.filter(e => !ids.has(e.probe_ref) || ids.get(e.probe_ref).class !== 'PROBE');
  add('evidence_has_probe', evNoProbe.length ? 'FAIL' : 'PASS', evNoProbe.map(e => e.id).join(' '));
  const evNoSha = evs.filter(e => e.status !== 'PENDING' && !(e.artifact_identity && e.artifact_identity.sha256));
  add('evidence_artifact_identity', evNoSha.length ? 'FAIL' : 'PASS', evNoSha.map(e => e.id).join(' ') || 'every non-PENDING evidence carries sha256');
  const pending = evs.filter(e => e.status === 'PENDING').map(e => e.id);
  add('evidence_pending_listed', 'PASS', pending.length ? `PENDING (identity filled after this delta's stations run): ${pending.join(' ')}` : 'none pending');
  const synthetic = g.nodes.filter(n => n.class === 'ENVIRONMENT' && n.environment_class === 'SYNTHETIC_MODEL').map(n => n.id);
  const synthAsRun = evs.filter(e => synthetic.includes(e.environment_ref) && e.status === 'RUN');
  add('synthetic_never_counts_as_run', synthAsRun.length ? 'FAIL' : 'PASS', synthAsRun.map(e => e.id).join(' '));
  const facts = g.nodes.filter(n => n.class === 'COMPUTATIONAL_FACT');
  const runNoEv = facts.filter(f => f.status === 'RUN' && !out(g, f.id, 'EVIDENCED_BY').length && !out(g, f.id, 'ADMITTED_BY').length);
  add('run_facts_have_evidence', runNoEv.length ? 'FAIL' : 'PASS', runNoEv.map(f => f.id).join(' '));
  const badStatus = facts.filter(f => !['RUN', 'ERR', 'GAP', 'UNK', 'OBS'].includes(f.status));
  add('fact_status_vocabulary', badStatus.length ? 'FAIL' : 'PASS', badStatus.map(f => f.id).join(' '));
  const cons = g.nodes.filter(n => n.class === 'CONSTRAINT');
  const consBadRef = cons.filter(c => c.authority_refs.some(a => !ids.has(a) || ids.get(a).class !== 'AUTHORITY'));
  add('constraint_authority_refs_resolve', consBadRef.length ? 'FAIL' : 'PASS', consBadRef.map(c => c.id).join(' '));
  const factBadRef = facts.filter(f => f.constraint_refs.some(c => !ids.has(c) || ids.get(c).class !== 'CONSTRAINT'));
  add('fact_constraint_refs_resolve', factBadRef.length ? 'FAIL' : 'PASS', factBadRef.map(f => f.id).join(' '));
  const invariants = Array.isArray(g.invariants) && g.invariants.length === 11;
  add('prompt_invariants_carried', invariants ? 'PASS' : 'FAIL', `${(g.invariants || []).length} invariants`);
  const status = checks.every(c => c.status === 'PASS') ? 'PASS' : 'FAIL';
  return { tool: 'tests/envmap/envmap.mjs validate', graph_schema: g.schema, nodes: g.nodes.length, edges: g.edges.length, status, checks };
}

// ------------------------------------------------------------------------------------------------ queries
function authoritiesOf(g, ids, factId) {
  const f = ids.get(factId);
  const direct = inc(g, factId, 'AUTHORIZES').map(e => e.from);
  const viaCons = [];
  for (const c of f.constraint_refs || []) for (const e of inc(g, c, 'AUTHORIZES')) viaCons.push(e.from);
  return { direct: sortIds(direct), via_constraints: sortIds(viaCons) };
}
function closure(g, start, type) {
  const seen = new Set(), stack = [...start];
  while (stack.length) { const x = stack.pop(); if (seen.has(x)) continue; seen.add(x); for (const e of out(g, x, type)) stack.push(e.to); }
  for (const s of start) seen.delete(s);
  return sortIds([...seen]);
}
function envIdentity(ids, id) { const n = ids.get(id); return { environment_id: id, class: n.environment_class, toolchain: n.toolchain, host_runtime: n.host_runtime, versions: n.versions, flags: n.flags, origin_security: n.origin_security, implementation_hardware_class: n.implementation_hardware_class, identity_completeness: n.identity_completeness }; }
function evidenceOf(g, ids, factId) {
  const evs = [...out(g, factId, 'EVIDENCED_BY'), ...out(g, factId, 'ADMITTED_BY')].map(e => e.to);
  return sortIds(evs).map(id => { const e = ids.get(id); return { evidence_id: id, status: e.status, evidence_class: e.evidence_class, epoch: e.epoch, environment_ref: e.environment_ref, artifact: e.artifact_identity, observed_result: e.observed_result }; });
}
const Q = {
  Q01: { title: 'Why do we believe this capability works?', perFact: true, fn: (g, ids, f) => ({ fact: f.id, status: f.status, predicate: f.predicate, probes: sortIds(out(g, f.id, 'PROBED_BY').map(e => e.to)), evidence: evidenceOf(g, ids, f.id), admitted_by: sortIds(out(g, f.id, 'ADMITTED_BY').map(e => e.to)), entitled_claim: f.status === 'RUN' ? `claimable for environments ${sortIds(out(g, f.id, 'REQUIRES').map(e => e.to)).join(', ')} only` : `not an execution claim (status ${f.status})` }) },
  Q02: { title: 'Which exact authority permits/requires this behavior?', perFact: true, fn: (g, ids, f) => { const a = authoritiesOf(g, ids, f.id); const all = sortIds([...a.direct, ...a.via_constraints]); return { fact: f.id, constraints: f.constraint_refs, authorities: all.map(id => { const n = ids.get(id); return { id, exact_url: n.exact_url, exact_fragment: n.exact_fragment, authority_class: n.authority_class, reopen_status: n.reopen_status, pin: n.reproducibility_pin ? `${n.reproducibility_pin.repo}@${n.reproducibility_pin.commit} ${n.reproducibility_pin.path}` : null }; }) }; } },
  Q03: { title: 'Which subclauses does that claim depend on?', perFact: true, fn: (g, ids, f) => { const a = authoritiesOf(g, ids, f.id); const start = [...a.direct, ...a.via_constraints]; return { fact: f.id, authorities: sortIds(start), depends_on_closure: closure(g, start, 'DEPENDS_ON'), constraint_dependencies: closure(g, f.constraint_refs, 'DEPENDS_ON') }; } },
  Q04: { title: 'Which toolchain/browser/target state was required?', perFact: true, fn: (g, ids, f) => { const envs = sortIds([...out(g, f.id, 'REQUIRES').map(e => e.to), ...out(g, f.id, 'EXPOSED_BY').map(e => e.to)].filter(id => ids.get(id).class === 'ENVIRONMENT')); const built = sortIds(out(g, f.id, 'IMPLEMENTED_BY').flatMap(e => out(g, e.to, 'BUILT_WITH').map(x => x.to))); return { fact: f.id, required_environment: f.required_environment, environments: envs.map(id => envIdentity(ids, id)), built_with: built }; } },
  Q05: { title: 'What evidence actually executed it?', perFact: true, fn: (g, ids, f) => ({ fact: f.id, executed: evidenceOf(g, ids, f.id).filter(e => e.status === 'RUN' && String(e.evidence_class).startsWith('PHYSICAL')), synthetic_excluded: evidenceOf(g, ids, f.id).filter(e => !String(e.evidence_class).startsWith('PHYSICAL')).map(e => e.evidence_id) }) },
  Q06: { title: 'What becomes stale if rustc changes?', fn: (g, ids) => staleBy(g, ids, d => d.startsWith('toolchain.')) },
  Q07: { title: 'What becomes stale if Chromium changes?', fn: (g, ids) => staleBy(g, ids, d => d.startsWith('browser.')) },
  Q08: { title: 'Which claims require secure context?', fn: (g, ids) => ({ facts: g.nodes.filter(n => n.class === 'COMPUTATIONAL_FACT' && (n.required_environment || []).some(r => /secure_context/.test(r))).map(n => n.id).sort(), constraints: g.nodes.filter(n => n.class === 'CONSTRAINT' && /secure context/i.test(n.statement)).map(n => n.id).sort(), authorities: g.nodes.filter(n => n.class === 'AUTHORITY' && n.secure_context_required).map(n => n.id).sort() }) },
  Q09: { title: 'Which claims have authority but no probe?', fn: (g, ids) => { const res = []; for (const a of g.nodes.filter(n => n.class === 'AUTHORITY')) { const targets = out(g, a.id, 'AUTHORIZES').map(e => e.to); let probed = false; for (const t of targets) { const n = ids.get(t); if (n.class === 'COMPUTATIONAL_FACT' && out(g, t, 'PROBED_BY').length) probed = true; if (n.class === 'CONSTRAINT') { if (out(g, t, 'GOVERNS').length) probed = true; for (const e of out(g, t, 'REQUIRES')) if (out(g, e.to, 'PROBED_BY').length) probed = true; } } if (!probed) res.push({ authority: a.id, authority_class: a.authority_class, authorizes: sortIds(targets), status: targets.length ? 'GAP: no probe reachable' : 'GAP: authorizes nothing' }); } return { unprobed_authorities: res.sort((x, y) => x.authority.localeCompare(y.authority)) }; } },
  Q10: { title: 'Which probes have no governing constraint?', fn: (g, ids) => ({ ungoverned_probes: g.nodes.filter(n => n.class === 'PROBE' && !inc(g, n.id, 'GOVERNS').length && !n.proves_fact.some(f => (ids.get(f).constraint_refs || []).length)).map(n => n.id).sort() }) },
  Q11: { title: 'Which evidence lacks complete environment identity?', fn: (g, ids) => ({ incomplete: g.nodes.filter(n => n.class === 'EVIDENCE').map(e => { const env = ids.get(e.environment_ref); const miss = (env && env.identity_completeness && env.identity_completeness.missing) || []; return { evidence: e.id, environment: e.environment_ref, missing: miss }; }).filter(x => x.missing.length).sort((a, b) => a.evidence.localeCompare(b.evidence)) }) },
  Q12: { title: 'Which implementation contract cites authority too coarsely?', fn: (g, ids) => ({ coarse: g.nodes.filter(n => n.class === 'CONSTRAINT' && n.kind === 'contract').map(c => { const reasons = []; for (const a of c.authority_refs) { const n = ids.get(a); if (!n.exact_fragment) reasons.push(`${a}: no fragment (document root)`); if (String(n.fragment_status).startsWith('FRAGMENT_DRIFT')) reasons.push(`${a}: ${n.fragment_status}`); } for (const u of c.external_refs_unmapped || []) reasons.push(`${u}: unmapped document root`); return { contract: c.id, contract_status: c.contract_status, reasons }; }).filter(x => x.reasons.length).sort((a, b) => a.contract.localeCompare(b.contract)) }) },
  Q13: { title: 'Which [RUN] is valid only for one machine epoch?', fn: (g, ids) => ({ single_epoch_runs: g.nodes.filter(n => n.class === 'COMPUTATIONAL_FACT' && n.status === 'RUN').map(f => { const envs = new Set(out(g, f.id, 'REQUIRES').map(e => e.to).filter(id => ids.get(id).class === 'ENVIRONMENT')); for (const e of out(g, f.id, 'EVIDENCED_BY')) envs.add(ids.get(e.to).environment_ref); return { fact: f.id, environments: sortIds([...envs]) }; }).filter(x => x.environments.length === 1).sort((a, b) => a.fact.localeCompare(b.fact)) }) },
  Q14: { title: 'Where does a proposal get mistaken for baseline semantics?', fn: (g, ids) => ({ proposal_authorizing_run_fact: g.edges.filter(e => e.type === 'AUTHORIZES' && ids.get(e.from).authority_class === 'PROPOSAL' && ids.get(e.to).class === 'COMPUTATIONAL_FACT' && ids.get(e.to).status === 'RUN').map(e => `${e.from} -> ${e.to}`), ready_contract_on_proposal: g.nodes.filter(n => n.class === 'CONSTRAINT' && n.kind === 'contract' && n.contract_status === 'READY-CONTRACT' && n.authority_refs.some(a => ids.get(a).authority_class === 'PROPOSAL')).map(n => n.id), proposals_correctly_bounded: g.nodes.filter(n => n.class === 'AUTHORITY' && n.authority_class === 'PROPOSAL').map(n => ({ authority: n.id, authorizes: sortIds(out(g, n.id, 'AUTHORIZES').map(e => e.to)), conflicts: sortIds(out(g, n.id, 'CONFLICTS_WITH').map(e => e.conflict_id)) })) }) },
  Q15: { title: 'Where does implementation documentation get mistaken for standards law?', fn: (g, ids) => { const implClasses = ['IMPLEMENTATION_DOC', 'IMPLEMENTATION_SOURCE', 'TARGET_DOC', 'TOOL_DOC', 'RUST_REFERENCE']; const stdClasses = ['STANDARD_RELEASE', 'LIVING_STANDARD', 'EDITOR_DRAFT']; const res = []; for (const c of g.nodes.filter(n => n.class === 'CONSTRAINT' && n.kind === 'external')) { const cls = c.authority_refs.map(a => ids.get(a).authority_class); if (cls.some(x => implClasses.includes(x)) && !cls.some(x => stdClasses.includes(x))) res.push({ constraint: c.id, authorities: c.authority_refs, note: 'external constraint grounded only in implementation/tool documentation' }); } const conflicts = g.edges.filter(e => e.type === 'CONFLICTS_WITH' && (implClasses.includes(ids.get(e.from).authority_class) || implClasses.includes(ids.get(e.to).authority_class))).map(e => ({ conflict_id: e.conflict_id, from: e.from, to: e.to, note: e.note })); return { implementation_only_external_constraints: res, implementation_vs_standard_conflicts: conflicts }; } },
};
function staleBy(g, ids, pred) {
  const groups = {};
  for (const e of g.edges.filter(x => x.type === 'STALE_IF' && pred(x.condition.dimension))) {
    const k = e.condition.dimension; (groups[k] = groups[k] || []).push({ subject: e.from, subject_class: ids.get(e.from).class, environment: e.to, relation: e.condition.relation });
  }
  const outp = {};
  for (const k of Object.keys(groups).sort()) outp[k] = groups[k].sort((a, b) => a.subject.localeCompare(b.subject) || a.environment.localeCompare(b.environment));
  return { dimensions: outp, count: Object.values(groups).reduce((n, a) => n + a.length, 0) };
}
function runQuery(g, q, nodeId) {
  const ids = byId(g); const def = Q[q];
  if (!def) throw new Error('unknown query ' + q);
  if (def.perFact) {
    const facts = g.nodes.filter(n => n.class === 'COMPUTATIONAL_FACT' && (!nodeId || n.id === nodeId)).sort((a, b) => a.id.localeCompare(b.id));
    return { query: q, title: def.title, answers: facts.map(f => def.fn(g, ids, f)) };
  }
  return { query: q, title: def.title, answer: def.fn(g, ids) };
}

// ------------------------------------------------------------------------------------------------ render
function renderRegister(g) {
  const L = ['# Authority Register (generated by tests/envmap/envmap.mjs render; do not edit by hand)', '', `Graph: ${g.schema}, delta ${g.delta}, repository ${g.repository_commit}, assembled ${g.assembled}.`,
    'Two identities per authority are kept apart: the CURRENT authority (exact_url + fragment, observed_date, reopen_status) and the REPRODUCIBILITY PIN (source repo @ commit, path, sha256, observed). A DENIED reopen means the published rendering was not verified in D11; the clause was read from the pinned source.', ''];
  const auth = g.nodes.filter(n => n.class === 'AUTHORITY').sort((a, b) => a.id.localeCompare(b.id));
  const byClass = {};
  for (const a of auth) (byClass[a.authority_class] = byClass[a.authority_class] || []).push(a);
  for (const cls of Object.keys(byClass).sort()) {
    L.push(`## ${cls}`, '');
    for (const a of byClass[cls]) {
      L.push(`### ${a.id}`, `- title: ${a.title}`, `- owner: ${a.authority_owner}`, `- maturity: ${a.maturity}`, `- current: ${a.exact_url}${a.exact_fragment || ''}  (observed ${a.observed_date}; reopen ${a.reopen_status}; fragment ${a.fragment_status})`);
      const p = a.reproducibility_pin;
      L.push(p ? `- pin: ${p.repo} @ ${p.commit} ${p.path}${p.sha256 ? ' sha256 ' + p.sha256 : ''} (observed ${p.observed}${p.locator ? '; ' + p.locator : ''})` : '- pin: none');
      L.push(`- consequence: ${a.extracted_consequence}`);
      const authorizes = sortIds(out(g, a.id, 'AUTHORIZES').map(e => e.to)), deps = sortIds(out(g, a.id, 'DEPENDS_ON').map(e => e.to)), conf = out(g, a.id, 'CONFLICTS_WITH').map(e => `${e.conflict_id}:${e.to}`).sort();
      L.push(`- AUTHORIZES: ${authorizes.join(', ') || '(none)'}`, `- DEPENDS_ON: ${deps.join(', ') || '(none)'}`, `- CONFLICTS_WITH: ${conf.join(', ') || '(none)'}`, '');
    }
  }
  return L.join('\n') + '\n';
}
function renderTrace(g) {
  const ids = byId(g);
  const L = ['# Traceability: authority -> constraint -> fact -> probe -> evidence (generated by tests/envmap/envmap.mjs render; do not edit by hand)', '', `Graph: ${g.schema}, delta ${g.delta}, repository ${g.repository_commit}.`, ''];
  const facts = g.nodes.filter(n => n.class === 'COMPUTATIONAL_FACT').sort((a, b) => a.id.localeCompare(b.id));
  for (const f of facts) {
    const a = authoritiesOf(g, ids, f.id);
    L.push(`## ${f.id} [${f.status}]`, `- subject: ${f.subject}`, `- predicate: ${f.predicate}`);
    if (f.note) L.push(`- note: ${f.note}`);
    if (f.source_ref) L.push(`- source: ${f.source_ref}`);
    L.push(`- authorities (direct): ${a.direct.join(', ') || '(none)'}`, `- authorities (via constraints): ${a.via_constraints.join(', ') || '(none)'}`, `- constraints: ${(f.constraint_refs || []).join(', ') || '(none)'}`);
    L.push(`- required environment: ${(f.required_environment || []).join('; ') || '(none stated)'}`);
    L.push(`- environments: ${sortIds(out(g, f.id, 'REQUIRES').map(e => e.to).filter(id => ids.get(id).class === 'ENVIRONMENT')).join(', ') || '(none)'}`);
    L.push(`- probes: ${sortIds(out(g, f.id, 'PROBED_BY').map(e => e.to)).join(', ') || '(none) [GAP]'}`);
    const evs = evidenceOf(g, ids, f.id);
    L.push(evs.length ? '- evidence:' : '- evidence: (none)');
    for (const e of evs) L.push(`  - ${e.evidence_id} [${e.status}/${e.evidence_class}] ${e.artifact.path}${e.artifact.sha256 ? ' sha256 ' + e.artifact.sha256.slice(0, 16) : ' (PENDING)'} env ${e.environment_ref}: ${e.observed_result}`);
    const st = out(g, f.id, 'STALE_IF').map(e => `${e.condition.dimension} (${e.condition.relation}) @ ${e.to}`).sort();
    L.push(`- stale if: ${st.join('; ') || '(no stale relation declared)'}`);
    const fb = out(g, f.id, 'FALLS_BACK_TO').map(e => e.to), inv = out(g, f.id, 'INVALIDATED_BY').map(e => e.to), impl = out(g, f.id, 'IMPLEMENTED_BY').map(e => e.to);
    if (fb.length) L.push(`- falls back to: ${fb.join(', ')}`);
    if (inv.length) L.push(`- invalidated by: ${inv.join(', ')}`);
    L.push(`- implemented by: ${sortIds(impl).join(', ') || '(none)'}`, '');
  }
  L.push('## Stale relations by dimension', '');
  const st = staleBy(g, ids, () => true);
  for (const d of Object.keys(st.dimensions)) { L.push(`- ${d}:`); for (const s of st.dimensions[d]) L.push(`  - ${s.subject} @ ${s.environment} (${s.relation})`); }
  L.push('', '## Conflicts preserved', '');
  for (const e of g.edges.filter(x => x.type === 'CONFLICTS_WITH').sort((a, b) => String(a.conflict_id).localeCompare(String(b.conflict_id)))) L.push(`- ${e.conflict_id}: ${e.from} <-> ${e.to}${e.note ? ' - ' + e.note : ''}`);
  L.push('', '## Environments', '');
  for (const n of g.nodes.filter(x => x.class === 'ENVIRONMENT').sort((a, b) => a.id.localeCompare(b.id))) L.push(`- ${n.id} [${n.environment_class}] ${n.host_runtime || ''}${n.toolchain && n.toolchain.nightly ? '; nightly ' + n.toolchain.nightly.rustc : ''}; missing identity: ${(n.identity_completeness.missing || []).join(', ') || 'none'}`);
  return L.join('\n') + '\n';
}
function render(g, dir) {
  mkdirSync(dir, { recursive: true });
  const reg = renderRegister(g), tr = renderTrace(g);
  writeFileSync(join(dir, 'AUTHORITY-REGISTER.md'), reg); writeFileSync(join(dir, 'TRACEABILITY.md'), tr);
  return { register_bytes: reg.length, traceability_bytes: tr.length };
}
function renderCheck(g, dir) {
  const want = { 'AUTHORITY-REGISTER.md': renderRegister(g), 'TRACEABILITY.md': renderTrace(g) };
  const checks = [];
  for (const [f, text] of Object.entries(want)) {
    const p = join(dir, f);
    const have = existsSync(p) ? readFileSync(p, 'utf8') : null;
    checks.push({ file: f, status: have === text ? 'PASS' : 'FAIL', detail: have === null ? 'missing' : (have === text ? `${text.length} bytes identical` : `differs (${have.length} vs ${text.length} bytes)`) });
  }
  return { tool: 'tests/envmap/envmap.mjs render-check', status: checks.every(c => c.status === 'PASS') ? 'PASS' : 'FAIL', checks };
}

// ------------------------------------------------------------------------------------------------ paths-probe
// The literal rule of factory/src/paths.rs restated: '*' covers everything; 'dir/' covers dir and dir/**; otherwise exact file.
function covers(surface, path) { if (surface === '*') return true; if (surface.endsWith('/')) { const d = surface.slice(0, -1); return d === '' || path === d || path.startsWith(d + '/'); } return path === surface; }
function pathsProbe(root) {
  const ls = spawnSync('git', ['-C', root, 'ls-files'], { encoding: 'utf8' });
  if (ls.status !== 0) return { tool: 'tests/envmap/envmap.mjs paths-probe', status: 'UNK', detail: 'git ls-files failed: ' + ls.stderr };
  const files = ls.stdout.split('\n').filter(Boolean);
  const dir = join(root, 'factory/registry/stations');
  const surfaces = [];
  for (const f of readdirSync(dir).sort()) {
    const s = load(join(dir, f));
    for (const kind of ['may_change', 'must_not_change']) for (const surf of s[kind] || []) {
      const n = files.filter(p => covers(surf, p)).length;
      surfaces.push({ station: s.station_id, kind, surface: surf, matched_paths: n, wildcard_looking: surf !== '*' && surf.includes('*'), verdict: surf !== '*' && surf.includes('*') && n === 0 ? 'DEAD (literal rule: authorizes nothing)' : (n === 0 ? 'matches nothing today' : 'live') });
    }
  }
  const dead = surfaces.filter(x => x.verdict.startsWith('DEAD'));
  return { tool: 'tests/envmap/envmap.mjs paths-probe', rule: "covers(surface, path): '*' | 'dir/' prefix | exact file; no glob (restated from factory/src/paths.rs)", files_considered: files.length, status: 'OBS', dead_wildcard_surfaces: dead.map(x => `${x.station} ${x.kind} ${x.surface}`), surfaces };
}

// ------------------------------------------------------------------------------------------------ main
const o = args(process.argv.slice(2));
const cmd = o._[0];
try {
  if (cmd === 'validate') { const r = validate(load(o._[1])); if (o.out) writeJson(o.out, r); console.log(r.status, r.checks.filter(c => c.status !== 'PASS').map(c => c.check + ': ' + c.detail).join('; ') || `${r.checks.length} checks`); process.exit(r.status === 'PASS' ? 0 : 1); }
  else if (cmd === 'query') { const g = load(o._[1]); if (o.all) { mkdirSync(o.out, { recursive: true }); for (const q of Object.keys(Q).sort()) writeJson(join(o.out, q + '.json'), runQuery(g, q)); console.log(`${Object.keys(Q).length} queries -> ${o.out}`); } else console.log(JSON.stringify(runQuery(g, o.q, o.node), null, 2)); }
  else if (cmd === 'stale') { const g = load(o._[1]); const r = staleBy(g, byId(g), () => true); if (o.out) writeJson(o.out, r); console.log(`stale relations: ${r.count} over ${Object.keys(r.dimensions).length} dimensions`); }
  else if (cmd === 'render') { const r = render(load(o._[1]), o.out); console.log(JSON.stringify(r)); }
  else if (cmd === 'render-check') { const r = renderCheck(load(o._[1]), o.dir); if (o.out) writeJson(o.out, r); console.log(r.status, r.checks.map(c => `${c.file}: ${c.detail}`).join('; ')); process.exit(r.status === 'PASS' ? 0 : 1); }
  else if (cmd === 'paths-probe') { const r = pathsProbe(o._[1]); if (o.out) writeJson(o.out, r); console.log(`${r.status}: dead wildcard surfaces: ${(r.dead_wildcard_surfaces || []).join('; ') || 'none'}`); }
  else { console.error('usage: envmap.mjs <validate|query|stale|render|render-check|paths-probe> ...'); process.exit(2); }
} catch (e) { console.error('envmap: ' + (e && e.stack || e)); process.exit(2); }
