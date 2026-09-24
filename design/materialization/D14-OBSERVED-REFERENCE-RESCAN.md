# D14 - Observed Technical Reference Rescan vs Intended

STATUS: RE-OBSERVATION OF THE D14 WORKPIECE (W16 on canonical base 6778133c35a96d5e356df283aa1676ee428766bb)
LAW: this file compares design/materialization/D14-INTENDED-REFERENCE-RESCAN.md with what the ingress recorded under
evidence/D14/, fixtures/reference/ and design/environment-map/epochs/D14.json.  The intended drawing is NOT rewritten;
every difference is preserved as [ERR]/[GAP]/[UNK].  NO LAW TEXT EDITED: the five law files received insertion-only
D14 ANNOTATION lines (0 deleted lines each); the replacement of a drifted fragment is an owner law delta.

## 1. Observed system

```text
   REFERENCE-AUTHORITY.md 99 links / graph 64 AUTHORITY  ->  ROUTES.json 46 repos, 83 files, 63 url rules      [RUN]
                                    |
              tests/reference/ingress.mjs  plan-check PASS | probe-hosts 23 DENIED, route AVAILABLE | fetch 83/83 |
              verify PASS 83 | refetch PASS 166 | audit 99 links + 64 authorities                                [RUN]
                                    |
              fixtures/reference: 39 published renderings (36,563,871 bytes, 29 Pages-branch heads) + 44 sources
              (14,532,337 bytes); REGISTER.json sha256 68392b28e07f...; every copy: repo, branch, head commit, path,
              bytes, sha256, git blob id, fetch time                                                             [RUN]
                                    |
            +-----------------------+------------------------+
            v                                                v
   evidence/D14/{ingress,audit}  hosts / register / verify /   S-ANNOTATE: 21 insertion-only lines (9+1+1+4+6), 0 deleted [RUN]
   refetch / link-audit / fragments / audit.txt        [RUN]
            |
            v
   epochs/D14.json 72 nodes / 315 edges, 5 evidence nodes bound; graph D11->D12->D13->D14 = 374 nodes / 956 edges;
   validate PASS (24 checks); merge-check PASS; render-check PASS                                                [RUN]
```

## 2. Obligations: predicted vs observed

```text
T14-R1 RETRIEVAL   PASS [RUN]  23 published hosts DENIED (CONNECT 403): chromium.googlesource.com, compression/dom/fetch/fs/
                               html/infra/serial/storage/streams/webidl .spec.whatwg.org, doc.rust-lang.org, git-scm.com,
                               gpuweb.github.io, immersive-web.github.io, source.chromium.org, tc39.es, w3c.github.io,
                               webassembly.github.io, webbluetoothcg.github.io, webmachinelearning.github.io,
                               wicg.github.io, www.w3.org; raw.githack.com DENIED; codeload 403; github.com page 403
                               (session scoping); raw.githubusercontent.com 200; git ls-remote OK.  Route: publishers'
                               gh-pages branches by head commit + raw fetch by commit.  refetch-by-commit PASS (166 checks)
T14-R2 COVERAGE    PASS [RUN]  plan-check: every map link and network authority URL resolves (78 links PAGES_BRANCH, 20
                               NO_ROUTE, 1 RAW_ALLOWED); authorities: 30 PAGES_BRANCH, 23 NO_ROUTE, 2 raw-allowed GitHub
                               pages, 1 raw, 1 LOCAL, 7 PROJECT_LAW
T14-R3 IDENTITY    PASS [RUN]  verify: 83 checks, 0 failed (sha256, bytes, git blob id == register)
T14-R4 PINS        PASS [RUN]  63 pins re-checked: 56 GitHub PIN_MATCH, 7 project-law internal, 0 mismatch; 5 tips moved
                               (chromium/chromium 5c5d5f1b, v8/v8 72302c22) with byte-identical files; 0 changed since pin
T14-R5 FRAGMENTS   [RUN]/[ERR] links 99: 36 VERIFIED_IN_PUBLISHED_RENDERING, 5 PRESENT_IN_SOURCE, 3 DERIVED_FROM_DFN_
                               UNVERIFIED (storage.spec #dom-storagemanager-persist/-estimate, fs.spec #dom-storagemanager-
                               getdirectory: Bikeshed dfn found, id not observed), 45 NO_FRAGMENT_CITED, 9 ABSENT [ERR],
                               1 NO_ROUTE [UNK] (www.w3.org/TR/2026/WD-webcodecs-20260921/).
                               authorities 64: 17 verified, 5 present, 2 DERIVED_FROM_HEADING (git-worktree #_description,
                               gitrepository-layout #_worktrees: setext titles), 1 DERIVED_FROM_DFN (html #dom-
                               crossoriginisolated via data-x), 29 no fragment, 2 ABSENT [ERR], 8 not network.
                               reopen facts: 51 RUN, 3 OBS, 2 ERR.  Predictions matched exactly.
T14-R6 LAW         PASS [RUN]  REFERENCE-AUTHORITY.md +9, CONSTRAINT-LEDGER +1, CONFLICT-LEDGER +1, IMPLEMENTATION-
                               CONTRACTS +4, EVIDENCE-OBLIGATIONS +6 lines; numstat deleted 0; D13 lines kept in place;
                               annotate idempotent; FACTORY-LAW.md untouched; handoff-check PASS
T14-R7 GRAPH       PASS [RUN]  epoch 72 nodes (1 ENV, 2 IMPL, 1 CONSTRAINT PROPOSED, 1 PROBE, 5 EVIDENCE, 62 FACT) / 315
                               edges; no PENDING after bind; graph 374 / 956; validate 24 PASS; merge-check PASS
                               (D11-D13 nodes and edges kept); render-check PASS
T14-R8 HANDOFF     PASS [RUN]  docs/HANDOFF.md sections 1, 5, 6 updated (this delta, corpus in the live record, D rows);
                               status-scan 0 unclassified, defect patterns within bounds (F4/F5 logs)
```

