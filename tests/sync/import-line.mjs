// Line import (D20 onward; design/materialization/D20-INTENDED-MAIN-SYNC.md).
// Brings the content of another line (commits BASE..HEAD of the map, e.g. a pull request already merged into main) into
// the working tree from git objects - never retyped - after a content-neutral sync merge made that line an ancestor.
// Usage:
//   node tests/sync/import-line.mjs --map FILE --write --scope P1,P2,...   write the line's files whose destination
//                                                                        starts with one of the scope prefixes
//   node tests/sync/import-line.mjs --map FILE --check [--scope ...] --out FILE     verify, write a report
// Every path the line changed has exactly one treatment in the map:
//   added      copied byte-identically to the same path, or to the relocated path when the map relocates it (a path
//              this line's tree already uses for other content must be relocated: a collision is never overwritten)
//   union      a document both lines changed insertion-only: git merge-file --union of (ours, base, theirs), in the
//              map's order; checked as: every line of ours kept in order, and the lines inserted relative to ours
//              contain every line the other line added
//   embed      a live record (the ledger): the lines the other line added must appear verbatim as one contiguous block
//   regenerate derived files rebuilt from their sources (the environment graph and its views)
//   live       documents rewritten by the importing delta (the live handoff)
// "ours" is the tree of --ours (default HEAD: the workpiece's canonical base).  Generic: names no path of its own.
import { readFileSync, writeFileSync, mkdirSync, existsSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const a = process.argv.slice(2); const o = { root: '.', ours: 'HEAD' };
for (let i = 0; i < a.length; i++) { const k = a[i].replace(/^--/, ''); if (a[i + 1] === undefined || a[i + 1].startsWith('--')) o[k] = true; else o[k] = a[++i]; }
const M = JSON.parse(readFileSync(o.map, 'utf8'));
const run = (cmd, args, enc = 'utf8') => { const r = spawnSync(cmd, args, { cwd: o.root, encoding: enc, maxBuffer: 1 << 30 }); if (r.status !== 0 && cmd === 'git' && args[0] !== 'cat-file') throw new Error(`${cmd} ${args.join(' ')}: ${r.stderr}`); return r; };
const blob = (rev, p) => { const r = run('git', ['cat-file', 'blob', `${rev}:${p}`], 'buffer'); return r.status === 0 ? r.stdout : null; };
const sha = b => createHash('sha256').update(b).digest('hex');
const scope = o.scope && o.scope !== true ? o.scope.split(',') : null;
const inScope = p => !scope || scope.some(s => p === s || p.startsWith(s));
const relocate = p => { for (const r of M.relocate) { if (r.from.endsWith('/') ? p.startsWith(r.from) : p === r.from) return r.to + p.slice(r.from.length); } return p; };
const union = new Map(M.union.map(u => [u.path, u.order])); const embed = M.embed || [];

const changes = run('git', ['diff', '--name-status', '--no-renames', M.line.base, M.line.head]).stdout.split('\n').filter(Boolean).map(l => { const [s, p] = l.split('\t'); return { status: s, path: p }; });
const rows = []; const problems = [];
for (const c of changes) {
  const row = { path: c.path, status: c.status };
  if (c.status === 'A') {
    const dest = relocate(c.path); const theirs = blob(M.line.head, c.path); const ours = blob(o.ours, dest);
    Object.assign(row, { treatment: dest === c.path ? 'added' : 'relocated', destination: dest, sha256: sha(theirs) });
    if (ours && !ours.equals(theirs)) problems.push(`${c.path}: destination ${dest} already holds other content in ${o.ours} (relocate it)`);
    if (dest !== c.path && !blob(o.ours, c.path)) row.note = 'relocated with its set (the original path is free)';
    if (o.write && inScope(dest)) { const p = join(o.root, dest); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, theirs); row.written = true; }
    if (o.check && inScope(dest)) { const p = join(o.root, dest); row.verdict = existsSync(p) && readFileSync(p).equals(theirs) ? 'IDENTICAL' : 'MISSING_OR_DIFFERENT'; }
  } else if (c.status === 'M' && union.has(c.path)) {
    row.treatment = 'union'; row.order = union.get(c.path);
    const base = blob(M.line.base, c.path), theirs = blob(M.line.head, c.path), ours = blob(o.ours, c.path);
    const added = diffAdded(base, theirs); const removed = diffAdded(theirs, base);
    if (removed.length) problems.push(`${c.path}: the line deleted or changed ${removed.length} line(s) - not insertion-only`);
    if (o.write && inScope(c.path)) {
      const d = mkdtempSync(join(tmpdir(), 'union-')); writeFileSync(join(d, 'ours'), ours); writeFileSync(join(d, 'base'), base); writeFileSync(join(d, 'theirs'), theirs);
      const [x, y] = row.order === 'theirs-first' ? ['theirs', 'ours'] : ['ours', 'theirs'];
      const r = spawnSync('git', ['merge-file', '--union', '-p', join(d, x), join(d, 'base'), join(d, y)], { encoding: 'buffer', maxBuffer: 1 << 28 });
      if (r.status < 0 || r.status === null) throw new Error(`merge-file ${c.path}: ${r.stderr}`);
      writeFileSync(join(o.root, c.path), r.stdout); row.written = true;
    }
    if (o.check && inScope(c.path)) {
      const now = readFileSync(join(o.root, c.path));
      const keptOurs = isSubsequence(lines(ours), lines(now)); const missing = multisetMissing(added, diffAdded(ours, now));
      row.lines_added_by_line = added.length; row.ours_kept_in_order = keptOurs; row.line_additions_missing = missing.length;
      row.verdict = keptOurs && !missing.length ? 'UNION_COMPLETE' : 'UNION_INCOMPLETE';
    }
  } else if (c.status === 'M' && embed.includes(c.path)) {
    row.treatment = 'embed';
    const added = diffAdded(blob(M.line.base, c.path), blob(M.line.head, c.path)); row.lines_added_by_line = added.length;
    if (o.check && inScope(c.path)) { const now = lines(readFileSync(join(o.root, c.path))); row.verdict = contiguous(added, now) ? 'EMBEDDED' : 'NOT_EMBEDDED'; }
  } else if (M.regenerate.includes(c.path)) row.treatment = 'regenerate';
  else if (M.live.includes(c.path)) row.treatment = 'live';
  else problems.push(`${c.path}: status ${c.status} has no treatment in the map`);
  rows.push(row);
}
function lines(b) { return b.toString('utf8').split('\n'); }
function diffAdded(from, to) {
  const d = mkdtempSync(join(tmpdir(), 'diff-')); writeFileSync(join(d, 'a'), from); writeFileSync(join(d, 'b'), to);
  const r = spawnSync('git', ['diff', '--no-index', '--no-color', '-U0', join(d, 'a'), join(d, 'b')], { encoding: 'utf8', maxBuffer: 1 << 28 });
  return r.stdout.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).map(l => l.slice(1));
}
function isSubsequence(xs, ys) { let j = 0; for (const x of xs) { while (j < ys.length && ys[j] !== x) j++; if (j === ys.length) return false; j++; } return true; }
function contiguous(xs, ys) { for (let i = 0; i + xs.length <= ys.length; i++) if (xs.every((x, k) => ys[i + k] === x)) return true; return false; }
function multisetMissing(need, have) { const m = new Map(); for (const h of have) m.set(h, (m.get(h) || 0) + 1); const miss = []; for (const n of need) { const k = m.get(n) || 0; if (k) m.set(n, k - 1); else miss.push(n); } return miss; }

