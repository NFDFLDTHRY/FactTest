# D11 - Observed Computational Environment Map vs Intended

STATUS: RE-OBSERVATION OF THE D11 WORKPIECE (W11 on canonical base 4a151c9ae58f9968c70b9b85cef82a02fba12b85)
LAW: this file compares design/materialization/D11-INTENDED-ENVIRONMENT-MAP.md (section 2 predictions) with what the
map machinery physically recorded under evidence/D11/ (stations F2-build and F3-browser).  The intended drawing is NOT
rewritten; every difference is preserved as [ERR]/[GAP]/[UNK].  NO PRODUCTION REPAIR, no capability implementation,
no toolchain pin and no rewrite of earlier evidence occurred in D11.

## 1. Observed system

```text
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║            D11 · COMPUTATIONAL ENVIRONMENT MAP  (observed)                                    ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝
 MAP DATA (S-DOC)              [RUN] design/environment-map/graph.json: 211 nodes (48 AUTHORITY, 37 CONSTRAINT,
                                     37 COMPUTATIONAL_FACT, 10 ENVIRONMENT, 23 PROBE, 38 EVIDENCE, 18 IMPLEMENTATION),
                                     475 edges over 14 defined types; SCHEMA.md; ENVIRONMENT-MAP.md;
                                     AUTHORITY-REGISTER.md + TRACEABILITY.md rendered by the tool
 MAP MACHINERY (S-FIXTURE)     [RUN] tests/envmap/{envmap.mjs, authority-fetch.mjs, host-identity.sh,
                                     browser-probe.mjs, bind-evidence.mjs, run-envmap.sh}; envmap.mjs names no
                                     FactTest node id (F0 check: generic over the graph)
 EXECUTE / PROBE (S-BUILD)     [RUN] validate PASS (23 checks); render-check PASS (register 47277 B, traceability
                                     45523 B identical); Q01..Q15 answered; stale 52 relations / 14 dimensions;
                                     paths-probe over 792 tracked files; host identity; authority fetch (48 records)
 EXECUTE / PROBE (S-BROWSER)   [RUN] Chromium HeadlessChrome/141.0.7390.37 revision @9f043f63b0e5b728c8d09f3e3ddfc1681a4bd58e
                                     V8 14.1.146.11, two launch configurations
 OBSERVED (S-DOC)              this file; D11 evidence bound into graph.json by bind-evidence.mjs (F4), re-validated (F5)
```

## 2. Predictions vs observed

