# Byte Relay Commissioning Record

STATUS: PASS 6 PHYSICAL COMMISSIONING GATE - EVIDENCE MAP
SOURCE OF TRUTH: the receipts and evidence files named below (integrated through the Factory), never this table.
EVIDENCE CLASSES: SYNTHETIC_MODEL (fixture epochs E_model_0/1) and PHYSICAL_BROWSER (Chromium 141 headless on
Linux x86_64; WebGPU through SwiftShader Vulkan; wasm64 through V8 Memory64).  They are never conflated.

## Evidence rungs reached (FABLE-ASCII-SYSTEM-PROMPT.md EVIDENCE)

```text
CLAIMED  -> owner contracts (PASS1..PASS6)
CHECKED  -> factc BUILD status OK on the authoritative source (evidence/D6/physical/compile/diagnostics.json)
BUILT    -> bundle emitted (evidence/D6/physical/compile/bundle/*)
STATIC VERIFIED -> ProofCertificates 1,2 + StrategyCertificate 1000 PASS (evidence/D6/physical/compile/verification-certificates.json)
BUNDLE VERIFIED -> bundle-certificate.json PASS (23 checks)
RUNTIME ADMITTED -> AdmissionReceipts E0: CPU_WASM64 ADMITTED (wasm64_known_answer), WEBGPU ADMITTED (webgpu_known_answer,
                    adapter vendor=google architecture=swiftshader)  (evidence/D6/physical/probe-webgpu/runtime-evidence.json)
EXECUTED -> E0 plan 1 (WEBGPU) payloads A and B; E1 plan 0 (CPU_WASM64) payloads A and B  (probe-record.json)
CORRECT OUTPUT -> harness-side exact compare true for all four executions; runtime sha256(input)==sha256(output)
LOSS/RECOVERY WITNESSED -> GPUDevice.destroy() -> device.lost reason "destroyed" -> E1 -> reselection plan 1 -> plan 0
OBSERVED ASCII -> evidence/D6/physical/observed/observed.ascii (14 governance islands derived from the tape)
```

## PASS6-TESTS.md map

Legend: PASS (physical or deterministic witness integrated with a Factory receipt), MODEL (synthetic model
witness), GAP (not achievable in this environment; target preserved).

