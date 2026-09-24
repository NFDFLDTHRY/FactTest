# FactTest Handoff (live, model-independent entrypoint)

STATUS: LIVE.  Introduced by D13-REPO-HYGIENE; every later delta that changes project state updates sections 1 and 6.
This page is written for any agent or person.  No session prompt, model or earlier conversation is needed to continue
the project; everything below points at repository files.

## 1. Current state

```text
canonical branch   claude/facttest-materialization-27amc7 (merged into main by the owner through pull requests)
last delta         D13-REPO-HYGIENE (see design/materialization/LEDGER.md for its integration commit)
materialized       Factory plane (factory/), no_std compiler kernel (compiler/), host driver + browser harnesses (host/),
                   Byte Relay physically commissioned in Chromium 141 (SwiftShader WebGPU + wasm64), D9 qualified
                   Rust/Cargo proof harness, D11 computational environment map, D12 self-hosting architecture (ASCII +
                   primitive probes only), D13 chain hygiene (this page, proof sets, toolchain pin, literal surfaces)
not materialized   self-hosting (seed/broker, browser Factory, in-browser Rust), missing ABI exports, hardware GPU,
                   WGSL, shared/threaded Wasm, broad capability families (section 6)
next               D14 TECHNICAL REFERENCE RESCAN, starting from design/materialization/D13-PRE-RESCAN-BASELINE.md.
                   The owner PAUSED the D12-predicted D13-SEED-BROKER-QUALIFICATION; it is renumbered after D14.
```

## 2. Mutation law

```text
AGENT -> ASCII -> FACTORY -> WORKPIECE -> VERIFY -> REPO          NEVER: AGENT -----------------> REPO
```

FACTORY-LAW.md is the constitution.  Every repository change is a StructuralDelta (factory/deltas/<id>.json) executed
in an isolated git worktree (workpiece), changed only by registered stations (factory/registry/stations/) under
fixtures (factory/fixtures/<delta>/), independently verified, integrated fast-forward only, then re-inspected.
Status vocabulary: [OBS] [RUN] [NEW] [GAP] [ERR] [UNK] (FACTORY-LAW.md).  Disagreement between intended and observed
structure is preserved as [ERR]/[GAP], never drawn away.

## 3. Entrypoint

Read, in order: README.md -> this page -> FACTORY-LAW.md -> FACTORY-CONTRACTS.md -> STATION-REGISTRY.md (with the
JSON registry) -> the newest intended/observed pair under design/materialization/ -> design/materialization/LEDGER.md
(newest entries) -> the law documents section 5 names for the area you touch.  Then observe the repository (branch,
HEAD, tree, status, ancestry to main) before drawing anything.

## 4. Operating procedure (one delta)

```text
1  ASCII     write design/materialization/<D>-INTENDED-*.md: observation, intended structure, classification,
             mutation plan by station, predictions, "STRUCTURAL CHECK: PASS"
2  payload   stage the files outside the repository (e.g. /home/user/factory-workpieces/<W>-stage); write
             factory/deltas/<D>.json (canonical_base = current HEAD, workpiece_id, may_change / must_not_change as
             LITERAL surfaces: "*", "dir/" or an exact file - wildcard-looking entries are rejected) and one fixture per
             station run under factory/fixtures/<D>/ (narrowed surfaces, commands, expected outputs, identity_probes)
3  judge     build the verifier from the canonical HEAD, outside the tree:
               CARGO_TARGET_DIR=<dir> cargo build -p factory        (rust-toolchain.toml pins 1.94.1)
4  route     F=<dir>/debug/factory
             $F workpiece create <stage>/factory/deltas/<D>.json      # detached worktree at canonical_base
             copy the delta and fixtures into the workpiece; then for each fixture in order:
               $F station open  <delta> factory/fixtures/<D>/<fx>.json
               copy exactly the files that station produces into the workpiece
               $F station close <delta> factory/fixtures/<D>/<fx>.json    # runs the fixture commands, writes a receipt
             $F verify <delta>        # changed paths, must_not_change, receipts, required/forbidden paths
             $F integrate <delta>     # ff-only; stops if the base moved
             $F reinspect <delta>     # canonical tree == verified tree; reinspect commands
5  observe   run/probe, write design/materialization/<D>-OBSERVED-*.md (inside the same delta, as a last S-DOC
             fixture) and the ledger entry; the integration result of <D> is recorded by the next delta
6  hygiene   factory workpiece audit <root> <repo> <branch> --current <W> --out <file>; retire only with
             factory workpiece retire (same arguments), which removes nothing that is not proven integrated
7  push      git push -u origin <branch>; pull requests to main are opened only when the owner asks
```

