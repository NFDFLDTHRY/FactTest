# Byte Relay Commissioning Runtime

STATUS: PASS 6 PHYSICAL EXECUTION CONTRACT

## E0

Required real evidence:

```text
Wasm64 admission   ADMITTED
WebGPU admission   ADMITTED
selected variant   G
```

Both payloads roundtrip exactly.

## Controlled loss

Invoke:
https://gpuweb.github.io/gpuweb/#dom-gpudevice-destroy

Required:
- device becomes lost
- loss evidence captured
- GPU ActivationReceipt becomes stale/invalid

## E1

```text
GPU activation     REJECTED/STALE
Wasm64 activation  PASS
selected variant   W
```

No compiler/codegen invocation may occur between E0 and E1.

Both payloads roundtrip exactly again.

If no variant is active, result is NO_ACTIVE_PLAN.

## Observed ASCII target

Equivalent human/AI-visible content:

```text
+------------------------------------------------------+
| BYTE RELAY / OBSERVED                               |
| @{status gpu_path RUN "roundtrip passed at E0"}     |
| @{status gpu_path ERR "device lost after destroy"}  |
| @{status wasm_path RUN "roundtrip passed at E1"}    |
| @{issue transition OBS "G -> W; source unchanged"}  |
+------------------------------------------------------+
```

Actual PASS strings/IDs must derive from real evidence.
