// Concatenate epoch fragments of ONE epoch into one add-only epoch file (D26: the re-proof fragment of
// tests/reprove/build-reprove.mjs and the fact fragment of tests/envmap/build-fact-epoch.mjs, built on a graph that already
// holds the first fragment's environment).  Node ids must be disjoint; edges are unioned; the epoch, delta and commit
// must agree.  Usage: node tests/envmap/concat-epochs.mjs FRAGMENT... --out FILE
import { readFileSync, writeFileSync } from 'node:fs';
const a = process.argv.slice(2); const files = []; let out = null;
for (let i = 0; i < a.length; i++) { if (a[i] === '--out') out = a[++i]; else files.push(a[i]); }
if (!files.length || !out) { console.error('usage: concat-epochs.mjs FRAGMENT... --out FILE'); process.exit(2); }
const frags = files.map(f => JSON.parse(readFileSync(f, 'utf8')));
const first = frags[0];
for (const f of frags.slice(1)) for (const k of ['epoch', 'delta', 'commit']) if (f[k] !== first[k]) { console.error(`fragment ${k} differs: ${f[k]} vs ${first[k]}`); process.exit(1); }
const ids = new Set(); const nodes = []; const edges = []; const keys = new Set();
for (const f of frags) { for (const n of f.nodes) { if (ids.has(n.id)) { console.error(`duplicate node ${n.id}`); process.exit(1); } ids.add(n.id); nodes.push(n); } for (const e of f.edges) { const k = JSON.stringify(e); if (!keys.has(k)) { keys.add(k); edges.push(e); } } }
const epoch = { ...first, summary: frags.map(f => f.summary).join(' | '), nodes, edges };
writeFileSync(out, JSON.stringify(epoch, null, 1) + '\n');
console.log(`${first.epoch}: ${frags.length} fragments -> ${nodes.length} nodes, ${edges.length} edges -> ${out}`);
