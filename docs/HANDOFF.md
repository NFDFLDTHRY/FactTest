# FactTest Handoff (live, model-independent entrypoint)

STATUS: LIVE.  Introduced by D13-REPO-HYGIENE; every later delta that changes project state updates sections 1 and 6.
This page is written for any agent or person.  No session prompt, model or earlier conversation is needed to continue
the project; everything below points at repository files.

## 1. Current state

```text
canonical branch   claude/facttest-materialization-27amc7 (merged into main by the owner through pull requests)
last delta         D19-REPROVE-REOBSERVE (pass 6, the last of the D14-D19 technical reference review series;
                   integration commit in design/materialization/LEDGER.md)
baseline           design/materialization/D19-STABLE-BASELINE.md (STABLE-BASELINE: ESTABLISHED) - what later work may
                   rely on, the entitled-claim surface (graph query Q22) and how to re-verify it
materialized       Factory plane (factory/), no_std compiler kernel (compiler/), host driver + browser harnesses (host/),
                   Byte Relay physically commissioned in the Chromium 141 headless shell (SwiftShader CPU fallback
                   WebGPU under the unsafe WebGPU switches, plus wasm64), D9 qualified Rust/Cargo proof harness, D11
                   computational environment map, D12 self-hosting architecture (ASCII + primitive probes only), D13
                   chain hygiene (this page, proof sets, toolchain pin, literal surfaces), D14 authority frontier epoch
                   (64 AUTHORITY_REVISION nodes, Q17 staleness traversal), D15 foundational clause epoch (60 exact
                   clauses VERIFIED at source tips, Q18 claim traversal), D16 capability universe (33 families of G
                   traced at 90 more clauses, exposure census, Q19), D17 implementation reality (19 behaviours on 44
                   clauses pinned to the versions run, kernel section identity, label audit, Q20), D18 reconciliation
                   (one current model: 36 reconciliations, 15 supersessions, 19 constraints ledgered, 6 label findings
                   resolved, kernel identity defined; law annotated insertion-only; Q21), D18R chain repair (one D18
                   worker statement contradicted committed evidence: superseded; D12 executable field corrected), D19
                   re-proof (environment identity captured; the minimum affected set selected from the graph and
                   re-proved physically; current evidence epoch; entitled-claim surface Q22)
not materialized   self-hosting (seed/broker, browser Factory, in-browser Rust), missing ABI exports, hardware GPU,
                   WGSL, shared/threaded Wasm; of the 33 capability families only 6 are [RUN] (Q19; section 6)
series             D14-D19 (design/materialization/D14-D19-TECHNICAL-REFERENCE-REVIEW-PROMPT.md): CLOSED - one
                   StructuralDelta per pass (plus the D18R chain repair), each closed, verified, integrated and
                   re-observed before the next
next               an OWNER decision: the paused D12-predicted seed/broker qualification (renumbered after D19) or any
                   row of section 6.  Before building on a claim, re-run the D19 selection (section 7) against the then
                   current environment; historical evidence is never mutated.
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
             (absence: check an absence claim against the committed evidence - grep evidence/ and the graph's
             EVIDENCE observed_result - before asserting "never observed" / "no fixture"; D18R lesson)
             (closed statements: a [GAP]/[ERR]/[UNK] fact INVALIDATED_BY later evidence is history, not an open
             stop - read Q22 explicit_stops, never a bare status count; D19 lesson)
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
               epochs/D12.json .. epochs/D19.json; AUTHORITY-REGISTER.md and TRACEABILITY.md are generated);
               tests/reference/<epoch>-clauses.json (exact-clause manifests; the constraints they proposed are ledgered
               in CONSTRAINT-LEDGER.md since D18); tests/reconcile/d18-reconciliation.json (the reviewed D18 register:
               supersessions, ledgering, resolutions; graph query Q21 is the current model); tests/reprove/
               (D19 dimension rules, runbook, obligations; Q22 is the entitled-claim surface);
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
C      D12 B-11 (P07)                       persist() false in the Chromium 141 headless shell (every permission     [UNK]
                                            ASK); installed-Factory durability never observed - full Chrome grants
                                            durable storage to installed/important sites (FACT-SH-STORAGE-DURABILITY-D18)
C      D12 B-03                             station commands are OS programs (portability)                     [ERR]
C      D12 B-04                             RUST_BUILD only on a host                                          [UNK]
C      D12 B-13 remainder                   verifier source-commit provenance (binary sha256 is recorded)       [GAP]
C      D11 WGSL / CON-GPU-003               WGSL never compiled or dispatched                                  [GAP]
C      D11 hardware GPU                     only SwiftShader fallback adapters ever observed                   [UNK]
C      ERR-002 / ERR-003                    shared/threaded Wasm unadmitted (presence only); standard, host and       [ERR]
                                            Chromium layers stated apart (FACT-SHARED-THREADS-UNADMITTED-D18)
C      D11 Q09 -> D16 Q19                   the capability map is no longer hidden: 33 families traced (174 clause  [GAP] mapped
                                            steps, 6 verified absences, 51 explicit GAP steps); RUN 6, OBS 16,
                                            GAP 10, ERR 1 (evidence/D16/envmap/queries/Q19.json)
C      D16 chooser/activation families      HID, USB, Serial, Bluetooth, immersive XR, device-orientation          [OBS]/[GAP]
                                            permission need a user gesture or virtual device path to be admitted
                                            (CON-CAP-002, ledgered D18)
C      D18R workers (FACT-WORKERS-D18R)     a dedicated worker was constructed (D12 P10) and hardwareConcurrency 4    [GAP]
                                            was observed (D11, D16), but no worker admission contract exists
C      D11 streaming (FACT-STREAMING-       compileStreaming / application/wasm delivery never exercised (citation     [GAP]
       UNPROBED)                            corrected D18: #streaming-modules)
D      D16 Generic Sensor advisements       whole family flagged at its tips (Proximity: no engine; Magnetometer,  [OBS]
                                            Ambient Light: not default anywhere; motion sensors: new projects ->
                                            Device Orientation and Motion); all kept in G; OBS-004 extended (D18);
                                            choosing a routing is OWNER D-10
D      D17 Dawn 9caf493                      Dawn source unreachable through the mirror (fallback = CPU adapter     [GAP]
                                            pinned on the Blink and SwiftShader side only)
D      D17 non-Linux platforms              Android/ChromeOS/Mac/Win defaults differ (WebGPU, Vulkan, Bluetooth);  [UNK]
                                            only Linux observed
D      D18 tool documentation pins          cargo book, git documentation and Rust Reference pinned at branch       [GAP]
                                            commits, not at the running tool versions (reconciliation R-19)
C      CAPABILITY-MATRIX / CONSTRAINT-      capability rows marked [GAP]/[ERR]/[UNK] in the law ledgers        as marked
       LEDGER rows
D      git #_worktrees (repository-layout)  D14: a definition-list term with no asciidoctor id; published     [UNK]
                                            rendering unknown
D      ERR-001 (D15 CL-R7, D17 CL-IMP-RS2)  current, not historical: the rustc wasm64 page at the rust tip and at  [ERR]
                                            the toolchain run (6eeff9a52) still calls memory64 "not standardized";
                                            Core 3.0 (CL-W4) standardizes it.  The Core governs (CON-RS-003);
                                            CONFLICT-LEDGER annotated D18
D      git tree-entry order (D15 CL-G3)     "normalized by mktree" with no documented rule; browser tree ids     [GAP]
                                            are correct only where equality with git was observed (P09); git's
                                            ordering source not traced (D17 traced browser and toolchain sources)
D      Q18 claim traversal                  current RUN claims that stop before COMPLETE: IMPLEMENTATION CONTRACT,  [GAP]
                                            CURRENT AUTHORITY (process facts), EXACT CLAUSE (project facts cited at
                                            locator level), PROJECT CONSTRAINT; each stop is explicit
                                            (evidence/D19/envmap/queries/Q18.json, Q22)
D      published frontier (D14)             53 renderings refused + 2 github.com 403: no current published      [UNK]
                                            authority verified in D14 (FACT-PUBLISHED-FRONTIER-UNVERIFIED); D15
                                            clauses are likewise verified at source tips only
D      D11 FACT-AUTHORITY-REOPEN-DENIED     37 of 48 D11 authorities and all 16 D12 authorities read from       [UNK]
                                            pinned sources only; published hosts DENIED
D      D12 B-19                             githack public-origin path unreachable (proxy 403)                  [UNK]
D      D12 B-18, B-20                       GitHub smart-HTTP CORS; browser update behaviour                    [OBS]/[UNK]
D      CONFLICT-LEDGER ERR-001 et al.       authority conflicts preserved as ledger rows                        [ERR]
B      D0-D12 receipts/evidence             incomplete environment identity (receipt format 2 from D14 on); D19:      kept
                                            9 stale-condition pairs undecidable (V8 version, GPU device node, launch
                                            options or components never recorded; evidence/D19/selection.json unk)
B      D3-D8 fixture wording                "all ladders" / "full suite" overstated the selection               kept
B      D1-D8 heuristic gates                nostd-check/depcheck used as gates (proof weight now NONE)          kept
C      D9 native --workspace                cargo build/clippy --workspace fail on the host: factc-wasm-abi's   [ERR] kept
       (FACT-NATIVE-WORKSPACE-UNBUILDABLE)  panic_handler is wasm64-only; the proof sets partition the roots
                                            (section 7: CROSS_SET is diagnostic, weight NONE)
B      scratch-only tooling                 D0-D13 route scripts, D11 graph generator (procedure: section 4)    kept
B      workpiece root                       W11-stage, W14-stage hold base-era graph views that are not in the      [GAP] kept
                                            canonical history; W16-W19-stage are proven superseded (every file blob
                                            is in the canonical history: evidence/D18/workpieces/stages.json);
                                            W20-W21-stage differ from their integrated trees only in the three
                                            generated graph views (evidence/D19/workpieces/audit-after.json);
                                            factory workpiece retire handles worktrees only; factory-bootstrap-bin
                                            (unmanaged)
OWNER  D-1 home origin; D-2 generated-app origins (B-16 [ERR]); D-3 RUST_BUILD strategy; D-5 BUILD without registry
       (B-07); D-6 object hash; D-8 seed replacement; D-9 history horizon; D-10 sensor routing (Generic Sensor
       families vs Device Orientation and Motion; CONFLICT-LEDGER OBS-004); deleting the fully merged remote branches
       claude/d9-rust-cargo-proof-4nys6s, factory/reference-corpus-wasm64, work/pass2-5-reference-ingress-1
DECIDED D-4 toolchain pin (D13, by evidence); D-7 literal path authority (owner prompt D13 target 1)
```

