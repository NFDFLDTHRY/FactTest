// D9 Rust/Cargo proof harness (design/materialization/D9-INTENDED-PROOF-HARNESS.md).
// First-party node ESM, no dependencies.  Every subcommand evaluates ONE proof obligation and writes an obligation
// record { id, class, invariant, command, cwd, env, toolchain, exit, selection, observed, verdict, reason }.
// Exit code semantics: 0 = the obligation was evaluated (verdict may be FAIL/GAP/UNK: that is evidence about the
// system under test); non-zero = the harness itself malfunctioned.  `mutants` is the one exception: it exits 1 when
// a mutant's observed (weak, qualified) verdicts differ from the expected ones, because that means the judge is not
// qualified.  Compile-fail verdicts never come from an exit code alone; no_std verdict weight comes only from the
// core-only wasm64 compiler graph; the only accepted wasm triple is wasm64-unknown-unknown.
//
// D13 (design/materialization/D13-INTENDED-REPO-HYGIENE.md section 3): proof sets.  With --set <SET> and
// --sets tests/toolchain/proof-sets.json an obligation records proof_set / target / profile / toolchain and FAILS when
// the observed selection or the rustc commit differs from the declaration.  PROOF_CHAN_MAP (e.g.
// "default=1.94.1,stable=1.94.1,nightly=nightly-2026-09-24") maps every requested channel, including the implicit
// default, to an explicit toolchain: copies outside the repository (compile-fail fixtures, mutants) never fall back
// to whatever rustup would pick.  CROSS_SET records are diagnostics (verdict OBS) and HEURISTIC records carry
// verdict HEURISTIC; both have proof_weight NONE and never count as proof.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, cpSync } from 'node:fs';
import { join, resolve, dirname, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';

const WASM64 = 'wasm64-unknown-unknown';
const STACK_FLAG = '-C link-arg=-zstack-size=16777216'; // as in tests/bootstrap/run-b9-b11.sh

// ----------------------------------------------------------------------------------------------- argument parsing
function parseArgs(argv) {
  const opts = { _: [], rest: [] };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === '--') { opts.rest = argv.slice(i + 1); break; }
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) { opts[k] = true; i += 1; }
      else { if (k === 'env') (opts.env = opts.env || []).push(v); else opts[k] = v; i += 2; }
    } else { opts._.push(a); i += 1; }
  }
  return opts;
}
function envOf(opts) {
  const e = {};
  for (const kv of opts.env || []) { const j = kv.indexOf('='); e[kv.slice(0, j)] = kv.slice(j + 1); }
  return e;
}

// ----------------------------------------------------------------------------------------------- process helpers
function run(program, args, cwd, env = {}) {
  const r = spawnSync(program, args, { cwd, env: { ...process.env, ...env }, encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.error) return { spawn_error: String(r.error.code || r.error.message), exit: -1, stdout: '', stderr: '' };
  return { exit: r.status === null ? -1 : r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}
const CHAN_MAP = Object.fromEntries((process.env.PROOF_CHAN_MAP || '').split(',').filter(Boolean).map(kv => kv.split('=')));
function mapChan(chan) { return chan ? (CHAN_MAP[chan] || chan) : (CHAN_MAP.default || null); }
function toolchainIdentity(requested) {
  const chan = mapChan(requested);
  const rustc = chan ? ['+' + chan, '-vV'] : ['-vV'];
  const cargo = chan ? ['+' + chan, '-vV'] : ['-vV'];
  const r = run('rustc', rustc, process.cwd());
  const c = run('cargo', cargo, process.cwd());
  const pick = (t, k) => (t.match(new RegExp('^' + k + ': (.*)$', 'm')) || [])[1] || null;
  return {
    channel: chan || 'default(active)',
    requested: requested || 'default',
    rustc: r.exit === 0 ? r.stdout.trim().split('\n')[0] : null,
    rustc_commit: pick(r.stdout, 'commit-hash'),
    rustc_release: pick(r.stdout, 'release'),
    rustc_host: pick(r.stdout, 'host'),
    llvm: pick(r.stdout, 'LLVM version'),
    cargo: c.exit === 0 ? c.stdout.trim().split('\n')[0] : null,
    available: r.exit === 0 && c.exit === 0,
    error: r.exit === 0 ? null : (r.spawn_error || r.stderr.trim().split('\n')[0]),
  };
}
function writeJson(p, v) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(v, null, 2) + '\n'); }
function record(out, rec) {
  const p = join(out, rec.id + '.json');
  writeJson(p, rec);
  const line = `${rec.verdict.padEnd(4)} ${rec.id}  ${rec.reason}`;
  console.log(line);
  return rec;
}

// ----------------------------------------------------------------------------------------------- cargo JSON output
function packageIdParts(id) {
  // "path+file:///dir/name#0.1.0" | "path+file:///dir#name@0.1.0" | "registry+https://...#serde@1.0.0" | old "name ver (src)"
  let source = null, name = null, path = null;
  const hash = id.indexOf('#');
  if (hash >= 0) {
    const url = id.slice(0, hash), frag = id.slice(hash + 1);
    source = url.split('+')[0];
    if (url.startsWith('path+file://')) path = url.slice('path+file://'.length);
    name = frag.includes('@') ? frag.slice(0, frag.indexOf('@')) : (path ? path.split('/').filter(Boolean).pop() : frag);
  } else {
    const m = id.match(/^(\S+) (\S+) \((\S+)\)$/);
    if (m) { name = m[1]; source = m[3].split('+')[0]; if (m[3].startsWith('path+file://')) path = m[3].slice('path+file://'.length); }
  }
  return { name, source, path };
}
function parseCargoStream(stdout, stderr, root) {
  const artifacts = [], errors = [], tests = { binaries: [], results: [], passed: 0, failed: 0, failed_names: [] };
  let build_finished = null;
  for (const line of stdout.split('\n')) {
    if (line.startsWith('{')) {
      let j; try { j = JSON.parse(line); } catch { continue; }
      if (j.reason === 'compiler-artifact') {
        const p = packageIdParts(j.package_id);
        const inside = p.path ? resolve(p.path).startsWith(root + sep) || resolve(p.path) === root : false;
        artifacts.push({
          package: p.name, target: j.target.name, kind: j.target.kind.join('+'), profile_test: !!j.profile.test,
          opt_level: j.profile.opt_level, debuginfo: j.profile.debuginfo,
          origin: inside ? 'workspace' : (p.source === 'path' ? 'sysroot-or-external-path' : p.source || 'unknown'),
          manifest_dir: p.path,
        });
      } else if (j.reason === 'compiler-message' && j.message && j.message.level === 'error') {
        const m = j.message; const sp = (m.spans || []).find(s => s.is_primary) || (m.spans || [])[0];
        const pkg = packageIdParts(j.package_id || '');
        errors.push({ package: pkg.name, code: m.code ? m.code.code : null, message: m.message, file: sp ? sp.file_name : null, line: sp ? sp.line_start : null });
      } else if (j.reason === 'build-finished') build_finished = j.success;
    } else {
      const tr = line.match(/^test result: (ok|FAILED)\. (\d+) passed; (\d+) failed; (\d+) ignored/);
      if (tr) { tests.results.push({ status: tr[1], passed: +tr[2], failed: +tr[3], ignored: +tr[4] }); tests.passed += +tr[2]; tests.failed += +tr[3]; }
      const tf = line.match(/^test (\S+) \.\.\. FAILED/); if (tf) tests.failed_names.push(tf[1]);
    }
  }
  for (const line of stderr.split('\n')) {
    const r = line.match(/^\s*Running (.+) \((.+)\)\s*$/); if (r) tests.binaries.push({ target: r[1], exe: relative(root, r[2]) });
    const d = line.match(/^\s*Doc-tests (\S+)/); if (d) tests.binaries.push({ target: 'doc-tests ' + d[1], exe: null });
    if (/^\s*Finished /.test(line)) tests.finished = line.trim();
  }
  const selection = [...new Set(artifacts.filter(a => a.origin === 'workspace').map(a => `${a.package}:${a.target}[${a.kind}]${a.profile_test ? '{test}' : ''}`))].sort();
  const sysroot = [...new Set(artifacts.filter(a => a.origin !== 'workspace').map(a => `${a.package}[${a.kind}]<${a.origin}>`))].sort();
  return { artifacts, errors, tests, build_finished, selection, sysroot, packages: [...new Set(artifacts.filter(a => a.origin === 'workspace').map(a => a.package))].sort() };
}
function cargoJson(chan, args, cwd, env, root) {
  // --message-format=json must precede a trailing "--" (rustc/clippy-driver args); cargo fmt has no JSON mode, its
  // scope is the verbose file list.
  const isFmt = args[0] === 'fmt';
  const sep = args.indexOf('--');
  const withJson = isFmt ? [...args] : (sep >= 0 ? [...args.slice(0, sep), '--message-format=json', ...args.slice(sep)] : [...args, '--message-format=json']);
  const tc = mapChan(chan);
  const argv = [...(tc ? ['+' + tc] : []), ...withJson];
  const r = run('cargo', argv, cwd, env);
  const parsed = r.spawn_error ? null : parseCargoStream(r.stdout, r.stderr, root);
  if (parsed && isFmt) {
    const files = (r.stdout + r.stderr).split('\n').map(l => l.match(/^\[[^\]]+\] "([^"]+)"/)).filter(Boolean).map(m => relative(root, m[1]));
    parsed.fmt_files = files;
    parsed.packages = [...new Set(files.map(f => f.split('/src/')[0].split('/tests/')[0]))].sort();
    parsed.selection = parsed.packages.map(d => d + ':' + files.filter(f => f.startsWith(d + '/')).length + ' files');
  }
  return { argv: ['cargo', ...argv], ...r, parsed };
}

