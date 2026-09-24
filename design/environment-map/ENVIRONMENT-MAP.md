# FactTest Computational Environment Map

STATUS: D11 - human-readable global map.  Machine form: graph.json (traversed by tests/envmap/envmap.mjs).
Generated companions: AUTHORITY-REGISTER.md (every authority node), TRACEABILITY.md (authority -> constraint -> fact ->
probe -> evidence per fact, stale relations, conflicts).  Schema: SCHEMA.md.  Evidence of the map machinery itself:
evidence/D11/.  Nothing here repairs production, adds a capability, pins a toolchain or rewrites earlier evidence.

Reading rule: a box is claimable only down to the deepest rung that has PHYSICAL evidence in a named environment.
Status marks: [RUN] executed and observed, [OBS] observed (not an execution claim), [ERR] contradiction, [GAP] missing
mechanism/probe/evidence, [UNK] not established.

## 1. Global map

```text
╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║  EXTERNAL AUTHORITY (48 nodes)                                                                        ║
║   STANDARD_RELEASE  WebAssembly Core Release 3.0: addrtype, memtype, binary limits, changes "64-bit"  ║
║   EDITOR_DRAFT      Wasm JS API L2 (memories, validate, internal storage), Wasm Web API L2 (streaming)║
║                     WebGPU (navigator.gpu [SecureContext], requestAdapter, fallback adapter, adapter   ║
║                     expiry, requestDevice, lost, lose the device, destroy, maxBufferSize), WGSL,        ║
║                     Secure Contexts (is-origin-trustworthy)                                            ║
║   LIVING_STANDARD   HTML (workers, hardwareConcurrency, crossOriginIsolated/SharedArrayBuffer)         ║
║   PROPOSAL          Wasm Threads, Shared-Everything Threads                                            ║
║   RUST_REFERENCE / TOOL_DOC / TARGET_DOC   no_std, Cargo build-std (unstable), rustc wasm64 (Tier 3)   ║
║   IMPLEMENTATION_DOC / _SOURCE  rustc target spec, SwiftShader README, Chromium swiftshader.md and     ║
║                     gpu/gl/content switches, V8 flags, installed Playwright 1.56.1                      ║
║   PROJECT_LAW       FACTORY-LAW, FACTORY-CONTRACTS, PASS1 FT-003, PASS6, RUNTIME-ADMISSION-REPLAN,    ║
║                     EVIDENCE-OBLIGATIONS, PLANNER-COST-MODEL                                          ║
║   identity per node: exact_url + fragment (CURRENT; reopen DENIED for 37/48 in D11: egress policy)     ║
║                      + reproducibility_pin repo@commit path sha256 (SOURCE opened 2026-09-24)          ║
║   fragment drift found: js-api "#internal-storage" is not an id in the source [ERR]                    ║
╚══════════════════════════════╤═══════════════════════════════════════════════════════════════════════╝
                               │ AUTHORIZES / DEPENDS_ON / CONFLICTS_WITH (ERR-001, ERR-002, ERR-003, OBS-D11-1)
                               ▼
╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║  PROJECT CONSTRAINT (37 nodes)                                                                        ║
║   LEDGER: FT-001..003, RS-001..003, WA-001..005, WB-001/002, GPU-001..003, SEC-001, THREAD-001/002    ║
║   PROPOSED by traversal (returned to ASCII): EM-001 navigator.gpu needs secure context; EM-002 fallback║
║   adapter != hardware; EM-003 adapter single-use/expiry; EM-004 wasm64 assumes 4 merged proposals;     ║
║   EM-005 toolchain recorded never pinned; EM-006 GPU flags are implementation switches; FT-004 git     ║
║   commit/worktree/ff-only; FT-005 literal surfaces; FT-006 physical E0->E1 class                        ║
║   CONTRACT families (kind=contract): CPU_WASM64, WEBGPU (READY-CONTRACT); WORKER_DEDICATED (GAP);      ║
║   WASM_SHARED_THREADS (ERR); 5 sensor families citing document roots (coarse, Q12)                     ║
╚══════════════════════════════╤═══════════════════════════════════════════════════════════════════════╝
                               │ REQUIRES / GOVERNS
                               ▼
╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║  COMPUTATIONAL FACT (37 nodes)   what FactTest is entitled to claim, and where                         ║
║                                                                                                       ║
║  TRACE 1  RUST -> WASM64                                                                              ║
║   [RUN] 12-crate graph compiles with core only (wasm64, dev+release)      ENV-D9-HOST only            ║
║   [RUN] kernel module declares I64 memory, no imports                     ENV-D9-HOST, ENV-D1-D3-HOST ║
║   [RUN] Chromium 141 instantiates it, abi_version 1                       ENV-D1-D3-BROWSER (default) ║
║   [RUN] memory64 module validates in the browser                          ENV-D6-D7-BROWSER-*         ║
║   [RUN] CPU_WASM64 admitted at E0 and E1, payloads exact                  ENV-D6-D7-BROWSER-GPUFLAGS  ║
║   [OBS] Node 22 / V8 12.4 cannot compile the module                       ENV-D1-D3-HOST             ║
║   [ERR] workspace not natively buildable as a whole (wasm-abi)            D9 T9-P2-02 / P3-02        ║
║   [ERR] default-members 13/14: "full suite" was overstated                 D9 T9-P1-01               ║
║   [GAP] toolchain never pinned; nightly seen in 3 states (6bb1652a0 D1-D3+D11, 6eeff9a52 D9)          ║
║   [OBS] nightly clippy absent on ENV-D11-HOST -> D9 T9-P3-04 valid for ENV-D9 only                     ║
║   [GAP] streaming/MIME delivery (WA-004) never probed                                                  ║
║                                                                                                       ║
║  TRACE 2  WEBGPU                                                                                      ║
║   [RUN] http://127.0.0.1:<port> is a secure context (loopback trustworthy)                              ║
║   [RUN] navigator.gpu exposed with and without GPU flags (presence only)                               ║
║   [RUN] default launch: requestAdapter null -> WEBGPU REJECTED (no fake evidence)                       ║
║   [RUN] GPU flag set: adapter vendor google / architecture swiftshader; isFallbackAdapter true (D11)    ║
║   [RUN] known-answer buffer roundtrip; relay payloads A,B exact at E0 via plan 1                        ║
║   [RUN] destroy() -> lost "destroyed" -> E1: WEBGPU REJECTED, plan 1 stale                              ║
║   [RUN] reselection to plan 0 (CPU_WASM64) with no codegen, bundle unchanged  ─ FALLS_BACK_TO ─┐        ║
║   [OBS] maxBufferSize 1 GiB (spec default 256 MiB)                                            │        ║
║   [GAP] WGSL never compiled/dispatched (relay = buffer copies)                                  │        ║
║   [UNK] hardware GPU: no host exposed a non-fallback adapter (SwiftShader != hardware)          │        ║
║   [ERR] shared/threaded Wasm not admitted (agent-local JS embedding; crossOriginIsolated false) │        ║
║   [GAP] workers / hardwareConcurrency never probed                                             │        ║
║                                                                                              ◄┘        ║
║  TRACE 3  FACTORY EXECUTION ENVIRONMENT                                                               ║
║   [RUN] every delta D0..D10 mutated only a detached worktree at canonical_base; ff-only integration     ║
║   [OBS] surfaces are literal ('*' | 'dir/' | file); [GAP] S-FIXTURE "compiler/*/tests/" and            ║
║         "compiler/*/src/" match nothing (D9 GAP, re-witnessed by the D11 paths probe)                  ║
║   [GAP] station commands inherit the container toolchain; receipts D0-D8 carry no toolchain identity   ║
║   [GAP] heuristic nostd-check/depcheck remain (weight none)                                             ║
║   [ERR] D9 historical-claim audit preserved (overstated wording)                                       ║
║   [UNK] published authorities not re-opened (egress denied); source pins verified instead              ║
╚══════════════════════════════╤═══════════════════════════════════════════════════════════════════════╝
                               │ REQUIRES / EXPOSED_BY / BUILT_WITH / STALE_IF(dimension)
                               ▼
╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║  ENVIRONMENT (10 nodes)                                                                               ║
║   PHYSICAL_HOST     ENV-D1-D3-HOST  nightly 6bb1652a0 (D1-D3)     identity partial (no OS/CPU/cargo)   ║
║                     ENV-D9-HOST     nightly 6eeff9a52 + clippy    identity partial (no OS/CPU)        ║
║                     ENV-D11-HOST    nightly 6bb1652a0, no clippy; node 22.22.2/V8 12.4; Playwright      ║
║                                     1.56.1 -> Chromium 141.0.7390.37 rev 1194; Ubuntu 24.04.4; 4 vCPU; ║
║                                     no /dev/dri; egress policy (denied hosts recorded)   complete       ║
║   PHYSICAL_BROWSER  ENV-D1-D3-BROWSER (default launch, UA only)                                        ║
║                     ENV-D6-D7-BROWSER-GPUFLAGS (flags recorded; no revision/V8/isFallbackAdapter)      ║
║                     ENV-D6-D7-BROWSER-DEFAULT                                                         ║
║                     ENV-D11-BROWSER-GPUFLAGS / -DEFAULT (CDP product/revision/jsVersion 14.1.146.11,  ║
║                                     isSecureContext, crossOriginIsolated, SAB, adapter incl. fallback) ║
║   SYNTHETIC_MODEL   ENV-MODEL-E0 / ENV-MODEL-E1 (fixture epochs; never execution)                     ║
╚══════════════════════════════╤═══════════════════════════════════════════════════════════════════════╝
                               │ PROBED_BY / EVIDENCED_BY / ADMITTED_BY / INVALIDATED_BY
                               ▼
╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║  PROBE (23) -> EVIDENCE (38)                                                                          ║
║   static:  nostd-graph, wasm-inspect, compile-fail-diag, deps-audit, selection-audit, toolchain-id    ║
║   runtime: wasm64 discover/request/known-answer, secure-context, webgpu discover/request/known-answer,║
║            relay-exact, controlled-loss, bundle-unchanged, kernel-host-browser, node-instantiate       ║
║   factory: workpiece-verify, paths-literal                                                            ║
║   map:     authority-fetch, host-identity, browser-identity                                           ║
║   evidence carries: probe_ref, environment_ref, artifact sha256 (from evidence/<delta>/index.json),   ║
║            epoch, status, evidence_class (PHYSICAL_* vs SYNTHETIC_MODEL never mixed)                  ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

## 2. Stale relations (what a change makes unclaimable)

```text
toolchain.nightly.rustc_commit   core-only graph, kernel module identity, D9 T9-P5/P8 records, D1 B9 records
toolchain.nightly.components     core-only graph (rust-src), D9 T9-P3-04 (clippy)  <- already stale on ENV-D11-HOST
toolchain.stable.rustc_release   compile-fail witnesses (message wording), native matrix, the wasm-abi native [ERR]
dependency_graph_identity        first-party graph verdict
browser.product / revision       every browser [RUN] (D1 B10-B11, D6/D7 physical, D9 T9-P8-03)
browser.flags                    SwiftShader adapter, E0 WEBGPU admission/known-answer/relay, maxBufferSize
browser.js_engine                memory64 discovery, ABI execution
host.gpu_device_node             a hardware adapter would make the SwiftShader facts different facts
origin_security.*                navigator.gpu exposure; loopback secure context
network_egress.policy            authority reopen status
repo.commit                      every IMPLEMENTATION node; the literal path rule and the dead surfaces
authority.source_commit          every extracted consequence (re-extract when a pin moves)
```

## 3. Answers the graph must give (queries Q01..Q15; evidence/D11/queries/)

Q01 why believe X / Q02 which authority / Q03 which subclauses / Q04 which environment / Q05 which evidence executed it
(per fact) - Q06 stale if rustc changes - Q07 stale if Chromium changes - Q08 secure-context claims - Q09 authority
without probe - Q10 probe without constraint - Q11 evidence with incomplete environment identity - Q12 coarse contract
citations - Q13 single-epoch [RUN]s - Q14 proposal mistaken for baseline - Q15 implementation documentation mistaken
for standards law.  The observed answers and their comparison with the predictions are in
design/materialization/D11-OBSERVED-ENVIRONMENT-MAP.md.

## 4. What FactTest is entitled to claim (summary derived from the graph, not a new claim)

- The Byte Relay compiles to a wasm64 module with an i64 memory and executes in Chromium 141.0.7390.37 headless on a
  loopback secure context; with the recorded GPU flag set it executes on a SwiftShader fallback adapter, survives a
  controlled device loss and reselects the pre-emitted Wasm variant without codegen.  Each of these is a [RUN] for the
  named environment only (Q13) and stale under the dimensions above.
- The compiler graph is no_std by compiler enforcement (core-only wasm64 build) for nightly 6eeff9a52 (D9); the same
  proof for nightly 6bb1652a0 exists only for the D1-D3 six-crate graph.  No toolchain is pinned [GAP].
- Nothing in FactTest has executed on hardware GPU [UNK], a WGSL shader [GAP], a streamed application/wasm response
  [GAP], a Worker [GAP], or shared Wasm memory [ERR].
- The authorities cited are hyperlink-connected to pinned sources (40 pins verified by sha256), but the published
  renderings were not re-opened in D11 [UNK]; one cited fragment does not exist in the current source [ERR].

## 5. Later evidence epochs (added by D13; sections 1-4 above are the D11 epoch as written)

```text
EPOCH  DELTA                              ADDED                                                       SOURCE
D12    D12-SELF-HOSTING-ARCHITECTURE      2 environments (ENV-D12-HOST, ENV-D12-BROWSER-PERSISTENT),   epochs/D12.json
       (52d7d14)                          14 probes, 16 evidence, 16 facts (13 primitive probes, kernel
                                          drift, githack [UNK], no Factory WebApp [GAP]), 16 authorities
                                          pinned by commit (DENIED published hosts)
