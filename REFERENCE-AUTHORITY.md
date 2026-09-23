# FactTest Current Reference Authority Map

STATUS: PASS 1 LIVE AUTHORITY MAP
OBSERVED: 2026-09-23

This file is intentionally hyperlink-first.

The current authoritative document is preferred for current design semantics.
A reproducibility fixture may separately pin a commit/release.
Those are different axes.

## Citation rule

A technical constraint must link directly to the clause that establishes it whenever the authority exposes a stable fragment.

Do not cite:

- a search result
- a standards history page
- a repository homepage instead of the actual spec
- a stale PDF when a newer living/editor document governs the claim
- a document title alone when a direct clause link exists

## Rust / toolchain

### `#![no_std]`

Claim: the `no_std` attribute removes `std` from the standard prelude and changes the standard-library linkage/prelude relationship.

Direct clause:
https://doc.rust-lang.org/reference/names/preludes.html#the-no_std-attribute

### Cargo `build-std`

Claim: Cargo can build standard-library crates from source with `-Z build-std`; current machinery is unstable and requires the standard-library source.

Direct clause:
https://doc.rust-lang.org/nightly/cargo/reference/unstable.html#build-std

### Rust wasm64 target

Claim: Rust's `wasm64-unknown-unknown` target is the Rust implementation target relevant to FactTest's 64-bit Wasm direction.

Direct target document:
https://doc.rust-lang.org/rustc/platform-support/wasm64-unknown-unknown.html

Important: Rust target documentation governs Rust target behavior. It does not override newer WebAssembly standard status.

## WebAssembly

### Current core specification

Current authority:
https://webassembly.github.io/spec/core/

### 64-bit address types

Claim: current WebAssembly admits both `i32` and `i64` address types.

Direct clause:
https://webassembly.github.io/spec/core/text/types.html#text-addrtype

### Memory types carry an address type

Direct clause:
https://webassembly.github.io/spec/core/text/types.html#text-memtype

### JavaScript `WebAssembly.Memory`

Claim: the current JavaScript embedding exposes an address type in `MemoryDescriptor`.

Direct clause:
https://webassembly.github.io/spec/js-api/#memories

### Streaming Wasm delivery

Claim: streaming compilation/instantiation has response/CORS/status/MIME requirements, including `application/wasm`.

Direct algorithm:
https://webassembly.github.io/spec/web-api/#streaming-module-compilation-and-instantiation

## JavaScript / browser foundations

### ECMAScript

Current living authority:
https://tc39.es/ecma262/

The specification itself states that this living URL is the most accurate and up-to-date ECMAScript specification. Yearly PDFs are snapshots, not the live authority.

### Web IDL

Current living authority:
https://webidl.spec.whatwg.org/

### HTML workers

Claim: workers provide background script execution.

Direct section:
https://html.spec.whatwg.org/multipage/workers.html#workers

Claim: `hardwareConcurrency` reports logical processors potentially available to the user agent; it is not ownership of physical execution cycles.

Direct clause:
https://html.spec.whatwg.org/multipage/workers.html#navigator.hardwareconcurrency

### Fetch

Current living authority:
https://fetch.spec.whatwg.org/

### Streams

Current living authority:
https://streams.spec.whatwg.org/

### DOM

Current living authority:
https://dom.spec.whatwg.org/

### Infra

Current living authority:
https://infra.spec.whatwg.org/

## Accelerated compute

### WebGPU adapter admission

Claim: adapter selection is a runtime request and may produce no adapter; returned adapters expose capabilities/limits and can expire.

Direct clause:
https://gpuweb.github.io/gpuweb/#dom-gpu-requestadapter

### WebGPU device loss

Claim: GPU devices can be lost and applications need recovery logic.

Direct clause:
https://gpuweb.github.io/gpuweb/#dom-gpudevice-lost

### WGSL

Claim: WGSL is the shader language used by WebGPU.

Direct introduction:
https://gpuweb.github.io/gpuweb/wgsl/#intro

### WebNN

Claim: WebNN is the browser neural-network inference acceleration surface that FactTest may represent as a backend family.

Direct API section:
https://webmachinelearning.github.io/webnn/#api

## Codecs / media

### WebCodecs support probing

Claim: codec configurations are not assumed; support is queried.

Direct clause:
https://w3c.github.io/webcodecs/#dom-videodecoder-isconfigsupported

### WebCodecs hardware acceleration

Claim: hardware/software acceleration preferences are hints; the user agent may ignore them.

Direct clause:
https://w3c.github.io/webcodecs/#hardware-acceleration

### Camera / microphone

Claim: local media acquisition is requested through `MediaDevices.getUserMedia()`.

