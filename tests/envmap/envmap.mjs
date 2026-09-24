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
// D13 (graph epochs; design/materialization/D13-INTENDED-REPO-HYGIENE.md section 2.6):
//   merge --base-rev REV --epochs A.json,B.json --out FILE   base graph (git show REV:design/environment-map/graph.json)
//                                        + epoch files; nodes/edges are only ADDED, never changed; envelope gains epochs
//   merge-check <graph> --base-rev REV --epochs ...  [--out FILE]  re-merge and byte-compare; every base node/edge kept
//   bind <epoch.json> [--root DIR]       fill sha256/bytes of PENDING evidence nodes from their committed files
// D14 (authority frontier): an epoch file may DECLARE new node_classes / edge_semantics (add-only; an existing name
//   is an error).  Q17 answers "what moved in the authority frontier, and which claims may now be stale?" from the
//   AUTHORITY_REVISION nodes (latest revision per authority in epoch order).
// D15 (clauses): CLAUSE nodes (exact extracted clauses) are validated for authority, extraction identity and
//   connection; TRACEABILITY lists the clauses grounding each fact; Q18 traverses every claim CLAIM -> AUTHORITY ->
//   CLAUSE -> MATURITY -> PIN -> CONSTRAINT -> CONTRACT -> ENVIRONMENT -> PROBE -> EVIDENCE -> STALE and reports where
//   it stops ([GAP] / [ERR] / [UNK]) or COMPLETE.
// D16 (capability universe): CAPABILITY_FAMILY nodes (one per CAPABILITY-MATRIX.md row) are validated for classification
//   vocabulary and step/edge agreement; a clause traced by a family (TRACE_STEP) is connected; Q19 walks every family
//   API -> SECURE_CONTEXT -> PERMISSION_POLICY -> REQUEST -> FEATURES_LIMITS -> LIFECYCLE -> LOSS -> RUNTIME ADMISSION ->
//   PROBE OBLIGATION -> EVIDENCE; TRACEABILITY lists the universe.  Graphs without families render and validate as before.
// D17 (implementation reality): IMPLEMENTATION_BEHAVIOR nodes keep three layers apart and connected - SOURCED_BY only
//   implementation-class clauses, RELATES_TO_STANDARD only standard clauses or constraints, EXPLAINS observed facts; the
//   vocabularies come from the class declaration in the graph.  Q20 lists every behaviour with its three layers.
// D18 (reconciliation): the CURRENT model.  A node is current unless a SUPERSEDES edge (successor -> superseded, same
//   class, naming its RECONCILIATION) points at it; the superseded node stays as history and the successor carries
//   every inheritable edge (declared on SUPERSEDES) mapped through supersession.  RECONCILIATION nodes record what was
//   re-examined (RECONCILES) along AUTHORITY CHANGED -> CONSTRAINT -> FACT -> IMPLEMENTATION CONTRACT -> ENVIRONMENT ->
//   OLD PROBE SUFFICIENT? -> OLD EVIDENCE APPLICABLE? and the outcome (vocabulary declared on the class); LEDGERED_IN
//   records a PROPOSED constraint entered into a project-law ledger.  Queries and renders show the current view
//   (superseded authorities leave the Q18 authority steps; superseded or RESOLVED facts terminate as such); Q21 answers
//   the reconciliation.  Graphs without these edges and nodes answer, validate and render exactly as before.
//   D18R: when a successor is itself superseded later, Q21 names the reconciliation that revised it (revised_by) on the
//   row and on its obligation; a graph without such chains answers as before.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

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
const GRAPH_PATH = 'design/environment-map/graph.json';
function byId(g) { const m = new Map(); for (const n of g.nodes) m.set(n.id, n); return m; }
function out(g, id, type) { return g.edges.filter(e => e.from === id && (!type || e.type === type)); }
function inc(g, id, type) { return g.edges.filter(e => e.to === id && (!type || e.type === type)); }
const sortIds = a => [...new Set(a)].sort();
const SUP = new WeakMap();
function supMap(g) { if (!SUP.has(g)) { const m = new Map(); for (const e of g.edges) if (e.type === 'SUPERSEDES') m.set(e.to, { by: e.from, reconciliation: e.reconciliation }); SUP.set(g, m); } return SUP.get(g); }
const supersededBy = (g, id) => supMap(g).get(id) || null;
const isCurrent = (g, id) => !supMap(g).has(id);
function currentOf(g, id) { let x = id; const seen = new Set(); while (supMap(g).has(x) && !seen.has(x)) { seen.add(x); x = supMap(g).get(x).by; } return x; }
function reconciliationsOf(g, ids, id) { return inc(g, id, 'RECONCILES').map(e => ids.get(e.from)).filter(Boolean).sort((a, b) => a.id.localeCompare(b.id)); }

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
  const revs = g.nodes.filter(n => n.class === 'AUTHORITY_REVISION');
  if (revs.length) {
    const MOV = ['UNCHANGED', 'MOVED', 'EDITORIAL', 'SEMANTIC', 'MATURITY', 'REMOVED', 'SPLIT/MERGED', 'UNREACHABLE', 'AMBIGUOUS'];
    const badRef = revs.filter(r => !ids.has(r.authority_ref) || ids.get(r.authority_ref).class !== 'AUTHORITY' || !out(g, r.id, 'REVISES').some(e => e.to === r.authority_ref));
    add('revision_revises_its_authority', badRef.length ? 'FAIL' : 'PASS', badRef.map(r => r.id).join(' ') || `${revs.length} revisions`);
    const badMov = revs.filter(r => !Array.isArray(r.movement) || !r.movement.length || r.movement.some(m => !MOV.includes(m)));
    add('revision_movement_vocabulary', badMov.length ? 'FAIL' : 'PASS', badMov.map(r => r.id).join(' ') || MOV.join(' '));
    const noEv = revs.filter(r => !out(g, r.id, 'OBSERVED_IN').length);
    add('revision_has_reopen_evidence', noEv.length ? 'FAIL' : 'PASS', noEv.map(r => r.id).join(' '));
  }
  const clauses = g.nodes.filter(n => n.class === 'CLAUSE');
  if (clauses.length) {
    const badC = clauses.filter(c => !ids.has(c.authority_ref) || ids.get(c.authority_ref).class !== 'AUTHORITY' || !out(g, c.id, 'CLAUSE_OF').some(e => e.to === c.authority_ref));
    add('clause_of_its_authority', badC.length ? 'FAIL' : 'PASS', badC.map(c => c.id).join(' ') || `${clauses.length} clauses`);
    const noX = clauses.filter(c => !c.excerpt_sha256 || !c.source || !c.source.commit || !out(g, c.id, 'EXTRACTED_IN').length);
    add('clause_has_extraction_identity', noX.length ? 'FAIL' : 'PASS', noX.map(c => c.id).join(' '));
    const orphan = clauses.filter(c => !out(g, c.id, 'GROUNDS').length && !out(g, c.id, 'LEADS_TO').length && !inc(g, c.id, 'LEADS_TO').length && !inc(g, c.id, 'TRACE_STEP').length && !inc(g, c.id, 'SOURCED_BY').length);
    add('clause_connected', orphan.length ? 'FAIL' : 'PASS', orphan.map(c => c.id).join(' ') || 'every clause grounds something or is on a sublink chain');
  }
  const fams = g.nodes.filter(n => n.class === 'CAPABILITY_FAMILY');
  if (fams.length) {
    const badCls = fams.filter(f => !['RUN', 'OBS', 'GAP', 'ERR', 'UNK'].includes(f.classification));
    add('family_classification_vocabulary', badCls.length ? 'FAIL' : 'PASS', badCls.map(f => f.id).join(' ') || `${fams.length} families`);
    const mism = fams.filter(f => Object.entries(f.steps).some(([s, x]) => x.status !== 'GAP' && x.clauses.some(c => !out(g, f.id, 'TRACE_STEP').some(e => e.to === c && e.step === s))) || out(g, f.id, 'TRACE_STEP').some(e => !(f.steps[e.step] && f.steps[e.step].clauses.includes(e.to))));
    add('family_steps_match_edges', mism.length ? 'FAIL' : 'PASS', mism.map(f => f.id).join(' ') || 'every traced step has its TRACE_STEP edges and nothing else');
  }
  const behs = g.nodes.filter(n => n.class === 'IMPLEMENTATION_BEHAVIOR');
  if (behs.length) {
    const decl = (g.node_classes || {}).IMPLEMENTATION_BEHAVIOR || {};
    const implClasses = decl.implementation_authority_classes || [];
    const clsOf = c => { const n = ids.get(c); return n && n.class === 'CLAUSE' && ids.get(n.authority_ref) ? ids.get(n.authority_ref).authority_class : null; };
    const badRel = behs.filter(b => !(decl.relation_vocabulary || []).includes(b.relation_to_standard) || !(decl.runtime_vocabulary || []).includes(b.runtime_status));
    add('behavior_vocabulary', badRel.length ? 'FAIL' : 'PASS', badRel.map(b => b.id).join(' ') || `${behs.length} behaviours`);
    const badSrc = behs.filter(b => { const s = out(g, b.id, 'SOURCED_BY'); return !s.length || s.some(e => !implClasses.includes(clsOf(e.to))); });
    add('behavior_sourced_by_implementation', badSrc.length ? 'FAIL' : 'PASS', badSrc.map(b => b.id).join(' ') || 'every behaviour rests on implementation-class clauses only');
    const badStd = behs.filter(b => out(g, b.id, 'RELATES_TO_STANDARD').some(e => ids.get(e.to).class === 'CLAUSE' && implClasses.includes(clsOf(e.to))));
    add('behavior_standard_is_not_implementation', badStd.length ? 'FAIL' : 'PASS', badStd.map(b => b.id).join(' ') || 'no behaviour cites an implementation source as standards law');
  }
  const recs = g.nodes.filter(n => n.class === 'RECONCILIATION');
  if (recs.length) {
    const decl = (g.node_classes || {}).RECONCILIATION || {};
    const steps = decl.traversal_steps || [];
    const badR = recs.filter(r => !(decl.outcome_vocabulary || []).includes(r.outcome) || !r.traversal || steps.some(x => !(x in r.traversal)));
    add('reconciliation_vocabulary', badR.length ? 'FAIL' : 'PASS', badR.map(r => r.id).join(' ') || `${recs.length} reconciliations; every traversal step answered`);
    const noSubj = recs.filter(r => !out(g, r.id, 'RECONCILES').length);
    add('reconciliation_has_subject', noSubj.length ? 'FAIL' : 'PASS', noSubj.map(r => r.id).join(' ') || 'every reconciliation re-examines at least one node');
    const resolvedRun = recs.filter(r => r.outcome === 'RESOLVED').flatMap(r => out(g, r.id, 'RECONCILES').filter(e => ids.get(e.to).class !== 'COMPUTATIONAL_FACT' || ids.get(e.to).status === 'RUN').map(e => `${r.id} -> ${e.to}`));
    add('resolved_only_non_run_facts', resolvedRun.length ? 'FAIL' : 'PASS', resolvedRun.join('; ') || 'RESOLVED closes only [ERR]/[GAP]/[UNK]/[OBS] fact records');
    const sup = g.edges.filter(e => e.type === 'SUPERSEDES');
    const badSup = sup.filter(e => { const a = ids.get(e.from), b = ids.get(e.to), r = ids.get(e.reconciliation); return !a || !b || a.class !== b.class || !r || r.class !== 'RECONCILIATION' || r.outcome !== 'SUPERSEDED' || !out(g, r.id, 'RECONCILES').some(x => x.to === e.to); }).map(e => `${e.from} -> ${e.to}`);
    const twice = sortIds(sup.map(e => e.to).filter((x, i, arr) => arr.indexOf(x) !== i)).map(x => `${x} superseded twice`);
    const cyc = sup.filter(e => { let x = e.from; const seen = new Set([e.to]); for (;;) { if (seen.has(x)) return true; seen.add(x); const s = supMap(g).get(x); if (!s) return false; x = s.by; } }).map(e => `cycle at ${e.to}`);
    const allBad = [...badSup, ...twice, ...cyc];
    add('supersession_well_formed', allBad.length ? 'FAIL' : 'PASS', allBad.join('; ') || `${sup.length} supersessions: same class, one successor each, acyclic, each named by a SUPERSEDED reconciliation that re-examined the superseded node`);
    const inh = (sem.SUPERSEDES || {}).inherits || {};
    const have = new Set(g.edges.map(e => JSON.stringify(e)));
    const lack = [];
    for (const e of sup) {
      const rule = inh[(ids.get(e.to) || {}).class] || { out: [], in: [] };
      for (const x of g.edges) {
        if (!((x.from === e.to && rule.out.includes(x.type)) || (x.to === e.to && rule.in.includes(x.type)))) continue;
        const want = { ...x, from: currentOf(g, x.from), to: currentOf(g, x.to) };
        if (!have.has(JSON.stringify(want))) lack.push(`${e.from} lacks ${x.type} ${want.from} -> ${want.to}`);
      }
    }
    add('successor_carries_inherited_edges', lack.length ? 'FAIL' : 'PASS', lack.slice(0, 20).join('; ') || 'every inheritable edge of a superseded node is carried by its current successor');
    const led = g.edges.filter(e => e.type === 'LEDGERED_IN');
    const badL = led.filter(e => ids.get(e.from).ledger_status !== 'PROPOSED' || ids.get(e.to).authority_class !== 'PROJECT_LAW' || !ids.get(e.reconciliation) || ids.get(e.reconciliation).outcome !== 'LEDGERED').map(e => `${e.from} -> ${e.to}`);
    const stillProposed = g.nodes.filter(n => n.class === 'CONSTRAINT' && n.ledger_status === 'PROPOSED' && !led.some(e => e.from === n.id)).map(n => n.id);
    add('ledgered_constraints_well_formed', badL.length ? 'FAIL' : 'PASS', badL.join('; ') || `${led.length} PROPOSED constraints ledgered in project law; still PROPOSED: ${stillProposed.join(' ') || 'none'}`);
    const q17 = Q.Q17.fn(g, ids); const unrec = q17.facts_to_recheck.filter(f => !inc(g, f, 'RECONCILES').length);
    add('stale_facts_reconciled', unrec.length ? 'FAIL' : 'PASS', unrec.join(' ') || `${q17.facts_to_recheck.length} Q17 facts to recheck, each re-examined by a reconciliation`);
  }
  if (g.epochs) {
    const names = g.epochs.map(e => e.epoch);
    const badEpoch = g.nodes.filter(n => n.introduced_in && !names.includes(n.introduced_in)).map(n => n.id);
    const counted = g.epochs.reduce((a, e) => a + e.nodes_added, 0);
    add('epochs_consistent', !badEpoch.length && counted === g.nodes.length ? 'PASS' : 'FAIL', badEpoch.length ? 'unknown epoch on ' + badEpoch.join(' ') : `${names.join(' -> ')}; ${counted} nodes attributed of ${g.nodes.length}`);
  }
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
  Q02: { title: 'Which exact authority permits/requires this behavior?', perFact: true, fn: (g, ids, f) => { const a = authoritiesOf(g, ids, f.id); const all = sortIds([...a.direct, ...a.via_constraints]); return { fact: f.id, constraints: f.constraint_refs, authorities: all.map(id => { const n = ids.get(id); const sb = supersededBy(g, id); return { id, exact_url: n.exact_url, exact_fragment: n.exact_fragment, authority_class: n.authority_class, reopen_status: n.reopen_status, pin: n.reproducibility_pin ? `${n.reproducibility_pin.repo}@${n.reproducibility_pin.commit} ${n.reproducibility_pin.path}` : null, ...(sb ? { superseded_by: sb.by } : {}) }; }) }; } },
  Q03: { title: 'Which subclauses does that claim depend on?', perFact: true, fn: (g, ids, f) => { const a = authoritiesOf(g, ids, f.id); const start = [...a.direct, ...a.via_constraints]; return { fact: f.id, authorities: sortIds(start), depends_on_closure: closure(g, start, 'DEPENDS_ON'), constraint_dependencies: closure(g, f.constraint_refs, 'DEPENDS_ON') }; } },
  Q04: { title: 'Which toolchain/browser/target state was required?', perFact: true, fn: (g, ids, f) => { const envs = sortIds([...out(g, f.id, 'REQUIRES').map(e => e.to), ...out(g, f.id, 'EXPOSED_BY').map(e => e.to)].filter(id => ids.get(id).class === 'ENVIRONMENT')); const built = sortIds(out(g, f.id, 'IMPLEMENTED_BY').flatMap(e => out(g, e.to, 'BUILT_WITH').map(x => x.to))); return { fact: f.id, required_environment: f.required_environment, environments: envs.map(id => envIdentity(ids, id)), built_with: built }; } },
  Q05: { title: 'What evidence actually executed it?', perFact: true, fn: (g, ids, f) => ({ fact: f.id, executed: evidenceOf(g, ids, f.id).filter(e => e.status === 'RUN' && String(e.evidence_class).startsWith('PHYSICAL')), synthetic_excluded: evidenceOf(g, ids, f.id).filter(e => !String(e.evidence_class).startsWith('PHYSICAL')).map(e => e.evidence_id) }) },
  Q06: { title: 'What becomes stale if rustc changes?', fn: (g, ids) => staleBy(g, ids, d => d.startsWith('toolchain.')) },
  Q07: { title: 'What becomes stale if Chromium changes?', fn: (g, ids) => staleBy(g, ids, d => d.startsWith('browser.')) },
  Q08: { title: 'Which claims require secure context?', fn: (g, ids) => ({ facts: g.nodes.filter(n => n.class === 'COMPUTATIONAL_FACT' && (n.required_environment || []).some(r => /secure_context/.test(r))).map(n => n.id).sort(), constraints: g.nodes.filter(n => n.class === 'CONSTRAINT' && /secure context/i.test(n.statement)).map(n => n.id).sort(), authorities: g.nodes.filter(n => n.class === 'AUTHORITY' && n.secure_context_required).map(n => n.id).sort() }) },
  Q09: { title: 'Which claims have authority but no probe?', fn: (g, ids) => { const res = []; for (const a of g.nodes.filter(n => n.class === 'AUTHORITY')) { const targets = out(g, a.id, 'AUTHORIZES').map(e => e.to); let probed = false; for (const t of targets) { const n = ids.get(t); if (n.class === 'COMPUTATIONAL_FACT' && out(g, t, 'PROBED_BY').length) probed = true; if (n.class === 'CONSTRAINT') { if (out(g, t, 'GOVERNS').length) probed = true; for (const e of out(g, t, 'REQUIRES')) if (out(g, e.to, 'PROBED_BY').length) probed = true; } } if (!probed) { const sb = supersededBy(g, a.id); res.push({ authority: a.id, authority_class: a.authority_class, authorizes: sortIds(targets), status: targets.length ? 'GAP: no probe reachable' : 'GAP: authorizes nothing', ...(sb ? { superseded_by: sb.by } : {}) }); } } return { unprobed_authorities: res.sort((x, y) => x.authority.localeCompare(y.authority)) }; } },
  Q10: { title: 'Which probes have no governing constraint?', fn: (g, ids) => ({ ungoverned_probes: g.nodes.filter(n => n.class === 'PROBE' && !inc(g, n.id, 'GOVERNS').length && !n.proves_fact.some(f => (ids.get(f).constraint_refs || []).length)).map(n => n.id).sort() }) },
  Q11: { title: 'Which evidence lacks complete environment identity?', fn: (g, ids) => ({ incomplete: g.nodes.filter(n => n.class === 'EVIDENCE').map(e => { const env = ids.get(e.environment_ref); const miss = (env && env.identity_completeness && env.identity_completeness.missing) || []; return { evidence: e.id, environment: e.environment_ref, missing: miss }; }).filter(x => x.missing.length).sort((a, b) => a.evidence.localeCompare(b.evidence)) }) },
  Q12: { title: 'Which implementation contract cites authority too coarsely?', fn: (g, ids) => ({ coarse: g.nodes.filter(n => n.class === 'CONSTRAINT' && n.kind === 'contract').map(c => { const reasons = []; for (const a of c.authority_refs) { const n = ids.get(a); if (!n.exact_fragment) reasons.push(`${a}: no fragment (document root)`); if (String(n.fragment_status).startsWith('FRAGMENT_DRIFT')) reasons.push(`${a}: ${n.fragment_status}`); } for (const u of c.external_refs_unmapped || []) reasons.push(`${u}: unmapped document root`); return { contract: c.id, contract_status: c.contract_status, reasons }; }).filter(x => x.reasons.length).sort((a, b) => a.contract.localeCompare(b.contract)) }) },
  Q13: { title: 'Which [RUN] is valid only for one machine epoch?', fn: (g, ids) => ({ single_epoch_runs: g.nodes.filter(n => n.class === 'COMPUTATIONAL_FACT' && n.status === 'RUN').map(f => { const envs = new Set(out(g, f.id, 'REQUIRES').map(e => e.to).filter(id => ids.get(id).class === 'ENVIRONMENT')); for (const e of out(g, f.id, 'EVIDENCED_BY')) envs.add(ids.get(e.to).environment_ref); return { fact: f.id, environments: sortIds([...envs]) }; }).filter(x => x.environments.length === 1).sort((a, b) => a.fact.localeCompare(b.fact)) }) },
  Q14: { title: 'Where does a proposal get mistaken for baseline semantics?', fn: (g, ids) => ({ proposal_authorizing_run_fact: g.edges.filter(e => e.type === 'AUTHORIZES' && ids.get(e.from).authority_class === 'PROPOSAL' && ids.get(e.to).class === 'COMPUTATIONAL_FACT' && ids.get(e.to).status === 'RUN').map(e => `${e.from} -> ${e.to}`), ready_contract_on_proposal: g.nodes.filter(n => n.class === 'CONSTRAINT' && n.kind === 'contract' && n.contract_status === 'READY-CONTRACT' && n.authority_refs.some(a => ids.get(a).authority_class === 'PROPOSAL')).map(n => n.id), proposals_correctly_bounded: g.nodes.filter(n => n.class === 'AUTHORITY' && n.authority_class === 'PROPOSAL').map(n => ({ authority: n.id, authorizes: sortIds(out(g, n.id, 'AUTHORIZES').map(e => e.to)), conflicts: sortIds(out(g, n.id, 'CONFLICTS_WITH').map(e => e.conflict_id)) })) }) },
  Q15: { title: 'Where does implementation documentation get mistaken for standards law?', fn: (g, ids) => { const implClasses = ['IMPLEMENTATION_DOC', 'IMPLEMENTATION_SOURCE', 'TARGET_DOC', 'TOOL_DOC', 'RUST_REFERENCE']; const stdClasses = ['STANDARD_RELEASE', 'LIVING_STANDARD', 'EDITOR_DRAFT']; const res = []; for (const c of g.nodes.filter(n => n.class === 'CONSTRAINT' && n.kind === 'external')) { const cls = c.authority_refs.map(a => ids.get(a).authority_class); if (cls.some(x => implClasses.includes(x)) && !cls.some(x => stdClasses.includes(x))) res.push({ constraint: c.id, authorities: c.authority_refs, note: 'external constraint grounded only in implementation/tool documentation' }); } const conflicts = g.edges.filter(e => e.type === 'CONFLICTS_WITH' && (implClasses.includes(ids.get(e.from).authority_class) || implClasses.includes(ids.get(e.to).authority_class))).map(e => ({ conflict_id: e.conflict_id, from: e.from, to: e.to, note: e.note })); return { implementation_only_external_constraints: res, implementation_vs_standard_conflicts: conflicts }; } },
  Q17: { title: 'What moved in the authority frontier, and which claims may now be stale?', fn: (g, ids) => {
    const order = (g.epochs || []).map(e => e.epoch);
    const latest = new Map();
    for (const r of g.nodes.filter(n => n.class === 'AUTHORITY_REVISION')) { const cur = latest.get(r.authority_ref); if (!cur || order.indexOf(r.epoch) > order.indexOf(cur.epoch)) latest.set(r.authority_ref, r); }
    const CONSEQ = { SEMANTIC: 'dependent claims must be re-derived (D18)', REMOVED: 'dependent claims lose their authority (D18)', 'SPLIT/MERGED': 'citations must be re-pointed and claims re-checked',
      MATURITY: 'maturity-sensitive claims (proposal vs standard) must be re-checked', MOVED: 'citation locator stale; clause text unchanged', EDITORIAL: 'no claim change',
      AMBIGUOUS: 'unresolved: the claim keeps the older certainty only as [UNK]', UNREACHABLE: 'current (published) authority unverified in this epoch', UNCHANGED: 'none' };
    const downstream = a => {
      const direct = out(g, a, 'AUTHORIZES').map(e => e.to);
      const cons = direct.filter(x => ids.get(x).class === 'CONSTRAINT');
      const facts = sortIds([...direct.filter(x => ids.get(x).class === 'COMPUTATIONAL_FACT'), ...cons.flatMap(c => out(g, c, 'REQUIRES').map(e => e.to).filter(x => ids.get(x).class === 'COMPUTATIONAL_FACT'))]);
      return { dependent_authorities: sortIds(inc(g, a, 'DEPENDS_ON').map(e => e.from)), constraints: sortIds(cons), facts,
        probes: sortIds([...facts.flatMap(f => out(g, f, 'PROBED_BY').map(e => e.to)), ...cons.flatMap(c => out(g, c, 'GOVERNS').map(e => e.to))]),
        evidence: sortIds(facts.flatMap(f => out(g, f, 'EVIDENCED_BY').map(e => e.to))) };
    };
    const byMovement = {}; const noRevision = []; const rec = g.nodes.some(n => n.class === 'RECONCILIATION');
    for (const a of g.nodes.filter(n => n.class === 'AUTHORITY').sort((x, y) => x.id.localeCompare(y.id))) {
      const r = latest.get(a.id); if (!r) { noRevision.push(a.id); continue; }
      for (const m of r.movement) { if (m === 'UNCHANGED') continue; (byMovement[m] = byMovement[m] || []).push({ authority: a.id, revision: r.id, epoch: r.epoch, locator: r.locator || null, consequence: CONSEQ[m], downstream: downstream(a.id), ...(rec ? { reconciled_by: sortIds(inc(g, a.id, 'RECONCILES').map(e => e.from)), current_authority: currentOf(g, a.id) } : {}) }); }
    }
    // a claim introduced at or after the revision's epoch was derived knowing that revision: it is not made stale by it
    const before = (f, ep) => order.indexOf(ids.get(f).introduced_in || order[0]) < order.indexOf(ep);
    const staleFacts = sortIds(Object.entries(byMovement).filter(([m]) => !['EDITORIAL', 'UNREACHABLE'].includes(m)).flatMap(([, xs]) => xs.flatMap(x => x.downstream.facts.filter(f => before(f, x.epoch)))));
    return { revisions: latest.size, authorities_without_revision: noRevision, movement_counts: Object.fromEntries(Object.entries(byMovement).map(([k, v]) => [k, v.length])), by_movement: byMovement, facts_to_recheck: staleFacts,
      ...(rec ? { facts_reconciled: Object.fromEntries(staleFacts.map(f => [f, { reconciled_by: sortIds(inc(g, f, 'RECONCILES').map(e => e.from)), current: currentOf(g, f) }])), facts_open: staleFacts.filter(f => !inc(g, f, 'RECONCILES').length) } : {}) };
  } },
  Q18: { title: 'Can each current claim be traversed CLAIM -> AUTHORITY -> CLAUSE -> MATURITY -> PIN -> CONSTRAINT -> CONTRACT -> ENVIRONMENT -> PROBE -> EVIDENCE -> STALE, and where does it stop?', perFact: true, fn: (g, ids, f) => {
    const order = (g.epochs || []).map(e => e.epoch);
    const rev = a => g.nodes.filter(n => n.class === 'AUTHORITY_REVISION' && n.authority_ref === a).sort((x, y) => order.indexOf(y.epoch) - order.indexOf(x.epoch))[0] || null;
    const consOf = sortIds([...(f.constraint_refs || []), ...inc(g, f.id, 'REQUIRES').map(e => e.from).filter(x => ids.get(x).class === 'CONSTRAINT')]);
    const auths = sortIds([...inc(g, f.id, 'AUTHORIZES').map(e => e.from), ...consOf.flatMap(c => inc(g, c, 'AUTHORIZES').map(e => e.from))]).filter(a => isCurrent(g, a));
    const clauses = sortIds([...inc(g, f.id, 'GROUNDS').map(e => e.from), ...consOf.flatMap(c => inc(g, c, 'GROUNDS').map(e => e.from))]);
    // D17: an implementation-dependent claim may rest on pinned implementation source clauses (via a behaviour that EXPLAINS it)
    const implClauses = sortIds(inc(g, f.id, 'EXPLAINS').flatMap(e => out(g, e.from, 'SOURCED_BY').map(x => `${x.to} (implementation, ${e.from})`)));
    const contracts = sortIds([...consOf.filter(c => ids.get(c).kind === 'contract'), ...[f.id, ...consOf].flatMap(x => out(g, x, 'IMPLEMENTED_BY').map(e => e.to))]);
    const probes = sortIds(out(g, f.id, 'PROBED_BY').map(e => e.to));
    const evidence = evidenceOf(g, ids, f.id);
    const envs = sortIds([...out(g, f.id, 'REQUIRES').map(e => e.to).filter(x => ids.get(x).class === 'ENVIRONMENT'), ...evidence.map(e => e.environment_ref)]);
    const stale = out(g, f.id, 'STALE_IF').map(e => `${e.condition.dimension} @ ${e.to}`).sort();
    const pins = auths.map(a => { const n = ids.get(a); return n.reproducibility_pin && n.reproducibility_pin.sha256 ? a : null; }).filter(Boolean);
    const maturity = auths.map(a => { const r = rev(a); return { authority: a, class: ids.get(a).authority_class, maturity: ids.get(a).maturity, latest_revision: r ? r.id : null, movement: r ? r.movement : null, published: r ? r.current_authority.status : 'never reopened' }; });
    const steps = [
      ['CURRENT AUTHORITY', auths.length > 0, auths.length ? auths.join(', ') : '[GAP] no authority authorizes the claim or its constraints'],
      ['EXACT CLAUSE', clauses.length + implClauses.length > 0, clauses.length + implClauses.length ? [...clauses, ...implClauses].join(', ') : '[GAP] authority cited at document/locator level only; no extracted clause grounds this claim'],
      ['AUTHORITY MATURITY', maturity.every(m => m.maturity), maturity.every(m => m.maturity) ? maturity.map(m => `${m.authority}:${m.class}${m.latest_revision ? '' : ' (first observed, no reopen yet)'}`).join(', ') + (maturity.some(m => /^UNREACHABLE|^HTTP_4|never reopened/.test(m.published)) ? ' - published rendering unverified [UNK] (source-declared maturity)' : '') : '[GAP] maturity not recorded: ' + maturity.filter(m => !m.maturity).map(m => m.authority).join(', ')],
      ['REPRODUCIBILITY PIN', pins.length === auths.length && auths.length > 0, pins.length === auths.length ? `${pins.length} pinned by commit + sha256` : '[GAP] unpinned authority: ' + auths.filter(a => !pins.includes(a)).join(', ')],
      ['PROJECT CONSTRAINT', consOf.length > 0, consOf.length ? consOf.join(', ') : '[GAP] no project constraint names this claim'],
      ['IMPLEMENTATION CONTRACT', contracts.length > 0, contracts.length ? contracts.join(', ') : '[GAP] no implementation contract / implementation realizes it'],
      ['REQUIRED ENVIRONMENT', envs.length > 0, envs.length ? envs.join(', ') : '[GAP] no environment bound'],
      ['PROBE', probes.length > 0, probes.length ? probes.join(', ') : '[GAP] no probe'],
      ['PHYSICAL EVIDENCE', evidence.some(e => e.status === 'RUN' && String(e.evidence_class).startsWith('PHYSICAL')), evidence.length ? evidence.map(e => `${e.evidence_id}[${e.status}/${e.evidence_class}]`).join(', ') : '[GAP] no evidence'],
      ['STALE CONDITIONS', stale.length > 0, stale.length ? stale.join('; ') : '[GAP] no stale condition declared'] ];
    const firstBreak = steps.find(s => !s[1]);
    const sb = supersededBy(g, f.id); const recs = reconciliationsOf(g, ids, f.id); const resolved = recs.find(r => r.outcome === 'RESOLVED');
    const terminal = sb ? `[SUPERSEDED] by ${sb.by} (${sb.reconciliation}): kept as history, not a current claim` : resolved ? `[RESOLVED] the [${f.status}] record stands as history; resolved by ${resolved.id} (${resolved.subject})`
      : f.status !== 'RUN' ? `[${f.status}] the claim itself is not a run claim: ${f.note || f.predicate}` : firstBreak ? `stops at ${firstBreak[0]}: ${firstBreak[2]}` : 'COMPLETE';
    return { fact: f.id, status: f.status, traversal: steps.map(([step, ok, detail]) => ({ step, ok, detail })), maturity, terminal, ...(recs.length ? { reconciled_by: recs.map(r => `${r.id} ${r.outcome}`) } : {}) };
  } },
  Q19: { title: 'For every approved capability family in G: API -> SECURE_CONTEXT -> PERMISSION_POLICY -> REQUEST -> FEATURES_LIMITS -> LIFECYCLE -> LOSS -> RUNTIME ADMISSION -> PROBE OBLIGATION -> EVIDENCE, and what is it?', fn: (g, ids) => {
    const fams = g.nodes.filter(n => n.class === 'CAPABILITY_FAMILY');
    if (!fams.length) return { families: 0, note: 'no CAPABILITY_FAMILY nodes in this graph' };
    const rows = fams.map(f => {
      const wit = sortIds(out(g, f.id, 'WITNESSED_BY').map(e => e.to).filter(x => isCurrent(g, x)));
      const probes = sortIds(wit.flatMap(w => out(g, w, 'PROBED_BY').map(e => e.to)));
      const evidence = sortIds(wit.flatMap(w => evidenceOf(g, ids, w)).filter(e => e.status === 'RUN').map(e => e.evidence_id));
      const trace = Object.entries(f.steps).map(([step, x]) => ({ step, status: x.status, detail: x.status === 'GAP' ? `[GAP] ${x.reason}` : x.clauses.join(', ') }));
      trace.push({ step: 'RUNTIME ADMISSION', status: f.classification === 'RUN' ? 'ADMITTED' : 'NOT ADMITTED', detail: `${f.admission_contract} -> [${f.classification}] ${f.rationale}` });
      trace.push({ step: 'PROBE OBLIGATION', status: probes.length ? 'PROBED' : 'GAP', detail: `required: ${f.evidence_required}; probes: ${probes.join(', ') || '(none)'}` });
      trace.push({ step: 'EVIDENCE', status: evidence.length ? 'EVIDENCE' : 'GAP', detail: evidence.join(', ') || '(none)' });
      const firstGap = trace.find(t => t.status === 'GAP');
      return { family: f.id, matrix_row: f.matrix_row, in_G: f.in_G, classification: f.classification, census: f.census ? f.census.state : null, maturity: f.maturity, witnesses: wit, trace, first_gap: firstGap ? firstGap.step : null };
    });
    const by = {}; for (const r of rows) (by[r.classification] = by[r.classification] || []).push(r.family);
    const stepStatus = {}; for (const r of rows) for (const t of r.trace.slice(0, 7)) stepStatus[t.status] = (stepStatus[t.status] || 0) + 1;
    return { families: rows.length, in_G: rows.filter(r => r.in_G).length, by_classification: Object.fromEntries(Object.entries(by).map(([k, v]) => [k, v.length])), families_by_classification: by, authority_step_status: stepStatus, rows };
  } },
  Q20: { title: 'Which implementation behaviours does FactTest depend on, pinned where, standing how to standards law, and explaining which observed facts?', fn: (g, ids) => {
    const behs = g.nodes.filter(n => n.class === 'IMPLEMENTATION_BEHAVIOR');
    if (!behs.length) return { behaviors: 0, note: 'no IMPLEMENTATION_BEHAVIOR nodes in this graph' };
    const rows = behs.map(b => ({ behavior: b.id, implementation: b.implementation, version: b.version, relation: b.relation_to_standard, runtime_status: b.runtime_status, statement: b.statement,
      implementation_layer: sortIds(out(g, b.id, 'SOURCED_BY').map(e => e.to)).map(c => { const n = ids.get(c); return { clause: c, authority: n.authority_ref, source: `${String(n.source.repo).replace('https://github.com/', '')}@${String(n.source.commit).slice(0, 12)} ${n.source.path}:${n.locator.line_start}` }; }),
      standard_layer: out(g, b.id, 'RELATES_TO_STANDARD').map(e => ({ ref: e.to, class: ids.get(e.to).class, relation: e.relation })),
      runtime_layer: sortIds(out(g, b.id, 'EXPLAINS').map(e => e.to).filter(x => isCurrent(g, x))).map(f => ({ fact: f, status: ids.get(f).status, environments: sortIds([...out(g, f, 'REQUIRES').map(e => e.to).filter(x => ids.get(x).class === 'ENVIRONMENT'), ...evidenceOf(g, ids, f).map(e => e.environment_ref)]) })),
      stale_if: { dimension: b.environment_dimension, relation: b.stale_if } }));
    const by = {}; for (const r of rows) by[r.relation] = (by[r.relation] || 0) + 1;
    const explained = new Set(rows.flatMap(r => r.runtime_layer.map(x => x.fact)));
    const absent = g.nodes.filter(n => n.class === 'CAPABILITY_FAMILY' && n.census && n.census.state === 'ABSENT').map(n => ({ family: n.id, exposure_facts: out(g, n.id, 'WITNESSED_BY').map(e => e.to).filter(f => ids.get(f).subject && / exposure in /.test(ids.get(f).subject)) }));
    return { behaviors: rows.length, by_relation: by, explained_facts: explained.size, census_absences: absent.map(x => ({ family: x.family, explained_by: rows.filter(r => r.runtime_layer.some(y => x.exposure_facts.includes(y.fact))).map(r => r.behavior) })), rows };
  } },
  Q21: { title: 'What did the reconciliation re-examine (AUTHORITY CHANGED -> CONSTRAINT -> FACT -> IMPLEMENTATION CONTRACT -> ENVIRONMENT -> OLD PROBE SUFFICIENT? -> OLD EVIDENCE APPLICABLE?), what is current now, and which new probe obligations follow?', fn: (g, ids) => {
    const recs = g.nodes.filter(n => n.class === 'RECONCILIATION').sort((a, b) => a.id.localeCompare(b.id));
    if (!recs.length) return { reconciliations: 0, note: 'no RECONCILIATION nodes in this graph' };
    const steps = ((g.node_classes || {}).RECONCILIATION || {}).traversal_steps || [];
    const revisedBy = r => sortIds(g.edges.filter(e => e.type === 'SUPERSEDES' && e.reconciliation === r.id).map(e => supersededBy(g, e.from)).filter(Boolean).map(s => s.reconciliation));
    const rows = recs.map(r => ({ reconciliation: r.id, subject: r.subject, outcome: r.outcome, ...(revisedBy(r).length ? { revised_by: revisedBy(r) } : {}), reconciles: sortIds(out(g, r.id, 'RECONCILES').map(e => e.to)),
      traversal: steps.map(s => ({ step: s, answer: r.traversal[s] })), surfaces: r.surfaces, new_probe_obligation: r.new_probe_obligation, note: r.note,
      supersessions: g.edges.filter(e => e.type === 'SUPERSEDES' && e.reconciliation === r.id).map(e => ({ superseded: e.to, current: e.from })),
      ledgered: g.edges.filter(e => e.type === 'LEDGERED_IN' && e.reconciliation === r.id).map(e => ({ constraint: e.from, ledger: e.to, locator: e.locator })),
      invalidated: g.edges.filter(e => e.type === 'INVALIDATED_BY' && e.reconciliation === r.id).map(e => ({ subject: e.from, by: e.to })) }));
    const by = {}; for (const r of rows) by[r.outcome] = (by[r.outcome] || 0) + 1;
    const facts = g.nodes.filter(n => n.class === 'COMPUTATIONAL_FACT');
    const resolved = new Set(recs.filter(r => r.outcome === 'RESOLVED').flatMap(r => out(g, r.id, 'RECONCILES').map(e => e.to)));
    const current = facts.filter(f => isCurrent(g, f.id) && !resolved.has(f.id));
    const st = {}; for (const f of current) st[f.status] = (st[f.status] || 0) + 1;
    const q17 = Q.Q17.fn(g, ids);
    const cons = g.nodes.filter(n => n.class === 'CONSTRAINT'); const led = new Set(g.edges.filter(e => e.type === 'LEDGERED_IN').map(e => e.from));
    return { reconciliations: rows.length, by_outcome: by,
      stale_facts: { to_recheck: q17.facts_to_recheck.length, reconciled: q17.facts_to_recheck.filter(f => inc(g, f, 'RECONCILES').length).length },
      current_model: { supersessions: g.edges.filter(e => e.type === 'SUPERSEDES').map(e => `${e.to} -> ${e.from}`).sort(),
        facts: { total: facts.length, current: current.length, superseded: facts.filter(f => !isCurrent(g, f.id)).length, resolved: resolved.size, current_by_status: st },
        constraints: { total: cons.length, ledger: cons.filter(c => c.ledger_status !== 'PROPOSED' || led.has(c.id)).length, proposed: cons.filter(c => c.ledger_status === 'PROPOSED' && !led.has(c.id)).map(c => c.id) },
        authorities: { total: g.nodes.filter(n => n.class === 'AUTHORITY').length, superseded: g.nodes.filter(n => n.class === 'AUTHORITY' && !isCurrent(g, n.id)).length } },
      new_probe_obligations: rows.filter(r => r.new_probe_obligation).map(r => ({ reconciliation: r.reconciliation, obligation: r.new_probe_obligation, ...(r.revised_by ? { revised_by: r.revised_by } : {}) })), rows };
  } },
  Q16: { title: 'What did each evidence epoch add, and how is it connected to the earlier graph?', fn: (g, ids) => {
    const epochs = g.epochs || [{ epoch: 'D11' }]; const first = epochs[0].epoch;
    const ep = n => n.introduced_in || first;
    return { epochs: epochs.map(e => {
      const nodes = g.nodes.filter(n => ep(n) === e.epoch); const mine = new Set(nodes.map(n => n.id));
      const byClass = {}; for (const n of nodes) byClass[n.class] = (byClass[n.class] || 0) + 1;
      const facts = nodes.filter(n => n.class === 'COMPUTATIONAL_FACT').sort((a, b) => a.id.localeCompare(b.id)).map(f => ({ fact: f.id, status: f.status,
        probes: sortIds(out(g, f.id, 'PROBED_BY').map(x => x.to)), evidence: sortIds(out(g, f.id, 'EVIDENCED_BY').map(x => x.to)),
        environments: sortIds(out(g, f.id, 'EVIDENCED_BY').map(x => ids.get(x.to).environment_ref)), authorities: sortIds(inc(g, f.id, 'AUTHORIZES').map(x => x.from)) }));
      const cross = g.edges.filter(x => mine.has(x.from) !== mine.has(x.to) && (mine.has(x.from) || mine.has(x.to)) && (ep(ids.get(x.from)) === e.epoch ? true : ep(ids.get(x.to)) === e.epoch)).map(x => `${x.type} ${x.from} -> ${x.to}`).sort();
      return { epoch: e.epoch, delta: e.delta || g.delta, commit: e.commit || g.repository_commit, nodes_by_class: byClass, facts, cross_epoch_edges: cross };
    }) };
  } },
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
function epochLine(g) { return g.epochs ? ` Epochs: ${g.epochs.map(e => `${e.epoch} (${e.delta}, ${String(e.commit).slice(0, 9)}, +${e.nodes_added} nodes/+${e.edges_added} edges)`).join(' -> ')}; current epoch ${g.current_epoch}.` : ''; }
function renderRegister(g) {
  const L = ['# Authority Register (generated by tests/envmap/envmap.mjs render; do not edit by hand)', '', `Graph: ${g.schema}, delta ${g.delta}, repository ${g.repository_commit}, assembled ${g.assembled}.${epochLine(g)}`,
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
      const sb = supersededBy(g, a.id); if (sb) L.push(`- SUPERSEDED by ${sb.by} (${sb.reconciliation}): kept as history; not the current authority`);
      const sups = g.edges.filter(e => e.type === 'SUPERSEDES' && e.from === a.id); if (sups.length) L.push(`- supersedes: ${sups.map(e => `${e.to} (${e.reconciliation})`).join(', ')}`);
      const ledg = sortIds(inc(g, a.id, 'LEDGERED_IN').map(e => e.from)); if (ledg.length) L.push(`- ledgers: ${ledg.join(', ')}`);
      const revs = g.nodes.filter(n => n.class === 'AUTHORITY_REVISION' && n.authority_ref === a.id).sort((x, y) => (g.epochs || []).findIndex(e => e.epoch === x.epoch) - (g.epochs || []).findIndex(e => e.epoch === y.epoch));
      for (const r of revs) L.push(`- ${r.epoch} reopen: movement ${r.movement.join('+')}; published ${r.current_authority.status}; source ${r.source.relation_to_pin}${r.source.commit ? ' @ ' + String(r.source.commit).slice(0, 10) : ''}; fragment ${r.fragment.at_tip}${r.locator ? `; locator ${r.locator.old || '(none)'} -> ${r.locator.new}` : ''}${r.maturity && r.maturity.observed ? '; maturity ' + r.maturity.observed : ''}`);
      const authorizes = sortIds(out(g, a.id, 'AUTHORIZES').map(e => e.to)), deps = sortIds(out(g, a.id, 'DEPENDS_ON').map(e => e.to)), conf = out(g, a.id, 'CONFLICTS_WITH').map(e => `${e.conflict_id}:${e.to}`).sort();
      L.push(`- AUTHORIZES: ${authorizes.join(', ') || '(none)'}`, `- DEPENDS_ON: ${deps.join(', ') || '(none)'}`, `- CONFLICTS_WITH: ${conf.join(', ') || '(none)'}`, '');
    }
  }
  return L.join('\n') + '\n';
}
function renderTrace(g) {
  const ids = byId(g);
  const L = ['# Traceability: authority -> constraint -> fact -> probe -> evidence (generated by tests/envmap/envmap.mjs render; do not edit by hand)', '', `Graph: ${g.schema}, delta ${g.delta}, repository ${g.repository_commit}.${epochLine(g)}`, ''];
  const facts = g.nodes.filter(n => n.class === 'COMPUTATIONAL_FACT').sort((a, b) => a.id.localeCompare(b.id));
  for (const f of facts) {
    const a = authoritiesOf(g, ids, f.id);
    const sbf = supersededBy(g, f.id); const recf = reconciliationsOf(g, ids, f.id); const resf = recf.find(r => r.outcome === 'RESOLVED');
    L.push(`## ${f.id} [${f.status}]${sbf ? ` [SUPERSEDED by ${sbf.by}]` : resf ? ` [RESOLVED by ${resf.id}]` : ''}`, `- subject: ${f.subject}`, `- predicate: ${f.predicate}`);
    if (f.note) L.push(`- note: ${f.note}`);
    if (f.source_ref) L.push(`- source: ${f.source_ref}`);
    const mark = x => isCurrent(g, x) ? x : `${x} (superseded by ${supersededBy(g, x).by})`;
    L.push(`- authorities (direct): ${a.direct.map(mark).join(', ') || '(none)'}`, `- authorities (via constraints): ${a.via_constraints.map(mark).join(', ') || '(none)'}`, `- constraints: ${(f.constraint_refs || []).join(', ') || '(none)'}`);
    for (const r of recf) L.push(`- reconciled: ${r.id} ${r.outcome} - ${r.note}`);
    L.push(`- required environment: ${(f.required_environment || []).join('; ') || '(none stated)'}`);
    L.push(`- environments: ${sortIds(out(g, f.id, 'REQUIRES').map(e => e.to).filter(id => ids.get(id).class === 'ENVIRONMENT')).join(', ') || '(none)'}`);
    const cl = sortIds([...inc(g, f.id, 'GROUNDS').map(e => e.from), ...(f.constraint_refs || []).flatMap(c => inc(g, c, 'GROUNDS').map(e => e.from))]);
    if (cl.length) L.push(`- clauses: ${cl.map(c => { const n = ids.get(c); return `${c} (${String(n.source.repo).replace('https://github.com/', '')}@${String(n.source.commit).slice(0, 10)} ${n.source.path}:${n.locator.line_start})`; }).join('; ')}`);
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
  for (const e of g.edges.filter(x => x.type === 'CONFLICTS_WITH' && isCurrent(g, x.from) && isCurrent(g, x.to)).sort((a, b) => String(a.conflict_id).localeCompare(String(b.conflict_id)))) L.push(`- ${e.conflict_id}: ${e.from} <-> ${e.to}${e.note ? ' - ' + e.note : ''}`);
  const fams = g.nodes.filter(x => x.class === 'CAPABILITY_FAMILY');
  if (fams.length) {
    L.push('', '## Capability universe (G = CAPABILITY-MATRIX.md; Q19 has the full trace)', '');
    for (const f of fams) L.push(`- ${f.id} [${f.classification}] ${f.matrix_row}: census ${f.census ? f.census.state : 'none'}; steps ${Object.entries(f.steps).map(([s, x]) => `${s}=${x.status}`).join(' ')}; witnesses ${sortIds(out(g, f.id, 'WITNESSED_BY').map(e => e.to).filter(x => isCurrent(g, x))).join(', ') || '(none)'}`);
  }
  const behs = g.nodes.filter(x => x.class === 'IMPLEMENTATION_BEHAVIOR');
  if (behs.length) {
    L.push('', '## Implementation behaviour (implementation truth, never standards law; Q20 has the three layers)', '');
    for (const b of behs) L.push(`- ${b.id} [${b.relation_to_standard}; runtime ${b.runtime_status}] ${b.implementation} (${b.version}): ${b.statement}; sources ${sortIds(out(g, b.id, 'SOURCED_BY').map(e => e.to)).join(', ')}; explains ${sortIds(out(g, b.id, 'EXPLAINS').map(e => e.to).filter(x => isCurrent(g, x))).join(', ') || '(none)'}; stale if ${b.environment_dimension}: ${b.stale_if}`);
  }
  const rcs = g.nodes.filter(x => x.class === 'RECONCILIATION').sort((a, b) => a.id.localeCompare(b.id));
  if (rcs.length) {
    L.push('', '## Reconciliation (the current model; Q21 has the traversal)', '');
    for (const r of rcs) L.push(`- ${r.id} [${r.outcome}] ${r.subject}: re-examines ${sortIds(out(g, r.id, 'RECONCILES').map(e => e.to)).join(', ')}${r.new_probe_obligation ? `; obligation: ${r.new_probe_obligation}` : ''}`);
    L.push('', 'Superseded (history) -> current:', '');
    for (const e of g.edges.filter(x => x.type === 'SUPERSEDES').sort((a, b) => a.to.localeCompare(b.to))) L.push(`- ${e.to} -> ${e.from} (${e.reconciliation})`);
    const led = g.edges.filter(x => x.type === 'LEDGERED_IN').sort((a, b) => a.from.localeCompare(b.from));
    if (led.length) { L.push('', 'Ledgered constraints (PROPOSED on the node, now project law):', ''); for (const e of led) L.push(`- ${e.from} -> ${e.to} (${e.locator})`); }
  }
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

// ------------------------------------------------------------------------------------------------ epochs (D13)
function baseGraph(rev) {
  const r = spawnSync('git', ['show', `${rev}:${GRAPH_PATH}`], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`git show ${rev}:${GRAPH_PATH} failed: ${r.stderr}`);
  return JSON.parse(r.stdout);
}
function merge(base, epochFiles) {
  const g = JSON.parse(JSON.stringify(base));
  const first = { epoch: 'D11', delta: base.delta, commit: base.repository_commit, summary: 'computational environment map (origin epoch)', nodes_added: base.nodes.length, edges_added: base.edges.length };
  g.epochs = base.epochs ? [...base.epochs] : [first];
  const ids = new Set(g.nodes.map(n => n.id)); const edgeKeys = new Set(g.edges.map(e => JSON.stringify(e)));
  for (const f of epochFiles) {
    const ep = load(f);
    if (ep.schema !== 'facttest-environment-map-epoch/1') throw new Error(`${f}: schema ${ep.schema}`);
    if (g.epochs.some(e => e.epoch === ep.epoch)) throw new Error(`${f}: epoch ${ep.epoch} already merged`);
    for (const [k, v] of Object.entries(ep.node_classes || {})) { if (g.node_classes[k]) throw new Error(`${f}: node class ${k} already declared`); g.node_classes[k] = { ...v, declared_in: ep.epoch }; }
    for (const [k, v] of Object.entries(ep.edge_semantics || {})) { if (g.edge_semantics[k]) throw new Error(`${f}: edge type ${k} already declared`); g.edge_semantics[k] = { ...v, declared_in: ep.epoch }; }
    for (const n of ep.nodes) {
      if (ids.has(n.id)) throw new Error(`${f}: node ${n.id} already exists (epochs only add nodes)`);
      ids.add(n.id); g.nodes.push({ ...n, introduced_in: ep.epoch });
    }
    for (const e of ep.edges) {
      const k = JSON.stringify(e);
      if (edgeKeys.has(k)) throw new Error(`${f}: duplicate edge ${k}`);
      edgeKeys.add(k); g.edges.push(e);
    }
    g.epochs.push({ epoch: ep.epoch, delta: ep.delta, commit: ep.commit, summary: ep.summary, nodes_added: ep.nodes.length, edges_added: ep.edges.length, ...(ep.node_classes || ep.edge_semantics ? { declares: [...Object.keys(ep.node_classes || {}), ...Object.keys(ep.edge_semantics || {})] } : {}) });
  }
  g.current_epoch = g.epochs[g.epochs.length - 1].epoch;
  return g;
}
function graphText(g) { return JSON.stringify(g, null, 1) + '\n'; }
function mergeCheck(path, rev, epochFiles) {
  const base = baseGraph(rev), have = readFileSync(path, 'utf8'), want = graphText(merge(base, epochFiles));
  const g = JSON.parse(have); const ids = byId(g); const checks = [];
  const changed = base.nodes.filter(n => { const m = ids.get(n.id); if (!m) return true; const { introduced_in, ...rest } = m; return introduced_in !== undefined && introduced_in !== 'D11' || JSON.stringify(rest) !== JSON.stringify(n); }).map(n => n.id);
  checks.push({ check: 'base_nodes_preserved', status: changed.length ? 'FAIL' : 'PASS', detail: changed.length ? changed.join(' ') : `${base.nodes.length} base nodes identical` });
  const keys = new Set(g.edges.map(e => JSON.stringify(e)));
  const lost = base.edges.filter(e => !keys.has(JSON.stringify(e)));
  checks.push({ check: 'base_edges_preserved', status: lost.length ? 'FAIL' : 'PASS', detail: lost.length ? `${lost.length} base edges missing` : `${base.edges.length} base edges present` });
  checks.push({ check: 'graph_equals_merge_of_base_and_epochs', status: have === want ? 'PASS' : 'FAIL', detail: have === want ? `${want.length} bytes identical` : `differs (${have.length} vs ${want.length} bytes)` });
  return { tool: 'tests/envmap/envmap.mjs merge-check', base_rev: rev, epochs: epochFiles, status: checks.every(c => c.status === 'PASS') ? 'PASS' : 'FAIL', checks };
}
function bind(epochFile, root) {
  const ep = load(epochFile); const bound = [];
  for (const n of ep.nodes.filter(x => x.class === 'EVIDENCE' && x.status === 'PENDING')) {
    const p = join(root, n.artifact_identity.path);
    if (!existsSync(p)) throw new Error(`${n.id}: ${n.artifact_identity.path} missing`);
    const b = readFileSync(p);
    n.artifact_identity.sha256 = createHash('sha256').update(b).digest('hex'); n.artifact_identity.bytes = b.length;
    n.status = n.status_after_bind || 'RUN'; delete n.status_after_bind; bound.push(n.id);
  }
  writeFileSync(epochFile, JSON.stringify(ep, null, 1) + '\n');
  return bound;
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
  else if (cmd === 'merge') { const g = merge(baseGraph(o['base-rev']), o.epochs.split(',')); writeFileSync(o.out, graphText(g)); console.log(`merged ${g.epochs.map(e => e.epoch).join(' -> ')}: ${g.nodes.length} nodes, ${g.edges.length} edges -> ${o.out}`); }
  else if (cmd === 'merge-check') { const r = mergeCheck(o._[1], o['base-rev'], o.epochs.split(',')); if (o.out) writeJson(o.out, r); console.log(r.status, r.checks.map(c => `${c.check}: ${c.detail}`).join('; ')); process.exit(r.status === 'PASS' ? 0 : 1); }
  else if (cmd === 'bind') { const b = bind(o._[1], o.root || '.'); console.log(`bound ${b.length}: ${b.join(' ')}`); }
  else { console.error('usage: envmap.mjs <validate|query|stale|render|render-check|paths-probe|merge|merge-check|bind> ...'); process.exit(2); }
} catch (e) { console.error('envmap: ' + (e && e.stack || e)); process.exit(2); }