```text
ITEM                     PREDICTED                                   OBSERVED                                                  VERDICT
validate                 PASS                                        PASS, 23 checks, 211 nodes / 475 edges                    MATCH [RUN]
render-check             PASS                                        PASS (both files byte-identical to a fresh render)        MATCH [RUN]
authority-fetch          published hosts DENIED; 40 external pins    published: DENIED 37, HTTP 3, not-network 8 (LAW files);   MATCH [OBS]
                         PIN_MATCH; tips may move                    pins: PIN_MATCH 47 (40 external + 7 project law), 0
                                                                     mismatch, 1 NO_GITHUB_PIN (installed Playwright);
                                                                     tips moved: 4 (chromium/chromium main advanced between
                                                                     assembly and station run; pins unaffected);
                                                                     denied hosts: chromium.googlesource.com, doc.rust-lang.org,
                                                                     git-scm.com, gpuweb.github.io, html.spec.whatwg.org,
                                                                     source.chromium.org, w3c.github.io, webassembly.github.io
                                                                     [OBS] the two github.com/.../blob URLs answered HTTP 403:
                                                                     their content was opened through raw.githubusercontent.com
                                                                     by commit, never through the blob page (reopen_status
                                                                     OPENED refers to the pinned source)
host identity            = intended section 0; nightly clippy ABSENT stable 1.94.1 e408947bf; nightly 6bb1652a0 2026-09-22,     MATCH [OBS]
                                                                     nightly cargo 495c385d0 2026-09-16; components cargo/
                                                                     rust-src/rust-std/rustc; clippy ABSENT; no pin; node 22.22.2
                                                                     V8 12.4.254.21; Playwright 1.56.1 -> Chromium 141.0.7390.37
                                                                     rev 1194; Ubuntu 24.04.4; 4 CPUs; no /dev/dri; 6 denied
                                                                     hosts seen by the proxy during the run
browser (gpu flags)      product 141.0.7390.37; jsVersion [UNK];     HeadlessChrome/141.0.7390.37 rev @9f043f63...; V8            MATCH [RUN]
                         secure true; gpu exposed; adapter google/   14.1.146.11; isSecureContext true; crossOriginIsolated
                         swiftshader; isFallbackAdapter true         false; SharedArrayBuffer absent; hardwareConcurrency 4;
                         expected; memory64 validates; SAB iff coi   gpu exposed; adapter {vendor google, architecture
                                                                     swiftshader, device "", description "", isFallbackAdapter
                                                                     TRUE}; 19 features; maxBufferSize 1073741824; device
                                                                     acquired, destroy() -> lost reason "destroyed";
                                                                     memory64 validates; Memory({address:"i64"}) accepted
browser (default)        gpu exposed; requestAdapter null; memory64  same product/V8; secure true; gpu exposed; adapter NULL;    MATCH [RUN]
                         validates                                   memory64 validates
paths-probe              the two S-FIXTURE wildcard entries dead     'compiler/*/tests/' and 'compiler/*/src/' match 0 of 792  MATCH [GAP] (D9 preserved)
Q01-Q05 per-fact answers 37 facts each (why believe / which      answered for all 37 COMPUTATIONAL_FACT nodes: Q01 lists probes,  MATCH
                         authority / which subclauses / which       evidence and the entitled claim per environment; Q02 the exact
                         environment / which evidence executed)     url+fragment+pin of every authority; Q03 the DEPENDS_ON closure;
                                                                     Q04 the environment identities; Q05 only PHYSICAL RUN evidence
                                                                     (synthetic excluded)  - evidence/D11/queries/Q01..Q05.json
Q06 rustc changes        non-empty                                   toolchain.nightly.rustc_commit 8, .components 3,          MATCH
                                                                     toolchain.stable.rustc_release 4
Q07 Chromium changes     non-empty                                   browser.product 19, browser.flags 6, browser.js_engine 2   MATCH
Q08 secure context       navigator.gpu facts + CON-EM-001            facts FACT-GPU-EXPOSED, FACT-GPU-ADMITTED-E0,               MATCH
                                                                     FACT-WASM64-ADMITTED-E0; CON-EM-001; AUTH-GPU-NAVIGATOR-GPU,
                                                                     AUTH-GPU-REQUESTADAPTER
Q09 authority, no probe  WA-004, WGSL, WB-001, WB-002, THREAD-*,     AUTH-WASM-WEBAPI-STREAMING, AUTH-HTML-WORKERS,              DIFFER (narrower):
                         29 GAP registry families                    AUTH-HTML-HWCONCURRENCY, AUTH-WASM-SET, LAW-PLANNER-COST-  WGSL and THREADS are
                                                                     MODEL                                                     reachable through GAP/ERR
                                                                                                                               facts that have a probe
                                                                                                                               of presence only; the 29
                                                                                                                               GAP families are not
                                                                                                                               mapped as authorities
                                                                                                                               (only 5 sensor families
                                                                                                                               as coarse contracts) [GAP]
Q10 probe, no constraint empty                                       empty                                                     MATCH
Q11 identity gaps        D0-D8 receipts; D6/D7 physical; D9 P8-03;  31 evidence nodes over ENV-D1-D3-HOST, ENV-D1-D3-BROWSER,   MATCH
                         D1 B10-B11                                  ENV-D6-D7-BROWSER-GPUFLAGS/-DEFAULT, ENV-D9-HOST; the
                                                                     D11 environments have no missing field
Q12 coarse citations     WASM_SHARED_THREADS (fragment drift);       CPU_WASM64 (rustc page root), WEBGPU (WGSL root),           MATCH (+2)
                         sensor families (roots); CPU_WASM64 root    WASM_SHARED_THREADS (js-api #internal-storage FRAGMENT_DRIFT
                                                                     [ERR] + threads root), ACCELEROMETER, GYROSCOPE,
                                                                     MAGNETOMETER, ORIENTATION_SENSOR, PROXIMITY_SENSOR (roots)
Q13 one-epoch [RUN]s     every physical browser RUN; T9-P3-04       12 facts: the E0/E1 WebGPU and Wasm64 facts, ABI execution,  MATCH
                                                                     compile-fail witness, first-party graph, ff-only integration
Q14 proposal as baseline empty                                       empty; proposals bounded by ERR-002/ERR-003 edges           MATCH
Q15 impl-doc as law      ERR-001; SwiftShader documentation gap      constraints grounded only in implementation/tool docs:       MATCH
                                                                     CON-RS-001 (Rust Reference), CON-RS-002 (Cargo book),
                                                                     CON-RS-003, CON-EM-004 (rustc target), CON-EM-006
                                                                     (Chromium switches); conflicts ERR-001, OBS-D11-1
```

## 3. Differences preserved and what returns to ASCII

