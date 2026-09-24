// D19 lineage record for the Factory integration claims (design/materialization/D19-INTENDED-REPROVE-REOBSERVE.md).
// Usage: node tests/reprove/lineage.mjs --from COMMIT --out FILE [--root DIR]
// Walks every commit in COMMIT..HEAD.  Every Factory commit must have exactly one parent (the canonical head it was
// integrated onto: fast-forward only, never a Factory merge); every other commit must be a merge - the owner's
// pull-request merges into main that the branch continued from, listed and never counted as Factory integrations.
// Also reads the newest committed verification receipt.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
const a = process.argv.slice(2); const o = { root: '.' };
for (let i = 0; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const git = args => spawnSync('git', ['-C', o.root, ...args], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout.trim();
const rows = git(['log', '--reverse', '--format=%H|%P|%an', `${o.from}..HEAD`]).split('\n').filter(Boolean).map(l => { const [c, p, an] = l.split('|'); return { commit: c, parents: p.split(' ').filter(Boolean), author: an }; });
const bad = []; const merges = []; const nonFactory = [];
for (const r of rows) {
  const factory = /Factory/.test(r.author);
  if (factory && r.parents.length !== 1) bad.push(`${r.commit.slice(0, 9)} Factory commit with ${r.parents.length} parents`);
  if (!factory && r.parents.length > 1) merges.push({ commit: r.commit, parents: r.parents, author: r.author });
  if (!factory && r.parents.length <= 1) nonFactory.push(`${r.commit.slice(0, 9)} ${r.author}`);
}
const authors = [...new Set(rows.map(r => r.author))];
const recs = readdirSync(join(o.root, 'factory/receipts')).map(d => join(o.root, 'factory/receipts', d, 'verification.json')).filter(existsSync).map(p => ({ p, v: JSON.parse(readFileSync(p, 'utf8')) })).sort((x, y) => String(x.v.verified).localeCompare(String(y.v.verified)));
const last = recs[recs.length - 1];
const out = { tool: 'tests/reprove/lineage.mjs', from: o.from, head: git(['rev-parse', 'HEAD']), commits: rows.length, factory_commits: rows.length - merges.length, owner_merges: merges,
  first_parent_linear: bad.length === 0, violations: bad, authors, factory_authored: nonFactory.length === 0, non_factory_commits: nonFactory,
  latest_verification: last ? { path: last.p.replace(o.root.replace(/\/$/, '') + '/', ''), delta: last.v.delta_id, status: last.v.status, verified: last.v.verified, ...Object.fromEntries((last.v.checks || []).filter(c => /state_base_tree_matches_canonical_base|canonical_base_unmoved|must_not_change_tree_identical/.test(c.check || c.name)).map(c => [c.check || c.name, c.status || c.verdict])) } : null };
mkdirSync(dirname(o.out), { recursive: true }); writeFileSync(o.out, JSON.stringify(out, null, 1) + '\n');
console.log(`${rows.length} commits from ${o.from.slice(0, 9)} (${out.factory_commits} Factory, ${merges.length} owner merges): fast-forward ${out.first_parent_linear}, non-merge commits Factory-authored ${out.factory_authored}; latest verification ${last ? last.v.delta_id + ' ' + last.v.status : 'none'}`);