| Test | Status | Witness |
|---|---|---|
| P6-G01 Objective parses/canonical-renders | PASS | language_ladder::p6_g01_a03_objective_parses_and_renders (evidence/D2/build/test.log) |
| P6-G02 MetricId != ObjectiveId | PASS | language_ladder::p6_g02_metric_and_objective_are_distinct_namespaces |
| P6-G03 CodegenRecipe required | PASS | lowering_ladder::p6_g03_ready_contract_requires_a_codegen_recipe (evidence/D3) |
| P6-G04 CandidateStrategy cannot enter codegen | PASS | codegen signature takes `&VerifiedStrategy`; bundle_ladder::p5_c01_p6_g04_... (evidence/D5) |
| P6-G05 only verifier constructs VerifiedStrategy | PASS | fixtures/compiler/negative/forge-verified-strategy rejected by rustc (evidence/D4/negative/summary.log) |
| P6-G06 selector activates only VerifiedStrategy variants | PASS | strategy_ladder::p6_m04_p6_g06_...; bundle check B-06-selector-variants (evidence/D4, D5) |
| P6-A01 compact/large layouts equivalent | PASS | commissioning_ladder::p6_a01_x03_compact_layout_is_semantically_identical (evidence/D7) |
| P6-A02 drawn arrow without DATA island | PASS | language_ladder::l33_drawn_arrow_creates_no_relation (evidence/D2) |
| P6-A03 metric/objective/goal in canonical rendering | PASS | evidence/D2/byte-relay/canonical-ascii-0.ascii |
| P6-M01 E_model_0 selects G | MODEL+PASS | strategy_ladder::p6_m01; evidence/D4/byte-relay/E_model_0/activation-receipt-model.json |
| P6-M02 E_model_1 selects W | MODEL+PASS | strategy_ladder::p6_m02; evidence/D4/byte-relay/E_model_1/activation-receipt-model.json |
| P6-M03 unknown metric is not zero | PASS | strategy_ladder::p6_m03_unknown_metric_is_not_zero |
| P6-M04 unverified variant excluded | PASS | strategy_ladder::p6_m04_p6_g06_selector_activates_only_verified_variants |
| P6-V01 type mismatch fails | PASS | strategy_ladder::p6_v01_type_mismatch_never_reaches_planning; language_ladder::l09 |
| P6-V02 missing conversion fails | PASS | strategy_ladder::p6_v04_undeclared_conversion_and_p6_v02_missing_conversion_fail |
| P6-V03 move-only cannot satisfy copy | PASS | strategy_ladder::p6_v03_p5_l06...; lowering_ladder::p5_l06_p6_v03... |
| P6-V04 undeclared conversion fails | PASS | strategy_ladder::p6_v04... (rule V-LOW) |
| P6-V05 invalid candidate not rescued by preference_rank | PASS | strategy_ladder::p6_v05... (rules V-ADM, V-STRAT) |
| P6-B01 both verified variants emitted | PASS | bundle_ladder::p6_b01_b02_c1_c2...; evidence/D6/physical/compile/bundle/membrane.js |
| P6-B02 selector emitted | PASS | same; selector.js dispatch_order [1,0] |
| P6-B03 undeclared third adapter fails | PASS | bundle_ladder::p6_b03_undeclared_third_adapter_fails (B-02/B-03) |
| P6-B04 missing strategy variant fails | PASS | bundle_ladder::p6_b04_missing_strategy_variant_fails (B-04/B-06) |
| P6-B05 wasm32 fails | PASS | bundle_ladder::p6_b05_... (B-05-wasm64); factory wasm-inspect rejects i32 memories |
| P6-B06 lineage matches source/strategy/certificates | PASS | bundle_ladder::p6_b06_p5_c05_lineage_mismatch_fails (B-08) |
| P6-R01 actual Wasm64 roundtrips both payloads | PASS (physical) | evidence/D6/physical/probe-webgpu/probe-record.json step E1-relay; probe-no-webgpu step E0-relay |
| P6-R02 actual WebGPU roundtrips both payloads | PASS (physical, SwiftShader) | probe-record.json step E0-relay: backend WEBGPU, exact_harness true for A and B |
| P6-R03 GPUDevice.destroy yields real loss | PASS (physical) | step controlled-loss: release detail "destroy() invoked; lost reason destroyed" |
| P6-R04 GPU activation becomes stale | PASS (physical) | runtime-evidence.json admissions.WEBGPU REJECTED at E1; observation_deltas[0].stale_plans [1] |
| P6-R05 E1 selects pre-emitted Wasm variant without codegen | PASS (physical) | verdict.no_compiler_invoked true, bundle_unchanged true (sha256 before/after); activation E1 plan 0 |
| P6-R06 Wasm again roundtrips both payloads | PASS (physical) | step E1-relay: backend CPU_WASM64, exact for A and B |
| P6-R07 ObservationDelta renders observed ASCII | PASS (physical) | evidence/D6/physical/observed/{observation-delta.json,observed.ascii} |
| P6-R08 authored ASCII remains unchanged | PASS (physical) | observed.ascii `source_of_record OBS "authored source unchanged: sha256 80ac0559..."`; cmp in run-physical.sh |
| P6-F01 mutations only in isolated workpiece | PASS | every delta D0-D7: worktree + external state; factory_law::f01 |
| P6-F02 fixture authority <= station authority | PASS | fixture_check on every station open; factory_law::f02; D2/D6 refusals recorded in LEDGER.md |
| P6-F03 required receipts exist | PASS | factory/receipts/D*/; factory_law::f03 |
| P6-F04 verify/probe stations source-nonmutating | PASS | S-BUILD/S-BROWSER receipts carry read_only_station_source_nonmutating PASS; factory_law::f06 |
| P6-F05 moved base blocks integration | PASS | factory_law::f05 (real git scenario in a scratch repository; no force update) |
| P6-F06 canonical re-fetch matches verified workpiece | PASS | reinspect MATCH for every delta (LEDGER.md AFTER blocks) |
| P6-X01 same structure under different SystemId | PASS | commissioning_ladder::p6_x01_... |
| P6-X02 second payload | PASS (physical) | payload B `DE AD BE EF 00 13 37 C0 FF EE` exact at E0 and E1 |
| P6-X03 alternate visual layout | PASS | commissioning_ladder::p6_a01_x03_... |
| P6-X04 display-label rename | PASS | commissioning_ladder::p6_x04_... |
| P6-X05 failures use generic rule IDs | PASS | commissioning_ladder::p6_x05_... |
| P6-X06 no byte_relay/commissioning special-case branches | PASS | tests/commissioning/run-anti-cheat.sh (evidence/D7/anti-cheat/summary.log) |

## COMMISSIONING-PROOF.md obligations

S1-S5: language_ladder + capability-ir.json (4 invariants PASS).  L1-L3: implementation-hypergraph.json (edges 0/1,
no rejected, explicit conversions only).  A1/A2: admission receipts carry probe evidence names
(wasm64_known_answer, webgpu_known_answer); without WebGPU flags the GPU guard fails at REQUEST (request_unavailable)
and no fake GPU evidence exists (negative witness 5).  V1-V5: verification-certificates.json + activation receipts.
C1/C2: bundle.json adapter_inventory exactly [wasm64_relay, webgpu_relay].  R1-R6: physical evidence above.
Negative witnesses 1-12: 1 language_ladder::l09; 2 strategy_ladder::p6_v04...; 3 p6_v03...; 4 p6_v04 (V-LOW);
5 probe-no-webgpu; 6 p6_m04_p6_g06; 7 bundle_ladder::p6_b03; 8 p6_b05; 9 comparator-self-check in probe-record.json
(tampered_detected true); 10 observe_ladder::negative_10...; 11 observe_ladder::negative_11...; 12 P6-X02.

## Honesty boundaries

- WebGPU here is SwiftShader (a CPU Vulkan implementation shipped with Chromium).  It is genuine browser WebGPU API
  admission and execution, including a real device-loss transition; it is NOT hardware GPU execution.  [UNK] hardware
  GPU evidence cannot be obtained on this host.
- Chromium ran headless with an explicit flag set recorded in probe-record.json `launch`.  A different browser,
  version or flag set is a different machine state and needs its own epoch evidence.
- preference_rank is a fixture policy value (PLANNER-COST-MODEL.md section 10); EXACT_OPTIMUM is optimal only under
  that stated model.
- No performance metric was measured; every cost dimension other than preference_rank remains UNKNOWN.
