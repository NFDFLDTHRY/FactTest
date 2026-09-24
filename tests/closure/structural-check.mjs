// Foundation-closure structural check (D27; design/foundation-closure/FOUNDATION-CLOSURE-TARGET.md section 13).
// Usage: node tests/closure/structural-check.mjs --registers DIR --components FILE --graph FILE [--facts-spec FILE]
//        [--root DIR] [--evidence-required] [--render FILE] --out FILE
// The repository must be able to answer, without session memory: "what exact machine must exist for the installed
// Factory to evolve the language through which the human and the local model tell it what to manufacture?" - and every
// part of that answer must link CURRENT EVIDENCE -> REQUIRED SEMANTIC BEHAVIOUR -> BROWSER-NATIVE MECHANISM -> TEST ->
// EVIDENCE -> [RUN]/[GAP]/[ERR]/[UNK].  This tool checks that structure over the closure registers:
//   ids           unique within each register; every cross reference (FB-*, FC-*, H-*, acceptance steps, component ids)
//                 resolves; every cited FACT-* is a current node of the graph (not superseded) or a fact the delta's own
//                 spec declares; statuses are in the FACTORY-LAW.md vocabulary
//   chain         every correspondence row, blocker and acceptance step carries every link of the chain (a link may be
//                 an explicit "[GAP] ..." or "none", never absent)
//   closure       every open blocker (GAP/ERR/UNK) is in at least one sequence step or is an explicit environmental /
//                 owner-decision / architectural-limit boundary; every acceptance step names at least one mechanism;
//                 every sequence step names blockers that exist and acceptance steps it enables
//   classification every component of the register is classified exactly once with a class the register defines
//   evidence      with --evidence-required, every cited evidence path exists in the tree (the run after the evidence
//                 stations); without it, only the path form is checked (the fixture station runs before the evidence)
// --render FILE writes the deterministic human-readable rendering of every register (the generated view the target
// document points at).  Exit 1 on any FAIL.  Generic: names no blocker, fact, component or step of its own.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const a = process.argv.slice(2); const o = { root: '.' };
for (let i = 0; i < a.length; i++) { const k = a[i].replace(/^--/, ''); if (k === 'evidence-required') o[k] = true; else o[k] = a[++i]; }
const J = p => JSON.parse(readFileSync(p, 'utf8'));
const R = name => J(join(o.registers, name + '.json'));
const reg = { classification: R('classification'), correspondence: R('correspondence'), hardening: R('hardening'), evolution: R('evolution-contract'), blockers: R('blockers'), rustBuild: R('rust-build'), seed: R('seed'), acceptance: R('acceptance-test'), sequence: R('sequence'), corpus: R('language-corpus') };
const components = J(o.components).components;
const g = J(o.graph);
const superseded = new Set(g.edges.filter(e => e.type === 'SUPERSEDES').map(e => e.to));
const currentFacts = new Set(g.nodes.filter(n => n.id.startsWith('FACT-') && !superseded.has(n.id)).map(n => n.id));
const specFacts = new Set(o['facts-spec'] && existsSync(o['facts-spec']) ? J(o['facts-spec']).facts.map(f => f.id) : []);
const STATUS = new Set(['OBS', 'RUN', 'NEW', 'GAP', 'ERR', 'UNK']);
const BOUNDARY_CLASSES = new Set(['environmental', 'owner-decision', 'architectural-limit', 'closed']);
const checks = []; const add = (area, check, bad, detail) => checks.push({ area, check, status: bad.length ? 'FAIL' : 'PASS', detail: bad.length ? bad.slice(0, 25).join('; ') : detail });
const uniq = (ids, label) => ids.filter((x, i) => ids.indexOf(x) !== i).map(d => `${label} duplicate ${d}`);
const FB = new Set(reg.blockers.rows.map(r => r.id)), FC = new Set(reg.sequence.steps.map(s => s.id)), H = new Set(reg.hardening.questions.map(q => q.id)), ACC = new Set(reg.acceptance.steps.map(s => s.step)), COMP = new Set(components.map(c => c.id));
const factOk = f => currentFacts.has(f) || specFacts.has(f);
const refs = (xs, label) => (xs || []).flatMap(x => /^FB-/.test(x) ? (FB.has(x) ? [] : [`${label}: unknown blocker ${x}`]) : /^FC-/.test(x) ? (FC.has(x) ? [] : [`${label}: unknown sequence step ${x}`]) : /^H-/.test(x) ? (H.has(x) ? [] : [`${label}: unknown hardening question ${x}`]) : [`${label}: unknown reference ${x}`]);
const facts = (xs, label) => (xs || []).filter(f => !factOk(f)).map(f => `${label}: fact ${f} is not a current graph node${superseded.has(f) ? ' (superseded)' : ''}`);
const evidencePath = (p, label) => { if (!p || p === 'none' || /^\[GAP\]/.test(p)) return []; if (!/^[A-Za-z0-9_./-]+$/.test(p)) return [`${label}: evidence path form ${p}`]; if (o['evidence-required'] && !existsSync(join(o.root, p))) return [`${label}: evidence path missing ${p}`]; return []; };
const chain = (row, fields, label) => fields.filter(f => row[f] === undefined || row[f] === null || row[f] === '').map(f => `${label}: chain link ${f} absent`);

