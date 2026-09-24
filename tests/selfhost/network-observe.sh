#!/bin/sh
# D12 host-side network observations (environment dimension network_egress.policy; never a failure).
# Usage: network-observe.sh <out file>
OUT="$1"; mkdir -p "$(dirname "$OUT")"; : > "$OUT"
obs() { printf '%s\n' "--- $1" >> "$OUT"; shift; "$@" >> "$OUT" 2>&1; printf '[exit %s]\n' "$?" >> "$OUT"; }
O='Origin: http://127.0.0.1:47311'
obs "githack dev host (secure-context HTTPS test path requested by the owner)" curl -sS -o /dev/null -w '%{http_code}\n' --max-time 30 https://raw.githack.com/NFDFLDTHRY/FactTest/main/README.md
obs "githack CDN host" curl -sS -o /dev/null -w '%{http_code}\n' --max-time 30 https://rawcdn.githack.com/NFDFLDTHRY/FactTest/main/README.md
obs "GitHub REST API CORS (GET ref)" sh -c "curl -sS -D - -o /dev/null --max-time 30 -H '$O' https://api.github.com/repos/NFDFLDTHRY/FactTest/git/refs/heads/main | grep -iE '^HTTP|access-control-allow-origin'"
obs "GitHub smart-HTTP CORS (info/refs)" sh -c "curl -sS -D - -o /dev/null --max-time 30 -H '$O' 'https://github.com/NFDFLDTHRY/FactTest.git/info/refs?service=git-upload-pack' | grep -iE '^HTTP|access-control|content-type'"
obs "GitHub REST preflight PATCH (through the intercepting egress proxy)" sh -c "curl -sS -D - -o /dev/null --max-time 30 -X OPTIONS -H '$O' -H 'Access-Control-Request-Method: PATCH' -H 'Access-Control-Request-Headers: authorization,content-type' https://api.github.com/repos/NFDFLDTHRY/FactTest/git/refs/heads/main | grep -iE '^HTTP|access-control'"
obs "published authority host (D11 reopen)" curl -sS -o /dev/null -w '%{http_code}\n' --max-time 30 https://w3c.github.io/ServiceWorker/
cat "$OUT"
exit 0
