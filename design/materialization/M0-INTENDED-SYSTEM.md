# M0 - Observed Repository and Intended System ASCII

STATUS: MATERIALIZATION M0 - HUMAN/AI SOURCE OF RECORD FOR THE FABLE SESSION
DATE: 2026-09-24
CANONICAL BASE: 32b7e65f8653427e7fc2d05ef3bad6c06f2f022c (branch claude/facttest-materialization-27amc7)
BASE TREE: ab9109c6711ca5341dfcd0c4b9888658befc51b6

## 0. Observation

[OBS] working tree clean; HEAD 32b7e65 descends from 5727c1f; HEAD contains FABLE-ASCII-SYSTEM-PROMPT.md.
[OBS] 44 tracked files; all design/law/control surfaces; no implementation directories exist.
[OBS] all 43 markdown owner contracts read before routing.
[OBS] design/law surfaces live at repository root, not under law/ and design/ as PLANNED-REPO-LAYOUT.md plans.
      Materialization does not relocate them (history/link preservation); new implementation zones are created.
[OBS] host: Linux x86_64, 4 CPU, 16 GiB, Git 2.43.0, Node 22.22.2, Python 3.11, Playwright 1.56.1, Chromium 141.0.7390.37.
[OBS] Rust: stable 1.94.1 (native only); nightly 1.100.0 (2026-09-22) installed by bootstrap with rust-src.
[RUN] scratch probe: `cargo +nightly build -Z build-std=core --target wasm64-unknown-unknown` produced a 341-byte
      module whose memory section flags are 0x04 (i64 address type).  wasm64 direction is physically buildable.
[RUN] scratch probe: Chromium 141 validates a Memory64 module and accepts `new WebAssembly.Memory({address:'i64'})`.
[RUN] scratch probe: Chromium 141 exposes navigator.gpu with adapter vendor=google architecture=swiftshader when
      launched without --disable-gpu and with --enable-unsafe-webgpu --enable-features=Vulkan --use-angle=swiftshader
      --enable-unsafe-swiftshader --ignore-gpu-blocklist on an http://127.0.0.1 secure context; requestDevice succeeds;
      GPUDevice.destroy() resolves device.lost with reason "destroyed".
[OBS] that WebGPU implementation is SwiftShader (CPU rasterizer).  It is genuine browser WebGPU API execution, not
      hardware GPU execution.  Evidence must say so.  (Synthetic != physical; hardware preference != hardware execution.)
[OBS] Node 22 (V8 12.4) validates Memory64 modules but its JS Memory descriptor does not accept address:'i64';
      Node is a bootstrap harness only.  The browser is the runtime host.
[UNK] wasm-tools / wabt absent; module inspection is therefore first-party (compiler/codegen bundle verifier).

## 1. Intended system (the structure this session materializes)

