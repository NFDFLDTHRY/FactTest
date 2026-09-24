# D24 - Intended Pipeline Genericity

STATUS: INTENDED ASCII (assembled before routing; source of record for delta D24-PIPELINE-GENERICITY, workpiece W29,
base 6bcc86c)
REQUEST: design/materialization/D21-D26-WHOLE-REPO-EXECUTION-PROMPT.md, D24 PIPELINE GENERICITY / MULTI-SPECIMEN
EXECUTION: "Is FactTest actually a compiler/foundry, or is part of production machinery still secretly a Byte Relay
demo?  This task MUST attack genericity physically ... Backend-specific machinery is allowed.  SPECIMEN-specific
semantics in generic compiler/runtime machinery are not.  Do NOT 'fix' this by renaming strings.  Prove the
distinction.  Build at least THREE semantically distinct specimens ... At least one specimen must NOT be Byte Relay and
must make a hardcoded relay assumption observable ... A source scan alone is insufficient."
ISSUES: I-07 (C: payload A + WEBGPU destroy compiled into the shell), I-08 (B: the anti-cheat scan blind to the byte
form the shell uses), I-09 (C: one fixed operation relay(bytes) executing the first data relation through the first
guard backend), I-20 (D: single-specimen claims).  Found by this task: I-30, I-31, I-32 (A), I-33 (D).
SCOPE: reproduce on the base compiler; repair the specimen-specific machinery generically; execute four specimens
through the whole transformation with the attack list; bind the evidence; no language, planner or verifier semantic
changes; no renaming as a fix.

## 0. Observation before drawing

```text
language     one executable semantic: the typed data transfer @{data NAME a.p -> b.q mode=...} between ports (RelKind
             Data), lowered in model order to TransferRequirements (the planner's slots), realized by H_G conversion
             paths whose backends come from the registry (requires=), planned as the product over slots (guard = the
             union of backends), verified per variant, generated as a bundle.  Objectives, metrics, backend
             availability, component and relation counts, payload shapes are all specimen data.
base compiler (6bcc86c) built the two-relation specimen ledger-mirror (post, mirror): strategy data named ONE relation
             ("relation": the FIRST data relation), runtime.js exported relay(bytes) executing through plan.guard[0],
             the tape recorded relation=post for every payload of both relations; index.html carried payload A as
             0x00,0x01,0x7f,... and a "destroy WEBGPU" button; host/harness/bundle-probe.mjs called
             window.factRuntime.relay and judged with Byte Relay's expectations (E0 WEBGPU, E1 CPU_WASM64), so
             pixel-vault (GPU-only) and dual-stream (CPU preferred) failed the HARNESS while executing correctly;
             tests/commissioning/run-anti-cheat.sh reported the templates clean.  REPRODUCED by
             tests/genericity/reproduce-base.sh at 6bcc86c (all five findings).
two more     a foreign tape (Byte Relay) observed against the ledger_mirror manifest: PASS / EXECUTED_EXACT (the tape
accepted     carried no bundle identity; observe compared only the source sha) - I-30;  backend WEBGPU with recipe
attacks      adapter=wasm64_relay: build OK, certificate PASS, UNAVAILABLE only at runtime - I-31;  and with an
             undeclared adapter the certificate artifact read PASS with zero checks - I-32.
compiler     front end -> typed IR -> capability IR -> H_G -> planner -> verifier: generic over the four specimens
side         without change (variants 2 / 1 / 1 / 4, strengths EXACT_OPTIMUM / FEASIBLE / FEASIBLE / EXACT_OPTIMUM);
             the adapter library keyed by registry recipe names (wasm64_relay, webgpu_relay) is backend-specific
             machinery: allowed, and the wasm export library is the recipe's export list.
judged by    the D22 Factory (6bcc86c: receipt integrity, identity probes, command and canonical confinement)
```

## 1. Specimens (fixtures/genericity/<name>/specimen.json; data, never machinery)