Direct clause:
https://w3c.github.io/mediacapture-main/#dom-mediadevices-getusermedia

## Security / permissions

### Secure Contexts

Claim: powerful capabilities can depend on whether the origin/environment is potentially trustworthy.

Direct algorithm:
https://w3c.github.io/webappsec-secure-contexts/#is-origin-trustworthy

### Permissions

Claim: permission state is explicit state rather than equivalent to API presence.

Direct definition:
https://w3c.github.io/permissions/#permission-state

### Permissions Policy

Claim: a policy-controlled feature can be disabled independently of API implementation.

Direct definition:
https://w3c.github.io/webappsec-permissions-policy/#policy-controlled-feature

## Storage / persistence / lifecycle

### Storage persistence

Claim: persistence is requested and can fail; it is not assumed.

Direct clause:
https://storage.spec.whatwg.org/#dom-storagemanager-persist

### Storage estimate

Claim: quota/usage information is runtime state.

Direct clause:
https://storage.spec.whatwg.org/#dom-storagemanager-estimate

### Origin private file system

Claim: the origin-private file-system root is obtained through `StorageManager.getDirectory()`.

Direct clause:
https://fs.spec.whatwg.org/#dom-storagemanager-getdirectory

### Service Worker fetch interception

Direct event definition:
https://w3c.github.io/ServiceWorker/#fetch-event

### Service Worker cache objects

Direct section:
https://w3c.github.io/ServiceWorker/#cache-objects

### Web Application Manifest

Current document:
https://w3c.github.io/manifest/

Manifest metadata is part of generated-WebApp packaging; installation itself remains a runtime/browser observation rather than something FactTest may infer merely from the presence of a manifest.

### IndexedDB

Current editor document:
https://w3c.github.io/IndexedDB/

Database model:
https://w3c.github.io/IndexedDB/#database-concept

## Sensors / physical world

### Generic Sensor API

Current editor document:
https://w3c.github.io/sensors/

FactTest keeps concrete sensor APIs as alternative implementation edges over semantic sensor requirements; current runtime support and permissions determine admission, not whether the target node exists.

### Accelerometer

Current editor document:
https://w3c.github.io/accelerometer/

### Gyroscope

Current editor document:
https://w3c.github.io/gyroscope/

### Magnetometer

Current editor document:
https://w3c.github.io/magnetometer/

### Orientation Sensor

Current editor document:
https://w3c.github.io/orientation-sensor/

### Device Orientation and Motion

Current editor document:
https://w3c.github.io/deviceorientation/

### Proximity Sensor

Current editor document:
https://w3c.github.io/proximity/

### Ambient Light Sensor

Current editor document:
https://w3c.github.io/ambient-light/

### Geolocation

Current editor document:
https://w3c.github.io/geolocation/

Direct API:
https://w3c.github.io/geolocation/#dom-geolocation-getcurrentposition

## XR

### WebXR Device API

Current editor document:
https://immersive-web.github.io/webxr/

Runtime entry point:
https://immersive-web.github.io/webxr/#navigator-xr

## Peripherals

### WebHID

Device-selection boundary:
https://wicg.github.io/webhid/#dom-hid-requestdevice

### WebUSB

Device-selection boundary:
https://wicg.github.io/webusb/#dom-usb-requestdevice

### Web Serial

Port-selection boundary:
https://serial.spec.whatwg.org/#dom-serial-requestport

### Web Bluetooth

Device-selection boundary:
https://webbluetoothcg.github.io/web-bluetooth/#dom-bluetooth-requestdevice

## Git

### Commit object semantics

Direct glossary definition:
https://git-scm.com/docs/gitglossary#def_commit

### Revision syntax

Current manual:
https://git-scm.com/docs/gitrevisions

### Repository layout

Current manual:
https://git-scm.com/docs/gitrepository-layout

## Known live-authority conflict

Rust's wasm64 target page has historically described Memory64 as not standardized.

Current WebAssembly 3.0 directly defines `i64` address types:
https://webassembly.github.io/spec/core/text/types.html#text-addrtype

Therefore:

- use rustc documentation/source for Rust target behavior
- use current WebAssembly Core for current WebAssembly semantics/status
- preserve any disagreement explicitly as `[ERR]`
- never copy an obsolete standards-status sentence into FactTest architecture law

## Reproducibility pins

When later passes require reproducible builds, add explicit pins separately:

```text
CURRENT AUTHORITY       tells us what the system means now
PINNED IMPLEMENTATION   tells us exactly what was built/tested
RUNTIME EVIDENCE        tells us what actually happened
```

No one of those substitutes for the others.
