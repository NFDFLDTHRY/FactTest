# D23 - Intended Compiler + ABI Execution

STATUS: INTENDED ASCII (assembled before routing; source of record for delta D23-COMPILER-ABI-EXECUTION, workpiece
W28, base a43c0ce)
REQUEST: design/materialization/D21-D26-WHOLE-REPO-EXECUTION-PROMPT.md, D23 COMPILER + ABI EXECUTION / REPAIR: "Does
the complete CURRENT compiler DAG execute according to its contracts, including the browser transport boundary?  Run
bottom-up ... Use CURRENT qualified proof sets ... compare the PUBLIC KERNEL API with host/factc transport, wasm-abi
transport ... D12 B-06 ... A/B implement and prove, or D/G preserve explicit GAP.  Transport-only work MUST NOT invent
compiler semantics.  For every crate: compile -> focused tests -> consumer test -> next crate."
ISSUES: I-06 (B: the browser transport, D12 B-06), I-10 (A: stale kernel header), I-19 (B: no per-crate DAG execution,
no factc test).
SCOPE: execute and record; extend the wasm transport to the whole kernel API and prove it in Chromium byte-for-byte
against the native driver; no semantic change in any compiler crate; the C14 contract text is an owner item.

## 0. Observation before drawing

```text
DAG          Cargo workspace: 14 members = 13 HOST_NATIVE_SET roots (foundation -> source -> semantic -> capability
             -> implementation -> planning -> verifier -> codegen -> bundle -> observe -> kernel; factc; factory) +
             the WASM64_KERNEL_SET root factc-wasm-abi (cdylib, core-only, wasm64-unknown-unknown); 49 path
             dependency edges, first-party only (Q-ALL-02)
tests today  foundation 9 unit tests, codegen 1, kernel ladders 76 (7 files), factory law 29; source, semantic,
             capability, implementation, planning, verifier, bundle, observe: no tests of their own (exercised by the
             kernel ladders); factc: none (I-19); wasm-abi: no host harness (target-specific), Chromium ANALYZE only
             (Q-WASM-07, P10)
public API   compiler/kernel/src/abi.rs: query_abi_version, query_required_workspace, submit_source_bytes,
             submit_machine_state, submit_contracts, submit_metrics, submit_evidence_tape, observe, check_or_compile,
             read_artifact, artifact_count, bundle_file_count, bundle_file, read_diagnostics, read_artifact_metadata,
             reset_workspace (16 functions, 14 operations)
host/factc   transports all 14 (check analyze|build with --contracts --metrics --machine; observe with --tape
             --source --bundle-manifest); writes diagnostics, lineage, artifact metadata, every artifact, bundle/
wasm-abi     transported 8 operations + 4 buffer accessors (13 exports incl. memory): the C14 list; missing:
             submit_contracts, submit_metrics, submit_evidence_tape, observe, read_artifact (+ count), bundle files
             -> D12 B-06: BUILD in the browser stopped at CAPABILITY_IR (no registry could be submitted)
B-06 decided the missing operations are implemented in the kernel and transported natively since D2 (contracts,
             metrics, tape, observe, artifacts, bundle files are what factc reads and writes).  From the current
             contracts: C14 names eight "semantic operations" and DEFERS "transport encoding and concrete function
             signatures".  Adding wasm exports that each call one existing kernel function invents no compiler
             semantic; the input-buffer frame of observe (name, optional shas, class) is transport encoding.
             -> A/B: implement and prove.  The eight-operation TEXT of C14 is out of every station's reach
             (S-ANNOTATE lists ten root documents without BOOTSTRAP-CONTRACTS.md; S-ANNOTATE-OWNER holds
             CAPABILITY-MATRIX.md and BOOTSTRAP-TESTS.md) -> G: owner annotation (I-29), recorded as an explicit
             [GAP] fact; the implementation (abi.rs doc comments) is the record until then.
B-07         BUILD with no registry reports OK and emits the front-end artifacts, no bundle (owner decision D-5, open):
             the factc driver test RECORDS this behaviour; it does not decide it
identity     the kernel exec identity is source-exact: the first scratch build of the extended transport measured
             99c4f674..., the same source after cargo fmt measured fcaee2a6... (panic-location strings carry line
             numbers).  The pin is therefore taken from the committed source (trial builds under both install names:
             fcaee2a6..., whole-file fa5c7131... pinned name / 6deeebc6... renamed).  The eight-export identity
             e8d6582665... stays as history in proof-sets.json; FACT-KERNEL-IDENTITY-DEFINED-D18 is superseded (R-64),
             not edited.
matrix       tests/toolchain/run-qualified-proof.sh (26 obligations; D19 and D20 re-proved it PASS 21 / OBS 3 /
             HEURISTIC 2) covers HOST_NATIVE_SET build dev + release, test dev + release, clippy, exact compile-fail
             diagnostics; WASM64_KERNEL_SET core-only dev + release, clippy, wasm inspect, artifact identity, Chromium
             ABI (ANALYZE); ALL: Cargo-resolved graph, physical manifests, fmt, mutants.  Missing: Chromium BUILD +
             OBSERVE through the full transport (added as Q-WASM-08) and the per-crate DAG order (I-19).
judged by    the D22 Factory (a43c0ce: receipt integrity, identity probes, command and canonical confinement)
```

