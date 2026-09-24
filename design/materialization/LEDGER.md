# Materialization Ledger

STATUS: LIVE RECORD OF EVERY FACTTEST DELTA (D0 onward); model-independent since D13-REPO-HYGIENE.
SOURCE OF RECORD: each delta's intended ASCII (design/materialization/M0-INTENDED-SYSTEM.md for M0-M9 / D0-D8,
design/materialization/D<n>-INTENDED-*.md afterwards); this ledger records each workpiece BEFORE/AFTER.
HISTORICAL HEADER (historical, D0-D12): "STATUS: LIVE RECORD OF THE FABLE 5.1 MATERIALIZATION SESSION" - the ledger
began as the historical Fable 5.1 session record required by FABLE-ASCII-SYSTEM-PROMPT.md "REPORT EACH WORKPIECE".

Every entry is written by the S-DOC station inside the workpiece that carries it, so the ledger for delta N is
integrated together with delta N.  Physical evidence lives under evidence/<delta>/ and the FactoryReceipts under
factory/receipts/<delta>/.

---

## D0-BOOTSTRAP-FACTORY  (M1)

BEFORE
- DELTA: D0-BOOTSTRAP-FACTORY  (factory/deltas/D0.json)
- BASE: 32b7e65f8653427e7fc2d05ef3bad6c06f2f022c  tree ab9109c6711ca5341dfcd0c4b9888658befc51b6
- STATION: S-DOC, S-RUST, S-FIXTURE, S-BUILD (bootstrap registry carried by the delta)
- FIXTURE: F0-doc, F1-rust, F2-fixture, F3-build
- READ: everything.  CHANGE: factory/, design/materialization/, evidence/D0/, Cargo.toml, Cargo.lock, .gitignore.
  FORBIDDEN: every pre-existing law/design/pass document (byte-identical).
- INVARIANTS: no third-party crates; law surfaces untouched; mutation only in workpiece W0; ff-only integration.
- TESTS: factory/tests/factory_law.rs f00-f08 (P5-F01..F06 / P6-F01..F06 witnesses), cargo build/fmt/clippy.
- EXPECTED EVIDENCE: 4 FactoryReceipts, verification.json, evidence/D0/build/{test,cargo-tree,toolchain}.log.

AFTER
- RESULT: integrated as 25ef9e372a62f62a08371027b71bf0b4cd4b77ff (ff-only from base).
- RECEIPTS: factory/receipts/D0-BOOTSTRAP-FACTORY/{F0-doc,F1-rust,F2-fixture,F3-build}.json all PASS.
- VERIFICATION: factory/receipts/D0-BOOTSTRAP-FACTORY/verification.json PASS
  (changed paths within MAY CHANGE; MUST NOT CHANGE tree-identical; every fixture receipted; no unreceipted change;
  required paths present; forbidden paths absent).
- INTEGRATION: gate checks PASS (verification PASS, workpiece unchanged since verification, canonical base unmoved,
  canonical branch checked out); commit tree == verified final tree.
- PROBE: re-inspection MATCH (canonical head tree == verified workpiece tree; `cargo test -p factory` 9/9 PASS in
  the canonical checkout).
- OBSERVED ASCII: Factory plane of M0 section 1 now exists as factory/ (router = delta check + fixture check,
  isolated workpiece = git worktree + external state file, stations = registry JSON + open/close receipts,
  independent verify, integration gate, re-inspection).  [RUN]
- MATCH/DIFFER: MATCH, with three recorded bootstrap facts:
  [OBS] W0 was first created by hand (git worktree) before the Factory existed, then removed and re-created by the
        Factory binary built from those sources; every recorded open/close snapshot is a real tree hash.
  [OBS] the StationSpecs used by D0 are delta-owned bootstrap material (rule `delta_owned`, self-limiting: once a spec
        is in the canonical base the rule no longer applies to it).
  [ERR->fixed] a failed shell step in an earlier attempt copied stage files into the canonical working tree as
        untracked files.  No tracked file changed and no ref moved; the integration gate refused the merge.  The
        untracked spill was removed with `git clean` restricted to those paths.  The gate now checks that the
        canonical working tree is clean before merging (carried by D1).

---

## D1-COMPILER-FOUNDATION  (M2)

BEFORE
- DELTA: D1-COMPILER-FOUNDATION (factory/deltas/D1.json)
- BASE: 25ef9e372a62f62a08371027b71bf0b4cd4b77ff
- STATION: S-DOC, S-RUST, S-WEB, S-FIXTURE, S-BUILD, S-EVIDENCE
- FIXTURE: F0-doc, F1-rust, F2-web, F3-fixture, F4-build, F5-evidence
- READ: everything.  CHANGE: compiler/, host/, factory/, fixtures/, tests/, design/materialization/, evidence/D1/,
  Cargo.toml, Cargo.lock, .gitignore.  FORBIDDEN: law/design/pass documents, D0 receipts/evidence, M0 ASCII.
- INVARIANTS: kernel crates `#![no_std]` + `#![forbid(unsafe_code)]` (foundation, kernel); no third-party crates
  (depcheck); wasm64-unknown-unknown only (wasm-inspect rejects i32-address memories); planner/verifier separation
  reserved by the crate DAG (no planning/verifier crates yet); the ASCII language kernel is deliberately absent (B8).
- TESTS: B0 (workspace DAG + depcheck), B1 (nostd-check + std-in-kernel fixture rejected), B2 (third-party-dep
  fixture rejected by depcheck), B3 (id-substitution fixture rejected; Span validity test), B4 (deterministic
  diagnostics test), B5 (phase/artifact envelope declared; composition tests arrive with M3), B6 (reserved: crate
  DAG has no planner/verifier yet), B7 (opaque source test), B8 (LANGUAGE_KERNEL_NOT_IMPLEMENTED test),
  B9 (nightly build-std wasm64 module + first-party inspection), B10/B11 (Chromium instantiation via Playwright,
  declared imports only, QUERY_ABI_VERSION == 1), B12 (evidence index with sha256 identities).
