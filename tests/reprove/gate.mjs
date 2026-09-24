// D19 re-proof gate (design/materialization/D19-INTENDED-REPROVE-REOBSERVE.md section 7).
// Usage: node tests/reprove/gate.mjs --selection FILE --results DIR --graph FILE --queries DIR --epoch D19 [--out FILE]
// PASS only when:
//   selection_complete       no unmapped obligation; no selected fact without a runbook entry (gap)
//   reproved                 every selected fact passed its expectations and is EVIDENCED_BY evidence of the epoch
//   obligations_fulfilled    every obligation addressed to the pass has a FULFILLS edge
//   identity_recorded        the epoch's environments and its identity/launched-executable/minimum-set facts are [RUN]
//   claim_surface            Q22: every current RUN claim is claimable or explicitly invalidated, and every re-proved
//                            fact is listed as re-proved in the current epoch
// Generic: names no fact of an earlier epoch.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const a = process.argv.slice(2); const o = {};
for (let i = 0; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const J = p => JSON.parse(readFileSync(p, 'utf8'));
const S = J(o.selection); const g = J(o.graph); const q22 = J(join(o.queries, 'Q22.json')).answer; const E = o.epoch;
const results = readdirSync(o.results).filter(f => f.endsWith('.json')).map(f => J(join(o.results, f)));
const ids = new Map(g.nodes.map(n => [n.id, n]));
const checks = []; const add = (check, bad, detail) => checks.push({ check, status: bad.length ? 'FAIL' : 'PASS', detail: bad.length ? bad.slice(0, 30).join('; ') : detail });
add('selection_complete', [...S.unmapped_obligations.map(x => `unmapped ${x}`), ...S.gaps.map(x => `gap ${x}`)], `${S.selected} selected of ${S.evaluated}; groups ${Object.keys(S.groups).join(', ')}`);
const verdict = new Map(results.flatMap(r => Object.entries(r.facts).map(([f, x]) => [f, x.verdict])));
const sel = S.facts.filter(x => x.selected).map(x => x.fact);
add('reproved', sel.flatMap(f => { const v = verdict.get(f); if (v !== 'PASS') return [`${f} ${v || 'not run'}`];
  return g.edges.some(e => e.type === 'EVIDENCED_BY' && e.from === f && (ids.get(e.to) || {}).epoch === E) ? [] : [`${f} lacks ${E} evidence`]; }), `${sel.length} selected facts re-proved with ${E} evidence`);
add('obligations_fulfilled', S.obligations.filter(ob => !g.edges.some(e => e.type === 'FULFILLS' && e.to === ob.reconciliation)).map(ob => `${ob.reconciliation} not fulfilled`), `${S.obligations.length} obligations fulfilled`);
const need = [`ENV-${E}-HOST`, `ENV-${E}-BROWSER-DEFAULT`, `ENV-${E}-BROWSER-GPUFLAGS`, `ENV-${E}-SOURCES`, `FACT-${E}-ENVIRONMENT-IDENTITY`, `FACT-${E}-LAUNCHED-EXECUTABLE`, `FACT-${E}-MINIMUM-SET`];
add('identity_recorded', need.filter(id => !ids.has(id) || (ids.get(id).class === 'COMPUTATIONAL_FACT' && ids.get(id).status !== 'RUN')).map(id => `${id} missing or not RUN`), need.join(', '));
const rows = new Map(q22.rows.map(r => [r.fact, r]));
add('claim_surface', [...q22.rows.filter(r => r.status === 'RUN' && !/^(claimable|invalidated)/.test(r.entitled_claim)).map(r => `${r.fact}: ${r.entitled_claim}`),
  ...sel.filter(f => !(rows.get(f) || {}).reproved_in_current_epoch).map(f => `${f} not listed as re-proved in ${E}`)],
  `${q22.run_claims.total} current RUN claims: ${q22.run_claims.claimable} claimable, ${q22.run_claims.invalidated} invalidated; ${q22.reproved_in_current_epoch.length} re-proved in ${E}`);
const status = checks.every(c => c.status === 'PASS') ? 'PASS' : 'FAIL';
if (o.out) { mkdirSync(dirname(o.out), { recursive: true }); writeFileSync(o.out, JSON.stringify({ tool: 'tests/reprove/gate.mjs', status, checks }, null, 1) + '\n'); }
for (const c of checks) console.log(`${c.status} ${c.check}: ${c.detail}`);
console.log(status);
process.exit(status === 'PASS' ? 0 : 1);