```text
byte-relay     system byte_relay; relay: Bytes; ingress -> egress; WEBGPU + CPU_WASM64, minimize; 2 variants;
               E0 WEBGPU -> loss -> E1 CPU_WASM64; without WebGPU E0 CPU_WASM64   (fixtures/commissioning, by reference)
ledger-mirror  system ledger_mirror; clerk, journal, archive; post + mirror: Entry; payloads 1, 0, 1000 bytes; ONE
               backend (CPU_WASM64, recipe R_ENTRY_COPY); no objective (FEASIBLE); 1 variant; loss of the only
               backend -> E1 without a plan (no fallback invented)
pixel-vault    system pixel_vault; camera -> vault; stash: Tile; payloads 3, 17 bytes; GPU-only registry (WEBGPU
               READY, CPU_WASM64 GAP); 1 variant; without WebGPU: no plan at E0, every stash NO_ACTIVE_PLAN
dual-stream    system dual_stream; source, splitter, sink; feed + drain: Chunk; payloads 4, 513 bytes; both backends;
               MAXIMIZE preference_rank (CPU_WASM64 first - the opposite of Byte Relay); 4 variants; E0 CPU_WASM64
               (plan 0) -> loss of CPU_WASM64 -> E1 the all-WEBGPU variant (plan 3); both relations executed
varied         system names, component names and count, relation names and count, type names, payload shape (0 ..
               1000 bytes), backend availability (single, GPU-only, both), conversion paths, strategy cardinality
               (1, 2, 4), objective / no objective, preference direction
```

## 2. Repairs (generic; no renaming)

```text
codegen        strategy_data_json: "transfers":[{relation,type,mode}] in slot order and, per variant,
               "requirements":[{relation,backends,adapters,conversions}] from plan.edges[slot]; the data's sha256 is
               substituted as STRATEGY_SHA256 into selector.js and recorded as strategy_data_sha256 in bundle.json;
               the data carries no source identity (P6-X03/X04: layout and labels leave executable files identical)
runtime.js     transfer(relation, bytes): the declared transfer, the active plan's requirement for it, its first
               backend's adapter, its conversions; UNKNOWN_RELATION / NO_ACTIVE_PLAN / UNAVAILABLE recorded; init opens
               the tape with @{bundle strategy_data="<sha>" strategy=N certificate=M}; relay removed
index.html     init; one hex input + "transfer <relation>" per STRATEGY.transfers; one "release <backend>" per guard
               backend; no payload, no backend name compiled in
BundleVerifier B-06-selector-strategy-identity, B-08-lineage-strategy-data, B-11-adapter-realizes-backend (the adapter
               block a recipe names declares backend: '<guarded backend>'); passed() = checks ran and none failed;
               a codegen failure records B-00-bundle-generated FAIL
observe        Kind::Bundle record; Context.strategy_data_sha_lineage; evidence_bound(); evidence_lineage OBS/ERR/UNK
               in the observed ASCII and evidence_lineage{} in the delta; kernel: EVIDENCE_UNBOUND (801) -> exit 1;
               wasm-abi: flag bit 2 carries the third sha; factc parses strategy_data_sha256 from the manifest
harness        host/harness/bundle-probe.mjs generic: STRATEGY.transfers x payloads (a payload may name its relation),
               --loss BACKEND|none (default the E0 plan's first guard backend), E1 transfers when a plan activates,
               --expect-e0/--expect-e1 (a backend or none) supplied by the caller; run-physical.sh passes Byte Relay's
anti-cheat     patterns derived from every fixture specimen (system + relation names as quoted strings, calls or
               members; payload bytes as spaced hex, contiguous hex, 0x-comma, decimal-comma), the fixed forms of a
               hardcode (relay(, .relay, the slice names), backend names outside adapter templates; optional tree
tape-sample    fixtures/commissioning/tape-sample.ascii = the physical Byte Relay tape of this delta (bundle record);
               a future strategy-data change makes d07 fail until a physical run regenerates it (STALE_IF by design)
```

## 3. Attack list (tests/genericity/run-attacks.mjs; compiler/kernel/tests/genericity_ladder.rs g01-g07)

```text
renamed relation   transfers renamed in source order; strategy identity changed; the earlier tape EVIDENCE_UNBOUND
changed order      requirement slots follow the new source order; identity changed
legal recipe       recipe renamed: metadata names it, executable strategy identical (a recipe name is registry data)
single backend     dual-stream without WEBGPU: exactly one variant, CPU_WASM64 for both relations
missing conversion NO_LEGAL_PLAN, no bundle
undeclared adapter build fails; certificate FAIL (B-00-bundle-generated), never an empty PASS
wrong family       WEBGPU realized by wasm64_relay: B-11 FAIL (was PASS on the base compiler)
tampered strategy / bundle / guard / certificate   integrity mismatch against bundle.json (check-bundle.mjs); at the
                   kernel level B-06-selector-variants + B-08-artifact-identities, B-08-lineage-certificate,
                   B-08-lineage-strategy-data, B-06-selector-strategy-identity FAIL on re-verification
stale evidence     Byte Relay tape vs ledger_mirror manifest: EVIDENCE_UNBOUND, evidence_lineage ERR (was PASS)
genuine control    the bundle's own tape: evidence_lineage OBS
cross-specimen     no bundle of one specimen names another specimen's system, relations or payload bytes (g02, runner)
```

