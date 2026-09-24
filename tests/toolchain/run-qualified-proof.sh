#!/bin/sh
# D13 qualified proof matrix (design/materialization/D13-INTENDED-REPO-HYGIENE.md sections 3.2-3.3).
# Usage: sh tests/toolchain/run-qualified-proof.sh <evidence dir>
# Same obligations as the D9 matrix (tests/toolchain/run-proof-matrix.sh, kept for history), but every obligation
# names its proof set (tests/toolchain/proof-sets.json) and every cargo call runs on that set's PINNED toolchain:
#   HOST_NATIVE_SET    1.94.1               host, dev + release, bare cargo == default-members
#   WASM64_KERNEL_SET  nightly-2026-09-24   wasm64-unknown-unknown, -Z build-std=core, dev + release
#   ALL_SOURCES / ALL_MEMBERS_GRAPH (fmt / cargo metadata), CROSS_SET (diagnostic, weight NONE),
#   HEURISTIC (legacy scanners, weight NONE).
# Verdicts are evidence about the system under test; this script exits non-zero only when the harness malfunctions
# or the mutants show the judge is not qualified.
set -e
OUT="$1"; [ -n "$OUT" ] || { echo "usage: $0 <evidence dir>"; exit 2; }
mkdir -p "$OUT"
ROOT="$(pwd)"
SETS=tests/toolchain/proof-sets.json
HOST_TC=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1])).sets.HOST_NATIVE_SET.toolchain)' $SETS)
WASM_TC=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1])).sets.WASM64_KERNEL_SET.toolchain)' $SETS)
export PROOF_CHAN_MAP="default=$HOST_TC,stable=$HOST_TC,nightly=$WASM_TC"
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-$ROOT/target}"
FACTORY="${FACTORY_BIN:-$CARGO_TARGET_DIR/debug/factory}"
P="node tests/toolchain/proof.mjs"
S="--sets $SETS"
COMPILER_CRATES="factc-foundation,factc-source,factc-semantic,factc-capability,factc-implementation,factc-planning,factc-verifier,factc-codegen,factc-bundle,factc-observe,factc-kernel"
NOSTD_DIRS="compiler/foundation,compiler/source,compiler/semantic,compiler/capability,compiler/implementation,compiler/planning,compiler/verifier,compiler/codegen,compiler/bundle,compiler/observe,compiler/kernel,compiler/wasm-abi"
DEPCHECK_LIST="factory/Cargo.toml,compiler/foundation/Cargo.toml,compiler/source/Cargo.toml,compiler/semantic/Cargo.toml,compiler/capability/Cargo.toml,compiler/implementation/Cargo.toml,compiler/planning/Cargo.toml,compiler/verifier/Cargo.toml,compiler/codegen/Cargo.toml,compiler/bundle/Cargo.toml,compiler/observe/Cargo.toml,compiler/kernel/Cargo.toml,compiler/wasm-abi/Cargo.toml,host/factc/Cargo.toml"
WASMFLAGS="RUSTFLAGS=-C link-arg=-zstack-size=16777216"

echo "== T13 pins and sets ($PROOF_CHAN_MAP)"
$P pins --out "$OUT/pins" --id T13-PIN-01-toolchain-pins --root . $S
$P toolchain --out "$OUT/toolchain" --root .
$P sets-check --out "$OUT/sets" --id T13-SETS-01-roots-partition --root . $S

echo "== HOST_NATIVE_SET ($HOST_TC)"
H="--set HOST_NATIVE_SET $S --chan stable --root ."
$P cargo --out "$OUT/host" --id Q-HOST-01-build-dev $H -- build
$P cargo --out "$OUT/host" --id Q-HOST-02-build-release $H -- build --release
$P cargo --out "$OUT/host" --id Q-HOST-03-test-dev $H -- test
$P cargo --out "$OUT/host" --id Q-HOST-04-test-release $H -- test --release
$P cargo --out "$OUT/host" --id Q-HOST-05-clippy-all-targets --class T9-P3 --invariant "static lint clean over HOST_NATIVE_SET" $H -- clippy --all-targets -- -D warnings
$P compile-fail --out "$OUT/host" --id Q-HOST-06-std-in-kernel --set HOST_NATIVE_SET $S --chan stable --root . --fixture fixtures/compiler/negative/std-in-kernel --expect fixtures/toolchain/expect/std-in-kernel.json
$P compile-fail --out "$OUT/host" --id Q-HOST-07-id-substitution --set HOST_NATIVE_SET $S --chan stable --root . --fixture fixtures/compiler/negative/id-substitution --expect fixtures/toolchain/expect/id-substitution.json
$P compile-fail --out "$OUT/host" --id Q-HOST-08-forge-verified-strategy --set HOST_NATIVE_SET $S --chan stable --root . --fixture fixtures/compiler/negative/forge-verified-strategy --expect fixtures/toolchain/expect/forge-verified-strategy.json

