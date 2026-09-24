# Byte Relay Expected Commissioning Trace

STATUS: MODEL TRACE - NOT RUNTIME EVIDENCE

```text
Authored ASCII
 -> SourceArtifact
 -> SystemAst
 -> ResolvedSystem
 -> TypedSystemIR
 -> transfer requirement
 -> representation/conversion graph H_G
 -> CandidateStrategy
 -> VerifiedPlanVariant G
 -> VerifiedPlanVariant W
 -> VerifiedStrategy
 -> GeneratedBundle
 -> BundleCertificate
 -> MachineEpoch
 -> ActivationReceipt
 -> ActivePlan
 -> RuntimeEvidence
 -> ObservationDelta
 -> observed ASCII
```

Expected source identities include:

```text
SystemId byte_relay
TypeId Bytes
ComponentId ingress
ComponentId egress
PortId ingress.bytes
PortId egress.bytes
RelationId relay
InvariantId i_type
InvariantId i_prod
InvariantId i_cons
InvariantId i_path
TestId t_roundtrip
EvidenceId e_roundtrip
MetricId preference_rank
ObjectiveId commissioning
```

Typed checks:
- ingress.bytes is output
- egress.bytes is input
- both resolve Bytes
- DATA mode=copy
- endpoints unique
- invariants resolve

Lowering:
DATA/copy becomes a transfer/representation-path obligation.
Objective passes unchanged to planning.

H_G must contain explicit W and G paths.

Model E0 activates both guards and objective selects G.
Model E1 rejects G and selects W.

This document specifies the trace; it does not claim those artifacts have been produced by a compiler yet.
