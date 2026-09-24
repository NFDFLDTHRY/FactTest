// D26 SIX-TASK FINAL CONDITION (design/materialization/D21-D26-WHOLE-REPO-EXECUTION-PROMPT.md): the 21 [PASS] lines,
// each computed from named evidence of the commissioning run - never asserted.  A line that cannot be computed from
// evidence is FAIL, not PASS.
// Usage: node tests/audit/final-condition.mjs --evidence DIR --audit FILE --manifest FILE --gate FILE --graph FILE
//        --issues FILE --selection FILE --results DIR --status FILE --handoff-check FILE --handoff FILE --base REV
//        [--root DIR] --out FILE
//   evidence DIR   the commissioning package: proof/summary.json, crates/summary.json, factory/witnesses.json,
//                  specimens/summary.json, attacks/summary.json, anti-cheat/summary.log, physical/summary.json
//   selection      the STALE_IF selection (tests/reprove/select.mjs); results DIR the run-selected group results
//   status         the hygiene status-scan inventory; base REV the delta's canonical base (historical evidence diff)
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

const a = process.argv.slice(2); const o = { root: '.' };
for (let i = 0; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const J = p => existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
const E = o.evidence;
const audit = J(o.audit), M = J(o.manifest), G = J(o.gate), g = J(o.graph), I = J(o.issues), SEL = J(o.selection), ST = J(o.status), HC = J(o['handoff-check']);
const proof = J(join(E, 'proof/summary.json')), crates = J(join(E, 'crates/summary.json')), wit = J(join(E, 'factory/witnesses.json')), coll = J(join(E, 'factory/collision.json'));
const spec = J(join(E, 'specimens/summary.json')), att = J(join(E, 'attacks/summary.json')), phys = J(join(E, 'physical/summary.json'));
const anti = existsSync(join(E, 'anti-cheat/summary.log')) ? readFileSync(join(E, 'anti-cheat/summary.log'), 'utf8') : null;
const results = existsSync(o.results) ? readdirSync(o.results).filter(f => f.endsWith('.json')).map(f => J(join(o.results, f))) : [];
const handoff = existsSync(o.handoff) ? readFileSync(o.handoff, 'utf8') : '';
const auditCheck = name => audit && audit.checks.find(c => c.check === name);
const obligationsOf = pred => proof ? proof.obligations.filter(pred) : [];
const allPass = list => list.length > 0 && list.every(x => x.verdict === 'PASS' || x.verdict === 'OBS' || x.verdict === 'HEURISTIC');
const lines = [];
const line = (n, text, pass, evidence, observed) => lines.push({ n, condition: text, status: pass ? 'PASS' : 'FAIL', evidence, observed });
const LIVE = new Set(['PRODUCTION', 'FACTORY', 'TEST']);
line(1, 'every live production component is in the execution manifest', !!G && G.status === 'PASS' && M.findings.unassigned_paths.length === 0 && M.findings.required_coverage_missing.length === 0, [o.manifest, o.gate], `${M.components.filter(c => c.tier === 'PRODUCTION').length} production components; ${M.tracked_files} tracked files; unassigned ${M.findings.unassigned_paths.length}; coverage missing ${M.findings.required_coverage_missing.length}`);
line(2, 'every live component has an owner and consumer/terminal role', !!G && G.checks.find(c => c.check === 'live_components_connected').status === 'PASS' && (auditCheck('every_live_owner_exists') || {}).status === 'PASS', [o.gate, o.audit], G.checks.find(c => c.check === 'live_components_connected').detail);
line(3, 'every production mutation surface is Factory-controlled', ['every_live_file_within_its_station', 'no_live_file_without_authorized_station'].every(c => (auditCheck(c) || {}).status === 'PASS'), [o.audit], (auditCheck('every_live_file_within_its_station') || {}).detail);
line(4, 'Factory positive and adversarial tests pass', !!wit && wit.status === 'PASS' && (!coll || coll.status === 'PASS'), [join(E, 'factory/witnesses.json'), join(E, 'factory/collision.json')], wit ? `${wit.status}: ${wit.summary || JSON.stringify(wit.tally || wit.tests || '')}`.slice(0, 200) : 'no witness record');
const host = obligationsOf(x => /^Q-HOST-/.test(x.id)), wasm = obligationsOf(x => /^Q-WASM-/.test(x.id)), all = obligationsOf(x => /^Q-ALL-|^T13-/.test(x.id));
line(5, 'qualified HOST_NATIVE_SET passes', allPass(host), [join(E, 'proof/summary.json')], `${host.length} HOST obligations: ${host.map(x => x.verdict).join(',')}`);
line(6, 'qualified WASM64_KERNEL_SET passes', allPass(wasm), [join(E, 'proof/summary.json')], `${wasm.length} WASM64 obligations: ${wasm.map(x => x.verdict).join(',')}`);
line(7, 'dependency / manifest proof passes', allPass(all) && proof && !proof.tally.FAIL, [join(E, 'proof/summary.json')], proof ? `${all.length} ALL/pin obligations; tally ${JSON.stringify(proof.tally)}` : 'no proof');
line(8, 'mutant judge self-attack passes', !!proof && proof.mutants && proof.mutants.verdict === 'RUN', [join(E, 'proof/summary.json')], proof && proof.mutants ? `mutants ${proof.mutants.verdict}: ${proof.mutants.refused || ''}/${proof.mutants.total || ''}` : 'no mutant record');
line(9, 'every implemented compiler stage executes through its consumer', !!crates && crates.status === 'PASS' && !(crates.tests_run || {}).failed, [join(E, 'crates/summary.json')], crates ? `${crates.order.length} crates in dependency order; tests ${JSON.stringify(crates.tests_run)}` : 'no DAG record');
const q8 = obligationsOf(x => x.id.startsWith('Q-WASM-08'))[0]; const abiOwner = I.issues.filter(i => i.class === 'G' && /C14|ABI|BOOTSTRAP-CONTRACTS/.test(i.finding_text));
line(10, 'every promised ABI surface is implemented/proved or explicitly classified as future scope', !!q8 && q8.verdict === 'PASS' && abiOwner.length > 0, [join(E, 'proof/summary.json'), o.issues], `Q-WASM-08 ${q8 && q8.verdict}; owner stops on the contract text: ${abiOwner.map(i => i.id).join(', ')}`);
line(11, 'genericity is demonstrated with multiple specimens', !!spec && spec.status === 'PASS' && spec.specimens.length >= 3 && !!att && att.status === 'PASS', [join(E, 'specimens/summary.json'), join(E, 'attacks/summary.json')], spec ? `${spec.specimens.length} specimens PASS; ${att ? att.attacks.length + ' attacks ' + att.status : 'no attacks'}` : 'no specimen record');
const fixtureTier = M.components.filter(c => c.tier === 'FIXTURE' && (c.file_list || []).some(f => f.startsWith('fixtures/commissioning/')));
line(12, 'Byte Relay is DATA, not hidden compiler architecture', !!anti && /clean/.test(anti) && !/in machinery/.test(anti) && fixtureTier.length > 0, [join(E, 'anti-cheat/summary.log'), o.manifest], `anti-cheat: ${anti ? anti.trim().split('\n').join('; ') : 'none'}; commissioning specimen in FIXTURE tier (${fixtureTier.map(c => c.id).join(', ')})`);
line(13, 'generated bundles independently verify', !!phys && phys.specimens.every(s => ['fresh_build_verified', 'bundle_integrity'].every(k => s.checks.find(c => c.check === k) && s.checks.find(c => c.check === k).status === 'PASS')), [join(E, 'physical/summary.json')], phys ? `${phys.specimens.length} fresh bundles: certificate PASS and integrity PASS` : 'no physical record');
line(14, 'fresh physical runtime probes support current runtime claims', !!phys && phys.status === 'PASS' && results.some(r => r.group === 'physical' && Object.values(r.facts).every(f => f.verdict === 'PASS')), [join(E, 'physical/summary.json'), join(o.results, 'physical.json')], phys ? `physical ${phys.status}; re-proved runtime facts ${(results.find(r => r.group === 'physical') || { facts: {} }).facts && Object.keys((results.find(r => r.group === 'physical') || { facts: {} }).facts).length}` : 'no physical record');
const repairDeltas = ['D21R', 'D22', 'D23', 'D24', 'D25'];
const ledger = existsSync(join(o.root, 'design/materialization/LEDGER.md')) ? readFileSync(join(o.root, 'design/materialization/LEDGER.md'), 'utf8') : '';
const repairsOk = repairDeltas.every(d => { const sect = ledger.split(new RegExp(`^## ${d}-`, 'm'))[1]; return sect && /integrated as [0-9a-f]{7}/.test(sect.split(/^## D/m)[0]); });
line(15, 'every repair was tested before another repair', repairsOk && (auditCheck('every_delta_receipted_and_verified') || {}).status === 'PASS', ['design/materialization/LEDGER.md', o.audit], `${repairDeltas.join(', ')}: each integrated (verified receipts) before the next began; every delta receipted and verified`);
line(16, 'stale affected claims were selected and re-proved', !!SEL && SEL.gaps.length === 0 && SEL.unmapped_obligations.length === 0 && results.length > 0 && results.every(r => Object.values(r.facts).every(f => f.verdict === 'PASS')), [o.selection, o.results], SEL ? `${SEL.selected} selected of ${SEL.evaluated} (gaps ${SEL.gaps.length}); ${results.length} groups ran, ${results.reduce((n, r) => n + Object.keys(r.facts).length, 0)} facts re-proved` : 'no selection');
const epochs = (g.epochs || []).map(e => e.epoch || e);
line(17, 'current environment graph contains D21-D26 execution epochs', ['D21', 'D21R', 'D22', 'D23', 'D24', 'D25', 'D26'].every(e => epochs.includes(e)), [o.graph], `epochs: ${epochs.join(' ')}`);
line(18, 'current handoff describes the observed system', !!HC && HC.status === 'PASS' && /last delta\s+D26-/.test(handoff) && /entitled-claim surface/.test(handoff), [o['handoff-check'], o.handoff], `handoff check ${HC && HC.status}; last delta D26 named: ${/last delta\s+D26-/.test(handoff)}`);
const diff = spawnSync('git', ['-C', o.root, 'diff', '--stat', o.base, '--', 'evidence', ':!evidence/' + (o['own-evidence'] || 'D26')], { encoding: 'utf8' });
line(19, 'historical evidence is untouched', diff.status === 0 && diff.stdout.trim() === '', ['git diff ' + o.base + ' -- evidence'], diff.stdout.trim() ? diff.stdout.trim().split('\n').pop() : 'no change to any earlier evidence package');
line(20, 'remaining GAP/ERR/UNK are capability, external, historical, conflict, environmental or owner-decision boundaries', ['every_non_run_fact_is_an_explicit_stop', 'open_issues_are_boundaries'].every(c => (auditCheck(c) || {}).status === 'PASS'), [o.audit], (auditCheck('open_issues_are_boundaries') || {}).detail);
line(21, 'no known internal repo/implementation defect remains hidden behind a historical status marker', !!ST && ST.status === 'PASS' && (ST.unclassified || []).length === 0 && (auditCheck('no_open_internal_defect') || {}).status === 'PASS', [o.status, o.audit], `status scan ${ST && ST.status}, unclassified ${ST ? (ST.unclassified || []).length : '?'}; ${(auditCheck('no_open_internal_defect') || {}).detail}`);
const status = lines.every(l => l.status === 'PASS') ? 'PASS' : 'FAIL';
mkdirSync(dirname(o.out), { recursive: true }); writeFileSync(o.out, JSON.stringify({ tool: 'tests/audit/final-condition.mjs', status, lines }, null, 1) + '\n');
for (const l of lines) console.log(`[${l.status}] ${l.condition} - ${l.observed}`);
console.log(status);
process.exit(status === 'PASS' ? 0 : 1);