D13    D13-REPO-HYGIENE                   ENV-D13-HOST-PINNED, pinned proof sets, literal surfaces,        epochs/D13.json
                                          status inventory, live handoff, workpiece audit; CON-EM-007
                                          CONFLICTS_WITH CON-EM-005 (the D11 "never pinned" rule is
                                          superseded prospectively: the toolchain IS pinned from D13);
                                          FACT-KERNEL-IDENTITY-INSTALL-PATH [GAP]
```

Section 4's sentence "No toolchain is pinned [GAP]" is true of the D11 epoch and is superseded by D13
(FACT-TOOLCHAIN-PINNED; FACT-TOOLCHAIN-DRIFT INVALIDATED_BY EV-D13-PINS).  Query Q16 lists every epoch's additions.

## 6. Authority frontier epoch D14 (added by D14-FRONTIER-REOPEN)

```text
D14    D14-FRONTIER-REOPEN     64 AUTHORITY_REVISION nodes (published rendering + source tip vs pin + fragment +
                               clause + maturity), AUTH-WASM-PROPOSALS-REGISTRY, ENV-D14-HOST, 5 frontier facts;
                               epochs/D14.json.  Q17 lists what moved and which claims may now be stale.
```


## 7. Foundational clause epoch D15 (added by D15-FOUNDATIONAL-SEMANTICS)

```text
D15    D15-FOUNDATIONAL-SEMANTICS  60 CLAUSE nodes over 11 traces (Rust no_std/build-std/wasm64, Wasm memory64 + JS
                               API BigInt membrane, streaming, threads/COI/canBlock, Web IDL, secure context vs opaque
                               origin, SW lifecycle, Permissions Policy, storage/OPFS/IDB/locks, manifest, git), 10
                               document-level AUTHORITY nodes, 6 PROPOSED constraints, 5 facts; epochs/D15.json.
                               Q18 walks every claim to COMPLETE or its first broken step.
