╔══════════════════════════════════════════════════════════════════════╗
║          FACTTEST · COMPUTATIONAL ENVIRONMENT MAPPING              ║
║                READ FIRST BEFORE ALTERING ANYTHING                 ║
╚══════════════════════════════════════════════════════════════════════╝

PURPOSE

Pause production repair and capability expansion.

FactTest already has hyperlink-first authority, constraints, implementation
contracts, runtime admission and evidence. D9 proved that computational
claims can become stronger than the modeled environment supporting them.

This pass converts:

hyperlink-first
↓
hyperlink-connected
↓
computationally evidenced

Do NOT repair the production compiler in this pass.
Do NOT add capability implementations.
Do NOT silently pin toolchains.
Do NOT rewrite earlier evidence to make old claims look stronger.

FIRST ACTION

Observe git state and current authority.

If this prompt is not already tracked, route THIS EXACT PROMPT through the
Factory as:

design/materialization/D10-COMPUTATIONAL-ENVIRONMENT-MAP-PROMPT.md

Use:

AGENT → ASCII → FACTORY → WORKPIECE → VERIFY → REPO

Never direct AGENT → REPO.

Read before assembly:

FACTORY-LAW.md
FACTORY-CONTRACTS.md
REFERENCE-AUTHORITY.md
CONSTRAINT-LEDGER.md
CAPABILITY-MATRIX.md
IMPLEMENTATION-CONTRACTS.md
RUNTIME-ADMISSION-REPLAN.md
EVIDENCE-OBLIGATIONS.md
CONFLICT-LEDGER.md
design/materialization/D9-INTENDED-PROOF-HARNESS.md
design/materialization/D9-OBSERVED-PROOF-HARNESS.md
evidence/D9/summary.json
evidence/D9/mutants/summary.json

Preserve every D9 [RUN]/[ERR]/[GAP]/[UNK].

══════════════════════════════════════════════════════════════════════

                ASSEMBLY SURFACE

                 EXTERNAL AUTHORITY
                        │
                exact hyperlink
                exact fragment/clause
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
      prerequisite             dependent
        authority               authority
            │                       │
            └───────────┬───────────┘
                        ▼
                 PROJECT CONSTRAINT
                        │
                        ▼
                COMPUTATIONAL FACT
                        │
      ┌─────────────────┼─────────────────┐
      ▼                 ▼                 ▼
  TOOLCHAIN           TARGET             HOST

rustc / Cargo      wasm64 / JS       Chromium / OS
versions           ABI / memory      flags / origin
components         feature set       implementation
│                 │                 │
└─────────────────┼─────────────────┘
▼
ENVIRONMENT STATE
│
┌──────────┴──────────┐
▼                     ▼
STATIC                RUNTIME
buildable?             exposed?
type legal?            requestable?
dependency graph       admitted?
profile/target         executable?
│                     │
└──────────┬──────────┘
▼
PROBE / TEST
│
▼
EVIDENCE
│
▼
MACHINE EPOCH
│
▼
[RUN][ERR][GAP][UNK]

══════════════════════════════════════════════════════════════════════

MAP NODES

Every mapped authority must carry enough identity to distinguish the
document from the computational fact derived from it.

AUTHORITY
authority_id
title
exact_url
exact_fragment
authority_owner
authority_class
maturity/status
observed_date
optional reproducibility_pin

CONSTRAINT
constraint_id
statement
authority_refs[]
scope
conflicts[]

COMPUTATIONAL_FACT
fact_id
subject
predicate
required_environment[]
constraint_refs[]

ENVIRONMENT
environment_id
toolchain
target
host/runtime
versions
flags
build profile
origin/security state
permissions/policy
implementation/hardware class
dependency graph identity
other relevant state

PROBE
probe_id
proves_fact[]
command_or_operation
expected_observations[]
failure_meaning[]

EVIDENCE
evidence_id
probe_ref
environment_ref
artifact_identity
observed_result
timestamp/epoch
status

══════════════════════════════════════════════════════════════════════

MAP EDGES

Use explicit relational edges. At minimum distinguish:

AUTHORIZES
DEPENDS_ON
REQUIRES
CONFLICTS_WITH
IMPLEMENTED_BY
BUILT_WITH
EXPOSED_BY
ADMITTED_BY
PROBED_BY
EVIDENCED_BY
INVALIDATED_BY
STALE_IF
FALLS_BACK_TO

Do not turn all links into generic "related to" edges.

══════════════════════════════════════════════════════════════════════

SUBLINK TRAVERSAL LAW

REFERENCE-AUTHORITY.md is the starting frontier, not a bibliography.

For each authoritative hyperlink:

open the actual current authority
↓
locate the exact cited clause
↓
identify computational prerequisites used by FactTest
↓
follow only sublinks needed to establish those prerequisites
↓
create explicit nodes + edges
↓
attach project constraint
↓
attach probe/evidence obligation

Do NOT recursively ingest whole specifications.

Follow a sublink only when it materially changes:
legality
prerequisites
lifecycle
capability exposure
target/toolchain behavior
failure behavior
admission
evidence interpretation

Preserve specification maturity and disagreements.
Living standard, release, proposal, implementation documentation and
project law are different authority classes.

Never resolve disagreement by flattening them into one statement.

══════════════════════════════════════════════════════════════════════

FIRST VERTICAL TRACES

Fully trace at least these existing paths before broad expansion:

1. RUST → WASM64

Rust no_std
→ Cargo build-std
→ nightly + rust-src
→ compiler crate graph
→ wasm64-unknown-unknown
→ WebAssembly i64 address/memory
→ JS embedding
→ Chromium/V8
→ actual ABI execution
→ evidence

Include the D9 toolchain drift and native-workspace findings.

2. WEBGPU

trustworthy/secure environment
→ navigator.gpu
→ requestAdapter
→ features/limits
→ requestDevice
→ WGSL / operation requirements
→ known-answer execution
→ device.lost
→ epoch invalidation
→ fallback/reselection
→ evidence

Preserve SwiftShader ≠ hardware GPU.

3. FACTORY EXECUTION ENVIRONMENT

git repository
→ canonical base
→ worktree
→ station path authority
→ command/toolchain environment
→ receipts
→ verification
→ integration
→ reinspection

Include D9's [GAP] concerning literal path matching versus wildcard-looking
StationSpec surfaces.

══════════════════════════════════════════════════════════════════════

STRUCTURAL QUESTIONS

The resulting graph must make these queries answerable by traversal:

Why do we believe this capability works?
Which exact authority permits/requires this behavior?
Which subclauses does that claim depend on?
Which toolchain/browser/target state was required?
What evidence actually executed it?
What becomes stale if rustc changes?
What becomes stale if Chromium changes?
Which claims require secure context?
Which claims have authority but no probe?
Which probes have no governing constraint?
Which evidence lacks complete environment identity?
Which implementation contract cites authority too coarsely?
Which [RUN] is valid only for one machine epoch?
Where does a proposal get mistaken for baseline semantics?
Where does implementation documentation get mistaken for standards law?

══════════════════════════════════════════════════════════════════════

INVARIANTS

[INV] source semantics remain ASCII-authoritative.
[INV] authority != implementation.
[INV] implementation != runtime admission.
[INV] API presence != usable capability.
[INV] build success != runtime execution.
[INV] hardware preference != hardware execution.
[INV] synthetic/model evidence != physical evidence.
[INV] current authority != reproducibility pin.
[INV] recorded toolchain != pinned toolchain.
[INV] evidence without environment identity cannot establish portability.
[INV] no previous [ERR]/[GAP]/[UNK] disappears merely because this map exists.

══════════════════════════════════════════════════════════════════════

OUTPUTS

Assemble before choosing final filenames, but the resulting repository
surface must contain:

1. human-readable global ASCII computational-environment map
2. explicit authority-node register
3. explicit node/edge graph suitable for deterministic traversal
4. environment-state schema
5. authority → constraint → fact → probe → evidence traceability
6. stale/dependency relationships
7. conflicts and unsupported links as [ERR]/[GAP]/[UNK]
8. observed-system comparison after materialization

Do not duplicate the prose of external specifications.
Store identity, exact deep links, extracted computational consequence and
relationship.

══════════════════════════════════════════════════════════════════════

STRUCTURAL CHECK BEFORE FACTORY ROUTING

PASS only if:

every node class has an owner
every output has a consumer/terminal role
every edge has defined semantics
external claims point to exact authority where available
authority and reproducibility pins remain separate
probes identify what fact they can actually prove
evidence identifies its computational environment
stale conditions are representable
D9 findings remain visible
no production repair is hidden inside the mapping pass
no illegal AGENT → REPO path exists

FAIL → return to ASCII.

PASS → construct the StructuralDelta, route through existing stations where
sufficient, forge a new station only if a genuine reusable capability is
missing, verify, integrate, execute/probe the map machinery, collect
evidence, and re-observe.

Final comparison:

MATCH  → mapping pass complete
DIFFER → preserve [ERR]/[GAP]/[UNK] and return to ASCII

The goal is not a larger reference list.

The goal is a traversable explanation of:

AUTHORITY
↓
COMPUTATIONAL REQUIREMENT
↓
ENVIRONMENT
↓
EXECUTION
↓
EVIDENCE
↓
WHAT FACTTEST IS ACTUALLY ENTITLED TO CLAIM.
