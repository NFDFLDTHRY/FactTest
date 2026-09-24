#!/bin/sh
# D9 proof matrix over the system under test (T9-P1..T9-P8, design/materialization/D9-INTENDED-PROOF-HARNESS.md).
# Usage: sh tests/toolchain/run-proof-matrix.sh <evidence dir>
# Every obligation writes a record with WHAT was run, WITH WHICH toolchain, OVER WHICH package/target/profile
# selection, and WHY the verdict follows.  Verdicts (PASS/FAIL/GAP/UNK) are evidence about the system under test;
# this script exits non-zero only when the harness itself malfunctions (proof.mjs exit != 0).
set -e
OUT="$1"; [ -n "$OUT" ] || { echo "usage: $0 <evidence dir>"; exit 2; }
mkdir -p "$OUT"
ROOT="$(pwd)"
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-$ROOT/target}"
FACTORY="${FACTORY_BIN:-$CARGO_TARGET_DIR/debug/factory}"
P="node tests/toolchain/proof.mjs"
COMPILER_CRATES="factc-foundation,factc-source,factc-semantic,factc-capability,factc-implementation,factc-planning,factc-verifier,factc-codegen,factc-bundle,factc-observe,factc-kernel"
NOSTD_DIRS="compiler/foundation,compiler/source,compiler/semantic,compiler/capability,compiler/implementation,compiler/planning,compiler/verifier,compiler/codegen,compiler/bundle,compiler/observe,compiler/kernel,compiler/wasm-abi"
DEPCHECK_LIST="factory/Cargo.toml,compiler/foundation/Cargo.toml,compiler/source/Cargo.toml,compiler/semantic/Cargo.toml,compiler/capability/Cargo.toml,compiler/implementation/Cargo.toml,compiler/planning/Cargo.toml,compiler/verifier/Cargo.toml,compiler/codegen/Cargo.toml,compiler/bundle/Cargo.toml,compiler/observe/Cargo.toml,compiler/kernel/Cargo.toml,compiler/wasm-abi/Cargo.toml,host/factc/Cargo.toml"

echo "== T9-P7 toolchain identity"
$P toolchain --out "$OUT/toolchain" --root .

echo "== T9-P1 package selection"
$P selection --out "$OUT/selection" --id T9-P1-01-physical-vs-workspace-vs-default --root . --locked

echo "== T9-P2 native build/test (stable = active default toolchain, recorded per run)"
$P cargo --out "$OUT/native" --id T9-P2-01-build-bare-default-members --root . -- build
$P cargo --out "$OUT/native" --id T9-P2-02-build-workspace --root . --expect-fail -- build --workspace
$P cargo --out "$OUT/native" --id T9-P2-03-build-release-bare --root . -- build --release
$P cargo --out "$OUT/native" --id T9-P2-04-test-debug-bare --root . -- test
$P cargo --out "$OUT/native" --id T9-P2-05-test-release-bare --root . -- test --release
$P cargo --out "$OUT/native" --id T9-P2-06-test-debug-workspace --root . -- test --workspace
$P cargo --out "$OUT/native" --id T9-P2-07-test-release-workspace --root . -- test --release --workspace

echo "== T9-P3 clippy/fmt (static lint, never semantic proof)"
$P cargo --out "$OUT/lint" --id T9-P3-01-clippy-all-targets-bare --class T9-P3 --invariant "static lint clean over the bare (default-members) selection" --root . -- clippy --all-targets -- -D warnings
$P cargo --out "$OUT/lint" --id T9-P3-02-clippy-all-targets-workspace --class T9-P3 --invariant "static lint clean over every workspace member" --root . --expect-fail -- clippy --workspace --all-targets -- -D warnings
$P cargo --out "$OUT/lint" --id T9-P3-03-fmt-all-check --class T9-P3 --invariant "rustfmt clean over every workspace member (file list is the scope)" --root . -- fmt --all --check -v
$P cargo --out "$OUT/lint" --id T9-P3-04-clippy-wasm64-core-graph --class T9-P3 --invariant "static lint clean over the wasm64 core-only compiler graph" --root . --chan nightly --env "RUSTFLAGS=-C link-arg=-zstack-size=16777216" -- clippy -p factc-wasm-abi -Z build-std=core --target wasm64-unknown-unknown -- -D warnings

