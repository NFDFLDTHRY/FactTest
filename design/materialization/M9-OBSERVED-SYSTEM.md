# M9 - Observed system vs intended system

STATUS: RE-OBSERVATION OF THE MATERIALIZED TREE (canonical HEAD 976718a608c58e0f22eb26802eb4c125ba72ee80, D0-D7 integrated)
LAW: this file compares design/materialization/M0-INTENDED-SYSTEM.md (the drawing routed before any workpiece) with what
the canonical repository, the receipts and the physical evidence now show.  The drawing is NOT rewritten; every
difference is preserved as [OBS]/[GAP]/[UNK] below.

## 1. Observed structure (derived from `git ls-files`, receipts and evidence)

```text
                        USER + FABLE
                             |
                             v
        +---------------------------------------------+
        | ASCII SYSTEMS DIAGRAM  (source of record)   |  [OBS] M0 drawing + fixtures/**/*.ascii (authored)
        +----------------------+----------------------+
                               |
              +----------------+----------------+
              |                                 |
              v                                 v
   FACTORY PLANE  [OBS]                COMPILER PLANE  [OBS]
   factory/ (1 std crate, 8 modules)   compiler/ (12 no_std crates)
              |                                 |
   8 deltas D0..D7 -> router (delta check)      |
              |                                 |
   8 worktrees W0..W7 + state outside tree      |
              |                                 |
   stations used: S-DOC S-RUST S-WEB S-FIXTURE  |
                  S-BUILD S-BROWSER S-EVIDENCE  |
   registered, never opened: S-BUNDLE  [OBS]    |
              |                                 |
   49 FactoryReceipts -> 8 verification.json    |
              |                                 |
   Integration Gate: 8 ff-only commits, author  |
   "FactTest Factory", trailers from the delta  |
              |                                 |
              v                                 |
   CANONICAL REPO branch claude/facttest-       |
   materialization-27amc7 (main untouched)      |
              |                                 |
              '---- re-inspect MATCH x8         |
                                                |
              +---------------------------------+
              |
              v
   compiler/foundation      [OBS] ids (C19 domains), spans, BVec arenas, JsonW, sha256, hex, wasm reader, Diagnostics
   compiler/source          [OBS] island scanner, lexer, statement parser, SystemAst
   compiler/semantic        [OBS] Model, declare/resolve/check, invariant kernel, refinement, canonical renderer, typed IR
   compiler/capability      [OBS] ObligationSet, CapabilityIr
   compiler/implementation  [OBS] registry dialect, H_G (DFS over declared conversions), H_A(E) via admissions
   compiler/planning        [OBS] CandidateStrategy, SUM aggregation, UNKNOWN never zero, Strength, compare
   compiler/verifier        [OBS] sole owner of sealed VerifiedStrategy; V-* rules; ProofCertificate/StrategyCertificate;
                                  activation (epoch -> ActivationReceipt)
   compiler/codegen         [OBS] first-party wasm64 emitter, membrane/adapters/selector/runtime/shell templates,
                                  BundleStore, bundle.json lineage
   compiler/bundle          [OBS] BundleVerifier B-01..B-10 + BundleCertificate   <- drawn inside codegen in M0 (see 3)
   compiler/observe         [OBS] evidence tape -> ObservationDelta -> observed ASCII   <- not a crate in M0 (see 3)
   compiler/kernel          [OBS] phase facade + ABI ops (submit/check/build/observe/read_artifact/bundle_file)
   compiler/wasm-abi        [OBS] wasm64 cdylib exporting the ABI; instantiated in Chromium (B9-B11)
   host/factc               [OBS] std CLI driver; host/harness: kernel-host.mjs, bundle-probe.mjs
              |
              v
   GENERATED WEBAPP  object B      [OBS] evidence/D6,D7/physical/compile/bundle/{wasm64_relay.wasm, membrane.js,
                                        selector.js, runtime.js, index.html, manifest.webmanifest, sw.js, bundle.json}
              |
              v
   RUNTIME PLANE (Chromium 141 headless, Playwright)   [OBS] E0: WEBGPU (SwiftShader) + CPU_WASM64 admitted, plan 1
                                                              destroy() -> lost "destroyed" -> E1: plan 0, exact bytes
              |
              v
   factc observe -> OBSERVED ASCII   [OBS] evidence/D7/physical/observed/observed.ascii (14 derived islands)
```

## 2. Section-by-section comparison with M0

