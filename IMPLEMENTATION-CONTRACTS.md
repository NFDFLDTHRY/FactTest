# FactTest Implementation Contracts

STATUS: PASS 5  
DATE: 2026-09-23

## 1. Contract schema

\`\`\`text
ImplementationContract
  implementation_id
  semantic_capabilities[]
  accepted_representations[]
  produced_representations[]
  supported_transfer_modes[]
  semantic_effects[]
  static_preconditions[]
  dynamic_requirements[]
  lifecycle_states[]
  lifecycle_transitions[]
  failure_contract[]
  release_contract
  authority_links[]
  admission_probes[]
  evidence_requirements[]
  measurable_cost_dimensions[]
  fallback_or_equivalence_relations[]
  codegen_recipe_id
  status
\`\`\`

\`status\` may be READY-CONTRACT, GAP, ERR, or UNK at design time.
A GAP/ERR contract family remains in G.

## 2. Authority rule

Every externally constrained backend contract carries direct links to the exact current clause where available.

REFERENCE-AUTHORITY.md remains the cross-project authority map.
This file binds those authorities to implementation-contract fields.

## 3. Contract families

### CPU_WASM64

Semantic capabilities:
general deterministic computation representable in Rust/Wasm.

Authority:
- Rust wasm64 target: https://doc.rust-lang.org/rustc/platform-support/wasm64-unknown-unknown.html
- Wasm address types: https://webassembly.github.io/spec/core/text/types.html#text-addrtype
- memory types: https://webassembly.github.io/spec/core/text/types.html#text-memtype

Static:
target wasm64-unknown-unknown; wasm32 fallback forbidden by project law.

Dynamic:
host compiles/instantiates artifact; required imports/memory model available.

Lifecycle:
READY, ACTIVE, CLOSED; trap/failure paths represented.

Evidence:
artifact identity, validation, known-answer execution.

### WORKER_DEDICATED

Semantic capabilities:
parallel/off-main-thread execution where semantics permit.

Authority:
https://html.spec.whatwg.org/multipage/workers.html#workers

Dynamic:
Worker construction/messaging/transfer path succeeds.

Lifecycle:
DISCOVERED, READY, ACTIVE, CLOSED/terminated.

Evidence:
known-answer worker round trip.

### WASM_SHARED_THREADS

Status:
ERR/GAP at universal-baseline boundary.

Current JS authority:
https://webassembly.github.io/spec/js-api/#internal-storage
D13 ANNOTATION (fragment #internal-storage): the citation above is preserved exactly as historically written.  It is NOT asserted to be a currently valid fragment: the pinned source WebAssembly/spec@608711107b has no id "internal-storage" (it has #webassembly-storage and #store) - FRAGMENT_DRIFT [ERR]; whether the published rendering still carries an alias is [UNK] (host denied).  Semantic resolution is deferred to the D14 technical reference rescan (design/environment-map/AUTHORITY-REGISTER.md AUTH-WASM-JSAPI-STORAGE; docs/HANDOFF.md section 6).

Threads proposal:
https://webassembly.github.io/threads/core/
https://webassembly.github.io/threads/core/syntax/types.html#memory-types

Contract:
remain in G; runtime/toolchain proposal support and required isolation/shared-memory conditions must be explicitly admitted.

Evidence:
actual concurrent shared-memory/atomic known-answer fixture.

### WEBGPU

Semantic capabilities:
GPU-compute/render operations registered by future semantic lowering.

Authority:
- requestAdapter: https://gpuweb.github.io/gpuweb/#dom-gpu-requestadapter
- requestDevice: https://gpuweb.github.io/gpuweb/#dom-gpuadapter-requestdevice
- device lost: https://gpuweb.github.io/gpuweb/#dom-gpudevice-lost
- WGSL: https://gpuweb.github.io/gpuweb/wgsl/

Dynamic:
navigator.gpu, adapter, required features/limits, device, shader/known-answer probe.

Lifecycle:
UNAVAILABLE, DISCOVERED, REQUESTING, READY, ACTIVE, LOST, RECOVERING, CLOSED.

Evidence:
features/limits + shader compilation + known-answer readback + loss handling.

### WEBNN

Authority:
https://webmachinelearning.github.io/webnn/#api

Dynamic:
navigator.ml/context creation, required operations/data types, known graph dispatch.

Failure:
policy/security unsupported/context errors preserved distinctly.

Evidence:
context + known tensor graph/output.

### WEBCODECS

Authority:
- support query: https://w3c.github.io/webcodecs/#dom-videodecoder-isconfigsupported
- hardware preference: https://w3c.github.io/webcodecs/#hardware-acceleration
- resource reclamation: https://w3c.github.io/webcodecs/#resource-reclamation

Dynamic:
specific codec configuration supported; configure/known encode/decode succeeds.

Lifecycle:
READY, ACTIVE, SATURATED, CLOSED/reclaimed.

Rule:
hardware preference hint is not proof of hardware execution.

### CAMERA

Authority:
https://w3c.github.io/mediacapture-main/#dom-mediadevices-getusermedia

Dynamic:
secure context/policy/permission/resource acquisition/video track.

Lifecycle:
REQUESTING, READY, ACTIVE, REVOKED/LOST, CLOSED.

Evidence:
minimal video-track/frame witness without unnecessary raw sensitive-media retention.

### MICROPHONE

Authority:
https://w3c.github.io/mediacapture-main/#dom-mediadevices-getusermedia

Dynamic:
secure context/policy/permission/resource acquisition/audio track.

Evidence:
minimal audio-track/sample witness.

### GENERIC_SENSOR

Authority:
- start: https://w3c.github.io/sensors/#dom-sensor-start
- permission integration: https://w3c.github.io/sensors/#extending-the-permission-api

Contract family shared by concrete sensors.
Concrete sensor contract adds semantic reading/type/precision constraints.

### ACCELEROMETER

Authority:
https://w3c.github.io/accelerometer/

Requires:
GENERIC_SENSOR admission plus valid acceleration readings.

### GYROSCOPE

Authority:
https://w3c.github.io/gyroscope/

Observation:
current document guides new cross-engine work toward Device Orientation and Motion.
Contract remains in G.

### MAGNETOMETER

Authority:
https://w3c.github.io/magnetometer/

Requires:
GENERIC_SENSOR admission plus magnetometer-specific permission/reading semantics.

### ORIENTATION_SENSOR

Authority:
https://w3c.github.io/orientation-sensor/

Requires:
underlying sensor/permission composition and valid orientation output.

### DEVICE_ORIENTATION_MOTION

Authority:
- current document: https://w3c.github.io/deviceorientation/
- permissions: https://w3c.github.io/deviceorientation/#permissions

Dynamic:
feature-specific permission/activation where required and events observed.

### PROXIMITY_SENSOR

Authority:
https://w3c.github.io/proximity/

Status:
retain in G; runtime admission required.

### AMBIENT_LIGHT_SENSOR

Authority:
https://w3c.github.io/ambient-light/#ambientlightsensor-interface

Contract:
quantized/limited precision semantics must be preserved; do not expose false raw precision.

### GEOLOCATION

Authority:
https://w3c.github.io/geolocation/#dom-geolocation-getcurrentposition

Dynamic:
policy/permission + successful position acquisition.

Failure:
denied/timeout/position unavailable remain distinct.

### WEBXR

Authority:
- support: https://immersive-web.github.io/webxr/#dom-xrsystem-issessionsupported
- session: https://immersive-web.github.io/webxr/#dom-xrsystem-requestsession
- policy: https://immersive-web.github.io/webxr/#permissions-policy

Dynamic:
support query plus actual session acquisition/required features.

Lifecycle:
REQUESTING, READY/ACTIVE, LOST/session end, CLOSED.

### FETCH_STREAMS

Authority:
- Fetch: https://fetch.spec.whatwg.org/
- Streams: https://streams.spec.whatwg.org/

Contract:
request/response/stream representation transitions are explicit; CORS/status/body failures preserved.

### STORAGE_MANAGER

Authority:
- persist: https://storage.spec.whatwg.org/#dom-storagemanager-persist
- estimate: https://storage.spec.whatwg.org/#dom-storagemanager-estimate

Dynamic:
quota/usage/persistence state observed, never fixed constants.

### OPFS

Authority:
https://fs.spec.whatwg.org/#dom-storagemanager-getdirectory

Dynamic:
root/handle acquisition and byte-exact read/write fixture.

Lifecycle:
handle invalidation/reacquisition and quota failures represented.

### INDEXEDDB

Authority:
https://w3c.github.io/IndexedDB/#database-concept

Contract:
transactional structured persistence, versionchange/abort/error lifecycle.

### CACHE_STORAGE

Authority:
https://w3c.github.io/ServiceWorker/#cache-objects

Contract:
request/response cache semantics and explicit version lifecycle.

### SERVICE_WORKER

Authority:
https://w3c.github.io/ServiceWorker/#fetch-event

Contract:
registration/install/activate/control/fetch lifecycle, failed-update retention.

### WEBAPP_MANIFEST

Authority:
https://w3c.github.io/manifest/#web-application-manifest

Contract:
manifest metadata generation only.
Actual installation/launch requires runtime evidence.

### SECURE_CONTEXT

Authority:
https://w3c.github.io/webappsec-secure-contexts/#is-origin-trustworthy

Contract:
trustworthiness observation gates dependent implementations.

### PERMISSIONS

Authority:
- model: https://w3c.github.io/permissions/#permissions
- revocation: https://w3c.github.io/permissions/#reacting-to-revocation

Contract:
permission state/lifetime/revocation where feature spec integrates it.
Not a universal permission oracle.

### PERMISSIONS_POLICY

Authority:
https://w3c.github.io/webappsec-permissions-policy/#policy-controlled-feature

Contract:
policy can reject capability use independently of API presence/permission.

### WEBHID

Authority:
- requestDevice: https://wicg.github.io/webhid/#dom-hid-requestdevice
- open: https://wicg.github.io/webhid/#dom-hiddevice-open

Dynamic:
chooser/permission + open + report-path fixture.

Lifecycle:
disconnect/forget/revoke represented.

### WEBUSB

Authority:
- requestDevice: https://wicg.github.io/webusb/#dom-usb-requestdevice
- open: https://wicg.github.io/webusb/#dom-usbdevice-open

Dynamic:
selection + open/config/interface + known transfer fixture.

### WEB_SERIAL

Authority:
- requestPort: https://serial.spec.whatwg.org/#dom-serial-requestport
- open: https://serial.spec.whatwg.org/#dom-serialport-open

Dynamic:
policy/activation/chooser + port open + byte-stream fixture.

Lifecycle:
disconnect/stream errors/close/reacquire.

### WEB_BLUETOOTH

Authority:
- requestDevice: https://webbluetoothcg.github.io/web-bluetooth/#dom-bluetooth-requestdevice
- GATT connect: https://webbluetoothcg.github.io/web-bluetooth/#dom-bluetoothremotegattserver-connect

Dynamic:
selection + GATT connect + required service/characteristic.

Lifecycle:
disconnect/reconnect/permission loss.

## 4. Shared contract rule

Every backend must eventually declare concrete representation IDs, transfer modes, probes, failures, release behavior, cost metrics and codegen recipe before status can become READY-CONTRACT.

No backend is considered implemented or admitted merely because this design contract exists.