```text
                        USER + FABLE
                             |
                             v
        +---------------------------------------------+
        | ASCII SYSTEMS DIAGRAM  (source of record)   |
        | authored .ascii source units + this M0 file |
        +----------------------+----------------------+
                               |
              +----------------+----------------+
              |                                 |
              v                                 v
   FACTORY PLANE  [NEW]                COMPILER PLANE  [NEW]
   factory/ (Rust std crate)           compiler/ (Rust no_std crates)
              |                                 |
   StructuralDelta ---> router                  |
              |                                 |
   isolated Workpiece (git worktree)            |
              |                                 |
   stations: S-DOC S-RUST S-WEB S-FIXTURE       |
             S-BUILD S-BROWSER S-EVIDENCE       |
             S-BUNDLE                           |
              |                                 |
   FactoryReceipt[] -> independent verify       |
              |                                 |
   Integration Gate (ff-only, base unmoved)     |
              |                                 |
              v                                 |
   CANONICAL REPO (FactTest.git)  object A      |
              |                                 |
              '---- re-inspect ---> evidence    |
                                                |
              +---------------------------------+
              |
              v
   compiler/foundation   ids, spans, diagnostics, bounded arenas, json writer, sha256   [NEW]
              ^
   compiler/source       island scanner, tokens, statements, SystemAst                  [NEW]
              ^
   compiler/semantic     resolver, TypedSystemIR, invariant kernel, refinement,
                         canonical renderer, ANALYZE/BUILD                              [NEW]
              ^
   compiler/capability   obligation extraction, CapabilityLowering -> CapabilityIR       [NEW]
              ^
   compiler/implementation  contract registry dialect: ImplementationContract,
                         RepresentationContract, ConversionContract, CodegenRecipe,
                         metric evidence, H_G / H_A(E)                                  [NEW]
              ^
   compiler/planning     CandidateStrategy planner (objective dispatch, strength)       [NEW]
              ^                      \
   compiler/verifier     independent verifier; sole owner of VerifiedStrategy;          [NEW]
                         ProofCertificate / StrategyCertificate
              ^
   compiler/codegen      CodegenRecipe engine, wasm64 binary emitter, host membrane
                         templates, selector, shell/manifest/sw, GeneratedBundle,
                         BundleVerifier + BundleCertificate                             [NEW]
              ^
   compiler/kernel       phase facade + bootstrap ABI (C14)                             [NEW]
              ^
   compiler/wasm-abi     wasm64 cdylib exporting the ABI (B9-B11)                       [NEW]
              ^
   host/factc            std CLI driver: files in, artifacts out (no semantics)         [NEW]
              |
              v
   GENERATED WEBAPP  object B  (host/ templates -> evidence/.../bundle)                  [NEW]
     wasm64 module + membrane.js adapters + selector.js + runtime.js
     + index.html + manifest + sw.js + bundle.json lineage
              |
              v
   RUNTIME PLANE (Chromium, Playwright-driven S-BROWSER station)                         [NEW]
     MachineEpoch -> AdmissionReceipt -> ActivationReceipt -> ActivePlan
     -> RuntimeEvidence -> ObservationDelta -> evidence tape
              |
              v
   factc observe -> OBSERVED ASCII -> USER + FABLE
```

## 2. Compiler flow (must match CURRENT FLOW in the prompt)

```text
ASCII -> SourceArtifact -> SystemAst -> ResolvedSystem -> TypedSystemIR
  -> ObligationSet + CapabilityIR
  -> contract registry (data) -> representations + explicit conversions -> H_G
  -> machine epoch admissions (data) -> H_A(E)
  -> CandidateStrategy (planner)  -> INDEPENDENT VERIFIER -> VerifiedStrategy
  -> CodegenRecipe -> GeneratedBundle -> BundleVerifier -> BundleCertificate
  -> browser: MachineEpoch -> ActivationReceipt -> ActivePlan
  -> RuntimeEvidence -> ObservationDelta -> observed ASCII
```

## 3. Inputs, outputs, ownership

```text
INPUT                         OWNER            CONSUMER
authored .ascii source units  human/AI         compiler/source
contract registry (.ascii     compiler-plane   compiler/implementation
  islands, implementation     data (slice-
  dialect)                    specific)
metric evidence (.ascii)      fixture data     compiler/planning
machine state (.ascii)        runtime/fixture  compiler/planning (model epochs)
evidence tape (.ascii)        generated runtime compiler/kernel observe

OUTPUT                        PRODUCER         TERMINAL ROLE / CONSUMER
diagnostics.json              kernel           human/AI, factory receipts
canonical.ascii               semantic         human/AI witness (L19/L20)
typed-ir.json, capability-ir  kernel           inspection lineage
strategy.json + certificates  planner/verifier codegen, inspection
bundle/*                      codegen          browser runtime, BundleVerifier
bundle-certificate.json       BundleVerifier   S-BROWSER precondition
runtime-evidence.json + tape  generated app    S-EVIDENCE, factc observe
observed.ascii                kernel observe   human/AI (terminal)
FactoryReceipt / verification factory          integration gate (terminal)
```

## 4. Bootstrap decisions (explicit, reducible trust)

