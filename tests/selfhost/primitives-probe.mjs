// D12 self-hosting primitive probes (design/materialization/D12-INTENDED-SELF-HOSTING.md section 0).
// Observation only: nothing here implements self-hosting.  Each probe asks the browser one question the
// self-hosting architecture depends on and records what Chromium actually did.
// Usage: node primitives-probe.mjs <out dir>   env: KERNEL_WASM (wasm64 kernel module), BUNDLE_DIR (generated bundle),
//        REPO (git repository root, default cwd).  Exit 0 = the harness ran; verdicts are evidence.
import { createServer } from 'node:http';
import { spawnSync, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

const OUT = process.argv[2];
const REPO = process.env.REPO || process.cwd();
const sha256 = b => createHash('sha256').update(b).digest('hex');
const BUNDLE = process.env.BUNDLE_DIR;   // a freshly generated bundle (D25): no historical default
if (!BUNDLE || !existsSync(join(BUNDLE, 'bundle.json'))) { console.error('primitives-probe: BUNDLE_DIR must name a generated bundle directory (bundle.json present); historical evidence packages are not inputs'); process.exit(2); }
const bundleHashes = Object.fromEntries(readdirSync(BUNDLE).sort().map(f => [f, sha256(readFileSync(join(BUNDLE, f)))]));
const KERNEL = process.env.KERNEL_WASM;
const PORT_A = 47311, PORT_B = 47312;
const { chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs');
mkdirSync(join(OUT, 'probes'), { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TYPES = { html: 'text/html', js: 'text/javascript', mjs: 'text/javascript', json: 'application/json', wasm: 'application/wasm', webmanifest: 'application/manifest+json', txt: 'text/plain' };
const typeOf = p => TYPES[p.split('.').pop()] || 'application/octet-stream';

// ------------------------------------------------------------------------------------------ server with a route table
function server(port) {
  const routes = new Map();
  const log = [];
  const s = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    log.push(path);
    const r = routes.get(path);
    if (!r) { res.writeHead(404, { 'cache-control': 'no-store' }); res.end('not found'); return; }
    res.writeHead(200, { 'content-type': r.type || typeOf(path), 'cache-control': 'no-store', ...(r.headers || {}) });
    res.end(typeof r.body === 'function' ? r.body() : r.body);
  });
  return {
    routes, log, origin: `http://127.0.0.1:${port}`,
    start: () => new Promise(res => s.listen(port, '127.0.0.1', res)),
    stop: () => new Promise(res => { s.close(() => res()); s.closeAllConnections(); }),
  };
}
const A = server(PORT_A), B = server(PORT_B);
const html = (title, script) => `<!doctype html><meta charset="utf-8"><title>${title}</title><body><pre id=out>${title}</pre><script type="module">${script || ''}</script></body>`;
const add = (srv, path, body, extra = {}) => srv.routes.set(path, { body, ...extra });

// ------------------------------------------------------------------------------------------ browser
const profiles = mkdtempSync(join(tmpdir(), 'selfhost-profile-'));
const open = new Set();
async function launch(name) { const c = await chromium.launchPersistentContext(join(profiles, name), { headless: true }); open.add(c); c.on('close', () => open.delete(c)); return c; }
async function browserIdentity() {
  const ctx = await launch('identity');
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const v = await cdp.send('Browser.getVersion');
  await ctx.close();
  return { product: v.product, revision: v.revision, jsVersion: v.jsVersion, userAgent: v.userAgent, launch: 'playwright chromium.launchPersistentContext({headless:true})', executable: chromium.executablePath() };
}
const records = [];
async function probe(id, question, needed_for, fn) {
  const rec = { id, question, needed_for, started: new Date().toISOString() };
  try { Object.assign(rec, await fn()); }
  catch (e) { rec.verdict = rec.verdict || 'UNK'; rec.harness_error = String(e && e.stack || e).slice(0, 600); }
  for (const c of [...open]) await c.close().catch(() => {});   // a failing probe must not leave a browser keeping the harness alive
  rec.finished = new Date().toISOString();
  writeFileSync(join(OUT, 'probes', id + '.json'), JSON.stringify(rec, null, 2) + '\n');
  records.push({ id, verdict: rec.verdict, meaning: rec.meaning });
  console.log(`${String(rec.verdict).padEnd(4)} ${id}: ${rec.meaning || rec.harness_error}`);
}
const waitControlled = async page => {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });
};
const tryGoto = async (page, url) => { try { const r = await page.goto(url, { timeout: 8000 }); return { ok: true, status: r ? r.status() : null, title: await page.title() }; } catch (e) { return { ok: false, error: String(e.message || e).split('\n')[0] }; } };

// ================================================================================ P01 generated bundle SW offline
async function p01() {
  for (const f of readdirSync(BUNDLE)) add(A, '/b/' + f, readFileSync(join(BUNDLE, f)));
  await A.start();
  let ctx = await launch('p01');
  let page = await ctx.newPage();
  await page.goto(A.origin + '/b/index.html');
  let registered = true;
  try { await waitControlled(page); } catch { registered = false; }
  const cached = await page.evaluate(async () => { const ks = await caches.keys(); const out = {}; for (const k of ks) out[k] = (await (await caches.open(k)).keys()).map(r => new URL(r.url).pathname); return out; });
  await A.stop();
  const offline1 = await tryGoto(page, A.origin + '/b/index.html');
  let relay1 = null;
  if (offline1.ok) relay1 = await page.evaluate(async () => { const m = await import('./runtime.js'); await m.init(); const r = await m.transfer((await import('./selector.js')).STRATEGY.transfers[0].relation, new Uint8Array([0, 1, 127, 128, 255])); const s = m.snapshot(); return { relay: r.status, exact: r.exact === true, backend: r.backend, active: s.activation && s.activation.plan_id, admissions: Object.fromEntries(Object.entries(s.admissions).map(([k, v]) => [k, v.decision])) }; }).catch(e => ({ error: String(e) }));
  await ctx.close();
  ctx = await launch('p01');
  page = await ctx.newPage();
  const offline2 = await tryGoto(page, A.origin + '/b/index.html');
  const controlled2 = offline2.ok ? await page.evaluate(() => !!navigator.serviceWorker.controller) : false;
  await ctx.close();
  const ok = registered && offline1.ok && relay1 && relay1.exact === true && offline2.ok && controlled2;
  return { observed: { registered_and_controlling: registered, caches: cached, server_stopped: true, offline_reload: offline1, relay_offline: relay1, after_browser_restart: { ...offline2, controlled: controlled2 } },
    verdict: ok ? 'RUN' : 'ERR', meaning: ok ? 'the GENERATED bundle (object B) launches offline from its own versioned CacheStorage shell, before and after a browser restart, with the origin server stopped' : 'the generated bundle does not launch offline as intended' };
}

