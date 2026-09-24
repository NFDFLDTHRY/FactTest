# D19 - Observed Re-Prove / Re-Observe vs Intended

STATUS: RE-OBSERVATION OF THE D19 WORKPIECE (W22 on canonical base b509fb00920443930aa75b10dae05b9683d2fe1b)
LAW: compares D19-INTENDED-REPROVE-REOBSERVE.md (sections 1-8) with the Factory run (factory/receipts/D19-REPROVE-REOBSERVE/,
evidence/D19/): INTENDED -> EXECUTION -> EVIDENCE -> OBSERVED.  MATCH closes; DIFFER returns to ASCII as [ERR]/[GAP]/[UNK].
The intended drawing is not rewritten.

## 1. Station run

```text
F0-doc       S-DOC       PASS  intended ASCII, ledger (D18R AFTER + D19 BEFORE); nothing else changed
F1-fixture   S-FIXTURE   PASS  tests/reprove/, envmap (Q21 fulfilled_by, Q22), browser-probe (executable launched),
                               status-scan (own inventories excluded); tools generic; the D18R graph validates (42),
                               renders and merges identically and answers Q01-Q21 byte-identically to evidence/D18R
F2-browser   S-BROWSER   PASS  identity: 4 toolchains, 45 source tips (3 moved), both browser launches
F3-evidence  S-EVIDENCE  PASS  selection: 29 of 90, gaps 0
F4-browser   S-BROWSER   PASS  identity group: 6 facts
F5-build     S-BUILD     PASS  qualified proof (factory build 2 s, proof 50 s): 9 facts; kernel sections (31 s): 1 fact
F6-build     S-BUILD     PASS  clauses D15 (41 s) and D16 (29 s): 4 facts; frontier reopen (63 s): 4 facts
F7-evidence  S-EVIDENCE  PASS  lineage, paths, status: 5 facts
F11-fixture  S-FIXTURE   PASS  repair fixture, run after F7 and before F8 (see ROUTE): Q22 explicit_stops
F8-doc       S-DOC       PASS  epochs/D19.json built inside the run; graph merged; views rendered; SCHEMA 13, MAP 12
F9-evidence  S-EVIDENCE  PASS  validate, Q01-Q22, stale, merge-check, render-check, re-proof gate, Q22 surface + stop
                               check, D18/D18R reconciliation gates, D16/D17 gates, status scan, handoff check,
                               audit -> retire -> audit, index
F10-doc      S-DOC             this record, the stable baseline, docs/HANDOFF.md, README.md, the SCHEMA Q22 line
ROUTE  [ERR -> repaired before the graph was built]  While F6 ran, the Q22 surface of the assembly run was read for the
       baseline.  Two [GAP] facts were shown as open stops ("no claim [GAP]") although later evidence INVALIDATED them
       in D13: FACT-TOOLCHAIN-DRIFT ("no repository pin"; INVALIDATED_BY EV-D13-PINS) and FACT-WILDCARD-SURFACES-DEAD
       (INVALIDATED_BY EV-D13-PATHS-PROBE).  FACT-TOOLCHAIN-PINNED and FACT-SURFACES-LITERAL-ENFORCED are [RUN] and are
       re-proved in this pass, so the surface would have carried two contradictory current truths.  The graph was
       right, because the edges exist since D13.  The defect was in the new query.  The route was paused after F6 closed.
       A NEW fixture, F11-fixture (S-FIXTURE), replaced tests/envmap/envmap.mjs: Q22 now separates open stops from
       closed ones (explicit_stops) and shows a closed statement as "closed: invalidated by ... (history, not an open
       stop)".  F11 repeated the F1 checks and added a stop check on the D18R graph.  F9's Q22 check had not run yet;
       it was extended to explicit_stops (a delta-owned record).  Then F7, F11, F8 and F9 ran.  No fixture was re-run
       and nothing was restored.  F1 and F11 both receipt envmap.mjs.  Every station open was checked before copying.
```

## 2. Environment identity (evidence/D19/identity/)

