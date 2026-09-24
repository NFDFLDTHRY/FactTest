#!/bin/sh
# D13 live-handoff check (design/materialization/D13-INTENDED-REPO-HYGIENE.md section 5).
# Usage: sh tests/hygiene/handoff-check.sh <out.json>
# PASS when a fresh agent of any model can find the current state, law, entrypoint and procedure without a session
# prompt, and every live mention of a model/session is marked historical.  Exit 1 on any failed check.
OUT="$1"; [ -n "$OUT" ] || { echo "usage: $0 <out.json>"; exit 2; }
mkdir -p "$(dirname "$OUT")"
R=""; FAIL=0
chk() { if eval "$2"; then R="$R{\"check\":\"$1\",\"status\":\"PASS\"},"; else R="$R{\"check\":\"$1\",\"status\":\"FAIL\"},"; FAIL=1; echo "FAIL $1"; fi; }
chk readme_points_to_handoff 'grep -q "docs/HANDOFF.md" README.md'
chk readme_model_independent 'grep -qi "model-independent" README.md'
for s in "## 1. Current state" "## 2. Mutation law" "## 3. Entrypoint" "## 4. Operating procedure" "## 5. Document register" "## 6. Open-boundary register" "## 7. Proof sets and toolchain"; do
  chk "handoff_section:$(echo "$s" | tr ' ' '_')" "grep -qF \"$s\" docs/HANDOFF.md"
done
# every live mention of a model/session name is on a line that says it is historical
chk live_model_mentions_marked_historical '! { grep -n -i -E "fable|opus" README.md docs/HANDOFF.md; head -12 design/materialization/LEDGER.md | grep -n -i -E "fable|opus"; } | grep -v -i "historical" | grep -q .'
chk bootloader_banner_first_line 'head -1 FABLE-ASCII-SYSTEM-PROMPT.md | grep -q "^D13 ANNOTATION .*HISTORICAL"'
chk final_handoff_title_annotated 'grep -q "^D13 ANNOTATION" FINAL-HANDOFF-REQUIREMENTS.md'
chk planned_layout_annotated 'grep -q "^D13 ANNOTATION" PLANNED-REPO-LAYOUT.md'
chk ledger_header_model_independent '! head -4 design/materialization/LEDGER.md | grep -q "^STATUS: LIVE RECORD OF THE FABLE"'
for f in REFERENCE-AUTHORITY.md CONSTRAINT-LEDGER.md CONFLICT-LEDGER.md IMPLEMENTATION-CONTRACTS.md EVIDENCE-OBLIGATIONS.md; do
  chk "fragment_citation_preserved_and_annotated:$f" "grep -q 'https://webassembly.github.io/spec/js-api/#internal-storage' $f && grep -A3 'https://webassembly.github.io/spec/js-api/#internal-storage' $f | grep -q '^D13 ANNOTATION .*#internal-storage'"
done
printf '{"tool":"tests/hygiene/handoff-check.sh","status":"%s","checks":[%s]}\n' "$([ $FAIL = 0 ] && echo PASS || echo FAIL)" "${R%,}" > "$OUT"
[ $FAIL = 0 ] && echo "handoff check PASS" || exit 1
