#!/bin/sh
# D11 map machinery run (S-BUILD): validate the graph, answer every structural question, list stale relations,
# re-render the register/traceability and compare with the committed files, probe station surfaces, fetch/verify the
# authority pins, and record this host's identity.  Exit non-zero only when the graph is malformed or a rendered file
# drifted from its source (a denied host, a moved tip or an absent component are evidence, not failures).
# Usage: run-envmap.sh <evidence dir> [--no-fetch]
set -e
OUT="$1"; NOFETCH="$2"; G=design/environment-map/graph.json; D=design/environment-map; E=tests/envmap/envmap.mjs
mkdir -p "$OUT"
node "$E" validate "$G" --out "$OUT/validate.json"
node "$E" render-check "$G" --dir "$D" --out "$OUT/render-check.json"
node "$E" query "$G" --all --out "$OUT/queries"
node "$E" stale "$G" --out "$OUT/stale.json"
node "$E" paths-probe . --out "$OUT/paths-probe.json"
sh tests/envmap/host-identity.sh "$OUT/host/identity.json"
if [ "$NOFETCH" != "--no-fetch" ]; then node tests/envmap/authority-fetch.mjs "$G" "$OUT/authority/fetch-records.json"; fi
echo "envmap run complete -> $OUT"
