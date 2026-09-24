# FactTest Conflict Ledger

STATUS: PASS 2  
OBSERVED: 2026-09-23

Conflicts are preserved. Pass 2 does not hide disagreement by rewriting the model.

## ERR-001 — Rust wasm64 prose vs current WebAssembly 3.0 status

Rust target authority:
https://doc.rust-lang.org/rustc/platform-support/wasm64-unknown-unknown.html

Current WebAssembly authority:
https://webassembly.github.io/spec/core/
https://webassembly.github.io/spec/core/text/types.html#text-addrtype
https://webassembly.github.io/spec/core/appendix/changes.html

Observed:
- Rust wasm64 documentation is implementation authority for Rust's target.
- Current WebAssembly 3.0 Release 3.0, 21 September 2026, defines i64 address types for memories/tables and records 64-bit address space in the change history.
- Older/current rustc prose has described Memory64 as not standardized.

Resolution:
- current WebAssembly Core governs current WebAssembly semantics/status.
- rustc target docs/source govern Rust target behavior.
- do not copy the stale standards-status claim into FactTest architecture law.

Status: [ERR] authority/version skew, bounded by authority split.
D18 ANNOTATION (ERR-001 current): the rustc wasm64 page still says memory64 is "not standardized" both at the rust main tip
(D15 CL-R7) and at the toolchain FactTest runs, nightly 6eeff9a52 (D17 CL-IMP-RS2); Core 3.0 standardizes 64-bit address
types (D15 CL-W4).  The conflict is current and the resolution above stands.

## ERR-002 — Current Wasm JS embedding vs Threads proposal

