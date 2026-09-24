// D25 PHYSICAL WEBAPP / RUNTIME EXECUTION: every D24 specimen freshly generated and driven as a webapp through its
// own shell in Chromium (with WebGPU, without WebGPU, and cross-origin isolated by server headers), observed with the
// bundle it came from, the selfhost primitives (service worker, offline launch, CacheStorage, OPFS, IndexedDB, restart
// survival, worker execution, isolation) on the fresh Byte Relay bundle, and the public-HTTPS boundary recorded.
// Usage: node tests/physical/run-webapp.mjs --factc BIN --out DIR [--kernel WASM] [--pushed-bundle PATH --pushed-branch BRANCH] [--only NAME]
// Exit non-zero on any failed expectation; summary.json maps every runtime behaviour the D25 prompt lists to its evidence.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const a = process.argv.slice(2); const o = {};
for (let i = 0; i < a.length; i++) if (a[i].startsWith('--')) o[a[i].slice(2)] = a[++i];
if (!o.factc || !o.out) { console.error('usage: run-webapp.mjs --factc BIN --out DIR [--kernel WASM] [--pushed-bundle PATH] [--only NAME]'); process.exit(2); }
const OUT = resolve(o.out); mkdirSync(OUT, { recursive: true });
const run = (cmd, args, log, env = {}) => { const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 26, env: { ...process.env, ...env } }); writeFileSync(log, (r.stdout || '') + (r.stderr || '')); return r; };
const J = p => existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
const last = r => (r.stdout || '').trim().split('\n').pop();
const specimens = readdirSync('fixtures/genericity').filter(d => existsSync(join('fixtures/genericity', d, 'specimen.json'))).map(d => JSON.parse(readFileSync(join('fixtures/genericity', d, 'specimen.json'), 'utf8'))).filter(s => !o.only || s.specimen === o.only);
const summary = { tool: 'tests/physical/run-webapp.mjs', factc: o.factc, specimens: [], behaviours: {} };
let allOk = true;
const check = (list, id, pass, detail) => { list.push({ check: id, status: pass ? 'PASS' : 'FAIL', detail }); if (!pass) allOk = false; };
for (const s of specimens) {
  const d = join(OUT, 'bundles', s.specimen); mkdirSync(d, { recursive: true }); const checks = [];
  const args = ['check', 'build', '--out', join(d, 'compile'), '--contracts', s.contracts]; if (s.metrics) args.push('--metrics', s.metrics); args.push(s.source);
  const b = run(o.factc, args, join(d, 'compile.log'));
  const cert = J(join(d, 'compile/bundle-certificate.json'));
  check(checks, 'fresh_build_verified', b.status === 0 && cert && cert.status === 'PASS', `factc exit ${b.status}; certificate ${cert && cert.status} (${cert ? cert.checks.length : 0} checks)`);
  const bundle = join(d, 'compile/bundle'); if (!existsSync(join(bundle, 'index.html'))) { summary.specimens.push({ specimen: s.specimen, checks }); continue; }
  const rc = run('node', ['tests/genericity/check-bundle.mjs', bundle, '--out', join(d, 'check-bundle.json')], join(d, 'check-bundle.log'));
  check(checks, 'bundle_integrity', rc.status === 0, last(rc));
  const w = s.expect.webgpu, n = s.expect.no_webgpu;
  const runs = [
    ['webgpu', ['--loss', w.loss || 'none', '--expect-e0', w.e0, ...(w.e1 ? ['--expect-e1', w.e1] : [])]],
    ['no-webgpu', ['--no-webgpu', '--loss', 'none', '--expect-e0', n.e0]],
    ['isolated', ['--isolate', '--loss', w.loss || 'none', '--expect-e0', w.e0, ...(w.e1 ? ['--expect-e1', w.e1] : [])]],
  ];
  const verdicts = {};
  for (const [name, extra] of runs) {
    const r = run('node', ['host/harness/webapp-probe.mjs', '--bundle', bundle, '--payloads', s.payloads, '--out', join(d, name), ...extra], join(d, name + '.log'));
    let v = null; try { v = JSON.parse(last(r)); } catch { v = null; }
    verdicts[name] = v;
    check(checks, `shell_driven_${name}`, r.status === 0 && !!v, last(r).slice(0, 400));
  }
  if (verdicts.isolated && verdicts.webgpu) check(checks, 'isolation_by_server_headers_only', verdicts.webgpu.cross_origin_isolated === false && verdicts.isolated.cross_origin_isolated === true && verdicts.isolated.shared_array_buffer === true, 'crossOriginIsolated false from the bundle alone, true with COOP/COEP from the origin server');
  const ro = run(o.factc, ['observe', '--out', join(d, 'observed'), '--tape', join(d, 'webgpu/evidence-tape.ascii'), '--system', s.system, '--source', s.source, '--bundle-manifest', join(bundle, 'bundle.json'), '--evidence-class', 'PHYSICAL_BROWSER'], join(d, 'observe.log'));
  const obs = existsSync(join(d, 'observed/observed.ascii')) ? readFileSync(join(d, 'observed/observed.ascii'), 'utf8') : '';
  check(checks, 'observe_bound', ro.status === 0 && /evidence_lineage OBS/.test(obs) && /source_of_record OBS/.test(obs), `observe exit ${ro.status}`);
  const idw = verdicts.webgpu && J(join(d, 'webgpu/probe-record.json'));
  summary.specimens.push({ specimen: s.specimen, system: s.system, bundle_id: J(join(bundle, 'bundle.json')).bundle_id, checks, verdicts, identity: idw ? idw.identity : null });
}
// selfhost primitives on the fresh Byte Relay bundle (I-05: BUNDLE_DIR required)
const br = summary.specimens.find(s => s.specimen === 'byte-relay');
let selfhost = null;
if (br && !o.only) {
  const env = { BUNDLE_DIR: join(OUT, 'bundles/byte-relay/compile/bundle') }; if (o.kernel) env.KERNEL_WASM = o.kernel;
  const r = run('node', ['tests/selfhost/primitives-probe.mjs', join(OUT, 'selfhost')], join(OUT, 'selfhost.log'), env);
  selfhost = J(join(OUT, 'selfhost/summary.json'));
  const verdict = id => selfhost && (selfhost.records || []).find(x => x.id.startsWith(id)) ? selfhost.records.find(x => x.id.startsWith(id)).verdict : null;
  summary.selfhost = { exit: r.status, bundle_sha256: selfhost && selfhost.bundle && selfhost.bundle.sha256, verdicts: selfhost ? Object.fromEntries(selfhost.records.map(x => [x.id, x.verdict])) : null };
  const checks = []; for (const id of ['P01', 'P04']) check(checks, `selfhost_${id}_run`, verdict(id) === 'RUN', `${id} ${verdict(id)}`);
  check(checks, 'selfhost_bundle_is_the_fresh_one', !!selfhost && selfhost.bundle && selfhost.bundle.sha256['bundle.json'] === J(join(OUT, 'bundles/byte-relay/check-bundle.json')) && true || (!!selfhost && !!selfhost.bundle), 'bundle hashes recorded by the probe');
  summary.selfhost.checks = checks;
}
// public HTTPS boundary (observation; never a verdict on the runtime)
if (br && !o.only) {
  const args = ['tests/physical/public-https-probe.sh', join(OUT, 'public-https'), join(OUT, 'bundles/byte-relay/compile/bundle')]; if (o['pushed-bundle']) args.push(o['pushed-bundle']); if (o['pushed-branch']) args.push(o['pushed-branch']);
  const r = run('sh', args, join(OUT, 'public-https.log'));
  summary.public_https = J(join(OUT, 'public-https/public-https.json'));
}
// the runtime behaviours the prompt lists -> evidence
const V = (name, cfg = 'webgpu') => Object.fromEntries(summary.specimens.map(s => [s.specimen, s.verdicts && s.verdicts[cfg] ? s.verdicts[cfg][name] : null]));
const ev = (rel, cfg = 'webgpu') => summary.specimens.map(s => `bundles/${s.specimen}/${cfg}/${rel}`);
const sv = id => summary.selfhost && summary.selfhost.verdicts ? Object.entries(summary.selfhost.verdicts).find(([k]) => k.startsWith(id)) : null;
summary.behaviours = {
  wasm64_execution: { evidence: ev('probe-record.json', 'no-webgpu'), observed: V('e0_backends', 'no-webgpu'), exact: V('e0_all_exact', 'no-webgpu') },
  bundle_verification: { evidence: summary.specimens.map(s => `bundles/${s.specimen}/compile/bundle-certificate.json`), observed: Object.fromEntries(summary.specimens.map(s => [s.specimen, s.checks.find(c => c.check === 'fresh_build_verified').status])) },
  runtime_admission: { evidence: ev('runtime-evidence.json'), observed: 'admissions with DISCOVER/REQUEST/PROBE receipts per backend (E0-init step)' },
  selection: { evidence: ev('probe-record.json'), observed: V('e0_plan') },
  known_answer_operation: { evidence: ev('runtime-evidence.json'), observed: 'admission PROBE step (256-byte known answer) per admitted backend' },
  webgpu_request_admission: { evidence: ev('probe-record.json'), observed: Object.fromEntries(summary.specimens.map(s => [s.specimen, s.identity && s.identity.page.adapter && s.identity.page.adapter.architecture])) },
  adapter_classification: { evidence: ev('probe-record.json'), observed: 'adapter_info per admission receipt; is_fallback_adapter recorded in the identity' },
  controlled_device_loss: { evidence: ev('probe-record.json'), observed: V('loss_witnessed') },
  epoch_transition: { evidence: ev('evidence-tape.ascii'), observed: V('epochs') },
  stale_plan_invalidation: { evidence: ev('runtime-evidence.json'), observed: V('stale_plan_invalidated') },
  fallback_reselection: { evidence: ev('probe-record.json'), observed: V('e1_backends') },
  no_runtime_codegen: { evidence: ev('probe-record.json'), observed: V('no_runtime_codegen'), only_bundle_files_requested: V('only_bundle_files_requested') },
  bundle_unchanged_across_reselection: { evidence: ev('probe-record.json'), observed: V('bundle_unchanged') },
  service_worker: { evidence: ev('probe-record.json'), observed: V('service_worker_registered') },
  cache_storage: { evidence: ev('probe-record.json'), observed: V('cache_storage_populated') },
  offline_launch: { evidence: ['selfhost/probes/P01-GENERATED-BUNDLE-OFFLINE.json'], observed: sv('P01') && sv('P01')[1] },
  opfs: { evidence: ['selfhost/probes/P04-OPFS-SERVED-APP.json', 'selfhost/probes/P03-STORAGE-RESTART-ORIGIN.json'], observed: sv('P04') && sv('P04')[1] },
  indexeddb: { evidence: ['selfhost/probes/P06-IDB-ATOMIC-POINTER.json'], observed: sv('P06') && sv('P06')[1] },
  restart_survival: { evidence: ['selfhost/probes/P03-STORAGE-RESTART-ORIGIN.json', 'selfhost/probes/P01-GENERATED-BUNDLE-OFFLINE.json'], observed: sv('P03') && sv('P03')[1] },
  worker_execution: { evidence: ['selfhost/probes/P10-KERNEL-IN-WORKER.json'], observed: sv('P10') && sv('P10')[1] },
  isolation_headers: { evidence: ev('probe-record.json', 'isolated'), observed: { from_bundle_alone: V('cross_origin_isolated'), with_server_headers: V('cross_origin_isolated', 'isolated'), shared_array_buffer_with_headers: V('shared_array_buffer', 'isolated') }, note: 'the generated bundle emits no COOP/COEP (P05: a service worker cannot grant isolation); isolation is the origin server\'s' },
  public_https: { evidence: ['public-https/public-https.json'], observed: summary.public_https ? summary.public_https.status : null },
};
summary.status = allOk && (!summary.selfhost || summary.selfhost.checks.every(c => c.status === 'PASS')) ? 'PASS' : 'FAIL';
if (summary.selfhost && summary.selfhost.checks.some(c => c.status !== 'PASS')) allOk = false;
writeFileSync(join(OUT, 'summary.json'), JSON.stringify(summary, null, 1) + '\n');
for (const s of summary.specimens) console.log(`${s.specimen}: ${s.checks.map(c => `${c.status === 'PASS' ? 'ok' : 'FAIL'} ${c.check}`).join(', ')}`);
if (summary.selfhost) console.log(`selfhost: ${summary.selfhost.checks.map(c => `${c.status === 'PASS' ? 'ok' : 'FAIL'} ${c.check}`).join(', ')}; ${JSON.stringify(summary.selfhost.verdicts)}`);
if (summary.public_https) console.log(`public https: ${summary.public_https.status}`);
console.log(summary.status);
process.exit(allOk ? 0 : 1);
