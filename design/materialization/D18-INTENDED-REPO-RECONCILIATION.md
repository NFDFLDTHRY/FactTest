# D18 - Intended Repository Reconciliation

STATUS: INTENDED ASCII (assembled before routing; source of record for delta D18-REPO-RECONCILIATION, workpiece W20)
REQUEST: design/materialization/D14-D19-TECHNICAL-REFERENCE-REVIEW-PROMPT.md, pass D18 ("Given D14-D17, what must change
inside the current FactTest model?").  Input: D17-OBSERVED-IMPLEMENTATION-REALITY.md (carried: 6 MISLABEL corrections,
implementation re-pins, kernel identity definition, PROPOSED constraints, stale claims), Q17 (8 facts to recheck), Q18,
docs/HANDOFF.md section 6.
SCOPE: re-examine every moved authority, stale claim and carried item along AUTHORITY CHANGED -> CONSTRAINT -> FACT ->
IMPLEMENTATION CONTRACT -> ENVIRONMENT -> OLD PROBE SUFFICIENT? -> OLD EVIDENCE APPLICABLE?; retire or supersede stale
CURRENT statements so that the repository expresses ONE current model while every earlier node, record and piece of
evidence stays as history.  Nothing is deleted: superseded graph nodes stay; law documents receive insertion-only
annotations; live handoff text is corrected in place; historical quotations get correction lines.

## 0. Observation before drawing

```text
HEAD            715ac92 (D17 integrated, pushed; re-inspection MATCH, tree b6590cd7); working tree clean
graph           D11 + epochs D12..D17 = 1042 nodes / 2106 edges; validate 35 checks PASS
Q17             movements UNREACHABLE 55, MOVED 4, AMBIGUOUS 2, MATURITY 2, EDITORIAL 2; 8 facts to recheck:
                FF-ONLY-INTEGRATION, WORKPIECE-ISOLATION, GPU-ADAPTER-SWIFTSHADER, WASM64-ABI-EXEC, WASM64-ADMITTED-E0,
                WASM64-MODULE-I64, STREAMING-UNPROBED, SHARED-THREADS-UNADMITTED
Q18 (D17)       45 RUN claims, 14 COMPLETE; GPU-ADAPTER-SWIFTSHADER stops at REPRODUCIBILITY PIN (AUTH-PLAYWRIGHT-INSTALLED
                has no sha256); PROOF-SETS-DECLARED and TOOLCHAIN-PINNED stop at CURRENT AUTHORITY because the D13 epoch
                gave CON-EM-007 / CON-FT-007 authority_refs without AUTHORIZES edges (the only 3 such gaps in the graph)
carried items   6 MISLABEL facts (FACT-LBL-01/06/07/10/11/12); FACT-IMPL-PINS-NOT-RUNNING-VERSION [ERR];
                FACT-KERNEL-IDENTITY-INSTALL-PATH [GAP] (narrowed by D17 to the custom name section);
                FACT-WORKERS-UNPROBED contradicted by D12 P10; 19 PROPOSED constraints (D11 6+3, D13 2, D15 6, D16 2)
law citations   js-api #internal-storage in 5 law files (D13-annotated) + fixtures/commissioning/contracts.ascii:39;
                web-api #streaming-module-compilation-and-instantiation in 4 law files (REFERENCE-AUTHORITY 71,
                CONSTRAINT-LEDGER 54, EVIDENCE-OBLIGATIONS 44, BOOTSTRAP-TESTS 157); ERR-001/002/003, OBS-004 rows
live text       docs/HANDOFF.md section 1 (LBL-06), section 6 B-11 row (LBL-10), section 7 kernel identity; README.md
                historical status quotation (LBL-07); tests/toolchain/proof-sets.json kernel_identity note ([GAP] wording)
tool docs       cargo book 694054f34b, git docs 0f8e75a, Rust Reference 52ffdc0: branch commits, not tool versions run
stages          W16..W19-stage: every file blob reachable from 715ac92; W11-stage 2 and W14-stage 3 files are base-era
                graph views not in the canonical history
assembly run    2 new implementation clauses VERIFIED at 9f043f63 (content_switches.cc kDisableGpu; docs/gpu/swiftshader.md);
                proof.mjs exec-identity check PASS on both D17 kernel builds (e8d65826...); scratch trial of the whole
                delta on a clone at 715ac92: epoch D18 56 nodes / 288 edges, merged 1098 / 2394, validate 42 PASS,
                surfaces 35 PASS, reconciliation gate PASS; D17 graph answers Q01-Q20 byte-identically with the new tool
```

