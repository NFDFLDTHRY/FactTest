# D17 - Intended Implementation Reality

STATUS: INTENDED ASCII (assembled before routing; source of record for delta D17-IMPLEMENTATION-REALITY, workpiece W19)
REQUEST: design/materialization/D14-D19-TECHNICAL-REFERENCE-REVIEW-PROMPT.md, pass D17 ("What do the actual
implementations FactTest depends on currently do?").  Input: D16-OBSERVED-CAPABILITY-UNIVERSE.md (census implementation
signals), D15 carried questions (SAB global source, git tree order), Q18 (GPU-ADAPTER-SWIFTSHADER stops at PIN).
SCOPE: pin every implementation source to the VERSION FACTTEST RAN (not a branch tip), record each implementation
behaviour with its source pin, version, environment dimension, relation to standards law, the observed facts it explains
and its stale condition; search FactTest's claims for the five mislabel patterns.  No law document, earlier node or D0-D16
evidence is edited; corrections are proposals for D18.

## 0. Observation before drawing

```text
HEAD            e4e2103 (D16 integrated, pushed); tree clean
versions run    HeadlessChrome/141.0.7390.37 = chromium tag 141.0.7390.37 = commit 9f043f63 (census and D12 identity);
                Playwright 1.56.1 installs chromium-headless-shell rev 1194 and launches it for every headless run;
                DEPS@9f043f63: v8 ad8af0fc (= tag 14.1.146.11), dawn 9caf493, swiftshader 7cd1022; Node v22.22.2 runs V8
                12.4.254.21-node.39 (base tag 12.4.254.21 = 8ab91836); rustc nightly-2026-09-24 = 6eeff9a52 (LLVM 23.1.1,
                rust-lang/llvm-project 1b9c0d5 per the src/llvm-project submodule), cargo 98a09e7e7
sources         all read at those pins through raw.githubusercontent.com (Chromium, V8, SwiftShader, rust, cargo,
                rust-lang/llvm-project) or from the installed package (Playwright); the Dawn mirror answers 404 at 9caf493 [GAP]
assembly run    44 implementation clauses VERIFIED (29 source documents); kernel rebuilt twice (pinned install name; same
                toolchain bind-mounted under D9's name in a private mount namespace): 6f25ce43 vs 309589947e, ONLY the
                custom "name" section differs, every other section identical (e8d65826...); label audit 12 findings, 12
                locations proven verbatim, 6 MISLABEL
harness change  clauses.mjs/lib.mjs read a pinned commit or an installed file (sourceKey); build-clauses carries local
                pins; envmap: clause_connected counts SOURCED_BY, Q18's EXACT CLAUSE step also accepts implementation
                clauses reached through a behaviour that EXPLAINS the claim (labelled "implementation"); D15/D16 epochs
                rebuild byte-identically and the D16 graph answers Q18 exactly as D16 recorded
```

## 1. Implementation behaviours (each rests on VERIFIED clauses pinned to the version run)

