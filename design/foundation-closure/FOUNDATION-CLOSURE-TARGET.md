# FOUNDATION CLOSURE - the live target

STATUS: LIVE TARGET (introduced by D27-FOUNDATION-CLOSURE-ALIGNMENT; the one coherent architecture the next work series
builds towards; supersedes design/materialization/D12-INTENDED-SELF-HOSTING.md as the target - D12 stays historical
evidence and its probes stay current facts).  Every claim below is a graph fact, a register row or an evidence path;
the registers are tests/closure/registers/*.json, rendered by tests/closure/structural-check.mjs into
[CLOSURE-REGISTERS.md](CLOSURE-REGISTERS.md) (generated), and the structural check over them is the gate of this target.
LAW: FACTORY-LAW.md; FACTORY-CONTRACTS.md; ASCII-LANGUAGE.md and ASCII-GRAMMAR.md (D27 annotations); STATION-REGISTRY.md
(S-LANGUAGE-LAW).  BASELINE: design/materialization/D26-STABLE-BASELINE.md (what is [RUN] today; not re-proved here).

THE QUESTION THIS DOCUMENT ANSWERS WITHOUT SESSION MEMORY

"What exact machine must exist for the installed Factory to evolve the language through which the human and local model
tell it what to manufacture?"  - section 13 gives the answer as a chain; sections 1-12 give the parts.

## 1. The existing commissioned host system (what the repository IS today; D26 baseline)

```text
 ╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
 ║  HOST (Linux, git 2.43, cargo 1.94.1 + nightly-2026-09-24, node 22, Playwright + Chromium 141 headless)         ║
 ║                                                                                                                  ║
 ║  AGENT ──► ASCII (design/materialization/D<n>-INTENDED-*.md) ──► STRUCTURAL CHECK ──► FACTORY ROUTER            ║
 ║                                                                        factory/ (Rust std crate, 3,797 lines)   ║
 ║        StructuralDelta (factory/deltas) ──► WORKPIECE = git worktree at canonical_base ──► STATION(S)           ║
 ║        S-DOC S-FIXTURE S-RUST S-WEB S-BUILD S-BROWSER S-BUNDLE S-EVIDENCE S-ANNOTATE(-OWNER) S-LANGUAGE-LAW(D27) ║
 ║        station open/close = tree snapshot + fixture commands (OS programs) + receipt format 2                    ║
 ║        ──► VERIFY (judge = factory binary built from HEAD; f00-f28 witnessed) ──► INTEGRATE (ff-only CAS)        ║
 ║        ──► REINSPECT ──► EVIDENCE (evidence/D<n>) ──► GRAPH EPOCH ──► OBSERVED ASCII                            ║
 ║                                                                                                                  ║
 ║  COMPILER  compiler/ (12 no_std crates + wasm-abi; 15,373 lines; core-only; forbid(unsafe_code))                ║
 ║        ASCII source ──► scan/parse (LANGUAGE 1: 31 keywords) ──► resolve ──► typed IR ──► obligations           ║
 ║        ──► capability lowering ──► implementation hypergraph (contract registry) ──► planner ──► CandidateStrategy║
 ║        ──► INDEPENDENT VERIFIER ──► VerifiedStrategy ──► codegen (templates by include_str!) ──► BundleVerifier   ║
 ║        ──► GeneratedBundle {index.html, runtime.js, selector.js, membrane, adapters, wasm64 module, sw.js,       ║
 ║             manifest, bundle.json}; observe: evidence tape ──► ObservationDelta ──► observed ASCII               ║
 ║        transports: host/factc (native driver)  ==  compiler/wasm-abi in Chromium (21 exports; Q-WASM-08)        ║
 ║                                                                                                                  ║
 ║  GENERATED WEBAPP RUNTIME (per bundle, in Chromium)                                                              ║
 ║        admission (epoch E) ──► guard evaluation ──► ActivePlan ──► transfer(relation, bytes) by verified          ║
 ║        requirement ──► loss ──► E1 ──► stale plan invalidated ──► reselection inside the VerifiedStrategy         ║
 ║        (no runtime codegen) ──► evidence tape bound to strategy-data identity; offline via SW/CacheStorage        ║
 ║                                                                                                                  ║
 ║  D12 SELF-HOSTING PRIMITIVES (probes, re-proved D25/D26 on fresh bundles)                                        ║
 ║        offline launch P01, SW no self-update P02, origin-scoped restart survival P03, OPFS-served app P04,       ║
 ║        SW-granted COI P05, IDB atomic pointer / CAS P06, persist() false P07, opaque confinement P08,            ║
 ║        git object identity in the browser P09, kernel in a worker P10, broken seed fatal P14, interrupted        ║
 ║        update P15, broker-fed confined generation P16                                                            ║
 ╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
 [RUN] every box above except: no Factory WebApp [GAP], stations = OS programs [ERR], RUST_BUILD host-only [UNK],
       seed/broker/generation not assembled [GAP], installed durability [UNK], public HTTPS [UNK]
```

Component classification (SEMANTIC CORE / HOST ADAPTER / BROWSER-NATIVE CANDIDATE / VERIFICATION-EVIDENCE /
HISTORICAL-ARCHIVE / FUTURE INTERACTION PACKAGING) of all 72 components: tests/closure/registers/classification.json
(CLOSURE-REGISTERS.md section 2).  The semantic core is the compiler crates, the Factory law (model, paths, checks, the
verify/integrate/reinspect state machine) and the law/contract text; the host adapters are git, the process spawner,
identity probes, the CLI, factc and the Cargo workspace; the browser-native candidates are wasm-abi and the templates.

## 2. The required installed-WebApp equivalent

```text
 HOME ORIGIN https://<dedicated host>  (D-1)          origin server = seed install / replacement only
 │
 ▼
 IMMUTABLE MINIMAL SEED  (one service-worker script: router + pointer boot + hash-checked serving + inline broker +
 │                        recovery view; MUST/MUST NOT rules 1-8 in registers/seed.json)
 │  reads {active, previous_good, pending} (IDB, one readonly tx)      never: compile, verify law, run stations, GitHub
 ▼
 TRUSTED BROKER  (seed-owned page; the only storage path)     get(id) | put(bytes)->id (write-once) | propose_pending |
 │                                                            cas_ref(name, old, new) | startup_ok(id)
 ├──────────────────────────────┬─────────────────────────────┐
 ▼                              ▼                             ▼
 OPFS objects                   IndexedDB                     CacheStorage
 content-addressed, write-once  refs (CAS), overlay records,  the seed's own shell
 git-compatible ids (P09)       pointers, generation history
 │                              │
 └──────────────┬───────────────┘
                ▼
 FACTORY GENERATION N  (opaque sandboxed frame, inline bootstrap, fed by postMessage: P08, P16)
 ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │  ASCII CORE                  FACTORY CORE (law engine, wasm)          COMPILER KERNEL N (wasm64, worker)      │
 │  source objects, canonical   delta check | fixture authority |        LANGUAGE N manifest + corpus table N    │
 │  teach-back, diagnostics,    station open/close (capability ops) |    ANALYZE / BUILD / OBSERVE (21 exports)  │
 │  language manifest N         verify | integrate (cas_ref) | reinspect                                        │
 │                                                                                                             │
 │  BROWSER STATIONS = capability operations with browser adapters:                                            │
 │  TREE_SNAPSHOT TREE_DIFF PATH_AUTHORITY FILE_ASSERT JSON_ASSERT EVIDENCE_INDEX WASM_INSPECT KERNEL_BUILD     │
 │  QUALIFY_SPECIMEN BROWSER_PROBE ; RUST_BUILD = IMPORT_COMPILED_OBJECT with a build receipt (until FB-04)      │
 │                                                                                                             │
 │  ISOLATED CANDIDATE N+1 (objects written once; manifest) ──► VERIFY with N's law engine, N's verifier,        │
 │  N's BundleVerifier, N's hashes ──► QUALIFY (Q1-Q7: N feeds the confined candidate; corpus oracle, specimens, │
 │  witness scenarios, provenance, non-mutation) ──► FAIL: preserve N | PASS: propose_pending(N+1)              │
 └─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                ▼
 SEED next navigation: attempts < K ──► boot N+1 confined ──► startup_ok before deadline ──► promotion tx
 (previous_good := N, active := N+1)  |  no startup_ok / crash / hash mismatch ──► rollback tx ──► FACTORY N
```

What is actually required versus merely attractive: the seed, the broker, the object store, the law engine, the
capability stations, the qualification runner and the generation pointer are REQUIRED (each is a row of
registers/blockers.json with a sequence step); a UI beyond the working ASCII surface, packfiles, remote sync and
templates-as-data are attractive (they widen L3-A or serve L4) and are sequenced after the required parts.

## 3. The human / local-model / ASCII boundary

```text
 HUMAN ── natural language, drawn diagrams ──► TINY LOCAL MODEL (future packaging) ── ASCII systems diagram ──► COMPILER N
            ◄── observed ASCII, canonical teach-back, diagnostics ──┘                          (LANGUAGE N)
 the model is TRANSLATOR + DIALOGUE PARTNER; never semantic authority, compiler, verifier, Factory or a hidden source
 of meaning.  The interface the model uses is stable and exists TODAY:
   VOCABULARY     tests/closure/language-manifest-v1.json (derived from compiler/source; checked against the grammar)
   TEACH-BACK     the canonical rendering (parse(render(AST)) == AST; one canonical sha256 per presentation family)
   DIAGNOSTICS    code, code id, severity, phase, source, primary + related spans, message class, parameters, authority
   PARTIAL STATE  ANALYZE keeps GAP/UNK/ERR objects and statuses; BUILD refuses execution-critical gaps
   AMBIGUITY      AMBIGUOUS_REFERENCE / UNRESOLVED_NAME / PARSE_UNKNOWN_KEYWORD return to the human; nothing is guessed
   EVIDENCE       observed ASCII from runtime tapes (bound to the bundle's strategy-data identity)
 JSON StructuralDelta / Fixture / StationSpec stay the internal compiled Factory-control representation.
 Hardening audit of the language as this protocol: registers/hardening.json (H-01..H-16); open items: no version
 statement in source (FB-21), observed ASCII accepted as source (FB-22), no vocabulary query on the running kernel
 (FB-23), presentation property witnessed by fixed transforms only (FB-24), one-workspace capacity (FB-27).
```

## 4. The language-evolution lifecycle (COMPILER N DEFINES LANGUAGE N)

```text
 LANGUAGE N ──(1)── manifest N derived from Compiler N (never authored beside it) ─────────────────────────────────┐
     │ (2) proposal for N+1 written in LANGUAGE N + non-semantic prose/diagram; grammar text for N+1 = PROPOSAL      │
     │ (3) compiler source changed under S-RUST                                                                     │
     │ (4) Factory N builds Compiler N+1                      [host: cargo; installed: the RUST_BUILD boundary FB-04] │
     │ (5) Factory N / independent verifier qualifies N+1     [ladders, qualified proof, mutants; browser: FB-28]    │
     │ (6) corpus of N reproduced row by row by N+1           [tests/closure/language-corpus.mjs --check]            │
     │ (7) canonical round trip                               [L19/L20; corpus canonical identities]                 │
     │ (8) new-syntax tests                                   [per proposal; GAP until FC-5]                         │
     │ (9) unknown-keyword attacks: manifest N+1 minus manifest N refused by Compiler N   [L41; GAP until FC-5]      │
     │ (10) known systems compiled by both where compatibility is promised   [corpus BUILD rows; cross-verify FC-6]  │
     │ (11) migration / version rules                         [manifest --grammar; migration records GAP FC-5]       │
     ▼ (12) activate Compiler N+1 (Factory integration / generation swap)                                            │
 LANGUAGE N+1 authoritative ONLY NOW  (S-LANGUAGE-LAW: LANGUAGE VERSION BOUND; NEW SYNTAX NEVER AUTHORIZES ITSELF) ◄─┘
 Laws L-EV-1..6 and the status of each step: registers/evolution-contract.json.  Bound into law: ASCII-GRAMMAR.md D27
 annotation (LANGUAGE VERSION 1), STATION-REGISTRY.md D27 annotation (S-LANGUAGE-LAW), LANGUAGE-TESTS.md L36-L43.
```

## 5. The generation N -> N+1 lifecycle

```text
 ACTIVE(N) ──propose_pending(M) by N after VERIFY + QUALIFY──► PENDING(M, attempts=0)
    ▲                                                              │ navigation: attempts < K -> attempts+1 (tx); boot M confined
    │ rollback tx (attempts >= K, deadline, hash mismatch, throw)  ▼
    └──────────────────────────────────────────────────────── BOOTING(M) ──startup_ok(M) in time──► promotion tx ──► ACTIVE(M)
 objects: generation manifest {schema, files{path: sha256}, parent, source_tree (git tree id), compiled_objects{id: build
 receipt}, qualification_evidence[], browser_identity}; file objects; evidence objects - all write-once, content-addressed.
 QUALIFICATION by N (Q1-Q7, D12 section 9): completeness, provenance, compiled-object receipts (identity == pin or a
 RUST_BUILD receipt), law self-tests (f00-f28 analogues) run by M confined on synthetic repositories N supplies, the
 specimens re-verified by N's verifier/BundleVerifier and executed, the re-qualification set from the graph (STALE_IF),
 non-mutation of the canonical ref and tree.  Primitives [RUN]: P06 P08 P16 P03; implementation [GAP]: FB-28, FB-29.
```

## 6. The trusted computing base (minimum; circularity explicit)

```text
 browser engine | storage substrate | home origin (at seed events) | immutable seed | hash implementations (WebCrypto +
 first-party sha256) | generation pointers (seed-owned) | ACTIVE FACTORY N = law engine + verifier + BundleVerifier +
 compiler kernel N + manifest N + corpus table N | the RUST_BUILD epoch of every imported compiled object (host today) |
 git object semantics (reproduced, P09) | authority graph + registers (data) | GitHub (L4 only)
 ALLOWED       Factory N verifies Factory N+1.        Compiler N tests Compiler N+1 against promised compatibility.
 INSUFFICIENT  N+1 as the only verifier of N+1.       New syntax as the sole authority proving the compiler that gives it
               meaning.                                A compiled object checking its own build (two independent build
                                                       epochs agreeing on bytes is the oracle: FACT-KERNEL-IDENTITY-D24).
 outside the TCB once generation 0 exists: git, cargo/rustc (except as the RUST_BUILD epoch), node, sh, the Linux Factory,
 Playwright.  Rows with evidence: registers/seed.json (tcb).
```

## 7. The browser-native Factory mapping

```text
 CURRENT              REQUIRED SEMANTIC EFFECT                 BROWSER-NATIVE MECHANISM                       STATUS  FC
 git worktree     ──► isolated mutable candidate tree      ──► overlay {path -> blob id} over the base tree    GAP   FC-2
 git object       ──► content-addressed immutable object   ──► WebCrypto SHA-1 + CompressionStream (P09)       RUN*  FC-2
 git ref          ──► canonical generation pointer         ──► IDB key per ref, written in transactions        GAP   FC-2
 git ff-only      ──► base-unmoved atomic promotion        ──► IDB CAS under a Web Lock (P06)                  GAP   FC-2
 git diff-tree    ──► deterministic tree difference        ──► recursive tree comparison by id                 GAP   FC-2
 process command  ──► bounded capability invocation        ──► operation classes + Linux/browser adapters      ERR   FC-4
 filesystem       ──► object / storage substrate           ──► OPFS + IDB + CacheStorage (P03, P04, P07)       UNK   FC-1
 receipt          ──► immutable witnessed operation record ──► receipt object naming capability + adapter      GAP   FC-4
 verify           ──► independent candidate judgment       ──► N's law engine over confined candidate          GAP   FC-3
 reinspect        ──► materialized state == verified state ──► pointer's tree id == verified tree id           GAP   FC-3
 audit / retire   ──► proven-safe garbage collection       ──► reachability from refs + generation history     GAP   FC-2
 remote sync      ──► optional external replication        ──► REST behind the broker; packfiles               GAP   FC-8
 (* identity proven, store not built)   full rows with evidence and tests: registers/correspondence.json
 Linux mechanisms are not ported because they exist: sh/grep/node/git/cargo are incidental adapters (D12 section 5);
 only their semantic effects are preserved.
```

## 8. The Rust-build closure boundary (the deepest remaining boundary)

```text
 NOT THE SAME THING:   running the existing compiler as wasm  [RUN]   vs   compiling modified Rust into the next compiler
                       (FACT-D23-WASM-TRANSPORT-COMPLETE)              inside the browser  [UNK]  (FACT-D27-RUST-BUILD-BOUNDARY)
 REQUIRED   compile compiler/ (12 no_std crates + wasm-abi) and the ported law engine for wasm64-unknown-unknown with core
            from source; output identity checkable against a host build while a host exists; behaviour qualified by N
            (Q1-Q7, corpus, specimens) thereafter
 INPUT      first-party source objects (15,373 lines compiler; 3,797 factory; 568 host) + core source (176,305 lines,
            7.2 MB) + Cargo.lock (first-party paths only) + the toolchain identity (rustc 6eeff9a52, LLVM 23.1.1)
 CANDIDATES B1 hosted rustc + LLVM in wasm [UNK: no wasm-host rustc ships; 158 + 199 MB native; memory unmeasured]
            B2 FactTest-native (FactTest compiles FactTest) [GAP architectural: the language describes systems]
            B3 import-only with RUST_BUILD receipts (L3-A) [RUN-able now: closes 14 of 16 acceptance steps, NOT 3-4]
            B4 first-party Rust-subset compiler [GAP: architectural scale; input bounded by the census]
            B5 hosted rustc + cranelift [UNK: no backend installed; identity pin would move]
 TRUST / VERIFICATION / BOOTSTRAP / REPRODUCIBILITY / RECOVERY per candidate: registers/rust-build.json
 DECISION   D-3 (owner).  Recommended by evidence: B3 first, then FC-7 measures B4 vs B1/B5 with exit criteria.
 CLAIM      self-hosting is NOT claimed while RUST_BUILD calls the Linux host.
```

## 9. Rollback / recovery

```text
 FAILURE                        DETECTION                         RECOVERY                          STATUS
 corrupt active generation      seed hash check on read           boot previous_good; recovery view primitives RUN; impl GAP (FC-1)
 interrupted update             pending with attempts, no ok      rollback tx                       P06 RUN; impl GAP (FC-1)
 bad candidate                  N's qualification Q1-Q7           never proposed                    GAP (FC-6)
 bad activated generation       no startup_ok / crash / deadline  rollback; confinement keeps N safe P08 P16 RUN; impl GAP (FC-1)
 bad generation after startup   none automatic                    recovery view -> previous_good    GAP (FC-1 recovery view)
 broken seed                    every navigation fails            origin server / site-data clearing architectural limit (P14 RUN)
 storage eviction               objects missing / hash mismatch   re-install seed; restore from export / remote  GAP (FB-11)
 bad Compiler N+1               corpus of N not reproduced;       N never activates it; migration     mechanism RUN (corpus oracle)
                                specimens fail under N's verifier records reviewed in ASCII
 browser update                 STALE_IF browser.version          re-run admission + qualification  UNK (FB-20)
```

## 10. Optional remote-sync boundary (L4, deferrable)

Canonical state is local git-compatible objects plus a CAS ref (section 7); L3 does not depend on GitHub.  Remote
divergence is detected only at sync: local ancestor of remote -> fast-forward; remote ancestor of local -> fast-forward
push; otherwise DIVERGED returns to ASCII as an explicit merge delta (never automatic).  GitHub REST is CORS-open,
smart-HTTP is not (a proxy would join the TCB); credentials live behind the broker and never enter a generation frame;
packfile import/export is [GAP] (FB-17, FB-18; sequence FC-8).  The public-HTTPS execution path itself is [UNK] from this
environment (FACT-D25-PUBLIC-HTTPS; tests/physical/PUBLIC-HTTPS-PROBE.md) and stays a deployable probe, never localhost.

## 11. The foundation-closure test (the physical experiment the target must pass)

Factory N installed; network removed; the original Linux build environment unavailable; then the 16 steps of
registers/acceptance-test.json (open after restart; inspect/edit ASCII; bounded change to the Rust implementation of
the language; build N+1 locally; verify with N; old corpus; new tests; known systems; independent bundle verification;
execute a generated WebApp; atomic activation; restart; N+1 still active; bad candidate; rollback; evidence back to
observed ASCII).  VERDICT TODAY: NOT CLOSED - 0 of 16 steps execute without the host; every step has its mechanism,
its primitive evidence and its sequence step; step 4 is the RUST_BUILD boundary.  If any step needs the original
server, host git, host rustc/cargo or an unmodeled manual intervention, SELF-HOSTING IS NOT CLOSED.

## 12. The bounded implementation sequence (next series; not begun by D27)

```text
 FC-1 D28-SEED-BROKER-QUALIFICATION   the seed failure matrix on loopback; D-2 probed         FB-29 FB-08..11   steps 1,11-15
 FC-2 D29-BROWSER-OBJECT-STORE        git-compatible store, overlays, diff, CAS, retire       FB-02 FB-17 FB-14 steps 2,3
 FC-3 D30-FACTORY-CORE-PORT           law engine as no_std wasm; verdict parity f00-f28       FB-01 FB-25 FB-13 steps 1,2,5
 FC-4 D31-CAPABILITY-STATIONS         operation classes + adapters; receipt parity            FB-03             steps 6,8,9,16
 FC-5 D32-LANGUAGE-2-PROPOSAL         first run of the evolution contract (host-built C2)     FB-21..24 FB-27   step 7
 FC-6 D33-CANDIDATE-QUALIFICATION     Q1-Q7 in the browser; templates as data                 FB-28 FB-05       steps 5-9,14
 FC-7 D34-RUST-BUILD-SPIKE            D-3 by evidence: B3 + measured B4/B1/B5                 FB-04             steps 3,4
 FC-8 D35-GENERATION-SWAP             the closure experiment run; L4 boundary drawn           FB-16..18 FB-20   steps 1-16 (3-4 gated)
 each: one StructuralDelta, closed, verified, integrated, re-observed before the next; details registers/sequence.json
```

## 13. The answer to the stop condition, and the structural check

The machine: an immutable seed and broker (FC-1) holding write-once objects and CAS pointers (FC-2) that boot a
confined generation whose law engine (FC-3) runs capability stations (FC-4) and whose compiler kernel defines LANGUAGE N;
a language proposal written in LANGUAGE N is built into Compiler N+1 (host today; FC-7 for the browser), qualified by N
against the frozen corpus of N, the derived manifest, the specimens and the witness scenarios (FC-5, FC-6), and activated
atomically with rollback (FC-8) - only then is LANGUAGE N+1 authoritative.  Every part of that sentence is a row that
links CURRENT EVIDENCE -> REQUIRED SEMANTIC BEHAVIOUR -> BROWSER-NATIVE MECHANISM -> TEST -> EVIDENCE -> status, and
tests/closure/structural-check.mjs refuses the target when any link is missing, any cited fact is not current, any open
blocker is neither sequenced nor an explicit boundary, or any acceptance step has no mechanism.  Its record for the
integrated tree is evidence/D27/closure/structural-check.json; the rendering is CLOSURE-REGISTERS.md; the graph fact is
FACT-D27-CLOSURE-STRUCTURE-CHECKED.  Broad self-hosting implementation begins no earlier than FC-1, after this structure
is integrated, reconciled with the D26 baseline (docs/HANDOFF.md section 1) and the check passes.
