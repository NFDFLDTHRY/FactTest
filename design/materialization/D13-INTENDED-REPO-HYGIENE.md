# D13 - Intended Repository Hygiene / Chain Closure

STATUS: INTENDED ASCII (assembled before any production patch; source of record for delta D13-REPO-HYGIENE)
REQUEST: design/materialization/D13-REPO-HYGIENE-PROMPT.md (tracked verbatim by D13-PROMPT-INTAKE, 205d337)
LAW: FACTORY-LAW.md (AGENT -> ASCII -> FACTORY -> WORKPIECE -> VERIFY -> REPO).  Every repair below is routed through
the Factory as delta D13-REPO-HYGIENE (workpiece W14).  Assembly-time trial runs (proof matrix, graph merge) were made
in a scratch stage only; the Factory stations repeat them.  Nothing here implements seed/broker self-hosting, browser
Rust, ABI exports, GPU, WGSL, threads, capability families, storage durability, GitHub sync or GitHack validation.

## 0. Observation before drawing

### 0.1 Repository

```text
origin/main                   8e5dd6fe0d35669867dc7894434e68b13abeb158   (PR #3 merge; unchanged since the prompt)
branch                        claude/facttest-materialization-27amc7
HEAD                          205d337a7efef5fa25bb588ec385fa3655acb562   (D13-PROMPT-INTAKE, ff from 8e5dd6f)
HEAD tree                     ec6b667806cde1c663e97f1334ed048cfe080096
status                        clean (0 entries)
ancestry                      origin/main is an ancestor of HEAD; HEAD is 1 commit ahead (the intake)
host                          git 2.43.0, node v22.22.2, python 3.11.15 (assembly only), rustup toolchains:
                              stable = 1.94.1 (e408947bf), nightly = 6bb1652a0, 1.94.1, nightly-2026-09-24 = 6eeff9a52
```

### 0.2 Assembly-time probes (scratch; the Factory stations repeat what matters)

```text
KRN-D13-A  kernel rebuilt from HEAD with cargo +nightly-2026-09-24 (rustc 6eeff9a52, the D9 qualified nightly),
           -Z build-std=core, wasm64-unknown-unknown, release, RUSTFLAGS -C link-arg=-zstack-size=16777216
           -> 3,350,254 bytes, sha256 6f25ce43cfad5a6e0cb079fe2847e435e9974c5bf507bbec6225265df10f6c81      [OBS]
           D9 recorded 3,350,252 bytes, sha256 309589947e16195448f1523b8c831168c54492956da4b7369bb369290a8f025c
           with the same rustc commit.  compiler/, Cargo.toml and Cargo.lock are unchanged since D7.
KRN-D13-B  same toolchain bind-mounted (private mount namespace, nothing on disk changed) at D9's install path
           /root/.rustup/toolchains/nightly-x86_64-unknown-linux-gnu
           -> 3,350,252 bytes, sha256 309589947e16195448f1523b8c831168c54492956da4b7369bb369290a8f025c == D9 [RUN]
           => the D9 kernel is byte-reproducible; kernel identity is a function of (source tree, rustc commit, flags,
              profile, AND the rust-src install path that -Z build-std compiles core from).  The install path is set
              by the rustup toolchain NAME ("nightly" vs "nightly-2026-09-24").
WP-D13     13 attached worktrees W0..W8, W10..W13: each clean (status --porcelain --ignored empty), HEAD == the
           integration commit in W<n>.state.json, verification PASS, integration PASS, reinspect MATCH.  W9 absent
           (D9 ran in an earlier session; its lineage is git: e10d279 is an ancestor of HEAD).
           Stage directories W<n>-stage (agent staging copies, not Factory objects): tree(stage) vs integration tree:
           12 of 13 contain only paths whose bytes equal the integrated tree ("D" entries only); W11-stage has 2
           modified paths (design/environment-map/graph.json and TRACEABILITY.md: pre-binding drafts).
           /home/user/factory-workpieces/factory-bootstrap-bin: 6,025,720-byte file, not referenced by any state.
BR-D13     remote heads: claude/d9-rust-cargo-proof-4nys6s e10d279, factory/reference-corpus-wasm64 12b13ee,
           work/pass2-5-reference-ingress-1 225c155, main 8e5dd6f: all ancestors of HEAD (0 unique commits).
PATH-D13   every authority surface in factory/deltas/*.json, factory/fixtures/*/*.json and the station registry is a
           literal entry except S-FIXTURE may_change "compiler/*/tests/" and must_not_change "compiler/*/src/".
           compiler/kernel/tests/ exists: a literal replacement for "compiler/*/tests/" would WIDEN S-FIXTURE.
DOC-D13    no station registered today may change the root law documents except README.md (S-DOC).
SCAN-D13   raw marker scan (all tracked files): every zone listed in section 9; no TODO/FIXME in code.
```

## 1. Intended hygiene system

