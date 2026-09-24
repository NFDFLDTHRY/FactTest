# Pass 6 Cross-Pass Gap Repairs

STATUS: MATERIALIZED DESIGN REPAIRS

## GAP-6.1 - Objective missing from ASCII

Pass 1 required optimization objectives and Pass 5 defined Objective, but Pass 4 had no source syntax.

Repair:
ASCII-GRAMMAR.md now defines Metric, Objective, ordered Goal and hard metric constraint statements.

## GAP-6.2 - Singular VerifiedPlan cannot support emitted fallback

Problem:
Codegen from one epoch-bound plan can omit alternatives needed after runtime capability loss.

Repair:

```text
CandidatePlan -> VerifiedPlanVariant
CandidateStrategy -> VerifiedStrategy
VerifiedStrategy -> codegen all verified variants + selector
MachineEpoch -> ActivationReceipt -> ActivePlan
```

Runtime only selects preverified/pre-emitted variants.

## GAP-6.3 - CodegenRecipe undefined

ImplementationContract referenced codegen_recipe_id but no recipe contract existed.

Repair:
CODEGEN-BUNDLE-CONTRACT.md now defines CodegenRecipe.

## GAP-6.4 - Identity domains incomplete

Repair:
BOOTSTRAP-CONTRACTS.md C19 adds ObjectiveId, MetricId, RepresentationId, ConversionId, PlanId, StrategyId, EpochId, ProbeId, CodegenRecipeId, CertificateId, BundleId, DeltaId, WorkpieceId, FixtureId and StationId.

## GAP-6.5 - Runtime "replan" implied too much

For the current architecture, adaptive runtime replan means reselection inside a finite VerifiedStrategy.

A genuinely open-ended runtime planner/compiler requires a future explicit architecture and proof surface.
