# D26 - Intended Clean Whole-Repository Commissioning

STATUS: INTENDED ASCII (assembled before routing; source of record for delta D26-CLEAN-COMMISSIONING, workpiece W32,
base 2c0aeda)
REQUEST: design/materialization/D21-D26-WHOLE-REPO-EXECUTION-PROMPT.md, D26 CLEAN WHOLE-REPO COMMISSIONING: "Can the
CURRENT repository manufacture, verify and execute its complete implemented system from canonical source without
relying on undocumented historical state?  This is the final commissioning run.  Start from a clean Factory
workpiece/current canonical source.  Do NOT consume old build outputs as inputs ... Run: CURRENT CANONICAL TREE ->
CURRENT EXECUTION MANIFEST -> FACTORY SELF-CHECK -> QUALIFIED TOOLCHAIN PROOF -> COMPILER DAG -> ABI / HOST BOUNDARY
-> MULTI-SPECIMEN COMPILATION -> INDEPENDENT VERIFICATION -> GENERATED BUNDLES -> PHYSICAL BROWSER EXECUTION -> LOSS
/ RESELECTION / OFFLINE WHERE IMPLEMENTED -> EVIDENCE INDEX -> ENVIRONMENT GRAPH EPOCH -> Q01..CURRENT ->
ENTITLED-CLAIM SURFACE -> OBSERVED ASCII.  Use graph STALE_IF traversal to determine what D21-D25 mutations
invalidated.  Re-prove all affected current claims.  Do not select regression tests by intuition when the graph can
identify them.  Perform final consistency audit ... Update: docs/HANDOFF.md, environment graph / epoch, generated
views, current entitled-claim surface, implementation baseline, open-boundary register.  Historical evidence remains
immutable."  And the SIX-TASK FINAL CONDITION: 21 [PASS] lines.
ISSUES: none open in classes A/B/C at the base.  Found by this task: I-37 (A: the ladders' station register
contradicted the routes).
SCOPE: execute, re-prove, audit and record; no compiler, host, factory or fixture change.

## 0. Observation before drawing

```text
base           2c0aeda (D25 integration): 33 deltas receipted and verified; graph through D25 (1352 nodes); Q22 191
               current facts (RUN 120, OBS 49, GAP 12, ERR 5, UNK 5); 35 issues, every A/B/C REPAIRED
selection      tests/reprove/select.mjs over the D25 graph with a fresh identity capture: 169 current RUN/OBS facts
(scratch)      evaluated, 95 selected (environment drift 68 - six authority tips moved, repo.commit and the dependency
               graph identity -, implementation change 33, obligation 1: R-65), 20 selected facts had NO runbook
               entry ([GAP]: the D21/D21R manifest facts, the D23 DAG/proof/transport facts, the D7 runtime facts
               FACT-GPU-EPOCH-INVALIDATION / FACT-RESELECTION-NO-CODEGEN / FACT-OPAQUE-FRAME-SECURE-CONTEXT and
               twelve D12 selfhost facts) and R-65 was unmapped -> the runbook is extended (section 1); afterwards
               gaps 0, unmapped 0, ten groups
re-proof trial every group PASS on the scratch worktree: identity, lineage, status, manifest (rebuild-check at the
(scratch)      D25 integration commit), qualified-proof (27 obligations PASS 22 / OBS 3 / HEURISTIC 2, mutants RUN)
               + the crate DAG (14 crates, 1011 tests), kernel-sections (identity ef5d886a... == pin), physical (four
               specimens x three shell-driven configurations, selfhost on the fresh bundle, the attack list, the
               anti-cheat scan), clauses / reopen / ingress at the moved tips
audit          tests/audit/consistency-audit.mjs on the D25 registers found ONE contradiction: components.json
(scratch)      registered KERNEL-LADDERS (compiler/kernel/tests/) under S-FIXTURE while every route of those files
               went through S-RUST (receipts D23, D24; the manifest's receipted_by_station already said S-RUST) ->
               I-37, class A, repaired in the register.  Every LAW-tier file is held by the graph, a component owner
               or the handoff document register once LICENSE is registered (the owner's terms, kept with the law tier).
historical     evidence/D0..D25, receipts and earlier epochs are read only by the gates that were built to read them
inputs         (capability census D16, label audit D17, D18/D18R/D20 surfaces): reference roles; no build output of an
               earlier delta is consumed - the build directories are emptied before the run
judged by      the D22 Factory (2c0aeda)
```

