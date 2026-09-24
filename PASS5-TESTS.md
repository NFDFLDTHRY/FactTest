# FactTest Pass 5 Test Ladder

STATUS: PASS 5  
DATE: 2026-09-23

These are future implementation obligations.
Pass 5 defines them but does not execute them because no compiler/factory implementation exists yet.

## Factory tests

### P5-F01 unauthorized mutation
Station changes path outside fixture MAY CHANGE.
Expected: independent Factory verification FAIL.

### P5-F02 fixture authority expansion
Fixture requests path/capability beyond StationSpec.
Expected: router/structural check rejects before execution.

### P5-F03 missing receipt
Required station operation has no FactoryReceipt.
Expected: integration gate FAIL.

### P5-F04 failed station verification
Receipt contains failed required test.
Expected: receipt cannot be PASS; integration blocked.

### P5-F05 moved base
Canonical branch changes after workpiece creation.
Expected: integration gate stops; no force update; return conflict to ASCII.

### P5-F06 read-only station mutation
BUILD_VERIFY/BROWSER_PROBE modifies source.
Expected: verification FAIL.

## Lowering tests

### P5-L01 capability enumeration
Semantic capability with multiple registered contracts.
Expected: all statically legal candidate edges appear in H_G.

### P5-L02 implementation pin
Source pins one ImplementationId.
Expected: non-pinned candidates removed from legal candidate set.

### P5-L03 runtime absence
Implementation exists in H_G but runtime admission rejects it.
Expected: edge absent from H_A(E), still present in H_G.

### P5-L04 missing representation path
Producer/consumer semantic types have no compatible representation/conversion path.
Expected: no legal candidate plan using that path.

### P5-L05 implicit conversion forbidden
Planner/codegen attempts undeclared conversion.
Expected: verification FAIL.

### P5-L06 transfer-mode mismatch
Semantic DATA requires move; conversion only supports copy.
Expected: verification FAIL.

### P5-L07 refinement survives lowering
Cheaper implementation violates abstract subsystem contract.
Expected: candidate illegal before cost ranking.

## Planning/verifier tests

### P5-V01 planner cannot forge VerifiedPlan
Expected: compile/type/module boundary prevents direct construction.

### P5-V02 invalid candidate
Candidate misses required capability/sequence/data edge.
Expected: independent verifier FAIL with exact obligation.

### P5-V03 unknown cost
Relevant metric unknown.
Expected: not interpreted as zero; optimality claim restricted.

### P5-V04 heuristic strength
Non-admissible heuristic search selects candidate.
Expected: result strength HEURISTIC/FEASIBLE, never OPTIMUM.

### P5-V05 exact/bounded optimum
Fixture with finite known graph/costs.
Expected: exact or admissible-bounded proof required before optimum label.

### P5-V06 stale epoch
Admission used by plan becomes stale at E1.
Expected: VerifiedPlan for E0 cannot be reused as valid for E1.

### P5-V07 cost cannot rescue invalidity
Lowest-cost candidate violates refinement/invariant.
Expected: verifier rejects; planner must choose another/legal path or NO_PLAN.

## Codegen/bundle tests

### P5-C01 CandidatePlan into codegen
Expected: impossible/rejected; codegen requires VerifiedPlan.

### P5-C02 undeclared adapter
Codegen emits browser adapter not in VerifiedPlan.
Expected: BundleVerifier FAIL.

### P5-C03 missing required adapter/artifact
VerifiedPlan requires adapter/artifact absent from bundle.
Expected: BundleVerifier FAIL.

### P5-C04 Wasm target mismatch
Bundle emits wasm32/fallback despite project law.
Expected: BundleVerifier FAIL.

### P5-C05 lineage mismatch
Bundle references wrong source/plan/certificate.
Expected: BundleVerifier FAIL.

## Runtime/replan tests

### P5-R01 capability loss
Selected runtime resource becomes LOST.
Expected: admission/plan stale; no continued silent use.

### P5-R02 replacement plan
E1 admits alternative backend.
Expected: planner creates CandidatePlan; independent verifier required before activation.

### P5-R03 same semantics
Replan attempts to mutate source semantics automatically.
Expected: forbidden; source unchanged.

### P5-R04 runtime evidence
Loss/transition/success emits RuntimeEvidence with epoch/plan identity.

### P5-R05 observed ASCII
ObservationDelta renders human/AI-readable observed ASCII.

### P5-R06 no source overwrite
Observed ASCII/runtime status does not modify authored ASCII without an explicit human/AI-approved source delta.

## Contract sweep tests

### P5-S01 target preservation
Every capability family in CAPABILITY-MATRIX.md is represented by an ImplementationContract family or explicit GAP/ERR entry.

### P5-S02 direct authority
Externally constrained contract fields carry direct current spec links where available.

### P5-S03 incomplete contract honesty
Missing representations/probes/failures/cost dimensions remain GAP/UNK rather than guessed.

## Closure properties

\`\`\`text
semantic fact
  -> lowering obligation
  -> legal implementation edge
  -> representation path
  -> runtime admission
  -> CandidatePlan
  -> VerifiedPlan
  -> GeneratedBundle
  -> RuntimeEvidence
  -> observed ASCII
\`\`\`

Every arrow must be inspectable and receipted/certified by the layer that owns it.

No layer may silently invent, drop or redefine a fact owned by an earlier layer.
