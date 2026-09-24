# D20 - Observed Main Sync vs Intended

STATUS: RE-OBSERVATION OF THE D20 WORKPIECE (W23 on canonical base c3159d562768d52465ead5e44bc6c5259dfc1b79, the
content-neutral sync merge of main 1205fda into 780aee1)
LAW: compares D20-INTENDED-MAIN-SYNC.md (sections 1-8) with the Factory run (factory/receipts/D20-MAIN-SYNC/,
evidence/D20/).  INTENDED -> EXECUTION -> EVIDENCE -> OBSERVED.  Neither line's records are rewritten.

## 1. Sync merge and station run

```text
M            c3159d5: parents 780aee1 (this branch) and 1205fda (main, pull request #5); tree equal to 780aee1's (checked
             before the delta and by tests/reprove/lineage.mjs: 19 commits from 4a151c9 = 14 Factory, 4 owner merges, 1
             sync merge, 0 unclassified)
F0-doc       S-DOC       PASS  intended ASCII; ledger (D19 AFTER, the main line's block embedded + its AFTER, D20 BEFORE)
F1-fixture   S-FIXTURE   PASS  tools; tests/reference/{ingress.mjs, run-ingress-checks.sh} imported (2 checked);
                               regressions: the D19 graph validates (42), renders and merges identically and answers
                               Q01-Q22 byte-identically to evidence/D19; D18 (built on the D18 tree), D18R and D19 epochs
                               rebuilt byte-identically; D19's selection replayed identically (29 of 90); the lineage
                               classifies c3159d5 as the sync merge
F2-doc       S-DOC       PASS  import: the main line's records, receipts, fixtures/reference/, epochs/D14-RESCAN.json
                               (125 checked)
F3-annotate  S-ANNOTATE  PASS  import: 5 law documents unioned (5 checked); 0 deleted lines against c3159d5
F4-evidence  S-EVIDENCE  PASS  import: evidence/D14/{audit,ingress,hygiene}/, evidence/D14-RESCAN/ (44 checked)
F5-doc       S-DOC       PASS  epochs/D20-SYNC.json; graph D11..D19 + D14-RESCAN + D20-SYNC (1225 / 2999); views
F6-browser   S-BROWSER   PASS  identity: 4 toolchains, 45 source tips (4 moved since D19)
F7-evidence  S-EVIDENCE  PASS  selection: 71 of 152, gaps 0
F8-browser   S-BROWSER   PASS  identity group (1 fact)
F9-build     S-BUILD     PASS  no build group selected: nothing ran
F10-build    S-BUILD     PASS  clauses (41 s, 29 s), reopen (64 s), ingress (27 s)
F11-evidence S-EVIDENCE  PASS  lineage, paths, process
F12-doc      S-DOC       PASS  epochs/D20.json; graph; views; SCHEMA 14, ENVIRONMENT-MAP 13; docs/HANDOFF.md; README.md
F13-evidence S-EVIDENCE  PASS  validate, Q01-Q22, stale, merge-check, render-check, D20 gate, Q22 stop check, D20-SYNC
                               surfaces + gate, import check (177), D18/D18R gates, D16/D17 gates, status scan, handoff
                               check, audit -> retire -> audit, index
F14-doc      S-DOC             this record
ROUTE  MATCH  no refusal, no repair, no re-run.  Assembly found one wording defect before routing (a successor's note
              quoted the text its reconciliation retires, so the D20-SYNC gate refused it in the dry run; the note was
              reworded in the register); every fixture command then ran on a scratch clone at c3159d5 before routing.
```

## 2. Import (evidence/D20/sync/import.json)

```text
changes      181 of the main line (4d8a4c0..1205fda): added 133, relocated 38 (D14-RESCAN), union 5, embed 1,
             regenerate 3, live 1
checked      177: every added / relocated file byte-identical to 1205fda at its destination, no destination held other
             content in c3159d5; the 5 law documents keep every line of this branch and contain every line the main line
             added (its "D14 ANNOTATION" lines sit between the D13 and D18 annotations); the ledger holds the main line's
             55 added lines as one contiguous block
relocated    factory/deltas/D14-RESCAN.json, factory/fixtures/D14-RESCAN/ (6), epochs/D14-RESCAN.json,
             evidence/D14-RESCAN/{envmap (22), workpieces (6), index.json, index.log}; this branch's D14 records untouched
```