// ----------------------------------------------------------------------------------------------- manifests / metadata
function walkManifests(root) {
  const out = [];
  const skip = new Set(['.git', 'target', 'node_modules']);
  (function walk(d) {
    let ents; try { ents = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents.sort((a, b) => a.name.localeCompare(b.name))) {
      if (e.isDirectory()) { if (!skip.has(e.name)) walk(join(d, e.name)); }
      else if (e.name === 'Cargo.toml') out.push(relative(root, join(d, e.name)));
    }
  })(root);
  return out.sort();
}
function rootExcludes(root) {
  const t = existsSync(join(root, 'Cargo.toml')) ? readFileSync(join(root, 'Cargo.toml'), 'utf8') : '';
  const m = t.match(/^\s*exclude\s*=\s*\[([^\]]*)\]/m);
  return m ? [...m[1].matchAll(/"([^"]+)"/g)].map(x => x[1]) : [];
}
function metadata(root, locked, requested) {
  const chan = mapChan(requested);
  const args = [...(chan ? ['+' + chan] : []), 'metadata', '--format-version', '1', ...(locked ? ['--locked'] : [])];
  const r = run('cargo', args, root);
  if (r.exit !== 0) return { ok: false, error: r.spawn_error || r.stderr.trim(), argv: ['cargo', ...args] };
  const m = JSON.parse(r.stdout);
  const byId = Object.fromEntries(m.packages.map(p => [p.id, p]));
  return {
    ok: true, argv: ['cargo', ...args], raw: m, byId,
    members: m.workspace_members.map(i => byId[i].name).sort(),
    default_members: (m.workspace_default_members || []).map(i => byId[i].name).sort(),
    member_manifests: m.workspace_members.map(i => relative(root, byId[i].manifest_path)).sort(),
  };
}
function selectionAudit(root, md) {
  const physical = walkManifests(root);
  const excludes = rootExcludes(root);
  const classify = p => p === 'Cargo.toml' ? 'root' : md.member_manifests.includes(p) ? 'member'
    : excludes.some(x => p === x || p.startsWith(x.replace(/\/$/, '') + '/')) ? 'excluded' : 'UNACCOUNTED';
  const table = physical.map(p => ({ manifest: p, class: classify(p) }));
  const unaccounted = table.filter(t => t.class === 'UNACCOUNTED').map(t => t.manifest);
  const omitted = md.members.filter(n => !md.default_members.includes(n));
  return { physical, excludes, table, unaccounted, members: md.members, default_members: md.default_members, omitted_from_default: omitted };
}

// ----------------------------------------------------------------------------------------------- fixture copying
function copyCrate(src, dst, repoRoot) {
  mkdirSync(dirname(dst), { recursive: true });
  cpSync(src, dst, { recursive: true, filter: p => !/(^|\/)target(\/|$)/.test(relative(src, p) || '') });
  const rewrite = (manifest, origDir) => {
    let t = readFileSync(manifest, 'utf8');
    t = t.replaceAll('__REPO_ROOT__', repoRoot);
    // relative path dependencies that leave the fixture (e.g. ../../../../compiler/foundation) are pinned to their
    // original absolute location; paths that stay inside the fixture are copied as they are
    t = t.replace(/path\s*=\s*"(\.[^"]*)"/g, (m, rel) => { const abs = resolve(origDir, rel); return abs.startsWith(src + sep) || abs === src ? m : `path = "${abs}"`; });
    writeFileSync(manifest, t);
  };
  (function walk(d, o) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) walk(join(d, e.name), join(o, e.name));
      else if (e.name === 'Cargo.toml') rewrite(join(d, e.name), o);
    }
  })(dst, src);
}

