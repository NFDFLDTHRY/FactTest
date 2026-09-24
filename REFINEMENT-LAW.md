# FactTest Refinement Law

STATUS: PASS 4  
DATE: 2026-09-23

Refinement is the mechanism that lets the human/AI interaction layer hide internal complexity without losing reliability.

## 1. Core relation

\`\`\`text
CONCRETE
   |
   | refines
   v
ABSTRACT CONTRACT
\`\`\`

A concrete subsystem may contain arbitrarily more internal structure than its abstract contract.

It may not change what outside observers are entitled to rely on.

## 2. Boundary completeness

An abstract subsystem boundary is complete for a given use only when it exposes every externally relevant fact needed to determine legality:

- public input ports
- public output ports
- nominal types
- transfer/ownership expectations
- externally visible effects
- semantic capability requirements
- explicit implementation pins, if any
- required sequencing guarantees
- externally relevant invariants
- declared failure classes/contract where modeled
- required tests/evidence

Internal objects may remain private.

## 3. Refinement obligations

Concrete C refines abstract A only if all applicable conditions hold:

### Interface
Every required public A port has a compatible public C boundary port.

### Types
Boundary types resolve compatibly.

### Direction
Input/output direction is preserved.

### Transfer semantics
C does not weaken externally promised ownership/transfer behavior.

### Effects
Every externally visible effect of C is allowed by or explicitly surfaced through A.

### Capabilities
Concrete implementation requirements do not silently escape the abstract boundary.
If C requires an external semantic capability, A must expose that requirement unless the capability is entirely satisfied/encapsulated internally with no external admission consequence.

### Invariants
Every invariant promised by A becomes a proof obligation over C.

### Sequence
C preserves every externally promised ordering/causal constraint.

### Failure
C does not expose failure behavior outside A's declared contract once failure contracts are modeled.

### Visibility
External systems cannot depend on C's private internals.

## 4. Strengthening versus weakening

A concrete refinement may strengthen guarantees if doing so does not invalidate legal users of the abstract contract.

It may not weaken guarantees required by the abstract contract.

It may impose additional internal constraints.

It may not impose a new externally required capability or precondition without surfacing it through the public contract.

## 5. Encapsulation

\`\`\`text
OUTSIDE
   |
   | only public boundary
   v
+---------------------------+
| ABSTRACT / SUBSYSTEM      |
|                           |
| public contract           |
|   +--------------------+  |
|   | PRIVATE INTERNALS  |  |
|   +--------------------+  |
+---------------------------+
\`\`\`

Any direct external semantic reference to a private internal identity is invalid.

This remains true even when the ASCII artwork visually exposes the private node.

Geometry never overrides visibility.

## 6. Recursive refinement

Refinement is recursive.

A concrete subsystem can itself contain abstract subsystems.

\`\`\`text
System
  -> Abstract A
       -> Concrete A1
            -> Abstract A1x
                 -> Concrete A1x1
\`\`\`

Reliability does not require flattening the entire project.

It requires every refinement edge to prove its boundary contract.

## 7. Capability abstraction

A useful abstraction is to expose a semantic capability rather than a backend:

\`\`\`text
ABSTRACT:
  requires VIDEO_ENCODE

CONCRETE alternatives:
  WEBCODECS
  WASM_CODEC
  future backend
\`\`\`

A concrete refinement may select/pin a backend internally if that selection does not create undeclared external requirements.

If the human explicitly requires WebCodecs at the abstract boundary, that is an implementation-specific contract and must be written as such.

## 8. Refinement and planning

The planner may select among concrete refinements/implementations only after:

- semantic compatibility is established
- capability requirements are admitted
- refinement obligations are verified

Cost ranking cannot rescue an invalid refinement.

## 9. Refinement evidence

A refinement relation creates proof/test obligations.

At minimum future tooling must be able to report:

- abstract object identity
- concrete object identity
- boundary mapping
- satisfied/failed obligation list
- diagnostics with source spans
- evidence references where runtime evidence is required

## 10. Human/AI abstraction rule

The human or AI may collapse internal structure whenever they can state the boundary contract completely.

If the contract is incomplete, the correct representation is not a guessed abstraction.

It is:

\`\`\`text
@{status subsystem GAP "public contract incomplete"}
\`\`\`

or an equivalent explicit governance issue.

This preserves uncertainty rather than hiding it.
