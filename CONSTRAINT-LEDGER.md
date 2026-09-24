# FactTest Constraint Ledger

STATUS: PASS 2  
OBSERVED: 2026-09-23

Each externally constrained claim points to the current authority and, where available, the exact clause.

## Project / Factory constraints

### FT-001 — ASCII remains source of record
Authority: [FACTORY-LAW.md](FACTORY-LAW.md), [PASS1.md](PASS1.md)  
Effect: internal Rust types/IR may represent source semantics but may not replace ASCII as the authoring/source-of-record surface.  
Test: a compilation round trip cannot require editing internal IR to change authoritative project intent.

### FT-002 — Approved target nodes are not silently removed
Authority: [PASS1.md](PASS1.md)  
Effect: unavailable/immature capabilities remain [GAP]/[ERR]/[UNK] in G unless explicitly removed in ASCII.

### FT-003 — wasm32 fallback is forbidden
Authority: [PASS1.md](PASS1.md)  
Class: project decision, not upstream requirement.

## Rust / toolchain

### RS-001 — no_std behavior
Constraint: compiler crates use Rust's no_std model.  
Clause: https://doc.rust-lang.org/reference/names/preludes.html#the-no_std-attribute  
Effect: do not assume std prelude/linkage.

### RS-002 — build core/alloc from source when required
Clause: https://doc.rust-lang.org/nightly/cargo/reference/unstable.html#build-std  
Constraint: current Cargo build-std is unstable; rust-src and nightly Cargo/rustc are required; \`-Z build-std=core,alloc\` is an available form.  
Effect: reproducible build fixtures must state toolchain and build-std use explicitly.

### RS-003 — Rust wasm64 target behavior
Document: https://doc.rust-lang.org/rustc/platform-support/wasm64-unknown-unknown.html  
Constraint: this is Rust implementation authority for wasm64 target behavior, not authority for current WebAssembly standards status.

## WebAssembly

### WA-001 — 64-bit address types are current Wasm semantics
Clause: https://webassembly.github.io/spec/core/text/types.html#text-addrtype  
Constraint: address types include i32 and i64.

### WA-002 — memory type carries address type
Clause: https://webassembly.github.io/spec/core/text/types.html#text-memtype  
Effect: wasm64 codegen/validation must preserve the intended address type.

### WA-003 — JavaScript Memory descriptor is address-type aware
Clause: https://webassembly.github.io/spec/js-api/#memories  
Effect: JS host membrane must represent the current Memory descriptor/address model.

### WA-004 — Wasm streaming delivery has response requirements
Clause: https://webassembly.github.io/spec/web-api/#streaming-module-compilation-and-instantiation  
Constraint: streaming compilation rejects unsuitable CORS/status/MIME responses; application/wasm is part of the delivery contract.  
Test: wrong MIME and non-ok response fixtures must fail admission.

### WA-005 — current JS embedding is agent-local
Section: https://webassembly.github.io/spec/js-api/#internal-storage  
Constraint: current JS Interface's internal-storage model states that WebAssembly objects, memory and addresses are not shared among agents in that specification.  
Effect: do not model proposal-based shared Wasm threading as an unconditional Core+JS backend.

## HTML / workers

### WB-001 — workers are explicit background execution contexts
Section: https://html.spec.whatwg.org/multipage/workers.html#workers  
Effect: worker-backed implementations require worker lifecycle/communication contracts.

### WB-002 — hardwareConcurrency is not owned cores
Clause: https://html.spec.whatwg.org/multipage/workers.html#navigator.hardwareconcurrency  
Constraint: it reports logical processors potentially available to the user agent and can be reduced by user-agent policy.  
Effect: never use it as proof of dedicated or physically owned cores.

## WebGPU / WGSL

### GPU-001 — adapter acquisition is fallible and capability-bearing
Clause: https://gpuweb.github.io/gpuweb/#dom-gpu-requestadapter  
Constraint: requestAdapter can return null; an adapter exposes features/limits; adapters may expire.  
Admission: adapter != null and required features/limits satisfied.

### GPU-002 — device loss is part of the lifecycle
Clause: https://gpuweb.github.io/gpuweb/#dom-gpudevice-lost  
Effect: backend state includes loss and reacquisition; loss triggers re-observation/replanning.

### GPU-003 — WGSL is separately governed
Current document: https://gpuweb.github.io/gpuweb/wgsl/  
Effect: shader generation must satisfy current WGSL semantics independently of WebGPU host API correctness.

## WebNN

### NN-001 — context creation is a runtime admission step
API: https://webmachinelearning.github.io/webnn/#api  
Constraint: context creation can reject when policy or implementation support is absent.  
Effect: WebNN is an admitted backend only after context creation and known-graph execution succeed.

## WebCodecs

### CODEC-001 — configuration support must be queried
Clause: https://w3c.github.io/webcodecs/#dom-videodecoder-isconfigsupported  
Effect: a codec name in G does not imply a usable implementation edge in A(t).

### CODEC-002 — hardware acceleration preference is only a hint
Clause: https://w3c.github.io/webcodecs/#hardware-acceleration  
Effect: planner cannot infer actual hardware execution from prefer-hardware/prefer-software.

### CODEC-003 — codecs may be reclaimed
Clause: https://w3c.github.io/webcodecs/#resource-reclamation  
Effect: backend lifecycle must include resource reclamation/closure and replan.

## Media capture

### MEDIA-001 — camera/microphone acquisition is explicit
Clause: https://w3c.github.io/mediacapture-main/#dom-mediadevices-getusermedia  
Effect: camera/microphone availability is admitted only after policy/permission/resource acquisition succeeds.

### MEDIA-002 — device enumeration is separate from capture
Clause: https://w3c.github.io/mediacapture-main/#dom-mediadevices-enumeratedevices  
Effect: discovery and acquisition are different stages.

## Secure context / permissions / policy

### SEC-001 — trustworthiness is computed, not assumed
Algorithm: https://w3c.github.io/webappsec-secure-contexts/#is-origin-trustworthy  
Effect: secure-context-dependent capabilities require a trustworthy environment.

### PERM-001 — permission has explicit state and lifetime
Section: https://w3c.github.io/permissions/#permissions  
Effect: granted/prompt/denied and permission lifetime belong in runtime state.

### PERM-002 — revocation is observable state change
Section: https://w3c.github.io/permissions/#reacting-to-revocation  
Effect: revocation can invalidate A(t) and force replan.

### POLICY-001 — powerful features can also be policy-controlled
Definition: https://w3c.github.io/webappsec-permissions-policy/#policy-controlled-feature  
Effect: permission grant alone is insufficient if policy forbids use.

## Storage / persistence

### STORE-001 — persistence is requested
Clause: https://storage.spec.whatwg.org/#dom-storagemanager-persist  
Effect: persistent storage cannot be assumed.

### STORE-002 — quota/usage are runtime observations
Clause: https://storage.spec.whatwg.org/#dom-storagemanager-estimate  
Effect: storage planning requires observed quota/usage rather than fixed constants.

### FS-001 — OPFS root acquisition
Clause: https://fs.spec.whatwg.org/#dom-storagemanager-getdirectory  
Effect: OPFS implementation edge requires successful root acquisition.

### IDB-001 — IndexedDB database model
Clause: https://w3c.github.io/IndexedDB/#database-concept  
Effect: structured persistent database semantics are distinct from OPFS byte/file semantics.

## Service Worker / WebApp lifecycle

### SW-001 — fetch interception is a service-worker functional event
Current document: https://w3c.github.io/ServiceWorker/#fetch-event  
Effect: offline/network strategy is explicit worker machinery.

### SW-002 — Cache lifecycle is author-controlled
Section: https://w3c.github.io/ServiceWorker/#cache-objects  
Effect: generated update logic must version/manage caches; updates do not magically rewrite caches.

### MANIFEST-001 — manifest is application metadata, not installation proof
Current document: https://w3c.github.io/manifest/#web-application-manifest  
Effect: generated manifest is structural output; actual installation/launch capability requires runtime evidence.

## Generic sensors / motion

### SENSOR-001 — Sensor.start() performs admission work
Clause: https://w3c.github.io/sensors/#dom-sensor-start  
Effect: sensor interface presence is insufficient; permission/access activation is part of admission.

### SENSOR-002 — concrete sensors integrate permission/policy
Section: https://w3c.github.io/sensors/#extending-the-permission-api  
Effect: each sensor implementation edge records its permission and policy-controlled features.

### MOTION-001 — Device Orientation and Motion requires explicit permission integration
Current document: https://w3c.github.io/deviceorientation/#permissions  
Effect: device-orientation/motion admission includes feature-specific permission and transient-activation rules.

### MOTION-002 — Gyroscope is retained but not preferred blindly
Current document: https://w3c.github.io/gyroscope/  
Constraint: the current document states that it is maintained for existing deployments and recommends Device Orientation and Motion for new projects because of cross-engine support.  
Effect: keep both implementation edges; admission/planning chooses based on legal/runtime evidence.

### LIGHT-001 — ambient-light readings are intentionally quantized
Current API: https://w3c.github.io/ambient-light/#ambientlightsensor-interface  
Effect: FactTest must not assume raw device precision from AmbientLightSensor.

## Geolocation

### GEO-001 — position acquisition is asynchronous and permission-sensitive
Clause: https://w3c.github.io/geolocation/#dom-geolocation-getcurrentposition  
Effect: geolocation is an admitted capability only after successful position acquisition.

## WebXR

### XR-001 — session support query and session acquisition are distinct
Support: https://immersive-web.github.io/webxr/#dom-xrsystem-issessionsupported  
Session: https://immersive-web.github.io/webxr/#dom-xrsystem-requestsession  
Effect: support indication does not equal an active usable XR session.

### XR-002 — spatial tracking is policy-controlled
Section: https://immersive-web.github.io/webxr/#permissions-policy  
Effect: XR admission includes policy/permission state.

## HID

### HID-001 — user selection gates HID access
Clause: https://wicg.github.io/webhid/#dom-hid-requestdevice  
Effect: interface exposure is not device permission.

### HID-002 — opened state gates transfer
Clause: https://wicg.github.io/webhid/#dom-hiddevice-open  
Effect: reports are legal only after successful open; disconnect/forget are distinct lifecycle states.

## USB

### USB-001 — USB device access is selected by the user
Clause: https://wicg.github.io/webusb/#dom-usb-requestdevice  
Effect: USB device implementation edges require user selection/permission.

### USB-002 — device open is distinct from selection
Clause: https://wicg.github.io/webusb/#dom-usbdevice-open  
Effect: device acquisition and communication readiness are separate states.

## Serial

### SERIAL-001 — requestPort requires user-selection conditions
Clause: https://serial.spec.whatwg.org/#dom-serial-requestport  
Effect: policy and transient activation can block acquisition.

### SERIAL-002 — communication requires open state
Clause: https://serial.spec.whatwg.org/#dom-serialport-open  
Effect: connect/disconnect and stream errors belong in lifecycle state.

## Bluetooth

### BT-001 — Bluetooth device access is user-selected
Clause: https://webbluetoothcg.github.io/web-bluetooth/#dom-bluetooth-requestdevice  
Effect: interface exposure is not access to a usable Bluetooth device.

### BT-002 — GATT connection is a separate runtime transition
Clause: https://webbluetoothcg.github.io/web-bluetooth/#dom-bluetoothremotegattserver-connect  
Effect: selected device != connected GATT backend.

## Threading

### THREAD-001 — Threads proposal defines shared-memory semantics
Current proposal document: https://webassembly.github.io/threads/core/  
Memory types: https://webassembly.github.io/threads/core/syntax/types.html#memory-types  
Effect: proposal-based shared memory/atomic operations are a distinct implementation family.

### THREAD-002 — shared-everything threads is separate future machinery
Actual proposal document:
https://raw.githubusercontent.com/WebAssembly/shared-everything-threads/main/proposals/shared-everything-threads/Overview.md  
Effect: do not silently treat shared-everything functionality as current Core 3.0 browser semantics.

See [CONFLICT-LEDGER.md](CONFLICT-LEDGER.md).