```text
BEHAVIOUR                           RELATION TO STANDARD       SOURCE (pin)                          EXPLAINS (observed)
IB-GPU-LINUX-SERVICE-OFF            PLATFORM_DEFAULT (CL-GPU3   gpu_finch_features.cc@9f043f63:       GPU-ADAPTER-NULL-DEFAULT, census
                                    conforms: null lawful)      WebGPUService off except Apple/Win/   WebGPU adapter null
                                                                ChromeOS/Android
IB-GPU-UNSAFE-SWITCHES              FLAG_GATED                  gpu_switches/gl_switches/finch@141:   GPU-ADAPTER-SWIFTSHADER, GPU-ADMITTED-E0,
                                                                unsafe-webgpu, ignore-gpu-blocklist,  GPU-KNOWN-ANSWER, GPU-RELAY-EXACT-E0
                                                                use-angle, unsafe-swiftshader (WebGL!), Vulkan (Android-only default)
IB-GPU-SOFTWARE-FALLBACK            CONFORMS (CL-GPU8)          gpu_util.cc: Software under           GPU-ADAPTER-SWIFTSHADER,
                                                                SwiftShader; gpu_adapter.cc: fallback HARDWARE-GPU-UNAVAILABLE
                                                                = AdapterType::CPU; SwiftShader README: CPU Vulkan; DEPS pins
IB-SAB-CONSTRUCTOR-HOOK             HOST_CHOICE_PERMITTED       v8_initializer.cc: constructor only   SAB-GLOBAL-HOST-DEFINED (D15 asked for
                                    (CL-T6; CL-T4 serialization) if SharedArrayBufferTransferAllowed this source), census SAB ABSENT,
                                                                                                      SHARED-THREADS-UNADMITTED
IB-BLUETOOTH-PLATFORM-DEFAULT       PLATFORM_DEFAULT            WebBluetooth "default": experimental  census Bluetooth ABSENT
IB-SENSOR-EXTRA-CLASSES             EXPERIMENTAL_NOT_SHIPPED    SensorExtraClasses experimental;      census Magnetometer / Ambient ABSENT
                                                                IDLs RuntimeEnabled=SensorExtraClasses
IB-DO-REQUESTPERMISSION-UNSHIPPED   EXPERIMENTAL_NOT_SHIPPED    DeviceOrientationRequestPermission    census: requestPermission undefined
                                    (deviates from CL-DO2;      experimental
                                    consistent with CL-DO4 at risk)
IB-WEBNN-OFF-BY-DEFAULT             FLAG_GATED                  kWebMachineLearningNeuralNetwork      census WebNN ABSENT
                                                                default_state = false
IB-PROXIMITY-UNIMPLEMENTED          NOT_IMPLEMENTED             no proximity IDL in idl_in_modules    census Proximity ABSENT
IB-DEVICE-APIS-SHIPPED              SHIPPED                     WebHID/Serial/WebUSB/WebXR stable     census HID/USB/Serial/XR EXPOSED
IB-PLAYWRIGHT-HEADLESS-SHELL        TEST_HARNESS_CHOICE         chromium.js: headless ->              every browser fact (headless shell,
                                                                chromium-headless-shell; browsers.json rev 1194   not the Chrome browser)
IB-HEADLESS-PERMISSIONS-ASK         TEST_HARNESS_CHOICE         headless_permission_manager.cc: every SH-STORAGE-BEST-EFFORT, census
                                                                status and request = ASK              'prompt' states
IB-CHROME-DURABLE-STORAGE [UNK]     HOST_CHOICE_PERMITTED       durable_storage_permission_context.cc: SH-STORAGE-BEST-EFFORT (why it is not
                                                                grant to installed / important sites  a statement about installed Chrome)
IB-PLAYWRIGHT-DEFAULT-SWITCHES      TEST_HARNESS_CHOICE         --disable-field-trial-config;         SH-ORIGIN-SCOPED-STORAGE, policy census
                                                                ThirdPartyStoragePartitioning disabled
IB-V8-MEMORY64-VERSIONED            VERSION_SPECIFIC            V8 14.1: no memory64 flag (shipped);  MEMORY64-DISCOVERED, NODE-NO-MEMORY64
                                                                V8 12.4: memory64 experimental, off
IB-V8-SET-EXPERIMENTAL              EXPERIMENTAL_NOT_SHIPPED    V8 14.1 V(shared, ..., false)         WASM-SET-PHASE-1
IB-RUSTC-PIN-EQUALS-TIP             TOOLING                     target spec + platform doc @6eeff9a52 WASM64-MODULE-I64, CORE-ONLY-GRAPH
                                                                byte-identical to D15's tip reads (ERR-001 holds for the toolchain run)
IB-KERNEL-NAME-SECTION-HASH         TOOLING                     cargo detect_sysroot_src_path;        KERNEL-IDENTITY-INSTALL-PATH (D13 GAP),
                                                                LLVM getPromotedName: ".llvm." +      KERNEL-EXEC-SECTIONS-INSTALL-INDEPENDENT
                                                                module hash
IB-PLATFORM-SURFACES-UNOBSERVED [UNK] PLATFORM_DEFAULT          finch/runtime features: Android/ChromeOS/Mac/Win defaults differ; only Linux observed
```

## 2. Findings

