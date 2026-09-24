# FactTest Planned Repository Layout

STATUS: PASS 5  
DATE: 2026-09-23

This is the repository ownership/dependency plan for the eventual Fable 5.1 materialization.
It is not permission to create implementation paths before the final manufacturing prompt.

## 1. Planned top-level ownership zones

\`\`\`text
FactTest.git
|
+-- law/
|     Factory/project constitutional surfaces
|
+-- design/
|     pass outputs and architecture/authority contracts
|
+-- compiler/
|   +-- foundation/
|   +-- source/
|   +-- semantic/
|   +-- capability/
|   +-- implementation/
|   +-- planning/
|   +-- verifier/
|   '-- codegen/
|
+-- host/
|     generated/runtime host templates and browser adapter machinery
|
+-- factory/
|   +-- registry/
|   +-- router/
|   +-- stations/
|   '-- receipts/
|
+-- fixtures/
+-- tests/
'-- evidence/
\`\`\`

Exact crate/module filenames remain an implementation decision constrained by these ownership zones.

## 2. Compiler dependency DAG

\`\`\`text
foundation
    ^
source
    ^
semantic
    ^
capability
    ^
implementation
    ^
planning -----------+
                    |
semantic obligations+--> verifier
implementation -----+
admission contracts-+
                    |
                    v
                 codegen
\`\`\`

Codegen accepts VerifiedStrategy, not CandidatePlan or CandidateStrategy. A non-adaptive target is a one-variant VerifiedStrategy.

## 3. Forbidden dependencies

- codegen -> mutate source semantics
- planner -> mutate source
- planner -> verifier internals
- verifier -> planner heuristics
- host adapter -> semantic authority
- runtime evidence -> silent source rewrite
- generated WebApp -> authoritative repo mutation
- compiler backend -> Factory-station identity
- FactoryReceipt -> compiler proof substitution
- CompilerReceipt -> Factory integration substitution
- RuntimeEvidence -> source-semantics substitution

## 4. Factory plane

Factory machinery depends on project law/contracts and workpiece representations.

It is not imported by compiler semantic code merely to perform normal compilation.

Compiler artifacts may be inputs to Factory stations, but the planes remain distinct.

## 5. No third-party crates

All compiler/factory Rust crates are first-party unless the human explicitly changes project law.

Rust core/optional alloc/toolchain builtins are governed separately by the toolchain/bootstrap contracts.

A crate split should enforce dependency law or ownership boundaries, not aesthetics.

## 6. Current-state invariant

At Pass 5 completion the canonical repository still contains design/control surfaces only.

No implementation directory in this document is materialized yet.

Pass 6 will prove one vertical slice in the architecture/design surface before the final Fable manufacturing prompt authorizes repository implementation.