// ================================================================================ P02 SW cannot update itself offline
const P2_SW = v => `const VERSION=${JSON.stringify(v)};
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('message',async e=>{let opfs=false;try{await navigator.storage.getDirectory();opfs=true}catch(x){opfs=String(x)};e.source.postMessage({version:VERSION,locks:typeof navigator.locks,opfs_in_sw:opfs,idb_in_sw:typeof indexedDB})});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);
 if(u.pathname==='/p2/sw.js'){e.respondWith(new Response(${JSON.stringify('/*intercepted*/')}+'const VERSION="v2-served-by-sw-intercept";self.addEventListener("message",e=>e.source.postMessage({version:VERSION}));',{headers:{'content-type':'text/javascript'}}));return}
 if(u.pathname==='/p2/'||u.pathname==='/p2/index.html'){e.respondWith(new Response('<!doctype html><title>p2 (from sw)</title>',{headers:{'content-type':'text/html'}}))}});`;
async function p02() {
  add(A, '/p2/sw.js', P2_SW('v1-from-origin'));
  add(A, '/p2/index.html', html('p2', "await navigator.serviceWorker.register('/p2/sw.js',{scope:'/p2/'});"));
  await A.start();
  const ctx = await launch('p02');
  const page = await ctx.newPage();
  await page.goto(A.origin + '/p2/index.html');
  await waitControlled(page);
  const ask = () => page.evaluate(() => new Promise(r => { navigator.serviceWorker.addEventListener('message', e => r(e.data), { once: true }); navigator.serviceWorker.controller.postMessage('v'); }));
  const v0 = await ask();
  const pageSeesScript = await page.evaluate(async () => (await (await fetch('/p2/sw.js')).text()).slice(0, 40));
  const upd1 = await page.evaluate(async () => { const reg = await navigator.serviceWorker.getRegistration('/p2/'); try { await reg.update(); } catch (e) { return { rejected: String(e) }; } await new Promise(r => setTimeout(r, 1500)); return { rejected: false, installing: !!reg.installing, waiting: !!reg.waiting }; });
  const v1 = await ask();
  await A.stop();
  const upd2 = await page.evaluate(async () => { const reg = await navigator.serviceWorker.getRegistration('/p2/'); try { await reg.update(); return { rejected: false }; } catch (e) { return { rejected: String(e).slice(0, 160) }; } });
  const v2 = await ask();
  await ctx.close();
  const ok = v0.version === 'v1-from-origin' && pageSeesScript.startsWith('/*intercepted*/') && v1.version === 'v1-from-origin' && !!upd2.rejected && v2.version === 'v1-from-origin';
  return { observed: { active_version_initial: v0, page_fetch_of_sw_script_goes_through_sw: pageSeesScript, update_with_origin_up: upd1, version_after_update_origin_up: v1.version, update_with_origin_down: upd2, version_after_update_origin_down: v2.version },
    verdict: ok ? 'RUN' : 'ERR', meaning: ok ? 'a service worker cannot replace its own script from local objects: the update fetch bypasses the worker (served v1 from the origin although the worker would answer v2) and fails when the origin is gone; the active script stays. The worker script is therefore an immutable seed for as long as the origin server is absent' : 'service-worker self-update behaved differently from the pinned Update algorithm' };
}

// ================================================================================ P03 storage survives restart; origin partition
async function p03() {
  const writer = html('p3', `const t=location.hash.slice(1);const root=await navigator.storage.getDirectory();const fh=await root.getFileHandle('probe.txt',{create:true});const w=await fh.createWritable();await w.write(t);await w.close();
await new Promise((res,rej)=>{const o=indexedDB.open('p3',1);o.onupgradeneeded=()=>o.result.createObjectStore('kv');o.onsuccess=()=>{const tx=o.result.transaction('kv','readwrite',{durability:'strict'});tx.objectStore('kv').put(t,'token');tx.oncomplete=res;tx.onerror=rej};o.onerror=rej});
await (await caches.open('p3')).put('/p3/x',new Response(t));localStorage.setItem('p3',t);document.title='written';`);
  const reader = html('p3r', `const r={};try{const root=await navigator.storage.getDirectory();r.opfs=await (await (await root.getFileHandle('probe.txt')).getFile()).text()}catch(e){r.opfs='ABSENT:'+e.name}
r.idb=await new Promise(res=>{const o=indexedDB.open('p3',1);o.onupgradeneeded=()=>o.result.createObjectStore('kv');o.onsuccess=()=>{const q=o.result.transaction('kv').objectStore('kv').get('token');q.onsuccess=()=>res(q.result===undefined?'ABSENT':q.result)};o.onerror=()=>res('ERR')});
const c=await (await caches.open('p3')).match('/p3/x');r.cache=c?await c.text():'ABSENT';r.local=localStorage.getItem('p3')||'ABSENT';r.persisted=await navigator.storage.persisted();r.estimate=await navigator.storage.estimate();window.__r=r;document.title='read';`);
  for (const S of [A, B]) { add(S, '/p3/w.html', writer); add(S, '/p3/r.html', reader); }
  const token = 'tok-' + Date.now();
  await A.start();
  let ctx = await launch('p03');
  let page = await ctx.newPage();
  await page.goto(A.origin + '/p3/w.html#' + token); await page.waitForFunction(() => document.title === 'written');
  await ctx.close();
  ctx = await launch('p03'); page = await ctx.newPage();
  await page.goto(A.origin + '/p3/r.html'); await page.waitForFunction(() => document.title === 'read');
  const sameOrigin = await page.evaluate(() => window.__r);
  await B.start();
  await page.goto(B.origin + '/p3/r.html'); await page.waitForFunction(() => document.title === 'read');
  const otherPort = await page.evaluate(() => window.__r);
  await B.stop(); await ctx.close(); await A.stop();
  const survived = ['opfs', 'idb', 'cache', 'local'].every(k => sameOrigin[k] === token);
  const partitioned = ['opfs', 'idb', 'cache', 'local'].every(k => String(otherPort[k]).startsWith('ABSENT'));
  return { observed: { token, after_restart_same_origin: sameOrigin, other_port_same_profile: otherPort }, verdict: survived && partitioned ? 'RUN' : 'ERR',
    meaning: `OPFS, IndexedDB, CacheStorage and localStorage ${survived ? 'survive' : 'DO NOT all survive'} a browser restart on the same origin; a different port on the same host ${partitioned ? 'sees none of it' : 'sees some of it'}: installed-Factory identity is the exact origin (scheme+host+port), and a moved port is a different Factory with empty storage. persisted() = ${sameOrigin.persisted}` };
}

