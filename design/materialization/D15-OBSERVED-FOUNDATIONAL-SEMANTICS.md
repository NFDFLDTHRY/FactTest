# D15 - Observed Foundational Semantics vs Intended

STATUS: RE-OBSERVATION OF THE D15 WORKPIECE (W17 on canonical base 46cc28be1486798635eac42a6955dedaba36673f)
LAW: compares D15-INTENDED-FOUNDATIONAL-SEMANTICS.md (sections 0, 3, 5, 7) with the Factory run (factory/receipts/
D15-FOUNDATIONAL-SEMANTICS/, evidence/D15/).  The intended drawing is not rewritten.

## 1. Station run

```text
F0-doc       S-DOC       PASS   intended ASCII + ledger (D14 AFTER, D15 BEFORE); nothing else changed
F1-fixture   S-FIXTURE   PASS   lib, reopen refactor, clause extractor, clause epoch builder, regression witness,
                                manifest (60 clauses, 11 traces), envmap (clause checks, Q18); the tools name no
                                authority, fact, constraint or clause; D14 tools and review byte-identical; the D14
                                graph still validates (27 checks), renders and merges identically
F2-build     S-BUILD     PASS   clause extraction at the tips: 60/60 VERIFIED over 31 source documents in 21
                                repositories; reopen refactor witness: 64 records, disallowed differences none
F3-doc       S-DOC       PASS   epochs/D15.json built from the Factory evidence; graph merged; views rendered;
                                SCHEMA section 8 and ENVIRONMENT-MAP section 7 written inside the station run
F4-evidence  S-EVIDENCE  PASS   validate (30 checks), Q01-Q18, stale, merge-check, render-check, Q18 gate; audit ->
                                retire -> audit; evidence index
ROUTE        every station open's exit status checked before any copy (D14 rule); no refusal; no unreceipted write
ENVIRONMENT  judge sha256 bb1475ba...; linux x86_64 6.18.44; git 2.43.0; node v22.22.2; curl 8.5.0 (receipt
             format 2, environment_identity in every receipt); sources through raw.githubusercontent.com + git
```

## 2. Clause result (evidence/D15/clauses/, observed by the Factory)

```text
clauses      60 VERIFIED / 60: every clause located at its source tip and every quoted phrase present
traces       R W S T I H F P ST MF G (11)
sources      31 documents, 21 repositories; every tip equal to the tip read in assembly (no source moved between
             assembly and the Factory run)
identity     each record: repo, commit, path, file sha256, lines, derivation, enclosing section, excerpt sha256
regression   the refactored reopen probe re-run on the D14 input graph (5e57467) reproduces all 64 D14 records;
             differing fields only .source_tip.commit (11: moved tips) and .coarse.candidates.section.* (1: the
             [[x]] rule restricted to .adoc - the D14 #CSP3 candidate no longer appears); published 53 DENIED + 2 x 403
             + 1 OPENED, 51 TIP == PIN, clauses 62 UNCHANGED / 1 MOVED / 1 no key: D14's frontier unchanged
```

## 3. Graph (design/environment-map/)

```text
epoch D15   145 nodes / 305 edges: 60 CLAUSE, 61 EVIDENCE (60 extraction + summary), 10 AUTHORITY, 6 CONSTRAINT
            (PROPOSED), 5 COMPUTATIONAL_FACT, ENVIRONMENT, PROBE, IMPLEMENTATION; declares CLAUSE, CLAUSE_OF,
            GROUNDS, LEADS_TO, EXTRACTED_IN
merged      586 nodes / 1100 edges = merge(D11 @ fdb9c32, D12, D13, D14, D15); merge-check PASS (211 D11 nodes
            identical, D11 edges present, graph == merge); render-check PASS; validate PASS 30 checks
rebuild     the reinspect command rebuilds epochs/D15.json from the committed evidence and compares bytes
```

## 4. Q18 claim traversal (evidence/D15/envmap/queries/Q18.json)

