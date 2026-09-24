╔══════════════════════════════════════════════════════════════════════╗
║      FACTTEST · SIX-PASS TECHNICAL REFERENCE REVIEW SERIES         ║
║                    D14 → D19 · READ FIRST                          ║
╚══════════════════════════════════════════════════════════════════════╝

PURPOSE

Perform a six-pass technical-reference review and repository update from the
D13 PRE-RESCAN BASELINE.

This is NOT a link-refresh exercise.

The required chain is:

AUTHORITY
   ↓
EXACT CLAUSE / ALGORITHM
   ↓
COMPUTATIONAL CONSEQUENCE
   ↓
PROJECT CONSTRAINT
   ↓
IMPLEMENTATION CONTRACT
   ↓
REQUIRED ENVIRONMENT
   ↓
PROBE
   ↓
EVIDENCE
   ↓
STALE CONDITIONS / ENTITLED CLAIM

Every pass must improve this chain without rewriting history.

──────────────────────────────────────────────────────────────────────
                      CANONICAL MUTATION LAW
──────────────────────────────────────────────────────────────────────

AGENT → ASCII → FACTORY → WORKPIECE → VERIFY → REPO

NEVER:

AGENT -------------------------------------------> REPO

Every pass is a separate StructuralDelta.

Do NOT combine D14-D19 into one giant workpiece.
Close, verify, integrate, execute/probe, collect evidence and re-observe
each pass before beginning the next.

If intended and observed structure differ:
preserve [ERR] / [GAP] / [UNK] and return to ASCII.

──────────────────────────────────────────────────────────────────────
                         FIRST ACTION
──────────────────────────────────────────────────────────────────────

Observe current:
branch
HEAD
tree
status
ancestry

Do not trust a SHA written in this prompt if main has moved.

Read first:

FACTORY-LAW.md
FACTORY-CONTRACTS.md
docs/HANDOFF.md
REFERENCE-AUTHORITY.md
CONSTRAINT-LEDGER.md
CONFLICT-LEDGER.md
CAPABILITY-MATRIX.md
IMPLEMENTATION-CONTRACTS.md
EVIDENCE-OBLIGATIONS.md
RUNTIME-ADMISSION-REPLAN.md
design/environment-map/SCHEMA.md
design/environment-map/graph.json
design/environment-map/AUTHORITY-REGISTER.md
design/environment-map/TRACEABILITY.md
design/materialization/D13-PRE-RESCAN-BASELINE.md
design/materialization/D13-OBSERVED-REPO-HYGIENE.md

Preserve all D0-D13 historical evidence.

If this exact prompt is not tracked, route THIS EXACT PROMPT through the
Factory before the six-pass series as:

design/materialization/D14-D19-TECHNICAL-REFERENCE-REVIEW-PROMPT.md

──────────────────────────────────────────────────────────────────────
                     GLOBAL AUTHORITY LAW
──────────────────────────────────────────────────────────────────────

For every external technical claim preserve TWO identities:

CURRENT AUTHORITY
  published URL
  exact fragment / definition / algorithm where available
  authority owner
  authority class
  maturity/status
  observed date

REPRODUCIBILITY SOURCE
  upstream repository
  exact commit
  exact source path
  locator
  sha256

CURRENT AUTHORITY != REPRODUCIBILITY PIN.

STANDARD != PROPOSAL.
STANDARD != IMPLEMENTATION DOCUMENTATION.
IMPLEMENTATION DOCUMENTATION != RUNTIME OBSERVATION.
API PRESENCE != ADMISSION.
BUILD SUCCESS != EXECUTION.
HARDWARE PREFERENCE != HARDWARE EXECUTION.
SYNTHETIC EVIDENCE != PHYSICAL EVIDENCE.

Never flatten disagreements into one statement.

Classify authority movement as:

UNCHANGED
MOVED
EDITORIAL
SEMANTIC
MATURITY
REMOVED
SPLIT/MERGED
UNREACHABLE
AMBIGUOUS

A changed hyperlink alone is not a completed update.

══════════════════════════════════════════════════════════════════════
║                     D14 · FRONTIER REOPEN                          ║
╚══════════════════════════════════════════════════════════════════════╝

QUESTION:
What has changed in the current authority frontier since the recorded
D11-D13 observations?

For every AUTHORITY node:

existing node
   ↓
open current published authority
   ↓
verify URL
   ↓
verify fragment / clause
   ↓
record current maturity/status
   ↓
compare current source to reproducibility pin
   ↓
classify change

Explicitly revisit D13 class-D items:

- WebAssembly JS API #internal-storage fragment drift
- previously DENIED published authorities
- D12 source-line-only authority records
- coarse whole-document citations
- proposal/draft maturity boundaries
- current conflicts
- public HTTPS / GitHack-related authority where relevant and reachable

DO NOT deeply reconcile the whole repo yet.

OUTPUT:
D14 authority epoch
reopen evidence
old→new locator map
maturity drift
semantic-change candidates
unreachable/ambiguous list
observed ASCII

