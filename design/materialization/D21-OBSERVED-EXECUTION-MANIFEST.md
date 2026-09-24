# D21 - Observed Execution Manifest vs Intended

STATUS: RE-OBSERVATION OF THE D21 WORKPIECE (W25 on canonical base 4b86df9c0cfedc49112a77c34e1cf7edcb4ef16b, the
D21-PROMPT-INTAKE integration; main b22bcbb is an ancestor with an identical tree)
LAW: compares D21-INTENDED-EXECUTION-MANIFEST.md (sections 0-9) with the Factory run
(factory/receipts/D21-EXECUTION-MANIFEST/, evidence/D21/).  INTENDED -> EXECUTION -> EVIDENCE -> OBSERVED.  Task 1
of the D21-D26 series: enumeration and classification only; no implementation surface changed.

## 1. Station run

```text
F0-doc       S-DOC       PASS  intended ASCII (STRUCTURAL CHECK: PASS); ledger (D21-PROMPT-INTAKE AFTER, D21 BEFORE)
F1-fixture   S-FIXTURE   PASS  tests/manifest/{components.json, build-manifest.mjs, gate.mjs, build-epoch.mjs,
                               issues.json}; tests/hygiene/status-classification.json (zone
                               Z-EXECUTION-MANIFEST, class R);
                               generic-name scan of the tools clean (no component, file or issue named in tool code)
F2-browser   S-BROWSER   PASS  identity: host, toolchains (rustc 1.94.1 e408947bf; nightly-2026-09-24 6eeff9a52), repo
                               (head 4b86df9), browser default + GPU flags, 45 source tips (4 moved since D20)
F3-doc       S-DOC       PASS  design/execution-manifest/{manifest.json, CURRENT-EXECUTION-MANIFEST.md} built from the
                               tree at 4b86df9 (--rev) plus the live files this delta adds; rebuilt to a temporary
                               directory with the same arguments: byte-identical
F4-evidence  S-EVIDENCE  PASS  evidence/D21/{manifest, issues}.json copied; gate -> evidence/D21/gate.json PASS
F5-doc       S-DOC       PASS  epochs/D21.json; graph D11..D20 + D14-RESCAN + D20-SYNC + D21 (1267 / 3241); views
                               regenerated; SCHEMA 15; ENVIRONMENT-MAP 14; docs/HANDOFF.md; README.md
F6-evidence  S-EVIDENCE  PASS  validate, Q01-Q22, stale, merge-check, render-check, Q22 stop check (D21 facts [OBS]),
                               D18/D18R/D20-SYNC reconciliation gates, capability + implementation gates, status scan,
                               handoff check, audit -> retire -> audit, cleanup gate, index (62 files)
F7-doc       S-DOC             this record
ROUTE  MATCH  no refusal, no repair, no re-run.  Every fixture command ran on a scratch clone at 4b86df9 before
              routing (dry run); the route reproduced the dry run's numbers.
```

## 2. CURRENT-EXECUTION-MANIFEST (design/execution-manifest/; evidence/D21/manifest.json)

```text
enumerated   2966 files = the tree at 4b86df9 (2961) + 5 live files added by this delta (tests/manifest/); the delta's
             own records (receipts, evidence/D21, epoch, this record) are excluded by construction (--delta, --rev)
components   65: PRODUCTION 22, FACTORY 10, TEST 19 (live 51); FIXTURE 4, REFERENCE 1, RECORD 5, LAW 2, HISTORICAL 1,
             EVIDENCE 1
file tiers   PRODUCTION 67, FACTORY 23, TEST 82, FIXTURE 97, REFERENCE 86, RECORD 669, LAW 32, HISTORICAL 11,
             EVIDENCE 1899
per surface  component, owner, input, operation, output, dependencies (declared + cargo metadata), consumers, station,
             fixture type, toolchain/target, focused tests, task regression, runtime probe, receipts, graph
             implementations and claims, stale dimensions
coverage     41 of 41 required items live (FACTORY 10, COMPILER 12, HOST 2, WEB OUTPUT 6, PROOF/TEST 11)
unassigned   0 paths; ambiguous 0; live files without an authorized station 0
rendered     CURRENT-EXECUTION-MANIFEST.md 1824 lines, never edited by hand
```

## 3. Findings and issue inventory (evidence/D21/{manifest,issues,gate}.json)