## 3. Graph

```text
D14-RESCAN   72 nodes / 315 edges, merged after D19 under its alias (relabeled_from D14)
D20-SYNC     12 nodes / 112 edges: R-54..R-63 (SUPERSEDED 2, RESOLVED 3, OPEN 2, HOLDS 3), 2 successor facts, 16 inherited
             edges (10 AUTHORIZES carried to D18 successors, 6 from the two supersessions)
D20          25 nodes / 191 edges: ENV-D20-HOST, -BROWSER-DEFAULT, -BROWSER-GPUFLAGS, -SOURCES; evidence; FACT-D20-
             ENVIRONMENT-IDENTITY, -LAUNCHED-EXECUTABLE, -MINIMUM-SET [RUN]; FULFILLS R-54, R-59, R-62, R-63; IMPL-REPROVE
             and its probes reused
merged       1250 nodes / 3190 edges; validate PASS 42; merge-check PASS (D11 base preserved, graph == merge of base and
             epochs incl. the alias); render-check PASS; stale 338 relations over 21 dimensions (D19: 204)
Q21          48 reconciliations (HOLDS 11, OPEN 7, SUPERSEDED 12, ANNOTATED 6, LEDGERED 1, RESOLVED 9, CORRECTED 2); the D20
             obligations fulfilled_by D20 evidence (R-54 4, R-59 2, R-62 4, R-63 1)
gates        D20 re-proof gate PASS (5 checks); D20-SYNC gate PASS (12 surfaces; no retired text on a current node); D18
             and D18R gates PASS; D16 capability and D17 implementation gates PASS
```

## 4. Re-proof (evidence/D20/selection.json, results/)

```text
selection    152 current RUN/OBS facts evaluated: 71 selected (environment 8, implementation 4, obligation 62), gaps 0;
             pairs SAME 123, DRIFT 8, UNK 61; 23 facts had conditions superseded by the ones D19 carried (e.g. the
             ENV-D9-HOST rustup "nightly" drift no longer selects the qualified-proof facts D19 re-proved)
drift        ENV-D19-SOURCES tips moved: chromium main 6411417c0 -> e465e98eb, v8 main 010a4b88b -> 59145ee5f, rust
             master 3670d2532 -> ad2e756c7 (followed HEAD -> main), this branch b509fb009 -> 780aee1b5;
             ENV-D19-HOST repo.commit (the re-proof tools changed in this delta)
UNK          61 pairs, mostly the main line's ENV-D14-HOST-NETWORK (no source tips recorded; egress policy as prose)
ingress      PASS 58: the main line's checks on its own inputs (map and graph at 1205fda) against the imported corpus:
             hosts 23 DENIED, route available (github.com git, raw.githubusercontent.com); verify 83 / refetch 166 PASS;
             64 authority verdicts equal to the recorded ones (RUN 51, OBS 3, n/a 8, ERR 2)
reopen       PASS 5: 63 PIN_MATCH; tip == pin 49, moved/identical 11, moved/changed 3 (clause unchanged or moved with
             identical text), local 1; no maturity drift (FRONTIER-SOURCES-AT-PIN, MEMORY64-FINISHED, WASM-SET-PHASE-1,
             WASM-THREADS-PHASE-4, D14-D11-PINS-RECHECKED-D20)
clauses      PASS 2: D15 60/60 and D16 90/90 VERIFIED at the moved tips
process      PASS 2: D19's selection replayed with the current selector on D19's inputs: 29 of 90, pairs 114 / 7 / 9 -
             FACT-D19-ENVIRONMENT-IDENTITY and FACT-D19-MINIMUM-SET re-proved
identity     PASS 1: FACT-D19-LAUNCHED-EXECUTABLE (/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell)
lineage      PASS 2: 19 commits, 14 Factory (one parent each), 4 owner merges, 1 sync merge, none unclassified
paths        PASS 1: no dead wildcard surface
not selected 81 evaluated facts keep their evidence; the qualified proof did not run (nothing it proves drifted)
```

## 5. Hygiene

```text
status scan   2923 files, 11285 occurrences, 0 unclassified: PASS (the imported corpus classified; inventory 1.6 MB)
handoff check PASS
audit         W22 (integrated) RETIRABLE -> REMOVED; after RETIRABLE 0, KEEP 10 (W11/W14/W16..W22-stage,
              factory-bootstrap-bin), CURRENT 2 (W23, W23-stage)
```