```text
                         CURRENT MAIN 8e5dd6f  +  intake 205d337
                                      │
                                      ▼
                          CHAIN INVENTORY (section 2)
        ┌─────────────────────────────┼──────────────────────────────┐
        ▼                             ▼                              ▼
  FACTORY CHAIN                  PROOF CHAIN                   KNOWLEDGE CHAIN
  paths.rs literal law           proof sets HOST/WASM64        live handoff (README, docs/HANDOFF.md)
  registry S-FIXTURE v2          pinned toolchains             historical banners (insertion-only)
  receipt format 2               heuristics weight NONE        graph epochs D11 -> D12 -> D13
  workpiece audit / retire       qualified runner              fragment-drift annotations
        │                             │                              │
        └─────────────────────────────┼──────────────────────────────┘
                                      ▼
                         CLASSIFY A / B / C / D (section 2)
                                      │
                 ┌────────────────────┴─────────────────────┐
                 ▼                                          ▼
          PATCHABLE A (H-xx)                         PRESERVE B / C / D
                 │                                   (open-boundary register,
                 ▼                                    docs/HANDOFF.md section 6)
     FACTORY: D13-REPO-HYGIENE, W14                          │
     F0 doc  F1 rust  F2 fixture  F3 doc  F4 annotate        │
     F5 build  F6 evidence  F7 doc  F8 evidence  F9 doc      │
                 │                                          │
                 ▼                                          │
          VERIFY -> INTEGRATE (ff-only) -> REINSPECT        │
                 │                                          │
                 └────────────────────┬─────────────────────┘
                                      ▼
                FULL RE-EXECUTION (F5: qualified proof, both sets, pinned toolchains, mutants;
                                   F6: status scan, handoff check, paths-probe, workpiece audit -> guarded
                                       retire -> audit;  F8: envmap validate/queries/render-check/merge-check)
                                      │
                            FAIL ─────┴───── PASS
                             │                 │
                             ▼                 ▼
                           ASCII     PRE-RESCAN-BASELINE (design/materialization/D13-PRE-RESCAN-BASELINE.md)
                                               │
                                               ▼
                                 D14 TECHNICAL REFERENCE RESCAN (not started by D13)
```

## 2. Chain inventory and classification

Classes: A internal chain defect (patched through the Factory) / B historical evidence limit (preserved; prospective
rule only) / C real capability gap (kept) / D authority uncertainty (internal reference normalized, uncertainty kept,
semantic resolution deferred to D14).  No B/C/D item below is converted into A.

### 2.1 Target 1 - Factory path authority

```text
ID    FINDING                                                                         CLASS  ACTION
H-01  S-FIXTURE may_change "compiler/*/tests/" authorizes nothing under the literal     A      remove the entry; effective
      covers() rule (D9, D11 paths-probe).  compiler/kernel/tests/ exists, so a literal         authority unchanged (it
      replacement would WIDEN S-FIXTURE; widening is not required by D13                        matched nothing); S-FIXTURE
                                                                                                version 1 -> 2
H-02  S-FIXTURE must_not_change "compiler/*/src/" protects nothing                         A      replace with literal
                                                                                                "compiler/" (S-FIXTURE has no
                                                                                                compiler/ grant, so the stated
                                                                                                protection becomes real and
                                                                                                effective may_change is
                                                                                                unchanged)
H-03  the Factory accepts wildcard-looking, absolute or dot-segment surfaces silently      A      paths::validate_surface:
      (delta check, fixture check and station specs never validate entries)                     reject * ? [ ] { } \ (except
                                                                                                the exact entry "*"), empty,
                                                                                                leading "/", "." or ".."
                                                                                                segments, in delta, fixture
                                                                                                and station surfaces;
                                                                                                witnesses f09..f11
H-04  D0-D12 receipts were produced under S-FIXTURE v1 with the dead entries               B      preserved; v2 is recorded
                                                                                                in the registry and in the
                                                                                                STATION-REGISTRY annotation
H-05  D12 decision D-7 (glob semantics for PATH_AUTHORITY)                                 -      decided by the owner in the
                                                                                                D13 prompt, target 1 ("Do not
                                                                                                casually add glob semantics";
                                                                                                "reject unsupported
                                                                                                wildcard-looking station
                                                                                                entries"): literal semantics
                                                                                                stay; a future grant to
                                                                                                compiler/<crate>/tests/ is an
                                                                                                explicit literal entry
                                                                                                approved in ASCII
```

### 2.2 Target 2 - Rust/Cargo proof taxonomy

```text
H-06  the D9 harness has no proof-set concept; records do not state set, target or      A      tests/toolchain/proof-sets.json
      profile; bare cargo commands carried no statement of what they select                    + --set on every qualified
                                                                                               obligation; records carry
                                                                                               proof_set, target, profile,
                                                                                               toolchain; set membership is
                                                                                               checked against the observed
                                                                                               selection
H-07  T9-P1 FAIL "members omitted from default-members": the omission is the               A      new obligation sets-check:
      unstated boundary between the two sets                                                    HOST roots == default-members,
                                                                                               WASM64 root == members minus
                                                                                               default-members, union == all
                                                                                               members, no root in both.
                                                                                               D9's FAIL record stays [B]
H-08  factc-wasm-abi natively unbuildable (panic_handler under cfg(target_arch =          (C)    NOT a defect to "fix": the
      "wasm64")); `cargo build --workspace` / `clippy --workspace` fail                         crate is target-specific.
                                                                                               Recorded as CROSS_SET
                                                                                               diagnostics (expected failure,
                                                                                               proof weight NONE); never a
                                                                                               fake native success
H-09  "all ladders" (D3-D7 F-build tests text), "full suite" (D8 F1), "full workspace"     B      preserved (D11
      wording overstated what bare cargo selected                                              FACT-D9-HISTORY-OVERSTATED);
                                                                                               prospective rule: a proof
                                                                                               record names its set
H-10  D9 T9-P2-06/07 `cargo test --workspace` PASS compiled factc-wasm-abi natively in     B      preserved; the qualified
      the test profile only                                                                    runner records it as CROSS_SET
```

### 2.3 Target 3 - Toolchain reproducibility

