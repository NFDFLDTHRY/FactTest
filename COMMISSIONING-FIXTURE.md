# Byte Relay Commissioning Fixture

STATUS: PASS 6 MODEL + FUTURE PHYSICAL FIXTURE

## Payload A

Input/expected output:

```text
00 01 7F 80 FF 55 AA 10
```

## Payload B - anti-hardcode

Input/expected output:

```text
DE AD BE EF 00 13 37 C0 FF EE
```

## Model metric

```text
preference_rank : ordinal
WEBGPU path = 0
WASM64 path = 1
```

These are fixture policy values, not measurements.

## Synthetic E_model_0

```text
WEBGPU ADMITTED
WASM64 ADMITTED
```

Expected model selector: WEBGPU.

## Synthetic E_model_1

```text
WEBGPU REJECTED (device lost)
WASM64 ADMITTED
```

Expected model selector: WASM64.

Synthetic epochs never count as physical browser evidence.

## Future physical fixture

1. establish actual Wasm64 admission;
2. establish actual WebGPU admission;
3. run both payloads through selected GPU path;
4. exact compare;
5. call GPUDevice.destroy();
6. witness device.lost;
7. establish E1 and stale GPU activation;
8. activate preverified Wasm64 variant;
9. run both payloads;
10. exact compare;
11. emit ObservationDelta and observed ASCII.

If either backend cannot be physically admitted, record [GAP].
