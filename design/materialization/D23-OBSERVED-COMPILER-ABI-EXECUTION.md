# D23 - Observed Compiler + ABI Execution vs Intended

STATUS: RE-OBSERVATION OF THE D23 WORKPIECE (W28 on canonical base a43c0ce9496bb62f5dc8b8d68dc746ca9e453660, the
D22-FACTORY-SELF-QUALIFICATION integration; judged by the D22 Factory)
LAW: compares D23-INTENDED-COMPILER-ABI-EXECUTION.md (sections 0-8) with the Factory run
(factory/receipts/D23-COMPILER-ABI-EXECUTION/, evidence/D23/).  INTENDED -> EXECUTION -> EVIDENCE -> OBSERVED.

## 1. Station run

```text
F0-doc       S-DOC       PASS  intended ASCII (STRUCTURAL CHECK: PASS); ledger (D22 AFTER, D23 BEFORE); nothing else
                               differs from a43c0ce
F1-rust      S-RUST      PASS  compiler/wasm-abi/src/lib.rs (nine transport exports, 512 KiB buffers), compiler/kernel/
                               src/lib.rs (header), host/factc/tests/driver.rs: fmt --check, clippy host + wasm graph
                               clean; factc driver 7 passed; wasm64 release build; wasm-inspect 22 exports (every
                               kernel operation present); exec identity recorded; no other compiler/host source changed
F2-web       S-WEB       PASS  host/harness/kernel-build-probe.mjs: syntax, generic scan; trial against F1's kernel and
                               driver: BUILD 1 (18/18 identical), OBSERVE 1 (3/3 identical)
F3-fixture   S-FIXTURE   PASS  run-crate-dag.mjs, proof.mjs (browser-build), run-qualified-proof.sh (Q-WASM-08),
                               proof-sets.json (pin fcaee2a6..., history), d23-reconciliation.json, d23-surfaces.json,
                               build-fact-epoch.mjs (implementation nodes, package-path evidence ids), facts/D23.json,
                               gate.mjs (a repaired issue's marker must be gone), components.json, issues.json; the pin
                               equals the identity of the kernel F1 built; D21R and D22 epochs rebuilt byte-identically
F4-browser   S-BROWSER   PASS  identity: 4 toolchains, 45 source tips (4 moved), browser HeadlessChrome/141.0.7390.37
F5-build     S-BUILD     PASS  qualified matrix 27 obligations: PASS 22, OBS 3, HEURISTIC 2, FAIL 0 (mutants 8 of 8
                               refused); crate DAG 14 crates PASS, 931 tests; kernels under both install names: exec
                               identity fcaee2a6... == pin, whole-file fa5c7131... / 6deeebc6...
F6-doc       S-DOC       PASS  design/execution-manifest rebuilt at a43c0ce + 6 live additions (3295 files); deterministic
F7-evidence  S-EVIDENCE  PASS  evidence/D23/{manifest, issues, gate}.json; gate PASS (29 issues)
F8-doc       S-DOC       PASS  epochs/D23.json = facts fragment (build-fact-epoch) + reconciliation (R-64): 20 nodes /
                               67 edges (16 inherited); graph 1304 / 3351; views (register 131605, traceability
                               401088 bytes); SCHEMA 15 rows; ENVIRONMENT-MAP 14 row; docs/HANDOFF.md; README.md
F9-evidence  S-EVIDENCE  PASS  validate 42, Q01-Q22, stale 363, merge-check, render-check, Q22 check, surfaces (R-64, 2
                               checks), D18/D18R/D20-SYNC/D23 gates, capability + implementation gates, status scan
                               (3508 files, 0 unclassified), handoff check, audit -> retire -> audit (W27 REMOVED),
                               cleanup gate, index (64 files)
F10-doc      S-DOC             this record
ROUTE  MATCH  no refusal, no re-run.  Three dry runs on a scratch clone at a43c0ce preceded the route; they found
              only fixture-ordering defects of the delta itself (the identity pin compared before F3 delivered it, the
              R-64 surfaces checked before F8 updated the handoff, an unsubstituted path) and one builder defect (two
              records named summary.json collided on one evidence id -> ids name the path inside the epoch package),
              all repaired before routing; every fixture command then passed on the scratch clone.
```

## 2. The transport boundary (evidence/D23/proof/wasm64/Q-WASM-08-chromium-build-release.browser-build/probe.json)