## 1. Transport extension (compiler/wasm-abi/src/lib.rs; transport only)

```text
exports added   submit_contracts(len), submit_metrics(len), submit_evidence_tape(len) -> 1 | 0 (input buffer)
                observe(name_len, class_len, flags) -> Status: input frame = name ++ [sha_after 32B if flags&1]
                ++ [sha_lineage 32B if flags&2] ++ class; a frame that does not fit returns EXHAUSTED untouched
                artifact_count() -> u64; read_artifact(index) -> byte length into the output buffer (0 = none/too small)
                bundle_file_count() -> u64; bundle_file_path(index), bundle_file_bytes(index) -> length (0 = none)
buffers         IO_BYTES 256 KiB -> 512 KiB (any single artifact fits: the artifact arena is 512 KiB)
unchanged       every existing export, the kernel crates, the driver; no semantic anywhere
surface after   22 exports (memory + 21 functions) = the whole public kernel API; imports []
proof           host/harness/kernel-build-probe.mjs (S-WEB): Chromium instantiates the release kernel, BUILD from
                source + registry + metrics, RESET, OBSERVE from the tape + authored-source sha + lineage sha (read
                from the native bundle manifest); every diagnostic, artifact metadata, artifact and bundle file
                written with the native driver's names and compared byte-for-byte with host/factc's run of the same
                inputs.  proof.mjs browser-build obligation Q-WASM-08 in the matrix.  Trial: BUILD 1, OBSERVE 1,
                21/21 identical (10 artifacts + metadata + diagnostics + 8 bundle files; observe delta, ascii,
                diagnostics).
```

## 2. Per-crate execution (tests/toolchain/run-crate-dag.mjs; generic)

```text
order        Cargo metadata, Kahn over the HOST_NATIVE_SET roots: foundation, source, semantic, capability,
             implementation, planning, verifier, codegen, bundle, observe, kernel, factc, factory; then the wasm64 root
per crate    cargo +1.94.1 build -p X; build --release -p X; test -p X (focused; "no tests of its own" recorded when
             --list is empty); then cargo test -p C for every direct consumer C with tests (consumer test), before the
             next crate.  factc-wasm-abi: build dev + release core-only under nightly-2026-09-24; its consumer test is
             the Q-WASM-08 record.  Records: DIR/<crate>.json (steps, exits, ms, test counts), DIR/summary.json
trial        14 PASS; 931 test executions, 0 failed (foundation 9, codegen 1, kernel 76 - run for each of its ten
             dependencies -, factc 7, factory 29)
```

## 3. Driver tests, header, matrix and pin

