# D14 - Observed Frontier Reopen vs Intended

STATUS: RE-OBSERVATION OF THE D14 WORKPIECE (W16 on canonical base 5e57467bd7c984529dc466201629b37e0ee44c4b)
LAW: compares D14-INTENDED-FRONTIER-REOPEN.md (sections 3, 5, 7) with the Factory run (factory/receipts/
D14-FRONTIER-REOPEN/, evidence/D14/).  The intended drawing is not rewritten.

## 1. Station run

```text
F0-doc       S-DOC       PASS   intended ASCII + ledger (intake AFTER, D14 BEFORE); nothing else changed
F1-fixture   S-FIXTURE   PASS   reopen probe, revision builder, gate, review file, envmap (epoch-declared classes,
                                Q17, revision rendering); tools name no authority; the D13 graph still validates,
                                renders and merges byte-identically
F2-build     S-BUILD     PASS   reopen probe re-run by the Factory (64 records) + GATE PASS (every movement
                                classified by tests/reference/d14-review.json; every pin verified)
F3-doc       S-DOC       PASS   epochs/D14.json built from the Factory evidence; graph merged; views rendered
F4-evidence  S-EVIDENCE  PASS   validate (27 checks), Q01-Q17, stale, merge-check, render-check; audit -> retire ->
                                audit; evidence index
ROUTE  [OBS] F3 was first refused at station open: its narrowed surface design/environment-map/ was wider than the
       delta's exact file list and overlapped the protected epochs D12/D13 (fixture_may_change_subset_of_delta,
       ..._disjoint_from_delta_must_not_change).  Nothing ran; F3 was narrowed to the exact files and resumed.  The
       D13 literal-authority repair refused the authoring error as designed.
VERIFY [ERR -> repaired] the first `factory verify` FAILED no_unreceipted_change on design/environment-map/SCHEMA.md
       and ENVIRONMENT-MAP.md.  Cause: the route script piped `station open` into grep, which masked the refused F3
       open; the script then copied the two files into the workpiece OUTSIDE any station run (an agent write), and
       stopped only at the close.  Integration refused (no force update).  Repair inside the Factory: both files
       restored to the base bytes, fixture F6-doc (S-DOC, exactly those two files) added to the delta, F6 run, F5
       re-run for this record, verify re-run.  Prospective rule for the procedure: a route script checks the exit
       status of every `station open` before copying anything (docs/HANDOFF.md section 4 already requires the copy to
       happen between a successful open and its close).
F6-doc       S-DOC       PASS   SCHEMA.md section 7 and ENVIRONMENT-MAP.md section 6 written inside a station run
```

## 2. Reopen result (evidence/D14/reopen/summary.json, observed by the Factory)

```text
CURRENT AUTHORITY   53 UNREACHABLE (network policy: chromium.googlesource.com, compression/fs/storage/html
                    .spec.whatwg.org, doc.rust-lang.org, git-scm.com, gpuweb.github.io, source.chromium.org,
                    w3c.github.io, webassembly.github.io), 2 HTTP_403 (github.com blob pages), 1 OPENED (raw
                    README), 1 local, 7 repository law.  Extra hosts: raw.githack.com, rawcdn.githack.com, www.w3.org/TR,
                    api.w3.org UNREACHABLE; github.com/WebAssembly/proposals 403; raw registry README OPENED.
SOURCE FRONTIER     51 TIP == PIN; 10 tip moved with the cited file byte-identical (chromium/chromium, v8/v8, FactTest
                    law); 2 FactTest law files changed (D13 annotations); 1 local file without a pinned sha.
                    63/63 GitHub-pinned sha256 re-verified.  rust-lang/rust: refs/heads/master absent -> main == pin.
FRAGMENTS           16 PRESENT_EXPLICIT, 13 PRESENT_DERIVED (renderer rules), 32 NOT_CITED, 3 ABSENT:
                    #internal-storage, #streaming-module-compilation-and-instantiation, #_worktrees
CLAUSES             62 UNCHANGED, 1 MOVED (E-025 lines shifted by the D13 annotation), 1 no clause key (Playwright)
MATURITY            no declared-status drift; registry f0db14a: Threads Phase 4, Shared-Everything Threads Phase 1,
                    Memory64 finished; W3C TR maturity UNREACHABLE (source Status: ED / w3c/ED; WHATWG Group)
ENVIRONMENT         node v22.22.2, curl 8.5.0, git 2.43.0, kernel 6.18.44-fc-v37, HTTPS proxy (ENV-D14-HOST)
```