echo "== ALL_SOURCES / ALL_MEMBERS_GRAPH ($HOST_TC)"
$P cargo --out "$OUT/all" --id Q-ALL-01-fmt-check --class T9-P3 --invariant "rustfmt clean over every member (file list is the scope)" --set ALL_SOURCES $S --chan stable --root . -- fmt --all --check -v
$P deps --out "$OUT/all" --id Q-ALL-02-resolved-graph-first-party --set ALL_MEMBERS_GRAPH --chan stable --root . --locked
rm -rf "$CARGO_TARGET_DIR/d13-scratch/third-party-dep"; mkdir -p "$CARGO_TARGET_DIR/d13-scratch"
cp -r fixtures/compiler/negative/third-party-dep "$CARGO_TARGET_DIR/d13-scratch/third-party-dep"
$P deps --out "$OUT/all" --id Q-ALL-03-third-party-dep-fixture-rejected --set ALL_MEMBERS_GRAPH --chan stable --root "$CARGO_TARGET_DIR/d13-scratch/third-party-dep" --expect-fail

echo "== WASM64_KERNEL_SET ($WASM_TC)"
W="--set WASM64_KERNEL_SET $S --root ."
$P cargo --out "$OUT/wasm64" --id Q-WASM-01-clippy-core-graph --class T9-P3 --invariant "static lint clean over the wasm64 core-only compiler graph" $W --chan nightly --env "$WASMFLAGS" -- clippy -p factc-wasm-abi -Z build-std=core --target wasm64-unknown-unknown -- -D warnings
$P nostd-graph --out "$OUT/wasm64" --id Q-WASM-02-core-only-graph-dev $W --package factc-wasm-abi --profile dev --intended "$COMPILER_CRATES,factc-wasm-abi"
$P nostd-graph --out "$OUT/wasm64" --id Q-WASM-03-core-only-graph-release $W --package factc-wasm-abi --profile release --intended "$COMPILER_CRATES,factc-wasm-abi"
$P wasm-inspect --out "$OUT/wasm64" --id Q-WASM-04-inspect-release $W --factory "$FACTORY" --module "$CARGO_TARGET_DIR/wasm64-unknown-unknown/release/factc_wasm_abi.wasm"
$P wasm-inspect --out "$OUT/wasm64" --id Q-WASM-05-inspect-dev $W --factory "$FACTORY" --module "$CARGO_TARGET_DIR/wasm64-unknown-unknown/debug/factc_wasm_abi.wasm"
$P kernel-identity --out "$OUT/wasm64" --id Q-WASM-06-kernel-identity --root . $S --module "$CARGO_TARGET_DIR/wasm64-unknown-unknown/release/factc_wasm_abi.wasm"
$P browser-abi --out "$OUT/wasm64" --id Q-WASM-07-chromium-abi-release $W --module "$CARGO_TARGET_DIR/wasm64-unknown-unknown/release/factc_wasm_abi.wasm" --source tests/bootstrap/b7-opaque.ascii
# D23: the whole transport in Chromium - BUILD + OBSERVE through the wasm exports, compared byte-for-byte with the native
# driver (built by Q-HOST-01) on the commissioning fixtures; the native run is the reference, never the verdict
NB="$OUT/wasm64/native"; mkdir -p "$NB"
"$CARGO_TARGET_DIR/debug/factc" check build --out "$NB/build" --contracts fixtures/commissioning/contracts.ascii --metrics fixtures/commissioning/metrics.ascii fixtures/commissioning/byte-relay.ascii > "$NB/build.log" 2>&1 || true
"$CARGO_TARGET_DIR/debug/factc" observe --out "$NB/observe" --tape fixtures/commissioning/tape-sample.ascii --system byte_relay --source fixtures/commissioning/byte-relay.ascii --bundle-manifest "$NB/build/bundle/bundle.json" --evidence-class PHYSICAL_BROWSER > "$NB/observe.log" 2>&1 || true
$P browser-build --out "$OUT/wasm64" --id Q-WASM-08-chromium-build-release $W --module "$CARGO_TARGET_DIR/wasm64-unknown-unknown/release/factc_wasm_abi.wasm" --source fixtures/commissioning/byte-relay.ascii --contracts fixtures/commissioning/contracts.ascii --metrics fixtures/commissioning/metrics.ascii --tape fixtures/commissioning/tape-sample.ascii --system byte_relay --native-build "$NB/build" --native-observe "$NB/observe"

echo "== CROSS_SET diagnostics ($HOST_TC; proof weight NONE)"
X="--set CROSS_SET $S --chan stable --root ."
$P cargo --out "$OUT/cross" --id X-01-build-workspace-host $X --expect-fail -- build --workspace
$P cargo --out "$OUT/cross" --id X-02-clippy-workspace-host --class T9-P3 $X --expect-fail -- clippy --workspace --all-targets -- -D warnings
$P cargo --out "$OUT/cross" --id X-03-test-workspace-host $X -- test --workspace

echo "== HEURISTIC scanners (proof weight NONE)"
$P nostd-scan --out "$OUT/heuristic" --id Z-01-nostd-textual-scan --set HEURISTIC --root . --factory "$FACTORY" --crates "$NOSTD_DIRS"
$P depcheck-weak --out "$OUT/heuristic" --id Z-02-depcheck-explicit-list --set HEURISTIC --root . --factory "$FACTORY" --manifests "$DEPCHECK_LIST"

echo "== mutants (the judge attacks itself; pinned toolchains via PROOF_CHAN_MAP)"
node tests/toolchain/proof.mjs mutants --out "$OUT/mutants" --root . --mutants fixtures/toolchain/mutants --factory "$FACTORY"

echo "== summary"
$P summary --out "$OUT"
echo "qualified proof matrix executed (see $OUT/summary.txt)"