```text
H-11  no repository pin; identity drifted across epochs (D1-D3/D11/D12 nightly 6bb1652a0,   A      PIN (section 3.2)
      D9 nightly 6eeff9a52; stable 1.94.1 e408947bf everywhere)
H-12  KRN-D13: kernel identity depends on the rust-src install path (0.2)                   C      kept visible: [GAP] the
                                                                                               kernel identity is not
                                                                                               install-path independent;
                                                                                               the pin declares the expected
                                                                                               identity for the pinned
                                                                                               install name and records D9's
                                                                                               identity for D9's install name
H-13  D12 kernel a1bb6f86 (nightly 6bb1652a0)                                               B      preserved as drift evidence
H-14  D12 decision D-4 (toolchain pin)                                                      -      decided by evidence under the
                                                                                               owner's rule in target 3
```

### 2.4 Target 4 - Legacy heuristic checkers

```text
H-15  `factory nostd-check` / `factory depcheck` print "PASS" with no weight; proof.mjs     A      the CLI prints "HEURISTIC:
      records their result with verdict PASS/FAIL and counts it in the tally                    proof weight NONE" on every
                                                                                               report; qualified records use
                                                                                               verdict HEURISTIC with
                                                                                               heuristic_result and
                                                                                               proof_weight NONE, excluded
                                                                                               from the proof tally; exit
                                                                                               codes unchanged so the D9
                                                                                               mutants still attack them as
                                                                                               weak checks
H-16  D1-D8 station fixtures used both checkers as gates                                   B      preserved; prospective rule
                                                                                               (FACTORY-CONTRACTS
                                                                                               annotation): no gate may rely
                                                                                               on them; authoritative proof
                                                                                               = core-only wasm64 graph
                                                                                               (T9-P5-02/03) and the
                                                                                               Cargo-resolved graph with
                                                                                               physical-manifest accounting
                                                                                               (T9-P6-01/03)
```

### 2.5 Target 5 - Live handoff / document state

```text
H-17  README.md: status line centers the M8 commissioning; section "Fable implementation   A      README rewritten as the
      session" tells a reader to start from FABLE-ASCII-SYSTEM-PROMPT.md                       model-independent entry; the
                                                                                               former status and pointer are
                                                                                               kept under "History"
H-18  no model-independent entrypoint: current state, mutation law, operating procedure    A      docs/HANDOFF.md (new, S-DOC):
      (the D0-D13 route scripts lived in scratch), live-vs-historical document status,         state, law, entrypoint, exact
      open boundaries                                                                          Factory procedure, document
                                                                                               register, proof sets,
                                                                                               toolchain, open-boundary
                                                                                               register
H-19  FABLE-ASCII-SYSTEM-PROMPT.md reads as the active bootloader (ENTRY step 2 requires   A      insertion-only HISTORICAL
      HEAD to descend from 5727c1f and contain this prompt; "USER + FABLE")                    banner at the top (S-ANNOTATE);
                                                                                               no byte of the original
                                                                                               removed
H-20  design/materialization/LEDGER.md header: "LIVE RECORD OF THE FABLE 5.1                A      header made model-independent;
      MATERIALIZATION SESSION"                                                                 the original header line is
                                                                                               quoted as history
H-21  FINAL-HANDOFF-REQUIREMENTS.md title "Final Fable 5.1 Handoff Requirements"          A      insertion-only note: the
                                                                                               requirements remain law; the
                                                                                               title is historical
H-22  PLANNED-REPO-LAYOUT.md plans a law/ zone that never existed, "eventual Fable 5.1     A      insertion-only note: PASS 5
      materialization"                                                                         plan, not the layout; the
                                                                                               observed layout is in
                                                                                               docs/HANDOFF.md
H-23  M0, M9, COMMISSIONING-RECORD, PASS1-6, BOOTSTRAP-*, STATION-REGISTRY and the D0-D12  B      preserved; classified
      records name the Fable/Opus sessions                                                      HISTORICAL in the document
                                                                                               register
H-24  route scripts (D0-D13) and the D11 graph generator were scratch-only                 B      preserved as a historical
                                                                                               limit; prospective: the
                                                                                               procedure is in
                                                                                               docs/HANDOFF.md and graph
                                                                                               epochs are merged by the
                                                                                               tracked envmap tool
H-25  D12 names "D13-SEED-BROKER-QUALIFICATION" as the next delta; the owner paused it     A      live pointer corrected in
                                                                                               docs/HANDOFF.md and in the
                                                                                               graph epoch record; D12
                                                                                               documents stay as written (B)
```

### 2.6 Target 6 - D12 into the computational environment graph

```text
H-26  graph.json envelope: delta D11, repository_commit 4a151c9; no D12 environment,       A      epochs envelope field (D11,
      probe, evidence, fact, stale relation or authority                                       D12, D13) + tracked generic
                                                                                               `envmap.mjs merge`: epoch
                                                                                               files design/environment-map/
                                                                                               epochs/D12.json and D13.json
                                                                                               add nodes and edges only;
                                                                                               `merge-check` proves every
                                                                                               D11 node and edge is kept
                                                                                               byte-for-value; derived views
                                                                                               re-rendered; Q16 traverses an
                                                                                               epoch
H-27  D11 evidence identity incompleteness (Q11: 31 nodes)                                 B      preserved, not rewritten
H-28  Q09 map coverage: 29 GAP registry families are not authority nodes                   C      preserved (D14/D15 scope)
```

D12 epoch contents (from D12-INTENDED section 18, D12-OBSERVED, evidence/D12/):