[NEW] Bootstrap trust = Fable + Git + rustup/cargo (stable native, nightly build-std for wasm64) + Node/Playwright + Chromium.
[NEW] Kernel memory: no alloc.  Caller-owned `Workspace` with bounded arenas; capacity exhaustion is a structured
      diagnostic (WORKSPACE_EXHAUSTED / OUTPUT_TOO_SMALL).  First-party allocator remains [GAP].
[NEW] Kernel inputs use the semantic-island scanner for every input class (source, contracts, metrics, machine state,
      evidence tape).  Contract/metric/evidence islands are a separate implementation-plane dialect, never source
      language semantics.  Unknown keywords are errors in every dialect.
[NEW] Kernel outputs: JSON text (first-party writer), canonical ASCII, wasm bytes, JS/HTML text.  Artifact identity =
      SHA-256 (first-party) over bytes.
[NEW] Codegen emits the wasm64 module bytes directly (first-party emitter), so the generated WebApp never depends on
      cargo.  The compiler kernel itself is additionally built for wasm64 (B9-B11) to prove the ABI in the browser.
[NEW] Goal aggregation over a multi-edge variant = SUM of per-implementation metric values; any unknown value makes
      the variant metric UNKNOWN (never zero).  Grammar carries no aggregation syntax; recorded as compiler-plane rule.
[NEW] Canonical repository for this session = branch claude/facttest-materialization-27amc7 (session authority);
      main is not touched.
[NEW] Workpieces = git worktrees under /home/user/factory-workpieces/<workpiece_id>, detached at canonical_base.
[NEW] Integration = fast-forward only, guarded by `current head == canonical_base`.

## 5. Invariants carried

[INV] no_std kernel crates; no third-party crates anywhere (factory/host are std but first-party).
[INV] wasm64-unknown-unknown only; BundleVerifier rejects i32-address memories.
[INV] planner crate cannot name VerifiedStrategy's constructor (Rust privacy + crate DAG).
[INV] codegen accepts VerifiedStrategy only.
[INV] runtime selects only emitted variants; no compiler in the bundle.
[INV] evidence never rewrites source; observed ASCII is a derived view.
[INV] geometry/prose create no semantics (island scanner is the only semantic entry).

## 6. Tests / evidence attached

BOOTSTRAP-TESTS B0-B12, LANGUAGE-TESTS L0-L35, PASS5-TESTS, PASS6-TESTS (all sections), COMMISSIONING-PROOF S/L/A/V/C/R.
Evidence rungs: CLAIMED -> CHECKED -> BUILT -> STATIC VERIFIED -> BUNDLE VERIFIED -> RUNTIME ADMITTED -> EXECUTED
-> CORRECT OUTPUT -> LOSS/RECOVERY WITNESSED -> OBSERVED ASCII.

## 7. Structural check

- required inputs supplied: source (COMMISSIONING-ASCII.md), fixture (COMMISSIONING-FIXTURE.md), contracts (to be
  materialized as slice data), toolchain (observed), browser (observed)              PASS
- outputs have consumers or terminal roles (table above)                              PASS
- types/contracts match owner contracts (C1-C19, Pass 4/5/6 schemas)                  PASS
- forbidden bypasses absent: no AGENT->REPO path; all mutation via workpiece + gate    PASS
- illegal cycles absent: crate DAG foundation<-source<-semantic<-capability<-implementation<-planning; verifier and
  codegen depend on lower layers only; planning does not depend on verifier            PASS
- invariants represented (section 5)                                                  PASS
- tests/evidence obligations attached (section 6)                                     PASS

STRUCTURAL CHECK: PASS -> route to FACTORY ROUTER (bootstrap workpiece W0 first).

## 8. Unresolved

[GAP] first-party allocator (not needed; bounded arenas).
[GAP] all non-Byte-Relay capability families remain contract entries with status GAP in the registry (target preserved).
[UNK] hardware WebGPU: this host only offers SwiftShader; physical GPU hardware evidence is not obtainable here.
[GAP] Wasm shared threads (ERR-002/003) untouched.