// ----------------------------------------------------------------------------------------------- obligations
function baseRecord(opts, cls, invariant) {
  return { id: opts.id, class: cls, invariant, proof_set: opts.set || null, evaluated: new Date().toISOString() };
}
// ----------------------------------------------------------------------------------------------- proof sets (D13)
function loadSets(opts) { return opts.sets ? JSON.parse(readFileSync(resolve(opts.sets), 'utf8')).sets : null; }
function targetOf(args) { const i = args.indexOf('--target'); return i >= 0 ? args[i + 1] : (args[0] === 'fmt' ? 'none (rustfmt)' : 'host'); }
function profileOf(args) { return args[0] === 'fmt' ? null : (args.includes('--release') ? 'release' : 'dev'); }
// Apply the declared set to a finished record: selection and toolchain must match; CROSS_SET is diagnostic only.
function applySet(rec, sets, observedPackages) {
  if (!rec.proof_set) return rec;
  const decl = sets && sets[rec.proof_set];
  if (!decl) { rec.verdict = 'FAIL'; rec.reason = `undeclared proof set ${rec.proof_set}; ` + rec.reason; return rec; }
  const reasons = [];
  if (decl.rustc_commit && rec.toolchain && rec.toolchain.rustc_commit !== decl.rustc_commit)
    reasons.push(`toolchain ${rec.toolchain.rustc || 'ABSENT'} != pinned ${decl.toolchain} (${decl.rustc_commit.slice(0, 9)})`);
  const want = decl.graph || decl.roots;
  if (want && observedPackages && observedPackages.length) {
    const got = [...observedPackages].sort(), exp = [...want].sort();
    if (got.join(',') !== exp.join(',')) reasons.push(`selection [${got.join(' ')}] != declared ${rec.proof_set} [${exp.join(' ')}]`);
  }
  if (rec.proof_set === 'CROSS_SET') {
    rec.observed_verdict = rec.verdict; rec.verdict = 'OBS'; rec.proof_weight = 'NONE';
    rec.reason = `CROSS_SET diagnostic (proof weight NONE): ${rec.reason}`;
  } else if (reasons.length && rec.verdict !== 'UNK') { rec.verdict = 'FAIL'; rec.reason = reasons.join('; ') + '; ' + rec.reason; }
  return rec;
}
function obPins(opts) {
  const out = resolve(opts.out); const root = resolve(opts.root || '.'); const sets = loadSets(opts);
  const toml = existsSync(join(root, 'rust-toolchain.toml')) ? readFileSync(join(root, 'rust-toolchain.toml'), 'utf8') : '';
  const fileChannel = (toml.match(/^\s*channel\s*=\s*"([^"]+)"/m) || [])[1] || null;
  const rows = []; const reasons = [];
  for (const [name, d] of Object.entries(sets)) {
    if (!d.rustc_commit) continue;
    const id = toolchainIdentity(d.toolchain);
    const comps = run('rustup', ['component', 'list', '--installed', '--toolchain', d.toolchain], root);
    const installed = comps.exit === 0 ? comps.stdout.trim().split('\n') : [];
    const missing = (d.components || []).filter(c => !installed.some(i => i === c || i.startsWith(c + '-')));
    const sysroot = run('rustc', ['+' + d.toolchain, '--print', 'sysroot'], root).stdout.trim();
    rows.push({ set: name, toolchain: d.toolchain, identity: id, components_installed: installed, components_missing: missing, sysroot });
    if (id.rustc_commit !== d.rustc_commit) reasons.push(`${name}: ${d.toolchain} resolves to ${id.rustc || 'ABSENT'}, pinned commit ${d.rustc_commit}`);
    if (missing.length) reasons.push(`${name}: components missing ${missing.join(',')}`);
  }
  const host = sets.HOST_NATIVE_SET;
  if (fileChannel !== host.toolchain) reasons.push(`rust-toolchain.toml channel ${fileChannel || 'ABSENT'} != HOST_NATIVE_SET ${host.toolchain}`);
  const bare = run('rustc', ['-vV'], root);
  const bareCommit = (bare.stdout.match(/^commit-hash: (.*)$/m) || [])[1] || null;
  if (bareCommit !== host.rustc_commit) reasons.push(`bare rustc in the repository resolves to ${bareCommit}, not the pin`);
  record(out, { ...baseRecord({ id: opts.id || 'T13-PIN-01-toolchain-pins' }, 'T13-PIN', 'each proof set runs on its pinned toolchain; rust-toolchain.toml pins HOST_NATIVE_SET; bare rustc in the repository resolves to the pin'),
    rust_toolchain_toml: fileChannel, bare_rustc_commit: bareCommit, sets: rows,
    verdict: reasons.length ? 'FAIL' : 'PASS', reason: reasons.length ? reasons.join('; ') : `HOST_NATIVE_SET ${host.toolchain} (${host.rustc_commit.slice(0, 9)}) via rust-toolchain.toml; WASM64_KERNEL_SET ${sets.WASM64_KERNEL_SET.toolchain} (${sets.WASM64_KERNEL_SET.rustc_commit.slice(0, 9)}) via proof-sets.json; components present` });
}
function obSetsCheck(opts) {
  const out = resolve(opts.out); const root = resolve(opts.root || '.'); const sets = loadSets(opts);
  const md = metadata(root, true, 'stable');
  if (!md.ok) return record(out, { ...baseRecord({ id: opts.id }, 'T13-SETS', 'proof sets partition the workspace roots'), verdict: 'FAIL', reason: 'cargo metadata failed: ' + md.error.split('\n')[0] });
  const host = [...sets.HOST_NATIVE_SET.roots].sort(), wasm = [...sets.WASM64_KERNEL_SET.roots].sort();
  const nonDefault = md.members.filter(m => !md.default_members.includes(m)).sort();
  const reasons = [];
  if (host.join(',') !== md.default_members.join(',')) reasons.push(`HOST_NATIVE_SET roots [${host}] != default-members [${md.default_members}]`);
  if (wasm.join(',') !== nonDefault.join(',')) reasons.push(`WASM64_KERNEL_SET roots [${wasm}] != members outside default-members [${nonDefault}]`);
  const both = host.filter(h => wasm.includes(h)); if (both.length) reasons.push('roots in both sets: ' + both.join(','));
  const uncovered = md.members.filter(m => !host.includes(m) && !wasm.includes(m)); if (uncovered.length) reasons.push('members in no set: ' + uncovered.join(','));
  const graphOk = sets.WASM64_KERNEL_SET.graph.every(g => md.members.includes(g)); if (!graphOk) reasons.push('WASM64 graph names a non-member');
  const audit = selectionAudit(root, md); if (audit.unaccounted.length) reasons.push('physical manifests unaccounted: ' + audit.unaccounted.join(','));
  record(out, { ...baseRecord({ id: opts.id }, 'T13-SETS', 'every workspace member is the root of exactly one proof set; bare cargo (default-members) == HOST_NATIVE_SET'),
    command: md.argv, members: md.members, default_members: md.default_members, host_roots: host, wasm64_roots: wasm, physical_manifests: audit.table,
    verdict: reasons.length ? 'FAIL' : 'PASS', reason: reasons.length ? reasons.join('; ') : `${md.members.length} members = ${host.length} HOST_NATIVE_SET roots (== default-members) + ${wasm.length} WASM64_KERNEL_SET root (${wasm.join(',')}); disjoint and complete; ${audit.table.length} physical manifests accounted` });
}
// D18: the kernel identity is the EXEC identity - sha256 over (section id byte ++ section body) of every section except
// the excluded custom sections, in module order (the identity_excluding_custom of tests/implementation/wasm-sections.mjs).
// It is install-name independent (D17: only LLVM's promoted-symbol names in the custom "name" section carry the rustup
// install name).  The whole-file sha256 stays recorded per install name and is reported, never the verdict.
function wasmExecIdentity(bytes, exclude) {
  if (bytes.length < 8 || bytes.readUInt32LE(0) !== 0x6d736100) return null;
  const leb = i => { let r = 0, s = 0; for (;;) { const x = bytes[i++]; r += (x & 0x7f) * 2 ** s; s += 7; if (x < 0x80) return [r, i]; } };
  const parts = []; let i = 8;
  while (i < bytes.length) {
    const id = bytes[i++]; const [n, j] = leb(i); const body = bytes.subarray(j, j + n); let name = null;
    if (id === 0) { let k = 0, l = 0, s = 0; for (;;) { const x = body[k++]; l += (x & 0x7f) * 2 ** s; s += 7; if (x < 0x80) break; } name = body.subarray(k, k + l).toString('utf8'); }
    if (!(id === 0 && exclude.includes(name))) parts.push(Buffer.from([id]), body);
    i = j + n;
  }
  return createHash('sha256').update(Buffer.concat(parts)).digest('hex');
}
function obKernelIdentity(opts) {
  const out = resolve(opts.out); const root = resolve(opts.root || '.'); const sets = loadSets(opts);
  const d = sets.WASM64_KERNEL_SET; const ki = d.kernel_identity; const ex = ki.exec_identity;
  const sysroot = run('rustc', ['+' + d.toolchain, '--print', 'sysroot'], root).stdout.trim();
  const install = sysroot.split('/').pop();
  const mod = resolve(root, opts.module);
  let bytes = null; try { bytes = readFileSync(mod); } catch { }
  const sha = bytes ? createHash('sha256').update(bytes).digest('hex') : null;
  const exec = bytes ? wasmExecIdentity(bytes, ex.excluded_custom_sections) : null;
  const want = ki.by_install_name[install] || null;
  const matches = bytes ? Object.entries(ki.by_install_name).filter(([, w]) => w.sha256 === sha && w.bytes === bytes.length).map(([k]) => k) : [];
  const whole = !bytes ? null : matches.length ? `whole file == recorded for install ${matches.join(', ')} (informational)` : `whole file ${sha} (${bytes.length} bytes) matches no recorded install name (informational)`;
  const verdict = !bytes ? 'UNK' : !exec ? 'FAIL' : (exec === ex.sha256 ? 'PASS' : 'FAIL');
  record(out, { ...baseRecord({ id: opts.id, set: 'WASM64_KERNEL_SET' }, 'T13-KRN', 'the release kernel built by the pinned nightly has the declared exec identity (install-name independent); whole-file sha256 reported per install name'),
    target: WASM64, profile: 'release', toolchain: toolchainIdentity(d.toolchain), sysroot, install_name: install, module: opts.module, sha256: sha, bytes: bytes ? bytes.length : null,
    exec_identity: exec, declared_exec_identity: ex.sha256, excluded_custom_sections: ex.excluded_custom_sections, whole_file: whole, declared: want,
    verdict, reason: verdict === 'UNK' ? 'module missing: ' + mod : !exec ? 'not a wasm module: ' + mod : verdict === 'PASS' ? `exec identity ${exec} == declared (install ${install}); ${whole}` : `exec identity ${exec} != declared ${ex.sha256} (install ${install}); ${whole}` });
}