A station that does not exist is a [GAP]: forge it, test it, register it (a new spec used by the delta's fixtures is
bootstrap registry material, carried by that delta).  Widening any authority surface is decided in ASCII first.

## 5. Document register

```text
LIVE LAW       FACTORY-LAW.md (constitution; never annotated by a station), FACTORY-CONTRACTS.md, STATION-REGISTRY.md
               + factory/registry/stations/*.json (the JSON is authoritative for surfaces), FINAL-HANDOFF-REQUIREMENTS.md
               (its requirements; the title is historical), REFERENCE-AUTHORITY.md, CONSTRAINT-LEDGER.md,
               CONFLICT-LEDGER.md, CAPABILITY-MATRIX.md, IMPLEMENTATION-CONTRACTS.md, EVIDENCE-OBLIGATIONS.md,
               ASCII-GRAMMAR.md, ASCII-LANGUAGE.md, SEMANTIC-MODEL.md, LOWERING-MODEL.md, REFINEMENT-LAW.md,
               REPRESENTATION-TRANSFER.md, VERIFICATION-CERTIFICATES.md, PLANNER-COST-MODEL.md,
               RUNTIME-ADMISSION-REPLAN.md, CODEGEN-BUNDLE-CONTRACT.md, LANGUAGE-TESTS.md, COMMISSIONING-*.md,
               BOOTSTRAP-*.md (owner contracts; "current owner contracts govern")
LIVE RECORD    design/materialization/LEDGER.md; design/environment-map/ (graph.json = merge of the D11 graph and
               epochs/D12.json, epochs/D13.json; AUTHORITY-REGISTER.md and TRACEABILITY.md are generated);
               this page; the newest D<n> intended/observed pair; tests/toolchain/proof-sets.json; rust-toolchain.toml
HISTORICAL     FABLE-ASCII-SYSTEM-PROMPT.md (bootloader of the original Fable 5.1 materialization session; carries a
               HISTORICAL banner), PASS1.md-PASS6.md, PASS5-TESTS.md, PASS6-TESTS.md, PASS6-GAP-REPAIRS.md,
               PLANNED-REPO-LAYOUT.md (PASS 5 plan; the law/ zone was never created), M0-INTENDED-SYSTEM.md,
               M9-OBSERVED-SYSTEM.md, COMMISSIONING-RECORD.md, D9-D13 prompts and closed intended/observed records,
               evidence/, factory/receipts/, factory/deltas and factory/fixtures of integrated deltas.  Historical
               files are never rewritten; D13 added insertion-only annotations where they looked live.
SESSIONS       historical: M0-M9 / D0-D8 ran under the Fable 5.1 session bootloader (historical record only)
               historical: D9-D13 ran in later Opus sessions (historical record only)
               Nothing in the live law depends on any model or session.
```

Observed repository layout: factory/ (src, tests, registry, deltas, fixtures, receipts), compiler/<crate>/,
host/ (factc, harness), fixtures/ (language, compiler/negative, commissioning, toolchain), tests/ (bootstrap,
commissioning, language, toolchain, envmap, selfhost, hygiene), evidence/<delta>/, design/ (materialization,
environment-map), docs/ (this page), root law documents.

## 6. Open-boundary register

Every remaining [ERR]/[GAP]/[UNK] is one of these rows.  Class: C capability gap, D authority uncertainty, B historical
evidence limit, OWNER decision.  None is an internal chain defect (D13 PRE-RESCAN-BASELINE).

