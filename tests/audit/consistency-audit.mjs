// D26 final consistency audit (design/materialization/D21-D26-WHOLE-REPO-EXECUTION-PROMPT.md, D26): the five equalities
// computed from the registers, never asserted.
// Usage: node tests/audit/consistency-audit.mjs --manifest FILE --gate FILE --graph FILE --issues FILE --stations DIR
//        --deltas DIR --receipts DIR --ledger FILE --q22 FILE [--handoff FILE] [--current-delta ID] [--root DIR] --out FILE
//   LIVE LAW = CURRENT IMPLEMENTATION CONTRACT   every LAW-tier file is held by the environment graph (a node names it) or
//                                               named as the owner of a live component; every live component names an
//                                               owner that exists as a file
//   CURRENT IMPLEMENTATION = EXECUTION MANIFEST every tracked path tiered, none ambiguous; every live component has files;
//                                               the manifest gate PASS
//   EXECUTION MANIFEST = FACTORY ROUTES         every live component names a registered station whose may_change covers
//                                               every file of the component; no live file without an authorized station
//   FACTORY ROUTES = RECEIPTS / VERIFICATION    every delta has a receipt per fixture (PASS) and a verification PASS; every
//                                               integration commit the ledger records exists and names its delta
//   CURRENT CLAIM = CURRENT EVIDENCE OR BOUNDARY every current RUN claim is claimable or invalidated (Q22); every GAP/ERR/
//                                               UNK current fact is an explicit stop; every A/B/C issue is REPAIRED and the
//                                               open issues are boundaries (D/E/F/G)
// Generic: names no component, file, delta or fact; every input is an argument.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

