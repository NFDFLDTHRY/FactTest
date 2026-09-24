# D26 - STABLE BASELINE (implementation baseline after the D21-D26 series)

STATUS: LIVE RECORD (written by D26-CLEAN-COMMISSIONING; supersedes design/materialization/D19-STABLE-BASELINE.md as the
baseline later work relies on; the D19 record stays as history)
LAW: design/materialization/D21-D26-WHOLE-REPO-EXECUTION-PROMPT.md (D26: implementation baseline); FACTORY-LAW.md

STABLE-BASELINE: ESTABLISHED

## 1. What later work may rely on

```text
source of record   the canonical tree at the D26 integration commit (design/materialization/LEDGER.md, D26 AFTER);
                   every mutation since D0 routed through the Factory (33 deltas + D26, each receipted and verified;
                   tests/audit/consistency-audit.mjs: FACTORY ROUTES = RECEIPTS / VERIFICATION)
execution          design/execution-manifest/CURRENT-EXECUTION-MANIFEST.md (generated at the base of D26): every
manifest           tracked path tiered, every live component with owner, consumers, station, tests, probes, claims
Factory            the judge built from the tree, witnessed against tests/factory/witnesses.json (every refusal
                   reason of the prompt; f00-f28) and the import collision witness (evidence/D26/factory/)
compiler           the qualified proof (27 obligations, HOST_NATIVE_SET 1.94.1 + WASM64_KERNEL_SET nightly-2026-09-24,
                   mutants refused) and the per-crate DAG (14 crates, focused + consumer tests); the wasm64 kernel
                   identity ef5d886aaf209752... under both install names (tests/toolchain/proof-sets.json); BUILD +
                   OBSERVE in Chromium byte-identical to host/factc (Q-WASM-08)
genericity         four specimens (fixtures/commissioning, fixtures/genericity/{ledger-mirror,pixel-vault,dual-stream})
                   through one compiler, one generic runtime (transfer(relation, bytes) by verified requirement), one
                   generic harness and observe; the attack list refused; the anti-cheat scan clean; evidence of one
                   bundle never evidence of another (strategy data identity in every tape)
physical runtime   every fresh bundle driven through its own shell in Chromium 141 headless shell with WebGPU
                   (SwiftShader fallback adapter), without WebGPU and cross-origin isolated by server headers; loss,
                   reselection, stale-plan invalidation, no runtime codegen, bundle unchanged; the selfhost primitives
                   (offline launch, OPFS-served app, IndexedDB, restart survival, worker) on the fresh bundle
environment graph  design/environment-map/graph.json = D11 origin + epochs D12..D26 (add-only; tests/envmap/envmap.mjs
                   validate 42 checks); Q22 is the entitled-claim surface (evidence/D26/envmap/queries/Q22.json)
records            docs/HANDOFF.md (current state, mutation law, entrypoint, procedure, document register,
                   open-boundary register, proof sets); the D<n> intended/observed pairs; this baseline
```

## 2. Environment this baseline was proved in (evidence/D26/identity; ENV-D26-*)

```text
host        Linux 6.18.44 x86_64, 4 logical CPUs, no GPU device node (SwiftShader fallback adapter only)
toolchains  HOST_NATIVE_SET rustc 1.94.1 (e408947bf); WASM64_KERNEL_SET nightly-2026-09-24 (6eeff9a52) + rust-src;
            node v22.22.2; git; Playwright 1.56.1
browser     HeadlessChrome/141.0.7390.37 (@9f043f63..., V8 14.1.146.11): default launch and the unsafe-WebGPU +
            SwiftShader flag set; executable /opt/pw-browsers/chromium_headless_shell-1194/.../headless_shell for the
            identity captures, /opt/pw-browsers/chromium-1194/chrome-linux/chrome for the physical webapp runs
sources     45 authority tips read (6 moved since D20: chromium, this repository, rust, v8, webcodecs, whatwg/html);
            the clause, reopen and ingress groups re-verified the exact clauses at the moved tips
egress      the policy proxy: github reachable; raw.githack.com, rawcdn.githack.com, nfdfldthry.github.io refused
            at CONNECT (the public-HTTPS boundary of FACT-D25-PUBLIC-HTTPS)
```

