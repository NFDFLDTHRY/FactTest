# D16 - Observed Capability Universe vs Intended

STATUS: RE-OBSERVATION OF THE D16 WORKPIECE (W18 on canonical base 3748fa7bd15d74e560951f31338b8c94820c2830)
LAW: compares D16-INTENDED-CAPABILITY-UNIVERSE.md (sections 2, 3, 7) with the Factory run (factory/receipts/
D16-CAPABILITY-UNIVERSE/, evidence/D16/).  The intended drawing is not rewritten.

## 1. Station run

```text
F0-doc       S-DOC       PASS   intended ASCII + ledger (D15 AFTER, D16 BEFORE); nothing else changed
F1-fixture   S-FIXTURE   PASS   absent_in_document, --harness-in, D16 clause manifest, census, universe manifest, epoch
                                builder, gate, envmap (family checks, Q19, universe view); tools name no family, authority,
                                clause, constraint or fact; D14/D15 tools and CAPABILITY-MATRIX.md byte-identical; the D15
                                epoch rebuilds byte-identically; the D15 graph validates, renders and merges identically
F2-build     S-BUILD     PASS   90/90 clauses VERIFIED over 25 source documents; no tip moved since assembly
F3-browser   S-BROWSER   PASS   census: 32 records in HeadlessChrome/141.0.7390.37 (V8 14.1.146.11), identical states to
                                the assembly run
F4-doc       S-DOC       PASS   epochs/D16.json built from the Factory evidence; graph merged; views rendered; SCHEMA
                                section 9 and ENVIRONMENT-MAP section 8 written inside the station run
F5-evidence  S-EVIDENCE  PASS   validate (32 checks), Q01-Q19, stale, merge-check, render-check, capability gate, Q18 and
                                Q19 gates; audit -> retire -> audit; evidence index
ROUTE        every station open's exit status checked before any copy; no refusal; no unreceipted write
```

## 2. Clauses and census

```text
clauses   90 VERIFIED: 18 new capability authorities + existing WebGPU/WGSL, HTML workers, Storage, FS, IndexedDB,
          Service Workers and WebAssembly JS API authorities; 4 verified document-wide absences (CL-GPU1 WebGPU,
          CL-WC1 WebCodecs: no permission / policy feature / Permissions Policy; CL-WJ1 WebAssembly JS API and CL-IDB1
          IndexedDB: no SecureContext / powerful feature / policy feature)
census    32 families with a census block: 25 EXPOSED, 6 ABSENT (SharedArrayBuffer without isolation, WebNN, Magnetometer,
          Proximity, Ambient light, Bluetooth), 1 UNDETERMINED (Manifest: declarative, no script surface);
          secure (loopback), not cross-origin isolated, visible, focused; nothing requested, nothing admitted
signals   (implementation facts for D17) ambient-light-sensor permission query: "GenericSensorExtraClasses flag is not
          enabled"; 'bluetooth' not a PermissionName; magnetometer permission queryable while Magnetometer is absent;
          DeviceOrientationEvent.requestPermission not implemented; WebGPU adapter null under the default launch;
          XR inline true / immersive-vr false; 0 media, HID, USB and serial devices; document.featurePolicy exposed
          (implementation-specific, 77 allowed features); storage quota 1033115538, persisted false
```

## 3. Graph

```text
epoch D16   305 nodes / 745 edges: 90 CLAUSE, 90 extraction EVIDENCE + summary, 18 AUTHORITY, ENV-D16-HOST,
            ENV-D16-BROWSER, census PROBE + IMPLEMENTATION, 32 census EVIDENCE, 32 [OBS] exposure facts,
            33 CAPABILITY_FAMILY, CON-CAP-001/002 (PROPOSED), 3 facts; declares CAPABILITY_FAMILY, TRACE_STEP, WITNESSED_BY
merged      891 nodes / 1845 edges = merge(D11 @ fdb9c32, D12..D16); merge-check PASS; render-check PASS; validate PASS 32
rebuild     the reinspect command rebuilds epochs/D16.json from the committed clause and census evidence and compares bytes
```

## 4. Capability universe (evidence/D16/gate.json, evidence/D16/envmap/queries/Q19.json)

```text
gate        PASS: g_rows_preserved (33 matrix rows = 33 families, in order), graph_families_match, steps_complete,
            census_complete (32), witnesses_resolve (54), classification_allowed
steps       231 family authority steps: 174 CLAUSE, 6 NONE_DEFINED (verified absence), 51 explicit [GAP]
RUN  6      CAP-CPU-WASM64, CAP-OPFS, CAP-INDEXEDDB, CAP-CACHESTORAGE, CAP-SERVICE-WORKER, CAP-SECURE-CONTEXT
OBS 16      CAP-WORKER-DEDICATED, CAP-WEBCODECS, CAP-CAMERA, CAP-MICROPHONE, CAP-GENERIC-SENSOR, CAP-ACCELEROMETER,
            CAP-GYROSCOPE, CAP-ORIENTATION-SENSOR, CAP-DEVICE-ORIENTATION, CAP-GEOLOCATION, CAP-XR, CAP-PERMISSIONS,
            CAP-PERMISSIONS-POLICY, CAP-HID, CAP-USB, CAP-SERIAL
GAP 10      CAP-WEBGPU (WGSL shader compile/dispatch missing; RUN parts: exposure, fallback adapter, device, buffer
            readback, controlled loss), CAP-WEBNN, CAP-MAGNETOMETER, CAP-PROXIMITY, CAP-AMBIENT-LIGHT, CAP-FETCH
            (streaming), CAP-STORAGE-QUOTA (persist false, no pressure fixture), CAP-MANIFEST, CAP-BLUETOOTH,
            CAP-FUTURE-EXPLICIT (no authority named)
ERR  1      CAP-WASM-SHARED-THREADS (ERR-002/ERR-003)
UNK  0
first gap   most OBS families stop first at FEATURES_LIMITS (reading/constraint/filter models not clause-traced); workers,
            permissions and fetch at SECURE_CONTEXT (not verifiable by absence in HTML/Fetch); Orientation Sensor,
            Permissions Policy and Manifest at API; the full per-family trace is Q19
```