```text
host/factc/tests/driver.rs   d01 queries (abi 1, workspace > 1 MiB); d02 usage exit 2, unreadable input exit 3; d03
                             analyze: diagnostics OK, lineage, canonical ASCII / typed IR / capability IR, no bundle;
                             d04 build: certificates, hypergraph, strategies, bundle (manifest, wasm, html, 3+ js), the
                             manifest carries the source sha; d05 B-07 behaviour recorded; d06 determinism (two builds
                             byte-identical, C15); d07 observe: delta, observed ASCII, source unchanged
compiler/kernel/src/lib.rs   header states the phase spine and the two transports (I-10; no code change)
proof.mjs / run-qualified    browser-build obligation; Q-WASM-08 after Q-WASM-07 (native build + observe as the
                             reference, never the verdict); 27 obligations
proof-sets.json              kernel_identity.exec_identity = fcaee2a6...; by_install_name from evidence/D23/kernel;
                             history = the eight-export identity and its whole-file shas (R-64)
```

## 4. Evidence binding (tests/envmap/facts/D23.json + tests/reconcile/d23-reconciliation.json; epoch D23)

```text
builders     build-fact-epoch.mjs (implementation nodes added: IMPL-KERNEL-BUILD-PROBE, IMPL-CRATE-DAG) -> fragment;
             build-reconciliation.mjs --clause-epoch <fragment> --register d23-reconciliation.json -> epochs/D23.json
             (R-64 SUPERSEDED: FACT-KERNEL-IDENTITY-DEFINED-D18 -> FACT-KERNEL-IDENTITY-D23, inherited edges)
facts        FACT-D23-COMPILER-DAG-EXECUTED [RUN], FACT-D23-QUALIFIED-PROOF [RUN], FACT-D23-WASM-TRANSPORT-COMPLETE
             [RUN], FACT-KERNEL-IDENTITY-D23 [RUN], FACT-D23-C14-TEXT-OWNER [GAP]
probes       PROBE-CRATE-DAG, PROBE-BROWSER-BUILD (new); PROBE-QUALIFIED-PROOF, PROBE-KERNEL-SECTIONS (existing)
evidence     proof/summary.json, Q-WASM-08 record + probe.json, crates/{summary, factc-kernel, factc}.json,
             kernel/{builds, sections}.json, Q-WASM-06 record (9 sha256 records)
surfaces     tests/reconcile/d23-surfaces.json: proof-sets.json carries the new pin and the history; docs/HANDOFF.md
             names the transport fact and R-64 and no longer says the exports are absent
```

## 5. Mutation plan by station (delta D23-COMPILER-ABI-EXECUTION, workpiece W28, base a43c0ce)

```text
F0-doc       S-DOC       this ASCII; LEDGER (D22 AFTER, D23 BEFORE); delta + fixtures
F1-rust      S-RUST      wasm-abi exports, kernel header, factc driver tests: fmt --check, clippy (host: kernel, factc;
                         wasm graph: nightly), cargo test -p factc (7), wasm64 release build, wasm-inspect (22 exports
                         incl. the nine), exec identity == pin; no other compiler/host file changed
F2-web       S-WEB       host/harness/kernel-build-probe.mjs: syntax, generic scan; trial against F1's kernel and the
                         native driver (temp): PASS
F3-fixture   S-FIXTURE   run-crate-dag.mjs, proof.mjs, run-qualified-proof.sh, proof-sets.json, d23-reconciliation.json,
                         d23-surfaces.json, build-fact-epoch.mjs (implementations), facts/D23.json, components.json,
                         issues.json: syntax, JSON, generic scan; D22 epoch rebuilt byte-identically by the extended
                         builder; no other test file changed
F4-browser   S-BROWSER   identity -> evidence/D23/identity/
F5-build     S-BUILD     cargo build -p factory (target dir outside the tree); run-qualified-proof -> evidence/D23/proof
                         (27 obligations); run-crate-dag -> evidence/D23/crates; build-kernels -> evidence/D23/kernel;
                         checks: PASS 22 / OBS 3 / HEURISTIC 2, Q-WASM-08 PASS, 14 crates PASS, both kernels == pin
F6-doc       S-DOC       design/execution-manifest rebuilt at a43c0ce (+ additions); deterministic
F7-evidence  S-EVIDENCE  evidence/D23/{manifest, issues, gate}.json; surfaces.json (d23-surfaces)
F8-doc       S-DOC       epochs/D23.json (facts fragment + reconciliation); graph; views; SCHEMA 15 rows; ENVIRONMENT-MAP
                         14 row; docs/HANDOFF.md; README.md
F9-evidence  S-EVIDENCE  validate, Q01-Q22, stale, merge-check, render-check, Q22 check, D18/D18R/D20-SYNC/D23 gates,
                         capability + implementation gates, status scan, handoff check, audit -> retire -> audit
                         (W27), cleanup gate, index
F10-doc      S-DOC       observed record
reinspect    STRUCTURAL CHECK / GATE greps; validate; merge-check; render-check; cargo test -p factc from the canonical
             tree (target dir outside); epochs/D23.json rebuilt from the graph merged through D22 and compared
```

