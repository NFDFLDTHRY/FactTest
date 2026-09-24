#!/bin/sh
# D25 public-HTTPS boundary probe: can this execution environment reach a public HTTPS origin able to host the
# generated WebApp (module scripts, wasm, a service worker)?  Observation only, never a verdict on the runtime.
# Usage: sh tests/physical/public-https-probe.sh <out dir> <bundle dir> [<pushed path of an identical bundle>] [<branch>]
#   The third argument names a directory already on the pushed branch holding a bundle with the same bundle_id (a
#   fresh build is not pushed yet when it is probed); the served bundle.json is compared with the fresh one.
#   For each candidate route the HTTP status, content-type and the headers that decide whether a module WebApp can run
#   there (x-content-type-options, content-security-policy) are recorded; a CONNECT refusal is recorded as the egress
#   policy of this environment.  The bundle's artifact hashes are written beside the record so that an external run of
#   host/harness/webapp-probe.mjs --url ... can be matched to exactly this bundle.
OUT="$1"; B="$2"; PUSHED="$3"; PBRANCH="$4"; [ -n "$OUT" ] && [ -n "$B" ] || { echo "usage: public-https-probe.sh <out dir> <bundle dir> [<pushed path>]"; exit 2; }
mkdir -p "$OUT"
BRANCH=${PBRANCH:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)}; REV=$(git rev-parse HEAD 2>/dev/null || echo unknown)
REL=$(node -e 'const p=require("path");console.log(p.relative(process.cwd(), process.argv[1]))' "$B"); [ -n "$PUSHED" ] && REL="$PUSHED"
probe() {  # $1 label, $2 url
  H=$(curl -sS -D - -o /dev/null --max-time 30 "$2" 2>"$OUT/err.tmp"); rc=$?
  E=$(cat "$OUT/err.tmp")
  node -e '
const [label, url, rc, headers, err] = process.argv.slice(1);
const lines = headers.split(/\r?\n/).filter(Boolean); const status = lines.filter(l => /^HTTP\//.test(l)).pop() || null;
const h = k => { const l = lines.find(x => x.toLowerCase().startsWith(k + ":")); return l ? l.slice(k.length + 1).trim() : null; };
const ct = h("content-type"), nosniff = h("x-content-type-options"), csp = h("content-security-policy");
const reachable = rc === "0"; const status_code = reachable && status ? Number(status.split(" ")[1]) : null;
const module_capable = reachable && status_code === 200 && !!ct && /javascript|text\/html/.test(ct) && !(csp && /sandbox|default-src \x27none\x27/.test(csp));
console.log(JSON.stringify({ route: label, url, curl_exit: Number(rc), reachable, status: status_code, content_type: ct, x_content_type_options: nosniff, content_security_policy: csp, curl_error: err.trim() || null, hosts_module_webapp: module_capable }));' "$1" "$2" "$rc" "$H" "$E"
}
{
probe "githack dev host (the owner's requested secure-context test route)" "https://raw.githack.com/NFDFLDTHRY/FactTest/$BRANCH/$REL/index.html"
probe "githack CDN host" "https://rawcdn.githack.com/NFDFLDTHRY/FactTest/$REV/$REL/index.html"
probe "GitHub Pages origin" "https://nfdfldthry.github.io/FactTest/"
probe "raw.githubusercontent (html)" "https://raw.githubusercontent.com/NFDFLDTHRY/FactTest/$BRANCH/$REL/index.html"
probe "raw.githubusercontent (module script)" "https://raw.githubusercontent.com/NFDFLDTHRY/FactTest/$BRANCH/$REL/runtime.js"
} > "$OUT/routes.jsonl"
curl -sS -o "$OUT/served-bundle.json" --max-time 30 "https://raw.githubusercontent.com/NFDFLDTHRY/FactTest/$BRANCH/$REL/bundle.json" 2>/dev/null || true
rm -f "$OUT/err.tmp"
node -e '
const fs = require("fs"); const [out, b, branch, rev, rel] = process.argv.slice(1);
const routes = fs.readFileSync(out + "/routes.jsonl", "utf8").trim().split("\n").map(l => JSON.parse(l));
const man = JSON.parse(fs.readFileSync(b + "/bundle.json", "utf8"));
const usable = routes.filter(r => r.hosts_module_webapp);
let served = null; try { served = JSON.parse(fs.readFileSync(out + "/served-bundle.json", "utf8")); } catch { served = null; }
const served_identity = served ? { bundle_id: served.bundle_id, strategy_data_sha256: served.strategy_data_sha256, equals_fresh_build: served.bundle_id === man.bundle_id } : null;
const rec = { tool: "tests/physical/public-https-probe.sh", observed: new Date().toISOString(), branch, revision: rev, bundle_path: rel,
  bundle: { bundle_id: man.bundle_id, strategy_data_sha256: man.strategy_data_sha256, artifacts: Object.fromEntries(man.artifact_roles.map(r => [r.path, r.sha256])) },
  served_bundle_json_at_pushed_path: served_identity, routes, usable_public_origin: usable.length ? usable.map(r => r.url) : null,
  boundary: usable.length ? "a public HTTPS origin able to host the module WebApp is reachable: run host/harness/webapp-probe.mjs --url against it and record the result separately" : "no reachable public HTTPS origin can host the module WebApp from this environment: CONNECT refused by the egress policy for the candidate hosts, and the reachable raw host serves text/plain with nosniff and a sandboxing CSP (module scripts are refused); the public-HTTPS claim stays [UNK] until an external run supplies evidence (tests/physical/PUBLIC-HTTPS-PROBE.md)",
  status: usable.length ? "REACHABLE" : "UNREACHABLE" };
fs.writeFileSync(out + "/public-https.json", JSON.stringify(rec, null, 1) + "\n");
console.log(rec.status + ": " + routes.map(r => `${r.route.split(" (")[0]} -> ${r.reachable ? r.status + " " + (r.content_type || "") : "CONNECT refused"}`).join("; "));' "$OUT" "$B" "$BRANCH" "$REV" "$REL"
exit 0