## 5. Q18 claim traversal (evidence/D16/envmap/queries/Q18.json)

```text
106 claims  RUN 43: COMPLETE 14 (D15: 10; + GPU-ADMITTED-E0, GPU-EPOCH-INVALIDATION, GPU-KNOWN-ANSWER, GPU-LOSS-DESTROYED
            now grounded by CL-GPU4..9); stops at IMPLEMENTATION CONTRACT 17 (+ GPU-ADAPTER-NULL-DEFAULT,
            GPU-RELAY-EXACT-E0: newly visible behind their clauses), CURRENT AUTHORITY 5 (+ D16-CLAUSES-VERIFIED),
            EXACT CLAUSE 4 (11 -> 4: only HANDOFF-MODEL-INDEPENDENT, RESELECTION-NO-CODEGEN, STATUS-INVENTORIED,
            SURFACES-LITERAL-ENFORCED remain, all project-law facts: D18), REPRODUCIBILITY PIN 1 (GPU-ADAPTER-SWIFTSHADER:
            the Playwright install authority has no pinned sha: D17), STALE CONDITIONS 1, PROJECT CONSTRAINT 1
            non-RUN 63: OBS 43 (+32 census exposure facts, + FACT-SENSOR-FAMILY-ADVISEMENT,
            FACT-CHOOSER-FAMILIES-NEED-ACTIVATION), GAP 12, UNK 4, ERR 4
```

## 6. Hygiene

```text
audit-before  RETIRABLE 1 (W17 worktree), KEEP 5 (W11-stage, W14-stage, W16-stage, W17-stage, factory-bootstrap-bin),
              CURRENT 2 (W18, W18-stage)
retire        W17 REMOVED (integration 3748fa7, verification PASS, reinspect MATCH)
audit-after   RETIRABLE 0, KEEP 5, CURRENT 2, ABSENT 17
[GAP]         every stage since W14 is KEPT for the same reason: it still holds the base-era generated graph views, which
              the audit cannot prove superseded.  A proof that compares stage blobs with canonical_base (factory/src,
              outside D16's authority) is a D18 item
```

## 7. Intended vs observed

```text
P1  MATCH   90/90 VERIFIED; no tip moved
P2  MATCH   32 records: 25 EXPOSED / 6 ABSENT / 1 UNDETERMINED, same browser build, same states as assembly
P3  MATCH   epoch 305 / 745; merged 891 / 1845; validate PASS 32; D11-D15 preserved
P4  MATCH   gate PASS; 33 = 33; steps 174 / 6 / 51; RUN 6, OBS 16, GAP 10, ERR 1, UNK 0
P5  MATCH   43 RUN claims, 14 COMPLETE; EXACT CLAUSE stops 11 -> 4; GPU-ADAPTER-NULL-DEFAULT and GPU-RELAY-EXACT-E0 at
            IMPLEMENTATION CONTRACT, GPU-ADAPTER-SWIFTSHADER at REPRODUCIBILITY PIN
P6  MATCH   Q19: 33 families, in_G 33, every trace 10 steps
P7  MATCH   W17 RETIRABLE -> REMOVED; W17-stage KEEP; after RETIRABLE 0, KEEP 5, CURRENT 2
STRUCTURE MATCH  CAPABILITY-MATRIX.md, law and pass documents, earlier epochs and D0-D15 evidence untouched; every family
                 kept in G; census facts [OBS] only; implementation signals labelled implementation; constraints PROPOSED
```

## 8. What each approved capability currently requires (carried forward)

```text
[NEW]  CON-CAP-001  exposure never admits: Geolocation is exposed without [SecureContext] yet denies every request in a
                    non-secure context; WebNN createContext can reject after navigator.ml exists; requestAdapter may
                    lawfully return null
[NEW]  CON-CAP-002  HID, USB, Serial, Bluetooth, immersive XR and the device-orientation permission need transient
                    activation (and a chooser): their probe obligation must name an automation path
[OBS]  sensors      Generic Sensor family advisements (FACT-SENSOR-FAMILY-ADVISEMENT); Device Orientation permission
                    integration at risk and not implemented by Chromium 141; routing decision D18
[ERR]  stale        FACT-WORKERS-UNPROBED (D11) contradicted by D12 worker evidence (D18)
[OBS]  Serial       moved to WHATWG (whatwg/serial)
[GAP]  WebGPU       WGSL shader compile + dispatch is the missing piece of the WebGPU admission contract
```

GATE: PASS - the broad capability-map coverage gap is explicitly mapped rather than hidden: all 33 families of G are
traced at exact clauses (or verified absences, or named [GAP] steps), observed without being requested, and classified
against the matrix admission contract (Q19).  Carried across the gate explicitly: 51 [GAP] steps and 10 [GAP] families,
ERR-002/ERR-003, the D17 implementation signals (section 2), the D18 items (sensor routing, stale worker claim,
PROPOSED constraints, stage KEEP rows).  No internal chain defect is open.  Next: D17-IMPLEMENTATION-REALITY.
