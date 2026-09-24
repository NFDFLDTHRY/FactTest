# D17 - Observed Implementation Reality vs Intended

STATUS: RE-OBSERVATION OF THE D17 WORKPIECE (W19 on canonical base e4e210304591d99f73873dc719b79f187c4d19a1)
LAW: compares D17-INTENDED-IMPLEMENTATION-REALITY.md (sections 1-3, 7) with the Factory run (factory/receipts/
D17-IMPLEMENTATION-REALITY/, evidence/D17/).  The intended drawing is not rewritten.

## 1. Station run

```text
F0-doc       S-DOC       PASS   intended ASCII + ledger (D16 AFTER, D17 BEFORE); nothing else changed
F1-fixture   S-FIXTURE   PASS   pinned/local clause sources, D17 manifest, tests/implementation/, envmap (behaviour checks,
                                Q20, Q18 implementation clauses); tools generic; D15 and D16 epochs rebuild byte-identically;
                                the D16 graph validates, renders, merges and answers Q01-Q19 byte-identically to D16's evidence
F2-build     S-BUILD     PASS   44/44 implementation clauses VERIFIED over 28 source documents, every sha256 equal to assembly
F3-build     S-BUILD     FAIL -> PASS  (see ROUTE); F7-fixture S-FIXTURE, F8-build S-BUILD, F9-doc S-DOC: repair fixtures, PASS
F4-doc       S-DOC       PASS   epochs/D17.json from the Factory evidence (base graph re-merged D11..D16 for determinism);
                                graph merged; views rendered; SCHEMA section 10, ENVIRONMENT-MAP section 9 written inside the run
F5-evidence  S-EVIDENCE  PASS   validate (35 checks), Q01-Q20, stale, merge-check, render-check, implementation gate, Q18 and
                                Q20 gates; audit -> retire -> audit; evidence index
ROUTE  [ERR -> repaired, twice]  (1) F3's close FAILED: tests/implementation/label-audit.mjs wrote
       evidence/D17/labels/audit.json without creating the directory (the assembly trial had written into an existing
       scratch directory).  The kernel builds in the same station had passed; all 12 findings had resolved.  The tool was
       fixed and F1 and F3 were RE-RUN: both PASS.
       (2) the first `factory verify` then FAILED no_unreceipted_change on 14 paths: a receipt records only the changes
       of its fixture's LAST run, so the re-runs replaced F1's and F3's receipts with ones covering just the repaired
       tool and the audit file, and the other F1 tools and F3's kernel evidence lost their receipts.  Integration refused.
       This second repair followed the D14 pattern: the 14 paths restored to their base state, three NEW fixtures added
       to the delta (delta-owned records) - F7-fixture re-applied the tools, F8-build rebuilt the kernel evidence
       (byte-identical to what F4 consumed), F9-doc wrote this record - and verify re-run.  F7's first run FAILED
       because its regression command, copied from F1, still merge-checked against D12..D16 while the workpiece graph was
       already the D17 merge; its paths were restored to base again, the command corrected (D12..D17), and F7 re-run.  Procedure rule adopted
       (docs/HANDOFF.md section 4): repair with a new fixture; never re-run a fixture to repair.  Every station open was
       checked before copying; the restores were to base state only.
```

## 2. Implementation sources and physical results

```text
pins        Chromium 141.0.7390.37 = 9f043f63 (17 documents incl. DEPS), V8 ad8af0fc = 14.1.146.11 and 8ab91836 =
            12.4.254.21, SwiftShader 7cd1022, rust 6eeff9a52 (target spec + platform doc), cargo 98a09e7e7,
            rust-lang/llvm-project 1b9c0d5 (2 files), installed playwright-core 1.56.1 (3 files); 26 implementation
            AUTHORITY nodes pinned to what was read
kernel      rustc 6eeff9a52 / LLVM 23.1.1 / cargo 98a09e7e7: INSTALL-PINNED (nightly-2026-09-24) 6f25ce43...,
            INSTALL-RENAMED (same toolchain bind-mounted as "nightly" in a private mount namespace) 309589947e...;
            differing sections exactly [custom:name]; identity excluding it e8d6582665ea1880... for both.  Outside the
            namespace the "nightly" toolchain is unchanged (6bb1652a0)
labels      12 findings, 12 locations proven verbatim at the base, 6 MISLABEL, 0 unresolved
```

## 3. Graph and gate

```text
epoch D17   151 nodes / 261 edges: 44 CLAUSE, 26 AUTHORITY, 19 IMPLEMENTATION_BEHAVIOR, ENV-D17-HOST, ENV-D17-TOOLCHAIN,
            kernel and label-audit probes/harnesses/evidence, 9 facts (FACT-D17-CLAUSES-VERIFIED [RUN],
            FACT-KERNEL-EXEC-SECTIONS-INSTALL-INDEPENDENT [RUN], FACT-IMPL-PINS-NOT-RUNNING-VERSION [ERR], 6 FACT-LBL-* [ERR]);
            SOURCED_BY 49, RELATES_TO_STANDARD 26, EXPLAINS 42, STALE_IF 23 (21 implementation-grounded on existing facts)
merged      1042 nodes / 2106 edges; merge-check PASS; render-check PASS; validate PASS 35 (behavior_vocabulary,
            behavior_sourced_by_implementation, behavior_standard_is_not_implementation all PASS)
gate        PASS: behaviors_in_graph (19), census_absences_explained (6/6), labels_resolved (12; 6 [ERR] facts),
            kernel_difference_scoped ([custom:name])
```

