# D19 - STABLE BASELINE

STATUS: BASELINE RECORD after the D14-D19 technical reference review series (written by D19-REPROVE-REOBSERVE,
workpiece W22, on canonical base b509fb00920443930aa75b10dae05b9683d2fe1b)
LAW: design/materialization/D14-D19-TECHNICAL-REFERENCE-REVIEW-PROMPT.md, D19 OUTPUT (current evidence epoch, post-rescan
graph, current entitled-claim surface, new stable baseline) and the series close condition: every current claim traverses
CLAIM -> ... -> STALE CONDITIONS, or ends at an explicit [GAP]/[ERR]/[UNK].  CURRENT AUTHORITY != REPRODUCIBILITY PIN.  The
integration commit of this baseline is recorded by the next delta in design/materialization/LEDGER.md.

STABLE-BASELINE: ESTABLISHED

## 1. What later work may rely on

```text
Factory chain    AGENT -> ASCII -> FACTORY -> WORKPIECE -> VERIFY -> REPO: literal path surfaces enforced (re-proved
                 D19), receipts format 2 with environment identity, fast-forward integration with owner PR merges only
                 (14 commits from 4a151c9, re-proved D19), workpiece audit/retire; docs/HANDOFF.md is the live,
                 model-independent entry (handoff check PASS)
Proof chain      HOST_NATIVE_SET +1.94.1 and WASM64_KERNEL_SET +nightly-2026-09-24 (tests/toolchain/proof-sets.json,
                 rust-toolchain.toml); 21/21 weight-bearing obligations PASS and mutants 8/8 RUN in D19; kernel identity
                 is the exec identity e8d6582665ea188049059215c6732c7280f5ab4a1920287ecdfa59997161bef2 (every section but
                 custom "name"), equal under both install names; heuristics weight NONE
Knowledge chain  design/environment-map/graph.json = D11 base + epochs D12..D19: 1141 nodes / 2572 edges, validate 42,
                 merge-check and render-check PASS; queries Q01-Q22 (tests/envmap/envmap.mjs); the current model
                 (D18 rules: superseded and resolved nodes are history) is Q21; the entitled-claim surface is Q22
Evidence epoch   D19 (evidence/D19/, epochs/D19.json): environment identity, selection, re-proof records; D0-D18R
                 evidence is historical and immutable
Status chain     tests/hygiene/status-scan.mjs: 2378 files, 5591 occurrences, 0 unclassified; earlier inventories are no
                 longer re-scanned (D19)
```

## 2. Current environment (the environment this baseline was proved in)

```text
host      Linux 6.18.44 x86_64, Ubuntu 24.04.4; rustc 1.94.1 e408947bf; nightly-2026-09-24 6eeff9a52 (clippy, rust-src);
          node v22.22.2; git 2.43.0; Playwright 1.56.1; no /dev/dri                            ENV-D19-HOST
browser   HeadlessChrome/141.0.7390.37 (@9f043f63), V8 14.1.146.11, executable
          /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell;
          default: secure context, no COI, no SharedArrayBuffer, navigator.gpu with a null adapter, Memory64
                                                                                              ENV-D19-BROWSER-DEFAULT
          unsafe WebGPU switches: SwiftShader fallback adapter                                ENV-D19-BROWSER-GPUFLAGS
sources   45 authority source tips as read on 2026-09-24 (other_state.sources)                ENV-D19-SOURCES
network   published authority hosts DENIED by the session network policy; sources read through git and raw
          repository hosts
```

## 3. Entitled-claim surface (graph query Q22; evidence/D19/envmap/queries/Q22.json)

```text
current facts   112: RUN 50, OBS 43, GAP 10, ERR 4, UNK 5
claimable       49 RUN claims, each only for the environments of its newest physical evidence (row: "claimable for
                ENV-... (physical evidence of <epoch>)"); 26 of them rest on D19 evidence
invalidated     1 by design: FACT-GPU-ADMITTED-E0 held only before EV-D7-ADM-E1-WEBGPU; the Byte Relay falls back to
                FACT-WASM64-ADMITTED-E1
observations    43 [OBS]: recorded observations, not execution claims
open stops      17: GAP 8, ERR 4, UNK 5 (section 5)
closed          FACT-TOOLCHAIN-DRIFT (by EV-D13-PINS) and FACT-WILDCARD-SURFACES-DEAD (by EV-D13-PATHS-PROBE): history,
                superseded in substance by FACT-TOOLCHAIN-PINNED and FACT-SURFACES-LITERAL-ENFORCED [RUN]
```

