╔══════════════════════════════════════════════════════════════════════╗
║     FACTTEST · WHOLE-REPO FACTORY EXECUTION + GAP CLOSURE          ║
║             SIX TASK SERIES · D21 → D26 · READ FIRST               ║
╚══════════════════════════════════════════════════════════════════════╝

PURPOSE

The technical-reference review is complete.

D14-D19 CLOSED the six-pass authority/reference series.
D20 joined the parallel D14 reference-rescan line into the same current model.

DO NOT repeat that work.

The next job is to take the CURRENT implementation, force it through the
Factory, execute it layer by layer, attack it, repair internal repo /
implementation gaps as they are exposed, test EVERY repair before continuing,
and finish with a clean whole-repository commissioning run.

This is not primarily a design review.

This is:

CURRENT CODE
    ↓
FACTORY
    ↓
EXECUTE
    ↓
TEST / ATTACK
    ↓
FAIL?
 ┌──┴──┐
YES    NO
 │      │
 ▼      ▼
ASCII   NEXT RUNG
 │
 ▼
MINIMAL REPAIR
 │
 ▼
RETEST IMMEDIATELY
 │
 ▼
TASK REGRESSION
 │
 ▼
VERIFY / INTEGRATE
 │
 └──────────────► continue

Six bounded tasks:

D21  CURRENT IMPLEMENTATION / EXECUTION MANIFEST
D22  FACTORY SELF-QUALIFICATION
D23  COMPILER + ABI EXECUTION / REPAIR
D24  PIPELINE GENERICITY / MULTI-SPECIMEN EXECUTION
D25  PHYSICAL WEBAPP / RUNTIME EXECUTION
D26  CLEAN WHOLE-REPO COMMISSIONING

──────────────────────────────────────────────────────────────────────
                         CURRENT BASELINE
──────────────────────────────────────────────────────────────────────

OBSERVED WHEN THIS PROMPT WAS ASSEMBLED:

main:
  b22bcbb6ed8cf49983c919beedd93541a761567c

working materialization branch:
  ca540647db00c72fa0570f7f4f59a20c299172b7

both currently have tree:
  bca6411e4378f46a415de802d43b7e7a328c15e6

main's extra commit is the owner PR merge.  It does not currently carry a
different tree.

DO NOT trust these observations if the repository moved again.

FIRST:
observe branch, main, HEAD, trees, status, ancestry and current handoff.

If the working branch and main remain tree-identical but differ only by the
owner merge commit, record [OBS].  Do NOT invent a content-sync operation.

If main contains NEW CONTENT, follow docs/HANDOFF.md parallel-line procedure
before beginning implementation work.

Current joined knowledge model at D20 recorded approximately:

1250 graph nodes
3190 edges
174 current facts
109 RUN
46 OBS
10 GAP
5 ERR
4 UNK
108 claimable RUN facts + 1 invalidated by design

VERIFY these numbers before relying on them.

──────────────────────────────────────────────────────────────────────
                          FIRST ACTION
──────────────────────────────────────────────────────────────────────

Read:

README.md
docs/HANDOFF.md
FACTORY-LAW.md
FACTORY-CONTRACTS.md
STATION-REGISTRY.md
FINAL-HANDOFF-REQUIREMENTS.md

design/materialization/D19-STABLE-BASELINE.md
design/materialization/D20-INTENDED-MAIN-SYNC.md
design/materialization/D20-OBSERVED-MAIN-SYNC.md
design/materialization/LEDGER.md

design/environment-map/graph.json
design/environment-map/SCHEMA.md
design/environment-map/TRACEABILITY.md
design/environment-map/AUTHORITY-REGISTER.md

tests/toolchain/proof-sets.json
tests/reprove/
tests/reconcile/
tests/capability/
tests/implementation/

current:
factory/
compiler/
host/
fixtures/
tests/

REFERENCE-AUTHORITY.md and current constraint/contract law are INPUTS,
not a request for another broad authority rescan.

D14-D19 reference review is historical/current substrate now.

If this exact prompt is not tracked, FIRST route THIS EXACT PROMPT through
the Factory as:

design/materialization/D21-D26-WHOLE-REPO-EXECUTION-PROMPT.md

using a D21-PROMPT-INTAKE delta.

Prompt intake does not count as one of the six tasks.

──────────────────────────────────────────────────────────────────────
                     CANONICAL MUTATION LAW
──────────────────────────────────────────────────────────────────────

AGENT → ASCII → FACTORY → WORKPIECE → VERIFY → REPO

