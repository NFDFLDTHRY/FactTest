# D9 - Observed Rust/Cargo Proof Harness vs Intended

STATUS: RE-OBSERVATION OF THE D9 WORKPIECE (W9 on canonical base f4395dfb79f19cf5fe1ce23891a5157b55fe53a4)
LAW: this file compares design/materialization/D9-INTENDED-PROOF-HARNESS.md with what the harness physically recorded
under evidence/D9/.  The intended drawing is NOT rewritten; every difference is preserved as [ERR]/[GAP]/[UNK].
A verdict here is about the SYSTEM UNDER TEST or about HISTORY; the harness itself executed (F2 receipt PASS) and its
self-attack held (8/8 mutants).  NO PRODUCTION COMPILER REPAIR was performed or folded into D9.

## 1. Observed system

```text
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                     D9 · RUST/CARGO PROOF HARNESS  (observed)                        ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

                              PROJECT CLAIM                                   [OBS]
                                    |
                                    v
                            PROOF OBLIGATION                                  [RUN]  tests/toolchain/proof.mjs
                     25 obligation records + 8 mutant records                        (12 subcommands, node 22, no deps)
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
          v                         v                         v
   rustc  [RUN]              Cargo  [RUN]              execution  [RUN]
   T9-P4 x3 diagnostics      T9-P1 selection audit     T9-P8 wasm64 dev+release
   T9-P5-02/03 core-only     T9-P2 x7 native matrix    inspect (I64 min 311/312)
   wasm64 graph (12 crates)  T9-P3 x4 lint scope       Chromium 141 ABI v1, imports []
   stable 1.94.1 / nightly   T9-P6 resolved graph      stable + nightly identities
   1.100.0 (2026-09-23)      14 path pkgs, 49 edges    recorded per record
          |                         |                         |
          +-------------------------+-------------------------+
                                    |
                                    v
                            HARNESS WITNESS                                   [RUN]  evidence/D9/summary.{json,txt}
                     tally PASS 20 / FAIL 3 / GAP 1 (+1 negative fixture PASS)        index.json (F4)
                                    |
                                    v
                             MUTANT ATTACK                                    [RUN]  evidence/D9/mutants/summary.json
                          /                    \
                     caught 8                 survives 0
                       |                          |
                     [RUN] M1..M8              [ERR] none
```

## 2. Obligation-by-obligation (intended prediction vs observed)