## 4. Claim traversal of the 50 RUN claims (Q18)

```text
COMPLETE (20)                    CORE-ONLY-GRAPH, FF-ONLY-INTEGRATION, GPU-ADAPTER-SWIFTSHADER, GPU-ADMITTED-E0,
                                 GPU-EPOCH-INVALIDATION, GPU-EXPOSED, GPU-KNOWN-ANSWER, GPU-LOSS-DESTROYED,
                                 JS-I64-BIGINT-MEMBRANE, KERNEL-EXEC-SECTIONS-INSTALL-INDEPENDENT,
                                 KERNEL-IDENTITY-DEFINED-D18, LOOPBACK-SECURE-CONTEXT, MEMORY64-DISCOVERED,
                                 PROOF-SETS-DECLARED, TOOLCHAIN-PINNED, WASM64-ABI-EXEC, WASM64-ADMITTED-E0,
                                 WASM64-ADMITTED-E1, WASM64-MODULE-I64, WORKPIECE-ISOLATION
[GAP] at IMPLEMENTATION          COMPILE-FAIL-WITNESSED, FIRST-PARTY-GRAPH, GPU-ADAPTER-NULL-DEFAULT, GPU-RELAY-EXACT-E0,
      CONTRACT (17)              OPAQUE-FRAME-SECURE-CONTEXT, QUALIFIED-JUDGE-RERUN, SH-BROKEN-SEED-FATAL,
                                 SH-BROKER-FED-GENERATION, SH-GENERATED-OFFLINE, SH-GIT-IDENTITY, SH-IDB-CAS,
                                 SH-INTERRUPTED-UPDATE, SH-OPAQUE-CONFINEMENT, SH-OPFS-SERVED-APP,
                                 SH-ORIGIN-SCOPED-STORAGE, SH-SW-NO-SELF-UPDATE, WORKPIECES-AUDITED
[GAP] at CURRENT AUTHORITY (6)   D15-, D16-, D17-, D18-CLAUSES-VERIFIED, D19-MINIMUM-SET, FRONTIER-SOURCES-AT-PIN
                                 (process facts: no external authority authorizes them)
[GAP] at EXACT CLAUSE (5)        D19-ENVIRONMENT-IDENTITY, HANDOFF-MODEL-INDEPENDENT, RESELECTION-NO-CODEGEN,
                                 STATUS-INVENTORIED, SURFACES-LITERAL-ENFORCED (cited at locator level)
[GAP] at PROJECT CONSTRAINT (2)  D19-LAUNCHED-EXECUTABLE, SH-SW-GRANTS-COI
(FACT- prefix omitted.  Every stop is explicit and is the docs/HANDOFF.md section 6 row "Q18 claim traversal".)
```

## 5. Open stops (each is a docs/HANDOFF.md section 6 row)