function obToolchain(opts) {
  const out = resolve(opts.out); const root = resolve(opts.root || '.');
  const stable = toolchainIdentity('stable'), nightly = toolchainIdentity('nightly'), active = toolchainIdentity(null);
  const show = run('rustup', ['show', 'active-toolchain'], root);
  const comps = run('rustup', ['component', 'list', '--installed', '--toolchain', mapChan('nightly') || 'nightly'], root);
  const pin = existsSync(join(root, 'rust-toolchain.toml')) || existsSync(join(root, 'rust-toolchain'));
  const rec = {
    ...baseRecord({ id: 'T9-P7-01-toolchain-identity' }, 'T9-P7', 'toolchain identity is recorded, not assumed; pin status is stated'),
    active_toolchain: show.stdout.trim(), stable, nightly, default: active,
    nightly_components: comps.exit === 0 ? comps.stdout.trim().split('\n') : [],
    repository_pin: pin ? 'rust-toolchain(.toml) present' : 'ABSENT: no rust-toolchain.toml; toolchains are environmental',
    requires_stable: ['T9-P2-*', 'T9-P3-01..03', 'T9-P4-*', 'T9-P6-*'], requires_nightly: ['T9-P3-04', 'T9-P5-02', 'T9-P8-*'],
    verdict: pin ? 'PASS' : 'GAP',
    reason: pin ? 'repository pins its toolchain' : `no repository pin; stable=${stable.rustc} nightly=${nightly.rustc || 'ABSENT'}; pin authorization returned to ASCII (D10)`,
  };
  record(out, rec);
}

function obSelection(opts) {
  const out = resolve(opts.out); const root = resolve(opts.root || '.');
  const md = metadata(root, !!opts.locked, opts.chan);
  if (!md.ok) return record(out, { ...baseRecord({ id: opts.id }, 'T9-P1', 'package selection'), command: md.argv, verdict: 'FAIL', reason: 'cargo metadata failed: ' + md.error.split('\n')[0] });
  const a = selectionAudit(root, md);
  const rec = { ...baseRecord({ id: opts.id }, 'T9-P1', 'every physical manifest is accounted for; default-members selects the whole workspace'),
    command: md.argv, cwd: root, toolchain: toolchainIdentity(opts.chan || null), physical_manifests: a.table, excludes: a.excludes,
    workspace_members: a.members, workspace_default_members: a.default_members, omitted_from_default_members: a.omitted_from_default, unaccounted: a.unaccounted };
  const reasons = [];
  if (a.unaccounted.length) reasons.push('unaccounted manifests: ' + a.unaccounted.join(', '));
  if (a.omitted_from_default.length) reasons.push('members omitted from default-members (bare cargo build/test/clippy never select them): ' + a.omitted_from_default.join(', '));
  rec.verdict = reasons.length ? 'FAIL' : 'PASS';
  rec.reason = reasons.length ? reasons.join('; ') : `${a.members.length} members == default-members; ${a.table.filter(t => t.class === 'excluded').length} excluded manifests under ${JSON.stringify(a.excludes)}`;
  record(out, rec);
  if (opts['test-workspace']) {
    const r = cargoJson(opts.chan || null, ['test', '--workspace'], root, {}, root);
    const rec2 = { ...baseRecord({ id: opts.id + '-workspace-test' }, 'T9-P1', 'cargo test --workspace covers every member'), command: r.argv, cwd: root, exit: r.exit,
      selection: r.parsed ? r.parsed.selection : [], packages: r.parsed ? r.parsed.packages : [], tests: r.parsed ? r.parsed.tests : null, errors: r.parsed ? r.parsed.errors.slice(0, 20) : [] };
    const missing = a.members.filter(n => !(r.parsed && r.parsed.packages.includes(n)));
    rec2.verdict = r.exit === 0 && !missing.length ? 'PASS' : 'FAIL';
    rec2.reason = r.exit === 0 && !missing.length ? `exit 0; ${r.parsed.tests.passed} passed / ${r.parsed.tests.failed} failed over ${r.parsed.packages.length} packages`
      : `exit ${r.exit}; ${r.parsed ? r.parsed.tests.failed + ' failed (' + r.parsed.tests.failed_names.join(',') + ')' : ''}${missing.length ? '; members without artifacts: ' + missing.join(',') : ''}${r.parsed && r.parsed.errors.length ? '; first error: ' + (r.parsed.errors[0].code || '') + ' ' + r.parsed.errors[0].message : ''}`;
    record(out, rec2);
  }
}

