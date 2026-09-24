# D19 - Intended Re-Prove / Re-Observe

STATUS: INTENDED ASCII (assembled before routing; source of record for delta D19-REPROVE-REOBSERVE, workpiece W22)
REQUEST: design/materialization/D14-D19-TECHNICAL-REFERENCE-REVIEW-PROMPT.md, pass D19 ("Does the refreshed technical
model survive actual execution?  Use graph staleness/dependency traversal to select the MINIMUM affected physical test
set.  Do not rerun expensive probes merely ceremonially.").  Input: D18R-OBSERVED-CHAIN-REPAIR.md, Q17/Q21 of the D18R
graph (obligations R-03, R-04, R-49, R-53).
SCOPE: capture the current environment identity in every dimension a stale condition names; decide from the graph which
current claims no longer have applicable evidence (environment drift, implementation change after the evidence,
obligations addressed to this pass); re-prove exactly those physically; add the results as the current evidence epoch;
report the entitled-claim surface and a new stable baseline.  Nothing earlier is edited; a failed re-proof would be
DIFFER and return to ASCII.

## 0. Observation before drawing

```text
HEAD          b509fb0 (D18R integrated, pushed); tree clean; graph D11..D18R = 1101 nodes / 2414 edges, validate 42
current facts 109 (not superseded, not resolved): RUN 47, OBS 43, GAP 10, ERR 4, UNK 5; stale conditions of the RUN/OBS
              facts span 21 dimensions over 19 environments (Q17/stale)
environment   rustc 1.94.1 e408947bf (stable and the repository pin), nightly-2026-09-24 6eeff9a52 (WASM64 pin), rustup
              "nightly" 6bb1652a0; node v22.22.2; git 2.43.0; Playwright 1.56.1; HeadlessChrome/141.0.7390.37 @9f043f63,
              V8 14.1.146.11, launched binary /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
              (both launches; first record of it - D18R R-53); no /dev/dri; hardwareConcurrency 4
source tips   45 tip-read sources (clause summaries and D14 revisions): chromium main, v8 main and the FactTest branch
              moved since read; every D15/D16 source tip unchanged (rust master followed HEAD -> main, as the
              harnesses do)
assembly run  on a clone at b509fb0 with the D19 tools: selection 29 of 90 current RUN/OBS facts, every selected group
              PASS (qualified proof incl. mutants, kernel sections, browser identity, D15/D16 clause re-verification,
              frontier reopen of the D11/D12 authorities, lineage, paths, status); gate PASS
harness gaps  the graph records no executable launched (D18R R-53), git porcelain must not be trimmed, and an
              obligation may name a node its own reconciliation superseded - the tools handle all three
hygiene defect tests/hygiene/status-scan.mjs scans its own earlier inventories, so every inventory contains all earlier
              ones (evidence/D18 708 KB, D18R 1.5 MB, D19 would be 3.1 MB).  Fixed here: evidence/<delta>/status*/
              inventory.json are excluded and named in the output; the claims the scan carries (STATUS-INVENTORIED,
              HANDOFF-MODEL-INDEPENDENT) become implementation-stale and are re-proved by this pass
```

## 1. Environment identity (tests/reprove/identity.mjs -> evidence/D19/identity/)

```text
host.json            tests/envmap/host-identity.sh (toolchains by rustup name, node/V8, git, Playwright, OS, /dev/dri,
                     network egress status)
toolchains.json      rustc -vV + components for stable, nightly and every proof-set pin; rustup toolchain list
repo.json            HEAD, working-tree changes (raw porcelain), workspace members
browser-*.json       tests/envmap/browser-probe.mjs, default launch and GPU flag set; D19 adds launched_executable (the
                     /proc image of every process the probe's node process spawned)
tips.json            branch tip of every tip-read authority source (a removed branch follows HEAD's symref)
```

## 2. Minimum affected set (tests/reprove/select.mjs -> evidence/D19/selection.json)

```text
ENVIRONMENT     every STALE_IF (environment, dimension) of a current RUN/OBS fact, compared by the rule of its dimension
                (tests/reprove/dimensions.json): toolchain commit/components/release/install name by the install name
                the environment recorded; versions (node, git, Chromium product/revision, V8, origin, secure context,
                COI, GPU node); launch flags; authority source tips; repository paths.  SAME | DRIFT | UNK (the
                recorded identity has no comparable value - reported, never counted as SAME)
IMPLEMENTATION  the repository paths of the fact's implementations and of its probes' implementations changed after
                the commit that added its newest physical evidence (git log), or in the working tree
OBLIGATION      a Q21 obligation beginning "D19:" and not revised; its subjects followed to their current successor;
                it selects the subjects its own groups re-prove (tests/reprove/obligations.json)
assembly        90 evaluated (19 boundary records not evaluated); 29 selected: environment 6, implementation 27,
                obligation 4; gaps 0; pairs SAME 114, DRIFT 7, UNK 9
drift           ENV-D9-HOST: the rustup name "nightly" resolves to 6bb1652a0 now (D9 ran 6eeff9a52 under it; that
                toolchain is the WASM64 pin) and lacks clippy -> the D9 facts move to the pin through the qualified proof;
                ENV-D14-HOST: chromium main, v8 main, FactTest branch tips moved -> frontier re-opened
implementation  tests/toolchain/proof.mjs + proof-sets.json (D18), tests/envmap/envmap.mjs (D14-D19), browser-probe.mjs
                and tests/hygiene/status-scan.mjs (this delta), tests/reference/{clauses,lib,reopen}.mjs (D15-D17), factory/src (D13 - the D9 inspection
                evidence predates it) -> the claims that rest on them
not re-proved   FACT-WASM64-ADMITTED-E0 (R-04 subject): the Byte Relay admission is not part of the qualified proof;
                its environment is SAME and its implementation unchanged, so its D7 evidence applies.  The other 61
                evaluated facts keep their evidence (no drift, implementation unchanged)
```

## 3. Runbook (tests/reprove/runbook.json; groups run by tests/reprove/run-selected.mjs)

```text
GROUP            KIND    FACTS                                                         COMMANDS
identity         cite    GPU-ADAPTER-SWIFTSHADER, GPU-ADAPTER-NULL-DEFAULT, GPU-EXPOSED, identity records of section 1
                         LOOPBACK-SECURE-CONTEXT, MEMORY64-DISCOVERED, SAB-GLOBAL-HOST-DEFINED
qualified-proof  build   TOOLCHAIN-PINNED, PROOF-SETS-DECLARED, QUALIFIED-JUDGE-RERUN,  cargo +1.94.1 build -p factory;
                         KERNEL-IDENTITY-DEFINED-D18, COMPILE-FAIL-WITNESSED,          sh tests/toolchain/run-qualified-
                         FIRST-PARTY-GRAPH, CORE-ONLY-GRAPH, WASM64-MODULE-I64,        proof.sh (target dir outside the
                         WASM64-ABI-EXEC                                               repository)
kernel-sections  build   KERNEL-EXEC-SECTIONS-INSTALL-INDEPENDENT                      build-kernels.sh (two install names)
clauses          source  D15-CLAUSES-VERIFIED, D16-CLAUSES-VERIFIED, CHOOSER-FAMILIES-  clauses.mjs on the D15 and D16
                         NEED-ACTIVATION, SENSOR-FAMILY-ADVISEMENT                     manifests at the current tips
reopen           source  FRONTIER-SOURCES-AT-PIN, MEMORY64-FINISHED, WASM-SET-PHASE-1, reopen.mjs on the D11+D12+D13
                         WASM-THREADS-PHASE-4                                          graph (the scope D14 reopened)
lineage          repo    FF-ONLY-INTEGRATION, WORKPIECE-ISOLATION                      lineage.mjs from 4a151c9
paths            repo    SURFACES-LITERAL-ENFORCED                                     envmap.mjs paths-probe
status           repo    STATUS-INVENTORIED, HANDOFF-MODEL-INDEPENDENT                 status-scan.mjs; handoff-check
each fact names the records and the expected observation (eq / absent / includes) that decide PASS
```

## 4. Graph epoch D19 (tests/reprove/build-reprove.mjs; add-only)

```text
declares  FULFILLS (EVIDENCE -> RECONCILIATION, requires obligation)
adds      ENV-D19-HOST (pinned toolchains as the proof sets bind them; rustup names, node, git, Playwright, OS, GPU node,
          head, members), ENV-D19-BROWSER-DEFAULT / -GPUFLAGS (product, revision, V8, launch, origin, executable
          launched), ENV-D19-SOURCES (every tip read, on the node); IMPL-REPROVE; PROBE-ENV-IDENTITY,
          PROBE-REPROOF-SELECTION; one EVIDENCE per identity record, the selection and every group record a fact rests
          on; FACT-D19-ENVIRONMENT-IDENTITY, FACT-D19-LAUNCHED-EXECUTABLE, FACT-D19-MINIMUM-SET [RUN]
edges     re-proved fact EVIDENCED_BY its D19 records and STALE_IF the D19 environment in each dimension it was stale in
          (a failed one: INVALIDATED_BY); FULFILLS for R-03, R-04, R-49, R-53
Q22       entitled-claim surface (tests/envmap/envmap.mjs); Q21 obligations carry fulfilled_by
```

## 5. Mutation plan by station (delta D19-REPROVE-REOBSERVE, workpiece W22, base b509fb0)

```text
F0   S-DOC       this ASCII; ledger (D18R AFTER + D19 BEFORE); delta; fixtures
F1   S-FIXTURE   tests/reprove/, tests/envmap/{envmap.mjs, browser-probe.mjs}, tests/hygiene/status-scan.mjs; checks:
                 syntax, generic tools, the D18R graph validates/renders identically and answers Q01-Q21 byte-identically to evidence/D18R
F2   S-BROWSER   evidence/D19/identity/ (identity capture)
F3   S-EVIDENCE  evidence/D19/selection.json
F4   S-BROWSER   run-selected --kind cite (identity group)
F5   S-BUILD     run-selected --kind build (qualified proof, kernel sections)
F6   S-BUILD     run-selected --kind source (clause re-verification, frontier reopen)
F7   S-EVIDENCE  run-selected --kind repo (lineage, paths, status)
F8   S-DOC       epochs/D19.json from the Factory evidence; merged graph; views; SCHEMA 13, ENVIRONMENT-MAP 12
F9   S-EVIDENCE  validate, Q01-Q22, stale, merge-check, render-check, reprove gate, D18/D18R reconciliation gates,
                 D16/D17 gates, status scan, handoff check, audit -> retire -> audit, index
F10  S-DOC       D19-STABLE-BASELINE.md, D19-OBSERVED-REPROVE-REOBSERVE.md, docs/HANDOFF.md, README.md
MUST NOT CHANGE: law and pass documents, compiler/, host/, factory/, fixtures/, earlier epochs, D0-D18R evidence
```

## 6. Predictions

```text
P1  identity: the same toolchains, node, git, Playwright and browser build as recorded; executable launched =
    chromium_headless_shell-1194/chrome-linux/headless_shell for both launches
P2  selection: 29 of 90 (environment 6, implementation 27, obligation 4), gaps 0; drift only ENV-D9-HOST (rustup
    nightly name, 2 dimensions) and ENV-D14-HOST (source tips); UNK 9 pairs (dimensions the old records never carried)
    - tip movement between assembly and route may change the tip list, never the verdicts' form
P3  every group PASS: qualified proof all weight-bearing obligations PASS and mutants RUN; kernel exec identity equal
    under both install names; D15 60 / D16 90 clauses VERIFIED; reopen no CHANGED / NOT_FOUND clause; phases Threads 4,
    SET 1, Memory64 finished; lineage fast-forward, non-merge commits Factory-authored; no dead wildcard surface;
    status scan PASS with earlier inventories excluded (inventory under 1 MB), handoff check PASS
P4  epoch about 40 nodes / 160 edges; merged about 1141 / 2574; validate PASS 42; D11-D18R preserved
P5  gate PASS; Q21: R-03, R-04, R-49, R-53 fulfilled_by D19 evidence
P6  Q22: 112 current facts; RUN 50 = 49 claimable + 1 invalidated (FACT-GPU-ADMITTED-E0 by its E1 evidence - the Byte
    Relay's designed fallback); 29 re-proved in D19; Q18 COMPLETE 20
P7  hygiene: status scan PASS, handoff check PASS, D16/D17/D18/D18R gates PASS; W21 RETIRABLE -> REMOVED
```

## 7. Invariants

```text
I1  selection is computed from the graph, the capture and git - never chosen by hand; UNK is reported, not assumed
I2  only selected claims are re-run; unselected claims keep their evidence with the reason recorded
I3  a failed expectation is DIFFER: INVALIDATED_BY, gate FAIL, return to ASCII - never retried into PASS
I4  nothing earlier is edited; build outputs live outside the repository; D0-D18R evidence immutable
```

## 8. Pass gate and series close

```text
D19 closes when the gate passes: every selected claim re-proved with D19 evidence, every D19 obligation fulfilled, the
identity recorded, and Q22 shows every current RUN claim claimable (bounded to its evidence environments) or explicitly
invalidated.  The series closes when every current claim traverses Q18 to COMPLETE or stops at an explicit [GAP]/[ERR]/
[UNK] - the stops that remain are listed in the baseline (design/materialization/D19-STABLE-BASELINE.md).
```

## 9. Structural check

```text
inputs supplied        graph STALE_IF dimensions, identity capture, git history, obligations, runbook          PASS
outputs consumed       evidence epoch -> Q22 claim surface -> stable baseline and handoff                     PASS
contracts match        FULFILLS declared before use; dimension/runbook/obligation files reviewed              PASS
forbidden bypasses     no hand-picked re-runs; no retries; target dirs outside the repository                 PASS
illegal cycles         none (evidence -> reconciliation only)                                                  PASS
invariants represented I1-I4 -> select.mjs, run-selected.mjs exit, gate, must_not_change                      PASS
tests/evidence         F1 regression, F2-F7 physical, F8 validate, F9 gates                                    PASS
```

STRUCTURAL CHECK: PASS
