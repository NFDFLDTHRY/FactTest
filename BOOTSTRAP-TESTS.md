# FactTest Bootstrap Test Ladder

STATUS: PASS 3  
DATE: 2026-09-23

These are tests the eventual Fable 5.1 first materialization must implement and pass.

Pass 3 defines them.
Pass 3 does not run them because no compiler implementation exists yet.

## B0 - Repository/workspace structure

Precondition:
- Fable has created the approved future repository skeleton in an isolated workpiece.

Test:
- declared dependency boundaries resolve
- no unexpected implementation paths/dependencies appear
- Factory checks know every owned surface

Pass evidence:
- workpiece tree
- ownership/dependency receipt

## B1 - no_std boundary

Authority:
https://doc.rust-lang.org/reference/names/preludes.html#the-no_std-attribute

Test:
- every compiler-kernel crate/module intended to be no_std builds under the no_std boundary
- an explicit forbidden std-use fixture fails

Pass evidence:
- selected toolchain identity
- build command
- success result
- expected failure fixture

## B2 - no third-party dependency boundary

Project authority:
PASS1.md

Test:
- declared dependency graph contains only approved first-party project code and admitted Rust/toolchain components
- fixture adding an external crates.io dependency is rejected by project verification

Pass evidence:
- dependency graph
- rejection receipt

## B3 - foundational identity separation

Test:
- compile-time/type-level fixtures prove distinct identity domains cannot be accidentally substituted
- Span always requires one SourceId and a valid byte interval

Required negative fixtures include:
- CapabilityId used as ImplementationId
- ArtifactId used as EvidenceId
- NodeId used as SymbolId

Pass evidence:
- compile/check outcomes for positive and negative fixtures

## B4 - deterministic structured diagnostics

Test:
- same structured failure input twice
- machine-readable diagnostic structure is identical
- rendering can vary only in explicitly non-semantic formatting if later allowed

Checks:
- stable class/code
- source identity
- primary/related spans
- ordered parameters
- authority references where relevant

## B5 - phase-interface composition

Test:
- each declared compiler phase can accept its declared placeholder/test artifact and produce only its declared next artifact class
- undeclared phase shortcut fixture is rejected

Pass evidence:
- artifact lineage trace

## B6 - planner/verifier structural independence

Test:
- verifier builds/operates without importing planner heuristic internals
- planner cannot manufacture a VerifiedPlan type/artifact directly
- only verifier success can produce the verified-plan state

Pass evidence:
- dependency graph
- negative compile/check fixture
- verification receipt

## B7 - opaque source reaches front-end boundary

Test:
- arbitrary source bytes can be submitted through the bootstrap ABI
- source identity/span accounting is established
- no grammar assumptions are required merely to transport the source

Pass evidence:
- accepted SourceBytes artifact
- source identity metadata

## B8 - language kernel deliberately absent

Expected Pass-3-era behavior:

\`\`\`text
source submitted
    |
    v
front-end boundary reached
    |
    v
structured diagnostic:
LANGUAGE_KERNEL_NOT_IMPLEMENTED
\`\`\`

This is a success condition for the bootstrap substrate before Pass 4.

Forbidden:
- inventing a toy grammar
- treating arbitrary source as valid
- embedding ad-hoc parser behavior merely to make a demo pass

Pass evidence:
- deterministic structured diagnostic and span/source lineage

## B9 - wasm64 bootstrap artifact

Authority:
https://doc.rust-lang.org/rustc/platform-support/wasm64-unknown-unknown.html
https://webassembly.github.io/spec/core/text/types.html#text-addrtype

Test:
- approved no_std bootstrap kernel artifact can be built for wasm64-unknown-unknown
- wasm32 fallback is rejected by project policy

Pass evidence:
- target triple
- toolchain identity
- artifact identity
- module validation/inspection

## B10 - host instantiation

Authority:
https://webassembly.github.io/spec/web-api/#streaming-module-compilation-and-instantiation
D18 ANNOTATION (fragment #streaming-module-compilation-and-instantiation): no such id exists in the pinned or current source
(D14 [ERR]); the clause is at #streaming-modules (D14 revision; D15 clauses CL-S1..CL-S4).  Current authority node:
AUTH-WASM-WEBAPI-STREAMING-D18 (supersedes AUTH-WASM-WEBAPI-STREAMING).  The URL above is kept as historically written.
https://webassembly.github.io/spec/js-api/#memories

Test:
- bootstrap Wasm artifact is instantiated by the host test harness
- host supplies only declared imports
- undeclared import fixture fails explicitly

Pass evidence:
- import/export inventory
- instantiation result

## B11 - known bootstrap ABI operation

Test one operation that has no language semantics dependency.

Recommended:
- QUERY_ABI_VERSION
or
- QUERY_REQUIRED_WORKSPACE

Pass:
- host obtains deterministic expected result from Wasm/kernel boundary

This proves transport and ABI wiring, not compiler-language correctness.

## B12 - bootstrap receipt/evidence

Test:
- the bootstrap harness emits structured evidence describing B0-B11
- Factory receipt and compiler/bootstrap evidence are separate
- evidence references exact toolchain/artifact identities
- failed subtests cannot be represented as PASS

Pass evidence:
- bootstrap evidence package
- Factory workpiece receipt
- independent verification result

## Ladder invariant

\`\`\`text
B0 -> B1 -> B2 -> B3 -> B4 -> B5 -> B6
   -> B7 -> B8 -> B9 -> B10 -> B11 -> B12
\`\`\`

A later test may depend on earlier guarantees.

Skipping a failed earlier test requires an explicit approved ASCII change, not an agent decision.

## What this ladder does not prove

Passing B0-B12 will not prove:

- ASCII grammar correctness
- typed language semantics
- proof-kernel correctness
- capability planner optimality
- browser backend correctness
- complete WebApp generation

Those belong to Pass 4, Pass 5, and Pass 6.