- EXPECTED EVIDENCE: evidence/D1/build/*, evidence/D1/negative/*, evidence/D1/bootstrap/* (module, inspection JSON,
  Chromium record, Node record), evidence/D1/index.json, six FactoryReceipts, verification.json.

AFTER
- RESULT: integrated as 8ab25c9af3401ffd14b99c2b5d9333763b130be2 (ff-only from 25ef9e3).
- RECEIPTS: factory/receipts/D1-COMPILER-FOUNDATION/{F0-doc,F1-rust,F2-web,F3-fixture,F4-build,F5-evidence}.json PASS.
- VERIFICATION: verification.json PASS.  INTEGRATION: gate PASS.  PROBE: re-inspection MATCH (`cargo test` in canonical).
- EVIDENCE: evidence/D1/bootstrap/factc_wasm_abi.wasm (sha256 529ee8da...abbc, 124754 bytes, memory I64 min=26),
  b9-inspect.json (all memories i64), b10-b11-chromium.json (HeadlessChrome/141, imports [], abi_version 1,
  LANGUAGE_KERNEL_NOT_IMPLEMENTED span 0..N), b10-node.json (Node 22/V8 12.4 cannot compile the memory64 module:
  recorded, Node is not the host), negative/summary.log (B1/B2/B3 fixtures rejected), index.json (B12).
- OBSERVED ASCII: compiler/foundation, compiler/kernel (ABI), compiler/wasm-abi, host/factc, host/harness exist
  as drawn in M0 section 1; B0-B12 rungs CLAIMED->CHECKED->BUILT->EXECUTED (browser).  [RUN]
- MATCH/DIFFER: MATCH.  [OBS] the integration-gate hardening (clean canonical tree check, idempotent commit)
  described in D0 AFTER was carried by this delta's factory/src/ops.rs.

---

## D2-LANGUAGE-KERNEL  (M3)

BEFORE
- DELTA: D2-LANGUAGE-KERNEL (factory/deltas/D2.json)
- BASE: 8ab25c9af3401ffd14b99c2b5d9333763b130be2
- STATION: S-DOC, S-RUST, S-FIXTURE, S-BUILD, S-EVIDENCE
- FIXTURE: F0-doc, F1-rust, F2-fixture, F3-build, F4-evidence
- READ: everything.  CHANGE: compiler/, host/factc/, fixtures/language/, fixtures/commissioning/, tests/, ledger,
  evidence/D2/, Cargo.toml/Cargo.lock.  FORBIDDEN: law/design/pass docs, D0/D1 receipts and evidence,
  factory/src/, factory/registry/, host/harness/, M0 ASCII.
- INVARIANTS: islands are the only semantic entry; ambiguity is an error; kernel crates no_std + forbid(unsafe);
  no third-party crates; canonical rendering round-trip/idempotence; authored source never mutated.
- TESTS: L0-L35 (fixtures/language + compiler/kernel/tests/language_ladder.rs), P6-G01/G02/A01-A03, B7/B8 updated
  (kernel present), B9-B11 rerun with the Byte Relay source in Chromium, negative fixtures, factory law.
- EXPECTED EVIDENCE: evidence/D2/{build,byte-relay,bootstrap,negative}/*, index.json, five receipts, verification.
- COMPILER-PLANE DECISIONS RECORDED (not source semantics; see M0 section 4):
  [NEW] reachable(a, b) is reflexive-transitive over DATA (component-level) and SEQUENCE edges; sequence_before is
        transitive over SEQUENCE edges only; acyclic(scope) is over the same edge set restricted to the scope.
  [NEW] BUILD is blocked by GAP/ERR/UNK on any object status or issue (execution-critical governance); ANALYZE keeps
        the partial graph.  OBS/RUN/NEW never block.
  [NEW] Refinement law v1 checks interface/direction/types/effects/capabilities/pins/promised invariants; sequence
        and failure-contract preservation are [GAP] (not modeled in language version 1).
  [NEW] Cross-unit references reach only public ports (`sys::comp.port`); types/components/etc. are private in
        language version 1, so cross-system DATA relations need a future public-type language change: [GAP].
  [NEW] `use`d systems must be submitted in the same kernel session; SystemId identity is by bytes, never by path.
  [NEW] Canonical rendering: fixed 72-dash rules, `| ` prefixed lines, grouping prose headers, deterministic
        name order; positional arena ids never appear in canonical ASCII or typed IR.

AFTER
- RESULT: integrated as 4571d1449cc32d28d2c2f601dc4bb2a879dca7d7 (ff-only from 8ab25c9).
- RECEIPTS: factory/receipts/D2-LANGUAGE-KERNEL/{F0-doc,F1-rust,F2-fixture,F3-build,F4-evidence}.json PASS.
- VERIFICATION: PASS.  INTEGRATION: PASS.  PROBE: re-inspection MATCH.
- EVIDENCE: evidence/D2/build/test.log (30 language witnesses + 4 bootstrap + 9 foundation + 9 factory-law PASS),
  evidence/D2/byte-relay/* (factc BUILD on the authoritative source: status OK, canonical ASCII, typed IR with all
  four invariants holding), evidence/D2/bootstrap/* (wasm64 kernel with the language: 2.3 MB module, all memories
  i64; Chromium 141 ran the Byte Relay source through the ABI with status OK), evidence/D2/negative/*.
- OBSERVED ASCII: compiler/source and compiler/semantic exist as drawn; canonical renderer is the human/AI witness.
- MATCH/DIFFER: MATCH.  [ERR->fixed] the first D2 routing attempt was refused by the Factory because the fixture
  asked S-DOC for `.cargo/` authority it does not have; the stack policy moved into the B9 script environment and
  the test harness threads instead.  No station spec was widened.

---

## D3-LOWERING-CONTRACTS  (M4)

BEFORE
- DELTA: D3-LOWERING-CONTRACTS (factory/deltas/D3.json)
- BASE: 4571d1449cc32d28d2c2f601dc4bb2a879dca7d7
- STATION: S-DOC, S-RUST, S-FIXTURE, S-BUILD, S-EVIDENCE
- FIXTURE: F0-doc, F1-rust, F2-fixture, F3-build, F4-evidence
- READ: everything.  CHANGE: compiler/ (new crates capability, implementation; kernel/factc wiring),
  fixtures/commissioning/ (registry, metrics, epochs, witnesses), tests/, ledger, evidence/D3/.
  FORBIDDEN: law/design/pass docs, D0-D2 receipts/evidence, factory/src, factory/registry, host/harness,
  fixtures/language, fixtures/compiler, M0 ASCII.
- INVARIANTS: lowering selects no implementation; only registry conversions form paths (no implicit conversion);
  GAP/ERR/UNK backends never enter H_G (C subset of G, target preserved as data); H_G independent of admission,
  H_A(E) filters it; registry is DATA; no_std/no-third-party unchanged.
- TESTS: lowering ladder P5-L01 (W and G both in H_G), L02 (pin restricts), L03 (H_A filter, H_G unchanged), L04
  (no representation path -> NO_LEGAL_PLAN), L06/P6-V03 (copy-only conversions cannot serve move), P5-S01/S03
  (33 G families present, only CPU_WASM64/WEBGPU READY-CONTRACT), P6-G03 (READY-CONTRACT needs a recipe),
  registry dialect rejections; factc on Byte Relay under E_model_0/E_model_1; all prior suites; B9-B11.
- EXPECTED EVIDENCE: evidence/D3/{build,byte-relay/E_model_0,byte-relay/E_model_1,bootstrap}/*, index.json.
- COMPILER-PLANE DECISIONS RECORDED:
  [NEW] Registry dialect keywords: registry, representation, boundary, conversion, backend, authority_link, recipe,
        metric_value, epoch, admission.  `backend` is the ImplementationContract record (named to avoid confusion
        with the source keyword `implementation`).  Unknown keywords are errors.
  [NEW] A transfer requirement's legal edges are cycles boundary -> ... -> boundary over conversions that support
        the relation's transfer mode and preserve value, without revisiting a representation (max 6 steps).
        The identity path exists only if the registry declares a boundary->boundary conversion (it does not).
  [NEW] Static legality = every backend a path requires is READY-CONTRACT and every pin on the endpoint
        components is among those backends.  Rejections are kept with structured reasons.
  [OBS] MAX_TOKENS_PER_ISLAND raised 48 -> 96 (a backend record with lifecycle lists exceeds 48 tokens).

AFTER
- RESULT: integrated as a39ea02ce0170f9bc3f763d106f5cde3f932188a (ff-only from 4571d14).
- RECEIPTS: factory/receipts/D3-LOWERING-CONTRACTS/{F0-doc,F1-rust,F2-fixture,F3-build,F4-evidence}.json PASS.
- VERIFICATION: PASS.  INTEGRATION: PASS.  PROBE: re-inspection MATCH.
- EVIDENCE: evidence/D3/build/test.log (10 lowering witnesses + all prior suites), evidence/D3/byte-relay/
  E_model_{0,1}/implementation-hypergraph.json (H_G: edge 0 host_to_wasm/wasm_to_host guard CPU_WASM64, edge 1
  host_to_gpu/gpu_to_host guard WEBGPU; 33 registry backends; no rejected/unsatisfied), capability-ir.json
  (4 PASS invariants, transfer/test/evidence OPEN), evidence/D3/bootstrap/* (wasm64 kernel rerun in Chromium).
- OBSERVED ASCII: compiler/capability and compiler/implementation exist as drawn; contract instances are data
  under fixtures/commissioning/.
- MATCH/DIFFER: MATCH.

---

## D4-PLANNER-VERIFIER  (M5)

BEFORE
- DELTA: D4-PLANNER-VERIFIER (factory/deltas/D4.json)
- BASE: a39ea02ce0170f9bc3f763d106f5cde3f932188a
- STATION: S-DOC, S-RUST, S-FIXTURE, S-BUILD, S-EVIDENCE
- FIXTURE: F0-doc, F1-rust, F2-fixture, F3-build, F4-evidence
- READ: everything.  CHANGE: compiler/ (new crates planning, verifier; kernel/factc wiring), the
  forge-verified-strategy compile-fail fixture, tests/, ledger, evidence/D4/.  FORBIDDEN: law/design/pass docs,
  D0-D3 receipts/evidence, factory/src, factory/registry, host/harness, fixtures/language, fixtures/commissioning,
  the earlier negative fixtures, M0 ASCII.
- INVARIANTS: planner crate cannot name VerifiedStrategy's constructor (crate DAG: planning does not depend on
  verifier; sealed private field); verifier re-derives every fact from model/obligations/registry and consumes the
  CandidateStrategy as data only; an invalid variant fails the whole strategy (preference cannot rescue it);
  UNKNOWN metric != 0 and forbids EXACT_OPTIMUM; activation takes a VerifiedStrategy and yields NO_ACTIVE_PLAN
  when no guard passes; synthetic epochs are labelled SYNTHETIC_MODEL in every receipt.
- TESTS: strategy ladder (13): two conditionally verified variants dispatched G before W; P6-M01 (E_model_0 -> G);
  P6-M02 (E_model_1 -> W, identical VerifiedStrategy); P6-M03 (unknown metric not zero, no optimum claim);
  P6-M04/G06 (selector only over verified variants; NO_ACTIVE_PLAN); P6-V01 (type mismatch never reaches
  planning); P6-V02/V04 (missing/undeclared conversion -> V-LOW / no G variant); P6-V03/P5-L06 (move-only
  conversions cannot serve copy); P6-V05 (bad guard + best preference -> V-ADM/V-STRAT FAIL); P5-V03/V04
  (FEASIBLE without objective, canonical tie-break); P5-V06 (E0 activation not reused at E1); P5-V07 (hard
  constraint excludes before ranking); P6-G04/G05 (no VerifiedStrategy without verifier PASS; compile-fail
  fixture forge-verified-strategy).
- EXPECTED EVIDENCE: evidence/D4/{build,byte-relay/E_model_0,byte-relay/E_model_1,negative}/*, index.json.
- COMPILER-PLANE DECISIONS RECORDED:
  [NEW] Variant enumeration = cartesian product of legal H_G edges per requirement (bounded by MAX_VARIANTS=16;
        exceeding it marks enumeration incomplete => never EXACT_OPTIMUM).
  [NEW] Goal aggregation = SUM of metric_value over the variant's guard backends; UNKNOWN if any is missing;
        ranking places known values before unknown ones (an unknown never ranks as free).
  [NEW] Result strength: NO_PLAN | FEASIBLE (no objective) | EXACT_OPTIMUM (complete enumeration, all goal
        metrics known) | HEURISTIC otherwise.  BOUNDED_OPTIMUM is defined but no bounded search exists yet.
  [NEW] Verifier rule ids V-SEM, V-REF, V-LOW, V-REP, V-OWN, V-CAP, V-ADM, V-PLAN, V-EFF, V-STRAT; ProofCertificate
        per variant (conditional on its guard), StrategyCertificate id 1000.
  [GAP] Sequence obligations are acknowledged (endpoints resolved) but no plan-level ordering model exists in v1.

AFTER
- RESULT: integrated as 77fb4594d52d02ebda3b1ea42959507f932af5e0 (ff-only from a39ea02).
- RECEIPTS: factory/receipts/D4-PLANNER-VERIFIER/{F0-doc,F1-rust,F2-fixture,F3-build,F4-evidence}.json PASS.
- VERIFICATION: PASS.  INTEGRATION: PASS.  PROBE: re-inspection MATCH.
- EVIDENCE: evidence/D4/build/test.log (13 strategy witnesses + all prior), evidence/D4/byte-relay/E_model_{0,1}/
  {candidate-strategy,verification-certificates,verified-strategy,activation-receipt-model}.json (two variants,
  21 obligation results each PASS, strategy certificate PASS, EXACT_OPTIMUM, E_model_0 -> plan 1 [WEBGPU],
  E_model_1 -> plan 0 [CPU_WASM64], byte-identical VerifiedStrategy across epochs), evidence/D4/negative/summary.log
  (forge-verified-strategy rejected: "cannot construct VerifiedStrategy ... due to private fields").
- OBSERVED ASCII: compiler/planning and compiler/verifier exist as drawn; planning does not depend on verifier.
- MATCH/DIFFER: MATCH.

---

## D5-CODEGEN-BUNDLE  (M6)

BEFORE
- DELTA: D5-CODEGEN-BUNDLE (factory/deltas/D5.json)
- BASE: 77fb4594d52d02ebda3b1ea42959507f932af5e0
- STATION: S-DOC, S-RUST, S-WEB, S-FIXTURE, S-BUILD, S-EVIDENCE
- FIXTURE: F0-doc, F1-rust, F2-web, F3-fixture, F4-build, F5-evidence
- READ: everything.  CHANGE: compiler/ (new crates codegen, bundle; kernel/factc wiring), codegen templates
  (S-WEB), fixtures/commissioning/contracts.ascii (recipe exports gain region_in/region_out/region_capacity),
  tests/, ledger, evidence/D5/.  FORBIDDEN: law/design/pass docs, D0-D4 receipts/evidence, factory/src,
  factory/registry, host/harness, fixtures/language, fixtures/compiler, the other commissioning fixtures, M0 ASCII.
- INVARIANTS: codegen takes &VerifiedStrategy only; adapters = recipes of verified variants (no selection);
  wasm emitter never writes an i32-address memory; selector/runtime contain no code generation; lineage manifest
  names source/canonical/typed-IR hashes, strategy and certificate ids; BundleVerifier is independent (tamper tests).
- TESTS: bundle ladder (8): both variants + selector emitted, no third adapter (P6-B01/B02/C1/C2); wasm memory64
  + recipe exports, wasm32 tamper FAIL (P6-B05/P5-C04); undeclared third adapter FAIL (P6-B03/P5-C02); missing
  variant in membrane or selector FAIL (P6-B04/P5-C03); lineage/identity tamper FAIL (P6-B06/P5-C05); registry
  without the GPU path emits exactly one adapter; ANALYZE emits no bundle and failed verification leaves none
  (P5-C01/P6-G04); bundle content is recipe-driven, never slice-named (P6-X06); manifest roles/lineage.
- EXPECTED EVIDENCE: evidence/D5/{build,byte-relay/E_model_0/bundle,...}/*, bundle-certificate.json,
  bundle-wasm-inspect.json (memory I64 min=32), index.json.
- COMPILER-PLANE DECISIONS RECORDED:
  [NEW] Bundle layout: <adapter>.wasm per wasm_module recipe, membrane.js (core + adapter templates delimited by
        /*ADAPTER-BEGIN:name*/ ... /*ADAPTER-END:name*/), selector.js (/*STRATEGY-BEGIN*/json/*STRATEGY-END*/),
        runtime.js (evidence hooks /*EVIDENCE-HOOK:...*/), index.html, manifest.webmanifest, sw.js (cache versioned
        by bundle id), bundle.json (GeneratedBundle manifest).
  [NEW] wasm64 relay module layout: memory 32 pages (2 MiB), region_in at 0, region_out at 1 MiB, capacity 1 MiB;
        copy_bytes(src,dst,len) is memory.copy with i64 operands.  Function library keyed by recipe export names.
  [NEW] Adapter template library keyed by recipe adapter names (wasm64_relay, webgpu_relay); an unknown adapter name
        is a structured codegen GAP, never a substitution.
  [NEW] Evidence tape dialect emitted by the runtime: @{epoch E}, @{admission B DECISION evidence=... [reason=...]},
        @{activation E plan=N status=...}, @{executed E plan=N relation=R bytes=N input="sha" output="sha" exact=b},
        @{loss E B reason=...}, @{transition E -> E' stale_plan=N replacement=N}, @{no_active_plan E}.
        Consumed by the kernel observe phase (M7).
  [OBS] The bundle_id in bundle.json is the identity of the files emitted before the shell/manifest/sw (they embed
        it); the BundleVerifier binds the manifest to every file through per-file sha256 (B-08-artifact-identities).
  [ERR->fixed] The first D5 routing attempt was refused by the Factory: fixture F1-rust ran `cargo build` before
        F2-web had placed compiler/codegen/templates (the codegen crate include_str!s them), so the F1 receipt was
        FAIL, independent verification FAILed and the integration gate STOPped without moving any ref.  The station
        order was corrected to F0-doc, F2-web, F1-rust, F3-fixture, F4-build, F5-evidence and W5 re-created.
        A second attempt was refused at F2-web (changed paths outside the fixture's MAY CHANGE) because the
        operator's staging step copied the templates directory to the wrong location; W5 was re-created again.
        Both refusals moved no ref and left no trace in the canonical repository.

AFTER
- RESULT: integrated as e72fbe7e8ea16522bab9619ee7bafa8dd3104a45 (ff-only from 77fb459) on the third routing
  attempt (the two refusals are recorded above; neither moved a ref).
- RECEIPTS: factory/receipts/D5-CODEGEN-BUNDLE/{F0-doc,F2-web,F1-rust,F3-fixture,F4-build,F5-evidence}.json PASS.
- VERIFICATION: PASS.  INTEGRATION: PASS.  PROBE: re-inspection MATCH.
- EVIDENCE: evidence/D5/build/test.log (9 bundle witnesses + all prior), evidence/D5/byte-relay/E_model_0/bundle/*
  (wasm64_relay.wasm 162 bytes, memory I64 min=32, exports memory/abi_version/copy_bytes/region_*; membrane.js with
  exactly the two verified adapters; selector.js with dispatch order [1,0]; bundle.json lineage),
  bundle-certificate.json (23 checks PASS), bundle-wasm-inspect.json.
- OBSERVED ASCII: compiler/codegen and compiler/bundle exist as drawn; the generated WebApp (object B) is emitted
  under evidence/, never into the repository's source surfaces.
- MATCH/DIFFER: MATCH.

---

## D6-RUNTIME-EVIDENCE  (M7, first physical commissioning evidence)

BEFORE
- DELTA: D6-RUNTIME-EVIDENCE (factory/deltas/D6.json)
- BASE: e72fbe7e8ea16522bab9619ee7bafa8dd3104a45
- STATION: S-DOC, S-RUST, S-WEB, S-FIXTURE, S-BUILD, S-BROWSER, S-EVIDENCE
- FIXTURE: F0-doc, F1-rust, F2-web, F3-fixture, F4-build, F5-browser, F6-evidence
- READ: everything.  CHANGE: compiler/observe, kernel/factc wiring, host/harness/bundle-probe.mjs,
  fixtures/commissioning/{payloads.json,tape-sample.ascii}, tests/, ledger, evidence/D6/.  FORBIDDEN: law/design/
  pass docs, D0-D5 receipts/evidence, factory/src, factory/registry, the authoritative commissioning source and
  registry, codegen templates, M0 ASCII.
- INVARIANTS: observed ASCII is a derived unit (`<system>_observed`) of governance issues only; the harness never
  invokes the compiler and records bundle hashes before/after; exact comparison is harness-side; SwiftShader
  WebGPU is recorded as such (adapter info vendor=google architecture=swiftshader); synthetic epochs never appear.
- TESTS: observe ladder (6): tape parse, P6-R07 rendering, observed ASCII parses under ANALYZE, negative 10/11;
  tests/commissioning/run-physical.sh: compile (BUILD, PASS certificate) -> Chromium probe with WebGPU
  (E0 both payloads exact via WEBGPU, GPUDevice.destroy() -> lost "destroyed" -> E1 both payloads exact via
  CPU_WASM64, bundle unchanged) -> Chromium probe without WebGPU (E0 via CPU_WASM64, no GPU evidence) ->
  factc observe on both tapes (source unchanged, transition E0->E1 rendered).
- EXPECTED EVIDENCE: evidence/D6/physical/{compile,probe-webgpu,probe-no-webgpu,observed,observed-no-webgpu}/*.
- COMPILER-PLANE DECISIONS RECORDED:
  [NEW] Observed ASCII object naming: issues admission_<E>_<backend>, activation_<E>, executed_<E>_<relation>_<n>,
        loss_<E>_<backend>, no_active_plan_<E>, transition_<E>_<E'>, source_of_record.  Status words derive from
        evidence: RUN for admitted/exact/active, ERR for rejected/lost/mismatch/no plan, OBS for transitions and an
        unchanged source, UNK when the host supplied no source identities.
  [NEW] Kernel OBSERVE op inputs: evidence tape bytes + host-measured identities (sha256 of the authored source
        after the session, sha256 recorded in bundle.json).  The kernel compares; it never reads files.
  [OBS] Without WebGPU flags, Chromium 141 still exposes navigator.gpu but requestAdapter() returns null: the
        runtime records `admission WEBGPU REJECTED evidence=request reason=request_unavailable`.

AFTER
- RESULT: integrated as 578108e85c909a9f56f147b1f52e27bd02b33c34 (ff-only from e72fbe7) after one refusal
  (MAY CHANGE `compiler/` overlapped the protected `compiler/codegen/templates/`; narrowed, W6 re-created).
- RECEIPTS: factory/receipts/D6-RUNTIME-EVIDENCE/{F0-doc,F1-rust,F2-web,F3-fixture,F4-build,F5-browser,F6-evidence}.json PASS.
- VERIFICATION: PASS.  INTEGRATION: PASS.  PROBE: re-inspection MATCH.
- EVIDENCE (PHYSICAL_BROWSER, produced by the S-BROWSER station): evidence/D6/physical/probe-webgpu/probe-record.json
  verdict {e0_all_exact:true, e0_backend:WEBGPU, loss_witnessed:true, e1_all_exact:true, e1_backend:CPU_WASM64,
  epochs:[E0,E1], no_compiler_invoked:true, bundle_unchanged:true}; adapter info vendor=google
  architecture=swiftshader; payload A `00 01 7f 80 ff 55 aa 10` and B `de ad be ef 00 13 37 c0 ff ee` exact at E0
  (plan 1) and E1 (plan 0); loss detail "destroy() invoked; lost reason destroyed"; probe-no-webgpu: E0 via
  CPU_WASM64 with WEBGPU REJECTED request_unavailable (no fake GPU evidence); observed/observed.ascii with 14 derived
  governance islands and `source_of_record OBS "authored source unchanged"`.
- OBSERVED ASCII: the RUNTIME PLANE and the evidence loop of M0 section 1 exist and closed once physically.
- MATCH/DIFFER: MATCH with the honesty boundary [UNK] hardware GPU (SwiftShader only on this host).

---

## D7-COMMISSIONING-GATE  (M8)

BEFORE
- DELTA: D7-COMMISSIONING-GATE (factory/deltas/D7.json)
- BASE: 578108e85c909a9f56f147b1f52e27bd02b33c34
- STATION: S-DOC, S-WEB, S-RUST, S-FIXTURE, S-BUILD, S-BROWSER, S-EVIDENCE
- FIXTURE: F0-doc, F1-web, F2-rust, F3-fixture, F4-build, F5-browser, F6-evidence
- READ: everything.  CHANGE: codegen template runtime.js (metric refs from strategy data) + strategy data
  (goals), commissioning ladder tests, three commissioning witness fixtures, tests/commissioning/run-anti-cheat.sh,
  COMMISSIONING-RECORD.md, README.md status, ledger, evidence/D7/.  FORBIDDEN: every other crate, host/, the
  authoritative commissioning data, D0-D6 receipts/evidence, law/pass docs, M0 ASCII.
- INVARIANTS: no slice name in machinery; identity independent of layout/labels/SystemId; generic failure ids;
  evidence classes never conflated.
- TESTS: commissioning ladder (4): P6-A01/X03 compact layout identical (canonical, typed IR, VerifiedStrategy,
  emitted bundle files); P6-X01 renamed system same strategy shape and no slice name in the selector; P6-X04
  labels change canonical text only; P6-X05 failing diagnostics/certificates carry generic ids.  run-anti-cheat.sh
  (P6-X06).  Second physical run (P6-R01..R08, X02) under the Factory.
- EXPECTED EVIDENCE: evidence/D7/{build,anti-cheat,physical}/*, index.json.

AFTER
- RESULT: integrated as 976718a608c58e0f22eb26802eb4c125ba72ee80 (ff-only from 578108e); no refusals.
- RECEIPTS: factory/receipts/D7-COMMISSIONING-GATE/{F0-doc,F1-web,F2-rust,F3-fixture,F4-build,F5-browser,F6-evidence}.json PASS.
- VERIFICATION: PASS.  INTEGRATION: PASS.  PROBE: re-inspection MATCH.
- EVIDENCE: evidence/D7/build/test.log 95 passed / 0 failed (commissioning ladder 4 new); evidence/D7/anti-cheat/summary.log
  compiler-src/codegen-templates/factory-src/host all clean (P6-X06); evidence/D7/physical second PHYSICAL_BROWSER run
  with the same verdict as D6 (E0 WEBGPU exact x2, loss "destroyed", E1 CPU_WASM64 exact x2, no codegen, bundle unchanged)
  and metric_evidence_refs now derived from strategy data ("metric:preference_rank").
- OBSERVED ASCII: evidence/D7/physical/observed/observed.ascii.
- MATCH/DIFFER: MATCH; COMMISSIONING-RECORD.md maps all 45 PASS6-TESTS ids.

---

## D8-REOBSERVE  (M9)

BEFORE
- DELTA: D8-REOBSERVE (factory/deltas/D8.json)
- BASE: 976718a608c58e0f22eb26802eb4c125ba72ee80
- STATION: S-DOC, S-BUILD, S-EVIDENCE
- FIXTURE: F0-doc, F1-build, F2-evidence
- READ: everything.  CHANGE: design/materialization/M9-OBSERVED-SYSTEM.md, this ledger, evidence/D8/.
  FORBIDDEN: everything else (no source, fixture, template, registry or law change).
- INVARIANTS: M0 drawing untouched; differences preserved as [OBS]/[GAP]/[UNK], never resolved by editing the drawing.
- TESTS: full `cargo test` on the final tree recorded as evidence/D8/build/test.log; M9 names every M0 section.
- EXPECTED EVIDENCE: evidence/D8/build/test.log, evidence/D8/index.json.

AFTER
- a delta cannot carry its own integration result; D8's receipts, verification.json and integration commit are
  read from factory/receipts/D8-REOBSERVE/ and `git log` (author FactTest Factory), and W8.state.json outside the tree.


---

## D9-RUST-CARGO-PROOF  (proof-harness commissioning)

BEFORE
- DELTA: D9-RUST-CARGO-PROOF (factory/deltas/D9.json)
- BASE: f4395dfb79f19cf5fe1ce23891a5157b55fe53a4 (branch main = owner-approved merge of PR #1; development branch
  claude/d9-rust-cargo-proof-4nys6s at the same commit)  tree d8e565205d90d0cee6bbf6a7c79e944c4caa0f0c
- STATION: S-DOC, S-FIXTURE, S-BUILD, S-EVIDENCE (all from the canonical registry; no new station)
- FIXTURE: F0-doc, F1-fixture, F2-build, F3-doc, F4-evidence
- READ: everything.  CHANGE: design/materialization/D9-INTENDED-PROOF-HARNESS.md, D9-OBSERVED-PROOF-HARNESS.md, this
  ledger, factory/deltas/D9.json, factory/fixtures/D9/, factory/receipts/D9-RUST-CARGO-PROOF/, tests/toolchain/,
  fixtures/toolchain/, evidence/D9/.  FORBIDDEN: every law/pass/design document, compiler/, host/, factory/src/,
  factory/registry/, factory/tests/, Cargo.toml, Cargo.lock, rust-toolchain.toml (must stay absent), D0-D8 deltas/
  fixtures/receipts/evidence, fixtures/{language,compiler,commissioning}, tests/{bootstrap,commissioning,language},
  M0, M9, COMMISSIONING-RECORD.md, README.md.
- INVARIANTS: D9 evaluates the judge and repairs nothing in production; no third-party crate; no toolchain pin; SUT
  failures are evidence verdicts, never station failures; every obligation record names command, toolchain,
  package/target/profile selection, observed result, verdict and reason; compile-fail verdicts never from exit codes;
  no_std weight only from the core-only wasm64 graph; wasm64-unknown-unknown only; fixture trees never written by
  build commands; mutants outside the product workspace.
- TESTS: tests/toolchain/run-proof-matrix.sh (T9-P1..P8), tests/toolchain/run-mutants.sh (T9-P9, M1..M8),
  harness syntax and mutant-contract checks (F1), observed-ASCII completeness (F3).
- EXPECTED EVIDENCE: evidence/D9/{toolchain,selection,native,lint,compile-fail,nostd,deps,wasm64}/*.json,
  evidence/D9/mutants/*/{weak,qualified,mutant}.json, summary.json/.txt, index.json; 5 FactoryReceipts;
  verification.json.
- PREDICTED (design/materialization/D9-INTENDED-PROOF-HARNESS.md section 2): T9-P1-01 FAIL (wasm-abi omitted from
  default-members), T9-P2-02 / T9-P3-02 FAIL (native --workspace: wasm-abi panic_handler gated to wasm64), T9-P7 GAP
  (no pin, nightly drifted), everything else PASS, all eight mutants RUN.

AFTER
- RESULT: workpiece W9 verified and integrated by the Factory (ff-only from f4395df); the integration commit is read
  from `git log` (author FactTest Factory) and W9.state.json outside the tree.
- RECEIPTS: factory/receipts/D9-RUST-CARGO-PROOF/{F0-doc,F1-fixture,F2-build,F3-doc,F4-evidence}.json PASS
  (F1 closed FAIL once on a mis-written fixture check that matched `version = "0.0.0"` under [package]; the fixture was
  corrected on the ASCII/control surface; F1 was then re-run from a workpiece state without its outputs so that the
  PASS receipt carries every harness/fixture path; independent verification first returned FAIL no_unreceipted_change
  on the receipt-less files and PASS after the re-run; no harness or fixture content changed).
- EVIDENCE: evidence/D9/summary.txt - 25 obligation records: PASS 20, FAIL 3, GAP 1, plus T9-P6-03 negative fixture
  rejected as required; evidence/D9/mutants/summary.txt - 8/8 mutants caught (weak PASS, qualified FAIL for the named
  reason); toolchains stable 1.94.1 (e408947bf) and nightly 1.100.0 (6eeff9a52 2026-09-23); index.json.
- OBSERVED ASCII: design/materialization/D9-OBSERVED-PROOF-HARNESS.md.
- MATCH/DIFFER: MATCH on every prediction.  Preserved: [ERR] the workspace is not natively buildable as a whole
  (factc-wasm-abi omitted from default-members; --workspace build/clippy fail on x86_64), [GAP] no toolchain pin,
  [GAP] heuristic nostd-check/depcheck remain in factory/src with verdict weight none, [GAP] literal wildcard surfaces
  in factory/src/paths.rs, [UNK] vendored-code blindness of path rules, [UNK] dev-profile wasm reproducibility.
- HISTORY: "95/0" remains valid for 13 default-member packages; "full suite", "clippy --all-targets clean",
  "rejected by rustc (expected)", "nostd-check PASS", "depcheck PASS" were overstated; wasm64 compiler build evidence
  was valid for D3's 6-crate graph only and is re-proved in D9 for 12 crates.
- NO PRODUCTION COMPILER REPAIR: the [ERR] above is returned to ASCII for a D10 design against the qualified judge.

---

## D10-PROMPT-INTAKE  (computational environment mapping - prompt routed as the FIRST ACTION)

BEFORE
- DELTA: D10-PROMPT-INTAKE (factory/deltas/D10.json)
- BASE: e10d2799002682ee8c047de42050f7e9d5ddf5ad (D9 head on branch claude/d9-rust-cargo-proof-4nys6s, Factory-authored,
  descending from main f4395df).  [OBS] git state at intake: PR #1 merged to main; D9 lives on an unmerged branch; the
  prompt requires the D9 documents and evidence, which exist only there, so the designated development branch
  claude/facttest-materialization-27amc7 was fast-forwarded to e10d279 (no history discarded) and is the canonical
  branch for D10/D11.  If D9 is merged to main independently, this lineage still descends from it.
- STATION: S-DOC.  FIXTURE: F0-doc.
- READ: everything.  CHANGE: design/materialization/D10-COMPUTATIONAL-ENVIRONMENT-MAP-PROMPT.md (the exact prompt),
  this ledger, factory/deltas/D10.json, factory/fixtures/D10/, factory/receipts/D10-PROMPT-INTAKE/.
  FORBIDDEN: everything else, including every law/pass/design document, compiler/, host/, factory/src/, factory/registry/,
  tests/, fixtures/, evidence/D0..D9, receipts D0..D9, Cargo.toml, Cargo.lock, rust-toolchain.toml (stays absent).
- INVARIANTS: the prompt file is the prompt verbatim (no routing header, no edits); no production change; no pin; no
  capability implementation; D9 [RUN]/[ERR]/[GAP]/[UNK] untouched.
- TESTS: F0 checks the prompt file carries its title box, the FIRST ACTION path, the three vertical traces and the
  FINAL comparison; ledger names D10; authority/production surfaces byte-identical to the base.
- EXPECTED EVIDENCE: FactoryReceipt F0-doc, verification.json.  (No build/probe: intake only.)
- NEXT: the mapping pass itself is assembled in ASCII as design/materialization/D11-INTENDED-ENVIRONMENT-MAP.md and
  routed as D11-COMPUTATIONAL-ENVIRONMENT-MAP only after its own structural check.

AFTER
- RESULT: integrated as 4a151c9ae58f9968c70b9b85cef82a02fba12b85 (ff-only from e10d279); one refusal before the workpiece
  existed (the delta JSON carried an invalid backslash escape; regenerated with a serializer; no ref moved).
- RECEIPTS: factory/receipts/D10-PROMPT-INTAKE/F0-doc.json PASS.  VERIFICATION: PASS.  INTEGRATION: PASS.  PROBE: re-inspection MATCH.
- OBSERVED: the prompt file is tracked verbatim (392 lines, sha256 9a3d0f75...).  MATCH.

---

## D11-COMPUTATIONAL-ENVIRONMENT-MAP  (mapping pass)

BEFORE
- DELTA: D11-COMPUTATIONAL-ENVIRONMENT-MAP (factory/deltas/D11.json)
- BASE: 4a151c9ae58f9968c70b9b85cef82a02fba12b85
- STATION: S-FIXTURE, S-DOC, S-BUILD, S-BROWSER, S-DOC, S-BUILD, S-EVIDENCE (existing registry; no station forged)
- FIXTURE: F0-fixture, F1-doc, F2-build, F3-browser, F4-doc, F5-build, F6-evidence
- READ: everything, plus authority SOURCE files pinned by commit (published hosts denied by the network policy: recorded).
  CHANGE: design/environment-map/{graph.json, SCHEMA.md, ENVIRONMENT-MAP.md, AUTHORITY-REGISTER.md, TRACEABILITY.md},
  design/materialization/D11-INTENDED-ENVIRONMENT-MAP.md, D11-OBSERVED-ENVIRONMENT-MAP.md, this ledger, tests/envmap/,
  factory/deltas/D11.json, factory/fixtures/D11/, receipts, evidence/D11/.  FORBIDDEN: every law/pass/design document,
  compiler/, host/, factory/src/, factory/registry/, fixtures/, tests/{bootstrap,commissioning,language,toolchain}/,
  Cargo.toml, Cargo.lock, rust-toolchain.toml (stays absent), D0-D10 deltas/fixtures/receipts/evidence, M0, M9,
  COMMISSIONING-RECORD.md, D9 documents, the D10 prompt file.
- INVARIANTS: I1-I11 of the delta (production untouched; no third-party dependency; authority != implementation;
  current authority != pin; presence != admission; synthetic != physical; recorded != pinned toolchain; evidence
  without environment fails validation; every D9 finding is a node; generic machinery; probes only observe).
- TESTS: validate / render-check / query Q01..Q15 / stale / paths-probe; authority-fetch; host-identity;
  browser-probe (GPU flags | default); bind-evidence then final validate/render-check; syntax checks.
- EXPECTED EVIDENCE: evidence/D11/{validate,render-check,stale,paths-probe}.json, queries/Q01..Q15.json,
  authority/fetch-records.json, host/identity.json, browser/{gpu-flags,default}.json, final/*, index.json.
- PREDICTED (design/materialization/D11-INTENDED-ENVIRONMENT-MAP.md section 2): validate PASS; render-check PASS;
  published hosts DENIED; 40 external pins PIN_MATCH; host nightly 6bb1652a0 without clippy; browser product
  HeadlessChrome/141.0.7390.37 with SwiftShader fallback adapter under the flag set and null adapter by default;
  Q09/Q11/Q12/Q13 non-empty as listed; Q10 and Q14 empty; Q15 = ERR-001 plus the SwiftShader documentation gap.

AFTER
- RESULT: integrated as fdb9c32d1346408f184ccf0cc4880112282f164e (ff-only from 4a151c9).  F4-doc closed FAIL once (the
  observed document did not name Q01-Q05 individually); the workpiece was rolled back to the F4 open tree, the document
  corrected on the ASCII surface, and F4-F6 re-run; identical re-generated evidence needed one more F5/F6 pass so that it
  carried a PASS receipt.  No ref moved before verification.
- RECEIPTS: factory/receipts/D11-COMPUTATIONAL-ENVIRONMENT-MAP/{F0-fixture,F1-doc,F2-build,F3-browser,F4-doc,F5-build,
  F6-evidence}.json PASS.  VERIFICATION: PASS.  INTEGRATION: PASS.  PROBE: re-inspection MATCH (validate + render-check).
- EVIDENCE: evidence/D11/ (46 files indexed); graph 211 nodes / 475 edges, 0 PENDING evidence after binding.
- OBSERVED ASCII: design/materialization/D11-OBSERVED-ENVIRONMENT-MAP.md.  MATCH except Q09 (narrower), kept as [GAP].
- LATER: PR #2 merged D9-D11 into main as f71c59b (owner action on GitHub, outside Factory law).

---

## D12-SELF-HOSTING-ARCHITECTURE  (architecture pass: ASCII assembly + observation probes; no production change)

BEFORE
- DELTA: D12-SELF-HOSTING-ARCHITECTURE (factory/deltas/D12.json)
- BASE: f71c59b5ec6e0095294549c660884ddbd1a26dd7 (main after PR #2; branch fast-forwarded, merged history only)
- STATION: S-DOC, S-FIXTURE, S-BUILD, S-BROWSER, S-DOC, S-EVIDENCE (existing registry; no station forged)
- FIXTURE: F0-doc, F1-fixture, F2-build, F3-browser, F4-doc, F5-evidence
- READ: everything; authority sources pinned by commit (published hosts denied; raw.githack.com denied).
  CHANGE: design/materialization/{D12-SELF-HOSTING-PROMPT.md, D12-INTENDED-SELF-HOSTING.md,
  D12-OBSERVED-SELF-HOSTING.md, LEDGER.md}, tests/selfhost/, evidence/D12/, factory/deltas/D12.json,
  factory/fixtures/D12/, receipts.  FORBIDDEN: compiler/, host/, factory/src/, factory/registry/, all law and pass
  documents, design/environment-map/ (graph additions are proposed in ASCII only), fixtures/, other tests/, Cargo.toml,
  Cargo.lock, rust-toolchain.toml (stays absent), D0-D11 deltas/fixtures/receipts/evidence.
- INVARIANTS: no production repair; no implementation of self-hosting; no toolchain pin; every D9/D11 status preserved;
  probes observe only (a denied host, a false persist(), an unreachable ABI are evidence).
- TESTS: intended ASCII carries the 13 required outputs and STRUCTURAL CHECK: PASS; probe harness syntax; kernel module
  rebuilt with the host nightly and inspected; P01-P16 re-run under S-BROWSER; network observations; observed ASCII
  compares the Factory run with the assembly-time run.
- EXPECTED EVIDENCE: evidence/D12/{kernel/*, network/observations.txt, probes/*.json, browser-identity.json,
  summary.json, index.json}; 6 FactoryReceipts; verification.json.
- PREDICTED: P01-P06, P08, P09, P14, P15, P16 RUN; P07 GAP; P10 OBS (6 ABI exports absent; BUILD emits 3 artifacts);
  githack DENIED; kernel sha256 a1bb6f86... with nightly 6bb1652a0 (differs from D9's 30958994...).

AFTER
- RESULT: integrated as 52d7d1425028dac6ef9f77b4a4cb178b96217864 (ff-only from f71c59b); no refusal.
- RECEIPTS: factory/receipts/D12-SELF-HOSTING-ARCHITECTURE/{F0-doc,F1-fixture,F2-build,F3-browser,F4-doc,F5-evidence}.json
  PASS.  VERIFICATION: PASS.  INTEGRATION: PASS.  PROBE: re-inspection MATCH.
- EVIDENCE: evidence/D12/ (22 files): P01-P06, P08, P09, P14, P15, P16 RUN; P07 GAP; P10 OBS; kernel sha256 a1bb6f86...
  (nightly 6bb1652a0); githack DENIED.
- OBSERVED ASCII: design/materialization/D12-OBSERVED-SELF-HOSTING.md.  MATCH on every prediction.
- LATER: PR #3 merged D12 into main as 8e5dd6f (owner action on GitHub).  The owner then paused the predicted
  D13-SEED-BROKER-QUALIFICATION and ordered a repository-hygiene pass first (D13-REPO-HYGIENE-PROMPT.md).

---

## D13-PROMPT-INTAKE  (FIRST ACTION of the repository-hygiene pass)

BEFORE
- DELTA: D13-PROMPT-INTAKE (factory/deltas/D13-PROMPT-INTAKE.json)
- BASE: 8e5dd6fe0d35669867dc7894434e68b13abeb158 (main after PR #3; branch fast-forwarded, merged history only)
- STATION: S-DOC.  FIXTURE: F0-doc.
- CHANGE: design/materialization/D13-REPO-HYGIENE-PROMPT.md (verbatim), this ledger, the delta, its fixture, receipts.
  FORBIDDEN: everything else.
- NEXT: the hygiene pass itself is D13-REPO-HYGIENE, assembled in design/materialization/D13-INTENDED-REPO-HYGIENE.md.

AFTER
- RESULT: integrated as 205d337a7efef5fa25bb588ec385fa3655acb562 (ff-only from 8e5dd6f); no refusal.
- RECEIPTS: factory/receipts/D13-PROMPT-INTAKE/F0-doc.json PASS.  VERIFICATION: PASS.  INTEGRATION: PASS.
  PROBE: re-inspection MATCH.  Pushed to claude/facttest-materialization-27amc7.
- (recorded by D13-REPO-HYGIENE, the next delta.)

---

## D13-REPO-HYGIENE  (repository hygiene / chain closure before the D14 reference rescan)

BEFORE
- DELTA: D13-REPO-HYGIENE (factory/deltas/D13.json), workpiece W14.
- BASE: 205d337a7efef5fa25bb588ec385fa3655acb562 (D13-PROMPT-INTAKE; origin/main 8e5dd6f is its parent).
- ASCII: design/materialization/D13-INTENDED-REPO-HYGIENE.md (inventory H-01..H-45 classified A/B/C/D, decisions 3.1
  S-ANNOTATE and 3.2 toolchain pin, STRUCTURAL CHECK: PASS).
- STATIONS: S-DOC (F0, F3, F7, F9), S-RUST (F1), S-FIXTURE (F2), S-ANNOTATE (F4, new, bootstrap), S-BUILD (F5),
  S-EVIDENCE (F6, F8).
- CHANGE: factory/src/ + factory/tests/ (literal surfaces, receipt format 2, workpiece audit/retire, heuristic weight),
  rust-toolchain.toml (1.94.1), tests/toolchain/{proof.mjs, proof-sets.json, run-qualified-proof.sh}, tests/hygiene/,
  tests/envmap/envmap.mjs, registry S-FIXTURE v2 + S-ANNOTATE, README.md, docs/HANDOFF.md, design/environment-map/
  (epochs D12 + D13, merged graph, derived views), insertion-only annotations of 10 root documents, evidence/D13/,
  this ledger, D13 records.  FORBIDDEN: FACTORY-LAW.md, compiler/, host/, fixtures/, Cargo.toml, Cargo.lock, every
  D0-D12 / D13-PROMPT-INTAKE artifact, the D9 proof scripts, the closed design records.
- INVARIANTS: historical evidence byte-identical; no authority widening except S-ANNOTATE (literal, insertion-only);
  S-FIXTURE effective authority unchanged; no capability implemented; every B/C/D boundary kept visible; cleanup only
  under the retire guard.
- PREDICTED: factory 17/17 tests; qualified proof: pins PASS, sets PASS, HOST/WASM64/ALL PASS, CROSS_SET OBS, HEURISTIC
  weight NONE, kernel 6f25ce43... == declared, mutants 8/8 RUN; status scan 0 unclassified; handoff PASS; audit 13
  worktrees + 12 stages RETIRABLE, W11-stage and factory-bootstrap-bin KEEP; graph 302 nodes / 641 edges, D11 part
  unchanged.

AFTER
- RESULT: integrated as 8265623ed785fbc4cd2328cbf0bb27d8984906ca (ff-only from 205d337); no refusal at the gate.  One
  fixture (F5-build) was refused at station open before any command ran (receipts directory outside S-BUILD's
  surface) and corrected; recorded in D13-OBSERVED-REPO-HYGIENE.md section 1.
- RECEIPTS: factory/receipts/D13-REPO-HYGIENE/{F0-doc..F9-doc}.json (10) PASS.  VERIFICATION: PASS.  INTEGRATION: PASS.
  PROBE: re-inspection MATCH (status scan, handoff check, graph validate/merge-check, registry check re-run on the
  canonical tree).
- EVIDENCE: evidence/D13/ (qualified proof 21/21 weight-bearing PASS on pinned toolchains, mutants 8/8 RUN; status
  inventory 0 unclassified; 25 proven-disposable workpiece objects retired; graph 302 nodes / 641 edges).
- LATER: PR #4 merged D13 into main as 4d8a4c0 (owner action on GitHub, merge commit); the branch was fast-forwarded to
  4d8a4c0.  The owner then issued the six-pass technical reference review series D14-D19.
- (recorded by D14-D19-PROMPT-INTAKE, the next delta.)

---

## D14-D19-PROMPT-INTAKE  (FIRST ACTION of the six-pass technical reference review series)

BEFORE
- DELTA: D14-D19-PROMPT-INTAKE (factory/deltas/D14-D19-PROMPT-INTAKE.json), workpiece W15.
- BASE: 4d8a4c0e2568ecda75981aeaef0dc797fb23d928 (main after PR #4; branch fast-forwarded, merged history only).
- STATION: S-DOC.  FIXTURE: F0-doc.  JUDGE: the factory binary built from 4d8a4c0, i.e. the first delta judged by the
  D13-repaired Factory (literal surfaces, receipt format 2, verifier identity).
- CHANGE: design/materialization/D14-D19-TECHNICAL-REFERENCE-REVIEW-PROMPT.md (verbatim), this ledger, the delta, its
  fixture, receipts.  FORBIDDEN: everything else.
- NEXT: D14-FRONTIER-REOPEN, assembled in design/materialization/D14-INTENDED-FRONTIER-REOPEN.md.

AFTER
- RESULT: integrated as 5e57467bd7c984529dc466201629b37e0ee44c4b (ff-only from 4d8a4c0); no refusal.
- RECEIPTS: factory/receipts/D14-D19-PROMPT-INTAKE/F0-doc.json PASS - the first receipt_format 2 receipt
  (environment_identity: judge sha256 bb1475ba..., host linux x86_64 6.18.44, git 2.43.0, rustc 1.94.1 probe).
  VERIFICATION: PASS (verifier_identity recorded).  INTEGRATION: PASS.  PROBE: re-inspection MATCH.  Pushed.
- (recorded by D14-FRONTIER-REOPEN, the next delta.)

---

## D14-FRONTIER-REOPEN  (pass 1 of 6: what moved in the authority frontier?)

BEFORE
- DELTA: D14-FRONTIER-REOPEN (factory/deltas/D14.json), workpiece W16, base 5e57467.
- ASCII: design/materialization/D14-INTENDED-FRONTIER-REOPEN.md (STRUCTURAL CHECK: PASS).
- STATIONS: S-DOC (F0, F3, F5), S-FIXTURE (F1), S-BUILD (F2 reopen probe), S-EVIDENCE (F4).
- CHANGE: tests/reference/ (reopen probe, revision builder, D14 review), tests/envmap/envmap.mjs (epoch-declared
  classes, Q17, revision rendering), evidence/D14/, design/environment-map/ (epoch D14, merged graph, views,
  SCHEMA/ENVIRONMENT-MAP epoch sections), docs/HANDOFF.md, D14 records, this ledger.  FORBIDDEN: every law and pass
  document (reconciliation is D18), compiler/, host/, factory/ machinery, fixtures/, earlier epochs and evidence.
- NETWORK: published authority hosts refused by the environment policy (reported to the owner); source frontier
  reopened through raw.githubusercontent.com and git ls-remote.
- PREDICTED: 64 revisions; UNREACHABLE 55, MOVED 4, AMBIGUOUS 2, MATURITY 2, EDITORIAL 2; new fragment drift
  AUTH-WASM-WEBAPI-STREAMING; rust-lang/rust master -> main; Threads Phase 4, SET Phase 1, Memory64 finished;
  graph 441 nodes / 795 edges.

AFTER
- RESULT: integrated as 46cc28be1486798635eac42a6955dedaba36673f (ff-only from 5e57467).
- ROUTE: F3 refused once at station open (narrowed surface wider than the delta's exact file list); nothing ran;
  narrowed and resumed.  The first `factory verify` FAILED no_unreceipted_change (SCHEMA.md, ENVIRONMENT-MAP.md
  copied outside a station run after a masked refused open); integration refused.  Repaired inside the Factory: both
  files restored to base bytes, fixture F6-doc added, F6 and F5 run, verify re-run.
- RECEIPTS: F0-doc F1-fixture F2-build F3-doc F4-evidence F5-doc F6-doc PASS (format 2).  VERIFICATION: PASS (second
  run).  INTEGRATION: PASS.  PROBE: re-inspection MATCH (tree 251f06e0).  Pushed.
- OBSERVED: D14-OBSERVED-FRONTIER-REOPEN.md - P1-P3 MATCH; P4 DIFFER (W14-stage KEEP: pre-binding drafts); route
  DIFFER recorded.  Prospective rule adopted: a route checks every station open's exit status before copying.
- (recorded by D15-FOUNDATIONAL-SEMANTICS, the next delta.)

---

## D15-FOUNDATIONAL-SEMANTICS  (pass 2 of 6: what do the foundational authorities currently require?)

BEFORE
- DELTA: D15-FOUNDATIONAL-SEMANTICS (factory/deltas/D15.json), workpiece W17, base 46cc28b.
- ASCII: design/materialization/D15-INTENDED-FOUNDATIONAL-SEMANTICS.md (STRUCTURAL CHECK: PASS).
- STATIONS: S-DOC (F0, F3, F5), S-FIXTURE (F1), S-BUILD (F2 clause extraction), S-EVIDENCE (F4).
- CHANGE: tests/reference/ (shared lib, reopen refactor, clause extractor, clause epoch builder, reopen regression
  witness, D15 clause manifest), tests/envmap/envmap.mjs (clause checks, Q18 claim traversal), evidence/D15/,
  design/environment-map/ (epoch D15, merged graph, views, SCHEMA section 8, ENVIRONMENT-MAP section 7),
  docs/HANDOFF.md, D15 records, this ledger.  FORBIDDEN: every law and pass document (constraints stay PROPOSED until
  D18), compiler/, host/, factory/ machinery, fixtures/, earlier epochs and D0-D14 evidence.
- NETWORK: unchanged since D14 (published renderings refused by policy; sources read at their tips).
- PREDICTED: 60/60 clauses VERIFIED over 11 traces; epoch 145 nodes / 305 edges; merged 586 / 1100; validate 30
  checks; Q18 42 RUN claims, 10 COMPLETE; reopen regression 64 records with only moved tips and one corrected coarse
  candidate differing.  Findings: ERR-001 current; BigInt membrane, secure-context vs opaque-origin, Permissions Policy
  in opaque frames, SW update bypass, storage durability grounded as proposed constraints; SAB global absence relabeled
  host behaviour; git tree order [GAP].

AFTER
- RESULT: integrated as 3748fa7bd15d74e560951f31338b8c94820c2830 (ff-only from 46cc28b); no refusal, no repair.
- RECEIPTS: F0-doc F1-fixture F2-build F3-doc F4-evidence F5-doc PASS (format 2).  VERIFICATION: PASS (first run).
  INTEGRATION: PASS.  PROBE: re-inspection MATCH (tree de523355; epochs/D15.json rebuilt byte-identically from the
  committed evidence).  Pushed.
- OBSERVED: D15-OBSERVED-FOUNDATIONAL-SEMANTICS.md - P1-P5 MATCH; one editorial drawing error recorded (intended
  section 0 counted 29 source documents; the Factory read 31 in 21 repositories).
- (recorded by D16-CAPABILITY-UNIVERSE, the next delta.)

---

## D16-CAPABILITY-UNIVERSE  (pass 3 of 6: what does each approved capability require?)

BEFORE
- DELTA: D16-CAPABILITY-UNIVERSE (factory/deltas/D16.json), workpiece W18, base 3748fa7.
- ASCII: design/materialization/D16-INTENDED-CAPABILITY-UNIVERSE.md (STRUCTURAL CHECK: PASS).
- STATIONS: S-DOC (F0, F4, F6), S-FIXTURE (F1), S-BUILD (F2 clause extraction), S-BROWSER (F3 exposure census),
  S-EVIDENCE (F5).
- CHANGE: tests/reference/ (absent_in_document, --harness-in, D16 clause manifest), tests/capability/ (census, universe
  manifest, epoch builder, gate), tests/envmap/envmap.mjs (family checks, Q19, universe view), evidence/D16/,
  design/environment-map/ (epoch D16, merged graph, views, SCHEMA section 9, ENVIRONMENT-MAP section 8),
  docs/HANDOFF.md, D16 records, this ledger.  FORBIDDEN: every law and pass document (CAPABILITY-MATRIX.md is read as G,
  never written), compiler/, host/, factory/ machinery, fixtures/, earlier epochs and D0-D15 evidence.
- PREDICTED: 90/90 clauses VERIFIED; census 32 records (25 EXPOSED, 6 ABSENT, 1 UNDETERMINED); epoch 305 nodes / 745
  edges; merged 891 / 1845; gate PASS with 33 rows = 33 families, RUN 6 / OBS 16 / GAP 10 / ERR 1 / UNK 0; Q18 14
  COMPLETE of 43 RUN claims; Q19 33 families.

AFTER
- RESULT: integrated as e4e210304591d99f73873dc719b79f187c4d19a1 (ff-only from 3748fa7); no refusal, no repair.
- RECEIPTS: F0-doc F1-fixture F2-build F3-browser F4-doc F5-evidence F6-doc PASS (format 2).  VERIFICATION: PASS (first
  run).  INTEGRATION: PASS.  PROBE: re-inspection MATCH (tree 7fbdd25e; epochs/D16.json rebuilt byte-identically from the
  committed clause and census evidence; capability gate re-run PASS).  Pushed.
- OBSERVED: D16-OBSERVED-CAPABILITY-UNIVERSE.md - P1-P7 MATCH; census states identical to assembly.
- (recorded by D17-IMPLEMENTATION-REALITY, the next delta.)

---

## D17-IMPLEMENTATION-REALITY  (pass 4 of 6: what do our implementations actually do?)

BEFORE
- DELTA: D17-IMPLEMENTATION-REALITY (factory/deltas/D17.json), workpiece W19, base e4e2103.
- ASCII: design/materialization/D17-INTENDED-IMPLEMENTATION-REALITY.md (STRUCTURAL CHECK: PASS).
- STATIONS: S-DOC (F0, F4, F6), S-FIXTURE (F1), S-BUILD (F2 clause extraction, F3 kernel builds + label audit),
  S-EVIDENCE (F5).
- CHANGE: tests/reference/ (pinned-commit and installed-file sources, D17 clause manifest), tests/implementation/
  (behaviour manifest, label audit, kernel builds, section comparison, epoch builder, gate), tests/envmap/envmap.mjs
  (behaviour checks, Q20, Q18 implementation clauses), evidence/D17/, design/environment-map/ (epoch D17, merged graph,
  views, SCHEMA section 10, ENVIRONMENT-MAP section 9), docs/HANDOFF.md, D17 records, this ledger.  FORBIDDEN: every law
  and pass document and README.md (the MISLABEL corrections are D18's), compiler/, host/, factory/ machinery, fixtures/,
  earlier epochs and D0-D16 evidence.
- PREDICTED: 44/44 implementation clauses VERIFIED at the versions run; kernel builds differ only in the custom name
  section; label audit 12 findings / 6 MISLABEL; epoch 151 nodes / 261 edges; merged 1042 / 2106; gate PASS (6/6 census
  absences explained); Q18 14 COMPLETE of 45 RUN claims; Q20 19 behaviours.

AFTER
- RESULT: integrated as 715ac92d327f5f2677fd7c0b067fa843da6323c4 (ff-only from e4e2103) after two repairs.
- RECEIPTS: F0-doc F1-fixture F2-build F3-build F4-doc F5-evidence F7-fixture F8-build F9-doc PASS (format 2); F3's first
  close FAILED (label-audit.mjs wrote into a missing directory; tool fixed, F1 and F3 re-run); the first verify FAILED
  no_unreceipted_change on 14 paths (re-run receipts cover only their last run) and was repaired with new fixtures
  F7/F8/F9 after restoring the paths to base; F7's first run FAILED on a copied regression command (restored, corrected).
  VERIFICATION: PASS.  INTEGRATION: PASS.  PROBE: re-inspection MATCH (tree b6590cd7; epochs/D17.json rebuilt
  byte-identically from the committed clause, kernel and label evidence; implementation gate re-run PASS).  Pushed.
- OBSERVED: D17-OBSERVED-IMPLEMENTATION-REALITY.md - P1-P7 MATCH; drawing counted 29 source documents for 28 [ERR,
  editorial]; ROUTE DIFFER (repairs).  Procedure rule: repair with a new fixture, never re-run one (docs/HANDOFF.md).
- (recorded by D18-REPO-RECONCILIATION, the next delta.)

---

## D18-REPO-RECONCILIATION  (pass 5 of 6: given D14-D17, what must change inside the current FactTest model?)

BEFORE
- DELTA: D18-REPO-RECONCILIATION (factory/deltas/D18.json), workpiece W20, base 715ac92.
- ASCII: design/materialization/D18-INTENDED-REPO-RECONCILIATION.md (STRUCTURAL CHECK: PASS).
- STATIONS: S-DOC (F0, F5, F6, F8), S-FIXTURE (F1), S-BUILD (F2 clauses + kernel identity + stage audit), S-ANNOTATE
  (F3), S-ANNOTATE-OWNER (F4; bootstrap registry material of this delta), S-EVIDENCE (F7).
- CHANGE: tests/reconcile/ (register, surfaces, epoch builder, surface check, gate, stage audit), tests/envmap/envmap.mjs
  (current model, reconciliation checks, Q21), tests/toolchain/{proof.mjs, proof-sets.json} (exec identity),
  tests/reference/d18-clauses.json, insertion-only D18 annotations in REFERENCE-AUTHORITY, CONSTRAINT-LEDGER (incl. the
  19 ledgered constraints), CONFLICT-LEDGER, EVIDENCE-OBLIGATIONS, IMPLEMENTATION-CONTRACTS, STATION-REGISTRY,
  CAPABILITY-MATRIX, BOOTSTRAP-TESTS; README.md (correction line), docs/HANDOFF.md; evidence/D18/; design/environment-map/
  (epoch D18, merged graph, views, SCHEMA section 11, ENVIRONMENT-MAP section 10); D18 records, this ledger.
  FORBIDDEN: FACTORY-LAW.md, compiler/, host/, factory/src, fixtures/, earlier epochs and D0-D17 evidence, every other
  law and pass document.
- PREDICTED: 2/2 clauses VERIFIED; exec identity PASS on both D17 builds; 36 reconciliations, 15 supersessions (61
  inherited edges), 19 constraints ledgered; epoch 56 nodes / 288 edges; merged 1098 / 2394; validate 42 PASS; surfaces
  35 PASS; gate PASS; Q18 20 COMPLETE of 47 current RUN claims; Q21 109 current facts.

AFTER
- RESULT: integrated as 1b81dc0fadffe7a1f3e9ffd6f5d1594a4b3f2e4c (ff-only from 715ac92); no refusal, no repair.
- RECEIPTS: F0-doc F1-fixture F2-build F3-annotate F4-annotate-owner F5-doc F6-doc F7-evidence F8-doc PASS (format 2).
  VERIFICATION: PASS (first run).  INTEGRATION: PASS.  PROBE: re-inspection MATCH (epochs/D18.json rebuilt
  byte-identically from the committed clause and kernel evidence; surfaces and reconciliation gate re-run PASS).  Pushed.
- OBSERVED: D18-OBSERVED-REPO-RECONCILIATION.md - P1-P7 MATCH.
- DEFECT FOUND AFTER INTEGRATION [ERR]: FACT-WORKERS-D18 said hardwareConcurrency was never read, but D11's browser probe
  and the D16 census recorded 4; R-45 cited the D12 executable field (chromium.executablePath(), not the launched
  binary) as launch identity.  The MATCH verdicts compared against predictions that carried the error.  Repaired by
  D18R-CHAIN-REPAIR before D19 (the D18 records stay as written).

---

## D18R-CHAIN-REPAIR  (repair of pass 5 before pass 6: remove what contradicts committed evidence)

BEFORE
- DELTA: D18R-CHAIN-REPAIR (factory/deltas/D18R.json), workpiece W21, base 1b81dc0.
- ASCII: design/materialization/D18R-INTENDED-CHAIN-REPAIR.md (STRUCTURAL CHECK: PASS).
- STATIONS: S-DOC (F0, F2, F3, F5), S-FIXTURE (F1), S-EVIDENCE (F4).
- CHANGE: tests/reconcile/ (repair register and surfaces; builder follows supersession chains and takes optional parts;
  gate takes retired texts), tests/envmap/envmap.mjs (Q21 revised_by), docs/HANDOFF.md, evidence/D18R/,
  design/environment-map/ (epoch D18R, merged graph, views, SCHEMA section 12, ENVIRONMENT-MAP section 11), D18R
  records, this ledger.  FORBIDDEN: law and pass documents, README.md, compiler/, host/, factory/, fixtures/, D0-D18
  evidence and epochs.
- PREDICTED: D18 regression identical; epoch 3 nodes / 20 edges; merged 1101 / 2414; validate 42 PASS; D18R and D18
  gates PASS; Q21 38 rows with R-32 revised_by R-52.

AFTER
- RESULT: integrated as b509fb00920443930aa75b10dae05b9683d2fe1b (ff-only from 1b81dc0); no refusal, no repair.
- RECEIPTS: F0-doc F1-fixture F2-doc F3-doc F4-evidence F5-doc PASS (format 2).  VERIFICATION: PASS (first run).
  INTEGRATION: PASS.  PROBE: re-inspection MATCH (epochs/D18R.json rebuilt byte-identically; repair gate re-run PASS).
  Pushed.
- OBSERVED: D18R-OBSERVED-CHAIN-REPAIR.md - P1-P5 MATCH; the D18 defect removed from every current node and the live
  handoff; the absence-claim rule added to docs/HANDOFF.md section 4.
- (recorded by D19-REPROVE-REOBSERVE, the next delta.)

---

## D19-REPROVE-REOBSERVE  (pass 6 of 6: does the updated model survive execution?)

BEFORE
- DELTA: D19-REPROVE-REOBSERVE (factory/deltas/D19.json), workpiece W22, base b509fb0.
- ASCII: design/materialization/D19-INTENDED-REPROVE-REOBSERVE.md (STRUCTURAL CHECK: PASS).
- STATIONS: S-DOC (F0, F8, F10), S-FIXTURE (F1), S-BROWSER (F2 identity capture, F4 browser group), S-EVIDENCE (F3
  selection, F7 repository group, F9 evidence), S-BUILD (F5 qualified proof + kernel sections, F6 source re-verification).
- CHANGE: tests/reprove/ (identity capture, graph-driven selection, runbook, runner, lineage, epoch builder, gate),
  tests/envmap/{envmap.mjs (Q21 fulfilled_by, Q22), browser-probe.mjs (executable launched)}, tests/hygiene/
  status-scan.mjs (earlier inventories excluded), evidence/D19/,
  design/environment-map/ (epoch D19, merged graph, views, SCHEMA section 13, ENVIRONMENT-MAP section 12), README.md,
  docs/HANDOFF.md, D19 records incl. the stable baseline, this ledger.  FORBIDDEN: law and pass documents, compiler/,
  host/, factory/, fixtures/, earlier epochs and D0-D18R evidence.
- PREDICTED: selection 29 of 90 current RUN/OBS facts (gaps 0); every group PASS; epoch about 40 nodes / 160 edges;
  merged about 1141 / 2574; validate 42 PASS; gate PASS; R-03, R-04, R-49, R-53 fulfilled; Q22 50 RUN claims (49
  claimable, 1 invalidated by design), 29 re-proved in D19; the status inventory no longer re-scans earlier ones.

AFTER
- RESULT: integrated as 780aee1b50c4a799a62b760823a3d1460d386d0f (ff-only from b509fb0).  One route repair: while F6 ran,
  Q22 was found to show two closed [GAP] statements as open stops; the route was paused after F6 and the NEW fixture
  F11-fixture fixed the query before the graph was built (D19-OBSERVED section 1).  No fixture re-run.
- RECEIPTS: F0-F11 (12) PASS (format 2).  VERIFICATION: PASS (first run).  INTEGRATION: PASS.  PROBE: re-inspection
  MATCH (epochs/D19.json rebuilt byte-identically; re-proof gate re-run PASS).  Pushed.
- OBSERVED: D19-OBSERVED-REPROVE-REOBSERVE.md - P1-P7 MATCH (P6 with the repaired presentation); GATE: PASS;
  D19-STABLE-BASELINE.md: STABLE-BASELINE: ESTABLISHED.
- LATER: the owner asked for pull request #6 (this branch into main).  Main had merged pull request #5, a parallel line
  on the same base 4d8a4c0 that also calls its pass D14: 33 conflicts.  The owner chose to merge main into this branch
  and join the line by a Factory delta (D20-MAIN-SYNC); the content-neutral sync merge c3159d5 made it an ancestor.
- (recorded by D20-MAIN-SYNC, the next delta.)

---

## MAIN LINE: D14-PROMPT-INTAKE, D14-TECHNICAL-REFERENCE-RESCAN  (pull request #5; imported by D20-MAIN-SYNC)

The lines below, from its D13 AFTER entry through its D14-TECHNICAL-REFERENCE-RESCAN BEFORE entry, are the other
line's ledger additions (4d8a4c0..1205fda), embedded verbatim (tests/sync/d20-line.json, treatment "embed").  Its records
named factory/deltas/D14.json, factory/fixtures/D14/ and evidence/D14/{envmap,workpieces,index.*}; in this tree they are
at the D14-RESCAN paths.

AFTER
- RESULT: integrated as 8265623ed785fbc4cd2328cbf0bb27d8984906ca (ff-only from 205d337); merged into main by the owner
  through pull request #4 as 4d8a4c0e2568ecda75981aeaef0dc797fb23d928 (PR closed, history fast-forwarded).
- RECEIPTS: factory/receipts/D13-REPO-HYGIENE/{F0-doc,F1-rust,F2-fixture,F3-doc,F4-annotate,F5-build,F6-evidence,
  F7-doc,F8-evidence,F9-doc}.json PASS.  VERIFICATION: PASS.  INTEGRATION: PASS.  PROBE: re-inspection MATCH.
- OBSERVED: design/materialization/D13-OBSERVED-REPO-HYGIENE.md; PRE-RESCAN-BASELINE: ESTABLISHED.
- (recorded by D14-PROMPT-INTAKE, the next delta.)

---

## D14-PROMPT-INTAKE  (FIRST ACTION of the technical reference rescan)

BEFORE
- DELTA: D14-PROMPT-INTAKE (factory/deltas/D14-PROMPT-INTAKE.json), workpiece W15.
- BASE: 4d8a4c0e2568ecda75981aeaef0dc797fb23d928 (main after PR #4; development branch
  claude/d9-rust-cargo-proof-4nys6s restarted on it: it carried only merged history).
- STATION: S-DOC.  FIXTURE: F0-doc.
- CHANGE: design/materialization/D14-REFERENCE-RESCAN-PROMPT.md (verbatim owner prompt + the reading adopted for
  assembly), this ledger (D13 AFTER, this entry), the delta, its fixture, receipts.  FORBIDDEN: everything else.
- NEXT: the rescan itself is D14-TECHNICAL-REFERENCE-RESCAN, assembled in
  design/materialization/D14-INTENDED-REFERENCE-RESCAN.md from design/materialization/D13-PRE-RESCAN-BASELINE.md.

AFTER
- RESULT: integrated as 6778133c35a96d5e356df283aa1676ee428766bb (ff-only from 4d8a4c0); pushed to
  claude/d9-rust-cargo-proof-4nys6s.  RECEIPTS: factory/receipts/D14-PROMPT-INTAKE/F0-doc.json PASS (format 2).
  VERIFICATION: PASS.  INTEGRATION: PASS.  PROBE: re-inspection MATCH.
- (recorded by D14-TECHNICAL-REFERENCE-RESCAN, the next delta.)

---

## D14-TECHNICAL-REFERENCE-RESCAN  (retrieval route + reference ingress)

BEFORE
- DELTA: D14-TECHNICAL-REFERENCE-RESCAN (factory/deltas/D14.json), workpiece W16.
- BASE: 6778133c35a96d5e356df283aa1676ee428766bb (D14-PROMPT-INTAKE).
- ASCII: design/materialization/D14-INTENDED-REFERENCE-RESCAN.md (observation incl. the egress probe and the
  Pages-branch route, obligations T14-R1..R8, mutation plan by station, classification, predictions from a scratch dry
  run, STRUCTURAL CHECK: PASS).
- STATIONS: S-DOC (F0, F4), S-FIXTURE v2 (F1), S-BUILD (F2), S-ANNOTATE (F3), S-EVIDENCE (F5).  No new station.
- CHANGE: tests/reference/{ingress.mjs, run-ingress-checks.sh}; fixtures/reference/{README.md, ROUTES.json,
  REGISTER.json, published/, sources/} (83 reproducibility copies fetched in the stage at recorded branch heads);
  evidence/D14/; insertion-only D14 ANNOTATION lines in REFERENCE-AUTHORITY.md, CONSTRAINT-LEDGER.md,
  CONFLICT-LEDGER.md, IMPLEMENTATION-CONTRACTS.md, EVIDENCE-OBLIGATIONS.md; design/environment-map/{epochs/D14.json,
  graph.json, AUTHORITY-REGISTER.md, TRACEABILITY.md}; docs/HANDOFF.md sections 1 and 6; D14 records; this ledger.
  FORBIDDEN: FACTORY-LAW.md and every other law/pass document, compiler/, host/, factory/src|tests|registry,
  Cargo.*, rust-toolchain.toml, every D0-D13 and D14-PROMPT-INTAKE artifact, prior fixtures and tests, the D12/D13
  epochs, SCHEMA.md.
- INVARIANTS: copies are pins, never current authority; no denied host tunnelled (raw.githubusercontent.com and the
  git proxy only); law text insertion-only; D11-D13 graph nodes unchanged; no dependency; no toolchain change.
- PREDICTED: 23 published hosts DENIED, route available; 83 files (39 renderings, 44 sources) ingested; verify PASS;
  refetch PASS; 63 pins re-checked (56 match, 7 project-law); links 36 verified / 5 present / 3 derived /
  45 no-fragment / 9 absent [ERR] / 1 no-route; authorities 17 / 5 / 3 / 29 / 2 absent [ERR] / 8 not network;
  annotations 9+1+1+4+6 lines, 0 deletions; epoch 72 nodes / 315 edges; graph 374 / 956; validate, merge-check,
  render-check, handoff-check, status-scan PASS.


AFTER  (recorded by D20-MAIN-SYNC from the git history)
- RESULT: integrated as 8d5ea6f95e90961959cd9f8df4d9db22eb37aa85 (ff-only from 6778133) on
  claude/d9-rust-cargo-proof-4nys6s; merged into main by the owner through pull request #5 as
  1205fda00deff8c66cd7e3bb8eb529c87d6a472c.  RECEIPTS: factory/receipts/D14-TECHNICAL-REFERENCE-RESCAN/ (imported
  unchanged).  OBSERVED: design/materialization/D14-OBSERVED-REFERENCE-RESCAN.md.
- JOINED: made an ancestor of claude/facttest-materialization-27amc7 by the sync merge c3159d5; content imported and
  reconciled by D20-MAIN-SYNC (R-54..R-63).

---

## D20-MAIN-SYNC  (joins the parallel D14 line of main after the D14-D19 series)

BEFORE
- DELTA: D20-MAIN-SYNC (factory/deltas/D20.json), workpiece W23, base c3159d5 (the sync merge of 1205fda into 780aee1;
  tree equal to 780aee1).
- ASCII: design/materialization/D20-INTENDED-MAIN-SYNC.md (STRUCTURAL CHECK: PASS).
- DECISION: the owner's choice when pull request #6 conflicted with main (quoted in the ASCII): merge main in, keep this
  branch's D14 at its paths, relocate the other line's colliding files to D14-RESCAN, add its epoch after D19, keep both
  lines' law annotations, route all content as a Factory delta, classify the sync merge in the lineage.
- STATIONS: S-DOC (F0, F2, F5, F12, F14), S-FIXTURE (F1), S-ANNOTATE (F3), S-EVIDENCE (F4, F7, F11, F13), S-BROWSER (F6,
  F8), S-BUILD (F9, F10).
- CHANGE: tests/sync/ (line import), tests/envmap/envmap.mjs (epoch alias), tests/reconcile/{build-reconciliation.mjs
  (inheritance over existing supersessions), d20-reconciliation.json, d20-surfaces.json}, tests/reprove/{select.mjs
  (carried conditions, --pass), lineage.mjs (sync merges), build-reprove.mjs (reuses harness nodes), runbook.json,
  obligations.json}; imported from the other line: tests/reference/{ingress.mjs, run-ingress-checks.sh},
  fixtures/reference/, its D14 records, receipts and evidence (relocated where the path is taken), its law annotations
  (union, insertion-only); design/environment-map/ (epochs D14-RESCAN, D20-SYNC, D20; graph; views; SCHEMA 14,
  ENVIRONMENT-MAP 13); evidence/D20/; docs/HANDOFF.md; README.md; this ledger; D20 records.  FORBIDDEN: FACTORY-LAW.md and
  every other law/pass document except the five unions, compiler/, host/, factory/src|registry, earlier epochs, every
  existing file of D0-D19 evidence, this branch's D14 records.
- PREDICTED: import 177 checked PASS; regressions identical (D19 graph and Q01-Q22, D18/D18R/D19 epochs, D19 selection
  replay); D20-SYNC 12 nodes / 112 edges; selection about 71 of 152, gaps 0, every group PASS; D20 epoch about 25 / 191;
  merged about 1250 / 3190; validate 42; gates PASS; Q22 174 current facts, RUN 109 (108 claimable + 1 invalidated),
  open stops GAP 8 / ERR 5 / UNK 4.

AFTER
- RESULT: integrated as ca540647db00c72fa0570f7f4f59a20c299172b7 (ff-only from the sync merge c3159d5, whose tree equals
  780aee1's); no refusal, no repair, no re-run.  One wording defect found in the dry run before routing (a successor's
  note quoted the text its reconciliation retires) was corrected in the register before any station ran.
- RECEIPTS: F0-F14 (15) PASS (format 2).  VERIFICATION: PASS (first run).  INTEGRATION: PASS.  PROBE: re-inspection
  MATCH (D20-SYNC and D20 epochs rebuilt byte-identically; re-proof gate and import check re-run PASS).  Pushed.
- OBSERVED: D20-OBSERVED-MAIN-SYNC.md - P1-P7 MATCH; GATE: PASS; the branch merges into main without conflict.
- LATER: the owner closed pull request #6 unmerged (it predated the sync) and merged pull request #7 (this branch at
  ca54064) into main as b22bcbb6ed8cf49983c919beedd93541a761567c; the branch was fast-forwarded to b22bcbb (tree
  bca6411, identical to ca54064's: the owner merge carries no content).  [OBS] no content sync was needed.
  The owner then issued the six-task whole-repository execution series D21-D26.
- (recorded by D21-PROMPT-INTAKE, the next delta.)

---

## D21-PROMPT-INTAKE  (FIRST ACTION of the six-task whole-repository execution + gap closure series)

BEFORE
- DELTA: D21-PROMPT-INTAKE (factory/deltas/D21-PROMPT-INTAKE.json), workpiece W24.
- BASE: b22bcbb6ed8cf49983c919beedd93541a761567c (main after PR #7; branch fast-forwarded, merged history only).
- STATION: S-DOC.  FIXTURE: F0-doc.  JUDGE: the factory binary built from b22bcbb.
- CHANGE: design/materialization/D21-D26-WHOLE-REPO-EXECUTION-PROMPT.md (verbatim), this ledger, the delta, its
  fixture, receipts.  FORBIDDEN: everything else.
- NEXT: D21-EXECUTION-MANIFEST, assembled in design/materialization/D21-INTENDED-EXECUTION-MANIFEST.md.  Prompt intake
  is not one of the six tasks.

AFTER
- recorded by the next delta (a delta cannot carry its own integration result).
