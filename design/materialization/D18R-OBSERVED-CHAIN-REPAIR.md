# D18R - Observed Chain Repair vs Intended

STATUS: RE-OBSERVATION OF THE D18R WORKPIECE (W21 on canonical base 1b81dc0fadffe7a1f3e9ffd6f5d1594a4b3f2e4c)
LAW: compares D18R-INTENDED-CHAIN-REPAIR.md (sections 1-5) with the Factory run (factory/receipts/D18R-CHAIN-REPAIR/,
evidence/D18R/).  The intended drawing is not rewritten; D18's records are not rewritten either.

## 1. Station run

```text
F0-doc       S-DOC       PASS  intended ASCII, ledger (D18 AFTER with the defect recorded + D18R BEFORE); both defects
                               verified present in committed evidence and code before anything else ran
F1-fixture   S-FIXTURE   PASS  repair register and surfaces; builder, gate, envmap; D18 epoch rebuilt byte-identically,
                               D18 graph Q01-Q21 and the D18 gate identical to evidence/D18
F2-doc       S-DOC       PASS  docs/HANDOFF.md (worker row, section 1, absence rule in section 4, resolved block)
F3-doc       S-DOC       PASS  epochs/D18R.json built inside the run; graph merged; views rendered; SCHEMA 12, MAP 11
F4-evidence  S-EVIDENCE  PASS  validate 42, Q01-Q21, stale, merge-check, render-check, D18R surfaces + gate, D18 gate on the
                               new graph, D16/D17 gates, status scan, handoff check, audit -> retire -> audit, index
F5-doc       S-DOC             this record
ROUTE  MATCH  no refusal, no repair, no re-run (dry run of every fixture command at the base before routing)
```

## 2. Graph and gates

```text
epoch D18R  3 nodes / 20 edges: R-52, R-53, FACT-WORKERS-D18R; 1 SUPERSEDES, 9 inherited, 7 register edges, 3 RECONCILES
merged      1101 nodes / 2414 edges; merge-check PASS (D11 base and every epoch through D18 preserved); render-check PASS;
            validate PASS 42 (supersession chain FACT-WORKERS-UNPROBED -> FACT-WORKERS-D18 -> FACT-WORKERS-D18R acyclic,
            every inherited edge carried to the current successor)
gates       D18R gate PASS (2 reconciliations, 1 supersession, 7 edges; 2 retired texts absent from 224 current
            authorities/facts); D18 gate PASS on the new graph; surfaces 2 PASS; D16 capability and D17 implementation
            gates PASS
Q18         FACT-WORKERS-D18 terminates [SUPERSEDED] by FACT-WORKERS-D18R (R-52); current RUN 47, COMPLETE 20 (unchanged);
            [SUPERSEDED] 5, [RESOLVED] 7; current ERR 4, GAP 10, OBS 43, UNK 5
Q21         38 reconciliations (HOLDS 8, OPEN 5, SUPERSEDED 10, ANNOTATED 6, LEDGERED 1, RESOLVED 6, CORRECTED 2); facts
            121 = current 109 + superseded 5 + resolved 7; R-32 row and obligation carry revised_by R-52; new obligation
            R-53 (D19: record the executable actually launched)
```

## 3. Hygiene

```text
status scan   1956 files, 10718 occurrences, 0 unclassified: PASS.  [OBS] the count grows mostly because the committed
              D18 status inventory (evidence/D18/status/inventory.json) is itself scanned (5686 occurrences under
              evidence/D18, class B historical evidence); nothing unclassified
handoff check PASS
audit         W20 (integrated) RETIRABLE -> REMOVED; after RETIRABLE 0, KEEP 8 (W11/W14/W16..W20-stage,
              factory-bootstrap-bin), CURRENT 2 (W21, W21-stage)
```

## 4. Intended vs observed

```text
P1  MATCH   D18 epoch rebuilt byte-identically; Q01-Q21 and gate identical to evidence/D18
P2  MATCH   3 / 20; 1101 / 2414; validate PASS 42; D11-D18 preserved
P3  MATCH   D18R gate PASS, D18 gate PASS, surfaces 2 PASS
P4  MATCH   Q21 38 rows, R-32 revised_by R-52; Q18 current RUN 47 / COMPLETE 20
P5  MATCH   status scan PASS, handoff check PASS; W20 RETIRABLE -> REMOVED
STRUCTURE MATCH  D18 records, epoch, register and evidence untouched (merge-check, must_not_change); law untouched
```

## 5. Current reading after the repair

```text
[GAP]  FACT-WORKERS-D18R: a dedicated worker was constructed (D12) and hardwareConcurrency 4 observed (D11, D16) in the
       Chromium 141 headless shell; no worker admission contract exists
[OBS]  ENV-D12-BROWSER-PERSISTENT other_state.executable is Playwright's default chromium path, not the launched binary
       (R-53); the launched executable has never been recorded -> D19 obligation
[NEW]  procedure rule: absence claims are checked against committed evidence before they are asserted (docs/HANDOFF.md 4)
```

GATE: PASS - the D18 chain defect is removed: no current authority or fact, and not the live handoff, carries a statement
contradicted by committed evidence; the correction is traceable (R-52, R-53) and D18 stays as written.  No internal chain
defect is open.  Next: D19-REPROVE-REOBSERVE (Q21 obligations R-03, R-04, R-49, R-53).