## 1. Runbook extension (tests/reprove/runbook.json, obligations.json; data, reviewed)

```text
qualified-proof  + node tests/toolchain/run-crate-dag.mjs (its browser consumer = the Q-WASM-08 record of the same run);
                 facts FACT-D23-COMPILER-DAG-EXECUTED (crates/summary.json PASS, failed 0), FACT-D23-QUALIFIED-PROOF
                 (no FAIL, mutants RUN), FACT-D23-WASM-TRANSPORT-COMPLETE (Q-WASM-08 PASS)
kernel-sections  FACT-KERNEL-IDENTITY-D24 (both builds' identity == ef5d886a...); obligation R-65 -> kernel-sections
manifest (new)   build-manifest at HEAD + gate; rebuild-check at the commit that last changed the committed manifest
                 (delta/epoch/rev read from the manifest itself); facts FACT-D21-ISSUES-CLASSIFIED,
                 FACT-D21-LIVE-SURFACES-ENUMERATED (gate PASS), FACT-D21R-MANIFEST-REBUILD-STABLE (rebuild PASS)
physical (new)   fresh factc + kernel; run-specimens, run-attacks, anti-cheat, run-webapp (three configurations,
                 selfhost with BUNDLE_DIR + KERNEL_WASM, the public boundary); facts FACT-GPU-EPOCH-INVALIDATION,
                 FACT-RESELECTION-NO-CODEGEN (the Byte Relay shell-driven record), FACT-OPAQUE-FRAME-SECURE-CONTEXT
                 (P08 + P16), the twelve FACT-SH-* (their P-records RUN)
directories      REPROVE_TARGET / REPROVE_KERNELS name the build directories (fresh in this run); default D19's
```

## 2. The pipeline of the prompt -> fixtures and evidence (evidence/D26)

```text
CURRENT CANONICAL TREE            W32 at 2c0aeda; compiler/, host/, factory/, fixtures/ byte-identical to the base
CURRENT EXECUTION MANIFEST        F6: rebuilt at 2c0aeda, deterministic; F7: gate (manifest.json, gate.json)
FACTORY SELF-CHECK                F4: tests/factory/run-witnesses.sh (the judge built into a fresh directory), the
                                  collision witness (factory/witnesses.json, factory/collision.json)
QUALIFIED TOOLCHAIN PROOF         F4 group qualified-proof (proof/summary.json: 27 obligations)
COMPILER DAG                      F4 group qualified-proof (crates/summary.json: 14 crates, focused + consumer tests)
ABI / HOST BOUNDARY               F4 Q-WASM-08 (BUILD + OBSERVE in Chromium byte-identical to factc)
MULTI-SPECIMEN COMPILATION        F4 group physical (specimens/summary.json: 4 specimens)
INDEPENDENT VERIFICATION          F4 (bundle certificates PASS; attacks/summary.json 13; anti-cheat clean)
GENERATED BUNDLES                 F4 (physical/bundles/*/compile/bundle; integrity vs bundle.json)
PHYSICAL BROWSER EXECUTION        F4 (physical/summary.json: shell-driven with/without WebGPU, isolated)
LOSS / RESELECTION / OFFLINE      F4 (controlled loss, E1, stale plans; selfhost P01/P04 offline on the fresh bundle)
EVIDENCE INDEX                    F10: factory evidence index -> index.json
ENVIRONMENT GRAPH EPOCH           F9: epochs/D26.json = build-reprove fragment + build-fact-epoch fragment
Q01..CURRENT                      F8 (preview graph) and F10 (committed graph): Q01-Q22 -> envmap/queries
ENTITLED-CLAIM SURFACE            F10: Q22 (envmap/queries/Q22.json); referenced by the handoff and the baseline
OBSERVED ASCII                    F11: D26-OBSERVED-CLEAN-COMMISSIONING.md
STALE_IF traversal                F2 identity; F3 select (gaps 0, unmapped 0); F4/F5 run-selected build, cite,
                                  source, repo (every selected claim re-proved or the fixture fails)
consistency audit                 F8 preview and F10 final: tests/audit/consistency-audit.mjs -> audit/consistency*.json
final condition                   F8 preview and F10 final: tests/audit/final-condition.mjs -> audit/final-condition*.json
```