## 3. Entitled-claim surface (Q22 of the D26 graph)

```text
197 current facts: RUN 126, OBS 49, GAP 12, ERR 5, UNK 5; RUN claims 126 = 125 claimable + 1 invalidated; open
stops GAP 10, ERR 5, UNK 5 (2 closed by evidence); 101 claims re-proved in D26 (the STALE_IF selection: 169
evaluated, environment drift 70, implementation change 39, obligation 1); the six D26 facts [RUN] with D26 evidence
(FACT-D26-WHOLE-SYSTEM-COMMISSIONED, -CONSISTENT, -FINAL-CONDITION and the pass's process facts).  Any claim outside
this surface is not entitled; a RUN claim is claimable only while its STALE_IF conditions hold (Q22 recomputes)
```

## 4. Open stops (each a docs/HANDOFF.md section 6 row or an open issue of tests/manifest/issues.json)

```text
GAP   capability families never implemented (D12 B-01/B-02/B-05/B-13/B-17, threads, WGSL, hardware GPU, in-browser
      Rust: CAPABILITY-MATRIX.md); FACT-D24-RUNTIME-SELF-INTEGRITY (owner: I-33); persistent storage never granted
      in the headless shell (P07); the C14 contract text (owner: I-29)
ERR   station commands are OS programs (D12 B-03); browser-side items the D12 probes recorded as ERR
UNK   FACT-D25-PUBLIC-HTTPS (environmental: tests/physical/PUBLIC-HTTPS-PROBE.md); RUST_BUILD only on a host (D12 B-04);
      installed-Factory durability; the published authority hosts' own refusals (FACT-PUBLISHED-FRONTIER-D20)
OWNER I-12, I-13, I-18 (law text presentation and wording), I-29 (C14 text), I-33 (runtime self-integrity);
      historical evidence limits I-02, I-03, I-04, I-17 (class F); I-15 (D), I-16 (E)
every row is computed: docs/HANDOFF.md section 6, tests/manifest/issues.json (open issues: class D/E/F/G only),
Q22 explicit_stops (evidence/D26/envmap/queries/Q22.json)
```

## 5. When the baseline stops holding, and how to re-verify

```text
any change of a live component     STALE_IF repo.commit on the D21-D26 facts: tests/reprove/select.mjs re-selects
                                   them; tests/reprove/run-selected.mjs re-proves them through the runbook groups
                                   (qualified-proof + DAG, kernel-sections, physical, manifest, lineage, status,
                                   paths, identity, clauses, reopen, ingress); an unmapped selected claim is a [GAP]
a different toolchain or browser   the environment dimensions of tests/reprove/dimensions.json: DRIFT selects the
                                   facts bound to the drifted environment
a register change                  tests/audit/consistency-audit.mjs (the five equalities) and
                                   tests/audit/final-condition.mjs (the 21 lines) recompute; a FAIL line is a defect
                                   to repair through a delta, never a record to edit
an external run                    the public-HTTPS probe (tests/physical/PUBLIC-HTTPS-PROBE.md) closes
                                   FACT-D25-PUBLIC-HTTPS only through a delta that carries its evidence
```

## 6. Series D21-D26: closed

```text
D21  KNOW CURRENT SYSTEM            execution manifest, issue inventory (D21R: the builder's own-epoch defect repaired)
D22  TRUST FACTORY                  every refusal reason witnessed; six accepted attacks repaired in the judge
D23  TRUST COMPILER                 per-crate DAG, the wasm transport completed, Q-WASM-08
D24  TRUST GENERIC TRANSFORMATION   four specimens, the relay assumptions removed, three attacks repaired, evidence bound
D25  TRUST PHYSICAL RUNTIME         shell-driven physical runs with identity; the public-HTTPS boundary honest
D26  TRUST WHOLE SYSTEM             this commissioning: fresh builds, STALE_IF re-proof, consistency audit, final condition
FINAL CLAIM  CURRENT SOURCE -> FACTORY ROUTED -> IMPLEMENTATION EXECUTED -> GENERICITY ATTACKED -> PHYSICALLY OBSERVED
             -> STALE CLAIMS RE-PROVED -> CONSISTENCY AUDITED -> BOUNDARIES EXPLICIT
```