// ================================================================================ P04 generated app served from OPFS by a SW, offline
const P4_SW = `self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
const T={html:'text/html',js:'text/javascript',json:'application/json',wasm:'application/wasm',webmanifest:'application/manifest+json'};
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);const m=u.pathname.match(/^\\/p4\\/apps\\/([a-z0-9-]+)\\/(.+)$/);if(!m)return;
 e.respondWith((async()=>{try{const root=await navigator.storage.getDirectory();let d=await (await root.getDirectoryHandle('apps')).getDirectoryHandle(m[1]);const f=await (await d.getFileHandle(m[2])).getFile();
 return new Response(f,{headers:{'content-type':T[m[2].split('.').pop()]||'application/octet-stream','x-served-by':'opfs-sw'}})}catch(x){return new Response('opfs miss '+x,{status:404})}})())});`;
async function p04() {
  add(A, '/p4/sw.js', P4_SW);
  const files = readdirSync(BUNDLE);
  add(A, '/p4/setup.html', html('p4', `const files=${JSON.stringify(files)};const root=await navigator.storage.getDirectory();const d=await (await root.getDirectoryHandle('apps',{create:true})).getDirectoryHandle('relay',{create:true});
for(const f of files){const b=await (await fetch('/b/'+f)).arrayBuffer();const w=await (await d.getFileHandle(f,{create:true})).createWritable();await w.write(b);await w.close()}
await navigator.serviceWorker.register('/p4/sw.js',{scope:'/p4/'});await navigator.serviceWorker.ready;document.title='stored';`));
  if (!A.routes.has('/b/index.html')) for (const f of files) add(A, '/b/' + f, readFileSync(join(BUNDLE, f)));
  await A.start();
  let ctx = await launch('p04'); let page = await ctx.newPage();
  await page.goto(A.origin + '/p4/setup.html'); await page.waitForFunction(() => document.title === 'stored', null, { timeout: 20000 });
  await A.stop();
  const nav = await tryGoto(page, A.origin + '/p4/apps/relay/index.html');
  const run = nav.ok ? await page.evaluate(async () => {
    const hdr = (await fetch('./runtime.js')).headers.get('x-served-by');
    const m = await import('./runtime.js'); await m.init(); const payload = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x00, 0x13]); const r0 = await m.transfer((await import('./selector.js')).STRATEGY.transfers[0].relation, payload); const r = { status: r0.status, exact: r0.exact, backend: r0.backend, plan_id: r0.plan_id, input_sha256: r0.input_sha256 }; const s = m.snapshot();
    const regs = (await navigator.serviceWorker.getRegistrations()).map(x => x.scope);
    return { served_by: hdr, relay: r, active_plan: s.activation && s.activation.plan_id, admissions: Object.fromEntries(Object.entries(s.admissions).map(([k, v]) => [k, v.decision])), registrations: regs };
  }).catch(e => ({ error: String(e) })) : null;
  await ctx.close();
  ctx = await launch('p04'); page = await ctx.newPage();
  const afterRestart = await tryGoto(page, A.origin + '/p4/apps/relay/index.html');
  const run2 = afterRestart.ok ? await page.evaluate(async () => { const m = await import('./runtime.js'); await m.init(); const r0 = await m.transfer((await import('./selector.js')).STRATEGY.transfers[0].relation, new Uint8Array([1, 2, 3, 4])); return { status: r0.status, exact: r0.exact, backend: r0.backend }; }).catch(e => ({ error: String(e) })) : null;
  await ctx.close();
  const exact = r => r && JSON.stringify(r).includes('"exact":true');
  const ok = nav.ok && run && run.served_by === 'opfs-sw' && exact(run.relay) && afterRestart.ok && exact(run2);
  return { observed: { offline_navigation: nav, offline_run: run, after_restart: afterRestart, after_restart_relay: run2 }, verdict: ok ? 'RUN' : 'ERR',
    meaning: ok ? 'a generated WebApp (HTML, JS modules and its wasm64 module) is served entirely from persisted OPFS objects by a service-worker router and executes the relay exactly with no origin server, before and after a browser restart (L1 primitive)' : 'serving a generated WebApp from OPFS through a service worker did not work end to end' };
}

// ================================================================================ P05 cross-origin isolation granted by the SW
async function p05() {
  add(A, '/p5/sw.js', `self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.pathname==='/p5/app.html')e.respondWith(new Response('<!doctype html><title>p5app</title><script>window.__r={coi:self.crossOriginIsolated,sab:typeof SharedArrayBuffer};try{new WebAssembly.Memory({initial:1,maximum:1,shared:true});window.__r.shared_memory=true}catch(x){window.__r.shared_memory=String(x)}</script>',{headers:{'content-type':'text/html','cross-origin-opener-policy':'same-origin','cross-origin-embedder-policy':'require-corp'}}))});`);
  add(A, '/p5/index.html', html('p5', "await navigator.serviceWorker.register('/p5/sw.js',{scope:'/p5/'});await navigator.serviceWorker.ready;document.title='ready';"));
  await A.start();
  const ctx = await launch('p05'); const page = await ctx.newPage();
  await page.goto(A.origin + '/p5/index.html'); await page.waitForFunction(() => document.title === 'ready');
  const plain = await page.evaluate(() => ({ coi: self.crossOriginIsolated, sab: typeof SharedArrayBuffer }));
  await A.stop();
  const nav = await tryGoto(page, A.origin + '/p5/app.html');
  const iso = nav.ok ? await page.evaluate(() => window.__r) : null;
  await ctx.close();
  const ok = iso && iso.coi === true && iso.sab === 'function';
  return { observed: { page_without_headers: plain, offline_navigation: nav, sw_synthesized_page_with_coop_coep: iso }, verdict: ok ? 'RUN' : 'ERR',
    meaning: ok ? 'the service-worker router can grant cross-origin isolation (COOP same-origin + COEP require-corp on synthesized navigations) with no server; SharedArrayBuffer and a shared WebAssembly.Memory become available. This removes one PRECONDITION of threaded Wasm; it does not admit threads (ERR-002/ERR-003 stay)' : 'cross-origin isolation could not be granted from the service worker' };
}