## 1. Reconciliation register (tests/reconcile/d18-reconciliation.json; one RECONCILIATION node per row)

```text
ID    OUTCOME     RE-EXAMINES                                   CURRENT MODEL AFTER D18
R-01  HOLDS       FACT-FF-ONLY-INTEGRATION                      + STALE_IF host git / integrate rule (Q18 COMPLETE)
R-02  HOLDS       FACT-WORKPIECE-ISOLATION                      unchanged; re-witnessed by every delta
R-03  HOLDS       FACT-GPU-ADAPTER-SWIFTSHADER                  authorities re-pinned (R-14, R-48); D19: browser identity
R-04  HOLDS       FACT-WASM64-ABI-EXEC / -ADMITTED-E0 / -MODULE-I64  D19: qualified proof with the exec-identity check
R-05  OPEN        FACT-STREAMING-UNPROBED                       [GAP] stays; citation corrected (R-11)
R-06  SUPERSEDED  FACT-SHARED-THREADS-UNADMITTED                -> FACT-SHARED-THREADS-UNADMITTED-D18 [ERR] (layers apart)
R-10  SUPERSEDED  AUTH-WASM-JSAPI-STORAGE                       -> AUTH-WASM-JSAPI-STORAGE-D18 (#webassembly-storage)
R-11  SUPERSEDED  AUTH-WASM-WEBAPI-STREAMING                    -> AUTH-WASM-WEBAPI-STREAMING-D18 (#streaming-modules)
R-12  SUPERSEDED  AUTH-RUSTC-WASM64-DOC / -TARGET-SPEC          -> -D18 successors pinned at rust-lang/rust@6eeff9a52
R-13  OPEN        AUTH-GIT-REPO-LAYOUT (#_worktrees AMBIGUOUS)  [UNK] stays
R-14  SUPERSEDED  AUTH-PLAYWRIGHT-INSTALLED                     -> AUTH-IMPL-PLAYWRIGHT-BROWSERS (+ SWITCHES authorizes)
R-15  ANNOTATED   AUTH-WASM-THREADS, AUTH-WASM-SET (maturity)   ERR-003 + REFERENCE-AUTHORITY state Phase 4 / Phase 1
R-16  HOLDS       LAW-EVIDENCE-OBLIGATIONS, LAW-FACTORY-CONTRACTS  EDITORIAL line shifts only
R-17  HOLDS       15 document-root citations with D14 candidate ids  coarse, not stale
R-18  OPEN        FACT-PUBLISHED-FRONTIER-UNVERIFIED, -AUTHORITY-REOPEN-DENIED  [UNK] stays (network policy)
R-19  OPEN        cargo book, 9 git documents, Rust Reference   [GAP]: branch commits, not tool versions run
R-20  ANNOTATED   AUTH-RUSTC-WASM64-DOC-D18, AUTH-WASM-CORE-CHANGES-64  ERR-001 current (CONFLICT-LEDGER)
R-21  LEDGERED    19 PROPOSED constraints                       CONSTRAINT-LEDGER.md D18 section; LEDGERED_IN edges
R-22  OPEN        FACT-GIT-TREE-ORDER-UNDOCUMENTED              [GAP] stays
R-23  HOLDS       10 project facts stopping in Q18              + 3 missing AUTHORIZES, 2 IMPLEMENTED_BY, 1 STALE_IF
R-24  ANNOTATED   FACT-SAB-GLOBAL-HOST-DEFINED                  ERR-002 states standard / host / Chromium layers
R-30  ANNOTATED   33 capability families                        CAPABILITY-MATRIX points at Q19 (no status in G)
R-31  ANNOTATED   8 sensor families + FACT-SENSOR-FAMILY-ADVISEMENT  OBS-004 extended; routing = OWNER D-10
R-32  SUPERSEDED  FACT-WORKERS-UNPROBED                         -> FACT-WORKERS-D18 [GAP]; INVALIDATED_BY EV-D12-P10
R-40  RESOLVED    FACT-LBL-01                                   via R-06
R-41  RESOLVED    FACT-LBL-06                                   HANDOFF section 1 text replaced
R-42  RESOLVED    FACT-LBL-07                                   README correction line under the historical quotation
R-43  SUPERSEDED  FACT-SH-STORAGE-BEST-EFFORT                   -> FACT-SH-STORAGE-DURABILITY-D18 [UNK]
R-44  RESOLVED    FACT-LBL-10                                   HANDOFF B-11 row text replaced
R-45  CORRECTED   13 D12 facts ("Chromium 141 persistent profile")  reading attached: chromium-headless-shell 141 rev 1194
R-46  RESOLVED    FACT-LBL-11                                   via R-45 / R-43
R-47  RESOLVED    FACT-LBL-12, FACT-IMPL-PINS-NOT-RUNNING-VERSION  via R-48
R-48  SUPERSEDED  6 D11 implementation authorities              -> pins at Chromium 141 / V8 14.1 / SwiftShader 7cd1022
R-49  SUPERSEDED  FACT-KERNEL-IDENTITY-INSTALL-PATH (+ EXEC-SECTIONS)  -> FACT-KERNEL-IDENTITY-DEFINED-D18 [RUN]
R-50  HOLDS       LAW-RUNTIME-ADMISSION, -PLANNER-COST-MODEL, -PASS6-COMMISSIONING  reviewed, no conflict with D14-D17
R-51  ANNOTATED   LAW-EVIDENCE-OBLIGATIONS + 4 behaviours       evidence identity / implementation reality annotations
totals  36 items: HOLDS 8, OPEN 5, SUPERSEDED 9 (15 supersessions: 11 authorities, 4 facts), ANNOTATED 6, LEDGERED 1,
        RESOLVED 6, CORRECTED 1
```

