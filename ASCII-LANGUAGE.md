# FactTest ASCII Language

STATUS: PASS 4  
DATE: 2026-09-23

## 1. Interaction-first language law

ASCII Systems Diagrams are not a serialization format hidden behind another authoring model.

They are the human/AI interaction surface.

\`\`\`text
HUMAN <--------+
               |
               v
        ASCII SYSTEMS DIAGRAM
               ^
               |
AI / AGENT <---+
               |
               v
           COMPILER
\`\`\`

All three parties inspect the same authoritative source.

The compiler may produce canonical renderings and derived artifacts, but those are witnesses/derivations of the ASCII source, not a replacement authoring language.

## 2. Visible semantics

Every semantic fact that may change compilation must be visible as source text.

No hidden editor metadata.
No AI-only interpretation.
No geometry-only connection.
No implicit "obvious" capability.
No prose-only invariant.

The language accomplishes this with semantic islands:

\`\`\`text
@{ semantic statement }
\`\`\`

A semantic island can be embedded anywhere in a human-readable ASCII/Unicode diagram.

## 3. Presentation is intentionally rich

Humans and AIs may use:

- ASCII boxes
- Unicode box-drawing glyphs
- arrows
- tables
- whitespace
- headings
- indentation
- explanatory prose
- visual grouping
- blank regions
- repeated display labels

None of these are executable unless an explicit semantic island says so.

This is deliberate.

The diagram remains conversational and spatial for humans/AIs while the compiler consumes explicit contracts.

## 4. Example

\`\`\`text
╔══════════════════════════════════════════════════════════╗
║                  VIDEO CAPTURE                          ║
║                                                        ║
║  ┌──────────────────────┐                              ║
║  │ Camera               │                              ║
║  │ @{component camera "Camera"}                        ║
║  │ @{port camera.frame out: VideoFrame public}         ║
║  │ @{requires camera VIDEO_CAPTURE}                    ║
║  └──────────┬───────────┘                              ║
║             │                                          ║
║             │ @{data frame_flow camera.frame           ║
║             │          -> encoder.frame mode=move}      ║
║             ▼                                          ║
║  ┌──────────────────────┐                              ║
║  │ Encoder              │                              ║
║  │ @{component encoder "Encoder"}                      ║
║  │ @{port encoder.frame in: VideoFrame public}         ║
║  │ @{port encoder.data out: EncodedVideo public}       ║
║  │ @{requires encoder VIDEO_ENCODE}                    ║
║  └──────────────────────┘                              ║
║                                                        ║
║  Camera frames move into the encoder.                  ║
║  This prose helps humans and AIs but creates no        ║
║  extra compiler semantics.                             ║
╚══════════════════════════════════════════════════════════╝
\`\`\`

The semantic graph comes from the islands, not from the box borders/arrows/prose.

## 5. Unique elaboration

Abstraction is reliable while elaboration is unique.

If syntax/resolution permits multiple semantic meanings, compilation does not choose one.

It reports ambiguity with spans pointing to the relevant semantic islands.

## 6. Human/AI correction loop

A normal design interaction is expected to look like:

\`\`\`text
human describes/change request
        |
        v
AI edits ASCII diagram
        |
        v
compiler extracts semantic graph
        |
        +-- diagnostics
        |
        +-- canonical semantic rendering
        |
        v
human + AI inspect what compiler understood
        |
   MATCH / DIFFER
        |
        v
continue conversation or approve materialization
\`\`\`

This is why canonical rendering is mandatory.

The user must be able to see the compiler's interpretation without reading hidden IR.

## 7. Presentation-equivalence

Two sources are semantically equivalent if, after semantic-island extraction and normalization, they produce the same resolved semantic graph.

Therefore changing:

- whitespace
- frame glyphs
- visual placement
- line routing
- comments
- non-semantic prose

does not change the executable graph.

## 8. Explicit abstraction

A subsystem can hide arbitrary internal complexity if its public semantic boundary is complete.

This allows the human/AI surface to stay comprehensible even for very large systems.

A collapsed subsystem is not "less real".
It is an abstract contract that concrete implementations must refine.

See [REFINEMENT-LAW.md](REFINEMENT-LAW.md).

## 9. No semantic backchannel

Forbidden semantic backchannels include:

- hidden JSON not represented in ASCII
- editor-only object IDs
- an AI model's private reasoning
- layout coordinates
- Git filenames used as system identity
- planner-selected implementation written back as if the user authored it
- runtime observations silently becoming source requirements

Any persistent semantic change returns to the ASCII interaction layer.

## 10. Analysis of incomplete work

ASCII must remain useful before the design is complete.

The compiler therefore preserves explicit GAP/UNK/ERR states and can return partial semantic artifacts in analysis mode.

The interaction surface does not demand fake completeness.

A human or AI can literally reason over:

\`\`\`text
@{status gpu_backend GAP "implementation contract not selected"}
\`\`\`

without the compiler pretending a backend exists.

## 11. Reliability summary

\`\`\`text
MAXIMUM FREEDOM      in presentation

MAXIMUM ABSTRACTION  inside complete subsystem contracts

ZERO GUESSING        at semantic boundaries
\`\`\`

D27 ANNOTATION (language law amendment, D27-FOUNDATION-CLOSURE-ALIGNMENT; inserted by station S-LANGUAGE-LAW; insertion-only):

- Section 1 (interaction-first): the foundation-closure target (design/foundation-closure/FOUNDATION-CLOSURE-TARGET.md) names the
  parties of the future protocol - HUMAN (natural language, diagrams) <-> TINY LOCAL MODEL (translator and dialogue
  partner, speaking this language; never semantic authority, compiler, verifier or Factory) <-> DETERMINISTIC COMPILER N
  (defines LANGUAGE N).  The interface the model will use exists today as: the derived language manifest
  (tests/closure/language-manifest-v1.json), the structured diagnostics (code, phase, spans, message class, parameters,
  authority), the canonical teach-back (canonical rendering, L19/L20) and the LANGUAGE 1 corpus oracle.
- Section 9 (no semantic backchannel) and section 10: the D27 evidence-feedback probe (tests/closure/evidence-feedback-probe.mjs,
  FACT-D27-OBSERVED-ASCII-NOT-DISTINGUISHABLE) shows that the observed ASCII the compiler derives from runtime evidence
  is accepted by ANALYZE as an authored source unit: its `@{system <name>_observed}` and `@{issue}` islands are
  LANGUAGE 1 statements and no statement marks a unit as authored, canonical or observed.  [GAP] LANGUAGE 2 candidate
  (a source-role statement or a non-source evidence dialect; sequence FC-5).  Until then the boundary is held by Factory
  law L-EV-5: no station accepts an observed.ascii as a source-unit input; observed ASCII returns to the human/AI
  interaction layer as evidence only.
