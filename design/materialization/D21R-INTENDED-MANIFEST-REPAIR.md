# D21R - Intended Manifest Repair (before D22)

STATUS: INTENDED ASCII (assembled before routing; source of record for delta D21R-MANIFEST-REPAIR, workpiece W26)
REQUEST: design/materialization/D21-D26-WHOLE-REPO-EXECUTION-PROMPT.md - GAP CLASSIFICATION LAW class A ("INTERNAL
REPO/IMPLEMENTATION DEFECT -> REPAIR NOW"), GLOBAL TEST-EVERY-ITERATION LAW (reproduce, preserve the failing evidence,
earliest broken rung, minimal delta, focused test, component and task regression, bind evidence, re-observe) and the
EARLIEST-RUNG RETURN LAW.  The Factory's re-inspection of D21-EXECUTION-MANIFEST (integrated as 910fdbf) REFUSED.
SCOPE: repair exactly the rung the refusal names - tests/manifest/build-manifest.mjs reads the delta's own epoch after
integration - with a focused test that witnesses the repair at the integration commit, and bind that witness to the
graph.  Nothing in D21's records, manifest, epoch, evidence or receipts is edited: they stay as history, and this
repair names the error.

## 0. Observation before drawing

```text
refusal      factory reinspect D21.json -> FAIL (W25.reinspect.json status DIFFER; reinspect_command FAIL); the command
             passed validate (42), merge-check and render-check, then `cmp` of the rebuilt CURRENT-EXECUTION-MANIFEST.md
             against the committed one differed at line 3
reproduce    on the canonical tree at 910fdbf, the committed builder rebuilt with the committed graph (which now holds
             epoch D21): STATUS line lists "... D20 D21" instead of "... D20"; the ten components D21 gave an
             implementation node now show "graph implementations IMPL-..., governing claims FACT-D21-LIVE-SURFACES-
             ENUMERATED, probes PROBE-EXECUTION-MANIFEST, evidence 2 records (evidence/D21)"; findings
             live_components_without_graph_implementation 10 -> 0 and live_components_without_governing_claim 11 -> 0;
             every other number identical (2966 files, 65 components, the tiers, coverage)
             the same builder rebuilt with the graph merged from the epochs before D21: byte-identical
rung         tests/manifest/build-manifest.mjs, graph reading.  Its header promised "the current delta's own records -
             its receipts (--delta), its evidence package and epoch (--epoch) ... are never enumerated by its own
             manifest, so the manifest rebuilds byte-identically before and after integration", but --epoch was applied
             only to the evidence-reader finding (line 147); the graph was read whole.  F3 passed because the D20
             graph was the graph at F3 time; the re-inspection runs at the integration commit, where the merged graph
             carries D21.  Earlier rungs (components.json, the enumeration rule, receipts, cargo metadata) are not
             involved: the rebuild without the own epoch is identical.
class        A - internal implementation defect in live TEST machinery (TEST-MANIFEST).  Not B (the test existed and
             caught it: the re-inspection is the test), not C (no special case), not G.
D21 records  D21-OBSERVED-EXECUTION-MANIFEST.md P1 says "the manifest rebuilt byte-identically (F3, reinspect)": true
             for F3, written before the re-inspection ran, false for the re-inspection.  The record stays as written;
             LEDGER D21 AFTER names the defect (as D18's AFTER named the D18R defect).
not touched  design/execution-manifest/ (the enumeration is right and unchanged), epochs/D21.json, evidence/D21/,
             factory/receipts/D21-EXECUTION-MANIFEST/, tests/manifest/{components,issues}.json, gate.mjs,
             build-epoch.mjs
```

## 1. Repair (tests/manifest/build-manifest.mjs; generic, five lines)

