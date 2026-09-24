# FactTest Pass 3 - Bootstrap Reference Compiler

STATUS: PASS 3 EXECUTED  
DATE: 2026-09-23  
BASE: bed4ca0814482608d466d1a3496cc096aa847973

## 0. Purpose

Pass 3 defines the bootstrap architecture that can carry FactTest from ASCII source through verification and eventual WebApp code generation without prematurely implementing the compiler.

Pass 3 is architectural material for the eventual Fable 5.1 manufacturing prompt.

Pass 3 does not define:

- the ASCII concrete grammar
- the final type system
- the proof logic
- a planner algorithm
- backend implementations
- performance cost values
- a first-party allocator
- generated WebApp source files

## 1. Three-machine separation

\`\`\`text
FABLE 5.1
   |
   | initial construction under Factory Law
   v
FactTest.git                         manufactured object A
   |
   | contains
   v
FactTest compiler                    compiler machine C
   |
   | manufactures
   v
generated capability-parametric
Chrome WebApp                        manufactured object B
\`\`\`

Invariants:

- Factory workpiece is not compiler workpiece.
- FactTest.git is not the generated WebApp.
- Fable bootstrap tooling is not permanent compiler semantics.
- host/bootstrap machinery is not the ASCII source language.
- temporary bootstrap trust must remain explicit and reducible.

## 2. Bootstrap trust

Before FactTest can verify itself, the first materialization necessarily trusts external tools:

\`\`\`text
Git
rustup / selected Rust toolchain
rustc
Cargo
linker / Wasm tooling
Fable 5.1
host operating environment
browser/runtime used for probes
        |
        v
first FactTest materialization
        |
        v
FactTest-owned structural checks
        |
        v
FactTest-owned compiler verification
        |
        v
smaller explicit external trust surface
\`\`\`

Bootstrap tools may construct workpieces, run builds, run tests, and provide I/O.

Bootstrap tools may not:

- define source-language semantics by accident
- override proof results
- silently repair invalid source
- mutate canonical project state outside Factory Law
- become hidden runtime dependencies without being modeled

See [BOOTSTRAP-ARCHITECTURE.md](BOOTSTRAP-ARCHITECTURE.md).

## 3. Kernel and host split

The semantic compiler kernel is \`#![no_std]\`.

Current Rust authority for \`no_std\`:
https://doc.rust-lang.org/reference/names/preludes.html#the-no_std-attribute

The kernel must therefore be designed as a pure transformation and verification machine that does not require direct access to:

- filesystem
- Git
- network
- DOM/browser APIs
- wall clock
- process environment
- console
- nondeterministic host ordering

Conceptual boundary:

\`\`\`text
HOST / FACTORY
    |
    | provides source bytes, machine state, options, workspace
    v
NO_STD COMPILER KERNEL
    |
    | produces structured artifacts, diagnostics, obligations
    v
HOST / FACTORY
    |
    | writes, executes, probes, records
    v
EVIDENCE
\`\`\`

This same split later mirrors Rust/Wasm and the generated JavaScript capability membrane.

## 4. Bootstrap memory rule

Pass 3 does not require \`alloc\`.

The bootstrap kernel must be architecturally possible with:

- borrowed input slices
- caller-provided output buffers
- caller-provided scratch/workspace
- bounded arenas whose ownership is explicit

Current Cargo authority for building standard-library crates from source when later required:
https://doc.rust-lang.org/nightly/cargo/reference/unstable.html#build-std

Invariants:

- Pass 3 bootstrap can exist without global allocation.
- \`alloc\` may be admitted later.
- the first-party allocator remains [GAP].
- later allocator admission must not change semantic results for the same admitted input.

## 5. Foundational identity domains

Pass 3 establishes identity categories, not final Rust representations:

- SourceId
- ByteOffset
- Span
- NodeId
- SymbolId
- TypeId
- CapabilityId
- ImplementationId
- InvariantId
- ObligationId
- DiagnosticId
- ArtifactId
- EvidenceId
- ReceiptId

Required invariants:

- IDs from different domains are not interchangeable.
- every Span belongs to exactly one source identity.
- resolved semantic identity is not a raw string.
- CapabilityId is not ImplementationId.
- capability identity is not runtime observation.
- evidence identity is not proof that evidence is valid.

## 6. Compiler phase spine

Pass 3 fixes phase boundaries while leaving Pass 4 and Pass 5 to define their internals.

\`\`\`text
SOURCE BYTES
   |
   v
FRONT END
   |
   v
SYSTEM AST
   |
   v
RESOLUTION
   |
   v
RESOLVED SYSTEM
   |
   v
TYPE / STRUCTURE
   |
   v
TYPED SYSTEM IR
   |
   v
PROOF-OBLIGATION EXTRACTION
   |
   v
SEMANTIC OBLIGATIONS
   |
   v
CAPABILITY LOWERING
   |
   v
CAPABILITY IR
   |
   v
IMPLEMENTATION ENUMERATION
   |
   v
IMPLEMENTATION HYPERGRAPH
   |
   v
PLAN
   |
   v
EXECUTION STRATEGY IR
   |
   v
INDEPENDENT VERIFY
   |
   v
VERIFIED PLAN
   |
   v
CODEGEN
   |
   v
GENERATED BUNDLE
\`\`\`

No phase may silently perform the semantic work owned by an earlier phase.

## 7. Artifact lineage

Every phase boundary produces an inspectable artifact class:

\`\`\`text
SOURCE
 -> AST
 -> RESOLVED
 -> TYPED
 -> OBLIGATIONS
 -> CAPABILITY IR
 -> IMPLEMENTATION HYPERGRAPH
 -> PLAN
 -> VERIFICATION RESULT
 -> GENERATED BUNDLE
\`\`\`

Each artifact class eventually carries:

- artifact kind
- schema/version
- source lineage
- producer identity/version
- input artifact identities
- status
- structured diagnostics

Hashing/signature choices are deliberately not frozen in Pass 3.

Invariants:

- downstream phases may not invent semantic facts absent from admitted upstream artifacts.
- every transformation declares input and output artifact classes.
- generated code is not semantic authority.

## 8. Verifier independence

Correctness and optimization remain separate.

\`\`\`text
TYPED SYSTEM IR ----------------------+
    |                                 |
    |                                 v
    |                           OBLIGATIONS
    v                                 |
PLANNER                               |
    |                                 |
    v                                 |
CANDIDATE PLAN -----------------------+
                |
                v
        INDEPENDENT VERIFIER
           |           |
          PASS        FAIL
           |           |
           v           v
     VERIFIED PLAN    ERROR
\`\`\`

The verifier may consume:

- semantic invariants
- proof obligations
- capability requirements
- admitted machine state
- candidate plan
- implementation contracts

It may not accept:

- planner self-assertion
- planner heuristic state as proof
- cost ranking as proof of correctness

\`\`\`text
Valid(P) != Best(P)
\`\`\`

## 9. Capability namespaces

Pass 3 establishes three distinct layers:

\`\`\`text
SEMANTIC CAPABILITY
        |
        v
IMPLEMENTATION CAPABILITY
        |
        v
RUNTIME OBSERVATION / ADMISSION
\`\`\`

Examples:

\`\`\`text
semantic MATRIX_MULTIPLY
   -> CPU/Wasm implementation
   -> WebGPU implementation
   -> WebNN implementation

semantic ORIENTATION
   -> Device Orientation implementation
   -> Gyroscope implementation
   -> Orientation Sensor implementation
\`\`\`

Chrome-specific API names belong to implementation/runtime layers, not the semantic source language unless the user explicitly authors an implementation-specific requirement.

## 10. Runtime-state envelope

Pass 1/2 state variables remain distinct:

- G: approved target capability universe
- C: implementations currently materialized
- M(t): currently observed runtime machine state
- A(t): admitted implementation edges
- P(t): verified execution plan

Conceptual machine observation:

\`\`\`text
MachineObservation
  capability identity
  observed state
  feature set
  limits
  policy state
  permission state
  resource state
  observation epoch
  evidence reference
\`\`\`

Conceptual admission:

\`\`\`text
Admission
  implementation identity
  admitted / rejected
  conditions
  evidence references
  structured rejection reason
\`\`\`

\`M(t)\` is observed.
\`A(t)\` is derived.
\`P(t)\` is planned.
They must not collapse into one structure.

## 11. Host membrane

The generated WebApp eventually bridges Rust/Wasm semantic machinery to browser Web IDL APIs.

Pass 3 freezes only the normalized interaction direction:

\`\`\`text
RUST / WASM
    |
    v
HOST MEMBRANE ABI
    |
    +-- discover
    +-- request
    +-- operate
    +-- observe
    '-- release
    |
    v
BROWSER CAPABILITY ADAPTERS
\`\`\`

Normalized result classes are defined in [BOOTSTRAP-CONTRACTS.md](BOOTSTRAP-CONTRACTS.md).

Individual browser adapter contracts belong to Pass 5.

## 12. Generated-object ownership

The eventual generated WebApp has distinct ownership zones:

\`\`\`text
GENERATED WEBAPP
  |
  +-- Wasm program/runtime artifacts
  +-- JavaScript capability membrane
  +-- HTML/application shell
  +-- manifest/service-worker assets
  +-- evidence schemas/runtime evidence
  '-- source-lineage / plan / verification metadata
\`\`\`

Pass 3 does not freeze filenames.

## 13. Planned repository dependency law

Pass 3 defines dependency direction, not final directories.

\`\`\`text
FOUNDATION
    ^
DIAGNOSTICS / ARTIFACT CONTRACTS
    ^
SOURCE / FRONT-END
    ^
SEMANTICS
    ^
CAPABILITIES
    ^
IMPLEMENTATION CONTRACTS
    ^
PLANNING --------+
                 |
OBLIGATIONS -----+--> VERIFIER
                 |
                 v
              CODEGEN
\`\`\`

Forbidden dependency paths include:

- codegen -> source-semantic ownership
- planner -> source mutation
- verifier -> planner heuristics
- host adapter -> semantic authority
- runtime evidence -> silent source rewrite
- generated WebApp -> authoritative repo mutation

See [PLANNED-REPO-LAYOUT.md](PLANNED-REPO-LAYOUT.md).

## 14. Determinism

For identical admitted:

- source
- project options
- machine state
- objective
- compiler/schema version

the semantic pipeline must not depend on:

- wall clock
- unmodeled randomness
- unstable map iteration order
- filesystem enumeration order
- network state not represented in M

Runtime optimization may change when explicit observations/measurements change.

Those observations are inputs/evidence, not hidden state.

## 15. Receipts

Pass 3 preserves two receipt families:

\`\`\`text
FACTORY RECEIPT
  proves project workpiece mutation

COMPILER RECEIPT
  proves compiler-phase transformation
\`\`\`

They are not interchangeable.

Compiler receipts eventually identify:

- producer
- input artifacts
- output artifact
- compiler/schema version
- status
- diagnostics
- authority references
- test/evidence references

## 16. Bootstrap test ladder

Pass 3 defines B0-B12 in [BOOTSTRAP-TESTS.md](BOOTSTRAP-TESTS.md).

Critical invariant:

\`\`\`text
B8 reports that the ASCII language kernel is not yet implemented.

That is a Pass-3 success condition.
Pass 4 owns the language.
\`\`\`

A toy grammar may not be introduced merely to make Pass 3 appear executable.

## 17. Project-design gaps carried forward

[GAP] ASCII concrete grammar  
[GAP] parser implementation  
[GAP] final System AST schema  
[GAP] name/type/ownership resolution rules  
[GAP] final type/effect system  
[GAP] proof logic/kernel  
[GAP] proof certificate encoding  
[GAP] implementation-hypergraph schema details  
[GAP] planner algorithm and cost model  
[GAP] first-party allocator if alloc is admitted  
[GAP] browser adapter contracts  
[GAP] generated-bundle concrete layout  
[GAP] runtime evidence concrete schema  
[GAP] observed-ASCII writer  
[GAP] station registry implementation  
[GAP] re-inspection implementation

These gaps are not Pass-3 failures because Pass 4/5 own their definition.

## 18. Pass 3 closure

[RUN] external bootstrap trust is explicit  
[RUN] no_std kernel separated from host I/O  
[RUN] bootstrap does not require alloc  
[RUN] foundational identity domains established  
[RUN] structured diagnostic contract established  
[RUN] compiler phase boundaries fixed  
[RUN] artifact lineage established  
[RUN] planner/verifier independence established  
[RUN] capability namespaces separated  
[RUN] G/C/M/A/P remain distinct  
[RUN] host membrane envelope established  
[RUN] generated-object ownership zones established  
[RUN] planned dependency DAG established  
[RUN] bootstrap ABI operations established  
[RUN] determinism contract established  
[RUN] Factory and compiler receipts separated  
[RUN] B0-B12 bootstrap test ladder established  
[RUN] ASCII grammar deliberately not invented  
[RUN] backend implementations deliberately not invented  
[RUN] planner algorithm deliberately not selected  
[RUN] no compiler source materialized

Pass 3 closes as bootstrap architecture and contracts only.

Next: Pass 4 - ASCII / Language Kernel.


## Pass 6 supersession note

Pass 6 repaired the singular-plan shorthand used in this historical pass.

For adaptive targets, read the current architecture as:

```text
CandidateStrategy
  -> Independent Verifier
  -> VerifiedStrategy
  -> Codegen
  -> epoch-bound ActivationReceipt
  -> ActivePlan
```

The earlier CandidatePlan/VerifiedPlan diagrams remain historical bootstrap framing and do not override PASS6-GAP-REPAIRS.md, VERIFICATION-CERTIFICATES.md, CODEGEN-BUNDLE-CONTRACT.md, or RUNTIME-ADMISSION-REPLAN.md.
