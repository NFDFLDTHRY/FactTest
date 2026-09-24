# D25 - Observed Physical Webapp / Runtime Execution vs Intended

STATUS: RE-OBSERVATION OF THE D25 WORKPIECE (W31 on canonical base 76f44410fe4a57162b6c355c859c296b2a697be4, the
D24-PIPELINE-GENERICITY integration; judged by the D22 Factory)
LAW: compares D25-INTENDED-PHYSICAL-RUNTIME.md (sections 0-8) with the Factory run
(factory/receipts/D25-PHYSICAL-RUNTIME/, evidence/D25/).  INTENDED -> EXECUTION -> EVIDENCE -> OBSERVED.

## 1. Station run

```text
F0-doc       S-DOC       PASS  intended ASCII (STRUCTURAL CHECK: PASS); ledger (D24 AFTER, D25 BEFORE); nothing else
                               differs from 76f4441
F1-fixture   S-FIXTURE   PASS  tests/physical (runner, public probe, deployable probe document), primitives-probe.mjs
                               (BUNDLE_DIR required: exit 2 without a generated bundle, no historical default),
                               components.json (69), issues.json (35), facts/D25.json: syntax, JSON, registers
F2-web       S-WEB       PASS  host/harness/webapp-probe.mjs: syntax; generic; identity, shell-driving, --url present
F3-browser   S-BROWSER   PASS  identity: 4 toolchains, 45 source tips (5 moved), HeadlessChrome/141.0.7390.37
F4-build     S-BUILD     PASS  factc + the wasm64 release kernel (identity == the D24 pin ef5d886a...); run-webapp:
                               4 specimens x (fresh build PASS, integrity, webgpu, no-webgpu, isolated, isolation by
                               server headers only, observe bound) PASS; selfhost P01-P06/P08/P09/P14-P16 RUN, P10
                               OBS, P07 GAP on the fresh bundle; public HTTPS UNREACHABLE, served bundle.json of the
                               pushed copy identical to the fresh build; identity and behaviour checks PASS
F5-doc       S-DOC       PASS  design/execution-manifest rebuilt at 76f4441 + additions (4147 files, 69 components);
                               deterministic
F6-evidence  S-EVIDENCE  PASS  evidence/D25/{manifest, issues, gate}.json; gate PASS (35 issues)
F7-doc       S-DOC       PASS  epochs/D25.json (build-fact-epoch): 20 nodes / 36 edges; graph 1352 / 3483; views;
                               SCHEMA row; ENVIRONMENT-MAP row; HANDOFF; README
F8-evidence  S-EVIDENCE  PASS  validate 42, Q01-Q22, stale 387, merge-check, render-check, Q22 check, D18/D18R/
                               D20-SYNC/D23/D24 gates, capability + implementation gates, status scan, handoff check,
                               audit -> retire -> audit (W29 REMOVED; W30 KEEP), cleanup gate, index (64 files)
F9-doc       S-DOC             this record
ROUTE  MATCH  on W31.  Two dry runs on a detached worktree at 76f4441 preceded the route; the first found three
              fixture defects of the delta itself (a missing evidence directory, the pushed branch taken from a
              detached HEAD, a document grep) - repaired before routing.  The first route (W30) passed F0-F7 and was
              REFUSED at F8: station close found evidence/D25/surfaces.json changed outside the fixture's may_change
              (the reconciliation-surfaces re-check inherited from the D23 fixture writes it; a dry run cannot see
              may_change).  The fixture was repaired (the path listed), W30 kept as the record of the refusal, and the
              whole delta re-routed on W31 from the base: every fixture PASS, no re-run of a failed command.
```

## 2. The physical runs (evidence/D25/physical)