// ================================================================================ P06 IndexedDB atomic pointer + CAS race
async function p06() {
  add(A, '/p6/index.html', html('p6', `const open=()=>new Promise((res,rej)=>{const o=indexedDB.open('gen',1);o.onupgradeneeded=()=>o.result.createObjectStore('ptr');o.onsuccess=()=>res(o.result);o.onerror=rej});
const db=await open();const get=k=>new Promise(r=>{const q=db.transaction('ptr').objectStore('ptr').get(k);q.onsuccess=()=>r(q.result)});
window.__init=async()=>{await new Promise(r=>{const tx=db.transaction('ptr','readwrite',{durability:'strict'});tx.objectStore('ptr').put('g1','active');tx.objectStore('ptr').put('g0','previous');tx.oncomplete=r});return {active:await get('active'),durability:'strict'}};
window.__abort=async()=>{await new Promise(r=>{const tx=db.transaction('ptr','readwrite');tx.objectStore('ptr').put('gX','active');tx.objectStore('ptr').put('g1','previous');tx.onabort=r;tx.abort()});return {active:await get('active'),previous:await get('previous')}};
window.__cas=me=>new Promise(r=>{const tx=db.transaction('ptr','readwrite',{durability:'strict'});const s=tx.objectStore('ptr');let won=false;const q=s.get('active');q.onsuccess=()=>{if(q.result==='g1'){won=true;s.put('g2-'+me,'active');s.put('g1','previous')}};tx.oncomplete=()=>r({me,won})});
window.__read=async()=>({active:await get('active'),previous:await get('previous')});document.title='ready';`));
  await A.start();
  const ctx = await launch('p06');
  const p1 = await ctx.newPage(), p2 = await ctx.newPage();
  await p1.goto(A.origin + '/p6/index.html'); await p2.goto(A.origin + '/p6/index.html');
  await p1.waitForFunction(() => document.title === 'ready'); await p2.waitForFunction(() => document.title === 'ready');
  const init = await p1.evaluate(() => window.__init());
  const aborted = await p1.evaluate(() => window.__abort());
  const [c1, c2] = await Promise.all([p1.evaluate(() => window.__cas('A')), p2.evaluate(() => window.__cas('B'))]);
  const final = await p1.evaluate(() => window.__read());
  await ctx.close(); await A.stop();
  const winners = [c1, c2].filter(c => c.won);
  const ok = aborted.active === 'g1' && aborted.previous === 'g0' && winners.length === 1 && final.active === 'g2-' + winners[0].me && final.previous === 'g1';
  return { observed: { init, after_abort: aborted, cas: [c1, c2], final }, verdict: ok ? 'RUN' : 'ERR',
    meaning: ok ? 'an aborted multi-key IndexedDB transaction leaves the generation pointer untouched, and two concurrent compare-and-swap transactions from base g1 produce exactly one winner: IndexedDB can hold an atomic active/previous generation pointer and a base-unmoved ref update (the browser analogue of git update-ref <new> <old>)' : 'IndexedDB did not provide the expected atomic pointer semantics' };
}

// ================================================================================ P07 persistence request
async function p07() {
  add(A, '/p7/index.html', html('p7', "window.__r={before:await navigator.storage.persisted(),persist:await navigator.storage.persist(),after:await navigator.storage.persisted(),estimate:await navigator.storage.estimate()};document.title='done';"));
  await A.start();
  const ctx = await launch('p07'); const page = await ctx.newPage();
  await page.goto(A.origin + '/p7/index.html'); await page.waitForFunction(() => document.title === 'done');
  const r = await page.evaluate(() => window.__r);
  await ctx.close(); await A.stop();
  return { observed: r, verdict: r.after ? 'RUN' : 'GAP', meaning: r.after ? 'persistent storage granted in this environment' : 'persist() returned false in this headless, non-installed environment: the bucket stays "best-effort" and may be cleared under storage pressure (storage.bs "Storage pressure"); durability of an installed Factory\'s generations is not established here' };
}

// ================================================================================ P08 candidate confinement in an opaque-origin sandbox
const P8_PROBE = `(async()=>{const r={origin:self.origin,isSecureContext,gpu:'gpu' in navigator,wasm:typeof WebAssembly};const m64=new Uint8Array([0,0x61,0x73,0x6d,1,0,0,0,5,3,1,0x04,1]);r.memory64=typeof WebAssembly!=='undefined'&&WebAssembly.validate(m64);
try{indexedDB.open('x');r.idb='opened'}catch(e){r.idb=e.name}
try{await navigator.storage.getDirectory();r.opfs='opened'}catch(e){r.opfs=e.name}
try{await caches.keys();r.cache='opened'}catch(e){r.cache=e.name}
try{r.sw=navigator.serviceWorker?await navigator.serviceWorker.register('/p8/none.js').then(()=>'registered',e=>e.name):'absent'}catch(e){r.sw=e.name}
try{localStorage.getItem('a');r.local='opened'}catch(e){r.local=e.name}
try{const w=new Worker(URL.createObjectURL(new Blob(['postMessage(typeof WebAssembly)'],{type:'text/javascript'})));r.worker=await new Promise(res=>{w.onmessage=e=>res('ok:'+e.data);w.onerror=e=>res('error');setTimeout(()=>res('timeout'),3000)})}catch(e){r.worker=e.name}
try{const t=await (await fetch('/p8/data.txt')).text();r.same_origin_fetch='read:'+t}catch(e){r.same_origin_fetch=e.name}
parent.postMessage({kind:document.body.dataset.kind,r},'*')})()`;
async function p08() {
  add(A, '/p8/data.txt', 'secret-canonical-bytes');
  add(A, '/p8/index.html', `<!doctype html><title>p8</title><script>window.__res={};addEventListener('message',e=>{window.__res[e.data.kind]=e.data.r});
const mk=(kind,sb)=>{const f=document.createElement('iframe');f.setAttribute('sandbox',sb);f.srcdoc='<body data-kind="'+kind+'"><script>'+${JSON.stringify(P8_PROBE)}+'<\\/script>';document.body.appendChild(f)};
addEventListener('load',()=>{mk('opaque','allow-scripts');mk('same_origin','allow-scripts allow-same-origin')});</script><body></body>`, { type: 'text/html' });
  await A.start();
  const ctx = await launch('p08'); const page = await ctx.newPage();
  await page.goto(A.origin + '/p8/index.html');
  await page.waitForFunction(() => window.__res.opaque && window.__res.same_origin, null, { timeout: 15000 });
  const r = await page.evaluate(() => window.__res);
  await ctx.close(); await A.stop();
  const o = r.opaque;
  const confined = o.origin === 'null' && o.idb !== 'opened' && o.opfs !== 'opened' && o.cache !== 'opened' && !String(o.same_origin_fetch).startsWith('read:');
  return { observed: r, verdict: confined ? 'RUN' : 'ERR',
    meaning: `an opaque-origin sandboxed iframe ${confined ? 'CANNOT' : 'CAN'} reach OPFS / IndexedDB / CacheStorage / same-origin bytes (candidate code can be confined and fed only by messages); isSecureContext=${o.isSecureContext}, navigator.gpu=${o.gpu}, memory64=${o.memory64}, worker=${o.worker}. A same-origin iframe reaches everything (opfs=${r.same_origin.opfs}): same-origin candidate code is NOT confined` };
}

