# FactTest Acquired Reference Register

STATUS: PASS_2_5_REFERENCE_ACQUISITION

Rule:
A reference is counted as acquired only when canonical reference material is physically present in FactTest.git.
Chat uploads alone do not close acquisition.

Already present:
- Secure Contexts
- Media Capture and Streams
- FactTest Rust/WebAssembly Termux reference corpus

This integration adds:
- Generic Sensor API -> references/acquired/generic-sensor-api/
- Accelerometer -> references/acquired/accelerometer/
- Gyroscope -> references/acquired/gyroscope/
- Magnetometer -> references/acquired/magnetometer/

Each SOURCE.md records publication identity, pinned upstream source identity, and the uploaded PDF SHA-256 acquisition witness.

[INV] Missing or immature reference coverage remains [GAP] on the approved target graph. It does not authorize deleting that target system.