## 3. Movement (Q17, evidence/D14/envmap/queries/Q17.json)

```text
UNREACHABLE  55   current published authority unverified in D14 (FACT-PUBLISHED-FRONTIER-UNVERIFIED [UNK])
MOVED         4   AUTH-WASM-JSAPI-STORAGE (#internal-storage -> #webassembly-storage), AUTH-WASM-WEBAPI-STREAMING
                  (#streaming-module-compilation-and-instantiation -> #streaming-modules: NEW, the D11 PRESENT_IN_SOURCE
                  was false certainty [ERR]), AUTH-RUSTC-WASM64-DOC and -TARGET-SPEC (branch master -> main)
AMBIGUOUS     2   AUTH-GIT-REPO-LAYOUT (#_worktrees: no id at source; rendering unknown), AUTH-PLAYWRIGHT-INSTALLED (no
                  pinned sha; current sha256 now recorded)
MATURITY      2   AUTH-WASM-THREADS (Phase 4, not standardized), AUTH-WASM-SET (Phase 1)
EDITORIAL     2   LAW-EVIDENCE-OBLIGATIONS, LAW-FACTORY-CONTRACTS (D13 insertion-only annotations)
SEMANTIC / REMOVED / SPLIT/MERGED   0   no cited clause changed text
facts to recheck in D18 (8): FACT-FF-ONLY-INTEGRATION, FACT-GPU-ADAPTER-SWIFTSHADER, FACT-SHARED-THREADS-UNADMITTED,
  FACT-STREAMING-UNPROBED, FACT-WASM64-ABI-EXEC, FACT-WASM64-ADMITTED-E0, FACT-WASM64-MODULE-I64,
  FACT-WORKPIECE-ISOLATION (citation / identity / maturity rechecks; no claim is refuted by D14)
conflicts OBS-D11-1, ERR-001, ERR-002, ERR-003, D13-PIN: every involved source unchanged -> all persist
```

## 4. Graph and hygiene

```text
graph      epoch D14 139 nodes / 154 edges; merged 441 nodes / 795 edges; validate PASS (27 checks incl. the three
           revision checks); merge-check: 211 D11 nodes identical, 475 D11 edges present, graph == merge(D11..D14);
           render-check PASS; Q16 epochs D11 211 / D12 66 / D13 25 / D14 139 nodes, D14 cross-epoch edges 68
           (REVISES + DEPENDS_ON into the D11/D12 authority set)
hygiene    audit-before RETIRABLE 3 (W14, W15, W15-stage), KEEP 3, CURRENT 2; retire 3/3 REMOVED; audit-after
           RETIRABLE 0, KEEP 3 (W11-stage, W14-stage, factory-bootstrap-bin), CURRENT 2 (W16, W16-stage)
```

## 5. Intended vs observed

```text
P1  MATCH   64 records; published 53 DENIED + 2 x 403; 63 PIN_MATCH; clauses 62 / 1 MOVED / 1 no key; ABSENT set as
            predicted
P2  MATCH   139 / 154 epoch; 441 / 795 merged; validate PASS 27; D11-D13 preserved
P3  MATCH   64 revisions; UNREACHABLE 55, MOVED 4, AMBIGUOUS 2, MATURITY 2, EDITORIAL 2; 8 facts to recheck
P4  DIFFER  predicted W14-stage RETIRABLE; observed KEEP: it holds D13's pre-binding drafts (epochs/D13.json with
            PENDING evidence, graph.json and TRACEABILITY.md before binding), which are not in the integrated tree.
            The retire guard behaved as specified; the prediction was wrong.  W14-stage joins W11-stage as a [GAP]
            KEEP row (B, docs/HANDOFF.md section 6).
ROUTE DIFFER  F3 refused once for an over-wide surface; one unreceipted agent write caught by verify and repaired
            through F6 (section 1).  Both are route defects of this session's scripts, not of the Factory, which
            refused each at the designed check.
STRUCTURE MATCH  no law document, earlier node or D0-D13 artifact edited; current authority and pin kept apart in
                 every revision; proposals recorded as MATURITY observations only
```

GATE: PASS - D14 knows WHAT MOVED (4 locator movements, 2 maturity observations, 2 editorial law changes, no semantic
change) and WHICH claims may be stale (Q17: 8 facts).  External uncertainty crosses the gate explicitly:
[UNK] published frontier (network policy), [ERR] two fragment drifts, [UNK] git dlist anchor, [GAP] workpiece KEEP rows.
No internal chain defect is open.  Next: D15-FOUNDATIONAL-SEMANTICS.
