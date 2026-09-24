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

## ERR-002 — Current Wasm JS embedding vs Threads proposal

Current JS Interface:
https://webassembly.github.io/spec/js-api/#internal-storage

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
