// Browser BUILD / OBSERVE probe for the wasm64 kernel transport (D23; WASM64_KERNEL_SET "Chromium ABI execution").
// Usage: node host/harness/kernel-build-probe.mjs <module.wasm> --source F --contracts F --metrics F [--machine F]
//        --tape F --system NAME [--evidence-class C] --native-build DIR --native-observe DIR --out DIR
// Drives the kernel in Chromium (Playwright) through the wasm exports exactly as host/factc drives it natively: BUILD
// with source + registry + metrics (+ machine state), then RESET and OBSERVE with the tape, the authored-source sha256
// and the lineage sha256 read from the native bundle manifest.  Every diagnostic, artifact and bundle file the browser
// produced is written under --out with the native driver's file names and compared byte-for-byte with the native run.
// The harness supplies no imports.  Generic: no fixture, system or file is named here.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const a = process.argv.slice(2); const modulePath = a[0]; const o = { 'evidence-class': 'UNSPECIFIED' };
for (let i = 1; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const need = k => { if (!o[k]) { console.error(`missing --${k}`); process.exit(2); } return o[k]; };
const wasm = readFileSync(modulePath);
const inputs = { src: readFileSync(need('source')), contracts: readFileSync(need('contracts')), metrics: readFileSync(need('metrics')), machine: o.machine ? readFileSync(o.machine) : null, tape: readFileSync(need('tape')) };
const nativeBuild = need('native-build'), nativeObserve = need('native-observe'), out = need('out'); const system = need('system');
const manifest = readFileSync(join(nativeBuild, 'bundle', 'bundle.json'), 'utf8');
const lineage = (manifest.match(/"source_sha256":"([0-9a-f]{64})"/) || [])[1] || null;
const strategyData = (manifest.match(/"strategy_data_sha256":"([0-9a-f]{64})"/) || [])[1] || null;
const shaAfter = createHash('sha256').update(inputs.src).digest('hex');
const b64 = b => Buffer.from(b).toString('base64');

// runs inside the page; everything it needs is defined here
async function drive([wasmB64, p]) {
  const from = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const to = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  const mod = await WebAssembly.compile(from(wasmB64));
  const r = { imports: WebAssembly.Module.imports(mod).map(i => `${i.module}.${i.name}`), exports: WebAssembly.Module.exports(mod).map(e => e.name).sort() };
  const { exports: x } = await WebAssembly.instantiate(mod, {});
  const inPtr = Number(x.input_buffer_ptr()), inLen = Number(x.input_buffer_len()), outPtr = Number(x.output_buffer_ptr());
  const put = b => { if (b.length > inLen) throw new Error(`input ${b.length} > buffer ${inLen}`); new Uint8Array(x.memory.buffer, inPtr, b.length).set(b); return BigInt(b.length); };
  const take = n => new Uint8Array(x.memory.buffer, outPtr, Number(n)).slice();
  const text = n => new TextDecoder().decode(take(n));
  r.abi_version = x.query_abi_version(); r.required_workspace = x.query_required_workspace().toString(); r.input_buffer_len = inLen;
  r.source_id_plus_one = x.submit_source_bytes(put(from(p.src)));
  r.contracts_ok = x.submit_contracts(put(from(p.contracts)));
  r.metrics_ok = x.submit_metrics(put(from(p.metrics)));
  if (p.machine) r.machine_ok = x.submit_machine_state(put(from(p.machine)));
  let t = performance.now(); r.build_status = x.check_or_compile(1); r.build_ms = Math.round(performance.now() - t);
  r.build_diagnostics = text(x.read_diagnostics()); r.build_metadata = text(x.read_artifact_metadata());
  r.build_artifacts = []; for (let i = 0; i < Number(x.artifact_count()); i++) r.build_artifacts.push(to(take(x.read_artifact(BigInt(i)))));
  r.bundle = []; for (let i = 0; i < Number(x.bundle_file_count()); i++) r.bundle.push({ path: text(x.bundle_file_path(BigInt(i))), bytes: to(take(x.bundle_file_bytes(BigInt(i)))) });
  r.reset = x.reset_workspace();
  r.tape_ok = x.submit_evidence_tape(put(from(p.tape)));
  const name = new TextEncoder().encode(p.system), cls = new TextEncoder().encode(p.evidenceClass);
  const parts = [name]; let flags = 0;
  if (p.shaAfter) { parts.push(from(p.shaAfter)); flags |= 1; }
  if (p.shaLineage) { parts.push(from(p.shaLineage)); flags |= 2; }
  if (p.shaStrategy) { parts.push(from(p.shaStrategy)); flags |= 4; }
  parts.push(cls);
  const frame = new Uint8Array(parts.reduce((n, q) => n + q.length, 0)); let off = 0; for (const q of parts) { frame.set(q, off); off += q.length; }
  put(frame);
  t = performance.now(); r.observe_status = x.observe(BigInt(name.length), BigInt(cls.length), flags); r.observe_ms = Math.round(performance.now() - t);
  r.observe_diagnostics = text(x.read_diagnostics()); r.observe_metadata = text(x.read_artifact_metadata());
  r.observe_artifacts = []; for (let i = 0; i < Number(x.artifact_count()); i++) r.observe_artifacts.push(to(take(x.read_artifact(BigInt(i)))));
  return r;
}

const { chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const payload = { src: b64(inputs.src), contracts: b64(inputs.contracts), metrics: b64(inputs.metrics), machine: inputs.machine ? b64(inputs.machine) : null, tape: b64(inputs.tape), system, evidenceClass: o['evidence-class'], shaAfter: b64(Buffer.from(shaAfter, 'hex')), shaLineage: lineage ? b64(Buffer.from(lineage, 'hex')) : null, shaStrategy: strategyData ? b64(Buffer.from(strategyData, 'hex')) : null };
const r = await page.evaluate(drive, [b64(wasm), payload]);
const ua = await page.evaluate(() => navigator.userAgent);
await browser.close();

// the native driver's file names (host/factc/src/main.rs)
const fileName = (kind, system) => {
  const ext = /^(CANONICAL_ASCII|OBSERVED_ASCII)$/.test(kind) ? 'ascii' : kind === 'GENERATED_BUNDLE' ? 'bin' : 'json';
  const base = kind === 'RUNTIME_EVIDENCE' ? 'activation-receipt-model' : kind.toLowerCase().replace(/_/g, '-');
  return (system === null || system === undefined) ? `${base}.${ext}` : `${base}-${system}.${ext}`;
};
const writeRun = (dir, diagnostics, metadata, artifacts, observeNames) => {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'diagnostics.json'), diagnostics);
  const md = JSON.parse(metadata);
  if (!observeNames) writeFileSync(join(dir, 'artifacts.json'), metadata);
  md.artifacts.forEach((art, i) => { const name = observeNames ? (art.kind === 'OBSERVED_ASCII' ? 'observed.ascii' : 'observation-delta.json') : fileName(art.kind, art.system); writeFileSync(join(dir, name), Buffer.from(artifacts[i], 'base64')); });
  return md.artifacts.map(art => `${art.kind}:${art.status}:${art.byte_len}`);
};
const buildDir = join(out, 'build'), observeDir = join(out, 'observe');
const buildArtifacts = writeRun(buildDir, r.build_diagnostics, r.build_metadata, r.build_artifacts, false);
mkdirSync(join(buildDir, 'bundle'), { recursive: true });
for (const f of r.bundle) writeFileSync(join(buildDir, 'bundle', f.path), Buffer.from(f.bytes, 'base64'));
const observeArtifacts = writeRun(observeDir, r.observe_diagnostics, r.observe_metadata, r.observe_artifacts, true);