// ================================================================================ P09 git object identity without the git executable
function gitBatch(ids) {
  const out = execFileSync('git', ['-C', REPO, 'cat-file', '--batch'], { input: ids.join('\n') + '\n', maxBuffer: 1 << 30 });
  const map = new Map(); let off = 0;
  for (const id of ids) {
    const nl = out.indexOf(0x0a, off); const [oid, type, size] = out.slice(off, nl).toString().split(' ');
    map.set(id, out.slice(nl + 1, nl + 1 + Number(size))); off = nl + 1 + Number(size) + 1;
  }
  return map;
}
async function p09() {
  const head = execFileSync('git', ['-C', REPO, 'rev-parse', 'HEAD']).toString().trim();
  const headTree = execFileSync('git', ['-C', REPO, 'rev-parse', 'HEAD^{tree}']).toString().trim();
  const ls = execFileSync('git', ['-C', REPO, 'ls-tree', '-r', '-z', 'HEAD'], { maxBuffer: 1 << 26 }).toString().split('\0').filter(Boolean).map(l => { const [meta, path] = l.split('\t'); const [mode, type, id] = meta.split(' '); return { mode, type, id, path }; });
  const blobs = gitBatch(ls.map(e => e.id));
  // the browser receives mode + path + bytes; the expected ids stay in the harness
  const listing = ls.map((e, i) => ({ i, mode: e.mode, path: e.path }));
  add(A, '/p9/list.json', JSON.stringify(listing));
  ls.forEach((e, i) => add(A, '/p9/blob/' + i, blobs.get(e.id), { type: 'application/octet-stream' }));
  const rawCommit = execFileSync('git', ['-C', REPO, 'cat-file', 'commit', 'HEAD']);
  add(A, '/p9/commit.raw', rawCommit, { type: 'application/octet-stream' });
  const common = execFileSync('git', ['-C', REPO, 'rev-parse', '--path-format=absolute', '--git-common-dir']).toString().trim();
  const loose = []; const odir = join(common, 'objects');
  for (const d of readdirSync(odir).filter(d => /^[0-9a-f]{2}$/.test(d)).sort()) { for (const f of readdirSync(join(odir, d)).sort()) { loose.push(d + f); if (loose.length >= 6) break; } if (loose.length >= 6) break; }
  loose.forEach((id, i) => add(A, '/p9/loose/' + i, readFileSync(join(odir, id.slice(0, 2), id.slice(2))), { type: 'application/octet-stream' }));
  add(A, '/p9/index.html', html('p9', `
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');const enc=new TextEncoder();
const cat=(...parts)=>{const n=parts.reduce((a,p)=>a+p.length,0);const o=new Uint8Array(n);let k=0;for(const p of parts){o.set(p,k);k+=p.length}return o};
const oid=async(type,body)=>hex(await crypto.subtle.digest('SHA-1',cat(enc.encode(type+' '+body.length+'\\0'),body)));
const inflate=async b=>new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
const deflate=async b=>new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
const list=await (await fetch('/p9/list.json')).json();const blobIds={};const root={};
for(const e of list){const b=new Uint8Array(await (await fetch('/p9/blob/'+e.i)).arrayBuffer());const id=await oid('blob',b);blobIds[e.i]=id;
 const parts=e.path.split('/');let t=root;for(const p of parts.slice(0,-1)){t[p]=t[p]||{};t=t[p]}t[parts.at(-1)]={mode:e.mode,id}}
const treeId=async t=>{const names=Object.keys(t);const key=n=>t[n].id&&t[n].mode?n:n+'/';names.sort((a,b)=>{const x=key(a),y=key(b);return x<y?-1:x>y?1:0});
 const chunks=[];for(const n of names){let mode,id;if(t[n].id&&t[n].mode){mode=t[n].mode;id=t[n].id}else{mode='40000';id=await treeId(t[n])}
 chunks.push(enc.encode(mode+' '+n+'\\0'));chunks.push(new Uint8Array(id.match(/../g).map(h=>parseInt(h,16))))}return oid('tree',cat(...chunks))};
const rootTree=await treeId(root);
const rawCommit=new Uint8Array(await (await fetch('/p9/commit.raw')).arrayBuffer());const headCommit=await oid('commit',rawCommit);
const loose=[];for(let i=0;i<6;i++){try{const z=new Uint8Array(await (await fetch('/p9/loose/'+i)).arrayBuffer());const raw=await inflate(z);const nul=raw.indexOf(0);const [type,size]=new TextDecoder().decode(raw.slice(0,nul)).split(' ');loose.push({i,type,size:Number(size),id:await oid(type,raw.slice(nul+1))})}catch(x){loose.push({i,error:String(x)})}}
const msg='D12 probe: commit constructed in the browser\\n';const who='FactTest Factory <factory@facttest.invalid> 1790000000 +0000';
const newCommitBody=enc.encode('tree '+rootTree+'\\nparent '+headCommit+'\\nauthor '+who+'\\ncommitter '+who+'\\n\\n'+msg);const newCommit=await oid('commit',newCommitBody);
const newBlob=enc.encode('written by the browser for git to read\\n');const newBlobId=await oid('blob',newBlob);const z=await deflate(cat(enc.encode('blob '+newBlob.length+'\\0'),newBlob));
window.__r={files:list.length,blobIds,rootTree,headCommit,loose,newCommit,newCommitBody:[...newCommitBody],newBlobId,newBlobZ:[...z]};document.title='done';`));
  await A.start();
  const ctx = await launch('p09'); const page = await ctx.newPage();
  const t0 = Date.now();
  await page.goto(A.origin + '/p9/index.html'); await page.waitForFunction(() => document.title === 'done', null, { timeout: 120000 });
  const r = await page.evaluate(() => window.__r);
  await ctx.close(); await A.stop();
  const blobMatch = ls.filter((e, i) => r.blobIds[i] === e.id).length;
  const looseOk = r.loose.filter((l, i) => l.id === loose[i]).length;
  // cross-check the browser-built commit and loose object with git itself, in a scratch repository borrowing objects
  const scratch = mkdtempSync(join(tmpdir(), 'selfhost-git-'));
  spawnSync('git', ['init', '-q', scratch]);
  writeFileSync(join(scratch, '.git/objects/info/alternates'), odir + '\n');
  const gitCommitId = execFileSync('git', ['-C', scratch, 'hash-object', '-t', 'commit', '--stdin'], { input: Buffer.from(r.newCommitBody) }).toString().trim();
  const ct = spawnSync('git', ['-C', scratch, 'commit-tree', headTree, '-p', head, '-m', 'D12 probe: commit constructed in the browser'], { env: { ...process.env, GIT_AUTHOR_NAME: 'FactTest Factory', GIT_AUTHOR_EMAIL: 'factory@facttest.invalid', GIT_AUTHOR_DATE: '1790000000 +0000', GIT_COMMITTER_NAME: 'FactTest Factory', GIT_COMMITTER_EMAIL: 'factory@facttest.invalid', GIT_COMMITTER_DATE: '1790000000 +0000' } });
  const objDir = join(scratch, '.git/objects', r.newBlobId.slice(0, 2)); mkdirSync(objDir, { recursive: true });
  writeFileSync(join(objDir, r.newBlobId.slice(2)), Buffer.from(r.newBlobZ));
  const gitReads = spawnSync('git', ['-C', scratch, 'cat-file', '-p', r.newBlobId]).stdout.toString();
  const fsck = spawnSync('git', ['-C', scratch, 'fsck', '--no-dangling', '--connectivity-only']);
  rmSync(scratch, { recursive: true, force: true });
  const ok = blobMatch === ls.length && r.rootTree === headTree && r.headCommit === head && looseOk === loose.length && gitCommitId === r.newCommit && ct.stdout.toString().trim() === r.newCommit && gitReads.startsWith('written by the browser');
  return { observed: { files: ls.length, blob_ids_matching_git: blobMatch, browser_root_tree: r.rootTree, git_head_tree: headTree, browser_head_commit: r.headCommit, git_head: head,
    loose_objects_inflated_and_verified: `${looseOk}/${loose.length}`, browser_new_commit: r.newCommit, git_hash_object_of_same_bytes: gitCommitId, git_commit_tree_same_inputs: ct.stdout.toString().trim(),
    browser_written_loose_blob_read_by_git: gitReads.trim(), elapsed_ms: Date.now() - t0, hash: 'WebCrypto SHA-1 (plain; git uses SHA-1DC collision detection)' },
    verdict: ok ? 'RUN' : 'ERR', meaning: ok ? 'git object semantics are reproducible without the git executable: the browser recomputed every blob id and the exact HEAD tree and commit ids, inflated and verified real loose objects, built a commit byte-identical to git commit-tree, and wrote a loose object git reads' : 'browser-side git object identity differs from git' };
}

