#!/bin/sh
# D14 reference ingress evidence (S-BUILD, source-nonmutating): host reachability, register copy, offline verify,
# refetch by commit, citation audit.  Usage: sh tests/reference/run-ingress-checks.sh <evidence dir>
# Verdicts live in the JSON files; this script exits non-zero only when a tool malfunctions.
set -e
OUT="$1"; [ -n "$OUT" ] || { echo "usage: $0 <evidence dir>"; exit 2; }
mkdir -p "$OUT/ingress" "$OUT/audit"
I="node tests/reference/ingress.mjs"
R=fixtures/reference/ROUTES.json; C=fixtures/reference; G=fixtures/reference/REGISTER.json
$I plan-check --routes $R --map REFERENCE-AUTHORITY.md --graph design/environment-map/graph.json
$I probe-hosts --routes $R --map REFERENCE-AUTHORITY.md --graph design/environment-map/graph.json --out "$OUT/ingress/hosts.json"
cp $G "$OUT/ingress/register.json"
$I verify --routes $R --corpus $C --register $G --out "$OUT/ingress/verify.json"
$I verify --routes $R --corpus $C --register $G --refetch --out "$OUT/ingress/refetch.json"
$I audit --routes $R --corpus $C --register $G --map REFERENCE-AUTHORITY.md --graph design/environment-map/graph.json --out "$OUT/audit"
echo "ingress checks executed (verdicts in $OUT/ingress/*.json and $OUT/audit/*)"