function obCargo(opts) {
  const out = resolve(opts.out); const root = resolve(opts.root || '.'); const cwd = resolve(root, opts.cwd || '.');
  const env = envOf(opts); const chan = opts.chan || null;
  const r = cargoJson(chan, opts.rest, cwd, env, root);
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, opts.id + '.log'), `$ ${r.argv.join(' ')}\n(cwd ${cwd})\n${r.stderr}\n${r.stdout.split('\n').filter(l => !l.startsWith('{')).join('\n')}\n[exit ${r.exit}]\n`);
  const rec = { ...baseRecord(opts, opts.class || 'T9-P2', opts.invariant || 'declared cargo invocation exits 0 over an explicitly recorded selection'),
    target: targetOf(opts.rest), profile: profileOf(opts.rest),
    command: r.argv, cwd, env, toolchain: toolchainIdentity(chan), exit: r.exit, spawn_error: r.spawn_error || null };
  if (r.parsed) {
    Object.assign(rec, { selection: r.parsed.selection, packages: r.parsed.packages, sysroot_artifacts: r.parsed.sysroot, tests: r.parsed.tests, errors: r.parsed.errors.slice(0, 30), finished: r.parsed.tests.finished || null });
  }
  const expectFail = !!opts['expect-fail'];
  if (r.spawn_error) { rec.verdict = 'UNK'; rec.reason = 'could not spawn cargo: ' + r.spawn_error; }
  else {
    const ok = r.exit === 0;
    rec.verdict = ok ? 'PASS' : 'FAIL';
    const t = r.parsed.tests;
    const testPart = t.results.length ? `; tests ${t.passed} passed / ${t.failed} failed over ${t.results.length} harness runs${t.failed_names.length ? ' (' + t.failed_names.join(',') + ')' : ''}` : '';
    const errPart = r.parsed.errors.length ? `; first error: ${r.parsed.errors[0].package || ''} ${r.parsed.errors[0].code || '(no code)'} ${r.parsed.errors[0].message}` : '';
    rec.reason = `exit ${r.exit}; ${r.parsed.packages.length} workspace packages [${r.parsed.packages.join(' ')}]${testPart}${errPart}`;
    if (opts['require-packages']) {
      const want = opts['require-packages'].split(',');
      const missing = want.filter(w => !r.parsed.packages.includes(w));
      if (missing.length) { rec.verdict = 'FAIL'; rec.reason += `; required packages not compiled: ${missing.join(',')}`; }
    }
    if (expectFail) rec.expected_on_sut = 'FAIL';
  }
  record(out, applySet(rec, loadSets(opts), opts.rest[0] === 'fmt' ? null : (r.parsed ? r.parsed.packages : null)));
}

function compileFailCheck(fixtureDir, expectFile, scratch, repoRoot, chan) {
  const expect = JSON.parse(readFileSync(expectFile, 'utf8'));
  const dst = join(scratch, 'src-copy');
  copyCrate(fixtureDir, dst, repoRoot);
  const r = cargoJson(chan || null, ['build', '--lib'], dst, { CARGO_TARGET_DIR: join(scratch, 'target') }, dst);
  const observed = r.parsed ? r.parsed.errors : [];
  const reasons = [];
  if (r.spawn_error) return { verdict: 'UNK', reason: 'cargo unavailable: ' + r.spawn_error, command: r.argv, observed };
  if (r.exit === 0) reasons.push('fixture BUILT: the invariant is not enforced');
  const counts = {};
  for (const e of observed) counts[e.code || '(no code)'] = (counts[e.code || '(no code)'] || 0) + 1;
  for (const ex of expect.expected_errors) {
    const key = ex.code || '(no code)';
    const hits = observed.filter(e => (e.code || '(no code)') === key && (!ex.message_contains || e.message.includes(ex.message_contains)) && (!ex.message_contains_all || ex.message_contains_all.every(s => e.message.includes(s))));
    if (hits.length !== ex.count) reasons.push(`expected ${ex.count} x ${key}${ex.message_contains ? ' "' + ex.message_contains + '"' : ''}, observed ${hits.length}`);
    if (ex.lines) { const lines = hits.map(h => h.line).sort((a, b) => a - b); const want = [...ex.lines].sort((a, b) => a - b); if (JSON.stringify(lines) !== JSON.stringify(want)) reasons.push(`${key} primary spans ${JSON.stringify(lines)} != expected ${JSON.stringify(want)}`); }
    if (ex.file) for (const h of hits) if (h.file !== ex.file) reasons.push(`${key} at ${h.file} not ${ex.file}`);
  }
  if (expect.forbid_other_errors !== false) {
    const expectedKeys = new Set(expect.expected_errors.map(e => e.code || '(no code)'));
    for (const e of observed) if (!expectedKeys.has(e.code || '(no code)')) reasons.push(`unexpected diagnostic ${e.code || '(no code)'} "${e.message}" at ${e.file}:${e.line}`);
  }
  return { verdict: reasons.length ? 'FAIL' : 'PASS', reason: reasons.length ? reasons.join('; ') : `rejected for the expected reason: ${expect.expected_errors.map(e => `${e.count}x${e.code || 'private-field'}`).join(', ')} (${Object.entries(counts).map(([k, v]) => k + ':' + v).join(' ')})`,
    command: r.argv, exit: r.exit, observed_errors: observed, expected: expect.expected_errors, weak_rule: { rule: 'run-negative-fixtures.sh: cargo build exit != 0', verdict: r.exit !== 0 ? 'PASS' : 'FAIL' }, invariant: expect.invariant };
}
function obCompileFail(opts) {
  const out = resolve(opts.out); const root = resolve(opts.root || '.');
  const scratch = join(process.env.CARGO_TARGET_DIR || join(root, 'target'), 'd9-scratch', opts.id);
  const res = compileFailCheck(resolve(root, opts.fixture), resolve(root, opts.expect), scratch, root, opts.chan);
  record(out, applySet({ ...baseRecord(opts, 'T9-P4', res.invariant || 'compile-fail for the expected reason'), target: 'host', profile: 'dev', fixture: opts.fixture, expect_file: opts.expect, toolchain: toolchainIdentity(opts.chan || null), ...res }, loadSets(opts), null));
}

// D13: under --set HEURISTIC the record's verdict is HEURISTIC (proof weight NONE); the scanner's own answer is kept
// as heuristic_result.  Without --set the D9 record shape is unchanged.  Mutant weak checks use the raw result.
function heuristic(rec, opts) {
  if (opts.set !== 'HEURISTIC') return rec;
  return { ...rec, heuristic_result: rec.verdict, verdict: 'HEURISTIC', proof_weight: 'NONE', reason: `proof weight NONE; scanner said ${rec.verdict}: ${rec.reason}` };
}
function nostdScan(factory, root, crates) {
  const r = run(factory, ['nostd-check', ...crates], root);
  return { command: [factory, 'nostd-check', ...crates], exit: r.exit, output: (r.stdout + r.stderr).trim().split('\n').slice(0, 40), verdict: r.exit === 0 ? 'PASS' : 'FAIL', reason: (r.exit === 0 ? 'textual scan found no offender' : 'textual scan flagged: ' + (r.stdout.match(/\[FAIL\][^\n]*/g) || []).join(' | ').slice(0, 300)) + ' [HEURISTIC: cfg(test)/::std/grouped-use bypasses known; verdict weight none]' };
}
function obNostdScan(opts) {
  const out = resolve(opts.out); const root = resolve(opts.root || '.');
  const res = nostdScan(resolve(opts.factory), root, opts.crates.split(','));
  record(out, heuristic({ ...baseRecord(opts, 'T9-P5', 'textual no_std scan (heuristic reference only)'), cwd: root, ...res, weight: 'none' }, opts));
}
function nostdGraph(root, cwd, pkg, profile, intended, scratchTarget, extraEnv = {}) {
  const args = ['build', '-p', pkg, '-Z', 'build-std=core', '--target', WASM64, ...(profile === 'release' ? ['--release'] : [])];
  const env = { RUSTFLAGS: STACK_FLAG, ...(scratchTarget ? { CARGO_TARGET_DIR: scratchTarget } : {}), ...extraEnv };
  const r = cargoJson('nightly', args, cwd, env, cwd);
  if (r.spawn_error) return { verdict: 'UNK', reason: 'nightly cargo unavailable: ' + r.spawn_error, command: r.argv };
  if (!r.parsed) return { verdict: 'UNK', reason: 'no cargo output', command: r.argv };
  const compiled = r.parsed.packages;
  const missing = intended.filter(i => !compiled.includes(i));
  const stdErrors = r.parsed.errors.filter(e => /\bstd\b/.test(e.message));
  const reasons = [];
  if (r.exit !== 0) reasons.push(`exit ${r.exit}: ${r.parsed.errors.slice(0, 3).map(e => `${e.package || ''} ${e.code || '(no code)'} ${e.message}`).join(' | ')}`);
  if (missing.length) reasons.push('intended crates absent from the core-only graph: ' + missing.join(','));
  return { verdict: reasons.length ? 'FAIL' : 'PASS', reason: reasons.length ? reasons.join('; ') : `${compiled.length} workspace crates compiled with core only on ${WASM64} (${profile}); sysroot: ${r.parsed.sysroot.join(' ')}`,
    command: r.argv, env, exit: r.exit, compiled, sysroot: r.parsed.sysroot, intended, missing, std_errors: stdErrors, errors: r.parsed.errors.slice(0, 20), target: WASM64, profile, artifact: r.exit === 0 ? join(scratchTarget || process.env.CARGO_TARGET_DIR || join(cwd, 'target'), WASM64, profile === 'release' ? 'release' : 'debug', pkg.replace(/-/g, '_') + '.wasm') : null };
}
function obNostdGraph(opts) {
  const out = resolve(opts.out); const root = resolve(opts.root || '.');
  const res = nostdGraph(root, root, opts.package, opts.profile || 'dev', (opts.intended || '').split(',').filter(Boolean), null);
  mkdirSync(out, { recursive: true });
  record(out, applySet({ ...baseRecord(opts, opts.class || 'T9-P5', 'compiler-enforced no_std: the intended crate graph compiles with core only for wasm64'), cwd: root, toolchain: toolchainIdentity('nightly'), ...res }, loadSets(opts), res.compiled));
}

