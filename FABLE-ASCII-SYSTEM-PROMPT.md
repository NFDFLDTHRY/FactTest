╔══════════════════════════════════════════════════════════════════════╗
║ FACTTEST · FABLE 5.1 · ASCII SYSTEMS MANUFACTURING PROMPT          ║
║ READ THIS BEFORE ALTERING ANYTHING                                 ║
╚══════════════════════════════════════════════════════════════════════╝

PURPOSE

  Materialize FactTest from the architecture already present in this repo.
  This prompt is a session bootloader, NOT a second specification.
  Repo owner-contracts carry detail. Never invent missing semantics.

MINIMUM PREPARED ANCESTOR
  5727c1fdfe5321f59f28a0f8ffb15ecd18c601bf

SESSION ENTRY
  1. DO NOT EDIT.
  2. Record: git status, branch, HEAD, tree.
  3. Confirm HEAD contains this prompt and descends from the prepared ancestor.
  4. Read, in order:
       FACTORY-LAW.md
       README.md
       FINAL-HANDOFF-REQUIREMENTS.md
       PASS6-GAP-REPAIRS.md
       PASS1.md ... PASS6.md
  5. Before working in a domain, read its owner contracts:
       language  -> ASCII-LANGUAGE.md, ASCII-GRAMMAR.md,
                    SEMANTIC-MODEL.md, REFINEMENT-LAW.md,
                    LANGUAGE-TESTS.md
       bootstrap -> BOOTSTRAP-ARCHITECTURE.md,
                    BOOTSTRAP-CONTRACTS.md, BOOTSTRAP-TESTS.md
       factory   -> FACTORY-CONTRACTS.md, STATION-REGISTRY.md
       lowering  -> LOWERING-MODEL.md, IMPLEMENTATION-CONTRACTS.md,
                    REPRESENTATION-TRANSFER.md
       planning  -> PLANNER-COST-MODEL.md,
                    VERIFICATION-CERTIFICATES.md
       codegen   -> CODEGEN-BUNDLE-CONTRACT.md
       runtime   -> RUNTIME-ADMISSION-REPLAN.md
       authority -> REFERENCE-AUTHORITY.md, CONSTRAINT-LEDGER.md,
                    CONFLICT-LEDGER.md, EVIDENCE-OBLIGATIONS.md
       commissioning -> COMMISSIONING-*.md, PASS6-TESTS.md
  6. Reconstruct the current intended system in ASCII before routing work.

AUTHORITY

  FACTORY-LAW.md is constitutional.
  Explicit PASS6-GAP-REPAIRS.md amendments supersede ONLY the conflicts
  they name. Current owner contracts govern their domains.
  Pass narratives explain history and intent.
  If live owner contracts still conflict: mark [ERR], return to ASCII,
  do NOT choose a convenient interpretation.

                     USER + FABLE
                           │
                           ▼
                 ASCII SYSTEMS DIAGRAM
                 HUMAN/AI SOURCE OF RECORD
                           │
                    STRUCTURAL CHECK
                           │
              FAIL ────────┴──────── PASS
               │                       │
               ▼                       ▼
             ASCII               FACTORY ROUTER
                                       │
                               ISOLATED WORKPIECE
                                       │
                                    STATIONS
                                       │
                                     VERIFY
                                       │
                            FAIL ───────┴────── PASS
                             │                   │
                             ▼                   ▼
                           ASCII          INTEGRATION GATE
                                                 │
                                                 ▼
                                           CANONICAL REPO
                                                 │
                                           EXECUTE / PROBE
                                                 │
                                             EVIDENCE
                                                 │
                                          OBSERVED ASCII
                                                 │
                                                 └────► USER + FABLE

CANONICAL MUTATION LAW

  AGENT -> ASCII -> FACTORY -> WORKPIECE -> VERIFY -> REPO

  NEVER:
  AGENT -----------------------------------------------> REPO

BOOTSTRAP LAW

  The first Factory does not yet exist.
  External bootstrap trust = Fable + Git + selected toolchain + host.

  External bootstrap MAY:
    create an isolated initial workpiece;
    materialize the minimum Factory machinery there;
    run declared verification.

  External bootstrap MUST NOT:
    use canonical main as its working surface;
    skip StructuralDelta, bounded authority, receipts, verification,
    or the integration gate.

  FIRST BUILD ENOUGH FACTORY TO ENFORCE ALL LATER FACTORY WORK.

PROJECT IDENTITY

  [INV] compiler kernel: Rust, #![no_std], no third-party crates.
  [INV] source language: AI-authored ASCII Systems Diagrams.
  [INV] ASCII is also the shared human/AI interaction layer.
  [INV] target: capability-parametric Chrome WebApp.
  [INV] canonical Wasm direction: wasm64-unknown-unknown.
  [INV] wasm32 fallback forbidden unless human changes ASCII design.
  [INV] FactTest.git != generated WebApp.
  [INV] FactoryStation != CompilerBackend.
  [INV] Planner != Verifier != Codegen.
  [INV] RuntimeEvidence != source semantics.
  [INV] geometry/prose cannot silently create compiler semantics.

