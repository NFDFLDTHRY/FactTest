# D13 - Observed Repository Hygiene vs Intended

STATUS: RE-OBSERVATION OF THE D13 WORKPIECE (W14 on canonical base 205d337a7efef5fa25bb588ec385fa3655acb562)
LAW: compares design/materialization/D13-INTENDED-REPO-HYGIENE.md (sections 7-9) with what the Factory stations F0-F8
recorded (factory/receipts/D13-REPO-HYGIENE/, evidence/D13/).  The intended drawing is not rewritten.

## 1. Station run

```text
FX           STATION     RESULT  NOTE
F0-doc       S-DOC       PASS    intended ASCII sections 0-12, H-01..H-45, STRUCTURAL CHECK: PASS; ledger updated
F1-rust      S-RUST      PASS    factory tests 17/17 (f00-f08 kept, f09-f16 new); clippy -D warnings and fmt clean;
                                 bare rustc inside the workpiece resolves e408947bf (the pin); compiler/ host/ untouched
F2-fixture   S-FIXTURE   PASS    harnesses parse; sets-check PASS; the D11 graph validates under the extended validator
F3-doc       S-DOC       PASS    graph merge-check / validate / render-check PASS; registry check PASS (all surfaces
                                 literal; S-FIXTURE effective may_change identical at 205d337 and now); the repaired
                                 factory binary accepts the D13 delta (delta_*_surfaces_literal PASS)
F4-annotate  S-ANNOTATE  PASS    10 root documents, 0 deleted lines each; FACTORY-LAW.md untouched
F5-build     S-BUILD     PASS    qualified proof (section 2)
F6-evidence  S-EVIDENCE  PASS    status scan, handoff check, paths-probe, audit -> retire -> audit (sections 3-5)
F7-doc       S-DOC       PASS    8 D13 evidence nodes bound (no PENDING left); graph re-merged and re-rendered
F8-evidence  S-EVIDENCE  PASS    envmap validate / Q01-Q16 / stale / render-check / merge-check; evidence index
ROUTE        [OBS] the first attempt of F5 stopped at station open (fixture_may_change_subset_of_station: the S-BUILD
             and S-EVIDENCE fixtures had been generated with the receipts directory in their narrowed surface, which
             S-BUILD/S-EVIDENCE may not change).  Nothing ran and no state changed; F5, F6 and F8 were corrected to
             log under evidence/D13/logs/ and the route resumed.  The Factory refused the malformed fixture as
             designed.  [OBS] the workpiece-local `delta check` printed FAIL before F3 because S-ANNOTATE entered the
             workpiece registry only at F3 (the stage copy passed at workpiece create); after F3 it printed PASS.
```

## 2. Qualified proof on pinned toolchains (evidence/D13/proof/summary.json)

