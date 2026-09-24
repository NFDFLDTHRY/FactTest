#!/bin/sh
# Factory witness runner (first used by D22; design/materialization/D22-INTENDED-FACTORY-SELF-QUALIFICATION.md).
# Builds the Factory from this tree, runs its law tests and checks the witness register against the run: every witness a
# reason names must have run and passed, every refusal text it names must exist in a refusal source, and every external
# report it names must be given and PASS.  Records the identity of the judge built here.  Generic: the register is the
# data; no reason, test or check is named in this script.
# Usage: sh tests/factory/run-witnesses.sh REGISTER TARGET_DIR OUT.json [LOG_DIR] [name=report.json ...]
set -u
REG=$1; TD=$2; OUT=$3; LOGS=${4:-$(mktemp -d)}; shift 4 2>/dev/null || shift $#
mkdir -p "$LOGS" "$(dirname "$OUT")"
TC=$(node -e 'console.log(require("./tests/toolchain/proof-sets.json").sets.HOST_NATIVE_SET.toolchain)')
export CARGO_TARGET_DIR=$TD
cargo "+$TC" build -p factory -q >"$LOGS/build.log" 2>&1 || { echo "FAIL factory build ($LOGS/build.log)"; exit 1; }
cargo "+$TC" test -p factory >"$LOGS/test.log" 2>&1; TEST_EXIT=$?
BIN="$TD/debug/factory"; SHA=$(sha256sum "$BIN" | cut -c1-64); BYTES=$(wc -c <"$BIN" | tr -d ' ')
node - "$REG" "$LOGS/test.log" "$OUT" "$TC" "$SHA" "$BYTES" "$TEST_EXIT" "$@" <<'EOJ'
const fs = require('fs');
const [reg, log, out, tc, sha, bytes, testExit, ...reports] = process.argv.slice(2);
const R = JSON.parse(fs.readFileSync(reg, 'utf8')); const text = fs.readFileSync(log, 'utf8');
const results = new Map(); for (const m of text.matchAll(/^test (\S+) \.\.\. (ok|FAILED|ignored)$/gm)) results.set(m[1], m[2]);
const rep = Object.fromEntries(reports.map(r => { const [k, p] = r.split('='); return [k, p]; }));
const sources = Object.fromEntries(R.refusal_sources.map(p => [p, fs.readFileSync(p, 'utf8')]));
const problems = [];
const witness = t => { const s = results.get(t); if (s !== 'ok') problems.push(`${t}: ${s || 'not run'}`); return s || 'not run'; };
const report = k => { const p = rep[k]; if (!p || !fs.existsSync(p)) { problems.push(`report ${k}: not given`); return 'not given'; } const j = JSON.parse(fs.readFileSync(p, 'utf8')); if (j.status !== 'PASS') problems.push(`report ${k}: ${j.status}`); return j.status; };
const reasons = R.reasons.map(x => {
  const w = Object.fromEntries(x.witnesses.map(t => [t, witness(t)]));
  const r = Object.fromEntries(x.refusal.map(c => { const where = Object.keys(sources).filter(p => sources[p].includes(c)); if (!where.length) problems.push(`${x.reason}: refusal text ${JSON.stringify(c)} in no refusal source`); return [c, where]; }));
  const row = { reason: x.reason, stage: x.stage, witnesses: w, refusal: r };
  if (x.report) row.report = { [x.report]: report(x.report) };
  if (x.repaired_by) row.repaired_by = x.repaired_by;
  row.status = Object.values(w).every(s => s === 'ok') && Object.values(r).every(v => v.length) && (!x.report || row.report[x.report] === 'PASS') ? 'REFUSED_FOR_NAMED_REASON' : 'NOT_WITNESSED';
  return row;
});
const positive = R.positive.map(x => { const w = Object.fromEntries(x.witnesses.map(t => [t, witness(t)])); const row = { path: x.path, witnesses: w }; if (x.report) row.report = { [x.report]: report(x.report) }; row.status = Object.values(w).every(s => s === 'ok') && (!x.report || row.report[x.report] === 'PASS') ? 'PASS' : 'FAIL'; return row; });
const total = [...results.values()]; const passed = total.filter(s => s === 'ok').length; const failed = total.filter(s => s === 'FAILED').length;
if (Number(testExit) !== 0) problems.push(`cargo test exit ${testExit}`);
const status = problems.length ? 'FAIL' : 'PASS';
fs.writeFileSync(out, JSON.stringify({ tool: 'tests/factory/run-witnesses.sh', register: reg, suite: R.suite, toolchain: tc, judge: { built_from: 'this tree', sha256: sha, bytes: Number(bytes) }, tests: { total: total.length, passed, failed, ignored: total.length - passed - failed }, reasons, positive, reports: rep, problems, status }, null, 1) + '\n');
console.log(`${status} witnesses: ${total.length} tests (${passed} ok, ${failed} failed); ${reasons.filter(r => r.status === 'REFUSED_FOR_NAMED_REASON').length} of ${reasons.length} reasons refused for the named reason; ${positive.filter(p => p.status === 'PASS').length} of ${positive.length} positive paths; judge ${sha.slice(0, 12)}${problems.length ? ' - ' + problems.slice(0, 6).join('; ') : ''}`);
process.exit(status === 'PASS' ? 0 : 1);
EOJ