```text
[GAP]  SH-NO-FACTORY-WEBAPP            C  D12 B-01, B-02 (seed/broker qualification paused by the owner)
[GAP]  SH-KERNEL-WORKER-PARTIAL        C  D12 B-06 (six ABI exports absent)
[GAP]  WGSL-UNEXERCISED                C  D11 WGSL / CON-GPU-003
[GAP]  STREAMING-UNPROBED              C  D11 streaming
[GAP]  WORKERS-D18R                    C  D18R workers (no worker admission contract)
[GAP]  GIT-TREE-ORDER-UNDOCUMENTED     D  git tree-entry order
[GAP]  HEURISTIC-CHECKS-REMAIN         B  D1-D8 heuristic gates (weight NONE)
[GAP]  STATION-ENV-UNRECORDED          B  D0-D12 receipts/evidence identity
[ERR]  SHARED-THREADS-UNADMITTED-D18   C  ERR-002 / ERR-003
[ERR]  NATIVE-WORKSPACE-UNBUILDABLE    C  D9 native --workspace (row added by D19)
[ERR]  D9-HISTORY-OVERSTATED           B  D3-D8 fixture wording
[ERR]  DEFAULT-MEMBERS-13              B  D3-D8 fixture wording
[UNK]  HARDWARE-GPU-UNAVAILABLE        C  D11 hardware GPU
[UNK]  SH-STORAGE-DURABILITY-D18       C  D12 B-11
[UNK]  PUBLISHED-FRONTIER-UNVERIFIED   D  published frontier (D14)
[UNK]  AUTHORITY-REOPEN-DENIED         D  D11 FACT-AUTHORITY-REOPEN-DENIED
[UNK]  SH-GITHACK-UNREACHABLE          D  D12 B-19
```

## 6. When the baseline stops holding, and how to re-verify

```text
stale when   any STALE_IF condition of a claim changes: 204 relations over 21 dimensions
             (evidence/D19/envmap/stale.json).  They cover the pinned toolchains (commit, release, components,
             install name), the node and git versions, the Chromium product, revision, V8 and launch flags, the origin,
             secure context and cross-origin isolation, the GPU device node, the network egress policy, the authority
             source tips, the repository commit and workspace members, and the dependency graph identity.  A claim
             also goes stale when its implementation or probe harness changes after its newest evidence (git)
re-verify    node tests/reprove/identity.mjs --graph design/environment-map/graph.json --out <dir>/identity
             node tests/reprove/select.mjs --graph ... --identity <dir>/identity --dimensions tests/reprove/dimensions.json
                  --runbook tests/reprove/runbook.json --obligations tests/reprove/obligations.json --out <dir>/selection.json
             node tests/reprove/run-selected.mjs --selection ... --runbook tests/reprove/runbook.json
                  --kind cite|build|source|repo --out <dir>
             node tests/reprove/build-reprove.mjs ... ; node tests/reprove/gate.mjs ...   (evidence/D19/logs show the
             exact commands).  Route this as a new delta with a new epoch.  Never edit D19
undecidable  9 historical conditions (evidence/D19/selection.json unk) can never be compared; the claims that rest on
             them can only be re-proved, never shown unchanged
not relied   rustup's floating "nightly" name (6bb1652a0 today); published authority renderings (DENIED here);
             non-Linux platforms; hardware GPUs
```

## 7. Series D14-D19: closed

```text
D14   46cc28b  frontier reopen: 64 AUTHORITY_REVISION nodes; Q17 staleness traversal
D15   3748fa7  foundational semantics: 60 exact clauses VERIFIED at source tips; Q18 claim traversal
D16   e4e2103  capability universe: 33 families traced at 90 more clauses; exposure census; Q19
D17   715ac92  implementation reality: 19 behaviours on 44 clauses pinned to the versions run; Q20
D18   1b81dc0  repository reconciliation: one current model (36 reconciliations, 15 supersessions); Q21
D18R  b509fb0  chain repair: one D18 statement contradicted committed evidence; superseded, and a field corrected
D19   (next delta records it)  re-prove / re-observe: 29 of 90 claims selected from the graph and re-proved; epoch D19;
               Q22; this baseline
close          112 current facts: 20 RUN claims COMPLETE; 30 RUN claims stop at an explicit [GAP] step (section 4);
               17 open stops [GAP]/[ERR]/[UNK] (section 5); 2 closed statements; 43 observations.  No current claim
               is left without an explicit terminal.  No internal chain defect is open.
```

## 8. Entry for later work

```text
start   observe main / branch / HEAD / tree / status / ancestry; read docs/HANDOFF.md
before  re-run the D19 selection (section 6) against the then current environment; a DRIFT or an implementation change
        re-proves exactly the affected claims
next    an OWNER decision: the paused D12-predicted seed/broker qualification (renumbered after D19) or any row of
        docs/HANDOFF.md section 6
rule    earlier epochs, evidence and receipts are never edited; a new finding is a new delta with its own epoch
```