echo "== T9-P4 compile-fail for the expected reason (fixtures copied to CARGO_TARGET_DIR; fixture tree never written)"
$P compile-fail --out "$OUT/compile-fail" --id T9-P4-01-std-in-kernel --root . --fixture fixtures/compiler/negative/std-in-kernel --expect fixtures/toolchain/expect/std-in-kernel.json
$P compile-fail --out "$OUT/compile-fail" --id T9-P4-02-id-substitution --root . --fixture fixtures/compiler/negative/id-substitution --expect fixtures/toolchain/expect/id-substitution.json
$P compile-fail --out "$OUT/compile-fail" --id T9-P4-03-forge-verified-strategy --root . --fixture fixtures/compiler/negative/forge-verified-strategy --expect fixtures/toolchain/expect/forge-verified-strategy.json

echo "== T9-P5 no_std: textual scan (heuristic) and compiler-enforced core-only wasm64 graph"
$P nostd-scan --out "$OUT/nostd" --id T9-P5-01-textual-scan-heuristic --root . --factory "$FACTORY" --crates "$NOSTD_DIRS"
$P nostd-graph --out "$OUT/nostd" --id T9-P5-02-core-only-wasm64-graph-dev --root . --package factc-wasm-abi --profile dev --intended "$COMPILER_CRATES,factc-wasm-abi"
$P nostd-graph --out "$OUT/nostd" --id T9-P5-03-core-only-wasm64-graph-release --root . --package factc-wasm-abi --profile release --intended "$COMPILER_CRATES,factc-wasm-abi"

echo "== T9-P6 dependency law: Cargo-resolved graph vs physical manifests; explicit-list scan for reference"
$P deps --out "$OUT/deps" --id T9-P6-01-resolved-graph-first-party --root . --locked
$P depcheck-weak --out "$OUT/deps" --id T9-P6-02-explicit-list-scan-heuristic --root . --factory "$FACTORY" --manifests "$DEPCHECK_LIST"
rm -rf "$CARGO_TARGET_DIR/d9-scratch/third-party-dep"; mkdir -p "$CARGO_TARGET_DIR/d9-scratch"
cp -r fixtures/compiler/negative/third-party-dep "$CARGO_TARGET_DIR/d9-scratch/third-party-dep"
$P deps --out "$OUT/deps" --id T9-P6-03-third-party-dep-fixture-rejected --root "$CARGO_TARGET_DIR/d9-scratch/third-party-dep" --expect-fail

echo "== T9-P8 wasm64: inspect both profiles built by T9-P5, execute the release module in Chromium"
$P wasm-inspect --out "$OUT/wasm64" --id T9-P8-01-inspect-release --root . --factory "$FACTORY" --module "$CARGO_TARGET_DIR/wasm64-unknown-unknown/release/factc_wasm_abi.wasm"
$P wasm-inspect --out "$OUT/wasm64" --id T9-P8-02-inspect-dev --root . --factory "$FACTORY" --module "$CARGO_TARGET_DIR/wasm64-unknown-unknown/debug/factc_wasm_abi.wasm"
$P browser-abi --out "$OUT/wasm64" --id T9-P8-03-chromium-abi-release --root . --module "$CARGO_TARGET_DIR/wasm64-unknown-unknown/release/factc_wasm_abi.wasm" --source tests/bootstrap/b7-opaque.ascii

echo "== summary"
$P summary --out "$OUT"
echo "proof matrix executed (see $OUT/summary.txt; verdicts are evidence, not station status)"