NEVER:

AGENT -------------------------------------------> REPO

Every task must complete:

ASCII
  ↓
STRUCTURAL CHECK
  ↓
FACTORY DELTA
  ↓
ISOLATED WORKPIECE
  ↓
STATIONS
  ↓
EXECUTE / TEST
  ↓
VERIFY
  ↓
INTEGRATE
  ↓
CANONICAL PROBE
  ↓
EVIDENCE
  ↓
OBSERVED ASCII
  ↓
MATCH / DIFFER

DIFFER → return to ASCII.

Do not carry a failed assumption forward merely because the next task is
convenient.

══════════════════════════════════════════════════════════════════════
║                    GAP CLASSIFICATION LAW                          ║
╚══════════════════════════════════════════════════════════════════════╝

Classify every problem before repairing it.

A  INTERNAL REPO / IMPLEMENTATION DEFECT
   Existing machinery contradicts its current contract.
   → REPAIR NOW.

B  TEST / PROOF GAP FOR IMPLEMENTED BEHAVIOR
   Code claims/implements behavior but qualification is missing.
   → ADD TEST/PROBE; if it fails, repair implementation.

C  GENERICITY / SPECIAL-CASE DEFECT
   Production machinery secretly depends on a commissioning specimen.
   → REPAIR NOW.

D  APPROVED BUT UNIMPLEMENTED CAPABILITY
   Capability belongs in G but current system never promised it implemented.
   → KEEP [GAP], unless required for the current implemented pipeline.

E  EXTERNAL / ENVIRONMENT LIMIT
   Hardware, browser environment, network, permission or external authority.
   → KEEP honest [GAP]/[ERR]/[UNK].

F  HISTORICAL EVIDENCE LIMIT
   Old evidence cannot be strengthened retroactively.
   → PRESERVE.

G  OWNER / SEMANTIC DECISION
   Repair would change approved meaning, target or authority.
   → STOP → ASCII / OWNER.

SUCCESS IS NOT ZERO GAP/ERR/UNK.

SUCCESS IS:

ZERO KNOWN UNREPAIRED INTERNAL BREAKAGE IN THE CURRENT IMPLEMENTATION CHAIN.

══════════════════════════════════════════════════════════════════════
║          GLOBAL TEST-EVERY-ITERATION LAW · NON-NEGOTIABLE          ║
╚══════════════════════════════════════════════════════════════════════╝

For EVERY implementation repair:

1  reproduce the defect
2  preserve failing evidence
3  identify earliest broken contract/rung
4  assemble minimal ASCII delta
5  route through Factory
6  patch only authorized surfaces
7  run nearest focused test
8  run component regression
9  run the current TASK regression
10 independently verify
11 integrate
12 execute/probe canonical result
13 bind evidence
14 re-observe intended vs actual

Only then make the next repair.

NEVER:

patch A
patch B
patch C
then test everything

If several failures share one proven root cause, one repair may close them,
but the evidence must demonstrate the relation.

══════════════════════════════════════════════════════════════════════
║            D21 · CURRENT IMPLEMENTATION / EXECUTION MANIFEST       ║
╚══════════════════════════════════════════════════════════════════════╝

QUESTION:

What exactly is CURRENT executable FactTest after D20, and is every live
implementation component connected to ownership, tests, consumers and
evidence?

Do not reconstruct from conversation.
Reconstruct from the joined repository.

Build a deterministic CURRENT EXECUTION MANIFEST.

Cover at minimum:

FACTORY
  router
  path authority
  registry
  workpieces
  receipts
  verifier
  integration
  reinspection
  hygiene
  sync/import machinery

COMPILER
  foundation
  source
  semantic
  capability
  implementation
  planning
  verifier
  codegen
  bundle
  observe
  kernel
  wasm-abi

HOST
  factc
  browser harnesses

WEB OUTPUT
  templates
  adapters
  selector
  runtime
  generated shell
  service worker

PROOF / TEST
  bootstrap
  language
  commissioning
  toolchain
  envmap
  selfhost
  hygiene
  reference
  reconcile
  reprove
  sync

For every LIVE implementation surface record:

component
owner
input
operation
output
dependencies
consumer
Factory station
fixture type
toolchain / target
focused tests
task regression
runtime probe
evidence
stale dimensions

Distinguish:

LIVE PRODUCTION
LIVE TEST/FACTORY MACHINERY
REFERENCE FIXTURE
HISTORICAL EVIDENCE

Historical/reference source must not accidentally become executable scope.

Search for:

orphan implementation
unowned source
consumer with no producer
producer with no consumer
implementation with no test
test with no current implementation
current claim with no executable path
current executable path with no governing claim
dead fixture
duplicate current machinery
stale current documentation
unreachable path

Also explicitly inspect the current D20 open-boundary register.

Do not automatically repair capability gaps.

OUTPUT:

D21 intended ASCII
CURRENT-EXECUTION-MANIFEST
issue inventory A..G
exact D22-D26 affected surfaces
D21 observed ASCII

PASS:

the current executable system is completely enumerated and every discovered
problem is classified before implementation repair begins.

══════════════════════════════════════════════════════════════════════
║                    D22 · FACTORY PROVES FACTORY                    ║
╚══════════════════════════════════════════════════════════════════════╝

QUESTION:

Can the CURRENT Factory safely judge every repair that follows?

Run the Factory through itself.

Positive path:

delta intake
path authorization
station lookup
fixture binding
workpiece creation
station open
station close
receipt production
environment identity
independent verify
base-unmoved gate
integration
reinspection
audit
retire
parallel-line/sync handling where applicable

ATTACK IT.

At minimum construct negative witnesses for:

unauthorized changed path
unsupported wildcard-looking surface
fixture wider than station
MAY CHANGE / MUST NOT CHANGE overlap
missing receipt
forged receipt identity
stale verification
workpiece changed after verification
canonical base movement
unreceipted mutation
malformed fixture
bad environment identity
unsafe cleanup candidate
unintegrated workpiece retirement
parallel-line import collision
attempted direct canonical mutation

The expected result of a negative witness is REFUSAL FOR THE NAMED REASON.

A failure for some unrelated reason is not a pass.

Repair every A/B defect found in Factory machinery before D23.

Do not widen station authority merely to make a fixture pass.

PASS:

the judge is qualified to judge D23-D26.

══════════════════════════════════════════════════════════════════════
║               D23 · COMPILER + ABI EXECUTION / REPAIR              ║
╚══════════════════════════════════════════════════════════════════════╝

QUESTION:

Does the complete CURRENT compiler DAG execute according to its contracts,
including the browser transport boundary?

Run bottom-up:

foundation
  ↓
source
  ↓
semantic
  ↓
capability
  ↓
implementation
  ↓
planning
  ↓
verifier
  ↓
codegen
  ↓
bundle
  ↓
observe
  ↓
kernel
  ↓
wasm ABI
  ↓
host/browser boundary

Use CURRENT qualified proof sets.

HOST_NATIVE_SET:
  build dev
  build release
  test dev
  test release
  clippy
  exact compile-fail diagnostics

WASM64_KERNEL_SET:
  core-only dev
  core-only release
  clippy
  wasm inspect
  artifact identity
  Chromium ABI execution

ALL:
  Cargo-resolved dependency graph
  physical manifest accounting
  fmt
  mutant/self-attack corpus

Then compare the PUBLIC KERNEL API with:

host/factc transport
wasm-abi transport

Known current boundary to investigate, not assume fixed:

D12 B-06:
browser BUILD previously stopped at CAPABILITY_IR because wasm-abi lacked
transport exports for later inputs/outputs such as contracts, metrics,
evidence tape, observe/artifact/bundle access.

Determine from CURRENT contracts whether these are:

A/B  missing transport for already-implemented semantics
     → implement and prove

or

D/G  future self-hosting surface requiring new semantics/owner decision
     → preserve explicit GAP

Transport-only work MUST NOT invent compiler semantics.

For every crate:

compile
  ↓
focused tests
  ↓
consumer test
  ↓
next crate

PASS:

the implemented compiler DAG and every CURRENT promised transport boundary
execute and are qualified.

══════════════════════════════════════════════════════════════════════
║         D24 · PIPELINE GENERICITY / MULTI-SPECIMEN EXECUTION       ║
╚══════════════════════════════════════════════════════════════════════╝

QUESTION:

Is FactTest actually a compiler/foundry, or is part of production machinery
still secretly a Byte Relay demo?

This task MUST attack genericity physically.

CURRENT PRODUCTION SUSPECTS TO INVESTIGATE, NOT PRE-JUDGE:

compiler/codegen/src/lib.rs
  adapter/template library currently contains names including:
    wasm64_relay
    webgpu_relay

compiler/codegen/templates/runtime.js
  currently exposes an operation named:
    relay(bytes)

compiler/codegen/templates/index.html
  currently contains a Byte Relay-style button/payload and controlled
  WEBGPU-destroy interaction