```text
host        rustc 1.94.1 e408947bf (stable, repository pin); nightly-2026-09-24 = 6eeff9a52 (WASM64 pin, with clippy
            and rust-src); rustup "nightly" = 6bb1652a0 (2026-09-22, no clippy); node v22.22.2 (V8 12.4.254.21-node.39),
            git 2.43.0, Playwright 1.56.1, Ubuntu 24.04.4, Linux 6.18.44; no /dev/dri
browser     HeadlessChrome/141.0.7390.37, V8 14.1.146.11, both launches
            default:    secure context true, crossOriginIsolated false, SharedArrayBuffer absent, navigator.gpu present,
                        requestAdapter() null, Memory64 true
            GPU flags:  the same, adapter google / swiftshader, isFallbackAdapter true
launched    /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell for both launches (/proc/<pid>/exe
            of the processes the probe's node process spawned) - the first record of the launched binary (R-53)
tips        45 tip-read sources.  3 moved since they were read: chromium main 19edc42ce -> 6411417c0, v8 main
            43d44dae1 -> 010a4b88b, and the FactTest branch 5e57467bd -> b509fb009.  rust master is absent, so its
            sources follow HEAD -> main (the harness rule)
```

## 3. Minimum affected set (evidence/D19/selection.json)

```text
evaluated     90 current RUN/OBS facts; 19 boundary records not evaluated
conditions    130 (fact, environment, dimension) stale conditions: SAME 114, DRIFT 7, UNK 9
drift         ENV-D9-HOST toolchain.nightly.rustc_commit and .components: rustup "nightly" now names 6bb1652a0 without
              clippy (D9 ran 6eeff9a52, which is installed as the pin nightly-2026-09-24)
              ENV-D14-HOST authority.source_commit: the 3 moved tips above
UNK           9 conditions whose record carries no comparable value: V8 version (D1-D3 host and browser, D6-D7 both
              launches), GPU device node (D6-D7 both launches), D11 evidence commit, D12 launch recorded as prose, D17
              nightly component list.  Reported; never counted as SAME
selected      29 = environment 6, implementation 27, obligation 4 (a fact may have several reasons); gaps 0
obligations   R-03 -> identity; R-04, R-49 -> qualified-proof; R-53 -> identity.  Subjects not re-proved by the
              obligation's own group: FACT-WASM64-ADMITTED-E0 (the Byte Relay admission is not in the qualified proof;
              environment SAME, implementation unchanged: its E0 evidence applies) and
              FACT-KERNEL-EXEC-SECTIONS-INSTALL-INDEPENDENT (re-proved by kernel-sections through implementation)
not selected  61 evaluated facts keep their evidence: no drift, no implementation change, no obligation
```

## 4. Re-proof (evidence/D19/results/, evidence/D19/logs/)