```text
ID                                          PREDICTED  OBSERVED  TOOLCHAIN                 WHAT WAS TESTED / WHY THE VERDICT FOLLOWS
T9-P7-01-toolchain-identity                 GAP        GAP [GAP] stable 1.94.1 e408947bf   no rust-toolchain.toml; nightly 1.100.0 6eeff9a52 2026-09-23 (rust-src, clippy);
                                                                 nightly 1.100.0 6eeff9a52  historical nightly 6bb1652a0 2026-09-22 -> identity DRIFTED, only recorded, never pinned.
                                                                                            D9 adds no pin; authorization returned to ASCII for D10.
T9-P1-01-physical-vs-workspace-vs-default   FAIL       FAIL [ERR] stable                   31 physical manifests: 1 root, 14 members, 16 excluded (fixtures/), 0 unaccounted;
                                                                                            default-members = 13: factc-wasm-abi OMITTED.  Bare cargo build/test/clippy never
                                                                                            select it.  "full suite" wording in D0..D8 ledger/receipts is overstated by this crate.
T9-P2-01-build-bare-default-members         PASS       PASS [RUN] stable                   13 packages (list in record), dev profile
T9-P2-02-build-workspace                    FAIL       FAIL [ERR] stable                   factc-wasm-abi (cdylib): "#[panic_handler] function required" + "unwinding panics are not
                                                                                            supported without std" on x86_64: the crate is buildable only for wasm64 (its
                                                                                            panic_handler is cfg(target_arch = "wasm64")).  Returned to ASCII (see section 4).
T9-P2-03-build-release-bare                 PASS       PASS [RUN] stable                   13 packages, release profile (panic=abort, opt-level s)
T9-P2-04-test-debug-bare                    PASS       PASS [RUN] stable                   95 passed / 0 failed over 34 harness runs (22 test executables + 12 doc-test runs), 13 packages
T9-P2-05-test-release-bare                  PASS       PASS [RUN] stable                   95 / 0 over 34 harness runs, release profile
T9-P2-06-test-debug-workspace               PASS       PASS [RUN] stable                   95 / 0 over 35 harness runs, 14 packages (wasm-abi contributes a 0-test harness)
T9-P2-07-test-release-workspace             PASS       PASS [RUN] stable                   95 / 0 over 35 harness runs, 14 packages, release
T9-P3-01-clippy-all-targets-bare            PASS       PASS [RUN] stable                   13 packages, -D warnings (static lint; not semantic proof)
T9-P3-02-clippy-all-targets-workspace       FAIL       FAIL [ERR] stable                   same wasm-abi native reason as T9-P2-02
T9-P3-03-fmt-all-check                      PASS       PASS [RUN] stable                   14 member directories, file list recorded (wasm-abi included: fmt covers what clippy does not)
T9-P3-04-clippy-wasm64-core-graph           PASS       PASS [RUN] nightly                  12 crates on wasm64 core-only graph, -D warnings, 0 errors
T9-P4-01-std-in-kernel                      PASS       PASS [RUN] stable                   E0433 x2 "`std`" at src/lib.rs:3,4; no other diagnostic; weak exit-code rule also PASS
T9-P4-02-id-substitution                    PASS       PASS [RUN] stable                   E0308 x3 "mismatched types" at src/lib.rs:10,11,12; no other diagnostic
T9-P4-03-forge-verified-strategy            PASS       PASS [RUN] stable                   1 x "cannot construct `factc_verifier::VerifiedStrategy` with struct literal syntax due to
                                                                                            private fields" at src/lib.rs:8; no other diagnostic (sealing witnessed, not a stale field)
T9-P5-01-textual-scan-heuristic             PASS       PASS [RUN] (factory binary)         12 crate dirs, no offender.  Verdict weight NONE: M4 shows the scanner is bypassable.
T9-P5-02-core-only-wasm64-graph-dev         PASS       PASS [RUN] nightly                  12 workspace crates compiled with core only (sysroot: core, compiler_builtins from rust-src)
T9-P5-03-core-only-wasm64-graph-release     PASS       PASS [RUN] nightly                  same, release; this is the compiler-enforced no_std proof for every intended crate
T9-P6-01-resolved-graph-first-party         PASS       PASS [RUN] stable                   cargo metadata --locked: 14 packages source=null inside root, 49 dependency edges all path
                                                                                            inside root, 14 resolve nodes; 16 physical manifests outside the product graph, all under
                                                                                            the root manifest's exclude = ["fixtures"] (4 negative fixtures + 12 D9 mutant manifests)
T9-P6-02-explicit-list-scan-heuristic       PASS       PASS [RUN] (factory binary)         14 manifests accepted.  Verdict weight NONE: M5 shows dotted tables and unlisted manifests escape.
T9-P6-03-third-party-dep-fixture-rejected   PASS       PASS [RUN] stable                   negative fixture rejected by the resolved-graph audit: serde registry source (Cargo resolved
                                                                                            serde 1.0.229 + proc-macro2/quote/unicode-ident/serde_derive from crates.io: network reachable)
T9-P8-01-inspect-release                    PASS       PASS [RUN] (factory binary)         I64 memory min=311; sha256 309589947e16...a8f025c, 3,350,252 bytes (identical to the scratch
                                                                                            probe build: the release module is reproducible across target dirs)
T9-P8-02-inspect-dev                        PASS       PASS [RUN] (factory binary)         I64 memory min=312; 12,446,312 bytes (debug module differs from the scratch build: debuginfo
                                                                                            embeds paths -> [UNK] reproducibility of the dev-profile module)
T9-P8-03-chromium-abi-release               PASS       PASS [RUN] node 22 + Chromium 141   imports [], abi_version 1, 13 exports, memory_pages 311, diagnostics returned
```

## 3. Mutant corpus (T9-P9): expected vs observed

