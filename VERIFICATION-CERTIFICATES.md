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
