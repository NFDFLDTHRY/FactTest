#!/bin/sh
# Run factc (native host driver) on the authoritative Byte Relay source in BUILD mode with the commissioning
# contract registry, metric evidence and each synthetic model epoch; keep every artifact.
# Witnesses: P6-A01/A03 (parse + canonical), P5-L01 (W and G in H_G), P5-L03 (H_A filters by epoch).
set -e
OUT="$1"; mkdir -p "$OUT"
FACTC="${FACTC_BIN:-target/debug/factc}"
SRC=fixtures/commissioning/byte-relay.ascii
REG=fixtures/commissioning/contracts.ascii
MET=fixtures/commissioning/metrics.ascii
"$FACTC" check build --out "$OUT" $SRC > "$OUT/factc.log" 2>&1
grep -q '"status":"OK"' "$OUT/diagnostics.json"
grep -q '@{goal commissioning 1 minimize preference_rank}' "$OUT/canonical-ascii-0.ascii"
grep -q '@{data relay ingress.bytes -> egress.bytes mode=copy}' "$OUT/canonical-ascii-0.ascii"
grep -q '"name":"i_path","expression":"reachable(ingress, egress)","holds":true' "$OUT/typed-system-ir.json"
for E in E_model_0 E_model_1; do
  mkdir -p "$OUT/$E"
  "$FACTC" check build --out "$OUT/$E" --contracts $REG --metrics $MET --machine fixtures/commissioning/epoch-model-${E#E_model_}.ascii $SRC > "$OUT/$E/factc.log" 2>&1
  grep -q '"status":"OK"' "$OUT/$E/diagnostics.json"
  grep -q '"conversion":"host_to_wasm"' "$OUT/$E/implementation-hypergraph.json"
  grep -q '"conversion":"host_to_gpu"' "$OUT/$E/implementation-hypergraph.json"
  grep -q '"unsatisfied_requirements":\[\]' "$OUT/$E/implementation-hypergraph.json"
done
echo "byte-relay PASS"