function depsAudit(root, locked, chan) {
  const md = metadata(root, locked, chan);
  if (!md.ok) return { verdict: 'FAIL', reason: 'RESOLUTION_FAILED: cargo metadata could not resolve the graph from first-party sources: ' + md.error.split('\n').slice(0, 2).join(' '), command: md.argv };
  const m = md.raw; const offenders = []; const packages = []; const deps = [];
  for (const p of m.packages) {
    const mp = resolve(p.manifest_path); const inside = mp.startsWith(root + sep);
    packages.push({ name: p.name, version: p.version, source: p.source, manifest: inside ? relative(root, mp) : mp, inside_root: inside });
    if (p.source !== null) offenders.push(`package ${p.name}@${p.version} source ${p.source}`);
    if (!inside) offenders.push(`package ${p.name} manifest outside root: ${mp}`);
    for (const d of p.dependencies) {
      const isPath = !!d.path; const pInside = isPath && resolve(d.path).startsWith(root + sep);
      deps.push({ from: p.name, name: d.name, kind: d.kind || 'normal', target: d.target || null, source: d.source, path: d.path ? relative(root, d.path) : null, req: d.req });
      if (!isPath) offenders.push(`${p.name} -> ${d.name} (${d.kind || 'normal'}${d.target ? ', target ' + d.target : ''}) is not a path dependency: source ${d.source} req ${d.req}`);
      else if (!pInside) offenders.push(`${p.name} -> ${d.name} path outside root: ${d.path}`);
    }
  }
  const resolvedIds = m.resolve ? m.resolve.nodes.map(n => n.id) : [];
  for (const id of resolvedIds) { const p = packageIdParts(id); if (p.source !== 'path') offenders.push(`resolved node ${id} is not a path package`); }
  const audit = selectionAudit(root, md);
  const physicalNotInGraph = audit.table.filter(t => t.class !== 'member' && t.class !== 'root');
  return { verdict: offenders.length ? 'FAIL' : 'PASS',
    reason: offenders.length ? offenders.slice(0, 6).join('; ') : `${packages.length} packages, all path sources inside root; ${deps.length} declared dependency edges all path-inside-root; resolve graph ${resolvedIds.length} nodes; physical manifests not in the product graph: ${physicalNotInGraph.map(t => t.manifest + '(' + t.class + ')').join(', ') || 'none'}`,
    command: md.argv, packages, dependencies: deps, resolved_nodes: resolvedIds.length, physical_manifests: audit.table, unaccounted: audit.unaccounted, offenders };
}
function obDeps(opts) {
  const out = resolve(opts.out); const root = resolve(opts.root || '.');
  const res = depsAudit(root, !!opts.locked, opts.chan || null);
  if (opts['expect-fail']) {
    // negative fixture: the obligation is that the audit REJECTS it
    const rejected = res.verdict === 'FAIL';
    res.negative_fixture = true;
    res.audit_verdict = res.verdict;
    res.verdict = rejected ? 'PASS' : 'FAIL';
    res.reason = rejected ? 'rejected as required: ' + res.reason : 'NOT rejected: ' + res.reason;
  }
  record(out, { ...baseRecord(opts, 'T9-P6', 'first-party only: every package and dependency Cargo resolves is a path inside the repository'), target: 'none (cargo metadata)', profile: null, cwd: root, toolchain: toolchainIdentity(opts.chan || null), ...res, note: 'vendored third-party code inside root is indistinguishable from first-party by path rules alone [UNK]' });
}
function depcheckWeak(factory, root, manifests) {
  const r = run(factory, ['depcheck', root, ...manifests], root);
  return { command: [factory, 'depcheck', root, ...manifests], exit: r.exit, output: (r.stdout + r.stderr).trim().split('\n').slice(0, 40), verdict: r.exit === 0 ? 'PASS' : 'FAIL', reason: (r.exit === 0 ? `explicit-list scan accepted ${manifests.length} manifests` : 'explicit-list scan flagged: ' + (r.stdout.match(/\[FAIL\][^\n]*/g) || []).join(' | ').slice(0, 300)) + ' [HEURISTIC: unlisted manifests and dotted-table sections are never read; verdict weight none]' };
}
function obDepcheckWeak(opts) {
  const out = resolve(opts.out); const root = resolve(opts.root || '.');
  const res = depcheckWeak(resolve(opts.factory), root, opts.manifests.split(','));
  record(out, heuristic({ ...baseRecord(opts, 'T9-P6', 'explicit-list dependency scan (heuristic reference only)'), ...res, weight: 'none' }, opts));
}

