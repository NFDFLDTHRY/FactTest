// D13 status-integrity inventory (design/materialization/D13-INTENDED-REPO-HYGIENE.md sections 2.10 and 6).
// First-party node ESM.  This is an INVENTORY, not a proof: it finds every status-marker occurrence in the tracked
// tree and assigns it the class declared for its zone in status-classification.json (first matching rule wins):
//   A  internal chain defect pattern (defect_patterns; bounded by max/min)   B  historical record
//   C  capability gap reported by live code                                    D  authority uncertainty
//   R  live register: the occurrence is a boundary row whose A/B/C/D class is stated in the register itself
//      (docs/HANDOFF.md section 6, design/environment-map/ node classes, the D13 records)
//   N  not a status claim: the word is vocabulary, data or code semantics (cache "stale", envmap PENDING, a rule text)
// Exit 1 when an occurrence matches no rule or a defect pattern is outside its bound; exit 0 otherwise.
// Usage: node tests/hygiene/status-scan.mjs --rules tests/hygiene/status-classification.json --out DIR
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const a = process.argv.slice(2); const opt = {};
for (let i = 0; i < a.length; i += 2) opt[a[i].replace(/^--/, '')] = a[i + 1];
const rules = JSON.parse(readFileSync(opt.rules, 'utf8'));
const MARKERS = rules.markers.map(m => ({ name: m.name, re: new RegExp(m.regex, m.flags || 'g') }));
const ls = spawnSync('git', ['ls-files', '-co', '--exclude-standard'], { encoding: 'utf8', maxBuffer: 1 << 28 });
if (ls.status !== 0) { console.error('git ls-files failed: ' + ls.stderr); process.exit(2); }
const files = [...new Set(ls.stdout.split('\n').filter(Boolean))].sort();
const matchPath = (m, p) => (m.exact || []).includes(p) || (m.prefix || []).some(x => p.startsWith(x)) || (m.regex ? new RegExp(m.regex).test(p) : false);

const occurrences = []; const unclassified = []; const texts = new Map();
for (const f of files) {
  let buf; try { buf = readFileSync(f); } catch { continue; }
  if (buf.subarray(0, 8192).includes(0)) continue;
  const text = buf.toString('utf8'); texts.set(f, text);
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const m of MARKERS) {
      m.re.lastIndex = 0;
      if (!m.re.test(line)) continue;
      const rule = rules.zones.find(z => matchPath(z.match, f) && (!z.markers || z.markers.includes(m.name)) && (!z.line || new RegExp(z.line).test(line)));
      const occ = { path: f, line: i + 1, marker: m.name, rule: rule ? rule.id : null, class: rule ? rule.class : null };
      occurrences.push(occ); if (!rule) unclassified.push({ ...occ, text: line.trim().slice(0, 160) });
    }
  });
}
const defects = rules.defect_patterns.map(d => {
  const re = new RegExp(d.regex, 'm'); const hits = [];
  for (const [f, text] of texts) if (matchPath(d.match, f)) text.split('\n').forEach((l, i) => { if (re.test(l)) hits.push(`${f}:${i + 1}`); });
  const ok = hits.length <= (d.max ?? Infinity) && hits.length >= (d.min ?? 0);
  return { id: d.id, class: 'A', meaning: d.meaning, bound: { min: d.min ?? 0, max: d.max ?? null }, hits, status: ok ? 'PASS' : 'FAIL' };
});
const tally = (key) => { const t = {}; for (const o of occurrences) { const k = key(o); t[k] = (t[k] || 0) + 1; } return Object.fromEntries(Object.entries(t).sort()); };
const byRule = {}; for (const o of occurrences) if (o.rule) byRule[o.rule] = (byRule[o.rule] || 0) + 1;
const status = !unclassified.length && defects.every(d => d.status === 'PASS') ? 'PASS' : 'FAIL';
const res = { tool: 'tests/hygiene/status-scan.mjs', note: 'inventory, not proof', files_scanned: texts.size, occurrences_total: occurrences.length,
  by_class: tally(o => o.class || 'UNCLASSIFIED'), by_marker: tally(o => o.marker),
  by_rule: Object.fromEntries(Object.entries(byRule).sort()).valueOf(), rules: rules.zones.map(z => ({ id: z.id, class: z.class, rationale: z.rationale, count: byRule[z.id] || 0 })),
  defect_patterns: defects, unclassified, status, occurrences };
mkdirSync(opt.out, { recursive: true });
writeFileSync(join(opt.out, 'inventory.json'), JSON.stringify(res, null, 1) + '\n');
const L = [`STATUS INVENTORY ${status}: ${occurrences.length} occurrences in ${texts.size} files; unclassified ${unclassified.length}`, '',
  'by class: ' + JSON.stringify(res.by_class), 'by marker: ' + JSON.stringify(res.by_marker), '', 'zones (first matching rule wins):',
  ...res.rules.map(r => `  ${r.class}  ${r.id.padEnd(34)} ${String(r.count).padStart(5)}  ${r.rationale}`), '', 'defect patterns (class A, must stay within bound):',
  ...defects.map(d => `  ${d.status} ${d.id} hits ${d.hits.length} bound [${d.bound.min}, ${d.bound.max ?? 'inf'}] ${d.meaning}${d.hits.length ? ' @ ' + d.hits.join(', ') : ''}`),
  ...(unclassified.length ? ['', 'UNCLASSIFIED:', ...unclassified.map(u => `  ${u.path}:${u.line} ${u.marker} ${u.text}`)] : [])];
writeFileSync(join(opt.out, 'summary.txt'), L.join('\n') + '\n');
console.log(L.slice(0, 4).join('\n'));
process.exit(status === 'PASS' ? 0 : 1);