```

## 8. Capability universe epoch D16 (added by D16-CAPABILITY-UNIVERSE)

```text
D16    D16-CAPABILITY-UNIVERSE     33 CAPABILITY_FAMILY nodes (G = CAPABILITY-MATRIX.md, every row kept), 90 CLAUSE
                                   nodes over 18 new capability authorities, an exposure census of 32 families in
                                   ENV-D16-BROWSER (HeadlessChrome 141), 2 PROPOSED constraints; epochs/D16.json.
                                   Q19 walks every family API -> ... -> EVIDENCE and names its first gap.
```

## 9. Implementation reality epoch D17 (added by D17-IMPLEMENTATION-REALITY)

```text
D17    D17-IMPLEMENTATION-REALITY  19 IMPLEMENTATION_BEHAVIOR nodes on 44 clauses pinned to the versions run (Chromium
                                   141.0.7390.37, V8 14.1.146.11 / 12.4, SwiftShader, rust nightly 6eeff9a52 + cargo +
                                   LLVM, Playwright 1.56.1); kernel section identity under two install names; label audit
                                   (6 MISLABEL [ERR] facts for D18); epochs/D17.json.  Q20 separates and connects
                                   standards law, implementation behaviour and observed runtime.
```

## 10. Reconciliation epoch D18 (added by D18-REPO-RECONCILIATION)

```text
D18    D18-REPO-RECONCILIATION     36 RECONCILIATION nodes re-examine every Q17 fact, moved authority and D17 carried
                                   item; 15 supersessions (11 authorities re-pinned or re-located, 4 facts restated) with
                                   their inherited edges; 19 constraints ledgered (LEDGERED_IN LAW-CONSTRAINT-LEDGER);
                                   6 label findings and the implementation-pin [ERR] resolved; kernel identity defined as
                                   the exec identity; 2 implementation clauses; epochs/D18.json.  Q21 is the current model.
