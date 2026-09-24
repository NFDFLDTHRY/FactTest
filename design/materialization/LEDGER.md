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
- recorded by the next delta (a delta cannot carry its own integration result).

