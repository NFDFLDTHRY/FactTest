// D18 reconciliation gate (design/materialization/D18-INTENDED-REPO-RECONCILIATION.md section 7).
// Usage: node tests/reconcile/gate.mjs --register FILE --graph FILE --queries DIR --surfaces FILE --label-audit FILE
//        [--root DIR] [--out FILE]
// PASS only when:
//   register_in_graph          every register item is a RECONCILIATION node re-examining exactly its subjects; every
//                              supersession, ledger entry and added edge is in the graph
//   ledger_text_present        each ledgered constraint's id and verbatim statement are in the ledger file
//   labels_resolved            every MISLABEL finding's [ERR] fact is closed by a RESOLVED reconciliation
//   stale_facts_reconciled     every Q17 fact to recheck is re-examined (Q21)
//   current_statements_clean   no current AUTHORITY / COMPUTATIONAL_FACT (neither superseded nor resolved) still carries
//                              a MISLABEL text, unless a CORRECTED reconciliation attaches the current reading, nor any
//                              text the register retires (register "retired_texts", D18R)
//   surfaces_pass              the physical surface checks (tests/reconcile/surfaces.mjs) passed
// Generic: names no item, node or document.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const a = process.argv.slice(2); const o = { root: '.' };
for (let i = 0; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const R = JSON.parse(readFileSync(o.register, 'utf8'));
const g = JSON.parse(readFileSync(o.graph, 'utf8'));
const q21 = JSON.parse(readFileSync(join(o.queries, 'Q21.json'), 'utf8')).answer;
const surf = JSON.parse(readFileSync(o.surfaces, 'utf8'));
const LA = JSON.parse(readFileSync(o['label-audit'], 'utf8'));
const ids = new Map(g.nodes.map(n => [n.id, n]));
const key = e => JSON.stringify(e); const have = new Set(g.edges.map(key));
const out = (id, t) => g.edges.filter(e => e.from === id && e.type === t).map(e => e.to);
const inc = (id, t) => g.edges.filter(e => e.to === id && e.type === t).map(e => e.from);
const checks = []; const add = (check, bad, detail) => checks.push({ check, status: bad.length ? 'FAIL' : 'PASS', detail: bad.length ? bad.slice(0, 30).join('; ') : detail });

const bad1 = [];
for (const it of R.items) {
  const n = ids.get(it.id);
  if (!n || n.class !== 'RECONCILIATION' || n.outcome !== it.outcome) { bad1.push(`${it.id} missing or outcome differs`); continue; }
  const got = out(it.id, 'RECONCILES').sort().join(','), want = [...new Set(it.reconciles)].sort().join(',');
  if (got !== want) bad1.push(`${it.id} re-examines ${got} != ${want}`);
}
for (const s of R.supersessions || []) if (!have.has(key({ type: 'SUPERSEDES', from: s.new, to: s.old, reconciliation: s.reconciliation }))) bad1.push(`no SUPERSEDES ${s.new} -> ${s.old}`);
const LED = R.ledger || { constraints: [] };
for (const c of LED.constraints) if (!g.edges.some(e => e.type === 'LEDGERED_IN' && e.from === c && e.to === LED.authority)) bad1.push(`${c} not LEDGERED_IN`);
for (const e of R.add_edges || []) if (!have.has(key(e))) bad1.push(`missing edge ${e.type} ${e.from} -> ${e.to}`);
add('register_in_graph', bad1, `${R.items.length} reconciliations, ${(R.supersessions || []).length} supersessions, ${LED.constraints.length} ledgered, ${(R.add_edges || []).length} added edges`);

const ledger = LED.file ? readFileSync(join(o.root, LED.file), 'utf8') : '';
add('ledger_text_present', LED.constraints.filter(c => !ledger.includes(`### ${c} `) || !ledger.includes(`Constraint: ${ids.get(c).statement}`)).map(c => `${c} not verbatim in ${LED.file}`), `${LED.constraints.length} constraints verbatim in ${LED.file || '(no ledger in this register)'}`);

const resolvedBy = id => inc(id, 'RECONCILES').filter(r => ids.get(r).outcome === 'RESOLVED');
const mis = LA.findings.filter(f => f.verdict === 'MISLABEL');
add('labels_resolved', mis.filter(f => !resolvedBy(`FACT-${f.id}`).length).map(f => `FACT-${f.id} not resolved`), `${mis.length} MISLABEL facts resolved`);

add('stale_facts_reconciled', q21.stale_facts.reconciled === q21.stale_facts.to_recheck ? [] : [`${q21.stale_facts.reconciled}/${q21.stale_facts.to_recheck}`], `${q21.stale_facts.to_recheck} Q17 facts re-examined`);

const superseded = new Set(g.edges.filter(e => e.type === 'SUPERSEDES').map(e => e.to));
const current = g.nodes.filter(n => ['AUTHORITY', 'COMPUTATIONAL_FACT'].includes(n.class) && !superseded.has(n.id) && !resolvedBy(n.id).length);
const bad5 = [];
for (const f of mis) for (const n of current) if (JSON.stringify(n).includes(f.location.text) && !inc(n.id, 'RECONCILES').some(r => ids.get(r).outcome === 'CORRECTED')) bad5.push(`${n.id} carries ${f.id} text`);
for (const t of R.retired_texts || []) for (const n of current) if (JSON.stringify(n).includes(t)) bad5.push(`${n.id} carries retired text '${t}'`);
add('current_statements_clean', bad5, `${current.length} current authorities/facts; MISLABEL texts only on superseded, resolved or CORRECTED nodes${(R.retired_texts || []).length ? `; ${R.retired_texts.length} retired texts absent` : ''}`);

add('surfaces_pass', surf.status === 'PASS' ? [] : surf.checks.filter(c => c.status !== 'PASS').map(c => c.check), `${surf.checks.length} surface checks PASS`);
const status = checks.every(c => c.status === 'PASS') ? 'PASS' : 'FAIL';
if (o.out) { mkdirSync(dirname(o.out), { recursive: true }); writeFileSync(o.out, JSON.stringify({ tool: 'tests/reconcile/gate.mjs', status, checks }, null, 1) + '\n'); }
for (const c of checks) console.log(`${c.status} ${c.check}: ${c.detail}`);
console.log(status);
process.exit(status === 'PASS' ? 0 : 1);
