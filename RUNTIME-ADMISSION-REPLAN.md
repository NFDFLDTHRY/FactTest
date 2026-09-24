# FactTest Runtime Admission and Replan

STATUS: PASS 5  
DATE: 2026-09-23

## 1. MachineEpoch

\`\`\`text
MachineEpoch
  epoch_id
  environment_identity
  secure_context_state
  policy_state
  permission_state
  interface_presence
  feature_sets
  limits
  resource_state
  probe_evidence_refs[]
\`\`\`

Epoch identity changes when a relevant observation used by admission/planning changes.

## 2. AdmissionReceipt

\`\`\`text
AdmissionReceipt
  receipt_id
  epoch_id
  implementation_id
  decision: ADMITTED|REJECTED
  evaluated_requirements[]
  probe_evidence_refs[]
  rejection_reason?
  status
\`\`\`

Admission is derived.
It is not a mutable flag owned by a backend.

## 3. H_A

\`\`\`text
H_A(E) = edges in H_G whose required admissions PASS for epoch E
\`\`\`

Rejected edges remain represented in H_G with reasons.

## 4. Plan binding

\`\`\`text
VerifiedPlan
  ...
  epoch_id
\`\`\`

If a selected implementation/resource loses validity:
- admission receipt becomes stale
- plan becomes stale
- continued use is forbidden unless the contract explicitly proves the changed observation irrelevant

## 5. Loss/replan sequence

\`\`\`text
P0 @ E0
  |
  v
EXECUTE
  |
  +-- success -> evidence
  |
  '-- relevant loss/change
          |
          v
        E1
          |
          v
invalidate affected admissions
          |
          v
construct H_A(E1)
          |
          v
planner -> CandidatePlan P1
          |
          v
independent verifier
          |
          v
VerifiedPlan P1 @ E1
          |
          v
codegen/reconfigure as required
          |
          v
resume execution
\`\`\`

The same authored semantic source/invariants remain the correctness target.

## 6. RuntimeEvidence

\`\`\`text
RuntimeEvidence
  evidence_id
  epoch_id
  plan_id
  event_class
  subject
  observation
  expected?
  timestamp_or_monotonic_marker
  artifact_refs[]
\`\`\`

Time is runtime evidence metadata, not semantic compiler input unless explicitly modeled.

## 7. ObservationDelta

Runtime evidence may be summarized into:

\`\`\`text
ObservationDelta
  from_epoch
  to_epoch
  changed_observations[]
  invalidated_admissions[]
  stale_plans[]
  replacement_plan?
  evidence_refs[]
\`\`\`

## 8. Observed ASCII

ObservationDelta can render into human/AI-readable ASCII using governance/status islands.

Example:

\`\`\`text
+----------------------------------------------------+
| Runtime Observation                               |
| @{status webgpu_impl ERR "device lost at E17"}    |
| @{status wasm_impl RUN "fallback plan P42 active"}|
| @{issue transition OBS "P41 -> P42"}              |
+----------------------------------------------------+
\`\`\`

Observed ASCII is not authored source mutation.

Human/AI reconciliation decides whether the authored source should change.

## 9. Replan invariant

For source S:

\`\`\`text
Verified(P0, S, E0)
machine changes
Verified(P1, S, E1)
\`\`\`

The planner may change implementation strategy.
It may not change S to make the new plan easier.

## 10. Evidence loop

\`\`\`text
execute
  -> RuntimeEvidence
  -> ObservationDelta
  -> observed ASCII
  -> human/AI inspection
  -> MATCH or authored ASCII change
\`\`\`

This is the runtime closure of Factory Law's re-observation principle.
