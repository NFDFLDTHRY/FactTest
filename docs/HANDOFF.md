# FactTest Handoff (live, model-independent entrypoint)

STATUS: LIVE.  Introduced by D13-REPO-HYGIENE; every later delta that changes project state updates sections 1 and 6.
This page is written for any agent or person.  No session prompt, model or earlier conversation is needed to continue
the project; everything below points at repository files.

## 1. Current state

```text
canonical branch   claude/facttest-materialization-27amc7 (merged into main by the owner through pull requests; main's
                   parallel line - pull request #5 - joined by the content-neutral sync merge c3159d5 and D20)
last delta         D27-FOUNDATION-CLOSURE-ALIGNMENT (the foundation-closure / repo-alignment pass: the current
                   repository reconstructed as executable evidence of what the installed Factory WebApp must preserve;
                   the live target design/foundation-closure/FOUNDATION-CLOSURE-TARGET.md assembled with its registers
                   and structurally checked; integration commits in design/materialization/LEDGER.md; the
                   implementation baseline stays design/materialization/D26-STABLE-BASELINE.md)
current target     design/foundation-closure/FOUNDATION-CLOSURE-TARGET.md: AN INSTALLED FACTORY WEBAPP THAT CONTINUES
                   FACTORY WORK, MANUFACTURES AND QUALIFIES ITS OWN SUCCESSOR, AND EVOLVES THE ASCII LANGUAGE through
                   which a human and a local model describe what the Factory should build.  Registers
                   tests/closure/registers/ (correspondence matrix, component classification, language hardening,
                   language-evolution contract, blockers, Rust-build boundary, seed/TCB, acceptance test, sequence),
                   rendered to design/foundation-closure/CLOSURE-REGISTERS.md and gated by
                   tests/closure/structural-check.mjs (evidence/D27/closure/structural-check.json).  Verdict today:
                   SELF-HOSTING NOT CLOSED (0 of 16 acceptance steps run without the host; step 4 is the RUST_BUILD
                   boundary); every step has its mechanism, evidence and sequence step
language           LANGUAGE VERSION 1 = what compiler/source implements at the D27 base; machine-readable manifest
                   tests/closure/language-manifest-v1.json (derived, checked against ASCII-GRAMMAR.md); compatibility
                   oracle tests/closure/language-corpus-v1.json (53 entries); evolution contract: the target section 4
                   + ASCII-GRAMMAR.md D27 annotation; station S-LANGUAGE-LAW (version-bound to the compiler)
judge              the Factory built from this tree (tests/factory/run-witnesses.sh records its sha256): every refusal
                   reason of the prompt witnessed (tests/factory/witnesses.json, factory/tests/factory_law.rs f00-f28,
                   tests/sync/collision-witness.sh); six accepted attacks found by D22 and repaired before D23
manifest           design/execution-manifest/CURRENT-EXECUTION-MANIFEST.md (generated): every tracked path tiered, every
                   live component with owner, consumers, stations, tests, probes, claims, evidence and stale dimensions;
                   tests/manifest/issues.json: every finding classified A..G with the task that repairs it
baseline           design/materialization/D19-STABLE-BASELINE.md (STABLE-BASELINE: ESTABLISHED) - what later work may
                   rely on and how to re-verify it; the current entitled-claim surface of the joined model is graph
                   query Q22 of the D20 graph (design/materialization/D20-OBSERVED-MAIN-SYNC.md, section 6)
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
                   re-proved physically; current evidence epoch; entitled-claim surface Q22), main's parallel D14 line
                   (pull request #5: a Pages-branch retrieval route under the egress policy, fixtures/reference/ corpus of
                   83 reproducibility copies, D11 pins re-checked) joined by D20 with a second re-proof, D21 execution
                   manifest (the current executable system enumerated and every problem classified before repair), D22
                   Factory self-qualification (the judge attacked with every refusal reason of the prompt; receipt
                   integrity, identity probes, command and canonical confinement repaired), D23 compiler + ABI
                   execution (every crate compile -> focused tests -> consumer test in dependency order on the
                   qualified proof sets; the wasm transport completed: BUILD + OBSERVE in Chromium byte-identical to
                   the native driver; D12 B-06 closed as transport-only), D24 pipeline genericity (four semantically
                   distinct specimens - Byte Relay, ledger-mirror, pixel-vault, dual-stream - through one compiler, one
                   generic browser harness, observe and integrity; the runtime executes transfer(relation, bytes) by
                   the verified requirement of each authored relation, the shell is data-driven, every tape is bound
                   to its bundle's strategy data identity, the adapter family is verified; the attack list refused),
                   D25 physical runtime (the four fresh bundles driven through their own shells in Chromium with and
                   without WebGPU and under isolation headers, every runtime behaviour of the prompt with fresh
                   evidence and the exact environment identity; the selfhost primitives on the fresh bundle; the
                   public-HTTPS route unreachable from this environment - recorded as an exact boundary with a
                   deployable probe, never substituted by localhost), D26 clean commissioning (the complete implemented
                   system manufactured, verified and executed from the canonical source on a clean workpiece with
                   fresh build directories; the STALE_IF-selected claims re-proved through the runbook; the five
                   consistency equalities and the 21 lines of the six-task final condition computed from evidence:
                   tests/audit/)
not materialized   self-hosting (seed/broker, browser Factory, in-browser Rust), missing ABI exports, hardware GPU,
                   WGSL, shared/threaded Wasm; of the 33 capability families only 6 are [RUN] (Q19; section 6)
series             D14-D19 CLOSED; D21-D26 CLOSED by D26; D27 = the alignment pass that opens the foundation-closure
                   series FC-1..FC-8 (tests/closure/registers/sequence.json: D28-SEED-BROKER-QUALIFICATION,
                   D29-BROWSER-OBJECT-STORE, D30-FACTORY-CORE-PORT, D31-CAPABILITY-STATIONS, D32-LANGUAGE-2-PROPOSAL,
                   D33-CANDIDATE-QUALIFICATION-RUNNER, D34-RUST-BUILD-SPIKE, D35-GENERATION-SWAP): one StructuralDelta
                   per step, each closed, verified, integrated and re-observed before the next
next               FC-1 D28-SEED-BROKER-QUALIFICATION (the immutable minimal seed and its failure matrix) - not begun by
                   D27.  The entitled-claim surface is graph query Q22 of the D27 graph
                   (evidence/D27/envmap/queries/Q22.json); the remaining stops are the boundary rows of section 6, the
                   blocker register tests/closure/registers/blockers.json and the open issues of
                   tests/manifest/issues.json (every one class D/E/F/G); the owner decisions D-1 (home origin), D-2
                   (generated-app origins), D-3 (RUST_BUILD strategy), D-5, I-12, I-13, I-18, I-29, I-33 and the
                   public-HTTPS run (tests/physical/PUBLIC-HTTPS-PROBE.md) are the external inputs a later delta carries
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
             (re-inspection: a refused re-inspection of an integrated delta is an internal defect of that delta; a repair
             delta reproduces the refusal at the integration commit, preserves it as evidence and witnesses the repair
             there before the next task starts; D21R lesson)
             (parallel lines: a line merged into main from another branch is joined by a content-neutral sync merge -
             git merge -s ours, tree equal to the first parent - and a Factory delta that imports its files from git
             objects with tests/sync/import-line.mjs, relocating what collides; D20 lesson)
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
               + factory/registry/stations/*.json (the JSON is authoritative for surfaces; S-LANGUAGE-LAW since D27 for
               the five language-law documents, version-bound to the compiler), FINAL-HANDOFF-REQUIREMENTS.md
               (its requirements; the title is historical), REFERENCE-AUTHORITY.md, CONSTRAINT-LEDGER.md,
               CONFLICT-LEDGER.md, CAPABILITY-MATRIX.md, IMPLEMENTATION-CONTRACTS.md, EVIDENCE-OBLIGATIONS.md,
               ASCII-GRAMMAR.md, ASCII-LANGUAGE.md, SEMANTIC-MODEL.md, LOWERING-MODEL.md, REFINEMENT-LAW.md,
               REPRESENTATION-TRANSFER.md, VERIFICATION-CERTIFICATES.md, PLANNER-COST-MODEL.md,
               RUNTIME-ADMISSION-REPLAN.md, CODEGEN-BUNDLE-CONTRACT.md, LANGUAGE-TESTS.md, COMMISSIONING-*.md,
               BOOTSTRAP-*.md (owner contracts; "current owner contracts govern"); LICENSE (the repository's
               license: the owner's terms, held with the law tier)
LIVE RECORD    design/foundation-closure/ (FOUNDATION-CLOSURE-TARGET.md = the current target; CLOSURE-REGISTERS.md is
               generated by tests/closure/structural-check.mjs from tests/closure/registers/*.json - the correspondence
               matrix, component classification, language hardening register, language-evolution contract, blocker
               register, Rust-build boundary, seed/TCB, acceptance test, implementation sequence, language corpus);
               tests/closure/language-manifest-v1.json and tests/closure/language-corpus-v1.json (the LANGUAGE 1 manifest
               and frozen corpus table: derived / frozen by the compiler, never edited);
               design/materialization/LEDGER.md; design/environment-map/ (graph.json = merge of the D11 graph and
               epochs/D12.json .. epochs/D19.json, epochs/D14-RESCAN.json=D14-RESCAN, epochs/D20-SYNC.json,
               epochs/D20.json; AUTHORITY-REGISTER.md and TRACEABILITY.md are generated);
               tests/reference/<epoch>-clauses.json (exact-clause manifests; the constraints they proposed are ledgered
               in CONSTRAINT-LEDGER.md since D18); tests/reconcile/d18-reconciliation.json (the reviewed D18 register:
               supersessions, ledgering, resolutions; graph query Q21 is the current model); tests/reprove/
               (D19 dimension rules, runbook, obligations; Q22 is the entitled-claim surface);
               tests/manifest/{components.json (reviewed component register), issues.json (issue inventory A..G)} and
               design/execution-manifest/ (the generated CURRENT EXECUTION MANIFEST; render-checked);
               fixtures/reference/ (the imported line's ROUTES.json retrieval route, REGISTER.json copy identities,
               published/ and sources/ reproducibility copies: pins, never current authority; re-check with
               tests/reference/ingress.mjs on that line's inputs); tests/sync/ (line import map of D20);
               tests/reconcile/d20-reconciliation.json (the two lines reconciled, R-54..R-63);
               tests/capability/universe.json (the G trace + reviewed classification; G itself is CAPABILITY-MATRIX.md);
               tests/implementation/{reality.json, label-audit.json} (implementation behaviours; reviewed label findings);
               this page; the newest D<n> intended/observed pair; tests/toolchain/proof-sets.json; rust-toolchain.toml
HISTORICAL     FABLE-ASCII-SYSTEM-PROMPT.md (bootloader of the original Fable 5.1 materialization session; carries a
               HISTORICAL banner), PASS1.md-PASS6.md, PASS5-TESTS.md, PASS6-TESTS.md, PASS6-GAP-REPAIRS.md,
               PLANNED-REPO-LAYOUT.md (PASS 5 plan; the law/ zone was never created), M0-INTENDED-SYSTEM.md,
               M9-OBSERVED-SYSTEM.md, COMMISSIONING-RECORD.md, D9-D13 prompts and closed intended/observed records,
               the imported line's D14-REFERENCE-RESCAN records (its "D14 ANNOTATION" lines in the law documents are
               that line's, not this branch's D14-FRONTIER-REOPEN, which annotated nothing),
               evidence/, factory/receipts/, factory/deltas and factory/fixtures of integrated deltas.  Historical
               files are never rewritten; D13 added insertion-only annotations where they looked live.
SESSIONS       historical: M0-M9 / D0-D8 ran under the Fable 5.1 session bootloader (historical record only)
               historical: D9-D13 ran in later Opus sessions (historical record only)
               Nothing in the live law depends on any model or session.
```