```text
identity         PASS  GPU-ADAPTER-NULL-DEFAULT, GPU-ADAPTER-SWIFTSHADER, GPU-EXPOSED, LOOPBACK-SECURE-CONTEXT,
                       MEMORY64-DISCOVERED, SAB-GLOBAL-HOST-DEFINED
qualified-proof  PASS  21/21 weight-bearing obligations PASS (HOST_NATIVE_SET 1.94.1, WASM64_KERNEL_SET
                       nightly-2026-09-24; tests 103 passed / 0 failed); 3 OBS, 2 heuristic (weight NONE); mutants 8/8
                       RUN (each weak check accepted its mutant, each qualified check rejected it for the named reason);
                       T13-KRN exec identity e8d65826...bef2 == declared.  COMPILE-FAIL-WITNESSED, CORE-ONLY-GRAPH,
                       FIRST-PARTY-GRAPH, KERNEL-IDENTITY-DEFINED-D18, PROOF-SETS-DECLARED, QUALIFIED-JUDGE-RERUN,
                       TOOLCHAIN-PINNED, WASM64-ABI-EXEC, WASM64-MODULE-I64
kernel-sections  PASS  install names nightly-2026-09-24 and a renamed copy: whole files 6f25ce43... / 309589947e...,
                       exec identity e8d65826... for both; the only differing section is custom:name
                       (KERNEL-EXEC-SECTIONS-INSTALL-INDEPENDENT)
clauses          PASS  D15 60/60 and D16 90/90 VERIFIED at the current source tips (D15-, D16-CLAUSES-VERIFIED,
                       CHOOSER-FAMILIES-NEED-ACTIVATION, SENSOR-FAMILY-ADVISEMENT)
reopen           PASS  64 authorities: tip == pin 49, tip moved / file identical 11, tip moved / file changed 3 (V8
                       flags, EVIDENCE-OBLIGATIONS, FACTORY-CONTRACTS: clause unchanged or moved, identical text), local 1;
                       pins 63 match; clause UNCHANGED 62, MOVED 1, no key 1; no maturity drift (FRONTIER-SOURCES-AT-PIN,
                       MEMORY64-FINISHED, WASM-SET-PHASE-1, WASM-THREADS-PHASE-4).  Published hosts still DENIED (53)
lineage          PASS  14 commits from 4a151c9: 11 Factory commits (1 parent each) and 3 owner PR merges; nothing else
                       (FF-ONLY-INTEGRATION, WORKPIECE-ISOLATION)
paths            PASS  no dead wildcard surface (SURFACES-LITERAL-ENFORCED)
status           PASS  status scan and handoff check (STATUS-INVENTORIED, HANDOFF-MODEL-INDEPENDENT)
failed           none: no INVALIDATED_BY was written
```

## 5. Graph and gates

```text
epoch D19   40 nodes / 158 edges: ENV-D19-HOST, -BROWSER-DEFAULT, -BROWSER-GPUFLAGS, -SOURCES; IMPL-REPROVE;
            PROBE-ENV-IDENTITY, PROBE-REPROOF-SELECTION; the EVIDENCE nodes; FACT-D19-ENVIRONMENT-IDENTITY,
            FACT-D19-LAUNCHED-EXECUTABLE, FACT-D19-MINIMUM-SET [RUN]; FULFILLS declared
merged      1141 nodes / 2572 edges; merge-check PASS (211 base nodes identical, 475 base edges present, graph ==
            merge of base and epochs D12..D19); render-check PASS; validate PASS 42
stale       204 STALE_IF relations over 21 dimensions (D18R 163): the re-proved facts are now also stale against the
            D19 environments in the dimensions they were stale in before
Q21         38 reconciliations; the D19 obligations R-03, R-04, R-49, R-53 carry fulfilled_by D19 evidence
gate        tests/reprove/gate.mjs PASS: selection_complete (29 of 90), reproved (29 with D19 evidence),
            obligations_fulfilled (4), identity_recorded, claim_surface (50 RUN claims: 49 claimable, 1 invalidated;
            29 re-proved in D19)
other gates D18 gate PASS (36 reconciliations, 35 surfaces), D18R gate PASS, D16 capability gate PASS, D17 implementation
            gate PASS - all on the D19 graph
```

## 6. Entitled-claim surface (Q22, evidence/D19/envmap/queries/Q22.json)

```text
current facts   112 (109 + the 3 D19 facts): RUN 50, OBS 43, GAP 10, ERR 4, UNK 5
RUN claims      49 claimable, each bounded to the environments of its newest physical evidence; 1 invalidated by
                design (FACT-GPU-ADMITTED-E0 by EV-D7-ADM-E1-WEBGPU, falls back to FACT-WASM64-ADMITTED-E1)
newest proof    26 RUN claims rest on D19 evidence (23 re-proved + 3 new), the rest on D12 (12), E0/E1 (8), D13 (2),
                D17 (1), D18 (1)
traversal       COMPLETE 20; stops at IMPLEMENTATION CONTRACT 17, CURRENT AUTHORITY 6, EXACT CLAUSE 5, PROJECT
                CONSTRAINT 2 - each stop is explicit ([GAP] in docs/HANDOFF.md section 6)
explicit stops  open: GAP 8, ERR 4, UNK 5; closed by later evidence: FACT-TOOLCHAIN-DRIFT, FACT-WILDCARD-SURFACES-DEAD
OBS             43 observations: not execution claims
```

