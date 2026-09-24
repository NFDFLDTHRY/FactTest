# D22 - Intended Factory Self-Qualification

STATUS: INTENDED ASCII (assembled before routing; source of record for delta D22-FACTORY-SELF-QUALIFICATION, workpiece
W27, base 88564a0)
REQUEST: design/materialization/D21-D26-WHOLE-REPO-EXECUTION-PROMPT.md, D22 FACTORY PROVES FACTORY: "Can the CURRENT
Factory safely judge every repair that follows?  Run the Factory through itself.  ATTACK IT.  The expected result of a
negative witness is REFUSAL FOR THE NAMED REASON.  A failure for some unrelated reason is not a pass.  Repair every A/B
defect found in Factory machinery before D23.  Do not widen station authority merely to make a fixture pass."
ISSUE: tests/manifest/issues.json I-14 (class B): eight of the sixteen refusal reasons had no witness.
SCOPE: witness all sixteen reasons and the positive path; reproduce every accepted attack with the Factory as committed;
repair exactly what accepts; bind the run to the graph; leave every station's authority as it is.

## 0. Observation before drawing

```text
judge        /home/user/factory-target-canon/debug/factory built from 88564a0 (rustc 1.94.1); factory/src 2654 lines in
             10 files; factory/tests/factory_law.rs f00-f16 (17 tests, 3.3 s, all pass at 88564a0)
covered      8 reasons by f01-f16: unauthorized changed path (f01, f06), wildcard-looking surface (f09-f12), fixture
             wider than station (f02), MAY/MUST overlap (f08), missing receipt (f03), canonical base movement (f05),
             unreceipted mutation (f07), unsafe cleanup candidate / unintegrated retirement in part (f14, f15)
uncovered    forged receipt identity, stale verification, workpiece changed after verification, malformed fixture, bad
             environment identity, parallel-line import collision, attempted direct canonical mutation (+ the missing
             halves of cleanup and retirement)
attack       twelve witnesses f17-f28 written against the CURRENT code (scratch clone at 88564a0, same toolchain),
             each asserting the check name that must refuse; run before any repair:
             23 passed, 6 FAILED - the six accepted attacks:
             f17  a FAIL receipt edited by hand to PASS verifies        verify reads the receipt file only
             f18  a PASS receipt no station wrote verifies              empty verification_results = "all pass"
             f22  a failed / unspawnable identity probe closes PASS     the probe is recorded, never judged
             f23  a command with cwd "../" or an absolute cwd, or a log "../x", opens   cwd is never checked
             f24  a station command writing into the canonical checkout closes PASS      nothing looks at canonical
                  (integration would refuse the litter later - after the mutation happened)
             f26  a re-inspection command littering the canonical checkout reports MATCH
             refused already (class B closure only): f19 stale verification, f20 changed after verification, f21
             malformed fixture (unloadable command, foreign delta, unregistered station), f25 direct canonical edit,
             f27 verified-not-integrated kept, f28 reinspect DIFFER kept
class        the six accepted attacks: A (internal defect of live FACTORY machinery: the judge accepts what the law
             forbids) -> REPAIR NOW, before D23.  Every earlier rung is uninvolved: paths.rs (literal surfaces) and
             hygiene.rs (audit/retire) refuse as the law says; the gaps are five missing checks in ops.rs.
collision    tests/sync/import-line.mjs refuses a destination that "already holds other content" (D20) but no witness
             exercised it: witnessed in a scratch repository (refusal, then relocation byte-identical)
judged by    D22 is routed, verified, integrated and re-inspected by the Factory as committed at 88564a0 (D13
             precedent: a Factory repair is judged by its predecessor).  Its stations compile and test the repaired
             Factory (cargo, CARGO_TARGET_DIR outside the workpiece); the re-inspection runs the repaired suite from
             the canonical tree; every route from D23 on builds the repaired judge.
not widened  no station spec changes; S-RUST (factory/), S-FIXTURE (tests/), S-ANNOTATE (FACTORY-CONTRACTS.md
             insertion-only), S-BROWSER, S-EVIDENCE, S-DOC as registered
```

## 1. Witnesses (factory/tests/factory_law.rs f17-f28; each asserts the refusing check)

```text
f17  edited receipt (FAIL -> PASS by hand)        verify    receipt_matches_station_run:fx
f18  hand-written PASS receipt                    verify    receipt_matches_station_run:fx
f19  stale verification (station ran again)       integrate workpiece_unchanged_since_verification
f20  workpiece changed after verification         integrate workpiece_unchanged_since_verification
f21  malformed fixture: command without log       verify    fixture_loads:<path>; Fixture::load "missing string field"
     fixture of another delta                     open      fixture_delta_matches
     unregistered station                         open      Err "not registered in canonical base or workpiece"
f22  identity probe fails / cannot spawn          close     identity_probe_observed:<name>; receipt FAIL
f23  command cwd "../" / absolute; log "../x"     open      command_cwd_within_workpiece:<cwd>, command_log_within_workpiece:<log>
f24  station command writes into canonical        close     canonical_repository_untouched_by_station; then verify, integrate refuse
f25  uncommitted edit in the canonical checkout   integrate canonical_working_tree_clean
f26  re-inspection command litters canonical      reinspect canonical_repository_untouched_by_reinspect; status DIFFER
f27  verified, never integrated                   audit     KEEP "integration MISSING"; retire keeps it
f28  integrated, re-inspection DIFFER             audit     KEEP "reinspect DIFFER"; retire keeps it
```