```text
before       const g = J(o.graph)                        (the merged graph, whatever epochs it holds)
after        gAll = J(o.graph); ownEpoch = ids of nodes with introduced_in === --epoch (the tag the merge gives every
             node after the D11 base); g = gAll without those nodes, without the edges touching them, without that
             epochs entry
effect       with --epoch D21 the builder reads the same claims before and after integration; graph_epochs (and the
             STATUS line) never list the delta's own epoch; without --epoch nothing changes
generic      names no epoch, node or component; the merge's introduced_in tag is the only key; header comment updated
```

## 2. Focused test (tests/manifest/rebuild-check.sh; generic)

```text
usage        [TOOL=builder] sh tests/manifest/rebuild-check.sh COMMIT REV DELTA EPOCH BASE_REV PRIOR_EPOCHS OUT.json
operation    clean clone at COMMIT (git clone --shared .; checkout --detach COMMIT); the working tree's builder (or
             TOOL) overlaid; rebuild (1) from design/environment-map/graph.json as committed there and (2) from
             envmap merge --base-rev BASE_REV --epochs PRIOR_EPOCHS; four cmp against the committed
             design/execution-manifest/{CURRENT-EXECUTION-MANIFEST.md, manifest.json}; OUT records each check and the
             committed manifest's sha256; exit 0 only when all four PASS
reproduce    TOOL=$(git show 910fdbf:tests/manifest/build-manifest.mjs): (1) FAIL md, FAIL json; (2) PASS, PASS -> the
             failing evidence is preserved as evidence/D21R/reproduce.json, beside the Factory's own re-inspection
             record and log (evidence/D21R/reinspect-d21-{result.json, run.log})
repair       the working tree's builder: four PASS -> evidence/D21R/rebuild-check.json
regression   component: tests/manifest/gate.mjs on the committed manifest PASS; epochs/D21.json rebuilt byte-identically
             by build-epoch.mjs from the prior graph (the D21 machinery answers as before).  Task: every D21 record,
             evidence file and receipt unchanged (git diff --exit-code 910fdbf).
re-inspect   the same check runs in the D21R re-inspection clone (910fdbf is an ancestor of the D21R commit)
```

## 3. Evidence binding (tests/envmap/build-fact-epoch.mjs + tests/envmap/facts/D21R.json; epoch D21R, add-only)

```text
builder      generic single-fact epoch builder, reusable by every D22-D26 repair: --spec (delta-owned record naming the
             facts, probe, evidence files, implementation nodes, STALE_IF dimensions), --identity (ENV-<E>-HOST from
             tests/reprove/identity.mjs, as build-epoch.mjs), --graph (existing node ids must resolve), --out
epoch D21R   ENV-D21R-HOST; PROBE-MANIFEST-REBUILD (implemented_by IMPL-TEST-MANIFEST); EV-D21R-REINSPECT-D21-RESULT,
             EV-D21R-REINSPECT-D21-RUN, EV-D21R-REPRODUCE, EV-D21R-REBUILD-CHECK (sha256-bound);
             FACT-D21R-MANIFEST-REBUILD-STABLE [RUN]: PROBED_BY, EVIDENCED_BY x4, REQUIRES ENV-D21R-HOST,
             IMPLEMENTED_BY IMPL-TEST-MANIFEST, STALE_IF repo.commit -> 7 nodes / 9 edges
unchanged    FACT-D21-LIVE-SURFACES-ENUMERATED and FACT-D21-ISSUES-CLASSIFIED stay [OBS]: the enumeration they state
             did not change; the re-inspection defect was in how the builder read claims after integration
```

## 4. Mutation plan by station (delta D21R-MANIFEST-REPAIR, workpiece W26, base 910fdbf)

