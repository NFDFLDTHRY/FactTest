╔══════════════════════════════════════════════════════════════════════╗
║           FACTTEST · D13 REPO HYGIENE / CHAIN CLOSURE             ║
║       PRECONDITION FOR A FRESH TECHNICAL REFERENCE RESCAN          ║
╚══════════════════════════════════════════════════════════════════════╝

OWNER DIRECTION

Pause the previously predicted D13-SEED-BROKER-QUALIFICATION sequence.

Before any further self-hosting implementation or technical-reference rescan,
repair the repository where unfinished state, stale state, broken proof links,
internal ERR/GAP conditions, dead authority paths, or broken handoffs make the
existing FactTest chain internally unreliable.

Do NOT erase genuine technical uncertainty merely to make the repo look clean.

CURRENT KNOWN MAIN

8e5dd6fe0d35669867dc7894434e68b13abeb158

Do not trust that SHA blindly. FIRST re-observe current main, branch, HEAD,
tree, status and ancestry. If main moved, use the actual current state.

CANONICAL MUTATION LAW

AGENT → ASCII → FACTORY → WORKPIECE → VERIFY → REPO

NEVER:

AGENT -------------------------------------------> REPO

FIRST ACTION

If this exact prompt is not tracked, route THIS EXACT PROMPT through the
Factory before doing the hygiene pass as:

design/materialization/D13-REPO-HYGIENE-PROMPT.md

Then assemble the intended hygiene system in ASCII BEFORE changing production.

READ FIRST

FACTORY-LAW.md
FACTORY-CONTRACTS.md
FINAL-HANDOFF-REQUIREMENTS.md
README.md
FABLE-ASCII-SYSTEM-PROMPT.md
REFERENCE-AUTHORITY.md
CONFLICT-LEDGER.md
CONSTRAINT-LEDGER.md
design/materialization/LEDGER.md
design/materialization/D9-INTENDED-PROOF-HARNESS.md
design/materialization/D9-OBSERVED-PROOF-HARNESS.md
design/materialization/D11-INTENDED-ENVIRONMENT-MAP.md
design/materialization/D11-OBSERVED-ENVIRONMENT-MAP.md
design/environment-map/SCHEMA.md
design/environment-map/graph.json
design/environment-map/TRACEABILITY.md
design/materialization/D12-INTENDED-SELF-HOSTING.md
design/materialization/D12-OBSERVED-SELF-HOSTING.md
evidence/D9/
evidence/D11/
evidence/D12/
current Factory source + station registry + proof harnesses

Preserve historical evidence exactly. Never rewrite D0-D12 evidence to make
old claims stronger.

══════════════════════════════════════════════════════════════════════

HYGIENE CLASSIFICATION LAW

Classify every discovered problem before touching it:

A. INTERNAL CHAIN DEFECT
   Repo machinery/document/proof relationship is wrong, stale or broken.
   → PATCH through Factory.

B. HISTORICAL EVIDENCE LIMIT
   Old evidence lacked information now known to be desirable.
   → PRESERVE history; add prospective rule/annotation only.

C. REAL CAPABILITY / IMPLEMENTATION GAP
   Something FactTest genuinely cannot yet do.
   → KEEP [GAP]/[ERR]/[UNK]. Do not implement it during hygiene.

D. AUTHORITY UNCERTAINTY
   External clause moved, published source unavailable, maturity uncertain.
   → normalize the broken internal reference if possible, preserve uncertainty,
     and defer semantic resolution to the next technical-reference rescan.

Never convert B/C/D into A just to obtain a clean report.

══════════════════════════════════════════════════════════════════════

ASSEMBLY SURFACE

                    CURRENT MAIN
                         │
                         ▼
                  CHAIN INVENTORY
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
     FACTORY           PROOF          KNOWLEDGE
      CHAIN            CHAIN            CHAIN
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                 CLASSIFY A/B/C/D
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
        PATCHABLE A               PRESERVE
             │                    B/C/D
             ▼                       │
      ISOLATED WORKPIECE             │
             │                       │
             ▼                       │
          VERIFY                     │
             │                       │
             └───────────┬───────────┘
                         ▼
                 FULL RE-EXECUTION
                         │
                FAIL ────┴──── PASS
                 │               │
                 ▼               ▼
               ASCII       PRE-RESCAN BASELINE
                                   │
                                   ▼
                      D14 TECHNICAL REFERENCE RESCAN