## 2. Repairs (factory/src/ops.rs only; five checks, no authority widened)

```text
receipt integrity   station close records receipt path, close tree and sha256 of the receipt bytes in the Factory-owned
                    state (outside the workpiece); verify: receipt_matches_station_run:<fx> = the latest closed run of
                    the fixture is PASS, names this receipt, the same close tree and the same bytes
identity            station close: identity_probe_observed:<name> = exit 0 and no spawn error; else the receipt is FAIL
confinement         fixture check: command_cwd_within_workpiece:<cwd> ("." or a literal relative path),
                    command_log_within_workpiece:<log> (literal relative path)
canonical           canonical_snapshot = branch head + `git status --porcelain` of the canonical checkout, taken before
                    and after a station's commands (canonical_repository_untouched_by_station, station close) and a
                    re-inspection's commands (canonical_repository_untouched_by_reinspect, reinspect -> DIFFER)
regression          f00-f16 unchanged and passing; cargo fmt --check, clippy -D warnings clean; every routed fixture
                    of D0-D21R uses cwd "." and literal logs, so the repaired judge accepts them
```

## 3. Register, runner, collision witness (tests/factory/, tests/sync/collision-witness.sh; generic)

```text
witnesses.json      16 reasons in the prompt's order -> witnesses, refusing texts, stage, repaired_by; 5 positive paths
run-witnesses.sh    REGISTER TARGET_DIR OUT LOG_DIR name=report...: builds the Factory (HOST_NATIVE_SET toolchain from
                    tests/toolchain/proof-sets.json), runs cargo test -p factory, checks every named witness ok, every
                    refusal text present in a refusal source, every report PASS; records the judge's sha256 -> OUT
collision-witness   scratch repository: line adds shared.txt + line-only.txt; ours adds shared.txt (other bytes); sync
                    merge -s ours; import-line --check refuses "shared.txt: destination shared.txt already holds other
                    content"; with relocate shared.txt -> line/shared.txt, --write then --check PASS, line/shared.txt
                    byte-identical, shared.txt keeps our bytes
registers           components.json: tests/factory/ under FACTORY-TESTS; focused tests f00-f28; issues.json: I-01 and
                    I-14 REPAIRED (I-01's coverage is empty since the D21 epoch), I-21..I-26 (class A, D22, REPAIRED)
manifest            design/execution-manifest rebuilt at 88564a0 + the live files D22 adds (--delta, --epoch D22);
                    gate PASS with the updated inventory
re-observation      the rebuild found two more internal findings, classified and repaired here: I-27 (A)
                    tests/manifest/build-epoch.mjs named the D21 evidence package as literal fallbacks -> the paths are
                    its arguments; I-28 (B) TEST-ENVMAP listed its files one by one, so D21R's two additions were
                    unassigned -> the component covers tests/envmap/ as a directory.  The D21 epoch still rebuilds
                    byte-identically (F3).  factory/tests/ joins the code zone of the status classification (a witness
                    comment names "stale verification").
```

## 4. Evidence binding (tests/envmap/facts/D22.json; epoch D22, add-only)

```text
ENV-D22-HOST                         identity capture (F4)
PROBE-FACTORY-WITNESSES              run-witnesses.sh + collision-witness.sh; implemented_by IMPL-FACTORY-TESTS
EV-D22-{WITNESSES, COLLISION-WITNESS, REPRODUCE, MANIFEST, GATE}   sha256-bound (a record several facts cite is one node)
FACT-D22-FACTORY-NEGATIVE-WITNESSES  [RUN]  16 of 16 refused for the named reason; positive path PASS
FACT-D22-FACTORY-DEFECTS-REPAIRED    [RUN]  6 accepted attacks reproduced (reproduce.log) then refused
FACT-D22-JUDGE-QUALIFIED             [RUN]  the judge built from this tree; manifest + gate; qualified for D23-D26
-> 10 nodes / 34 edges; FACT-D21-* stay [OBS]; FACT-D21R-* stays [RUN]
```

## 5. Mutation plan by station (delta D22-FACTORY-SELF-QUALIFICATION, workpiece W27, base 88564a0)

