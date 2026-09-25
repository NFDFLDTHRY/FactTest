# D28 - Observed Decisions and Constraints vs Intended (pass 1 of 6)

STATUS: RE-OBSERVATION OF THE D28 WORKPIECE (W35 on canonical base 0f57ecfd82295ee207f51432af764258fd34b052 =
D28-PROMPT-INTAKE; judged by the D22 Factory built from that base)
LAW: compares D28-INTENDED-DECISIONS-AND-CONSTRAINTS.md (sections 0-5) with the Factory run
(factory/receipts/D28-DECISIONS-AND-CONSTRAINTS/, evidence/D28/).  INTENDED -> EXECUTION -> EVIDENCE -> OBSERVED.

## 1. Station run

```text
F0-doc       S-DOC       PASS  intended ASCII (STRUCTURAL CHECK: PASS), ledger (intake AFTER, D28 BEFORE), the target's
                               section-12 note (insertion-only); nothing else differs from 0f57ecf
F1-fixture   S-FIXTURE   PASS  decisions (14 rows), constraints (11 rows), sequence and acceptance gating fields, the
                               structural check extension (11 checks), facts/D28.json (3 facts), runbook (129 facts: 3
                               D28 entries + the D27 replay), issues (I-38 covers emptied): syntax, JSON, check PASS
F2-browser   S-BROWSER   PASS  identity: 4 toolchains, 45 source tips, HeadlessChrome/141.0.7390.37
F3-evidence  S-EVIDENCE  PASS  selection 183 evaluated / 81 selected (environment 73, implementation 20, obligation 0; SAME 169 / DRIFT 73 / UNK 14; gaps 0)
F4-build     S-BUILD     PASS  reopen 5, ingress 54, clauses 2, process 8, identity 4, manifest 3, closure 5 = 81 facts re-proved, 0 failed; the closure group re-ran the extended check with a fresh factc
F5-doc       S-DOC       PASS  execution manifest rebuilt (6419 files, 72 components; deterministic); CLOSURE-REGISTERS.md
                               re-rendered with sections 11-13 (deterministic); SCHEMA, ENVIRONMENT-MAP, HANDOFF, README
F6-evidence  S-EVIDENCE  PASS  gate PASS (41 issues); the gating record closure/gating.json (11 checks PASS, evidence
                               required, 10 external inputs, 0 steps RUN without the host) and the registers copied beside
                               it; preview audit 13 PASS
F7-doc       S-DOC       PASS  epochs/D28.json = re-proof fragment + facts fragment: 35 nodes / 232 edges (ENVIRONMENT 4, EVIDENCE 25, COMPUTATIONAL_FACT 6); graph 1503 nodes / 4303 edges;
                               views; validate 42
F8-evidence  S-EVIDENCE  PASS  Q01-Q22, stale, merge-check, render-check, the earlier gates, status scan (0 unclassified),
                               handoff check, the audit identical on the committed graph (13 PASS), audit -> retire ->
                               audit (RETIRABLE 4 -> 0: W33, W34 and their staging copies REMOVED; W25, W30 KEEP), index (820 files of evidence/D28)
F9-doc       S-DOC             this record
ROUTE  MATCH  no refusal, no re-run (the two dry runs and their findings: intended record section 3).
```

## 2. The pass observed (evidence/D28)

