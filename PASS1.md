# FactTest Pass 1 — Observe / Anchor

STATUS: PASS 1 REBUILT
DATE: 2026-09-23

This Pass 1 replaces the retired reference-warehouse framing.

## 0. What exists now

At the start of this reset, the repository contained a placeholder README plus a reference corpus and acquired-source directories, but no compiler or factory implementation.

This reset intentionally removes those files from the current working tree. Git history remains the retirement record.

Current Pass 1 creates only project law, system identity, target structure, and live-reference authority.

## 1. Product identity

FactTest is:

```text
ASCII SYSTEMS FACTORY
        |
        v
    FactTest.git                         manufactured object A
        |
        v
#![no_std] RUST COMPILER
        |
        v
AI-AUTHORED ASCII SYSTEMS DIAGRAMS       source language
        |
        v
      PARSER
        |
        v
    SYSTEM AST
        |
        v
  TYPED SYSTEM IR
        |
        v
 STRUCTURAL PROOF
        |
        v
   CAPABILITY IR
        |
        v
IMPLEMENTATION HYPERGRAPH
        |
        v
 EXECUTION STRATEGY IR
        |
        v
      VERIFY
        |
        v
 RUST/WASM + JS HOST + WEB SHELL
        |
        v
 CAPABILITY-PARAMETRIC CHROME WEBAPP     manufactured object B
        |
        v
discover -> permission -> probe -> characterize -> enroll
        |
        v
       M(t)
        |
        v
       A(t)
        |
        v
       P(t)
        |
        v
execute -> measure -> evidence -> replan
        |
        v
 RE-OBSERVE INTO ASCII
```

Project decisions:

- compiler implementation language: Rust
- compiler crates: `#![no_std]`
- no third-party crates
- source language: AI-authored ASCII Systems Diagrams
- target family: capability-parametric Chrome WebApp
- canonical Rust/Wasm target direction: `wasm64-unknown-unknown`
- wasm32 fallback is forbidden unless the human explicitly changes that design decision
- planner is replaceable machinery, not compiler identity
- Chrome populates runtime machine state; Chrome is not encoded into source-language semantics

## 2. Two manufactured objects

```text
ASCII workshop --compile----> generated WebApp       object B
      |
      | factory mutation law
      v
 FactTest.git                                        object A
```

`FactTest.git` and the generated WebApp are distinct objects with distinct admission gates.

The generated WebApp is not `no_std`; its Rust compiler/runtime portion may be `no_std`, while the WebApp also contains JavaScript host machinery, browser APIs, manifest/service-worker surfaces, and generated assets.

## 3. Source-language invariants

`[NEW]` ASCII concrete syntax is still to be defined.

Whatever grammar is accepted later must preserve:

- components
- ports
- connections
- ownership
- contracts
- status tags
- invariants
- tests
- evidence requirements
- sequencing
- capability requirements
- optimization objectives
- unresolved gaps

`[INV]` ASCII remains the source of record.

Internal Rust types/IR may represent source semantics, but may never become a second authoring language that merely pretty-prints ASCII afterward.

## 4. Compiler semantic spine

```text
ASCII
  -> parse
SYSTEM AST
  -> name/type/ownership resolution
TYPED SYSTEM IR
  -> structural proof
CAPABILITY IR
  -> enumerate legal implementations
IMPLEMENTATION HYPERGRAPH
  -> plan/optimize
EXECUTION STRATEGY IR
  -> independent verification
CODEGEN
```

Typed IR requirements:

- every edge has defined semantics
- every required input has a producer
- every output has consumers or an explicit terminal role
- ownership is explicit
- effects are explicit
- capability requirements are explicit
- invariants become proof obligations
- illegal states fail compilation rather than being silently repaired

## 5. Complete implementation hypergraph

An approved target capability remains part of the system even when its current reference, implementation, permission, hardware, or runtime evidence is incomplete.

```text
semantic operation
    |
    +-- CPU / Rust / Wasm64
    +-- dedicated/shared workers
    +-- shared/threaded execution
    +-- WebGPU
    +-- WGSL
    +-- WebNN
    +-- WebCodecs
    +-- camera
    +-- microphone
    +-- sensors
    +-- geolocation
    +-- XR
    +-- Fetch / Streams / host communication
    +-- Storage / OPFS / IndexedDB / CacheStorage
    +-- Service Worker / PWA lifecycle
    +-- permissions / security policy
    +-- HID
    +-- USB
    +-- Serial
    +-- Bluetooth
    '-- future explicitly-approved capability implementations
```

Every backend implementation must eventually declare:

- preconditions
- input/output layouts
- capability requirements
- execution cost
- transfer cost
- memory cost
- failure modes
- fallback relations
- evidence obligations

`[INV]` compiler backends are not Factory stations.
Factory stations mutate project workpieces.
Compiler backends are alternative implementations inside a compiled execution graph.

## 6. Target-preservation law

