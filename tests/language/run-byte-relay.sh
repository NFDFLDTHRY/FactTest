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
  # M5: two conditionally verified variants, G dispatched first, EXACT_OPTIMUM under the fixture model
  grep -q '"planner_result_strength":"EXACT_OPTIMUM"' "$OUT/$E/verified-strategy.json"
  grep -q '"verified_strategy_constructed":true' "$OUT/$E/verification-certificates.json"
  grep -q '"evidence_class":"SYNTHETIC_MODEL"' "$OUT/$E/activation-receipt-model.json"
done
# P6-M01 / P6-M02 at the artifact level: E_model_0 activates the WEBGPU guard, E_model_1 the CPU_WASM64 guard
python3 - "$OUT" <<'PY'
import json, sys
out = sys.argv[1]
def active_guard(e):
    a = json.load(open(f"{out}/{e}/activation-receipt-model.json"))
    v = json.load(open(f"{out}/{e}/verified-strategy.json"))
    assert a["status"] == "PASS", (e, a["status"])
    g = [x["activation_guard"] for x in v["verified_variants"] if x["plan_id"] == a["plan_id"]][0]
    return g
assert active_guard("E_model_0") == ["WEBGPU"], "E_model_0 must select G"
assert active_guard("E_model_1") == ["CPU_WASM64"], "E_model_1 must select W"
s0 = open(f"{out}/E_model_0/verified-strategy.json").read(); s1 = open(f"{out}/E_model_1/verified-strategy.json").read()
assert s0 == s1, "reselection happens inside the same VerifiedStrategy (no re-codegen, no replan)"
print("model epochs: E_model_0 -> G, E_model_1 -> W, strategy identical")
PY
echo "byte-relay PASS"