Resolved by D18-REPO-RECONCILIATION (tests/reconcile/d18-reconciliation.json; graph query Q21; history in
design/materialization/D18-OBSERVED-REPO-RECONCILIATION.md):

```text
D13 H-12 kernel identity            exec identity, install-name independent (tests/toolchain/proof-sets.json exec_identity;
                                    FACT-KERNEL-IDENTITY-DEFINED-D18); re-proof in D19
D16 stale claim                     FACT-WORKERS-UNPROBED superseded by FACT-WORKERS-D18 and, after the D18R repair, by
                                    FACT-WORKERS-D18R; invalidated by EV-D12-P10 and EV-D11-BROWSER-GPUFLAGS
D17 label audit                     6 MISLABEL findings resolved: live handoff text replaced, README correction line,
                                    graph facts superseded or corrected (R-40..R-47)
D17 implementation pins             D11 Chromium/V8/SwiftShader authorities superseded by pins at the versions run (R-48)
rust-lang/rust pins                 superseded by pins at the toolchain run, rust-lang/rust@6eeff9a52 (R-12)
web-api / js-api fragment citations current authorities AUTH-WASM-WEBAPI-STREAMING-D18 (#streaming-modules) and
                                    AUTH-WASM-JSAPI-STORAGE-D18 (#webassembly-storage); law citations kept and annotated;
                                    fixtures/commissioning/contracts.ascii keeps the historical URL as commissioned
                                    compiler input (R-10, R-11)
SharedArrayBuffer global            standard / host / Chromium layers stated in CONFLICT-LEDGER ERR-002 (R-24)
proposed constraints                19 PROPOSED constraints (D11, D13, D15, D16) ledgered in CONSTRAINT-LEDGER.md (R-21)
```