```text
ID                                        SET                 TARGET / PROFILE                 VERDICT
T13-PIN-01-toolchain-pins                 (both)              -                                PASS  1.94.1 e408947bf via
                                                                                                     rust-toolchain.toml;
                                                                                                     nightly-2026-09-24
                                                                                                     6eeff9a52 via
                                                                                                     proof-sets.json
T9-P7-01-toolchain-identity               -                   -                                PASS  repository pins its
                                                                                                     toolchain (D9 record
                                                                                                     shape; was GAP in D9)
T13-SETS-01-roots-partition               HOST + WASM64       -                                PASS  14 = 13 + 1, disjoint,
                                                                                                     31 manifests accounted
Q-HOST-01-build-dev                       HOST_NATIVE_SET     host / dev                       PASS  13 packages == set
Q-HOST-02-build-release                   HOST_NATIVE_SET     host / release                   PASS
Q-HOST-03-test-dev                        HOST_NATIVE_SET     host / dev                       PASS  103 tests passed
Q-HOST-04-test-release                    HOST_NATIVE_SET     host / release                   PASS
Q-HOST-05-clippy-all-targets              HOST_NATIVE_SET     host / dev                       PASS
Q-HOST-06-std-in-kernel                   HOST_NATIVE_SET     host / dev                       PASS  rejected for the reason
Q-HOST-07-id-substitution                 HOST_NATIVE_SET     host / dev                       PASS  rejected for the reason
Q-HOST-08-forge-verified-strategy         HOST_NATIVE_SET     host / dev                       PASS  rejected for the reason
Q-ALL-01-fmt-check                        ALL_SOURCES         none (rustfmt)                   PASS
Q-ALL-02-resolved-graph-first-party       ALL_MEMBERS_GRAPH   none (cargo metadata)            PASS
Q-ALL-03-third-party-dep-fixture-rejected ALL_MEMBERS_GRAPH   none (cargo metadata)            PASS  rejected as required
Q-WASM-01-clippy-core-graph               WASM64_KERNEL_SET   wasm64-unknown-unknown / dev     PASS  12 crates == graph
Q-WASM-02-core-only-graph-dev             WASM64_KERNEL_SET   wasm64-unknown-unknown / dev     PASS  core only
Q-WASM-03-core-only-graph-release         WASM64_KERNEL_SET   wasm64-unknown-unknown / release PASS  core only
Q-WASM-04-inspect-release                 WASM64_KERNEL_SET   wasm64-unknown-unknown / release PASS  I64 min 311
Q-WASM-05-inspect-dev                     WASM64_KERNEL_SET   wasm64-unknown-unknown / dev     PASS  I64 min 312
Q-WASM-06-kernel-identity                 WASM64_KERNEL_SET   wasm64-unknown-unknown / release PASS  6f25ce43... (3,350,254 B)
                                                                                                     == declared for install
                                                                                                     nightly-2026-09-24-...
Q-WASM-07-chromium-abi-release            WASM64_KERNEL_SET   wasm64-unknown-unknown / release PASS  Chromium 141, abi 1,
                                                                                                     imports [], 13 exports
X-01-build-workspace-host                 CROSS_SET           host / dev                       OBS   exit 101: factc-wasm-abi
                                                                                                     has no host
                                                                                                     panic_handler (weight
                                                                                                     NONE; no fake success)
X-02-clippy-workspace-host                CROSS_SET           host / dev                       OBS   exit 101, same reason
X-03-test-workspace-host                  CROSS_SET           host / dev                       OBS   exit 0 (test harness
                                                                                                     supplies std; weight
                                                                                                     NONE)
Z-01-nostd-textual-scan                   HEURISTIC           -                                HEURISTIC  scanner said PASS;
                                                                                                          weight NONE
Z-02-depcheck-explicit-list               HEURISTIC           -                                HEURISTIC  scanner said PASS;
                                                                                                          weight NONE
MUTANTS                                   pinned via PROOF_CHAN_MAP                            RUN   8/8: every weak check
                                                                                                     accepted, every
                                                                                                     qualified check rejected
                                                                                                     for the named reason
tally: PASS 21, OBS 3, HEURISTIC 2; proof tally (weight-bearing only): PASS 21, FAIL 0
TOOLCHAIN: PINNED   HOST_NATIVE_SET 1.94.1 (rust-toolchain.toml) + WASM64_KERNEL_SET nightly-2026-09-24 (proof-sets.json)
                    [GAP] kernel identity is install-name dependent (KRN-D13-A/B; FACT-KERNEL-IDENTITY-INSTALL-PATH)
```

## 3. Status integrity (evidence/D13/status/)

```text
STATUS INVENTORY PASS: 1037 occurrences in 1049 files; 0 unclassified
by class   B 644 (historical records/evidence)  R 310 (register rows: law ledgers, graph, handoff, D13 records)
           N 81 (vocabulary: tools, fixtures, code, law rule words)  C 2 (kernel [GAP] diagnostic)
defect patterns (class A)  DP-01 wildcard surfaces 0/0 PASS; DP-02 ledger "live Fable record" 0/0 PASS; DP-03 README
           Fable entry 0/0 PASS; DP-04 AFTER placeholder 1/<=1 PASS (the D13 entry itself); DP-05 bootloader banner
           1/>=1 PASS; DP-06 fragment annotations 5/>=5 PASS
live rows  every R occurrence is a row of docs/HANDOFF.md section 6 (C / D / B / OWNER), the graph (node class) or a
           D13 record; none is an internal chain defect
```

## 4. Handoff and knowledge chain

