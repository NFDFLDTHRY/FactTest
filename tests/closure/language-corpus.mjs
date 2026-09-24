// Language corpus oracle (D27; the compatibility corpus of LANGUAGE N for the language-evolution contract).
// Usage: node tests/closure/language-corpus.mjs --factc BIN --corpus FILE --out DIR [--write FILE] [--check FILE]
// Runs every entry of the corpus register (tests/closure/registers/language-corpus.json: source units, mode,
// registry/metrics/machine inputs) through the given compiler and records what the compiler said: status, the
// diagnostic codes, the sha256 of the canonical rendering and, for BUILD entries, the strategy-data identity and the
// bundle certificate status.  --write FILE freezes the record as the expected table of the current language version;
// --check FILE compares the run with a frozen table: a compiler that claims compatibility with that language version
// must reproduce every row, or name the row as an intended migration.  Exit 1 on a mismatch or a harness failure.
// Generic: names no fixture; the corpus register is its data.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const a = process.argv.slice(2); const o = { root: '.' };
for (let i = 0; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const J = p => JSON.parse(readFileSync(p, 'utf8'));
const sha = b => createHash('sha256').update(b).digest('hex');
const C = J(o.corpus);
{ const ids = C.entries.map(e => e.id); const dup = ids.filter((x, i) => ids.indexOf(x) !== i); if (dup.length) { console.log('FAIL duplicate corpus ids: ' + dup.join(' ')); process.exit(1); } }
mkdirSync(o.out, { recursive: true });
const rows = [];
for (const e of C.entries) {
  const dir = join(o.out, e.id); mkdirSync(dir, { recursive: true });
  const args = ['check', e.mode, '--out', dir];
  if (e.contracts) args.push('--contracts', e.contracts); if (e.metrics) args.push('--metrics', e.metrics); if (e.machine) args.push('--machine', e.machine);
  args.push(...e.units);
  const r = spawnSync(o.factc, args, { cwd: o.root, encoding: 'utf8' });
  writeFileSync(join(dir, 'factc.log'), (r.stdout || '') + (r.stderr || ''));
  const row = { id: e.id, mode: e.mode, units: e.units, exit: r.status };
  const dp = join(dir, 'diagnostics.json');
  if (existsSync(dp)) { const d = J(dp); row.status = d.status; row.diagnostics = [...new Set(d.diagnostics.map(x => x.code))].sort(); }
  const canon = readdirSync(dir).filter(f => /^canonical-ascii-\d+\.ascii$/.test(f)).sort();
  if (canon.length) row.canonical_sha256 = canon.map(f => sha(readFileSync(join(dir, f))));
  if (existsSync(join(dir, 'typed-system-ir.json'))) row.typed_ir_sha256 = sha(readFileSync(join(dir, 'typed-system-ir.json')));
  if (e.mode === 'build') {
    const bj = join(dir, 'bundle', 'bundle.json');
    if (existsSync(bj)) { const b = J(bj); row.strategy_data_sha256 = b.strategy_data_sha256; row.bundle_files = Object.keys(b.artifacts || b.files || {}).length; }
    const bc = join(dir, 'bundle-certificate.json'); if (existsSync(bc)) row.bundle_certificate = J(bc).status;
    const vs = join(dir, 'verified-strategy.json'); if (existsSync(vs)) row.verified_strategy_sha256 = sha(readFileSync(vs));
  }
  rows.push(row);
}
const record = { schema: 'facttest-language-corpus-record/1', corpus: o.corpus, language_version: C.language_version, entries: rows.length, rows };
const frozen = { ...record, note: 'frozen expected table of LANGUAGE ' + C.language_version + ' (tests/closure/language-corpus.mjs --write); a later compiler claiming compatibility reproduces every row or records a migration' };
writeFileSync(join(o.out, 'corpus-record.json'), JSON.stringify(record, null, 1) + '\n');
if (o.write) { mkdirSync(dirname(o.write), { recursive: true }); writeFileSync(o.write, JSON.stringify(frozen, null, 1) + '\n'); }
const fail = rows.filter(r => r.exit === null || (r.status === undefined)).map(r => `${r.id}: no diagnostics (harness failure, exit ${r.exit})`);
if (o.check) {
  const F = J(o.check);
  if (F.language_version !== C.language_version) fail.push(`frozen table is LANGUAGE ${F.language_version}, corpus register is LANGUAGE ${C.language_version}`);
  const by = Object.fromEntries(F.rows.map(r => [r.id, r]));
  for (const r of rows) {
    const f = by[r.id]; if (!f) { fail.push(`${r.id}: not in the frozen table`); continue; }
    for (const k of ['status', 'diagnostics', 'canonical_sha256', 'typed_ir_sha256', 'strategy_data_sha256', 'bundle_certificate', 'verified_strategy_sha256']) if (JSON.stringify(f[k]) !== JSON.stringify(r[k])) fail.push(`${r.id}: ${k} expected ${JSON.stringify(f[k])} observed ${JSON.stringify(r[k])}`);
  }
  for (const f of F.rows) if (!rows.some(r => r.id === f.id)) fail.push(`${f.id}: in the frozen table but not in the corpus`);
}
const tally = {}; for (const r of rows) tally[r.status || 'NONE'] = (tally[r.status || 'NONE'] || 0) + 1;
console.log(`corpus LANGUAGE ${C.language_version}: ${rows.length} entries ${JSON.stringify(tally)}${o.check ? `; frozen table ${fail.length ? 'DIFFERS' : 'REPRODUCED'}` : ''}`);
for (const f of fail) console.log('FAIL ' + f);
if (fail.length) process.exit(1);
