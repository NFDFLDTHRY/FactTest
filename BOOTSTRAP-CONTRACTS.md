# FactTest Bootstrap Contracts

STATUS: PASS 3  
DATE: 2026-09-23

This file defines bootstrap contracts at the category/interface level.
It deliberately does not freeze final Rust syntax.

## C0 - External bootstrap contract

INPUT:
- pinned canonical repository state
- approved ASCII delta/final manufacturing prompt
- selected Rust/toolchain environment
- Fable 5.1

OPERATION:
- materialize only approved repository structures in an isolated workpiece
- run declared bootstrap checks
- produce Factory receipts

OUTPUT:
- verified project workpiece or explicit failure

MUST NOT:
- bypass Factory Law
- define missing language semantics silently
- repair invalid source by mutation
- promote host/tool behavior to compiler law without an explicit contract

## C1 - Compiler kernel input contract

INPUT classes:

\`\`\`text
SourceBytes
CompilerOptions
MachineState
Objective
Workspace
\`\`\`

Every input affecting semantics must be explicit.

No hidden filesystem/network/time/environment input may influence semantic artifacts.

## C2 - Workspace contract

The caller owns the bootstrap workspace.

The kernel may:

- borrow source/state inputs
- use supplied mutable scratch regions
- partition bounded arenas
- report required capacity

The kernel must not require a global allocator as a Pass-3 invariant.

Insufficient workspace is a structured result, not undefined behavior.

## C3 - Foundational identity contract

Required distinct domains:

\`\`\`text
SourceId
ByteOffset
Span
NodeId
SymbolId
TypeId
CapabilityId
ImplementationId
InvariantId
ObligationId
DiagnosticId
ArtifactId
EvidenceId
ReceiptId
\`\`\`

Forbidden:

\`\`\`text
CapabilityId == ImplementationId
ArtifactId == EvidenceId
NodeId == SymbolId
raw string == resolved SymbolId
\`\`\`

Every Span includes source identity plus byte range.

## C4 - Diagnostic contract

Structured diagnostic fields:

\`\`\`text
diagnostic class/code
severity
source identity
primary span
related spans
message class
structured parameters
authority references[]
artifact/phase context
\`\`\`

Human-readable text is rendering.
It is not the diagnostic's stable identity.

Requirements:

- stable machine-readable classification
- deterministic ordering for deterministic input
- no automatic source mutation
- exact external-authority link may be carried when an external rule caused the failure

Example diagnostic classes are provisional only:

\`\`\`text
PARSE_UNEXPECTED
UNRESOLVED_NAME
TYPE_MISMATCH
MISSING_PRODUCER
FORBIDDEN_CAPABILITY
NO_LEGAL_PLAN
PROOF_FAILED
BACKEND_UNAVAILABLE
OUTPUT_TOO_SMALL
LANGUAGE_KERNEL_NOT_IMPLEMENTED
\`\`\`

Pass 4 may refine language-specific classes.

## C5 - Phase contract

Every compiler phase declares:

\`\`\`text
accepted input artifact class
produced output artifact class
semantic facts it may introduce
facts it must preserve
diagnostics it may emit
preconditions
postconditions
\`\`\`

A phase may not perform undeclared semantic work for another phase.

## C6 - Artifact contract

Common envelope:

\`\`\`text
kind
schema_version
producer
source_lineage
input_artifact_ids[]
status
diagnostics[]
payload
\`\`\`

Rules:

- output references its admitted upstream inputs.
- downstream phases do not invent upstream semantic facts.
- schema/version changes are explicit.
- generated code is not source-of-record authority.

## C7 - Proof-obligation contract

Pass 3 defines only the role:

\`\`\`text
TypedSystemIr
      |
      v
ObligationExtractor
      |
      v
ObligationSet
\`\`\`

An obligation identifies:

- semantic invariant/requirement
- objects/artifacts it constrains
- condition to be checked
- provenance/source relation

Pass 4/5 define the actual proof logic.

## C8 - Planner contract

Planner input:

```text
TypedSystemIr
CapabilityIr
ImplementationHypergraph
AdmittedMachineState
Objective
```

Planner output:

```text
CandidateStrategy
```

A one-variant CandidateStrategy is the non-adaptive case.

Planner may rank/search legal candidates.
Planner may not certify itself correct.
No planner algorithm is architecture law.

## C9 - Independent verifier contract

Verifier input:

```text
TypedSystemIr
ObligationSet
CapabilityIr / requirements
ImplementationContracts
Admission contracts
CandidateStrategy
```

Verifier output:

```text
VerificationPass(VerifiedStrategy)
or
VerificationFailure(diagnostics)
```

Each strategy variant is independently checked as a VerifiedPlanVariant under an explicit activation guard.

Verifier does not consume planner heuristic internals or trust planner validity assertions.

## C10 - Capability namespace contract

Namespaces:

\`\`\`text
SemanticCapability
ImplementationCapability
RuntimeObservation
Admission
\`\`\`

They are distinct even when their names are related.

Example:

\`\`\`text
SemanticCapability: ORIENTATION
ImplementationCapability: DEVICE_ORIENTATION_EVENT
RuntimeObservation: permission granted + events received
Admission: DEVICE_ORIENTATION_EVENT admitted
\`\`\`

## C11 - Machine observation contract

Conceptual fields:

\`\`\`text
capability_id
observation_state
feature_set
limits
policy_state
permission_state
resource_state
observation_epoch
evidence_refs[]
\`\`\`

Observation records facts.
It does not decide plan legality by itself.

## C12 - Admission contract

Conceptual fields:

\`\`\`text
implementation_id
decision: admitted | rejected
conditions
evidence_refs[]
rejection_reason
\`\`\`

Admission is derived from implementation requirements plus machine observations.

## C13 - Host membrane contract

Operations:

\`\`\`text
DISCOVER
REQUEST
OPERATE
OBSERVE
RELEASE
\`\`\`

Common result classes:

\`\`\`text
OK
UNAVAILABLE
DENIED
POLICY_BLOCKED
UNSUPPORTED
LOST
RESOURCE_EXHAUSTED
INVALID
INTERNAL_FAILURE
\`\`\`

Feature-specific adapters may refine these without changing semantic ownership.

## C14 - Bootstrap ABI contract

Semantic operations:

\`\`\`text
QUERY_ABI_VERSION
QUERY_REQUIRED_WORKSPACE
SUBMIT_SOURCE_BYTES
SUBMIT_MACHINE_STATE
CHECK_OR_COMPILE
READ_DIAGNOSTICS
READ_ARTIFACT_METADATA
RESET_WORKSPACE
\`\`\`

Transport encoding and concrete function signatures are deferred.

## C15 - Determinism contract

Given identical:

\`\`\`text
source
compiler options
machine state
objective
compiler/schema version
\`\`\`

semantic phase results are identical.

Any runtime measurement that can alter planning is represented as explicit machine/evidence input.

## C16 - Receipt separation

FactoryReceipt:
- applies to repository/workpiece mutation
- governed by FACTORY-LAW.md

CompilerReceipt:
- applies to compiler phase transformation
- identifies producer, inputs, output, status, diagnostics, authority/test/evidence references

Neither substitutes for the other.

## C17 - Generated-bundle ownership contract

Generated object B owns these zones:

\`\`\`text
Wasm artifacts
host membrane/adapters
WebApp shell
manifest/service-worker assets
runtime evidence output
source-lineage metadata
plan metadata
verification metadata
\`\`\`

Concrete filenames and packaging are deferred.

## C18 - Pass ownership contract

Pass 3 owns:
- bootstrap trust
- kernel/host split
- identity domains
- phase interfaces
- artifact lineage
- verifier independence
- namespace separation
- runtime-state envelope
- bootstrap ABI
- bootstrap test ladder

Pass 4 owns:
- ASCII grammar
- lexer/parser
- System AST details
- name/type/ownership rules
- typed semantic kernel

Pass 5 owns:
- factory/station concrete contracts
- implementation backend contracts
- capability graph concrete schemas
- planner/cost model
- proof/codegen boundaries
- concrete browser adapters

Pass 6 owns:
- complete end-to-end proof of one vertical slice


## C19 - Identity-domain closure (Pass 6 amendment)

Later passes introduced additional object classes that remain subject to the Pass-3 strong-ID law.

Additional distinct identity domains:

```text
ObjectiveId
MetricId
RepresentationId
ConversionId
PlanId
StrategyId
EpochId
ProbeId
CodegenRecipeId
CertificateId
BundleId
DeltaId
WorkpieceId
FixtureId
StationId
```

Rules:
- IDs from different domains are not interchangeable.
- a display label or raw string is not typed identity.
- runtime EpochId is not PlanId or StrategyId.
- CertificateId identifies a certificate artifact but does not itself prove PASS status.