PASS CONDITION:
we know WHAT MOVED and which downstream claims may now be stale.

══════════════════════════════════════════════════════════════════════
║                 D15 · FOUNDATIONAL SEMANTICS                       ║
╚══════════════════════════════════════════════════════════════════════╝

QUESTION:
What do the foundational computational authorities currently require?

Deeply trace:

Rust Reference
Cargo
rustc wasm64 target/source

WebAssembly Core
WebAssembly JS API
WebAssembly Web API
Memory64
Threads
Shared-Everything Threads

ECMAScript
Web IDL
HTML
Fetch
Streams

Secure Contexts
Permissions
Permissions Policy

Storage
File System / OPFS
IndexedDB
Service Workers
Web Application Manifest

Git object / tree / commit / ref / repository semantics

For each relevant clause follow only sublinks that materially affect:

legality
prerequisites
lifecycle
target behavior
failure behavior
security
storage
admission
proof interpretation

Example trace:

Rust no_std
 → build-std
 → rust-src
 → wasm64 target
 → core-only crate graph
 → FactTest proof obligation

Service Worker
 → registration/update
 → fetch interception
 → offline behavior
 → seed/update/recovery consequences

Git
 → blob/tree/commit encoding
 → object identity
 → ref update/CAS
 → browser object-store consequences

Update current project constraints where authority genuinely changed.
Do not rewrite historical evidence.

PASS CONDITION:
the foundational computational model is current and internally connected.

══════════════════════════════════════════════════════════════════════
║                  D16 · CAPABILITY UNIVERSE                         ║
╚══════════════════════════════════════════════════════════════════════╝

QUESTION:
For every approved capability family in G, what does current authority
actually require for legal runtime admission?

Review at minimum:

WebGPU
WGSL
WebNN
WebCodecs

Media Capture
camera / microphone

Workers
SharedArrayBuffer
cross-origin isolation

Generic Sensor
Accelerometer
Gyroscope
Magnetometer
Orientation
Device Orientation
Proximity
Ambient Light

Geolocation
WebXR
HID
USB
Serial
Bluetooth

storage/runtime capability surfaces already represented in G

For each capability trace:

API/interface
   ↓
secure-context requirement
   ↓
permission / chooser / policy
   ↓
request / construction algorithm
   ↓
features / limits / configuration
   ↓
lifecycle
   ↓
loss / revocation / disconnect
   ↓
runtime admission
   ↓
probe obligation
   ↓
evidence

Every approved family remains in G unless human/ASCII authority removes it.

Missing support does NOT delete the target.

Classify:

[RUN] authority + contract + physical execution
[OBS] observed, execution not established
[GAP] mechanism/probe/evidence missing
[ERR] contradiction/conflict
[UNK] current support/meaning unresolved

PASS CONDITION:
the broad capability-map coverage gap is explicitly mapped rather than hidden.

══════════════════════════════════════════════════════════════════════
║               D17 · IMPLEMENTATION REALITY                         ║
╚══════════════════════════════════════════════════════════════════════╝

QUESTION:
What do the actual implementations FactTest depends on currently do?

Review separately from standards:

rustc source / target specs
Cargo implementation behavior

Chromium
Blink
V8
Dawn
SwiftShader

browser flags / feature switches
headless behavior
storage implementation details
Service Worker implementation details

Playwright behavior used by FactTest probes

relevant Chrome / Android implementation surfaces

For each implementation-dependent fact record:

implementation source
exact source pin
version/revision
environment dimension
associated standard constraint
probe/evidence
STALE_IF condition

Search specifically for places where FactTest accidentally treats:

Chromium behavior → web standard
SwiftShader → hardware GPU
flag enabled → capability admitted
V8 support → universal JS behavior
headless result → installed-device behavior

Preserve implementation-specific truths, but label them correctly.

PASS CONDITION:
standards law, implementation behavior and observed runtime are cleanly
separated and relationally connected.

══════════════════════════════════════════════════════════════════════
║                  D18 · REPO RECONCILIATION                         ║
╚══════════════════════════════════════════════════════════════════════╝

QUESTION:
Given D14-D17, what must change inside the current FactTest model?

Traverse every changed authority downstream:

AUTHORITY CHANGED?
       ↓
CONSTRAINT AFFECTED?
       ↓
COMPUTATIONAL FACT AFFECTED?
       ↓
IMPLEMENTATION CONTRACT AFFECTED?
       ↓
ENVIRONMENT REQUIREMENT AFFECTED?
       ↓
OLD PROBE STILL SUFFICIENT?
       ↓
OLD EVIDENCE STILL APPLICABLE?

Reconcile current surfaces including:

REFERENCE-AUTHORITY.md
CONSTRAINT-LEDGER.md
CONFLICT-LEDGER.md
CAPABILITY-MATRIX.md
IMPLEMENTATION-CONTRACTS.md
EVIDENCE-OBLIGATIONS.md
RUNTIME-ADMISSION-REPLAN.md
PLANNER-COST-MODEL.md

current commissioning/pass contracts where still live

