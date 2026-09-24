# D9 - Intended Rust/Cargo Proof Harness ASCII

STATUS: MATERIALIZATION D9 - INTENDED SYSTEM (ASCII WORKING SURFACE, ROUTED ONLY AFTER STRUCTURAL CHECK: PASS)
DATE: 2026-09-24
CANONICAL BASE: f4395dfb79f19cf5fe1ce23891a5157b55fe53a4 (branch main, owner-approved merge of PR #1; tree byte-identical
to 68efcde69b61f8eacf684a515b41b6a8278869f3).  Development branch claude/d9-rust-cargo-proof-4nys6s is at the same commit.
LAW: FACTORY-LAW.md, FACTORY-CONTRACTS.md, FINAL-HANDOFF-REQUIREMENTS.md "Evidence honesty".

D9 commissions the JUDGE.  It does not repair the production compiler.  A D9 fixture PASS means "the harness executed
and its self-attack held"; it never means "the production compiler satisfies every proof obligation".  Failures of the
system under test are EVIDENCE ([ERR]/[GAP]), never station failures, unless the harness itself malfunctioned.

## 0. Observation before drawing (scratch probes, no repository change)

[OBS] rust-toolchain.toml absent.  Nothing in the repository pins a toolchain.  `rustup show`: stable 1.94.1 (e408947bf
      2026-03-25) is the default; nightly was NOT installed in this container until `rustc +nightly --version` auto-installed
      1.100.0-nightly (6eeff9a52 2026-09-23).  Historical evidence (evidence/D1..D3/bootstrap/b9-toolchain.log) records
      nightly 6bb1652a0 2026-09-22.  The nightly identity is therefore ENVIRONMENTAL, one day drifted, and only RECORDED
      by evidence, never pinned by repository state.  rust-src and clippy for nightly were absent and were added to the
      container for D9 (environment, not repository).
[OBS] Root Cargo.toml: 14 members; `default-members` lists 13 (compiler/wasm-abi omitted); `exclude = ["fixtures"]`.
[RUN] bare `cargo build` compiles 13 packages (no factc-wasm-abi).  `cargo build --workspace` FAILS natively:
      factc-wasm-abi (cdylib) has `#[panic_handler]` only under cfg(target_arch = "wasm64"), so on x86_64 rustc reports
      "`#[panic_handler]` function required" and "unwinding panics are not supported without std".  `cargo check
      --workspace` and `cargo clippy --workspace --all-targets` fail the same way.  Therefore every historical bare
      `cargo build` / `cargo test` / `cargo clippy --all-targets` was a DEFAULT-MEMBERS run (13 packages), not a full
      workspace run.  Ledger/receipt wording "full suite" / "all ladders" is overstated by exactly that crate.
[RUN] bare `cargo test` (debug) = 95 passed / 0 failed over 13 packages: 10 unit/integration binaries with tests, the
      rest 0-test binaries and doc-tests.  `cargo test --workspace` = 95 (wasm-abi contributes a 0-test cdylib harness).
      `cargo test --release` (bare and --workspace) = 95.  Debug and release agree on this tree.
