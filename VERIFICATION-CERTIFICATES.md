# FactTest Verification and Certificates

STATUS: PASS 5  
DATE: 2026-09-23

## 1. Verifier role

The verifier decides legality/correctness of a CandidatePlan.

It does not choose the plan.
It does not optimize.
It does not mutate source.

## 2. Rule classes

Finite deterministic verifier rule classes:

### SEMANTIC
Pass-4 invariant expressions hold in the resolved semantic graph/plan relation.

### REFINEMENT
Concrete subsystem/interface preserves abstract public contract.

### LOWERING
Every execution-critical semantic capability/effect/data/sequence requirement has a corresponding plan obligation/implementation.

### REPRESENTATION
Every producer/consumer value has a legal representation path and explicit conversions.

### OWNERSHIP
move/borrow/copy/share/observe semantics are preserved and lifetimes legal.

### CAPABILITY
selected implementation covers the required SemanticCapability.

### ADMISSION
selected implementation has a non-stale ADMITTED receipt for the plan epoch.

### PLAN
dependencies, sequencing, operation coverage and hard constraints are satisfied.

### EFFECT
selected implementation does not leak undeclared externally observable effects.

### BUNDLE
generated artifact/adapter/import lineage corresponds exactly to VerifiedPlan.

## 3. Obligation result

\`\`\`text
ObligationResult
  obligation_id
  rule_id
  status: PASS|FAIL
  subject_refs[]
  witness_refs[]
  source_spans[]
  authority_links[]
  actual_facts[]
  required_facts[]
\`\`\`

A missing required witness is not PASS.

## 4. ProofCertificate

\`\`\`text
ProofCertificate
  certificate_id
  source_artifact_id
  typed_ir_artifact_id
  capability_ir_artifact_id
  machine_epoch
  candidate_plan_id
  obligation_results[]
  verifier_version
  status
\`\`\`

Certificate status PASS requires every required obligation PASS.

## 5. VerifiedPlan construction

Only the verifier module/API owns the constructor/token capable of producing VerifiedPlan.

Conceptually:

\`\`\`text
CandidatePlan
    |
    v
Verifier
  PASS -> VerifiedPlan + ProofCertificate
  FAIL -> diagnostics + failed certificate
\`\`\`

Planner and codegen cannot forge VerifiedPlan.

## 6. Optimality separation

ProofCertificate proves plan legality under stated semantics/machine epoch.

Planner-result-strength evidence separately supports FEASIBLE/HEURISTIC/OPTIMUM claims.

\`\`\`text
VerifiedPlan
    does not mean
OptimalPlan
\`\`\`

## 7. Staleness

A VerifiedPlan is valid only for the machine/admission epoch encoded by its certificate, except for observations explicitly proven irrelevant to that plan.

When a relevant admission becomes stale, plan validity becomes stale until reverified.

## 8. Diagnostic quality

Verification failures must identify:
- exact obligation/rule
- source semantic object/span
- candidate implementation/representation edge
- expected vs actual facts
- evidence/admission refs
- direct authority links when an external rule causes the failure

No generic "verification failed" is sufficient when structured cause is known.


# Pass 6 amendment - VerifiedStrategy

The earlier singular, epoch-bound VerifiedPlan model cannot by itself guarantee that runtime fallback machinery was emitted.

Adaptive targets use:

```text
CandidatePlan
   |
   v
Verifier
   |
   v
VerifiedPlanVariant

CandidateStrategy
   |
   v
StrategyVerifier
   |
   v
VerifiedStrategy
```

## VerifiedPlanVariant

```text
VerifiedPlanVariant
  plan_id
  semantic/capability/representation plan
  activation_guard
  proof_certificate_id
```

Its proof is conditional:

```text
IF activation_guard is satisfied
THEN this variant preserves the source obligations.
```

It is not bound to one concrete runtime epoch.

## VerifiedStrategy

```text
VerifiedStrategy
  strategy_id
  source_artifact_id
  verified_variants[]
  dispatch_objective
  tie_break
  strategy_certificate_id
```

StrategyVerifier proves:
1. every variant is independently verified;
2. selector candidates are a subset of verified variants;
3. selector predicates use declared admission/metric facts only;
4. dispatch respects the authored Objective;
5. tie-breaking is deterministic;
6. no unverified variant can become active.

Only verifier-owned APIs may construct VerifiedStrategy.

## ActivationReceipt and ActivePlan

```text
ActivationReceipt
  epoch_id
  strategy_id
  plan_id
  admission_refs[]
  metric_evidence_refs[]
  guard_result
  status
```

```text
ActivePlan =
  VerifiedPlanVariant
  + PASS ActivationReceipt @ Epoch
```

Epoch binding belongs to activation, not to the static conditional plan proof.

A single-plan target is a one-variant VerifiedStrategy.

Correctness and optimality remain separate.
