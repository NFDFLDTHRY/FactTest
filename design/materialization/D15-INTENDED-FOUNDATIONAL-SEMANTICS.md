# D15 - Intended Foundational Semantics

STATUS: INTENDED ASCII (assembled before routing; source of record for delta D15-FOUNDATIONAL-SEMANTICS, workpiece W17)
REQUEST: design/materialization/D14-D19-TECHNICAL-REFERENCE-REVIEW-PROMPT.md, pass D15 ("What do the foundational
computational authorities currently require?").  Input: D14-OBSERVED-FRONTIER-REOPEN.md, graph Q17.
SCOPE: trace exact clauses at each source's CURRENT tip, connect them to project constraints / facts / contracts /
probes / evidence, and propose constraints where the traced text requires something the model does not yet say.  No
law document is edited (D18); no historical evidence is touched; no earlier graph node is edited.

## 0. Observation before drawing

```text
HEAD            46cc28b (D14 integrated, pushed); tree clean
network         unchanged since D14: published renderings denied; sources through raw.githubusercontent.com + git
sources         29 documents at their tips (git ls-remote): tc39/ecma262 726ec8a, whatwg/webidl 6a53497, whatwg/fetch
                357bd98, whatwg/streams b9ba9f4, w3c/permissions 0051a83, w3c/webappsec-permissions-policy 2939804,
                whatwg/html cd8ac6f, w3c/webappsec-secure-contexts 68191bb, WebAssembly/spec 6087111 (js-api, web-api,
                core rst AND specification/wasm-3.0 SpecTec), WebAssembly/threads cc535ad, shared-everything-threads
                065aa53, rust-lang/reference 52ffdc0, rust-lang/cargo 694054f, rust-lang/rust 3670d25 (main),
                w3c/ServiceWorker 2f5ec06, whatwg/storage 1933f42, whatwg/fs cd55e55, w3c/IndexedDB f704918,
                w3c/web-locks a61a773, w3c/manifest 8ae3046, git/git 0f8e75a
assembly run    tests/reference/clauses.mjs over tests/reference/d15-clauses.json: 60 clauses, 60 VERIFIED (each located
                at its tip, every quoted phrase present); repeated by the Factory in F2
harness defects found and repaired DURING ASSEMBLY: (1) three clauses TEXT_MISSING (two windows too short, one FS
                anchor matched an earlier interface with the same exposure line) - corrected, not forced; (2) CL-F2's
                anchor matched the same sentence inside importScripts instead of the Update algorithm: textually
                verified but the WRONG clause - anchored after #update-algorithm, and every record now states its
                enclosing section so reviewers can see this class of error; (3) the shared id-derivation treated
                [[x]] as an asciidoc anchor in every format (ECMA-262 internal slots and bibliography refs became
                "anchors"; D14's rejected #CSP3 candidate came from it) - restricted to .adoc.  The D14 reopen
                probe, refactored onto tests/reference/lib.mjs, reproduces all 64 D14 records except moved tips and
                that one coarse candidate (tests/reference/regress-reopen.mjs)
```

## 1. Intended structure

```text
    graph AUTHORITY nodes (65)          new document-level AUTHORITY nodes (10)
                  │                                 │
                  └──────────────┬──────────────────┘
                                 ▼
      tests/reference/d15-clauses.json   11 traces, 60 clauses: authority, locator (fragment by renderer rule, or
                                 │        anchor text [+ after]), window, must_contain phrases, consequence,
                                 │        grounds (constraints/facts), leads_to (sublinks)
                                 ▼
      tests/reference/clauses.mjs  ── source at TIP ──► evidence/D15/clauses/records/<CL>.json
                                 │   (commit, sha256, lines, enclosing section, excerpt, excerpt sha256, phrase checks)
                                 ▼
      tests/reference/build-clauses.mjs ──► design/environment-map/epochs/D15.json
            declares CLAUSE + CLAUSE_OF / GROUNDS / LEADS_TO / EXTRACTED_IN; new authorities pinned to what was read;
            6 proposed constraints (AUTHORIZES + GROUNDS + REQUIRES + IMPLEMENTED_BY); 5 facts
                                 ▼
      envmap: validate (+3 clause checks) ─► TRACEABILITY lists clauses per fact ─► Q18 claim traversal
            CLAIM -> AUTHORITY -> CLAUSE -> MATURITY -> PIN -> CONSTRAINT -> CONTRACT -> ENV -> PROBE -> EVIDENCE -> STALE
```

## 2. Traces (exact clauses; every line below is a VERIFIED clause at the named tip)

```text
R  Rust no_std -> build-std -> rust-src -> wasm64 target -> core-only graph -> proof obligation
   CL-R1 reference r[names.preludes.extern.std]: std joins the extern prelude only without no_std       -> CON-RS-001
   CL-R2 reference r[names.preludes.std.module]: no_std => core::prelude::rust_20xx                      -> CON-RS-001
   CL-R3 cargo build-std Requirements: rust-src, nightly Cargo AND rustc, -Z build-std on every call     -> CON-RS-002
                                                                                                        CON-EM-007
   CL-R4 rustc wasm64: no pre-compiled artifacts; build std/core with build-std                          -> CON-RS-002
   CL-R5 rustc wasm64: panic=unwind unsupported (FactTest: panic = "abort")                              -> CON-RS-001
   CL-R6 rustc wasm64: cfg(target_arch = "wasm64") (the wasm-abi panic_handler gate; CROSS_SET)         -> CON-FT-007
   CL-R7 rustc wasm64: "memory64 ... still in-progress and not standardized"  => ERR-001 is CURRENT     -> CON-RS-003
   CL-R8 target spec: +bulk-memory,+mutable-globals,+sign-ext,+nontrapping-fptoint                       -> CON-EM-004
   CL-R9 target spec: pointer_width 64, p:64:64 (every pointer/length is i64)                            -> CON-WA-002
W  Wasm Core memory64 -> JS API address-typed memories -> BigInt membrane
   CL-W1 core syntax addrtype; CL-W2 SpecTec Memtype_ok: limits within 2^(bits-16) pages (2^48 for i64);
   CL-W3 binary limits flag carries the address type; CL-W4 Release 3.0 "64-bit Address Space";
   CL-W5 MemoryDescriptor.address; CL-W6 Memory() defaults to "i32"; CL-W7 AddressValueToU64: i64 = BigInt in
   [0, 2^64-1]; CL-W8 ToWebAssemblyValue i64 = ToBigInt64; CL-W9 ToJSValue i64 = mathematical integer (BigInt)
S  Web API streaming -> Fetch -> Streams
   CL-S1 compileStreaming rejects non-CORS-same-origin / non-ok / non-application/wasm; CL-S2 exact MIME, no
   parameters; CL-S3 ok status 200-299; CL-S4 readable stream (FactTest instantiates from bytes: streaming unprobed)
T  agent-local embedding -> Threads (Phase 4) / SET (Phase 1) -> HTML COI + canBlock -> ECMA SAB
   CL-T1 JS API #store: nothing shared among agents (cited at #store, not #internal-storage); CL-T2 Threads shared
   memory; CL-T3 SET "Expect frequent and significant changes"; CL-T4 SAB serialization needs the cross-origin
   isolated capability; CL-T5 that capability is per environment; CL-T6 ECMA: SharedArrayBuffer global only "if that
   property is present"; CL-T7 AgentCanSuspend = [[CanBlock]]; CL-T8 HTML creates window agents with canBlock false
I  Web IDL exposure and conversions
   CL-I1 [SecureContext] => exposed only within a secure context; CL-I2 [EnforceRange]; CL-I3 bigint = ToBigInt;
   CL-I4 ECMA ToBigInt64
H  secure context -> trustworthiness -> sandboxed opaque origin
   CL-H1 HTML: secure context decided by the environment's TOP-LEVEL CREATION URL; CL-H2 127.0.0.0/8 and ::1 are
   potentially trustworthy; CL-H3 an opaque origin is Not Trustworthy; CL-H4 sandboxed origin flag => opaque origin
F  Fetch service-workers mode -> SW lifecycle -> seed consequences
   CL-F1 request service-workers mode; CL-F2 Update sets it to "none" (#update-algorithm); CL-F3 registration stale
   by last update check; CL-F4 Register requires a potentially trustworthy origin; CL-F5 installFailed => installing
   worker redundant, active kept; CL-F6 sandboxed iframes have a null active service worker
P  Permissions -> Permissions Policy
   CL-P1 powerful feature = express permission, mostly also policy-controlled; CL-P2 'self' default => Disabled when
   not same origin with the container; CL-P3 container policy (allow attribute) decides first
ST Storage -> OPFS -> IDB -> Web Locks
   CL-ST1 buckets start best-effort; CL-ST2 storage pressure clears best-effort; CL-ST3 persist() [Exposed=Window];
   CL-ST4 FileSystemFileHandle [SecureContext]; CL-ST5 createSyncAccessHandle [Exposed=DedicatedWorker];
   CL-ST6 IDB transaction atomic and durable; CL-ST7 LockManager [SecureContext, Exposed=(Window,Worker)]
MF Manifest: CL-MF1 installation is a user-agent offer ("A user agent can provide a way")
G  git: CL-G1 object id = hash over "<type> <size>\0"+content, zlib; CL-G2 update-ref CAS; CL-G3 tree order
   "normalized by mktree" with NO stated rule; CL-G4 pack signature + version; CL-G5 objectFormat = sha256
```

## 3. Findings (what the foundation currently requires that the model did not say)

```text
F1  [ERR current]   ERR-001 is not historical: the rustc wasm64 page at the tip still calls memory64 "in-progress and
                    not standardized" while Core 3.0 (CL-W4) and the proposal registry (D14) standardize it.
                    Implementation documentation is not standards law (CON-RS-003): the Core wins; the rustc page is
                    recorded as a stale implementation statement.
F2  [NEW]           the BigInt membrane is standard law (CL-W7/W8/W9, CL-I3/I4) and FactTest's host already obeys it
                    (kernel-host.mjs, adapter-wasm64_relay.js): CON-WA-006 proposed; FACT-JS-I64-BIGINT-MEMBRANE [RUN]
F3  [NEW]           secure context vs opaque origin are different questions (CL-H1 vs CL-H3/H4): a sandboxed generation
                    under a trustworthy top-level IS a secure context with an opaque origin - D12 P08/P16 observed
                    exactly the specified behaviour: CON-SEC-002; FACT-OPAQUE-FRAME-SECURE-CONTEXT [RUN]
F4  [NEW / relabel] SharedArrayBuffer global absence without COI is HOST behaviour (CL-T6 "if that property is present");
                    only serialization is gated by the standard (CL-T4).  D11's observation stays true for Chromium and
                    is relabeled an implementation fact (FACT-SAB-GLOBAL-HOST-DEFINED [OBS]; D17 names the source).
                    Window agents cannot block (CL-T8): shared-memory backends block only in workers.
F5  [NEW]           'self'-default features are Disabled in opaque-origin frames unless the container policy grants
                    them (CL-P2/P3): every capability a confined generation uses needs allow= AND permission
                    (CON-PP-001; D16 input)
F6  [GAP]           git tree-entry order is "normalized by mktree" without a documented rule (CL-G3): browser-computed
                    tree ids are correct only where equality with git was observed (P09) (CON-GIT-001;
                    FACT-GIT-TREE-ORDER-UNDOCUMENTED [GAP]; the rule's implementation source -> D17)
F7  [precision]     Core 3.0 validation prose is generated from SpecTec: the memory-limit rule is verified in
                    specification/wasm-3.0/2.1-validation.types.spectec (CL-W2), not in the .rst sources
F8  [NEW]           seed lifecycle and storage durability are now clause-grounded constraints (CON-SW-001 from CL-F1/F2/F5;
                    CON-ST-001 from CL-ST1-ST3), REQUIRING the D12 facts they explain
no authority changed its requirement (D14: no SEMANTIC movement); the constraints above are ADDED precision, not
revisions.  Existing CONSTRAINT-LEDGER entries are reconciled in D18.
```

## 4. Graph epoch D15 (add-only)

```text
declares   CLAUSE {clause_id, authority_ref, trace, epoch, source {repo, commit, path, sha256}, locator {requested,
           line_start, line_end, derivation, enclosing_section}, excerpt_sha256, quoted[], consequence}; CLAUSE_OF (->
           AUTHORITY), GROUNDS (-> CONSTRAINT | COMPUTATIONAL_FACT), LEADS_TO (-> CLAUSE), EXTRACTED_IN (-> EVIDENCE)
adds       60 CLAUSE + 60 extraction EVIDENCE + summary EVIDENCE; 10 AUTHORITY (ECMA-262, Web IDL, Fetch, Streams,
           Permissions, Permissions Policy, SpecTec validation, JS API values, HTML secure context, git mktree) pinned to
           the commit/sha256 the extraction read; ENV-D15-HOST, PROBE-CLAUSE-EXTRACT, IMPL-REFERENCE-CLAUSES;
           constraints CON-WA-006, CON-SEC-002, CON-PP-001, CON-SW-001, CON-ST-001, CON-GIT-001 (PROPOSED);
           facts FACT-D15-CLAUSES-VERIFIED [RUN], FACT-JS-I64-BIGINT-MEMBRANE [RUN], FACT-OPAQUE-FRAME-SECURE-CONTEXT
           [RUN], FACT-SAB-GLOBAL-HOST-DEFINED [OBS], FACT-GIT-TREE-ORDER-UNDOCUMENTED [GAP]
tooling    validate: clause_of_its_authority, clause_has_extraction_identity, clause_connected; TRACEABILITY: clauses per
           fact; Q18 claim traversal (maturity step accepts source-declared maturity and annotates an unverified
           published rendering [UNK] instead of stopping every claim on the network policy)
```

## 5. Q18 baseline (assembly trial)

```text
RUN claims 42: COMPLETE 10 (FACT-CORE-ONLY-GRAPH, FACT-GPU-EXPOSED, FACT-JS-I64-BIGINT-MEMBRANE,
  FACT-LOOPBACK-SECURE-CONTEXT, FACT-MEMORY64-DISCOVERED, FACT-WASM64-ABI-EXEC, FACT-WASM64-ADMITTED-E0/E1,
  FACT-WASM64-MODULE-I64, FACT-WORKPIECE-ISOLATION); stops at EXACT CLAUSE 11 (WebGPU facts -> D16; D13 process facts);
  stops at IMPLEMENTATION CONTRACT 15 (self-hosting facts: truly unimplemented; project facts -> D18); stops at CURRENT
  AUTHORITY 4 (project/process facts authorized by law, not by an external authority -> D18); PROJECT CONSTRAINT 1;
  STALE CONDITIONS 1
non-RUN claims 29 terminate at their own status: GAP 12, OBS 9, UNK 4, ERR 4
```

## 6. Mutation plan by station (delta D15-FOUNDATIONAL-SEMANTICS, workpiece W17, base 46cc28b)

```text
F0  S-DOC       this ASCII; ledger (D14 AFTER + D15 BEFORE); delta; fixtures
F1  S-FIXTURE   tests/reference/{lib.mjs, reopen.mjs (refactor), clauses.mjs, build-clauses.mjs, regress-reopen.mjs,
                d15-clauses.json}, tests/envmap/envmap.mjs; checks: syntax, generic tools, reopen regression against
                evidence/D14 (allowed differences: moved tips, the fixed coarse candidate), current graph unchanged
F2  S-BUILD     evidence/D15/clauses/ (Factory re-extraction at the tips; exit 0 only if all 60 VERIFIED)
F3  S-DOC       epochs/D15.json built from the Factory evidence; graph merged; views rendered; SCHEMA section 8,
                ENVIRONMENT-MAP section 7 (written inside this station)
F4  S-EVIDENCE  evidence/D15/envmap/ (validate, Q01-Q18, stale, merge-check, render-check), Q18 gate, workpiece
                audit -> retire -> audit, evidence index
F5  S-DOC       D15-OBSERVED-FOUNDATIONAL-SEMANTICS.md, docs/HANDOFF.md
route           tests of every station open's exit status before copying anything (D14 lesson)
MUST NOT CHANGE: law and pass documents, compiler/, host/, factory/ machinery, fixtures/, Cargo files,
                 rust-toolchain.toml, tests other than the files above, epochs D12-D14, D0-D14 evidence, closed records
```

## 7. Predictions

```text
P1  F2: 60/60 VERIFIED (unless a source tip moved with a clause changed: that is evidence, not a failure to force)
P2  epoch D15 145 nodes / 305 edges; merged 586 / 1100; validate PASS (30 checks); D11-D14 preserved
P3  Q18: 42 RUN claims, 10 COMPLETE, every other RUN claim stops at a named step; 29 non-RUN terminate at their status
P4  reopen regression: 64 records; differing fields only .source_tip.commit and .coarse.candidates.section.*
P5  audit (read-only dry run during assembly): W16 worktree RETIRABLE; W16-stage KEEP (its graph.json,
    AUTHORITY-REGISTER.md, TRACEABILITY.md are D14 pre-binding trial drafts absent from the integrated tree);
    after retire: RETIRABLE 0, KEEP 4 (W11-stage, W14-stage, W16-stage, factory-bootstrap-bin), CURRENT 2 (W17, W17-stage)
```

## 8. Invariants

```text
I1  a clause is admitted only VERIFIED at its tip; a phrase the source lacks stops the pass (return to ASCII)
I2  every CLAUSE names its authority, source commit and sha256, lines, enclosing section and excerpt sha256
I3  proposals stay proposals (CL-T2 Phase 4, CL-T3 Phase 1); implementation docs stay implementation (CL-R7 vs CL-W4)
I4  no law document, no earlier node and no D0-D14 evidence edited; constraints only PROPOSED (ledger in D18)
I5  host behaviour is labeled host behaviour (FACT-SAB-GLOBAL-HOST-DEFINED), never standard law
```

## 9. Pass gate

```text
D15 closes when the Factory extraction reproduces 60 VERIFIED clauses, the epoch validates, Q18 traverses every claim to
COMPLETE or a named stop, and the observed ASCII compares P1-P5.  Carried across the gate explicitly: ERR-001 current,
the git tree-order [GAP], published renderings [UNK], and the Q18 stops assigned to D16/D17/D18.
```

## 10. Structural check

```text
inputs supplied        29 source documents at tips; manifest; D14 graph                                      PASS
outputs consumed       clause evidence -> builder -> epoch -> Q18 -> D16 (EXACT CLAUSE stops), D17 (F4, F6),
                       D18 (constraints, law reconciliation)                                                  PASS
contracts match        CLAUSE declared before use; GROUNDS/REQUIRES/IMPLEMENTED_BY endpoints in declared
                       semantics; builder refuses unverified clauses                                          PASS
forbidden bypasses     no law edit; no earlier node edit; the extractor cannot mark a missing phrase as verified PASS
illegal cycles         LEADS_TO chains are acyclic by construction (trace order)                              PASS
invariants represented I1-I5 -> extractor exit code, CLAUSE fields, manifest review, delta must_not_change   PASS
tests/evidence         F1 regression, F2 extraction, F3 validate/merge/render, F4 queries + Q18 gate          PASS
```

STRUCTURAL CHECK: PASS