```text
F0-doc       S-DOC       this ASCII; LEDGER (D21R AFTER, D22 BEFORE); delta + fixtures
F1-rust      S-RUST      factory/tests/factory_law.rs (f17-f28): REPRODUCE - cargo test with ops.rs as committed:
                         expected exit 101, "23 passed; 6 failed", exactly f17 f18 f22 f23 f24 f26 FAILED
F2-rust      S-RUST      factory/src/ops.rs (repairs): fmt --check, clippy -D warnings, cargo test 29 passed, 29 listed;
                         no other Rust file changed
F3-fixture   S-FIXTURE   tests/factory/{witnesses.json, run-witnesses.sh}, tests/sync/collision-witness.sh,
                         tests/envmap/build-fact-epoch.mjs (shared evidence node, per-evidence probe),
                         tests/envmap/facts/D22.json, tests/manifest/build-epoch.mjs (I-27), components.json (I-28),
                         issues.json, tests/hygiene/status-classification.json; syntax + generic scan; run-witnesses
                         PASS (temp); D21 and D21R epochs rebuilt byte-identically by the changed builders; no other
                         test changed
F4-browser   S-BROWSER   identity -> evidence/D22/identity/
F5-evidence  S-EVIDENCE  reproduce.log (F1's log copied), collision-witness.json, witnesses.json (+ logs)
F6-doc       S-DOC       design/execution-manifest rebuilt at 88564a0 (+ additions); deterministic
F7-evidence  S-EVIDENCE  evidence/D22/{manifest, issues, gate}.json; gate PASS
F8-doc       S-DOC       epochs/D22.json; graph D11..D21R + D22; views; SCHEMA 15 rows; ENVIRONMENT-MAP 14 row;
                         docs/HANDOFF.md; README.md
F9-annotate  S-ANNOTATE  FACTORY-CONTRACTS.md: "D22 ANNOTATION" block, insertion-only (0 deleted lines)
F10-evidence S-EVIDENCE  validate, Q01-Q22, stale, merge-check, render-check, Q22 check (3 D22 facts [RUN]), D18/D18R/
                         D20-SYNC gates, capability + implementation gates, status scan, handoff check, audit -> retire
                         -> audit (W26), cleanup gate, index
F11-doc      S-DOC       observed record
reinspect    STRUCTURAL CHECK / GATE greps; validate; merge-check; render-check; run-witnesses.sh from the canonical
             tree (target dir outside the tree) with a fresh collision witness, PASS; epochs/D22.json rebuilt from the
             graph merged through D21R and compared
```

## 6. Predictions (from the assembly trial on a scratch clone at 88564a0)

```text
P1  reproduce: cargo test exit 101, 23 passed, 6 failed = f17 f18 f22 f23 f24 f26 (no other test fails)
P2  repaired: fmt, clippy clean; 29 passed; run-witnesses 16 of 16 reasons REFUSED_FOR_NAMED_REASON, 5 of 5 positive;
    collision witness refused + relocated PASS
P3  manifest at 88564a0 + 4 live additions (tests/factory 2, tests/sync 1, tests/envmap/facts 1): 3168 files in 65
    components (PRODUCTION 67, FACTORY 24, TEST 88, FIXTURE 97, REFERENCE 86, RECORD 733, LAW 32, HISTORICAL 11,
    EVIDENCE 2030), unassigned 0, coverage 41/41, rebuilt byte-identically; gate PASS with 28 issues (A 8, B 8, C 2,
    D 2, E 1, F 4, G 3; D22 9)
P4  epoch D22 10 nodes / 34 edges; merged 1284 / 3284; validate 42; D21 and D21R epochs rebuilt byte-identically
P5  Q22: 180 current facts (RUN 113, OBS 48, GAP 10, ERR 5, UNK 4); RUN 113 = 112 claimable + 1 invalidated; open
    stops unchanged (GAP 8, ERR 5, UNK 4); the three D22 facts [RUN], newest evidence D22
P6  hygiene: status scan PASS (0 unclassified), handoff check PASS, gates PASS; FACTORY-CONTRACTS.md 0 deleted lines;
    W26 RETIRABLE -> REMOVED, W26-stage KEEP (stage bytes differ), W25 KEEP (reinspect DIFFER)
```

## 7. Invariants

```text
I1  every negative witness asserts the check name that refuses it; an unrelated failure fails the witness
I2  the six defects are reproduced with the committed Factory before the repair is applied (F1 before F2); the
    reproduce log is evidence
I3  no station spec changes; ops.rs is the only Rust source changed; f00-f16 unchanged
I4  the canonical checkout is not touched by any D22 station or probe (the new checks state the rule; the old judge
    verifies D22 by tree identity and the integration gate)
I5  earlier records, epochs, evidence and receipts untouched; FACTORY-CONTRACTS.md insertion-only
```

## 8. Structural check

```text
[x] every reason of the prompt's list has a witness naming its refusal; the positive path list is covered
[x] reproduce before repair; failing evidence preserved (reproduce.log)
[x] earliest rung: ops.rs checks; paths.rs / hygiene.rs / model.rs shown to refuse as the law says
[x] minimal repair; no authority widened; the contract amendment is insertion-only
[x] evidence bound: three [RUN] facts, five records, one probe, one environment; STALE_IF named
[x] the judge that judges D23-D26 is built and identified (sha256) in the evidence
```

STRUCTURAL CHECK: PASS
