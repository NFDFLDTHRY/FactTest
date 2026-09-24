// Authority-revision epoch builder (D14 onward; design/materialization/D14-INTENDED-FRONTIER-REOPEN.md section 4).
// Turns reopen evidence (tests/reference/reopen.mjs output, committed under evidence/<epoch>/reopen/) plus the epoch's
// reviewed decisions (tests/reference/<epoch>-review.json) into an environment-map epoch file:
//   AUTHORITY_REVISION (declared here) one per authority, REVISES -> the authority, OBSERVED_IN -> its reopen evidence
//   EVIDENCE           one per reopen record (sha256 of the committed record) + the summary + the phase registry
//   ENVIRONMENT / PROBE / IMPLEMENTATION for the reopen run; extra nodes/edges declared by the review file
// Generic: it knows the epoch schema and the review format, never a particular authority.  Usage:
//   node tests/reference/build-revisions.mjs --reopen DIR --review FILE --epoch D14 --delta ID --commit SHA --out FILE
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const a = process.argv.slice(2); const o = {}; for (let i = 0; i < a.length; i += 2) o[a[i].replace(/^--/, '')] = a[i + 1];
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex');
const review = JSON.parse(readFileSync(o.review, 'utf8'));
const summary = JSON.parse(readFileSync(join(o.reopen, 'summary.json'), 'utf8'));
const E = o.epoch; const nodes = []; const edges = [];
const N = n => { nodes.push(n); return n.id; };
const edge = (type, from, to, extra = {}) => edges.push({ type, from, to, ...extra });
const ev = (id, path, probe, env, observed, extra = {}) => N({ id, class: 'EVIDENCE', evidence_id: id, probe_ref: probe, environment_ref: env,
  artifact_identity: { path, sha256: sha(path), bytes: readFileSync(path).length, locator: 'whole record', identity_source: 'sha256 of the committed file' },
  observed_result: observed, epoch: E, status: 'RUN', evidence_class: 'PHYSICAL_HOST', owner: `Factory receipt of ${o.delta}`, ...extra });

const ENV = `ENV-${E}-HOST`, PROBE = 'PROBE-AUTHORITY-REOPEN', IMPL = 'IMPL-REFERENCE-REOPEN';
if (!review.reuse_environment) N({ id: ENV, class: 'ENVIRONMENT', environment_id: ENV, environment_class: 'PHYSICAL_HOST', toolchain: null, target: 'authority sources (no build)',
  host_runtime: `node ${summary.environment.node}; ${summary.environment.curl}; ${summary.environment.git}`, versions: { node: summary.environment.node, curl: summary.environment.curl, git: summary.environment.git },
  flags: { channels: summary.environment.channels }, build_profile: null, origin_security: null, permissions_policy: null, implementation_hardware_class: 'none (network observation)',
  dependency_graph_identity: null, other_state: { network_egress: { denied_published_hosts: summary.denied_hosts, open: ['raw.githubusercontent.com', 'github.com git smart-HTTP (ls-remote)'] }, kernel_release: summary.environment.kernel_release },
  identity_completeness: { missing: ['published renderings (policy)'], present: ['tool versions', 'denied host list', 'source channels'] }, owner: `evidence/${E}/reopen/summary.json`, note: `${E} reopen host; observed ${summary.observed}` });
if (!review.reuse_probe) {
  N({ id: IMPL, class: 'IMPLEMENTATION', impl_id: IMPL, repo_path: 'tests/reference/{reopen.mjs,build-revisions.mjs}', commit: `introduced by ${o.delta} (integration commit in LEDGER AFTER)`, kind: 'harness',
    note: 'authority frontier reopen: published URL, source tip vs pin, fragment derivation, clause window, maturity, locator candidates', owner: 'FactTest repository path tests/reference/' });
  N({ id: PROBE, class: 'PROBE', probe_id: PROBE, proves_fact: (review.facts || []).filter(f => f.probe === PROBE).map(f => f.id), command_or_operation: 'node tests/reference/reopen.mjs design/environment-map/graph.json evidence/<epoch>/reopen',
    expected_observations: ['one record per AUTHORITY node: published status, tip relation, pin check, fragment at pin/tip, clause status, maturity'], failure_meaning: ['a pin that no longer verifies, a changed clause or an absent fragment: the authority returns to ASCII review'], implemented_by: IMPL, owner: IMPL });
  edge('IMPLEMENTED_BY', PROBE, IMPL);
}
const evSummary = ev(`EV-${E}-REOPEN-SUMMARY`, join(o.reopen, 'summary.json'), PROBE, ENV,
  `published ${JSON.stringify(summary.published)}; tips ${JSON.stringify(summary.tip_relation)}; clauses ${JSON.stringify(summary.clause)}; fragments ${JSON.stringify(summary.fragment_at_tip)}`);
edge('EVIDENCED_BY', PROBE, evSummary);
const phasesPath = join(o.reopen, 'proposal-phases.json');
const evPhases = existsSync(phasesPath) ? ev(`EV-${E}-PROPOSAL-PHASES`, phasesPath, PROBE, ENV, 'WebAssembly proposal phases read from the process registry at its tip') : null;
if (evPhases) edge('EVIDENCED_BY', PROBE, evPhases);

