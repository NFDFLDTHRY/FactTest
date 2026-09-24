# D24 - Observed Pipeline Genericity vs Intended

STATUS: RE-OBSERVATION OF THE D24 WORKPIECE (W29 on canonical base 6bcc86cd50f9787c0afd3b65a113812bea2de2d7, the
D23-COMPILER-ABI-EXECUTION integration; judged by the D22 Factory)
LAW: compares D24-INTENDED-PIPELINE-GENERICITY.md (sections 0-8) with the Factory run
(factory/receipts/D24-PIPELINE-GENERICITY/, evidence/D24/).  INTENDED -> EXECUTION -> EVIDENCE -> OBSERVED.

## 1. Station run

```text
F0-doc       S-DOC       PASS  intended ASCII (STRUCTURAL CHECK: PASS); ledger (D23 AFTER, D24 BEFORE); nothing else
                               differs from 6bcc86c
F1-fixture   S-FIXTURE   PASS  fixtures/genericity (four specimen.json), tape-sample.ascii (bundle record, 15 lines),
                               tests/genericity, run-anti-cheat.sh, run-physical.sh, primitives-probe.mjs: syntax, JSON;
                               REPRODUCE FIRST: reproduce-base.sh at 6bcc86c built the base compiler and REPRODUCED all
                               five findings; no other test file changed
F2-web       S-WEB       PASS  runtime.js, index.html, selector.js, bundle-probe.mjs, kernel-build-probe.mjs: syntax;
                               no backend name, fixed operation, specimen name or payload form; entry points present
F3-rust      S-RUST      PASS  foundation, codegen, bundle, observe, kernel, wasm-abi, factc, ladders: fmt, clippy (host
                               and wasm graphs) clean; workspace tests 130 passed (genericity 7, driver 8); wasm64 release
                               build; 22 exports; exec identity recorded; no other compiler/host source changed
F4-fixture   S-FIXTURE   PASS  proof-sets.json (pin == F3's kernel, D23 kept as history), d24-reconciliation/surfaces,
                               facts/D24.json, components.json (67), issues.json (34): well-formed; D22 and D23 epochs
                               rebuilt byte-identically
F5-browser   S-BROWSER   PASS  identity: 4 toolchains, 45 source tips (5 moved), HeadlessChrome/141.0.7390.37
F6-build     S-BUILD     PASS  run-specimens 4 x 15 + 4 cross-specimen checks PASS; run-attacks 13 PASS; anti-cheat
                               clean (FAIL on the base tree); reproduce-base REPRODUCED; run-physical PASS, the physical
                               tape equals the fixture tape; selfhost 13 probes, P01 and P04 RUN on the D24 bundle;
                               kernels under both install names == pin; transport BUILD 1 (18/18 identical), OBSERVE 1
                               (3/3 identical); genericity ladder 7
F7-doc       S-DOC       PASS  design/execution-manifest rebuilt at 6bcc86c + additions (3553 files, 67 components);
                               deterministic
F8-evidence  S-EVIDENCE  PASS  evidence/D24/{manifest, issues, gate}.json; gate PASS (34 issues)
F9-doc       S-DOC       PASS  epochs/D24.json = facts fragment + reconciliation (R-65, R-66): 28 nodes / 96 edges (39
                               inherited); graph 1332 / 3447; views; SCHEMA 2 rows; ENVIRONMENT-MAP row; HANDOFF; README
F10-evidence S-EVIDENCE  PASS  validate 42, Q01-Q22, stale 381, merge-check, render-check, Q22 check, surfaces (R-65,
                               R-66), D18/D18R/D20-SYNC/D23/D24 gates, capability + implementation gates, status scan,
                               handoff check, audit -> retire -> audit (W28 REMOVED), cleanup gate, index (64 files)
F11-doc      S-DOC             this record
ROUTE  MATCH  no refusal, no re-run.  Two dry runs on a scratch clone at 6bcc86c preceded the route; the first found
              two fixture defects of the delta itself (an unsubstituted epoch list, the selfhost summary's record key),
              the manifest finding for the new live component (classified as I-34, the I-01 precedent) and the
              implementation node's path form; all repaired before routing; every fixture command then passed.
```

## 2. Reproduce first (evidence/D24/reproduce-base/summary.json)

```text
6bcc86c compiler  ledger-mirror (post, mirror): strategy data named ["post"] of 2 authored relations; runtime.js
                  function relay(, plan.guard[0]; index.html payload bytes 0x00,0x01,0x7f,...; the D24 anti-cheat scan
                  over that tree: specimen semantics in index.html and runtime.js, fixed backend names in index.html
                  and bundle-probe.mjs -> REPRODUCED
D24 compiler      the same specimen: transfers [post, mirror], one variant with a requirement per transfer; runtime
                  transfer(relation, bytes) by requirement; both relations executed for every payload (tape)
```

## 3. Specimens and attacks (evidence/D24/specimens, evidence/D24/attacks)