Observed repository layout: factory/ (src, tests, registry, deltas, fixtures, receipts), compiler/<crate>/,
host/ (factc, harness), fixtures/ (language, compiler/negative, commissioning, toolchain, reference), tests/ (bootstrap,
commissioning, language, toolchain, envmap, selfhost, hygiene, reference, reconcile, reprove, sync), evidence/<delta>/
(evidence/D14-RESCAN/ holds the imported line's relocated D14 records), design/ (materialization,
environment-map), docs/ (this page), root law documents.

## 6. Open-boundary register

Every remaining [ERR]/[GAP]/[UNK] is one of these rows.  Class: C capability gap, D authority uncertainty, B historical
evidence limit, OWNER decision.  None is an internal chain defect (D13 PRE-RESCAN-BASELINE).  The D21 issue inventory
(tests/manifest/issues.json) maps these classes to the prompt's A..G (C -> D, D -> E, B -> F, OWNER -> G) and records
the internal findings the D21 survey added, each with the task that repairs it: A (1) a stale kernel crate header
(D23); B (7) missing Factory negative witnesses (D22), the wasm transport beyond the bootstrap eight (D23), per-crate
consumer execution (D23), the anti-cheat scan's byte form (D24, done), the shell never exercised and a probe defaulting
to a historical bundle (D25), graph claims for eleven live components (D21, done); C (2) the specimen payload compiled
into the generated shell and the single-relation runtime (D24: both were real defects, repaired and proven by three
non-relay specimens; no architectural GAP remained in the claimed semantics); G (3) law-text presentation and wording
(owner).  Until each task closes, these are open internal findings, not boundaries.  D24 found three more accepted
attacks in the compiler (I-30 a foreign evidence tape observed as PASS, I-31 a backend realized by an adapter of another
family verified PASS, I-32 an empty bundle certificate reading PASS): reproduced on the base compiler
(tests/genericity/reproduce-base.sh), repaired, witnessed by tests/genericity/run-attacks.mjs and the genericity ladder;
one class D stop recorded (I-33 runtime self-integrity, D25).  The D21 re-inspection found one more class A defect (the manifest builder read its own epoch after
integration, changing two findings): repaired and witnessed by D21R-MANIFEST-REPAIR before D22.  D22 closed I-14 (every
reason witnessed) and found six accepted attacks in the Factory itself (I-21..I-26, class A: edited and hand-written
receipts verified, a failed identity probe closed PASS, escaping command cwd/log opened, a station writing into the
canonical checkout closed PASS, a littering re-inspection matched): reproduced with the committed Factory, repaired in
factory/src/ops.rs, witnessed (f17-f28) before D23.  D27 found two more class A defects: I-40 (no station had authority over the
five language-law documents: repaired as machinery, station S-LANGUAGE-LAW, attacked by tests/closure/
station-authority-census.mjs before and after) and I-41 (the D24-D26 evidence indexes list evidence/D21, inherited from
the D21 fixture: the D27 index names its own package; the historical files stay as written); both REPAIRED in D27.