```text
exports      22 (memory, the C14 eight, four buffer accessors, and the nine added: submit_contracts, submit_metrics,
             submit_evidence_tape, observe, artifact_count, read_artifact, bundle_file_count, bundle_file_path,
             bundle_file_bytes); imports []; required workspace 2865440 bytes; I/O buffers 524288 bytes
Chromium     HeadlessChrome/141.0.7390.37 (Playwright): BUILD from source + registry + metrics: status 1 in 16 ms,
             10 artifacts, 8 bundle files; RESET; OBSERVE from the tape + authored-source sha + lineage sha: status 1
             in 2 ms
identical    21 of 21 files byte-for-byte with host/factc's run of the same inputs: diagnostics.json, artifacts.json,
             the 10 artifacts (canonical ASCII, typed IR, capability IR, hypergraph, candidate and verified strategy,
             certificates, bundle certificate, ...), bundle/{bundle.json, index.html, manifest.webmanifest,
             membrane.js, runtime.js, selector.js, sw.js, wasm64_relay.wasm}; observe: diagnostics.json,
             observation-delta.json, observed.ascii
B-06         closed as transport-only: no compiler crate changed (I1), every export calls one kernel function (I2); the
             D12 [GAP] row of the register is [RUN] (FACT-D23-WASM-TRANSPORT-COMPLETE); the C14 text is the owner's
             (I-29, FACT-D23-C14-TEXT-OWNER [GAP])
```

## 3. Per-crate execution and the matrix (evidence/D23/crates, evidence/D23/proof)

```text
order        factc-foundation > factc-source > factc-semantic > factc-capability > factc-implementation >
             factc-planning > factc-verifier > factc-codegen > factc-bundle > factc-observe > factc-kernel > factc >
             factory > factc-wasm-abi (14 crates PASS)
per crate    build dev, build release, focused tests (foundation 9, codegen 1, kernel 76, factc 7, factory 29; source,
             semantic, capability, implementation, planning, verifier, bundle, observe: none of their own, exercised
             by their consumers), consumer tests after each crate (the kernel ladders ran once per dependency);
             931 test executions, 0 failed; the wasm64 root: dev + release core-only, consumer = Q-WASM-08 PASS
matrix       27 obligations: HOST_NATIVE_SET 8 (build dev/release, test dev/release, clippy, 3 exact compile-fail
             diagnostics), ALL 3 (fmt, resolved first-party graph + 31 physical manifests accounted, third-party
             fixture rejected), WASM64_KERNEL_SET 8 (clippy, core-only dev/release graph, inspect dev/release, kernel
             identity, Chromium ABI, Chromium BUILD + OBSERVE), pins + sets + toolchain 3, CROSS_SET 3 OBS (weight
             NONE), HEURISTIC 2 (weight NONE); mutants M1-M8 accepted by the weak check, refused by the qualified check
kernel       exec identity fcaee2a6973e14217dccdb147902b62b4503764ad14e72676b6dd7696242c976 under the pinned and the
             renamed install (only the custom name section differs); whole-file fa5c7131... (3373536 bytes) /
             6deeebc6... (3373534 bytes); the eight-export identity e8d6582665... kept as history (R-64)
driver       d01-d07 pass; d05 records the B-07 behaviour (BUILD with no registry: OK, front-end artifacts, no bundle;
             owner decision D-5)
```

## 4. Manifest and graph

```text
manifest     3295 files = the tree at a43c0ce + 6 live additions (driver.rs, kernel-build-probe.mjs, run-crate-dag.mjs,
             facts/D23.json, d23-reconciliation.json, d23-surfaces.json); PRODUCTION 68, FACTORY 24, TEST 93,
             FIXTURE 97, REFERENCE 86, RECORD 782, LAW 32, HISTORICAL 11, EVIDENCE 2102; unassigned 0; coverage
             41/41; findings: never receipted 3 (D0 registry), historical tools 2, evidence readers 3
issues       29: A 8 (I-10 REPAIRED here; I-21..I-27 D22), B 8 (I-06 transport and I-19 REPAIRED here), C 2, D 2, E 1,
             F 4, G 4 (I-29 added: the C14 text, owner); gate PASS (a repaired issue's marker is gone)
epoch D23    ENV-D23-HOST; IMPL-KERNEL-BUILD-PROBE, IMPL-CRATE-DAG; PROBE-CRATE-DAG, PROBE-BROWSER-BUILD; 9 evidence
             records (crates summary + kernel + driver, proof summary, Q-WASM-08 probe + record, kernel builds +
             sections, Q-WASM-06 record); FACT-D23-COMPILER-DAG-EXECUTED [RUN], FACT-D23-QUALIFIED-PROOF [RUN],
             FACT-D23-WASM-TRANSPORT-COMPLETE [RUN], FACT-KERNEL-IDENTITY-D23 [RUN] (supersedes
             FACT-KERNEL-IDENTITY-DEFINED-D18, R-64, 16 inherited edges), FACT-D23-C14-TEXT-OWNER [GAP]; 20 nodes /
             67 edges; merged 1304 / 3351; validate 42; merge-check, render-check PASS
Q22          184 current facts: RUN 116, OBS 48, GAP 11, ERR 5, UNK 4; RUN claims 116 = 115 claimable + 1 invalidated;
             open stops GAP 9 (the C14 text stop added), ERR 5, UNK 4; the superseded D18 identity fact is not
             current; newest evidence D23 for the five D23 facts
```