for (const f of readdirSync(join(o.reopen, 'records')).sort()) {
  const path = join(o.reopen, 'records', f); const r = JSON.parse(readFileSync(path, 'utf8'));
  const d = review.decisions[r.authority] || {}; const cand = (review.locator_candidates_reviewed || {})[r.authority];
  const pub = r.published.status;
  const movement = [];
  if (/^UNREACHABLE|^HTTP_4/.test(pub)) movement.push('UNREACHABLE');
  movement.push(d.movement_source || review.default.movement_source);
  for (const m of d.extra_movement || []) if (!movement.includes(m)) movement.push(m);
  const evId = ev(`EV-${E}-REOPEN-${r.authority}`, path, PROBE, ENV, `published ${pub}; ${r.tip_relation}; pin ${r.pin_check || '-'}; fragment ${r.fragment ? r.fragment.at_tip.status : '-'}; clause ${r.clause ? r.clause.status : '-'}`);
  const locator = d.locator ? d.locator : cand ? { old: r.cited.fragment || '(document root / source lines)', new: cand.new, kind: cand.kind, verified: 'source only (reviewed candidate; published rendering UNREACHABLE)' } : null;
  const rid = N({ id: `REV-${E}-${r.authority}`, class: 'AUTHORITY_REVISION', revision_id: `REV-${E}-${r.authority}`, authority_ref: r.authority, epoch: E, observed: summary.observed,
    current_authority: { url: r.cited.url, status: pub, fragment_published: r.published.fragment || 'not checked (page not opened)' },
    source: { repo: r.pin.repo || null, branch: r.pin.branch || null, ref_status: r.source_tip ? r.source_tip.status + (r.source_tip.default_ref ? ' -> ' + r.source_tip.default_ref : '') : 'n/a', commit: r.source_tip ? r.source_tip.commit : null,
      path: r.pin.path || null, sha256: r.tip_sha256 || r.pin_sha256_observed || null, pin_check: r.pin_check || null, relation_to_pin: (r.tip_relation || '').split(';')[0] },
    fragment: { cited: r.cited.fragment || null, recorded: r.cited.fragment_status_recorded, at_pin: r.fragment ? r.fragment.at_pin.status + (r.fragment.at_pin.kind ? ' (' + r.fragment.at_pin.kind + ')' : '') : 'n/a', at_tip: r.fragment ? r.fragment.at_tip.status + (r.fragment.at_tip.kind ? ' (' + r.fragment.at_tip.kind + ')' : '') : 'n/a' },
    clause: r.clause ? { method: r.clause.method, status: r.clause.status, pin_lines: r.clause.pin_lines || null, tip_lines: r.clause.tip_lines || null } : { status: 'no source' },
    maturity: { recorded: r.cited.maturity_recorded, declared_at_pin: r.maturity ? r.maturity.declared_at_pin : null, declared_at_tip: r.maturity ? r.maturity.declared_at_tip : null, ...(d.maturity || {}) },
    movement, locator, coarse_unresolved: (review.coarse_unresolved || {})[r.authority] || null,
    rationale: d.rationale || review.default.rationale, owner: `${o.review} over ${path}` });
  edge('REVISES', rid, r.authority); edge('OBSERVED_IN', rid, evId);
}
const phases = existsSync(phasesPath) ? JSON.parse(readFileSync(phasesPath, 'utf8')) : {};
const subst = v => typeof v === 'string' ? v.replace(/\$\{phases\.([a-z_0-9]+)\}/g, (_, k) => String(phases[k])) : Array.isArray(v) ? v.map(subst) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, subst(x)])) : v;
for (const n of review.extra_nodes || []) N(subst(n));
for (const e of review.extra_edges || []) edges.push(e);
for (const f of review.facts || []) {
  N({ id: f.id, class: 'COMPUTATIONAL_FACT', fact_id: f.id, subject: f.subject, predicate: f.predicate, required_environment: f.required_environment || [], constraint_refs: f.constraint_refs || [], status: f.status, note: f.note || null, source_ref: f.source_ref, owner: `${E} (derived from the evidence named by its edges)` });
  edge('PROBED_BY', f.id, f.probe);
  for (const e of f.evidence) edge('EVIDENCED_BY', f.id, e === 'SUMMARY' ? evSummary : e === 'PHASES' ? evPhases : e);
  for (const a of f.authorized_by || []) edge('AUTHORIZES', a, f.id);
  for (const s of f.stale_if || []) edge('STALE_IF', f.id, ENV, { condition: s });
  if (f.status === 'RUN') edge('REQUIRES', f.id, ENV);
}
const epoch = { schema: 'facttest-environment-map-epoch/1', epoch: E, delta: o.delta, commit: o.commit, summary: review.summary,
  node_classes: review.declare_classes ? { AUTHORITY_REVISION: { owner_rule: 'the reopen evidence of its epoch and the epoch review file (tests/reference/<epoch>-review.json)',
    required: ['revision_id', 'authority_ref', 'epoch', 'observed', 'current_authority', 'source', 'fragment', 'clause', 'maturity', 'movement', 'locator', 'rationale'] } } : undefined,
  edge_semantics: review.declare_classes ? { REVISES: { from: ['AUTHORITY_REVISION'], to: ['AUTHORITY'], meaning: 'a later observation of the same authority (current authority + source frontier); the AUTHORITY node itself is never edited' },
    OBSERVED_IN: { from: ['AUTHORITY_REVISION'], to: ['EVIDENCE'], meaning: 'the reopen record that grounds the revision' } } : undefined,
  nodes, edges };
writeFileSync(o.out, JSON.stringify(epoch, null, 1) + '\n');
console.log(`${E}: ${nodes.length} nodes, ${edges.length} edges -> ${o.out}`);
