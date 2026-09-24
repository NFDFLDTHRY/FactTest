// FactTest generated service worker: explicit, versioned cache of the shell (SW-002).  Cache name is bound to the
// bundle identity so a new bundle never reuses a stale shell.  Authority: https://w3c.github.io/ServiceWorker/#fetch-event
const CACHE = 'facttest-c003ddd539ab6774';
const SHELL = ['./wasm64_relay.wasm','./membrane.js','./selector.js','./runtime.js','./index.html','./manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => { e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))); });