```text
byte-relay     webgpu: E0 WEBGPU plan 1 A,B exact -> release WEBGPU -> E1 CPU_WASM64 plan 0 A,B exact; stale plan 1
               invalidated; no-webgpu: CPU_WASM64 plan 0; isolated: as webgpu with crossOriginIsolated true
ledger-mirror  webgpu: E0 CPU_WASM64 post + mirror exact (1, 0, 1000 bytes) -> release CPU_WASM64 -> E1 no plan;
               no-webgpu: the same E0; isolated: the same
pixel-vault    webgpu: E0 WEBGPU stash exact (3, 17 bytes) -> release -> E1 no plan; no-webgpu: no plan at E0, every
               stash NO_ACTIVE_PLAN; isolated: as webgpu
dual-stream    webgpu: E0 CPU_WASM64 plan 0 feed + drain exact (4, 513 bytes) -> release CPU_WASM64 -> E1 WEBGPU
               plan 3 feed + drain exact; no-webgpu: CPU_WASM64 plan 0; isolated: as webgpu
every run      only bundle files requested; no runtime codegen; bundle unchanged; every fetched file as bundle.json
               records; SW registered; CacheStorage holds the shell; tape bound (evidence_lineage OBS)
identity       HeadlessChrome/141.0.7390.37 (@9f043f63..., V8 14.1.146.11; /opt/pw-browsers/chromium-1194/chrome-linux/
               chrome; unsafe-WebGPU + SwiftShader flags); adapter google / swiftshader, isFallbackAdapter true, 19
               features, 35 limits; Linux 6.18.44 x64, 4 CPUs; origin http://127.0.0.1:<port> secure context;
               toolchain pins 1.94.1 / nightly-2026-09-24, kernel ef5d886a...; epochs E0, E1
selfhost       fresh Byte Relay bundle (hashes recorded): P01-P06, P08, P09, P14-P16 RUN; P10 OBS (fresh kernel in
               a worker); P07 GAP (persist() false in the headless, non-installed shell)
public HTTPS   UNREACHABLE: raw.githack.com, rawcdn.githack.com, nfdfldthry.github.io refused at CONNECT by the
               egress policy; raw.githubusercontent.com 200 text/plain + nosniff + sandbox CSP (no module WebApp);
               the served bundle.json of the pushed D24 copy names the fresh build's bundle_id 0f4a1ec1...;
               deployable probe: tests/physical/PUBLIC-HTTPS-PROBE.md
```

## 3. Manifest and graph

```text
manifest     4147 files, 69 components (PRODUCTION 68, FACTORY 24, TEST 106, FIXTURE 111, REFERENCE 86, RECORD 905,
             LAW 32, HISTORICAL 11, EVIDENCE 2804); unassigned 0; gate PASS, 35 issues (A 11, B 10, C 2, D 3, E 1,
             F 4, G 4)
epoch D25    20 nodes / 36 edges (ENV 1, IMPL 2, PROBE 2, EV 11, FACT 4); merged 1352 / 3483; validate 42
Q22          191 current facts: RUN 120, OBS 49, GAP 12, ERR 5, UNK 5; RUN claims 120 = 119 claimable + 1
             invalidated; open stops GAP 10, ERR 5, UNK 5 (FACT-D25-PUBLIC-HTTPS added); newest evidence D25 for
             the D25 [RUN] facts
```

## 4. Intended vs observed

```text
P1  MATCH   4 fresh builds PASS; kernel identity ef5d886a... == pin
P2  MATCH   4 x 3 configurations PASS; every behaviour flag as predicted; isolation only with server headers
P3  MATCH   identity as predicted (HeadlessChrome 141, swiftshader fallback adapter, 19 features, 35 limits)
P4  MATCH   selfhost verdicts as predicted; public HTTPS UNREACHABLE; served bundle.json identical
P5  MATCH   4147 files, 69 components, tiers as predicted, unassigned 0, byte-identical rebuild; gate PASS, 35 issues
P6  MATCH   epoch 20 / 36; merged 1352 / 3483; validate 42; Q22 191 (RUN 120, OBS 49, GAP 12, ERR 5, UNK 5);
            120 = 119 + 1; stops GAP 10, ERR 5, UNK 5; newest evidence D25; stale 387
P7  MATCH   status scan PASS, handoff PASS, gates PASS; W29 REMOVED, W29-stage KEEP, W30 KEEP; index 64
STRUCTURE MATCH  compiler/ byte-identical to 76f4441 (I1); factory/, fixtures/, law and pass documents untouched;
                 earlier epochs, evidence, receipts and records untouched
```

## 5. Current reading

```text
[RUN]  FACT-D25-RUNTIME-PHYSICAL: the four fresh bundles behave in Chromium as the runtime contract claims, driven
       through their own shells, every behaviour of the prompt with fresh evidence and identity (I-11 closed)
[RUN]  FACT-D25-SELFHOST-PRIMITIVES-FRESH: the selfhost primitives on the fresh bundle (I-05 closed)
[OBS]  FACT-D25-ISOLATION-ORIGIN: isolation is the origin's, not the bundle's
[UNK]  FACT-D25-PUBLIC-HTTPS: no reachable public origin can host the module WebApp from this environment; the
       deployable probe, evidence schema and artifact hashes are recorded; localhost not substituted
[GAP]  FACT-D24-RUNTIME-SELF-INTEGRITY: kept unclaimed (I-33, owner decision recorded)
[NEXT] D26-CLEAN-COMMISSIONING: the complete implemented system from the canonical source on a clean workpiece;
       STALE_IF-selected re-proof of what D21-D25 invalidated; final consistency audit, baseline, boundary register
```

GATE: PASS - every CURRENT runtime claim has fresh physical evidence (four specimens, three browser configurations,
the selfhost primitives) with the exact environment identity, or an exact honest environmental boundary (public
HTTPS: [UNK], deployable probe recorded).  Task 5 of 6 closed.
