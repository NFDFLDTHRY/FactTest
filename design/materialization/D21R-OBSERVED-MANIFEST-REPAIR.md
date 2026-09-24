# D21R - Observed Manifest Repair vs Intended

STATUS: RE-OBSERVATION OF THE D21R WORKPIECE (W26 on canonical base 910fdbf29a1c2dc5f10a27b814ed67a5f391bfeb, the
D21-EXECUTION-MANIFEST integration whose re-inspection the Factory refused)
LAW: compares D21R-INTENDED-MANIFEST-REPAIR.md (sections 0-7) with the Factory run
(factory/receipts/D21R-MANIFEST-REPAIR/, evidence/D21R/).  INTENDED -> EXECUTION -> EVIDENCE -> OBSERVED.  D21's
records, manifest, epoch, evidence and receipts are not edited.

## 1. Station run

```text
F0-doc       S-DOC       PASS  intended ASCII (STRUCTURAL CHECK: PASS); ledger (D21 AFTER naming the defect, D21R
                               BEFORE); nothing else differs from 910fdbf (compiler, host, factory, tests, evidence,
                               fixtures, environment map, execution manifest, docs, law documents)
F1-fixture   S-FIXTURE   PASS  tests/manifest/build-manifest.mjs (own-epoch exclusion), tests/manifest/rebuild-check.sh,
                               tests/envmap/build-fact-epoch.mjs, tests/envmap/facts/D21R.json; syntax + generic-name
                               scan clean; no other test file changed; REPRODUCE with the builder as committed at 910fdbf:
                               rebuild from the committed graph FAIL (md, json), without the own epoch PASS (md, json);
                               REPAIRED builder: four PASS; D21 gate PASS on the committed manifest; epochs/D21.json
                               rebuilt byte-identically
F2-browser   S-BROWSER   PASS  identity: 4 toolchains, 45 source tips (4 moved), node v22.22.2, git 2.43.0
F3-evidence  S-EVIDENCE  PASS  the Factory's re-inspection record (W25.reinspect.json: canonical head and tree PASS,
                               reinspect_command FAIL, status DIFFER) and log preserved; reproduce.json FAIL/FAIL/PASS/
                               PASS; rebuild-check.json PASS x4, committed manifest sha256 ffd00a55e5049d13...bccfc
F4-doc       S-DOC       PASS  epochs/D21R.json (7 nodes / 9 edges); graph D11..D21 + D21R (1274 / 3250); views
                               (register 131440, traceability 380593 bytes); SCHEMA 15 rows; ENVIRONMENT-MAP 14 row;
                               docs/HANDOFF.md (last delta, series, section 4 rule, section 6); README.md
F5-evidence  S-EVIDENCE  PASS  validate 42, Q01-Q22, stale 341, merge-check, render-check, Q22 check (FACT-D21R [RUN]
                               newest evidence D21R; D21 facts [OBS]; 177 current facts), D18/D18R/D20-SYNC gates,
                               capability + implementation gates, status scan (3131 files, 0 unclassified), handoff
                               check (19), audit -> retire -> audit (RETIRABLE 0: W25 KEEP "reinspect DIFFER",
                               W25-stage KEEP), cleanup gate, index (64 files)
F6-doc       S-DOC             this record
ROUTE  MATCH  no refusal, no re-run.  Every fixture command ran on a scratch clone at 910fdbf before routing; the route
              reproduced the dry run's numbers.
```

## 2. The defect and its repair (evidence/D21R/)

```text
refusal      reinspect-d21-result.json: DIFFER; reinspect-d21-run.log: validate, merge-check, render-check PASS, cmp of
             CURRENT-EXECUTION-MANIFEST.md differs at line 3
reproduce    reproduce.json (builder = git show 910fdbf:tests/manifest/build-manifest.mjs, in a clean clone at
             910fdbf): rebuild_from_committed_graph md FAIL, json FAIL; rebuild_without_own_epoch md PASS, json PASS
             -> the enumeration was right; the builder read its own epoch after integration
repair       build-manifest.mjs: the nodes tagged introduced_in --epoch, the edges touching them and that epochs
             entry are removed before any claim is read; header updated; nothing else in the tool changed
witness      rebuild-check.json (the working tree's builder, same clone): four PASS; committed manifest sha256
             ffd00a55e5049d13195de907858854714466d2cc5d6a47154629f525663bccfc (design/execution-manifest/ unchanged)
regression   tests/manifest/gate.mjs PASS on the committed manifest; epochs/D21.json rebuilt byte-identically from the
             graph merged through D20 (the D21 machinery answers as before)
```