## 7. Proof sets and toolchain

```text
rust-toolchain.toml          1.94.1 (rustc e408947bf) + clippy, rustfmt     -> bare cargo in the repository
tests/toolchain/proof-sets.json
  HOST_NATIVE_SET            1.94.1, host, dev + release, default-members (13 roots) == bare cargo
  WASM64_KERNEL_SET          nightly-2026-09-24 (rustc 6eeff9a52) + rust-src, clippy; wasm64-unknown-unknown,
                             -Z build-std=core, -p factc-wasm-abi (12-crate core-only graph); kernel identity =
                             exec identity (every section except the custom "name" section; install-name independent,
                             D18); whole-file sha256 recorded per rust-src install name (informational)
  ALL_SOURCES / ALL_MEMBERS_GRAPH   rustfmt over every member / cargo metadata over every member + physical manifests
  CROSS_SET                  --workspace on the host: diagnostic only (factc-wasm-abi is target-specific), weight NONE
  HEURISTIC                  factory nostd-check / depcheck: weight NONE; never a gate
run                          sh tests/toolchain/run-qualified-proof.sh <evidence dir>   (every cargo call names +<pin>)
history                      tests/toolchain/run-proof-matrix.sh is the D9 matrix, kept for reproduction of D9
re-prove (D19)               node tests/reprove/identity.mjs --graph design/environment-map/graph.json --out <dir>/identity;
                             node tests/reprove/select.mjs ... --out <dir>/selection.json (environment drift, implementation
                             change, obligations); node tests/reprove/run-selected.mjs --kind cite|build|source|repo; the
                             runbook (tests/reprove/runbook.json) names each claim's re-proof and expected observation
```