```text
byte-relay     E0 WEBGPU plan 1 A,B exact; loss; E1 CPU_WASM64 plan 0 A,B exact; no WebGPU: CPU_WASM64 at E0
ledger-mirror  1 variant (FEASIBLE); E0 CPU_WASM64 post + mirror exact for 1, 0 and 1000 bytes; loss of the only
               backend -> E1 no active plan (transition derived, nothing invented)
pixel-vault    1 variant; E0 WEBGPU stash exact for 3 and 17 bytes; loss -> E1 no plan; no WebGPU: no plan at E0,
               every stash NO_ACTIVE_PLAN
dual-stream    4 variants (EXACT_OPTIMUM, maximize); E0 plan 0 (CPU_WASM64) feed + drain exact for 4 and 513 bytes;
               loss CPU_WASM64 -> E1 plan 3 (WEBGPU) feed + drain exact
cross-specimen no bundle names another specimen's system, relations or payload bytes; no own payload embedded
attacks        renamed relation, changed order, legal recipe, single backend, missing conversion, undeclared adapter,
               wrong family, tampered strategy / bundle / guard / certificate, stale evidence: refused as intended;
               the genuine control accepted (13 of 13)
```

## 4. Manifest and graph

```text
manifest     3553 files, 67 components (PRODUCTION 68, FACTORY 24, TEST 101, FIXTURE 97, REFERENCE 86, RECORD 828,
             LAW 32, HISTORICAL 11, EVIDENCE 2306); unassigned 0; coverage 42/42; gate PASS, 34 issues (A 11, B 9,
             C 2, D 3, E 1, F 4, G 4)
epoch D24    28 nodes / 96 edges (ENV 1, IMPL 1, PROBE 2, EV 16, FACT 6, RECONCILIATION 2; 39 inherited); merged
             1332 / 3447; validate 42; merge-check, render-check PASS
Q22          187 current facts: RUN 118, OBS 48, GAP 12, ERR 5, UNK 4; RUN claims 118 = 117 claimable + 1
             invalidated; open stops GAP 10 (I-33 added), ERR 5, UNK 4; the D23 identity fact and the two D7 relay
             facts are not current; newest evidence D24 for the six D24 facts
```

## 5. Intended vs observed

```text
P1  MATCH   REPRODUCED at 6bcc86c: all five findings; the scan detects them on the base tree
P2  MATCH   fmt, clippy clean; 130 tests, 0 failed; 22 exports; identity ef5d886a... under both install names
P3  MATCH   specimens 4 x 15 + 4 PASS; attacks 13 PASS; anti-cheat clean; physical PASS (tapes equal); P01/P04 RUN;
            kernels == pin; transport 18/18 + 3/3 identical
P4  MATCH   3553 files, 67 components, tiers as predicted, unassigned 0, coverage 42/42, byte-identical rebuild;
            gate PASS, 34 issues
P5  MATCH   epoch 28 / 96 (39 inherited); merged 1332 / 3447; validate 42; D22 and D23 epochs byte-identical
P6  MATCH   Q22 187 (RUN 118, OBS 48, GAP 12, ERR 5, UNK 4); 118 = 117 + 1; three superseded facts not current;
            stops GAP 10, ERR 5, UNK 4; newest evidence D24; stale 381
P7  MATCH   status scan PASS, handoff PASS, D18/D18R/D20-SYNC/D23/D24 gates PASS, surfaces PASS; W28 REMOVED,
            W28-stage KEEP; index 64
P8  MATCH   4 toolchains, 45 source tips (5 moved), HeadlessChrome/141.0.7390.37
STRUCTURE MATCH  compiler/{source,semantic,capability,implementation,planning,verifier} byte-identical to 6bcc86c (I1);
                 adapter templates, membrane-core.js, sw.js, factory/, law and pass documents untouched; earlier
                 epochs, evidence, receipts and records untouched
```

## 6. Current reading

```text
[RUN]  FACT-D24-PIPELINE-GENERIC: four semantically distinct specimens through the same compiler, runtime, harness,
       observe and integrity check; every transfer of every payload exact (I-09, I-20 closed by execution)
[RUN]  FACT-D24-ATTACKS-REFUSED: the attack list refused; three attacks that passed on the base compiler repaired
       first (I-30, I-31, I-32)
[RUN]  FACT-D24-EVIDENCE-BOUND: every tape names its strategy data identity; observe rejects another bundle's tape
[RUN]  FACT-D24-BYTE-RELAY-EXECUTED: Byte Relay under transfer(relation, bytes) (supersedes the D7 relay facts, R-66)
[RUN]  FACT-KERNEL-IDENTITY-D24: ef5d886a... (supersedes D23, R-65)
[GAP]  FACT-D24-RUNTIME-SELF-INTEGRITY: tamper detection rests on bundle.json; the runtime does not verify its own
       files (I-33, class D)
[OPEN] I-05 (the selfhost probe's historical bundle default), I-11 (the shell's controls never clicked): D25
[NEXT] D25-PHYSICAL-RUNTIME: the generated webapp as a physical runtime at a public HTTPS boundary (I-05, I-11,
       I-33 decision); no localhost substituted as proof
```

GATE: PASS - the current compiler and runtime machinery is proven generic over the semantics the language currently
claims (a typed data transfer between ports): four specimens that differ in system, components, relations, types,
payload shape, backend availability, conversion path, strategy cardinality and objective execute through one
machinery with no specimen-specific branch; the hardcoded relay assumptions were made observable on the base compiler
before repair, repaired by generic mechanisms, and the attack list is refused.  Task 4 of 6 closed.
