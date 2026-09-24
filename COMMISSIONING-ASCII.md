# Byte Relay Commissioning ASCII

STATUS: PASS 6 AUTHORITATIVE COMMISSIONING SOURCE

Actual source serialization must keep each semantic island on one physical source line, as required by Pass 4.

```text
╔══════════════════════════════════════════════════════════════════╗
║                         BYTE RELAY                             ║
║ @{system byte_relay "Byte Relay"}                             ║
║ @{type Bytes}                                                 ║
║ @{metric preference_rank ordinal "commissioning preference only; not performance"} ║
║ @{objective commissioning}                                    ║
║ @{goal commissioning 1 minimize preference_rank}              ║
║                                                              ║
║  ┌────────────────────┐       ┌────────────────────┐          ║
║  │ Ingress            │       │ Egress             │          ║
║  │ @{component ingress}       │ @{component egress}           ║
║  │ @{port ingress.bytes out: Bytes public}                   ║
║  │                          │ @{port egress.bytes in: Bytes public} ║
║  └─────────┬──────────┘       └──────────▲─────────┘          ║
║            └──────────────────────────────┘                    ║
║ @{data relay ingress.bytes -> egress.bytes mode=copy}         ║
║ @{invariant i_type type_equal(ingress.bytes, egress.bytes)}   ║
║ @{invariant i_prod exactly_one_producer(egress.bytes)}        ║
║ @{invariant i_cons has_consumer(ingress.bytes)}               ║
║ @{invariant i_path reachable(ingress, egress)}                ║
║ @{test t_roundtrip runtime}                                   ║
║ @{tests t_roundtrip -> i_type}                                ║
║ @{evidence e_roundtrip runtime_probe}                         ║
║ @{witnesses e_roundtrip -> t_roundtrip}                       ║
╚══════════════════════════════════════════════════════════════════╝
```

The drawn line is presentation.
The DATA semantic island is the connection.

The source never names WebGPU or Wasm.
