# D27 - Observed Foundation-Closure / Repo-Alignment Pass vs Intended

STATUS: RE-OBSERVATION OF THE D27 WORKPIECE (W33 on canonical base 8a23c08b57ef6a174107fc8a3b55a2bdd43b71d0 = main after
pull request #8; judged by the D22 Factory built from that base)
LAW: compares D27-INTENDED-FOUNDATION-CLOSURE.md (sections 0-6) and the live target
design/foundation-closure/FOUNDATION-CLOSURE-TARGET.md with the Factory run (factory/receipts/D27-FOUNDATION-CLOSURE-ALIGNMENT/,
evidence/D27/).  INTENDED -> EXECUTION -> EVIDENCE -> OBSERVED.

## 1. Station run

```text
F0-doc        S-DOC            PASS  intended ASCII (STRUCTURAL CHECK: PASS), the live target (13 sections), ledger (D26
                                     AFTER incl. PR #8, D27 BEFORE), the S-LANGUAGE-LAW spec (registry check: literal; new
                                     station listed); nothing else differs from 8a23c08
F1-fixture    S-FIXTURE        PASS  tests/closure/ (6 tools, 10 registers, the frozen LANGUAGE 1 manifest and corpus
                                     table), facts/D27.json (8 facts, 6 probes), components (72), issues (41), runbook
                                     (123 facts; groups closure + the D26 replay), the status zone, the gate's task rule:
                                     syntax, JSON, structural check PASS on the registers
F2-annotate   S-ANNOTATE       PASS  STATION-REGISTRY.md D27 annotation: 0 deleted lines; FACTORY-LAW.md untouched
F3-language   S-LANGUAGE-LAW   PASS  ASCII-GRAMMAR.md / ASCII-LANGUAGE.md / LANGUAGE-TESTS.md: 0 deleted lines, markers;
                                     LANGUAGE VERSION 1 bound (manifest --grammar --check exit 0); compiler/ untouched
                                     - the first station run ever to change a language-law document under Factory law
F4-browser    S-BROWSER        PASS  identity: 4 toolchains, 45 source tips, HeadlessChrome/141.0.7390.37
F5-evidence   S-EVIDENCE       PASS  selection 175 evaluated / 75 selected (environment 67, implementation 14, obligation 0; SAME 162 / DRIFT 67 / UNK 14; gaps 0); census before 5 unauthorized / after 0 (S-LANGUAGE-LAW);
                                     rust-build census (4 toolchains, first-party 12 + 1 + 1 crates)
F6-build      S-BUILD          PASS  source + cite + repo groups: reopen 5, ingress 54, clauses 2, process 6, identity 3, manifest 3, status 2 = 75 facts re-proved, 0 failed; fresh factc; corpus 53 REPRODUCED (33 OK /
                                     20 DIAGNOSTICS); manifest 31 = 31, version 1 = 1; observed ASCII accepted by ANALYZE
F7-doc        S-DOC            PASS  execution manifest rebuilt (5489 files, 72 components; deterministic);
                                     CLOSURE-REGISTERS.md rendered with every evidence path present (deterministic);
                                     SCHEMA, ENVIRONMENT-MAP, HANDOFF, README delivered
F8-evidence   S-EVIDENCE       PASS  gate PASS (41 issues); structural check PASS (9 checks, evidence required; the
                                     rendering byte-identical to F7's); preview audit 13 PASS on the temporary graph
F9-doc        S-DOC            PASS  epochs/D27.json = re-proof fragment + facts fragment: 48 nodes / 248 edges (ENVIRONMENT 4, EVIDENCE 26, COMPUTATIONAL_FACT 11, IMPLEMENTATION 1, PROBE 6); graph 1468 nodes / 4071 edges;
                                     views; validate 42
F10-evidence  S-EVIDENCE       PASS  Q01-Q22, stale, merge-check, render-check, the D18/D18R/D20-SYNC/D23/D24 gates,
                                     status scan (0 unclassified), handoff check, the audit identical on the committed
                                     graph (13 PASS), audit -> retire -> audit (W32 REMOVED; W25, W30 KEEP), index
                                     (868 files of evidence/D27 - the first index since D23 that names its own
                                     package: I-41)
F11-doc       S-DOC                  this record
ROUTE  MATCH  no refusal, no re-run.  Two dry runs on a detached worktree at 8a23c08 preceded the route (their findings
              are listed in the intended record section 4); every fixture command then passed.
```

## 2. The pass observed (evidence/D27)

```text
FIRST OBSERVE                branch, HEAD 8a23c08 = main, tree = D26, status clean, ancestry recorded (intended section 0)
THE OCTOPUS RECONSTRUCTED    72 components classified (SEMANTIC_CORE 18, HOST_ADAPTER 7, BROWSER_NATIVE_CANDIDATE 9,
                             VERIFICATION_EVIDENCE 34, HISTORICAL_ARCHIVE 4, FUTURE_INTERACTION_PACKAGING 0); 12 Factory
                             operations mapped CURRENT -> SEMANTIC EFFECT -> BROWSER MECHANISM -> TEST -> EVIDENCE -> STATUS
THE LIVE TARGET              design/foundation-closure/FOUNDATION-CLOSURE-TARGET.md sections 1-13; registers rendered to
                             CLOSURE-REGISTERS.md; structural check PASS (9 checks) with every evidence path present
LANGUAGE HARDENING           16 questions answered from the implemented parser, renderer, tests, corpus and the D27
                             experiments: RUN 7, OBS 3, GAP 5, UNK 1; LANGUAGE VERSION 1 bound by annotation + derived
                             manifest (31 = 31 keywords); corpus oracle 53 entries frozen and reproduced
LANGUAGE EVOLUTION CONTRACT  6 laws, 12 steps: 8 RUN mechanisms on this host, 3 GAP (FC-5), 1 UNK (RUST_BUILD); bound into
                             law by the ASCII-GRAMMAR.md and STATION-REGISTRY.md annotations; station S-LANGUAGE-LAW
BLOCKERS                     30 rows: GAP 13, ERR 2, UNK 7, closed 4 (FB-06 D23, FB-12 D13/D24, FB-14 D13, FB-26 D27);
                             every open row sequenced or an explicit environmental / owner / limit boundary
RUST-BUILD BOUNDARY          5 candidates with INPUT/OPERATION/OUTPUT/TRUST/VERIFICATION/BOOTSTRAP/REPRODUCIBILITY/RECOVERY;
                             none realized in a browser; census recorded; decision D-3 (FC-7)
SEED / TCB                   8 seed rules each on a current primitive; 14 TCB rows with circularity explicit
ACCEPTANCE TEST              16 steps, 0 RUN without the host; every step with mechanism, evidence, host dependency, closing
                             sequence step; step 4 = RUST_BUILD
SEQUENCE                     FC-1..FC-8 (D28-D35) covering 23 blockers and every acceptance step
STALE_IF RE-PROOF            175 evaluated / 75 selected (environment 67, implementation 14, obligation 0; SAME 162 / DRIFT 67 / UNK 14; gaps 0); every selected fact re-proved through the runbook (reopen 5, ingress 54, clauses 2, process 6, identity 3, manifest 3, status 2 = 75 facts re-proved, 0 failed), 0 failed
EVIDENCE FEEDBACK            observed ASCII accepted by ANALYZE (status OK, 14 islands); BUILD refused only by its ERR content
STATION GAP                  census before: 5 language-law documents with no authorizing station; after: S-LANGUAGE-LAW
EPOCH / GRAPH / Q22          epoch 48 nodes / 248 edges (ENVIRONMENT 4, EVIDENCE 26, COMPUTATIONAL_FACT 11, IMPLEMENTATION 1, PROBE 6); graph 1468 nodes / 4071 edges; Q22 208 current facts (RUN 133, OBS 50, GAP 14, ERR 5, UNK 6); 133 = 132 claimable + 1 invalidated; 75 re-proved in D27; open stops GAP 12, ERR 5, UNK 6 (2 closed by evidence); stale 617 over 22 dimensions
CONSISTENCY                  audit 13 PASS (preview and committed graph identical); gate PASS; status scan PASS; handoff PASS
```

## 3. Intended vs observed

```text
P1  selection      MATCH   175 / 75 (67 / 14 / 0), gaps 0; 7 groups, 75 re-proved, 0 failed
P2  census         MATCH   before 5 unauthorized (10 stations), after 0 (11 stations)
P3  language       MATCH   corpus 53 (33 / 20) REPRODUCED; manifest 31 = 31, version 1 = 1; feedback analyze true / build false
P4  manifest       MATCH   5489 files, 72 components, deterministic; gate PASS, 41 issues (A 14, B 12, C 2, D 4, E 1, F 4, G 4)
P5  closure        MATCH   structural check 9 PASS; 30 blockers (GAP 13, ERR 2, UNK 7, closed 4); 16 steps 0 RUN; rendering identical
P6  epoch / graph  MATCH   epoch 48 / 248 (ENV 4, EV 26, FACT 11, IMPL 1, PROBE 6); merged 1468 / 4071; validate 42
P7  Q22 / audit    MATCH   Q22 208 (RUN 133, OBS 50, GAP 14, ERR 5, UNK 6); 75 re-proved; audit 13 PASS identical on the committed graph
P8  hygiene        MATCH   W32 RETIRABLE -> REMOVED (RETIRABLE 0 after); index 868 files of evidence/D27 (predicted 866:
                           the retire record and its log exist only in the real route, which a dry run skips)
STRUCTURE MATCH   compiler/, host/, factory/src/, factory/tests/, fixtures/ byte-identical to 8a23c08 (I1); the language law
                  changed only by S-LANGUAGE-LAW and the registry only by S-ANNOTATE, both insertion-only (I2); the manifest
                  and corpus table reproduced by the fresh factc (I3); every register row linked (I4); exactly the selected
                  facts re-proved (I5); the boundaries recorded as GAP/UNK facts (I6); D0-D26 evidence, receipts, epochs and
                  records untouched (I7)
```

## 4. Current reading

```text
[RUN]  FACT-D27-CLOSURE-STRUCTURE-CHECKED: the closure structure links every row from current evidence to status
[RUN]  FACT-D27-LANGUAGE-1-CORPUS-ORACLE, FACT-D27-LANGUAGE-1-MANIFEST-DERIVED: LANGUAGE 1 is what Compiler 1 implements,
       machine-readable and frozen; Compiler 1 reproduces its own oracle
[RUN]  FACT-D27-LANGUAGE-LAW-STATION-QUALIFIED: the language law has a station, version-bound to the compiler (I-40 repaired)
[OBS]  FACT-D27-LANGUAGE-EVOLUTION-CONTRACT: the lifecycle is law; no Compiler 2 exists
[GAP]  FACT-D27-OBSERVED-ASCII-NOT-DISTINGUISHABLE (I-39, LANGUAGE 2 candidate, FC-5; law L-EV-5 holds the boundary)
[UNK]  FACT-D27-RUST-BUILD-BOUNDARY: no browser candidate realized; decision D-3 by evidence in FC-7
[GAP]  FACT-D27-SELF-HOSTING-NOT-CLOSED: 0 of 16 acceptance steps without the host; SELF-HOSTING IS NOT CLOSED
[RUN]  FACT-D27-ENVIRONMENT-IDENTITY, -LAUNCHED-EXECUTABLE, -MINIMUM-SET: the pass's process facts
[OPEN] the boundary rows of docs/HANDOFF.md section 6, the blocker register and the open issues (D/E/F/G only): I-12, I-13,
       I-18, I-29, I-33 (owner), I-39 (D), I-15 (D), I-16 (E), I-02, I-03, I-04, I-17 (F); D-1, D-2, D-3, D-5 (owner)
[NEXT] FC-1 D28-SEED-BROKER-QUALIFICATION (tests/closure/registers/sequence.json); broad self-hosting implementation begins
       no earlier than that, now that the structure is integrated, reconciled with D26 and the structural check passes
```

GATE: PASS - the repository can now answer, without session memory, what exact machine must exist for the installed
Factory to evolve the language through which the human and local model tell it what to manufacture: every part of the
answer is a register row linking CURRENT EVIDENCE -> REQUIRED SEMANTIC BEHAVIOUR -> BROWSER-NATIVE MECHANISM -> TEST ->
EVIDENCE -> [RUN]/[GAP]/[ERR]/[UNK], checked by tests/closure/structural-check.mjs on the integrated tree; the language law
is under Factory authority (S-LANGUAGE-LAW) and LANGUAGE VERSION 1 is bound to the compiler that implements it; the
boundaries - observed ASCII as source, RUST_BUILD, self-hosting NOT CLOSED - are recorded with their evidence, not drawn
away.  Alignment first: no self-hosting implementation, no compiler change, no language version change.