Every row answers all seven traversal steps (register field "traversal").  OLD EVIDENCE -> STALE_IF / INVALIDATED_BY ->
NEW PROBE OBLIGATION appears where it applies: R-32 (INVALIDATED_BY), R-03/R-04/R-49 (D19 obligations), R-05/R-32/R-19
(capability or extraction work, not D19), R-43 (installed Chrome, [UNK]).

## 2. Current-model rules (graph)

```text
current node       a node is CURRENT unless a SUPERSEDES edge (successor -> superseded) points at it; superseded nodes
                   are never edited or removed (history)
supersession       same class; the edge names its RECONCILIATION, whose outcome is SUPERSEDED and which RECONCILES the
                   superseded node; one successor per node; acyclic
inheritance        the successor carries every inheritable edge of the superseded node, both endpoints mapped to their
                   current node: AUTHORITY out AUTHORIZES/DEPENDS_ON/CONFLICTS_WITH, in DEPENDS_ON/CONFLICTS_WITH;
                   COMPUTATIONAL_FACT out PROBED_BY/EVIDENCED_BY/ADMITTED_BY/REQUIRES/EXPOSED_BY/STALE_IF/IMPLEMENTED_BY,
                   in AUTHORIZES/GROUNDS/EXPLAINS/WITNESSED_BY/REQUIRES (declared on SUPERSEDES; validate enforces)
resolved record    a RESOLVED reconciliation closes an [ERR]/[GAP]/[UNK]/[OBS] fact record without superseding it; Q18
                   terminates it "[RESOLVED]"
corrected wording  a CORRECTED reconciliation attaches the current reading of an imprecise wording; TRACEABILITY shows it
ledgered           LEDGERED_IN: PROPOSED CONSTRAINT -> LAW-CONSTRAINT-LEDGER {locator, reconciliation}; the node keeps
                   ledger_status PROPOSED as history
staleness (Q17)    a claim introduced at or after a revision's epoch was derived knowing it and is not made stale by it
views              Q18: superseded authorities leave the authority/maturity/pin steps; superseded facts terminate
                   "[SUPERSEDED] by X (R-nn)"; Q19/Q20 list current witnesses/explained facts; Q02/Q09/Q17 mark
                   superseded authorities; AUTHORITY-REGISTER marks SUPERSEDED / supersedes / ledgers; TRACEABILITY marks
                   facts, superseded authorities, reconciled lines, and adds a Reconciliation section; conflicts render
                   between current endpoints.  A graph without these nodes and edges answers exactly as before.
```

