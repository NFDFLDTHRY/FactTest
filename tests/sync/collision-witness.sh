#!/bin/sh
# Parallel-line import collision witness (first used by D22).  In a scratch repository two lines add the same path with
# different bytes and a content-neutral sync merge makes the other line an ancestor; tests/sync/import-line.mjs must
# refuse the colliding path until the map relocates it, then import the relocated copy byte-identically and leave the
# colliding path as it is.  Generic: the scratch content is arbitrary; no repository path of FactTest is named.
# Usage: sh tests/sync/collision-witness.sh OUT.json
set -u
OUT=$1; case "$OUT" in /*) ;; *) OUT=$PWD/$OUT ;; esac; TOOL=$(cd "$(dirname "$0")" && pwd)/import-line.mjs
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
R=$T/repo; git init -q -b main "$R"; cd "$R" || exit 1; git config user.name witness; git config user.email witness@facttest.invalid
echo base > base.txt; git add -A; git commit -qm base; BASE=$(git rev-parse HEAD)
git checkout -qb line; echo "line content" > shared.txt; echo "line only" > line-only.txt; git add -A; git commit -qm line; LINE=$(git rev-parse HEAD)
git checkout -q main; echo "our content" > shared.txt; git add -A; git commit -qm ours
git merge -q -s ours --no-edit line; OURS=$(git rev-parse HEAD)
map() { printf '{"line":{"base":"%s","head":"%s"},"relocate":[%s],"union":[],"embed":[],"regenerate":[],"live":[]}\n' "$BASE" "$LINE" "$1" > "$T/map.json"; }
# 1. the collision is refused, naming the path
map ""; node "$TOOL" --map "$T/map.json" --check --out "$T/collide.json" --ours "$OURS" >"$T/c1.log" 2>&1; C1=$?
if [ $C1 -ne 0 ] && grep -q 'shared.txt: destination shared.txt already holds other content' "$T/c1.log"; then REFUSED=PASS; else REFUSED=FAIL; fi
# 2. relocated, the import writes and checks byte-identically; the colliding path keeps our bytes
map '{"from":"shared.txt","to":"line/shared.txt"}'
node "$TOOL" --map "$T/map.json" --write --ours "$OURS" >"$T/w.log" 2>&1; W=$?
node "$TOOL" --map "$T/map.json" --check --out "$T/reloc.json" --ours "$OURS" >"$T/c2.log" 2>&1; C2=$?
git show "$LINE:shared.txt" > "$T/theirs"
if [ $W -eq 0 ] && [ $C2 -eq 0 ] && cmp -s line/shared.txt "$T/theirs" && [ "$(cat shared.txt)" = "our content" ] && [ "$(cat line-only.txt)" = "line only" ]; then RELOC=PASS; else RELOC=FAIL; fi
STATUS=PASS; [ $REFUSED = PASS ] && [ $RELOC = PASS ] || STATUS=FAIL
mkdir -p "$(dirname "$OUT")"
node -e '
const [out, status, refused, reloc, d1, d2] = process.argv.slice(1);
require("fs").writeFileSync(out, JSON.stringify({ tool: "tests/sync/collision-witness.sh", import_tool: "tests/sync/import-line.mjs",
  scene: "line adds shared.txt and line-only.txt; ours adds shared.txt with other bytes; sync merge -s ours", status,
  checks: [ { check: "collision_refused_naming_the_path", status: refused, detail: d1 },
            { check: "relocated_import_byte_identical_and_collision_untouched", status: reloc, detail: d2 } ] }, null, 1) + "\n");
' "$OUT" "$STATUS" "$REFUSED" "$RELOC" "$(grep -o 'shared.txt: destination shared.txt already holds other content[^;]*' "$T/c1.log" | head -1)" "$(tail -1 "$T/c2.log")"
echo "$STATUS collision witness: refused $REFUSED, relocated $RELOC"
[ $STATUS = PASS ]