const checked = rows.filter(r => r.verdict); const bad = checked.filter(r => !/^(IDENTICAL|UNION_COMPLETE|EMBEDDED)$/.test(r.verdict));
const by = {}; for (const r of rows) by[r.treatment || 'none'] = (by[r.treatment || 'none'] || 0) + 1;
const status = problems.length || bad.length ? 'FAIL' : 'PASS';
const report = { tool: 'tests/sync/import-line.mjs', map: o.map, line: M.line, ours: run('git', ['rev-parse', o.ours]).stdout.trim(), scope, changes: rows.length, by_treatment: by,
  checked: checked.length, status, problems, failures: bad.map(r => `${r.path} -> ${r.destination || r.path}: ${r.verdict}`), rows };
if (o.out) { mkdirSync(dirname(o.out), { recursive: true }); writeFileSync(o.out, JSON.stringify(report, null, 1) + '\n'); }
console.log(`${o.write ? 'write' : 'check'}: ${rows.length} line changes ${JSON.stringify(by)}; ${rows.filter(r => r.written).length} written, ${checked.length} checked; ${status}${problems.length ? ' - ' + problems.slice(0, 5).join('; ') : ''}${bad.length ? ' - ' + report.failures.slice(0, 5).join('; ') : ''}`);
process.exit(status === 'PASS' ? 0 : 1);
