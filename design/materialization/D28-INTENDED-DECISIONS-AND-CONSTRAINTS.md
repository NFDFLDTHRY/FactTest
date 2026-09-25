# D28 - Intended Decisions and Constraints (pass 1 of the six-part analysis and mapping series)

STATUS: INTENDED ASCII (assembled before routing; source of record for delta D28-DECISIONS-AND-CONSTRAINTS, workpiece
W35, base 0f57ecf = D28-PROMPT-INTAKE)
REQUEST: design/materialization/D28-D33-ANALYSIS-SERIES-PROMPT.md section 4 (the approved pass-1 plan): "make every open
owner decision and every environment limit an explicit, evidence-backed row that the later passes and the implementation
deltas can cite, without deciding anything on the owner's behalf."
QUESTION: which decisions and environment limits gate the implementation plan, what does the evidence say about each
option, and what default may the plan assume until the owner decides?
SCOPE: registers, a check extension, records; NO implementation, NO language change, NO decision taken by the agent.

## 0. Observation before drawing

```text
branch / HEAD   claude/facttest-materialization-27amc7 at 0f57ecf (D28-PROMPT-INTAKE, ff from 2bbda62 = D27); pushed;
                main still 8a23c08 (PR #8); tree = D27 + the tracked series prompt; status clean
open decisions  docs/HANDOFF.md section 6 OWNER rows: D-1 home origin, D-2 generated-app origins, D-3 RUST_BUILD strategy,
                D-5 BUILD without registry, D-6 object hash, D-8 seed replacement, D-9 history horizon, D-10 sensor
                routing; DECIDED D-4 (toolchain pin), D-7 (literal path authority); owner issues I-12, I-13, I-18 (law
                wording), I-29 (C14 text), I-33 (runtime self-integrity); D27's I-39 (observed ASCII as source, class D)
open limits     public HTTPS unreachable (FACT-D25-PUBLIC-HTTPS), persist() false in the headless shell
                (FACT-SH-STORAGE-DURABILITY-D18), no installation observed (FACT-CAP-MANIFEST-EXPOSURE), no GPU device
                (FACT-HARDWARE-GPU-UNAVAILABLE), no wasm-host rustc / no cranelift (FACT-D27-RUST-BUILD-BOUNDARY), Linux
                only, the egress policy (FACT-PUBLISHED-FRONTIER-D20, FACT-SH-GITHACK-UNREACHABLE), one Chromium version,
                threads unadmitted (FACT-SHARED-THREADS-UNADMITTED-D18)
what is provable here  loopback secure context with OPFS, IndexedDB, CacheStorage, service workers, Web Locks, opaque
                frames, wasm64, git identities and atomic pointers (FACT-D25-RUNTIME-PHYSICAL, FACT-SH-*); the host judge
                and toolchain (FACT-D27-ENVIRONMENT-IDENTITY)
sequence        tests/closure/registers/sequence.json FC-1..FC-8 names blockers and acceptance steps but no decision or
                constraint: a step could run under an undecided question without saying so
scratch check   the extended structural check found two inconsistencies while the registers were drafted (gates named by
                a decision but not listed by the step, and the reverse: D-3/D-6 on FC-8, I-29 on FC-5, K-03/K-10 on FC-7
                and FC-8); both repaired in the registers before routing - the check exists for exactly this
```

## 1. Intended structure

```text
 decisions.json (14 rows)                          constraints.json (11 rows)
 ┌──────────────────────────────────────────┐      ┌────────────────────────────────────────────┐
 │ id, title, question, origin              │      │ id, constraint, evidence (facts), records   │
 │ options[] {evidence_for, evidence_against│      │ prevents; provable_here true|false          │
 │            evidence_paths, consequence   │      │ external_procedure + external_evidence_schema│
 │            per FC step}                  │      │ acceptance_steps; sequence; note            │
 │ default {option, reason, evidence}       │      └──────────────┬─────────────────────────────┘
 │ status DECIDED | ASSUMED-DEFAULT |       │                     │
 │        OWNER-ONLY | NOT-GATING           │                     │
 │ gates[] (FC steps); external_input       │                     │
 └──────────────┬───────────────────────────┘                     │
                ▼                                                 ▼
 sequence.json: every FC step  + decisions[] + constraints[] + assumption      acceptance-test.json: + external_constraints[]
                │
                ▼
 tests/closure/structural-check.mjs  + decisions_complete  + constraints_and_sequence_gated
   every option evidenced by current facts; every assumed default evidenced; gates == the steps listing the decision;
   NOT-GATING rows have no gates and a reason; every external constraint has a procedure and an evidence schema;
   sequence == the steps listing the constraint; external_constraints per acceptance step == the external rows touching it
                │
                ▼
 CLOSURE-REGISTERS.md sections 11-13 (decisions, constraints, external inputs pending + the assumption of every step)
 evidence/D28/closure/{gating.json (the D28 station's record), registers/}   epoch D28: FACT-D28-DECISIONS-MAPPED [OBS],
 FACT-D28-CONSTRAINTS-MAPPED [OBS], FACT-D28-EXTERNAL-INPUTS-PENDING [UNK] + the process facts of the re-proof
```

