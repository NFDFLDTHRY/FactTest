# Byte Relay Commissioning Proof Obligations

STATUS: PASS 6 - NO RUNTIME PASS CLAIMED

Positive obligations:
- S1 identifiers resolve uniquely
- S2 both ports resolve Bytes
- S3 DATA direction valid
- S4 transfer requires copy
- S5 declared invariants hold
- L1 Wasm representation path explicit/copy-preserving
- L2 GPU representation path explicit/copy-preserving
- L3 no implicit conversion
- A1 Wasm physical guard requires actual admission
- A2 GPU physical guard requires actual admission
- V1 W conditionally preserves source obligations
- V2 G conditionally preserves source obligations
- V3 selector can activate only verified variants
- V4 when both active, authored objective selects G
- V5 when G inactive and W active, selector selects W
- C1 bundle emits both variants
- C2 bundle emits no unverified third variant
- R1 E0 output exact
- R2 GPU destroy/loss evidenced
- R3 stale GPU activation cannot remain active
- R4 E1 Wasm output exact
- R5 source unchanged
- R6 observed ASCII derives from evidence

Controlled loss authority:
https://gpuweb.github.io/gpuweb/#dom-gpudevice-destroy

Negative witnesses:
1. destination type mismatch -> type failure
2. missing conversion -> no legal path
3. move-only representation -> cannot satisfy copy
4. undeclared conversion -> verifier failure
5. GPU initially absent -> W selected, no fake GPU evidence
6. unverified variant activation -> forbidden
7. undeclared adapter -> BundleVerifier failure
8. wasm32 artifact -> project-law failure
9. corrupt one output byte -> runtime failure
10. omit ObservationDelta -> evidence-loop failure
11. runtime source mutation -> source-of-record failure
12. first-payload hardcode -> Payload B fails
