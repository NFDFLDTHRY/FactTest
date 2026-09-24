# FactTest Semantic Model

STATUS: PASS 4  
DATE: 2026-09-23

## 1. Source model

\`\`\`text
Project
  SourceUnit*
      SourceId
      exactly one SystemId
      PresentationTape
      SemanticIsland*
\`\`\`

PresentationTape retains source bytes/spans needed for diagnostics and interaction but does not create executable meaning.

SemanticIsland contains one parsed semantic statement plus exact source span.

## 2. Core semantic objects

\`\`\`text
System
Component
Subsystem
Port
Type
Resource
Effect
SemanticCapability
ImplementationCapability
Invariant
Test
EvidenceRequirement
GovernanceIssue
Relation
AuthorityReference
\`\`\`

Every object resolves to the distinct typed ID domain established by Pass 3.

## 3. System AST

Conceptual System AST:

\`\`\`text
SystemAst
  system_id
  imports[]
  types[]
  components[]
  ports[]
  resources[]
  effects[]
  semantic_capabilities[]
  implementation_capabilities[]
  relations[]
  invariants[]
  tests[]
  evidence_requirements[]
  governance[]
  authority_refs[]
  source_lineage
\`\`\`

This is a semantic model, not final Rust syntax/layout.

## 4. Resolved System

Resolution replaces textual references with typed IDs.

\`\`\`text
Textual ComponentRef
        |
        v
ComponentId

Textual PortRef
        |
        v
(ComponentId, PortId)
\`\`\`

After resolution, semantic phases do not depend on display labels/raw identifier strings for identity.

## 5. Typed System IR

Pass 4 fixes the semantic obligations of the typed graph.

Every DATA edge has:

- RelationId
- source PortId
- destination PortId
- resolved TypeId
- TransferMode

Every port has:

- owning ComponentId
- direction
- TypeId
- visibility

Every component may have:

- contained/private objects
- effects
- semantic capability requirements
- implementation pins
- invariants/status/authority relations

Required structural truths include:

- every input port used by buildable execution has the producer contract required by its invariants/default structural rule
- DATA source is output
- DATA destination is input
- types are compatible
- private boundaries are respected
- duplicate IDs are rejected
- sequence edges are explicit
- unresolved references are diagnostics

## 6. Semantic versus implementation capability

\`\`\`text
SemanticCapabilityId
        |
        | lowering
        v
ImplementationCapabilityId*
        |
        | runtime observation/admission
        v
Admission*
\`\`\`

Example:

\`\`\`text
VIDEO_ENCODE
  -> WEBCODECS
  -> WASM_CODEC
  -> future implementation
\`\`\`

The source can pin an implementation, but absent a pin the semantic capability does not imply one.

## 7. Ownership/transfer

TransferMode belongs to DATA relation semantics.

### move
Logical ownership transfers from producer side to consumer side for the relation's value/resource.

### borrow
Producer ownership remains; consumer receives bounded use.

### copy
Consumer receives a semantically independent value.

### share
The same logical resource may be jointly accessible under a separate sharing/consistency contract.

### observe
Consumer receives read-only observation and gains neither ownership nor control.

Pass 5 maps these semantic modes to actual runtime representations.

## 8. Effects

Effects are nominal semantic identities describing system-significant external behavior.

They do not select an API.

For example, a system may declare a semantic STORAGE_WRITE effect while Pass 5 later offers OPFS and IndexedDB implementation contracts with different legal representations.

Undeclared effect escape across a subsystem public boundary violates refinement.

## 9. Visibility

Public object:
may participate in external system/subsystem contracts subject to namespace/import rules.

Private object:
may only be referenced inside its owning system/subsystem boundary.

Visual placement outside a box cannot make a private object public.

## 10. Invariant model

InvariantExpression is a finite tree built from the Pass-4 core predicate/combinator set.

It is:

- side-effect free
- deterministic
- closed over resolved semantic IDs
- non-Turing-complete
- independent of host I/O

Pass 5 may map invariants into proof obligations/verifier checks, but may not reinterpret their meaning.

## 11. Governance model

Governance status attaches to semantic objects but does not affect normal runtime execution semantics by itself.

Build/analyze policies inspect statuses.

Examples:

- GAP on an execution-critical unresolved implementation may block BUILD.
- OBS records an observation state in the design conversation.
- RUN records witnessed execution/evidence status.
- ERR records contradiction/failure.
- UNK preserves uncertainty.

These are human/AI project-state semantics.

## 12. Partial semantic graph

ANALYZE mode permits a graph containing unresolved references/gaps/errors when the parser can still preserve object identity and meaningful partial structure.

A partial graph carries diagnostics and statuses.

BUILD requires the subset of semantic obligations designated execution-critical to be resolved/proven.

This distinction keeps the diagram useful during design.

## 13. Canonical semantic rendering

Canonical rendering receives the resolved AST/semantic graph, not the original presentation layout.

It emits:

- system header
- declarations in deterministic namespace/ID order
- explicit ports
- explicit relations
- explicit contracts/status/tests/evidence
- human-readable ASCII grouping
- no hidden semantic metadata

Laws:

\`\`\`text
parse(render(AST)) == AST

render(parse(render(AST))) == render(AST)
\`\`\`

The canonical renderer may normalize presentation while preserving all semantic facts.

## 14. Presentation preservation

The compiler should retain enough source-span/presentation lineage to:

- point diagnostics into the authored diagram
- associate semantic islands with original visual context
- allow tools to show original and canonical renderings side-by-side

It must not require the canonical rendering to replace the authored source.

## 15. Equality

Semantic equivalence ignores presentation/prose and compares resolved semantic graphs.

Two sources that differ only in allowed presentation transformations are equivalent.

Two sources that draw identical artwork but carry different semantic islands are not equivalent.

## 16. Ambiguity rule

Any construct that cannot resolve to one typed identity/meaning fails.

Examples:

- duplicate semantic ID in one namespace/scope
- reference resolving to multiple imported public identities
- DATA endpoint omitted and inferred from nearby box
- unspecified relation kind
- unknown semantic keyword
- missing public type where required

The compiler never chooses a visually plausible interpretation.


## 17. Metrics and objectives (Pass 6 amendment)

Additional semantic objects:

```text
Metric
  MetricId
  unit
  description

Objective
  ObjectiveId
  hard_constraints[]
  ordered_goals[]
```

SystemAst additionally carries:

```text
metrics[]
objectives[]
```

Typed semantic checks establish:
- referenced MetricId exists;
- goal priorities are unique;
- metric/unit use is defined;
- hard constraints are structurally valid.

Metrics/objectives may change legal-strategy selection but do not change functional invariants.

Measured values remain planning/runtime evidence unless source explicitly fixes a value.