```text
F0-doc       S-DOC       this ASCII; LEDGER (D21 AFTER with the defect; D21R BEFORE); delta + fixtures
F1-fixture   S-FIXTURE   build-manifest.mjs (repair), rebuild-check.sh, build-fact-epoch.mjs, facts/D21R.json; syntax +
                         generic-name scan; reproduce with the committed builder (expected FAIL); repaired builder PASS;
                         D21 gate + D21 epoch regression; no other test file changed
F2-browser   S-BROWSER   identity -> evidence/D21R/identity/
F3-evidence  S-EVIDENCE  the Factory's re-inspection record + log copied; reproduce.json; rebuild-check.json
F4-doc       S-DOC       epochs/D21R.json; graph (D11..D21 + D21R); views; SCHEMA 15 (rows), ENVIRONMENT-MAP 14 (row);
                         docs/HANDOFF.md; README.md
F5-evidence  S-EVIDENCE  validate, Q01-Q22, stale, merge-check, render-check, Q22 check (FACT-D21R [RUN], D21 facts
                         [OBS]), D18/D18R/D20-SYNC gates, capability + implementation gates, status scan, handoff check,
                         audit -> retire -> audit (nothing retirable: W25 KEEP by its DIFFER record), cleanup gate,
                         index
F6-doc       S-DOC       observed record
reinspect    STRUCTURAL CHECK / GATE greps; validate; merge-check; render-check; rebuild-check at 910fdbf (temp);
             epochs/D21R.json rebuilt from the graph merged through D21 and compared
```

## 5. Predictions

```text
P1  reproduce: builder as committed at 910fdbf -> rebuild_from_committed_graph md FAIL, json FAIL;
    rebuild_without_own_epoch md PASS, json PASS; the Factory's record W25.reinspect.json status DIFFER
P2  repaired builder -> four PASS; committed CURRENT-EXECUTION-MANIFEST.md sha256
    ffd00a55e5049d13195de907858854714466d2cc5d6a47154629f525663bccfc; D21 gate PASS; epochs/D21.json byte-identical
P3  epoch D21R 7 nodes / 9 edges; merged 1274 / 3250; validate 42; merge-check and render-check PASS
P4  Q22: 177 current facts (RUN 110, OBS 48, GAP 10, ERR 5, UNK 4); RUN claims 110 = 109 claimable + 1 invalidated;
    open stops GAP 8, ERR 5, UNK 4; FACT-D21R-MANIFEST-REBUILD-STABLE [RUN] with newest evidence D21R; D21 facts [OBS]
P5  hygiene: status scan PASS, handoff check PASS, reconciliation / capability / implementation gates PASS; audit:
    RETIRABLE 0 - W25 is KEEP by the Factory's rule ("reinspect DIFFER": a workpiece whose re-inspection differed is
    kept as evidence), W25-stage KEEP; nothing retired; cleanup gate PASS
P6  git diff --exit-code 910fdbf on design/execution-manifest, epochs/D21.json, evidence/D21, D21 receipts, D21 records,
    compiler, host, factory/src, factory/registry, fixtures, law documents: empty
```

## 6. Invariants

```text
I1  D21's manifest, epoch, evidence, receipts and records are not edited; the repair names the error
I2  the repaired builder answers identically wherever the graph holds no node of --epoch (no --epoch: unchanged)
I3  the failing evidence is preserved before the repair is applied (reproduce.json, the Factory's re-inspection record)
I4  no implementation surface outside tests/manifest/build-manifest.mjs changes; no law document changes
I5  a re-inspection refusal is an internal defect: it is repaired by a repair delta before the next task (procedure
    rule added to docs/HANDOFF.md section 4)
```

## 7. Structural check

```text
[x] the refusal reproduced from the repository alone, on the integration commit, before any change
[x] earliest broken rung named (builder's graph reading); every earlier rung shown uninvolved (rebuild without the own
    epoch identical)
[x] minimal delta: one live file repaired; the test and the binding tool are additions
[x] the focused test fails with the committed builder and passes with the repaired one, in the same clone
[x] evidence bound: one [RUN] fact, four sha256 records, one probe, one environment; STALE_IF named
[x] D22 starts from a tree whose last delta re-inspected clean
```

STRUCTURAL CHECK: PASS
