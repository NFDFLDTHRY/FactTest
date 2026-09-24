// Reopen gate (D14 onward): every reopen record that shows movement must be classified by the epoch review file,
// and every pin must still verify.  A record the review did not anticipate is a return to ASCII, never a pass.
// Usage: node tests/reference/gate.mjs <reopen dir> <review.json> [--expect N]
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const [dir, reviewPath, , expect] = process.argv.slice(2);
const review = JSON.parse(readFileSync(reviewPath, 'utf8'));
const recs = readdirSync(join(dir, 'records')).sort().map(f => JSON.parse(readFileSync(join(dir, 'records', f), 'utf8')));
const problems = [];
if (expect && recs.length !== Number(expect)) problems.push(`records ${recs.length} != expected ${expect}`);
for (const r of recs) {
  const decided = !!review.decisions[r.authority];
  const moved = [];
  if (r.clause && /^(CHANGED|NOT_FOUND|NO_CLAUSE_KEY|MOVED)/.test(r.clause.status)) moved.push('clause ' + r.clause.status);
  if (r.fragment && r.fragment.at_tip.status === 'ABSENT') moved.push('fragment absent');
  if (/FILE CHANGED|absent, default ref|LOCAL FILE CHANGED|no pinned sha/.test(r.tip_relation || '')) moved.push(r.tip_relation);
  if (r.maturity && r.maturity.drift && r.maturity.drift !== 'NONE') moved.push('declared status changed');
  if (moved.length && !decided) problems.push(`${r.authority}: unclassified movement (${moved.join('; ')})`);
  if (r.pin_check && /MISMATCH|UNFETCHED/.test(r.pin_check)) problems.push(`${r.authority}: ${r.pin_check}`);
}
for (const id of Object.keys(review.decisions)) if (!recs.some(r => r.authority === id)) problems.push(`review decides ${id}, which has no record`);
console.log(problems.length ? 'GATE FAIL\n' + problems.join('\n') : `GATE PASS: ${recs.length} records; every movement classified by ${reviewPath}; every pin verified`);
process.exit(problems.length ? 1 : 0);
