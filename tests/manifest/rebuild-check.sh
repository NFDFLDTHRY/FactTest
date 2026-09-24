#!/bin/sh
# Manifest rebuild check (first used by D21R; design/materialization/D21R-INTENDED-MANIFEST-REPAIR.md).
# The CURRENT EXECUTION MANIFEST committed at COMMIT must rebuild byte-identically in a clean clone at COMMIT with the
# working tree's tests/manifest/build-manifest.mjs (or $TOOL): (1) from the graph as committed there, which holds the
# delta's own epoch, and (2) from the graph merged from the epochs that precede that epoch.  Generic: every name is an
# argument.  Exit 0 only when all four comparisons pass; OUT records each.
# Usage: [TOOL=path] sh tests/manifest/rebuild-check.sh COMMIT REV DELTA EPOCH BASE_REV PRIOR_EPOCHS OUT.json
#   REV           the --rev the manifest was built with; DELTA / EPOCH its --delta / --epoch
#   BASE_REV      the graph's origin revision (tests/envmap/envmap.mjs merge --base-rev)
#   PRIOR_EPOCHS  the --epochs list of the epochs before EPOCH (comma separated, alias with =LABEL)
set -u
COMMIT=$1; REV=$2; DELTA=$3; EPOCH=$4; BASE=$5; PRIOR=$6; OUT=$7; TOOL=${TOOL:-tests/manifest/build-manifest.mjs}
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
git clone -q --shared . "$T/c" && git -C "$T/c" checkout -q --detach "$COMMIT" || exit 1
cp "$TOOL" "$T/c/tests/manifest/build-manifest.mjs"
M=design/execution-manifest
( cd "$T/c" \
  && node tests/manifest/build-manifest.mjs --components tests/manifest/components.json --graph design/environment-map/graph.json --rev "$REV" --delta "$DELTA" --epoch "$EPOCH" --out "$T/full" >/dev/null \
  && node tests/envmap/envmap.mjs merge --base-rev "$BASE" --epochs "$PRIOR" --out "$T/prior-graph.json" >/dev/null \
  && node tests/manifest/build-manifest.mjs --components tests/manifest/components.json --graph "$T/prior-graph.json" --rev "$REV" --delta "$DELTA" --epoch "$EPOCH" --out "$T/prior" >/dev/null ) || exit 1
ok=PASS
c() { if cmp -s "$1" "$2"; then echo PASS; else ok=FAIL; echo FAIL; fi; }
c1=$(c "$T/full/CURRENT-EXECUTION-MANIFEST.md" "$T/c/$M/CURRENT-EXECUTION-MANIFEST.md"); [ "$c1" = PASS ] || ok=FAIL
c2=$(c "$T/full/manifest.json" "$T/c/$M/manifest.json"); [ "$c2" = PASS ] || ok=FAIL
c3=$(c "$T/prior/CURRENT-EXECUTION-MANIFEST.md" "$T/c/$M/CURRENT-EXECUTION-MANIFEST.md"); [ "$c3" = PASS ] || ok=FAIL
c4=$(c "$T/prior/manifest.json" "$T/c/$M/manifest.json"); [ "$c4" = PASS ] || ok=FAIL
SHA=$(sha256sum "$T/c/$M/CURRENT-EXECUTION-MANIFEST.md" | cut -c1-64)
mkdir -p "$(dirname "$OUT")"
cat > "$OUT" <<EOJ
{
 "tool": "tests/manifest/rebuild-check.sh",
 "commit": "$COMMIT",
 "rev": "$REV",
 "delta": "$DELTA",
 "epoch": "$EPOCH",
 "builder": "$TOOL",
 "committed_manifest_sha256": "$SHA",
 "status": "$ok",
 "checks": [
  {"check": "rebuild_from_committed_graph_md", "status": "$c1"},
  {"check": "rebuild_from_committed_graph_json", "status": "$c2"},
  {"check": "rebuild_without_own_epoch_md", "status": "$c3"},
  {"check": "rebuild_without_own_epoch_json", "status": "$c4"}
 ]
}
EOJ
echo "$ok rebuild check at $COMMIT (rev $REV, epoch $EPOCH, builder $TOOL): committed graph md $c1 json $c2; without own epoch md $c3 json $c4; committed sha256 $SHA"
[ "$ok" = PASS ]
