// D16 capability exposure census (design/materialization/D16-INTENDED-CAPABILITY-UNIVERSE.md section 4).
// Usage: node tests/capability/census.mjs <universe.json> <out dir>
// For every family in the universe manifest that declares a `census` block, evaluates (in one Chromium page served on
// http://127.0.0.1, a potentially trustworthy origin) its exposure expression, its NON-PROMPTING discovery expression
// (5 s timeout each), navigator.permissions.query for its permission names, and the implementation's policy query for its
// policy-controlled features.  Nothing here requests a device, a stream, a position or a session, and nothing here admits
// a capability: an exposed interface is recorded as exposure only ([OBS]); an absent one as absence in THIS environment.
// Generic: names no family; every expression comes from the manifest.  Output: <out>/{identity.json, records/<id>.json,
// summary.json}.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'node:http';

const [universePath, outDir] = process.argv.slice(2);
const U = JSON.parse(readFileSync(universePath, 'utf8'));
const families = U.families.filter(f => f.census);
const launch = { headless: true };
const { chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs');
const server = createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<!doctype html><title>capability census</title>'); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`;
mkdirSync(join(outDir, 'records'), { recursive: true });
const identity = { tool: 'tests/capability/census.mjs', observed: new Date().toISOString(), environment_class: 'PHYSICAL_BROWSER', launch, origin: 'http://127.0.0.1:<port>/' };
const browser = await chromium.launch(launch);
const summary = { tool: identity.tool, universe: universePath, families: 0, exposed: 0, absent: 0, undetermined: 0, by_family: {} };
try {
  identity.playwright_browser_version = browser.version();
  const page = await browser.newPage();
  const cdp = await page.context().newCDPSession(page);
  identity.cdp_browser_version = await cdp.send('Browser.getVersion');
  await page.goto(url);
  identity.page = await page.evaluate(() => ({ userAgent: navigator.userAgent, isSecureContext, crossOriginIsolated: self.crossOriginIsolated, visibilityState: document.visibilityState, hasFocus: document.hasFocus(),
    policy_api: document.permissionsPolicy ? 'document.permissionsPolicy' : document.featurePolicy ? 'document.featurePolicy (implementation-specific)' : null }));
  for (const f of families) {
    const c = f.census;
    const rec = await page.evaluate(async ({ c }) => {
      const out = { exposure_expr: c.exposure, discovery_expr: c.discovery || null };
      const timed = p => Promise.race([Promise.resolve(p), new Promise(r => setTimeout(() => r({ timeout: '5000 ms' }), 5000))]);
      const safe = async fn => { try { return await timed(fn()); } catch (e) { return { error: e && e.name ? e.name : String(e), message: e && e.message ? String(e.message).slice(0, 200) : null }; } };
      out.exposed = c.exposure ? await safe(() => (0, eval)(c.exposure)) : null;
      if (c.discovery && (out.exposed === true || c.exposure === null)) out.discovery = await safe(() => (0, eval)(c.discovery));
      out.permissions = {};
      for (const name of c.permissions || []) out.permissions[name] = await safe(() => navigator.permissions.query({ name }).then(s => s.state));
      out.policy = {};
      const pol = document.permissionsPolicy || document.featurePolicy;
      for (const name of c.policy || []) out.policy[name] = pol ? await safe(() => pol.allowsFeature(name)) : 'no policy query API';
      return out;
    }, { c });
    const exposed = rec.exposed === true ? 'EXPOSED' : rec.exposed === false ? 'ABSENT' : 'UNDETERMINED';
    const r = { family: f.id, matrix_row: f.matrix_row, observed: new Date().toISOString(), environment: 'ENV-D16-BROWSER', state: exposed, ...rec };
    writeFileSync(join(outDir, 'records', f.id + '.json'), JSON.stringify(r, null, 1) + '\n');
    summary.families++; summary[exposed === 'EXPOSED' ? 'exposed' : exposed === 'ABSENT' ? 'absent' : 'undetermined']++;
    summary.by_family[f.id] = exposed;
    console.log(`${exposed.padEnd(13)} ${f.id}${rec.discovery ? ' ' + JSON.stringify(rec.discovery).slice(0, 110) : ''}`);
  }
} finally { await browser.close(); server.close(); }
identity.observed_end = new Date().toISOString();
writeFileSync(join(outDir, 'identity.json'), JSON.stringify(identity, null, 1) + '\n');
writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 1) + '\n');
console.log(JSON.stringify({ families: summary.families, exposed: summary.exposed, absent: summary.absent, undetermined: summary.undetermined }));