```text
71 claims    RUN 42: COMPLETE 10 - CORE-ONLY-GRAPH, GPU-EXPOSED, JS-I64-BIGINT-MEMBRANE, LOOPBACK-SECURE-CONTEXT,
                       MEMORY64-DISCOVERED, WASM64-ABI-EXEC, WASM64-ADMITTED-E0, WASM64-ADMITTED-E1,
                       WASM64-MODULE-I64, WORKPIECE-ISOLATION
                     stops at EXACT CLAUSE 11 - the seven GPU facts (WebGPU clauses: D16) + four process facts
                       (HANDOFF-MODEL-INDEPENDENT, RESELECTION-NO-CODEGEN, STATUS-INVENTORIED,
                       SURFACES-LITERAL-ENFORCED: grounded in project law, which has no clause extraction: D18)
                     stops at IMPLEMENTATION CONTRACT 15 - eleven self-hosting / platform facts whose realization is
                       a probe harness, not a contract (ten SH-*, OPAQUE-FRAME-SECURE-CONTEXT), and COMPILE-FAIL-WITNESSED,
                       FIRST-PARTY-GRAPH, QUALIFIED-JUDGE-RERUN, WORKPIECES-AUDITED (D18: contract edges or [GAP])
                     stops at CURRENT AUTHORITY 4 - D15-CLAUSES-VERIFIED, FRONTIER-SOURCES-AT-PIN,
                       PROOF-SETS-DECLARED, TOOLCHAIN-PINNED (process facts authorized by law, not an external
                       authority: D18)
                     stops at STALE CONDITIONS 1 - FF-ONLY-INTEGRATION;  PROJECT CONSTRAINT 1 - SH-SW-GRANTS-COI
             non-RUN 29 terminate at their own status: GAP 12, OBS 9, UNK 4, ERR 4
limitation   [OBS] the EXACT CLAUSE step accepts a clause that grounds the claim OR one of its constraints (clause
             relevance is constraint-level): e.g. COMPILE-FAIL-WITNESSED reaches CL-R1/R2/R5 through CON-RS-001.
             Whether each constraint-level clause is the claim's own ground is a D18 review item, not asserted here.
```

## 5. Hygiene

```text
audit-before  RETIRABLE 1 (W16 worktree), KEEP 4 (W11-stage, W14-stage, W16-stage, factory-bootstrap-bin), CURRENT 2
retire        W16 REMOVED (integration 46cc28b, verification PASS, reinspect MATCH)
audit-after   RETIRABLE 0, KEEP 4, CURRENT 2 (W17, W17-stage), ABSENT 16
```

## 6. Intended vs observed

```text
P1  MATCH   60/60 VERIFIED; no source tip moved between assembly and the Factory run
P2  MATCH   epoch 145 / 305; merged 586 / 1100; validate PASS 30; D11-D14 preserved
P3  MATCH   42 RUN claims, 10 COMPLETE, every other RUN claim stops at a named step (11 / 15 / 4 / 1 / 1);
            29 non-RUN terminate at their status (GAP 12, OBS 9, UNK 4, ERR 4)
P4  MATCH   64 records; differing fields only .source_tip.commit and .coarse.candidates.section.*
P5  MATCH   W16 RETIRABLE -> REMOVED; W16-stage KEEP (D14 pre-binding drafts); after: RETIRABLE 0, KEEP 4, CURRENT 2
DRAWING [ERR, editorial] intended section 0 says "29 documents"; the Factory extraction read 31 source documents in
            21 repositories (the section 0 list names the 21 repositories).  A counting error in the drawing; no
            structure or prediction depends on it; recorded here, not rewritten there.
STRUCTURE MATCH  no law document, earlier node, earlier epoch or D0-D14 artifact edited; constraints PROPOSED only;
                 proposals kept at their phase (CL-T2 Phase 4, CL-T3 Phase 1); ERR-001 kept as a current [ERR];
                 host behaviour labeled as host behaviour (FACT-SAB-GLOBAL-HOST-DEFINED [OBS])
```

## 7. What the foundation currently requires (carried forward)

```text
[ERR] ERR-001 current      rustc wasm64 page (rust-lang/rust main 3670d25) still says memory64 "not standardized";
                           Core 3.0 (CL-W4) standardizes it; CON-RS-003 keeps the Core authoritative
[NEW] CON-WA-006           i64 crosses the JS membrane as BigInt (CL-W7/W8/W9, CL-I3/I4); FactTest obeys it
[NEW] CON-SEC-002          secure context (top-level creation URL) and opaque origin are separate questions
[NEW] CON-PP-001           'self'-default features disabled in opaque frames unless the container grants them
[NEW] CON-SW-001           updates bypass the service worker; a failed install keeps the active worker
[NEW] CON-ST-001           buckets start best-effort; storage pressure may clear them
[GAP] CON-GIT-001          tree-entry order undocumented (CL-G3); equality with git proven only where observed
[OBS] SAB global           host-defined presence (CL-T6); serialization standard-gated (CL-T4)
```

GATE: PASS - D15 knows what the foundational authorities currently say, clause by clause, at named source commits,
and which claims those clauses reach (Q18).  Carried across the gate explicitly: ERR-001 current; the git tree-order
[GAP] (implementation source -> D17); SAB global host behaviour [OBS] (Chromium source -> D17); published renderings
[UNK] (network policy); six PROPOSED constraints and the Q18 CURRENT AUTHORITY / IMPLEMENTATION CONTRACT stops (-> D18);
the Q18 EXACT CLAUSE stops of the GPU facts (-> D16).  No internal chain defect is open.
Next: D16-CAPABILITY-UNIVERSE.