## 3. The five equalities and the 21 lines (tests/audit/; computed, never asserted)

```text
LIVE LAW = CURRENT IMPLEMENTATION CONTRACT     every LAW-tier file held by the graph, a component owner or the handoff
                                               register; every live owner file exists
CURRENT IMPLEMENTATION = EXECUTION MANIFEST    every path tiered, none ambiguous; live components with files; gate PASS
EXECUTION MANIFEST = FACTORY ROUTES            every live file inside its registered station's may_change; no live
                                               file without an authorized station
FACTORY ROUTES = RECEIPTS / VERIFICATION       33 deltas: a PASS receipt per fixture + verification PASS; every ledger
                                               integration commit exists and names its delta
CURRENT CLAIM = EVIDENCE OR BOUNDARY           Q22 RUN claims = claimable + invalidated; every GAP/ERR/UNK an explicit
                                               stop; every A/B/C issue REPAIRED; open issues D/E/F/G only
21 lines                                       each with its evidence path (section 2) - the final-condition record
```

## 4. Evidence binding (tests/envmap/facts/D26.json on the graph holding the re-proof fragment; epoch D26)

```text
re-proof fragment    ENV-D26-HOST / -BROWSER-DEFAULT / -BROWSER-GPUFLAGS / -SOURCES; EV nodes for the identity, the
                     selection and every group record; re-proved facts EVIDENCED_BY + STALE_IF the new environments;
                     FULFILLS for R-65; the pass's process facts
facts fragment       IMPL-AUDIT; PROBE-CONSISTENCY-AUDIT, PROBE-FINAL-CONDITION
FACT-D26-WHOLE-SYSTEM-COMMISSIONED  [RUN]  the pipeline of section 2 from the canonical source, fresh builds
FACT-D26-CONSISTENT                 [RUN]  the five equalities PASS (I-37 repaired first)
FACT-D26-FINAL-CONDITION            [RUN]  21 lines PASS
```

## 5. Mutation plan by station (delta D26-CLEAN-COMMISSIONING, workpiece W32, base 2c0aeda)

```text
F0-doc       S-DOC       this ASCII; LEDGER (D25 AFTER, D26 BEFORE); delta + fixtures
F1-fixture   S-FIXTURE   runbook.json, obligations.json, tests/audit/, concat-epochs.mjs, facts/D26.json,
                         components.json (TEST-AUDIT; KERNEL-LADDERS -> S-RUST), issues.json (I-35 empty, I-36, I-37):
                         syntax, JSON, no fact/evidence name in the audit tools, registers as intended
F2-browser   S-BROWSER   identity -> evidence/D26/identity/
F3-evidence  S-EVIDENCE  select -> evidence/D26/selection.json (gaps 0, unmapped 0)
F4-build     S-BUILD     fresh build directories; run-selected build (qualified-proof + DAG, kernel-sections,
                         physical) and cite (identity); Factory witnesses + collision; checks
F5-build     S-BUILD     run-selected source (clauses, reopen, ingress at the moved tips) and repo (lineage, status,
                         paths, manifest); every group's facts PASS
F6-doc       S-DOC       design/execution-manifest rebuilt at 2c0aeda; deterministic; the record texts (SCHEMA rows,
                         ENVIRONMENT-MAP row, docs/HANDOFF.md incl. the LICENSE register line, README.md,
                         D26-STABLE-BASELINE.md) delivered here so that the audit reads the current register
F7-evidence  S-EVIDENCE  evidence/D26/{manifest, issues, gate}.json
F8-evidence  S-EVIDENCE  PREVIEW: the re-proof fragment built and merged in a temporary graph (the D26 epoch without
                         its own facts), Q01-Q22, status scan and handoff check on it -> the consistency audit and
                         the final condition (audit/consistency.json, audit/final-condition.json: the records the
                         D26 facts cite; a fact cannot cite a record written after its epoch)
F9-doc       S-DOC       epochs/D26.json (re-proof fragment + facts fragment); graph; views
F10-evidence S-EVIDENCE  validate, Q01-Q22, stale, merge-check, render-check, Q22 check, D18/D18R/D20-SYNC/D23/D24
                         gates, capability + implementation gates, status scan, handoff check, audit -> retire ->
                         audit (W31), cleanup gate; the audit and the final condition RECOMPUTED on the committed
                         graph (audit/*-final.json) and compared line by line with the preview; index
F11-doc      S-DOC       observed record
reinspect    STRUCTURAL CHECK / GATE / BASELINE greps; validate; merge-check; render-check; epochs/D26.json rebuilt
             from the graph merged through D25 and compared; the final condition recomputed on the canonical tree and
             compared with audit/final-condition-final.json (21 PASS)
```