```text
ENVIRONMENT  ENV-D12-HOST (rustc nightly 6bb1652a0, cargo 495c385d0, no clippy; kernel rebuild only)
             ENV-D12-BROWSER-PERSISTENT (HeadlessChrome 141.0.7390.37 @9f043f63, V8 14.1.146.11, Playwright 1.56.1
             launchPersistentContext headless, origin http://127.0.0.1:47311, second origin :47312)
PROBE        PROBE-SH-P01 .. P10, P14, P15, P16 (13, implemented_by IMPL-SELFHOST-PROBES) + PROBE-SH-NETWORK
             (IMPL-SELFHOST-NETWORK)
EVIDENCE     EV-D12-P01 .. EV-D12-P16 (13 probe records), EV-D12-KERNEL (inspect.json), EV-D12-NETWORK
             (observations.txt), EV-D12-BROWSER-IDENTITY; artifact_identity = sha256 of the committed file
FACT         FACT-SH-GENERATED-OFFLINE P01, FACT-SH-SW-NO-SELF-UPDATE P02, FACT-SH-ORIGIN-SCOPED-STORAGE P03,
             FACT-SH-OPFS-SERVED-APP P04, FACT-SH-SW-GRANTS-COI P05, FACT-SH-IDB-CAS P06,
             FACT-SH-STORAGE-BEST-EFFORT P07 [GAP], FACT-SH-OPAQUE-CONFINEMENT P08, FACT-SH-GIT-IDENTITY P09,
             FACT-SH-KERNEL-WORKER-PARTIAL P10 [GAP], FACT-SH-BROKEN-SEED-FATAL P14, FACT-SH-INTERRUPTED-UPDATE P15,
             FACT-SH-BROKER-FED-GENERATION P16, FACT-SH-NO-FACTORY-WEBAPP [GAP], FACT-SH-KERNEL-TOOLCHAIN-DRIFT,
             FACT-SH-GITHACK-UNREACHABLE [UNK]
AUTHORITY    the D12 pins with a 200 fetch and sha256 (0.2 of D12): AUTH-SW-* (w3c/ServiceWorker@2f5ec0663a),
             AUTH-FS-OPFS (whatwg/fs@cd55e5582e), AUTH-STORAGE-BUCKET-MODE (whatwg/storage@1933f424de),
             AUTH-IDB-TRANSACTION (w3c/IndexedDB@f70491894a), AUTH-WEB-LOCKS (w3c/web-locks@a61a77307d),
             AUTH-COMPRESSION-ZLIB (whatwg/compression@770f314342), AUTH-WEBCRYPTO-DIGEST (w3c/webcrypto@811c24c69e),
             AUTH-GIT-OBJECT-FORMAT / -UPDATE-REF-CAS / -PACK-FORMAT / -SHA256-TRANSITION (git/git@0f8e75abeb),
             AUTH-MANIFEST-INSTALLABLE (w3c/manifest@8ae3046968); reopen_status DENIED (published hosts denied)
             [the whatwg/html clauses D12 cites are covered by the existing D11 html pin where that node exists;
             otherwise they stay in the D12 ASCII only - no new html pin is fetched in D13 (D14 scope)]
EDGES        PROBED_BY / EVIDENCED_BY fact->probe->evidence; AUTHORIZES authority->fact; STALE_IF
             browser.product / browser.revision on every browser FACT-SH-*; STALE_IF origin_security.origin on
             P03/P04/P08/P16; STALE_IF toolchain.nightly.rustc_commit on the kernel facts; BUILT_WITH evidence->env
```

D13 epoch contents: ENV-D13-HOST-PINNED (pinned 1.94.1 + nightly-2026-09-24, install names recorded),
FACT-PROOF-SETS-DECLARED, FACT-TOOLCHAIN-PINNED, FACT-KERNEL-IDENTITY-INSTALL-PATH [GAP],
FACT-SURFACES-LITERAL-ENFORCED, FACT-RECEIPT-ENVIRONMENT-IDENTITY, FACT-WORKPIECES-AUDITED, PROBE-QUALIFIED-PROOF,
PROBE-WORKPIECE-AUDIT, PROBE-STATUS-SCAN, and EV-D13-* evidence nodes bound after F5 (status PENDING until F6 binds
the sha256 of the committed evidence file, the D11 method).

### 2.7 Target 7 - Authority fragment drift

```text
H-29  "https://webassembly.github.io/spec/js-api/#internal-storage" is cited as the live     D      insertion-only annotation
      authority in REFERENCE-AUTHORITY.md (line 61), CONSTRAINT-LEDGER.md WA-005 (59),          directly after each citation
      CONFLICT-LEDGER.md ERR-002 (33), IMPLEMENTATION-CONTRACTS.md (88),                         (S-ANNOTATE): citation
      EVIDENCE-OBLIGATIONS.md E-023 (314); pinned source WebAssembly/spec@608711107b has no     preserved byte-exact; states
      such id (#webassembly-storage, #store); published page DENIED                              FRAGMENT_DRIFT [ERR] at the
                                                                                               pin, published alias [UNK],
                                                                                               "not asserted current",
                                                                                               resolution D14
H-30  fixtures/commissioning/contracts.ascii authority_link WASM_SHARED_THREADS carries     D      unchanged: it is a compiled
      the same URL                                                                              commissioning input (changing
                                                                                               it changes commissioning
                                                                                               artifacts); listed in the
                                                                                               open-boundary register for D14
H-31  PASS2.md narrative uses the internal-storage model                                    B      historical pass file; register
H-32  37 of 48 D11 authority nodes not reopened (published hosts DENIED)                    D      preserved for D14
```

### 2.8 Target 8 - Receipt / environment identity