```

## 11. Repair epoch D18R (added by D18R-CHAIN-REPAIR)

```text
D18R   D18R-CHAIN-REPAIR           R-52 supersedes FACT-WORKERS-D18 (its "hardwareConcurrency was never read" contradicted
                                   D11/D16 evidence) by FACT-WORKERS-D18R; R-53 corrects the reading of the D12
                                   executable field (default path, not the launched binary); epochs/D18R.json.
```

## 12. Re-proof epoch D19 (added by D19-REPROVE-REOBSERVE)

```text
D19    D19-REPROVE-REOBSERVE       the current environment identity (ENV-D19-HOST, ENV-D19-BROWSER-DEFAULT,
                                   ENV-D19-BROWSER-GPUFLAGS, ENV-D19-SOURCES) compared with every stale condition of the
                                   current claims; the minimum affected set re-proved physically (qualified proof, kernel
                                   sections, browser identity, clause re-verification, frontier reopen, lineage, paths);
                                   D18 obligations fulfilled; epochs/D19.json.  Q22 is the entitled-claim surface.
```

## 13. Joined line D14-RESCAN and epochs D20-SYNC, D20 (added by D20-MAIN-SYNC)

```text
D14-RESCAN  D14-TECHNICAL-REFERENCE-RESCAN   the line merged into main by pull request #5 (same base as D14..D19):
                                             Pages-branch retrieval route, fixtures/reference/ corpus (83 copies), D11
                                             pins re-checked, 56 authorities reopened; its epoch file relabeled on merge
