# D22 - Observed Factory Self-Qualification vs Intended

STATUS: RE-OBSERVATION OF THE D22 WORKPIECE (W27 on canonical base 88564a0eccd934d6a017faf65435bc871bcd2f94, the
D21R-MANIFEST-REPAIR integration)
LAW: compares D22-INTENDED-FACTORY-SELF-QUALIFICATION.md (sections 0-8) with the Factory run
(factory/receipts/D22-FACTORY-SELF-QUALIFICATION/, evidence/D22/).  INTENDED -> EXECUTION -> EVIDENCE -> OBSERVED.
D22 was judged by the Factory as committed at 88564a0; the repaired judge is identified in evidence/D22/witnesses.json.

## 1. Station run

```text
F0-doc       S-DOC       PASS  intended ASCII (STRUCTURAL CHECK: PASS); ledger (D21R AFTER, D22 BEFORE); nothing else
                               differs from 88564a0
F1-rust      S-RUST      PASS  factory/tests/factory_law.rs f17-f28 added; REPRODUCE with ops.rs as committed: cargo test
                               exit 101, "23 passed; 6 failed", exactly f17 f18 f22 f23 f24 f26 FAILED (6.8 s)
F2-rust      S-RUST      PASS  factory/src/ops.rs repaired (966 lines): fmt --check, clippy -D warnings clean; 29 passed,
                               29 listed; no other Rust source, manifest or registry file changed
F3-fixture   S-FIXTURE   PASS  tests/factory/{witnesses.json, run-witnesses.sh}, tests/sync/collision-witness.sh,
                               tests/envmap/build-fact-epoch.mjs, tests/envmap/facts/D22.json,
                               tests/manifest/{components, issues}.json, tests/manifest/build-epoch.mjs (I-27),
                               tests/hygiene/status-classification.json; syntax + generic scan clean; run-witnesses
                               trial PASS; D21 and D21R epochs rebuilt byte-identically by the changed builders
F4-browser   S-BROWSER   PASS  identity: 4 toolchains, 45 source tips (4 moved)
F5-evidence  S-EVIDENCE  PASS  reproduce.log (F1's log, 180 lines), collision-witness.json PASS, witnesses.json PASS:
                               29 ok, 16 of 16 reasons REFUSED_FOR_NAMED_REASON, 5 of 5 positive paths; judge
                               (rustc 1.94.1, built from the workpiece) sha256 9266f00f4be893c0...9e8f65fc, 7377352 bytes
F6-doc       S-DOC       PASS  design/execution-manifest rebuilt at 88564a0 + 4 live additions; byte-identical rebuild
F7-evidence  S-EVIDENCE  PASS  evidence/D22/{manifest, issues, gate}.json; gate PASS (6 checks)
F8-doc       S-DOC       PASS  epochs/D22.json 10 / 34; graph 1284 / 3284; views (register 131511, traceability 387007
                               bytes); SCHEMA 15 row; ENVIRONMENT-MAP 14 row; docs/HANDOFF.md (last delta, judge,
                               materialized, series, next, section 6); README.md
F9-annotate  S-ANNOTATE  PASS  FACTORY-CONTRACTS.md "D22 ANNOTATION": 8 lines inserted, 0 deleted
F10-evidence S-EVIDENCE  PASS  validate 42, Q01-Q22, stale 346, merge-check, render-check, Q22 check (3 D22 facts [RUN],
                               D21R [RUN], 180 current facts), D18/D18R/D20-SYNC gates, capability + implementation gates,
                               status scan (3255 files, 0 unclassified), handoff check (19), audit -> retire -> audit
                               (W26 REMOVED; W25, W25-stage, W26-stage KEEP), cleanup gate, index (64 files)
F11-doc      S-DOC             this record
ROUTE  MATCH  no refusal, no re-run.  Two dry runs on a scratch clone at 88564a0 preceded the route: the first found
              the collision witness writing its report into its scratch repository, two live files of D21R unassigned
              in the manifest (I-28) and build-epoch.mjs naming the D21 package (I-27); all repaired before routing.
```

## 2. The attack (evidence/D22/reproduce.log, witnesses.json, collision-witness.json)

```text
reproduce    cargo test -p factory with f17-f28 present and ops.rs as committed at 88564a0: 23 passed, 6 failed:
             f17 edited receipt verified, f18 hand-written receipt verified, f22 failed identity probe closed PASS,
             f23 escaping cwd / log opened, f24 station writing into canonical closed PASS, f26 littering re-inspection
             matched.  The other six new witnesses (f19, f20, f21, f25, f27, f28) already refused for their named
             reason: those halves of the law were sound.
repaired     five checks in ops.rs (receipt_matches_station_run, identity_probe_observed, command_cwd_within_workpiece
             + command_log_within_workpiece, canonical_repository_untouched_by_station,
             canonical_repository_untouched_by_reinspect); 29 of 29 witnesses pass; no station spec changed
register     16 reasons of the prompt, each REFUSED_FOR_NAMED_REASON: the witness passed and every refusal text it names
             exists in a refusal source; positive path PASS (f00 intake -> re-inspection, f13 identity, f14/f15 audit
             and retire, f16 proof weight, the relocation import)
collision    scratch repository: import-line.mjs --check exit 1 "shared.txt: destination shared.txt already holds other
             content in <ours> (relocate it)"; with the relocation, --write and --check PASS, line/shared.txt
             byte-identical to the line's blob, shared.txt keeps our bytes, line-only.txt imported
judge        the Factory built from this tree: sha256 9266f00f4be893c00047cc58ca750e29fd112edec520550e12970c5f9e8f65fc
             (7377352 bytes, rustc 1.94.1); D23-D26 routes build and use it; the D22 re-inspection builds it from the
             canonical tree and re-runs the register
```