## 3. Law documents (insertion-only; every inserted hunk begins "D18 ANNOTATION")

```text
REFERENCE-AUTHORITY.md       #internal-storage resolved (R-10); #streaming-... current locator (R-11); current authority
                             model at the end (R-15, R-20, R-51)
CONSTRAINT-LEDGER.md         WA-004 streaming (R-11); WA-005 #internal-storage (R-10); "D18 ANNOTATION (constraints
                             ledgered)": 19 constraints, statement verbatim from the graph, current authorities (R-21)
CONFLICT-LEDGER.md           #internal-storage (R-10); ERR-001 current (R-20); ERR-002 precision (R-24); ERR-003 maturity
                             (R-15); OBS-004 extended by D16 (R-31)
EVIDENCE-OBLIGATIONS.md      #streaming-... (R-11); #internal-storage (R-10); evidence identity after D17 (R-51)
IMPLEMENTATION-CONTRACTS.md  #internal-storage (R-10); implementation reality for the contracts (R-51)
STATION-REGISTRY.md          S-ANNOTATE-OWNER registered by this delta
CAPABILITY-MATRIX.md         current classification lives in Q19; G unchanged (R-30)        station S-ANNOTATE-OWNER
BOOTSTRAP-TESTS.md           #streaming-... current locator (R-11)                          station S-ANNOTATE-OWNER
FACTORY-LAW.md               never annotated
kept historical              every cited URL stays as written; fixtures/commissioning/contracts.ascii:39 keeps
                             #internal-storage (compiler input of the commissioned Byte Relay; changing it belongs to a
                             delta that re-commissions)
```

S-ANNOTATE may change REFERENCE-AUTHORITY, CONSTRAINT-LEDGER, CONFLICT-LEDGER, IMPLEMENTATION-CONTRACTS,
EVIDENCE-OBLIGATIONS and STATION-REGISTRY only.  CAPABILITY-MATRIX.md and BOOTSTRAP-TESTS.md are owner contracts with no
annotating station: [GAP] -> forge S-ANNOTATE-OWNER (factory/registry/stations/S-ANNOTATE-OWNER.json, bootstrap registry
material of this delta) with the S-ANNOTATE invariants and exactly those two files.

## 4. Live surfaces (tests/reconcile/surfaces.json, checked by tests/reconcile/surfaces.mjs)

```text
docs/HANDOFF.md      section 1: last delta D18, "Byte Relay physically commissioned in the Chromium 141 headless shell
                     (SwiftShader CPU fallback WebGPU under the unsafe WebGPU switches, plus wasm64)" (R-41), next D19;
                     section 5: epochs D12..D18, register; section 6: B-11 row [UNK] (R-44), workers and streaming [GAP]
                     rows, D-10 sensor routing (R-31), tool-doc pins (R-19), stage row (section 6 below), resolved rows
                     moved to "Resolved by D18"; section 7: kernel identity = exec identity (R-49)
README.md            historical status quotation kept verbatim + "D18 correction (label audit LBL-07)" line (R-42)
proof-sets.json      kernel_identity.exec_identity {sha256 e8d65826..., excluded_custom_sections [name], algorithm,
                     source}; note rewritten; by_install_name kept (informational)
proof.mjs            kernel-identity: verdict = exec identity == declared (install-name independent); whole-file sha256
                     reported against every recorded install name
27 text surfaces + 8 insertion-only annotated files = 35 checks
```

## 5. Graph epoch D18 (add-only)