```text
H-33  FactoryReceipt records no environment: which factory binary judged it, on which host, A      receipt_format "2": every
      with which git/toolchain/runtime                                                          new receipt carries
                                                                                               environment_identity =
                                                                                               {factory_binary {path,
                                                                                               sha256, bytes}, host {os,
                                                                                               arch, kernel_release}, git
                                                                                               version, identity_probes[]};
                                                                                               a fixture declares
                                                                                               job_parameters.identity_probes
                                                                                               (rustc/cargo/node/chromium
                                                                                               -vV with toolchain, target,
                                                                                               profile, flags as recorded
                                                                                               arguments); verification.json
                                                                                               carries verifier_identity
H-34  D0-D12 receipts and D6/D7/D9 evidence identity incomplete                             B      preserved; not rewritten
H-35  verifier provenance (D12 B-13): the binary is built from canonical HEAD by the        C      the binary sha256 is now
      route procedure, but the build commit is not embedded                                     recorded (A part); source
                                                                                               commit provenance stays [GAP]
```

### 2.9 Target 9 - Workpiece / branch hygiene

```text
H-36  13 attached, integrated worktrees W0..W8, W10..W13; no audit or cleanup machinery    A      `factory workpiece audit`
      (D12 B-14)                                                                                (read-only) and `factory
                                                                                               workpiece retire` (guarded);
                                                                                               witnesses f14/f15
H-37  W9 absent (other session)                                                            B      recorded ABSENT; lineage by git
H-38  12 stage directories are byte-subsets of their integration trees                     A      retired by the same guarded
                                                                                               command (proof: tree(stage)
                                                                                               vs integration tree has only
                                                                                               "D" entries)
H-39  W11-stage holds 2 paths that differ from the integrated tree                          B      KEEP [GAP]: not provably
                                                                                               disposable
H-40  factory-bootstrap-bin (unmanaged 6 MB file in the workpiece root)                    B      KEEP [GAP]: no Factory record
                                                                                               proves what it is
H-41  remote branches claude/d9-rust-cargo-proof-4nys6s, factory/reference-corpus-wasm64,  -      REPORT ONLY: 0 unique commits
      work/pass2-5-reference-ingress-1 (all ancestors of HEAD)                                  each (retirable by the owner);
                                                                                               deleting a GitHub branch is an
                                                                                               outward-facing owner action
H-42  the current workpiece W14 and its stage                                               -      never retired by D13
```

Retire guard (all must hold, else the object is kept and the reason recorded):

```text
worktree   state verification PASS  AND  integration PASS  AND  reinspect MATCH
           AND integration commit is an ancestor of the canonical branch head (git merge-base --is-ancestor)
           AND worktree HEAD == integration commit
           AND `git status --porcelain --ignored` in the worktree is empty
           AND the workpiece is not the one named by the running delta
           -> `git worktree remove <dir>` (no --force; git itself refuses an unclean tree) ; state files are kept
stage      a state file exists for W<n> with integration PASS AND
           tree(stage, computed into a TEMPORARY object directory) vs the integration tree lists only "D" entries
           -> directory removed
anything   else -> KEEP, reason recorded ([GAP] where no proof mechanism exists)
```

### 2.10 Target 10 - Status integrity

```text
H-43  LEDGER D13-PROMPT-INTAKE AFTER is the placeholder "recorded by the next delta"        A      written in F0 (integrated as
                                                                                               205d337, F0-doc PASS,
                                                                                               verification PASS, reinspect
                                                                                               MATCH).  The newest entry's
                                                                                               own AFTER placeholder is
                                                                                               structural (a commit cannot
                                                                                               contain its own id): allowed
                                                                                               once
H-44  markers across the tree (section 9)                                                   A-D    tests/hygiene/status-scan.mjs
                                                                                               inventories every occurrence
                                                                                               against declared zone rules;
                                                                                               0 unclassified required; live
                                                                                               boundaries enumerated with
                                                                                               one class each in the
                                                                                               open-boundary register
H-45  no dead internal link found in law documents (unresolved hits were external pins or  -      none
      shorthand)
```

## 3. Decisions carried by this ASCII

### 3.1 Authority for root-document annotation (explicit, bounded widening)

```text
PROBLEM   targets 5 and 7 require marking root documents (FABLE-ASCII-SYSTEM-PROMPT.md, FINAL-HANDOFF-REQUIREMENTS.md,
          PLANNED-REPO-LAYOUT.md, STATION-REGISTRY.md, FACTORY-CONTRACTS.md and the five #internal-storage citers);
          no registered station may change them (DOC-D13).
DECISION  register S-ANNOTATE (capability LAW_ANNOTATION), a NEW station, rather than widening S-DOC:
            may_change        exactly the 10 files above (literal file entries) + factory/receipts/
            must_not_change   FACTORY-LAW.md, compiler/, host/, factory/src/, evidence/
            invariant         INSERTION-ONLY: for every changed file, `git diff --numstat <base> -- <file>` reports
                              0 deleted lines, and every inserted block starts with "D13 ANNOTATION"
          It is loaded from the workpiece as bootstrap registry material (ops::delta_owned) and becomes canonical on
          integration.  FACTORY-LAW.md is excluded.  The owner prompt orders these marks ("Mark them historical",
          "remove any internal false certainty ... preserve the exact historical citation"); the station makes the
          authority explicit, literal and testable instead of implicit.
```

### 3.2 Toolchain pin (target 3)

