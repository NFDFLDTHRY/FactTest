// FactTest PHYSICAL WEBAPP probe (D25): the generated bundle driven as a user would drive it - through the shell's own
// controls (index.html: init, one hex input + transfer button per authored relation, one release button per guarded
// backend) - with the exact environment identity recorded beside every observation.
//
// Usage: node host/harness/webapp-probe.mjs (--bundle DIR | --url URL) --payloads FILE --out DIR
//          [--no-webgpu] [--isolate] [--loss BACKEND|none] [--expect-e0 BACKEND|none] [--expect-e1 BACKEND|none]
//          [--toolchain tests/toolchain/proof-sets.json]
//   --bundle DIR   serve DIR on http://127.0.0.1 (a secure context); --isolate adds COOP/COEP so the page is
//                  cross-origin isolated (the generated bundle itself emits no isolation headers)
//   --url URL      drive an already-deployed copy of the bundle at URL (the public-HTTPS route): artifact hashes are
//                  taken from the files fetched there and compared with the bundle.json served beside them
// Generic over the bundle: relations, backends and expectations come from the bundle's strategy data and the caller.
// Output: probe-record.json (identity, steps, verdict), runtime-evidence.json (the shell's snapshot), evidence-tape.ascii.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, extname } from 'node:path';

const argv = process.argv.slice(2); const opt = {};
for (let i = 0; i < argv.length; i++) { if (argv[i] === '--no-webgpu' || argv[i] === '--isolate') opt[argv[i].slice(2)] = true; else if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[++i]; }
if ((!opt.bundle && !opt.url) || !opt.payloads || !opt.out) { console.error('usage: webapp-probe.mjs (--bundle DIR | --url URL) --payloads FILE --out DIR [--no-webgpu] [--isolate] [--loss B|none] [--expect-e0 B|none] [--expect-e1 B|none]'); process.exit(2); }
mkdirSync(opt.out, { recursive: true });
const sha = b => createHash('sha256').update(b).digest('hex');
const hexBytes = h => Uint8Array.from((h.match(/[0-9a-fA-F]{2}/g) || []).map(x => parseInt(x, 16)));
const hex = b => [...b].map(x => x.toString(16).padStart(2, '0')).join(' ');
const payloads = JSON.parse(readFileSync(opt.payloads, 'utf8')).payloads.map(p => ({ name: p.name, relation: p.relation || null, bytes: hexBytes(p.hex) }));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
let srv = null, url = opt.url, hashesBefore = null;
if (opt.bundle) {
  hashesBefore = Object.fromEntries(readdirSync(opt.bundle).sort().map(f => [f, sha(readFileSync(join(opt.bundle, f)))]));
  srv = http.createServer((q, s) => { const p = join(opt.bundle, q.url === '/' ? 'index.html' : q.url.split('?')[0]); if (!existsSync(p)) { s.statusCode = 404; return s.end(); } s.setHeader('content-type', types[extname(p)] || 'application/octet-stream'); if (opt.isolate) { s.setHeader('cross-origin-opener-policy', 'same-origin'); s.setHeader('cross-origin-embedder-policy', 'require-corp'); } s.end(readFileSync(p)); }).listen(0, '127.0.0.1');
  await new Promise(r => srv.once('listening', r));
  url = `http://127.0.0.1:${srv.address().port}/index.html`;
}
const launch = opt['no-webgpu'] ? { headless: true, args: [] } : { headless: true, ignoreDefaultArgs: ['--disable-gpu'], args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
const browser = await chromium.launch(launch);
const page = await browser.newPage();
const console_ = [], requests = []; page.on('console', m => console_.push(m.text())); page.on('pageerror', e => console_.push('PAGEERROR ' + e.message)); page.on('request', r => requests.push(r.url()));
const cdp = await page.context().newCDPSession(page); const version = await cdp.send('Browser.getVersion');
const nav = await page.goto(url);
const record = { harness: 'host/harness/webapp-probe.mjs', started: new Date().toISOString(), mode: opt.bundle ? 'served-loopback' : 'external-url', url, options: opt, steps: [] };
const step = (name, data) => record.steps.push({ step: name, ...data });
await page.waitForFunction(() => !!window.factRuntime, null, { timeout: 30000 });
// ---- environment identity (the prompt's list), recorded before any interaction
const env = await page.evaluate(async () => {
  const r = { origin: location.origin, secure_context: isSecureContext, cross_origin_isolated: crossOriginIsolated, shared_array_buffer: typeof SharedArrayBuffer, user_agent: navigator.userAgent, hardware_concurrency: navigator.hardwareConcurrency, webgpu_exposed: 'gpu' in navigator, adapter: null };
  if ('gpu' in navigator) { try { const a = await navigator.gpu.requestAdapter(); if (a) { const info = a.info || (a.requestAdapterInfo ? await a.requestAdapterInfo() : null); const limits = {}; for (const k in a.limits) limits[k] = a.limits[k]; r.adapter = { vendor: info && info.vendor, architecture: info && info.architecture, device: info && info.device, description: info && info.description, is_fallback_adapter: (info && info.isFallbackAdapter) ?? a.isFallbackAdapter ?? null, features: [...a.features].sort(), limits }; } else r.adapter = { requested: true, result: null }; } catch (e) { r.adapter = { error: String(e) }; } }
  return r;
});
const toolchainFile = opt.toolchain || 'tests/toolchain/proof-sets.json';
const toolchain = existsSync(toolchainFile) ? (() => { const s = JSON.parse(readFileSync(toolchainFile, 'utf8')).sets; return { host_native: s.HOST_NATIVE_SET.toolchain, wasm64_kernel: s.WASM64_KERNEL_SET.toolchain, kernel_exec_identity: s.WASM64_KERNEL_SET.kernel_identity.exec_identity.sha256 }; })() : null;
const uname = (() => { try { return execSync('uname -srmo', { encoding: 'utf8' }).trim(); } catch { return null; } })();
record.identity = { browser: { product: version.product, revision: version.revision, js_engine: `V8 ${version.jsVersion}`, user_agent: version.userAgent, executable: chromium.executablePath(), launch_options: launch, playwright_default_args_ignored: launch.ignoreDefaultArgs || [] }, host: { platform: os.platform(), release: os.release(), arch: os.arch(), uname, hostname: os.hostname(), cpus: os.cpus().length, node: process.version }, page: env, http_status: nav ? nav.status() : null, response_headers: nav ? nav.headers() : null, toolchain };
// artifact hashes: served bundle (files on disk) or fetched from the external origin, compared with bundle.json
const strategy = await page.evaluate(() => window.factRuntime.STRATEGY);
const manifest = await page.evaluate(async () => (await fetch('./bundle.json')).json());
const fetched = {};
for (const r of manifest.artifact_roles) fetched[r.path] = sha(Buffer.from(await page.evaluate(async p => [...new Uint8Array(await (await fetch('./' + p)).arrayBuffer())], r.path)));
record.identity.artifacts = { bundle_id: manifest.bundle_id, strategy_data_sha256: manifest.strategy_data_sha256, fetched_sha256: fetched, on_disk_sha256: hashesBefore, recorded_in_manifest: Object.fromEntries(manifest.artifact_roles.map(r => [r.path, r.sha256])), every_fetched_file_as_recorded: manifest.artifact_roles.every(r => fetched[r.path] === r.sha256) };
// ---- drive the shell through its controls
const out = async () => JSON.parse(await page.locator('#out').textContent());
const clickButton = async text => { await page.locator('#controls button', { hasText: text }).first().click(); await page.waitForTimeout(150); };
await clickButton('init (E0)');
await page.waitForFunction(() => { try { return JSON.parse(document.getElementById('out').textContent).activation !== null; } catch { return false; } }, null, { timeout: 30000 });
let snap = await out();
step('E0-init', { activation: snap.activation, admissions: Object.fromEntries(Object.entries(snap.admissions).map(([k, v]) => [k, { decision: v.decision, reason: v.rejection_reason, adapter_info: v.adapter_info, probes: v.evaluated_requirements.map(p => p.step + ':' + p.result) }])), epochs: snap.epochs.map(e => e.epoch_id) });
const transfers = strategy.transfers.map(t => t.relation);
async function transferAll(label) {
  const results = [];
  for (const relation of transfers) for (const p of payloads) {
    if (p.relation && p.relation !== relation) continue;
    const before = (await out()).evidence.length;
    await page.locator(`#controls input[placeholder="hex bytes for ${relation}"]`).fill(hex(p.bytes));
    await clickButton(`transfer ${relation} `);
    await page.waitForFunction(n => { try { return JSON.parse(document.getElementById('out').textContent).evidence.length > n; } catch { return false; } }, before, { timeout: 30000 });
    const s = await out(); const ev = s.evidence.filter(e => e.event_class === 'EXECUTE' && e.subject === relation).pop();
    const obs = ev ? ev.observation : {};
    results.push({ relation, payload: p.name, bytes: p.bytes.length, input_sha256_harness: sha(Buffer.from(p.bytes)), status: obs.status, backend: obs.backend || null, plan_id: obs.plan_id ?? null, conversions: obs.conversions || null, output_sha256_runtime: obs.output_sha256 || null, exact_runtime: obs.exact ?? null, exact_harness: obs.output_sha256 === sha(Buffer.from(p.bytes)) });
  }
  step(label, { results });
  return results;
}
const e0 = await transferAll('E0-transfer');
const plan0 = snap.activation && snap.activation.plan_id !== null ? strategy.variants.find(v => v.plan_id === snap.activation.plan_id) : null;
const lossBackend = opt.loss ? (opt.loss === 'none' ? null : opt.loss) : (plan0 && plan0.guard[0]) || null;
let loss = null, e1 = null;
if (lossBackend && snap.admissions[lossBackend] && snap.admissions[lossBackend].decision === 'ADMITTED') {
  const epochsBefore = snap.epochs.length;
  await clickButton(`release ${lossBackend} `);
  await page.waitForFunction(n => { try { return JSON.parse(document.getElementById('out').textContent).epochs.length > n; } catch { return false; } }, epochsBefore, { timeout: 30000 });
  snap = await out();
  loss = { backend: lossBackend, activation: snap.activation, admission: snap.admissions[lossBackend] && { decision: snap.admissions[lossBackend].decision, reason: snap.admissions[lossBackend].rejection_reason }, epochs: snap.epochs.map(e => e.epoch_id), observation_deltas: snap.observation_deltas };
  step('controlled-loss', loss);
  if (snap.activation && snap.activation.plan_id !== null) e1 = await transferAll('E1-transfer'); else step('E1-transfer', { results: [], note: 'E1 activated no plan: nothing executed' });
}
snap = await out();
const sw = await page.evaluate(async () => { const regs = await navigator.serviceWorker.getRegistrations(); const keys = 'caches' in self ? await caches.keys() : []; const cached = {}; for (const k of keys) cached[k] = (await (await caches.open(k)).keys()).map(r => new URL(r.url).pathname); return { registrations: regs.map(r => ({ scope: r.scope, active: !!r.active })), cache_keys: keys, cached }; });
step('service-worker', sw);
await browser.close(); if (srv) srv.close();
record.bundle_hashes_after = opt.bundle ? Object.fromEntries(readdirSync(opt.bundle).sort().map(f => [f, sha(readFileSync(join(opt.bundle, f)))])) : null;
record.requests = requests; record.console = console_; record.finished = new Date().toISOString();
const allExact = rs => rs.length > 0 && rs.every(r => r.status === 'EXECUTED' && r.exact_runtime && r.exact_harness);
const backendsOf = rs => [...new Set(rs.map(r => r.backend))];
const v = record.verdict = {
  driven_through_shell: true, transfers_executed: transfers.length, payloads: payloads.length,
  e0_plan: snap.epochs.length ? record.steps[0].activation.plan_id : null, e0_all_exact: allExact(e0), e0_backends: backendsOf(e0),
  loss_attempted: lossBackend, loss_witnessed: loss ? (loss.admission && loss.admission.decision !== 'ADMITTED' && loss.epochs.length === 2 && loss.observation_deltas.length === 1) : null,
  e1_plan: loss ? (loss.activation ? loss.activation.plan_id : null) : null, e1_all_exact: e1 ? allExact(e1) : null, e1_backends: e1 ? backendsOf(e1) : null,
  stale_plan_invalidated: loss ? (loss.observation_deltas.length === 1 && loss.observation_deltas.every(d => Array.isArray(d.stale_plans) && d.stale_plans.includes(plan0.plan_id) && d.invalidated_admissions.length > 0 && d.from_epoch === 'E0' && d.to_epoch === 'E1')) : null,
  epochs: snap.epochs.map(e => e.epoch_id), bundle_unchanged: opt.bundle ? JSON.stringify(hashesBefore) === JSON.stringify(record.bundle_hashes_after) : null,
  artifacts_as_recorded: record.identity.artifacts.every_fetched_file_as_recorded,
  only_bundle_files_requested: requests.every(u => u.startsWith(url.slice(0, url.lastIndexOf('/') + 1))),
  no_runtime_codegen: !console_.some(t => /WebAssembly\.compile\(|new Function/.test(t)),
  service_worker_registered: sw.registrations.length > 0, cache_storage_populated: Object.values(sw.cached).some(x => x.length > 0),
  cross_origin_isolated: env.cross_origin_isolated, shared_array_buffer: env.shared_array_buffer !== 'undefined',
};
const expect = [];
if (opt['expect-e0']) expect.push(opt['expect-e0'] === 'none' ? (v.e0_plan === null && e0.every(r => r.status === 'NO_ACTIVE_PLAN')) : (v.e0_backends.length === 1 && v.e0_backends[0] === opt['expect-e0']));
if (opt['expect-e1']) expect.push(opt['expect-e1'] === 'none' ? (loss !== null && v.e1_plan === null) : (e1 !== null && v.e1_backends.length === 1 && v.e1_backends[0] === opt['expect-e1']));
v.expectations_met = expect.every(Boolean);
writeFileSync(join(opt.out, 'probe-record.json'), JSON.stringify(record, null, 2));
writeFileSync(join(opt.out, 'runtime-evidence.json'), JSON.stringify({ epochs: snap.epochs, admissions: snap.admissions, activation: snap.activation, evidence: snap.evidence, observation_deltas: snap.observation_deltas }, null, 2));
writeFileSync(join(opt.out, 'evidence-tape.ascii'), snap.tape);
console.log(JSON.stringify(v));
const ok = (opt['expect-e0'] === 'none' || v.e0_all_exact) && (loss === null || v.loss_witnessed) && (e1 === null || v.e1_all_exact) && v.artifacts_as_recorded && (v.bundle_unchanged !== false) && v.only_bundle_files_requested && v.expectations_met;
process.exit(ok ? 0 : 1);
