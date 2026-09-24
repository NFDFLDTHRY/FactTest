// D17 section-level identity of WebAssembly binaries (design/materialization/D17-INTENDED-IMPLEMENTATION-REALITY.md
// section 4).  Usage: node tests/implementation/wasm-sections.mjs --label A=<file> --label B=<file> [--exclude-custom name]
//        --out FILE
// Parses each module's section list (id, custom-section name, size, sha256) and reports, section by section, whether
// the builds agree, plus one identity per build over every section except the excluded custom sections.  It explains
// WHERE two builds differ; it never decides which build is correct.  First-party node ESM, no dependencies.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const a = process.argv.slice(2); const labels = []; const exclude = []; let out = null;
for (let i = 0; i < a.length; i++) {
  if (a[i] === '--label') { const [k, ...v] = a[++i].split('='); labels.push([k, v.join('=')]); }
  else if (a[i] === '--exclude-custom') exclude.push(a[++i]);
  else if (a[i] === '--out') out = a[++i];
}
const sha = b => createHash('sha256').update(b).digest('hex');
function leb(b, i) { let r = 0n, s = 0n; for (;;) { const x = b[i++]; r |= BigInt(x & 0x7f) << s; s += 7n; if (x < 0x80) return [Number(r), i]; } }
function sections(b) {
  if (b.readUInt32LE(0) !== 0x6d736100) throw new Error('not a wasm module');
  const res = []; let i = 8;
  while (i < b.length) {
    const id = b[i++]; const [n, j] = leb(b, i); const body = b.subarray(j, j + n); let name = null;
    if (id === 0) { const [l, k] = leb(body, 0); name = body.subarray(k, k + l).toString('utf8'); }
    res.push({ id, name, bytes: n, sha256: sha(body), body }); i = j + n;
  }
  return res;
}
const builds = labels.map(([label, file]) => { const b = readFileSync(file); const s = sections(b); return { label, file, bytes: b.length, sha256: sha(b), sections: s,
  identity_excluding: sha(Buffer.concat(s.filter(x => !(x.id === 0 && exclude.includes(x.name))).map(x => Buffer.concat([Buffer.from([x.id]), x.body])))) }; });
const key = x => x.id === 0 ? `custom:${x.name}` : `id:${x.id}`;
const keys = [...new Set(builds.flatMap(b => b.sections.map(key)))];
const comparison = keys.map(k => { const per = builds.map(b => b.sections.find(x => key(x) === k)); return { section: k, bytes: per.map(x => x ? x.bytes : null), identical: per.every(x => x && x.sha256 === per[0].sha256) }; });
const result = { tool: 'tests/implementation/wasm-sections.mjs', excluded_custom_sections: exclude,
  builds: builds.map(b => ({ label: b.label, file: b.file, bytes: b.bytes, sha256: b.sha256, identity_excluding_custom: b.identity_excluding, sections: b.sections.map(x => ({ section: key(x), bytes: x.bytes, sha256: x.sha256 })) })),
  comparison, whole_file_identical: builds.every(b => b.sha256 === builds[0].sha256),
  differing_sections: comparison.filter(c => !c.identical).map(c => c.section),
  identical_excluding_custom: builds.every(b => b.identity_excluding === builds[0].identity_excluding) };
if (out) writeFileSync(out, JSON.stringify(result, null, 1) + '\n');
console.log(JSON.stringify({ whole_file_identical: result.whole_file_identical, differing_sections: result.differing_sections, identical_excluding_custom: result.identical_excluding_custom, builds: result.builds.map(b => `${b.label} ${b.sha256.slice(0, 16)} excl ${b.identity_excluding_custom.slice(0, 16)}`) }));
