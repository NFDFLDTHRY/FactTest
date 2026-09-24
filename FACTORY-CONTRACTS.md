# FactTest Factory Contracts

STATUS: PASS 5  
DATE: 2026-09-23

## 1. StructuralDelta

A StructuralDelta is the only authorized payload from approved ASCII into Factory routing.

Conceptual schema:

\`\`\`text
StructuralDelta
  delta_id
  canonical_base
  approved_ascii_refs[]
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

Rules:

- \`canonical_base\` identifies the exact repository state used to assemble the workpiece.
- MAY CHANGE and MUST NOT CHANGE must not overlap.
- every requested mutation must fall inside MAY CHANGE.
- every station selected must satisfy a required station capability.
- a delta with unresolved authorization conflict fails structural check.

## 2. Workpiece

\`\`\`text
Workpiece
  workpiece_id
  canonical_base
  base_tree
  current_tree
  structural_delta
  applied_station_receipts[]
  verification_result?
  evidence_refs[]
\`\`\`

Only the workpiece tree may be changed by stations.

The canonical repository is read-only until the integration gate moves a ref after verification.

## 3. Fixture

A Fixture binds a reusable StationSpec to one bounded job.

\`\`\`text
Fixture
  fixture_id
  station_id
  workpiece_id
  selected_inputs
  narrowed_may_read
  narrowed_may_change
  job_parameters
  expected_outputs
  tests
  evidence_requirements
\`\`\`

Invariant:

\`\`\`text
fixture.may_read subset-of station.may_read
fixture.may_change subset-of station.may_change
\`\`\`

A fixture cannot expand authority.

## 4. StationSpec

\`\`\`text
StationSpec
  station_id
  version
  capability_tags[]
  input_kinds[]
  operation_class
  output_kinds[]
  may_read[]
  may_change[]
  must_not_change[]
  preconditions[]
  invariants[]
  verification[]
  receipt_schema_version
\`\`\`

A station that needs new authority is a new/changed StationSpec and must be re-reviewed/qualified.

## 5. FactoryReceipt

\`\`\`text
FactoryReceipt
  receipt_id
  station_id
  station_version
  fixture_id
  workpiece_id
  canonical_base
  input_artifacts[]
  changed_paths[]
  output_artifacts[]
  verification_results[]
  evidence_refs[]
  status
\`\`\`

Receipt status cannot be PASS if any required verification failed or was skipped.

## 6. Independent Factory verification

Factory verification consumes:

- StructuralDelta
- base tree
- resulting workpiece tree
- all required receipts
- declared tests/evidence

It checks:

1. changed paths are within MAY CHANGE
2. MUST NOT CHANGE surfaces are byte/tree-identical where applicable
3. all required station receipts exist
4. all station preconditions/invariants/tests passed
5. delta output contract is satisfied
6. no hidden/unreceipted change exists

The verifier does not "fix" the workpiece.

Failure returns to ASCII.

## 7. Integration gate

Before integration:

\`\`\`text
current canonical main == StructuralDelta.canonical_base
\`\`\`

If false:

\`\`\`text
STOP
mark base-moved conflict
re-observe / reconcile / rebuild workpiece
\`\`\`

Force-moving the canonical ref over a changed base is forbidden.

## 8. Re-inspection

After integration:

1. fetch canonical branch/ref again
2. fetch canonical resulting tree
3. compare against verified workpiece tree
4. execute/probe applicable tests
5. produce evidence
6. render observed ASCII delta
7. compare intended vs observed structure

MATCH may close work.

DIFFER returns [ERR]/[GAP] to the human/AI interaction layer.

## 9. Factory vs compiler

Factory contracts authorize mutation of FactTest.git.

Compiler contracts transform source semantics into compiler artifacts/generated object B.

A compiler backend may not claim Factory authority.

A Factory station receipt may not be used as a compiler proof certificate.