TARGET PRESERVATION

  G is the approved target capability universe.
  Missing implementation, browser support, permission, authority maturity,
  fixture, or runtime evidence DOES NOT remove a target node.
  Preserve it with [GAP], [ERR], or [UNK].
  Only explicit human/ASCII design authority may remove approved scope.

CURRENT ADAPTIVE COMPILER LAW

  ASCII
    -> parse / resolve / typed semantics
    -> CapabilityIR
    -> representation + conversion graph
    -> implementation hypergraph H_G
    -> runtime admission H_A
    -> CandidateStrategy
    -> INDEPENDENT VERIFIER
    -> VerifiedStrategy
    -> CodegenRecipe engine
    -> GeneratedBundle + BundleVerifier
    -> MachineEpoch
    -> ActivationReceipt
    -> ActivePlan
    -> RuntimeEvidence
    -> ObservationDelta
    -> observed ASCII

  Runtime may select ONLY preverified, pre-emitted strategy variants.
  Runtime may not invent or codegen a new backend.

MATERIALIZATION ORDER

  M0 OBSERVE + ASCII reconstruction
  M1 bootstrap Factory
  M2 compiler foundation: IDs, spans, diagnostics, artifacts, no_std ABI
  M3 ASCII scanner/parser/resolver/TypedSystemIR/canonical renderer
  M4 lowering: CapabilityIR, representations, conversions, contracts, H_G
  M5 CandidateStrategy + independent verifier + VerifiedStrategy
  M6 CodegenRecipe + wasm64/host machinery + BundleVerifier
  M7 runtime admission, selector, epochs, evidence, observed ASCII
  M8 Byte Relay commissioning: execute ALL PASS6-TESTS.md gates
  M9 re-observe intended vs materialized system

  Failure at M(N) returns to ASCII. Do not erase it by continuing.

BYTE RELAY COMMISSIONING GATE

  Byte Relay is DATA, not architecture.
  Source/fixture/contract instances may be slice-specific.
  Parser, resolver, IR, lowering, representation graph, planner, verifier,
  CodegenRecipe engine, BundleVerifier, selector, evidence renderer, and
  Factory machinery MUST be generic.

  Do not broadly expand capability implementations until Byte Relay closes
  its applicable deterministic, negative, anti-cheating, Factory, and
  physical gates in PASS6-TESTS.md.

EVIDENCE TRUTH LADDER

  CLAIMED
    -> STRUCTURALLY CHECKED
    -> BUILT
    -> STATICALLY VERIFIED
    -> BUNDLE VERIFIED
    -> RUNTIME ADMITTED
    -> EXECUTED
    -> CORRECT OUTPUT
    -> LOSS/RECOVERY WITNESSED
    -> OBSERVED ASCII

  Never skip rungs.
  API present != admitted.
  Build pass != execution pass.
  Codegen pass != bundle pass.
  Bundle pass != browser pass.
  Synthetic/model pass != physical pass.
  "prefer hardware" != hardware execution.

LIVE AUTHORITY

  Before implementing externally constrained machinery:
    open REFERENCE-AUTHORITY.md;
    open the actual linked current spec clause;
    verify the clause still resolves and still supports the contract.
  If current authority changed materially: mark [ERR], return to ASCII.
  Never silently implement stale standards text.

BEFORE EACH WORKPIECE, SHOW

  ASCII DELTA
  BASE
  STATION
  FIXTURE
  MAY READ
  MAY CHANGE
  MUST NOT CHANGE
  INVARIANTS
  TESTS
  EXPECTED EVIDENCE

AFTER EACH WORKPIECE, SHOW

  WORKPIECE RESULT
  RECEIPTS
  VERIFICATION
  INTEGRATION RESULT
  EXECUTION/PROBE EVIDENCE
  OBSERVED ASCII
  MATCH / DIFFER

STOP AND RETURN TO ASCII IF

  base moved;
  semantic ambiguity exists;
  current contracts conflict;
  authority changed materially;
  required station/tool does not exist;
  requested authority exceeds station/fixture scope;
  verification or required evidence fails;
  physical capability is unavailable;
  only path requires changing approved semantics;
  only path requires wasm32 fallback;
  only path requires an unverified/unemitted runtime implementation;
  Byte Relay can pass only through a commissioning-specific shortcut.

STATUS VOCABULARY

  [OBS] existing/observed
  [NEW] proposed
  [GAP] required machinery/evidence missing
  [RUN] actually witnessed
  [ERR] contradiction/failure
  [UNK] not established

FINAL RULE

  Intended ASCII and observed system must agree.
  If they differ, preserve the disagreement as [ERR]/[GAP] and continue
  through the human/AI ASCII interaction layer.
  NEVER rewrite the drawing merely to make the implementation look correct.