```text
M0 SECTION                          OBSERVED                                                     VERDICT
1  factory plane                    factory/ crate; deltas, worktrees, receipts, verify, gate     MATCH
1  stations (8 named)               7 opened by fixtures; S-BUNDLE registered, never opened       DIFFER [OBS] (see 3.1)
1  compiler crates (10 named)       12 crates: the 10 named + bundle + observe                    DIFFER [OBS] (see 3.2)
1  host/factc                       present; plus host/harness (2 mjs drivers) drawn as           MATCH
                                    "Playwright-driven S-BROWSER station"
1  generated WebApp object B        emitted under evidence/, never in repo source                 MATCH
1  runtime plane + observed ASCII   physical evidence D6 and D7                                   MATCH
2  compiler flow                    kernel phases front_end -> semantic -> lowering -> contracts   MATCH
                                    -> plan_and_verify -> emit -> codegen_and_bundle; observe
3  inputs/outputs/ownership table   every listed artifact exists with the listed producer;         MATCH
                                    observed.ascii and receipts are terminal
4  bootstrap decisions              all eight held; two additions recorded in LEDGER.md            MATCH (+[OBS] 3.3)
5  invariants                       every [INV] has a passing witness (section 4 below)            MATCH
6  tests/evidence                   B0-B12, L0-L35, PASS5, PASS6 all sections, COMMISSIONING-PROOF MATCH
                                    -> COMMISSIONING-RECORD.md
7  structural check                 unchanged                                                      MATCH
8  unresolved                       all four preserved; none silently closed                       MATCH
```

## 3. Differences (preserved, not erased)

3.1 [OBS] S-BUNDLE was registered in factory/registry/stations but no fixture ever opened it.  Bundle assembly is done
    by the compiler (codegen BundleStore) and verified by compiler/bundle inside S-BUILD/S-BROWSER runs.  The M0
    drawing names S-BUNDLE as a station; the observed system has it as an unused spec.  Whether S-BUNDLE should be
    removed, or bundle assembly should move out of the compiler into a station, is an ASCII-level decision for the
    human/AI loop.  Not decided here.
3.2 [OBS] Two extra crates.  M0 drew BundleVerifier inside compiler/codegen and did not draw an observe crate.  The
    materialized tree separates compiler/bundle (so that the verifier of the bundle is not the emitter of the bundle,
    matching "planner != verifier" at the bundle level) and compiler/observe (so evidence handling never links into
    source semantics, matching "runtime evidence != source semantics").  The crate DAG remains acyclic:
    foundation <- source <- semantic <- capability <- implementation <- planning; verifier, codegen, bundle, observe
    depend only on lower layers; kernel depends on all; wasm-abi on kernel.  The drawing is not amended; the next
    human/AI ASCII revision should carry the two crates if it agrees.
3.3 [OBS] Compiler-plane rules decided during materialization (all in LEDGER.md, none in the grammar): reachable is
    reflexive-transitive over DATA+SEQUENCE; BUILD is blocked by GAP/ERR/UNK statuses; refinement v1 excludes
    refines-invariants re-entrancy; cross-unit references touch public ports only; MAX_TOKENS_PER_ISLAND = 96;
    MAX_VARIANTS = 16.  These are [UNK] until the owner contracts state them.
3.4 [OBS] Chromium 141 is the only host that instantiates a memory64 module here (Node 22 / V8 12.4 cannot).  The
    B9-B11 bootstrap ladder therefore runs in Chromium, not Node.

## 4. Invariant witnesses on the final tree

```text
[INV] no_std kernel, no third-party crates   factory nostd-check + depcheck (every D1..D7 receipt);
                                             fixtures/compiler/negative/{std-in-kernel,third-party-dep} rejected
[INV] wasm64 only, no wasm32 fallback        factory wasm-inspect (i64 memory, flags 0x04); B-05-wasm64; P6-B05
[INV] planner cannot construct Verified      fixtures/compiler/negative/forge-verified-strategy rejected by rustc
[INV] codegen accepts VerifiedStrategy only  signature; P6-G04
[INV] runtime selects only emitted variants  B-06; P6-M04/G06; probe: no_compiler_invoked, bundle_unchanged
[INV] evidence never rewrites source         authored-source-before/after cmp in run-physical.sh; observed.ascii
                                             source_of_record island; P6-R08
[INV] geometry/prose create no semantics     L33 drawn arrow; P6-A01/X03 compact layout identical
[INV] repo != generated WebApp               bundle only under evidence/, forbidden_paths "target"
[INV] station != backend                     stations are registry specs with authority sets; backends are
                                             registry contract entries; no shared identifiers
[INV] Byte Relay is data                     evidence/D7/anti-cheat/summary.log: compiler/factory/host clean;
                                             P6-X01/X04/X05
```

## 5. Unresolved (carried forward from M0, none closed)

[GAP] first-party allocator (bounded arenas suffice for the slice).
[GAP] 29 GAP, 1 ERR, 1 UNK capability families in the contract registry; only CPU_WASM64 and WEBGPU are READY-CONTRACT.
[UNK] hardware WebGPU: SwiftShader only on this host; physical GPU hardware evidence is not obtainable here.
[GAP] Wasm shared threads (ERR-002/003) untouched.
[OBS] 3.1-3.4 above await the human/AI ASCII loop.

## 6. Verdict

Intended ASCII and observed system AGREE on every flow, ownership and invariant.  They DIFFER on two structural
details (an unused registered station; two crates the drawing folded into one), both preserved above and neither
altering approved semantics.  The evidence ladder reached OBSERVED ASCII on the physical class twice (D6, D7), with
SYNTHETIC_MODEL and PHYSICAL_BROWSER kept distinct throughout.
