# D27 - Intended Foundation-Closure / Repo-Alignment Pass

STATUS: INTENDED ASCII (assembled before routing; source of record for delta D27-FOUNDATION-CLOSURE-ALIGNMENT, workpiece
W33, base 8a23c08 = main after pull request #8).  The architecture itself is the live target
design/foundation-closure/FOUNDATION-CLOSURE-TARGET.md (sections 1-13) with its registers tests/closure/registers/;
this record carries the observation, the classification of what the pass found, the mutation plan by station, the
predictions, the invariants and the structural check of the delta.  Approved ASCII = the target + this record.
REQUEST: the owner prompt "FACTTEST FOUNDATION-CLOSURE / REPO-ALIGNMENT PASS - SELF-HOSTING + EVOLVABLE ASCII HUMAN/AI
LANGUAGE": reconstruct (1) the repo-wrangling octopus, (2) the Factory assembly line, (3) the ASCII language / compiler /
verifier path, (4) the generated-WebApp runtime, (5) the D12 self-hosting primitives, (6) the D21-D26 commissioned
behaviour; align the repository around one foundation-closing target (an installed Factory WebApp that continues Factory
work, manufactures and qualifies its own successor and evolves the ASCII language); ALIGNMENT + ARCHITECTURE first; do
not hide missing machinery by implementing around it; the pass obeys AGENT -> ASCII -> FACTORY -> WORKPIECE -> VERIFY ->
REPO; if language-law hardening needs ASCII-LANGUAGE.md / ASCII-GRAMMAR.md, that is a Factory machinery gap to solve as
machinery; produce the intended ASCII (10 sections), the correspondence matrix, the hardening register, the evolution
contract, the blocker register, the minimal seed, the acceptance test and the bounded sequence; update docs/HANDOFF.md.
SCOPE: alignment, architecture, machinery for the language law, the LANGUAGE 1 oracle and manifest, honest boundary
evidence; NO self-hosting implementation, NO compiler change, NO language version change.

## 0. Observation before drawing (FIRST OBSERVE)

```text
branch         claude/facttest-materialization-27amc7
HEAD           8a23c08b57ef6a174107fc8a3b55a2bdd43b71d0 = origin/main (the merge commit of pull request #8; its tree
               equals b8b09e1, the D26-CLEAN-COMMISSIONING integration; the branch was fast-forwarded to it before any
               D27 work, as the standing rule for a merged branch requires)
main           8a23c08 (moved since the prompt was assembled: the prompt names D26 on main - true; PR #8 merged it)
tree           identical to D26: 5469 tracked files; working tree clean; ancestry: 8a23c08 -> b8b09e1 (D26) -> 2c0aeda
               (D25) -> 76f4441 (D24) -> 6bcc86c (D23) -> a43c0ce (D22) -> 88564a0 (D21R) -> 910fdbf (D21) -> 4b86df9
               -> b22bcbb (main, PR #7) -> ca54064 (D20) ...
status         clean; W25, W30, W32 worktrees KEEP (W32 = D26, integrated: RETIRABLE by this delta's audit)
read           README, HANDOFF, FACTORY-LAW, FACTORY-CONTRACTS, STATION-REGISTRY, ASCII-LANGUAGE, ASCII-GRAMMAR,
               SEMANTIC-MODEL, LANGUAGE-TESTS, REFINEMENT-LAW, BOOTSTRAP-ARCHITECTURE, CODEGEN-BUNDLE-CONTRACT,
               RUNTIME-ADMISSION-REPLAN, D12 intended + observed, D26 baseline + observed, the execution manifest, the
               graph (1420 nodes / 3823 edges; Q22 197 current facts), factory/, compiler/, host/, tests/{selfhost,
               physical,genericity,factory}
```

What the octopus is (from the execution manifest and the code, not from memory):

```text
FACTORY      factory/ std crate (3,797 lines): git.rs = git subprocesses (rev-parse, show, write-tree under a temporary
             index, diff-tree, worktree add --detach, commit, merge --ff-only, status); ops.rs = the state machine
             (delta check, workpiece create, station open/close = tree snapshots around fixture commands, verify,
             integrate ff-only, reinspect); paths.rs = literal authority; checks.rs; identity.rs = process probes;
             hygiene.rs = worktree audit/retire; 10 station specs (JSON); 33 integrated deltas + D26, every one
             receipted and verified (FACT-D26-CONSISTENT).  Every fixture command is an OS program.
COMPILER     12 no_std crates + wasm-abi (15,373 lines; forbid(unsafe_code) in 11; core-only wasm64 graph): LANGUAGE 1
             = 31 statement keywords, 12 predicates, fixed invariant kernel; artifacts up to a verified bundle;
             observe -> observed ASCII; templates by include_str!; kernel identity pinned ef5d886a...;
             wasm transport = the whole kernel API (21 exports), byte-identical to factc (Q-WASM-08).
RUNTIME      generated bundle: admission -> guards -> ActivePlan -> transfer(relation, bytes) -> loss -> E1 -> stale
             plan -> reselection; no runtime codegen; tape bound to strategy-data identity; four specimens physical.
PRIMITIVES   D12 P01-P16 re-proved on fresh bundles (D25/D26): offline, SW no self-update, origin-scoped restart
             survival, OPFS-served app, SW COI, IDB CAS, persist() false, opaque confinement, git identity in the
             browser, kernel in a worker, broken seed fatal, interrupted update, broker-fed generation.
NOT THERE    a Factory WebApp, a seed, a broker, an object store, a browser law engine, browser stations, a
             qualification runner, an in-browser RUST_BUILD, a language version in source, an evidence/source role.
```

Experiments of this pass (scratch first, then routed as evidence; nothing repaired):

```text
STALE_IF selection   tests/reprove/select.mjs over the D26 graph with a fresh identity: 175 current RUN/OBS facts
                     evaluated, 61 selected - all by environment drift of the authority source tips (groups reopen 5,
                     ingress 54, clauses 2), 0 by implementation change (the tree is identical to D26), 0 obligations,
                     gaps 0.  The [RUN] rows the prompt lists are NOT re-proved blindly: none is stale.
language manifest    derived from compiler/source: 31 keywords; the grammar's @{keyword forms match the parser exactly;
                     the grammar declared NO version number (only the parser's message names "language version 1")
corpus oracle        53 entries (language ladder fixtures, commissioning variants, four specimens in BUILD) frozen from
                     the base compiler and reproduced: 33 OK / 20 DIAGNOSTICS; presentation variants of Byte Relay share
                     one canonical sha256; every specimen BUILD PASS with its strategy-data identity
evidence feedback    the observed ASCII of the physical Byte Relay tape handed back as source: ANALYZE status OK (14
                     islands, system byte_relay_observed); BUILD refused only by BUILD_BLOCKED_BY_GOVERNANCE (the ERR
                     issues) -> nothing in LANGUAGE 1 marks evidence as evidence
station census       ASCII-LANGUAGE.md, ASCII-GRAMMAR.md, SEMANTIC-MODEL.md, LANGUAGE-TESTS.md, REFINEMENT-LAW.md:
                     zero authorizing stations at the base; their last change (4dcc28d) predates D0
rust-build census    pinned nightly: rustc driver 158 MB + LLVM 199 MB native, rust-src 83 MB (core 7.2 MB, 176,305
                     lines), targets x86_64 only, codegen backends none; rustc knows 9 wasm targets; first-party:
                     compiler 15,373 / factory 3,797 / host 568 lines, 12 no_std crates, 11 forbid(unsafe_code)
final condition      tests/audit/final-condition.mjs is the closed six-task condition (line 18 pins "last delta D26"):
                     it is not a gate of this delta; the consistency audit (five equalities) is
evidence indexes     evidence/D24, D25 and D26 index.json each list evidence/D21 (64 entries, identical): the index
                     directory argument was inherited from the D21 fixture through D24-D26 (I-41, class A)
```

## 1. Classification of what the pass found (GAP CLASSIFICATION LAW of the D21-D26 prompt, kept)

```text
A  I-40  no station had authority over the language law                    -> repaired now as machinery: S-LANGUAGE-LAW
A  I-41  the D24-D26 evidence indexes index evidence/D21 (fixture inherited) -> D27 indexes its own package; history kept
B  I-38  new live component TEST-CLOSURE without graph nodes (own epoch)    -> epoch D27 adds IMPL-CLOSURE + facts
D  I-39  observed ASCII indistinguishable from source                       -> [GAP] LANGUAGE 2 candidate (FC-5); law L-EV-5
D  FB-21 no language version in source; FB-23 no vocabulary query; FB-24 L30 fixed transforms; FB-27 capacity
E  FB-04 RUST_BUILD boundary [UNK] (census recorded; candidates stated; decision D-3); FB-11, FB-19, FB-20
G  D-1, D-2, D-3, D-5 (owner decisions preserved from D12; none decided here); I-33
closed   FB-06 (D23), FB-12 (D13/D24), FB-14 (D13), FB-26 (this delta)
```

## 2. Intended structure of the delta

```text
 LIVE TARGET   design/foundation-closure/FOUNDATION-CLOSURE-TARGET.md  (sections 1-13; the one coherent target)
 REGISTERS     tests/closure/registers/{classification, correspondence, hardening, evolution-contract, blockers,
               rust-build, seed, acceptance-test, sequence, language-corpus}.json
 TOOLS         tests/closure/{structural-check (validate + render), language-manifest (derive + check), language-corpus
               (freeze + check), evidence-feedback-probe, station-authority-census, rust-build-census}
 FROZEN        tests/closure/language-manifest-v1.json, tests/closure/language-corpus-v1.json  (LANGUAGE 1)
 STATION       factory/registry/stations/S-LANGUAGE-LAW.json  (forged -> attacked by census + f02 -> registered by the
               STATION-REGISTRY.md D27 annotation -> used by F3)
 LAW TEXT      ASCII-GRAMMAR.md (LANGUAGE VERSION 1; corpus oracle; extensibility realized), ASCII-LANGUAGE.md (the
               protocol parties; the evidence-feedback finding), LANGUAGE-TESTS.md (L36-L43) - insertion-only
 REGISTERS     tests/manifest/{components (TEST-CLOSURE, RECORD-FOUNDATION-CLOSURE), issues (I-38, I-39, I-40)},
               tests/reprove/runbook.json (group closure with 5 fact entries; the D26 replay in group process with 3
               entries for the D26 process facts the workpiece-time selection found unmapped), tests/envmap/facts/D27.json,
               tests/hygiene/status-classification.json (zone Z-FOUNDATION-CLOSURE, class R), tests/manifest/gate.mjs (an issue's task
               is any delta id, not the D21-D26 range the series hard-coded; found by the dry run), I-36 covers emptied
               (the D27 manifest sees IMPL-AUDIT, as D26 did for I-35)
 EVIDENCE      evidence/D27/{identity, selection, results (reopen, ingress, clauses), language/{manifest, corpus,
               feedback}, stations/{census-before, census-after}, rust-build/census, closure/structural-check,
               manifest, gate, issues, audit/consistency, envmap/queries, workpieces, index}
 GRAPH         epochs/D27.json = re-proof fragment (61 facts re-proved; ENV-D27-*) + facts fragment (IMPL-CLOSURE,
               6 probes, 8 facts: 4 RUN, 1 OBS, 2 GAP, 1 UNK); graph, views, SCHEMA, ENVIRONMENT-MAP
 RECORDS       docs/HANDOFF.md (section 1 current target, section 5 register, section 6 rows), README, LEDGER (D26 AFTER
               incl. PR #8; D27 BEFORE), the generated CLOSURE-REGISTERS.md and execution manifest, this record, the
               observed record
 FORBIDDEN     compiler/, host/, factory/src/, factory/tests/, fixtures/, earlier epochs, D0-D26 evidence, FACTORY-LAW.md,
               every other law document, SEMANTIC-MODEL.md and REFINEMENT-LAW.md (authorized but not needed)
```

## 3. Mutation plan by station (delta D27-FOUNDATION-CLOSURE-ALIGNMENT, workpiece W33, base 8a23c08)

```text
F0-doc        S-DOC           this record, the live target, the ledger, the delta + fixtures, the S-LANGUAGE-LAW spec
                              (bootstrap registry material; registry-check literal); nothing else touched
F1-fixture    S-FIXTURE       tests/closure/ (tools, registers, frozen tables), facts/D27.json, components/issues/runbook:
                              syntax, JSON, structural check on the registers (facts of the D27 spec admitted), counts
F2-annotate   S-ANNOTATE      STATION-REGISTRY.md D27 annotation (insertion-only; FACTORY-LAW.md untouched)
F3-language   S-LANGUAGE-LAW  ASCII-GRAMMAR.md, ASCII-LANGUAGE.md, LANGUAGE-TESTS.md annotations: 0 deleted lines,
                              markers, language-manifest --grammar --check exit 0 (LANGUAGE VERSION 1 bound), compiler/
                              untouched
F4-browser    S-BROWSER       identity capture -> evidence/D27/identity
F5-evidence   S-EVIDENCE      STALE_IF selection (gaps 0, unmapped 0); station census before (base) and after
                              (workpiece); rust-build census
F6-build      S-BUILD         fresh build directory; run-selected kinds source + cite + repo (every selected fact); fresh factc;
                              corpus --check (REPRODUCED), manifest --check --grammar, evidence-feedback probe; every
                              result PASS
F7-doc        S-DOC           execution manifest rebuilt (deterministic); CLOSURE-REGISTERS.md rendered with
                              --evidence-required (deterministic); SCHEMA, ENVIRONMENT-MAP, HANDOFF, README delivered
F8-evidence   S-EVIDENCE      manifest/issues/gate evidence; structural-check record with --evidence-required (render
                              byte-identical to F7's); preview: re-proof fragment on a temporary graph, queries, status
                              scan, handoff check, consistency audit (13 checks PASS)
F9-doc        S-DOC           epoch D27 = re-proof fragment + facts fragment; graph merge; views; validate 42
F10-evidence  S-EVIDENCE      Q01-Q22, stale, merge/render checks, D18..D24 gates, status scan, handoff check, audit on
                              the committed graph (identical to the preview), workpiece audit -> retire (W32) -> audit,
                              cleanup gate, index
F11-doc       S-DOC           the observed record
REINSPECT                     STRUCTURAL CHECK: PASS in this record; GATE in the observed; validate / merge-check /
                              render-check; epoch D27 rebuilt byte-identically from the D26 graph; the structural check
                              and the render reproduced from the committed tree; manifest --check --grammar exit 0
```

## 4. Predictions (from the dry run on a detached worktree at 8a23c08)

```text
selection      175 current RUN/OBS facts evaluated in the workpiece (the identity captured there), 75 selected: environment
               drift 67 (authority source tips moved since D26; pairs SAME 162 / DRIFT 67 / UNK 14), implementation change
               14 (tests/reprove/runbook.json, tests/manifest/components.json, tests/hygiene/status-classification.json
               changed in the working tree: the D19/D20/D26 process facts, the D21/D21R manifest facts, the status facts),
               obligation 0; gaps 0 (the three D26 process facts mapped by the D26 replay); groups reopen 5, ingress 54,
               clauses 2, process 6, identity 3, manifest 3, status 2; every fact re-proved (75), 0 failed.  A source tip
               moving between the dry run and the route changes the environment count only; whatever is selected is
               re-proved
census         before (base): 5 unauthorized language-law documents, 10 stations; after: 0 unauthorized, 11 stations
language       corpus 53 entries (33 OK / 20 DIAGNOSTICS) REPRODUCED by the fresh factc; manifest: 31 grammar keywords =
               31 parser keywords, grammar_version 1 = parser version 1; evidence feedback: observed ASCII accepted by
               ANALYZE (14 islands), refused by BUILD only for BUILD_BLOCKED_BY_GOVERNANCE
rust-build     4 toolchains; first-party: compiler 12 crates / 15,373 lines, factory 3,797, host 568; no_std 12,
               forbid(unsafe_code) 11 (15 unsafe occurrences, all in wasm-abi); 8 include_str! templates; 9 wasm targets
manifest       5489 files, 72 components (PRODUCTION 68, FACTORY 25, TEST 129, FIXTURE 111, REFERENCE 86, RECORD 984, LAW 32,
               HISTORICAL 11, EVIDENCE 4043); deterministic; gate PASS with 41 issues (A 14, B 12, C 2, D 4, E 1, F 4, G 4)
closure        structural check 9 checks PASS with every evidence path present; 30 blockers (GAP 13, ERR 2, UNK 7, closed 4),
               16 acceptance steps (0 RUN without the host), 8 sequence steps, 16 hardening questions, 12 evolution steps
               (8 RUN); the rendering byte-identical between the doc station and the evidence station
epoch D27      48 nodes / 248 edges (ENVIRONMENT 4, EVIDENCE 26, COMPUTATIONAL_FACT 11 = 8 closure + 3 process,
               IMPLEMENTATION 1, PROBE 6); merged graph 1468 nodes / 4071 edges; validate 42 checks
Q22            208 current facts (RUN 133, OBS 50, GAP 14, ERR 5, UNK 6); RUN claims 133 = 132 claimable + 1 invalidated;
               75 re-proved in D27; open stops GAP 12, ERR 5, UNK 6, closed by evidence 2; the 11 FACT-D27-* rows: 7 RUN
               (newest evidence D27), 1 OBS, 2 GAP, 1 UNK; stale relations 617 over 22 dimensions
audit          consistency audit 13 checks PASS on the preview graph and identical on the committed graph; status scan
               PASS (0 unclassified); handoff check PASS; the D18/D18R/D20-SYNC/D23/D24 gates PASS
hygiene        workpiece audit: W32 RETIRABLE -> retire REMOVED -> RETIRABLE 0 (W25, W30 KEEP); index 866 files of
               evidence/D27 (evidence_dir evidence/D27)
```

Dry runs on a detached worktree at 8a23c08 preceded the route.  The first found: the frozen corpus table carried a
duplicate entry (54 rows for 53 entries: the byte-relay BUILD entry existed twice; the tool now refuses duplicate ids);
F3's untouched check named tests/ although F1 legitimately changes it; the F6 station ran the source and cite kinds only
while the process and manifest groups are kind repo (re-proved 63 of 73); the workpiece-time selection found three D26
process facts unmapped (the D26 replay added to the process group); the registers spelled five evidence paths short
(the selfhost probe records carry their question in the name; the public-HTTPS record lives in its own directory) and one
hardening answer cited a receipt log as evidence; the manifest gate hard-coded the issue task range D21-D26 (now any
delta id); I-36 covered nothing once the manifest sees IMPL-AUDIT (emptied, as D26 did for I-35); the status scan had no
zone for design/foundation-closure/ (13 unclassified markers; zone Z-FOUNDATION-CLOSURE added).  The second dry run
passed every station command except the three placeholders (predictions, the retire that a dry run skips, the observed
record); nothing of the route was re-run.

## 5. Invariants

```text
I1  ALIGNMENT FIRST: no self-hosting implementation, no compiler change, no language version change; compiler/, host/,
    factory/src/, fixtures/ byte-identical to the base
I2  NO BYPASS: the language law changes only through the forged, attacked and registered station S-LANGUAGE-LAW;
    STATION-REGISTRY.md only through S-ANNOTATE; both insertion-only (0 deleted lines)
I3  COMPILER N DEFINES LANGUAGE N: the committed manifest and the corpus table are derived from / frozen by the base
    compiler and reproduced by a fresh build in this delta; the grammar's declared version equals the parser's
I4  EVERY ROW LINKED: the structural check refuses a register row without its full chain, a non-current fact, a missing
    evidence path, an open blocker without a sequence step or boundary class, an acceptance step without a mechanism
I5  STALE_IF, NOT INTUITION: exactly the facts the selector selects are re-proved; [RUN] facts of the baseline are not
    re-executed unless selected
I6  HONEST BOUNDARIES: the observed-ASCII finding, the RUST_BUILD boundary and the acceptance verdict (0 of 16 without
    the host) are recorded as GAP/UNK facts with their evidence; nothing is drawn away
I7  HISTORY IMMUTABLE: D0-D26 evidence, receipts, earlier epochs and records untouched; D12 stays historical evidence
```

## 6. Structural check

```text
every component of the target has an owner ...... seed/broker (seed.json), objects/pointers (correspondence), law engine
                                                   (FC-3), kernel (compiler crates), language (manifest + corpus), stations
                                                   (S-LANGUAGE-LAW registered; capability ops FC-4) ..................... PASS
every output has a consumer or terminal role .... registers -> structural check -> CLOSURE-REGISTERS.md -> HANDOFF;
                                                   manifest/corpus -> S-LANGUAGE-LAW verification + runbook group closure;
                                                   census/feedback/rust-build -> facts D27; epoch -> graph -> Q22 ......... PASS
types / contracts match ......................... registers validated by tests/closure/structural-check.mjs (schema, cross
                                                   references, statuses, evidence paths, current facts) ................... PASS
forbidden bypasses absent ....................... no AGENT -> REPO; language law only via S-LANGUAGE-LAW; registry only via
                                                   S-ANNOTATE; evidence only via S-BUILD / S-BROWSER / S-EVIDENCE ......... PASS
illegal cycles absent ........................... COMPILER N DEFINES LANGUAGE N; NEW SYNTAX NEVER AUTHORIZES ITSELF; N
                                                   verifies N+1; the corpus of N is the oracle; no D27 fact rests on a D27
                                                   claim without evidence ................................................. PASS
invariants represented .......................... I1-I7 above; the station's LANGUAGE VERSION BOUND invariant is checked by
                                                   a command in F3 and in every re-proof of group closure .................. PASS
tests / evidence obligations attached ........... every fixture has commands with expected outputs; every fact has a probe
                                                   and evidence paths; every GAP has a sequence step or boundary class .... PASS
reconciled with D26 ............................. the baseline is not changed: no [RUN] fact re-proved except the 61 the
                                                   selector selected; the consistency audit recomputed PASS; final-condition
                                                   named as closed (not a gate) ............................................. PASS
next bounded work identified .................... FC-1 D28-SEED-BROKER-QUALIFICATION (registers/sequence.json) .......... PASS

STRUCTURAL CHECK: PASS  -> route D27-FOUNDATION-CLOSURE-ALIGNMENT through W33 (F0-F11), verify, integrate ff-only from
                           8a23c08, re-inspect; broad self-hosting implementation begins no earlier than FC-1
```
