// D11 evidence binding: after the S-BUILD/S-BROWSER stations produced evidence/D11/*, fill the PENDING evidence nodes of
// graph.json with the artifact identity (sha256 of the produced file) and a one-line observed_result extracted from the
// record.  Statuses: probes that executed something in a browser become RUN; identity/fetch records become OBS.
// Usage: node bind-evidence.mjs <graph.json> <repo root>   (rewrites graph.json in place; exit 1 if a file is missing)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const [graphPath, root] = process.argv.slice(2);
const g = JSON.parse(readFileSync(graphPath, 'utf8'));
const summarize = {
  'evidence/D11/host/identity.json': j => ['OBS', `stable ${j.toolchain.stable.rustc.line}; nightly ${j.toolchain.nightly.rustc.line || j.toolchain.nightly.rustc.error}; nightly cargo ${j.toolchain.nightly.cargo.line || 'absent'}; components ${j.toolchain.nightly.components.map(c => c.split('-x86_64')[0]).join('/')}; clippy ${j.toolchain.nightly.clippy.startsWith('ABSENT') ? 'ABSENT' : 'present'}; pin ${j.toolchain.repository_pin}; node ${j.host_runtime.node.node} V8 ${j.host_runtime.node.v8}; playwright ${j.host_runtime.playwright.version} chromium ${j.host_runtime.playwright.chromium[0].browserVersion} rev ${j.host_runtime.playwright.chromium[0].revision}; ${j.os.release}; ${j.os.uname}; ${j.hardware.logical_cpus} cpus; gpu node ${j.hardware.gpu_device_node}; denied hosts ${(j.network_egress.denied_hosts || []).length}`],
  'evidence/D11/browser/gpu-flags.json': j => ['RUN', `${j.cdp_browser_version.product} revision ${j.cdp_browser_version.revision} V8 ${j.cdp_browser_version.jsVersion}; secure ${j.page.isSecureContext}; crossOriginIsolated ${j.page.crossOriginIsolated}; SharedArrayBuffer ${j.page.sharedArrayBuffer_present}; gpu exposed ${j.page.gpu_exposed}; adapter ${j.page.adapter ? JSON.stringify(j.page.adapter.info) : 'null'}; maxBufferSize ${j.page.adapter ? j.page.adapter.limits.maxBufferSize : '-'}; device ${j.page.device ? (j.page.device.acquired ? 'acquired, lost after destroy: ' + j.page.device.lost_after_destroy.reason : 'not acquired') : '-'}; memory64 validates ${j.page.memory64_validates}; hardwareConcurrency ${j.page.hardwareConcurrency}`],
  'evidence/D11/browser/default.json': j => ['RUN', `${j.cdp_browser_version.product} V8 ${j.cdp_browser_version.jsVersion}; secure ${j.page.isSecureContext}; gpu exposed ${j.page.gpu_exposed}; adapter ${j.page.adapter ? JSON.stringify(j.page.adapter.info) : 'null'}; memory64 validates ${j.page.memory64_validates}`],
  'evidence/D11/authority/fetch-records.json': j => ['OBS', `published ${JSON.stringify(j.published)}; pins ${JSON.stringify(j.pins)}; tips moved ${j.tips_moved.length}; denied hosts ${j.denied_hosts.join(', ')}`],
  'evidence/D11/paths-probe.json': j => ['OBS', `${j.files_considered} files; dead wildcard surfaces: ${j.dead_wildcard_surfaces.join('; ') || 'none'}`],
  'evidence/D11/validate.json': j => ['RUN', `${j.status}: ${j.checks.length} checks over ${j.nodes} nodes / ${j.edges} edges${j.status === 'PASS' ? '' : ' - ' + j.checks.filter(c => c.status !== 'PASS').map(c => c.check).join(', ')}`],
};
let missing = 0;
for (const n of g.nodes.filter(x => x.class === 'EVIDENCE' && x.status === 'PENDING')) {
  const rel = n.artifact_identity.path, p = join(root, rel);
  if (!existsSync(p)) { console.error('missing evidence file ' + rel); missing++; continue; }
  const bytes = readFileSync(p);
  const [status, line] = summarize[rel] ? summarize[rel](JSON.parse(bytes.toString('utf8'))) : ['OBS', `${bytes.length} bytes`];
  n.artifact_identity.sha256 = createHash('sha256').update(bytes).digest('hex');
  n.artifact_identity.identity_source = 'sha256 of the produced file (bound by tests/envmap/bind-evidence.mjs)';
  n.observed_result = line; n.status = status;
  console.log(`${n.id}: ${status} ${line.slice(0, 140)}`);
}
if (missing) process.exit(1);
writeFileSync(graphPath, JSON.stringify(g, null, 1) + '\n');
console.log('graph rewritten: ' + graphPath);
