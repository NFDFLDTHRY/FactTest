#!/bin/sh
# D24 reproduce-first: build the compiler of an earlier revision and show the genericity defects ON THAT COMPILER
# before any repair is claimed (GLOBAL TEST-EVERY-ITERATION LAW).  Generic over the revision.
# Usage: sh tests/genericity/reproduce-base.sh <rev> <out dir> <cargo target dir outside the tree>
#   1. the two-relation specimen fixtures/genericity/ledger-mirror built by that revision's factc: how many of its
#      authored transfer relations does the emitted strategy data name, and does its runtime carry a fixed operation
#      or a fixed first-backend execution, does its shell carry payload bytes?
#   2. the current anti-cheat scan (tests/commissioning/run-anti-cheat.sh) over that revision's tree
# Exit 0 when the defects are REPRODUCED on that revision (that is this tool's PASS), 1 when they are absent.
set -e
REV=$1; OUT=$2; TD=$3; [ -n "$REV" ] && [ -n "$OUT" ] && [ -n "$TD" ] || { echo "usage: reproduce-base.sh <rev> <out dir> <target dir>"; exit 2; }
mkdir -p "$OUT"; OUT=$(cd "$OUT" && pwd)
T=$(mktemp -d); git archive "$REV" | tar -x -C "$T"
( cd "$T" && CARGO_TARGET_DIR="$TD" cargo +1.94.1 build -q -p factc ) > "$OUT/build.log" 2>&1
FACTC="$TD/debug/factc"
"$FACTC" check build --out "$OUT/ledger-mirror" --contracts fixtures/genericity/ledger-mirror/contracts.ascii fixtures/genericity/ledger-mirror/source.ascii > "$OUT/ledger-mirror.log" 2>&1 || true
sh tests/commissioning/run-anti-cheat.sh "$OUT/anti-cheat" "$T" > "$OUT/anti-cheat.log" 2>&1 && AC=0 || AC=$?
node -e '
const fs = require("fs"); const [out, rev, ac] = process.argv.slice(1);
const b = out + "/ledger-mirror/bundle"; const r = { tool: "tests/genericity/reproduce-base.sh", revision: rev, findings: {} };
const authored = (fs.readFileSync("fixtures/genericity/ledger-mirror/source.ascii", "utf8").match(/@\{data \w+ /g) || []).length;
if (fs.existsSync(b + "/selector.js")) {
  const sel = fs.readFileSync(b + "/selector.js", "utf8"); const j = sel.slice(sel.indexOf("/*STRATEGY-BEGIN*/") + 18, sel.indexOf("/*STRATEGY-END*/"));
  const named = [...new Set([...j.matchAll(/"relation":"(\w+)"/g)].map(m => m[1]))];
  r.findings.strategy_data = { authored_transfer_relations: authored, relations_named: named, per_transfer_requirements: j.includes("\"requirements\":") };
  const rt = fs.readFileSync(b + "/runtime.js", "utf8"); const sh = fs.readFileSync(b + "/index.html", "utf8");
  r.findings.runtime = { fixed_operation_relay: /function relay\(/.test(rt), first_guard_backend_execution: rt.includes("plan.guard[0]"), transfer_by_requirement: rt.includes("requirementFor(") };
  r.findings.shell = { payload_bytes_embedded: /0x[0-9a-f]{2},0x[0-9a-f]{2},0x[0-9a-f]{2}/.test(sh), fixed_backend_name: /WEBGPU|CPU_WASM64/.test(sh) };
} else r.findings.strategy_data = { build: "no bundle emitted" };
r.findings.anti_cheat_exit = Number(ac);
const s = r.findings.strategy_data, t = r.findings.runtime || {}, h = r.findings.shell || {};
r.reproduced = { single_relation_strategy: !!s.relations_named && s.relations_named.length < s.authored_transfer_relations, fixed_operation: !!t.fixed_operation_relay, first_backend_execution: !!t.first_guard_backend_execution, payload_in_shell: !!h.payload_bytes_embedded, anti_cheat_detects: Number(ac) !== 0 };
r.status = Object.values(r.reproduced).every(Boolean) ? "REPRODUCED" : "NOT-REPRODUCED";
fs.writeFileSync(out + "/summary.json", JSON.stringify(r, null, 1) + "\n");
console.log(r.status + " at " + rev + ": " + JSON.stringify(r.reproduced));
process.exit(r.status === "REPRODUCED" ? 0 : 1);' "$OUT" "$REV" "$AC"