```text
handoff check (evidence/D13/handoff/check.json)   PASS: README -> docs/HANDOFF.md; sections 1-7; every live mention of
                                                  Fable/Opus marked historical; bootloader banner line 1; FINAL-HANDOFF
                                                  and PLANNED-REPO-LAYOUT annotated; ledger header model-independent;
                                                  5/5 #internal-storage citations preserved and annotated
paths-probe (evidence/D13/paths/)                 dead wildcard surfaces: none
graph (evidence/D13/envmap/)                      validate PASS (24 checks incl. epochs_consistent), 302 nodes / 641
                                                  edges; merge-check: 211 D11 nodes identical, 475 D11 edges present,
                                                  graph == merge(D11, D12, D13); render-check PASS; Q16: D11 (211
                                                  nodes), D12 (66 nodes: 16 facts, 5 cross-epoch edges), D13 (25 nodes:
                                                  8 facts, 7 cross-epoch edges incl. INVALIDATED_BY on
                                                  FACT-WILDCARD-SURFACES-DEAD and FACT-TOOLCHAIN-DRIFT, CON-EM-007
                                                  CONFLICTS_WITH CON-EM-005)
```

## 5. Workpiece audit and cleanup (evidence/D13/workpieces/)

```text
audit-before   RETIRABLE 25 (worktrees W0-W8, W10-W13; stages W0-W8, W10, W12, W13), KEEP 2 (W11-stage: 2 paths differ
               from the integrated tree; factory-bootstrap-bin: no Factory record), CURRENT 2 (W14, W14-stage)
retire         25 actions, 25 REMOVED (git worktree remove without --force; stage copies after the subset proof)
audit-after    RETIRABLE 0, KEEP 2, CURRENT 2, ABSENT 13 (retired worktrees; their state/reinspect records kept)
git            `git worktree list`: the canonical checkout and W14 only
remote         3 fully merged remote branches reported for the owner; none deleted
```

## 6. Intended vs observed

```text
P-F1   MATCH   17/17, clippy/fmt clean
P-F3   MATCH   302 nodes / 641 edges; D11 part identical; S-FIXTURE effective may_change unchanged
P-F5   MATCH   every prediction; kernel 6f25ce43... == declared; mutants 8/8 RUN
               (observed detail: X-03 `test --workspace` passes, as D9 recorded; it stays CROSS_SET weight NONE)
P-F6   MATCH   0 unclassified; handoff PASS; 13 worktrees + 12 stages retired; W11-stage and factory-bootstrap-bin
               kept; W14 current (W9 is not listed as ABSENT because no W9 state file exists here: it is simply
               outside this workpiece root's records, as H-37 states)
ROUTE  DIFFER  one malformed fixture surface (section 1) refused by the Factory and corrected before any run; not a
               change of the intended structure
STRUCTURE MATCH  stations S-DOC, S-RUST, S-FIXTURE, S-ANNOTATE (new, bootstrap, insertion-only), S-BUILD, S-EVIDENCE;
                 no other authority widened; no capability implemented; no historical artifact changed
```

## 7. Final verification

```text
[PASS] Factory authority surfaces mean what they claim - S-FIXTURE v2 literal, effective authority unchanged (F3)
[PASS] unsupported wildcard-looking authority cannot match nothing - validate_surface rejects it (f09-f12, F3)
[PASS] proof sets distinguish native and wasm64 targets - proof-sets.json, sets-check, per-record set/target/profile
[PASS] authoritative no_std/dependency proofs use the qualified judge - Q-WASM-02/03, Q-ALL-02/03; heuristics NONE
[PASS] live handoff no longer depends on Fable/Opus identity - README, docs/HANDOFF.md, banners, handoff check
[PASS] D12 is traversable from the environment graph - epoch D12, Q16, cross-epoch edges
[PASS] historical evidence remains immutable - delta must_not_change covers D0-D12 + intake artifacts; verify PASS
[PASS] unresolved technical capability gaps remain visible - docs/HANDOFF.md section 6 (C rows), graph GAP/ERR facts
[PASS] unresolved external authority questions remain visible for D14 - D rows, DENIED authorities, annotations
[PASS] cleanup deleted nothing not proven disposable - retire receipt: 25 proven objects; KEEP objects untouched
[PASS] full post-repair verification/evidence succeeds - F0-F8 PASS; factory verify and reinspect follow
[PASS] intended and observed D13 structures agree - section 6
```

No internal chain defect is known to remain that could mislead the D14 rescan.  The next action is D14 TECHNICAL
REFERENCE RESCAN from design/materialization/D13-PRE-RESCAN-BASELINE.md; D13 itself does not start it.