```text
DECISIONS       14 rows: D-1, D-2, D-3, D-5, D-6, D-8, D-9, I-39 ASSUMED-DEFAULT with current-fact evidence; D-4, D-7
                DECIDED; D-10, I-29, I-33, I-12/I-13/I-18 NOT-GATING with reasons; 0 OWNER-ONLY: no sequence step waits
CONSTRAINTS     11 rows: provable here K-09 (threads unadmitted), K-10 (loopback secure context with every primitive),
                K-11 (the host judge and toolchain); external K-01 public HTTPS, K-02 durability under installation,
                K-03 installation, K-04 hardware GPU, K-05 hosted toolchains, K-06 other platforms, K-07 the published
                frontier, K-08 browser updates - each with a procedure and an evidence schema
GATING          every FC step names its decisions, constraints and assumption; every acceptance step names its external
                constraints (1: K-01 K-02 K-03; 3, 4: K-05; 10: K-01; 12, 13: K-02 K-08); the check refuses a mismatch
                (two were found and repaired while drafting: D-3/D-6 on FC-8, K-03/K-10 on FC-7 and FC-8, I-29 on FC-5)
EXTERNAL INPUTS 10 pending: the dedicated origin and one public-HTTPS run (D-1), the RUST_BUILD choice after FC-7 (D-3),
                and the 8 external constraint rows (CLOSURE-REGISTERS.md section 13)
STALE_IF        183 evaluated / 81 selected (environment 73, implementation 20, obligation 0; SAME 169 / DRIFT 73 / UNK 14; gaps 0); reopen 5, ingress 54, clauses 2, process 8, identity 4, manifest 3, closure 5 = 81 facts re-proved, 0 failed
EPOCH / GRAPH   epoch 35 nodes / 232 edges (ENVIRONMENT 4, EVIDENCE 25, COMPUTATIONAL_FACT 6); graph 1503 nodes / 4303 edges; Q22 214 current facts (RUN 136, OBS 52, GAP 14, ERR 5, UNK 7); 136 = 135 claimable + 1 invalidated; 81 re-proved in D28; open stops GAP 12, ERR 5, UNK 7 (2 closed by evidence); stale 711 over 22 dimensions
CONSISTENCY     audit 13 PASS (preview and committed graph identical); gate PASS; status scan PASS; handoff PASS
```

## 3. Intended vs observed

```text
P1  selection      MATCH   183 / 81 (73 / 20 / 0), gaps 0; 7 groups, 81 re-proved, 0 failed
P2  registers      MATCH   14 decisions (2 / 8 / 0 / 4), 11 constraints (3 / 8), 10 external inputs; 11 checks PASS; 0 of 16 RUN
P3  manifest       MATCH   6419 files, 72 components, deterministic; gate PASS, 41 issues
P4  epoch / graph  MATCH   epoch 35 / 232 (ENV 4, EV 25, FACT 6); merged 1503 / 4303; validate 42
P5  Q22 / audit    MATCH   Q22 214 (RUN 136, OBS 52, GAP 14, ERR 5, UNK 7); 81 re-proved; audit 13 PASS identical on the committed graph
P6  hygiene        MATCH   RETIRABLE 4 -> 0 (W33, W34, W33-stage, W34-stage REMOVED); index 820 files of evidence/D28 (evidence_dir evidence/D28)
STRUCTURE MATCH   compiler/, host/, factory/src/, factory/registry/, fixtures/ and every law document byte-identical to
                  0f57ecf (I5); the agent decided nothing: every default ASSUMED-DEFAULT with evidence (I1); every step
                  gated (I2); external rows external (I3); the acceptance verdict unchanged (I4); exactly the selected
                  facts re-proved (I6); D0-D27 evidence, receipts, epochs and records untouched (I7)
```

## 4. Current reading

```text
[OBS]  FACT-D28-DECISIONS-MAPPED: every gating decision has evidenced options, an assumed default and mirrored gates
[OBS]  FACT-D28-CONSTRAINTS-MAPPED: every environment limit is provable here with records or external with a procedure
[UNK]  FACT-D28-EXTERNAL-INPUTS-PENDING: 10 inputs only the owner or another environment can supply
[RUN]  FACT-D28-ENVIRONMENT-IDENTITY, -LAUNCHED-EXECUTABLE, -MINIMUM-SET: the pass's process facts
[OPEN] the boundary rows of docs/HANDOFF.md section 6, the blocker register and the open issues (D/E/F/G only); the owner
       flips an ASSUMED-DEFAULT row through S-FIXTURE and the steps it gates re-select
[NEXT] pass 2: D29-LAW-ENGINE-DECOMPOSITION under the assumptions of tests/closure/registers/decisions.json
```

GATE: PASS - every open owner decision and every environment limit that could gate the implementation plan is an
explicit, evidence-backed register row; every sequence step names the decisions and constraints it runs under and its
assumption; every acceptance step names the external constraints that touch it; the external inputs are enumerated;
the structural check refuses a gate the sequence does not mirror; nothing was decided by the agent, implemented, or
changed in the language.  Pass 1 of 6 closed.
