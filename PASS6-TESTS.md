# FactTest Pass 6 Tests

STATUS: COMMISSIONING GATE

Cross-pass:
- P6-G01 Objective parses/canonical-renders
- P6-G02 MetricId != ObjectiveId
- P6-G03 CodegenRecipe required
- P6-G04 CandidateStrategy cannot enter codegen
- P6-G05 only verifier constructs VerifiedStrategy
- P6-G06 selector activates only VerifiedStrategy variants

ASCII:
- P6-A01 compact/large layouts with same islands are semantically equivalent
- P6-A02 drawn arrow without DATA island creates no relation
- P6-A03 metric/objective/goal appear in canonical rendering

Model:
- P6-M01 E_model_0 selects G
- P6-M02 E_model_1 selects W
- P6-M03 unknown metric is not zero
- P6-M04 unverified variant excluded

Verifier:
- P6-V01 type mismatch fails
- P6-V02 missing conversion fails
- P6-V03 move-only cannot satisfy copy
- P6-V04 undeclared conversion fails
- P6-V05 invalid candidate cannot be rescued by preference_rank

Bundle:
- P6-B01 both verified variants emitted
- P6-B02 selector emitted
- P6-B03 undeclared third adapter fails
- P6-B04 missing strategy variant fails
- P6-B05 wasm32 fails
- P6-B06 lineage matches source/strategy/certificates

Physical:
- P6-R01 actual Wasm64 roundtrips both payloads
- P6-R02 actual WebGPU roundtrips both payloads
- P6-R03 GPUDevice.destroy yields real loss
- P6-R04 GPU activation becomes stale
- P6-R05 E1 selects pre-emitted Wasm variant without codegen
- P6-R06 Wasm again roundtrips both payloads
- P6-R07 ObservationDelta renders observed ASCII
- P6-R08 authored ASCII remains unchanged

Factory:
- P6-F01 implementation mutations only in isolated workpiece
- P6-F02 fixture authority <= station authority
- P6-F03 required receipts exist
- P6-F04 verify/probe stations source-nonmutating
- P6-F05 moved base blocks integration
- P6-F06 canonical re-fetch matches verified workpiece

Anti-cheating:
- P6-X01 same structure under different SystemId
- P6-X02 second payload DE AD BE EF 00 13 37 C0 FF EE
- P6-X03 alternate visual layout
- P6-X04 display-label rename
- P6-X05 failures use generic rule IDs, not commissioning-name checks
- P6-X06 no byte_relay/commissioning special-case branches

Physical closure requires actual evidence for P6-R01..R08 and P6-F01..F06.
Synthetic/model evidence cannot satisfy them.
