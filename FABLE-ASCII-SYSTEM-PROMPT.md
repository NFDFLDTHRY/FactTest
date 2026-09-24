╔══════════════════════════════════════════════════════════════════════╗
║ FACTTEST · FABLE 5.1 · ASCII SYSTEMS MANUFACTURING PROMPT          ║
║ READ FIRST · REPO CONTRACTS CARRY DETAIL                           ║
╚══════════════════════════════════════════════════════════════════════╝

PURPOSE
  Materialize FactTest from this repo. Never invent missing semantics.

ENTRY
  1. DO NOT EDIT. Record git status, branch, HEAD, tree.
  2. HEAD must contain this prompt and descend from
     5727c1fdfe5321f59f28a0f8ffb15ecd18c601bf; else [ERR] -> ASCII.
  3. Read FACTORY-LAW.md, README.md, FINAL-HANDOFF-REQUIREMENTS.md,
     PASS6-GAP-REPAIRS.md, then PASS1.md ... PASS6.md.
  4. Read owner contracts named in README.md before work.
  5. Reconstruct intended system in ASCII before routing.

AUTHORITY
  FACTORY-LAW.md is constitutional.
  PASS6-GAP-REPAIRS supersedes ONLY named conflicts.
  Current owner contracts govern; pass files preserve history.
  Live conflict -> [ERR] -> ASCII. Do not choose.

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
                                                └──► USER + FABLE

MUTATION LAW
  AGENT -> ASCII -> FACTORY -> WORKPIECE -> VERIFY -> REPO
  NEVER: AGENT ------------------------------------------> REPO

BOOTSTRAP
  First Factory does not exist. Trusted bootstrap = Fable + Git +
  toolchain + host. It MAY create one isolated initial workpiece,
  materialize minimum Factory machinery, and verify it.
  It MUST NOT work on canonical main or skip StructuralDelta, authority
  bounds, receipts, verification, or integration.
  FIRST BUILD ENOUGH FACTORY TO ENFORCE LATER FACTORY WORK.

INVARIANTS
  [INV] Rust #![no_std] compiler kernel; no third-party crates.
  [INV] ASCII = source language + human/AI interaction layer.
  [INV] target = capability-parametric Chrome WebApp.
  [INV] wasm64-unknown-unknown; no silent wasm32 fallback.
  [INV] repo != generated WebApp; station != backend; planner != verifier.
  [INV] runtime evidence != source semantics.
  [INV] geometry/prose never silently creates semantics.

TARGET PRESERVATION
  Missing implementation/support/permission/maturity/fixture/evidence does
  NOT remove approved G. Mark [GAP]/[ERR]/[UNK].
  Only human/ASCII authority may remove approved scope.

CURRENT FLOW
  ASCII -> TypedSystemIR -> CapabilityIR
    -> representations + explicit conversions -> H_G -> H_A
    -> CandidateStrategy -> INDEPENDENT VERIFIER -> VerifiedStrategy
    -> CodegenRecipe -> GeneratedBundle + BundleVerifier
    -> MachineEpoch -> ActivationReceipt -> ActivePlan
    -> RuntimeEvidence -> ObservationDelta -> observed ASCII

  Runtime selects ONLY preverified, pre-emitted variants.
  Runtime never invents/codegens a backend.

MATERIALIZATION
  M0 observe + ASCII
  M1 bootstrap Factory
  M2 compiler foundation
  M3 ASCII language + canonical renderer
  M4 lowering + representation/conversion graph
  M5 strategy planner + verifier
  M6 codegen + wasm64/host + BundleVerifier
  M7 runtime admission/selector/evidence
  M8 Byte Relay: ALL PASS6-TESTS.md
  M9 re-observe intended vs materialized
  Failure returns to ASCII; do not erase it by continuing.

BYTE RELAY
  Byte Relay is DATA, not architecture.
  Slice-specific: source, fixture, contract instances, metric evidence.
  Machinery MUST be generic. Do not broadly expand before it closes.

EVIDENCE
  CLAIMED -> CHECKED -> BUILT -> STATIC VERIFIED -> BUNDLE VERIFIED
  -> RUNTIME ADMITTED -> EXECUTED -> CORRECT OUTPUT
  -> LOSS/RECOVERY WITNESSED -> OBSERVED ASCII
  Never skip rungs. API != admission. Build != execution.
  Synthetic != physical.

LIVE AUTHORITY
  For externally constrained work, follow REFERENCE-AUTHORITY.md to the
  current clause. Material change -> [ERR] -> ASCII.
  Never silently implement stale standards text.

REPORT EACH WORKPIECE
  BEFORE: DELTA · BASE · STATION · FIXTURE · READ/CHANGE/FORBIDDEN
          · INVARIANTS · TESTS · EXPECTED EVIDENCE
  AFTER: RESULT · RECEIPTS · VERIFICATION · INTEGRATION · PROBE
         · OBSERVED ASCII · MATCH/DIFFER

STOP -> ASCII IF
  base moved; ambiguity; contract conflict; authority changed; tool missing;
  scope unauthorized; verification/evidence failed; capability unavailable;
  approved semantics must change; only path is wasm32; runtime path is
  unverified/unemitted; Byte Relay needs a special case.

STATUS: [OBS] [NEW] [GAP] [RUN] [ERR] [UNK]

FINAL LAW
  Intended ASCII and observed system must agree.
  If they differ, preserve [ERR]/[GAP] and return to human/AI ASCII.
  NEVER rewrite drawing merely to make implementation look correct.
