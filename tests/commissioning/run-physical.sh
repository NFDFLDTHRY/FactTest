#!/bin/sh
# Physical commissioning run (COMMISSIONING-RUNTIME.md, COMMISSIONING-FIXTURE.md "Future physical fixture").
#   1. compile the authoritative Byte Relay source with the commissioning registry (BUILD) -> bundle + certificates
#   2. BROWSER_PROBE: Chromium (WebGPU via SwiftShader Vulkan) drives the generated app: E0 admissions, payloads A+B
#      through the selected GPU variant, GPUDevice.destroy(), E1 reselection, payloads A+B again; exact compares
#      happen on the harness side; bundle hashes are checked before/after; no compiler runs in between
#   3. BROWSER_PROBE negative witness 5: Chromium without WebGPU -> W selected at E0, no fake GPU evidence
#   4. factc observe: evidence tape -> ObservationDelta + observed ASCII; authored source identity compared with
#      the bundle lineage (P6-R08)
# Evidence goes under "$1".  Exit non-zero on any failure.  Synthetic model epochs are never used here.
set -e
OUT="$1"; mkdir -p "$OUT"
FACTC="${FACTC_BIN:-target/debug/factc}"
SRC=fixtures/commissioning/byte-relay.ascii
cp "$SRC" "$OUT/authored-source-before.ascii"
"$FACTC" check build --out "$OUT/compile" --contracts fixtures/commissioning/contracts.ascii --metrics fixtures/commissioning/metrics.ascii "$SRC" > "$OUT/compile.log" 2>&1
grep -q '"status":"OK"' "$OUT/compile/diagnostics.json"
grep -q '"status":"PASS"' "$OUT/compile/bundle-certificate.json"
# the expectations are this specimen's (registry: WEBGPU preferred, CPU_WASM64 fallback), passed to the generic harness
node host/harness/bundle-probe.mjs "$OUT/compile/bundle" fixtures/commissioning/payloads.json "$OUT/probe-webgpu" --loss WEBGPU --expect-e0 WEBGPU --expect-e1 CPU_WASM64 > "$OUT/probe-webgpu.log" 2>&1
node host/harness/bundle-probe.mjs "$OUT/compile/bundle" fixtures/commissioning/payloads.json "$OUT/probe-no-webgpu" --no-webgpu --loss none --expect-e0 CPU_WASM64 > "$OUT/probe-no-webgpu.log" 2>&1
"$FACTC" observe --out "$OUT/observed" --tape "$OUT/probe-webgpu/evidence-tape.ascii" --system byte_relay --source "$SRC" --bundle-manifest "$OUT/compile/bundle/bundle.json" --evidence-class PHYSICAL_BROWSER > "$OUT/observe.log" 2>&1
"$FACTC" observe --out "$OUT/observed-no-webgpu" --tape "$OUT/probe-no-webgpu/evidence-tape.ascii" --system byte_relay --source "$SRC" --bundle-manifest "$OUT/compile/bundle/bundle.json" --evidence-class PHYSICAL_BROWSER > "$OUT/observe-no-webgpu.log" 2>&1
cmp "$SRC" "$OUT/authored-source-before.ascii"
grep -q 'source_of_record OBS "authored source unchanged' "$OUT/observed/observed.ascii"
grep -q 'transition_E0_E1 OBS' "$OUT/observed/observed.ascii"
grep -q '"source_unchanged":true' "$OUT/observed/observation-delta.json"
echo "physical commissioning PASS"
