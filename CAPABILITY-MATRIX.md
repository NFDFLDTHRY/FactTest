# FactTest Capability Matrix

STATUS: PASS 2  
OBSERVED: 2026-09-23

Legend:

- G = approved target universe
- C = currently materialized implementation
- M = runtime-exposed capability state
- A = admitted implementation edge
- E = required execution evidence

Every row below is in G. Pass 2 does not claim it is in C or A.

| Capability family | Current authority | Admission contract | Lifecycle/failure | Evidence required |
|---|---|---|---|---|
| CPU / Wasm64 | Rust wasm64 target + WebAssembly Core address/memory types | artifact validates as wasm64; host can compile/instantiate; known operation executes | compile/link/instantiate/trap/resource failure | artifact identity + validation + known-answer execution |
| Dedicated workers | HTML Workers | Worker constructible; messaging/transfer contract works | creation error, terminate, owner/page lifecycle | known job in worker + message round trip |
| Shared/threaded Wasm | Threads proposal + current JS embedding conflict | proposal/runtime support proven; isolation/shared-memory conditions met; atomic known-answer test passes | worker loss, deadlock/timeouts, unsupported proposal surface | concurrency test + memory/atomic witness + conflict receipt |
| WebGPU | current WebGPU + WGSL | navigator.gpu; requestAdapter; required features/limits; requestDevice; known WGSL dispatch/readback | null adapter, expired adapter, device lost, validation/OOM | feature/limit receipt + shader compile + known-answer readback + loss test |
| WebNN | current WebNN | navigator.ml; policy allowed; createContext; required graph operations; known graph executes | SecurityError, NotSupportedError, context/device loss | context receipt + supported graph + known-answer tensor |
| WebCodecs | current WebCodecs | isConfigSupported; configure; known encode/decode | unsupported config, saturation, resource reclamation, close/error | config support receipt + known media round trip |
| Camera | Media Capture and Streams | secure context; policy/permission; getUserMedia(video); usable track/frame | denial, NotFound/NotReadable, track end/revoke | successful stream/track + frame evidence + end handling |
| Microphone | Media Capture and Streams | secure context; policy/permission; getUserMedia(audio); usable track/data | denial, resource loss, track end/revoke | successful audio track + sample evidence |
| Generic Sensor | Generic Sensor API | interface; policy/permission; Sensor.start; reading | SecurityError/NotAllowed/NotReadable, stop, revoke | timestamped reading + error/lifecycle evidence |
| Accelerometer | Accelerometer + Generic Sensor | generic-sensor gates + valid acceleration reading | sensor unavailable/permission/lifecycle | x/y/z known motion or virtual-sensor test |
| Gyroscope | Gyroscope + Generic Sensor | generic-sensor gates; retain as implementation edge | limited cross-engine deployment; unavailable sensor | angular-rate reading/probe |
| Magnetometer | Magnetometer + Generic Sensor | permission/policy including magnetometer semantics | unavailable/denied | magnetic-field reading/probe |
| Orientation Sensor | Orientation Sensor + Generic Sensor | underlying/fused sensors admitted; permission composition satisfied | source sensor denial/loss | quaternion/orientation known-answer |
| Device Orientation / Motion | current Device Orientation and Motion | secure context; policy; requestPermission where required; events observed | denial, unsupported events, permission changes | event evidence + permission receipt |
| Proximity | Proximity Sensor + Generic Sensor | generic-sensor gates + proximity reading | unavailable/denied | known/virtual proximity reading |
| Ambient light | Ambient Light Sensor | generic-sensor gates + quantized illuminance reading | unavailable/denied | reading evidence respecting spec precision model |
| Geolocation | current Geolocation | policy/permission + getCurrentPosition/watchPosition success | denial, timeout, position unavailable | position callback/error evidence |
| XR | current WebXR | navigator.xr; isSessionSupported; policy/permission; requestSession; required features | unsupported mode, denied permission, session end/device change | session receipt + frame/reference-space evidence |
| Fetch / network | Fetch + Streams | request/response semantics admitted; required CORS/status/content handling | network errors, abort, response/body errors | fixture requests and streamed bytes |
| Storage quota/persistence | Storage Standard | estimate; optional persist; quota sufficient for plan | quota pressure, persistence denied | quota/persist receipt + failure fixture |
| OPFS | File System Standard | getDirectory; handle acquisition; read/write/reopen | permission/state error, handle invalidation, quota | byte-exact write/reload/read evidence |
| IndexedDB | IndexedDB 3.0 | open DB; schema/transaction complete; read/write semantics verified | abort, versionchange, quota/transaction errors | transactional known-answer test |
| CacheStorage | Service Worker | caches exposed; versioned cache contract; match/put/delete work | stale cache, quota, update mismatch | offline asset retrieval + update/failure evidence |
| Service Worker | Service Workers Nightly | registration/install/activate/control/fetch | install failure, activate/update replacement, no controller | control + fetch interception + failed-update retention |
| Manifest/PWA shell | Web App Manifest + browser evidence | structural manifest valid; launch/scope metadata; runtime installation/launch observed | install unavailable, update/launch mismatch | installed/standalone launch evidence where supported |
| Secure-context state | Secure Contexts + HTML | environment reports/qualifies as secure/trustworthy | insecure ancestry/origin | trust/secure-context receipt |
| Permissions | Permissions + feature-specific specs | query where applicable; feature-specific request/chooser succeeds | prompt/denied/revoked/lifetime expiry | state changes and feature outcome |
| Permissions Policy | Permissions Policy + feature spec | document allowed to use feature | feature blocked despite API existence | blocked/allowed fixture |
| HID | WebHID | policy; requestDevice; open; supported report path | no selection, NetworkError, disconnect, forget | input/output/feature report fixture where hardware/virtual test exists |
| USB | WebUSB | policy/user-selection; device open/config/select interface; transfer path | disconnect, permission loss, transfer errors | known control/bulk transfer fixture |
| Serial | Web Serial | policy + transient activation for chooser; port open; streams | no selection, disconnect, stream errors, close | loopback/known serial transaction |
| Bluetooth | Web Bluetooth | policy/user-selection; GATT connect; required service/characteristic | disconnect, unavailable service, permission loss | known GATT read/write/notification fixture |
| Future explicit capability | exact future authority required | must define the same admission/lifecycle/evidence shape | explicit | explicit |

## Universal target-preservation rule

A row may be absent from C or A without being removed from G.

\`\`\`text
missing implementation -> [GAP]
runtime unavailable     -> not admitted in A(t)
conflicting authority   -> [ERR]
unknown support         -> [UNK]
\`\`\`

Only an explicit ASCII design decision removes the node from G.