Current JS Interface:
https://webassembly.github.io/spec/js-api/#internal-storage
D13 ANNOTATION (fragment #internal-storage): the citation above is preserved exactly as historically written.  It is NOT asserted to be a currently valid fragment: the pinned source WebAssembly/spec@608711107b has no id "internal-storage" (it has #webassembly-storage and #store) - FRAGMENT_DRIFT [ERR]; whether the published rendering still carries an alias is [UNK] (host denied).  Semantic resolution is deferred to the D14 technical reference rescan (design/environment-map/AUTHORITY-REGISTER.md AUTH-WASM-JSAPI-STORAGE; docs/HANDOFF.md section 6).
D14 ANNOTATION (fragment #internal-storage): confirmed at the published rendering taken from WebAssembly/spec gh-pages@dcb71aa493d7 (fixtures/reference/published/webassembly.github.io/spec/js-api/index.html, evidence/D14/audit/fragments.json): no element carries id "internal-storage"; the section is <h2 id="webassembly-storage"> (also #store).  Historical citation preserved; NOT asserted current [ERR]; the rendering was not observed at the published host (egress denied).
D18 ANNOTATION (fragment #internal-storage, resolved): D14 found the cited clause at #webassembly-storage in the pinned and
current source (locator move, clause text unchanged); D15 cites the agent-local clause at #store (CL-T1).  Current authority
node: AUTH-WASM-JSAPI-STORAGE-D18 (supersedes AUTH-WASM-JSAPI-STORAGE).  The URL above is kept as historically written.

Threads proposal:
https://webassembly.github.io/threads/core/
https://webassembly.github.io/threads/core/syntax/types.html#memory-types

Observed:
- current JS Interface, Editor's Draft 21 September 2026, says its model does not share WebAssembly objects, memory or addresses among agents.
- the separate Threads proposal defines shared-memory and atomic/wait/notify semantics.

Resolution:
- shared/threaded execution stays in G.
- proposal/runtime-backed threading is a distinct implementation edge.
- it cannot be marked as unconditionally admitted by current Core+JS documents.
- actual Chrome/runtime admission requires explicit evidence.

Status: [ERR] standards-integration boundary, unresolved as a universal backend.
D18 ANNOTATION (ERR-002 precision): the standard gates SharedArrayBuffer SERIALIZATION on the cross-origin isolated
capability (HTML, D15 CL-T4); whether the SharedArrayBuffer global exists is host-defined (ECMA-262, D15 CL-T6), and
Chromium 141 installs the constructor only when the context may transfer SharedArrayBuffers (D17 CL-IMP-SAB1).  Cross-origin
isolation is reachable (FACT-SH-SW-GRANTS-COI); no fixture admits shared memory.  Current fact:
FACT-SHARED-THREADS-UNADMITTED-D18 (supersedes FACT-SHARED-THREADS-UNADMITTED).

## ERR-003 — Shared-Everything Threads is future/proposal machinery

Actual proposal document:
https://raw.githubusercontent.com/WebAssembly/shared-everything-threads/main/proposals/shared-everything-threads/Overview.md

Observed:
- proposal adds thread-spawning/shared-everything machinery not represented by current Core 3.0 browser semantics.
- open proposal issues/discussions remain.

Resolution:
- retain as future implementation family.
- never compile against it as current baseline without an explicit toolchain/runtime pin and execution evidence.

Status: [GAP] proposal maturity/runtime admission.
D18 ANNOTATION (ERR-003 maturity): shared-everything threads is Phase 1 in the proposal registry (D14) and an experimental,
disabled flag in V8 14.1.146.11 (Chromium 141; D17 CL-IMP-V8A).

## OBS-004 — Gyroscope vs Device Orientation and Motion

Gyroscope:
https://w3c.github.io/gyroscope/

Device Orientation and Motion:
https://w3c.github.io/deviceorientation/

Observed:
- the current Gyroscope document says it is maintained for existing deployments and recommends Device Orientation and Motion for new projects because of cross-engine support.

Resolution:
- not a deletion.
- both remain legal implementation edges in G.
- future planner/admission chooses from evidence and semantic fit.

Status: [OBS] authority guidance, no contradiction.
D18 ANNOTATION (OBS-004 extended by D16): the same advisement now covers Accelerometer and Orientation Sensor; Magnetometer and
Ambient Light are not available by default in any engine and Proximity is implemented by none (FACT-SENSOR-FAMILY-ADVISEMENT).
Every row stays in G; admission may use either path per evidence; choosing one routing is an owner decision (docs/HANDOFF.md
OWNER row).

## OBS-005 — Permissions API is not a universal permission oracle

Permissions:
https://w3c.github.io/permissions/#permissions

Observed:
- the specification explicitly notes that different APIs have different permission models and that the common model is not expected to fit every current/future permission.

Resolution:
- FactTest uses a capability-specific permission/chooser contract.
- navigator.permissions is used only where the governing capability specification integrates with it.

Status: [OBS] architecture constraint.

## OBS-006 — Manifest presence is not installation proof

Manifest:
https://w3c.github.io/manifest/#web-application-manifest

Observed:
- manifest defines application metadata/processing.
- runtime installability/installation/launch behavior remains user-agent state outside the mere existence of the JSON manifest.

Resolution:
- structural manifest generation belongs to codegen.
- actual installation/launch claims require runtime evidence.

Status: [OBS] proof-boundary distinction.

## OBS-007 — WebCodecs hardware preference is not backend identity

Hardware acceleration:
https://w3c.github.io/webcodecs/#hardware-acceleration

Observed:
- prefer-hardware and prefer-software are hints that user agents may ignore.

Resolution:
- backend plan may request preference.
- evidence must establish actual behavior/performance; no proof may say "hardware codec" solely from the preference field.

Status: [OBS] planning constraint.

## OBS-008 — hardwareConcurrency is not resource ownership

HTML:
https://html.spec.whatwg.org/multipage/workers.html#navigator.hardwareconcurrency

Observed:
- value represents logical processors potentially available to the user agent and can be reduced.

Resolution:
- use only as one runtime observation.
- never prove exclusive cores/cycles or deterministic parallel capacity from this value.

Status: [OBS] machine-model boundary.
