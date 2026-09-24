# FactTest Planner and Cost Model

STATUS: PASS 5  
DATE: 2026-09-23

## 1. Planner input

\`\`\`text
TypedSystemIR
CapabilityIR
H_A(epoch)
Objective
MetricEvidence
\`\`\`

Planner output is CandidatePlan plus result-strength metadata.

The planner never emits VerifiedPlan.

## 2. MetricEstimate

\`\`\`text
MetricEstimate
  metric
  unit
  lower_bound?
  value?
  upper_bound?
  provenance
  epoch_or_fixture
  confidence_class
\`\`\`

Initial metrics:

- startup_time_ns
- execution_time_ns
- transfer_time_ns
- transfer_bytes
- peak_working_memory_bytes
- persistent_bytes
- generated_bytes
- resource_count

Metric names with incomparable units cannot be directly summed unless the Objective explicitly defines a conversion/aggregation model.

## 3. Unknown cost

\`\`\`text
UNKNOWN != 0
UNKNOWN != infinity
\`\`\`

Unknown cost is an explicit state.

A planner may:
- avoid making an optimality claim involving unknown relevant dimensions;
- request measurement;
- use an objective policy that explicitly permits unknowns;
- return a feasible/heuristic plan with uncertainty.

It may not silently treat unknown as free.

## 4. Objective

\`\`\`text
Objective
  hard_constraints[]
  ordered_goals[]
  tie_break_rule
\`\`\`

Goal:

\`\`\`text
Goal
  metric
  direction: minimize|maximize
  aggregation
\`\`\`

Default when no objective:
- find one legal verified plan
- deterministic canonical tie break by stable plan identity/order
- no performance-optimality claim

## 5. Feasibility before optimization

Candidate generation excludes paths that fail:
- semantic compatibility
- refinement
- representation/transfer legality
- capability requirements
- runtime admission for epoch
- hard constraints

The planner does not rank illegal plans.

## 6. Result strength

\`\`\`text
FEASIBLE
EXACT_OPTIMUM
BOUNDED_OPTIMUM
HEURISTIC
NO_PLAN
\`\`\`

### FEASIBLE
one legal candidate proposed; no optimality claim.

### EXACT_OPTIMUM
finite legal search completed and all candidates relevant to the objective were evaluated under a complete comparable cost model.

### BOUNDED_OPTIMUM
an algorithm with valid lower/upper bounds/admissible heuristic proves no legal candidate can improve the result under the declared objective.

### HEURISTIC
search/ranking selected a candidate without proof of global optimum.

### NO_PLAN
no candidate survived legality/admission/hard-constraint checks.

## 7. A*

A* is permitted as one planner.

It supports an optimality claim only when:
- the search formulation is finite/appropriate,
- edge/path cost semantics match the Objective,
- the heuristic is admissible for that model,
- unknown relevant costs are handled by an explicit sound rule.

Otherwise its output strength is HEURISTIC or FEASIBLE.

## 8. Replanning

Planner input includes epoch-bound H_A.

A plan built for E0 is not automatically legal for E1.

When relevant admission/cost evidence changes:
- mark old plan stale
- construct new candidate
- independently verify
- produce runtime transition evidence

## 9. Planner explanation

Every CandidatePlan must support a human/AI-readable explanation artifact containing:

- semantic requirement
- considered candidate implementations
- rejected candidates and structured reasons
- selected implementation path
- relevant metric evidence
- Objective
- claimed result strength
- unresolved uncertainty

The explanation is not proof.
The verifier certificate provides proof of legality.
