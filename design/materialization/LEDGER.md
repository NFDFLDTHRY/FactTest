# Materialization Ledger

STATUS: LIVE RECORD OF THE FABLE 5.1 MATERIALIZATION SESSION
SOURCE OF RECORD: design/materialization/M0-INTENDED-SYSTEM.md (intended ASCII); this ledger records each
workpiece BEFORE/AFTER as required by FABLE-ASCII-SYSTEM-PROMPT.md "REPORT EACH WORKPIECE".

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
- recorded by the next delta (a delta cannot carry its own integration result).

