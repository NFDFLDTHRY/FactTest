// D11 browser identity + exposure probe (no bundle, no capability implementation).
// Usage: node browser-probe.mjs <out.json> [--gpu-flags]
// Serves a blank page on http://127.0.0.1 (a potentially trustworthy origin), launches Chromium through the installed
// Playwright, records: CDP Browser.getVersion (product, revision, jsVersion), userAgent, isSecureContext,
// crossOriginIsolated, SharedArrayBuffer presence, 'gpu' in navigator, requestAdapter -> info (vendor, architecture,
// device, description, isFallbackAdapter), features, limits.maxBufferSize, and WebAssembly.validate of the 13-byte
// i64-memory module used by the generated wasm64 adapter.  Presence is recorded as presence; nothing here admits a backend.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createServer } from 'node:http';

const [outPath, ...rest] = process.argv.slice(2);
const gpuFlags = rest.includes('--gpu-flags');
const GPU_ARGS = ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const launch = gpuFlags ? { headless: true, ignoreDefaultArgs: ['--disable-gpu'], args: GPU_ARGS } : { headless: true };
const { chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs');
const server = createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<!doctype html><title>envmap probe</title>'); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`;
const record = { tool: 'tests/envmap/browser-probe.mjs', observed: new Date().toISOString(), environment_class: 'PHYSICAL_BROWSER', launch, origin: url.replace(/:\d+\//, ':<port>/') };
const browser = await chromium.launch(launch);
try {
  record.playwright_browser_version = browser.version();
  const page = await browser.newPage();
  const cdp = await page.context().newCDPSession(page);
  record.cdp_browser_version = await cdp.send('Browser.getVersion');
  await page.goto(url);
  record.page = await page.evaluate(async () => {
    const r = { userAgent: navigator.userAgent, isSecureContext, crossOriginIsolated: self.crossOriginIsolated, sharedArrayBuffer_present: typeof SharedArrayBuffer !== 'undefined', hardwareConcurrency: navigator.hardwareConcurrency, gpu_exposed: 'gpu' in navigator, webassembly_present: typeof WebAssembly !== 'undefined' };
    const m64 = new Uint8Array([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0, 5, 3, 1, 0x04, 1]);
    r.memory64_validates = r.webassembly_present ? WebAssembly.validate(m64) : null;
    try { new WebAssembly.Memory({ initial: 1n, address: 'i64' }); r.memory64_descriptor_accepted = true; } catch (e) { r.memory64_descriptor_accepted = String(e); }
    if (r.gpu_exposed) {
      try {
        const a = await navigator.gpu.requestAdapter();
        if (!a) r.adapter = null;
        else {
          const info = a.info || {};
          r.adapter = { info: { vendor: info.vendor, architecture: info.architecture, device: info.device, description: info.description, isFallbackAdapter: info.isFallbackAdapter }, features: [...a.features].sort(), limits: { maxBufferSize: a.limits.maxBufferSize, maxStorageBufferBindingSize: a.limits.maxStorageBufferBindingSize } };
          try { const d = await a.requestDevice(); r.device = { acquired: true }; d.destroy(); const lost = await d.lost; r.device.lost_after_destroy = { reason: lost.reason }; } catch (e) { r.device = { acquired: false, error: String(e) }; }
        }
      } catch (e) { r.adapter_error = String(e); }
    }
    return r;
  });
} finally { await browser.close(); server.close(); }
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(record, null, 2) + '\n');
const p = record.page || {};
console.log(`${gpuFlags ? 'gpu-flags' : 'default'}: ${record.cdp_browser_version.product} js ${record.cdp_browser_version.jsVersion}; secure ${p.isSecureContext}; coi ${p.crossOriginIsolated}; SAB ${p.sharedArrayBuffer_present}; gpu ${p.gpu_exposed}; adapter ${p.adapter ? JSON.stringify(p.adapter.info) : p.adapter}; memory64 ${p.memory64_validates}`);