```text
CLASS  ID / SOURCE                          BOUNDARY                                                          STATUS
C      D12 B-01, B-02 -> FB-01, FB-02       no Factory WebApp / browser state model; git subprocess state      [GAP]
                                            (blocker register tests/closure/registers/blockers.json; sequence FC-1..FC-3)
D      FB-22 / I-39 (D27)                    observed ASCII is accepted by ANALYZE as authored source: no LANGUAGE 1  [GAP]
                                            statement marks a unit as authored, canonical or observed
                                            (FACT-D27-OBSERVED-ASCII-NOT-DISTINGUISHABLE; LANGUAGE 2 candidate, FC-5;
                                            Factory law L-EV-5 holds the boundary meanwhile)
D      FB-21, FB-23, FB-24, FB-27 (D27)      no language version statement in source (LANGUAGE VERSION 1 bound by     [GAP]
                                            annotation + derived manifest); no vocabulary query on the running
                                            kernel; L30 witnessed by fixed transforms only; one-workspace capacity
                                            (FC-5)
C      FB-04 (D12 B-04, D27)                 RUST_BUILD boundary: no candidate (hosted rustc+LLVM, FactTest-native,     [UNK]
                                            import-only, subset compiler, cranelift) is realized in a browser;
                                            census and per-candidate INPUT/OPERATION/OUTPUT/TRUST/VERIFICATION/
                                            BOOTSTRAP/REPRODUCIBILITY/RECOVERY in tests/closure/registers/rust-build.json
                                            (FACT-D27-RUST-BUILD-BOUNDARY; decision D-3; FC-7)
C      acceptance test (D27)                 foundation-closure experiment: 0 of 16 steps without the host            [GAP]
                                            (FACT-D27-SELF-HOSTING-NOT-CLOSED; tests/closure/registers/acceptance-test.json)
C      D12 B-06 (P10) -> D23                closed as transport-only (A/B): the wasm export surface is the whole    [RUN]
                                            kernel API (21 exports); BUILD + OBSERVE in Chromium byte-identical to
                                            host/factc (FACT-D23-WASM-TRANSPORT-COMPLETE, Q-WASM-08); the C14 contract
                                            TEXT still names eight operations - an owner annotation (I-29), below
OWNER  I-33 (D24) -> D25 decided           runtime self-integrity: post-build tamper detection rests on bundle.json  [GAP]
                                            (check-bundle.mjs, run-attacks tampered-*); the generated runtime does not
                                            verify its own files at load (FACT-D24-RUNTIME-SELF-INTEGRITY); D25 kept it
                                            unclaimed: CODEGEN-BUNDLE-CONTRACT.md does not require it (owner decision)
D      FACT-D25-PUBLIC-HTTPS                 public-HTTPS execution of a generated bundle: the githack and GitHub    [UNK]
                                            Pages hosts are refused at CONNECT by this environment's egress policy;
                                            raw.githubusercontent serves text/plain + nosniff + sandbox CSP (no module
                                            WebApp); the deployable probe and its evidence schema are in
                                            tests/physical/PUBLIC-HTTPS-PROBE.md; localhost is not substituted
C      D12 B-05, B-17                       templates compiled into the kernel; packfile import/export         [GAP]
C      D12 B-11 (P07)                       persist() false in the Chromium 141 headless shell (every permission     [UNK]
                                            ASK); installed-Factory durability never observed - full Chrome grants
                                            durable storage to installed/important sites (FACT-SH-STORAGE-DURABILITY-D18)
C      D12 B-03                             station commands are OS programs (portability)                     [ERR]
C      D12 B-04                             RUST_BUILD only on a host (superseded in detail by the FB-04 row above)  [UNK]
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
                                            locator level; the imported line's 56 reopen observations stop here
                                            too), PROJECT CONSTRAINT; each stop is explicit
                                            (evidence/D20/envmap/queries/Q18.json, Q22)
D      published frontier                   FACT-PUBLISHED-FRONTIER-D20: 23 published hosts refuse the egress      [UNK]
       (FACT-PUBLISHED-FRONTIER-D20)        proxy; 39 renderings exist as byte-exact Pages-branch copies
                                            (fixtures/reference/published, imported line) with 36 cited fragments
                                            present and 9 absent; no rendering observed at its published host;
                                            WHATWG, doc.rust-lang.org, git-scm.com and Chromium have no Pages
                                            branch and stay source-pinned; D15 clauses are verified at source tips
OWNER  drifted fragments (FACT-D14-MAP-     7 citations in REFERENCE-AUTHORITY.md name fragments absent in the     [ERR]
       LINKS-AUDITED, R-58)                 current renderings: sensors #extending-the-permission-api and
                                            #extending-the-permissions-policy-api, deviceorientation #permissions,
                                            IndexedDB #database-concept, ServiceWorker #fetch-event, ambient-light
                                            #ambientlightsensor-interface, webxr #navigator-xr; nearest ids in the
                                            D14 ANNOTATION lines; replacing them is an owner-approved law delta
                                            (the other 2 of 9 have current authorities since D18: R-10, R-11)
OWNER  CON-EM-D14-001 (R-60)                PROPOSED by the imported line: copies in fixtures/reference/ are     [OBS]
                                            pins, never current authority; adopting it into CONSTRAINT-LEDGER.md
                                            is an owner decision
D      reference route table (D14-RESCAN)   fixtures/reference/ROUTES.json covers the authorities of the D13     [GAP]
                                            graph only: the authorities D14-D19 of this branch added have no
                                            route rule (its checks re-prove on the imported line's own inputs)
D      D12 B-19                             githack public-origin path unreachable (proxy 403)                  [UNK]
D      D12 B-18, B-20                       GitHub smart-HTTP CORS; browser update behaviour                    [OBS]/[UNK]
D      CONFLICT-LEDGER ERR-001 et al.       authority conflicts preserved as ledger rows                        [ERR]
B      D0-D12 receipts/evidence             incomplete environment identity (receipt format 2 from D14 on); D19:      kept
                                            9 stale-condition pairs undecidable (V8 version, GPU device node, launch
                                            options or components never recorded; evidence/D19/selection.json unk);
                                            D20: the imported line's ENV-D14-HOST-NETWORK records no source tips and
                                            its egress policy as prose (evidence/D20/selection.json unk)
B      imported line records                D14-TECHNICAL-REFERENCE-RESCAN's delta, fixtures, envmap and          kept
                                            workpiece evidence moved to the D14-RESCAN paths (the D14 paths hold
                                            this branch's D14); its receipts name the original paths, which stay
                                            reachable at 8d5ea6f (tests/sync/d20-line.json maps them)
B      fixtures/reference size              ~50 MB of authority copies (git-compressed far smaller); re-ingest     [GAP] kept
                                            by a new delta when branch heads move
B      D3-D8 fixture wording                "all ladders" / "full suite" overstated the selection               kept
B      D1-D8 heuristic gates                nostd-check/depcheck used as gates (proof weight now NONE)          kept
C      D9 native --workspace                cargo build/clippy --workspace fail on the host: factc-wasm-abi's   [ERR] kept
       (FACT-NATIVE-WORKSPACE-UNBUILDABLE)  panic_handler is wasm64-only; the proof sets partition the roots
                                            (section 7: CROSS_SET is diagnostic, weight NONE)
B      scratch-only tooling                 D0-D13 route scripts, D11 graph generator (procedure: section 4)    kept
B      workpiece root                       W11-stage, W14-stage hold base-era graph views that are not in the      [GAP] kept
                                            canonical history; W16-W19-stage are proven superseded (every file blob
                                            is in the canonical history: evidence/D18/workpieces/stages.json);
                                            W20-W22-stage differ from their integrated trees only in the three
                                            generated graph views (evidence/D20/workpieces/audit-after.json);
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

Resolved by D20-MAIN-SYNC (tests/reconcile/d20-reconciliation.json; graph query Q21; history in
design/materialization/D20-OBSERVED-MAIN-SYNC.md):

```text
D11 FACT-AUTHORITY-REOPEN-DENIED    closed by the imported line's evidence (INVALIDATED_BY EV-D14-REGISTER): Pages-branch
                                    copies exist for the authorities with a route; the remaining uncertainty is
                                    FACT-PUBLISHED-FRONTIER-D20 (R-55)