```text
findings     29 items in 16 kinds: live files never receipted 3 (the D0 station specs S-BUILD, S-DOC, S-RUST); live
             components without a graph implementation node 10 (FACTORY-CLI, FACTORY-MODEL, FACTORY-TESTS, SYNC-IMPORT,
             FACTC, TEST-LANGUAGE, TEST-COMMISSIONING, TEST-RECONCILE, TEST-MANIFEST, WORKSPACE-ROOT); without a
             governing claim 11 (the ten + TEST-BOOTSTRAP); historical tools 2 (TEST-TOOLCHAIN-HISTORY,
             TEST-ENVMAP-BIND-D11); live tools naming evidence packages 3 (bind-evidence.mjs, ingress.mjs,
             primitives-probe.mjs); dead fixtures 0; live components without a test 0; orphans 0; duplicates 0;
             declared crate consumers unknown to cargo 0
issues       20 = A 1, B 7, C 2, D 2, E 1, F 4, G 3; by task D21 1, D22 1, D23 3, D24 4, D25 2, owner 3, none 6
  A  I-10  D23   compiler/kernel/src/lib.rs header still describes the Pass-3 state (stale documentation in live code)
  B  I-01  D21   graph claims for the eleven live components (closed by this delta: FACT-D21-LIVE-SURFACES-ENUMERATED)
  B  I-05  D25   primitives-probe.mjs defaults BUNDLE_DIR to a D7 evidence package
  B  I-06  D23   wasm64 transport = the eight bootstrap ops; kernel API wider (D12 B-06): transport for implemented
                 semantics, insertion-only C14 annotation required
  B  I-08  D24   run-anti-cheat.sh greps a byte form the shell does not use (reports clean; must reproduce first)
  B  I-11  D25   generated-shell interactions never exercised by a probe
  B  I-14  D22   Factory negative witnesses missing for 16 refusal reasons
  B  I-19  D23   per-crate execution and factc tests
  C  I-07  D24   index.html embeds commissioning payload A and a WEBGPU destroy control (specimen in production)
  C  I-09  D24   single-relation runtime (relay(bytes) over plan.guard[0]); relay-only wasm export library; two named
                 adapter templates
  D  I-15  none  open-boundary rows of class C (capability): approved, unimplemented
  D  I-20  D24   runtime and bundle-role claims witnessed by one specimen
  E  I-16  none  environment / authority limits (hardware GPU, network egress, published hosts)
  F  I-02, I-03, I-04, I-17  none  D0 registry specs never receipted; two historical tools; a historical evidence name
                 inside an annotation; class-B register rows: preserved
  G  I-12, I-13, I-18  owner  STATION-REGISTRY.md header; escaped fences in 24 law documents; owner register rows
gate         PASS: every_path_tiered, coverage_complete, live_components_connected, findings_classified (29 items
             covered by 5 covering issues; no idle issue), issues_well_formed (20; every marker present),
             historical_not_executable
law          classification precedes repair; nothing outside tests/manifest, the manifest, the epoch, the records and
             the hygiene zone table changed (must_not_change: compiler/, host/, factory/src, factory/registry,
             fixtures/, every existing test, law and pass documents, earlier epochs, D0-D20 evidence)
```

## 4. Graph epoch D21 (design/environment-map/epochs/D21.json; evidence/D21/envmap/)

```text
D21          17 nodes / 51 edges: ENV-D21-HOST; IMPL-{FACTORY-CLI, FACTORY-MODEL, FACTORY-TESTS, SYNC-IMPORT, FACTC,
             TEST-LANGUAGE, TEST-COMMISSIONING, TEST-RECONCILE, TEST-MANIFEST, WORKSPACE-ROOT};
             PROBE-EXECUTION-MANIFEST; EV-D21-{MANIFEST, GATE, ISSUES}; FACT-D21-LIVE-SURFACES-ENUMERATED [OBS] (IMPLEMENTED_BY every live
             implementation node, STALE_IF repo.commit); FACT-D21-ISSUES-CLASSIFIED [OBS]
merged       1267 nodes / 3241 edges; validate PASS (42 checks); merge-check PASS (D11 base fdb9c32 + every epoch in
             order, D14-RESCAN under its alias); render-check PASS (AUTHORITY-REGISTER 131378 bytes, TRACEABILITY
             377551 bytes identical); the D21 epoch rebuilt from the merged D20 graph byte-identically (reinspect)
Q22          176 current facts: RUN 109, OBS 48, GAP 10, ERR 5, UNK 4; RUN claims 108 claimable, 1 invalidated by
             design; traversal COMPLETE 20, stops at IMPLEMENTATION CONTRACT 17, CURRENT AUTHORITY 12, EXACT CLAUSE 57,
             PROJECT CONSTRAINT 3; open stops GAP 8, ERR 5, UNK 4 (unchanged from D20); closed by evidence
             FACT-TOOLCHAIN-DRIFT, FACT-WILDCARD-SURFACES-DEAD; newest evidence D21 2 (the two [OBS] facts)
stale        340 stale relations over 21 dimensions (authority.source_commit 132, browser.revision 54, browser.product
             47, toolchain.nightly.rustc_commit 26, browser.flags 16, ...): the STALE_IF register D26 traverses
             to select re-proof; nothing re-proved by D21 (enumeration only)
earlier      D18, D18R, D20-SYNC reconciliation gates PASS; capability gate PASS; implementation gate PASS (kernel
             difference scoped to custom:name)
```

