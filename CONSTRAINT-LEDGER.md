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
D18 ANNOTATION (fragment #streaming-module-compilation-and-instantiation): no such id exists in the pinned or current source
(D14 [ERR]); the clause is at #streaming-modules (D14 revision; D15 clauses CL-S1..CL-S4).  Current authority node:
AUTH-WASM-WEBAPI-STREAMING-D18 (supersedes AUTH-WASM-WEBAPI-STREAMING).  The URL above is kept as historically written.
Constraint: streaming compilation rejects unsuitable CORS/status/MIME responses; application/wasm is part of the delivery contract.  
Test: wrong MIME and non-ok response fixtures must fail admission.

### WA-005 — current JS embedding is agent-local
Section: https://webassembly.github.io/spec/js-api/#internal-storage  
D13 ANNOTATION (fragment #internal-storage): the citation above is preserved exactly as historically written.  It is NOT asserted to be a currently valid fragment: the pinned source WebAssembly/spec@608711107b has no id "internal-storage" (it has #webassembly-storage and #store) - FRAGMENT_DRIFT [ERR]; whether the published rendering still carries an alias is [UNK] (host denied).  Semantic resolution is deferred to the D14 technical reference rescan (design/environment-map/AUTHORITY-REGISTER.md AUTH-WASM-JSAPI-STORAGE; docs/HANDOFF.md section 6).
D18 ANNOTATION (fragment #internal-storage, resolved): D14 found the cited clause at #webassembly-storage in the pinned and
current source (locator move, clause text unchanged); D15 cites the agent-local clause at #store (CL-T1).  Current authority
node: AUTH-WASM-JSAPI-STORAGE-D18 (supersedes AUTH-WASM-JSAPI-STORAGE).  The URL above is kept as historically written.
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

D18 ANNOTATION (constraints ledgered): the constraints below were PROPOSED nodes of design/environment-map/graph.json
(D11, D13, D15, D16).  From D18-REPO-RECONCILIATION on they are project law in this ledger.  Each statement is verbatim
from the graph node; the authorities are the current ones (superseded pins replaced by their successors, D18
reconciliation R-10..R-14, R-48).  The graph keeps ledger_status PROPOSED on each node as history; its LEDGERED_IN edge
to LAW-CONSTRAINT-LEDGER is the current status (tests/reconcile/d18-reconciliation.json R-21).

### CON-EM-001 (D11, external) - ledgered D18
Constraint: navigator.gpu is a [SecureContext] attribute: WebGPU exposure requires a secure context, and the loopback origin 127.0.0.0/8 is potentially trustworthy.  
Authorities: AUTH-GPU-NAVIGATOR-GPU, AUTH-SECCTX-TRUSTWORTHY  
Scope: host

### CON-EM-002 (D11, external) - ledgered D18
Constraint: A fallback/software adapter (GPUAdapterInfo.isFallbackAdapter, architecture 'swiftshader') is browser WebGPU API execution on the CPU, never hardware GPU execution; hardware evidence needs a non-fallback adapter.  
Authorities: AUTH-GPU-FALLBACK-ADAPTER, AUTH-GPU-ADAPTERINFO, AUTH-IMPL-SWIFTSHADER-README  
Scope: host

### CON-EM-003 (D11, external) - ledgered D18
Constraint: An adapter is single-use (consumed after requestDevice) and may expire at any time; recovery must start again at requestAdapter; requestDevice on an expired adapter yields a device lost with reason 'unknown'.  
Authorities: AUTH-GPU-ADAPTER-EXPIRE, AUTH-GPU-REQUESTDEVICE  
Scope: host

### CON-EM-004 (D11, external) - ledgered D18
Constraint: A wasm64 module produced by rustc assumes bulk-memory, mutable-globals, sign-ext and nontrapping-fptoint; the executing engine must accept these in addition to i64 addresses.  
Authorities: AUTH-RUSTC-WASM64-TARGET-SPEC-D18, AUTH-RUSTC-WASM64-DOC-D18  
Scope: target

### CON-EM-005 (D11, project) - ledgered D18
Constraint: Toolchain identity is recorded per evidence record and never pinned by the repository; a wasm64/no_std claim is valid for the recorded nightly commit and component set only.  
Authorities: AUTH-CARGO-BUILD-STD, LAW-EVIDENCE-OBLIGATIONS  
Scope: toolchain

### CON-EM-006 (D11, external) - ledgered D18
Constraint: Browser flags that enable a software GPU path are implementation switches documented for GL/WebGL; their effect on WebGPU admission is established only by the executed probe, not by documentation.  
Authorities: AUTH-IMPL-CHROMIUM-SWIFTSHADER-DOC-141, AUTH-IMPL-GPU-SWITCHES-141, AUTH-IMPL-GL-SWITCHES-141, AUTH-IMPL-CONTENT-SWITCHES-141  
Scope: host

### CON-EM-007 (D13, project) - ledgered D18
Constraint: Each proof set runs on its pinned toolchain (HOST_NATIVE_SET: rust-toolchain.toml 1.94.1; WASM64_KERNEL_SET: proof-sets.json nightly-2026-09-24, enforced by the qualified runner); evidence still records the observed identity; kernel byte identity is declared per rust-src install name.  
Authorities: AUTH-CARGO-BUILD-STD, LAW-EVIDENCE-OBLIGATIONS  
Scope: toolchain

### CON-FT-004 (D11, project) - ledgered D18
Constraint: canonical_base is a git commit object name; a workpiece is a detached linked worktree at that commit; integration is fast-forward only when the canonical head still equals canonical_base.  
Authorities: AUTH-GIT-GLOSSARY-COMMIT, AUTH-GIT-REVISIONS, AUTH-GIT-WORKTREE, AUTH-GIT-REPO-LAYOUT, LAW-FACTORY-CONTRACTS  
Scope: factory

### CON-FT-005 (D11, project) - ledgered D18
Constraint: Station and fixture surfaces are literal prefix sets ('*', 'dir/', or an exact file); glob-looking entries authorize nothing (D9 [GAP]).  
Authorities: LAW-FACTORY-CONTRACTS  
Scope: factory

### CON-FT-006 (D11, project) - ledgered D18
Constraint: Physical browser evidence is a separate class from synthetic/model evidence; the E0 -> E1 sequence must be witnessed physically with no codegen between epochs and the authored source unchanged.  
Authorities: LAW-PASS6-COMMISSIONING, LAW-RUNTIME-ADMISSION  
Scope: runtime

### CON-FT-007 (D13, project) - ledgered D18
Constraint: Proof records name their proof set, target, profile and toolchain; bare cargo selects HOST_NATIVE_SET (default-members), never the whole project; CROSS_SET and HEURISTIC records carry proof weight NONE.  
Authorities: LAW-FACTORY-CONTRACTS  
Scope: proof

### CON-WA-006 (D15, external) - ledgered D18
Constraint: At the JavaScript boundary every i64 export parameter/result and every i64 address value is a BigInt (ToWebAssemblyValue uses ToBigInt64; ToJSValue returns a mathematical integer; AddressValueToU64 requires BigInt in [0, 2^64-1]); a Number is a TypeError, never a silent coercion.  
Authorities: AUTH-WASM-JSAPI-VALUES, AUTH-WASM-JSAPI-MEMORIES, AUTH-ECMA-262, AUTH-WEBIDL  
Scope: host membrane

### CON-SEC-002 (D15, external) - ledgered D18
Constraint: A secure context is decided by the environment's top-level creation URL, while trust checks on an ORIGIN treat an opaque origin as Not Trustworthy: a sandboxed generation frame under a trustworthy top-level is a secure context with an opaque origin (secure-context APIs exposed; origin storage, SW control and same-origin reach denied).  
Authorities: AUTH-HTML-SECURE-CONTEXT, AUTH-SECCTX-TRUSTWORTHY, AUTH-HTML-SANDBOX-ORIGIN  
Scope: confinement

### CON-PP-001 (D15, external) - ledgered D18
Constraint: A policy-controlled feature whose default allowlist is 'self' is Disabled in a frame that is not same origin with its container unless the container policy (allow attribute) enables it; capability admission inside a confined generation therefore requires an explicit allow= grant AND permission.  
Authorities: AUTH-PERMISSIONS-POLICY, AUTH-PERMISSIONS  
Scope: capability admission

### CON-SW-001 (D15, external) - ledgered D18
Constraint: A service worker's update check fetches its script with service workers bypassed and a failed install keeps the active worker: an installed seed can neither replace itself from its own caches nor be broken by an interrupted update, and cannot be updated at all while its origin is unreachable.  
Authorities: AUTH-FETCH, AUTH-SW-UPDATE-BYPASS, AUTH-SW-INSTALL-FAILED  
Scope: seed lifecycle

### CON-ST-001 (D15, external) - ledgered D18
Constraint: Origin storage is best-effort unless persistence is granted; best-effort buckets may be cleared under storage pressure and persist() is exposed only to windows: durability of Factory-held objects is a UA grant to observe, never an assumption.  
Authorities: AUTH-STORAGE-BUCKET-MODE  
Scope: storage

### CON-GIT-001 (D15, external) - ledgered D18
Constraint: Git object identity is SHA-1 (or SHA-256 by repository format) over the typed header and content, and refs move by compare-and-set; tree-entry ordering is normalized by the implementation without a documented rule, so a non-git tree encoder is correct only where equality with git has been observed.  
Authorities: AUTH-GIT-OBJECT-FORMAT, AUTH-GIT-UPDATE-REF-CAS, AUTH-GIT-MKTREE, AUTH-GIT-SHA256-TRANSITION  
Scope: object store

### CON-CAP-001 (D16, admission) - ledgered D18
Constraint: Interface exposure never admits a capability: admission requires the family's secure-context, policy, permission/chooser and request gates to pass and a known-answer to execute (e.g. Geolocation is exposed without [SecureContext] yet denies every request in a non-secure context; WebNN createContext can reject after navigator.ml is present)  
Authorities: AUTH-GEOLOCATION, AUTH-WEBNN, AUTH-GPU-REQUESTADAPTER  
Scope: every capability family in CAPABILITY-MATRIX.md

### CON-CAP-002 (D16, probe_obligation) - ledgered D18
Constraint: Families whose request algorithm requires transient activation or a chooser (HID, USB, Serial, Bluetooth, immersive XR, device-orientation permission) carry a probe obligation that names its automation path (user gesture, granted permission state, or virtual device); without one they stay [OBS]/[GAP], never [RUN]  
Authorities: AUTH-WEBHID, AUTH-WEBUSB, AUTH-SERIAL, AUTH-WEB-BLUETOOTH, AUTH-WEBXR, AUTH-DEVICE-ORIENTATION  
Scope: chooser/activation-gated families
