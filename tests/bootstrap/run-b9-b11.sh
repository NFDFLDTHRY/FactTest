#!/bin/sh
# BOOTSTRAP-TESTS B9 (wasm64 artifact), B10 (host instantiation, declared imports only), B11 (QUERY_ABI_VERSION).
# Evidence goes to $1 (directory).  Exit non-zero on any failure.  No wasm32 fallback exists in this script.
set -e
OUT="$1"; mkdir -p "$OUT"
TARGET_DIR="${CARGO_TARGET_DIR:-target}"
echo "toolchain: $(rustc +nightly --version)" > "$OUT/b9-toolchain.log"
# The kernel owns no heap; its bounded arenas need a larger wasm shadow stack than rustc's 1 MiB default.
RUSTFLAGS="${RUSTFLAGS:-} -C link-arg=-zstack-size=16777216" cargo +nightly build --release -p factc-wasm-abi -Z build-std=core --target wasm64-unknown-unknown >> "$OUT/b9-build.log" 2>&1
MODULE="$TARGET_DIR/wasm64-unknown-unknown/release/factc_wasm_abi.wasm"
cp "$MODULE" "$OUT/factc_wasm_abi.wasm"
"${FACTORY_BIN:-$TARGET_DIR/debug/factory}" wasm-inspect "$OUT/factc_wasm_abi.wasm" --out "$OUT/b9-inspect.json" > "$OUT/b9-inspect.log"
node host/harness/kernel-host.mjs "$OUT/factc_wasm_abi.wasm" "${KERNEL_HOST_SOURCE:-tests/bootstrap/b7-opaque.ascii}" --browser > "$OUT/b10-b11-chromium.json"
grep -q '"abi_version": 1' "$OUT/b10-b11-chromium.json"
grep -q '"imports": \[\]' "$OUT/b10-b11-chromium.json"
grep -q diagnostics "$OUT/b10-b11-chromium.json"
# Node is not the runtime host; record its result without treating it as admission.
node host/harness/kernel-host.mjs "$OUT/factc_wasm_abi.wasm" tests/bootstrap/b7-opaque.ascii > "$OUT/b10-node.json" 2>&1 || echo "node host cannot instantiate memory64 module (recorded, not a failure)" >> "$OUT/b10-node.json"
echo "B9-B11 PASS"