The defaults the registers ASSUME (each with the facts that support it; none is a decision):

```text
D-1  dedicated HTTPS origin; loopback as the evidence origin here    P03 + P08: storage is origin-scoped, same-origin reaches all
D-2  one origin per generated app                                   FACT-D25-ISOLATION-ORIGIN, P08
D-3  B3 import-only first; FC-7 measures B4 against B1/B5           FACT-KERNEL-IDENTITY-D24, FACT-D27-RUST-BUILD-BOUNDARY
D-5  BUILD without a registry refuses (NO_PLAN); FC-5 under the contract   FACT-D24-EVIDENCE-BOUND, P10
D-6  git SHA-1 objects, sha256 artifacts                             P09
D-8  seed replacement only as a qualified origin event               P02, P14, P15
D-9  a recorded tree as the horizon; packfiles at L4                 P09 (loose objects only)
I-39 a source-role statement in LANGUAGE 2                           FACT-D27-OBSERVED-ASCII-NOT-DISTINGUISHABLE
NOT-GATING  D-10 sensors, I-29 C14 text, I-33 self-integrity (seed rule 2 checks every served object), I-12/13/18 wording
DECIDED     D-4 toolchain pin (D13/D24), D-7 literal authority (D13)
```

## 2. Mutation plan by station (delta D28-DECISIONS-AND-CONSTRAINTS, workpiece W35, base 0f57ecf)

```text
F0-doc       S-DOC       this record, the ledger (intake AFTER, D28 BEFORE), the target note (section 12: the analysis
                         series precedes FC-1), the delta + fixtures
F1-fixture   S-FIXTURE   registers decisions + constraints; sequence and acceptance gating fields; the structural check
                         extension; facts/D28.json; runbook (3 fact entries; the D27 replay in group process for the three D27 process facts
                         the selection found unmapped); issues (I-38 covers emptied): syntax, JSON,
                         structural check PASS with the gating checks, counts
F2-browser   S-BROWSER   identity -> evidence/D28/identity
F3-evidence  S-EVIDENCE  STALE_IF selection (gaps 0, unmapped 0)
F4-build     S-BUILD     fresh build directory; run-selected for every kind the selection names (source, cite, repo, build:
                         the closure group re-runs the extended check with a fresh factc because tests/closure changed);
                         every result PASS
F5-doc       S-DOC       execution manifest rebuilt (deterministic); CLOSURE-REGISTERS.md re-rendered with sections 11-13
                         (evidence required; deterministic); SCHEMA, ENVIRONMENT-MAP, HANDOFF, README delivered
F6-evidence  S-EVIDENCE  manifest/issues/gate; the gating record (the extended check with evidence, closure/gating.json:
                         distinct from the closure group's record the re-proof fragment binds) and the registers copied
                         beside it; preview: re-proof fragment on a temporary graph, queries, status scan, handoff check, audit
F7-doc       S-DOC       epoch D28 = re-proof fragment + facts fragment; graph; views; validate 42
F8-evidence  S-EVIDENCE  Q01-Q22, stale, merge/render checks, the earlier gates, status scan, handoff check, audit on the
                         committed graph, workpiece audit -> retire (W33) -> audit, index of evidence/D28
F9-doc       S-DOC       the observed record
REINSPECT                STRUCTURAL CHECK: PASS here; GATE: PASS in the observed; validate / merge-check / render-check;
                         epoch D28 rebuilt byte-identically from the D27 graph; the structural check and the rendering
                         reproduced from the committed tree
```

## 3. Predictions (from the dry run on a detached worktree at 0f57ecf)