```text
declares  RECONCILIATION {reconciliation_id, subject, traversal, outcome, note} with outcome_vocabulary (HOLDS SUPERSEDED
          RESOLVED CORRECTED LEDGERED ANNOTATED OPEN) and traversal_steps (7); RECONCILES (-> any class), SUPERSEDES
          (AUTHORITY|FACT -> same; requires reconciliation; inherits), LEDGERED_IN (CONSTRAINT -> AUTHORITY; requires
          locator, reconciliation)
adds      clause fragment (tests/reference/d18-clauses.json): AUTH-IMPL-CONTENT-SWITCHES-141, AUTH-IMPL-CHROMIUM-
          SWIFTSHADER-DOC-141, CL-IMP-GPU0, CL-IMP-SSDOC, extraction evidence, ENV-D18-HOST, FACT-D18-CLAUSES-VERIFIED;
          5 authorities (JSAPI-STORAGE-D18, WEBAPI-STREAMING-D18, RUSTC-WASM64-DOC-D18, -TARGET-SPEC-D18,
          LAW-CONSTRAINT-LEDGER; pins derived from the superseded pin, the D17 clause source, or the ledger file sha256);
          4 facts (SHARED-THREADS-UNADMITTED-D18 [ERR], WORKERS-D18 [GAP], SH-STORAGE-DURABILITY-D18 [UNK],
          KERNEL-IDENTITY-DEFINED-D18 [RUN]); 2 kernel-identity EVIDENCE (evidence/D18/kernel); 36 RECONCILIATION;
          15 SUPERSEDES + 61 inherited edges; 22 register edges; 19 LEDGERED_IN
validate  + reconciliation_vocabulary, reconciliation_has_subject, resolved_only_non_run_facts, supersession_well_formed,
          successor_carries_inherited_edges, ledgered_constraints_well_formed, stale_facts_reconciled (42 checks)
Q21       per reconciliation: traversal, outcome, supersessions, ledgered, invalidated, obligation; current model (facts
          current / superseded / resolved by status, constraints ledgered, authorities superseded); new probe obligations
builder   tests/reconcile/build-reconciliation.mjs (generic; pins derived, never typed)
```

## 6. Stage directories and workpieces

```text
tests/reconcile/stage-audit.mjs <root> --repo <canonical> --rev <base> --current W20-stage: a stage is SUPERSEDED when every
file blob is reachable from the base, else KEEP with the files listed; read-only.  Removal stays with the Factory
(factory workpiece retire handles worktrees only): the HANDOFF row records the proof and keeps the [GAP].
factory workpiece audit -> retire -> audit (--current W20): W19 (integrated) RETIRABLE -> REMOVED.
```

## 7. Mutation plan by station (delta D18-REPO-RECONCILIATION, workpiece W20, base 715ac92)

```text
F0  S-DOC              this ASCII; ledger (D17 AFTER + D18 BEFORE); delta; fixtures; bootstrap station
                       factory/registry/stations/S-ANNOTATE-OWNER.json
F1  S-FIXTURE          tests/reconcile/ (register, surfaces, builder, surfaces check, gate, stage audit),
                       tests/reference/d18-clauses.json, tests/envmap/envmap.mjs, tests/toolchain/{proof.mjs,
                       proof-sets.json}; checks: syntax, generic tools, the D17 graph validates/renders/merges identically
                       and answers Q01-Q20 byte-identically to D17's evidence (Q21: none), exec-identity check PASS on both
                       D17 kernel builds (files anchored to evidence/D17/kernel/builds.json)
F2  S-BUILD            evidence/D18/clauses/ (2 VERIFIED), evidence/D18/kernel/ (KRN-D18-A/B), evidence/D18/workpieces/
                       stages.json
F3  S-ANNOTATE         REFERENCE-AUTHORITY, CONSTRAINT-LEDGER, CONFLICT-LEDGER, EVIDENCE-OBLIGATIONS,
                       IMPLEMENTATION-CONTRACTS, STATION-REGISTRY (0 deleted lines; every hunk begins D18 ANNOTATION)
F4  S-ANNOTATE-OWNER   CAPABILITY-MATRIX, BOOTSTRAP-TESTS (same checks)
F5  S-DOC              README.md, docs/HANDOFF.md
F6  S-DOC              epochs/D18.json built inside the run from the Factory evidence; merged graph; views; SCHEMA
                       section 11, ENVIRONMENT-MAP section 10
F7  S-EVIDENCE         validate, Q01-Q21, stale, merge-check, render-check, surfaces, reconciliation gate, Q18/Q21 gates,
                       D16 capability and D17 implementation gates (regression), status scan, handoff check, workpiece
                       audit -> retire -> audit, evidence index
F8  S-DOC              D18-OBSERVED-REPO-RECONCILIATION.md
MUST NOT CHANGE: FACTORY-LAW.md, compiler/, host/, factory/src, fixtures/, earlier epochs, D0-D17 evidence, every other
                 law and pass document
```

