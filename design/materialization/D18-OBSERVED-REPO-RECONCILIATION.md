# D18 - Observed Repository Reconciliation vs Intended

STATUS: RE-OBSERVATION OF THE D18 WORKPIECE (W20 on canonical base 715ac92d327f5f2677fd7c0b067fa843da6323c4)
LAW: compares D18-INTENDED-REPO-RECONCILIATION.md (sections 1-8) with the Factory run (factory/receipts/
D18-REPO-RECONCILIATION/, evidence/D18/).  The intended drawing is not rewritten.

## 1. Station run

```text
F0-doc             S-DOC             PASS  intended ASCII, ledger (D17 AFTER + D18 BEFORE), bootstrap station
                                           S-ANNOTATE-OWNER (surfaces exactly CAPABILITY-MATRIX.md, BOOTSTRAP-TESTS.md,
                                           receipts); nothing else changed
F1-fixture         S-FIXTURE         PASS  tests/reconcile/, d18 clause manifest, envmap, proof.mjs, proof-sets.json; tools
                                           generic; the D17 graph validates (35), renders and merges identically and
                                           answers Q01-Q20 byte-identically to evidence/D17 (Q21: none); exec-identity
                                           check PASS on both D17 kernel builds (files anchored to builds.json)
F2-build           S-BUILD           PASS  2/2 clauses VERIFIED; KRN-D18-A/B PASS; stage audit
F3-annotate        S-ANNOTATE        PASS  REFERENCE-AUTHORITY +20, CONSTRAINT-LEDGER +107, CONFLICT-LEDGER +17,
                                           EVIDENCE-OBLIGATIONS +16, IMPLEMENTATION-CONTRACTS +12, STATION-REGISTRY +4;
                                           0 deleted lines; every hunk begins "D18 ANNOTATION"; FACTORY-LAW.md untouched
F4-annotate-owner  S-ANNOTATE-OWNER  PASS  CAPABILITY-MATRIX +6, BOOTSTRAP-TESTS +3; 0 deleted; G rows unchanged
F5-doc             S-DOC             PASS  README.md, docs/HANDOFF.md; handoff check PASS
F6-doc             S-DOC             PASS  epochs/D18.json built inside the run from the Factory evidence; graph merged;
                                           views rendered; validate, merge-check, render-check PASS
F7-evidence        S-EVIDENCE        PASS  validate 42, Q01-Q21, stale, merge-check, render-check, surfaces, reconciliation
                                           gate, Q18/Q21 gates, D16 capability and D17 implementation gates, status scan,
                                           handoff check, audit -> retire -> audit, evidence index
F8-doc             S-DOC                   this record
ROUTE  MATCH  every station open checked before copying; no refusal, no repair, no re-run (the D17 dry-run rule held: a
              scratch dry run of every fixture command at the base caught two gates that write into a missing directory
              before routing; the fixtures create evidence/D18/regress first)
```

## 2. Physical results

```text
clauses     CL-IMP-GPU0 (content_switches.cc kDisableGpu "disable-gpu") and CL-IMP-SSDOC (docs/gpu/swiftshader.md "which
            runs purely on the CPU") VERIFIED at chromium 9f043f63.  [OBS] the SwiftShader doc at 141 is byte-identical to
            D11's main pin (sha256 d3bb3011...); only the switch files differed between main 75d6f0c and 141
kernel     KRN-D18-A (INSTALL-PINNED, 6f25ce43...) and KRN-D18-B (INSTALL-RENAMED, 309589947e...) both PASS: exec identity
            e8d6582665ea1880... == proof-sets.json exec_identity; whole file equals the recording for its own install name
            (informational); module files anchored to evidence/D17/kernel/builds.json
stages      W11-stage KEEP (2 files not in history), W14-stage KEEP (3), W16..W19-stage SUPERSEDED (0), W20-stage CURRENT
```

## 3. Graph and gate

```text
epoch D18   56 nodes / 288 edges: 36 RECONCILIATION; 5 AUTHORITY (JSAPI-STORAGE-D18, WEBAPI-STREAMING-D18,
            RUSTC-WASM64-DOC-D18, RUSTC-WASM64-TARGET-SPEC-D18, LAW-CONSTRAINT-LEDGER) + 2 from the clause fragment;
            4 facts (SHARED-THREADS-UNADMITTED-D18 [ERR], WORKERS-D18 [GAP], SH-STORAGE-DURABILITY-D18 [UNK],
            FACT-KERNEL-IDENTITY-DEFINED-D18 [RUN]) + FACT-D18-CLAUSES-VERIFIED; 2 kernel-identity EVIDENCE;
            15 SUPERSEDES, 61 inherited edges, 22 register edges, 19 LEDGERED_IN, RECONCILES
merged      1098 nodes / 2394 edges; merge-check PASS (D11 base and every epoch preserved); render-check PASS;
            validate PASS 42 (reconciliation_vocabulary, reconciliation_has_subject, resolved_only_non_run_facts,
            supersession_well_formed, successor_carries_inherited_edges, ledgered_constraints_well_formed,
            stale_facts_reconciled all PASS); stale relations 162 over 21 dimensions
surfaces    35 PASS (8 insertion-only annotated files + 27 text surfaces)
gate        PASS: register_in_graph (36 / 15 / 19 / 22), ledger_text_present (19 verbatim), labels_resolved (6),
            stale_facts_reconciled (8/8), current_statements_clean, surfaces_pass
regression  D16 capability gate PASS (RUN 6, OBS 16, ERR 1, GAP 10 - no family left G); D17 implementation gate PASS
```

