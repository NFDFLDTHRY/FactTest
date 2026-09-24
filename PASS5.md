# FactTest Pass 5 - Factory + Lowering Contracts

STATUS: PASS 5 EXECUTED  
DATE: 2026-09-23  
BASE: 867c3aa15008b847c792a949ea1bdb0f82bd62a1

## 0. Purpose

Pass 5 defines the machinery that may materialize Pass-4 semantics without redefining them.

Central law:

\`\`\`text
PASS 4 defines what the system MEANS.

PASS 5 defines every legal way that meaning may become machinery.

Machinery may satisfy semantics.
Machinery may not redefine semantics.
\`\`\`

Pass 5 remains architecture/contracts only.

No compiler source, backend implementation, generated WebApp, station program, or planner implementation is materialized.

## 1. Three planes

\`\`\`text
HUMAN + AI
    |
    v
ASCII SYSTEMS DIAGRAM
    |
    +---------------------------+
    |                           |
    v                           v
FACTORY PLANE              COMPILER PLANE
manufactures               compiles semantic
FactTest.git               source to object B
    |                           |
    v                           v
FactTest.git               GENERATED WEBAPP
                                |
                                v
                           RUNTIME PLANE
                                |
                                v
                             EVIDENCE
                                |
                                v
                         OBSERVED ASCII
                                |
                                v
                           HUMAN + AI
\`\`\`

Factory station, compiler backend, planner, verifier, codegen, and runtime adapter are distinct object classes.

## 2. Non-collapse law

\`\`\`text
FactoryStation != CompilerBackend
CompilerBackend != Planner
Planner != Verifier
Verifier != Codegen
Codegen != RuntimeProbe
RuntimeEvidence != SourceSemantics
\`\`\`

Any implementation that collapses those identities violates Pass 5.

## 3. Factory structural delta

The Factory router receives a bounded \`StructuralDelta\`, not an open-ended request.

Conceptual fields:

\`\`\`text
StructuralDelta
  delta_id
  canonical_base
  approved_ascii
  intent
  may_read[]
  may_change[]
  must_not_change[]
  required_station_capabilities[]
  invariants[]
  tests[]
  evidence_requirements[]
  expected_output_contract
\`\`\`

The delta is generated from approved ASCII and checked before routing.

See [FACTORY-CONTRACTS.md](FACTORY-CONTRACTS.md).

## 4. Workpiece isolation

\`\`\`text
CanonicalRepo@Base
      |
      v
IsolatedWorkpiece
  base_tree
  current_tree
  structural_delta
  station_receipts[]
  verification_state
  evidence_refs[]
\`\`\`

Stations mutate only the workpiece.

Integration is serialized and checks that the canonical base has not moved.

A moved base never authorizes force integration.

## 5. Station specification

Every reusable station declares:

- station identity/version
- accepted input kinds
- operation
- output kinds
- MAY READ
- MAY CHANGE
- MUST NOT CHANGE
- preconditions
- invariants
- verification
- receipt schema

A fixture may narrow station authority.
A fixture may never expand station authority.

See [STATION-REGISTRY.md](STATION-REGISTRY.md).

## 6. Semantic lowering

Pass-4 typed semantics lower into Capability IR without selecting an implementation unless the authored source explicitly pins one.

\`\`\`text
TypedSystemIR
    |
    v
CapabilityLowerer
    |
    v
CapabilityIR
\`\`\`

Capabilities are semantic requirements.

Implementation pins restrict legal candidates but do not otherwise change semantic meaning.

See [LOWERING-MODEL.md](LOWERING-MODEL.md).

## 7. Implementation contracts

Each compiler backend is described by an \`ImplementationContract\`.

Conceptual fields:

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
  lifecycle
  failure_contract
  release_contract
  authority_links[]
  admission_probes[]
  evidence_requirements[]
  measurable_cost_dimensions[]
  fallback_or_equivalence_relations[]
  codegen_recipe_id
\`\`\`

Every target family from Pass 2 is represented by either a contract family or an explicit GAP.

See [IMPLEMENTATION-CONTRACTS.md](IMPLEMENTATION-CONTRACTS.md).

## 8. Semantic type vs representation

Pass-4 TypeId does not determine physical representation.

Pass 5 introduces RepresentationId.

\`\`\`text
Semantic Type
    |
    +-- Representation A
    +-- Representation B
    '-- Representation C
\`\`\`

Representation contracts describe storage domain, lifetime, ownership support, alignment/size models, transfer/serialization/sharing properties, and release semantics.

Conversions are explicit edges.

No implicit conversion exists.

See [REPRESENTATION-TRANSFER.md](REPRESENTATION-TRANSFER.md).

## 9. Implementation hypergraph

Each implementation is a hyperedge:

\`\`\`text
input representations[]
        +
semantic operation/capability
        +
requirements
        |
        v
ImplementationContract
        |
        v
output representations[]
        +
effects
\`\`\`

Two graph states exist:

\`\`\`text
H_G
  all statically legal implementation edges compiled into C for G

H_A(epoch)
  subset of H_G whose runtime requirements are admitted in A(epoch)
\`\`\`

A backend may exist in H_G and still be absent from H_A.

## 10. Runtime admission

Dynamic requirements are finite, deterministic, inspectable predicates over machine observations and probe evidence.

Conceptual examples:

\`\`\`text
all(
  secure_context,
  policy_allowed(WEBGPU),
  capability_present(WEBGPU),
  feature_required(X),
  limit_at_least(maxBufferSize, N),
  probe_passed(gpu_known_answer)
)
\`\`\`

The admission expression itself is side-effect free.

Probe execution occurs separately and produces evidence consumed by admission.

## 11. Epoch binding

Machine observation is versioned by epoch.

\`\`\`text
MachineEpoch E0
  observations
  permissions
  policies
  features
  limits
  acquired resources
  probe evidence
\`\`\`

Admission receipts and verified plans are bound to the relevant epoch.

When a relevant observation changes:

\`\`\`text
E0 -> E1
affected admission receipts become stale
affected VerifiedPlan becomes stale
\`\`\`

The plan must be re-derived/reverified against E1.

## 12. Lifecycle/failure

Implementation contracts declare only the lifecycle states they actually use from the common vocabulary:

- UNAVAILABLE
- DISCOVERED
- REQUESTING
- READY
- ACTIVE
- SATURATED
- LOST
- REVOKED
- DISCONNECTED
- RECOVERING
- CLOSED

Failure classes distinguish at least:

- NOT_ADMITTED
- TRANSIENT_OPERATION_FAILURE
- RESOURCE_EXHAUSTED
- RESOURCE_LOST
- PERMISSION_REVOKED
- DEVICE_DISCONNECTED
- UNSUPPORTED_CONFIGURATION
- PERMANENT_FOR_EPOCH

This distinction is planning-significant.

## 13. Cost model

Pass 5 defines units/provenance, not fake constants.

\`\`\`text
MetricEstimate
  metric
  unit
  lower_bound?
  observed_or_nominal?
  upper_bound?
  provenance
  epoch_or_fixture
\`\`\`

Initial metric vocabulary:

- startup_time_ns
- execution_time_ns
- transfer_time_ns
- transfer_bytes
- peak_working_memory_bytes
- persistent_bytes
- generated_bytes
- resource_count

Unknown cost remains unknown.

\`\`\`text
UNKNOWN != ZERO
\`\`\`

See [PLANNER-COST-MODEL.md](PLANNER-COST-MODEL.md).

## 14. Objective model

Optimization is explicit.

\`\`\`text
Objective
  hard_constraints[]
  ordered_goals[]
\`\`\`

Each ordered goal specifies:

- metric
- minimize/maximize
- aggregation

Example:

\`\`\`text
hard: peak_working_memory_bytes <= 268435456
goal 1: minimize end_to_end_latency
goal 2: minimize generated_bytes
\`\`\`

When no optimization objective exists, the planner searches for any verified legal plan and uses deterministic canonical tie-breaking.

## 15. Planner result strength

Planner output is classified:

- FEASIBLE
- EXACT_OPTIMUM
- BOUNDED_OPTIMUM
- HEURISTIC
- NO_PLAN

An optimality claim requires evidence appropriate to the search/cost model.

A* is one possible planner implementation.
Without an admissible heuristic/bound for the stated objective, it may not claim optimum.

## 16. Independent verifier

The verifier checks a finite deterministic rule set over:

- TypedSystemIR
- obligation set
- CapabilityIR
- implementation contracts
- representation/conversion contracts
- admitted machine epoch
- CandidatePlan

Verification categories:

- semantic
- refinement
- lowering
- representation
- ownership
- capability
- admission
- plan
- effect
- bundle lineage

Planner ranking is never proof.

See [VERIFICATION-CERTIFICATES.md](VERIFICATION-CERTIFICATES.md).

## 17. VerifiedPlan construction law

\`\`\`text
Planner -> CandidatePlan

ONLY Verifier -> VerifiedPlan
\`\`\`

Codegen accepts VerifiedPlan only.

A planner or codegen component cannot construct/forge verified state directly.

## 18. Codegen law

Codegen receives:

- TypedSystemIR
- VerifiedPlan
- ImplementationContracts
- RepresentationContracts

It may realize the verified plan.

It may not:

- select a new backend
- relax an invariant
- add an undeclared capability
- change ownership/transfer semantics
- invent a conversion path
- change semantic source

## 19. Bundle verification

GeneratedBundle is independently checked after codegen.

The bundle verifier checks:

- required artifact roles exist
- no undeclared backend adapter exists
- Wasm target/address model matches contract
- imports/exports match the plan
- adapters are a subset of VerifiedPlan
- shell/manifest/service-worker relationships are coherent
- source/plan/verification lineage is present

Codegen success alone is not bundle admission.

See [CODEGEN-BUNDLE-CONTRACT.md](CODEGEN-BUNDLE-CONTRACT.md).

## 20. Runtime loss/replan

\`\`\`text
VerifiedPlan P0 @ E0
      |
      v
EXECUTE
      |
capability loss/change
      |
      v
MachineEpoch E1
      |
      v
invalidate affected A/P
      |
      v
rebuild H_A(E1)
      |
      v
Planner -> CandidatePlan P1
      |
      v
Verifier
      |
      v
VerifiedPlan P1 @ E1
\`\`\`

Source S and its invariants do not silently change because machine state changed.

## 21. Return to human/AI ASCII

Runtime evidence produces an observation delta that can be rendered into observed ASCII.

Observed ASCII is a human/AI-facing view.

It does not overwrite authored ASCII.

\`\`\`text
runtime evidence
    |
    v
observation delta
    |
    v
observed ASCII
    |
    v
human + AI reconciliation
\`\`\`

See [RUNTIME-ADMISSION-REPLAN.md](RUNTIME-ADMISSION-REPLAN.md).

## 22. Three evidence/receipt families

\`\`\`text
FactoryReceipt
  project-workpiece mutation

CompilerReceipt
  compiler-phase transformation

RuntimeEvidence
  observed execution/machine behavior
\`\`\`

They may reference one another.
They do not substitute for one another.

## 23. Pass 5 closure

[RUN] Factory StructuralDelta/Workpiece/StationSpec contracts defined.  
[RUN] fixture narrowing law defined.  
[RUN] station registry defined.  
[RUN] semantic lowering destination defined.  
[RUN] ImplementationContract schema defined.  
[RUN] RepresentationId and explicit conversion graph defined.  
[RUN] H_G and H_A(epoch) separated.  
[RUN] runtime admission predicates defined.  
[RUN] machine epochs bind admission and plans.  
[RUN] lifecycle/failure classes defined.  
[RUN] cost units/provenance defined without fake values.  
[RUN] objective semantics defined.  
[RUN] planner result strength defined.  
[RUN] independent verifier rule categories defined.  
[RUN] only verifier may produce VerifiedPlan.  
[RUN] codegen accepts VerifiedPlan only.  
[RUN] post-codegen bundle verification defined.  
[RUN] runtime replan returns to observed ASCII.  
[RUN] FactoryReceipt/CompilerReceipt/RuntimeEvidence separated.  
[RUN] all target capability families retained.  
[RUN] no compiler/backend/station implementation materialized.

Next: Pass 6 - prove one complete vertical slice.


## Pass 6 amendment - adaptive strategy correction

Vertical tracing found that an epoch-bound singular VerifiedPlan cannot support fallback to implementation machinery that codegen never emitted.

Adaptive targets now use:

```text
CandidateStrategy
 -> independent verification
 -> VerifiedStrategy
 -> codegen all verified variants + selector
 -> ActivationReceipt @ epoch
 -> ActivePlan
```

A singular plan is the one-variant degenerate case.

Runtime adaptation selects only among preverified/pre-emitted variants.
It does not run codegen or invent implementation machinery.
