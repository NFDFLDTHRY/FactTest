# FactTest Current Reference Authority Map

STATUS: PASS 2 LIVE AUTHORITY MAP  
OBSERVED: 2026-09-23

This file is hyperlink-first.

The current authoritative document governs current design semantics.
A reproducibility fixture may separately pin a release/commit/toolchain.
Runtime evidence separately records what actually worked.

## Citation law

For every technical constraint:

\`\`\`text
claim
  -> current authoritative document
  -> exact section / definition / algorithm fragment where available
  -> authority maturity/status
  -> observed date
  -> optional reproducibility pin
  -> test/evidence obligation
\`\`\`

Do not cite a search result, history page, repository homepage instead of the actual spec, stale PDF instead of a newer living/editor document, or only a document title when a stable deep clause exists.

## Rust / Cargo

no_std:
https://doc.rust-lang.org/reference/names/preludes.html#the-no_std-attribute

Cargo build-std:
https://doc.rust-lang.org/nightly/cargo/reference/unstable.html#build-std

Rust wasm64 target:
https://doc.rust-lang.org/rustc/platform-support/wasm64-unknown-unknown.html

Authority split:
Rust docs/source govern Rust target/toolchain behavior.
They do not override newer WebAssembly standard semantics/status.

## WebAssembly current baseline

Core Release 3.0, 21 September 2026:
https://webassembly.github.io/spec/core/

Address types:
https://webassembly.github.io/spec/core/text/types.html#text-addrtype

Memory types:
https://webassembly.github.io/spec/core/text/types.html#text-memtype

64-bit address-space change:
https://webassembly.github.io/spec/core/appendix/changes.html

JS Interface, Editor's Draft 21 September 2026:
https://webassembly.github.io/spec/js-api/

Internal storage / agent-local current model:
https://webassembly.github.io/spec/js-api/#internal-storage
D13 ANNOTATION (fragment #internal-storage): the citation above is preserved exactly as historically written.  It is NOT asserted to be a currently valid fragment: the pinned source WebAssembly/spec@608711107b has no id "internal-storage" (it has #webassembly-storage and #store) - FRAGMENT_DRIFT [ERR]; whether the published rendering still carries an alias is [UNK] (host denied).  Semantic resolution is deferred to the D14 technical reference rescan (design/environment-map/AUTHORITY-REGISTER.md AUTH-WASM-JSAPI-STORAGE; docs/HANDOFF.md section 6).
D14 ANNOTATION (fragment #internal-storage): confirmed at the published rendering taken from WebAssembly/spec gh-pages@dcb71aa493d7 (fixtures/reference/published/webassembly.github.io/spec/js-api/index.html, evidence/D14/audit/fragments.json): no element carries id "internal-storage"; the section is <h2 id="webassembly-storage"> (also #store).  Historical citation preserved; NOT asserted current [ERR]; the rendering was not observed at the published host (egress denied).

Memories:
https://webassembly.github.io/spec/js-api/#memories

Web API:
https://webassembly.github.io/spec/web-api/

Streaming compilation/instantiation:
https://webassembly.github.io/spec/web-api/#streaming-module-compilation-and-instantiation
D14 ANNOTATION (fragment #streaming-module-compilation-and-instantiation): reopened at the published rendering taken from the publisher's gh-pages branch @dcb71aa493d7 (fixtures/reference/published/webassembly.github.io/spec/web-api/index.html, evidence/D14/audit/link-audit.json): no element carries id "streaming-module-compilation-and-instantiation"; nearest ids in that rendering: #streaming-modules, #ref-for-module, #ref-for-module①, #ref-for-module②.  The citation above is preserved exactly as written and is NOT asserted current [ERR] until an owner-approved law delta replaces the fragment; the rendering was not observed at the published host (egress denied).

## WebAssembly threading proposals

Threads actual spec:
https://webassembly.github.io/threads/core/

Threads memory types:
https://webassembly.github.io/threads/core/syntax/types.html#memory-types

Threads JS Interface:
https://webassembly.github.io/threads/js-api/

Threads Web API:
https://webassembly.github.io/threads/web-api/

Shared-Everything Threads actual proposal document:
https://raw.githubusercontent.com/WebAssembly/shared-everything-threads/main/proposals/shared-everything-threads/Overview.md

These are proposal/future-authority surfaces and must not be mislabeled as unconditional current Core 3.0 browser semantics.

## ECMAScript / web foundations

Current ECMAScript living draft:
https://tc39.es/ecma262/

Web IDL Living Standard:
https://webidl.spec.whatwg.org/

HTML Living Standard:
https://html.spec.whatwg.org/multipage/

Workers:
https://html.spec.whatwg.org/multipage/workers.html#workers

hardwareConcurrency:
https://html.spec.whatwg.org/multipage/workers.html#navigator.hardwareconcurrency

DOM Living Standard:
https://dom.spec.whatwg.org/

Infra Living Standard:
https://infra.spec.whatwg.org/

Fetch Living Standard:
https://fetch.spec.whatwg.org/

Streams Living Standard:
https://streams.spec.whatwg.org/

## WebGPU / WGSL

WebGPU current editor document:
https://gpuweb.github.io/gpuweb/

requestAdapter:
https://gpuweb.github.io/gpuweb/#dom-gpu-requestadapter

requestDevice:
https://gpuweb.github.io/gpuweb/#dom-gpuadapter-requestdevice

device lost:
https://gpuweb.github.io/gpuweb/#dom-gpudevice-lost

WGSL current document:
https://gpuweb.github.io/gpuweb/wgsl/

WGSL introduction:
https://gpuweb.github.io/gpuweb/wgsl/#intro

## WebNN

Current document:
https://webmachinelearning.github.io/webnn/

API:
https://webmachinelearning.github.io/webnn/#api

FactTest must treat context creation and graph execution as runtime admission, not assume WebNN from interface name alone.

## WebCodecs

Current editor document:
https://w3c.github.io/webcodecs/

Current 21 September 2026 WD:
https://www.w3.org/TR/2026/WD-webcodecs-20260921/

VideoDecoder isConfigSupported:
https://w3c.github.io/webcodecs/#dom-videodecoder-isconfigsupported

Hardware acceleration:
https://w3c.github.io/webcodecs/#hardware-acceleration

Resource reclamation:
https://w3c.github.io/webcodecs/#resource-reclamation

## Media Capture

Current document:
https://w3c.github.io/mediacapture-main/

getUserMedia:
https://w3c.github.io/mediacapture-main/#dom-mediadevices-getusermedia

enumerateDevices:
https://w3c.github.io/mediacapture-main/#dom-mediadevices-enumeratedevices

## Secure contexts / permissions / policy

Secure Contexts actual editor document:
https://w3c.github.io/webappsec-secure-contexts/

Potentially trustworthy origin algorithm:
https://w3c.github.io/webappsec-secure-contexts/#is-origin-trustworthy

Permissions actual editor document:
https://w3c.github.io/permissions/

Permissions model:
https://w3c.github.io/permissions/#permissions

Reading permission state:
https://w3c.github.io/permissions/#reading-current-states

Revocation:
https://w3c.github.io/permissions/#reacting-to-revocation

Permissions Policy actual editor document:
https://w3c.github.io/webappsec-permissions-policy/

Policy-controlled feature:
https://w3c.github.io/webappsec-permissions-policy/#policy-controlled-feature

## Storage / files / structured data

Storage Living Standard:
https://storage.spec.whatwg.org/

persist:
https://storage.spec.whatwg.org/#dom-storagemanager-persist

estimate:
https://storage.spec.whatwg.org/#dom-storagemanager-estimate

File System Living Standard:
https://fs.spec.whatwg.org/

OPFS root:
https://fs.spec.whatwg.org/#dom-storagemanager-getdirectory

IndexedDB current editor document:
https://w3c.github.io/IndexedDB/

Database concept:
https://w3c.github.io/IndexedDB/#database-concept
D14 ANNOTATION (fragment #database-concept): reopened at the published rendering taken from the publisher's gh-pages branch @da7991bc1c84 (fixtures/reference/published/w3c.github.io/IndexedDB/index.html, evidence/D14/audit/link-audit.json): no element carries id "database-concept"; nearest ids in that rendering: #database, #idbdatabase, #database-name, #index-concept.  The citation above is preserved exactly as written and is NOT asserted current [ERR] until an owner-approved law delta replaces the fragment; the rendering was not observed at the published host (egress denied).

## Service Worker / PWA

Service Workers Nightly, Editor's Draft 17 September 2026:
https://w3c.github.io/ServiceWorker/

fetch event:
https://w3c.github.io/ServiceWorker/#fetch-event
D14 ANNOTATION (fragment #fetch-event): reopened at the published rendering taken from the publisher's gh-pages branch @65c0b6f013f5 (fixtures/reference/published/w3c.github.io/ServiceWorker/index.html, evidence/D14/audit/link-audit.json): no element carries id "fetch-event"; nearest ids in that rendering: #fetchevent, #ref-for-fetchevent, #ref-for-fetchevent①, #ref-for-fetchevent②.  The citation above is preserved exactly as written and is NOT asserted current [ERR] until an owner-approved law delta replaces the fragment; the rendering was not observed at the published host (egress denied).

cache objects:
https://w3c.github.io/ServiceWorker/#cache-objects

Web Application Manifest:
https://w3c.github.io/manifest/

Manifest definition:
https://w3c.github.io/manifest/#web-application-manifest

## Generic Sensor family

Generic Sensor:
https://w3c.github.io/sensors/

Sensor start:
https://w3c.github.io/sensors/#dom-sensor-start

Permission integration:
https://w3c.github.io/sensors/#extending-the-permission-api
D14 ANNOTATION (fragment #extending-the-permission-api): reopened at the published rendering taken from the publisher's gh-pages branch @f18fbc5b3445 (fixtures/reference/published/w3c.github.io/sensors/index.html, evidence/D14/audit/link-audit.json): no element carries id "extending-the-permission-api"; nearest ids in that rendering: #permissions, #permissioning, #permission-api, #permissions-policy.  The citation above is preserved exactly as written and is NOT asserted current [ERR] until an owner-approved law delta replaces the fragment; the rendering was not observed at the published host (egress denied).

Permissions Policy integration:
https://w3c.github.io/sensors/#extending-the-permissions-policy-api
D14 ANNOTATION (fragment #extending-the-permissions-policy-api): reopened at the published rendering taken from the publisher's gh-pages branch @f18fbc5b3445 (fixtures/reference/published/w3c.github.io/sensors/index.html, evidence/D14/audit/link-audit.json): no element carries id "extending-the-permissions-policy-api"; nearest ids in that rendering: #permissions-policy, #permissions-policy-api, #biblio-permissions-policy, #permissions.  The citation above is preserved exactly as written and is NOT asserted current [ERR] until an owner-approved law delta replaces the fragment; the rendering was not observed at the published host (egress denied).

Accelerometer:
https://w3c.github.io/accelerometer/

Gyroscope:
https://w3c.github.io/gyroscope/

Magnetometer:
https://w3c.github.io/magnetometer/

Orientation Sensor:
https://w3c.github.io/orientation-sensor/

Device Orientation and Motion:
https://w3c.github.io/deviceorientation/

Permissions:
https://w3c.github.io/deviceorientation/#permissions
D14 ANNOTATION (fragment #permissions): reopened at the published rendering taken from the publisher's gh-pages branch @4b6c4a3d39c1 (fixtures/reference/published/w3c.github.io/deviceorientation/index.html, evidence/D14/audit/link-audit.json): no element carries id "permissions"; nearest ids in that rendering: #biblio-permissions, #permissions-integration, #ref-for-dom-permissionstate, #biblio-permissions-policy-1.  The citation above is preserved exactly as written and is NOT asserted current [ERR] until an owner-approved law delta replaces the fragment; the rendering was not observed at the published host (egress denied).

Proximity:
https://w3c.github.io/proximity/

Ambient Light:
https://w3c.github.io/ambient-light/

AmbientLightSensor interface:
https://w3c.github.io/ambient-light/#ambientlightsensor-interface
D14 ANNOTATION (fragment #ambientlightsensor-interface): reopened at the published rendering taken from the publisher's gh-pages branch @ae93d6df4d85 (fixtures/reference/published/w3c.github.io/ambient-light/index.html, evidence/D14/audit/link-audit.json): no element carries id "ambientlightsensor-interface"; nearest ids in that rendering: #ambientlightsensor, #ref-for-ambientlightsensor, #ref-for-ambientlightsensor①, #ref-for-ambientlightsensor②.  The citation above is preserved exactly as written and is NOT asserted current [ERR] until an owner-approved law delta replaces the fragment; the rendering was not observed at the published host (egress denied).

## Geolocation

Current editor document:
https://w3c.github.io/geolocation/

getCurrentPosition:
https://w3c.github.io/geolocation/#dom-geolocation-getcurrentposition

watchPosition:
https://w3c.github.io/geolocation/#dom-geolocation-watchposition

## WebXR

Current WebXR Device API:
https://immersive-web.github.io/webxr/

navigator.xr:
https://immersive-web.github.io/webxr/#navigator-xr
D14 ANNOTATION (fragment #navigator-xr): reopened at the published rendering taken from the publisher's gh-pages branch @4f2898158f9f (fixtures/reference/published/immersive-web.github.io/webxr/index.html, evidence/D14/audit/link-audit.json): no element carries id "navigator-xr"; nearest ids in that rendering: #dom-navigator-xr, #ref-for-navigator, #ref-for-navigator①, #ref-for-dom-navigator.  The citation above is preserved exactly as written and is NOT asserted current [ERR] until an owner-approved law delta replaces the fragment; the rendering was not observed at the published host (egress denied).

isSessionSupported:
https://immersive-web.github.io/webxr/#dom-xrsystem-issessionsupported

requestSession:
https://immersive-web.github.io/webxr/#dom-xrsystem-requestsession

Permissions Policy:
https://immersive-web.github.io/webxr/#permissions-policy

## HID

Actual current spec:
https://wicg.github.io/webhid/

requestDevice:
https://wicg.github.io/webhid/#dom-hid-requestdevice

HIDDevice open:
https://wicg.github.io/webhid/#dom-hiddevice-open

Status: Draft Community Group Report; not W3C Standards Track.

## USB

Actual current spec:
https://wicg.github.io/webusb/

requestDevice:
https://wicg.github.io/webusb/#dom-usb-requestdevice

USBDevice open:
https://wicg.github.io/webusb/#dom-usbdevice-open

Community/incubation authority; runtime evidence remains mandatory.

## Serial

Actual living document:
https://serial.spec.whatwg.org/

requestPort:
https://serial.spec.whatwg.org/#dom-serial-requestport

SerialPort open:
https://serial.spec.whatwg.org/#dom-serialport-open

Current document identifies itself as a Draft Community Group Report / living document.

## Bluetooth

Actual current spec:
https://webbluetoothcg.github.io/web-bluetooth/

requestDevice:
https://webbluetoothcg.github.io/web-bluetooth/#dom-bluetooth-requestdevice

GATT connect:
https://webbluetoothcg.github.io/web-bluetooth/#dom-bluetoothremotegattserver-connect

Community-group authority; runtime evidence remains mandatory.

## Git

Commit object:
https://git-scm.com/docs/gitglossary#def_commit

Revision syntax:
https://git-scm.com/docs/gitrevisions

Repository layout:
https://git-scm.com/docs/gitrepository-layout

## Known conflicts

See [CONFLICT-LEDGER.md](CONFLICT-LEDGER.md).

Most important:
- Rust wasm64 standards-status prose vs current WebAssembly 3.0.
- current WebAssembly JS embedding vs separate Threads proposal.
- proposal/future Shared-Everything Threads vs current baseline.

## Rule for future updates

When a future agent relies on an external technical claim:

1. open the current actual specification;
2. locate the exact clause;
3. update this map if the existing link has moved or become stale;
4. preserve maturity/status;
5. keep implementation pins separate;
6. derive a test/evidence obligation;
7. never keep an obsolete statement merely because it already exists in this repository.


## Pass 6 commissioning authority

Controlled WebGPU device-loss fixture:
https://gpuweb.github.io/gpuweb/#dom-gpudevice-destroy

The current WebGPU specification defines GPUDevice.destroy() as destroying the device and causing device loss with reason "destroyed". Commissioning uses this as an explicit test fixture for loss/reselection behavior.