imported reopen [ERR]s              #internal-storage and #streaming-module-compilation-and-instantiation: closed by the
                                    D18 successors AUTH-WASM-JSAPI-STORAGE-D18 and AUTH-WASM-WEBAPI-STREAMING-D18 (R-56,
                                    R-57)
pin head relation                   FACT-D14-D11-PINS-RECHECKED superseded by FACT-D14-D11-PINS-RECHECKED-D20: the pins
                                    re-fetch by commit; a file at a moving head may change, the clause reading is
                                    FACT-FRONTIER-SOURCES-AT-PIN (R-59)
superseded authorities              the imported line's 10 AUTHORIZES edges on authorities D18 superseded are carried to
                                    the successors (R-61)
lineage                             the sync merge c3159d5 (tree equal to its first parent) is told apart from owner
                                    merges; Factory integration stays fast-forward only (R-63)
```

## 7. Proof sets and toolchain

```text
rust-toolchain.toml          1.94.1 (rustc e408947bf) + clippy, rustfmt     -> bare cargo in the repository
tests/toolchain/proof-sets.json
  HOST_NATIVE_SET            1.94.1, host, dev + release, default-members (13 roots) == bare cargo
  WASM64_KERNEL_SET          nightly-2026-09-24 (rustc 6eeff9a52) + rust-src, clippy; wasm64-unknown-unknown,
                             -Z build-std=core, -p factc-wasm-abi (12-crate core-only graph); kernel identity =
                             exec identity (every section except the custom "name" section; install-name independent,
                             D18); whole-file sha256 recorded per rust-src install name (informational); D23: the
                             transport extension changed the kernel - exec identity fcaee2a6... (22 exports), the
                             eight-export identity e8d6582665... kept as history in proof-sets.json (R-64); D24: the
                             genericity repair changed the kernel again - exec identity ef5d886a... (FACT-KERNEL-IDENTITY-D24,
                             R-65), the D23 identity kept as history
  ALL_SOURCES / ALL_MEMBERS_GRAPH   rustfmt over every member / cargo metadata over every member + physical manifests
  CROSS_SET                  --workspace on the host: diagnostic only (factc-wasm-abi is target-specific), weight NONE
  HEURISTIC                  factory nostd-check / depcheck: weight NONE; never a gate