```text
CLASS  ID / SOURCE                          BOUNDARY                                                          STATUS
C      D12 B-01, B-02                       no Factory WebApp / browser state model; git subprocess state      [GAP]
C      D12 B-06 (P10)                       six wasm ABI exports absent; BUILD in the browser stops at          [GAP]
                                            CAPABILITY_IR
C      D12 B-05, B-17                       templates compiled into the kernel; packfile import/export         [GAP]
C      D12 B-11 (P07)                       storage best-effort, persist() false                               [GAP]
C      D12 B-03                             station commands are OS programs (portability)                     [ERR]
C      D12 B-04                             RUST_BUILD only on a host                                          [UNK]
C      D12 B-13 remainder                   verifier source-commit provenance (binary sha256 is recorded)       [GAP]
C      D13 H-12 (FACT-KERNEL-IDENTITY-      kernel bytes depend on the rust-src install name                   [GAP]
       INSTALL-PATH)
C      D11 WGSL / CON-GPU-003               WGSL never compiled or dispatched                                  [GAP]
C      D11 hardware GPU                     only SwiftShader fallback adapters ever observed                   [UNK]
C      ERR-002 / ERR-003                    shared/threaded Wasm unadmitted (presence only)                    [ERR]
C      D11 Q09                              streaming/MIME, workers, hardwareConcurrency unprobed; 29 GAP       [GAP]
                                            registry families not yet authority nodes
C      CAPABILITY-MATRIX / CONSTRAINT-      capability rows marked [GAP]/[ERR]/[UNK] in the law ledgers        as marked
       LEDGER rows
D      js-api #internal-storage             cited in 5 law files and fixtures/commissioning/contracts.ascii;   [ERR]/[UNK]
                                            not an id in pinned WebAssembly/spec@608711107b; published page
                                            not opened (annotated in place by D13; resolution D14)
D      D11 FACT-AUTHORITY-REOPEN-DENIED     37 of 48 D11 authorities and all 16 D12 authorities read from       [UNK]
                                            pinned sources only; published hosts DENIED
D      D12 B-19                             githack public-origin path unreachable (proxy 403)                  [UNK]
D      D12 B-18, B-20                       GitHub smart-HTTP CORS; browser update behaviour                    [OBS]/[UNK]
D      CONFLICT-LEDGER ERR-001 et al.       authority conflicts preserved as ledger rows                        [ERR]
B      D0-D12 receipts/evidence             incomplete environment identity (receipt format 2 from D14 on)      kept
B      D3-D8 fixture wording                "all ladders" / "full suite" overstated the selection               kept
B      D1-D8 heuristic gates                nostd-check/depcheck used as gates (proof weight now NONE)          kept
B      scratch-only tooling                 D0-D13 route scripts, D11 graph generator (procedure: section 4)    kept
B      workpiece root                       W11-stage (2 pre-binding drafts), factory-bootstrap-bin (unmanaged) [GAP] kept
OWNER  D-1 home origin; D-2 generated-app origins (B-16 [ERR]); D-3 RUST_BUILD strategy; D-5 BUILD without registry
       (B-07); D-6 object hash; D-8 seed replacement; D-9 history horizon; deleting the fully merged remote branches
       claude/d9-rust-cargo-proof-4nys6s, factory/reference-corpus-wasm64, work/pass2-5-reference-ingress-1
DECIDED D-4 toolchain pin (D13, by evidence); D-7 literal path authority (owner prompt D13 target 1)
```

## 7. Proof sets and toolchain

```text
rust-toolchain.toml          1.94.1 (rustc e408947bf) + clippy, rustfmt     -> bare cargo in the repository
tests/toolchain/proof-sets.json
  HOST_NATIVE_SET            1.94.1, host, dev + release, default-members (13 roots) == bare cargo
  WASM64_KERNEL_SET          nightly-2026-09-24 (rustc 6eeff9a52) + rust-src, clippy; wasm64-unknown-unknown,
                             -Z build-std=core, -p factc-wasm-abi (12-crate core-only graph); kernel identity declared
                             per rust-src install name
  ALL_SOURCES / ALL_MEMBERS_GRAPH   rustfmt over every member / cargo metadata over every member + physical manifests
  CROSS_SET                  --workspace on the host: diagnostic only (factc-wasm-abi is target-specific), weight NONE
  HEURISTIC                  factory nostd-check / depcheck: weight NONE; never a gate
run                          sh tests/toolchain/run-qualified-proof.sh <evidence dir>   (every cargo call names +<pin>)
history                      tests/toolchain/run-proof-matrix.sh is the D9 matrix, kept for reproduction of D9
```