```text
R1 [NEW]  every census absence of D16 has a pinned implementation cause (6/6): SharedArrayBuffer (constructor hook),
          WebNN (feature off), Magnetometer + Ambient light (SensorExtraClasses experimental), Proximity (no IDL at all),
          Bluetooth (Linux default experimental).  Only Proximity's absence coincides with an authority statement of
          non-implementation; the others are Chromium/Linux choices, not standards facts
R2 [NEW]  WebGPU on Linux: WebGPUService is OFF by default (on only for Apple/Win/ChromeOS/Android); FactTest's adapter
          exists only under the unsafe switch set, SwiftShader makes it a Software/CPU fallback adapter.  Every WebGPU
          RUN claim is bound to that switch set (the graph already records browser.flags; D17 names the source)
R3 [NEW]  the headless shell answers ASK to every permission: persist() can never succeed there, whereas full Chrome
          grants durable storage to installed or important sites.  D12's "storage best-effort" describes the headless
          shell; the durability of an installed Factory is [UNK], not [GAP]-by-evidence
R4 [NEW]  kernel identity: build-std compiles core from the install-named rust-src path, and LLVM suffixes promoted local
          symbols with a module hash; the physical difference between install names is confined to the custom "name"
          section (FACT-KERNEL-EXEC-SECTIONS-INSTALL-INDEPENDENT [RUN]); D13's [GAP] narrows to debug names (D18:
          define the kernel identity over non-name sections, or strip names; D19 re-proof)
R5 [ERR]  D11 pinned Chromium switch files and V8 flags at later main commits whose bytes differ from the running
          141 / 14.1.146.11 sources (FACT-IMPL-PINS-NOT-RUNNING-VERSION): an implementation authority must be pinned to the
          version run.  D17 re-establishes each switch at 9f043f63
R6 [OBS]  the rustc wasm64 target spec and platform doc at the pinned toolchain are byte-identical to D15's tips: D15's
          Rust clauses and ERR-001 hold for the toolchain FactTest runs
R7 [OBS]  Playwright disables field trials and third-party storage partitioning on every launch: every browser fact is
          observed with compiled feature defaults and unpartitioned third-party storage
R8 [GAP]  Dawn 9caf493 is not reachable through the GitHub mirror: the Dawn side of "SwiftShader -> CPU adapter" is
          unpinned (Blink's rule and SwiftShader's CPU nature are pinned)
R9 [GAP]  Service Worker and storage implementation internals beyond permissions (update scheduling, quota computation)
          are not source-traced; D12's SW facts agree with the D15 standard clauses
```

## 3. Label audit (tests/implementation/label-audit.json; every location proven verbatim at HEAD)

```text
LBL-01  CHROMIUM_AS_STANDARD   MISLABEL  TRACEABILITY (FACT-SHARED-THREADS-UNADMITTED): "SharedArrayBuffer needs
                                         cross-origin isolation" - serialization is the standard gate, the constructor
                                         hook is Chromium's
LBL-02  CHROMIUM_AS_STANDARD   OK        FACT-SAB-GLOBAL-HOST-DEFINED already says Chromium behaviour (D15)
LBL-03  SWIFTSHADER_AS_HARDWARE OK       HANDOFF: "only SwiftShader fallback adapters ever observed" [UNK]
LBL-04  SWIFTSHADER_AS_HARDWARE OK       universe.json: "adapter (SwiftShader fallback, flags)"
LBL-05  FLAG_AS_ADMISSION      OK        WebGPU admission facts: "browser.flags == GPU flag set"
LBL-06  FLAG_AS_ADMISSION      MISLABEL  HANDOFF: "Byte Relay physically commissioned in Chromium 141 (SwiftShader WebGPU +
                                         wasm64)" omits the unsafe switch set
LBL-07  FLAG_AS_ADMISSION      MISLABEL  README: "(SwiftShader WebGPU + wasm64 in Chromium 141)" (same omission)
LBL-08  V8_AS_UNIVERSAL        OK        memory64 discovery bound to browser.js_engine; Node difference recorded
LBL-09  HEADLESS_AS_INSTALLED  OK        D12 probe: "persist() returned false in this headless, non-installed environment"
LBL-10  HEADLESS_AS_INSTALLED  MISLABEL  HANDOFF: "storage best-effort, persist() false" drops the headless qualifier
LBL-11  HEADLESS_AS_INSTALLED  MISLABEL  TRACEABILITY: "Chromium 141 persistent profile" (14 facts) - the executable was
                                         the headless shell
LBL-12  IMPLEMENTATION_PIN_NOT_RUN_VERSION MISLABEL  AUTHORITY-REGISTER: chromium main 75d6f0c pins (R5)
MISLABEL findings become [ERR] facts FACT-LBL-nn with the correction for D18; OK findings are recorded in the audit
evidence and connected through the behaviours that explain the correctly labelled facts
```

