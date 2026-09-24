// Language manifest derivation (D27; design/foundation-closure/FOUNDATION-CLOSURE-TARGET.md section 4).
// Usage: node tests/closure/language-manifest.mjs --root DIR --out FILE [--check FILE] [--grammar ASCII-GRAMMAR.md]
// Derives, from the compiler source alone (never from prose), the machine-readable vocabulary of the language the
// current compiler implements: the statement keywords the parser accepts, every closed vocabulary table of the AST
// (predicates with arity, transfer modes, directions, visibilities, test and evidence kinds, statuses, goal
// directions, comparators, combinators), the diagnostic codes, the kernel ABI operations, the wasm export surface and
// the kernel limits.  The language version is the one the parser names in its unknown-keyword diagnostic.
// --check FILE   the committed manifest must be byte-identical to the derived one (the compiler and its manifest agree)
// --grammar F    every keyword the grammar document writes as @{keyword ...} must be a parser keyword and vice versa,
//                and the version the grammar declares (a line 'LANGUAGE VERSION <n>') must equal the parser's version.
// Exit 1 on any mismatch.  Generic: names no keyword of its own; everything is read from the sources.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const a = process.argv.slice(2); const o = { root: '.' };
for (let i = 0; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const R = p => readFileSync(join(o.root, p), 'utf8');
const parser = R('compiler/source/src/parser.rs');
const ast = R('compiler/source/src/ast.rs');
const diag = R('compiler/foundation/src/diag.rs');
const abi = R('compiler/kernel/src/abi.rs');
const wasm = R('compiler/wasm-abi/src/lib.rs');
const limits = R('compiler/foundation/src/limits.rs');

// closed vocabulary tables: (a) every AST enum with a `name()` table; (b) every nested parser arm `b"word" => Enum::Variant`
const tables = {};
for (const m of ast.matchAll(/impl (\w+) \{[\s\S]*?pub const fn name\(self\) -> &'static str \{\s*match self \{([\s\S]*?)\}\s*\}/g)) {
  const words = [...m[2].matchAll(/=> "([^"]+)"/g)].map(x => x[1]);
  if (words.length) tables[m[1]] = words.sort();
}
for (const m of parser.matchAll(/b"([a-z_]+)" => (\w+)::\w+/g)) { const t = m[2]; if (!tables[t]) tables[t] = []; if (!tables[t].includes(m[1])) tables[t].push(m[1]); }
for (const t of Object.keys(tables)) tables[t].sort();
// predicate arity: explicit arms `Pred::A | Pred::B => n`, the `_ => n` arm is the default for the rest
const arity = {}; let arityDefault = null;
const ar = ast.match(/pub const fn arity\(self\) -> u8 \{\s*match self \{([\s\S]*?)\}\s*\}/);
if (ar) { for (const m of ar[1].matchAll(/((?:Pred::\w+\s*\|?\s*)+)=> (\d+)/g)) for (const v of m[1].match(/Pred::(\w+)/g)) arity[v.replace('Pred::', '')] = Number(m[2]); const d = ar[1].match(/_ => (\d+)/); if (d) arityDefault = Number(d[1]); }
const predNames = {}; for (const m of (ast.match(/impl Pred \{[\s\S]*?pub const fn name[\s\S]*?match self \{([\s\S]*?)\}/) || [, ''])[1].matchAll(/Pred::(\w+) => "([^"]+)"/g)) predNames[m[2]] = arity[m[1]] !== undefined ? arity[m[1]] : arityDefault;
// statement keywords: the arms of the top-level statement match (the least-indented `b"word" =>` arms of the parser)
const armLines = [...parser.matchAll(/^( +)b"([a-z_]+)"((?: \| b"[a-z_]+")*) =>/gm)].map(m => ({ indent: m[1].length, words: [m[2], ...[...m[3].matchAll(/b"([a-z_]+)"/g)].map(x => x[1])] }));
const minIndent = Math.min(...armLines.map(l => l.indent));
const keywords = [...new Set(armLines.filter(l => l.indent === minIndent).flatMap(l => l.words))].sort();
const armWords = armLines.flatMap(l => l.words);
const combinators = ['all', 'any', 'not'].filter(c => armWords.includes(c));
// a nested arm that maps a statement keyword or combinator to its AST node is not a vocabulary table
for (const t of Object.keys(tables)) if (tables[t].every(w => keywords.includes(w) || combinators.includes(w))) delete tables[t];
const version = Number((parser.match(/language version (\d+)/) || [])[1]);
const diagnostics = [...diag.matchAll(/^\s+(\w+) = (\d+),/gm)].map(m => ({ name: m[1], id: Number(m[2]) })).map(d => ({ ...d, code: (diag.match(new RegExp(`DiagCode::${d.name} => "([A-Z_0-9]+)"`)) || [])[1] || null }));
const abiOps = [...abi.matchAll(/^pub fn (\w+)\(/gm)].map(m => m[1]).sort();
const wasmExports = [...wasm.matchAll(/^pub (?:unsafe )?extern "C" fn (\w+)/gm)].map(m => m[1]).sort();
const lim = Object.fromEntries([...limits.matchAll(/pub const (\w+): usize = ([^;]+);/g)].map(m => [m[1], m[2].trim()]));
const abiVersion = Number((abi.match(/ABI_VERSION: u32 = (\d+)/) || [])[1]);
const manifest = {
  schema: 'facttest-language-manifest/1',
  derived_from: ['compiler/source/src/parser.rs', 'compiler/source/src/ast.rs', 'compiler/foundation/src/diag.rs', 'compiler/foundation/src/limits.rs', 'compiler/kernel/src/abi.rs', 'compiler/wasm-abi/src/lib.rs'],
  note: 'generated by tests/closure/language-manifest.mjs from the compiler source; never edited by hand.  The vocabulary a human or a local model may use in a semantic island is exactly this; unknown keywords are PARSE_UNKNOWN_KEYWORD (ASCII-GRAMMAR.md section 22).',
  language_version: version,
  abi_version: abiVersion,
  statement_keywords: keywords,
  invariant_predicates: predNames,
  invariant_combinators: combinators,
  vocabulary_tables: tables,
  directions: ['in', 'out'].filter(w => armWords.includes(w)),
  visibilities: ['public', 'private'].filter(w => armWords.includes(w)),
  diagnostic_codes: diagnostics,
  kernel_abi_operations: abiOps,
  wasm_exports: wasmExports,
  kernel_limits: lim,
};
const text = JSON.stringify(manifest, null, 1) + '\n';
mkdirSync(dirname(o.out), { recursive: true }); writeFileSync(o.out, text);
let fail = [];
if (o.check) { const c = existsSync(join(o.root, o.check)) ? readFileSync(join(o.root, o.check), 'utf8') : null; if (c !== text) fail.push(`committed manifest ${o.check} differs from the one derived from the compiler source`); }
if (o.grammar) {
  const g = R(o.grammar);
  const gk = [...new Set([...g.matchAll(/@\{([a-z_]+)\s/g)].map(m => m[1]).filter(w => !['semantic', 'statement'].includes(w)))].sort();
  const missingInParser = gk.filter(k => !keywords.includes(k)); const missingInGrammar = keywords.filter(k => !gk.includes(k));
  if (missingInParser.length) fail.push(`grammar keywords the parser does not accept: ${missingInParser.join(' ')}`);
  if (missingInGrammar.length) fail.push(`parser keywords the grammar does not document: ${missingInGrammar.join(' ')}`);
  const gv = (g.match(/^.*LANGUAGE VERSION (\d+)\b/m) || [])[1];
  if (!gv) fail.push('the grammar declares no LANGUAGE VERSION line'); else if (Number(gv) !== version) fail.push(`grammar declares LANGUAGE VERSION ${gv}, the parser implements ${version}`);
  manifest.grammar_check = { grammar_keywords: gk.length, parser_keywords: keywords.length, grammar_version: gv ? Number(gv) : null };
  writeFileSync(o.out, JSON.stringify(manifest, null, 1) + '\n');
}
console.log(`language version ${version}: ${keywords.length} statement keywords, ${Object.keys(predNames).length} predicates, ${Object.keys(tables).length} vocabulary tables, ${diagnostics.length} diagnostic codes, ${abiOps.length} ABI operations, ${wasmExports.length} wasm exports`);
for (const f of fail) console.log('FAIL ' + f);
if (fail.length) process.exit(1);
