# D14 - Intended Frontier Reopen

STATUS: INTENDED ASCII (assembled before routing; source of record for delta D14-FRONTIER-REOPEN, workpiece W16)
REQUEST: design/materialization/D14-D19-TECHNICAL-REFERENCE-REVIEW-PROMPT.md, pass D14 ("What has changed in the current
authority frontier since the recorded D11-D13 observations?").  Input baseline: D13-PRE-RESCAN-BASELINE.md.
SCOPE: reopen and classify only.  No law document, constraint, contract or earlier graph node is edited ("DO NOT deeply
reconcile the whole repo yet"); reconciliation is D18.

## 0. Observation before drawing

```text
main / HEAD      origin/main 4d8a4c0 (PR #4 merge) -> intake D14-D19-PROMPT-INTAKE integrated as 5e57467 (ff), pushed;
                 tree clean; the intake receipt is the first receipt_format 2 (judge sha256 bb1475ba..., git 2.43.0)
network          published authority hosts refused by the environment policy (proxy 403 on CONNECT):
                 webassembly.github.io, w3c.github.io, gpuweb.github.io, html/fs/storage/compression.spec.whatwg.org,
                 doc.rust-lang.org, git-scm.com, source.chromium.org, chromium.googlesource.com, www.w3.org,
                 api.w3.org, raw.githack.com, rawcdn.githack.com; github.com pages answer 403 through the proxy;
                 OPEN: raw.githubusercontent.com (bytes), github.com git smart-HTTP (git ls-remote), api.github.com
                 rate_limit only.  The owner was told which hosts to admit; D14 proceeds at source level.
source tips      21 pinned repositories (git ls-remote): 17 tips == pin; chromium/chromium 75d6f0c -> 02e17d0 and
                 v8/v8 36de2a2 -> 05d9907 (cited files byte-identical); rust-lang/rust: refs/heads/master ABSENT,
                 HEAD -> refs/heads/main == pinned commit 3670d2532b; NFDFLDTHRY/FactTest law pinned at 4a151c9 (D10),
                 canonical HEAD 5e57467
maturity source  WebAssembly/proposals @ f0db14a: Threads Phase 4, Shared-Everything Threads Phase 1, Memory64 in
                 finished-proposals.md
assembly probe   tests/reference/reopen.mjs (scratch run, repeated by the Factory in F2):
                 published   53 UNREACHABLE (DENIED), 2 HTTP_403 (github.com blob URLs), 1 OPENED (raw), 1 local,
                             7 repository law
                 source      51 TIP == PIN, 10 TIP MOVED + FILE IDENTICAL, 2 FILE CHANGED (FactTest law), 1 local
                 pins        63 PIN_MATCH (sha256 re-verified), 1 local file without a pinned sha
                 clauses     62 UNCHANGED, 1 MOVED (lines shifted), 1 no clause key
                 fragments   16 PRESENT_EXPLICIT, 13 PRESENT_DERIVED, 32 NOT_CITED, 3 ABSENT
                 maturity    no declared-status drift (Bikeshed Status/Group identical at pin and tip)
harness defects  found and repaired DURING ASSEMBLY (before any Factory run): (1) WHATWG ids come from data-x and
                 dfn start tags span lines; (2) Bikeshed dfn-for/dfn-type declared on an enclosing <table>;
                 (3) asciidoctor setext section titles; (4) the review-candidate filter matched "UNCHANGED";
                 (5) locator candidates were proposed from C++ sources and IDL members.  Each false ABSENT was
                 re-checked against the pinned source before the rule was added.
```

## 1. Intended structure

```text
            graph.json AUTHORITY nodes (64: 48 D11 + 16 D12)            WebAssembly/proposals registry
                              │                                                   │
                              ▼                                                   ▼
          tests/reference/reopen.mjs  ── per authority ──►  evidence/D14/reopen/records/<ID>.json
          │ 1 current authority: curl published URL (+ fragment if the page opens)
          │ 2 source frontier : ls-remote tip (symref on a missing branch), pinned bytes (sha256), tip bytes
          │ 3 fragment        : id at pin and tip (explicit / renderer-derived / ABSENT)
          │ 4 clause          : locator window at pin -> same text at tip -> old->new lines, or review candidate
          │ 5 maturity        : declared Status/Group at pin and tip; proposal phases from the registry
          │ 6 coarse          : section + definition id candidates for document-root / line-only citations
                              │
                              ▼
          tests/reference/d14-review.json  (ASCII decisions: movement per authority, reviewed locator map,
                              │             maturity notes, coarse citations deferred to D15-D17, D14 facts)
                              ▼
          tests/reference/build-revisions.mjs ──► design/environment-map/epochs/D14.json
                              │   AUTHORITY_REVISION x64 (REVISES -> AUTHORITY, OBSERVED_IN -> EVIDENCE)
                              │   AUTH-WASM-PROPOSALS-REGISTRY (+ DEPENDS_ON from Threads / SET / Core changes)
                              │   ENV-D14-HOST, PROBE-AUTHORITY-REOPEN, IMPL-REFERENCE-REOPEN, 5 facts
                              ▼
          envmap merge (D11 + D12 + D13 + D14) ──► validate ──► Q17 "what moved / what may be stale" ──► D18 input
```

## 2. Classification law (two identities, nine classes)

```text
CURRENT AUTHORITY axis   published URL result: OPENED | UNREACHABLE (DENIED / 403) | LOCAL | REPOSITORY_LAW
SOURCE axis              UNCHANGED   tip == pin, or tip file byte-identical, or clause window identical
                         MOVED       clause text identical, locator changed (lines, fragment id, branch ref)
                         EDITORIAL   file changed outside the clause (or insertion-only annotation)
                         SEMANTIC    clause text changed in meaning                       (ASCII decision only)
                         REMOVED / SPLIT/MERGED   clause absent / divided / joined at the tip (ASCII decision)
                         AMBIGUOUS   cannot be decided from the source (no sha to compare; renderer-dependent id)
MATURITY axis            MATURITY when a status/phase is newly observed or changed
movement[]               = [UNREACHABLE if the published rendering was not verified] + SOURCE class + MATURITY
rule                     the probe never decides EDITORIAL vs SEMANTIC; a changed window is a review candidate.
                         A fragment is "verified" only at SOURCE level in D14; published verification stays [UNK].
```

## 3. Reviewed assembly result (tests/reference/d14-review.json)

```text
AUTHORITY                         MOVEMENT                   LOCATOR / NOTE
AUTH-WASM-JSAPI-STORAGE           UNREACHABLE+MOVED          #internal-storage -> #webassembly-storage (explicit h2 id,
                                                             pin line 328); #store for the agent-local note; clause
                                                             unchanged  (D13 class D item: source-verified locator,
                                                             published alias still [UNK])
AUTH-WASM-WEBAPI-STREAMING        UNREACHABLE+MOVED          NEW: #streaming-module-compilation-and-instantiation never
                                                             existed at the pin (explicit h2 id streaming-modules);
                                                             D11's PRESENT_IN_SOURCE was false certainty [ERR] ->
                                                             #streaming-modules / #compile-a-potential-webassembly-response
AUTH-GIT-REPO-LAYOUT              UNREACHABLE+AMBIGUOUS      #_worktrees: a definition-list term, no asciidoctor id;
                                                             git-scm.com rendering unknown -> #_description + entry
AUTH-RUSTC-WASM64-DOC             UNREACHABLE+MOVED          pin branch master absent; main == pinned commit
AUTH-RUSTC-WASM64-TARGET-SPEC     UNREACHABLE+MOVED          same (published github.com/.../blob/master answers 403)
AUTH-WASM-THREADS                 UNREACHABLE+UNCHANGED      Phase 4 (registry f0db14a): newly observed, still not the
                                  +MATURITY                  standard; ERR-002 unchanged
AUTH-WASM-SET                     UNCHANGED+MATURITY         Phase 1; ERR-003 unchanged (raw README opens)
AUTH-WASM-CORE-CHANGES-64         UNREACHABLE+UNCHANGED      Memory64 finished (corroborates Release 3.0); coarse root
                                                             narrowed to candidate #bit-address-space (docutils rule)
LAW-EVIDENCE-OBLIGATIONS          EDITORIAL                  D13 insertion-only annotation shifted the E-025 lines
LAW-FACTORY-CONTRACTS             EDITORIAL                  D13 appended contract amendment; section 4 unchanged
AUTH-PLAYWRIGHT-INSTALLED         AMBIGUOUS                  no pinned sha; D14 records the current sha256
all other 53 authorities          UNREACHABLE+UNCHANGED      source byte- or clause-identical; published not verified
reviewed locator map (D12 source-line-only and coarse D11 citations -> source-level fragments):
  SW-UPDATE-BYPASS #update-algorithm, SW-INSTALL-FAILED #installation-algorithm, SW-REGISTER-TRUST
  #register-algorithm, SW-SANDBOX-NO-CONTROLLER #control-and-use-window-client, FS-OPFS #api-filesystemfilehandle,
  STORAGE-BUCKET-MODE #bucket-mode, IDB-TRANSACTION #transaction-concept, WEB-LOCKS #api-lock-manager,
  COMPRESSION-ZLIB #supported-formats, WEBCRYPTO-DIGEST #SubtleCrypto-method-digest, MANIFEST-INSTALLABLE
  #installable-web-applications (ReSpec-derived candidate), HTML-SANDBOX-ORIGIN #sandboxed-origin-browsing-context-flag,
  GIT-OBJECT-FORMAT #object-details, GIT-UPDATE-REF-CAS #_description
coarse, deferred with a named pass: WGSL (D16); rustc wasm64 page, git pack/revisions/sha256, SET overview (D15);
  rustc target spec, SwiftShader README, Chromium SwiftShader doc, installed Playwright (D17); PASS1 FT-003,
  PLANNER-COST-MODEL (D18)
conflicts (CONFLICTS_WITH): OBS-D11-1, ERR-001, ERR-002 (x2), ERR-003, D13-PIN - every involved source unchanged ->
  each conflict persists as recorded; none resolved, none new
GitHack / public HTTPS: raw.githack.com and rawcdn.githack.com refused again (B-19 unchanged); AUTH-SECCTX-TRUSTWORTHY
  source unchanged, so the loopback-only secure-context evidence keeps its bound
```

## 4. Graph epoch D14 (add-only)

```text
declares   node class AUTHORITY_REVISION {revision_id, authority_ref, epoch, observed, current_authority, source,
           fragment, clause, maturity, movement[], locator, rationale}; edges REVISES (-> AUTHORITY), OBSERVED_IN
           (-> EVIDENCE).  No AUTHORITY node of D11/D12 is edited: a revision is a later observation beside it.
adds       64 AUTHORITY_REVISION + 64 reopen EVIDENCE + summary and phase-registry EVIDENCE; ENV-D14-HOST (tool
           versions, denied-host list); PROBE-AUTHORITY-REOPEN; IMPL-REFERENCE-REOPEN; AUTH-WASM-PROPOSALS-REGISTRY
           (+ DEPENDS_ON from Threads, SET, Core changes); facts FACT-FRONTIER-SOURCES-AT-PIN [RUN],
           FACT-PUBLISHED-FRONTIER-UNVERIFIED [UNK], FACT-WASM-THREADS-PHASE-4 [OBS], FACT-WASM-SET-PHASE-1 [OBS],
           FACT-MEMORY64-FINISHED [OBS]
tooling    envmap merge accepts epoch-declared classes/edges (add-only); validate checks revisions (authority ref,
           REVISES, movement vocabulary, reopen evidence); Q17 = latest revision per authority -> movement ->
           downstream constraints / facts / probes / evidence with the consequence of each class; the authority
           register prints each revision
```

## 5. Downstream staleness predicted by Q17 (input to D18, not reconciled here)

```text
MOVED      FACT-SHARED-THREADS-UNADMITTED (via JSAPI-STORAGE), FACT-STREAMING-UNPROBED (via WEBAPI-STREAMING),
           FACT-WASM64-MODULE-I64 / -ABI-EXEC / -ADMITTED-E0 (via rustc pins): citation locators stale, claims not
AMBIGUOUS  FACT-WORKPIECE-ISOLATION, FACT-FF-ONLY-INTEGRATION (git repository-layout id), FACT-GPU-ADAPTER-SWIFTSHADER
           (installed Playwright identity)
MATURITY   FACT-SHARED-THREADS-UNADMITTED (Threads Phase 4: still unadmittable as baseline)
EDITORIAL  no claim change
UNREACHABLE every claim that cites an external authority: current authority unverified in D14 (D-R2 unchanged)
```

## 6. Mutation plan by station (delta D14-FRONTIER-REOPEN, workpiece W16, base 5e57467)

```text
F0  S-DOC       this ASCII; ledger (intake AFTER + D14 BEFORE); delta; fixtures
F1  S-FIXTURE   tests/reference/{reopen.mjs, build-revisions.mjs, d14-review.json}, tests/envmap/envmap.mjs;
                syntax; the current graph still validates, merges and renders identically
F2  S-BUILD     evidence/D14/reopen/ (the reopen probe re-run by the Factory), evidence/D14/network/ (host probe incl.
                githack); gate: 64 records, every pin re-verified, no clause CHANGED/NOT_FOUND that the review did not
                classify
F3  S-DOC       design/environment-map/epochs/D14.json built from the Factory evidence; graph merged; views rendered;
                SCHEMA.md and ENVIRONMENT-MAP.md epoch sections; checks: validate, merge-check (D11-D13 preserved),
                render-check
F4  S-EVIDENCE  evidence/D14/envmap/ (validate, Q01-Q17, stale, merge-check, render-check), evidence/D14/workpieces/
                (audit -> retire of W14/W15 and their stages -> audit), evidence index
F5  S-DOC       D14-OBSERVED-FRONTIER-REOPEN.md; docs/HANDOFF.md (state, next pass, register rows)
MUST NOT CHANGE: every law and pass document, compiler/, host/, factory/ (except D14 control files), fixtures/,
                 Cargo files, rust-toolchain.toml, tests/ except the four files above, D0-D13 + intake artifacts,
                 epochs D12/D13, closed design records
```

## 7. Predictions

```text
P1  F2 reproduces the assembly probe: 64 records; published 53 DENIED + 2 x 403; 63 PIN_MATCH; clauses 62 UNCHANGED,
    1 MOVED, 1 no key; fragments ABSENT = {JSAPI-STORAGE, WEBAPI-STREAMING, GIT-REPO-LAYOUT}
P2  epoch D14: 139 nodes / 154 edges; merged graph 441 nodes / 795 edges; validate PASS (27 checks); D11-D13 nodes
    identical
P3  Q17: 64 revisions; UNREACHABLE 55, MOVED 4, AMBIGUOUS 2, MATURITY 2, EDITORIAL 2; 8 facts to recheck in D18
P4  audit: W14, W15 worktrees and stages RETIRABLE; W16 CURRENT; W11-stage, factory-bootstrap-bin KEEP
    (if a source tip moves between assembly and F2, the difference is evidence: P1-P3 are re-read, not forced)
```

## 8. Invariants

```text
I1  current authority and reproducibility pin stay separate fields (current_authority vs source) in every revision
I2  no AUTHORITY node of D11/D12 is edited; D11-D13 graph content byte-preserved (merge-check)
I3  proposals stay proposals: Threads Phase 4 and SET Phase 1 recorded as MATURITY observations, not as standards
I4  no probe-made SEMANTIC/EDITORIAL decision; every non-UNCHANGED class is in the review file with a rationale
I5  historical evidence (D0-D13) untouched; no law document edited in D14
```

## 9. Pass gate

```text
D14 closes when: the Factory re-run reproduces the reviewed classification (or its differences are recorded), the
epoch validates, Q17 names what moved and which claims may be stale, and the observed ASCII compares P1-P4.
External uncertainty crosses the gate as [UNK] (published renderings), [ERR] (fragment drift) and MATURITY rows.
```

## 10. Structural check

```text
inputs supplied        graph AUTHORITY nodes with pins; network; registry; review decisions                    PASS
outputs consumed       reopen evidence -> builder -> epoch -> Q17 -> D15-D18; observed ASCII -> gate           PASS
contracts match        epoch declares its class/edges before use; merge add-only; validate generic + revision
                       checks; register render deterministic                                                  PASS
forbidden bypasses     no law edit; no D11/D12 node edit; the probe decides no semantics                      PASS
illegal cycles         none (F2 evidence -> F3 epoch -> F4 queries)                                           PASS
invariants represented I1-I5 -> revision fields, merge-check, review file, delta must_not_change              PASS
tests/evidence         F1 syntax + regression, F2 gate, F3 validate/merge/render, F4 queries                  PASS
```

STRUCTURAL CHECK: PASS