══════════════════════════════════════════════════════════════════════

REQUIRED HYGIENE TARGETS

1. FACTORY PATH AUTHORITY

Known defect:
factory/src/paths.rs implements literal file / directory-prefix semantics,
while S-FIXTURE contains wildcard-looking entries such as:

compiler/*/tests/
compiler/*/src/

D9/D11 proved these match nothing.

Repair the inconsistency WITHOUT silently widening authority.

Preferred direction:
- explicit authorized surfaces, OR another representation whose semantics are
  explicitly defined and tested;
- reject unsupported wildcard-looking station entries so this cannot recur.

Do not casually add glob semantics. If widening authority is required, return
to ASCII before doing so.

Add regression witnesses.

2. RUST/CARGO PROOF TAXONOMY

Known state:
- workspace has 14 members;
- default-members omits factc-wasm-abi;
- native `cargo build --workspace` is not a valid universal proof because the
  wasm ABI crate is target-specific;
- historical "full workspace/full suite" wording was overstated.

Do NOT force the wasm64 transport crate into a fake native success.

Define qualified selections explicitly, at minimum conceptually:

HOST_NATIVE_SET
WASM64_KERNEL_SET

Make proof commands state which set, target, profile and toolchain they prove.

Bare cargo commands must never again imply "entire project" unless they
actually select the entire intended proof set.

3. TOOLCHAIN REPRODUCIBILITY

Known state:
toolchain identity has drifted across evidence epochs and no repository
toolchain pin currently exists.

Determine from the qualified proof evidence whether one exact toolchain +
required components can be pinned without contradiction.

If existing evidence gives an unambiguous qualified choice:
- materialize the pin through Factory;
- include required components such as rust-src / clippy where the proof matrix
  requires them;
- rerun the qualified proof matrix.

If D9/D12 evidence does NOT justify one unambiguous choice, preserve [ERR]/[GAP]
and return the choice to ASCII. Do not arbitrarily choose a nightly.

4. LEGACY HEURISTIC CHECKERS

Known:
factory nostd_check and depcheck have demonstrated bypasses.

Do not make increasingly clever text scanners and call them proof.

The authoritative proof path should use:
- compiler-enforced core-only wasm64 graph for no_std;
- Cargo-resolved dependency graph + physical-manifest accounting for
  dependency law.

Legacy scanners may remain as heuristic diagnostics only if their proof weight
is explicitly NONE and no gate relies on them as authoritative proof.

5. LIVE HANDOFF / DOCUMENT STATE

Current repo still contains model/session-specific live-looking language:
README centers the original materialization;
FABLE-ASCII-SYSTEM-PROMPT.md looks like the active bootloader;
LEDGER identifies the live Fable 5.1 session even though later work was Opus.

Repair current handoff surfaces so a fresh agent can correctly determine:
- current project state;
- current mutation law;
- current authoritative entrypoint;
- historical Fable/Opus sessions versus live project law.

Do NOT delete historical prompts/evidence.
Mark them historical where appropriate.
The active bootstrap/handoff should be model-independent.

6. D12 → COMPUTATIONAL ENVIRONMENT GRAPH

Known break:
design/environment-map/graph.json currently represents D11 and contains no D12
self-hosting evidence.

Integrate D12's actual:
- environments;
- probes;
- evidence;
- computational facts;
- stale relationships;
- authority relationships where already established.

Regenerate deterministic derived views:
AUTHORITY-REGISTER / TRACEABILITY / stale queries / validation as applicable.

Do not rewrite D11 evidence.
D12 becomes a later evidence epoch connected to it.

The graph must know the project progressed beyond D11.

7. AUTHORITY FRAGMENT DRIFT

Known example:
WebAssembly JS API `#internal-storage` citation was proven drifted in pinned
source while the published rendering was unavailable.

Before the external rescan:
- remove any internal false certainty that the fragment is currently valid;
- preserve the exact historical citation;
- retain [ERR]/[UNK] where live authority has not yet been reopened.

