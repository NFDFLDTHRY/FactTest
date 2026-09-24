// Per-crate DAG execution (D23; design/materialization/D23-INTENDED-COMPILER-ABI-EXECUTION.md section 2).
// Usage: node tests/toolchain/run-crate-dag.mjs --out DIR [--root DIR] [--target DIR] [--browser-probe FILE]
// In Cargo's dependency order over the HOST_NATIVE_SET roots (tests/toolchain/proof-sets.json): build (dev), build
// (release), the crate's own tests (focused tests), then the tests of every direct consumer that has tests (consumer
// test) - before the next crate.  The WASM64_KERNEL_SET root is built core-only (dev, release) under its pinned
// nightly; its consumer test is the browser build probe (--browser-probe: the Q-WASM-08 record).  Every command's exit,
// duration and test counts are recorded; a crate whose consumers have no tests of their own says so.  Writes
// DIR/<crate>.json and DIR/summary.json.  Generic: the sets and cargo metadata are the data; no crate is named here.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const a = process.argv.slice(2); const o = { root: '.' };
for (let i = 0; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const root = resolve(o.root); const out = resolve(o.out); mkdirSync(out, { recursive: true });
const target = o.target ? resolve(o.target) : (process.env.CARGO_TARGET_DIR || join(root, 'target'));
const sets = JSON.parse(readFileSync(join(root, 'tests/toolchain/proof-sets.json'), 'utf8')).sets;
const H = sets.HOST_NATIVE_SET, Wa = sets.WASM64_KERNEL_SET;
const env = { ...process.env, CARGO_TARGET_DIR: target };
const sh = (cmd, args, extra = {}) => { const t = Date.now(); const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', env: { ...env, ...extra }, maxBuffer: 1 << 28 }); return { command: [cmd, ...args].join(' '), exit: r.status, ms: Date.now() - t, stdout: r.stdout || '', stderr: r.stderr || '' }; };
const meta = JSON.parse(sh('cargo', [`+${H.toolchain}`, 'metadata', '--format-version', '1', '--no-deps', '--offline']).stdout);
const pkgs = new Map(meta.packages.map(p => [p.name, p]));
const hostRoots = H.roots.filter(n => pkgs.has(n));
const depsOf = n => (pkgs.get(n).dependencies || []).map(d => d.name).filter(d => pkgs.has(d));
const consumersOf = n => [...pkgs.keys()].filter(k => depsOf(k).includes(n));
// Kahn over the host roots (the compiler DAG plus the tools that consume it)
const order = []; const seen = new Set();
const visit = n => { if (seen.has(n)) return; seen.add(n); for (const d of depsOf(n)) if (hostRoots.includes(d)) visit(d); order.push(n); };
for (const n of [...hostRoots].sort()) visit(n);
const testCounts = text => { let passed = 0, failed = 0; for (const m of text.matchAll(/test result: (\w+)\. (\d+) passed; (\d+) failed/g)) { passed += Number(m[2]); failed += Number(m[3]); } return { passed, failed }; };
const hasTests = n => { const r = sh('cargo', [`+${H.toolchain}`, 'test', '-p', n, '--', '--list']); return (r.stdout.match(/: test$/gm) || []).length; };
const listed = new Map();
const testsListed = n => { if (!listed.has(n)) listed.set(n, hasTests(n)); return listed.get(n); };
const rows = [];
for (const n of order) {
  const p = pkgs.get(n); const steps = [];
  const step = (name, r, extra = {}) => { const { stdout, stderr, ...rest } = r; steps.push({ step: name, ...rest, ...extra, tail: (stdout + stderr).trim().split('\n').slice(-3) }); return r; };
  step('build-dev', sh('cargo', [`+${H.toolchain}`, 'build', '-p', n]));
  step('build-release', sh('cargo', [`+${H.toolchain}`, 'build', '--release', '-p', n]));
  const own = testsListed(n);
  if (own) { const r = sh('cargo', [`+${H.toolchain}`, 'test', '-p', n]); step('focused-tests', r, { tests: testCounts(r.stdout) }); }
  else steps.push({ step: 'focused-tests', exit: null, note: 'no tests of its own: exercised by its consumers below' });
  const consumers = consumersOf(n).filter(c => hostRoots.includes(c) || c === Wa.roots[0]);
  for (const c of consumers) {
    if (c === Wa.roots[0]) { steps.push({ step: `consumer:${c}`, exit: null, note: 'WASM64_KERNEL_SET root: built and driven in Chromium below' }); continue; }
    if (!testsListed(c)) { steps.push({ step: `consumer:${c}`, exit: null, note: 'consumer has no tests of its own' }); continue; }
    const r = sh('cargo', [`+${H.toolchain}`, 'test', '-p', c]); step(`consumer:${c}`, r, { tests: testCounts(r.stdout) });
  }
  const verdict = steps.every(s => s.exit === null || s.exit === 0) && steps.filter(s => s.tests).every(s => s.tests.failed === 0) ? 'PASS' : 'FAIL';
  const row = { crate: n, set: 'HOST_NATIVE_SET', toolchain: H.toolchain, path: relative(root, p.manifest_path), dependencies: depsOf(n), consumers: consumersOf(n), steps, verdict };
  rows.push(row); writeFileSync(join(out, `${n}.json`), JSON.stringify(row, null, 1) + '\n');
  console.log(`${verdict} ${n}: ${steps.map(s => `${s.step}${s.tests ? ` ${s.tests.passed}/${s.tests.passed + s.tests.failed}` : s.exit === null ? ' -' : ''}`).join(', ')}`);
}
// the wasm64 root
{
  const n = Wa.roots[0]; const steps = []; const flags = { RUSTFLAGS: Wa.rustflags };
  const step = (name, r) => { const { stdout, stderr, ...rest } = r; steps.push({ step: name, ...rest, tail: (stdout + stderr).trim().split('\n').slice(-3) }); };
  step('build-dev', sh('cargo', [`+${Wa.toolchain}`, 'build', '-p', n, '-Z', `build-std=${Wa.build_std}`, '--target', Wa.target], flags));
  step('build-release', sh('cargo', [`+${Wa.toolchain}`, 'build', '--release', '-p', n, '-Z', `build-std=${Wa.build_std}`, '--target', Wa.target], flags));
  steps.push({ step: 'focused-tests', exit: null, note: 'a cdylib for wasm64 has no host test harness (CROSS_SET, weight NONE); its tests are the Chromium executions' });
  let probe = null; if (o['browser-probe']) { try { probe = JSON.parse(readFileSync(resolve(o['browser-probe']), 'utf8')); } catch { } }
  steps.push({ step: 'consumer:browser', exit: probe ? (probe.verdict === 'PASS' ? 0 : 1) : null, note: probe ? `${probe.id}: ${probe.verdict} - ${probe.reason}` : 'no browser probe record given' });
  const verdict = steps.every(s => s.exit === null || s.exit === 0) ? 'PASS' : 'FAIL';
  const row = { crate: n, set: 'WASM64_KERNEL_SET', toolchain: Wa.toolchain, target: Wa.target, path: relative(root, pkgs.get(n).manifest_path), dependencies: depsOf(n), consumers: ['browser (host/harness/kernel-build-probe.mjs)'], steps, verdict };
  rows.push(row); writeFileSync(join(out, `${n}.json`), JSON.stringify(row, null, 1) + '\n');
  console.log(`${verdict} ${n}: ${steps.map(s => s.step).join(', ')}`);
}
const status = rows.every(r => r.verdict === 'PASS') ? 'PASS' : 'FAIL';
const tests = rows.flatMap(r => r.steps.filter(s => s.tests)).reduce((t, s) => ({ passed: t.passed + s.tests.passed, failed: t.failed + s.tests.failed }), { passed: 0, failed: 0 });
writeFileSync(join(out, 'summary.json'), JSON.stringify({ tool: 'tests/toolchain/run-crate-dag.mjs', order: rows.map(r => r.crate), host_toolchain: H.toolchain, wasm_toolchain: Wa.toolchain, target_dir: target, crates: rows.map(r => ({ crate: r.crate, set: r.set, verdict: r.verdict, steps: r.steps.length })), tests_run: tests, status }, null, 1) + '\n');
console.log(`${status} crate DAG: ${rows.length} crates in dependency order; ${tests.passed} tests passed, ${tests.failed} failed`);
process.exit(status === 'PASS' ? 0 : 1);
