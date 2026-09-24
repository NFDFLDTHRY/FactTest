# FactTest Lowering Model

STATUS: PASS 5  
DATE: 2026-09-23

## 1. Lowering ownership

Pass 4 owns semantic meaning.

Pass 5 lowering maps that meaning into implementation requirements without changing it.

\`\`\`text
ASCII semantic islands
    |
    v
TypedSystemIR
    |
    v
CapabilityLowering
    |
    v
CapabilityIR
    |
    v
Implementation enumeration
    |
    v
H_G
\`\`\`

## 2. Pass-4 construct mapping

### System / component / subsystem
Lower to semantic operation/ownership scopes.
No implementation selected solely by object kind.

### Port / nominal type
Lower to typed data obligations.
Physical representation remains unresolved until implementation enumeration.

### DATA relation
Lower to:
- producer/consumer semantic dependency
- TypeId compatibility
- TransferMode requirement
- representation-transition obligation

### SEQUENCE relation
Lower to explicit precedence obligation in candidate plans.

### OWNS/resource
Lower to ownership/lifetime obligation.

### effect / uses
Lower to effect obligation carried into implementation/refinement verification.

### capability / requires
Lower to SemanticCapability requirement.

### implementation / pin
Restrict legal ImplementationId candidates.

### refines
Create refinement obligations from REFINEMENT-LAW.md.

### invariant
Create semantic proof obligations with exact source lineage.

### test / evidence / witnesses
Create compiler/test/evidence obligations; do not mark them satisfied merely by declaration.

### governance status
Preserve in artifacts/analysis policy.
Status does not become backend execution logic.

### authority
Attach provenance/authority reference to constrained object/obligation.

## 3. CapabilityIR

Conceptual schema:

\`\`\`text
CapabilityIR
  semantic_objects[]
  semantic_requirements[]
  transfer_requirements[]
  ownership_requirements[]
  sequence_requirements[]
  effect_requirements[]
  refinement_obligations[]
  invariants[]
  implementation_pins[]
  test_obligations[]
  evidence_requirements[]
  governance[]
  source_lineage
\`\`\`

No browser/API backend is inserted unless an implementation pin explicitly requires it or implementation enumeration is being performed.

## 4. Implementation enumeration

Given a semantic requirement:

\`\`\`text
SemanticCapabilityId
    |
    v
lookup registered ImplementationContracts
    |
    +-- reject statically incompatible contracts
    |
    v
legal candidate ImplementationIds
\`\`\`

Static compatibility checks include:

- semantic capability coverage
- semantic type/representation availability
- transfer-mode support
- effect/refinement legality
- implementation pins
- target-family/toolchain constraints

Runtime support is not checked here.

## 5. H_G vs H_A

\`\`\`text
H_G
  compiler-known, statically legal implementation hypergraph

H_A(E)
  H_G filtered by epoch-bound runtime admissions
\`\`\`

An edge absent from H_A(E) remains in H_G unless the compiler implementation itself lacks that edge.

This preserves G/C/M/A separation.

## 6. Explicit conversions

A semantic DATA edge can only be planned when:

- producer representation is accepted directly by consumer implementation, or
- an explicit ConversionContract path exists.

No implicit JS/Wasm/GPU/media conversion is permitted.

## 7. Refinement survives lowering

An abstract subsystem's public contract becomes obligations on every concrete candidate.

Planner selection cannot bypass failed refinement.

A cheaper concrete implementation that violates refinement is illegal, not suboptimal.

## 8. Lowering receipts

Each lowering transformation eventually emits a CompilerReceipt identifying:

- input TypedSystemIR artifact
- output CapabilityIR/H_G artifact
- lowering version
- applied deterministic rules
- diagnostics
- source-lineage references

Lowering receipts are compiler artifacts, not Factory receipts.


## 9. Objective pass-through (Pass 6 amendment)

Metrics/Objectives are not lowered into capability requirements.

They pass from TypedSystemIR into planning as explicit source-owned planning constraints.

```text
TypedSystemIR
   |                 \
   |                  +-- Objective/Metric semantics ----+
   v                                                   |
CapabilityIR -> H_G -> H_A ----------------------------+-> Planner
```

Capability lowering may not rewrite or invent an Objective.

## 10. DATA transfer requirements

Every Pass-4 DATA relation creates a transfer requirement independent of any named SemanticCapability.

For example:

```text
DATA mode=copy
TypeId=Bytes
```

requires a legal representation/conversion path that preserves the semantic value and copy mode.

This allows different storage-domain implementations without hidden source-level backend semantics.