Do NOT perform the broad technical-reference rescan during D13.
That is D14.

8. RECEIPT / ENVIRONMENT IDENTITY

D11 found older receipts/evidence with incomplete computational-environment
identity.

Do NOT rewrite historical receipts.

For future Factory receipts define/prove the prospective environment identity
required to interpret execution, including relevant:
toolchain / target / profile / runtime / versions / flags / host identity.

Historical incompleteness remains historical.

9. WORKPIECE / BRANCH HYGIENE

Audit:
- attached Factory workpieces;
- abandoned/incomplete workpieces;
- integrated workpieces;
- stale development branches.

Current historical observation said many worktrees remained attached.

Forge/use a bounded cleanup mechanism only if needed.

Never delete an unintegrated workpiece or unique commit.

Cleanup is allowed only after deterministic ancestry/tree/receipt checks prove
the object is safely integrated or disposable.

If safe automated cleanup machinery does not exist, produce the audit and
leave [GAP] rather than using an ad-hoc destructive command.

10. STATUS INTEGRITY

Search the whole current repo for:
[ERR] [GAP] [UNK] PENDING TODO FIXME unfinished stale overclaim
and equivalent broken-chain conditions.

For each occurrence determine whether it is:
A internal defect to repair now,
B historical evidence limit,
C real capability gap,
D authority uncertainty.

Do not mechanically eliminate status markers.

══════════════════════════════════════════════════════════════════════

EXPLICIT NON-GOALS

Do NOT use D13 to implement:

- seed/broker self-hosting machinery
- browser-native Rust compilation
- missing wasm ABI self-hosting exports
- hardware GPU support
- WGSL execution
- shared/threaded Wasm
- broad missing capability families
- storage durability guarantees
- GitHub synchronization
- GitHack public-origin validation
- new application features

Those remain separate work unless repairing chain integrity strictly requires
a bounded supporting mechanism.

══════════════════════════════════════════════════════════════════════

REQUIRED OUTPUTS

Before production patching:

1. D13 intended hygiene ASCII
2. complete issue inventory with A/B/C/D classification
3. exact mutation plan by Factory station
4. structural check

After materialization:

5. repaired Factory/path/proof/handoff machinery
6. qualified Rust/Cargo proof taxonomy
7. toolchain result: PINNED or explicit unresolved decision
8. D12-connected computational environment graph
9. workpiece/branch audit and any safely executed cleanup receipts
10. full qualified proof rerun
11. environment-map validation + deterministic queries
12. D13 observed ASCII
13. intended-vs-observed comparison
14. PRE-RESCAN-BASELINE record

Suggested names:

design/materialization/D13-INTENDED-REPO-HYGIENE.md
design/materialization/D13-OBSERVED-REPO-HYGIENE.md

Choose additional filenames only after ASCII assembly establishes their roles.

══════════════════════════════════════════════════════════════════════

FINAL VERIFICATION

D13 may close only when:

[PASS] Factory authority surfaces mean what they claim.
[PASS] unsupported wildcard-looking authority cannot silently match nothing.
[PASS] proof sets explicitly distinguish native and wasm64 targets.
[PASS] authoritative no_std/dependency proofs use the qualified judge.
[PASS] live handoff no longer depends on Fable/Opus identity.
[PASS] D12 is traversable from the computational environment graph.
[PASS] historical evidence remains immutable.
[PASS] unresolved technical capability gaps remain visible.
[PASS] unresolved external authority questions remain visible for D14.
[PASS] cleanup deleted nothing not proven disposable.
[PASS] full post-repair verification/evidence succeeds.
[PASS] intended and observed D13 structures agree.

If any internal chain defect remains capable of misleading the next reference
scan:

DO NOT start D14.
Return to ASCII.

SUCCESS CONDITION

The goal is NOT:

"there are no ERR/GAP/UNK markers."

The goal is:

"Every remaining ERR/GAP/UNK truthfully represents an external, historical,
capability or owner-decision boundary rather than a broken internal FactTest
chain."

Only after that state exists should FactTest perform the fresh technical
reference rescan.
