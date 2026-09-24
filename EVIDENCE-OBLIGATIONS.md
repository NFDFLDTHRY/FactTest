# FactTest Evidence Obligations

STATUS: PASS 2  
OBSERVED: 2026-09-23

Pass 2 derives tests from authority. These are obligations for later implementation; they are not claims that the tests currently pass.

## E-001 — no_std compiler boundary

Authority:
https://doc.rust-lang.org/reference/names/preludes.html#the-no_std-attribute

Future test:
- compiler crate builds with no_std.
- forbidden std dependency/use causes a build/check failure.
- crate graph contains only approved in-repo crates plus admitted core/optional alloc/toolchain builtins.

Evidence:
- toolchain identity
- build command
- crate graph
- artifact hash
- failure fixture result

## E-002 — wasm64 address width

Authority:
https://webassembly.github.io/spec/core/text/types.html#text-addrtype
https://webassembly.github.io/spec/core/text/types.html#text-memtype

Future test:
- generated module uses the intended i64 address form.
- pointer/usize assumptions are checked at compile/test boundary.
- wasm32 artifact/fallback is rejected by project policy.

Evidence:
- target triple
- module inspection/validation
- known memory operation result

## E-003 — streaming Wasm delivery

Authority:
https://webassembly.github.io/spec/web-api/#streaming-module-compilation-and-instantiation

Future tests:
- application/wasm + successful response -> compilation path succeeds.
- wrong MIME -> rejected.
- non-ok response -> rejected.
- compilation error -> surfaced as compilation failure, not silently retried as another semantic target.

## E-004 — worker execution

Authority:
https://html.spec.whatwg.org/multipage/workers.html#workers

Future tests:
- create worker
- send deterministic input
- execute known job
- return exact result
- terminate/recreate
- transfer semantics verified for every representation actually used

## E-005 — WebGPU

Authority:
https://gpuweb.github.io/gpuweb/#dom-gpu-requestadapter
https://gpuweb.github.io/gpuweb/#dom-gpudevice-lost

Future tests:
1. no adapter -> GPU edge excluded from A(t)
2. adapter -> capture features/limits
3. request device
4. compile known WGSL
5. dispatch known compute
6. read expected result
7. exercise device loss/reinitialization path

Evidence:
- adapter/features/limits receipt
- shader source/hash
- compilation info
- expected/actual buffer
- device-loss event and new A(t)/P(t)

## E-006 — WebNN

Authority:
https://webmachinelearning.github.io/webnn/#api

Future tests:
- absent API -> edge unavailable
- policy denied -> SecurityError path
- unsupported context -> NotSupported path
- supported context -> build/dispatch known graph
- compare exact/toleranced tensor expected by operation contract

## E-007 — WebCodecs

Authority:
https://w3c.github.io/webcodecs/#dom-videodecoder-isconfigsupported
https://w3c.github.io/webcodecs/#hardware-acceleration
https://w3c.github.io/webcodecs/#resource-reclamation

Future tests:
- unsupported config excluded
- supported config decodes/encodes known fixture
- queue/saturation observed
- close/reclamation handled
- preference is not recorded as proof of actual hardware execution

## E-008 — camera/microphone

Authority:
https://w3c.github.io/mediacapture-main/#dom-mediadevices-getusermedia

Future tests:
- deny permission
- no matching device
- successful video track
- successful audio track
- track end/revoke
- re-observe capability state after loss

Do not store raw sensitive media as evidence by default; store minimal test facts/hashes/metrics needed by the fixture.

## E-009 — Generic Sensor family

Authority:
https://w3c.github.io/sensors/#dom-sensor-start
https://w3c.github.io/sensors/#extending-the-permission-api

Future tests per concrete sensor:
- policy denied
- permission denied
- sensor unavailable/not readable
- start -> timestamped reading
- stop
- virtual/known-reading fixture when standard automation supports it
- precision/quantization requirements honored where specified

## E-010 — Device Orientation and Motion

Authority:
https://w3c.github.io/deviceorientation/#permissions

Future tests:
- requestPermission/feature gate where required
- no transient activation fixture where applicable
- successful motion/orientation event
- coordinate/precision semantics verified against chosen operation contract

## E-011 — Geolocation

Authority:
https://w3c.github.io/geolocation/#dom-geolocation-getcurrentposition

Future tests:
- denied
- timeout/unavailable
- successful known/emulated position
- watch/update path if used
- no plan treats stale position as fresh without explicit semantics

## E-012 — WebXR

Authority:
https://immersive-web.github.io/webxr/#dom-xrsystem-issessionsupported
https://immersive-web.github.io/webxr/#dom-xrsystem-requestsession
https://immersive-web.github.io/webxr/#permissions-policy

Future tests:
- unsupported session mode
- supported indication but session acquisition fails
- successful session with required feature set
- reference-space/frame loop
- session end/device change -> re-observe/replan

## E-013 — storage quota/persistence

Authority:
https://storage.spec.whatwg.org/#dom-storagemanager-persist
https://storage.spec.whatwg.org/#dom-storagemanager-estimate

