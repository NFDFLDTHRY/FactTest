// D19 environment identity capture (design/materialization/D19-INTENDED-REPROVE-REOBSERVE.md section 2).
// Usage: node tests/reprove/identity.mjs --graph FILE --out DIR [--root DIR]
// Records the CURRENT computational environment in the dimensions the graph's STALE_IF edges name, so that staleness can
// be decided by comparison instead of assumption:
//   host.json            tests/envmap/host-identity.sh (toolchains by rustup name, node/V8, git, Playwright, OS, /dev/dri)
//   toolchains.json      rustc -vV + installed components for every rustup name the graph's environments or the proof
//                        sets refer to (stable, nightly, and each pinned proof-set toolchain), plus `rustup toolchain list`
//   repo.json            HEAD, working-tree changes, workspace members (cargo metadata on the repository pin)
//   browser-default.json, browser-gpu-flags.json   tests/envmap/browser-probe.mjs (CDP version, page facts, adapter, and
//                        the executable actually launched)
//   tips.json            current branch tip (git ls-remote) of every tip-read authority source: clause summaries whose
//                        source keys name a branch (repo#branch:path) and the AUTHORITY_REVISION sources (repo, branch)
// Read-only except for DIR.  Generic: names no fact or environment.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const a = process.argv.slice(2); const o = { root: '.' };
for (let i = 0; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
mkdirSync(o.out, { recursive: true });
const run = (cmd, args, opts = {}) => { const r = spawnSync(cmd, args, { cwd: o.root, encoding: 'utf8', maxBuffer: 1 << 26, ...opts }); return { exit: r.status, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() }; };
const put = (f, v) => writeFileSync(join(o.out, f), JSON.stringify(v, null, 1) + '\n');
const g = JSON.parse(readFileSync(o.graph, 'utf8'));

// host
const h = run('sh', ['tests/envmap/host-identity.sh', join(o.out, 'host.json')]);
if (h.exit !== 0) { console.error(h.out, h.err); process.exit(1); }

// toolchains by rustup name
const sets = JSON.parse(readFileSync(join(o.root, 'tests/toolchain/proof-sets.json'), 'utf8')).sets;
const names = [...new Set(['stable', 'nightly', ...Object.values(sets).map(s => s.toolchain).filter(Boolean)])].sort();
const pick = (t, k) => (t.match(new RegExp('^' + k + ': (.*)$', 'm')) || [])[1] || null;
const tcs = {};
for (const n of names) {
  const v = run('rustc', ['+' + n, '-vV']); const c = run('rustup', ['component', 'list', '--installed', '--toolchain', n]);
  tcs[n] = v.exit === 0 ? { rustc: v.out.split('\n')[0], commit: pick(v.out, 'commit-hash'), release: pick(v.out, 'release'), llvm: pick(v.out, 'LLVM version'), host: pick(v.out, 'host'),
    components: c.exit === 0 ? c.out.split('\n').filter(Boolean).sort() : [], sysroot: run('rustc', ['+' + n, '--print', 'sysroot']).out } : { absent: true, error: (v.err || v.out).split('\n')[0] };
}
put('toolchains.json', { tool: 'tests/reprove/identity.mjs', observed: new Date().toISOString(), installed: run('rustup', ['toolchain', 'list']).out.split('\n').filter(Boolean), toolchains: tcs });

// repository
const md = run('cargo', ['+' + sets.HOST_NATIVE_SET.toolchain, 'metadata', '--no-deps', '--format-version', '1']);
let members = null; try { const m = JSON.parse(md.out); members = m.workspace_members.map(id => m.packages.find(p => p.id === id).name).sort(); } catch { }
put('repo.json', { tool: 'tests/reprove/identity.mjs', head: run('git', ['rev-parse', 'HEAD']).out, working_tree_changes: (spawnSync('git', ['status', '--porcelain'], { cwd: o.root, encoding: 'utf8' }).stdout || '').split('\n').filter(Boolean), workspace_members: members });

// browser (default launch and the GPU flag set)
for (const [f, extra] of [['browser-default.json', []], ['browser-gpu-flags.json', ['--gpu-flags']]]) {
  const b = run('node', ['tests/envmap/browser-probe.mjs', join(o.out, f), ...extra]);
  if (b.exit !== 0) { console.error(b.out, b.err); process.exit(1); }
  console.log(b.out.split('\n').pop());
}

// authority source tips
const pairs = new Map();
const addPair = (repo, branch, from, commit) => { if (!repo || !branch || !/^https:\/\/github\.com\//.test(repo)) return; const k = `${repo}#${branch}`; if (!pairs.has(k)) pairs.set(k, { repo, branch, recorded: [] }); pairs.get(k).recorded.push({ from, commit }); };
for (const e of readdirSync(join(o.root, 'evidence')).sort()) {
  const p = join(o.root, 'evidence', e, 'clauses', 'summary.json'); if (!existsSync(p)) continue;
  for (const s of JSON.parse(readFileSync(p, 'utf8')).sources || []) { const m = s.key.match(/^(https:\/\/github\.com\/[^#@]+)#([^:]+):/); if (m) addPair(m[1], m[2], `${e} clause source`, s.commit); }
}
for (const r of g.nodes.filter(n => n.class === 'AUTHORITY_REVISION' && n.source)) addPair(r.source.repo, r.source.branch, `${r.epoch} revision ${r.authority_ref}`, r.source.commit);
const tips = [];
for (const [k, p] of [...pairs].sort()) {
  const r = run('git', ['ls-remote', p.repo, `refs/heads/${p.branch}`]);
  let tip = r.exit === 0 && r.out ? r.out.split(/\s+/)[0] : null; let status = tip ? 'OK' : null;
  if (!tip && r.exit === 0) { // branch absent: follow HEAD's symref, as the clause and reopen harnesses do
    const h = run('git', ['ls-remote', '--symref', p.repo, 'HEAD']); const m = h.out.match(/^ref: refs\/heads\/(\S+)\s+HEAD$/m); const c = h.out.match(/^([0-9a-f]{40})\s+HEAD$/m);
    if (c) { tip = c[1]; status = `BRANCH ABSENT: followed HEAD -> ${m ? m[1] : '?'}`; } }
  tips.push({ key: k, repo: p.repo, branch: p.branch, tip, status: status || `UNRESOLVED (${(r.err || 'no such branch').split('\n')[0]})`, recorded_commits: [...new Set(p.recorded.map(x => x.commit))] });
}
put('tips.json', { tool: 'tests/reprove/identity.mjs', observed: new Date().toISOString(), pairs: tips });
console.log(`identity -> ${o.out}: ${names.length} toolchains, ${tips.length} source tips (${tips.filter(t => t.tip && !t.recorded_commits.includes(t.tip)).length} moved)`);
