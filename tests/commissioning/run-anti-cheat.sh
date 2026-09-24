#!/bin/sh
# P6-X06: no byte_relay / commissioning special-case branch exists in compiler, factory or host machinery.
# Slice names may appear only in DATA (fixtures/, evidence/), in tests, and in documentation comments that cite
# the owner contracts by file name.  Exit non-zero if any machinery source names the slice.
OUT="$1"; mkdir -p "$OUT"
FAIL=0
scan() {
  # $1 label, $2... paths
  label="$1"; shift
  hits=$(grep -rniE "byte_relay|byte relay|commissioning|preference_rank|de ad be ef|00 01 7f 80" "$@" 2>/dev/null | grep -v "^[^:]*/tests/" | grep -viE "COMMISSIONING-[A-Z]+\.md|PASS6|P6-[A-Z]" )
  if [ -n "$hits" ]; then echo "$label: slice name in machinery:" >> "$OUT/summary.log"; echo "$hits" >> "$OUT/summary.log"; FAIL=1; else echo "$label: clean" >> "$OUT/summary.log"; fi
}
: > "$OUT/summary.log"
scan compiler-src compiler/*/src
scan codegen-templates compiler/codegen/templates
scan factory-src factory/src
scan host host/factc/src host/harness
cat "$OUT/summary.log"
exit $FAIL
