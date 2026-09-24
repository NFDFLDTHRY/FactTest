// FactTest BROWSER_PROBE harness for a generated bundle (COMMISSIONING-RUNTIME.md, COMMISSIONING-FIXTURE.md).
//
// Usage: node bundle-probe.mjs <bundle dir> <payloads.json> <out dir>
//          [--no-webgpu] [--loss BACKEND|none] [--expect-e0 BACKEND] [--expect-e1 BACKEND|none]
//
// Serves the bundle over http://127.0.0.1 (a secure context), launches Chromium, and drives window.factRuntime.
// The harness is generic over the bundle (D24): it reads the authored transfer relations from the verified strategy
// data the bundle carries (STRATEGY.transfers) and executes every relation with every payload; it never names a
// relation, a backend, a payload or a system of its own.
//   E0: init -> admissions -> activation; transfer every relation x payload; compare EXACTLY on the harness side.
//   controlled loss: destroyBackend(B) for B = --loss, default the first guard backend of the E0 active plan
//                    (GPUDevice.destroy() for a WebGPU adapter, instance release for a wasm adapter) -> E1.
//   E1: transfer every relation x payload again when E1 activated a plan; a NO_ACTIVE_PLAN E1 is recorded as such.
// The harness never invokes the compiler; it records the bundle file hashes before and after the session.
// With --no-webgpu the browser is launched without WebGPU so that a GPU variant is absent from E0.
// --expect-e0 / --expect-e1 are the caller's expectations (a backend name, or `none` for no active plan) (the specimen's, not the harness's); without them the
// verdict is: every executed transfer exact at E0 (and at E1 when a plan is active), loss witnessed when
// attempted, bundle unchanged.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, extname } from 'node:path';

