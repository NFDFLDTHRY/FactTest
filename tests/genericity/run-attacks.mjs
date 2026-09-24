// D24 ATTACKS: data-driven mutations of the specimens, each with the outcome the machinery must produce.
// Usage: node tests/genericity/run-attacks.mjs --factc BIN --specimens DIR --out DIR
//   --specimens is the output directory of run-specimens.mjs (built bundles and physical tapes are its inputs).
// Attack list (D24 prompt): renamed relation, different legal recipe, single-backend registry, missing conversion,
// invalid guard, tampered strategy, tampered bundle, undeclared adapter, wrong certificate, changed order, stale
// evidence, unexpected implementation family.  Compile-level attacks run factc; post-build attacks run the bundle
// integrity check; evidence attacks run factc observe.  The kernel-level counterparts (BundleVerifier re-check of
// an edited strategy / certificate) live in compiler/kernel/tests/genericity_ladder.rs.
import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const a = process.argv.slice(2); const o = {};
for (let i = 0; i < a.length; i++) if (a[i].startsWith('--')) o[a[i].slice(2)] = a[++i];
if (!o.factc || !o.specimens || !o.out) { console.error('usage: run-attacks.mjs --factc BIN --specimens DIR --out DIR'); process.exit(2); }
const OUT = resolve(o.out); mkdirSync(OUT, { recursive: true }); const SP = resolve(o.specimens);
const spec = name => JSON.parse(readFileSync(join('fixtures/genericity', name, 'specimen.json'), 'utf8'));
const run = (cmd, args, log) => { const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 26 }); writeFileSync(log, (r.stdout || '') + (r.stderr || '')); return r; };
const J = p => existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
const strategy = dir => { const t = readFileSync(join(dir, 'selector.js'), 'utf8'); return { data: JSON.parse(t.slice(t.indexOf('/*STRATEGY-BEGIN*/') + 18, t.indexOf('/*STRATEGY-END*/'))), sha: (t.match(/STRATEGY_SHA256 = '([0-9a-f]{64})'/) || [])[1] }; };
const codes = d => { const j = J(join(d, 'diagnostics.json')); return j ? [...new Set(j.diagnostics.map(x => x.code))].sort() : []; };
const failing = d => { const c = J(join(d, 'bundle-certificate.json')); return c ? c.checks.filter(x => x.status !== 'PASS').map(x => x.check) : []; };
const results = [];
const attack = (id, specimen, mutation, expectation, fn) => { const d = join(OUT, id); mkdirSync(d, { recursive: true }); let r; try { r = fn(d); } catch (e) { r = { pass: false, observed: 'exception: ' + e.message }; } results.push({ attack: id, specimen, mutation, expectation, observed: r.observed, status: r.pass ? 'PASS' : 'FAIL' }); };
const build = (d, src, contracts, metrics) => { const args = ['check', 'build', '--out', join(d, 'compile'), '--contracts', contracts]; if (metrics) args.push('--metrics', metrics); args.push(src); return run(o.factc, args, join(d, 'compile.log')); };
const mutate = (d, name, from, edit) => { const p = join(d, name); writeFileSync(p, edit(readFileSync(from, 'utf8'))); return p; };
const L = spec('ledger-mirror'), V = spec('pixel-vault'), D = spec('dual-stream');
const base = name => strategy(join(SP, name, 'compile/bundle'));