## 4. Q20 (evidence/D17/envmap/queries/Q20.json) and Q18

```text
Q20   19 behaviours: PLATFORM_DEFAULT 3, FLAG_GATED 2, CONFORMS 1, HOST_CHOICE_PERMITTED 2, EXPERIMENTAL_NOT_SHIPPED 3,
      NOT_IMPLEMENTED 1, SHIPPED 1, TEST_HARNESS_CHOICE 3, VERSION_SPECIFIC 1, TOOLING 2; 39 observed facts explained;
      census absences: SharedArrayBuffer <- IB-SAB-CONSTRUCTOR-HOOK, WebNN <- IB-WEBNN-OFF-BY-DEFAULT, Magnetometer and
      Ambient light <- IB-SENSOR-EXTRA-CLASSES, Proximity <- IB-PROXIMITY-UNIMPLEMENTED, Bluetooth <-
      IB-BLUETOOTH-PLATFORM-DEFAULT
Q18   115 claims; RUN 45: COMPLETE 14; stops at IMPLEMENTATION CONTRACT 18 (+ KERNEL-EXEC-SECTIONS-INSTALL-INDEPENDENT: no
      contract names kernel identity), CURRENT AUTHORITY 6 (+ D17-CLAUSES-VERIFIED), EXACT CLAUSE 4, REPRODUCIBILITY PIN 1,
      STALE CONDITIONS 1, PROJECT CONSTRAINT 1; non-RUN 70: OBS 43, GAP 12, ERR 11 (+6 label, +1 pin), UNK 4
```

## 5. Hygiene

```text
audit-before  RETIRABLE 1 (W18 worktree), KEEP 6 (W11/W14/W16/W17/W18-stage, factory-bootstrap-bin), CURRENT 2
retire        W18 REMOVED; audit-after RETIRABLE 0, KEEP 6, CURRENT 2 (W19, W19-stage), ABSENT 18
```

## 6. Intended vs observed

```text
P1  MATCH   44/44 VERIFIED; every pinned sha256 equal to the assembly read
P2  MATCH   6f25ce43 / 309589947e, only [custom:name] differs, e8d65826 for both; label audit 12 / 6 MISLABEL / 0 unresolved
P3  MATCH   151 / 261; 1042 / 2106; validate PASS 35; D11-D16 preserved
P4  MATCH   gate PASS (19 behaviours, 6/6 absences, 6 [ERR] facts, kernel scoped)
P5  MATCH   45 RUN claims, 14 COMPLETE; KERNEL-EXEC at IMPLEMENTATION CONTRACT; EXACT CLAUSE 4; ERR 11
P6  MATCH   Q20 19 behaviours with the predicted relation counts; 39 facts explained
P7  MATCH   W18 RETIRABLE -> REMOVED; W18-stage KEEP; after RETIRABLE 0, KEEP 6, CURRENT 2
DRAWING [ERR, editorial] intended section 0 says "29 source documents"; assembly and Factory both read 28.  A counting
        error in the drawing; recorded here, not rewritten there.
ROUTE   DIFFER  F3 failed once on a tool defect of this delta; the re-run repair then broke receipt coverage and was
        repaired again through new fixtures F7/F8/F9 (section 1)
STRUCTURE MATCH  no law document, README, earlier node/epoch or D0-D16 artifact edited; the mislabelled texts are left for
                 D18; every behaviour three-layered (Q20); implementation never cited as standards law (validate)
```

## 7. What the implementations actually do (carried forward)

```text
[NEW]  Chromium/Linux decides most of the capability picture: WebGPU service off (unsafe switches + SwiftShader make a
       Software/CPU fallback adapter), WebBluetooth experimental, SensorExtraClasses and DeviceOrientationRequestPermission
       experimental, WebNN feature off, no proximity IDL, SharedArrayBuffer constructor only when isolated
[NEW]  FactTest never ran Chrome: every browser fact comes from chromium-headless-shell (rev 1194), with field trials and
       third-party storage partitioning disabled, and a permission manager that answers ASK to everything; installed-app
       durability (full Chrome grants installed/important sites) is [UNK]
[RUN]  kernel executable sections are install-path independent; only LLVM's promoted-symbol names (custom name section)
       carry the install path (IB-KERNEL-NAME-SECTION-HASH)
[OBS]  "V8 supports memory64" is per version: V8 14.1 shipped (no flag), Node 22's V8 12.4 experimental and off
[ERR]  D11's implementation pins are not the versions run; 6 MISLABEL findings with corrections (FACT-LBL-01, LBL-06, LBL-07, LBL-10,
       LBL-11, LBL-12)
[GAP]  Dawn 9caf493 source unreachable; SW/storage internals beyond permissions not source-traced
[UNK]  Android/ChromeOS/Mac/Windows behaviour (defaults differ; never observed)
```

GATE: PASS - standards law, implementation behaviour and observed runtime are separated and relationally connected: 19
behaviours each rest on implementation clauses pinned to the version FactTest ran, stand in a stated relation to the
standard clauses or constraints, and explain the observed facts they account for, with implementation-grounded stale
conditions (Q20; validate enforces the layer rules).  Carried across the gate: 6 MISLABEL corrections, implementation
re-pins, kernel identity definition, PROPOSED constraints, stale claims (all D18); Dawn and SW internals [GAP];
installed Chrome and non-Linux platforms [UNK].  No internal chain defect is open.  Next: D18-REPO-RECONCILIATION.