## 8. Predictions

```text
P1  F2: 2/2 clauses VERIFIED at 9f043f63; KRN-D18-A and -B PASS (exec identity e8d65826...; whole file matches the
    recording for its own install name); stages: W11 KEEP 2, W14 KEEP 3, W16..W19 SUPERSEDED, W20 CURRENT
P2  F3/F4: 8 files, +0 deleted lines each, every hunk begins "D18 ANNOTATION"
P3  epoch D18 56 nodes / 288 edges; merged 1098 / 2394; validate PASS 42 checks; D11-D17 preserved (merge-check)
P4  surfaces 35 PASS; reconciliation gate PASS (36 reconciliations, 15 supersessions, 19 ledgered, 22 edges; 6 labels
    resolved; 8/8 stale facts; current statements clean)
P5  Q18: 120 claims; current RUN 47 with 20 COMPLETE (D17: 14) - stops IMPLEMENTATION CONTRACT 17, CURRENT AUTHORITY 5
    (clause/frontier process facts), EXACT CLAUSE 4, PROJECT CONSTRAINT 1; [SUPERSEDED] 4, [RESOLVED] 7; current non-RUN
    ERR 4, GAP 10, OBS 43, UNK 5
P6  Q21: 36 rows; facts total 120 = current 109 + superseded 4 + resolved 7; constraints 47 all LEDGER; authorities 126
    with 11 superseded; obligations R-03, R-04, R-49 for D19
P7  regression: D16 capability gate PASS, D17 implementation gate PASS on the D18 graph; status scan PASS; handoff check
    PASS; audit: W19 RETIRABLE -> REMOVED, after RETIRABLE 0
```

## 9. Invariants

```text
I1  nothing earlier is edited: superseded nodes, D0-D17 evidence, epochs D12-D17 and historical quotations stay
I2  one current truth: every stale CURRENT statement is superseded (graph), replaced (live handoff) or annotated (law),
    and the gate proves no current authority/fact still carries a MISLABEL text
I3  every approved family stays in G (CAPABILITY-MATRIX.md unchanged apart from one annotation)
I4  current authority != reproducibility pin: successors carry both, pins derived from what was read
I5  law documents: insertion-only, marker-first hunks, FACTORY-LAW.md never
I6  no expensive probe re-run ceremonially: the kernel identity is re-checked on the existing D17 builds; re-proof is D19's
```

## 10. Pass gate

```text
D18 closes when the Factory reproduces the clause fragment, the kernel identity records and the stage audit, the D18
epoch validates with every supersession carrying its inherited edges, the surfaces and the reconciliation gate pass, and
Q21 shows every Q17 fact re-examined with one current model.  Carried across the gate: D19 obligations (qualified proof
with the exec-identity check; browser/toolchain environment identity), streaming and worker capability work, tool-doc
re-pins, [UNK] published frontier / installed Chrome / non-Linux / #_worktrees, OWNER D-10.
```

## 11. Structural check

```text
inputs supplied        Q17/Q18, D17 carried items, law citations, live texts, stage blobs, D17 kernel builds          PASS
outputs consumed       Q21 -> D19 (minimum affected set); HANDOFF -> next agent; ledgered constraints -> law              PASS
contracts match        RECONCILIATION + 3 edge types declared before use; inheritance declared and validated             PASS
forbidden bypasses     no node or evidence edited; law touched only by annotating stations; no fixture input changed    PASS
illegal cycles         supersession acyclic (validate); reconciliation -> subject only                                  PASS
invariants represented I1-I6 -> merge-check, gate current_statements_clean, surfaces, numstat, must_not_change           PASS
tests/evidence         F1 regression, F2 extraction/kernel/stages, F3/F4 insertion-only, F6 validate, F7 gates        PASS
```

STRUCTURAL CHECK: PASS
