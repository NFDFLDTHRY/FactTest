#!/bin/sh
# B1/B2/B3 negative fixtures: each must be REJECTED.  A fixture that builds is a failure of project law.
OUT="$1"; mkdir -p "$OUT"; FAIL=0
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-target}/negative"
FACTORY="${FACTORY_BIN:-${CARGO_TARGET_DIR%/negative}/debug/factory}"
for c in std-in-kernel id-substitution forge-verified-strategy; do
  if (cd fixtures/compiler/negative/$c && cargo build > "$OUT/$c.log" 2>&1); then echo "$c: BUILT (must fail)" | tee -a "$OUT/summary.log"; FAIL=1; else echo "$c: rejected by rustc (expected)" | tee -a "$OUT/summary.log"; fi
done
if "$FACTORY" depcheck . fixtures/compiler/negative/third-party-dep/Cargo.toml > "$OUT/third-party-dep.log" 2>&1; then echo "third-party-dep: ACCEPTED (must fail)" | tee -a "$OUT/summary.log"; FAIL=1; else echo "third-party-dep: rejected by depcheck (expected)" | tee -a "$OUT/summary.log"; fi
exit $FAIL
