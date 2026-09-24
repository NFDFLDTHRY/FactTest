#!/bin/sh
# P6-X06 / D24: no specimen-specific semantics in generic machinery (compiler, factory, host).
# Backend-specific machinery (adapter templates named by registry recipes) is allowed; SPECIMEN-specific
# semantics are not.  The scan is data-driven: the specimens are every fixture under fixtures/ (system names,
# transfer relation names, payload bytes in spaced-hex, 0x-comma, decimal-comma and contiguous-hex forms), plus
# the fixed forms a hardcode takes (a fixed operation name `relay(`, backend names outside adapter templates, the
# legacy slice names).  Slice names may appear only in DATA (fixtures/, evidence/), in tests, and in documentation
# comments that cite the owner contracts by file name.  Exit non-zero on any hit.  "$1" receives the summary.
# "$2" (optional) is the tree to scan (default: the current directory), so an earlier tree can be re-scanned.
OUT="$1"; mkdir -p "$OUT"; OUT=$(cd "$OUT" && pwd)
cd "${2:-.}"
FAIL=0
: > "$OUT/summary.log"
: > "$OUT/patterns.txt"
# --- specimen-derived patterns: every executable specimen (a fixture directory holding a registry and payloads)
# contributes its system and transfer-relation names as string literals, calls or members (a name in prose or a
# comment is not a semantic; a quoted name, a call `name(` or a member `.name` in machinery is), and its payload
# bytes in the forms a hardcode takes.
SPEC_DIRS=$(find fixtures -name 'payloads.json' -exec dirname {} \; | sort -u)
for d in $SPEC_DIRS; do for f in "$d"/*.ascii; do
  sed -n 's/.*@{system \([A-Za-z_][A-Za-z0-9_]*\).*/\1/p' "$f"
  sed -n 's/.*@{data \([A-Za-z_][A-Za-z0-9_]*\) .*/\1/p' "$f"
done; done | sort -u | while read -r n; do printf '["'"'"'`]%s["'"'"'`]\n\\b%s\\(\n\\.%s\\b\n' "$n" "$n" "$n"; done >> "$OUT/patterns.txt"
for d in $SPEC_DIRS; do
  node -e '
    const p = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).payloads;
    for (const x of p) { const b = (x.hex.match(/[0-9a-fA-F]{2}/g) || []).map(h => parseInt(h, 16)); if (b.length < 3) continue;
      const h = b.map(v => v.toString(16).padStart(2, "0"));
      console.log(h.join(" ")); console.log(h.join("")); console.log(h.map(v => "0x" + v).join(", ?")); console.log(b.join(", ?")); }' "$d/payloads.json"
done | sort -u >> "$OUT/patterns.txt"
# --- fixed forms of a hardcode
cat >> "$OUT/patterns.txt" <<'PAT'
byte_relay
byte relay
byte-relay
commissioning
preference_rank
\brelay\(
\.relay\b
PAT
scan() {
  # $1 label, $2... paths
  label="$1"; shift
  hits=$(grep -rniE -f "$OUT/patterns.txt" "$@" 2>/dev/null | grep -v "^[^:]*/tests/" | grep -viE "COMMISSIONING-[A-Z]+\.md|PASS6|P6-[A-Z]" )
  if [ -n "$hits" ]; then echo "$label: specimen semantics in machinery:" >> "$OUT/summary.log"; echo "$hits" >> "$OUT/summary.log"; FAIL=1; else echo "$label: clean" >> "$OUT/summary.log"; fi
}
scan compiler-src compiler/*/src
scan codegen-templates compiler/codegen/templates
scan factory-src factory/src
scan host host/factc/src host/harness
# backend names belong to adapter templates only (backend-specific machinery keyed by the registry recipe)
hits=$(grep -rnE "\b(WEBGPU|CPU_WASM64)\b" compiler/*/src compiler/codegen/templates factory/src host/factc/src host/harness 2>/dev/null | grep -v "^[^:]*/tests/" | grep -v "templates/adapter-")
if [ -n "$hits" ]; then echo "backend-names: fixed backend assumption outside adapter templates:" >> "$OUT/summary.log"; echo "$hits" >> "$OUT/summary.log"; FAIL=1; else echo "backend-names: clean" >> "$OUT/summary.log"; fi
cat "$OUT/summary.log"
exit $FAIL