attack('renamed-relation', 'ledger-mirror', 'relation post -> posted in the source', 'builds; transfers renamed in source order; strategy identity changes; the earlier tape no longer binds', d => {
  const src = mutate(d, 'source.ascii', L.source, t => t.replace('@{data post ', '@{data posted '));
  const r = build(d, src, L.contracts, null); const s = strategy(join(d, 'compile/bundle'));
  const obs = run(o.factc, ['observe', '--out', join(d, 'observed'), '--tape', join(SP, 'ledger-mirror/probe-webgpu/evidence-tape.ascii'), '--system', L.system, '--bundle-manifest', join(d, 'compile/bundle/bundle.json')], join(d, 'observe.log'));
  const rel = s.data.transfers.map(t => t.relation);
  return { pass: r.status === 0 && JSON.stringify(rel) === '["posted","mirror"]' && s.sha !== base('ledger-mirror').sha && obs.status !== 0 && codes(join(d, 'observed')).includes('EVIDENCE_UNBOUND'), observed: `exit ${r.status}; transfers ${JSON.stringify(rel)}; identity ${s.sha === base('ledger-mirror').sha ? 'unchanged' : 'changed'}; old tape observe exit ${obs.status} ${codes(join(d, 'observed')).join(',')}` };
});
attack('changed-order', 'ledger-mirror', 'the two data relations swapped in the source', 'builds; requirement slots follow the new source order; strategy identity changes', d => {
  const src = mutate(d, 'source.ascii', L.source, t => { const a = t.match(/@\{data post [^}]*\}/)[0], b = t.match(/@\{data mirror [^}]*\}/)[0]; return t.replace(a, '\u0000').replace(b, a).replace('\u0000', b); });
  const r = build(d, src, L.contracts, null); const s = strategy(join(d, 'compile/bundle')); const rel = s.data.transfers.map(t => t.relation);
  return { pass: r.status === 0 && JSON.stringify(rel) === '["mirror","post"]' && s.data.variants.every(v => JSON.stringify(v.requirements.map(x => x.relation)) === '["mirror","post"]') && s.sha !== base('ledger-mirror').sha, observed: `exit ${r.status}; transfers ${JSON.stringify(rel)}; identity ${s.sha === base('ledger-mirror').sha ? 'unchanged' : 'changed'}` };
});
attack('different-legal-recipe', 'ledger-mirror', 'recipe R_ENTRY_COPY renamed R_ENTRY_MIRROR (same adapter, same exports)', 'builds; bundle metadata names the new recipe; the executable strategy data is identical (a recipe name is registry data, not a semantic)', d => {
  const c = mutate(d, 'contracts.ascii', L.contracts, t => t.replaceAll('R_ENTRY_COPY', 'R_ENTRY_MIRROR'));
  const r = build(d, L.source, c, null); const man = J(join(d, 'compile/bundle/bundle.json')); const s = strategy(join(d, 'compile/bundle'));
  return { pass: r.status === 0 && JSON.stringify(man.variant_inventory[0].recipes) === '["R_ENTRY_MIRROR"]' && s.sha === base('ledger-mirror').sha, observed: `exit ${r.status}; recipes ${JSON.stringify(man.variant_inventory[0].recipes)}; strategy identity ${s.sha === base('ledger-mirror').sha ? 'identical' : 'changed'}` };
});
attack('single-backend-registry', 'dual-stream', 'WEBGPU backend, its conversions and recipe removed from the dual-stream registry', 'builds with exactly one variant (CPU_WASM64 for both relations); no objective-driven GPU preference survives', d => {
  const c = mutate(d, 'contracts.ascii', D.contracts, t => t.split('\n').filter(l => !/WEBGPU|chunk_to_gpu|chunk_from_gpu|R_CHUNK_GPU|GPU_CHUNK/.test(l)).join('\n'));
  const m = mutate(d, 'metrics.ascii', D.metrics, t => t.split('\n').filter(l => !/WEBGPU/.test(l)).join('\n'));
  const r = build(d, D.source, c, m); const ok = r.status === 0 && existsSync(join(d, 'compile/bundle/selector.js')); const s = ok ? strategy(join(d, 'compile/bundle')) : null;
  return { pass: ok && s.data.variants.length === 1 && s.data.variants[0].requirements.every(x => JSON.stringify(x.backends) === '["CPU_WASM64"]'), observed: `exit ${r.status}; ${s ? s.data.variants.length + ' variant(s): ' + s.data.variants.map(v => v.guard.join('+')).join(' | ') : codes(join(d, 'compile')).join(',')}` };
});
attack('missing-conversion', 'ledger-mirror', 'conversion entry_out removed from the registry', 'no legal plan: build fails with NO_LEGAL_PLAN and emits no bundle', d => {
  const c = mutate(d, 'contracts.ascii', L.contracts, t => t.split('\n').filter(l => !/conversion entry_out/.test(l)).join('\n'));
  const r = build(d, L.source, c, null); const cs = codes(join(d, 'compile'));
  return { pass: r.status !== 0 && cs.includes('NO_LEGAL_PLAN') && !existsSync(join(d, 'compile/bundle')), observed: `exit ${r.status}; ${cs.join(',')}; bundle ${existsSync(join(d, 'compile/bundle')) ? 'emitted' : 'absent'}` };
});
attack('undeclared-adapter', 'ledger-mirror', 'recipe names adapter=opfs_relay, an adapter the compiler does not carry', 'build fails: no adapter template, no bundle certificate PASS', d => {
  const c = mutate(d, 'contracts.ascii', L.contracts, t => t.replace('adapter=wasm64_relay', 'adapter=opfs_relay'));
  const r = build(d, L.source, c, null); const cert = J(join(d, 'compile/bundle-certificate.json'));
  return { pass: r.status !== 0 && (!cert || cert.status !== 'PASS'), observed: `exit ${r.status}; ${codes(join(d, 'compile')).join(',')}; certificate ${cert ? cert.status + ' with ' + cert.checks.length + ' checks' : 'absent'}` };
});
attack('unexpected-implementation-family', 'pixel-vault', 'backend WEBGPU realized by recipe adapter=wasm64_relay (a CPU_WASM64 adapter)', 'BundleVerifier B-11 fails: the adapter block does not declare the guarded backend', d => {
  const c = mutate(d, 'contracts.ascii', V.contracts, t => t.replace('adapter=webgpu_relay', 'adapter=wasm64_relay'));
  const r = build(d, V.source, c, null); const f = failing(join(d, 'compile'));
  return { pass: r.status !== 0 && f.includes('B-11-adapter-realizes-backend'), observed: `exit ${r.status}; failing ${f.join(',')}` };
});
for (const [id, file, what] of [['tampered-strategy', 'selector.js', 'a byte of the embedded strategy data'], ['tampered-bundle', 'wasm64_relay.wasm', 'a byte of the wasm module'], ['invalid-guard', 'selector.js', 'the guard of variant 0 replaced by a backend no registry declares'], ['wrong-certificate', 'selector.js', 'strategy_certificate_id changed']]) {
  attack(id, 'ledger-mirror', `${what} edited after the build`, 'post-build integrity check fails against bundle.json identities', d => {
    const b = join(d, 'bundle'); cpSync(join(SP, 'ledger-mirror/compile/bundle'), b, { recursive: true });
    if (id === 'invalid-guard') writeFileSync(join(b, file), readFileSync(join(b, file), 'utf8').replace('"guard":["CPU_WASM64"]', '"guard":["NOBACKEND"]'));
    else if (id === 'wrong-certificate') writeFileSync(join(b, file), readFileSync(join(b, file), 'utf8').replace('"strategy_certificate_id":1000', '"strategy_certificate_id":1001'));
    else { const bytes = readFileSync(join(b, file)); bytes[Math.floor(bytes.length / 2)] ^= 0x01; writeFileSync(join(b, file), bytes); }
    const r = run('node', ['tests/genericity/check-bundle.mjs', b, '--out', join(d, 'check.json')], join(d, 'check.log')); const c = J(join(d, 'check.json'));
    return { pass: r.status !== 0 && c && c.integrity.problems.some(p => p.startsWith(file + ':')), observed: `check exit ${r.status}; ${c ? c.integrity.problems.join('; ') : ''}` };
  });
}
attack('stale-evidence', 'byte-relay -> ledger-mirror', 'the Byte Relay tape observed against the ledger_mirror bundle manifest', 'observe rejects it: EVIDENCE_UNBOUND, evidence_lineage ERR', d => {
  const r = run(o.factc, ['observe', '--out', d, '--tape', join(SP, 'byte-relay/probe-webgpu/evidence-tape.ascii'), '--system', L.system, '--source', L.source, '--bundle-manifest', join(SP, 'ledger-mirror/compile/bundle/bundle.json'), '--evidence-class', 'PHYSICAL_BROWSER'], join(d, 'observe.log'));
  const obs = existsSync(join(d, 'observed.ascii')) ? readFileSync(join(d, 'observed.ascii'), 'utf8') : '';
  return { pass: r.status !== 0 && codes(d).includes('EVIDENCE_UNBOUND') && /evidence_lineage ERR/.test(obs), observed: `exit ${r.status}; ${codes(d).join(',')}` };
});
attack('genuine-evidence', 'ledger-mirror', 'the ledger_mirror tape observed against its own bundle manifest (control)', 'observe accepts it: evidence_lineage OBS', d => {
  const r = run(o.factc, ['observe', '--out', d, '--tape', join(SP, 'ledger-mirror/probe-webgpu/evidence-tape.ascii'), '--system', L.system, '--source', L.source, '--bundle-manifest', join(SP, 'ledger-mirror/compile/bundle/bundle.json'), '--evidence-class', 'PHYSICAL_BROWSER'], join(d, 'observe.log'));
  const obs = existsSync(join(d, 'observed.ascii')) ? readFileSync(join(d, 'observed.ascii'), 'utf8') : '';
  return { pass: r.status === 0 && /evidence_lineage OBS/.test(obs), observed: `exit ${r.status}` };
});
const status = results.every(r => r.status === 'PASS') ? 'PASS' : 'FAIL';
writeFileSync(join(OUT, 'summary.json'), JSON.stringify({ tool: 'tests/genericity/run-attacks.mjs', status, attacks: results }, null, 1) + '\n');
for (const r of results) console.log(`${r.status} ${r.attack} [${r.specimen}]: ${r.observed}`);
console.log(status);
process.exit(status === 'PASS' ? 0 : 1);