const walk = d => readdirSync(d).flatMap(n => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const compare = (nativeDir, browserDir, skip) => {
  const rows = [];
  for (const p of walk(nativeDir)) { const rel = relative(nativeDir, p); if (skip.includes(rel)) continue; const q = join(browserDir, rel);
    rows.push({ file: rel, verdict: !existsSync(q) ? 'MISSING_IN_BROWSER' : readFileSync(p).equals(readFileSync(q)) ? 'IDENTICAL' : 'DIFFERENT', bytes: statSync(p).size }); }
  for (const p of walk(browserDir)) { const rel = relative(browserDir, p); if (!existsSync(join(nativeDir, rel))) rows.push({ file: rel, verdict: 'MISSING_IN_NATIVE' }); }
  return rows;
};
const buildCompare = compare(nativeBuild, buildDir, ['source-lineage.json']); // the lineage file is host-side (paths, sha) - factc writes it, the kernel never does
const observeCompare = compare(nativeObserve, observeDir, []);
const bad = [...buildCompare, ...observeCompare].filter(x => x.verdict !== 'IDENTICAL');
const problems = [];
if (r.imports.length) problems.push(`imports: ${r.imports.join(',')}`);
if (r.build_status !== 1) problems.push(`BUILD status ${r.build_status}`);
if (r.observe_status !== 1) problems.push(`OBSERVE status ${r.observe_status}`);
if (r.contracts_ok !== 1 || r.metrics_ok !== 1 || r.tape_ok !== 1) problems.push('a submission was refused');
for (const x of bad) problems.push(`${x.file}: ${x.verdict}`);
const report = { tool: 'host/harness/kernel-build-probe.mjs', host: ua, module: modulePath, kernel_sha256: createHash('sha256').update(wasm).digest('hex'), kernel_bytes: wasm.length,
  exports: r.exports, imports: r.imports, abi_version: r.abi_version, required_workspace: r.required_workspace, input_buffer_len: r.input_buffer_len,
  build: { status: r.build_status, ms: r.build_ms, artifacts: buildArtifacts, bundle_files: r.bundle.map(f => f.path), compare: buildCompare },
  observe: { status: r.observe_status, ms: r.observe_ms, artifacts: observeArtifacts, source_sha256_after: shaAfter, lineage_sha256: lineage, strategy_data_sha256: strategyData, compare: observeCompare },
  problems, status: problems.length ? 'FAIL' : 'PASS' };
mkdirSync(out, { recursive: true }); writeFileSync(join(out, 'probe.json'), JSON.stringify(report, null, 1) + '\n');
console.log(`${report.status} browser BUILD status ${r.build_status} (${r.build_ms} ms, ${r.bundle.length} bundle files, ${buildCompare.filter(x => x.verdict === 'IDENTICAL').length}/${buildCompare.length} identical to native); OBSERVE status ${r.observe_status} (${observeCompare.filter(x => x.verdict === 'IDENTICAL').length}/${observeCompare.length} identical)${problems.length ? ' - ' + problems.slice(0, 5).join('; ') : ''}`);
process.exit(report.status === 'PASS' ? 0 : 1);