D20-SYNC    D20-MAIN-SYNC                    reconciliation of the two lines (R-54..R-63): published frontier narrowed,
                                             D11 denial and two fragment [ERR]s resolved, pin head relation dropped, 10
                                             edges carried to D18 successors, 7 drifted fragments and CON-EM-D14-001
                                             open for the owner
D20         D20-MAIN-SYNC                    second re-proof: the selection on the joined graph (the other line's claims
                                             on its own inputs, D19's process facts by replay, the lineage with the sync
                                             merge, clauses and frontier at moved tips); Q22 on the joined model
```

## 14. Execution-manifest epoch D21 (added by D21-EXECUTION-MANIFEST)

```text
D21    D21-EXECUTION-MANIFEST      the current executable FactTest enumerated from the joined repository: every tracked
                                   path tiered, every live component connected to its owner, consumers, stations, tests,
                                   probes and claims; ten implementation nodes added for components the graph had not
                                   covered; the issue inventory (A..G) classified before any repair; epochs/D21.json.
                                   D22-D26 execute the enumerated components and add their execution epochs.
D21R   D21R-MANIFEST-REPAIR        the D21 re-inspection refused: the manifest builder read its own epoch after
                                   integration (two findings and the epoch list changed).  Repaired (own-epoch
                                   exclusion) and witnessed by tests/manifest/rebuild-check.sh at 910fdbf with the
                                   committed and the repaired builder; epochs/D21R.json (one [RUN] fact, four records).
D22    D22-FACTORY-SELF-QUALIFICATION  the Factory attacked with every refusal reason of the prompt (29 law witnesses +
                                   the import collision witness): six accepted attacks reproduced with the committed
                                   Factory and repaired in ops.rs (receipt integrity, identity probes, command and
                                   canonical confinement); the judge built from the tree identified; epochs/D22.json
                                   (three [RUN] facts, five records).  Judge of D23-D26.
```