## 4. Kernel builds (tests/implementation/build-kernels.sh, station S-BUILD)

```text
A  cargo +nightly-2026-09-24 (the WASM64_KERNEL_SET pin in tests/toolchain/proof-sets.json), its own install path
B  the same toolchain directory bind-mounted over the "nightly" install path in a private mount namespace (unshare -m):
   nothing on disk changes; outside the namespace "nightly" keeps its own toolchain (6bb1652a0)
both release, -Z build-std=core, RUSTFLAGS -C link-arg=-zstack-size=16777216, target dirs outside the repository
compare  tests/implementation/wasm-sections.mjs --exclude-custom name -> evidence/D17/kernel/{builds.json, sections.json}
```

## 5. Graph epoch D17 (add-only)

```text
declares  IMPLEMENTATION_BEHAVIOR {behavior_id, implementation, version, relation_to_standard, statement,
          environment_dimension, stale_if, runtime_status, label} with relation/runtime vocabularies and the implementation
          authority classes in its declaration; SOURCED_BY (-> CLAUSE), RELATES_TO_STANDARD (-> CLAUSE | CONSTRAINT,
          requires relation), EXPLAINS (-> COMPUTATIONAL_FACT)
adds      44 CLAUSE + 44 extraction EVIDENCE + summary; 26 implementation AUTHORITY nodes pinned to the versions run (Chromium
          141, V8 14.1 / 12.4, SwiftShader, cargo, rust LLVM, installed Playwright); ENV-D17-HOST, ENV-D17-TOOLCHAIN; kernel
          section PROBE/IMPLEMENTATION/EVIDENCE + FACT-KERNEL-EXEC-SECTIONS-INSTALL-INDEPENDENT [RUN]; label-audit
          PROBE/IMPLEMENTATION/EVIDENCE + 6 FACT-LBL-* [ERR]; FACT-IMPL-PINS-NOT-RUNNING-VERSION [ERR];
          FACT-D17-CLAUSES-VERIFIED [RUN]; 19 IMPLEMENTATION_BEHAVIOR; implementation-grounded STALE_IF edges on the
          explained facts (one per fact/environment/dimension not already present)
validate  + behavior_vocabulary, behavior_sourced_by_implementation (SOURCED_BY only implementation-class clauses),
          behavior_standard_is_not_implementation (RELATES_TO_STANDARD never an implementation source)
Q20       per behaviour: implementation layer (pinned clauses), standard layer (relations), runtime layer (explained facts
          + environments), stale condition; census absences with their explaining behaviours
```

## 6. Mutation plan by station (delta D17-IMPLEMENTATION-REALITY, workpiece W19, base e4e2103)

```text
F0  S-DOC       this ASCII; ledger (D16 AFTER + D17 BEFORE); delta; fixtures
F1  S-FIXTURE   tests/reference/{lib.mjs, clauses.mjs, build-clauses.mjs, d17-clauses.json}, tests/implementation/,
                tests/envmap/envmap.mjs; checks: syntax, generic tools, D15 and D16 epochs rebuild byte-identically, the
                D16 graph validates/renders/merges identically and answers Q18 as recorded
F2  S-BUILD     evidence/D17/clauses/ (exit 0 only if all 44 VERIFIED)
F3  S-BUILD     evidence/D17/kernel/ (two kernel builds + section comparison) and evidence/D17/labels/ (label audit)
F4  S-DOC       epochs/D17.json (clause fragment + reality, from Factory evidence); merged graph; views; SCHEMA section 10,
                ENVIRONMENT-MAP section 9 written inside the station run
F5  S-EVIDENCE  validate, Q01-Q20, stale, merge-check, render-check, implementation gate, Q18/Q20 gates, workpiece
                audit -> retire -> audit, evidence index
F6  S-DOC       D17-OBSERVED-IMPLEMENTATION-REALITY.md, docs/HANDOFF.md
MUST NOT CHANGE: law and pass documents, README.md (corrections are D18's), compiler/, host/, factory/ machinery,
                 fixtures/, other tests, earlier epochs, D0-D16 evidence
```

