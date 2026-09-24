# FactTest Pass 4 - ASCII / Language Kernel

STATUS: PASS 4 EXECUTED  
DATE: 2026-09-23  
BASE: 1376cb400d9641a9c58ca0f6eb53a44134e40ece

## 0. Purpose

Pass 4 defines ASCII Systems Diagrams as both:

1. the authoritative source language of FactTest; and
2. the shared human/AI interaction layer where systems are discussed, assembled, abstracted, corrected, inspected, and refined.

The language must therefore preserve visual freedom and conversational usefulness without allowing hidden semantic guessing.

Central law:

\`\`\`text
ABSTRACT THE PICTURE.
ABSTRACT THE IMPLEMENTATION.
NEVER ABSTRACT THE CONTRACT.
\`\`\`

## 1. Reliability criterion: unique elaboration

FactTest accepts abstraction only while the source elaborates to exactly one semantic graph.

\`\`\`text
ASCII SOURCE
    |
    v
extract semantic islands
    |
    v
parse + resolve + type/structure check
    |
    +-- zero legal interpretations ----> ERROR
    |
    +-- exactly one --------------------> ACCEPT
    |
    '-- more than one -----------------> AMBIGUOUS ERROR
\`\`\`

Invariants:

- ambiguity is a compile error.
- AI intent is never hidden parser input.
- "probably means" is not a compiler operation.
- layout may help humans and AIs reason but may not decide executable meaning.
- every fact that can change compilation must be visible in the ASCII source.

## 2. Semantic islands

The source may contain arbitrary ASCII/Unicode diagram artwork and prose.

Compiler semantics are introduced only by explicit semantic islands:

\`\`\`text
@{ ... }
\`\`\`

Example:

\`\`\`text
+------------------------------+
| Camera                       |
| @{component camera "Camera"} |
| @{port camera.frame out: VideoFrame public}
| @{requires camera VIDEO_CAPTURE}
+---------------+--------------+
                |
                | @{data e1 camera.frame -> encoder.frame mode=move}
                v
+-------------------------------+
| Encoder                       |
| @{component encoder "Encoder"}|
| @{port encoder.frame in: VideoFrame public}
| @{requires encoder VIDEO_ENCODE}
+-------------------------------+
\`\`\`

Everything outside semantic islands is presentation/prose unless another explicit language rule states otherwise.

This keeps the human/AI surface visual while making compiler authority explicit.

## 3. Four semantic layers

The language separates:

### A. Structural semantics
- systems
- components/subsystems
- ports
- resources
- containment
- typed connections
- causal/sequence relations

### B. Contract semantics
- nominal types
- ownership/transfer mode
- effects
- semantic capability requirements
- optional implementation pins
- invariants
- refinement contracts
- public/private visibility

### C. Governance semantics
- OBS / RUN / NEW / GAP / ERR / UNK
- issues/gaps
- tests
- evidence requirements
- authority references
- project ownership

### D. Presentation/prose
- box glyphs
- arrows drawn for humans
- whitespace
- alignment
- titles
- comments
- rationale
- explanations
- decorative grouping

Only A-C may influence compiler semantics.

D remains visible interaction material but is non-executable.

## 4. Geometry is non-authoritative

FactTest does not use line-following, box touching, arrow direction inferred from glyphs, spatial proximity, or crossing characters as semantic authority.

Therefore these may be presentation-equivalent:

\`\`\`text
+---+
| A |
+-+-+
  |
  v
+---+
| B |
+---+
\`\`\`

\`\`\`text
[A] ----> [B]
\`\`\`

if the same semantic islands are present.

A visual arrow with no semantic relation is only presentation.

A semantic relation may exist even if the human rendering chooses not to draw a connecting line.

A later non-authoritative visual-consistency linter may warn when presentation and semantic anchors appear inconsistent, but it may never define semantics.

## 5. Explicit relation kinds

A universal arrow is insufficient.

Core relation kinds include:

- DATA
- SEQUENCE
- OWNS
- CONTAINS
- REQUIRES
- EFFECT
- REFINES
- TESTS
- WITNESSES

Each relation is represented by an explicit directive and, where it needs independent status/evidence, its own identity.

Visual arrow style does not determine relation kind.

## 6. Recursive subsystem abstraction

Any internal subgraph may be hidden behind a subsystem contract.

\`\`\`text
detailed internal graph
        |
        | refinement
        v
+----------------------+
| abstract subsystem X |
| public inputs        |
| public outputs       |
| effects/capabilities |
| invariants           |
| failures             |
+----------------------+
\`\`\`

Abstraction is valid only when the public contract is complete enough that outside nodes do not need private internals to determine legality.

External references to private identities are invalid.

See [REFINEMENT-LAW.md](REFINEMENT-LAW.md).

## 7. Explicit boundaries, conservative inference

Public subsystem boundaries require explicit:

- port identity
- direction
- nominal type
- visibility
- externally observable effects/capability requirements
- required ordering/contract where semantically relevant

Pass 4 permits no hidden public-port type inference.

Internal inference may be added later only when:

1. exactly one solution exists;
2. the inferred fact appears in an inspectable compiler artifact/canonical rendering; and
3. removing inference would not change source meaning.

## 8. Ownership and transfer modes

DATA relations carry an explicit transfer mode:

- move
- borrow
- copy
- share
- observe

CONTROL is represented as its own semantic relation/effect rather than being inferred from an arrow.

The exact backend realization of these modes belongs to Pass 5.

Pass 4 defines their system-level meaning:

- move: destination becomes the logical owner of the transferred value/resource.
- borrow: destination receives temporary use while source ownership remains.
- copy: destination receives an independent semantic copy.
- share: multiple parties may access the same logical resource under an explicit sharing contract.
- observe: destination receives read-only observation with no ownership/control implication.

## 9. Effects and capabilities

Effects and capabilities are distinct named domains.

Example:

\`\`\`text
@{effect STORAGE_WRITE}
@{capability VIDEO_ENCODE}

@{uses encoder STORAGE_WRITE}
@{requires encoder VIDEO_ENCODE}
\`\`\`

A semantic capability states what the system requires.

An implementation pin explicitly restricts how it may be implemented:

\`\`\`text
@{pin encoder WEBCODECS}
\`\`\`

Browser/API names do not enter source semantics accidentally. They enter only through an explicit implementation pin or later lowering from a semantic capability.

## 10. Nominal type kernel

Pass 4 uses nominal system types.

\`\`\`text
@{type VideoFrame}
@{type EncodedVideo}
\`\`\`

Ports refer to named types.

Connection compatibility requires identical resolved nominal TypeId unless an explicit alias/refinement relation says otherwise.

\`\`\`text
@{alias CameraFrame = VideoFrame}
\`\`\`

Pass 4 does not define physical memory layout.
Pass 5 implementation contracts own representation/layout.

This keeps system semantics independent of backend ABI details.

## 11. Invariants

Arbitrary prose is not executable proof input.

Formal invariants use a deliberately small expression language.

Initial predicate family:

- connected(port)
- exactly_one_producer(port)
- has_consumer(port)
- type_equal(port, port)
- owns(component, resource)
- requires(component, capability)
- uses_effect(component, effect)
- sequence_before(node, node)
- reachable(node, node)
- acyclic(scope)
- public(object)
- refines(concrete, abstract)

Boolean composition:

- all(...)
- any(...)
- not(...)

No arbitrary loops, function definitions, host calls, mutation, or general-purpose computation exist in invariant expressions.

Example:

\`\`\`text
@{invariant inv_frame exactly_one_producer(encoder.frame)}
\`\`\`

The predicate vocabulary may expand only through an explicit language-version change.

## 12. Tests and evidence as graph objects

Tests and evidence requirements are named semantic objects.

\`\`\`text
@{test t_frame static}
@{tests t_frame -> inv_frame}

@{evidence ev_frame runtime_probe}
@{witnesses ev_frame -> t_frame}
\`\`\`

A test states how an invariant/contract will be checked.

An evidence requirement states what kind of witness must exist.

Runtime evidence does not rewrite source semantics.
It satisfies/fails obligations and may cause observed ASCII status/state updates.

## 13. Governance states

Governance status is first-class but not runtime control flow.

\`\`\`text
@{status encoder GAP "implementation not selected"}
@{status camera OBS "observed in target model"}
\`\`\`

Allowed states:

- OBS
- RUN
- NEW
- GAP
- ERR
- UNK

A standalone governance issue may be declared:

\`\`\`text
@{issue gap_allocator GAP "first-party allocator unresolved"}
\`\`\`

Status does not mean "execute if OBS" or "skip if GAP".
Build/analyze rules decide what unresolved state is admissible.

## 14. Analyze mode vs build mode

FactTest must preserve incomplete workshop diagrams.

Therefore:

\`\`\`text
PARSEABLE
    !=
RESOLVED
    !=
WELL_TYPED
    !=
PROVABLE
    !=
BUILDABLE
\`\`\`

ANALYZE mode may return a partial semantic graph with GAP/UNK/ERR diagnostics and preserved source objects.

BUILD mode rejects unresolved states that are execution-critical.

This keeps ASCII useful during human/AI design instead of requiring every conversation to already be a finished program.

## 15. Source units

A project is a set of source units.

Each source unit defines exactly one semantic system identity:

\`\`\`text
@{system vision "Vision System"}
\`\`\`

A source unit may reference another public system interface:

\`\`\`text
@{use storage}
\`\`\`

System identity is semantic and does not depend on a file path.

The host maps SourceId/files to source units.
The language resolves SystemId identities.

A source unit cannot directly reference private identities in another system.

## 16. Namespaces

These namespaces remain distinct:

- System
- Component
- Port
- Type
- Resource
- Effect
- Capability
- Implementation
- Invariant
- Test
- Evidence
- GovernanceIssue
- Relation

Human display labels may repeat.
Semantic IDs within the same namespace/scope may not.

Resolution produces the typed identity domains established by Pass 3.

## 17. Canonical semantic rendering

The compiler must eventually provide a deterministic canonical ASCII rendering of the semantic graph.

The renderer is a witness of what the compiler understood.

Required laws:

\`\`\`text
parse(render(AST)) == AST
\`\`\`

and

\`\`\`text
render(parse(render(AST))) == render(AST)
\`\`\`

The original authored ASCII remains source of record.
The canonical rendering is an inspection/equivalence witness, not a silent replacement.

The canonical rendering must remain human/AI readable and must contain all semantic islands needed to reconstruct the AST without hidden metadata.

## 18. Natural language barrier

Natural-language prose may explain intent but may not silently create semantics.

These are non-semantic unless explicitly promoted:

- NOTE
- COMMENT
- RATIONALE
- DESCRIPTION
- ordinary prose inside/around boxes

To affect compilation, intent must become an explicit semantic object:

- component/system
- port/type
- relation
- ownership/transfer mode
- effect
- capability requirement
- implementation pin
- invariant
- refinement
- test
- evidence requirement
- governance status/issue

This is the boundary between AI conversation and compiler authority.

## 19. Abstraction classes

### Level A - presentation abstraction

May vary freely:

- whitespace
- box size
- ASCII vs Unicode frame glyphs
- line routing
- decorative arrows
- comments
- visual ordering where semantics do not specify order

### Level B - structural abstraction

May vary only under explicit contracts:

- collapse subsystem internals
- group components
- expose only public ports
- replace concrete implementations with semantic capability requirements
- refine abstract components with concrete subsystems

### Level C - semantic abstraction

Must never be silently guessed:

- identity
- relation kind
- relation endpoints
- public port direction/type
- ownership/transfer mode
- effects
- capability requirements
- causal ordering
- invariants
- refinement obligations

## 20. Pass 4 closure

[RUN] ASCII is explicitly the human/AI interaction layer and source language.  
[RUN] semantic islands separate compiler authority from presentation.  
[RUN] unique elaboration is the reliability ceiling.  
[RUN] geometry is non-authoritative.  
[RUN] structural and contract semantics are explicit.  
[RUN] governance semantics are first-class and separate from runtime control.  
[RUN] natural-language prose cannot silently create executable meaning.  
[RUN] recursive subsystem abstraction is admitted through refinement contracts.  
[RUN] public/private boundaries are explicit.  
[RUN] public port identity/direction/type are explicit.  
[RUN] nominal type kernel established.  
[RUN] transfer/ownership modes established.  
[RUN] effect/capability/implementation namespaces separated.  
[RUN] small invariant language established.  
[RUN] tests/evidence are graph objects.  
[RUN] analyze/build distinction preserves incomplete workshop diagrams.  
[RUN] source-unit/system identity rules established.  
[RUN] canonical semantic-rendering laws established.  
[RUN] language test ladder established.  
[RUN] no backend implementation or compiler source materialized.

Next: Pass 5 - Factory + Lowering Contracts.