## 5. Intended vs observed

```text
P1  MATCH   22 exports, imports []; Q-WASM-08 PASS: BUILD 1, OBSERVE 1, 21/21 identical; wasm-inspect PASS
P2  MATCH   14 crates PASS in the predicted order; 931 test executions, 0 failed; factc driver 7/7
P3  MATCH   27 obligations: PASS 22, OBS 3, HEURISTIC 2, FAIL 0; mutants 8 of 8; identity fcaee2a6... under both
            install names (Q-WASM-06 PASS); whole-file fa5c7131... / 6deeebc6...
P4  MATCH   3295 files, tiers as predicted, unassigned 0, coverage 41/41, byte-identical rebuild; gate PASS, 29 issues
            (A 8, B 8, C 2, D 2, E 1, F 4, G 4; D23 3, owner 4)
P5  MATCH   epoch 20 / 67 (ENV 1, IMPL 2, PROBE 2, EV 9, FACT 5, RECONCILIATION 1; 16 inherited); merged 1304 / 3351;
            validate 42; D21R and D22 epochs byte-identical
P6  MATCH   Q22 184 (RUN 116, OBS 48, GAP 11, ERR 5, UNK 4); 116 = 115 + 1; D18 identity fact superseded; stops GAP 9,
            ERR 5, UNK 4; newest evidence D23; stale 363
P7  MATCH   status scan PASS (0 unclassified), handoff PASS, D18/D18R/D20-SYNC/D23 gates PASS, surfaces PASS;
            W27 REMOVED, W27-stage KEEP
STRUCTURE MATCH  no compiler crate source changed (I1); the only Rust changes are the wasm export surface, the kernel
                 header and the driver tests; law and pass documents untouched; earlier epochs, evidence, receipts and
                 records untouched
```

## 6. Current reading

```text
[RUN]  FACT-D23-COMPILER-DAG-EXECUTED: every crate compiles and its tests and its consumers' tests pass in
       dependency order on the qualified proof sets (I-19 closed)
[RUN]  FACT-D23-QUALIFIED-PROOF: the 27-obligation matrix, no FAIL; the judge's mutants all refused
[RUN]  FACT-D23-WASM-TRANSPORT-COMPLETE: the browser boundary carries the whole kernel API; BUILD + OBSERVE in
       Chromium byte-identical to the native driver (D12 B-06 closed as A/B; I-06 transport closed)
[RUN]  FACT-KERNEL-IDENTITY-D23: fcaee2a6... (the identity is source-exact; pinned from the committed source)
[GAP]  FACT-D23-C14-TEXT-OWNER: the C14 text names eight operations; owner annotation (I-29)
[OPEN] B-07 (owner D-5): BUILD without a registry reports OK - recorded by d05, not decided
[NEXT] D24-PIPELINE-GENERICITY (I-07, I-08, I-09, I-20): at least three semantically distinct specimens; the
       per-crate runner and the browser build probe are generic and take any specimen
```

GATE: PASS - the complete current compiler DAG executes according to its contracts on the qualified proof sets, crate
by crate and as a matrix; the public kernel API is carried by both transports, and the browser transport boundary
executes BUILD and OBSERVE in Chromium byte-for-byte as the native driver does; the kernel identity is re-pinned and
the superseded statement reconciled; the one remaining boundary is the contract text, an explicit owner stop.  Task 3
of 6 closed.
