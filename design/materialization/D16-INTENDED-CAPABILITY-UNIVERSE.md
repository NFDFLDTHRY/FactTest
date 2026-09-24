# D16 - Intended Capability Universe

STATUS: INTENDED ASCII (assembled before routing; source of record for delta D16-CAPABILITY-UNIVERSE, workpiece W18)
REQUEST: design/materialization/D14-D19-TECHNICAL-REFERENCE-REVIEW-PROMPT.md, pass D16 ("For every approved capability
family in G, what does current authority actually require for legal runtime admission?").  Input:
D15-OBSERVED-FOUNDATIONAL-SEMANTICS.md, graph Q18 (the GPU claims stopped at EXACT CLAUSE), CAPABILITY-MATRIX.md (G).
SCOPE: trace every approved family API -> SECURE_CONTEXT -> PERMISSION_POLICY -> REQUEST -> FEATURES_LIMITS ->
LIFECYCLE -> LOSS -> RUNTIME ADMISSION -> PROBE OBLIGATION -> EVIDENCE at exact clauses; observe (never request) what
the one available browser exposes; classify [RUN]/[OBS]/[GAP]/[ERR]/[UNK].  No family is removed from G; no law
document, earlier node or D0-D15 evidence is edited.

## 0. Observation before drawing

```text
HEAD            3748fa7 (D15 integrated, pushed); tree clean
G               CAPABILITY-MATRIX.md: 33 rows (32 families + "Future explicit capability"); in the graph before D16 only
                the WebGPU, CPU/Wasm64, workers/threads and storage/SW surfaces had authority nodes (D11 [GAP] MAP COVERAGE)
sources         18 capability documents resolved to repositories and read at their tips: gpuweb/gpuweb 454d33c (== pin),
                webmachinelearning/webnn 59db71f, w3c/webcodecs 91160a4, w3c/mediacapture-main e0bde22, w3c/sensors
                a461478, w3c/{accelerometer 9f0a66d, gyroscope 335dc6e, magnetometer 40801a2, orientation-sensor 89ae046,
                proximity 1d43739, ambient-light 381d5dd, deviceorientation 70d42d5, geolocation 4aebf6e},
                immersive-web/webxr 53b2903, WICG/webhid b5e588e, WICG/webusb 3dcc3c2, whatwg/serial 600bbf1 (WICG/serial
                answers the same tip: Serial moved to WHATWG), WebBluetoothCG/web-bluetooth 2e451c1; plus the D15
                documents (HTML, Storage, FS, IndexedDB, Service Workers, WebAssembly JS API)
assembly run    tests/reference/clauses.mjs over tests/reference/d16-clauses.json: 90 clauses, 90 VERIFIED (3 windows/anchors
                corrected during assembly; every clause's enclosing section reviewed); tests/capability/census.mjs in
                HeadlessChrome/141.0.7390.37 (V8 14.1.146.11), default launch, http://127.0.0.1 (secure, not isolated):
                32 census records, 25 EXPOSED, 6 ABSENT, 1 UNDETERMINED
harness change  clauses.mjs gains `absent_in_document` (a clause may verify that the WHOLE document never says a phrase, e.g.
                "policy-controlled feature"); build-clauses.mjs gains --harness-in (reuse the D15 extraction probe; the
                D15 epoch rebuilds byte-identically without the flag)
```

## 1. What the authorities say, family by family (every line is a VERIFIED clause at the named tip)

```text
FAMILY               API/SECURE CONTEXT          PERMISSION / POLICY                    REQUEST GATE                  LOSS / LIFECYCLE
CPU / Wasm64         JS API: no SecureContext,   none (verified absent: CL-WJ1)         instantiate(bytes) CL-WJ2      [GAP] traps only
                     no gate (CL-WJ1)
Dedicated workers    Worker, no SecureContext    [GAP] not verifiable in HTML           SyntaxError on bad URL CL-WK2  terminate() CL-WK3
                     (CL-WK1)
Shared/threaded Wasm D15 CL-T2..T8 (SAB, COI, canBlock)                                                             [GAP] worker loss
WebGPU               navigator.gpu [SecureContext] NONE: no permission, no policy       user-agent choice, null lawful device lost, adapter expired
                     Window+Worker (CL-GPU1)      feature (verified absent: CL-GPU1)     features subset, limits        (CL-GPU6/7); WGSL via
                                                                                        (CL-GPU2..5)                  createShaderModule (CL-GPU10/11)
WebNN                navigator.ml [SecureContext] policy webnn 'self' (CL-NN2)         createContext SecurityError/   context lost (CL-NN4)
                                                                                        NotSupportedError (CL-NN3)
WebCodecs            codecs [SecureContext]       NONE (verified absent: CL-WC1)        isConfigSupported (CL-WC2)     reclamation QuotaExceeded
                     Window+DedicatedWorker                                                                            (CL-WC3/4)
Camera / Microphone  mediaDevices [SecureContext] powerful + policy "camera",           Permission Failure ->          track ended on revoke/eject
                                                  "microphone" 'self' (CL-MC2/3)        NotAllowedError (CL-MC4/5)     (CL-MC6)
Generic Sensor       Sensor [SecureContext];      per-type features (CL-GS4)            start(): request access,       NotAllowed/NotReadable
                     readings only secure+visible                                       (CL-GS3)                      (CL-GS3)
                     +focused (CL-GS2)
Accelerometer/Gyro/  [SecureContext, Window]      features/permissions owned by Device  Generic Sensor start          Generic Sensor
Magnetometer/Orient.  (CL-ACC1/GYR1/MAG1)         Orientation (CL-ACC2/GYR2/MAG2, DO1);
                                                  orientation composes them (CL-ORI1/2)
Device Orientation   events [SecureContext]       permissions/policy accelerometer,     requestPermission needs        [GAP]
                     (CL-DO3)                     gyroscope, magnetometer 'self' (DO1)  activation when prompt (DO2);
                                                                                        integration AT RISK (DO4)
Proximity / Ambient  [SecureContext] (PRX1/ALS3)  proximity-sensor / ambient-light-      Generic Sensor start          Generic Sensor; ALS readings
                                                  sensor 'self' (PRX2, ALS1)                                          quantized >= 50 lux (ALS2)
Geolocation          Geolocation exposed WITHOUT  policy + default powerful feature     denied in non-secure context   waits while hidden (GEO5)
                     SecureContext (CL-GEO1)      "geolocation" (GEO3/4)                or disallowed policy (GEO2/3)
XR                   navigator.xr [SecureContext] xr-spatial-tracking (CL-XR2)          isSessionSupported non-        session end (CL-XR6)
                                                                                        prompting (XR3); immersive
                                                                                        needs activation (XR4)
HID/USB/Serial/BT    [SecureContext] (HID1, USB1, policy hid/usb/serial/bluetooth       Window + transient activation  disconnect / forget /
                     SER1, BT1)                   'self' (HID3, USB3, SER3, BT4);       + chooser (HID2, USB2, SER2,   gattserverdisconnected
                                                  bluetooth powerful feature (BT3)      BT2)                          (HID4, USB1, SER4, BT5)
Storage surfaces     StorageManager, OPFS root,   IndexedDB: none (verified absent:     persist Window-only (ST3)     best-effort cleared (ST2)
                     CacheStorage [SecureContext] CL-IDB1)
                     (STQ1, OPFS1, CS1/2)
SW / Fetch / Manifest / Secure context / Permissions / Permissions Policy: the D15 clauses (CL-F*, CL-S*, CL-MF1, CL-H*,
                     CL-P*) answer their steps
```

## 2. Findings

```text
M1 [OBS maturity]  the whole Generic Sensor family carries advisements at its tips: Generic Sensor Chromium-only and not
                   expected to advance (CL-GS0); Accelerometer, Gyroscope, Orientation Sensor "maintained for existing
                   deployments", new projects directed to Device Orientation and Motion (CL-ACC0/GYR0/ORI0); Magnetometer
                   and Ambient Light not available by default in any engine (CL-MAG0/ALS0); Proximity implemented by NO
                   engine (CL-PRX0) -> FACT-SENSOR-FAMILY-ADVISEMENT.  Every family stays in G (CON-FT-002); whether the
                   motion contracts should route through Device Orientation and Motion is a D18 decision
M2 [OBS maturity]  Device Orientation's requestPermission integration is AT RISK (CL-DO4); the census finds
                   DeviceOrientationEvent.requestPermission NOT implemented in Chromium 141 (implementation -> D17)
M3 [NEW]           exposure is not admission, by authority: Geolocation is exposed without [SecureContext] and denies every
                   request in a non-secure context (CL-GEO1/2); WebNN createContext can reject after navigator.ml exists
                   (CL-NN3); requestAdapter may lawfully return null (CL-GPU3) -> CON-CAP-001 (PROPOSED)
M4 [NEW]           HID, USB, Serial, Bluetooth, immersive XR and the device-orientation permission require transient
                   activation (and a chooser): headless automation cannot reach admission without a named automation path
                   -> FACT-CHOOSER-FAMILIES-NEED-ACTIVATION, CON-CAP-002 (PROPOSED)
M5 [NEW]           WebGPU and WebCodecs define NO permission and NO policy-controlled feature; the WebAssembly JS API and
                   IndexedDB define no [SecureContext], permission or policy (verified absences, NONE_DEFINED steps)
M6 [OBS]           Serial moved to WHATWG (whatwg/serial; WICG/serial answers the same tip); REFERENCE-AUTHORITY already
                   cites serial.spec.whatwg.org
M7 [ERR stale]     FACT-WORKERS-UNPROBED (D11: "no fixture constructs a Worker") is contradicted by D12 evidence (the kernel
                   ran ANALYZE/BUILD in a dedicated worker, FACT-SH-KERNEL-WORKER-PARTIAL): a stale claim for D18
M8 [OBS census]    implementation signals for D17: ambient-light-sensor permission query reports "GenericSensorExtraClasses
                   flag is not enabled"; 'bluetooth' is not a PermissionName in this build; the magnetometer permission is
                   queryable while Magnetometer is absent; WebGPU adapter null under the default launch; XR inline true,
                   immersive-vr false; zero media/HID/USB/serial devices in the container
M9 [GAP]           the WebGPU matrix contract requires a WGSL shader compile + dispatch/readback: the admitted relay is
                   buffer copies only, so WebGPU is [GAP] with RUN parts, not [RUN]
```

## 3. Classification (reviewed; the gate re-derives what the evidence allows)

```text
RUN  6   CPU / Wasm64, OPFS, IndexedDB, CacheStorage, Service Worker, Secure-context state
OBS 16   Dedicated workers, WebCodecs, Camera, Microphone, Generic Sensor, Accelerometer, Gyroscope, Orientation Sensor,
         Device Orientation / Motion, Geolocation, XR, Permissions, Permissions Policy, HID, USB, Serial
GAP 10   WebGPU (WGSL), WebNN, Magnetometer, Proximity, Ambient light, Fetch / network (streaming), Storage
         quota/persistence (persist false, no pressure fixture), Manifest/PWA shell, Bluetooth, Future explicit capability
ERR  1   Shared/threaded Wasm (ERR-002/ERR-003)
UNK  0
rules    ERR if a witness is ERR; RUN needs a RUN witness with evidence meeting the matrix contract; GAP if the census found the
         interface ABSENT, a witness is GAP, or no authority is named; OBS if EXPOSED (or an OBS/RUN witness) without an
         admission contract met; UNK if a witness is UNK or the census could not determine exposure
steps    231 family authority steps: 174 CLAUSE, 6 NONE_DEFINED (verified absence), 51 explicit [GAP] with reasons
```

## 4. Census (tests/capability/census.mjs, station S-BROWSER)

```text
page      http://127.0.0.1:<port>/ (potentially trustworthy, not cross-origin isolated), default headless launch
per family  exposure expression; NON-PROMPTING discovery only (requestAdapter, createContext, isConfigSupported,
          enumerateDevices, isSessionSupported, getDevices/getPorts/getAvailability, estimate/persisted, getDirectory,
          caches.keys); permissions.query states; the implementation's policy query (document.featurePolicy,
          implementation-specific).  No getUserMedia, no sensor start, no position, no session, no chooser: nothing is
          requested and nothing is admitted.  CL-XR3 states isSessionSupported MUST NOT trigger device-selection UI.
output    evidence/D16/census/{identity.json, records/<family>.json, summary.json}
```

## 5. Graph epoch D16 (add-only)

```text
declares  CAPABILITY_FAMILY {family_id, matrix_row, in_G, current_authority, admission_contract, lifecycle_failure,
          evidence_required (verbatim from the matrix), steps{7 x CLAUSE|NONE_DEFINED|GAP}, census, classification,
          rationale, run_parts, maturity}; TRACE_STEP (family -> CLAUSE, requires step); WITNESSED_BY (family -> fact)
adds      90 CLAUSE + 90 extraction EVIDENCE + summary; 18 AUTHORITY; ENV-D16-HOST, ENV-D16-BROWSER; census PROBE and
          IMPLEMENTATION; 32 census EVIDENCE + 32 [OBS] exposure facts; 33 CAPABILITY_FAMILY; CON-CAP-001, CON-CAP-002
          (PROPOSED); FACT-D16-CLAUSES-VERIFIED [RUN], FACT-SENSOR-FAMILY-ADVISEMENT [OBS],
          FACT-CHOOSER-FAMILIES-NEED-ACTIVATION [OBS]
tooling   envmap: clause_connected accepts TRACE_STEP; family_classification_vocabulary, family_steps_match_edges; Q19
          capability universe (10-step trace per family, first gap, totals); TRACEABILITY lists the universe
gate      tests/capability/gate.mjs: g_rows_preserved, graph_families_match, steps_complete, census_complete,
          witnesses_resolve, classification_allowed
```

## 6. Mutation plan by station (delta D16-CAPABILITY-UNIVERSE, workpiece W18, base 3748fa7)

```text
F0  S-DOC       this ASCII; ledger (D15 AFTER + D16 BEFORE); delta; fixtures
F1  S-FIXTURE   tests/reference/{clauses.mjs, build-clauses.mjs, d16-clauses.json}, tests/capability/{census.mjs,
                build-universe.mjs, gate.mjs, universe.json}, tests/envmap/envmap.mjs; checks: syntax, tools name no
                family/authority/clause/fact, the D15 epoch rebuilds byte-identically, the D15 graph validates, renders
                and merges identically
F2  S-BUILD     evidence/D16/clauses/ (exit 0 only if all 90 VERIFIED)
F3  S-BROWSER   evidence/D16/census/ (Chromium through the installed Playwright)
F4  S-DOC       epochs/D16.json (clause fragment + universe, both from Factory evidence); merged graph; views; SCHEMA
                section 9, ENVIRONMENT-MAP section 8 written inside the station run
F5  S-EVIDENCE  validate, Q01-Q19, stale, merge-check, render-check, capability gate, Q18/Q19 gates, workpiece audit ->
                retire -> audit, evidence index
F6  S-DOC       D16-OBSERVED-CAPABILITY-UNIVERSE.md, docs/HANDOFF.md
route           every station open's exit status checked before copying (D14 rule)
MUST NOT CHANGE: law and pass documents (CAPABILITY-MATRIX.md included: G is read, never written), compiler/, host/,
                 factory/ machinery, fixtures/, other tests, earlier epochs, D0-D15 evidence
```

## 7. Predictions

```text
P1  F2: 90/90 VERIFIED (a tip that moved with a clause changed is evidence, returned to ASCII, not forced)
P2  F3: 32 census records, 25 EXPOSED / 6 ABSENT (SharedArrayBuffer, WebNN, Magnetometer, Proximity, Ambient light,
    Bluetooth) / 1 UNDETERMINED (Manifest), unless the browser build changed
P3  epoch D16 305 nodes / 745 edges; merged 891 / 1845; validate PASS 32 checks; D11-D15 preserved
P4  gate PASS: 33 rows = 33 families; steps 174 / 6 / 51; RUN 6, OBS 16, GAP 10, ERR 1, UNK 0
P5  Q18: 43 RUN claims, 14 COMPLETE (+4: GPU-ADMITTED-E0, GPU-EPOCH-INVALIDATION, GPU-KNOWN-ANSWER, GPU-LOSS-DESTROYED);
    EXACT CLAUSE stops 11 -> 4 (only process facts; D18); new visible stops behind them: GPU-ADAPTER-NULL-DEFAULT and
    GPU-RELAY-EXACT-E0 at IMPLEMENTATION CONTRACT, GPU-ADAPTER-SWIFTSHADER at REPRODUCIBILITY PIN
P6  Q19: 33 families, first gap named for every family that has one
P7  audit: W17 worktree RETIRABLE -> REMOVED; W17-stage KEEP (base-era graph views differ from the integrated tree, as
    W14/W16-stage); after: RETIRABLE 0, KEEP 5, CURRENT 2 (W18, W18-stage)
```

## 8. Invariants

```text
I1  G is read from CAPABILITY-MATRIX.md and never written; every row stays a family (gate g_rows_preserved)
I2  exposure is recorded as exposure: census facts are [OBS]; no request, prompt, chooser or session is made
I3  a "none defined" step is admitted only through a clause that verified the absence document-wide
I4  every step answers CLAUSE, NONE_DEFINED or an explicit [GAP] reason; no silent step
I5  implementation observations (flags, missing requestPermission, PermissionName enum) stay implementation facts for D17
I6  no law document, earlier node or epoch, or D0-D15 evidence edited; constraints PROPOSED only
```

## 9. Pass gate

```text
D16 closes when the Factory reproduces 90 VERIFIED clauses and the census, the capability gate passes, Q19 maps every
family of G with its first gap, and the observed ASCII compares P1-P7.  The broad capability-map coverage gap is then
explicitly mapped (Q19 + 51 GAP steps + 10 GAP families) rather than hidden.
```

## 10. Structural check

```text
inputs supplied        G (matrix), 18 new + D15 documents at tips, one browser, universe manifest                  PASS
outputs consumed       clauses/census -> epoch -> gate/Q19 -> D17 (implementation signals M2, M8), D18 (M1, M3, M4,
                       M7, proposed constraints), D19 (re-proof set)                                               PASS
contracts match        CAPABILITY_FAMILY/TRACE_STEP/WITNESSED_BY declared before use; builder refuses a family whose
                       matrix row does not exist; gate re-derives allowed classifications                           PASS
forbidden bypasses     matrix not writable by the delta; census cannot request/admit; no law edit                  PASS
illegal cycles         none: family -> clause/fact edges only                                                     PASS
invariants represented I1-I6 -> gate checks, census design, NONE_DEFINED rule, steps_complete, labels, must_not_change PASS
tests/evidence         F1 regression, F2 extraction, F3 census, F4 validate/merge/render, F5 gate + Q18/Q19       PASS
```

STRUCTURAL CHECK: PASS
