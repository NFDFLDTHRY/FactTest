// FactTest BROWSER_PROBE harness for a generated bundle (COMMISSIONING-RUNTIME.md, COMMISSIONING-FIXTURE.md).
//
// Usage: node bundle-probe.mjs <bundle dir> <payloads.json> <out dir> [--no-webgpu]
//
// Serves the bundle over http://127.0.0.1 (a secure context), launches Chromium, and drives window.factRuntime:
//   E0: init -> admissions -> activation; relay every payload; compare EXACTLY on the harness side.
//   controlled loss: destroyBackend('WEBGPU') (GPUDevice.destroy()) -> device.lost -> E1 -> reselection.
//   E1: relay every payload again; compare exactly.
// The harness never invokes the compiler; it records the bundle file hashes before and after the session.
// With --no-webgpu the browser is launched without WebGPU so that the GPU variant is absent from E0
// (negative witness 5: W selected, no fake GPU evidence).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, extname } from 'node:path';

const [, , dir, payloadsPath, outDir, ...flags] = process.argv;
if (!dir || !payloadsPath || !outDir) { console.error('usage: bundle-probe.mjs <bundle dir> <payloads.json> <out dir> [--no-webgpu]'); process.exit(2); }
const noWebgpu = flags.includes('--no-webgpu');
mkdirSync(outDir, { recursive: true });
const hashDir = () => Object.fromEntries(readdirSync(dir).sort().map(f => [f, createHash('sha256').update(readFileSync(join(dir, f))).digest('hex')]));
const hashesBefore = hashDir();
const payloads = JSON.parse(readFileSync(payloadsPath, 'utf8')).payloads.map(p => ({ name: p.name, bytes: Uint8Array.from(p.hex.split(/\s+/).map(h => parseInt(h, 16))) }));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
const srv = http.createServer((q, s) => { const p = join(dir, q.url === '/' ? 'index.html' : q.url.split('?')[0]); if (!existsSync(p)) { s.statusCode = 404; return s.end(); } s.setHeader('content-type', types[extname(p)] || 'application/octet-stream'); s.end(readFileSync(p)); }).listen(0, '127.0.0.1');
await new Promise(r => srv.once('listening', r));
const url = `http://127.0.0.1:${srv.address().port}/index.html`;
const launch = noWebgpu
  ? { headless: true, args: [] }
  : { headless: true, ignoreDefaultArgs: ['--disable-gpu'], args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
const browser = await chromium.launch(launch);
const page = await browser.newPage();
const console_ = []; page.on('console', m => console_.push(m.text())); page.on('pageerror', e => console_.push('PAGEERROR ' + e.message));
await page.goto(url);
const equal = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const record = { harness: 'host/harness/bundle-probe.mjs', started: new Date().toISOString(), url, launch, no_webgpu: noWebgpu, bundle_hashes_before: hashesBefore, steps: [] };
const step = (name, data) => { record.steps.push({ step: name, ...data }); };
async function relayAll(label) {
  const results = [];
  for (const p of payloads) {
    const r = await page.evaluate(async (bytes) => { const out = await window.factRuntime.relay(new Uint8Array(bytes)); return { ...out, bytes: out.bytes ? [...out.bytes] : null }; }, [...p.bytes]);
    const exactHarness = r.bytes ? equal(Uint8Array.from(r.bytes), p.bytes) : false;
    results.push({ payload: p.name, input_hex: [...p.bytes].map(b => b.toString(16).padStart(2, '0')).join(' '), output_hex: r.bytes ? r.bytes.map(b => b.toString(16).padStart(2, '0')).join(' ') : null, status: r.status, backend: r.backend || null, plan_id: r.plan_id ?? null, exact_runtime: r.exact ?? null, exact_harness: exactHarness });
  }
  step(label, { results });
  return results;
}
// harness comparator self-check (negative witness 9: a corrupted byte must be detected)
{ const a = payloads[0].bytes; const t = Uint8Array.from(a); t[0] ^= 0x01; step('comparator-self-check', { tampered_detected: !equal(a, t), identical_accepted: equal(a, Uint8Array.from(a)) }); }
const ua = await page.evaluate(() => ({ userAgent: navigator.userAgent, secureContext: isSecureContext, gpuExposed: 'gpu' in navigator }));
step('environment', ua);
const act0 = await page.evaluate(async () => { const a = await window.factRuntime.init(); const s = window.factRuntime.snapshot(); return { activation: a, admissions: s.admissions, epochs: s.epochs }; });
step('E0-init', act0);
const e0 = await relayAll('E0-relay');
let e1 = null, loss = null;
if (!noWebgpu && act0.admissions.WEBGPU && act0.admissions.WEBGPU.decision === 'ADMITTED') {
  loss = await page.evaluate(async () => { const r = await window.factRuntime.destroyBackend('WEBGPU'); const s = window.factRuntime.snapshot(); return { release: r, activation: s.activation, admissions: s.admissions, epochs: s.epochs, deltas: s.observation_deltas }; });
  step('controlled-loss', loss);
  e1 = await relayAll('E1-relay');
}
const snap = await page.evaluate(() => window.factRuntime.snapshot());
await browser.close(); srv.close();
record.bundle_hashes_after = hashDir();
record.bundle_unchanged_during_session = JSON.stringify(record.bundle_hashes_before) === JSON.stringify(record.bundle_hashes_after);
record.console = console_;
record.finished = new Date().toISOString();
// verdicts (harness-side, exact compare)
const allExact = rs => rs.every(r => r.status === 'EXECUTED' && r.exact_harness && r.exact_runtime);
record.verdict = {
  e0_all_exact: allExact(e0), e0_backend: e0[0] && e0[0].backend,
  loss_witnessed: loss ? /destroyed/.test(loss.release.detail || '') && loss.admissions.WEBGPU.decision === 'REJECTED' : null,
  e1_all_exact: e1 ? allExact(e1) : null, e1_backend: e1 && e1[0] ? e1[0].backend : null,
  epochs: snap.epochs.map(e => e.epoch_id), no_compiler_invoked: true, bundle_unchanged: record.bundle_unchanged_during_session,
};
writeFileSync(join(outDir, 'probe-record.json'), JSON.stringify(record, null, 2));
writeFileSync(join(outDir, 'runtime-evidence.json'), JSON.stringify({ epochs: snap.epochs, admissions: snap.admissions, activation: snap.activation, evidence: snap.evidence, observation_deltas: snap.observation_deltas }, null, 2));
writeFileSync(join(outDir, 'evidence-tape.ascii'), snap.tape);
console.log(JSON.stringify(record.verdict));
const ok = record.verdict.e0_all_exact && record.verdict.bundle_unchanged && (noWebgpu ? record.verdict.e0_backend === 'CPU_WASM64' : (record.verdict.e0_backend === 'WEBGPU' && record.verdict.loss_witnessed && record.verdict.e1_all_exact && record.verdict.e1_backend === 'CPU_WASM64'));
process.exit(ok ? 0 : 1);
