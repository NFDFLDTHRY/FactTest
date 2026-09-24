# FactTest Language Test Ladder

STATUS: PASS 4  
DATE: 2026-09-23

These tests define the language reliability target for the eventual Pass-4 implementation.

No parser/compiler source exists yet, so these are obligations, not current execution claims.

## L0 - minimal source unit

Input contains exactly one system semantic island.

Expected:
- parses
- one SystemId
- empty semantic body allowed in ANALYZE mode

## L1 - whitespace invariance

Apply arbitrary non-semantic whitespace changes outside and around semantic islands.

Expected:
- identical resolved semantic graph

## L2 - frame-glyph invariance

Transform ASCII frames to Unicode box drawing and back without changing semantic islands.

Expected:
- identical resolved semantic graph

## L3 - visual relocation invariance

Move component artwork and semantic islands to different visual positions while preserving island content.

Expected:
- identical resolved semantic graph

## L4 - prose invariance

Insert/remove/edit ordinary prose outside semantic islands.

Expected:
- executable semantic graph unchanged

## L5 - duplicate identity rejection

Declare the same ComponentId twice in one namespace/scope.

Expected:
- deterministic duplicate-identity diagnostic with both spans

## L6 - unresolved endpoint rejection

DATA relation references nonexistent port.

Expected:
- unresolved-reference diagnostic

## L7 - ambiguity rejection

Create imported public identities such that an unqualified reference has multiple valid resolutions.

Expected:
- ambiguity diagnostic
- compiler does not select one

## L8 - direction check

Use input port as DATA source or output port as DATA destination.

Expected:
- direction diagnostic

## L9 - type compatibility

Connect ports with distinct nominal TypeIds and no alias/refinement compatibility.

Expected:
- type mismatch

## L10 - private boundary protection

External source/system references private subsystem port/object.

Expected:
- visibility error

## L11 - incomplete abstract boundary

Declare refinement where abstract public contract lacks required externally visible effect/capability needed by concrete subsystem.

Expected:
- refinement failure or explicit GAP in analysis
- BUILD cannot silently accept it

## L12 - compatible refinement

Concrete subsystem satisfies abstract public ports/types/effects/capabilities/invariants.

Expected:
- refinement obligation passes

## L13 - effect escape

Concrete/private internals produce externally relevant effect not admitted by abstract contract.

Expected:
- refinement/effect diagnostic

## L14 - GAP preservation

Declare semantic object plus GAP status.

Expected:
- parse/resolution preserves object and status
- ANALYZE returns partial graph

## L15 - execution-critical GAP blocks build

Mark required implementation/capability contract unresolved.

Expected:
- ANALYZE succeeds with diagnostic graph
- BUILD fails explicitly

## L16 - relation-kind separation

Represent same endpoint pair once as DATA and once as SEQUENCE.

Expected:
- distinct semantic relations
- renderer does not collapse them

## L17 - governance preservation

Round trip OBS/RUN/NEW/GAP/ERR/UNK statuses.

Expected:
- exact status/object relation preserved

## L18 - prose cannot create semantics

Write prose: "this component requires WebGPU" with no semantic island.

Expected:
- no WEBGPU capability requirement appears in AST

Add:

\`\`\`text
@{pin component WEBGPU}
\`\`\`

or appropriate semantic capability directive.

Expected:
- explicit implementation constraint appears

## L19 - canonical render round trip

For every valid test AST:

\`\`\`text
parse(render(AST)) == AST
\`\`\`

## L20 - canonical render idempotence

\`\`\`text
render(parse(render(AST))) == render(AST)
\`\`\`

## L21 - span integrity

Change presentation before/after semantic islands.

Expected:
- SourceId/byte spans always identify the actual authored island
- diagnostics do not point to stale normalized offsets

## L22 - semantic island escaping

Presentation contains escaped literal \`@@{\`.

Expected:
- no semantic statement extracted

Unescaped \`@{\` malformed/unclosed:

Expected:
- scanner/parse diagnostic

## L23 - unknown keyword rejection

Semantic island uses a keyword from an unsupported/newer language version.

Expected:
- explicit unknown-keyword/version diagnostic
- statement is not ignored

## L24 - source-order non-semantics

Reorder declarations/relations where no sequence relation exists.

Expected:
- identical semantic graph after canonical normalization

## L25 - sequence explicitness

Visually place B below A without a sequence island.

Expected:
- no sequencing semantic relation

Add explicit sequence relation.

Expected:
- sequence appears

## L26 - ownership mode distinction

Create otherwise identical DATA relations with move/copy/borrow/share/observe.

Expected:
- distinct typed transfer semantics

## L27 - source-unit path independence

Map the same SourceUnit bytes/SystemId from different host filenames.

Expected:
- semantic system identity unchanged

## L28 - private visual exposure

Draw a private object outside the subsystem's visual box while leaving semantic containment/visibility unchanged.

Expected:
- object remains private
- proves geometry is non-authoritative

## L29 - recursive refinement

Abstract subsystem refined by concrete subsystem containing another abstract/refined subsystem.

Expected:
- obligations checked recursively without flattening semantic identity

## L30 - presentation equivalence property

For every permitted presentation transformation T:

\`\`\`text
Semantic(Parse(S)) == Semantic(Parse(T(S)))
\`\`\`

Generate/fuzz:
- whitespace
- box widths/heights
- ASCII/Unicode frames
- decorative arrow routing
- prose insertion
- safe visual reordering

Expected:
- semantic equality

## L31 - semantic mutation sensitivity

Change one semantic island while leaving artwork identical.

Expected:
- semantic graph changes exactly according to the explicit semantic delta

This ensures the picture does not override the contract.

## L32 - human/AI canonical witness

Given authored ASCII:

1. parse/resolve
2. render canonical semantic ASCII
3. present original and canonical forms for inspection

Expected:
- every compiler-relevant fact is visible in canonical output
- no hidden semantic metadata is required to understand the interpreted graph

## L33 - no semantic guessing

Construct visually obvious but semantically incomplete connections.

Example:
two aligned boxes joined by a drawn arrow but no DATA/SEQUENCE relation.

Expected:
- compiler does not invent a relation
- optional future visual linter may warn, but semantic graph remains explicit

## L34 - invariant kernel boundedness

Attempt user-defined function/loop/host call inside invariant expression.

Expected:
- syntax/semantic rejection

Use core finite predicates/combinators.

Expected:
- accepted typed invariant tree

## L35 - analysis/build distinction

Feed a well-formed diagram with explicit unresolved issues.

Expected:
- ANALYZE preserves partial graph, statuses and diagnostics
- BUILD reports unresolved execution-critical obligations
- neither mode mutates source to guess a repair

## Closure property

The core language reliability property is:

\`\`\`text
For all T declared presentation-preserving:

Semantic(Parse(S))
    ==
Semantic(Parse(T(S)))
\`\`\`

The abstraction reliability property is:

\`\`\`text
Concrete refines Abstract
only when the complete public contract is preserved.
\`\`\`

Together these permit strong human/AI abstraction without semantic guessing.

D27 ANNOTATION (language-evolution test obligations, D27-FOUNDATION-CLOSURE-ALIGNMENT; inserted by station S-LANGUAGE-LAW;
insertion-only; obligations for the language-evolution contract of design/foundation-closure/FOUNDATION-CLOSURE-TARGET.md section 4 - L36 and
L37 are implemented and witnessed by D27, L38-L43 are obligations, not current execution claims):

- L36 corpus-oracle reproduction: every entry of tests/closure/registers/language-corpus.json run through the compiler
  under test reproduces the frozen expected table of its language version (tests/closure/language-corpus.mjs --check).
- L37 vocabulary manifest equality: the manifest derived from the compiler source equals the committed manifest and every
  `@{keyword` form of ASCII-GRAMMAR.md is accepted by the parser and vice versa; the grammar's declared LANGUAGE VERSION
  equals the parser's (tests/closure/language-manifest.mjs --check --grammar).
- L38 version identification: a source unit written for LANGUAGE N+1 is recognized as such and refused by Compiler N with
  an explicit version diagnostic (requires a version statement: LANGUAGE 2).
- L39 evidence/source role separation: an observed ASCII unit is refused as authored source by ANALYZE and BUILD
  (requires a source-role statement or a non-source evidence dialect: LANGUAGE 2).
- L40 generator-based presentation equivalence: for a generated family of presentation-preserving transformations over the
  corpus, canonical renderings are identical (the closure property of L30 by generation, not by fixed fixtures).
- L41 derived unknown-keyword attack set: every keyword of manifest N+1 absent from manifest N, submitted to Compiler N in
  a minimal island, is PARSE_UNKNOWN_KEYWORD; every ambiguity fixture of N stays ambiguous under N+1.
- L42 migration record round trip: every corpus row whose expectation changes between N and N+1 has a migration record;
  Compiler N+1 reproduces the recorded new expectation; no frozen row is edited.
- L43 multi-workspace composition: a system exceeding one kernel workspace (compiler/foundation/src/limits.rs) is described
  as subsystems compiled separately and imported by their public contracts, with the same resolved semantic graph as a
  single-workspace equivalent where one fits.
