# FactTest Bootstrap Architecture

STATUS: PASS 3  
DATE: 2026-09-23

## 1. Bootstrap trust boundary

The first FactTest compiler cannot be self-proving before it exists.

External bootstrap trust is therefore explicit:

\`\`\`text
Git
selected Rust toolchain
rustc / Cargo
linker / Wasm tooling
Fable 5.1
host OS/process environment
browser used for probes
        |
        v
BOOTSTRAP WORKPIECE
        |
        v
FactTest-owned checks
        |
        v
FactTest-owned verification
\`\`\`

The long-term goal is not to pretend external trust vanishes.
The goal is to make every trusted boundary explicit, testable, replaceable where practical, and smaller than the system it manufactures.

## 2. Kernel/host architecture

Current no_std authority:
https://doc.rust-lang.org/reference/names/preludes.html#the-no_std-attribute

\`\`\`text
+----------------------------------------------------------+
| HOST / FACTORY                                           |
|                                                          |
| reads source/project files                               |
| reads Git state                                          |
| selects toolchain                                        |
| allocates workspace                                      |
| invokes compiler kernel                                  |
| writes artifacts                                         |
| runs browser/runtime probes                              |
+-----------------------------+----------------------------+
                              |
                              | bytes + explicit state
                              v
+----------------------------------------------------------+
| NO_STD SEMANTIC KERNEL                                   |
|                                                          |
| no filesystem                                            |
| no Git                                                   |
| no network                                               |
| no browser                                               |
| no wall-clock semantics                                  |
| no hidden environment                                    |
|                                                          |
| deterministic transformations                            |
| structured diagnostics                                   |
| semantic artifacts                                       |
| proof obligations                                        |
+-----------------------------+----------------------------+
                              |
                              | structured outputs
                              v
+----------------------------------------------------------+
| HOST / FACTORY                                           |
|                                                          |
| persists / executes / probes / records evidence          |
+----------------------------------------------------------+
\`\`\`

The host supplies capability.
The kernel owns semantics.

## 3. Memory architecture

Pass 3 requires a bootstrap path that can function with:

\`\`\`text
borrowed source slices
caller-provided output storage
caller-provided scratch storage
bounded/explicit arenas
\`\`\`

No global allocator is required by architectural law.

If \`alloc\` is later admitted, the current Cargo mechanism for building core/alloc from source is documented here:
https://doc.rust-lang.org/nightly/cargo/reference/unstable.html#build-std

Allocator admission must be a later explicit design and verification event.

## 4. Compiler machines

The internal compiler is a pipeline of bounded semantic transformations:

\`\`\`text
SourceInput
   |
   v
FrontEnd
   |
   v
SystemAst
   |
   v
Resolver
   |
   v
ResolvedSystem
   |
   v
TypeAndStructure
   |
   v
TypedSystemIr
   |
   v
ObligationExtractor
   |
   v
ObligationSet
   |
   v
CapabilityLowering
   |
   v
CapabilityIr
   |
   v
ImplementationEnumerator
   |
   v
ImplementationHypergraph
   |
   +--------------------------+
   |                          |
   v                          v
Planner                   ObligationSet
   |                          |
   v                          |
CandidateStrategy             |
   +------------+-------------+
                |
                v
        Independent Verifier
             |   |
             |   +--> VerificationFailure
             v
       VerifiedStrategy
                |
                v
             Codegen
                |
                v
        GeneratedBundle
\`\`\`

## 5. Artifact envelope

Each phase artifact has a common conceptual envelope:

\`\`\`text
Artifact
  kind
  schema_version
  producer
  source_lineage
  input_artifact_ids[]
  status
  diagnostics[]
  payload
\`\`\`

The payload is phase-specific.

Hash/signature algorithms are not selected in Pass 3.

## 6. Verifier separation

Planner and verifier may share only lower-level semantic/contract types.

Forbidden:

\`\`\`text
Planner --> Verifier internals
Verifier --> Planner heuristic state
Planner decision --> treated as proof
Cost score --> treated as correctness
\`\`\`

Allowed:

\`\`\`text
TypedSystemIr
Obligations
CapabilityIr
Implementation contracts
Machine/admission state
CandidateStrategy
       |
       v
Verifier
\`\`\`

The verifier answers legality/correctness.
The planner answers which legal plan to propose.

## 7. Capability layering

\`\`\`text
SEMANTIC REQUIREMENT
      |
      v
IMPLEMENTATION ALTERNATIVE
      |
      v
RUNTIME OBSERVATION
      |
      v
ADMISSION
      |
      v
PLAN
\`\`\`

A semantic operation may have many implementation alternatives.

A runtime API observation may never silently redefine the semantic operation.

## 8. Runtime state

\`\`\`text
G = approved target universe
C = materialized implementations
M = runtime observations
A = admitted implementations
P = active plan selected from a VerifiedStrategy
\`\`\`

Required relationships:

\`\`\`text
C subset-of G
A subset-of C intersect M
P uses only A
\`\`\`

The actual representation of these structures belongs to later passes.

## 9. Host membrane

The host membrane is a normalized boundary, not a pile of direct browser calls embedded through semantic code.

Operations:

\`\`\`text
DISCOVER
REQUEST
OPERATE
OBSERVE
RELEASE
\`\`\`

Result classes:

\`\`\`text
OK
UNAVAILABLE
DENIED
POLICY_BLOCKED
UNSUPPORTED
LOST
RESOURCE_EXHAUSTED
INVALID
INTERNAL_FAILURE
\`\`\`

A feature-specific adapter may carry richer structured data while preserving these common categories where applicable.

## 10. Deterministic semantic kernel

The kernel must be deterministic for identical admitted semantic inputs.

Hidden dependency on any of these is forbidden:

- clock time
- host random generator
- filesystem enumeration order
- environment-variable values not represented in options
- network responses not represented as explicit inputs
- browser capability state not represented in M
- nondeterministic container iteration used as semantic ordering

If measurement changes a plan, measurement is explicit evidence/input.

## 11. Bootstrap ABI

Pass 3 freezes semantic operations, not concrete Rust or JavaScript syntax:

\`\`\`text
QUERY_ABI_VERSION
QUERY_REQUIRED_WORKSPACE
SUBMIT_SOURCE_BYTES
SUBMIT_MACHINE_STATE
CHECK_OR_COMPILE
READ_DIAGNOSTICS
READ_ARTIFACT_METADATA
RESET_WORKSPACE
\`\`\`

ABI is transport.
ABI is not source-language semantics.

## 12. Generated-object boundary

The eventual generated WebApp object owns:

\`\`\`text
Wasm program/runtime artifacts
JavaScript capability membrane
HTML shell
manifest/service-worker assets
runtime evidence output
source-lineage metadata
selected plan metadata
verification metadata
\`\`\`

The concrete bundle naming/layout is deferred to Pass 5.


## Pass 6 supersession note

For adaptive generated applications, Pass 6 supersedes the earlier singular-plan shorthand in this document.

Current flow:

```text
Planner -> CandidateStrategy -> Independent Verifier -> VerifiedStrategy -> Codegen
Runtime epoch -> ActivationReceipt -> ActivePlan
```

A non-adaptive target is the one-variant degenerate case.
