# D13 - PRE-RESCAN-BASELINE

STATUS: BASELINE RECORD for the D14 technical reference rescan (written by D13-REPO-HYGIENE, workpiece W14)
LAW: design/materialization/D13-REPO-HYGIENE-PROMPT.md, SUCCESS CONDITION: "Every remaining ERR/GAP/UNK truthfully
represents an external, historical, capability or owner-decision boundary rather than a broken internal FactTest
chain."  The integration commit of this baseline is recorded by the next delta in design/materialization/LEDGER.md.

PRE-RESCAN-BASELINE: ESTABLISHED

## 1. What the rescan may rely on

```text
Factory chain      literal path authority enforced at delta/fixture/station level; S-FIXTURE v2; receipts carry
                   environment identity from the next delta on (format 2; D13's own receipts are format 1 because the
                   judge is built from the D13 base); verification records the verifier binary sha256; workpiece
                   audit/retire available; only W14 (and the kept W11-stage, factory-bootstrap-bin) remain under the
                   workpiece root
Proof chain        HOST_NATIVE_SET 1.94.1 and WASM64_KERNEL_SET nightly-2026-09-24 pinned and re-proven (21/21
                   weight-bearing obligations PASS, mutants 8/8 RUN); heuristics weight NONE; runner
                   tests/toolchain/run-qualified-proof.sh
Knowledge chain    docs/HANDOFF.md (live, model-independent); design/environment-map/graph.json = D11 + D12 + D13 epochs,
                   302 nodes / 641 edges, validated, Q01-Q16; law-file citations of js-api #internal-storage annotated
                   in place (history preserved, certainty removed)
Status chain       tests/hygiene/status-scan.mjs: 1037 occurrences, 0 unclassified, defect patterns within bounds
```

## 2. What the rescan must reopen (class D, carried unchanged)

```text
D-R1  js-api #internal-storage: 5 law citations + fixtures/commissioning/contracts.ascii (FRAGMENT_DRIFT [ERR] at the
      WebAssembly/spec@608711107b pin; published alias [UNK])
D-R2  37 of 48 D11 authority nodes and all 16 D12 authority nodes: published renderings never re-opened (DENIED);
      consequences come from sources pinned by commit and sha256
D-R3  D12 authorities cite source line numbers, not published fragments (fragment_status NOT_CITED)
D-R4  CONFLICT-LEDGER / CONSTRAINT-LEDGER rows marked [ERR]/[GAP]/[UNK]; Q09 authorities without probes; Q12 coarse
      citations (whole-page roots: rustc wasm64 page, WGSL)
D-R5  network: published authority hosts and githack denied in this environment (B-19); the rescan needs the owner's
      network policy to admit them, or it stays source-pinned [UNK]
```

## 3. What the rescan must not mistake for defects (classes B, C, OWNER)

```text
C     capability gaps listed in docs/HANDOFF.md section 6 (self-hosting L0-L4, ABI exports, WGSL, hardware GPU,
      threads, storage durability, kernel install-path identity, verifier source provenance)
B     historical records: D0-D12 receipts/evidence identity, D3-D8 overstatement, D1-D8 heuristic gates, scratch-only
      route scripts and graph generator, W11-stage, factory-bootstrap-bin
OWNER D-1, D-2, D-3, D-5, D-6, D-8, D-9; remote branch deletion; renumbering of the paused seed/broker qualification
```

## 4. Entry for D14

```text
start      observe main / branch / HEAD / tree / status / ancestry; read docs/HANDOFF.md
inputs     this record; design/environment-map/graph.json (AUTHORITY nodes with reopen_status, fragment_status,
           reproducibility_pin); REFERENCE-AUTHORITY.md; the D-rows above
rule       a reopened authority becomes a new epoch file (design/environment-map/epochs/D14.json) merged by
           tests/envmap/envmap.mjs; D11-D13 nodes are never edited; law-document corrections go through S-ANNOTATE
           (insertion-only) or an owner-approved law delta
stop       if any internal chain defect is found that could mislead the rescan: DO NOT continue D14; return to ASCII
```
