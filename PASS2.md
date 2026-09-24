# FactTest Pass 2 — Live Authority Mapping

STATUS: PASS 2 EXECUTED  
DATE: 2026-09-23  
BASE: a8eda173dfa7d4521933b66030c73fc8c4a0fe04

## 0. Purpose

Pass 2 maps the complete approved FactTest target onto current external authority without shrinking the target.

Pass 2 does not implement the compiler.

Its product is a constraint graph:

\`\`\`text
APPROVED SYSTEM G
      |
      +-- current external semantics
      +-- project decisions
      +-- implementation evidence
      +-- runtime evidence requirements
      +-- dependencies
      +-- preconditions
      +-- failure/lifecycle states
      +-- tests
      +-- conflicts
      '-- gaps
\`\`\`

The current authoritative document and exact clause are preferred for current semantics.
Reproducibility pins are a separate concern.

## 1. Target preservation

The complete capability universe from Pass 1 remains present:

\`\`\`text
CPU / Rust / Wasm64
workers
shared/threaded execution
WebGPU / WGSL
WebNN
WebCodecs
camera / microphone
sensors
geolocation
XR
Fetch / Streams / host communication
Storage / OPFS / IndexedDB / CacheStorage
Service Worker / PWA lifecycle
permissions / secure-context / policy
HID
USB
Serial
Bluetooth
future explicitly-approved capability implementations
\`\`\`

No target node was removed because a standard is immature, a browser lacks support, permission can be denied, a proposal is unresolved, or another backend is easier.

## 2. Authority dimensions

A FactTest claim can have four independent sources:

\`\`\`text
CURRENT SEMANTICS
PROJECT DECISION
PINNED IMPLEMENTATION
RUNTIME EVIDENCE
\`\`\`

They are not interchangeable.

Examples:

- Current WebAssembly Core determines current Wasm semantics.
- Rust target documentation/source determines what Rust's wasm64 target does.
- "wasm32 fallback forbidden" is a FactTest project decision.
- Successful execution in the target browser/device is runtime evidence.

See [REFERENCE-AUTHORITY.md](REFERENCE-AUTHORITY.md) and [CONSTRAINT-LEDGER.md](CONSTRAINT-LEDGER.md).

## 3. Runtime admission model

Pass 1 defined:

- G = approved capability universe
- C = implementations currently materialized
- M(t) = capabilities currently exposed by the browser/device
- A(t) = capabilities admitted after policy/permission/feature/limit/execution checks
- P(t) = verified execution plan

Pass 2 refines admission to:

\`\`\`text
CAPABILITY NODE IN G
        |
        v
interface exposed?
        |
secure context / origin valid?
        |
Permissions Policy allows?
        |
permission / chooser / user activation satisfied?
        |
features / limits / configuration supported?
        |
resource acquisition succeeds?
        |
minimal known operation succeeds?
        |
loss / revoke / disconnect state observable?
        |
        v
implementation edge enters A(t)
\`\`\`

Not every capability uses every gate. Each backend contract records the applicable subset.

## 4. Authority dependency graph

Major dependency relations established by current specifications:

\`\`\`text
Rust compiler
  -> Rust Reference
  -> rustc target behavior
  -> Cargo build-std
  -> core / optional alloc
  -> WebAssembly target

WebAssembly browser embedding
  -> WebAssembly Core
  -> WebAssembly JS Interface
       -> ECMAScript
       -> Infra
  -> WebAssembly Web API
       -> Fetch
       -> HTML
       -> Web IDL

Web platform
  -> Infra
  -> Web IDL
  -> ECMAScript
  -> DOM
  -> HTML
  -> Fetch
  -> Streams

WebGPU
  -> Web IDL / HTML host
  -> WGSL
  -> runtime adapter/features/limits/device-loss state

WebNN
  -> Web IDL / HTML host
  -> Permissions Policy
  -> optional WebGPU-device context

WebCodecs
  -> Web IDL
  -> HTML
  -> DOM
  -> Streams
  -> codec registries
  -> Media Capabilities / WebRTC-related referenced concepts

Media Capture
  -> secure contexts
  -> permissions
  -> Permissions Policy
  -> HTML / Web IDL

Generic Sensor family
  -> secure contexts
  -> permissions
  -> Permissions Policy
  -> Generic Sensor base model
  -> concrete sensor specification

Storage
  -> Storage Standard
  -> File System / OPFS
  -> IndexedDB
  -> Service Worker CacheStorage

Service Worker
  -> HTML worker model
  -> Fetch
  -> Storage
  -> CacheStorage

Device APIs
  -> secure contexts
  -> policy/permission or user-selection boundary
  -> device-specific lifecycle
\`\`\`

## 5. Capability families and legal alternatives

Pass 2 distinguishes a semantic need from a particular API.

Examples:

\`\`\`text
SEMANTIC: video decode
  -> WebCodecs implementation
  -> Wasm implementation
  -> future explicitly-qualified implementation

SEMANTIC: device rotation / motion
  -> Device Orientation and Motion
  -> Gyroscope
  -> Orientation Sensor
  -> fused sensor implementations

SEMANTIC: computation
  -> CPU/Wasm64
  -> WebGPU/WGSL
  -> WebNN where the operation is representable

SEMANTIC: persistent bytes/data
  -> OPFS
  -> IndexedDB
  -> CacheStorage for request/response assets
\`\`\`

Pass 2 does not choose the fastest alternative. It establishes legality, preconditions, failure modes, and what evidence later planning requires.

## 6. Transfer and lifetime boundaries

Pass 2 identifies transfer/lifetime boundaries the future planner must model:

- JS host memory <-> Wasm linear memory
- main realm <-> worker
- JS/Wasm memory <-> GPU buffers/textures
- WebCodecs VideoFrame/AudioData ownership, transfer, clone and close lifecycle
- Fetch/Streams <-> decoders/storage
- OPFS/IndexedDB <-> host/Wasm representations
- sensor/media/device readings <-> host capability membrane <-> Wasm
- device/resource loss and reacquisition

No performance cost is invented in Pass 2. Pass 5 must define measured cost units.

## 7. Security topology

Powerful capability admission is not equivalent to API presence.

\`\`\`text
origin/environment
  -> secure-context determination
  -> Permissions Policy
  -> Permissions / feature-specific user consent
  -> transient activation / chooser when required
  -> resource acquisition
  -> execution probe
\`\`\`

The Permissions specification explicitly notes that its model does not fit every web permission. FactTest therefore models feature-specific admission instead of assuming every capability can be represented by navigator.permissions alone.

## 8. Lifecycle/failure model

Future backend contracts must represent at least:

\`\`\`text
UNAVAILABLE
DISCOVERED
PERMISSION/POLICY BLOCKED
ACQUIRING
READY
ACTIVE
THROTTLED / SATURATED
LOST / DISCONNECTED / REVOKED
RECOVERING
CLOSED
\`\`\`

Only states meaningful for a particular capability are instantiated.

Examples already established by authority:

- WebGPU adapters can be unavailable/expire and devices can be lost.
- WebCodecs configurations may be unsupported and codecs may be reclaimed under resource pressure.
- permissions have state and lifetime and can be revoked.
- media tracks and physical devices can cease to be available.
- serial/HID devices expose connect/disconnect/open/close states.
- XR support and session acquisition are separate questions.
- service-worker caches require explicit lifecycle/version management.

## 9. Threading boundary

Shared/threaded execution remains in G.

Current WebAssembly JS Interface, 21 September 2026, still states in its internal-storage model that WebAssembly objects, memory, and addresses are not shared among agents in that specification.

The separate Threads proposal defines shared memory and atomic/wait/notify semantics.

Therefore shared-memory Wasm threading remains a target implementation family but is not silently treated as fully integrated into current Core+JS browser authority.

See [CONFLICT-LEDGER.md](CONFLICT-LEDGER.md).

## 10. Project-design frontier

After external authority mapping, these remain project-owned:

- structural-delta schema
- ASCII concrete grammar
- compilation-unit boundaries
- AST representation
- name/type/ownership resolution
- typed System IR
- effect semantics
- capability IR
- structural proof logic/kernel
- proof certificate
- implementation-hypergraph schema
- planner interface
- cost/measurement model
- fallback/replan verification
- first-party allocator strategy if alloc is admitted
- runtime evidence schema
- capability-admission receipt
- observed-ASCII writer
- station registry
- re-inspection protocol

External standards constrain these designs where they touch externally defined behavior, but do not define them for FactTest.

## 11. Fable handoff test

A future Fable implementation task passes the documentation-usability test only when it can answer:

1. What semantic operation is being implemented?
2. What capability/backend edge is being used?
3. What current external clause constrains it?
4. What project decision further constrains it?
5. What preconditions admit it?
6. What failure/loss states must be represented?
7. What test witnesses correct behavior?
8. What evidence must be emitted?
9. What fallback/replan path exists?
10. What remains explicitly unknown?

The ledgers in this Pass 2 are written to make those questions answerable without guessing.

## 12. Pass 2 closure

[RUN] Complete G preserved.  
[RUN] Current-authority and reproducibility axes separated.  
[RUN] Clause-level authority map expanded and rechecked.  
[RUN] Browser/runtime admission model derived.  
[RUN] Authority dependencies mapped.  
[RUN] Security/permission topology mapped.  
[RUN] Transfer/lifetime boundaries identified.  
[RUN] Failure/lifecycle classes identified.  
[RUN] Capability alternatives preserved.  
[RUN] Test/evidence obligations derived.  
[RUN] Conflicts preserved instead of reconciled by convenience.  
[RUN] Project-owned design frontier isolated.

Pass 2 closes as a reference-constrained complete-system map.

It does not claim that any compiler machinery is implemented.

Next: Pass 3 — Bootstrap Reference Compiler.