## 3. Re-observation findings (classified and repaired inside D22)

```text
I-27  A  tests/manifest/build-epoch.mjs named evidence/D21/{manifest, gate, issues}.json as literal fallbacks; the D22
         manifest rebuild reported it as a live tool reading a historical package -> the paths are its arguments; the
         D21 epoch rebuilds byte-identically
I-28  B  TEST-ENVMAP listed its files one by one, so D21R's tests/envmap/build-fact-epoch.mjs and facts/D21R.json were
         unassigned -> TEST-ENVMAP covers tests/envmap/ as a directory (bind-evidence.mjs keeps its historical component
         by the more specific entry)
      N  factory/tests/ joined the code zone of the status classification (a witness comment names "stale verification")
issues 28: A 8 (I-10 open for D23; I-21..I-27 REPAIRED), B 8 (I-01, I-14, I-28 REPAIRED; I-05, I-06, I-08, I-11, I-19
         open), C 2, D 2, E 1, F 4, G 3
```

## 4. Manifest and graph (evidence/D22/manifest.json, gate.json; epochs/D22.json)

```text
manifest     3168 files = the tree at 88564a0 (3164) + 4 live additions (tests/factory 2, tests/sync 1,
             tests/envmap/facts 1); 65 components; PRODUCTION 67, FACTORY 24, TEST 88, FIXTURE 97, REFERENCE 86,
             RECORD 733, LAW 32, HISTORICAL 11, EVIDENCE 2030; unassigned 0; coverage 41/41; findings: never receipted
             3 (D0 registry, I-02), historical tools 2 (I-03), evidence readers 3 (I-03, I-04, I-05)
epoch D22    ENV-D22-HOST; PROBE-FACTORY-WITNESSES; EV-D22-{WITNESSES, COLLISION-WITNESS, REPRODUCE, MANIFEST, GATE};
             FACT-D22-FACTORY-NEGATIVE-WITNESSES [RUN], FACT-D22-FACTORY-DEFECTS-REPAIRED [RUN],
             FACT-D22-JUDGE-QUALIFIED [RUN] (IMPLEMENTED_BY the eight Factory implementation nodes; STALE_IF
             repo.commit, toolchain.stable.rustc_commit); 10 nodes / 34 edges
merged       1284 nodes / 3284 edges; validate PASS (42); merge-check PASS; render-check PASS
Q22          180 current facts: RUN 113, OBS 48, GAP 10, ERR 5, UNK 4; RUN claims 113 = 112 claimable + 1 invalidated;
             open stops GAP 8, ERR 5, UNK 4 (unchanged); the three D22 facts claimable for ENV-D22-HOST (newest evidence
             D22); their traversal stops at CURRENT AUTHORITY [GAP] as every internal process fact does
```

## 5. Intended vs observed

```text
P1  MATCH   reproduce exit 101, 23 passed, 6 failed = f17 f18 f22 f23 f24 f26
P2  MATCH   fmt, clippy clean; 29 passed; 16 of 16 reasons, 5 of 5 positive; collision refused + relocated PASS
P3  MATCH   3168 files, tiers as predicted, unassigned 0, coverage 41/41, byte-identical rebuild; gate PASS, 28 issues
            (A 8, B 8, C 2, D 2, E 1, F 4, G 3; D22 9)
P4  MATCH   epoch 10 / 34; merged 1284 / 3284; validate 42; D21 and D21R epochs byte-identical
P5  MATCH   Q22 180 (RUN 113, OBS 48, GAP 10, ERR 5, UNK 4); 113 = 112 + 1; stops GAP 8, ERR 5, UNK 4; three [RUN],
            newest D22
P6  MATCH   status scan PASS, handoff PASS, gates PASS; FACTORY-CONTRACTS.md 8 inserted / 0 deleted; W26 REMOVED,
            W26-stage KEEP, W25 KEEP
STRUCTURE MATCH  ops.rs the only Rust source changed; no station spec changed; earlier records, epochs, evidence and
                 receipts untouched; the contract amendment insertion-only
```

## 6. Current reading

```text
[RUN]  FACT-D22-JUDGE-QUALIFIED: the judge refuses every attack the prompt names for its named reason and passes its
       positive path; its live surfaces are enumerated (gate PASS); it judges D23-D26
[RUN]  FACT-D22-FACTORY-DEFECTS-REPAIRED: six accepted attacks reproduced with the committed Factory, refused after
       the repair; I-21..I-26 REPAIRED
[RUN]  FACT-D22-FACTORY-NEGATIVE-WITNESSES: 16 of 16; I-14 REPAIRED
[OBS]  FACT-D21-* unchanged; [RUN] FACT-D21R-MANIFEST-REBUILD-STABLE unchanged
[NOTE] D22 itself was verified, integrated and re-inspected by the pre-repair Factory (88564a0): its receipts are
       accepted by the old rules; the new checks apply from the next station run on
[NEXT] D23-COMPILER-ABI-EXECUTION (I-06, I-10, I-19) judged by the repaired Factory
```

GATE: PASS - the Factory was run through itself and attacked with every refusal reason the prompt lists; every attack
is refused for its named reason by a witness that asserts the check; six attacks the committed Factory accepted were
reproduced first, repaired in ops.rs without widening any station, and witnessed; the register, the collision witness
and the judge's identity are bound to the graph as three [RUN] facts.  The judge is qualified to judge D23-D26.  Task 2
of 6 closed.