Backend-specific machinery is allowed.

SPECIMEN-specific semantics in generic compiler/runtime machinery are not.

Do NOT "fix" this by renaming strings.

Prove the distinction.

Build at least THREE semantically distinct specimens if the current language
can express them.

They must vary enough to attack:

system names
component names/count
relation names
payload/data shape
backend availability
conversion path
strategy cardinality
objective/no-objective
single-backend vs multi-backend where legal

At least one specimen must NOT be Byte Relay and must make a hardcoded relay
assumption observable.

Execute the entire current transformation:

ASCII
 ↓
parse / resolve
 ↓
TypedSystemIR
 ↓
CapabilityIR
 ↓
representation + conversion graph
 ↓
H_G
 ↓
H_A(E)
 ↓
CandidateStrategy
 ↓
independent verifier
 ↓
VerifiedStrategy
 ↓
CodegenRecipe
 ↓
GeneratedBundle
 ↓
BundleVerifier

Attack:

renamed relation
different legal recipe
single-backend registry
missing conversion
invalid guard
tampered strategy
tampered bundle
undeclared adapter
wrong certificate
changed order
stale evidence
unexpected implementation family

ANTI-CHEAT:

Search production code/templates for specimen-specific:

names
payload bytes
component identities
commissioning identifiers
fixed operation names
fixed backend assumptions

A source scan alone is insufficient.
The multi-specimen executions must demonstrate genericity.

If the language/runtime genuinely cannot express a second operation yet,
mark the exact architectural GAP rather than pretending the relay template
is generic.

PASS:

the current compiler/runtime machinery is proven generic over the semantics
it currently claims to support.

══════════════════════════════════════════════════════════════════════
║              D25 · PHYSICAL WEBAPP / RUNTIME EXECUTION             ║
╚══════════════════════════════════════════════════════════════════════╝

QUESTION:

Do the bundles generated by D24 actually behave correctly in physical browser
environments?

Use freshly generated artifacts, not old evidence bundles.

Record exact environment identity:

browser product
browser revision
JS engine
actual executable
launch flags
OS / host
origin
secure-context state
crossOriginIsolated
SharedArrayBuffer
adapter identity
isFallbackAdapter
features/limits
artifact hashes
toolchain
machine epoch

Exercise CURRENT implemented runtime behaviors:

wasm64 execution
bundle verification
runtime admission
selection
known-answer operation
WebGPU request/admission when available
adapter classification
controlled device loss
epoch transition
stale-plan invalidation
fallback/reselection
no runtime codegen
bundle unchanged across reselection

Service Worker
offline launch
CacheStorage
OPFS
IndexedDB
restart survival
Worker execution
isolation headers where currently implemented

Run multi-specimen bundles from D24.

PUBLIC HTTPS:

D20 still carries the historical/environmental GitHack/public-origin boundary.

If the execution environment can now reach the public HTTPS test route,
run it and record it separately.

If it cannot:

DO NOT substitute localhost as proof of public HTTPS.

Produce:
  exact deployable probe
  expected evidence schema
  artifact hashes
  exact user-run instructions

and preserve [UNK] until external evidence exists.

Do not expand into unrelated approved capability families merely to remove
their GAPs.

If an already-implemented runtime path fails, repair it now and repeat the
affected execution.

PASS:

every CURRENT runtime claim either has fresh physical evidence or an exact
honest environmental boundary.

══════════════════════════════════════════════════════════════════════
║                 D26 · CLEAN WHOLE-REPO COMMISSIONING               ║
╚══════════════════════════════════════════════════════════════════════╝

QUESTION:

Can the CURRENT repository manufacture, verify and execute its complete
implemented system from canonical source without relying on undocumented
historical state?

This is the final commissioning run.

Start from a clean Factory workpiece/current canonical source.

Do NOT consume old build outputs as inputs unless their role is explicitly
"historical/reference fixture".

Run:

CURRENT CANONICAL TREE
        ↓
CURRENT EXECUTION MANIFEST
        ↓
FACTORY SELF-CHECK
        ↓
QUALIFIED TOOLCHAIN PROOF
        ↓
COMPILER DAG
        ↓
ABI / HOST BOUNDARY
        ↓
MULTI-SPECIMEN COMPILATION
        ↓
INDEPENDENT VERIFICATION
        ↓
GENERATED BUNDLES
        ↓
PHYSICAL BROWSER EXECUTION
        ↓
LOSS / RESELECTION / OFFLINE WHERE IMPLEMENTED
        ↓
EVIDENCE INDEX
        ↓
