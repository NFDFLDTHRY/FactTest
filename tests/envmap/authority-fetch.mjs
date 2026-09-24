// D11 authority fetch probe.  For every AUTHORITY node in graph.json: (1) try the published exact_url through the
// session's proxy (curl HEAD; a policy denial is EVIDENCE, never a failure), (2) resolve the pin's source repository tip
// with git ls-remote, (3) fetch the pinned {commit, path} from raw.githubusercontent.com and compare sha256 with the pin.
// Output: one record per authority.  Exit 0 = the probe ran.  Uses only curl + git + node (no dependencies).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const [graphPath, outPath] = process.argv.slice(2);
const g = JSON.parse(readFileSync(graphPath, 'utf8'));
function curlHead(url) {
  const r = spawnSync('curl', ['-sS', '-o', '/dev/null', '-I', '--max-time', '25', '-w', '%{http_code}', url], { encoding: 'utf8' });
  const code = (r.stdout || '').trim();
  if (r.status === 0 && code && code !== '000') return { status: 'HTTP', http_code: Number(code) };
  const err = (r.stderr || '').trim();
  return { status: /403|CONNECT tunnel failed/.test(err) ? 'DENIED' : 'UNREACHABLE', detail: err.slice(0, 160) };
}
function lsRemote(repo, branch) {
  const ref = branch ? 'refs/heads/' + branch : 'HEAD';
  const r = spawnSync('git', ['ls-remote', repo + '.git', ref], { encoding: 'utf8', timeout: 120000 });
  if (r.status !== 0) return { status: 'UNREACHABLE', ref, detail: (r.stderr || '').trim().slice(0, 160) };
  const head = (r.stdout.split('\t')[0] || '').trim();
  return head ? { status: 'OK', ref, head } : { status: 'REF_ABSENT', ref };
}
function rawFetch(repoUrl, commit, path) {
  const m = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)$/);
  if (!m) return { status: 'NOT_GITHUB' };
  const url = `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${commit}/${path}`;
  const r = spawnSync('curl', ['-sS', '--max-time', '120', '-w', '\n%{http_code}', url], { encoding: 'buffer', maxBuffer: 64 << 20 });
  const buf = r.stdout || Buffer.alloc(0);
  const nl = buf.lastIndexOf(0x0a);
  const code = buf.slice(nl + 1).toString().trim();
  const body = buf.slice(0, nl);
  if (code !== '200') return { status: 'HTTP_' + (code || '000'), url };
  return { status: 'OK', url, bytes: body.length, sha256: createHash('sha256').update(body).digest('hex') };
}
const records = [];
const tipCache = new Map();
for (const a of g.nodes.filter(n => n.class === 'AUTHORITY').sort((x, y) => x.id.localeCompare(y.id))) {
  const rec = { authority: a.id, exact_url: a.exact_url, published: null, pin: a.reproducibility_pin, source_tip: null, pinned_fetch: null, pin_verdict: null };
  if (/^https?:\/\//.test(a.exact_url)) rec.published = curlHead(a.exact_url); else rec.published = { status: 'NOT_A_NETWORK_URL' };
  const p = a.reproducibility_pin;
  if (p && /^https:\/\/github\.com\//.test(p.repo)) {
    const key = p.repo + '#' + (p.branch || '');
    if (!tipCache.has(key)) tipCache.set(key, lsRemote(p.repo, p.branch));
    rec.source_tip = tipCache.get(key);
    if (p.commit && p.path) {
      rec.pinned_fetch = rawFetch(p.repo, p.commit, p.path);
      if (rec.pinned_fetch.status === 'OK') rec.pin_verdict = p.sha256 ? (rec.pinned_fetch.sha256 === p.sha256 ? 'PIN_MATCH' : 'PIN_MISMATCH [ERR]') : 'PIN_HAS_NO_SHA (recorded now)';
      else rec.pin_verdict = 'PIN_UNFETCHED';
      if (rec.source_tip.status === 'OK') rec.tip_vs_pin = rec.source_tip.head === p.commit ? 'tip == pin' : 'tip moved since assembly (record only)';
    }
  } else rec.pin_verdict = 'NO_GITHUB_PIN';
  records.push(rec);
  console.log(`${a.id}: published ${rec.published.status}${rec.published.http_code ? ' ' + rec.published.http_code : ''}; pin ${rec.pin_verdict || '-'}${rec.tip_vs_pin ? '; ' + rec.tip_vs_pin : ''}`);
}
const summary = {
  tool: 'tests/envmap/authority-fetch.mjs', observed: new Date().toISOString(), graph: graphPath,
  published: Object.fromEntries(['HTTP', 'DENIED', 'UNREACHABLE', 'NOT_A_NETWORK_URL'].map(s => [s, records.filter(r => r.published.status === s).length])),
  pins: Object.fromEntries(['PIN_MATCH', 'PIN_MISMATCH [ERR]', 'PIN_HAS_NO_SHA (recorded now)', 'PIN_UNFETCHED', 'NO_GITHUB_PIN'].map(s => [s, records.filter(r => r.pin_verdict === s).length])),
  tips_moved: records.filter(r => r.tip_vs_pin && r.tip_vs_pin.startsWith('tip moved')).map(r => r.authority),
  denied_hosts: [...new Set(records.filter(r => r.published.status === 'DENIED').map(r => new URL(r.exact_url).host))].sort(),
  records,
};
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(summary, null, 2) + '\n');
console.log(`published: ${JSON.stringify(summary.published)}; pins: ${JSON.stringify(summary.pins)}; tips moved: ${summary.tips_moved.length}`);