```text
[ERR] AUTHORITY FRAGMENT DRIFT: REFERENCE-AUTHORITY.md, CONSTRAINT-LEDGER WA-005 and contracts.ascii cite
      https://webassembly.github.io/spec/js-api/#internal-storage; the current source (WebAssembly/spec@608711107b) has
      <h2 id="webassembly-storage"> and <h3 id="store">.  The published page could not be opened (DENIED) to confirm
      whether Bikeshed still emits an #internal-storage alias.  Law files are not edited by D11; the correction is an
      ASCII decision for REFERENCE-AUTHORITY.md / CONSTRAINT-LEDGER.md owners.
[UNK] PUBLISHED AUTHORITY NOT RE-OPENED: 37 of 48 authority nodes keep observed_date 2026-09-23 (Pass 2) with
      reopen_status DENIED; consequences were extracted from source files pinned by commit (47 pins verified by sha256).
      Until the network policy admits the hosts, "hyperlink-connected" is established at source level only.
[GAP] TOOLCHAIN NEVER PINNED (D9 T9-P7 preserved): nightly identity now observed in three states across four epochs
      (6bb1652a0 2026-09-22 for D1-D3 and D11; 6eeff9a52 2026-09-23 for D9); nightly clippy absent on this host, so D9's
      T9-P3-04 [RUN] is valid for ENV-D9 only (Q13/STALE_IF).  D11 adds no pin; authorization stays with ASCII.
[ERR] NATIVE WORKSPACE (D9 preserved): factc-wasm-abi natively unbuildable; default-members 13/14; history overstated.
[GAP] LITERAL WILDCARD SURFACES (D9 preserved, re-witnessed by evidence/D11/paths-probe.json): S-FIXTURE "compiler/*/tests/"
      and "compiler/*/src/" authorize nothing.  Registry repair belongs to a Factory delta.
[GAP] AUTHORITY WITHOUT PROBE (Q09): Wasm streaming/MIME delivery (WA-004, E-003), HTML workers and hardwareConcurrency
      (WB-001/002, E-004), shared-everything threads (proposal), PLANNER-COST-MODEL (no probe measures preference).
[GAP] WGSL never compiled or dispatched; the WebGPU relay is buffer copies only (CON-GPU-003 unexercised).
[UNK] HARDWARE GPU: every adapter observed is google/swiftshader with isFallbackAdapter true (now recorded, D11).  No
      host in any epoch exposed a non-fallback adapter; there is no hardware WebGPU execution evidence.
[ERR] SHARED/THREADED WASM (ERR-002/ERR-003 preserved): crossOriginIsolated false and SharedArrayBuffer absent on the
      served origin (no COOP/COEP); presence probe only, no admission.
[GAP] STATION ENVIRONMENT IDENTITY: D0-D8 receipts carry no toolchain identity; D6/D7 physical evidence lacks browser
      revision, V8 version, OS identity and the fallback bit; D9 P8-03 and D1 B10-B11 record no launch flags (Q11: 31
      evidence nodes).  D11's own environments are complete; earlier evidence is not rewritten.
[GAP] MAP COVERAGE: the 29 GAP registry families (WebNN, WebCodecs, camera, sensors beyond the five coarse contracts,
      storage, service worker, XR, HID, USB, Serial, Bluetooth, ...) are constraints/contracts in the law files but not
      authority nodes in graph.json; D11 mapped the three vertical traces fully and left broad expansion to a later
      delta, as the prompt orders ("fully trace ... before broad expansion").
[OBS] Q12 lists CPU_WASM64 (rustc page root) and WEBGPU (WGSL root) as coarse in addition to the predicted set: both
      cite a whole page where the extracted consequence depends on specific sections.
[OBS] chromium/chromium main advanced during the pass (4 authority tips moved); the pinned fetches still match.
[OBS] Chromium's --enable-features switch definition was not located at the pinned commit (four candidate paths 404);
      the flag stays recorded as used, with no authority node for its definition.
[OBS] Playwright 1.56.1's chromiumSwitches.js has no --disable-gpu, so the probe's ignoreDefaultArgs entry is a no-op
      for this version; the flag set that produced the SwiftShader adapter is exactly the five args recorded.
```

## 4. Match / differ

```text
intended section 2 predictions vs observed: MATCH on validate, render-check, authority pins, host identity, both browser
launches, paths-probe, Q06-Q08, Q10-Q15.  DIFFER on Q09 (observed list narrower than predicted: WGSL and the Threads
proposal are reachable through GAP/ERR facts whose presence probes exist; the 29 GAP registry families are not
authority nodes yet) -> preserved as [GAP] MAP COVERAGE above, not as a rewrite of the prediction.
intended vs observed STRUCTURE: MATCH (7 node classes with owners, 14 edge types with semantics, 3 traces, Q01..Q15,
STALE_IF conditions, D9 findings as nodes; no station forged; no production change; no pin).
The mapping pass closes as: the map is materialized and self-evidenced; the entitled claims are those listed in
ENVIRONMENT-MAP.md section 4, each bounded to its environment; 4 [ERR], 8 [GAP], 2 [UNK] remain open on the ASCII surface.
NO PRODUCTION REPAIR was performed or folded into D11.
```