[RUN] `cargo fmt --all --check` covers all 14 members (wasm-abi's 2 files included).  Nightly clippy over the wasm64
      core-only graph checks 12 compiler crates + factc-wasm-abi with 0 errors.
[RUN] compile-fail fixtures, actual rustc diagnostics (stable 1.94.1, `--message-format=json`):
        std-in-kernel          E0433 x2 "use of unresolved module or unlinked crate `std`" (src/lib.rs:3, :4)
        id-substitution        E0308 x3 "mismatched types" (src/lib.rs:10, :11, :12)
        forge-verified-strategy  (no code) "cannot construct `factc_verifier::VerifiedStrategy` with struct literal
                               syntax due to private fields" (src/lib.rs:8)
      tests/bootstrap/run-negative-fixtures.sh only tests `cargo build` exit != 0.  Scratch mutants prove the weakness:
        id-substitution + unclosed delimiter      -> "rejected by rustc (expected)"  (syntax error, invariant untested)
        id-substitution + misspelled import       -> "rejected" with E0432/E0425 + only 2 of 3 E0308
        forge with one stale field name           -> "rejected" with E0560 ONLY; the private-field error DISAPPEARS.
      So a refactor of VerifiedStrategy's public fields would silently convert the P5-V01/P6-G05 witness into a
      stale-field failure while the script keeps reporting success.  [ERR] compile-fail proof strength.
[RUN] factory nostd-check (factory/src/checks.rs) attacked with scratch crates:
        `#[cfg(test)] fn x(){}` early in the file, then production `use std::collections::BTreeMap` -> PASS (false)
        `use ::std::string::String`                                                            -> PASS (false)
        `use {\n    std::string::String,\n};`                                                   -> PASS (false)
        `pub fn leak() -> std::string::String` with no cfg(test) above                          -> FAIL (caught)
      Cause: `in_test` is set at the first `#[cfg(test)]` line of a file and never cleared; the scan matches only
      `use std::`, `extern crate std`, ` std::`.  It is a textual heuristic, not a proof.  [ERR] no_std proof strength.
[RUN] factory depcheck attacked:
        `[dependencies.serde]\nversion = "1"` (dotted table)  -> PASS, "0 dependency entries" (false)
        `serde = { version = "1" }`, `[target."cfg(unix)".dependencies] libc = "0.2"` -> FAIL (caught)
        path dep to any crate inside the repo root            -> PASS (vendored third-party code would pass) [UNK]
        a manifest not on the explicit list                   -> never read (false by construction)
      `cargo metadata` on fixtures/compiler/negative/third-party-dep RESOLVES serde 1.0.229 from crates.io through the
      container proxy (network reachable).  First-party-only is therefore a CHECK, not an environmental impossibility.
      [ERR] dependency proof strength.
[RUN] `cargo +nightly build -p factc-wasm-abi -Z build-std=core --target wasm64-unknown-unknown` on the CURRENT tree
      succeeds in release (3,350,252 bytes, memory I64 min=311) and debug (12,441,060 bytes, I64 min=312).  The build
      compiles all 12 compiler crates with `core` only (no std, no alloc): this is the compiler-enforced no_std proof.
      Chromium 141 (Playwright) instantiates the release module through host/harness/kernel-host.mjs with zero imports,
      abi_version 1, required_workspace 2865440.
[OBS] The last wasm64 build recorded as evidence is evidence/D3/bootstrap (kernel graph of D3: 6 crates).  D4..D8 added
      planning, verifier, codegen, bundle, observe to the kernel graph with NO wasm64 build evidence; the "wasm64" strings
      in evidence/D5..D7 are the codegen EMITTER's output (generated bundle), not the compiler built for wasm64.
      Historical claim "compiler kernel builds for wasm64" is valid only up to D3 until D9 re-proves it. [ERR] history.
[RUN] wasm32 masquerade: a wasm32-unknown-unknown cdylib is rejected by `factory wasm-inspect`
      ("all_memories_i64_address_type" FAIL, I32 memory).  The inspector is adequate for this attack.
[RUN] debug/release divergence is constructible: a #[should_panic] test relying on debug overflow checks passes in
      debug and fails in release ("test did not panic as expected").
[OBS] factory/src/paths.rs treats surfaces literally: S-FIXTURE's "compiler/*/tests/" (MAY CHANGE) and "compiler/*/src/"
      (MUST NOT CHANGE) never match a real path (no glob expansion).  D9 relies on the DELTA's explicit must_not_change
      (compiler/, host/) rather than on those station entries.  Recorded as [GAP] for a later Factory delta; not
      repaired here (factory/src is read-only for D9).

## 1. Intended system

```text
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                     D9 · RUST/CARGO PROOF HARNESS  (evaluates the judge)             ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

                              PROJECT CLAIM                                   [OBS]
                "cargo test 95/0", "no_std kernel", "first-party only",
                "wasm64 no fallback", "compile-fail witnesses B3/P5-V01/B1"
                                    |
                                    v
                            PROOF OBLIGATION                                  [NEW]
              tests/toolchain/proof.mjs  (first-party node ESM, no deps;
              node is already project tooling: host/harness/*.mjs)
              every obligation record = { obligation, invariant, command[],
              toolchain{rustc -vV}, selection[packages x targets x profile],
              observed, verdict PASS|FAIL|GAP|UNK, reason }
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
          v                         v                         v
   rustc  [NEW]              Cargo  [NEW]              execution  [NEW]
   compile-fail with         package graph:            wasm64 module -> factory
   --message-format=json     cargo metadata --locked   wasm-inspect (i64 memory)
   expected {code,count,     physical Cargo.toml walk  -> Chromium via
   msg,span} per fixture     members/default/exclude   host/harness/kernel-host.mjs
   no_std: core-only         resolve graph sources     (zero imports, ABI v1)
   wasm64 build (nightly,    dependency kinds          debug + release profiles
   -Z build-std=core)        profiles: dev/release     native test both profiles
          |                         |                         |
          +-------------------------+-------------------------+
                                    |
                                    v
                            HARNESS WITNESS                                   [NEW]
              evidence/D9/<class>/*.json + *.log, summary.json, summary.txt
              (S-BUILD writes; S-EVIDENCE indexes with sha256)
                                    |
                                    v
                             MUTANT ATTACK                                    [NEW]
              fixtures/toolchain/mutants/<m>/MUTANT.json  (weak check expected
              PASS; qualified check expected FAIL with named reason)
                          /                    \
                     caught                   survives
                       |                          |
                     [RUN]                      [ERR] harness inadequate
              (mutant corpus verdict)          (fixture F2 FAILS: judge not qualified)
```

### 1.1 Proof classes (T9-P1 .. T9-P9), each an obligation with a named verdict

```text
T9-P1 PACKAGE SELECTION                                                       [NEW]
  physical manifests (walk repo, skip target/, node_modules/)
      vs cargo metadata --locked: workspace_members, workspace_default_members, exclude
      vs artifacts actually compiled by each cargo invocation (compiler-artifact JSON)
  verdicts: P1-01 every physical manifest is root | member | under an exclude entry (else FAIL: unaccounted)
            P1-02 default-members == members (else FAIL, naming the omitted crates)         expected on SUT: FAIL wasm-abi
            P1-03 bare `cargo build` artifacts == default members (records exactly what "bare" covers)
            P1-04 `cargo build --workspace` covers every member (else FAIL naming the crate + rustc reason)
                                                                                            expected on SUT: FAIL wasm-abi native
T9-P2 NATIVE BUILD/TEST (stable)                                              [NEW]
  cargo build | cargo build --release | cargo test | cargo test --release | cargo test --workspace
  each record: package x target-kind x profile list, per-binary "test result" lines, totals
  verdicts: P2-01..05 exit 0 AND declared scope observed (no "full suite" wording; the scope IS the artifact list)
T9-P3 CLIPPY / FMT (stable; nightly for the wasm64 graph)                     [NEW]
  cargo clippy --all-targets -- -D warnings (bare = default members)  P3-01
  cargo clippy --workspace --all-targets -- -D warnings               P3-02   expected on SUT: FAIL (wasm-abi native)
  cargo fmt --all --check -v (file list = scope)                      P3-03
  cargo +nightly clippy -p factc-wasm-abi -Z build-std=core --target wasm64-unknown-unknown -- -D warnings  P3-04
  law: static lint != semantic correctness; recorded as "lint" class, never as proof of an invariant
T9-P4 COMPILE-FAIL                                                            [NEW]
  fixtures/compiler/negative/{std-in-kernel,id-substitution,forge-verified-strategy} (read-only, copied to scratch)
  + fixtures/toolchain/expect/<fixture>.json = { codes: {E0308: 3}, message_must_contain[], spans[], forbid_other_codes }
  verdict: P4-01..03 FAIL if build succeeds OR observed diagnostics != expected set (extra/missing code, span, message)
  weak reference (recorded, not trusted): run-negative-fixtures.sh exit-code rule
T9-P5 no_std                                                                  [NEW]
  P5-01 textual: factory nostd-check over 12 compiler crates (recorded as HEURISTIC; verdict weight: none)
  P5-02 compiler-enforced: cargo +nightly build -p factc-wasm-abi -Z build-std=core --target wasm64-unknown-unknown
        (dev and release); artifact set must equal the 12 intended compiler crates + wasm-abi; sysroot crates
        (core, compiler_builtins) listed separately with the nightly identity; any E0433/E0463 "std" = FAIL naming crate
  P5-03 participation: intended crate absent from the compiled set = FAIL (graph proves nothing for it)
T9-P6 DEPENDENCY LAW                                                          [NEW]
  P6-01 resolve graph: every package in cargo metadata resolve has source == null (path) and manifest inside root
  P6-02 every declared dependency (all kinds, all targets, dotted or inline) is a path dependency inside root
  P6-03 physical/declared/resolved agreement: physical manifests not in the resolve graph are listed with their
        exclude reason; an unlisted in-graph manifest is impossible (metadata is the list)
  P6-04 weak reference: factory depcheck with the historical explicit list (recorded)
  [UNK] vendored third-party code inside root is indistinguishable from first-party by path rules alone
T9-P7 TOOLCHAIN IDENTITY                                                      [NEW]
  rustc/cargo -vV for stable and nightly; rustup show active-toolchain; rust-toolchain.toml presence (expected absent);
  nightly components (rust-src, clippy); per-run toolchain embedded in every obligation record
  law: D9 does NOT add a pin.  Pin status = [GAP] returned to ASCII for D10 authorization.
  requires stable: P2, P3-01..03, P4;  requires nightly: P5-02, P3-04, P8
T9-P8 WASM64                                                                  [NEW]
  P8-01 build release + debug (nightly, -Z build-std=core, -C link-arg=-zstack-size=16777216 as in run-b9-b11.sh)
  P8-02 factory wasm-inspect --out (all memories i64; imports/exports; sha256) for both profiles
  P8-03 Chromium execution via host/harness/kernel-host.mjs --browser: imports == [], abi_version == 1, diagnostics present
  P8-04 no wasm32 fallback: the only accepted triple is wasm64-unknown-unknown; wasm32 module = FAIL (mutant M7)
T9-P9 HARNESS SELF-ATTACK  (fixtures/toolchain/mutants)                       [NEW]
  M1 omitted-workspace-member   weak: bare `cargo test` in a 2-member workspace with default-members=[alpha]  -> PASS
                                qualified: P1-02 + `cargo test --workspace`                                 -> FAIL "beta omitted / beta test fails"
  M2 compile-fail-wrong-reason  weak: `cargo build` exit != 0                                               -> PASS ("rejected")
                                qualified: P4 expected-diagnostic set (E0308 x3)                             -> FAIL "unclosed delimiter, no E0308"
  M3 compile-fail-stale-forge   weak: `cargo build` exit != 0                                               -> PASS
                                qualified: P4 expected "private fields" message at src/lib.rs               -> FAIL "E0560 stale field; sealing not witnessed"
  M4 nostd-scanner-bypass       weak: factory nostd-check                                                   -> PASS (cfg(test) marker + `extern crate std` + `use std::`)
                                qualified: core-only wasm64 build                                           -> FAIL "E0463/E0433 std"
  M5 uninspected-manifest       weak: factory depcheck <root> <listed manifest only> (gamma unlisted, dotted table) -> PASS
                                qualified: P6 metadata audit                                                -> FAIL "registry source serde" | "resolution failed"
  M6 native-pass-wasm64-fail    weak: `cargo test` (native)                                                 -> PASS
                                qualified: core-only wasm64 build                                           -> FAIL "E0433 std under cfg(not(wasm64))"
  M7 wasm32-masquerade          weak: `cargo +nightly build --target wasm32-unknown-unknown` exit 0 + .wasm exists -> PASS
                                qualified: factory wasm-inspect                                             -> FAIL "I32 memory"
  M8 debug-pass-release-fail    weak: `cargo test`                                                          -> PASS
                                qualified: `cargo test --release`                                           -> FAIL "1 failed: test did not panic"
  rule: each mutant is a standalone crate/workspace under fixtures/ (excluded from the root workspace), copied to
        CARGO_TARGET_DIR before any cargo command (path deps rewritten to absolute); the fixture tree is never written.
  verdict: F2 fixture command exit 0 only when EVERY mutant's observed (weak, qualified) == expected.
```

### 1.2 Components, ownership, sequence

```text
FIXTURE   STATION      MAY CHANGE (narrowed)                                            PRODUCES
F0-doc    S-DOC        design/materialization/D9-INTENDED-PROOF-HARNESS.md,             this ASCII (byte-identical to the
                       design/materialization/LEDGER.md (BEFORE entry),                 structurally checked scratch copy),
                       factory/deltas/D9.json, factory/fixtures/D9/,                    delta + fixtures (delta-owned),
                       factory/receipts/D9-RUST-CARGO-PROOF/                            ledger BEFORE
F1-fixture S-FIXTURE   tests/toolchain/, fixtures/toolchain/,                           proof.mjs, run-proof-matrix.sh,
                       factory/receipts/D9-RUST-CARGO-PROOF/                            run-mutants.sh, expect/*.json,
                                                                                        mutants/M1..M8 (+ MUTANT.json)
F2-build  S-BUILD      evidence/D9/                                                     proof matrix evidence (T9-P1..P8)
                       (source-nonmutating; CARGO_TARGET_DIR outside the workpiece)     + mutant corpus evidence (T9-P9)
F3-doc    S-DOC        design/materialization/D9-OBSERVED-PROOF-HARNESS.md,             observed ASCII [RUN]/[ERR]/[GAP]/[UNK],
                       design/materialization/LEDGER.md (AFTER entry),                  historical-claim audit
                       factory/receipts/D9-RUST-CARGO-PROOF/
F4-evidence S-EVIDENCE evidence/D9/                                                     evidence/D9/index.json (sha256)

SEQUENCE  delta check -> workpiece W9 (git worktree @ f4395df) -> F0 -> F1 -> F2 -> F3 -> F4 -> verify
          -> integration gate (ff-only, base unmoved, branch claude/d9-rust-cargo-proof-4nys6s) -> re-inspect
          (reinspect_commands: run-mutants.sh on the canonical tree + bare cargo test) -> observed ASCII compare
```

### 1.3 Inputs / outputs / consumers

```text
INPUT                                   OWNER            CONSUMER
canonical tree @ f4395df                repo             W9 workpiece (read-only SUT)
root Cargo.toml, Cargo.lock             SUT (read-only)  T9-P1, T9-P6 (cargo metadata --locked)
compiler/*, host/*, factory/src/*       SUT (read-only)  T9-P2/P3/P5/P8 builds; factory binary (built from canonical
                                                         base into /home/user/factory-target, unchanged by D9)
fixtures/compiler/negative/*            SUT (read-only)  T9-P4 (copied to scratch; never written in place)
tests/bootstrap/*.sh                    SUT (read-only)  weak-reference rules (quoted, re-executed only on mutants)
host/harness/kernel-host.mjs            SUT (read-only)  T9-P8-03 browser execution
nightly rust-src + clippy components    environment      T9-P5/P8/P3-04 (identity recorded; absence -> UNK, not FAIL)
OUTPUT                                  TERMINAL ROLE
evidence/D9/**                          re-inspection + observed ASCII; indexed by F4
D9-OBSERVED-PROOF-HARNESS.md            human/AI interaction layer; input to a later D10 repair design
receipts + verification.json            integration gate
```

### 1.4 Invariants

```text
I1 production machinery byte-identical: compiler/, host/, factory/src/, factory/registry/, codegen templates, all law
   documents, evidence/D0..D8, receipts D0..D8, fixtures/{language,compiler,commissioning}, tests/{bootstrap,commissioning,
   language}, M0, M9, COMMISSIONING-RECORD.md, README.md, Cargo.toml, Cargo.lock  (delta MUST NOT CHANGE)
I2 no third-party crate anywhere in D9 (harness is sh + node ESM + existing factory binary + cargo/rustc)
I3 no toolchain pin introduced (rust-toolchain.toml stays absent) - [GAP] recorded for ASCII authorization
I4 SUT failures are evidence verdicts, not station failures; harness exit codes mean "harness ran / self-attack held"
I5 every obligation record names: command, toolchain identity, package/target/profile selection, observed, verdict, reason
I6 no compile-fail verdict from exit code alone; diagnostics compared by code/count/message/span
I7 no_std verdict weight only from the core-only wasm64 compiler graph; the textual scanner is recorded as heuristic
I8 the wasm64 proof accepts only wasm64-unknown-unknown; there is no wasm32 path in the harness
I9 the fixture tree is never written by a build/test command (copies in CARGO_TARGET_DIR); S-BUILD stays source-nonmutating
I10 mutants live outside the product workspace (fixtures/ is excluded by the root manifest) and cannot alter the SUT graph
```

### 1.5 Tests and evidence obligations attached to the delta

```text
tests:      tests/toolchain/run-proof-matrix.sh evidence/D9   (T9-P1..P8 over the SUT; exit 0 = harness ran)
            tests/toolchain/run-mutants.sh evidence/D9/mutants (T9-P9; exit 0 = every mutant expectation observed)
            sh -n on both scripts; node --check on proof.mjs (F1 verification)
evidence:   evidence/D9/toolchain/*.json|log, selection/, native/, lint/, compile-fail/, nostd/, deps/, wasm64/,
            mutants/<m>/{weak,qualified}.json, summary.json, summary.txt, index.json
required:   design/materialization/D9-INTENDED-PROOF-HARNESS.md, design/materialization/D9-OBSERVED-PROOF-HARNESS.md,
            tests/toolchain/proof.mjs, fixtures/toolchain/mutants/*/MUTANT.json, evidence/D9/summary.json, evidence/D9/index.json
forbidden:  target, rust-toolchain.toml, fixtures/toolchain/**/Cargo.lock written by the harness (copies only)
```

## 2. Expected observed outcome on the SUT (predictions to be compared in D9-OBSERVED)

```text
T9-P1-02  FAIL   factc-wasm-abi not in default-members (bare cargo covers 13/14)                   [ERR] wording "full"
T9-P1-04  FAIL   --workspace native build: factc-wasm-abi panic_handler gated to wasm64                [OBS] by design?
                 -> returned to ASCII: either the crate declares its native non-buildability as law, or D10 repairs
T9-P2-*   PASS   95/0 debug and release over 13 packages; --workspace 95/0 (wasm-abi 0 tests)
T9-P3-01  PASS   13 packages;  T9-P3-02 FAIL (same wasm-abi native reason);  P3-03 PASS 14 members;  P3-04 PASS
T9-P4-*   PASS   all three fixtures fail for the expected reason on stable 1.94.1 (codes/spans as observed above)
T9-P5-02  PASS   12 compiler crates + wasm-abi compiled with core only; P5-01 heuristic PASS (weight none)
T9-P6-*   PASS   14 path packages, 0 registry/git; fixtures/ manifests excluded (5) incl. third-party-dep negative
T9-P7     GAP    no pin; nightly drifted 2026-09-22 -> 2026-09-23 between D1..D3 evidence and D9
T9-P8-*   PASS   release + debug wasm64 modules i64-only; Chromium ABI v1, imports []
T9-P9     RUN    M1..M8 all: weak PASS, qualified FAIL for the named reason
HISTORY   [ERR]  "full suite"/"all ladders" (D0..D8 ledger wording) = default members only
          [ERR]  compile-fail proofs = exit-code only (D1, D2, D4 negative summaries)
          [ERR]  nostd-check and depcheck PASS lines are heuristic, bypassable (D1..D6 F1-rust receipts)
          [ERR]  no wasm64 compiler build evidence after D3 (D4..D8)
          [OBS]  95/0 debug count itself is valid for the 13 default members; SwiftShader/WebGPU claims out of scope
```

## 3. Structural check

```text
required inputs supplied ............ canonical base f4395df; stations S-DOC/S-FIXTURE/S-BUILD/S-EVIDENCE registered in
                                      canonical base with capabilities DOC_CONTRACT_FORGE/FIXTURE_FORGE/BUILD_VERIFY/
                                      EVIDENCE_ASSEMBLER; node 22 + Chromium (Playwright) + stable 1.94.1 + nightly
                                      1.100.0 (rust-src, clippy) present ....................................... PASS
outputs have consumers .............. evidence -> F3 observed ASCII + F4 index + re-inspect; observed ASCII -> D10 .. PASS
types/contracts match ............... fixtures narrow within station MAY CHANGE (S-DOC: design/, factory/deltas/,
                                      factory/fixtures/, factory/receipts/; S-FIXTURE: tests/, fixtures/,
                                      factory/receipts/; S-BUILD/S-EVIDENCE: evidence/) and within delta MAY CHANGE .. PASS
forbidden bypasses absent ........... no AGENT -> REPO write; no compiler/host/factory-src/registry change; no pin;
                                      no third-party crate; no wasm32 path ................................. PASS
illegal cycles absent ............... harness reads SUT, writes evidence; evidence never feeds the SUT .......... PASS
invariants represented .............. I1..I10 above map to delta must_not_change / fixture commands / verify ...... PASS
tests/evidence obligations attached . section 1.5 ......................................................... PASS
station gaps ........................ none for the surfaces used; [GAP] noted (not needed by D9): paths.rs literal
                                      wildcard entries in S-FIXTURE; S-BUILD writes CARGO_TARGET_DIR outside workpiece
                                      (historical practice, recorded) ....................................... PASS (with GAP notes)

STRUCTURAL CHECK: PASS  -> route StructuralDelta D9-RUST-CARGO-PROOF
```
