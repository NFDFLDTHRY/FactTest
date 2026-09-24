# FactTest Handoff (live, model-independent entrypoint)

STATUS: LIVE.  Introduced by D13-REPO-HYGIENE; every later delta that changes project state updates sections 1 and 6.
This page is written for any agent or person.  No session prompt, model or earlier conversation is needed to continue
the project; everything below points at repository files.

## 1. Current state

```text
canonical branch   claude/facttest-materialization-27amc7 (merged into main by the owner through pull requests)
last delta         D17-IMPLEMENTATION-REALITY (pass 4 of the D14-D19 technical reference review series; integration
                   commit in design/materialization/LEDGER.md)
materialized       Factory plane (factory/), no_std compiler kernel (compiler/), host driver + browser harnesses (host/),
                   Byte Relay physically commissioned in Chromium 141 (SwiftShader WebGPU + wasm64), D9 qualified
                   Rust/Cargo proof harness, D11 computational environment map, D12 self-hosting architecture (ASCII +
                   primitive probes only), D13 chain hygiene (this page, proof sets, toolchain pin, literal surfaces),
                   D14 authority frontier epoch (64 AUTHORITY_REVISION nodes, Q17 staleness traversal), D15 foundational
                   clause epoch (60 exact clauses VERIFIED at source tips, 6 PROPOSED constraints, Q18 claim traversal),
                   D16 capability universe (33 families of G traced at 90 more clauses, exposure census, Q19),
                   D17 implementation reality (19 behaviours on 44 clauses pinned to the versions run, kernel section
                   identity, label audit, Q20)
not materialized   self-hosting (seed/broker, browser Factory, in-browser Rust), missing ABI exports, hardware GPU,
                   WGSL, shared/threaded Wasm; of the 33 capability families only 6 are [RUN] (Q19; section 6)
series             D14-D19 (design/materialization/D14-D19-TECHNICAL-REFERENCE-REVIEW-PROMPT.md): one StructuralDelta
                   per pass, each closed, verified, integrated and re-observed before the next
next               D18-REPO-RECONCILIATION (given D14-D17, what must change inside the current FactTest model?),
                   starting from design/materialization/D17-OBSERVED-IMPLEMENTATION-REALITY.md: the 6 MISLABEL
                   corrections (FACT-LBL-*), implementation re-pins (FACT-IMPL-PINS-NOT-RUNNING-VERSION), PROPOSED
                   constraints (D15/D16), kernel identity definition, stale claims (Q17, FACT-WORKERS-UNPROBED), sensor
                   routing.  Historical evidence is never mutated.  The owner PAUSED the D12-predicted seed/broker
                   qualification; it is renumbered after D19.
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
               $F station open  <delta> factory/fixtures/<D>/<fx>.json   (check its exit status: copy NOTHING if
                                                                             the open is refused; D14 lesson)
               copy exactly the files that station produces into the workpiece
               (repair: never re-run a fixture to repair - its receipt then covers only that run's changes and the
               earlier ones become unreceipted; restore every path the fixture changed to base first, then run a NEW
               (or corrected) fixture that re-makes all of them; D17 lesson)
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
               epochs/D12.json .. epochs/D17.json; AUTHORITY-REGISTER.md and TRACEABILITY.md are generated);
               tests/reference/<epoch>-clauses.json (exact-clause manifests; constraints there are PROPOSED until D18);
               tests/capability/universe.json (the G trace + reviewed classification; G itself is CAPABILITY-MATRIX.md);
               tests/implementation/{reality.json, label-audit.json} (implementation behaviours; reviewed label findings);
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
C      D13 H-12 (FACT-KERNEL-IDENTITY-      kernel bytes depend on the rust-src install name; D17 narrows it: only  [GAP] narrowed
       INSTALL-PATH)                        the custom "name" section differs (LLVM promoted-symbol hash;
                                            FACT-KERNEL-EXEC-SECTIONS-INSTALL-INDEPENDENT [RUN]); identity
                                            definition D18, re-proof D19
C      D11 WGSL / CON-GPU-003               WGSL never compiled or dispatched                                  [GAP]
C      D11 hardware GPU                     only SwiftShader fallback adapters ever observed                   [UNK]
C      ERR-002 / ERR-003                    shared/threaded Wasm unadmitted (presence only)                    [ERR]
C      D11 Q09 -> D16 Q19                   the capability map is no longer hidden: 33 families traced (174 clause  [GAP] mapped
                                            steps, 6 verified absences, 51 explicit GAP steps); RUN 6, OBS 16,
                                            GAP 10, ERR 1 (evidence/D16/envmap/queries/Q19.json)
C      D16 chooser/activation families      HID, USB, Serial, Bluetooth, immersive XR, device-orientation          [OBS]/[GAP]
                                            permission need a user gesture or virtual device path to be admitted
                                            (CON-CAP-002 PROPOSED)
D      D16 Generic Sensor advisements       whole family flagged at its tips (Proximity: no engine; Magnetometer,  [OBS]
                                            Ambient Light: not default anywhere; motion sensors: new projects ->
                                            Device Orientation and Motion); all kept in G; routing decision D18
D      D16 stale claim                      FACT-WORKERS-UNPROBED (D11) contradicted by D12 worker evidence (D18)   [ERR]
D      D17 label audit                      6 MISLABEL findings (FACT-LBL-01/06/07/10/11/12): Chromium hook stated  [ERR]
                                            as standard, WebGPU switch set omitted, headless shell presented as
                                            Chromium/installed, implementation pins not the version run;
                                            corrections D18 (tests/implementation/label-audit.json)
D      D17 implementation pins              D11 Chromium switch / V8 flag authorities pinned to later main commits   [ERR]
                                            (FACT-IMPL-PINS-NOT-RUNNING-VERSION); running-version clauses exist
D      D17 installed-Chrome durability      full Chrome grants durable storage to installed/important sites; the   [UNK]
                                            headless shell answers ASK to every permission: installed Factory
                                            durability never observed (IB-CHROME-DURABLE-STORAGE)
D      D17 Dawn 9caf493                      Dawn source unreachable through the mirror (fallback = CPU adapter     [GAP]
                                            pinned on the Blink and SwiftShader side only)
D      D17 non-Linux platforms              Android/ChromeOS/Mac/Win defaults differ (WebGPU, Vulkan, Bluetooth);  [UNK]
                                            only Linux observed
C      CAPABILITY-MATRIX / CONSTRAINT-      capability rows marked [GAP]/[ERR]/[UNK] in the law ledgers        as marked
       LEDGER rows
D      web-api #streaming-module-compilation-  D14: the cited id never existed at the pin (explicit id           [ERR]
       and-instantiation                    streaming-modules); D11's PRESENT_IN_SOURCE was false; source-level
                                            locator #streaming-modules (D14 revision); law correction D18
D      git #_worktrees (repository-layout)  D14: a definition-list term with no asciidoctor id; published     [UNK]
                                            rendering unknown
D      rust-lang/rust pins                  D14: branch master removed; pinned commit is main (pin field D18)   [OBS]
D      ERR-001 (D15 CL-R7)                  current, not historical: the rustc wasm64 page at the rust-lang/rust  [ERR]
                                            main tip still calls memory64 "not standardized"; Core 3.0 (CL-W4)
                                            standardizes it.  The Core governs (CON-RS-003); law wording D18
D      git tree-entry order (D15 CL-G3)     "normalized by mktree" with no documented rule; browser tree ids     [GAP]
                                            are correct only where equality with git was observed (P09); the
                                            ordering rule's implementation source -> D17
D      SharedArrayBuffer global (D15 CL-T6) absence without COI is host behaviour (FACT-SAB-GLOBAL-HOST-      [OBS]
                                            DEFINED); only serialization is standard-gated (CL-T4); Chromium
                                            source -> D17
D      D15 proposed constraints             CON-WA-006, CON-SEC-002, CON-PP-001, CON-SW-001, CON-ST-001,          [GAP]
                                            CON-GIT-001 exist only as PROPOSED graph nodes; CONSTRAINT-LEDGER D18
D      Q18 claim traversal (D15)            RUN claims that stop before COMPLETE: EXACT CLAUSE (GPU/WebGPU ->     [GAP]
                                            D16; process facts), IMPLEMENTATION CONTRACT, CURRENT AUTHORITY
                                            (project facts -> D18); evidence/D15/envmap/queries/Q18.json
D      published frontier (D14)             53 renderings refused + 2 github.com 403: no current published      [UNK]
                                            authority verified in D14 (FACT-PUBLISHED-FRONTIER-UNVERIFIED); D15
                                            clauses are likewise verified at source tips only
D      js-api #internal-storage             cited in 5 law files and fixtures/commissioning/contracts.ascii;   [ERR]/[UNK]
                                            not an id in pinned WebAssembly/spec@608711107b; published page
                                            not opened (annotated in place by D13); D14: MOVED to
                                            #webassembly-storage; D15 cites the clause at #store (CL-T1); law
                                            correction D18
D      D11 FACT-AUTHORITY-REOPEN-DENIED     37 of 48 D11 authorities and all 16 D12 authorities read from       [UNK]
                                            pinned sources only; published hosts DENIED
D      D12 B-19                             githack public-origin path unreachable (proxy 403)                  [UNK]
D      D12 B-18, B-20                       GitHub smart-HTTP CORS; browser update behaviour                    [OBS]/[UNK]
D      CONFLICT-LEDGER ERR-001 et al.       authority conflicts preserved as ledger rows                        [ERR]
B      D0-D12 receipts/evidence             incomplete environment identity (receipt format 2 from D14 on)      kept
B      D3-D8 fixture wording                "all ladders" / "full suite" overstated the selection               kept
B      D1-D8 heuristic gates                nostd-check/depcheck used as gates (proof weight now NONE)          kept
B      scratch-only tooling                 D0-D13 route scripts, D11 graph generator (procedure: section 4)    kept
B      workpiece root                       W11-stage, W14-stage, W16-stage, W17-stage (base-era graph views       [GAP] kept
                                            the audit cannot prove superseded; comparing stage blobs with
                                            canonical_base is a D18 item), factory-bootstrap-bin (unmanaged)
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