```text
EVIDENCE   the only complete qualified matrix (D9: 23 obligations + 8 mutants, judge qualified) ran on
             native obligations  stable 1.94.1 (e408947bfd200af42db322daf0fadfe7e26d3bd1), LLVM 21.1.8
             wasm64 obligations  nightly 6eeff9a52c3e35c4c4cbf5651f342dcd2191866f (rustup nightly-2026-09-24),
                                 LLVM 23.1.1, components rust-src + clippy
           no other nightly ever ran the matrix: 6bb1652a0 (D1-D3, D11, D12) built B9-B11 or the D12 kernel only,
           and lacked clippy (D11 FACT-NIGHTLY-CLIPPY-ABSENT-D11).  KRN-D13-B shows 6eeff9a52 reproduces D9's kernel
           byte-for-byte.  -> one unambiguous qualified choice PER PROOF SET; no nightly is chosen arbitrarily.
MECHANISM  rust-toolchain.toml   channel "1.94.1", components ["clippy", "rustfmt"], profile "minimal"
                                 (HOST_NATIVE_SET; a bare cargo command in the repository now resolves the pin)
           proof-sets.json       HOST_NATIVE_SET toolchain "1.94.1" + commit; WASM64_KERNEL_SET toolchain
                                 "nightly-2026-09-24" + commit 6eeff9a52 + components rust-src, clippy; the qualified
                                 runner passes +<toolchain> explicitly on EVERY cargo call (compile-fail fixtures and
                                 mutants are copied outside the repository, where rust-toolchain.toml does not reach)
                                 and FAILS the pin obligation when an installed toolchain's commit differs
           a single rust-toolchain.toml channel cannot pin two toolchains; the second pin lives in the proof-set
           declaration and is enforced by the runner.  This is a mechanism limit, not a contradiction: D9 already
           ran the two sets on two toolchains.
RESULT     PINNED (both sets), with H-12 kept as [GAP] (identity depends on the install name).
```

### 3.3 Proof-set taxonomy

```text
SET                 TOOLCHAIN            TARGET                    ROOTS / SELECTION                     PROFILES
HOST_NATIVE_SET     1.94.1 (e408947bf)   x86_64-unknown-linux-gnu  default-members (13): factory, 11     dev, release
                                         (host)                    compiler crates without wasm-abi,
                                                                   host/factc; bare cargo == this set
WASM64_KERNEL_SET   nightly-2026-09-24   wasm64-unknown-unknown    -p factc-wasm-abi; graph = wasm-abi   dev, release
                    (6eeff9a52)          -Z build-std=core         + the 11 compiler crates (12)
                                         RUSTFLAGS stack flag
ALL_SOURCES         1.94.1               none (rustfmt)            every member's files                  -
ALL_MEMBERS_GRAPH   1.94.1               none (cargo metadata)     every member + physical manifests      -
CROSS_SET           1.94.1               host                      --workspace build/clippy/test         diagnostic
                                                                                                         only, weight
                                                                                                         NONE
HEURISTIC           -                    -                         factory nostd-check / depcheck        weight NONE
```

## 4. Receipt environment identity (receipt_format "2")

```text
receipt.environment_identity = {
  factory_binary:   { path, sha256, bytes }             the judge that closed the station
  host:             { os, arch, kernel_release }       std::env::consts + /proc/sys/kernel/osrelease
  git:              "git version ..."
  identity_probes:  [ { name, command, exit, output_first_lines } ]   declared by the fixture
}
verification.json.verifier_identity = { path, sha256, bytes }
Toolchain, target, profile, runtime version and flags are NOT guessed by the Factory: the fixture declares them as
identity probes (for example `rustc +1.94.1 -vV`, `cargo +nightly-2026-09-24 -vV`, `node --version`, the chromium
revision) and as explicit command arguments, and the receipt records the observed output.
```

## 5. Live handoff surfaces

```text
LIVE ENTRY      README.md -> docs/HANDOFF.md
LIVE LAW        FACTORY-LAW.md (constitution), FACTORY-CONTRACTS.md, STATION-REGISTRY.md + factory/registry/,
                FINAL-HANDOFF-REQUIREMENTS.md (requirements), REFERENCE-AUTHORITY.md, CONSTRAINT-LEDGER.md,
                CONFLICT-LEDGER.md, CAPABILITY-MATRIX.md, IMPLEMENTATION-CONTRACTS.md, EVIDENCE-OBLIGATIONS.md, the
                language/lowering/verification contracts named in README
LIVE RECORD     design/materialization/LEDGER.md, design/environment-map/ (graph + derived views),
                docs/HANDOFF.md open-boundary register, the newest D<n> intended/observed pair
HISTORICAL      FABLE-ASCII-SYSTEM-PROMPT.md (Fable 5.1 bootloader), PASS1-6 + PASS5/6 tests, PLANNED-REPO-LAYOUT.md,
                M0/M9/COMMISSIONING-RECORD, D9-D12 intended/observed/prompts, evidence/, factory/receipts/,
                factory/deltas + factory/fixtures of integrated deltas
A fresh agent of any model reads README.md, then docs/HANDOFF.md, then FACTORY-LAW.md, and needs no session prompt.
```

## 6. Status-integrity zones (tests/hygiene/status-classification.json)

