// D24 GENERICITY: every specimen under fixtures/genericity/*/specimen.json through the whole transformation with the
// SAME machinery: factc BUILD (ASCII -> IR -> H_G -> plan -> VerifiedStrategy -> codegen -> BundleVerifier), the
// generic browser harness with and without WebGPU (every transfer x every payload, controlled loss, reselection),
// factc OBSERVE (tape bound to the bundle), post-build integrity, and a cross-specimen hardcode check.
// Usage: node tests/genericity/run-specimens.mjs --factc BIN --out DIR [--only NAME]
// Exit non-zero on any failed expectation; summary.json in OUT lists every check per specimen.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';

const a = process.argv.slice(2); const o = {};
for (let i = 0; i < a.length; i++) if (a[i].startsWith('--')) o[a[i].slice(2)] = a[++i];
if (!o.factc || !o.out) { console.error('usage: run-specimens.mjs --factc BIN --out DIR [--only NAME]'); process.exit(2); }
const OUT = resolve(o.out); mkdirSync(OUT, { recursive: true });
const sha = b => createHash('sha256').update(b).digest('hex');
const run = (cmd, args, log) => { const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 26 }); if (log) writeFileSync(log, (r.stdout || '') + (r.stderr || '')); return r; };
const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);
const specimens = readdirSync('fixtures/genericity').filter(d => existsSync(join('fixtures/genericity', d, 'specimen.json'))).map(d => JSON.parse(readFileSync(join('fixtures/genericity', d, 'specimen.json'), 'utf8'))).filter(s => !o.only || s.specimen === o.only);
const summary = { tool: 'tests/genericity/run-specimens.mjs', factc: o.factc, specimens: [] };
let allOk = true;
const strategyOf = dir => { const t = readFileSync(join(dir, 'selector.js'), 'utf8'); const j = t.slice(t.indexOf('/*STRATEGY-BEGIN*/') + 18, t.indexOf('/*STRATEGY-END*/')); return { text: j, data: JSON.parse(j), sha_constant: (t.match(/STRATEGY_SHA256 = '([0-9a-f]{64})'/) || [])[1] }; };
for (const s of specimens) {
  const d = join(OUT, s.specimen); mkdirSync(d, { recursive: true });
  const checks = []; const check = (id, pass, detail) => { checks.push({ check: id, status: pass ? 'PASS' : 'FAIL', detail }); if (!pass) allOk = false; };
  // 1. BUILD
  const args = ['check', 'build', '--out', join(d, 'compile'), '--contracts', s.contracts]; if (s.metrics) args.push('--metrics', s.metrics); args.push(s.source);
  const b = run(o.factc, args, join(d, 'compile.log'));
  const diag = existsSync(join(d, 'compile/diagnostics.json')) ? JSON.parse(readFileSync(join(d, 'compile/diagnostics.json'), 'utf8')) : null;
  check('build_ok', b.status === 0 && diag && diag.status === 'OK', `factc exit ${b.status}; diagnostics ${diag && diag.status}`);
  const cert = existsSync(join(d, 'compile/bundle-certificate.json')) ? JSON.parse(readFileSync(join(d, 'compile/bundle-certificate.json'), 'utf8')) : null;
  check('bundle_certificate_pass', !!cert && cert.status === 'PASS', cert ? `${cert.checks.filter(c => c.status === 'PASS').length}/${cert.checks.length} checks` : 'no certificate');
  const vs = existsSync(join(d, 'compile/verified-strategy.json')) ? JSON.parse(readFileSync(join(d, 'compile/verified-strategy.json'), 'utf8')) : null;
  if (vs && s.expect.strength) check('strategy_strength', vs.planner_result_strength === s.expect.strength, `strength ${vs.planner_result_strength} (expected ${s.expect.strength})`);
  const bundle = join(d, 'compile/bundle');
  if (!existsSync(join(bundle, 'selector.js'))) { summary.specimens.push({ specimen: s.specimen, checks }); continue; }
  // 2. strategy data: per-transfer requirements, no first-relation / first-backend assumption
  const st = strategyOf(bundle); const S = st.data;
  check('transfers_listed_in_source_order', eq(S.transfers.map(t => t.relation), s.expect.transfers), JSON.stringify(S.transfers));
  check('variant_count', S.variants.length === s.expect.variants, `${S.variants.length} variants (expected ${s.expect.variants})`);
  check('every_variant_realizes_every_transfer', S.variants.every(v => eq(v.requirements.map(r => r.relation), S.transfers.map(t => t.relation)) && v.requirements.every(r => r.backends.length && r.adapters.every(x => x) && r.conversions.length)), S.variants.map(v => v.plan_id + ':' + v.requirements.map(r => `${r.relation}<-${r.backends.join('+')}`).join(',')).join(' | '));
  check('guard_is_union_of_requirement_backends', S.variants.every(v => eq([...new Set(v.requirements.flatMap(r => r.backends))].sort(), [...v.guard].sort())), '');
  check('strategy_identity_constant', st.sha_constant === sha(Buffer.from(st.text)), `STRATEGY_SHA256 ${st.sha_constant}`);
  const man = JSON.parse(readFileSync(join(bundle, 'bundle.json'), 'utf8'));
  check('manifest_names_strategy_identity', man.strategy_data_sha256 === st.sha_constant, man.strategy_data_sha256);
  // 3. physical browser runs, both configurations, expectations from the specimen (never from the harness)
  const w = s.expect.webgpu; const pw = ['host/harness/bundle-probe.mjs', bundle, s.payloads, join(d, 'probe-webgpu'), '--loss', w.loss || 'none', '--expect-e0', w.e0]; if (w.e1) pw.push('--expect-e1', w.e1);
  const rw = run('node', pw, join(d, 'probe-webgpu.log')); const vw = rw.stdout.trim().split('\n').pop();
  check('browser_webgpu_run', rw.status === 0, vw);
  const n = s.expect.no_webgpu; const rn = run('node', ['host/harness/bundle-probe.mjs', bundle, s.payloads, join(d, 'probe-no-webgpu'), '--no-webgpu', '--loss', 'none', '--expect-e0', n.e0], join(d, 'probe-no-webgpu.log'));
  check('browser_no_webgpu_run', rn.status === 0, rn.stdout.trim().split('\n').pop());
  // executed relations in the tape are exactly the authored transfers
  const tape = existsSync(join(d, 'probe-webgpu/evidence-tape.ascii')) ? readFileSync(join(d, 'probe-webgpu/evidence-tape.ascii'), 'utf8') : '';
  const executedRelations = [...new Set([...tape.matchAll(/@\{executed \S+ plan=\d+ relation=(\S+) bytes=/g)].map(m => m[1]))].sort();
  const expectedExecuted = w.e0 === 'none' ? [] : [...s.expect.transfers].sort();
  check('tape_executes_every_transfer', eq(executedRelations, expectedExecuted), `executed ${JSON.stringify(executedRelations)}`);
  // 4. OBSERVE: the tape is bound to this bundle; transitions derived, nothing invented
  const ro = run(o.factc, ['observe', '--out', join(d, 'observed'), '--tape', join(d, 'probe-webgpu/evidence-tape.ascii'), '--system', s.system, '--source', s.source, '--bundle-manifest', join(bundle, 'bundle.json'), '--evidence-class', 'PHYSICAL_BROWSER'], join(d, 'observe.log'));
  const obs = existsSync(join(d, 'observed/observed.ascii')) ? readFileSync(join(d, 'observed/observed.ascii'), 'utf8') : '';
  check('observe_ok_and_bound', ro.status === 0 && /evidence_lineage OBS/.test(obs) && /source_of_record OBS/.test(obs), `observe exit ${ro.status}`);
  if (w.e1 && w.e1 !== 'none') check('observe_transition_E0_E1', /transition_E0_E1 OBS/.test(obs), '');
  if (w.e1 === 'none' && w.loss) check('observe_no_active_plan_E1', /activation_E1 ERR "no active plan at E1"/.test(obs) && /transition_E0_E1 OBS .*plan none/.test(obs), 'E1 activated no plan; transition derived, no fallback invented');
  // 5. post-build integrity and tamper detection
  const rc = run('node', ['tests/genericity/check-bundle.mjs', bundle, '--tamper', 'selector.js', '--out', join(d, 'check-bundle.json')], join(d, 'check-bundle.log'));
  check('bundle_integrity_and_tamper_detected', rc.status === 0, rc.stdout.trim());
  summary.specimens.push({ specimen: s.specimen, system: s.system, varies: s.varies, checks, strategy_sha256: st.sha_constant, bundle_id: man.bundle_id });
}
// 6. cross-specimen hardcode check: no bundle of one specimen carries another specimen's names or payload bytes
{
  const checks = [];
  const names = Object.fromEntries(specimens.map(s => [s.specimen, { quoted: [s.system, ...s.expect.transfers].map(x => new RegExp(`["'\`]${x}["'\`]`)), hex: JSON.parse(readFileSync(s.payloads, 'utf8')).payloads.map(p => (p.hex.match(/[0-9a-fA-F]{2}/g) || []).map(h => h.toLowerCase())).filter(b => b.length >= 3) }]));
  for (const s of specimens) {
    const bundle = join(OUT, s.specimen, 'compile/bundle'); if (!existsSync(join(bundle, 'runtime.js'))) continue;
    const body = ['index.html', 'runtime.js', 'membrane.js', 'selector.js', 'sw.js'].map(f => readFileSync(join(bundle, f), 'utf8')).join('\n');
    const hits = [];
    for (const [other, n] of Object.entries(names)) { if (other === s.specimen) continue; for (const re of n.quoted) if (re.test(body)) hits.push(`${other}:${re}`); for (const h of n.hex) { const forms = [h.join(' '), h.join(''), h.map(x => '0x' + x).join(','), h.map(x => parseInt(x, 16)).join(',')]; if (forms.some(f => body.includes(f))) hits.push(`${other}:payload`); } }
    const own = names[s.specimen].hex.some(h => [h.join(' '), h.join(''), h.map(x => '0x' + x).join(','), h.map(x => parseInt(x, 16)).join(',')].some(f => body.includes(f)));
    checks.push({ check: `no_foreign_semantics_in_${s.specimen}`, status: hits.length || own ? 'FAIL' : 'PASS', detail: hits.length ? hits.join('; ') : own ? 'own payload bytes embedded in the bundle' : 'clean' });
    if (hits.length || own) allOk = false;
  }
  summary.cross_specimen = checks;
}
summary.status = allOk ? 'PASS' : 'FAIL';
writeFileSync(join(OUT, 'summary.json'), JSON.stringify(summary, null, 1) + '\n');
for (const s of summary.specimens) console.log(`${s.specimen}: ${s.checks.map(c => `${c.status === 'PASS' ? 'ok' : 'FAIL'} ${c.check}`).join(', ')}`);
for (const c of summary.cross_specimen || []) console.log(`${c.status} ${c.check}: ${c.detail}`);
console.log(summary.status);
process.exit(allOk ? 0 : 1);