## 6. Predictions (from the dry run on a detached worktree at 2c0aeda)

```text
P1  identity: 4 toolchains, 45 source tips (6 moved); selection over the D25 graph: 169 evaluated, 101 selected
    (environment 70, implementation 39, obligation 1: R-65), pairs SAME 147 / DRIFT 70 / UNK 14, gaps 0, unmapped 0
P2  build + cite groups: qualified proof 27 obligations PASS 22 / OBS 3 / HEURISTIC 2, mutants RUN; crate DAG 14 crates,
    1011 tests, 0 failed; kernels under both install names == pin ef5d886a...; physical: specimens 4 PASS, attacks 13
    PASS, anti-cheat clean, run-webapp PASS (4 x 3 configurations, selfhost on the fresh bundle, public HTTPS
    UNREACHABLE); Factory witnesses PASS (29 tests, 16 of 16 reasons, 5 of 5 positive paths; judge fb212497...),
    collision witness PASS
P3  source + repo groups: clauses, reopen, ingress at the moved tips PASS; lineage, status, paths, manifest
    (rebuild-check at 2c0aeda PASS), process (the D19 and D20 selections replayed) PASS; 11 groups, 101 facts
    re-proved, 0 failed
P4  manifest at 2c0aeda + additions: 4434 files (PRODUCTION 68, FACTORY 24, TEST 110, FIXTURE 111, REFERENCE 86,
    RECORD 943, LAW 32, HISTORICAL 11, EVIDENCE 3049) in 70 components, unassigned 0, byte-identical rebuild; gate PASS
    with 37 issues (A 12, B 11, C 2, D 3, E 1, F 4, G 4)
P5  preview audit on the graph holding the re-proof fragment: 13 checks PASS; final condition 21/21 PASS
P6  epoch D26: 68 nodes / 340 edges (ENV 4, EV 55, FACT 6, IMPL 1, PROBE 2; 2 fragments); merged 1420 / 3823;
    validate 42; merge-check, render-check PASS
P7  Q22: 197 current facts (RUN 126, OBS 49, GAP 12, ERR 5, UNK 5); 126 = 125 + 1; 101 re-proved in D26; six D26
    [RUN] facts newest evidence D26; open stops GAP 10, ERR 5, UNK 5; stale 527; the audit and the final condition
    recomputed on the committed graph identical to the preview (13 PASS, 21 PASS)
P8  hygiene: status scan PASS, handoff check PASS, D18/D18R/D20-SYNC/D23/D24 gates PASS; W31 RETIRABLE -> REMOVED,
    W31-stage and W30 KEEP; index 64 files
```

## 7. Invariants

```text
I1  fresh builds only: the build directories are emptied before the run; no historical build output is an input
I2  no compiler, host, factory or fixture change: those trees are byte-identical to 2c0aeda
I3  the selection is the graph's, not intuition: every selected claim is re-proved through a runbook group or the
    run fails (gaps 0 is a fixture condition)
I4  the audit and the final condition are computed from evidence; a failing line stops the delta
I5  historical evidence, receipts, earlier epochs and records untouched
```

## 8. Structural check

```text
[x] every rung of the prompt's pipeline mapped to a fixture and an evidence path (section 2)
[x] STALE_IF traversal used for the regression set; the 20 unmapped claims given runbook groups, not skipped
[x] the five equalities and the 21 lines computed by tools that name no fact, file or component of their own
[x] one register contradiction found by the audit repaired before the audit is recorded PASS (I-37)
[x] the handoff, graph/epoch, views, entitled-claim surface (Q22), implementation baseline and open-boundary
    register updated by this delta
[x] historical evidence immutable (a final-condition line computed by git diff)
```

STRUCTURAL CHECK: PASS
