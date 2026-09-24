# FactTest

STATUS: LIVE - model-independent entry.  Current state, mutation law, operating procedure, document register and the
open-boundary register: [docs/HANDOFF.md](docs/HANDOFF.md).  Constitution: [FACTORY-LAW.md](FACTORY-LAW.md).

FactTest is a governance-first foundry project for a `#![no_std]`, no-third-party-crate Rust compiler whose source language is AI-authored ASCII Systems Diagrams and whose generated target is a capability-parametric Chrome WebApp.

The ASCII Systems Diagram is the shared human/AI interaction layer and source of record.

Preparation:
- PASS1.md - identity/law/current authority
- PASS2.md - external constraint graph
- PASS3.md - bootstrap compiler substrate
- PASS4.md - ASCII human/AI language kernel
- PASS5.md - Factory/lowering/planning/verifier/codegen contracts
- PASS6.md - vertical commissioning specification and repairs

Pass 6 package:
- PASS6-GAP-REPAIRS.md
- COMMISSIONING-SLICE.md
- COMMISSIONING-ASCII.md
- COMMISSIONING-FIXTURE.md
- COMMISSIONING-TRACE.md
- COMMISSIONING-PROOF.md
- COMMISSIONING-RUNTIME.md
- COMMISSIONING-FACTORY.md
- PASS6-TESTS.md
- FINAL-HANDOFF-REQUIREMENTS.md

The six-pass preparation is complete and the machine has been materialized under Factory Law:

- factory/ - the Factory plane (StructuralDelta router, isolated git-worktree workpieces, station registry,
  receipts, independent verification, fast-forward integration gate, re-inspection).
- compiler/ - the `#![no_std]`, no-third-party-crate compiler kernel (foundation, source, semantic, capability,
  implementation, planning, verifier, codegen, bundle, observe, kernel, wasm-abi).
- host/ - the `factc` host driver and the browser harnesses (bootstrap ABI host, bundle probe).
- fixtures/ - language, negative and commissioning fixtures (the Byte Relay source, contract registry, metric
  evidence, model epochs, payloads are slice DATA).
- evidence/ - per-delta evidence packages, including the physical Byte Relay commissioning run.
- design/materialization/ - M0 intended-system ASCII, the materialization ledger (BEFORE/AFTER per delta), the
  commissioning record (PASS6-TESTS map) and the M9 observed-system ASCII.

Every implementation commit on the materialization branch was produced by the Factory itself
(`factory/receipts/<delta>/`), never by an agent writing to the canonical repository.


## Start here

1. [docs/HANDOFF.md](docs/HANDOFF.md) - current state, the next delta, how to route a delta through the Factory,
   which documents are live law and which are historical, and every open [ERR]/[GAP]/[UNK] with its class.
2. [FACTORY-LAW.md](FACTORY-LAW.md) - AGENT -> ASCII -> FACTORY -> WORKPIECE -> VERIFY -> REPO; never AGENT -> REPO.
3. [design/materialization/LEDGER.md](design/materialization/LEDGER.md) - BEFORE/AFTER of every delta (D0 onward).
4. [design/materialization/D19-STABLE-BASELINE.md](design/materialization/D19-STABLE-BASELINE.md) - the stable
   baseline after the D14-D19 technical reference review: what FactTest may rely on and how to re-verify it; the current
   claim surface of the joined model (after main's parallel D14 line) is in
   [design/materialization/D20-OBSERVED-MAIN-SYNC.md](design/materialization/D20-OBSERVED-MAIN-SYNC.md).
5. [design/execution-manifest/CURRENT-EXECUTION-MANIFEST.md](design/execution-manifest/CURRENT-EXECUTION-MANIFEST.md) -
   the current executable system enumerated (D21): every tracked path tiered, every live component connected; the issue
   inventory [tests/manifest/issues.json](tests/manifest/issues.json) classifies every finding before repair (D22-D26).

No session prompt is required: the entry is model-independent.  Proof sets and the toolchain pin are in
[tests/toolchain/proof-sets.json](tests/toolchain/proof-sets.json) and [rust-toolchain.toml](rust-toolchain.toml).

## History

- Former status line (M9, historical): "MATERIALIZED THROUGH THE FACTORY - BYTE RELAY PHYSICALLY COMMISSIONED
  (SwiftShader WebGPU + wasm64 in Chromium 141)".
  D18 correction (label audit LBL-07): the WebGPU in that line is SwiftShader's CPU fallback adapter under the unsafe
  WebGPU switch set in the Chromium 141 headless shell (chromium-headless-shell rev 1194), plus wasm64; no hardware GPU
  and no installed Chrome was ever observed.
- The original materialization session (historical) was bootstrapped by
  [FABLE-ASCII-SYSTEM-PROMPT.md](FABLE-ASCII-SYSTEM-PROMPT.md), the Fable 5.1 session bootloader (historical; kept
  unchanged apart from its D13 HISTORICAL banner).  It is not the entry for new work.
- Later deltas: D9 Rust/Cargo proof harness, D10-D11 computational environment map, D12 self-hosting architecture,
  D13 repository hygiene, D14-D19 technical reference review series (D14 authority frontier, D15 foundational clauses,
  D16 capability universe, D17 implementation reality, D18 repository reconciliation, D18R chain repair, D19 re-proof
  and stable baseline), a parallel D14 technical reference rescan on main (pull request #5: reference corpus in
  fixtures/reference/), joined by D20 main sync with a second re-proof; D21-D26 whole-repository execution + gap closure
  (D21 execution manifest); see the ledger.
