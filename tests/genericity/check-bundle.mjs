// D24: post-build bundle integrity against the identities the bundle's own metadata records.
// Usage: node tests/genericity/check-bundle.mjs <bundle dir> [--tamper FILE] [--out FILE]
//   integrity: every artifact_roles entry of bundle.json has the recorded sha256 and byte length, and bundle.json
//              lists every file present besides itself
//   --tamper:  copies the bundle to a temporary directory, flips one byte of FILE, and requires the copy to FAIL
// Exit 0 only when the untampered bundle verifies (and, with --tamper, the tampered copy is detected).
// Detection rests on bundle.json: a tamper that also rewrites bundle.json is outside this tool's claim (runtime
// self-integrity is not claimed; see the D24 record).
import { readFileSync, readdirSync, writeFileSync, mkdtempSync, cpSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const a = process.argv.slice(2); const pos = []; const opt = {};
for (let i = 0; i < a.length; i++) { if (a[i].startsWith('--')) opt[a[i].slice(2)] = a[++i]; else pos.push(a[i]); }
const dir = pos[0]; if (!dir) { console.error('usage: check-bundle.mjs <bundle dir> [--tamper FILE] [--out FILE]'); process.exit(2); }
const sha = b => createHash('sha256').update(b).digest('hex');
function verify(d) {
  const man = JSON.parse(readFileSync(join(d, 'bundle.json'), 'utf8'));
  const files = readdirSync(d).filter(f => f !== 'bundle.json').sort();
  const listed = man.artifact_roles.map(r => r.path).sort();
  const problems = [];
  for (const r of man.artifact_roles) {
    let b; try { b = readFileSync(join(d, r.path)); } catch { problems.push(`${r.path}: missing`); continue; }
    if (sha(b) !== r.sha256) problems.push(`${r.path}: sha256 ${sha(b)} != recorded ${r.sha256}`);
    if (b.length !== r.byte_len) problems.push(`${r.path}: ${b.length} bytes != recorded ${r.byte_len}`);
  }
  for (const f of files) if (!listed.includes(f)) problems.push(`${f}: present but not recorded in bundle.json`);
  return { bundle_id: man.bundle_id, files: files.length, recorded: listed.length, problems, status: problems.length ? 'FAIL' : 'PASS' };
}
const result = { tool: 'tests/genericity/check-bundle.mjs', bundle: dir, integrity: verify(dir) };
if (opt.tamper) {
  const t = mkdtempSync(join(tmpdir(), 'bundle-tamper-'));
  cpSync(dir, t, { recursive: true });
  const p = join(t, opt.tamper); const b = readFileSync(p); const i = Math.floor(b.length / 2); b[i] ^= 0x01; writeFileSync(p, b);
  const v = verify(t);
  result.tamper = { file: opt.tamper, byte_index: i, detected: v.status === 'FAIL' && v.problems.some(x => x.startsWith(opt.tamper + ':')), verdict: v };
}
result.status = result.integrity.status === 'PASS' && (!result.tamper || result.tamper.detected) ? 'PASS' : 'FAIL';
if (opt.out) writeFileSync(opt.out, JSON.stringify(result, null, 1) + '\n');
console.log(`${result.status} integrity ${result.integrity.status} (${result.integrity.files} files, ${result.integrity.problems.length} problems)${result.tamper ? `; tamper of ${opt.tamper} ${result.tamper.detected ? 'DETECTED' : 'NOT DETECTED'}` : ''}`);
process.exit(result.status === 'PASS' ? 0 : 1);
