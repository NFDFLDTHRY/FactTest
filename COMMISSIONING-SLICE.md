# Byte Relay Commissioning Slice

STATUS: PASS 6

## Why this slice

Byte Relay exercises every architecture boundary without inventing arbitrary computation semantics absent from Pass 4.

It uses:
- nominal TypeId
- public ports
- DATA relation
- copy transfer mode
- invariants
- test/evidence objects
- source-visible objective

## Semantic contract

A Bytes value presented at ingress.bytes must reach egress.bytes as a semantically independent copy with identical byte content.

## Variant W - Wasm64 representation roundtrip

```text
HOST_BYTES
 -> WASM_LINEAR_BYTES
 -> HOST_BYTES
```

Authority:
https://webassembly.github.io/spec/core/text/types.html#text-addrtype

Project constraint:
wasm32 fallback forbidden.

## Variant G - WebGPU representation roundtrip

```text
HOST_BYTES
 -> GPU_BUFFER_BYTES
 -> HOST_BYTES
```

Dynamic guard includes actual WebGPU admission and known-answer representation readback.

Controlled loss:
https://gpuweb.github.io/gpuweb/#dom-gpudevice-destroy

## Strategy

Both variants are conditionally verified.

Runtime admission decides which guards hold.

The authored Objective applies preference_rank only among active verified variants.

preference_rank is not a performance metric.