// ================================================================================ P10 wasm64 kernel in a dedicated worker
async function p10() {
  if (!KERNEL || !existsSync(KERNEL)) return { verdict: 'UNK', meaning: 'KERNEL_WASM not provided' };
  const wasm = readFileSync(KERNEL);
  add(A, '/p10/kernel.wasm', wasm);
  add(A, '/p10/source.ascii', readFileSync(join(REPO, 'fixtures/commissioning/byte-relay.ascii')), { type: 'text/plain' });
  add(A, '/p10/worker.js', `self.onmessage=async()=>{const r={};try{
const bytes=new Uint8Array(await (await fetch('/p10/kernel.wasm')).arrayBuffer());const src=new Uint8Array(await (await fetch('/p10/source.ascii')).arrayBuffer());
const mod=await WebAssembly.compile(bytes);r.imports=WebAssembly.Module.imports(mod).length;r.exports=WebAssembly.Module.exports(mod).map(e=>e.name).sort();
const run=async mode=>{const {exports:x}=await WebAssembly.instantiate(mod,{});new Uint8Array(x.memory.buffer,Number(x.input_buffer_ptr()),src.length).set(src);x.submit_source_bytes(BigInt(src.length));
 const t=performance.now();const status=x.check_or_compile(mode);const ms=performance.now()-t;const n=x.read_diagnostics();const d=JSON.parse(new TextDecoder().decode(new Uint8Array(x.memory.buffer,Number(x.output_buffer_ptr()),Number(n))));
 const k=x.read_artifact_metadata();const md=JSON.parse(new TextDecoder().decode(new Uint8Array(x.memory.buffer,Number(x.output_buffer_ptr()),Number(k))));
 return {status,ms:Math.round(ms),diagnostics:d.diagnostics.map(z=>z.code),diag_status:d.status,artifacts:md.artifacts.map(a=>a.kind+':'+a.status+':'+a.byte_len)}};
r.analyze=await run(0);r.build=await run(1);r.locks=typeof navigator.locks;
try{const root=await navigator.storage.getDirectory();const fh=await root.getFileHandle('sync.bin',{create:true});const h=await fh.createSyncAccessHandle();h.write(new Uint8Array([1,2,3]),{at:0});h.flush();r.opfs_sync_handle=h.getSize();h.close()}catch(e){r.opfs_sync_handle=String(e)}
}catch(e){r.error=String(e)}postMessage(r)}`);
  add(A, '/p10/index.html', html('p10', "const w=new Worker('/p10/worker.js');window.__r=await new Promise(r=>{w.onmessage=e=>r(e.data);w.postMessage('go')});document.title='done';"));
  await A.start();
  const ctx = await launch('p10'); const page = await ctx.newPage();
  await page.goto(A.origin + '/p10/index.html'); await page.waitForFunction(() => document.title === 'done', null, { timeout: 60000 });
  const r = await page.evaluate(() => window.__r);
  await ctx.close(); await A.stop();
  const missing = ['submit_contracts', 'submit_metrics', 'submit_evidence_tape', 'observe', 'read_artifact', 'bundle_file'].filter(n => !r.exports.includes(n));
  return { observed: { kernel_sha256: sha256(wasm), kernel_bytes: wasm.length, ...r, abi_operations_absent_from_wasm_exports: missing },
    verdict: 'OBS', meaning: `the wasm64 kernel runs in a dedicated worker (ANALYZE status ${r.analyze && r.analyze.status}, BUILD status ${r.build && r.build.status}, diagnostics [${r.build && r.build.diagnostics.join(',')}], BUILD artifacts ${r.build && r.build.artifacts.join(' ')}); the wasm export surface lacks ${missing.join(', ')}, so a browser host cannot supply contracts/metrics or read the emitted bundle: in-browser ASCII -> plan -> codegen -> bundle is not reachable through the current ABI [GAP]` };
}

