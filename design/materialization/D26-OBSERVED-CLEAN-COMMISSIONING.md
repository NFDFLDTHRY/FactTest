# D26 - Observed Clean Whole-Repository Commissioning vs Intended

STATUS: RE-OBSERVATION OF THE D26 WORKPIECE (W32 on canonical base 2c0aeda18d0b42eb97fa060f5603b65e986851cb, the
D25-PHYSICAL-RUNTIME integration; judged by the D22 Factory)
LAW: compares D26-INTENDED-CLEAN-COMMISSIONING.md (sections 0-8) with the Factory run
(factory/receipts/D26-CLEAN-COMMISSIONING/, evidence/D26/).  INTENDED -> EXECUTION -> EVIDENCE -> OBSERVED.

## 1. Station run

```text
F0-doc       S-DOC       PASS  intended ASCII (STRUCTURAL CHECK: PASS); ledger (D25 AFTER, D26 BEFORE); nothing else
                               differs from 2c0aeda
F1-fixture   S-FIXTURE   PASS  runbook (groups manifest, physical, the crate DAG in qualified-proof, the D20 replay in
                               process, REPROVE_TARGET/REPROVE_KERNELS; 115 fact entries), obligations (R-65),
                               tests/audit/, concat-epochs.mjs, facts/D26.json, components.json (70; TEST-AUDIT;
                               KERNEL-LADDERS -> S-RUST), issues.json (37): syntax, JSON, generic, as intended
F2-browser   S-BROWSER   PASS  identity: 4 toolchains, 45 source tips (6 moved), HeadlessChrome/141.0.7390.37
F3-evidence  S-EVIDENCE  PASS  selection over the D25 graph: 169 evaluated, 101 selected (environment 70,
                               implementation 39, obligation 1), gaps 0, unmapped 0
F4-build     S-BUILD     PASS  fresh build directories; qualified proof 27 (PASS 22 / OBS 3 / HEURISTIC 2, mutants
                               RUN) + crate DAG 14 crates / 1011 tests; kernels == pin ef5d886a...; physical:
                               specimens 4, attacks 13, anti-cheat clean, run-webapp PASS; identity group PASS;
                               Factory witnesses PASS (29 tests, 16 of 16 reasons, 5 of 5; judge fb212497...) and
                               the collision witness PASS
F5-build     S-BUILD     PASS  clauses, reopen, ingress (the moved tips), lineage, status, paths, manifest
                               (rebuild-check at 2c0aeda), process (D19 and D20 replays): 11 groups, 101 facts
                               re-proved, 0 failed
F6-doc       S-DOC       PASS  design/execution-manifest rebuilt at 2c0aeda + additions (4434 files, 70 components);
                               deterministic; the record texts delivered (SCHEMA, ENVIRONMENT-MAP, HANDOFF incl. the
                               LICENSE register line, README, D26-STABLE-BASELINE)
F7-evidence  S-EVIDENCE  PASS  evidence/D26/{manifest, issues, gate}.json; gate PASS (37 issues)
F8-evidence  S-EVIDENCE  PASS  preview: the re-proof fragment on a temporary graph; consistency audit 13 checks PASS;
                               final condition 21/21 PASS
F9-doc       S-DOC       PASS  epochs/D26.json = re-proof fragment + facts fragment: 68 nodes / 340 edges (ENV 4,
                               EV 55, FACT 6, IMPL 1, PROBE 2); graph 1420 / 3823; views
F10-evidence S-EVIDENCE  PASS  validate 42, Q01-Q22, stale 527, merge-check, render-check, Q22 check (197 current
                               facts), D18/D18R/D20-SYNC/D23/D24 gates, capability + implementation gates, status
                               scan, handoff check, audit -> retire -> audit (W31 REMOVED; W30 KEEP), cleanup gate;
                               the audit and the final condition recomputed on the committed graph, identical to the
                               preview (13 PASS, 21 PASS); index (64 files)
F11-doc      S-DOC             this record
ROUTE  MATCH  no refusal, no re-run.  Four dry runs on a detached worktree at 2c0aeda preceded the route: they found
              the selector's three unmapped D20 process facts (the D20 replay added to the runbook), two fixture
              defects of the delta (an epoch-list substitution, the audit's treatment of the running delta), an
              evidence-id collision between the re-proof fragment and the facts fragment (the facts cite only records
              the re-proof does not bind), an ordering defect (the audit records must exist before the epoch that
              cites them: the preview station) and a register-order defect (the handoff must be delivered before the
              audit reads it); all repaired before routing; every fixture command then passed.
```

## 2. The pipeline observed (evidence/D26)