ENVIRONMENT GRAPH EPOCH
        ↓
Q01..CURRENT
        ↓
ENTITLED-CLAIM SURFACE
        ↓
OBSERVED ASCII

Use graph STALE_IF traversal to determine what D21-D25 mutations invalidated.

Re-prove all affected current claims.

Do not select regression tests by intuition when the graph can identify them.

Perform final consistency audit:

LIVE LAW
    =
CURRENT IMPLEMENTATION CONTRACT

CURRENT IMPLEMENTATION
    =
EXECUTION MANIFEST

EXECUTION MANIFEST
    =
FACTORY ROUTES

FACTORY ROUTES
    =
RECEIPTS / VERIFICATION

CURRENT CLAIM
    =
CURRENT EVIDENCE OR EXPLICIT BOUNDARY

Update:

docs/HANDOFF.md
environment graph / epoch
generated views
current entitled-claim surface
implementation baseline
open-boundary register

Historical evidence remains immutable.

══════════════════════════════════════════════════════════════════════
║                     EARLIEST-RUNG RETURN LAW                       ║
╚══════════════════════════════════════════════════════════════════════╝

A later task may expose an earlier defect.

Example:

D25 runtime failure
    ↓
root cause is codegen
    ↓
RETURN TO D24 CONTRACT
    ↓
repair
    ↓
D24 regression
    ↓
D25 execution again

Never patch the final symptom if an earlier invariant is broken.

Trust order:

D21  KNOW CURRENT SYSTEM
 ↓
D22  TRUST FACTORY
 ↓
D23  TRUST COMPILER
 ↓
D24  TRUST GENERIC TRANSFORMATION
 ↓
D25  TRUST PHYSICAL RUNTIME
 ↓
D26  TRUST WHOLE SYSTEM

══════════════════════════════════════════════════════════════════════
║                  REFERENCE / GRAPH INTERACTION LAW                 ║
╚══════════════════════════════════════════════════════════════════════╝

D14-D20 already did the reference work.

Do NOT initiate another broad technical-reference rescan.

When an implementation repair touches an externally governed behavior:

current graph authority
    ↓
exact current clause
    ↓
constraint
    ↓
repair

If the required authority is stale/ambiguous:

STOP that repair
mark [ERR]/[UNK]
return to ASCII

A narrow authority reopen needed by one repair is permitted and must become
a new evidence epoch.

Never silently reinterpret standards while "fixing code."

Every implementation mutation that changes a current claim must update the
graph and invalidate/re-prove dependents.

══════════════════════════════════════════════════════════════════════
║                     SIX-TASK FINAL CONDITION                       ║
╚══════════════════════════════════════════════════════════════════════╝

The series closes only when:

[PASS] every live production component is in the execution manifest
[PASS] every live component has an owner and consumer/terminal role
[PASS] every production mutation surface is Factory-controlled
[PASS] Factory positive and adversarial tests pass
[PASS] qualified HOST_NATIVE_SET passes
[PASS] qualified WASM64_KERNEL_SET passes
[PASS] dependency / manifest proof passes
[PASS] mutant judge self-attack passes
[PASS] every implemented compiler stage executes through its consumer
[PASS] every promised ABI surface is either implemented/proved or explicitly
       classified as future scope
[PASS] genericity is demonstrated with multiple specimens
[PASS] Byte Relay is DATA, not hidden compiler architecture
[PASS] generated bundles independently verify
[PASS] fresh physical runtime probes support current runtime claims
[PASS] every repair was tested before another repair
[PASS] stale affected claims were selected and re-proved
[PASS] current environment graph contains D21-D26 execution epochs
[PASS] current handoff describes the observed system
[PASS] historical evidence is untouched
[PASS] remaining GAP/ERR/UNK are capability, external, historical, conflict,
       environmental or owner-decision boundaries
[PASS] no known internal repo/implementation defect remains hidden behind a
       historical status marker

FINAL CLAIM MAY THEN BE:

CURRENT SOURCE
    ↓
FACTORY ROUTED
    ↓
IMPLEMENTATION EXECUTED
    ↓
GENERICITY ATTACKED
    ↓
QUALIFIED
    ↓
PHYSICALLY COMMISSIONED
    ↓
RE-OBSERVED
    ↓
CURRENT ENTITLED CLAIMS

The goal is not to make FactTest look finished.

The goal is to make the CURRENT IMPLEMENTATION prove itself through its own
Factory until every internal disagreement either fails under execution and is
repaired, or terminates at an explicit honest boundary.