## 4. Evidence binding (tests/envmap/facts/D24.json + tests/reconcile/d24-reconciliation.json; epoch D24)

```text
IMPL-GENERICITY-RUNNER      tests/genericity/{run-specimens,run-attacks,check-bundle}.mjs + reproduce-base.sh
PROBE-GENERICITY-SPECIMENS  every specimen: build -> strategy data -> Chromium with/without WebGPU -> observe -> integrity
PROBE-GENERICITY-ATTACKS    run-attacks, the genericity ladder, the anti-cheat scan, reproduce-base
FACT-D24-PIPELINE-GENERIC        [RUN]  four specimens through the same machinery, every transfer of every payload exact
FACT-D24-ATTACKS-REFUSED         [RUN]  the attack list refused; anti-cheat clean here, FAIL on the base tree
FACT-D24-EVIDENCE-BOUND          [RUN]  a tape names its strategy data; observe rejects another bundle's tape
FACT-D24-BYTE-RELAY-EXECUTED     [RUN]  Byte Relay under transfer(relation, bytes): E0 WEBGPU, E1 CPU_WASM64, P01/P04;
                                        supersedes FACT-GPU-RELAY-EXACT-E0 and FACT-WASM64-ADMITTED-E1 (R-66)
FACT-KERNEL-IDENTITY-D24         [RUN]  exec identity ef5d886a... under both install names; supersedes D23 (R-65)
FACT-D24-RUNTIME-SELF-INTEGRITY  [GAP]  tamper detection rests on bundle.json; the runtime does not verify its own
                                        files (I-33, class D -> D25)
```

## 5. Mutation plan by station (delta D24-PIPELINE-GENERICITY, workpiece W29, base 6bcc86c)

```text
F0-doc       S-DOC       this ASCII; LEDGER (D23 AFTER, D24 BEFORE); delta + fixtures
F1-fixture   S-FIXTURE   fixtures/genericity/, tape-sample.ascii, tests/genericity/, run-anti-cheat.sh, run-physical.sh,
                         primitives-probe.mjs: syntax, JSON; REPRODUCE FIRST: reproduce-base.sh at 6bcc86c builds the
                         base compiler (target dir outside) and shows the five findings; no other test file changed
F2-web       S-WEB       runtime.js, index.html, selector.js, bundle-probe.mjs, kernel-build-probe.mjs: syntax, generic
                         scan (no backend name, no relay(, no specimen name), the generic entry points present
F3-rust      S-RUST      foundation, codegen, bundle, observe, kernel, wasm-abi sources; genericity + observe ladders;
                         factc main + driver tests: fmt --check, clippy (host graph, wasm graph), cargo test --workspace,
                         wasm64 release build, wasm-inspect 22 exports, exec identity recorded; no other source changed
F4-fixture   S-FIXTURE   proof-sets.json (pin == F3's identity), d24-reconciliation/surfaces, facts/D24.json,
                         components.json, issues.json: JSON; D22 and D23 epochs rebuilt byte-identically
F5-browser   S-BROWSER   identity -> evidence/D24/identity/
F6-build     S-BUILD     cargo build (factc, factory; target dir outside); run-specimens -> evidence/D24/specimens;
                         run-attacks -> attacks; anti-cheat; reproduce-base (cached) -> reproduce-base; run-physical ->
                         physical; primitives-probe (BUNDLE_DIR = the physical bundle) -> selfhost; build-kernels ->
                         kernel; kernel-build-probe with the bound tape -> transport; the genericity ladder log;
                         checks: every summary PASS, the physical tape equals the fixture tape, P01/P04 RUN, both kernels
                         == pin, transport BUILD 1 / OBSERVE 1 all identical
F7-doc       S-DOC       design/execution-manifest rebuilt at 6bcc86c (+ additions); deterministic
F8-evidence  S-EVIDENCE  evidence/D24/{manifest, issues, gate}.json; surfaces.json (d24-surfaces)
F9-doc       S-DOC       epochs/D24.json (facts fragment + R-65/R-66); graph; views; SCHEMA rows; ENVIRONMENT-MAP row;
                         docs/HANDOFF.md; README.md
F10-evidence S-EVIDENCE  validate, Q01-Q22, stale, merge-check, render-check, Q22 check, D18/D18R/D20-SYNC/D23/D24
                         gates, capability + implementation gates, status scan, handoff check, audit -> retire -> audit
                         (W28), cleanup gate, index
F11-doc      S-DOC       observed record
reinspect    STRUCTURAL CHECK / GATE greps; validate; merge-check; render-check; the genericity ladder from the
             canonical tree (target dir outside); epochs/D24.json rebuilt from the graph merged through D23 and compared
```