## 7. Hygiene

```text
status scan   2378 files, 5591 occurrences, 0 unclassified: PASS.  4 earlier inventories excluded (D13, D18, D18R,
              D19 status-reprove); inventory 784 KB (D18R 1.5 MB).  The growth recorded in D18R is gone
handoff check PASS
audit         W21 (integrated) RETIRABLE -> REMOVED; after: RETIRABLE 0, KEEP 9 (W11/W14/W16..W21-stage,
              factory-bootstrap-bin), CURRENT 2 (W22, W22-stage)
```

## 8. Intended vs observed

```text
P1  MATCH   toolchains, node, git, Playwright and browser build as recorded; executable launched = headless_shell of
            chromium_headless_shell-1194 for both launches
P2  MATCH   29 of 90 (environment 6, implementation 27, obligation 4), gaps 0; drift only ENV-D9-HOST (2 dimensions)
            and ENV-D14-HOST (tips); UNK 9; the same 3 tips moved as at assembly
P3  MATCH   every group PASS: qualified proof 21/21 and mutants 8/8 RUN; exec identity equal under both install names;
            D15 60 / D16 90 VERIFIED; no CHANGED or NOT_FOUND clause; phases unchanged; lineage fast-forward with owner
            merges only; no dead wildcard surface; status scan PASS with the earlier inventories excluded (784 KB);
            handoff check PASS
P4  MATCH   epoch 40 / 158 (about 40 / 160), merged 1141 / 2572 (about 1141 / 2574); validate PASS 42; D11-D18R
            preserved
P5  MATCH   gate PASS; R-03, R-04, R-49, R-53 fulfilled_by D19 evidence
P6  MATCH   Q22 112 current facts; RUN 50 = 49 + 1; 29 re-proved in D19; COMPLETE 20.  DIFFER in presentation (two closed
            [GAP] statements shown as open) -> [ERR] -> repaired inside the run by F11 before the graph was built
P7  MATCH   status scan, handoff check, D16/D17/D18/D18R gates PASS; W21 RETIRABLE -> REMOVED
STRUCTURE MATCH  no earlier node, epoch, register or evidence changed (merge-check, must_not_change); law untouched;
                 build outputs outside the repository (/home/user/factory-builds/)
```

## 9. Current reading

```text
[RUN]  FACT-D19-MINIMUM-SET: 90 current RUN/OBS facts evaluated; 29 selected, 29 re-proved, 0 failed, 0 without a
       runbook entry; the other 61 keep their evidence
[RUN]  FACT-D19-ENVIRONMENT-IDENTITY: 114 of 130 stale conditions SAME, 7 DRIFT, 9 UNK
[RUN]  FACT-D19-LAUNCHED-EXECUTABLE: /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
[OBS]  rustup "nightly" moved (6bb1652a0, no clippy).  No claim depends on the rustup name: the proof sets bind
       +1.94.1 and +nightly-2026-09-24
[UNK]  9 historical stale conditions stay undecidable; the records are kept (docs/HANDOFF.md section 6, B)
[NEW]  procedure rule: a closed [GAP]/[ERR]/[UNK] statement is history, not an open stop (docs/HANDOFF.md section 4)
```

GATE: PASS - the refreshed model survives execution.  Every claim whose evidence the graph showed as possibly stale was
re-run physically in the current environment and passed, with D19 evidence.  Every D19 obligation is fulfilled.  Every
current RUN claim is claimable within its evidence environments, or invalidated by design.  Every other current fact
ends at an explicit [GAP]/[ERR]/[UNK], or is an observation.  The one defect found during the run was repaired before the
graph was built.  No internal chain defect is open.  The stable baseline is design/materialization/D19-STABLE-BASELINE.md.