Once a subsystem/capability is approved in ASCII, an agent may not remove it merely because:

- its reference is missing
- its standard is immature
- its implementation does not exist yet
- the current browser does not expose it
- permission is denied
- a runtime probe fails
- another backend is easier

Instead preserve the node and attach `[GAP]`, `[ERR]`, or `[UNK]`.

Removal requires an explicit ASCII design decision.

## 7. Runtime-state model

Let:

- `G` = approved target capability universe
- `C` = compiler/runtime implementations currently materialized
- `M(t)` = capabilities the actual browser/device currently exposes
- `A(t)` = capabilities admitted after security, permission, feature/limit and execution probes
- `P(t)` = verified execution plan

Required relationship:

```text
C subset-of G
A(t) subset-of C intersect M(t)
P(t) uses only A(t)
```

A capability missing from `C` or `M(t)` remains in `G` unless the human removes it from approved ASCII.

## 8. Proof boundary

For source `S`, admitted machine state `M`, and plan `P`:

```text
WellTyped(S)
AND CapabilitiesAdmitted(M)
AND Verified(P, S, M)

=>

P preserves every compiled invariant of S
and uses only admitted capabilities.
```

Optimization is separate:

```text
If a finite legal-plan search completes
with valid/admissible bounds on Cost(P | M, O),
then the selected optimum is optimal for that stated model,
not for physical hardware in the abstract.
```

When machine state changes, `S` does not silently change.
A replacement `P1` is legal only if it verifies against the new `M1`, and the changed runtime structure is re-observed into ASCII.

## 9. Reference/freshness law

Technical authority is live and claim-specific.

For every implementation-constraining claim:

```text
claim
  -> current authoritative document
  -> exact section / definition / algorithm fragment
  -> document maturity/status
  -> observed date
  -> optional reproducibility pin
  -> test/evidence obligation
```

Rules:

- living/editor documents are used for current semantics
- dated snapshots/PDFs are historical unless explicitly pinned for reproducibility
- project decisions are never mislabeled as upstream requirements
- implementation source is implementation evidence, not automatically normative specification
- a title/home-page link is insufficient for a semantic constraint when a stable deep fragment exists
- if current authority and a pinned implementation disagree, preserve both and mark `[ERR]`
- do not silently keep an obsolete clause because it was previously downloaded

See [REFERENCE-AUTHORITY.md](REFERENCE-AUTHORITY.md).

## 10. Current major gaps

`[GAP]` structural-delta schema  
`[GAP]` ASCII grammar and compilation-unit rules  
`[GAP]` parser  
`[GAP]` System AST contract  
`[GAP]` name/type/ownership resolution  
`[GAP]` Typed System IR schema  
`[GAP]` capability IR schema  
`[GAP]` structural proof logic/kernel  
`[GAP]` proof certificate / receipt schema  
`[GAP]` independent compiler verifier  
`[GAP]` implementation-hypergraph schema  
`[GAP]` cost/measurement model  
`[GAP]` planner trait and fallback verification contract  
`[GAP]` first-party allocator strategy if `alloc` is admitted  
`[GAP]` reproducible wasm64 build fixture  
`[GAP]` runtime capability/evidence schemas  
`[GAP]` observed-ASCII writer  
`[GAP]` station registry  
`[GAP]` re-inspection protocol

## 11. Six-pass preparation sequence

1. **PASS 1 — OBSERVE / ANCHOR**  
   system identity, law, live authority, repo truth

2. **PASS 2 — CORPUS / AUTHORITY MAPPING**  
   map every system surface to current external constraints, project decisions, conflicts, tests and gaps without subtracting target systems

3. **PASS 3 — BOOTSTRAP REFERENCE COMPILER**  
   establish the smallest self-consistent compiler/factory machinery required to begin materialization

4. **PASS 4 — ASCII / LANGUAGE KERNEL**  
   grammar, parser, AST, resolution, typed semantic kernel

5. **PASS 5 — FACTORY + LOWERING CONTRACTS**  
   stations, backend contracts, capability graph, planning, proof and codegen boundaries

6. **PASS 6 — PROVE ONE COMPLETE VERTICAL SLICE**  
   source -> compile -> generated WebApp -> execute/probe -> evidence -> observed ASCII

Only after these preparation passes should the final ASCII Systems Diagram be forged into the system-prompt file used to direct Claude Code / Fable 5.1 to implement the repository.

## 12. Pass 1 closure

`[RUN]` repository truth re-observed  
`[RUN]` old reference-warehouse state retired from current tree  
`[RUN]` Factory/Compiler identity split preserved  
`[RUN]` two manufactured objects preserved  
`[RUN]` complete target capability universe preserved  
`[RUN]` live-reference authority law established  
`[RUN]` exact-clause-link requirement established  
`[RUN]` stale-snapshot-as-authority framing retired  
`[RUN]` unresolved mechanisms remain explicit gaps

PASS 1 closes only as an architectural/authority anchor.
It does not claim the compiler exists.