const argv = process.argv.slice(2); const pos = []; const opt = {};
for (let i = 0; i < argv.length; i++) { if (argv[i] === '--no-webgpu') opt.noWebgpu = true; else if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[++i]; else pos.push(argv[i]); }
const [dir, payloadsPath, outDir] = pos;
if (!dir || !payloadsPath || !outDir) { console.error('usage: bundle-probe.mjs <bundle dir> <payloads.json> <out dir> [--no-webgpu] [--loss BACKEND|none] [--expect-e0 BACKEND] [--expect-e1 BACKEND|none]'); process.exit(2); }
const noWebgpu = !!opt.noWebgpu;
mkdirSync(outDir, { recursive: true });
const hashDir = () => Object.fromEntries(readdirSync(dir).sort().map(f => [f, createHash('sha256').update(readFileSync(join(dir, f))).digest('hex')]));
const hashesBefore = hashDir();
const hexBytes = h => Uint8Array.from((h.match(/[0-9a-fA-F]{2}/g) || []).map(x => parseInt(x, 16)));
// a payload may name the relation it belongs to; otherwise it is offered to every authored transfer relation
const payloads = JSON.parse(readFileSync(payloadsPath, 'utf8')).payloads.map(p => ({ name: p.name, relation: p.relation || null, bytes: hexBytes(p.hex) }));
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
await page.waitForFunction(() => !!window.factRuntime, null, { timeout: 30000 });
const strategy = await page.evaluate(() => window.factRuntime.STRATEGY);
const transfers = (strategy.transfers || []).map(t => t.relation);
const record = { harness: 'host/harness/bundle-probe.mjs', started: new Date().toISOString(), url, launch, no_webgpu: noWebgpu, options: opt, transfers: strategy.transfers, bundle_hashes_before: hashesBefore, steps: [] };
const step = (name, data) => { record.steps.push({ step: name, ...data }); };
const hex = b => [...b].map(x => x.toString(16).padStart(2, '0')).join(' ');
async function transferAll(label) {
  const results = [];
  for (const relation of transfers) for (const p of payloads) {
    if (p.relation && p.relation !== relation) continue;
    const r = await page.evaluate(async ([relation, bytes]) => { const out = await window.factRuntime.transfer(relation, new Uint8Array(bytes)); return { ...out, bytes: out.bytes ? [...out.bytes] : null }; }, [relation, [...p.bytes]]);
    const exactHarness = r.bytes ? equal(Uint8Array.from(r.bytes), p.bytes) : false;
    results.push({ relation, payload: p.name, input_hex: hex(p.bytes), output_hex: r.bytes ? hex(r.bytes) : null, status: r.status, backend: r.backend || null, conversions: r.conversions || null, plan_id: r.plan_id ?? null, exact_runtime: r.exact ?? null, exact_harness: exactHarness });
  }
  step(label, { results });
  return results;
}
// harness comparator self-check (negative witness 9: a corrupted byte must be detected)
{ const a = payloads.find(p => p.bytes.length) ? payloads.find(p => p.bytes.length).bytes : Uint8Array.from([0]); const t = Uint8Array.from(a); t[0] ^= 0x01; step('comparator-self-check', { tampered_detected: !equal(a, t), identical_accepted: equal(a, Uint8Array.from(a)) }); }
const ua = await page.evaluate(() => ({ userAgent: navigator.userAgent, secureContext: isSecureContext, gpuExposed: 'gpu' in navigator }));
step('environment', ua);
const act0 = await page.evaluate(async () => { const a = await window.factRuntime.init(); const s = window.factRuntime.snapshot(); return { activation: a, admissions: s.admissions, epochs: s.epochs }; });
step('E0-init', act0);
const e0 = await transferAll('E0-transfer');
const activePlan0 = act0.activation && act0.activation.plan_id !== null ? strategy.variants.find(v => v.plan_id === act0.activation.plan_id) : null;
const lossBackend = opt.loss ? (opt.loss === 'none' ? null : opt.loss) : (activePlan0 && activePlan0.guard[0]) || null;
let e1 = null, loss = null;
if (lossBackend && act0.admissions[lossBackend] && act0.admissions[lossBackend].decision === 'ADMITTED') {
  loss = await page.evaluate(async (b) => { const r = await window.factRuntime.destroyBackend(b); const s = window.factRuntime.snapshot(); return { backend: b, release: r, activation: s.activation, admissions: s.admissions, epochs: s.epochs, deltas: s.observation_deltas }; }, lossBackend);
  step('controlled-loss', loss);
  if (loss.activation && loss.activation.plan_id !== null) e1 = await transferAll('E1-transfer'); else step('E1-transfer', { results: [], note: 'E1 activated no plan: nothing executed' });
}
const snap = await page.evaluate(() => window.factRuntime.snapshot());
await browser.close(); srv.close();
record.bundle_hashes_after = hashDir();
record.bundle_unchanged_during_session = JSON.stringify(record.bundle_hashes_before) === JSON.stringify(record.bundle_hashes_after);
record.console = console_;
record.finished = new Date().toISOString();
// verdicts (harness-side, exact compare)
const allExact = rs => rs.length > 0 && rs.every(r => r.status === 'EXECUTED' && r.exact_harness && r.exact_runtime);
const backendsOf = rs => [...new Set(rs.map(r => r.backend))];
record.verdict = {
  transfers_executed: transfers.length, payloads: payloads.length,
  e0_all_exact: allExact(e0), e0_backends: backendsOf(e0), e0_plan: act0.activation ? act0.activation.plan_id : null,
  loss_attempted: lossBackend, loss_witnessed: loss ? (loss.release.result === 'OK' && loss.admissions[lossBackend].decision !== 'ADMITTED' && loss.epochs.length > act0.epochs.length) : null,
  e1_plan: loss ? (loss.activation ? loss.activation.plan_id : null) : null, e1_all_exact: e1 ? allExact(e1) : null, e1_backends: e1 ? backendsOf(e1) : null,
  epochs: snap.epochs.map(e => e.epoch_id), no_compiler_invoked: true, bundle_unchanged: record.bundle_unchanged_during_session,
};
const v = record.verdict;
const expect = [];
if (opt['expect-e0']) expect.push(opt['expect-e0'] === 'none' ? (v.e0_plan === null && e0.every(r => r.status === 'NO_ACTIVE_PLAN')) : (v.e0_backends.length === 1 && v.e0_backends[0] === opt['expect-e0']));
if (opt['expect-e1']) expect.push(opt['expect-e1'] === 'none' ? (loss !== null && v.e1_plan === null) : (e1 !== null && v.e1_backends.length === 1 && v.e1_backends[0] === opt['expect-e1']));
v.expectations_met = expect.every(Boolean);
writeFileSync(join(outDir, 'probe-record.json'), JSON.stringify(record, null, 2));
writeFileSync(join(outDir, 'runtime-evidence.json'), JSON.stringify({ epochs: snap.epochs, admissions: snap.admissions, activation: snap.activation, evidence: snap.evidence, observation_deltas: snap.observation_deltas }, null, 2));
writeFileSync(join(outDir, 'evidence-tape.ascii'), snap.tape);
console.log(JSON.stringify(v));
const ok = (opt['expect-e0'] === 'none' || v.e0_all_exact) && v.bundle_unchanged && (loss === null || v.loss_witnessed) && (e1 === null || v.e1_all_exact) && v.expectations_met;
process.exit(ok ? 0 : 1);