## 4. Q18 and Q21 (evidence/D18/envmap/queries)

```text
Q18   120 claims.  Current RUN 47: COMPLETE 20 (D17: 14, none lost) - new: FF-ONLY-INTEGRATION (stale condition
      declared), GPU-ADAPTER-SWIFTSHADER (authority set now pinned), PROOF-SETS-DECLARED and TOOLCHAIN-PINNED (authority,
      implementation and stale edges), KERNEL-EXEC-SECTIONS-INSTALL-INDEPENDENT (implementation contract),
      FACT-KERNEL-IDENTITY-DEFINED-D18; stops IMPLEMENTATION CONTRACT 17, CURRENT AUTHORITY 5 (clause and frontier process facts), EXACT CLAUSE 4
      (project facts cited at locator level), PROJECT CONSTRAINT 1 (SH-SW-GRANTS-COI).  [SUPERSEDED] 4, [RESOLVED] 7;
      current non-RUN: ERR 4, GAP 10, OBS 43, UNK 5
Q21   36 reconciliations: HOLDS 8, OPEN 5, SUPERSEDED 9, ANNOTATED 6, LEDGERED 1, RESOLVED 6, CORRECTED 1; stale facts 8/8
      re-examined; facts 120 = current 109 + superseded 4 + resolved 7; constraints 47, all LEDGER (19 through
      LEDGERED_IN); authorities 126, 11 superseded; obligations R-03, R-04, R-49 (D19), R-05, R-32 (capability work),
      R-19 (extraction work), R-43 (installed Chrome, [UNK])
```

## 5. Hygiene

```text
status scan    1872 files, 4993 occurrences, 0 unclassified: PASS;  handoff check PASS
audit-before   RETIRABLE 1 (W19 worktree), KEEP 7, CURRENT 2
retire         W19 REMOVED; audit-after RETIRABLE 0, KEEP 7 (W11/W14/W16/W17/W18/W19-stage, factory-bootstrap-bin),
               CURRENT 2 (W20, W20-stage), ABSENT 19
```

## 6. Intended vs observed

```text
P1  MATCH   2/2 VERIFIED; KRN-D18-A/B PASS with e8d65826...; stages W11 KEEP 2, W14 KEEP 3, W16..W19 SUPERSEDED
P2  MATCH   8 files insertion-only, marker-first hunks
P3  MATCH   56 / 288; 1098 / 2394; validate PASS 42; D11-D17 preserved
P4  MATCH   surfaces 35 PASS; gate PASS (36, 15, 19, 22; 6 labels; 8/8; clean)
P5  MATCH   120 claims; current RUN 47 with 20 COMPLETE; stops 17 / 5 / 4 / 1; SUPERSEDED 4, RESOLVED 7; ERR 4, GAP 10,
            OBS 43, UNK 5
P6  MATCH   Q21 36 rows; 120 = 109 + 4 + 7; constraints all LEDGER; 126 authorities, 11 superseded; D19 obligations
            R-03, R-04, R-49
P7  MATCH   D16/D17 gates PASS; status scan PASS; handoff check PASS; W19 RETIRABLE -> REMOVED, after RETIRABLE 0
ROUTE MATCH no refusal, no repair
STRUCTURE MATCH  no earlier node, epoch or D0-D17 evidence edited (merge-check); law documents insertion-only (numstat);
                 FACTORY-LAW.md, compiler/, host/, factory/src, fixtures/ unchanged (must_not_change)
```

## 7. The current model (carried forward)

```text
[NEW]  ONE current model: 15 superseded nodes stay as history and their successors carry every inheritable edge;
       Q18 and the rendered views show only current authorities; 6 label findings and the implementation-pin [ERR]
       are RESOLVED; 13 D12 facts carry their corrected environment reading (R-45)
[NEW]  19 constraints are project law (CONSTRAINT-LEDGER.md D18 section; LEDGERED_IN LAW-CONSTRAINT-LEDGER); no
       constraint remains PROPOSED
[RUN]  kernel identity is DEFINED: exec identity e8d6582665ea1880... (proof-sets.json exec_identity; proof.mjs
       kernel-identity; FACT-KERNEL-IDENTITY-DEFINED-D18, reconciliation R-49), install-name independent
[OBS]  the law documents cite their historical URLs with D13/D18 annotations; fixtures/commissioning/contracts.ascii
       keeps the historical js-api URL as commissioned compiler input
[GAP]  streaming delivery (R-05), worker admission and hardwareConcurrency (R-32), tool-document pins (R-19), git tree
       order (R-22), 17 RUN claims without an implementation contract in Q18
[UNK]  published frontier (R-18), #_worktrees (R-13), installed-Chrome durability (R-43), non-Linux platforms
[ERR]  ERR-001 current (R-20), ERR-002/ERR-003 shared threads (FACT-SHARED-THREADS-UNADMITTED-D18)
OWNER  D-10 sensor routing (R-31)
```

GATE: PASS - the repository expresses one coherent current model while retaining history: every Q17 fact and every
D17 carried item is re-examined along the seven-step traversal (Q21), stale current statements are superseded in the
graph (with inherited edges), replaced in the live handoff, or annotated insertion-only in the law, the PROPOSED
constraints are ledgered, and the gate proves no current authority or fact still carries a MISLABEL text.  No internal
chain defect is open.  Next: D19-REPROVE-REOBSERVE (Q21 obligations R-03, R-04, R-49: environment identity and the
qualified WASM64 proof with the exec-identity kernel check).
