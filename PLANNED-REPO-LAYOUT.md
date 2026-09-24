# FactTest Planned Repository Layout

STATUS: PASS 3  
DATE: 2026-09-23

This is an ownership/dependency plan for Fable 5.1.
It is not permission to create these paths before the final manufacturing prompt.

No implementation directories exist in the repository at Pass 3.

## 1. Ownership zones

Conceptual future repository:

\`\`\`text
FactTest.git
|
+-- project law / design passes
|
+-- compiler foundation
|     foundational IDs
|     spans/source identities
|     artifact envelopes
|     diagnostic structures
|
+-- source/front-end
|     ASCII lexer/parser
|     source-unit handling
|
+-- semantic kernel
|     System AST
|     resolution
|     typed System IR
|     effects/ownership
|     proof obligations
|
+-- capability model
|     semantic capabilities
|     implementation capabilities
|     machine observations
|     admissions
|
+-- implementation contracts
|     backend/precondition/layout/failure contracts
|
+-- planning
|     objective
|     candidate-plan generation/search
|
+-- verifier
|     independent candidate verification
|
+-- codegen
|     Rust/Wasm emission
|     JS host membrane generation
|     WebApp shell generation
|
+-- factory machinery
|     station registry
|     fixtures
|     workpiece routing
|     receipts
|     integration/re-inspection
|
+-- tests / fixtures
|
'-- evidence
      schemas
      deterministic test outputs
      runtime observations
\`\`\`

Concrete crate/directory names are deferred.

## 2. Dependency direction

Preferred dependency law:

\`\`\`text
FOUNDATION
    ^
DIAGNOSTICS / ARTIFACT CONTRACTS
    ^
SOURCE
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

Factory machinery is a separate ownership plane:

\`\`\`text
FACTORY LAW
    |
    v
FACTORY ROUTER / STATIONS / WORKPIECES
    |
    v
mutates FactTest.git under receipts and verification
\`\`\`

Compiler backends do not become Factory stations merely because both are "implementation machinery".

## 3. First-party crate/module law

Project decision:

- no third-party crates
- first-party crates/modules may be used where they enforce architectural boundaries

A future split is justified when it makes forbidden dependencies structurally impossible.

A split is not justified merely for aesthetics.

## 4. Forbidden dependencies

The future repository must make these paths illegal or visibly exceptional:

\`\`\`text
codegen -> source-language ownership
planner -> source mutation
planner -> verifier internals
verifier -> planner heuristics
host adapter -> semantic authority
runtime evidence -> silent source rewrite
generated WebApp -> authoritative repository mutation
compiler backend -> Factory-station identity
Factory receipt -> compiler-proof substitution
compiler receipt -> Factory-integration substitution
\`\`\`

## 5. Host boundary

Host/process/browser I/O remains outside the no_std semantic kernel.

Future host responsibilities include:

- reading source/project state
- Git interaction
- allocating compiler workspace
- persisting artifacts
- invoking browser/runtime probes
- collecting evidence

The kernel consumes explicit data structures/bytes representing those inputs.

## 6. Generated WebApp ownership zones

Conceptual generated bundle:

\`\`\`text
object B
|
+-- Wasm semantic/runtime artifacts
+-- JavaScript host membrane
+-- browser capability adapters
+-- application HTML/shell
+-- manifest
+-- service worker/cache lifecycle
+-- runtime evidence output
'-- lineage/plan/verification metadata
\`\`\`

These are generated-object zones, not FactTest compiler-source ownership zones.

## 7. Pass-3 repository invariant

At the end of Pass 3 the current repository must still contain no implementation tree.

Expected current state is documentation/control surfaces only.

Pass 4 and Pass 5 continue architectural definition before the final Fable manufacturing prompt authorizes implementation.
