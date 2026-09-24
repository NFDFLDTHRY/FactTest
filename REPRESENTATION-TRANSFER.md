# FactTest Representation and Transfer Model

STATUS: PASS 5  
DATE: 2026-09-23

## 1. Separation law

\`\`\`text
TypeId != RepresentationId
\`\`\`

Pass-4 nominal types state semantic meaning.
Representations state how a value/resource exists in a particular implementation domain.

## 2. RepresentationContract

\`\`\`text
RepresentationContract
  representation_id
  semantic_type_id
  storage_domain
  ownership_modes[]
  alignment_model
  size_model
  lifetime_model
  transferable
  serializable
  shareable
  close_or_release_semantics
  authority_links[]
  evidence_requirements[]
\`\`\`

Pass 5 does not assign concrete layouts for every semantic type.
It defines the schema and required explicitness.

## 3. Initial storage-domain vocabulary

Implementation-level storage domains include:

- WASM_LINEAR
- JS_OBJECT
- ARRAY_BUFFER
- SHARED_BUFFER
- WORKER_TRANSFER
- GPU_BUFFER
- GPU_TEXTURE
- VIDEO_FRAME
- AUDIO_DATA
- STREAM
- OPFS_FILE
- INDEXEDDB_RECORD
- CACHE_ENTRY
- DEVICE_HANDLE
- XR_HANDLE

A storage domain is not itself a semantic type.

## 4. ConversionContract

\`\`\`text
ConversionContract
  conversion_id
  from_representation
  to_representation
  semantic_preservation
  required_capabilities[]
  supported_transfer_mode
  ownership_transition
  static_preconditions[]
  dynamic_requirements[]
  failure_classes[]
  measurable_cost_dimensions[]
  evidence_requirements[]
  authority_links[]
\`\`\`

No implicit conversion is allowed.

If no direct representation compatibility or ConversionContract path exists, the planner has no legal path.

## 5. Transfer-mode preservation

Pass-4 transfer modes remain semantic constraints:

- move
- borrow
- copy
- share
- observe

A representation/conversion implementation must declare which modes it supports.

Example:

\`\`\`text
semantic DATA mode=move
     |
     v
representation path must implement move semantics
\`\`\`

Replacing move with copy merely because the API makes it convenient is not legal without an explicit semantic equivalence rule approved by the language/contract.

## 6. Lifetime

Representation lifetime is explicit.

Examples of lifetime triggers:

- source scope exit
- transfer detachment
- explicit close()
- resource/device loss
- worker termination
- session end
- handle invalidation
- bundle/runtime shutdown

Planner/verifier must ensure no selected plan reads a representation after its legal lifetime.

## 7. Cost edges

Conversion/transfer costs are not hidden inside backend execution estimates.

At minimum record measurable dimensions separately:

- transfer_time_ns
- transfer_bytes
- peak_working_memory_bytes
- temporary_resource_count

This lets the planner represent "fast compute, expensive transfer" honestly.

## 8. Representation evidence

A representation/conversion contract becomes runtime-admissible only to the degree its required behavior is evidenced.

Examples:
- known byte round trip
- known GPU buffer upload/readback
- transferable object ownership change
- close/release invalidation
- OPFS write/reopen/read
- worker transfer/clone behavior

The evidence mechanism belongs to runtime/fixture machinery, not to semantic source.