design/environment-map/graph.json
epoch files
AUTHORITY-REGISTER.md
TRACEABILITY.md
SCHEMA.md if required

docs/HANDOFF.md
README.md

Never mutate D0-D17 historical evidence.

If older evidence no longer proves a current claim:

OLD EVIDENCE
   ↓
STALE_IF / INVALIDATED_BY
   ↓
NEW PROBE OBLIGATION

Retire or supersede stale CURRENT statements cleanly.
Do not leave two contradictory current truths in different files.

PASS CONDITION:
the repository expresses one coherent current model while retaining history.

══════════════════════════════════════════════════════════════════════
║                  D19 · RE-PROVE / RE-OBSERVE                       ║
╚══════════════════════════════════════════════════════════════════════╝

QUESTION:
Does the refreshed technical model survive actual execution?

Use graph staleness/dependency traversal to select the MINIMUM affected
physical test set.

Do not rerun expensive probes merely ceremonially.

As required, execute:

qualified Rust/Cargo proof
mutant self-attack
core-only wasm64 build
wasm inspection
Chromium ABI execution

secure-context probes
storage / OPFS / IndexedDB probes
Service Worker probes
Worker / isolation probes
WebGPU admission / loss / fallback probes

affected capability discovery/admission probes
environment identity capture

environment-map validation
authority→claim traversal
Q01..Q16 and additional queries created by D14-D18
staleness traversal

Then compare:

INTENDED CURRENT SYSTEM
        │
        ▼
EXECUTION / PROBES
        │
        ▼
EVIDENCE
        │
        ▼
OBSERVED SYSTEM
        │
    ┌───┴───┐
    ▼       ▼
  MATCH    DIFFER
    │        │
    ▼        ▼
  CLOSE   [ERR]/[GAP]/[UNK]
             │
             └────► ASCII

OUTPUT:
D19 observed ASCII
current evidence epoch
post-rescan graph
current entitled-claim surface
new stable baseline

══════════════════════════════════════════════════════════════════════
║                    CROSS-PASS INVARIANTS                           ║
╚══════════════════════════════════════════════════════════════════════╝

[INV] FACTORY-LAW remains constitutional.
[INV] ASCII remains the human/AI source of authority.
[INV] Historical evidence is immutable.
[INV] Current authority and reproducibility pins remain distinct.
[INV] Authority maturity/status is preserved.
[INV] Proposals never silently become baseline standards.
[INV] Implementation documentation never silently becomes standards law.
[INV] Runtime observations are environment-bounded.
[INV] No approved capability is removed merely because support is absent.
[INV] Every semantic authority change propagates to dependent claims.
[INV] Every stale physical claim gets a new evidence obligation or stays stale.
[INV] Every pass records its own environment and evidence identity.
[INV] Every pass re-observes intended versus materialized structure.
[INV] No AGENT → REPO mutation path is permitted.

──────────────────────────────────────────────────────────────────────
                    PASS-TO-PASS GATE
──────────────────────────────────────────────────────────────────────

For EACH D14..D19:

ASCII ASSEMBLY
    ↓
STRUCTURAL CHECK
    ↓ PASS
FACTORY DELTA
    ↓
ISOLATED WORKPIECE
    ↓
STATIONS
    ↓
VERIFY
    ↓ PASS
INTEGRATE
    ↓
EXECUTE / PROBE
    ↓
EVIDENCE
    ↓
OBSERVED ASCII
    ↓
MATCH?
  ├─ NO  → preserve difference and return to ASCII
  └─ YES → update docs/HANDOFF.md and begin next pass

Do not begin pass N+1 while pass N contains an INTERNAL chain defect.

External uncertainty and genuine capability gaps may cross the gate only when
explicitly represented as [ERR]/[GAP]/[UNK].

──────────────────────────────────────────────────────────────────────
                    SIX-PASS FINAL CONDITION
──────────────────────────────────────────────────────────────────────

D14  WHAT MOVED?
D15  WHAT DOES THE FOUNDATION CURRENTLY REQUIRE?
D16  WHAT DOES EACH APPROVED CAPABILITY REQUIRE?
D17  WHAT DO OUR IMPLEMENTATIONS ACTUALLY DO?
D18  WHAT MUST FACTTEST CHANGE?
D19  DOES THE UPDATED MODEL SURVIVE EXECUTION?

The series closes only when any current FactTest claim can be traversed as:

CLAIM
 ↓
CURRENT AUTHORITY
 ↓
EXACT CLAUSE
 ↓
AUTHORITY MATURITY
 ↓
REPRODUCIBILITY PIN
 ↓
PROJECT CONSTRAINT
 ↓
IMPLEMENTATION CONTRACT
 ↓
REQUIRED ENVIRONMENT
 ↓
PROBE
 ↓
PHYSICAL EVIDENCE
 ↓
STALE CONDITIONS

OR the traversal terminates at an explicit:

[GAP]
[ERR]
[UNK]

that says precisely why the claim cannot proceed further.

The goal is not a larger bibliography.

The goal is a current, traversable, executable account of what FactTest is
actually entitled to believe.