## 6. Predictions (from the assembly trial on a scratch clone at a43c0ce)

```text
P1  transport: 22 exports, imports []; Q-WASM-08 PASS: BUILD status 1, OBSERVE status 1, 21/21 files identical to the
    native driver; wasm-inspect PASS (wasm64 memories)
P2  DAG: 14 crates PASS in the order of section 2; 931 test executions, 0 failed; factc driver 7/7
P3  matrix: 27 obligations - PASS 22, OBS 3, HEURISTIC 2, FAIL 0; mutants 8 of 8 refused; kernel identity fcaee2a6...
    under both install names (Q-WASM-06 PASS), whole-file fa5c7131... / 6deeebc6...
P4  manifest at a43c0ce + 6 live additions: 3295 files (PRODUCTION 68, FACTORY 24, TEST 93, FIXTURE 97, REFERENCE 86,
    RECORD 782, LAW 32, HISTORICAL 11, EVIDENCE 2102) in 65 components, unassigned 0, coverage 41/41, rebuilt
    byte-identically; gate PASS with 29 issues (A 8, B 8, C 2, D 2, E 1, F 4, G 4; D23 3, owner 4)
P5  epoch D23: 20 nodes / 67 edges (ENV 1, IMPL 2, PROBE 2, EV 9, FACT 5, RECONCILIATION 1; 16 inherited edges);
    merged 1304 / 3351; validate 42; merge-check, render-check PASS; D21R and D22 epochs byte-identical under the
    extended builder
P6  Q22: 184 current facts (RUN 116, OBS 48, GAP 11, ERR 5, UNK 4); RUN 116 = 115 claimable + 1 invalidated;
    FACT-KERNEL-IDENTITY-DEFINED-D18 superseded (not current); open stops GAP 9, ERR 5, UNK 4 (the C14 text stop
    added); the four D23 [RUN] facts and the [GAP] newest evidence D23; stale relations 363
P7  hygiene: status scan PASS, handoff check PASS, D18/D18R/D20-SYNC/D23 gates PASS (surfaces: proof-sets.json and
    docs/HANDOFF.md as R-64 requires); W27 RETIRABLE -> REMOVED, W27-stage KEEP
```

## 7. Invariants

```text
I1  no compiler semantic changes: the only Rust sources changed are the wasm export surface, the kernel crate header
    and a new driver test file; every compiler crate's source is byte-identical to a43c0ce
I2  every new export calls exactly one existing kernel function; the native driver is the reference for every byte
I3  the eight-export kernel's identity and evidence stay as history; the successor fact carries the inherited edges
I4  law and pass documents untouched; the C14 text amendment is an explicit owner [GAP], not silently assumed
I5  earlier epochs, evidence, receipts and records untouched
```

## 8. Structural check

```text
[x] every rung of the prompt's DAG list executed and recorded per crate, bottom-up, on the qualified proof sets
[x] HOST_NATIVE_SET, WASM64_KERNEL_SET and ALL obligations of the prompt each mapped to a matrix obligation
[x] the public kernel API compared with both transports; the gap decided from the current contracts (A/B), the
    contract text left to the owner (G) as an explicit stop
[x] transport work invents no semantics (I1, I2); the proof is byte-for-byte against the native transport
[x] evidence bound: five facts, nine records, two probes, one environment; the superseded identity reconciled
[x] predictions carry the trial's numbers; the identity pin is taken from the committed source
```

STRUCTURAL CHECK: PASS