function wasmInspect(factory, module, outJson, cwd) {
  const r = run(factory, ['wasm-inspect', module, ...(outJson ? ['--out', outJson] : [])], cwd);
  const lines = (r.stdout + r.stderr).trim().split('\n');
  const fails = lines.filter(l => l.includes('[FAIL]'));
  return { command: [factory, 'wasm-inspect', module], exit: r.exit, output: lines.slice(0, 20), verdict: r.spawn_error ? 'UNK' : (r.exit === 0 ? 'PASS' : 'FAIL'), reason: r.spawn_error ? r.spawn_error : (r.exit === 0 ? lines.filter(l => /memory_declared|artifact_identity/.test(l)).join('; ') : fails.join('; ')) };
}
function obWasmInspect(opts) {
  const out = resolve(opts.out); const root = resolve(opts.root || '.');
  mkdirSync(out, { recursive: true });
  const res = wasmInspect(resolve(opts.factory), resolve(root, opts.module), join(out, opts.id + '.inspect.json'), root);
  record(out, { ...baseRecord(opts, 'T9-P8', 'the built module is wasm64: every memory uses the i64 address type; imports/exports and sha256 recorded'), target: WASM64, profile: /\/release\//.test(opts.module) ? 'release' : 'dev', module: opts.module, ...res });
}
function obBrowserAbi(opts) {
  const out = resolve(opts.out); const root = resolve(opts.root || '.');
  const r = run('node', ['host/harness/kernel-host.mjs', resolve(root, opts.module), resolve(root, opts.source), '--browser'], root);
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, opts.id + '.browser.json'), r.stdout);
  writeFileSync(join(out, opts.id + '.browser.err.log'), r.stderr);
  let j = null; try { j = JSON.parse(r.stdout); } catch { }
  const reasons = [];
  if (r.spawn_error) reasons.push('node unavailable: ' + r.spawn_error);
  else if (r.exit !== 0 || !j) reasons.push(`harness exit ${r.exit}: ${r.stderr.trim().split('\n').slice(-1)[0] || 'no JSON'}`);
  else { if (!Array.isArray(j.imports) || j.imports.length) reasons.push('undeclared imports: ' + JSON.stringify(j.imports)); if (j.abi_version !== 1) reasons.push('abi_version ' + j.abi_version); if (!j.diagnostics) reasons.push('no diagnostics object'); }
  record(out, { ...baseRecord(opts, 'T9-P8', 'the wasm64 module executes in Chromium through the bootstrap ABI with zero imports'), target: WASM64, profile: /\/release\//.test(opts.module) ? 'release' : 'dev', command: ['node', 'host/harness/kernel-host.mjs', opts.module, opts.source, '--browser'], cwd: root, exit: r.exit,
    observed: j ? { host: j.host, abi_version: j.abi_version, required_workspace: j.required_workspace, memory_pages: j.memory_pages, imports: j.imports, exports: j.exports, status: j.status } : null,
    verdict: r.spawn_error ? 'UNK' : (reasons.length ? 'FAIL' : 'PASS'), reason: reasons.length ? reasons.join('; ') : `Chromium ${(j.host || '').match(/HeadlessChrome\/[\d.]+/)?.[0] || j.host}: abi_version 1, imports [], ${j.exports.length} exports, memory_pages ${j.memory_pages}` });
}

function obBrowserBuild(opts) {
  // D23: the whole transport in Chromium - BUILD (source + registry + metrics) and OBSERVE (tape + identities) through
  // the wasm exports; every artifact and bundle file compared byte-for-byte with the native driver's run
  const out = resolve(opts.out); const root = resolve(opts.root || '.');
  const dir = join(out, opts.id + '.browser-build'); mkdirSync(dir, { recursive: true });
  const args = ['host/harness/kernel-build-probe.mjs', resolve(root, opts.module), '--source', opts.source, '--contracts', opts.contracts, '--metrics', opts.metrics, '--tape', opts.tape, '--system', opts.system,
    '--evidence-class', opts['evidence-class'] || 'PHYSICAL_BROWSER', '--native-build', opts['native-build'], '--native-observe', opts['native-observe'], '--out', dir];
  const r = run('node', args, root);
  writeFileSync(join(dir, 'harness.log'), r.stdout + r.stderr);
  let j = null; try { j = JSON.parse(readFileSync(join(dir, 'probe.json'), 'utf8')); } catch { }
  const reasons = [];
  if (r.spawn_error) reasons.push('node unavailable: ' + r.spawn_error);
  else if (!j) reasons.push(`harness exit ${r.exit}: ${r.stderr.trim().split('\n').slice(-1)[0] || 'no probe.json'}`);
  else if (j.status !== 'PASS') reasons.push(...j.problems);
  const identical = j ? [...j.build.compare, ...j.observe.compare].filter(x => x.verdict === 'IDENTICAL').length : 0;
  const total = j ? j.build.compare.length + j.observe.compare.length : 0;
  record(out, { ...baseRecord(opts, 'T9-P8', 'the wasm64 module runs BUILD and OBSERVE in Chromium through the transport exports with zero imports and produces byte-for-byte the native driver\'s diagnostics, artifacts and bundle'), target: WASM64, profile: /\/release\//.test(opts.module) ? 'release' : 'dev', module: opts.module, command: ['node', ...args],
    observed: j ? { host: j.host, kernel_sha256: j.kernel_sha256, exports: j.exports.length, imports: j.imports, build_status: j.build.status, build_ms: j.build.ms, bundle_files: j.build.bundle_files.length, observe_status: j.observe.status, identical, compared: total } : null,
    verdict: r.spawn_error ? 'UNK' : (reasons.length ? 'FAIL' : 'PASS'), reason: reasons.length ? reasons.join('; ') : `Chromium ${(j.host || '').match(/HeadlessChrome\/[\d.]+/)?.[0] || j.host}: BUILD status ${j.build.status} in ${j.build.ms} ms, OBSERVE status ${j.observe.status}; ${identical}/${total} files identical to the native driver (${j.exports.length} exports, imports [])` });
}

