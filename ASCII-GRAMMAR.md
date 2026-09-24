# FactTest ASCII Grammar

STATUS: PASS 4 LANGUAGE KERNEL  
DATE: 2026-09-23

This grammar defines the semantic anchor layer embedded in ASCII Systems Diagrams.

It is intentionally line-oriented, explicit, and geometry-independent.

## 1. Semantic-island scanner

The semantic scanner recognizes islands delimited by:

\`\`\`text
@{
...
}
\`\`\`

For the Pass-4 kernel, each semantic island is single-line in source bytes.

Canonical form:

\`\`\`text
@{statement}
\`\`\`

Whitespace may appear after \`@{\`, before \`}\`, and between tokens.

Everything outside semantic islands is presentation/prose.

A literal presentation sequence beginning with \`@{\` is escaped as:

\`\`\`text
@@{
\`\`\`

and has no semantic meaning.

Nested semantic islands are invalid.

Unclosed semantic islands are parse errors.

## 2. Lexical forms

Identifier:

\`\`\`text
[A-Za-z_][A-Za-z0-9_-]*
\`\`\`

Qualified system/object path:

\`\`\`text
system::component
\`\`\`

Port reference:

\`\`\`text
component.port
system::component.port
\`\`\`

Quoted display/prose string:

\`\`\`text
"characters with standard backslash escapes"
\`\`\`

Reserved punctuation:

\`\`\`text
@{ }
: =
->
::
.
(
)
,
\`\`\`

Semantic keywords are ASCII and case-sensitive.

Status values are uppercase.

## 3. Source-unit declaration

Exactly one system declaration exists per source unit:

\`\`\`text
@{system <SystemId> ["Display Label"]}
\`\`\`

Example:

\`\`\`text
@{system vision "Vision System"}
\`\`\`

A source unit may import another system's public interface:

\`\`\`text
@{use <SystemId>}
\`\`\`

File paths are host concerns and are not SystemId semantics.

## 4. Type declarations

Nominal type:

\`\`\`text
@{type <TypeId>}
\`\`\`

Alias:

\`\`\`text
@{alias <TypeId> = <TypeRef>}
\`\`\`

Examples:

\`\`\`text
@{type VideoFrame}
@{type EncodedVideo}
@{alias CameraFrame = VideoFrame}
\`\`\`

Aliases resolve to one nominal type identity for compatibility.

Pass 4 does not define physical memory layout.

## 5. Components and subsystems

Component:

\`\`\`text
@{component <ComponentId> ["Display Label"]}
\`\`\`

Subsystem:

\`\`\`text
@{subsystem <ComponentId> ["Display Label"]}
\`\`\`

Subsystem means the component may contain private/public internal semantic objects and participate in refinement.

Containment:

\`\`\`text
@{contains <SubsystemRef> -> <ObjectRef>}
\`\`\`

No containment is inferred from visual box nesting.

## 6. Ports

Port:

\`\`\`text
@{port <ComponentRef>.<PortId> <in|out>: <TypeRef> <public|private>}
\`\`\`

Examples:

\`\`\`text
@{port camera.frame out: VideoFrame public}
@{port encoder.frame in: VideoFrame public}
\`\`\`

Public boundary ports require explicit direction, type and visibility.

Duplicate port identities in the same component are errors.

## 7. Resources

Resource declaration:

\`\`\`text
@{resource <ResourceId> [: <TypeRef>]}
\`\`\`

Logical owner:

\`\`\`text
@{owns <ComponentRef> -> <ResourceRef>}
\`\`\`

A resource has at most one logical owner unless its declared semantics explicitly permit shared ownership in a future language version.

## 8. Data relations

Data relation:

\`\`\`text
@{data <RelationId> <OutputPortRef> -> <InputPortRef> mode=<TransferMode>}
\`\`\`

TransferMode:

\`\`\`text
move
borrow
copy
share
observe
\`\`\`

Requirements:

- source endpoint resolves to an output port
- destination resolves to an input port
- resolved nominal types are compatible
- relation ID is unique in Relation namespace

No connection is inferred from drawn lines.

## 9. Sequence relations

\`\`\`text
@{sequence <RelationId> <ObjectRef> -> <ObjectRef>}
\`\`\`

Meaning:

left-hand semantic event/operation/component precedes the right-hand target wherever the surrounding operation model gives those nodes execution meaning.

Sequence is explicit only when causal ordering is part of the system contract.

Visual top-to-bottom layout does not imply sequence.

## 10. Effects

Declare named effect:

\`\`\`text
@{effect <EffectId>}
\`\`\`

Assign effect:

\`\`\`text
@{uses <ObjectRef> <EffectRef>}
\`\`\`

Effects describe externally observable/system-significant semantic effects without choosing an implementation backend.

## 11. Semantic capabilities

Declare/identify semantic capability:

\`\`\`text
@{capability <CapabilityId>}
\`\`\`

Require semantic capability:

\`\`\`text
@{requires <ObjectRef> <CapabilityRef>}
\`\`\`

Example:

\`\`\`text
@{capability VIDEO_ENCODE}
@{requires encoder VIDEO_ENCODE}
\`\`\`

## 12. Explicit implementation pins

A user may intentionally constrain an object to a named implementation capability:

\`\`\`text
@{implementation <ImplementationId>}
@{pin <ObjectRef> <ImplementationRef>}
\`\`\`

Example:

\`\`\`text
@{implementation WEBCODECS}
@{pin encoder WEBCODECS}
\`\`\`

Implementation pins are explicit project constraints.
No API/backend name is inferred from prose or a semantic capability name.

## 13. Refinement

\`\`\`text
@{refines <ConcreteRef> -> <AbstractRef>}
\`\`\`

The concrete object must satisfy [REFINEMENT-LAW.md](REFINEMENT-LAW.md).

A refinement statement does not itself prove refinement.
It creates the obligation.

## 14. Invariants

\`\`\`text
@{invariant <InvariantId> <InvariantExpression>}
\`\`\`

Core expressions:

\`\`\`text
connected(<PortRef>)
exactly_one_producer(<InputPortRef>)
has_consumer(<OutputPortRef>)
type_equal(<PortRef>, <PortRef>)
owns(<ComponentRef>, <ResourceRef>)
requires(<ObjectRef>, <CapabilityRef>)
uses_effect(<ObjectRef>, <EffectRef>)
sequence_before(<ObjectRef>, <ObjectRef>)
reachable(<ObjectRef>, <ObjectRef>)
acyclic(<ScopeRef>)
public(<ObjectRef>)
refines(<ConcreteRef>, <AbstractRef>)

all(<Expr>, ...)
any(<Expr>, ...)
not(<Expr>)
\`\`\`

No user-defined functions, loops, mutation, host access or arbitrary computation exist in the Pass-4 invariant kernel.

## 15. Tests

Test declaration:

\`\`\`text
@{test <TestId> <static|runtime|property>}
\`\`\`

Test relation:

\`\`\`text
@{tests <TestRef> -> <InvariantOrContractRef>}
\`\`\`

A test may target an invariant or another explicitly testable contract object defined by later language versions.

## 16. Evidence requirements

Evidence declaration:

\`\`\`text
@{evidence <EvidenceId> <static_proof|runtime_probe|artifact|human_observation>}
\`\`\`

Witness relation:

\`\`\`text
@{witnesses <EvidenceRef> -> <TestRef>}
\`\`\`

Evidence declarations state required witness kind.
They are not themselves successful evidence.

## 17. Governance status

\`\`\`text
@{status <ObjectRef> <OBS|RUN|NEW|GAP|ERR|UNK> ["Reason"]}
\`\`\`

Standalone issue:

\`\`\`text
@{issue <IssueId> <OBS|RUN|NEW|GAP|ERR|UNK> "Description"}
\`\`\`

Status is governance semantics, not runtime control flow.

## 18. Authority reference

A semantic object may carry an explicit authority reference:

\`\`\`text
@{authority <ObjectRef> "<URL>"}
\`\`\`

For externally constrained technical claims, the URL should follow the live deep-link law in REFERENCE-AUTHORITY.md.

Authority metadata does not substitute for an invariant/test.

## 19. Public/private rule

Objects default to private unless the directive explicitly declares public visibility where the object kind supports it.

Ports declare visibility directly.

A future language version may add explicit public system objects, but no external source unit may reference an undeclared/private identity.

## 20. Resolution

Within one source unit:

- component IDs resolve in Component namespace
- port IDs resolve relative to a component
- type/effect/capability/implementation/etc IDs resolve in their distinct namespaces

Imported public identities use:

\`\`\`text
SystemId::ObjectId
SystemId::ComponentId.PortId
\`\`\`

Ambiguous references are errors.
There is no "nearest visual object" resolution.

## 21. Semantic extraction order

The front end:

1. assigns SourceId
2. scans source bytes for semantic islands
3. records exact Span for each island
4. parses islands without using diagram geometry
5. builds namespace declarations
6. resolves references
7. checks duplicate/conflicting declarations
8. checks structural/type/visibility rules
9. builds System AST / resolved semantic graph
10. emits diagnostics and canonical rendering

Source-order is retained for diagnostics/presentation lineage but does not create semantic ordering except where a directive says so.

## 22. Extensibility law

New semantic keywords/predicates require an explicit language/schema version change.

Unknown semantic keywords are errors, not ignored extension points.

This prevents older compilers from silently misinterpreting newer source.


## 23. Metrics and optimization objectives (Pass 6 amendment)

Optimization objectives that can change generated machinery are visible in the human/AI ASCII source.

Metric declaration:

```text
@{metric <MetricId> <UnitId> ["Description"]}
```

Objective declaration:

```text
@{objective <ObjectiveId>}
```

Ordered goal:

```text
@{goal <ObjectiveRef> <PriorityInteger> <minimize|maximize> <MetricRef>}
```

Hard metric constraint:

```text
@{hard <ObjectiveRef> <MetricRef> <at_most|at_least|equal> <Number>}
```

Example:

```text
@{metric preference_rank ordinal "commissioning preference only; not performance"}
@{objective commissioning}
@{goal commissioning 1 minimize preference_rank}
```

Rules:
- MetricId and ObjectiveId are separate namespaces.
- goal priorities within one objective are unique positive integers.
- lower priority integer is evaluated first.
- an objective cannot reference an undeclared MetricId.
- metric units/semantics must be explicit.
- declaring an objective does not manufacture missing measurements.
- unknown cost remains unknown.
- canonical rendering includes metric/objective/goal/hard statements.

## 24. Objective visibility law

If a preference can alter the generated implementation strategy, it is source-visible.

Host-only hidden preferences are legal only when they provably cannot change semantic/generated machinery.

D27 ANNOTATION (language law amendment, D27-FOUNDATION-CLOSURE-ALIGNMENT; inserted by station S-LANGUAGE-LAW under the
language-evolution contract of design/foundation-closure/FOUNDATION-CLOSURE-TARGET.md section 4; insertion-only: no earlier line of this
grammar changed):

- LANGUAGE VERSION 1 is the language this grammar (sections 1-24) describes and the compiler at the D27 base implements
  (compiler/source: the 31 statement keywords, the 12 invariant predicates, the vocabulary tables, the fixed invariant
  kernel).  Its machine-readable form is tests/closure/language-manifest-v1.json, DERIVED from the compiler source by
  tests/closure/language-manifest.mjs and checked against this text on every run: a keyword this grammar writes that
  the parser refuses, or the reverse, is a defect, never an extension.  A grammar text whose declared LANGUAGE VERSION no
  activated compiler implements is refused by the station (invariant LANGUAGE VERSION BOUND).
- A source unit carries no version statement in LANGUAGE VERSION 1; absence means version 1.  A version statement is
  itself a new keyword and therefore a language version change.
- The compatibility corpus of LANGUAGE VERSION 1 is tests/closure/registers/language-corpus.json with its frozen expected
  table tests/closure/language-corpus-v1.json (tests/closure/language-corpus.mjs): status, diagnostic codes, canonical
  rendering identity and, for BUILD entries, strategy-data identity and bundle certificate per entry.  A later compiler
  that promises compatibility reproduces every row or names the row in a migration record; the frozen table is never
  edited.
- Section 22 (extensibility law) is realized by the contract: COMPILER N DEFINES LANGUAGE N; a proposal for LANGUAGE N+1
  is written in LANGUAGE N plus non-semantic presentation and NEW SYNTAX MAY NOT AUTHORIZE ITSELF; only the activation of
  Compiler N+1 by the Factory makes LANGUAGE N+1 authoritative (S-LANGUAGE-LAW version-change mode, coupled to S-RUST and
  the evolution qualification: corpus of N reproduced, manifest of N+1 derived, new-syntax tests, unknown-keyword attacks
  from manifest N+1 minus manifest N refused by Compiler N, migration records, canonical round trip).
