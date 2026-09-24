# FactTest Pass 6 - Complete Vertical Proof Specification

STATUS: PASS 6 PREPARATION EXECUTED  
DATE: 2026-09-23  
BASE: 556240f19cb598cb07d22c6a06ab76a112ee8611

## Purpose

Pass 6 commissions the architecture with one small but structurally complete slice.

Because no compiler/factory implementation exists yet, this pass does not fabricate browser execution.

It:
1. repairs cross-pass seams exposed by the vertical trace;
2. specifies the exact commissioning slice and evidence gate Fable 5.1 must materialize and run.

```text
PASS 6 DESIGN / SPECIFICATION     CLOSED
PASS 6 PHYSICAL COMMISSIONING    [GAP] until materialization
```

## Cross-pass repairs

[RUN] objective syntax is now source-visible.  
[RUN] later typed identity domains are closed.  
[RUN] adaptive bundles use VerifiedStrategy + epoch-bound ActivationReceipt.  
[RUN] CodegenRecipe is defined.  
[RUN] runtime switching no longer assumes hidden runtime codegen.

These [RUN] tags refer to materialized/verified design amendments, not browser execution.

## Commissioning slice

Slice: **Byte Relay**

Source: [COMMISSIONING-ASCII.md](COMMISSIONING-ASCII.md)  
Fixture: [COMMISSIONING-FIXTURE.md](COMMISSIONING-FIXTURE.md)

Semantic requirement:

```text
Ingress.bytes
    |
    | copy
    v
Egress.bytes
```

No WebGPU/Wasm backend appears in authored source.

## Representation alternatives

Wasm64:

```text
HOST_BYTES
 -> WASM_LINEAR_BYTES
 -> HOST_BYTES
```

WebGPU:

```text
HOST_BYTES
 -> GPU_BUFFER_BYTES
 -> HOST_BYTES
```

Every conversion is explicit and must preserve Bytes + copy semantics.

## Verified strategy

Both variants are independently conditionally verified.

```text
VerifiedStrategy BYTE_RELAY

Variant G
  guard: WebGPU representation path admitted

Variant W
  guard: Wasm64 representation path admitted

dispatch:
  authored Objective commissioning
```

Commissioning metric:

```text
preference_rank : ordinal
GPU  = 0
Wasm = 1
```

This is a commissioning preference only, not a performance claim.

## Required future physical runtime sequence

```text
E0
  WebGPU ADMITTED
  Wasm64 ADMITTED
  selector -> GPU

exact byte roundtrip

GPUDevice.destroy()
  -> device lost
  -> evidence
  -> E1

E1
  WebGPU stale/rejected
  Wasm64 ADMITTED
  selector -> Wasm64

same exact byte roundtrip
```

Controlled loss authority:
https://gpuweb.github.io/gpuweb/#dom-gpudevice-destroy

No compiler/codegen invocation is permitted between E0 and E1.

## Evidence honesty

Synthetic/model fixtures prove only deterministic architecture/planner/verifier behavior.

Physical browser execution is a separate evidence class.

If the runtime cannot admit WebGPU or wasm64, physical commissioning remains [GAP].

## Factory proof

Fable implementation must itself follow:

```text
approved ASCII
 -> StructuralDelta
 -> Factory Router
 -> Station + Fixture
 -> isolated Workpiece
 -> receipts
 -> independent Factory verification
 -> Integration Gate
 -> canonical repo
 -> re-inspection
```

No direct AGENT -> REPO shortcut is acceptable.

## Anti-cheating

Forbidden:
- byte_relay special-case compiler branch;
- fixture-name special case;
- hard-coded expected output as runtime result;
- hard-coded PASS receipts;
- parser that only recognizes commissioning input;
- verifier whitelist of commissioning IDs;
- codegen bypass of implementation/conversion contracts;
- runtime activation of unverified variants.

Only slice data/contracts/fixture may be slice-specific.

## Closure

[RUN] commissioning source defined  
[RUN] deterministic model fixture defined  
[RUN] expected artifact trace defined  
[RUN] positive/negative obligations defined  
[RUN] runtime E0->E1 contract defined  
[RUN] Factory materialization route defined  
[RUN] final Fable handoff requirements defined

[GAP] parser/compiler implementation  
[GAP] Factory station implementation  
[GAP] physical Wasm64 evidence  
[GAP] physical WebGPU evidence  
[GAP] actual GPU loss/reselection evidence  
[GAP] actual observed-ASCII runtime artifact

The six-pass PREPARATION sequence is complete.

Physical commissioning is the first implementation acceptance gate.