// ----------------------------------------------------------------------------------------------- mutants (T9-P9)
function runCheck(check, ctx) {
  const { dir, target, root, factory } = ctx;
  const env = { CARGO_TARGET_DIR: target, ...(check.env || {}) };
  switch (check.check) {
    case 'cargo': {
      const r = cargoJson(check.chan || null, check.args, dir, env, dir);
      if (r.spawn_error) return { verdict: 'UNK', reason: r.spawn_error, command: r.argv };
      const t = r.parsed.tests;
      return { verdict: r.exit === 0 ? 'PASS' : 'FAIL', command: r.argv, exit: r.exit, packages: r.parsed.packages, selection: r.parsed.selection, tests: t,
        reason: `exit ${r.exit}; packages [${r.parsed.packages.join(' ')}]${t.results.length ? `; ${t.passed} passed / ${t.failed} failed${t.failed_names.length ? ' (' + t.failed_names.join(',') + ')' : ''}` : ''}${r.parsed.errors.length ? '; ' + r.parsed.errors[0].code + ' ' + r.parsed.errors[0].message : ''}` };
    }
    case 'compile-fail-weak': {
      const r = cargoJson(check.chan || null, ['build', '--lib'], dir, env, dir);
      return { verdict: r.exit !== 0 ? 'PASS' : 'FAIL', command: r.argv, exit: r.exit, reason: r.exit !== 0 ? `cargo build exit ${r.exit} -> weak rule says "rejected by rustc (expected)" without reading the diagnostic (${r.parsed.errors.map(e => e.code || '(no code)').join(',')})` : 'built' };
    }
    case 'compile-fail': {
      const res = compileFailCheck(dir, join(dir, check.expect_file), join(target, 'compile-fail'), root, check.chan);
      return res;
    }
    case 'selection': {
      const md = metadata(dir, false, check.chan);
      if (!md.ok) return { verdict: 'FAIL', reason: 'metadata failed: ' + md.error.split('\n')[0] };
      const a = selectionAudit(dir, md);
      const r = cargoJson(check.chan || null, ['test', '--workspace'], dir, env, dir);
      const reasons = [];
      if (a.omitted_from_default.length) reasons.push('members omitted from default-members: ' + a.omitted_from_default.join(','));
      if (r.exit !== 0) reasons.push(`cargo test --workspace exit ${r.exit}: ${r.parsed.tests.failed} failed (${r.parsed.tests.failed_names.join(',')})${r.parsed.errors.length ? ' ' + r.parsed.errors[0].message : ''}`);
      return { verdict: reasons.length ? 'FAIL' : 'PASS', reason: reasons.join('; ') || 'default-members == members and --workspace tests pass', members: a.members, default_members: a.default_members, workspace_test: { command: r.argv, exit: r.exit, packages: r.parsed.packages, tests: r.parsed.tests } };
    }
    case 'nostd-scan': return nostdScan(factory, dir, check.crates || ['.']);
    case 'nostd-graph': return nostdGraph(root, dir, check.package, check.profile || 'dev', check.intended || [check.package], target);
    case 'depcheck-weak': return depcheckWeak(factory, dir, check.manifests);
    case 'deps': return depsAudit(dir, false, check.chan || null);
    case 'wasm-inspect': return wasmInspect(factory, join(target, check.module), null, dir);
    default: throw new Error('unknown check kind ' + check.check);
  }
}
function obMutants(opts) {
  const out = resolve(opts.out); const root = resolve(opts.root || '.'); const factory = resolve(opts.factory);
  const mutantsDir = resolve(root, opts.mutants);
  const scratchRoot = join(process.env.CARGO_TARGET_DIR || join(root, 'target'), 'd9-mutants');
  const ids = readdirSync(mutantsDir).filter(d => existsSync(join(mutantsDir, d, 'MUTANT.json'))).sort();
  const results = [];
  for (const id of ids) {
    const spec = JSON.parse(readFileSync(join(mutantsDir, id, 'MUTANT.json'), 'utf8'));
    const dir = join(scratchRoot, id, 'src-copy'); const target = join(scratchRoot, id, 'target');
    copyCrate(join(mutantsDir, id), dir, root);
    const ctx = { dir, target, root, factory };
    const weak = runCheck(spec.weak, ctx); const qualified = runCheck(spec.qualified, ctx);
    const weakOk = weak.verdict === spec.weak.expect;
    const qualOk = qualified.verdict === spec.qualified.expect && (!spec.qualified.reason_must_contain || (qualified.reason || '').includes(spec.qualified.reason_must_contain));
    const res = { id, attacks: spec.attacks, description: spec.description, weak: { ...spec.weak, observed: weak }, qualified: { ...spec.qualified, observed: qualified },
      expected: { weak: spec.weak.expect, qualified: spec.qualified.expect }, observed: { weak: weak.verdict, qualified: qualified.verdict },
      verdict: weakOk && qualOk ? 'RUN' : 'ERR', reason: weakOk && qualOk ? `weak check ${weak.verdict} (would accept the mutant); qualified check ${qualified.verdict}: ${qualified.reason}` : `expectation mismatch: weak expected ${spec.weak.expect} observed ${weak.verdict} (${weak.reason}); qualified expected ${spec.qualified.expect} observed ${qualified.verdict} (${qualified.reason})` };
    writeJson(join(out, id, 'weak.json'), weak); writeJson(join(out, id, 'qualified.json'), qualified); writeJson(join(out, id, 'mutant.json'), res);
    console.log(`${res.verdict.padEnd(4)} ${id}  ${res.reason.slice(0, 400)}`);
    results.push(res);
  }
  const all = results.every(r => r.verdict === 'RUN');
  writeJson(join(out, 'summary.json'), { class: 'T9-P9', mutants: results.map(r => ({ id: r.id, attacks: r.attacks, expected: r.expected, observed: r.observed, verdict: r.verdict, reason: r.reason })), verdict: all ? 'RUN' : 'ERR', reason: all ? `${results.length} mutants: every weak check accepted the mutant and every qualified check rejected it for the named reason` : 'a mutant survived or an expectation is wrong: the judge is not qualified' });
  writeFileSync(join(out, 'summary.txt'), results.map(r => `${r.verdict} ${r.id} [${r.attacks}] weak=${r.observed.weak}(exp ${r.expected.weak}) qualified=${r.observed.qualified}(exp ${r.expected.qualified})\n    ${r.reason.slice(0, 600)}`).join('\n') + '\n');
  if (!all) process.exit(1);
}

// ----------------------------------------------------------------------------------------------- summary
function obSummary(opts) {
  const out = resolve(opts.out); const recs = [];
  (function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'mutants') walk(p); }
      else if (e.name.endsWith('.json') && !e.name.includes('.inspect.') && !e.name.includes('.browser.') && e.name !== 'summary.json' && e.name !== 'index.json') {
        try { const j = JSON.parse(readFileSync(p, 'utf8')); if (j.id && j.verdict) recs.push({ id: j.id, class: j.class, proof_set: j.proof_set || null, target: j.target || null, profile: j.profile === undefined ? null : j.profile, verdict: j.verdict, proof_weight: j.proof_weight || null, reason: j.reason, toolchain: j.toolchain ? j.toolchain.rustc : null, command: j.command ? j.command.join(' ') : null, packages: j.packages || j.compiled || null, file: relative(out, p) }); } catch { }
      }
    }
  })(out);
  recs.sort((a, b) => a.id.localeCompare(b.id));
  let mut = null; try { mut = JSON.parse(readFileSync(join(out, 'mutants', 'summary.json'), 'utf8')); } catch { }
  const tally = {}; for (const r of recs) tally[r.verdict] = (tally[r.verdict] || 0) + 1;
  const proofTally = {}; for (const r of recs) if (!r.proof_weight) proofTally[r.verdict] = (proofTally[r.verdict] || 0) + 1;
  writeJson(join(out, 'summary.json'), { generated: new Date().toISOString(), obligations: recs, tally, proof_tally: proofTally, mutants: mut ? { verdict: mut.verdict, reason: mut.reason, mutants: mut.mutants.map(m => ({ id: m.id, verdict: m.verdict, observed: m.observed })) } : null });
  const w = Math.max(...recs.map(r => r.id.length));
  writeFileSync(join(out, 'summary.txt'), ['D9 PROOF MATRIX (verdicts are about the system under test; the harness ran)', ...recs.map(r => `${r.verdict.padEnd(4)} ${r.id.padEnd(w)}  ${r.toolchain || ''}${r.proof_set ? `\n     set ${r.proof_set}  target ${r.target}  profile ${r.profile}${r.proof_weight ? '  proof weight ' + r.proof_weight : ''}` : ''}\n     ${r.command || ''}\n     ${r.reason}`), '', mut ? `MUTANTS ${mut.verdict}: ${mut.reason}` : 'MUTANTS: not run', ...(mut ? mut.mutants.map(m => `  ${m.verdict} ${m.id} weak=${m.observed.weak} qualified=${m.observed.qualified}`) : []), ''].join('\n'));
  console.log(JSON.stringify(tally), mut ? 'mutants ' + mut.verdict : '');
}

// ----------------------------------------------------------------------------------------------- main
const [, , sub, ...rest] = process.argv;
const opts = parseArgs(rest);
try {
  switch (sub) {
    case 'toolchain': obToolchain(opts); break;
    case 'selection': obSelection(opts); break;
    case 'cargo': obCargo(opts); break;
    case 'compile-fail': obCompileFail(opts); break;
    case 'nostd-scan': obNostdScan(opts); break;
    case 'nostd-graph': obNostdGraph(opts); break;
    case 'deps': obDeps(opts); break;
    case 'depcheck-weak': obDepcheckWeak(opts); break;
    case 'wasm-inspect': obWasmInspect(opts); break;
    case 'browser-abi': obBrowserAbi(opts); break;
    case 'browser-build': obBrowserBuild(opts); break;
    case 'mutants': obMutants(opts); break;
    case 'summary': obSummary(opts); break;
    case 'pins': obPins(opts); break;
    case 'sets-check': obSetsCheck(opts); break;
    case 'kernel-identity': obKernelIdentity(opts); break;
    default:
      console.error('usage: proof.mjs <toolchain|selection|cargo|compile-fail|nostd-scan|nostd-graph|deps|depcheck-weak|wasm-inspect|browser-abi|browser-build|mutants|summary|pins|sets-check|kernel-identity> --out DIR [--root DIR] [--id ID] ...');
      process.exit(2);
  }
} catch (e) { console.error('harness malfunction:', e && e.stack || e); process.exit(3); }
