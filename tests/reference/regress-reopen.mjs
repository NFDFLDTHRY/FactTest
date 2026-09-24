// Regression witness for the reopen probe (D15 refactor into lib.mjs): re-run records must equal the committed
// reference records field by field, except fields listed with --allow (prefix match on flattened keys).
// Usage: node tests/reference/regress-reopen.mjs <new records dir> <reference records dir> --allow .source_tip.commit,...
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const [a, b, , allowArg] = process.argv.slice(2);
const allow = (allowArg || '').split(',').filter(Boolean);
const flat = (d, p = '', out = {}) => { if (d && typeof d === 'object') { for (const [k, v] of Object.entries(d)) flat(v, Array.isArray(d) ? `${p}[${k}]` : `${p}.${k}`, out); } else out[p] = d; return out; };
const files = readdirSync(b).sort(); const diffs = {}; let missing = 0;
for (const f of files) {
  let x; try { x = flat(JSON.parse(readFileSync(join(a, f), 'utf8'))); } catch { missing++; continue; }
  const y = flat(JSON.parse(readFileSync(join(b, f), 'utf8')));
  for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) if (x[k] !== y[k]) (diffs[k] = diffs[k] || []).push(f);
}
const disallowed = Object.keys(diffs).filter(k => !allow.some(p => k.startsWith(p)));
console.log(JSON.stringify({ records: files.length, missing, differing_fields: Object.fromEntries(Object.entries(diffs).map(([k, v]) => [k, v.length])), disallowed }));
process.exit(missing || disallowed.length ? 1 : 0);
