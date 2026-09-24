#!/bin/sh
# D9 harness self-attack (T9-P9): every mutant under fixtures/toolchain/mutants must be ACCEPTED by the weak/old check
# and REJECTED by the qualified check for the named reason.  Exit non-zero when any expectation is not observed:
# that means the judge is not qualified.  Mutants are copied to CARGO_TARGET_DIR before any cargo command.
set -e
OUT="$1"; [ -n "$OUT" ] || { echo "usage: $0 <evidence dir>"; exit 2; }
mkdir -p "$OUT"
ROOT="$(pwd)"
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-$ROOT/target}"
FACTORY="${FACTORY_BIN:-$CARGO_TARGET_DIR/debug/factory}"
node tests/toolchain/proof.mjs mutants --out "$OUT" --root . --mutants fixtures/toolchain/mutants --factory "$FACTORY"