## 7. Predictions

```text
P1  F2: 44/44 VERIFIED at the pins (pinned sources cannot move; only the installed files could)
P2  F3: kernel A 6f25ce43..., B 309589947e..., differing sections exactly [custom:name], identity excluding it e8d65826...
    for both; label audit 12 findings, 6 MISLABEL, 0 unresolved
P3  epoch D17 151 nodes / 261 edges; merged 1042 / 2106; validate PASS 35 checks; D11-D16 preserved
P4  implementation gate PASS: 19 behaviours in the graph, 6/6 census absences explained, 6 MISLABEL [ERR] facts, kernel
    difference scoped to the name section
P5  Q18: 45 RUN claims (43 + KERNEL-EXEC-SECTIONS, D17-CLAUSES-VERIFIED), 14 COMPLETE; KERNEL-EXEC stops at
    IMPLEMENTATION CONTRACT (no contract names kernel identity); EXACT CLAUSE stops 4; ERR claims 11 (+6 label, +1 pins)
P6  Q20: 19 behaviours; relations PLATFORM_DEFAULT 3, FLAG_GATED 2, CONFORMS 1, HOST_CHOICE_PERMITTED 2,
    EXPERIMENTAL_NOT_SHIPPED 3, NOT_IMPLEMENTED 1, SHIPPED 1, TEST_HARNESS_CHOICE 3, VERSION_SPECIFIC 1, TOOLING 2;
    39 facts explained
P7  audit: W18 worktree RETIRABLE -> REMOVED; W18-stage KEEP (base-era graph views); after RETIRABLE 0, KEEP 6, CURRENT 2
```

## 8. Invariants

```text
I1  an implementation source is pinned to the version FactTest ran (commit or installed package), never a branch tip
I2  implementation behaviour is labelled implementation: SOURCED_BY implementation-class clauses only; RELATES_TO_STANDARD
    never an implementation source (validate)
I3  observed runtime stays environment-bound: behaviours EXPLAIN facts, they do not replace their evidence
I4  label findings are proven locations with reviewed verdicts; corrections are proposals for D18, no text edited here
I5  the kernel builds change nothing on disk outside their target directories (private mount namespace)
I6  no law document, earlier node or epoch, or D0-D16 evidence edited
```

## 9. Pass gate

```text
D17 closes when the Factory reproduces the 44 pinned clauses, the two kernel builds and the label audit, the gate passes,
and Q20 connects standards law, implementation behaviour and observed runtime for every behaviour.  Carried across the
gate: the 6 MISLABEL corrections and the implementation re-pins (D18), the kernel identity definition (D18/D19), Dawn
[GAP], SW/storage internals [GAP], installed-Chrome durability and non-Linux platforms [UNK].
```

## 10. Structural check

```text
inputs supplied        versions run (census/D12 identity, DEPS, rustc -vV, installed Playwright), sources at pins    PASS
outputs consumed       behaviours/facts -> Q18/Q20 -> D18 (corrections, re-pins, kernel identity), D19 (re-proof set)  PASS
contracts match        IMPLEMENTATION_BEHAVIOR + three edge types declared before use; layer rules enforced by validate  PASS
forbidden bypasses     no text corrected here; kernel builds cannot touch the toolchains on disk                   PASS
illegal cycles         none (behaviour -> clause / standard / fact only)                                           PASS
invariants represented I1-I6 -> pinned sources, validate checks, EXPLAINS-only, audit tool, unshare, must_not_change  PASS
tests/evidence         F1 regression, F2 extraction, F3 kernel + audit, F4 validate/merge/render, F5 gate + Q18/Q20      PASS
```

STRUCTURAL CHECK: PASS
