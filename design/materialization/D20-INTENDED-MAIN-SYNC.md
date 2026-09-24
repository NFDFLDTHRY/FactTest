# D20 - Intended Main Sync (the parallel D14 line joins this branch)

STATUS: INTENDED ASCII (assembled before the sync merge and before routing; source of record for delta D20-MAIN-SYNC,
workpiece W23)
REQUEST: the owner asked for a pull request of this branch into main (pull request #6).  Main had meanwhile merged pull
request #5 (branch claude/d9-rust-cargo-proof-4nys6s), a parallel line from another owner prompt that also calls its
pass D14.  Asked how to reconcile, the owner chose (verbatim option): "Merge main in (Recommended) - Merge main into this
branch with a merge commit, so PR #5's history stays untouched. Keep this series' D14 at its current paths, since D15-D19
build on them. Move PR #5's colliding files to a distinct id such as D14-RESCAN. Add its graph epoch after D19 and keep
both sides' law annotations. Route all of it as a Factory delta; the lineage check must also accept this agent-made sync
merge as a new kind of commit."
SCOPE: make main an ancestor of this branch without the agent writing content; bring every file of the other line into
this tree from git objects (byte-identical, relocated where its path is taken); join its graph epoch to the D19 model and
reconcile what the two lines say about the same things; re-prove, by the D19 method, exactly the claims the join made
stale; record the joined claim surface.  Nothing of either line's history is edited.

## 0. Observation before drawing

```text
HEAD           780aee1 (D19 integrated, pushed; pull request #6 open, not mergeable)
main           1205fda (2026-09-24 09:02 UTC) = merge of pull request #5: D14-PROMPT-INTAKE 6778133 and
               D14-TECHNICAL-REFERENCE-RESCAN 8d5ea6f, both Factory commits on base 4d8a4c0 (the same base as this
               branch's D14-D19 series)
trial merge    33 conflicting files: 23 add/add (factory/deltas/D14.json, factory/fixtures/D14/*, epochs/D14.json,
               evidence/D14/{envmap,workpieces,index.json}) and 10 content (5 law documents, graph.json, 2 generated
               views, LEDGER.md, docs/HANDOFF.md)
the other line 181 changes (171 added, 10 modified; 700066 lines): fixtures/reference/ (83 reproducibility copies: 39
               Pages-branch renderings, 44 sources; 50 MB), tests/reference/{ingress.mjs, run-ingress-checks.sh}, its D14
               records, receipts and evidence, insertion-only "D14 ANNOTATION" lines in 5 law documents, graph epoch D14
               (72 nodes / 315 edges; no node id shared with this branch's graph), ledger and handoff entries
interactions   - 10 of its AUTHORIZES edges start at authorities D18 superseded: the joined graph fails validate
                 (successor_carries_inherited_edges) until they are carried
               - FACT-PUBLISHED-FRONTIER-UNVERIFIED (this D14: "no ... fragment could be verified") vs 36 fragments the
                 other line verified in Pages-branch renderings; FACT-AUTHORITY-REOPEN-DENIED (D11) is INVALIDATED_BY the
                 other line's register evidence
               - FACT-D14-D11-PINS-RECHECKED ("0 pinned files changed at the current branch head", before 09:00 UTC) vs
                 D19's reopen (AUTH-V8-FLAGS: TIP MOVED, FILE CHANGED, clause identical)
               - its 2 [ERR] reopen facts are the two fragments D18 already resolved (#webassembly-storage,
                 #streaming-modules); 7 further drifted fragments are new and open (owner law delta)
               - CON-EM-D14-001 PROPOSED (copies are pins, never current authority): consistent with this line's rule
               - its route table covers the authorities of the D13 graph only: its checks fail on the joined graph and
                 pass on its own inputs (map and graph at 1205fda), where they reproduce its audit byte-for-byte
                 except timestamps (33 s)
tool defects   found while assembling (each fixed in this delta, each with a regression that reproduces the earlier
               result):
               - select.mjs re-selects claims D19 already re-proved: the stale condition D19 carried to its new
                 environment does not retire the old one (e.g. ENV-D9-HOST rustup "nightly") - selection would never
                 converge.  Fix: a carried condition (same dimension and relation, on an environment of the newest
                 evidence) supersedes the older one.  Replaying D19's selection with the fixed selector on D19's inputs
                 gives D19's recorded result exactly
               - select.mjs addresses obligations only to "D19:" -> --pass
               - build-reconciliation.mjs carries inherited edges only for its own register's supersessions -> also for
                 the supersessions already in the graph (D18 and D18R epochs rebuild byte-identically)
               - build-reprove.mjs re-creates IMPL-REPROVE and its probes -> a later re-proof epoch reuses them
               - lineage.mjs counts every non-Factory merge as an owner merge -> owner pull-request merges, SYNC merges
                 (tree equal to the first parent) and anything else (a violation) are told apart
               - regression procedure: D18's epoch derives file pins from the tree, so its rebuild must read the D18
                 tree (git archive 1b81dc0), not the current one whose law documents later deltas annotated
```

## 1. The sync merge (step 0, outside the Factory, content-neutral)

```text
M = git merge -s ours --no-ff 1205fda   on claude/facttest-materialization-27amc7 at 780aee1
    parents 780aee1, 1205fda; tree == tree of 780aee1 (checked); author: the agent session; message names the owner
    decision and this record.  M changes no file: it only makes the other line an ancestor, so pull request #6 merges
    without conflict and pull request #5's commits stay exactly as merged.  Every content change after M is this delta.
lineage   tests/reprove/lineage.mjs: Factory commits one parent; non-Factory merges = owner merges ("Merge pull request
          #N") or sync merges (tree == first parent); anything else unclassified -> FAIL
```

## 2. Import of the other line (tests/sync/import-line.mjs, map tests/sync/d20-line.json)

```text
TREATMENT   PATHS                                                                                     COUNT  STATION
added       fixtures/reference/**, tests/reference/{ingress.mjs, run-ingress-checks.sh},              133    S-DOC,
            design/materialization/D14-{REFERENCE-RESCAN-PROMPT,INTENDED-REFERENCE-RESCAN,                   S-FIXTURE,
            OBSERVED-REFERENCE-RESCAN}.md, factory/{deltas,fixtures,receipts}/D14-PROMPT-INTAKE*,             S-EVIDENCE
            factory/receipts/D14-TECHNICAL-REFERENCE-RESCAN/, evidence/D14/{audit,ingress,hygiene}/
            (same path, byte-identical; every artifact path its graph epoch and receipts cite stays valid)
relocated   factory/deltas/D14.json -> factory/deltas/D14-RESCAN.json; factory/fixtures/D14/ ->               38    S-DOC,
            factory/fixtures/D14-RESCAN/; epochs/D14.json -> epochs/D14-RESCAN.json; evidence/D14/{envmap/,          S-EVIDENCE
            workpieces/, index.json, index.log} -> evidence/D14-RESCAN/ (byte-identical; the original paths hold
            this branch's D14-FRONTIER-REOPEN; the originals stay reachable at 8d5ea6f)
union       REFERENCE-AUTHORITY.md, CONSTRAINT-LEDGER.md, CONFLICT-LEDGER.md, IMPLEMENTATION-CONTRACTS.md,     5      S-ANNOTATE
            EVIDENCE-OBLIGATIONS.md: git merge-file --union, the other line's lines first (D13, then its "D14
            ANNOTATION", then D18 annotations); insertion-only: every line of ours kept, every added line present
embed       design/materialization/LEDGER.md: the other line's 55 added lines as one verbatim block under its own      1      S-DOC
            heading (a union would share its "AFTER" line with D19's section)
regenerate  graph.json, AUTHORITY-REGISTER.md, TRACEABILITY.md                                          3      S-DOC
live        docs/HANDOFF.md (rewritten for the joined model)                                               1      S-DOC
check       every added / relocated destination byte-identical to 1205fda, no destination already holding other
            content, every union complete and insertion-only, the ledger block contiguous: 177 checked, PASS
```

## 3. Graph (add-only; D11 base + D12..D19 unchanged)

```text
D14-RESCAN  the other line's epoch file, byte-identical, merged under the label D14-RESCAN after D19 (envmap merge
            "FILE=LABEL"; the epoch list records relabeled_from D14)
D20-SYNC    tests/reconcile/d20-reconciliation.json (build-reconciliation.mjs):
  R-54 SUPERSEDED  FACT-PUBLISHED-FRONTIER-UNVERIFIED -> FACT-PUBLISHED-FRONTIER-D20 [UNK] (narrowed: hosts refuse; 39
                   Pages-branch renderings; 36 fragments present / 9 absent; no host observation)       obligation D20
  R-55 RESOLVED    FACT-AUTHORITY-REOPEN-DENIED (already INVALIDATED_BY EV-D14-REGISTER); remaining [UNK] in R-54
  R-56 RESOLVED    FACT-D14-REOPEN-WASM-JSAPI-STORAGE [ERR]: closed by AUTH-WASM-JSAPI-STORAGE-D18 (R-10)
  R-57 RESOLVED    FACT-D14-REOPEN-WASM-WEBAPI-STREAMING [ERR]: closed by AUTH-WASM-WEBAPI-STREAMING-D18 (R-11)
  R-58 OPEN        FACT-D14-MAP-LINKS-AUDITED [ERR]: 7 drifted fragments await an owner law delta (2 closed by D18)
  R-59 SUPERSEDED  FACT-D14-D11-PINS-RECHECKED -> FACT-D14-D11-PINS-RECHECKED-D20 [RUN] (pins; no head relation)
                                                                                                         obligation D20
  R-60 OPEN        CON-EM-D14-001 PROPOSED: ledger adoption is an owner decision
  R-61 HOLDS       10 authorities D18 superseded: the other line's AUTHORIZES edges carried to the successors
  R-62 HOLDS       the other line's 56 execution claims (corpus, reopen observations)                   obligation D20
  R-63 HOLDS       FACT-FF-ONLY-INTEGRATION, FACT-WORKPIECE-ISOLATION with the sync merge in the lineage obligation D20
            retired texts: "no current published authority, fragment or TR maturity could be verified", "0 pinned
            files changed at the current branch head"
D20         the re-proof epoch (build-reprove.mjs, section 4); FULFILLS R-54, R-59, R-62, R-63
```

## 4. Re-proof (the D19 method on the joined graph)

```text
identity    tests/reprove/identity.mjs -> evidence/D20/identity/
selection   select.mjs --pass D20 on the D20-SYNC graph: environment drift (carried conditions supersede older ones),
            implementation change, obligations "D20:" -> evidence/D20/selection.json
runbook     + group ingress (source): the other line's checks on its own inputs (map and graph read from git at the
              line head) against the corpus imported into this tree; expectations = the verdicts it recorded (its
              fragments.json per authority; hosts 23 denied; verify 83 / refetch 166 PASS)
            + group process (repo): D19's selection replayed with the current selector on D19's inputs (tree 780aee1,
              D18R graph, committed D19 identity) re-proves FACT-D19-ENVIRONMENT-IDENTITY and FACT-D19-MINIMUM-SET;
              FACT-D19-LAUNCHED-EXECUTABLE by the identity group; FACT-FF-ONLY-INTEGRATION also expects no
              unclassified merge
assembly    selection 71 of 152 current RUN/OBS facts (environment 8, implementation 4, obligation 62), gaps 0; groups
            ingress 58, reopen 5, clauses 2, process 2, identity 1, lineage 2, paths 1 - no qualified proof (nothing
            drifted for it once the carried conditions retire D9's); every group PASS
```

## 5. Mutation plan by station (delta D20-MAIN-SYNC, workpiece W23, base M)

```text
F0   S-DOC       this ASCII; LEDGER (D19 AFTER, the other line's block + its AFTER, D20 BEFORE); delta; fixtures
F1   S-FIXTURE   tests/sync/, tests/envmap/envmap.mjs, tests/reconcile/{build-reconciliation.mjs,
                 d20-reconciliation.json, d20-surfaces.json}, tests/reprove/{select,lineage,build-reprove}.mjs +
                 runbook/obligations; imports tests/reference/{ingress.mjs, run-ingress-checks.sh}.  Checks: syntax,
                 generic tools, import (tests scope); regressions: the D19 graph validates/renders/merges identically and
                 answers Q01-Q22 byte-identically to evidence/D19; D18 (on the D18 tree), D18R and D19 epochs rebuild
                 byte-identically; D19's selection replays identically; the lineage reports the sync merge
F2   S-DOC       import: the other line's D14 records, receipts, fixtures/reference/, epochs/D14-RESCAN.json
F3   S-ANNOTATE  import: the 5 law documents (union, insertion-only: 0 deleted lines against the base)
F4   S-EVIDENCE  import: evidence/D14/{audit,ingress,hygiene}/, evidence/D14-RESCAN/
F5   S-DOC       epochs/D20-SYNC.json (register on the graph merged with D14-RESCAN); graph merged; views rendered
F6   S-BROWSER   evidence/D20/identity/
F7   S-EVIDENCE  evidence/D20/selection.json
F8   S-BROWSER   run-selected --kind cite
F9   S-BUILD     run-selected --kind build (runs nothing when no build group is selected)
F10  S-BUILD     run-selected --kind source (clauses, reopen, ingress)
F11  S-EVIDENCE  run-selected --kind repo (lineage, paths, process)
F12  S-DOC       epochs/D20.json; graph merged; views; SCHEMA 14, ENVIRONMENT-MAP 13; docs/HANDOFF.md; README.md
F13  S-EVIDENCE  validate, Q01-Q22, stale, merge-check, render-check, D20 gate, Q22 stop check, D18/D18R/D20-SYNC
                 reconciliation gates (D20-SYNC surfaces: the handoff), D16/D17 gates, import check (every treatment),
                 status scan, handoff check, audit -> retire -> audit, index
F14  S-DOC       D20-OBSERVED-MAIN-SYNC.md
MUST NOT CHANGE: FACTORY-LAW.md and every other law/pass document, compiler/, host/, factory/src|registry, earlier
epochs, every existing file of D0-D19 evidence, this branch's D14 records at their paths
```

## 6. Predictions (from the assembly trial on a scratch clone with a trial sync merge)

```text
P1  import: 181 line changes; 133 added + 38 relocated byte-identical, 5 unions complete with 0 deletions, ledger block
    embedded; 177 checked, PASS
P2  regressions: D19 graph and Q01-Q22 identical; D18/D18R/D19 epochs identical; D19 selection replay identical
P3  D20-SYNC 12 nodes / 112 edges (10 reconciliations: SUPERSEDED 2, RESOLVED 3, OPEN 2, HOLDS 3; 16 inherited edges);
    the joined graph validates (42)
P4  selection about 71 of 152 (tips may move between assembly and route), gaps 0; every group PASS; ingress
    reproduces the other line's audit (hosts 23 denied, verify 83 / refetch 166 PASS, 64 authority verdicts)
P5  D20 epoch about 25 nodes / 191 edges; merged about 1250 nodes / 3190 edges; validate 42; merge-check with the
    alias PASS; gate PASS; R-54, R-59, R-62, R-63 fulfilled
P6  Q22: 174 current facts; RUN 109 = 108 claimable + 1 invalidated by design; open stops GAP 8, ERR 5, UNK 4; closed
    FACT-TOOLCHAIN-DRIFT, FACT-WILDCARD-SURFACES-DEAD
P7  hygiene: status scan PASS (the imported corpus classified; 0 unclassified), handoff check PASS, D16/D17/D18/D18R/
    D20-SYNC gates PASS; W22 RETIRABLE -> REMOVED
```

## 7. Invariants

```text
I1  the agent writes no content outside the Factory: M's tree equals its first parent; every imported byte comes from
    git objects of 1205fda through a fixture command
I2  nothing of either line is edited: relocation copies byte-identical files; law documents only gain lines; earlier
    epochs and evidence unchanged; D19's selection replays identically under the fixed tools
I3  one current reading: every statement of the other line that contradicts or duplicates this line's model is
    reconciled (superseded, resolved, open or holds) and the retired texts are absent from every current node
I4  re-proof is selected, never chosen by hand; a failed expectation is DIFFER, never retried into PASS
```

## 8. Gate

```text
D20 closes when the import check, the D20-SYNC reconciliation gate and the D20 re-proof gate pass on the joined graph,
the D16/D17/D18/D18R gates still pass, and pull request #6 no longer conflicts with main (main is an ancestor).
```

## 9. Structural check

```text
every change of the other line has exactly one treatment; every collision is relocated; the joined graph validates in
the trial; every tool change carries a regression that reproduces its earlier output; the stations cover every path
(S-DOC records, fixtures and design; S-FIXTURE tests; S-EVIDENCE evidence; S-ANNOTATE law documents)
```

STRUCTURAL CHECK: PASS
