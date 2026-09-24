# D18R - Intended Chain Repair (before pass D19)

STATUS: INTENDED ASCII (assembled before routing; source of record for delta D18R-CHAIN-REPAIR, workpiece W21)
REQUEST: design/materialization/D14-D19-TECHNICAL-REFERENCE-REVIEW-PROMPT.md, pass-to-pass gate: "Do not begin pass N+1
while pass N contains an INTERNAL chain defect."  D19 planning (reading tests/envmap/browser-probe.mjs, the harness D19
would re-run) found that D18 carried a statement contradicted by evidence already committed.
SCOPE: correct exactly what contradicts committed evidence, through the D18 reconciliation machinery (supersession with
inherited edges; CORRECTED reading); correct the live handoff; add the procedure rule that prevents the defect class.
Nothing is edited in D18's records, epochs or evidence: they stay as history, and this repair names the error.

## 0. Observation before drawing

```text
HEAD           1b81dc0 (D18 integrated, pushed; re-inspection MATCH); working tree clean
defect 1 [ERR] FACT-WORKERS-D18 (D18, current) states "navigator.hardwareConcurrency was never read"; its D11 predecessor
               FACT-WORKERS-UNPROBED states "no fixture ... reads hardwareConcurrency".  Committed evidence says 4:
               evidence/D11/browser/default.json and gpu-flags.json (page.hardwareConcurrency, D11's own browser probe;
               EV-D11-BROWSER-GPUFLAGS observed_result ends "hardwareConcurrency 4") and
               evidence/D16/census/records/CAP-WORKER-DEDICATED.json (EV-D16-CENSUS-WORKER-DEDICATED).  The same wording
               is in docs/HANDOFF.md section 6 and in D18's R-32 obligation.  D18's MATCH verdicts compared against
               predictions that already contained it.
defect 2 [ERR] D18 R-45 cites ENV-D12-BROWSER-PERSISTENT other_state.executable (/opt/pw-browsers/chromium-1194/...) as
               launch identity.  tests/selfhost/primitives-probe.mjs line 57 fills it from chromium.executablePath(),
               the default path of Playwright's full 'chromium' browser; for headless launches Playwright 1.56 selects
               chromium-headless-shell (installed chromium.js line 318; D17 CL-IMP-PW1).  The executable launched was
               never recorded.
scope check    every other D18 current statement re-read against committed evidence: no further contradiction
tools          the D18 builder follows only the register's supersessions, requires a clause fragment and a ledger;
               the gate requires a ledger; Q21 cannot say that a reconciliation was revised
```

## 1. Repair register (tests/reconcile/d18r-reconciliation.json)

```text
R-52  SUPERSEDED  FACT-WORKERS-D18 (+ re-examines FACT-WORKERS-UNPROBED)
                  -> FACT-WORKERS-D18R [GAP]: worker constructed (EV-D12-P10); hardwareConcurrency 4 in the Chromium 141
                     headless shell (EV-D11-BROWSER-DEFAULT, EV-D11-BROWSER-GPUFLAGS, EV-D16-CENSUS-WORKER-DEDICATED); no
                     worker admission contract.  Inherits every edge of FACT-WORKERS-D18; PROBED_BY PROBE-BROWSER-IDENTITY,
                     PROBE-CAPABILITY-CENSUS; INVALIDATED_BY EV-D11-BROWSER-GPUFLAGS on both predecessors
R-53  CORRECTED   ENV-D12-BROWSER-PERSISTENT: other_state.executable reads "Playwright default chromium path (not the
                  launched binary)"; D19 obligation: record the executable actually launched
retired texts     "hardwareConcurrency was never read", "reads hardwareConcurrency" (no current authority or fact may
                  carry them; gate current_statements_clean)
```

## 2. Tool changes (generic; the D18 graph answers exactly as before)