```text
ZONE                 RULE CLASS  MEANING
evidence/, factory/receipts/     B           historical evidence; immutable
factory/deltas, factory/fixtures of D0..D13  B    historical control records (their tests text, e.g. "all ladders")
closed delta records (M0, M9, COMMISSIONING-RECORD, D9-D12 docs, prompts)  B   historical; live items re-listed in the
                                                                                 open-boundary register
PASS1-6, PASS5/6 tests, FABLE-ASCII-SYSTEM-PROMPT, PLANNED-REPO-LAYOUT      B   historical pass/plan documents
root law documents                REGISTER    law ledgers: each ERR/GAP/UNK item is a boundary row; its class is
                                              given in the open-boundary register (C or D)
design/environment-map/           REGISTER    graph + derived views: each marker belongs to a node (AUTHORITY -> D,
                                              FACT/EVIDENCE GAP -> C, identity incompleteness -> B)
docs/HANDOFF.md, D13 documents    REGISTER    the classification itself
tool/code vocabulary              N           status words used as data/semantics (envmap PENDING, sw.js cache
                                              "stale", phases.rs diagnostic "[GAP]" string = a capability gap the
                                              kernel reports, i.e. C at runtime)
A-rules (must not recur)          A           S-FIXTURE wildcard entries; "LIVE RECORD OF THE FABLE"; README "read
                                              FABLE-ASCII-SYSTEM-PROMPT.md first when beginning"; ledger AFTER
                                              placeholder beyond the newest entry
PASS condition: 0 unclassified occurrences; every A-rule within its bound (0, placeholder <= 1).
```

## 7. Mutation plan by Factory station (delta D13-REPO-HYGIENE, workpiece W14, base 205d337)

```text
FX  STATION     MAY CHANGE (narrowed, literal)                     OPERATION / VERIFICATION
F0  S-DOC       design/materialization/D13-INTENDED-REPO-HYGIENE.md  this ASCII; ledger header + D13-PROMPT-INTAKE
                design/materialization/LEDGER.md, factory/deltas/    AFTER + D13 BEFORE; checks: sections 0-12,
                D13.json, factory/fixtures/D13/, receipts            H-01..H-45, STRUCTURAL CHECK: PASS; production,
                                                                     law, graph, evidence untouched; no pin yet
F1  S-RUST      factory/src/, factory/tests/, rust-toolchain.toml    literal-surface validation, receipt format 2,
                                                                     verifier identity, workpiece audit/retire,
                                                                     heuristic weight; witnesses f09..f16; the pin;
                                                                     cargo +1.94.1 fmt --check, clippy -D warnings,
                                                                     test -p factory; bare rustc in the workpiece
                                                                     resolves the pin; compiler/ host/ untouched
F2  S-FIXTURE   tests/toolchain/{proof.mjs, proof-sets.json,         proof sets, pins, CROSS_SET, HEURISTIC, channel
                run-qualified-proof.sh}, tests/hygiene/,             map; status scan + zone classes; handoff check;
                tests/envmap/envmap.mjs                              registry check; envmap merge/merge-check/bind/
                                                                     Q16; syntax checks, sets-check against cargo
                                                                     metadata, D11 graph still validates
F3  S-DOC       factory/registry/stations/S-FIXTURE.json,            S-FIXTURE v2; S-ANNOTATE bootstrap spec; README;
                factory/registry/stations/S-ANNOTATE.json,           docs/HANDOFF.md; graph epochs D12/D13 merged
                README.md, docs/, design/environment-map/            (D13 evidence PENDING); derived views; checks:
                                                                     validate, merge-check, render-check, registry
                                                                     check (literal; S-FIXTURE effective may_change
                                                                     unchanged), `factory delta check` of D13 with
                                                                     the repaired binary
F4  S-ANNOTATE  the 10 root files of 3.1                             insertion-only annotations; check: 0 deleted
                                                                     lines per file vs base, marker present, every
                                                                     #internal-storage citation still byte-present
F5  S-BUILD     evidence/D13/proof/                                  factory built from the workpiece with the pin;
                                                                     run-qualified-proof.sh (both sets, pinned
                                                                     toolchains, CROSS_SET, HEURISTIC, kernel
                                                                     identity, Chromium ABI) + mutants; summary gate
F6  S-EVIDENCE  evidence/D13/{status,handoff,paths,workpieces}/      status scan; handoff check; paths-probe;
                                                                     workpiece audit -> guarded retire -> audit
F7  S-DOC       design/environment-map/                              bind EV-D13-* sha256 into epochs/D13.json;
                                                                     re-merge graph.json; re-render; no PENDING left
F8  S-EVIDENCE  evidence/D13/envmap/, evidence/D13/index.json        envmap validate + Q01..Q16 + stale +
                                                                     render-check + merge-check; evidence index
F9  S-DOC       design/materialization/D13-OBSERVED-REPO-HYGIENE.md  observed ASCII (intended vs observed) and the
                design/materialization/D13-PRE-RESCAN-BASELINE.md    PRE-RESCAN-BASELINE record
Delta MUST NOT CHANGE: FACTORY-LAW.md, compiler/, host/, fixtures/, Cargo.toml, Cargo.lock, factory/Cargo.toml, every
D0-D12 and D13-PROMPT-INTAKE delta/fixture/receipt/evidence path, tests/bootstrap/, tests/commissioning/,
tests/language/, tests/selfhost/, the D9 scripts run-proof-matrix.sh and run-mutants.sh, the D11 envmap probes, all
closed design records, all root documents except README.md and the 10 annotation targets.
```

## 8. Predictions

