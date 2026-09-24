# FactTest Codegen and Bundle Contract

STATUS: PASS 5  
DATE: 2026-09-23

## 1. Codegen input

Codegen accepts:

\`\`\`text
TypedSystemIR
VerifiedPlan
ImplementationContracts
RepresentationContracts
ConversionContracts
CodegenRecipes
\`\`\`

CandidatePlan is not a legal codegen input.

## 2. Codegen restrictions

Codegen may not:
- select a backend absent from VerifiedPlan
- add an undeclared browser capability
- change semantic capability requirements
- relax/reforge invariants
- alter transfer/ownership mode
- invent a representation/conversion edge
- change machine epoch/admission state
- rewrite authored ASCII

## 3. GeneratedBundle

Conceptual bundle manifest:

\`\`\`text
GeneratedBundle
  bundle_id
  source_lineage
  verified_plan_id
  proof_certificate_id
  machine_epoch_assumption
  artifact_roles[]
  wasm_artifacts[]
  host_artifacts[]
  shell_artifacts[]
  manifest_artifacts[]
  service_worker_artifacts[]
  adapter_inventory[]
  import_export_inventory[]
  evidence_hooks[]
  metadata_artifacts[]
\`\`\`

## 4. Artifact roles

The bundle can contain:
- Rust/Wasm program/runtime modules
- JS capability membrane
- browser capability adapters
- HTML application shell
- Web App Manifest
- Service Worker/cache logic
- runtime evidence instrumentation
- source/plan/proof metadata

Concrete filenames are implementation output, not semantic identity.

## 5. BundleVerifier

BundleVerifier is independent from codegen generation logic where practical and checks:

1. all required artifact roles exist
2. every emitted adapter appears in VerifiedPlan
3. no undeclared capability adapter exists
4. Wasm target/address expectations match the plan/project law
5. host imports/exports match generated Wasm contract
6. manifest/shell/service-worker paths/scopes are internally coherent
7. bundle metadata names the correct source/VerifiedPlan/ProofCertificate
8. required evidence hooks exist
9. forbidden debug/bootstrap dependency does not leak into production bundle

BundleVerifier does not run planner optimization.

## 6. BundleCertificate

\`\`\`text
BundleCertificate
  bundle_id
  verified_plan_id
  checks[]
  artifact_identity_refs[]
  status
\`\`\`

Only a PASS bundle may proceed to runtime probe/admission in Pass 6.

## 7. Runtime deployment boundary

A verified bundle on disk is not runtime evidence.

Browser installation, API admission, execution and loss/replan behavior remain runtime observations.

Manifest presence is not installation proof.
Codegen success is not execution proof.


# Pass 6 amendment - CodegenRecipe and VerifiedStrategy

## CodegenRecipe

```text
CodegenRecipe
  recipe_id
  implementation_id
  required_artifact_roles[]
  required_imports[]
  provided_exports[]
  representation_bindings[]
  host_adapter_requirements[]
  generated_capability_declarations[]
  evidence_hooks[]
  bundle_verification_obligations[]
```

A recipe realizes one already-verified implementation contract.
It contains no planner heuristic and cannot select another backend.

## Adaptive codegen input

```text
TypedSystemIR
VerifiedStrategy
ImplementationContracts
RepresentationContracts
ConversionContracts
CodegenRecipes
```

Neither CandidatePlan nor CandidateStrategy is legal codegen input.

GeneratedBundle additionally records:
- verified_strategy_id
- variant_inventory
- runtime_selector_artifact
- variant certificate references
- strategy certificate reference

BundleVerifier proves:
1. every emitted variant belongs to VerifiedStrategy;
2. every strategy variant required for runtime selection was emitted;
3. selector can activate only verified variants;
4. each emitted implementation uses its declared CodegenRecipe;
5. no hidden unverified fallback exists.

Runtime switching does not require code generation inside the generated WebApp.