```text
build-reconciliation.mjs  clause fragment, new authorities and ledger optional; supersession chains followed through the
                          graph's SUPERSEDES edges (a later successor inherits what its predecessors carried)
gate.mjs                  ledger optional; register "retired_texts" checked on current authorities and facts
envmap.mjs Q21            revised_by on a reconciliation row (and its obligation) when a successor it introduced was
                          superseded later
regression                the D18 epoch rebuilds byte-identically; the D18 graph answers Q01-Q21 byte-identically to
                          evidence/D18; the D18 gate re-run matches evidence/D18/gate.json
```

## 3. Graph epoch D18R (add-only; declares nothing)

```text
adds      R-52, R-53 (RECONCILIATION); FACT-WORKERS-D18R; 1 SUPERSEDES + 9 inherited edges; 7 register edges; 3 RECONCILES
merged    1101 nodes / 2414 edges; validate 42 PASS
Q18       FACT-WORKERS-D18 [SUPERSEDED] by FACT-WORKERS-D18R (R-52); current RUN claims unchanged (47, 20 COMPLETE)
Q21       38 reconciliations (SUPERSEDED 10, CORRECTED 2, ...); facts 121 = current 109 + superseded 5 + resolved 7; R-32's
          obligation marked revised_by R-52; new obligation R-53 (D19: launched executable)
```

## 4. Mutation plan by station (delta D18R-CHAIN-REPAIR, workpiece W21, base 1b81dc0)

```text
F0  S-DOC       this ASCII; ledger (D18 AFTER + D18R BEFORE); delta; fixtures
F1  S-FIXTURE   tests/reconcile/{d18r-reconciliation.json, d18r-surfaces.json, build-reconciliation.mjs, gate.mjs},
                tests/envmap/envmap.mjs; checks: syntax, generic, D18 epoch rebuild byte-identical, D18 graph Q01-Q21
                byte-identical to evidence/D18, D18 gate identical
F2  S-DOC       docs/HANDOFF.md (section 1, section 4 absence rule, section 6 worker row, resolved block)
F3  S-DOC       epochs/D18R.json built inside the run; merged graph; views; SCHEMA section 12, ENVIRONMENT-MAP section 11
F4  S-EVIDENCE  validate, Q01-Q21, stale, merge-check, render-check, D18R surfaces and gate, D18 gate on the new graph,
                D16/D17 gates, status scan, handoff check, audit -> retire -> audit, index (evidence/D18R/)
F5  S-DOC       D18R-OBSERVED-CHAIN-REPAIR.md
MUST NOT CHANGE: every law and pass document, README.md, compiler/, host/, factory/, fixtures/, D0-D18 evidence and epochs
```

## 5. Predictions

```text
P1  F1 regression identical (D18 epoch, Q01-Q21, gate)
P2  epoch D18R 3 nodes / 20 edges; merged 1101 / 2414; validate PASS 42; D11-D18 preserved
P3  D18R gate PASS (2 reconciliations, 1 supersession, 7 edges; retired texts absent); D18 gate still PASS; surfaces 2 PASS
P4  Q21 38 rows, R-32 revised_by R-52; Q18 current RUN 47 / COMPLETE 20 unchanged
P5  hygiene: status scan PASS, handoff check PASS; W20 RETIRABLE -> REMOVED
```

## 6. Invariants

```text
I1  D18 records, epoch, register and evidence are not edited; the repair names the error
I2  one current truth: the false wording leaves every current node and the live handoff
I3  the procedure rule (absence claims checked against committed evidence) is added to docs/HANDOFF.md section 4
```

## 7. Structural check

```text
inputs supplied        committed evidence locations for both defects; D18 register machinery                    PASS
outputs consumed       FACT-WORKERS-D18R, R-53 obligation -> D19 environment identity                         PASS
contracts match        no new class or edge type; register schema facttest-reconciliation/1                    PASS
forbidden bypasses     no edit of D18 artifacts; law untouched                                                 PASS
illegal cycles         supersession chain UNPROBED -> D18 -> D18R acyclic (validate)                           PASS
invariants represented I1-I3 -> merge-check, gate retired_texts, surfaces                                       PASS
tests/evidence         F1 regression, F3 validate, F4 gates                                                    PASS
```

STRUCTURAL CHECK: PASS