## 6. Predictions (from the dry run on a scratch clone at 6bcc86c)

```text
P1  reproduce first: tests/genericity/reproduce-base.sh at 6bcc86c REPRODUCED all five findings (a two-relation
    specimen's strategy names one relation; relay(; plan.guard[0]; payload bytes in the shell; the rewritten scan
    detects them in index.html, runtime.js and bundle-probe.mjs of the base tree)
P2  Rust: fmt --check, clippy (host graph, wasm graph) clean; workspace tests 130 passed, 0 failed (kernel ladders
    83 incl. genericity 7, factc driver 8, foundation 9, codegen 1, factory 29); wasm64 release build, 22 exports;
    exec identity ef5d886a... under both install names (whole-file 2dbb740e... pinned name / e0b0aa8b... renamed)
P3  physical: run-specimens 4 specimens x 15 checks PASS + 4 cross-specimen checks PASS; run-attacks 13 PASS (12
    refusals + control); anti-cheat clean; run-physical PASS (the physical Byte Relay tape equals the fixture tape);
    selfhost 13 probes with P01 and P04 RUN against the D24 bundle; kernels under both install names == pin;
    transport (kernel-build-probe) BUILD 1 with 18/18 files identical, OBSERVE 1 with 3/3 identical
P4  manifest at 6bcc86c + additions: 3553 files (PRODUCTION 68, FACTORY 24, TEST 101, FIXTURE 97, REFERENCE 86,
    RECORD 828, LAW 32, HISTORICAL 11, EVIDENCE 2306) in 67 components, unassigned 0, coverage 42/42, rebuilt
    byte-identically; gate PASS with 34 issues (A 11, B 9, C 2, D 3, E 1, F 4, G 4)
P5  epoch D24: 28 nodes / 96 edges (ENV 1, IMPL 1, PROBE 2, EV 16, FACT 6, RECONCILIATION 2; 39 inherited edges);
    merged 1332 / 3447; validate 42; merge-check, render-check PASS; D22 and D23 epochs rebuilt byte-identically
P6  Q22: 187 current facts (RUN 118, OBS 48, GAP 12, ERR 5, UNK 4); RUN 118 = 117 claimable + 1 invalidated;
    FACT-KERNEL-IDENTITY-D23, FACT-GPU-RELAY-EXACT-E0 and FACT-WASM64-ADMITTED-E1 superseded (not current); open
    stops GAP 10 (I-33 added), ERR 5, UNK 4; the five D24 [RUN] facts and the [GAP] newest evidence D24; stale 381
P7  hygiene: status scan PASS, handoff check PASS, D18/D18R/D20-SYNC/D23/D24 gates PASS (surfaces: proof-sets.json,
    docs/HANDOFF.md, components.json as R-65/R-66 require); W28 RETIRABLE -> REMOVED, W28-stage KEEP; index 64 files
P8  identity: 4 toolchains, 45 source tips (5 moved), HeadlessChrome/141.0.7390.37
```

## 7. Invariants

```text
I1  no language, planner or verifier semantic changes: compiler/{source,semantic,capability,implementation,planning,
    verifier} byte-identical to 6bcc86c; the strategy data adds fields, the verifier re-renders it byte for byte
I2  no renaming as a fix: the adapter library keeps its registry-keyed names (backend-specific machinery); the
    generic surfaces are proven by specimens that are not Byte Relay
I3  evidence of one bundle is never evidence of another: every tape names its strategy data identity
I4  the D7 facts and the D23 identity stay as history; successors carry the inherited edges (R-65, R-66)
I5  law and pass documents, adapter templates, membrane-core.js, sw.js, factory/, earlier epochs, evidence, receipts
    and records untouched
```

## 8. Structural check

```text
[x] three specimens that are not Byte Relay, semantically distinct in the dimensions the prompt lists, each through
    ASCII -> IR -> H_G -> plan -> verify -> codegen -> BundleVerifier -> Chromium (with/without WebGPU) -> observe
[x] a hardcoded relay assumption made observable physically before repair (reproduce-base at 6bcc86c: one relation
    named of two, one executed; harness verdicts wrong for pixel-vault and dual-stream) and the scan's blindness shown
[x] every attack of the prompt's list executed with its expected refusal; three attacks that passed repaired first
[x] specimen-specific semantics removed from runtime, shell, harness and scan by generic mechanisms, not renames
[x] evidence bound: six facts, one implementation, two probes, one environment; two reconciliations
[x] the architectural boundary named exactly: one operation kind (typed transfer) is what the language claims;
    runtime self-integrity is an explicit [GAP] (I-33), not a silent assumption
```

STRUCTURAL CHECK: PASS