```text
selection      183 current RUN/OBS facts evaluated in the workpiece, 81 selected: environment drift 73 (source tips; pairs
               SAME 169 / DRIFT 73 / UNK 14), implementation change 20 (tests/closure, the runbook and the issue inventory
               changed: the D27 closure facts, the D19/D20/D26/D27 process facts, the manifest facts), obligation 0; gaps 0
               (the three D27 process facts mapped by the D27 replay); groups reopen 5, ingress 54, clauses 2, process 8,
               identity 4, manifest 3, closure 5; every selected fact re-proved (81), 0 failed.  A tip moving between the
               dry run and the route changes the environment count only
registers      decisions 14 (DECIDED 2, ASSUMED-DEFAULT 8, OWNER-ONLY 0, NOT-GATING 4); constraints 11 (3 provable here,
               8 external); external inputs pending 10 (2 decisions, 8 constraints); acceptance steps with external
               constraints: 1, 3, 4, 10, 12, 13; structural check 11 checks PASS with every evidence path present;
               rendering with sections 11-13 byte-identical between the doc and evidence stations; 0 of 16 steps RUN
manifest       6419 files, 72 components (PRODUCTION 68, FACTORY 25, TEST 132, FIXTURE 111, REFERENCE 86, RECORD 1041, LAW 32,
               HISTORICAL 11, EVIDENCE 4913); deterministic; gate PASS with 41 issues (A 14, B 12, C 2, D 4, E 1, F 4, G 4)
epoch D28      35 nodes / 232 edges (ENVIRONMENT 4, EVIDENCE 25, COMPUTATIONAL_FACT 6 = 3 D28 + 3 process); merged graph
               1503 nodes / 4303 edges; validate 42 checks
Q22            214 current facts (RUN 136, OBS 52, GAP 14, ERR 5, UNK 7); RUN claims 136 = 135 claimable + 1 invalidated;
               81 re-proved in D28; open stops GAP 12, ERR 5, UNK 7, closed by evidence 2; the 6 FACT-D28-* rows: 3 RUN,
               2 OBS, 1 UNK; stale relations 711 over 22 dimensions
audit          consistency audit 13 checks PASS on the preview graph and identical on the committed graph; status scan
               PASS (0 unclassified); handoff check PASS; the earlier gates PASS
hygiene        workpiece audit: RETIRABLE 4 (W33, W34 and their staging copies) -> retire -> RETIRABLE 0; index of
               evidence/D28 (evidence_dir evidence/D28; 818 files in the dry run, two more in the route: the retire
               record and its log)
```

Dry runs on a detached worktree at 0f57ecf preceded the route.  The first found: the three D27 process facts unmapped
by the selector (the D27 replay added to the process group, as D26 and D27 did for their predecessors) and an evidence
node collision (the D28 facts cited the closure group's structural-check record, which the re-proof fragment already
binds: the D28 station now writes its own record, closure/gating.json).  The second passed every station command except
the placeholders and a leftover count token in the Q22 check; nothing of the route was re-run.

## 4. Invariants

```text
I1  THE AGENT DECIDES NOTHING: every default is ASSUMED-DEFAULT with current-fact evidence, or DECIDED by an earlier
    delta or the owner, or NOT-GATING with a reason; no row is OWNER-ONLY today, so no step waits
I2  NO STEP RUNS UNDER AN UNSTATED QUESTION: every FC step names its decisions, constraints and assumption; the check
    refuses a gate the sequence does not mirror
I3  EXTERNAL IS EXTERNAL: a constraint not provable here names the procedure and the evidence schema another environment
    must produce; loopback is never substituted for it
I4  NO ACCEPTANCE STEP MOVES: the verdict stays 0 of 16 without the host; external_constraints only annotate
I5  NO IMPLEMENTATION, NO LANGUAGE CHANGE: compiler/, host/, factory/, fixtures/ and every law document byte-identical
I6  STALE_IF, NOT INTUITION: exactly the selected facts are re-proved
I7  HISTORY IMMUTABLE: D0-D27 evidence, receipts, epochs and records untouched
```

## 5. Structural check

```text
every register row has an owner ................ decisions (owner / earlier delta), constraints (the environment),
                                                  defaults (the evidence cited) ..................................... PASS
every output has a consumer ...................... registers -> structural check -> CLOSURE-REGISTERS.md sections 11-13 ->
                                                  HANDOFF (owner action list); sequence gating -> passes 2-6 and FC-1..8;
                                                  facts -> epoch D28 -> Q22 ......................................... PASS
types / contracts match .......................... the two new checks validate statuses, option ids, fact currency, evidence
                                                  paths, step ids and the mirror between gates and listings .......... PASS
forbidden bypasses absent ........................ no AGENT -> REPO; registers and tools through S-FIXTURE; records through
                                                  S-DOC; evidence through S-BROWSER / S-BUILD / S-EVIDENCE .......... PASS
illegal cycles absent ............................ a decision never cites a D28 fact; the D28 facts cite the registers and the
                                                  check record only ................................................. PASS
invariants represented ........................... I1-I7 ............................................................ PASS
tests / evidence obligations attached ............ every fixture has commands with expected outputs; every fact has a probe
                                                  and evidence paths; the UNK fact names what would close it ......... PASS
reconciled with D27 .............................. the target, blockers, acceptance verdict and sequence order unchanged;
                                                  only gating fields added; the audit recomputed ...................... PASS
next bounded work identified ..................... pass 2: D29-LAW-ENGINE-DECOMPOSITION under the assumptions of D28 ...... PASS

STRUCTURAL CHECK: PASS  -> route D28-DECISIONS-AND-CONSTRAINTS through W35 (F0-F9), verify, integrate ff-only from
                           0f57ecf, re-inspect
```