Future tests:
- estimate recorded
- persistence granted and denied
- quota-pressure/failure fixture
- no "saved" evidence when write fails

## E-014 — OPFS

Authority:
https://fs.spec.whatwg.org/#dom-storagemanager-getdirectory

Future tests:
- obtain root
- create/write/close
- page lifecycle/app switch
- reacquire handle
- byte-exact read
- missing/invalidated handle recovery
- quota error path

## E-015 — IndexedDB

Authority:
https://w3c.github.io/IndexedDB/#database-concept

Future tests:
- open/create schema
- transaction commit
- transaction abort
- version change
- reload and exact data recovery

## E-016 — Service Worker / CacheStorage

Authority:
https://w3c.github.io/ServiceWorker/#fetch-event
https://w3c.github.io/ServiceWorker/#cache-objects

Future tests:
- install/activate/control
- cached shell works offline
- failed update retains usable prior shell
- complete update replaces only after correct lifecycle
- cache version is explicitly managed

## E-017 — Manifest / installation

Authority:
https://w3c.github.io/manifest/#web-application-manifest

Future tests:
- manifest processing/paths/scope structurally correct
- runtime/browser evidence separately records actual installation/standalone launch where available

## E-018 — permissions / policy / secure context

Authority:
https://w3c.github.io/webappsec-secure-contexts/#is-origin-trustworthy
https://w3c.github.io/permissions/#permissions
https://w3c.github.io/webappsec-permissions-policy/#policy-controlled-feature

Future matrix:
- insecure/non-trustworthy environment
- policy blocked
- permission denied
- permission prompt/grant
- permission revocation/expiry
- capability-specific chooser or activation failure

Each stage must produce a distinct reason for non-admission.

## E-019 — HID

Authority:
https://wicg.github.io/webhid/#dom-hid-requestdevice
https://wicg.github.io/webhid/#dom-hiddevice-open

Future tests where a suitable fixture/virtual device exists:
- no selection
- policy blocked
- successful selection/open
- known input/output/feature report
- disconnect
- forget/revoke

## E-020 — USB

Authority:
https://wicg.github.io/webusb/#dom-usb-requestdevice
https://wicg.github.io/webusb/#dom-usbdevice-open

Future tests where a controlled device fixture exists:
- chooser/no selection
- open
- configuration/interface selection if required
- known transfer
- disconnect/failure

## E-021 — Serial

Authority:
https://serial.spec.whatwg.org/#dom-serial-requestport
https://serial.spec.whatwg.org/#dom-serialport-open

Future tests:
- no transient activation/blocked path
- no selection
- open controlled loopback/fixture
- read/write exact bytes
- disconnect and stream error
- close/reacquire

## E-022 — Bluetooth

Authority:
https://webbluetoothcg.github.io/web-bluetooth/#dom-bluetooth-requestdevice
https://webbluetoothcg.github.io/web-bluetooth/#dom-bluetoothremotegattserver-connect

Future tests with controlled peripheral:
- no selection
- selected but GATT connect fails
- service missing
- known characteristic read/write/notification
- disconnect/reconnect

## E-023 — shared/threaded Wasm

Current JS authority:
https://webassembly.github.io/spec/js-api/#internal-storage

Threads proposal:
https://webassembly.github.io/threads/core/

Future tests:
- runtime/toolchain must explicitly advertise/execute the proposal path
- create actual concurrent workers/agents
- shared-memory read/write
- atomic operation known-answer test
- wait/notify where legal
- deadlock/time-bound failure fixture
- record proposal/toolchain/browser identities
- never infer universal support from a single successful device

## E-024 — replan invariant

Project authority:
[PASS1.md](PASS1.md)

For every backend-loss fixture:
- compute M0/A0/P0
- force or observe capability loss/revocation
- record M1
- recompute A1
- derive P1
- independently verify P1 against the same source invariants
- emit observed ASCII describing the changed machine/plan

A silent strategy change with no evidence/re-observation fails.


## E-025 - Byte Relay commissioning strategy

Project authority:
[PASS6.md](PASS6.md)

External authority:
- Wasm address types: https://webassembly.github.io/spec/core/text/types.html#text-addrtype
- controlled WebGPU device loss: https://gpuweb.github.io/gpuweb/#dom-gpudevice-destroy

Required future physical evidence after materialization:
1. commissioning ASCII parses/canonical-renders without semantic drift;
2. Wasm64 representation path is built, validated and executed;
3. WebGPU representation path is admitted and executes when available;
4. exact input bytes emerge unchanged through selected path;
5. GPUDevice.destroy() produces actual loss evidence;
6. new epoch invalidates GPU activation;
7. selector activates already-verified Wasm64 variant without runtime codegen;
8. exact bytes again emerge unchanged;
9. ObservationDelta and observed ASCII record transition;
10. authored ASCII remains unchanged.

If the physical browser cannot admit either backend, record [GAP]. Model/synthetic evidence cannot substitute for physical evidence.