```text
P-F1   f00..f08 still PASS; f09..f16 PASS; clippy/fmt clean
P-F3   graph validate PASS; merge-check: 211 D11 nodes and 475 D11 edges preserved; render-check MATCH;
       S-FIXTURE effective may_change identical before/after over git ls-files
P-F5   HOST_NATIVE_SET (1.94.1): build/test dev+release PASS over exactly 13 packages; clippy PASS; compile-fail 3/3
       PASS; ALL_MEMBERS_GRAPH first-party PASS + negative fixture rejected; ALL_SOURCES fmt PASS; sets-check PASS
       WASM64_KERNEL_SET (nightly-2026-09-24): clippy core graph PASS; core-only graph dev+release PASS (12 crates);
       release kernel sha256 6f25ce43... (install nightly-2026-09-24) MATCH declared; wasm-inspect I64 PASS;
       Chromium ABI PASS
       CROSS_SET: build --workspace / clippy --workspace fail on factc-wasm-abi panic_handler (expected; OBS)
       HEURISTIC: nostd-check / depcheck results recorded with proof weight NONE
       pins PASS; mutants 8/8 RUN
P-F6   status scan: 0 unclassified, A-rules within bounds; handoff check PASS; audit: 13 worktrees RETIRABLE,
       12 stages RETIRABLE, W11-stage KEEP, factory-bootstrap-bin KEEP, W9 ABSENT, W14 CURRENT; retire removes
       exactly the retirable objects; audit after: 0 retirable
```

## 9. Final verification mapping (prompt FINAL VERIFICATION)

```text
[PASS] Factory authority surfaces mean what they claim           F1 f09..f11, F3 registry literal + paths-probe
[PASS] unsupported wildcard-looking authority cannot match nothing F1 validate_surface rejects at delta/fixture/station
[PASS] proof sets distinguish native and wasm64 targets           F2 proof-sets.json + sets-check, F5 records
[PASS] authoritative no_std/dependency proofs use the qualified judge  F5 T9-P5-02/03, T9-P6-01/03; heuristics NONE
[PASS] live handoff no longer depends on Fable/Opus identity      F3 README + docs/HANDOFF.md, F4 banners, F6 check
[PASS] D12 is traversable from the environment graph              F3 merge, F8 Q16 epoch D12
[PASS] historical evidence remains immutable                      delta must_not_change + F0/F3/F4 diff checks
[PASS] unresolved technical capability gaps remain visible        open-boundary register + graph C nodes
[PASS] unresolved external authority questions remain visible     register D rows + annotations + graph DENIED
[PASS] cleanup deleted nothing not proven disposable              F6 retire receipt + audit after
[PASS] full post-repair verification/evidence succeeds            F5 + F6 + F8 + factory verify + reinspect
[PASS] intended and observed D13 structures agree                 F9 observed ASCII
Any FAIL -> DO NOT start D14; return to ASCII.
```

## 10. Invariants

```text
I1  historical evidence, receipts, deltas and fixtures of D0-D12 and D13-PROMPT-INTAKE byte-identical
I2  no authority widening except S-ANNOTATE (3.1), which is literal, insertion-only and excludes FACTORY-LAW.md;
    S-FIXTURE effective authority unchanged
I3  no production semantics change in compiler/ or host/; no new capability; no seed/broker
I4  every B/C/D item stays visible (register rows, graph nodes, annotations); no marker removed to look clean
I5  cleanup only under the retire guard; W14 and anything unproven kept
I6  no third-party dependency (Rust std, node ESM, sh, git)
```

## 11. Open-boundary register (carried into docs/HANDOFF.md section 6)

```text
C  B-01 no Factory WebApp; B-02 git subprocess state; B-06 six ABI exports absent; B-17 packfiles; B-05 templates
   compiled in; WGSL never dispatched; hardware GPU never observed [UNK]; shared/threaded Wasm unadmitted
   (ERR-002/003); storage best-effort (B-11, P07); kernel identity install-path dependent (H-12); verifier source
   provenance (B-13 remainder); Q09 map coverage (29 families); streaming/MIME and workers unprobed
B  D0-D12 receipt/evidence identity incompleteness; historical overstatement (all ladders/full suite); D1-D8 heuristic
   gates; scratch-only route scripts and graph generator; W11-stage drafts; factory-bootstrap-bin; W9 absent
D  #internal-storage fragment drift + contracts.ascii link; 37 authorities not reopened (published hosts DENIED);
   githack public-origin path unreachable (B-19); GitHub smart-HTTP CORS (B-18); browser update behaviour (B-20)
OWNER  D-1 home origin, D-2 generated-app origins (B-16 [ERR]), D-3 RUST_BUILD strategy, D-5 BUILD without registry
       (B-07), D-6 object hash, D-8 seed replacement, D-9 history horizon; remote branch deletion (H-41);
       paused D13-SEED-BROKER-QUALIFICATION (to be renumbered after D14)
DECIDED D-4 (pinned by evidence, 3.2); D-7 (literal surfaces, owner prompt target 1)
```

## 12. Structural check

```text
inputs supplied        prompt (tracked), D9/D11/D12 records, evidence/D9, D11, D12, Factory source, registry, harnesses,
                       assembly probes 0.2                                                              PASS
outputs consumed       every file in section 7 has a consumer: Factory (registry, src), qualified runner (proof-sets),
                       fixtures (scanner, checks), reader (README, HANDOFF), D14 (baseline, register, graph)  PASS
contracts match        receipt format 2 is additive (old receipts still verify: verify() reads status/station/base
                       /checks only); S-FIXTURE v2 loads under StationSpec; graph epoch files use the declared
                       node classes and edge semantics                                                  PASS
forbidden bypasses     no agent write to the canonical repo; S-ANNOTATE cannot delete; retire never --force  PASS
illegal cycles         the D13 fixtures may_change sets are disjoint where order matters (F3 graph vs F7 binding
                       touch the same directory in sequence, not concurrently)                          PASS
invariants represented I1-I6 each mapped to a fixture check (section 7) or the delta must_not_change      PASS
tests/evidence         each H-item class A has a witness or check; B/C/D have a register row             PASS
authority widening     only S-ANNOTATE, declared in 3.1 before materialization                          PASS
```

STRUCTURAL CHECK: PASS
