#!/bin/sh
# Run factc (native host driver) on the authoritative Byte Relay source in BUILD mode and keep every artifact.
# P6-A01/A03 witnesses: the source parses, canonical-renders, and the metric/objective/goal islands appear.
set -e
OUT="$1"; mkdir -p "$OUT"
"${FACTC_BIN:-target/debug/factc}" check build --out "$OUT" fixtures/commissioning/byte-relay.ascii > "$OUT/factc.log" 2>&1
grep -q '"status":"OK"' "$OUT/diagnostics.json"
grep -q '@{goal commissioning 1 minimize preference_rank}' "$OUT/canonical-ascii-0.ascii"
grep -q '@{data relay ingress.bytes -> egress.bytes mode=copy}' "$OUT/canonical-ascii-0.ascii"
grep -q '"name":"i_path","expression":"reachable(ingress, egress)","holds":true' "$OUT/typed-system-ir.json"
echo "byte-relay PASS"