## 5. Hygiene

```text
status scan  PASS: 3031 files, 12715 occurrences, 0 unclassified (design/execution-manifest/ = zone Z-EXECUTION-
             MANIFEST, class R)
handoff      PASS (19 checks)
workpieces   audit before: RETIRABLE 3 (W23, W24, W24-stage), KEEP 11, CURRENT 2, ABSENT 22; retire: 3 REMOVED; audit
             after: RETIRABLE 0, KEEP 11, CURRENT 2 (W25, W25-stage), ABSENT 24; cleanup gate PASS
identity     4 toolchains; 45 source tips (4 moved: rust-lang/rust master, chromium main, v8 main, this branch);
             kernel exec identity unchanged (no build in this delta)
```

## 6. Intended vs observed

```text
P1  MATCH   2966 files (2961 + 5) in 65 components, live 51; tiers PRODUCTION 67, FACTORY 23, TEST 82, FIXTURE 97,
            REFERENCE 86, RECORD 669, LAW 32, HISTORICAL 11, EVIDENCE 1899; unassigned 0; coverage 41/41; the manifest
            rebuilt byte-identically (F3, reinspect).  ONE WORDING DEFECT in the prediction's parenthesis: it splits the
            51 live components "PRODUCTION 26, FACTORY 12, TEST 13"; the manifest's tier split is PRODUCTION 22,
            FACTORY 10, TEST 19 (the prediction reused the area grouping of section 2 - factory 11 + records 1,
            compiler 13 + host 3 + web 8, test 15 - which is not the tier).  The total, every file count and the
            register are right; the intended record stays as receipted (F0); the manifest is the authority for the
            split.  No implementation surface is affected.
P2  MATCH   never receipted 3 (D0 registry), without implementation node 10, without claim 11, historical tools 2,
            evidence readers 3, dead fixtures 0, untested live components 0
P3  MATCH   gate PASS: 29 finding items covered by 5 issues; 20 issues A 1, B 7, C 2, D 2, E 1, F 4, G 3
P4  MATCH   epoch D21 17 / 51 (10 implementation nodes added); merged 1267 / 3241; validate 42; D11-D20 preserved
            (merge-check, render-check)
P5  MATCH   Q22 176 current facts (RUN 109, OBS 48, GAP 10, ERR 5, UNK 4); open stops GAP 8, ERR 5, UNK 4; the two D21
            facts [OBS]; earlier gates PASS
P6  MATCH   status scan PASS, handoff check PASS; W24 (and W23, W24-stage) RETIRABLE -> REMOVED
STRUCTURE MATCH  no compiler/, host/, factory/src, factory/registry, fixtures/ or existing test file changed; no law or
                 pass document changed; no earlier epoch or D0-D20 evidence file changed (must_not_change, 221 paths)
```

## 7. Current reading

```text
[OBS]  FACT-D21-LIVE-SURFACES-ENUMERATED: 2966 tracked files tiered; 51 live components each with owner, consumer,
       station, tests and (now) an implementation node and a governing claim
[OBS]  FACT-D21-ISSUES-CLASSIFIED: 29 automated finding items -> 20 issues, each with class A..G, task and surfaces
[GAP]  I-14 (B, D22): the Factory does not yet witness 16 refusal reasons -> D22-FACTORY-SELF-QUALIFICATION next
[GAP]  I-06, I-10, I-19 (D23); I-07, I-08, I-09, I-20 (D24); I-05, I-11 (D25); D26 re-proves what the D22-D25
       repairs make stale (STALE_IF traversal) and audits the whole repository
[OWNER] I-12, I-13, I-18: STOP -> ASCII/OWNER; no repair without an owner decision
[PRESERVED] I-02, I-03, I-04, I-17: historical, kept as they are
```

GATE: PASS - the current executable FactTest is fully enumerated: every tracked path has a tier, every live component
has an owner, a consumer, a station, focused tests, an implementation node and a governing claim, and every automated
finding is classified A..G with its task before any repair.  Nothing was repaired in D21.  The affected surfaces of
D22-D26 are named per issue.  Task 1 of 6 closed.