run                          sh tests/toolchain/run-qualified-proof.sh <evidence dir>   (every cargo call names +<pin>;
                             27 obligations incl. Q-WASM-08 BUILD + OBSERVE in Chromium == native)
per crate (D23)              node tests/toolchain/run-crate-dag.mjs --out <dir> [--browser-probe <Q-WASM-08 record>]
physical runtime (D25)       node tests/physical/run-webapp.mjs --factc <bin> --out <dir> [--kernel <wasm>] [--pushed-bundle
                             <path>] (every specimen freshly built, driven through its shell by host/harness/webapp-probe.mjs
                             with WebGPU / without / isolated, observed; selfhost primitives on the fresh bundle with
                             BUNDLE_DIR; the public-HTTPS routes probed); node host/harness/webapp-probe.mjs --url https://...
                             for an external public run (tests/physical/PUBLIC-HTTPS-PROBE.md)
commissioning (D26)          node tests/reprove/select.mjs ... --pass D26 (the STALE_IF selection over the current graph);
                             REPROVE_TARGET=<fresh dir> REPROVE_KERNELS=<fresh dir> node tests/reprove/run-selected.mjs
                             --kind build|cite|repo|source (the runbook groups incl. qualified-proof + crate DAG,
                             kernel-sections, physical, manifest); node tests/audit/consistency-audit.mjs (the five
                             equalities); node tests/audit/final-condition.mjs (the 21 lines)