Summary facts of the epoch (all in design/environment-map/epochs/D14.json): FACT-D14-PUBLISHED-HOSTS-DENIED [RUN],
FACT-D14-PAGES-BRANCH-ROUTE [RUN], FACT-D14-CORPUS-INGESTED [RUN], FACT-D14-CORPUS-REPRODUCIBLE [RUN],
FACT-D14-D11-PINS-RECHECKED [RUN], FACT-D14-MAP-LINKS-AUDITED [ERR] (nine drifted fragments), plus 56
FACT-D14-REOPEN-<authority> facts (51 [RUN], 3 [OBS], 2 [ERR]); CON-EM-D14-001 PROPOSED (copies are pins).

## 3. Drifted citations (the rescan's findings; law text preserved, annotated in place)

```text
CITED FRAGMENT (REFERENCE-AUTHORITY.md and copies in the contract/evidence law files)      NEAREST IDS IN THE CURRENT RENDERING
https://webassembly.github.io/spec/js-api/#internal-storage                                 #webassembly-storage, #store
https://webassembly.github.io/spec/web-api/#streaming-module-compilation-and-instantiation  #streaming-modules
https://w3c.github.io/IndexedDB/#database-concept                                           #database
https://w3c.github.io/ServiceWorker/#fetch-event                                            #fetchevent (interface), #fetch-event-request
https://w3c.github.io/sensors/#extending-the-permission-api                                 #permission-api
https://w3c.github.io/sensors/#extending-the-permissions-policy-api                         #permissions-policy-api
https://w3c.github.io/deviceorientation/#permissions                                        #permissions-integration
https://w3c.github.io/ambient-light/#ambientlightsensor-interface                           #ambient-light-sensor-interface
https://immersive-web.github.io/webxr/#navigator-xr                                         #navigator-xr-attribute, #dom-navigator-xr
Each rendering was taken from the publisher's gh-pages branch at the head commit in REGISTER.json; the published host
itself remains DENIED, so "current rendering" means "the Pages branch content at that commit" [UNK at the host].
```

## 4. Differences preserved (intended vs observed) and what returns to ASCII

```text
[ERR]  nine cited fragments are not ids in the current renderings (section 3).  OWNER: a law delta replacing the
       fragments (the annotations name the nearest ids); until then every such citation is NOT asserted current.
[UNK]  Pages branch == what the host serves: unverifiable while the hosts are denied (probe recorded per host).
[UNK]  www.w3.org/TR/2026/WD-webcodecs-20260921/ (dated TR snapshot): no branch holds it; NO_ROUTE.
[UNK]  20 map links / 23 authorities on hosts without a Pages branch (WHATWG, doc.rust-lang.org, git-scm.com,
       Chromium code search): rendering never observed; source copies pinned; fragments checked in source
       (PRESENT / DERIVED), never in the rendering.
[OBS]  6 derived fragments (3 Bikeshed dfn ids, 2 asciidoc setext titles, 1 Wattsi data-x) stay OBS: the generator
       would produce the id, no rendering observed.
[GAP]  the copies are ~51 MB of fixture data (git-compressed far smaller); the route table must be re-ingested by a
       new delta when heads move (the register is the only place the commits live).
[OBS]  CON-EM-D14-001 (copies are pins, never current authority) is PROPOSED; adoption into law is an owner decision.
[OBS]  the AUTHORIZES edges from each AUTHORITY to its FACT-D14-REOPEN-* fact carry a note; if the owner prefers a
       dedicated edge type for reopen observations, that is a SCHEMA change (design/environment-map/SCHEMA.md).
```

## 5. HISTORICAL CLAIM AUDIT

```text
CLAIM (where)                                                       STATUS         QUALIFIED BY
"published authority hosts denied; clauses from source pins only"   VALID, NARROWED hosts still denied (23); for 30 authorities and 78 map links the
  (D11 FACT-AUTHORITY-REOPEN-DENIED, D12, D13 D-R2/D-R5)                            rendering now exists as a Pages-branch copy [not observed at host]
"js-api #internal-storage drifted in pinned source" (D11, D13 D-R1) CONFIRMED      absent in the gh-pages rendering @dcb71aa493d7; section id #webassembly-storage
D11 reproducibility pins (47 verified in D11; 56 GitHub pins now)   VALID          all 56 re-fetched at their commits match; 5 branch tips moved, bytes unchanged
REFERENCE-AUTHORITY.md "hyperlink-first" map (99 links)             9 OVERSTATED   nine fragments no longer exist in the renderings (section 3); the other 90
                                                                                   resolve to a copy (36 verified ids, 5 in source, 3 derived, 45 roots, 1 no route)
"retired reference warehouse" (a8eda17, PASS1)                      RESPECTED      D14 stores pins with recorded identity under fixtures/reference, not authority;
                                                                                   the retired framing (snapshot-as-authority) is not reintroduced
```

## 6. Match / differ

```text
intended section 2 predictions vs observed: MATCH on every obligation (hosts, files, pins, link and authority tallies,
annotation counts, epoch and graph sizes, check verdicts).
intended vs observed STRUCTURE: MATCH (no new station; no law edit; no production change; no toolchain change).
open: 1 [ERR] class (nine drifted citations -> OWNER law delta), 3 [UNK], 1 [GAP], 2 [OBS] -> returned to ASCII.
```