// ================================================================================ P14 a broken service worker needs the origin to recover
async function p14() {
  add(A, '/p14/sw.js', "self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>e.respondWith(Response.error()));");
  add(A, '/p14/index.html', html('p14', "await navigator.serviceWorker.register('/p14/sw.js',{scope:'/p14/'});await navigator.serviceWorker.ready;document.title='registered';"));
  add(A, '/p14-recover.html', html('recover', "const regs=await navigator.serviceWorker.getRegistrations();for(const r of regs)await r.unregister();document.title='recovered:'+regs.length;"));
  await A.start();
  const ctx = await launch('p14'); const page = await ctx.newPage();
  await page.goto(A.origin + '/p14/index.html'); await page.waitForFunction(() => document.title === 'registered');
  const broken_with_origin_up = await tryGoto(page, A.origin + '/p14/index.html');
  await A.stop();
  const broken_offline = await tryGoto(page, A.origin + '/p14/index.html');
  const recover_offline = await tryGoto(page, A.origin + '/p14-recover.html');
  await A.start();
  const rp = await ctx.newPage();
  const recover_online = await tryGoto(rp, A.origin + '/p14-recover.html');
  await rp.waitForFunction(() => document.title.startsWith('recovered'), null, { timeout: 5000 }).catch(() => {});
  recover_online.title_after = await rp.title();
  const ap = await ctx.newPage();
  const after = await tryGoto(ap, A.origin + '/p14/index.html');
  await ctx.close(); await A.stop();
  const ok = !broken_with_origin_up.ok && !broken_offline.ok && !recover_offline.ok && recover_online.ok && after.ok;
  return { observed: { broken_with_origin_up, broken_offline, recover_page_offline: recover_offline, recover_page_online: recover_online, after_unregister: after }, verdict: ok ? 'RUN' : 'OBS',
    meaning: ok ? 'a broken service worker blocks every navigation in its scope even with the origin up; offline there is no page that can reach and unregister it; recovery needed the origin server (or browser-UI site-data clearing). The seed must be correct by construction and minimal' : 'broken-SW behaviour differed from expectation; see observed' };
}

// ================================================================================ P15 interrupted update keeps the old worker
async function p15() {
  let version = 'v1';
  A.routes.set('/p15/sw.js', { type: 'text/javascript', body: () => version === 'v1'
    ? "const V='v1';self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('message',e=>e.source.postMessage(V));"
    : "const V='v2-slow';self.addEventListener('install',e=>e.waitUntil(new Promise(r=>setTimeout(r,120000))));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('message',e=>e.source.postMessage(V));" });
  add(A, '/p15/index.html', html('p15', "await navigator.serviceWorker.register('/p15/sw.js',{scope:'/p15/'});await navigator.serviceWorker.ready;document.title='ready';"));
  await A.start();
  let ctx = await launch('p15'); let page = await ctx.newPage();
  await page.goto(A.origin + '/p15/index.html'); await page.waitForFunction(() => document.title === 'ready'); await waitControlled(page);
  const ask = p => p.evaluate(() => new Promise(r => { navigator.serviceWorker.addEventListener('message', e => r(e.data), { once: true }); navigator.serviceWorker.controller.postMessage('v'); }));
  const before = await ask(page);
  version = 'v2';
  const started = await page.evaluate(async () => { const reg = await navigator.serviceWorker.getRegistration('/p15/'); reg.update().catch(() => {}); await new Promise(r => setTimeout(r, 2000)); return { installing: !!reg.installing }; });
  await ctx.close();           // interrupt the browser during the v2 install
  ctx = await launch('p15'); page = await ctx.newPage();
  const nav = await tryGoto(page, A.origin + '/p15/index.html');
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 10000 }).catch(() => {});
  const after = await ask(page).catch(e => 'no controller: ' + e);
  const state = await page.evaluate(async () => { const reg = await navigator.serviceWorker.getRegistration('/p15/'); return { active: !!reg.active, installing: !!reg.installing, waiting: !!reg.waiting }; });
  await ctx.close(); await A.stop();
  const ok = before === 'v1' && started.installing && after === 'v1';
  return { observed: { before, v2_install_started: started, restart_navigation: nav, active_after_restart: after, registration_state: state }, verdict: ok ? 'RUN' : 'OBS',
    meaning: ok ? 'a service-worker update interrupted mid-install (browser closed) leaves the previous worker active after restart: the platform already gives install-or-keep-old semantics for the seed script (Install algorithm, installFailed / discarded task)' : 'interrupted update did not simply keep v1; see observed' };
}