const a = process.argv.slice(2); const o = { root: '.' };
for (let i = 0; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const J = p => JSON.parse(readFileSync(p, 'utf8'));
const M = J(o.manifest), G = J(o.gate), g = J(o.graph), I = J(o.issues), Q = J(o.q22).answer;
const LIVE = new Set(['PRODUCTION', 'FACTORY', 'TEST']);
const live = M.components.filter(c => LIVE.has(c.tier));
const checks = []; const add = (equality, check, bad, detail) => checks.push({ equality, check, status: bad.length ? 'FAIL' : 'PASS', detail: bad.length ? bad.slice(0, 20).join('; ') : detail });
// 1. LIVE LAW = CURRENT IMPLEMENTATION CONTRACT
const graphText = JSON.stringify(g);
const ownerText = M.components.flatMap(c => c.owner || []).join('\n');
const register = o.handoff && existsSync(o.handoff) ? (readFileSync(o.handoff, 'utf8').split(/^## 5\. Document register/m)[1] || '').split(/^## 6\./m)[0] : '';
const lawFiles = M.components.filter(c => c.tier === 'LAW').flatMap(c => c.file_list || c.files || []);
const registerGlobs = (register.match(/[A-Z0-9_-]*\*[A-Za-z0-9_.-]*/g) || []).map(p => new RegExp('^' + p.replace(/[.]/g, '\\.').replace(/\*/g, '.*') + '$'));
const held = f => graphText.includes(f) || ownerText.includes(f) || register.includes(f) || registerGlobs.some(r => r.test(f));
add('LIVE LAW = CURRENT IMPLEMENTATION CONTRACT', 'every_law_file_held', lawFiles.filter(f => !held(f)), `${lawFiles.length} law files each named by the graph, by a component's owner or by the handoff document register`);
const ownerFiles = new Set();
const missingOwners = [];
for (const c of live) for (const ow of c.owner || []) { const files = ow.match(/[A-Za-z0-9_./-]+\.(md|json|rs|mjs|sh|ascii)/g) || []; for (const f of files) { ownerFiles.add(f); if (!existsSync(join(o.root, f))) missingOwners.push(`${c.id}: ${f}`); } if (!files.length && !/^[A-Z]/.test(ow)) missingOwners.push(`${c.id}: owner names no file (${ow.slice(0, 40)})`); }
add('LIVE LAW = CURRENT IMPLEMENTATION CONTRACT', 'every_live_owner_exists', missingOwners, `${live.length} live components; ${ownerFiles.size} owner files present`);
// 2. CURRENT IMPLEMENTATION = EXECUTION MANIFEST
add('CURRENT IMPLEMENTATION = EXECUTION MANIFEST', 'every_path_tiered', [...M.findings.unassigned_paths, ...M.findings.ambiguous_assignments], `${M.tracked_files} tracked files in ${M.components.length} components`);
add('CURRENT IMPLEMENTATION = EXECUTION MANIFEST', 'every_live_component_has_files', live.filter(c => !(c.files || (c.file_list || []).length)).map(c => c.id), `${live.length} live components with files`);
add('CURRENT IMPLEMENTATION = EXECUTION MANIFEST', 'manifest_gate_pass', G.status === 'PASS' ? [] : G.checks.filter(c => c.status !== 'PASS').map(c => c.check), `gate ${G.status}: ${G.checks.map(c => c.check).join(', ')}`);
// 3. EXECUTION MANIFEST = FACTORY ROUTES
const stations = Object.fromEntries(readdirSync(o.stations).filter(f => f.endsWith('.json')).map(f => { const s = J(join(o.stations, f)); return [s.station_id, s]; }));
const covers = (pat, f) => pat.endsWith('/') ? f.startsWith(pat) : f === pat;
const badStation = [];
for (const c of live) { const st = String(c.station).split(/[ /(]/)[0]; if (!stations[st]) { badStation.push(`${c.id}: station ${c.station} not registered`); continue; } const allowed = stations[st].may_change; for (const f of c.file_list || []) if (!allowed.some(p => covers(p, f))) badStation.push(`${c.id}: ${f} outside ${st}`); }
add('EXECUTION MANIFEST = FACTORY ROUTES', 'every_live_file_within_its_station', badStation, `${Object.keys(stations).length} registered stations cover every file of every live component`);
add('EXECUTION MANIFEST = FACTORY ROUTES', 'no_live_file_without_authorized_station', M.findings.live_files_without_authorized_station.map(x => typeof x === 'string' ? x : x.file), 'every live file has an authorized station');
// 4. FACTORY ROUTES = RECEIPTS / VERIFICATION
const badReceipts = [];
const deltas = readdirSync(o.deltas).filter(f => f.endsWith('.json')).map(f => J(join(o.deltas, f)));
for (const d of deltas) {
  const dir = join(o.receipts, d.delta_id);
  if (o['current-delta'] && d.delta_id === o['current-delta']) continue;   // the delta running this audit is verified by the Factory after it
  if (!existsSync(join(dir, 'verification.json'))) { badReceipts.push(`${d.delta_id}: no verification`); continue; }
  const v = J(join(dir, 'verification.json')); if (v.status !== 'PASS') badReceipts.push(`${d.delta_id}: verification ${v.status}`);
  for (const fx of d.fixtures || []) { const id = fx.split('/').pop().replace(/\.json$/, ''); const r = join(dir, id + '.json'); if (!existsSync(r)) badReceipts.push(`${d.delta_id}: no receipt ${id}`); else { const rc = J(r); const failed = (rc.verification_results || []).filter(x => x.status && x.status !== 'PASS'); if (failed.length) badReceipts.push(`${d.delta_id}: ${id} ${failed.length} failed checks`); } }
}
add('FACTORY ROUTES = RECEIPTS / VERIFICATION', 'every_delta_receipted_and_verified', badReceipts, `${deltas.length - (o['current-delta'] ? 1 : 0)} integrated deltas, each with a PASS receipt per fixture and a PASS verification${o['current-delta'] ? ' (' + o['current-delta'] + ' is verified by the Factory after this audit)' : ''}`);
const ledger = readFileSync(o.ledger, 'utf8');
const integrations = [...ledger.matchAll(/^## (D[0-9A-Z-]+)[\s\S]*?integrated as ([0-9a-f]{7,40})/gm)];
const badCommits = [];
const seen = new Set();
for (const m of ledger.matchAll(/^## (D[0-9A-Z-]+)/gm)) { const id = m[1]; if (seen.has(id)) continue; seen.add(id); const sect = ledger.slice(m.index).split(/^## D/m)[0]; const c = sect.match(/integrated as ([0-9a-f]{7,40})/); if (!c) continue; const r = spawnSync('git', ['-C', o.root, 'log', '-1', '--format=%s', c[1]], { encoding: 'utf8' }); if (r.status !== 0) badCommits.push(`${id}: ${c[1]} not a commit`); else if (!r.stdout.includes(id)) badCommits.push(`${id}: ${c[1]} names ${r.stdout.trim().slice(0, 40)}`); }
add('FACTORY ROUTES = RECEIPTS / VERIFICATION', 'every_ledger_integration_commit_exists', badCommits, `${seen.size} ledger entries; every recorded integration commit exists and names its delta`);
// 5. CURRENT CLAIM = CURRENT EVIDENCE OR EXPLICIT BOUNDARY
const rc = Q.run_claims;
add('CURRENT CLAIM = CURRENT EVIDENCE OR EXPLICIT BOUNDARY', 'every_run_claim_claimable_or_invalidated', rc.total === rc.claimable + rc.invalidated ? [] : [`${rc.total} != ${rc.claimable} + ${rc.invalidated}`], `${rc.total} RUN claims = ${rc.claimable} claimable + ${rc.invalidated} invalidated`);
const stops = Q.rows.filter(r => ['GAP', 'ERR', 'UNK'].includes(r.status));
const openStops = Object.values(Q.explicit_stops.open).reduce((x, y) => x + y, 0);
add('CURRENT CLAIM = CURRENT EVIDENCE OR EXPLICIT BOUNDARY', 'every_non_run_fact_is_an_explicit_stop', openStops + Q.explicit_stops.closed_by_evidence.length === stops.length ? [] : [`${stops.length} GAP/ERR/UNK rows vs ${openStops} open + ${Q.explicit_stops.closed_by_evidence.length} closed stops`], `${stops.length} GAP/ERR/UNK current facts: ${openStops} open stops, ${Q.explicit_stops.closed_by_evidence.length} closed by evidence`);
const internal = I.issues.filter(i => /^[ABC]$/.test(i.class) && !/^REPAIRED/.test(i.status || ''));
add('CURRENT CLAIM = CURRENT EVIDENCE OR EXPLICIT BOUNDARY', 'no_open_internal_defect', internal.map(i => `${i.id} (${i.class}) ${i.task}`), `${I.issues.filter(i => /^[ABC]$/.test(i.class)).length} A/B/C issues all REPAIRED`);
const openBoundary = I.issues.filter(i => !/^REPAIRED/.test(i.status || ''));
add('CURRENT CLAIM = CURRENT EVIDENCE OR EXPLICIT BOUNDARY', 'open_issues_are_boundaries', openBoundary.filter(i => !/^[DEFG]$/.test(i.class)).map(i => i.id), `${openBoundary.length} open issues, every one class D/E/F/G (${openBoundary.map(i => `${i.id}:${i.class}`).join(', ')})`);
const status = checks.every(c => c.status === 'PASS') ? 'PASS' : 'FAIL';
const out = { tool: 'tests/audit/consistency-audit.mjs', status, manifest_rev: M.rev, graph_epochs: (g.epochs || []).map(e => e.epoch || e), checks };
mkdirSync(dirname(o.out), { recursive: true }); writeFileSync(o.out, JSON.stringify(out, null, 1) + '\n');
for (const c of checks) console.log(`${c.status} [${c.equality}] ${c.check}: ${c.detail}`);
console.log(status);
process.exit(status === 'PASS' ? 0 : 1);