## 6. Current claim surface of the joined model (Q22, evidence/D20/envmap/queries/Q22.json)

```text
current facts   174: RUN 109, OBS 46, GAP 10, ERR 5, UNK 4 (the main line adds 56 execution and observation claims)
RUN claims      108 claimable, each only for the environments of its newest physical evidence; 1 invalidated by design
                (FACT-GPU-ADMITTED-E0, the Byte Relay's E1 fallback)
newest proof    RUN claims resting on D20 evidence 68, D19 17, D12 12, E0/E1 8, D13 2, D17 1, D18 1
traversal       COMPLETE 20; stops at IMPLEMENTATION CONTRACT 17, CURRENT AUTHORITY 12, EXACT CLAUSE 57 (the main line's
                reopen observations cite no CLAUSE node), PROJECT CONSTRAINT 3 - each an explicit [GAP] step
open stops      17: GAP 8, ERR 5 (FACT-D14-MAP-LINKS-AUDITED joins the four D9/D18 [ERR]s), UNK 4 (FACT-PUBLISHED-
                FRONTIER-D20 replaces FACT-PUBLISHED-FRONTIER-UNVERIFIED; FACT-AUTHORITY-REOPEN-DENIED is resolved); each is
                a docs/HANDOFF.md section 6 row
closed          FACT-TOOLCHAIN-DRIFT, FACT-WILDCARD-SURFACES-DEAD (invalidated by D13 evidence)
```

## 7. Intended vs observed

```text
P1  MATCH   181 changes; 133 added + 38 relocated byte-identical, 5 unions complete with 0 deletions, ledger block
            embedded; 177 checked PASS
P2  MATCH   D19 graph and Q01-Q22 identical; D18/D18R/D19 epochs identical; D19 selection replay identical
P3  MATCH   D20-SYNC 12 / 112 (SUPERSEDED 2, RESOLVED 3, OPEN 2, HOLDS 3; 16 inherited); joined graph validates (42)
P4  MATCH   71 of 152, gaps 0 (the same count as the assembly; the tips moved again, the set did not change); every
            group PASS; ingress reproduces the main line's audit
P5  MATCH   D20 25 / 191; merged 1250 / 3190; validate 42; merge-check with the alias PASS; gate PASS; R-54, R-59, R-62,
            R-63 fulfilled
P6  MATCH   Q22 174 current facts; RUN 109 = 108 + 1; open stops GAP 8, ERR 5, UNK 4; closed 2
P7  MATCH   status scan PASS (0 unclassified), handoff check PASS, D16/D17/D18/D18R/D20-SYNC gates PASS; W22 RETIRABLE ->
            REMOVED
STRUCTURE MATCH  this branch's D14 records and every existing D0-D19 evidence file untouched (must_not_change); the main
                 line's files byte-identical (import check); law documents insertion-only; no earlier epoch edited
```

## 8. Current reading

```text
[RUN]  FACT-D20-MINIMUM-SET: 152 evaluated, 71 selected, 71 re-proved, 0 failed, 0 without a runbook entry
[RUN]  FACT-D14-D11-PINS-RECHECKED-D20: every D11/D12 pin re-fetches by commit and matches (63 PIN_MATCH)
[UNK]  FACT-PUBLISHED-FRONTIER-D20: published hosts still refuse; 39 Pages-branch copies; no host observation
[ERR]  FACT-D14-MAP-LINKS-AUDITED: 7 drifted fragments await an owner law delta (R-58)
[OBS]  CON-EM-D14-001 stays PROPOSED until the owner adopts it (R-60)
[NEW]  procedure rule: a parallel line is joined by a content-neutral sync merge plus an importing Factory delta
       (docs/HANDOFF.md section 4); the selector retires conditions a re-proof carried
```

GATE: PASS - the parallel D14 line of main is part of this branch without an edited byte on either side.  The sync
merge c3159d5 carries no content.  Every file of the other line is present byte-identically at its path or its
D14-RESCAN path, and its law annotations sit beside this branch's.  Its graph epoch is reconciled with the D19 model
(R-54..R-63).  Every claim the join made stale was re-proved in the current environment.  Pull request #6 no longer
conflicts with main, because main is now an ancestor.  No internal chain defect is open.