```text
CURRENT CANONICAL TREE      W32 at 2c0aeda; compiler/, host/, factory/, fixtures/ byte-identical to the base
CURRENT EXECUTION MANIFEST  4434 files, 70 components, gate PASS; deterministic rebuild
FACTORY SELF-CHECK          witnesses PASS (every refusal reason; judge built from this tree), collision PASS
QUALIFIED TOOLCHAIN PROOF   27 obligations: PASS 22, OBS 3, HEURISTIC 2, FAIL 0; mutants 8 of 8 refused
COMPILER DAG                14 crates in dependency order; 1011 test executions, 0 failed
ABI / HOST BOUNDARY         Q-WASM-08 PASS: BUILD + OBSERVE in Chromium byte-identical to factc
MULTI-SPECIMEN COMPILATION  4 specimens x 15 checks PASS + 4 cross-specimen checks
INDEPENDENT VERIFICATION    every certificate PASS; 13 attacks refused / control accepted; anti-cheat clean
GENERATED BUNDLES           4 fresh bundles, integrity vs bundle.json, tamper detected
PHYSICAL BROWSER EXECUTION  4 x 3 shell-driven configurations PASS with the specimens' expectations
LOSS / RESELECTION / OFFLINE loss witnessed and stale plans invalidated on all four; selfhost P01/P04 RUN (P07 GAP,
                            P10 OBS as before); public HTTPS UNREACHABLE (boundary recorded)
EVIDENCE INDEX              64 files
ENVIRONMENT GRAPH EPOCH     D26: 68 / 340; graph 1420 / 3823
Q01..CURRENT                22 queries; entitled-claim surface Q22: 197 current facts (RUN 126, OBS 49, GAP 12,
                            ERR 5, UNK 5); 101 re-proved in D26
STALE_IF re-proof           169 evaluated, 101 selected, 101 re-proved through 11 runbook groups, 0 failed
consistency audit           13 checks PASS (I-37 repaired first)
final condition             21 lines PASS (preview and committed graph identical; re-inspection recomputes)
```

## 3. Intended vs observed

```text
P1  MATCH   identity 4 / 45 (6 moved); selection 169 / 101 (70 / 39 / 1); SAME 147 / DRIFT 70 / UNK 14; gaps 0
P2  MATCH   proof 27 (22/3/2, mutants RUN); crates 14 / 1011; kernels == pin; specimens 4, attacks 13, anti-cheat
            clean, physical PASS; witnesses PASS (judge fb212497...); collision PASS
P3  MATCH   11 groups, 101 facts re-proved, 0 failed
P4  MATCH   4434 files, 70 components, tiers as predicted, unassigned 0, byte-identical; gate PASS, 37 issues
P5  MATCH   preview audit 13 PASS; final condition 21/21
P6  MATCH   epoch 68 / 340 (ENV 4, EV 55, FACT 6, IMPL 1, PROBE 2); merged 1420 / 3823; validate 42
P7  MATCH   Q22 197 (RUN 126, OBS 49, GAP 12, ERR 5, UNK 5); 126 = 125 + 1; 101 re-proved; stops GAP 10, ERR 5,
            UNK 5; stale 527; audit + final condition identical on the committed graph
P8  MATCH   status scan PASS, handoff PASS, gates PASS; W31 REMOVED; index 64
STRUCTURE MATCH  compiler/, host/, factory/, fixtures/ byte-identical to 2c0aeda (I2); no historical build output
                 consumed (I1: fresh directories); historical evidence untouched (final-condition line 19 by git diff)
```

## 4. Current reading

```text
[RUN]  FACT-D26-WHOLE-SYSTEM-COMMISSIONED: the complete implemented system from the canonical source on a clean
       workpiece with fresh builds, physically executed, indexed, graphed and queried
[RUN]  FACT-D26-CONSISTENT: the five equalities hold as computed; the one contradiction found (I-37) repaired first
[RUN]  FACT-D26-FINAL-CONDITION: the 21 lines of the six-task final condition PASS from named evidence
[RUN]  FACT-D26-ENVIRONMENT-IDENTITY, -LAUNCHED-EXECUTABLE, -MINIMUM-SET: the pass's process facts
[OPEN] the boundary rows of docs/HANDOFF.md section 6 and the open issues (D/E/F/G only): I-12, I-13, I-18, I-29,
       I-33 (owner), I-15 (D), I-16 (E), I-02, I-03, I-04, I-17 (F); FACT-D25-PUBLIC-HTTPS [UNK] awaits an external
       run (tests/physical/PUBLIC-HTTPS-PROBE.md)
[NEXT] none: the series is closed; design/materialization/D26-STABLE-BASELINE.md is the implementation baseline
```

GATE: PASS - the current repository manufactures, verifies and executes its complete implemented system from the
canonical source without undocumented historical state: every rung of the prompt's pipeline ran on a clean workpiece
with fresh builds, the graph's STALE_IF traversal selected 101 claims and every one was re-proved, the five
consistency equalities and the 21 lines of the six-task final condition are computed PASS from named evidence, and
every remaining GAP/ERR/UNK is a capability, external, historical, conflict, environmental or owner-decision boundary.
Task 6 of 6 closed; series closed.  FINAL CLAIM: CURRENT SOURCE -> FACTORY ROUTED -> IMPLEMENTATION EXECUTED ->
GENERICITY ATTACKED -> PHYSICALLY OBSERVED -> STALE CLAIMS RE-PROVED -> CONSISTENCY AUDITED -> BOUNDARIES EXPLICIT.