## 3. Graph epoch D21R (design/environment-map/epochs/D21R.json)

```text
D21R         7 nodes / 9 edges: ENV-D21R-HOST; PROBE-MANIFEST-REBUILD (implemented_by IMPL-TEST-MANIFEST);
             EV-D21R-{REINSPECT-D21-RESULT, REINSPECT-D21-RUN, REPRODUCE, REBUILD-CHECK} (sha256-bound);
             FACT-D21R-MANIFEST-REBUILD-STABLE [RUN] (PROBED_BY, EVIDENCED_BY x4, REQUIRES, IMPLEMENTED_BY, STALE_IF
             repo.commit)
merged       1274 nodes / 3250 edges; validate PASS (42 checks); merge-check PASS; render-check PASS; the epoch
             rebuilt byte-identically from the graph merged through D21 (reinspect)
Q22          177 current facts: RUN 110, OBS 48, GAP 10, ERR 5, UNK 4; RUN claims 110 = 109 claimable + 1 invalidated
             by design; open stops GAP 8, ERR 5, UNK 4 (unchanged); FACT-D21R-MANIFEST-REBUILD-STABLE claimable for
             ENV-D21R-HOST (newest physical evidence D21R); its traversal stops at CURRENT AUTHORITY [GAP] like every
             internal process fact (no external authority governs the Factory's own procedure); the two D21 facts
             stay [OBS]
tool         tests/envmap/build-fact-epoch.mjs is generic (spec-driven) and is the binding path for the D22-D26 repairs
```

## 4. Intended vs observed

```text
P1  MATCH   reproduce FAIL, FAIL, PASS, PASS with the committed builder; the Factory's record status DIFFER
P2  MATCH   repaired builder four PASS; sha256 ffd00a55...bccfc; D21 gate PASS; epochs/D21.json byte-identical
P3  MATCH   epoch D21R 7 / 9; merged 1274 / 3250; validate 42; merge-check and render-check PASS
P4  MATCH   Q22 177 (RUN 110, OBS 48, GAP 10, ERR 5, UNK 4); RUN 110 = 109 + 1; open stops GAP 8, ERR 5, UNK 4;
            FACT-D21R [RUN] newest evidence D21R; D21 facts [OBS]
P5  MATCH   status scan PASS, handoff check PASS, D18/D18R/D20-SYNC, capability and implementation gates PASS;
            RETIRABLE 0 - W25 KEEP ("reinspect DIFFER"), W25-stage KEEP; nothing retired; cleanup gate PASS
P6  MATCH   git diff --exit-code 910fdbf on every surface outside this delta's may_change: empty (F0)
STRUCTURE MATCH  one live file repaired (tests/manifest/build-manifest.mjs); the test, the binding tool and its spec are
                 additions; no law document, no implementation surface, no D21 record changed
```

## 5. Current reading

```text
[RUN]  FACT-D21R-MANIFEST-REBUILD-STABLE: the D21 manifest rebuilds byte-identically at its integration commit from
       both graphs with the repaired builder; the committed builder fails the same check (reproduce.json)
[OBS]  FACT-D21-LIVE-SURFACES-ENUMERATED, FACT-D21-ISSUES-CLASSIFIED unchanged: the enumeration stands
[KEEP] W25 stays a kept workpiece by the Factory's rule ("reinspect DIFFER"); whether a repaired re-inspection may
       retire it is a Factory-procedure question for D22-FACTORY-SELF-QUALIFICATION, not decided here
[RULE] docs/HANDOFF.md section 4: a refused re-inspection is an internal defect repaired by a repair delta that
       reproduces the refusal at the integration commit, preserves it and witnesses the repair there, before the
       next task
[NEXT] D22-FACTORY-SELF-QUALIFICATION (I-14 negative witnesses; every A/B Factory defect repaired before D23)
```

GATE: PASS - the D21 re-inspection refusal is reproduced from the repository, repaired at its earliest rung, witnessed
in a clean clone at the integration commit with the committed and the repaired builder, and bound to the graph as one
[RUN] fact with four sha256 records.  D21's records are untouched and its ledger entry names the defect.  Task 1 of 6
is closed with a clean chain; D22 starts from a tree whose last delta re-inspects.
