// Evidence-feedback probe (D27; ASCII-LANGUAGE.md section 9 "runtime observations silently becoming source").
// Usage: node tests/closure/evidence-feedback-probe.mjs --factc BIN --source F --contracts F [--metrics F] [--machine F]
//        --tape F --system NAME --out DIR
// Question: can the observed ASCII the compiler derives from runtime evidence be handed back to the compiler as
// authored source without the compiler noticing?  The probe builds the given system, observes the given evidence tape
// against the bundle manifest, then submits (a) the observed ASCII and (b) the canonical rendering as source units in
// ANALYZE and BUILD mode and records what the compiler said.  The verdict is observation, never a repair: a language
// that cannot tell evidence from source is a [GAP] the language-evolution contract addresses, not a bug this probe
// fixes.  Generic: names no system; every input is an argument.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const a = process.argv.slice(2); const o = { root: '.' };
for (let i = 0; i < a.length; i++) o[a[i].replace(/^--/, '')] = a[++i];
const J = p => JSON.parse(readFileSync(p, 'utf8'));
mkdirSync(o.out, { recursive: true });
const run = (args, log) => { const r = spawnSync(o.factc, args, { cwd: o.root, encoding: 'utf8' }); writeFileSync(join(o.out, log), (r.stdout || '') + (r.stderr || '')); return r.status; };
const diag = dir => { const p = join(dir, 'diagnostics.json'); return existsSync(p) ? J(p) : null; };
const islands = text => (text.match(/(?<!@)@\{/g) || []).length;
const build = join(o.out, 'build');
const bargs = ['check', 'build', '--out', build, '--contracts', o.contracts]; if (o.metrics) bargs.push('--metrics', o.metrics); if (o.machine) bargs.push('--machine', o.machine); bargs.push(o.source);
const bexit = run(bargs, 'build.log');
const obs = join(o.out, 'observe');
const oexit = run(['observe', '--out', obs, '--tape', o.tape, '--system', o.system, '--source', o.source, '--bundle-manifest', join(build, 'bundle', 'bundle.json'), '--evidence-class', 'PHYSICAL_BROWSER'], 'observe.log');
const observed = join(obs, 'observed.ascii');
const rec = { tool: 'tests/closure/evidence-feedback-probe.mjs', question: 'does the compiler accept its own observed ASCII (evidence) as authored source?', build_exit: bexit, observe_exit: oexit, observed_ascii_present: existsSync(observed), feeds: [] };
const feed = (label, file) => {
  if (!existsSync(file)) { rec.feeds.push({ label, file, present: false }); return; }
  const text = readFileSync(file, 'utf8');
  const f = { label, file, islands: islands(text), system_island: (text.match(/@\{system ([A-Za-z_][A-Za-z0-9_-]*)/) || [])[1] || null };
  for (const mode of ['analyze', 'build']) { const d = join(o.out, `${label}-${mode}`); const e = run(['check', mode, '--out', d, file], `${label}-${mode}.log`); const dg = diag(d); f[mode] = { exit: e, status: dg ? dg.status : null, diagnostics: dg ? [...new Set(dg.diagnostics.map(x => x.code))].sort() : null }; }
  rec.feeds.push(f);
};
feed('observed', observed);
feed('canonical', join(build, 'canonical-ascii-0.ascii'));
const ob = rec.feeds.find(f => f.label === 'observed');
rec.verdict = {
  observed_accepted_as_source_in_analyze: !!(ob && ob.present !== false && ob.analyze && ob.analyze.status === 'OK'),
  observed_accepted_as_source_in_build: !!(ob && ob.present !== false && ob.build && ob.build.status === 'OK'),
  build_refusal_reason: ob && ob.build ? ob.build.diagnostics : null,
  meaning: null,
};
rec.verdict.meaning = rec.verdict.observed_accepted_as_source_in_analyze
  ? 'the observed ASCII parses as a valid source unit (its @{system} and @{issue} islands are Language 1 statements): nothing in the language marks it as evidence; only its content (ERR issues) may block BUILD'
  : 'the observed ASCII is refused as source';
writeFileSync(join(o.out, 'feedback.json'), JSON.stringify(rec, null, 1) + '\n');
console.log(`observed ASCII as source: analyze ${ob && ob.analyze ? ob.analyze.status : 'n/a'} (${ob && ob.islands} islands), build ${ob && ob.build ? ob.build.status + ' ' + JSON.stringify(ob.build.diagnostics) : 'n/a'}; canonical as source: analyze ${(rec.feeds[1].analyze || {}).status}`);
if (bexit !== 0 || !rec.observed_ascii_present) { console.log('FAIL harness: build or observe did not produce its artifact'); process.exit(1); }