```text
MUTANT                          WEAK/OLD CHECK                       exp/obs   QUALIFIED CHECK                              exp/obs   NAMED REASON OBSERVED
M1-omitted-workspace-member     bare cargo test                      PASS/PASS selection audit + cargo test --workspace   FAIL/FAIL beta omitted from default-members; t::beta_is_broken failed
M2-compile-fail-wrong-reason    cargo build exit != 0                PASS/PASS expected-diagnostic set                    FAIL/FAIL 0 x E0308; "unclosed delimiter" at src/lib.rs:16
M3-compile-fail-stale-forge     cargo build exit != 0                PASS/PASS expected-diagnostic set                    FAIL/FAIL E0560 no field `certificate_id`; private-field error absent
M4-nostd-scanner-bypass         factory nostd-check                  PASS/PASS core-only wasm64 build                     FAIL/FAIL E0463 can't find crate for `std`
M5-uninspected-manifest         factory depcheck (both manifests)    PASS/PASS resolved-graph audit                       FAIL/FAIL gamma -> serde registry source (dotted [dependencies.serde])
M6-native-pass-wasm64-fail      cargo test (native)                  PASS/PASS core-only wasm64 build (release)           FAIL/FAIL E0433 cannot find module or crate `std`
M7-wasm32-masquerade            nightly build --target wasm32 exit 0 PASS/PASS factory wasm-inspect                       FAIL/FAIL all_memories_i64_address_type: I32 memory
M8-debug-pass-release-fail      cargo test (dev)                     PASS/PASS cargo test --release                       FAIL/FAIL 0 passed / 1 failed (test did not panic)
RESULT: 8 caught, 0 survived -> [RUN].  Every mutant was copied to CARGO_TARGET_DIR before any cargo command; the fixture
tree received no Cargo.lock (F2 receipt: changed paths only under evidence/D9/).
```

## 4. Differences preserved (intended vs observed) and what returns to ASCII

```text
[ERR] T9-P1 / T9-P2-02 / T9-P3-02: the workspace is not natively buildable as a whole.  factc-wasm-abi is excluded from
      default-members so that bare cargo commands stay green; the exclusion is undocumented in Cargo.toml and every
      historical "full" claim silently inherited it.  Two lawful resolutions exist and neither is D9's to pick:
        (a) declare in law/Cargo.toml that factc-wasm-abi is a wasm64-only target and that "full native" == 13 packages;
        (b) D10 repair: make the crate type-checkable natively (e.g. cfg the cdylib/panic_handler so `--workspace` is
            green) - a production change, out of D9's mutation boundary.
[GAP] T9-P7: no toolchain pin.  Nightly identity drifted by one day between the D1..D3 evidence and D9 with no
      repository record of the change; -Z build-std compiles core from whatever rust-src the container has.  A pin
      (rust-toolchain.toml with channel + components rust-src/clippy) needs explicit ASCII authorization (S-RUST owns
      rust-toolchain.toml; D9 did not use S-RUST).
[GAP] factory/src/checks.rs nostd-check and depcheck remain in the tree as heuristics.  D9 records their verdict weight
      as none but cannot retire or repair them (factory/src is read-only for D9); the qualified checks live in
      tests/toolchain/.  A later delta may promote proof.mjs rules into the factory binary or drop the heuristics.
[GAP] factory/src/paths.rs applies station surfaces literally: S-FIXTURE's "compiler/*/src/" (MUST NOT CHANGE) and
      "compiler/*/tests/" (MAY CHANGE) never match a real path.  D9's protection came from the delta's explicit
      must_not_change.  Registry/paths repair belongs to a Factory delta.
[UNK] first-party by path: a vendored copy of third-party code inside the repository would pass T9-P6 (path inside
      root).  No such directory exists today (T9-P6-01 lists every physical manifest), but the rule cannot tell.
[UNK] dev-profile wasm64 module reproducibility (sha differs between target dirs; release module identical).
[UNK] the compile-fail expectation files pin diagnostics of rustc 1.94.1 (codes + message substrings + spans).  A
      future stable may reword messages; the record carries the toolchain so a mismatch is diagnosable, not silent.
[OBS] the harness needs crates.io reachability only for the two negative dependency cases (T9-P6-03, M5); on an
      offline host they would still FAIL, with reason RESOLUTION_FAILED instead of a registry source.
```