// ================================================================================ P16 confined generation loaded by a broker
const P16_BOOT = `addEventListener('message',async e=>{const r={origin:self.origin,isSecureContext};try{
const u=URL.createObjectURL(new Blob([e.data.module],{type:'text/javascript'}));const m=await import(u);
r.module=await m.run(e.data.wasm,e.data.payload)}catch(x){r.error=String(x)}
try{r.controller=navigator.serviceWorker?String(navigator.serviceWorker.controller):'absent'}catch(x){r.controller=x.name}
try{await fetch('/b/runtime.js');r.origin_fetch='read'}catch(x){r.origin_fetch=x.name}
try{void parent.document.title;r.parent_dom='reachable'}catch(x){r.parent_dom=x.name}
try{await navigator.storage.getDirectory();r.opfs='opened'}catch(x){r.opfs=x.name}
parent.postMessage({kind:'p16',r},'*')});parent.postMessage({kind:'p16-ready'},'*');`;
const P16_MODULE = `export async function run(wasmBytes,payload){const mod=await WebAssembly.compile(wasmBytes);const {exports:x}=await WebAssembly.instantiate(mod,{});
const mem=x.memory,rin=x.region_in(),rout=x.region_out();new Uint8Array(mem.buffer,Number(rin),payload.length).set(payload);x.copy_bytes(rin,rout,BigInt(payload.length));
const out=[...new Uint8Array(mem.buffer,Number(rout),payload.length)];return {abi:Number(x.abi_version()),out,exact:out.every((b,i)=>b===payload[i])}}`;
async function p16() {
  const files = readdirSync(BUNDLE);
  for (const f of files) add(A, '/b/' + f, readFileSync(join(BUNDLE, f)));
  add(A, '/p16/sw.js', "self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));const cache=caches.open('p16');self.addEventListener('fetch',e=>e.respondWith((async()=>{const c=await cache;const hit=await c.match(e.request);if(hit)return hit;const r=await fetch(e.request);c.put(e.request,r.clone());return r})()));");
  add(A, '/p16/index.html', `<!doctype html><title>p16</title><script>
window.__res=null;addEventListener('message',async e=>{if(e.data.kind==='p16-ready'){
 const module=await (await fetch('/p16/module.js')).text();const wasm=new Uint8Array(await (await fetch('/b/wasm64_relay.wasm')).arrayBuffer());
 document.querySelector('iframe').contentWindow.postMessage({module,wasm,payload:[222,173,190,239,0,19,55,192]},'*')}
 if(e.data.kind==='p16')window.__res=e.data.r});
navigator.serviceWorker.register('/p16/sw.js',{scope:'/p16/'});</script><body></body>`, { type: 'text/html' });
  add(A, '/p16/module.js', P16_MODULE);
  add(A, '/p16/frame.html', `<!doctype html><script>${P16_BOOT}</script>`, { type: 'text/html' });
  await A.start();
  const ctx = await launch('p16'); const page = await ctx.newPage();
  await page.goto(A.origin + '/p16/index.html'); await waitControlled(page);
  // prime the broker's cache while online, then go offline: the confined generation must still load
  await page.evaluate(async () => { await fetch('/p16/module.js'); await fetch('/b/wasm64_relay.wasm'); await fetch('/p16/frame.html'); });
  await A.stop();
  await page.reload();
  // (a) confined frame loaded by URL: the navigation of an opaque-origin sandboxed frame is not served by the SW
  await page.evaluate(() => { const f = document.createElement('iframe'); f.setAttribute('sandbox', 'allow-scripts'); f.src = '/p16/frame.html'; document.body.appendChild(f); });
  const byUrl = await page.waitForFunction(() => window.__res, null, { timeout: 6000 }).then(() => page.evaluate(() => window.__res)).catch(() => 'NOT LOADED within 6 s (offline)');
  // (b) confined frame bootstrapped inline (srcdoc) by the broker page: needs no network at all
  await page.reload();
  await page.evaluate(boot => { const f = document.createElement('iframe'); f.setAttribute('sandbox', 'allow-scripts'); f.srcdoc = '<!doctype html><script>' + boot + '<\/script>'; document.body.appendChild(f); }, P16_BOOT);
  await page.waitForFunction(() => window.__res, null, { timeout: 15000 });
  const r = await page.evaluate(() => window.__res);
  await ctx.close();
  const ok = r.origin === 'null' && r.module && r.module.exact === true && r.opfs !== 'opened' && r.parent_dom !== 'reachable' && r.origin_fetch !== 'read';
  return { observed: { confined_frame_by_url_offline: byUrl, confined_frame_srcdoc_offline: r, server_stopped: true }, verdict: ok ? 'RUN' : 'ERR',
    meaning: ok ? 'with the origin server stopped, a confined frame bootstrapped inline by the broker page (opaque origin, no storage, no parent DOM, no origin fetch) received its module source and wasm64 bytes only from the broker by postMessage, imported the module from a blob URL, and ran the wasm64 relay exactly. The same frame loaded by URL is not served by the SW offline (opaque-origin frames have no active service worker), so the broker must inline the bootstrap: a Factory generation can execute confined, fed exclusively by a seed-owned broker' : 'a confined generation could not be loaded and executed through a broker' };
}
// ================================================================================ run
const identity = await browserIdentity();
writeFileSync(join(OUT, 'browser-identity.json'), JSON.stringify(identity, null, 2) + '\n');
console.log('browser', identity.product, identity.revision, 'V8', identity.jsVersion);
const all = [
  ['P01-GENERATED-BUNDLE-OFFLINE', 'Does the generated WebApp (object B) launch offline from its own service worker, also after a browser restart?', 'L0', p01],
  ['P02-SW-CANNOT-SELF-UPDATE', 'Can a service worker replace its own script from locally held bytes when the origin server is gone?', 'L3 seed / activation', p02],
  ['P03-STORAGE-RESTART-ORIGIN', 'Do OPFS / IndexedDB / CacheStorage / localStorage survive restart, and what identity scopes them?', 'L1-L3 persistence', p03],
  ['P04-OPFS-SERVED-APP', 'Can a service worker serve a generated WebApp (incl. wasm64) entirely from OPFS objects, offline, after restart?', 'L1', p04],
  ['P05-SW-CROSS-ORIGIN-ISOLATION', 'Can the service worker grant cross-origin isolation without a server?', 'threads precondition', p05],
  ['P06-IDB-ATOMIC-POINTER', 'Can IndexedDB hold an atomic generation pointer and a compare-and-swap canonical ref?', 'L3 activation / canonical ref', p06],
  ['P07-STORAGE-PERSISTENCE', 'Is persistent storage granted?', 'durability', p07],
  ['P08-CANDIDATE-CONFINEMENT', 'Can candidate code be confined away from the Factory\'s storage?', 'L3 non-circular verification', p08],
  ['P09-GIT-OBJECTS-IN-BROWSER', 'Can git object/tree/commit identity be reproduced and written without the git executable?', 'canonical state', p09],
  ['P10-KERNEL-IN-WORKER', 'Can the wasm64 compiler kernel run in a dedicated worker, and which ABI operations are reachable?', 'L2 compile', p10],
  ['P14-BROKEN-SW-RECOVERY', 'Can a broken service worker be recovered without the origin server?', 'recovery', p14],
  ['P16-CONFINED-GENERATION-LOAD', 'Can a generation run confined (opaque origin) with code and wasm64 bytes supplied only by a broker, offline?', 'L3 confinement / broker', p16],
  ['P15-INTERRUPTED-SW-UPDATE', 'What survives a service-worker update interrupted by a browser shutdown?', 'interrupted update', p15],
];
const only = (process.env.PROBES || '').split(',').filter(Boolean);
for (const [id, q, n, fn] of all) { if (only.length && !only.some(o => id.startsWith(o))) continue; await probe(id, q, n, fn); for (const S of [A, B]) { S.routes.clear(); await S.stop().catch(() => {}); } }
const summary = { tool: 'tests/selfhost/primitives-probe.mjs', observed: new Date().toISOString(), browser: identity, bundle: { dir: BUNDLE, sha256: bundleHashes }, kernel: KERNEL ? { path: KERNEL, sha256: existsSync(KERNEL) ? sha256(readFileSync(KERNEL)) : null } : null, records };
writeFileSync(join(OUT, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
rmSync(profiles, { recursive: true, force: true });
console.log('probes:', records.map(r => `${r.id}=${r.verdict}`).join(' '));
process.exit(0);
