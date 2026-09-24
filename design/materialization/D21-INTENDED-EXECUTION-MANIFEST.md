# D21 - Intended Current Implementation / Execution Manifest

STATUS: INTENDED ASCII (assembled before routing; source of record for delta D21-EXECUTION-MANIFEST, workpiece W25)
REQUEST: design/materialization/D21-D26-WHOLE-REPO-EXECUTION-PROMPT.md, task D21 ("What exactly is CURRENT executable
FactTest after D20, and is every live implementation component connected to ownership, tests, consumers and evidence?
... Do not reconstruct from conversation.  Reconstruct from the joined repository.").  Inputs: the joined repository at
4b86df9 (D20 model + the tracked D21-D26 prompt), the D20 graph, the receipts, the station registry, the law documents.
SCOPE: a deterministic CURRENT EXECUTION MANIFEST generated from the repository; every discovered problem classified
A..G before any implementation repair begins; a manifest epoch in the graph.  No implementation surface changes here.

## 0. Observation before drawing

```text
HEAD          4b86df9 (D21-PROMPT-INTAKE integrated, pushed); tree clean
main          b22bcbb = the owner's merge of pull request #7; tree bca6411 identical to ca54064 (D20) - [OBS] the extra
              commit carries no content; the branch was fast-forwarded to it before the intake (no content sync)
graph         D11 base + epochs D12..D19, D14-RESCAN, D20-SYNC, D20: 1250 nodes / 3190 edges, validate 42 - as the prompt
              recorded; current facts 174 (RUN 109, OBS 46, GAP 10, ERR 5, UNK 4); 108 claimable RUN + 1 invalidated by
              design (verified from evidence/D20/envmap/queries/Q22.json before relying on them)
tracked       2961 files: 19 crates/roots under compiler/, host/, factory/ (2,561 lines of Factory, 14,455 lines of
              compiler source), 8 codegen templates, 2 harnesses, 13 test directories, 5 fixture families, 22 evidence
              packages, 27 delta records; every compiler/host/factory/tests file is receipted by a station (the only
              unreceipted files are the pre-D0 law documents, the D0 station specs and the delta-owned records)
survey        the current executable system, read from the tree:
  factory     router (main.rs dispatch of 13 commands), path authority (paths.rs: literal surfaces), registry (8 JSON
              specs), ops.rs (workpiece create, station open/close with receipts, verify, integrate ff-only, reinspect),
              git.rs, identity.rs (receipt format 2), checks.rs (heuristics weight NONE, wasm-inspect, evidence index),
              hygiene.rs (audit/retire); 17 Factory law tests (f00-f16); the D20 line-import tool
  compiler    12 crates in a strict DAG (cargo metadata): foundation -> source -> semantic -> capability ->
              implementation -> planning -> verifier -> codegen -> bundle; observe; kernel (phase facade + API);
              wasm-abi (cdylib, wasm64 only); 7 kernel test ladders; 10 unit tests in foundation/codegen
  host        factc (check analyze|build, observe: files in, artifacts and bundle out); kernel-host.mjs (bootstrap ABI in
              Node and Chromium); bundle-probe.mjs (physical bundle run)
  web output  8 templates compiled into codegen: membrane core, 2 adapters (wasm64_relay, webgpu_relay), selector,
              runtime, shell, manifest, service worker
  proof/test  bootstrap, language, commissioning, toolchain (qualified proof + mutants), envmap, selfhost, hygiene,
              reference, capability, implementation, reconcile, reprove, sync
  fixtures    language (39), commissioning specimen (13), negative crates (4), toolchain (expect + 8 mutants), reference
              corpus (86: pins)
B-06          C14 and BOOTSTRAP-ARCHITECTURE section 11 name eight bootstrap ABI operations; wasm-abi exports exactly
              those eight plus buffer accessors; the kernel API also has submit_contracts, submit_metrics,
              submit_evidence_tape, observe, read_artifact, artifact_count, bundle_file_count, bundle_file, which only
              factc transports -> the browser BUILD stops at CAPABILITY_IR (D12 P10)
genericity    index.html embeds the payload A bytes as 0x00,0x01,...; run-anti-cheat.sh greps "00 01 7f 80" and reports
              the templates clean; runtime.js has one operation relay(bytes) through the active plan's first guard
              backend; codegen's strategy data carries the FIRST data relation ("adaptive relay targets have one");
              the wasm export library holds relay functions only; the CapabilityIr holds up to 128 transfers
stale text    compiler/kernel/src/lib.rs header (Pass-3 wording); STATION-REGISTRY.md header; 24 law documents carry
              escaped code fences (the owner's authoring form)
```

## 1. Method (tests/manifest/build-manifest.mjs; deterministic, generic)

```text
inputs      git ls-files; cargo +1.94.1 metadata --no-deps --offline; design/environment-map/graph.json; every receipt
            under factory/receipts (delta order = the commit that added each receipts directory); the station registry;
            the reviewed component register tests/manifest/components.json
tiers       PRODUCTION | FACTORY | TEST (live) ; FIXTURE | REFERENCE (data) ; RECORD | LAW | HISTORICAL | EVIDENCE
assignment  every tracked path -> the component whose most specific path entry covers it (exclusions honoured); a path no
            entry covers, or two entries cover equally, is a finding
per row     component, tier, owner (law), input, operation, output, dependencies (crates: from cargo), consumers (crates:
            declared + cargo), station authorized (registry cover rule) and last receipting station/delta, fixture type,
            toolchain/target, focused tests, test references (test files naming the component's paths, crate or template),
            task regression, runtime probe, graph implementations, governing claims (current facts IMPLEMENTED_BY or PROBED_BY
            through the component's implementation nodes), probes, evidence paths, stale dimensions
findings    unassigned or ambiguous paths; live files without an authorized station; live files never receipted; live
            components without test, without implementation node, without governing claim, without consumer or owner;
            implementation paths that do not exist; implementation nodes no component maps; declared crate consumers cargo
            does not know; dead fixtures (unreachable from any test, script, fixture command or cargo manifest);
            historical tools; live tools naming evidence packages of earlier epochs; required coverage
render      design/execution-manifest/{manifest.json, CURRENT-EXECUTION-MANIFEST.md}; rebuilt byte-identically (fixture
            and reinspect check)
enumeration the tree at the delta's base plus the live-tier files the working tree adds (--rev, --delta): a delta's own
            receipts, evidence package, epoch and observed record are its outputs, never its own manifest's input
```

## 2. Component register (tests/manifest/components.json; reviewed)

```text
65 components: FACTORY 12 (CLI, MODEL, PATHS, REGISTRY, OPS, GIT, IDENTITY, CHECKS, HYGIENE, TESTS, SYNC-IMPORT +
               the Factory crate root in CLI), COMPILER 13 (12 crates + KERNEL-LADDERS), HOST 3 (FACTC, 2 harnesses),
               WEB 8 (templates, adapters, selector, runtime, shell, manifest, service worker), TEST 14 (bootstrap,
               language, commissioning, toolchain, toolchain-history, envmap, envmap-bind-D11, selfhost, hygiene,
               reference, capability, implementation, reconcile, reprove, sync, manifest), FIXTURE 5, RECORD/LAW/
               HISTORICAL/EVIDENCE 9 buckets
required     the prompt's 41 items (FACTORY 10, COMPILER 12, HOST 2, WEB OUTPUT 6, PROOF/TEST 11) each mapped to live
             components (required_coverage); the gate refuses a missing or non-live mapping
tiers        live = PRODUCTION (crates, factc, templates, workspace root), FACTORY (Factory plane, line import), TEST
             (proof/probe/epoch/gate tools); historical tools are marked (run-proof-matrix.sh, bind-evidence.mjs)
```

## 3. Survey findings and the issue inventory (tests/manifest/issues.json)

```text
ID    CLASS TASK   FINDING                                                                       SURFACE
I-01  B     D21    11 live components without a governing claim, 10 without an implementation     graph (epoch D21)
                   node (Factory CLI/model/tests, line import, factc, workspace root, language/
                   commissioning/reconcile/manifest test machinery; bootstrap runner: node, no fact)
I-02  F     none   the 3 D0 station specs were never receipted (bootstrap registry)                factory/registry
I-03  F     none   2 historical tools kept by declaration (D9 matrix, D11 binder)                   tests/toolchain, envmap
I-04  F     none   ingress.mjs names evidence/D14 paths in the annotation text it writes            tests/reference
I-05  B     D25    primitives-probe.mjs defaults BUNDLE_DIR to evidence/D7 (historical bundle)      tests/selfhost
I-06  B     D23    wasm transport = the 8 bootstrap operations; 6+2 kernel operations only natively  wasm-abi, C14
                   transported (B-06); transport-only extension needs a contract annotation
I-07  C     D24    payload A bytes and a fixed WEBGPU loss interaction compiled into index.html       templates/index.html
I-08  B     D24    the anti-cheat scan misses the 0x-comma byte form the shell uses                  run-anti-cheat.sh
I-09  C     D24    single-relation, single-operation runtime; first DATA relation in selector data;   runtime.js, codegen
                   relay-only wasm library; two fixed adapter templates (to be proven, not renamed)
I-10  A     D23    kernel crate header documents the Pass-3 state                                    kernel/src/lib.rs
I-11  B     D25    the generated shell's buttons and SW registration are never exercised             index.html, probe
I-12  G     owner  STATION-REGISTRY.md header wording ("does not implement them")                    law
I-13  G     owner  24 law/pass documents carry escaped code fences                                   law
I-14  B     D22    8 of the prompt's negative Factory witnesses have no test yet                     factory/tests
I-15  D     none   register rows of class C (capability): keep [GAP]                                docs/HANDOFF.md 6
I-16  E     none   register rows that are environment/authority limits: keep                        docs/HANDOFF.md 6
I-17  F     none   register rows of class B (historical): preserve                                  docs/HANDOFF.md 6
I-18  G     owner  register rows that are owner decisions                                           docs/HANDOFF.md 6
I-19  B     D23    no per-crate compile -> tests -> consumer record; factc has no test of its own    compiler, factc
I-20  D     D24    runtime claims witnessed by one specimen; second relation/payload/registry unknown  planning..codegen
automated    29 finding items of 16 kinds covered by I-01..I-05 (the rest are 0: no unassigned path, no dead fixture, no
             untested live component, no implementation path missing, no crate consumer unknown to cargo)
classes      A 1, B 7, C 2, D 2, E 1, F 4, G 3 (20 issues); every A/B/C item is new (the register held no internal defect)
```

## 4. Classification law applied

```text
A  repair now      I-10 (D23)
B  add proof       I-01 (D21, this epoch), I-14 (D22), I-06 and I-19 (D23), I-08 (D24), I-05 and I-11 (D25)
C  prove/repair    I-07, I-09 (D24: multi-specimen execution proves the distinction before any rename)
D  keep [GAP]      I-15; I-20 until D24 executes
E  keep boundary   I-16
F  preserve        I-02, I-03, I-04, I-17
G  owner           I-12, I-13, I-18
register mapping   docs/HANDOFF.md section 6 classes C -> D, D -> E, B -> F, OWNER -> G (issues.json boundary_register_classes)
not repaired here  nothing: D21 changes no implementation surface (may_change excludes compiler/, host/, factory/src,
                   templates, fixtures, existing tests)
```

## 5. Graph epoch D21 (tests/manifest/build-epoch.mjs; add-only)

```text
ENV-D21-HOST                        identity capture (tests/reprove/identity.mjs) of the manifest computation host
IMPL-<component>  x10                one node per live component the graph did not cover (FACTORY-CLI, FACTORY-MODEL,
                                    FACTORY-TESTS, SYNC-IMPORT, FACTC, TEST-LANGUAGE, TEST-COMMISSIONING, TEST-RECONCILE,
                                    TEST-MANIFEST, WORKSPACE-ROOT)
PROBE-EXECUTION-MANIFEST            builder + gate, implemented by IMPL-TEST-MANIFEST
EV-D21-MANIFEST / -GATE / -ISSUES   sha256-bound records under evidence/D21
FACT-D21-LIVE-SURFACES-ENUMERATED   [OBS] IMPLEMENTED_BY every live implementation node (old and new); STALE_IF repo.commit
FACT-D21-ISSUES-CLASSIFIED          [OBS] the inventory; STALE_IF repo.commit
enumeration != execution            both facts are observations; D22-D26 add the execution claims
```

## 6. Gate (tests/manifest/gate.mjs)

```text
every_path_tiered; coverage_complete; live_components_connected (owner, consumer, station); findings_classified (every
automated finding item covered, no issue covering nothing); issues_well_formed (class A..G, task D21..D26|owner|none,
surfaces exist, markers present); historical_not_executable (every live tool naming an earlier evidence package is an
issue)
```

## 7. Mutation plan by station (delta D21-EXECUTION-MANIFEST, workpiece W25, base 4b86df9)

```text
F0   S-DOC       this ASCII; ledger (D21-PROMPT-INTAKE AFTER + D21 BEFORE); delta; fixtures
F1   S-FIXTURE   tests/manifest/{components.json, build-manifest.mjs, issues.json, gate.mjs, build-epoch.mjs}; the status-scan
                 zone for the generated manifest (tests/hygiene/status-classification.json, class R); checks:
                 syntax, generic tools (no component/node id in the builders), registers parse, coverage ids exist, no
                 other test changed
F2   S-BROWSER   evidence/D21/identity/
F3   S-DOC       design/execution-manifest/ (built; rebuilt byte-identically)
F4   S-EVIDENCE  evidence/D21/{manifest,issues,gate}.json (gate PASS)
F5   S-DOC       epochs/D21.json; graph; views; SCHEMA 15; ENVIRONMENT-MAP 14; docs/HANDOFF.md; README.md
F6   S-EVIDENCE  validate, Q01-Q22, stale, merge-check, render-check, Q22 check (D21 facts OBS), D18/D18R/D20-SYNC
                 reconciliation gates, D16/D17 gates (the D19/D20 re-proof gates are bound to their own epoch), status scan, handoff check, audit -> retire -> audit, index
F7   S-DOC       D21-OBSERVED-EXECUTION-MANIFEST.md
MUST NOT CHANGE: compiler/, host/, factory/src, factory/registry, every existing test, fixtures/, law and pass
documents, earlier epochs, D0-D20 evidence
```

## 8. Predictions (from the assembly trial on a scratch clone at 4b86df9)

```text
P1  manifest: the tree at 4b86df9 (2961 files) plus the 5 live files this delta adds (tests/manifest) = 2966 files in
    65 components; live 51 (PRODUCTION 26, FACTORY 12, TEST 13); tiers PRODUCTION 67, FACTORY 23, TEST 82, FIXTURE 97,
    REFERENCE 86, RECORD 669, LAW 32, HISTORICAL 11, EVIDENCE 1899; unassigned 0; coverage 41/41; the delta's own
    records (receipts, evidence/D21, epoch, observed record) are never enumerated by its own manifest, so it rebuilds
    byte-identically before and after integration
P2  findings: never receipted 3 (D0 registry) once F1's receipt exists, without implementation node 10, without claim
    11, historical tools 2, evidence readers 3, dead fixtures 0, untested live components 0
P3  gate PASS: 29 finding items covered by 5 issues; 20 issues A 1, B 7, C 2, D 2, E 1, F 4, G 3
P4  epoch D21 17 nodes / 51 edges (10 implementation nodes added); merged 1267 / 3241; validate 42; D11-D20 preserved
P5  Q22: 176 current facts (RUN 109, OBS 48, GAP 10, ERR 5, UNK 4); open stops unchanged (GAP 8, ERR 5, UNK 4); the two
    D21 facts [OBS]; earlier gates PASS
P6  hygiene: status scan PASS, handoff check PASS; W24 RETIRABLE -> REMOVED
```

## 9. Invariants, affected surfaces of D22-D26, structural check

```text
I1  the manifest is generated, never hand-written; the reviewed registers are data the builder cross-checks
I2  classification precedes repair: this delta changes no implementation surface
I3  nothing earlier edited; the enumeration facts are [OBS]
D22  factory/src/{ops,hygiene,paths,identity,model}.rs, factory/tests/factory_law.rs, tests/sync/import-line.mjs (I-14)
D23  compiler/* (per-crate execution, I-19), compiler/kernel/src/lib.rs (I-10), compiler/wasm-abi/src/lib.rs +
     host/harness/kernel-host.mjs + BOOTSTRAP-CONTRACTS.md annotation (I-06), host/factc (native transport check)
D24  fixtures/ (new specimens), compiler/codegen/{src/lib.rs, templates/index.html, templates/runtime.js} (I-07, I-09),
     tests/commissioning/run-anti-cheat.sh (I-08), tests/language (per-specimen), I-20
D25  host/harness/bundle-probe.mjs (shell interaction, I-11), tests/selfhost/primitives-probe.mjs (I-05), fresh bundles
D26  the whole chain from a clean workpiece; tests/reprove selection over the D21-D25 mutations; the manifest rebuilt
structural   every required item covered by a live component; every finding classified; the epoch validates in the trial;
             the gate refuses an unclassified finding; stations cover every changed path (S-DOC design/docs/README,
             S-FIXTURE tests/manifest, S-BROWSER/S-EVIDENCE evidence/D21)
```

STRUCTURAL CHECK: PASS
