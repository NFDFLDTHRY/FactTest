# FactTest Acquired Reference Register

STATUS: PASS_2_5_REFERENCE_ACQUISITION

Rule:
A reference is counted as acquired only when canonical reference material is physically present in FactTest.git.
Chat uploads alone do not close acquisition.

Existing foundation:
- FactTest Rust/WebAssembly Termux reference corpus
- Secure Contexts -> references/acquired/secure-contexts/
- Media Capture and Streams -> references/acquired/media-capture-and-streams/

Sensor / physical-observation references now acquired:
- Generic Sensor API -> references/acquired/generic-sensor-api/
  - upstream commit: a4614786ffe2afb8a4b18c9be47c277e0610437d
  - uploaded PDF SHA-256: e909ad2bfa3e945646dba183ee2af0ecdb55bf4b5d643518fcc78740bb9a6986
- Accelerometer -> references/acquired/accelerometer/
  - upstream commit: 9f0a66ddab67fbb3fffcf3118fd6a8e1d30e558e
  - uploaded PDF SHA-256: 6a0097ed1a0d30c573594536dcf9f5c250a7352770abc7478c3292cbc659c363
- Gyroscope -> references/acquired/gyroscope/
  - upstream commit: 335dc6ecc5f85289a2745810a086e7f1c7237cdb
  - uploaded PDF SHA-256: 4ceaaf13067b826117204426353594baa720e6b100b9f6b4e5985da49c278aa3
- Magnetometer -> references/acquired/magnetometer/
  - upstream commit: 40801a25e7ad6c0ea12b1777f1d913f21e680e87
  - uploaded PDF SHA-256: e25d43925574560ae4aaeaeda5da6a648b5cc83f238f28b395ca777c629aecb6
- Orientation Sensor -> references/acquired/orientation-sensor/
  - upstream commit: 89ae0464f9ff2f95ceeffef2b34e71db7d33e824
  - uploaded PDF SHA-256: ab0de99883bb12fc99c15fd9e77c7abdcf2ffcd3af09bd1e7330734b0b96ef04
- Proximity Sensor -> references/acquired/proximity-sensor/
  - upstream commit: 1d43739eea15981bb6cab10224929c53ae6f51ed
  - uploaded PDF SHA-256: 39a4b6ad6bd59f2b19ed6e6d35c39bc95f0c05e3a52ef0fbd1e883ce27a0e89c
- Geolocation -> references/acquired/geolocation/
  - upstream commit: c21a46deb5015f7fd5b342f1aa9e1a4b37f5bf30
  - uploaded PDF SHA-256: d30db9fc9eb5682d157db5b4f8a0e9a33059dface8c9c0b49998501547b62a0c
- Device Orientation and Motion -> references/acquired/device-orientation-and-motion/
  - upstream commit: 70d42d5484db7fd1646e48cc17caa5ff1c9d92cb
  - uploaded PDF SHA-256: d09918117dd0acb79511f994d9862563dccf418456960c1a5a9af96b822b7ce0

Each reference directory contains:
- the pinned upstream specification source
- SOURCE.md with publication identity, provenance, role, and uploaded-PDF witness identity

[INV] Reference coverage is not project scope.
Missing, immature, conflicting, or unsupported references remain [GAP]/[ERR]/[UNK] on the approved target graph; they never silently delete target systems.