genericity (D24)             node tests/genericity/run-specimens.mjs --factc <bin> --out <dir> (every fixtures/genericity
                             specimen: build, strategy data, Chromium with/without WebGPU through the generic
                             host/harness/bundle-probe.mjs, observe bound, integrity); node tests/genericity/run-attacks.mjs
                             --factc <bin> --specimens <dir> --out <dir>; sh tests/commissioning/run-anti-cheat.sh <out> [tree];
                             sh tests/genericity/reproduce-base.sh <rev> <out> <target dir> (the defects on an earlier
                             compiler).  The runtime's execution entry is transfer(relation, bytes)
                             (FACT-D24-BYTE-RELAY-EXECUTED supersedes the D7 relay facts, R-66)
history                      tests/toolchain/run-proof-matrix.sh is the D9 matrix, kept for reproduction of D9
re-prove (D19, D20)          node tests/reprove/identity.mjs --graph design/environment-map/graph.json --out <dir>/identity;
                             node tests/reprove/select.mjs ... --pass <D> --out <dir>/selection.json (environment drift -
                             a condition a re-proof carried supersedes the older one -, implementation change, obligations
                             addressed to <D>); node tests/reprove/run-selected.mjs --kind cite|build|source|repo; the
                             runbook (tests/reprove/runbook.json) names each claim's re-proof and expected observation
                             (group ingress: the imported line's tests/reference/ingress.mjs checks on its own inputs)
```