## 5. HISTORICAL CLAIM AUDIT (which green claims remain valid, which were overstated)

```text
CLAIM (where)                                                        STATUS      QUALIFIED BY
"cargo test 95 passed / 0 failed" (evidence/D7,D8 build/test.log)    VALID       T9-P2-04: 95/0 over 13 default-member packages, dev profile, stable 1.94.1
"full suite" / "all ladders" / "full cargo test on the final tree"   OVERSTATED  T9-P1-01: default-members omits factc-wasm-abi; the runs were 13/14 packages.  The
  (LEDGER D7/D8, fixture tests text, README implication)                          count itself is unaffected (wasm-abi has 0 tests) but the scope wording was wrong.
"cargo clippy --all-targets -- -D warnings clean" (D1..D7 F1/F2)      OVERSTATED  T9-P3-01 PASS for 13 packages; T9-P3-02 shows wasm-abi was never linted natively; only
                                                                                  T9-P3-04 (nightly, wasm64 graph) lints it - and that run is new in D9.
"cargo fmt --all --check clean"                                      VALID       T9-P3-03: 14 members including wasm-abi
"std-in-kernel / id-substitution / forge-verified-strategy rejected  OVERSTATED  the historical rule was exit != 0 only (M2, M3 prove it accepts wrong-reason failures).
  by rustc (expected)" (evidence/D1,D2,D4 negative/summary.log)                   On the CURRENT tree the fixtures DO fail for the intended reasons (T9-P4-01..03 PASS), so
                                                                                  the invariants B3 / B1 / P5-V01 hold today; the historical evidence just never proved it.
"nostd-check PASS" (D1..D6 F1-rust receipts)                          OVERSTATED  textual heuristic, bypassable (M4).  The invariant holds today by T9-P5-02/03 (12 crates
                                                                                  compile with core only), which is the first compiler-enforced no_std proof of the full graph.
"depcheck PASS = no third-party dependencies" (D1..D6 F1-rust)        OVERSTATED  explicit list + naive TOML scan (M5).  The invariant holds today by T9-P6-01 (Cargo's own
                                                                                  resolved graph, 14 path packages, 49 path edges), which reads every manifest Cargo reads.
"wasm64 bootstrap artifact built" (evidence/D1..D3 bootstrap)         VALID FOR   the D1..D3 kernel graph (6 crates) on nightly 6bb1652a0 2026-09-22.  No wasm64 compiler
                                                                      D3 ONLY     build was recorded for D4..D8; the "wasm64" in evidence/D5..D7 is the codegen EMITTER's output.
                                                                                  Re-proved in D9 for the 12-crate graph on nightly 6eeff9a52 (T9-P5-02/03, T9-P8-01..03).
"wasm32 fallback rejected" (B9, P6-B05)                               VALID       factory wasm-inspect rejects an i32-memory module (M7); the D9 harness has no wasm32 path.
"toolchain identity recorded" (evidence/D1 build/toolchain-*.log)     VALID BUT   recorded, never pinned; drift observed (T9-P7-01 GAP).
"Byte Relay physically commissioned (SwiftShader WebGPU)" (README)    OUT OF      D9 evaluates only the Rust/Cargo judge; runtime/WebGPU claims are not re-judged here.
                                                                      SCOPE
```

## 6. Match / differ

```text
intended section 2 predictions vs observed: MATCH on every obligation and every mutant (25 records, 8 mutants).
intended vs observed STRUCTURE: MATCH (no station gap; no new station; no production change; no pin).
differences that stay open (section 4): 1 [ERR] (native --workspace), 3 [GAP], 3 [UNK] -> returned to the ASCII surface.
D9 closes as: the judge is qualified; the system under test carries one structural [ERR] and one [GAP] that a later
D10 must design against this now-qualified judge.  NO PRODUCTION COMPILER REPAIR in D9.
```
