# D14 - Intended Technical Reference Rescan ASCII (retrieval route + reference ingress)

STATUS: MATERIALIZATION D14 - INTENDED SYSTEM (ASCII WORKING SURFACE, ROUTED ONLY AFTER STRUCTURAL CHECK: PASS)
MERGE ANNOTATION (PR #5 x PR #6): the paths factory/deltas/D14.json, factory/fixtures/D14/, evidence/D14/ and design/environment-map/epochs/D14.json named below were relocated under D14-TECHNICAL-REFERENCE-RESCAN / D14-RESCAN by design/materialization/D14-MERGE-RECONCILIATION.md; the text is preserved as written.
DATE: 2026-09-24
CANONICAL BASE: 6778133c35a96d5e356df283aa1676ee428766bb (D14-PROMPT-INTAKE on main 4d8a4c0 = PR #4 = D13-REPO-HYGIENE),
branch claude/d9-rust-cargo-proof-4nys6s.
PROMPT: design/materialization/D14-REFERENCE-RESCAN-PROMPT.md ("Solve the retrieval problem and get all the relevant
sources to the factor ingested.").  ENTRY: design/materialization/D13-PRE-RESCAN-BASELINE.md section 4.
LAW: FACTORY-LAW.md, FACTORY-CONTRACTS.md, REFERENCE-AUTHORITY.md citation law, PASS1.md (snapshots are historical unless
explicitly pinned for reproducibility), docs/HANDOFF.md sections 4-6, design/environment-map/SCHEMA.md.

## 0. Observation before drawing (scratch probes; no repository change)

```text
[OBS] main 4d8a4c0 (PR #4) carries D9-D13; docs/HANDOFF.md names D14 TECHNICAL REFERENCE RESCAN as next; D13-PRE-RESCAN-
      BASELINE D-R1..D-R5 are the open class-D rows; 64 AUTHORITY nodes, reopen_status DENIED 49 / OPENED 15;
      REFERENCE-AUTHORITY.md cites 99 links on 21 hosts.  The earlier reference warehouse (references/acquired/*,
      Termux corpus) was retired by the owner in a8eda17 ("stale-snapshot-as-authority framing retired"); PASS1.md keeps
      "optional reproducibility pin" as the lawful form of a copy.
[RUN] egress probe (curl -I through the session proxy): 23 published hosts answer "CONNECT tunnel failed, response 403"
      (doc.rust-lang.org, webassembly.github.io, gpuweb.github.io, w3c.github.io, html/dom/infra/fetch/streams/storage/fs/
      compression/webidl/serial .spec.whatwg.org, tc39.es, git-scm.com, www.w3.org, source.chromium.org,
      chromium.googlesource.com, immersive-web.github.io, wicg.github.io, webbluetoothcg.github.io,
      webmachinelearning.github.io); raw.githack.com denied; codeload.github.com 403; github.com HTTPS pages 403
      (session scoping); raw.githubusercontent.com 200; static.rust-lang.org 200.  /root/.ccr/README.md: a 403 is the
      organization's egress policy - report the host, do not route around it.  raw.githubusercontent.com and the git
      smart-HTTP proxy ARE the policy's allowed hosts; nothing below tunnels or disguises traffic.
[RUN] retrieval route found: every denied rendering that a publisher serves through GitHub Pages is the content of that
      repository's gh-pages branch.  `git ls-remote` through the session git proxy resolves the branch head with exact
      commit identity (WebAssembly/spec gh-pages dcb71aa4 = "deploy: ba9fd9f5", gpuweb/gpuweb 399a86cf, tc39/ecma262
      181d3068, w3c/ServiceWorker 65c0b6f0, ... 30 repositories); a blobless partial fetch lists the tree and blob ids;
      raw.githubusercontent.com/<owner>/<repo>/<commit>/<path> returns the file immutably.  Verified: the js-api
      index.html fetched by commit has git blob id a7e59502..., identical to `git ls-tree` on the branch.
[RUN] fragment audit is feasible on the copies: every gpuweb fragment cited by the map (#dom-gpu-requestadapter, ...) is
      an id in the gh-pages rendering; js-api has NO id "internal-storage" (ids: webassembly-storage, store) - D-R1 is
      confirmed at the published rendering, not only in the pinned source.
[OBS] no Pages branch exists for WHATWG standards (deployed by their own build), doc.rust-lang.org (mdBook/CI), git-scm.com,
      W3C TR snapshots, Chromium code search: those stay source-pinned (NO_ROUTE for the rendering).
[OBS] tests/envmap/authority-fetch.mjs (D11) already fetches pinned files by commit and compares sha256; it stores no
      text.  D14 extends the same primitives (curl, git, node, no dependencies) into an ingress that STORES the copies,
      resolves branch heads at ingest, verifies by refetch, audits fragments and emits the epoch.
[RUN] dry run in a scratch clone of main: 83 files (39 published renderings, 44 sources) = 51,096,208 bytes at the branch
      heads of 2026-09-24; verify PASS (83 checks); refetch-by-commit PASS (166 checks); 63 D11/D12 pins re-checked:
      56 GitHub pins PIN_MATCH, 7 project-law pins internal, 0 mismatch, 5 tips moved with identical bytes (Chromium,
      V8); link audit: 36 VERIFIED_IN_PUBLISHED_RENDERING, 5 PRESENT_IN_SOURCE, 3 DERIVED_FROM_DFN_UNVERIFIED, 45
      NO_FRAGMENT_CITED, 9 ABSENT_IN_PUBLISHED_RENDERING [ERR], 1 NO_ROUTE [UNK]; graph authorities: 17 verified, 5
      present, 2 derived-heading, 1 derived-dfn, 29 no fragment, 2 absent [ERR], 8 not network authorities; epoch
      72 nodes / 315 edges merged into a 374-node / 956-edge graph that validates (24 checks).
[ERR] nine REFERENCE-AUTHORITY.md fragments are not ids in the current published renderings (each has a near neighbour):
      js-api #internal-storage (-> #webassembly-storage), web-api #streaming-module-compilation-and-instantiation
      (-> #streaming-modules), IndexedDB #database-concept (-> #database), ServiceWorker #fetch-event (-> #fetchevent),
      sensors #extending-the-permission-api / #extending-the-permissions-policy-api (-> #permission-api /
      #permissions-policy-api), deviceorientation #permissions (-> #permissions-integration), ambient-light
      #ambientlightsensor-interface (-> #ambient-light-sensor-interface), webxr #navigator-xr (-> #navigator-xr-attribute).
      Law text is not corrected by D14: insertion-only S-ANNOTATE lines record the finding; the replacement of a fragment
      is an owner law delta.
```

## 1. Intended system

```text
╔══════════════════════════════════════════════════════════════════════════════════════════╗
║          D14 · TECHNICAL REFERENCE RESCAN  (retrieval route + reference ingress)          ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝

   REFERENCE-AUTHORITY.md (99 links)      design/environment-map/graph.json (64 AUTHORITY)     [OBS]
                    \                                   /
                     v                                 v
              fixtures/reference/ROUTES.json  (the retrieval solution as DATA)                [NEW]
              repos -> {published_ref gh-pages | NO_ROUTE, source_ref}; files[83]; url_map[63]
                                    |
                                    v
              tests/reference/ingress.mjs  (node ESM, no deps; curl + git only)               [NEW]
   +-----------------+-----------------+------------------+-----------------+---------------+
   | plan-check      | probe-hosts     | fetch            | verify[--refetch]| audit        |
   | every link and  | CONNECT 403 per | ls-remote heads, | sha256/blob ==   | url -> copy; |
   | authority URL   | published host; | raw by commit,   | register; refetch| fragment id  |
   | has a route or  | route hosts     | sha256, blob id, | by commit is     | present /    |
   | explicit NO_ROUTE| allowed        | D11 pins re-check| byte-identical   | absent [ERR] |
   +-----------------+-----------------+------------------+-----------------+---------------+
                                    |
                                    v
              fixtures/reference/{REGISTER.json, published/<host>/…, sources/<owner>/<repo>/…}  [NEW]
              REPRODUCIBILITY PINS (commit + blob + sha256 + time), never current authority (README.md)
                                    |
            +-----------------------+------------------------+
            v                                                v
   evidence/D14/{ingress,audit}   [NEW]              S-ANNOTATE insertion-only lines   [NEW]
   hosts / register / verify /                      "D14 ANNOTATION (fragment #…)" under each drifted
   refetch / link-audit / fragments                 citation in the 5 law files (0 deleted lines)
            |
            v
   design/environment-map/epochs/D14.json  (ingress.mjs epoch; envmap bind/merge/render)        [NEW]
   ENV-D14-HOST-NETWORK (egress policy per host)  PROBE-D14-REFERENCE-INGRESS  IMPL-D14-{INGRESS,CORPUS}
   CON-EM-D14-001 (PROPOSED: copies are pins)     FACT-D14-{PUBLISHED-HOSTS-DENIED, PAGES-BRANCH-ROUTE,
   CORPUS-INGESTED, CORPUS-REPRODUCIBLE, D11-PINS-RECHECKED, MAP-LINKS-AUDITED}  FACT-D14-REOPEN-<auth> x56
   EV-D14-{HOSTS,REGISTER,REFETCH,LINK-AUDIT,FRAGMENTS} (PENDING -> bound)
            |
            v
   D14-OBSERVED-REFERENCE-RESCAN.md + LEDGER + docs/HANDOFF.md sections 1 and 6                [NEW]
```

### 1.1 Proof obligations (T14-*)

```text
T14-R1 RETRIEVAL   published hosts DENIED is recorded per host (evidence, not failure); the route uses only hosts the
                   policy allows; every copy carries the branch head commit from git ls-remote and is refetchable by
                   that commit byte-identically                                            (probe-hosts, fetch, verify --refetch)
T14-R2 COVERAGE    every REFERENCE-AUTHORITY.md link and every network AUTHORITY URL resolves to a copy or an explicit
                   NO_ROUTE entry; nothing is silently skipped                                              (plan-check)
T14-R3 IDENTITY    REGISTER.json == corpus (sha256, bytes, git blob id) offline                            (verify)
T14-R4 PINS        every D11/D12 GitHub pin re-fetched at its pinned commit matches its recorded sha256; drift of the
                   branch head since the pin is stated per authority                                            (fetch)
T14-R5 FRAGMENTS   every cited fragment is checked in the published copy (id present/absent with nearest ids) or in
                   the source copy (present / derived / not found); NO_FRAGMENT_CITED and NO_ROUTE are named          (audit)
T14-R6 LAW         drifted citations get insertion-only D14 ANNOTATION lines; no law line is deleted or edited;
                   FACTORY-LAW.md untouched; handoff-check and status-scan still PASS                     (S-ANNOTATE, F3)
T14-R7 GRAPH       epoch D14 adds nodes/edges only; D11-D13 nodes unchanged (merge-check); validate PASS; every
                   PENDING evidence bound to a committed file's sha256; render-check PASS                        (F4)
T14-R8 HANDOFF     docs/HANDOFF.md sections 1 and 6 state the new position (D-R1/D-R2/D-R5 resolved or narrowed;
                   nine drifted citations as an OWNER law item); status-scan 0 unclassified                       (F4, F5)
```

### 1.2 Mutation plan by station (all stations from the canonical registry; no new station)

```text
FIXTURE      STATION       MAY CHANGE (narrowed)                                         PRODUCES / VERIFIES
F0-doc       S-DOC         design/materialization/D14-INTENDED-REFERENCE-RESCAN.md,       this ASCII, ledger (intake AFTER,
                           LEDGER.md, factory/deltas/D14.json, factory/fixtures/D14/,     D14 BEFORE), delta + fixtures
                           factory/receipts/D14-TECHNICAL-REFERENCE-RESCAN/
F1-fixture   S-FIXTURE     tests/reference/, fixtures/reference/, receipts               ingress.mjs, run-ingress-checks.sh,
                                                                                        ROUTES.json, README.md, REGISTER.json,
                                                                                        published/, sources/ (fetched in the
                                                                                        stage, copied in); close: syntax,
                                                                                        plan-check, offline verify PASS,
                                                                                        register totals, identity probes
F2-build     S-BUILD       evidence/D14/                                                 run-ingress-checks.sh evidence/D14
                           (source-nonmutating)                                          (hosts, register copy, verify,
                                                                                        refetch, audit); envmap validate
                                                                                        of the pre-merge graph
F3-annotate  S-ANNOTATE    REFERENCE-AUTHORITY.md, CONSTRAINT-LEDGER.md, CONFLICT-        ingress.mjs annotate (insertion-only;
                           LEDGER.md, IMPLEMENTATION-CONTRACTS.md, EVIDENCE-OBLIGATIONS.md,  numstat deleted == 0; D13 lines
                           receipts                                                      kept; FACTORY-LAW.md untouched)
F4-doc       S-DOC         design/environment-map/, design/materialization/D14-OBSERVED-  epoch D14.json (generated + bound),
                           REFERENCE-RESCAN.md, docs/HANDOFF.md, receipts                graph merge + render, observed ASCII,
                                                                                        HANDOFF 1 + 6; validate, merge-check,
                                                                                        render-check, handoff-check, status-scan
F5-evidence  S-EVIDENCE    evidence/D14/                                                 hygiene + envmap evidence, workpiece
                                                                                        audit / retire / audit, index.json

SEQUENCE  delta check -> W16 (worktree @ 6778133) -> F0 -> F1 -> F2 -> F3 -> F4 -> F5 -> verify -> integrate (ff-only)
          -> reinspect (validate, merge-check, plan-check, offline verify, handoff-check, status-scan) -> observed ASCII
```

### 1.3 Ownership, inputs, outputs

```text
INPUT                                     OWNER                CONSUMER
REFERENCE-AUTHORITY.md links (99)         law (read-only)      plan-check, audit
graph.json AUTHORITY nodes (64) + pins    D11-D13 (read-only)  fetch (pin re-check), audit, epoch
publisher repositories (46) via git proxy external            ls-remote heads; raw by commit
session egress policy                     environment          probe-hosts (recorded per host)
OUTPUT                                    TERMINAL ROLE
fixtures/reference/**                     reproducibility pins for later deltas' claims; re-checkable offline
evidence/D14/**                           bound into epoch D14; indexed
epochs/D14.json + graph.json + views      environment graph (Q01-Q16); the reopen facts per authority
law annotations                           the finding beside the citation; OWNER decides the law delta
D14-OBSERVED + HANDOFF                    human/AI interaction layer
```

### 1.4 Invariants

```text
I1  law text never deleted or edited: S-ANNOTATE insertion-only (numstat deleted == 0); FACTORY-LAW.md untouched
I2  a copy is a pin, never the current authority; a Pages-branch copy is never claimed observed at the host
I3  only policy-allowed hosts are used (raw.githubusercontent.com, git smart-HTTP proxy); denials are recorded as evidence
I4  every copy: repository, branch, head commit at ingest, path, bytes, sha256, git blob id, fetch time
I5  D11-D13 graph nodes never edited (epochs add only); D11 pins re-checked, never rewritten
I6  no third-party dependency (curl, git, node); no toolchain change (identity probes only)
I7  compiler/, host/, factory/src/, factory/registry/, factory/tests/, Cargo.*, rust-toolchain.toml, D0-D13 records,
    fixtures/{language,compiler,commissioning,toolchain}, tests/{bootstrap,commissioning,language,toolchain,envmap,
    selfhost,hygiene} byte-identical
I8  system-under-test findings (drifted citations, NO_ROUTE hosts) are evidence verdicts, never station failures
I9  the fixture tree is written only by S-FIXTURE (copies from the stage); S-BUILD writes evidence/D14 only
I10 exactly one ledger entry carries "recorded by the next delta"
```

### 1.5 Classification of what D14 touches (classes as in D13: A internal defect / B historical / C capability / D authority / OWNER)

```text
D-R1  js-api #internal-storage           D -> resolved as OBSERVED DRIFT at the published rendering (gh-pages@dcb71aa4);
                                          citation stays [ERR]; OWNER law delta to replace the fragment
D-R2  49 DENIED authorities              D -> 56 network authorities reopened: PAGES_BRANCH copies for the GitHub-Pages
                                          publishers; SOURCE_ONLY for WHATWG/Rust/git/Chromium (rendering NO_ROUTE [UNK])
D-R3  source-line citations (D12)        D -> unchanged (fragment NO_FRAGMENT_CITED; documents now copied); stays D
D-R4  ledger rows, coarse citations      D -> unchanged; the nine drifted map links are a NEW OWNER item
D-R5  hosts denied                       D -> hosts still denied (recorded per host); route established under the policy
NEW   nine drifted REFERENCE-AUTHORITY.md fragments (+ their copies in contract/evidence law files)   OWNER (law delta)
NEW   www.w3.org TR snapshot of WebCodecs                                                             D NO_ROUTE [UNK]
NEW   Pages-branch == host serving (unverifiable while denied)                                        D [UNK]
NEW   repository growth: ~51 MB of copies (git-compressed far smaller)                                OWNER (accepted here
                                                                                                        as fixture data)
```

## 2. Predictions (to be compared in D14-OBSERVED)

```text
T14-R1 hosts: 23 published hosts DENIED; raw.githubusercontent.com HTTP 200; git ls-remote OK; github.com page 403;
              codeload 403; raw.githack DENIED
T14-R2 plan-check PASS (99 links + 56 network authorities; 83 files; 63 url rules)
T14-R3 verify PASS 83 checks; refetch PASS 166 checks (branch heads may have moved since the dry run: the numbers
       stay, the commits/bytes are whatever the ingest records)
T14-R4 63 pins re-checked: 56 PIN_MATCH, 7 PROJECT_LAW, 0 mismatch; content changed since pin: 0 (5 tips moved, bytes equal)
T14-R5 links 99: 36 verified / 5 present / 3 derived / 45 no-fragment / 9 absent [ERR] / 1 no-route [UNK];
       authorities 64: 17 verified / 5 present / 3 derived / 29 no-fragment / 2 absent [ERR] / 8 not network;
       reopen facts: 51 RUN, 3 OBS, 2 ERR
T14-R6 annotations: REFERENCE-AUTHORITY.md 9 lines, CONSTRAINT-LEDGER 1, CONFLICT-LEDGER 1, IMPLEMENTATION-CONTRACTS 4,
       EVIDENCE-OBLIGATIONS 6; deleted 0 everywhere; handoff-check PASS; DP-06 still 5
T14-R7 epoch 72 nodes / 315 edges; graph 374 nodes / 956 edges; validate 24 PASS; merge-check PASS; render-check PASS
T14-R8 HANDOFF sections 1 + 6 updated; status-scan 0 unclassified, defect patterns within bounds
```

## 3. Structural check

```text
required inputs supplied ............ base 6778133; stations S-DOC/S-FIXTURE(v2)/S-BUILD/S-ANNOTATE/S-EVIDENCE registered
                                      in the canonical base; judge built from main 4d8a4c0 (factory/src unchanged since);
                                      curl, git 2.43, node 22, rustc 1.94.1 + nightly-2026-09-24 (identity probes) ...... PASS
outputs have consumers .............. copies -> audit/epoch/later deltas; evidence -> epoch (bound) + index; annotations ->
                                      owner law delta; observed + HANDOFF -> next delta ..................................... PASS
types/contracts match ............... fixtures narrow within station MAY CHANGE (S-FIXTURE: fixtures/, tests/; S-BUILD/
                                      S-EVIDENCE: evidence/; S-ANNOTATE: the 5 law files; S-DOC: design/, docs/) and within
                                      the delta; literal surfaces only ....................................................... PASS
forbidden bypasses absent ........... no AGENT -> REPO write; no law edit beyond insertion; no denied host tunnelled; no
                                      third-party crate; no toolchain change; no D0-D13 rewrite ........................... PASS
illegal cycles absent ............... routes -> copies -> evidence -> epoch -> graph; nothing feeds ROUTES.json back .......... PASS
invariants represented .............. I1-I10 map to delta must_not_change, fixture checks, verify, reinspect ................ PASS
tests/evidence obligations attached . T14-R1..R8 with their fixtures; evidence paths named in the delta contract ............ PASS
station gaps ........................ none: ingress is a fixture forge (reproducibility copies) + build evidence; S-ANNOTATE
                                      exists since D13 ................................................................ PASS

STRUCTURAL CHECK: PASS  -> route StructuralDelta D14-TECHNICAL-REFERENCE-RESCAN
```