// ids
add('ids', 'unique_ids', [...uniq([...FB], 'blocker'), ...uniq([...FC], 'sequence'), ...uniq([...H], 'hardening'), ...uniq(reg.acceptance.steps.map(s => String(s.step)), 'acceptance'), ...uniq(reg.corpus.entries.map(e => e.id), 'corpus'), ...uniq(reg.rustBuild.candidates.map(c => c.id), 'rust-build')], `${FB.size} blockers, ${FC.size} sequence steps, ${H.size} hardening questions, ${ACC.size} acceptance steps, ${reg.corpus.entries.length} corpus entries, ${reg.rustBuild.candidates.length} rust-build candidates`);
// statuses
const statusBad = [];
for (const r of reg.correspondence.rows) if (!STATUS.has(r.status)) statusBad.push(`correspondence ${r.operation}: ${r.status}`);
for (const r of reg.blockers.rows) if (!STATUS.has(r.status)) statusBad.push(`blocker ${r.id}: ${r.status}`);
for (const q of reg.hardening.questions) if (!STATUS.has(q.status)) statusBad.push(`hardening ${q.id}: ${q.status}`);
for (const s of reg.evolution.steps) if (!STATUS.has(s.status)) statusBad.push(`evolution step ${s.step}: ${s.status}`);
for (const s of reg.acceptance.steps) if (!STATUS.has(s.status)) statusBad.push(`acceptance ${s.step}: ${s.status}`);
for (const c of reg.rustBuild.candidates) if (!STATUS.has(c.status)) statusBad.push(`rust-build ${c.id}: ${c.status}`);
add('ids', 'statuses_in_vocabulary', statusBad, 'every status is one of OBS RUN NEW GAP ERR UNK (FACTORY-LAW.md)');
// classification
const classes = new Set(Object.keys(reg.classification.classes));
const cls = reg.classification.components;
add('classification', 'every_component_classified_once', [...components.filter(c => !cls[c.id]).map(c => `unclassified ${c.id}`), ...Object.keys(cls).filter(id => !COMP.has(id)).map(id => `classified but not a component ${id}`), ...Object.entries(cls).filter(([, v]) => !classes.has(v.class)).map(([id, v]) => `${id}: class ${v.class} undefined`)], `${components.length} components in ${classes.size} classes`);
// correspondence chain
const corrBad = [];
for (const r of reg.correspondence.rows) { const L = `correspondence ${r.operation}`; corrBad.push(...chain(r, ['current', 'required_semantic_effect', 'browser_native_mechanism', 'current_evidence', 'primitive_evidence', 'test', 'evidence', 'status', 'sequence'], L)); if (r.current && !COMP.has(r.current.component)) corrBad.push(`${L}: component ${r.current.component}`); corrBad.push(...facts(r.current_evidence, L), ...facts(r.primitive_evidence, L), ...refs(r.sequence, L), ...evidencePath(r.evidence, L)); if (r.status !== 'RUN' && !r.sequence.length) corrBad.push(`${L}: ${r.status} with no sequence step`); }
add('chain', 'correspondence_rows_complete', corrBad, `${reg.correspondence.rows.length} Factory operations mapped CURRENT -> SEMANTIC EFFECT -> BROWSER MECHANISM -> TEST -> EVIDENCE -> STATUS`);
// blockers chain + closure
const blkBad = [];
for (const r of reg.blockers.rows) { const L = `blocker ${r.id}`; blkBad.push(...chain(r, ['blocker', 'class', 'layer', 'current_evidence', 'required_semantic_behaviour', 'browser_native_mechanism', 'test', 'evidence', 'status', 'sequence'], L), ...facts(r.current_evidence, L), ...refs(r.sequence, L), ...evidencePath(r.evidence, L)); if (['GAP', 'ERR', 'UNK'].includes(r.status) && !r.sequence.length && !BOUNDARY_CLASSES.has(r.class)) blkBad.push(`${L}: open (${r.status}, ${r.class}) but in no sequence step and not a boundary class`); if (r.class === 'closed' && r.status !== 'RUN') blkBad.push(`${L}: closed but ${r.status}`); }
add('closure', 'every_open_blocker_sequenced_or_boundary', blkBad, `${reg.blockers.rows.length} blockers: ${['GAP', 'ERR', 'UNK'].map(s => s + ' ' + reg.blockers.rows.filter(r => r.status === s).length).join(', ')}, closed ${reg.blockers.rows.filter(r => r.class === 'closed').length}`);
// acceptance
const accBad = [];
for (const s of reg.acceptance.steps) { const L = `acceptance ${s.step}`; accBad.push(...chain(s, ['text', 'mechanisms', 'current_evidence', 'host_dependency_today', 'status', 'closes_when'], L), ...refs(s.mechanisms, L), ...facts(s.current_evidence, L)); if (!s.mechanisms.length) accBad.push(`${L}: no mechanism`); }
add('closure', 'every_acceptance_step_has_mechanism', accBad, `${reg.acceptance.steps.length} steps; ${reg.acceptance.steps.filter(s => s.status === 'RUN').length} RUN without the host today`);
// sequence
const seqBad = [];
const covered = new Set();
for (const s of reg.sequence.steps) { const L = `sequence ${s.id}`; seqBad.push(...chain(s, ['delta', 'goal', 'blockers', 'acceptance_steps', 'stations', 'may_change', 'exit_evidence', 'depends_on'], L), ...refs(s.blockers, L), ...refs(s.depends_on, L)); for (const n of s.acceptance_steps) if (!ACC.has(n)) seqBad.push(`${L}: acceptance step ${n} unknown`); for (const b of s.blockers) covered.add(b); }
for (const n of ACC) if (!reg.sequence.steps.some(s => s.acceptance_steps.includes(n))) seqBad.push(`acceptance step ${n} enabled by no sequence step`);
add('closure', 'sequence_covers_acceptance', seqBad, `${reg.sequence.steps.length} deltas cover ${covered.size} blockers and every acceptance step`);
// hardening + evolution
const hBad = [];
for (const q of reg.hardening.questions) { const L = `hardening ${q.id}`; hBad.push(...chain(q, ['question', 'answer', 'evidence', 'status', 'disposition', 'refs'], L), ...refs(q.refs, L)); for (const p of q.evidence) hBad.push(...evidencePath(p, L)); }
for (const s of reg.evolution.steps) { const L = `evolution ${s.step}`; hBad.push(...chain(s, ['text', 'mechanism', 'realized_by', 'status', 'refs'], L), ...refs(s.refs, L)); }
add('chain', 'hardening_and_evolution_complete', hBad, `${reg.hardening.questions.length} hardening questions answered with evidence; ${reg.evolution.steps.length} evolution steps bound to mechanisms (${reg.evolution.steps.filter(s => s.status === 'RUN').length} RUN)`);
// rust-build + seed
const rbBad = [];
for (const c of reg.rustBuild.candidates) { rbBad.push(...chain(c, ['INPUT', 'OPERATION', 'OUTPUT', 'TRUST', 'VERIFICATION', 'BOOTSTRAP', 'REPRODUCIBILITY', 'RECOVERY', 'status', 'evidence'], `rust-build ${c.id}`)); for (const p of c.evidence) rbBad.push(...evidencePath(p, `rust-build ${c.id}`)); }
for (const t of reg.seed.tcb) rbBad.push(...facts(t.evidence.filter(x => x.startsWith('FACT-')), `tcb ${t.component}`));
for (const m of reg.seed.seed.must) if (!factOk(m.primitive)) rbBad.push(`seed rule ${m.rule}: primitive ${m.primitive} not a current fact`);
add('chain', 'rust_build_and_seed_complete', rbBad, `${reg.rustBuild.candidates.length} RUST_BUILD candidates with INPUT/OPERATION/OUTPUT/TRUST/VERIFICATION/BOOTSTRAP/REPRODUCIBILITY/RECOVERY; ${reg.seed.tcb.length} TCB rows; ${reg.seed.seed.must.length} seed rules each on a current primitive`);
// the answer to the stop-condition question, rendered as the chain
const answer = reg.acceptance.steps.map(s => ({ step: s.step, text: s.text, status: s.status, machinery: s.mechanisms.map(id => { const b = reg.blockers.rows.find(r => r.id === id); return { blocker: id, mechanism: b.browser_native_mechanism, test: b.test, evidence: b.evidence, status: b.status, sequence: b.sequence }; }) }));
const status = checks.every(c => c.status === 'PASS') ? 'PASS' : 'FAIL';
const out = { tool: 'tests/closure/structural-check.mjs', status, evidence_required: !!o['evidence-required'], counts: { components: components.length, blockers: reg.blockers.rows.length, correspondence: reg.correspondence.rows.length, hardening: reg.hardening.questions.length, evolution_steps: reg.evolution.steps.length, acceptance_steps: reg.acceptance.steps.length, sequence: reg.sequence.steps.length, corpus_entries: reg.corpus.entries.length }, checks, stop_condition_answer: answer };
mkdirSync(dirname(o.out), { recursive: true }); writeFileSync(o.out, JSON.stringify(out, null, 1) + '\n');
if (o.render) {
  const L = []; const p = s => L.push(s); const code = f => { p('```text'); f(); p('```'); p(''); };
  p('# FOUNDATION CLOSURE - REGISTERS (generated)'); p('');
  p('STATUS: GENERATED by tests/closure/structural-check.mjs --render from tests/closure/registers/*.json; never edited by hand.  The live target is design/foundation-closure/FOUNDATION-CLOSURE-TARGET.md; the check that every row links CURRENT EVIDENCE -> REQUIRED SEMANTIC BEHAVIOUR -> BROWSER-NATIVE MECHANISM -> TEST -> EVIDENCE -> STATUS is the JSON record this rendering accompanies.'); p('');
  p('## 1. CURRENT -> SELF-HOST correspondence matrix'); p('');
  code(() => { for (const r of reg.correspondence.rows) { p(`${r.operation.padEnd(18)} [${r.status}] ${r.sequence.join(',') || '-'}`); p(`  current     ${r.current.component}: ${r.current.mechanism}`); p(`  effect      ${r.required_semantic_effect}`); p(`  browser     ${r.browser_native_mechanism}`); p(`  evidence    now: ${r.current_evidence.join(', ') || '-'}; primitives: ${r.primitive_evidence.join(', ') || '-'}`); p(`  test        ${r.test}`); p(`  record      ${r.evidence}`); if (r.note) p(`  note        ${r.note}`); } });
  p('## 2. Component classification'); p('');
  code(() => { for (const [k, v] of Object.entries(reg.classification.classes)) { p(`${k}: ${v}`); for (const c of components.filter(c => cls[c.id].class === k)) p(`  ${c.id.padEnd(28)} ${c.tier.padEnd(11)} ${cls[c.id].browser_native}`); } });
  p('## 3. ASCII language hardening register'); p('');
  code(() => { for (const q of reg.hardening.questions) { p(`${q.id} [${q.status}] ${q.question}`); p(`  ${q.answer}`); p(`  disposition: ${q.disposition}; evidence: ${q.evidence.join(', ') || '-'}; refs: ${q.refs.join(', ') || '-'}`); } });
  p('## 4. Language evolution contract'); p('');
  code(() => { for (const l of reg.evolution.laws) p(`${l.id}  ${l.law}`); p(''); for (const s of reg.evolution.steps) { p(`S${String(s.step).padStart(2, '0')} [${s.status}] ${s.text}`); p(`     mechanism: ${s.mechanism}`); p(`     realized by: ${s.realized_by}`); } });
  p('## 5. Self-hosting blocker register'); p('');
  code(() => { for (const r of reg.blockers.rows) { p(`${r.id} [${r.status}] ${r.class} / ${r.layer}${r.d12 ? ' (D12 ' + r.d12 + ')' : ''}: ${r.blocker}`); p(`  required   ${r.required_semantic_behaviour}`); p(`  mechanism  ${r.browser_native_mechanism}`); p(`  evidence   ${r.current_evidence.join(', ') || '-'}; record: ${r.evidence}`); p(`  test       ${r.test}`); p(`  sequence   ${r.sequence.join(', ') || '-'}${r.note ? '; ' + r.note : ''}`); } });
  p('## 6. Rust-build closure boundary'); p('');
  code(() => { p(`REQUIRED  ${reg.rustBuild.required_capability}`); p(`NOT       ${reg.rustBuild.distinction}`); p(`DECISION  ${reg.rustBuild.decision}`); p(''); for (const c of reg.rustBuild.candidates) { p(`${c.id} [${c.status}] ${c.name}`); for (const k of ['INPUT', 'OPERATION', 'OUTPUT', 'TRUST', 'VERIFICATION', 'BOOTSTRAP', 'REPRODUCIBILITY', 'RECOVERY']) p(`  ${k.padEnd(16)} ${c[k]}`); p(`  note             ${c.note}`); } });
  p('## 7. Minimal trusted seed and trusted computing base'); p('');
  code(() => { p(`SEED  ${reg.seed.seed.definition}`); for (const m of reg.seed.seed.must) p(`  MUST ${m.rule}  ${m.must}  [${m.primitive}]`); p(`  MUST NOT  ${reg.seed.seed.must_not.join('; ')}`); p(`  WHY  ${reg.seed.seed.why_it_is_the_seed}`); p(''); for (const t of reg.seed.tcb) { p(`TCB  ${t.component}`); p(`     role ${t.role}`); p(`     trust ${t.trust}; circularity ${t.circularity}`); p(`     evidence ${t.evidence.join(', ')}`); } p(''); p(`minimal TCB for L3-A: ${reg.seed.minimal_tcb_for_L3A.join('; ')}`); p(`outside the TCB once generation 0 exists: ${reg.seed.not_in_tcb_once_generation_0_exists.join('; ')}`); });
  p('## 8. Foundation-closure acceptance test'); p('');
  code(() => { p(`VERDICT TODAY  ${reg.acceptance.verdict_today}`); p(''); for (const s of reg.acceptance.steps) { p(`${String(s.step).padStart(2)} [${s.status}] ${s.text}`); p(`     mechanisms ${s.mechanisms.join(', ')}; evidence ${s.current_evidence.join(', ') || '-'}`); p(`     host today ${s.host_dependency_today}`); p(`     closes     ${s.closes_when}`); } });
  p('## 9. Implementation sequence (next series)'); p('');
  code(() => { for (const s of reg.sequence.steps) { p(`${s.id}  ${s.delta}  (after ${s.depends_on.join(', ') || 'D27'})`); p(`  goal       ${s.goal}`); p(`  blockers   ${s.blockers.join(', ')}; acceptance steps ${s.acceptance_steps.join(', ')}`); p(`  stations   ${s.stations.join(', ')}; may change ${s.may_change.join(', ')}`); p(`  exit       ${s.exit_evidence}`); } });
  p('## 10. The answer to the stop condition'); p('');
  p('"What exact machine must exist for the installed Factory to evolve the language through which the human and local model tell it what to manufacture?"  Each acceptance step, its machinery, the test and the status:'); p('');
  code(() => { for (const s of answer) { p(`${String(s.step).padStart(2)} [${s.status}] ${s.text}`); for (const m of s.machinery) p(`     ${m.blocker} [${m.status}] ${m.mechanism.slice(0, 110)}${m.mechanism.length > 110 ? '...' : ''} | test: ${m.test.slice(0, 70)}${m.test.length > 70 ? '...' : ''} | ${m.sequence.join(',') || 'boundary'}`); } });
  p(`STRUCTURAL CHECK: ${status} (${checks.length} checks; ${checks.filter(c => c.status === 'PASS').length} PASS)`);
  mkdirSync(dirname(o.render), { recursive: true }); writeFileSync(o.render, L.join('\n') + '\n');
}
for (const c of checks) console.log(`${c.status} [${c.area}] ${c.check}: ${c.detail}`);
console.log(`STRUCTURAL CHECK: ${status}`);
if (status !== 'PASS') process.exit(1);
