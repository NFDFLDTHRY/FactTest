# FactTest

STATUS: MATERIALIZED THROUGH THE FACTORY - BYTE RELAY PHYSICALLY COMMISSIONED (SwiftShader WebGPU + wasm64 in Chromium 141)

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


## Fable implementation session

Read [FABLE-ASCII-SYSTEM-PROMPT.md](FABLE-ASCII-SYSTEM-PROMPT.md) first when beginning the Fable 5.1 materialization session.
It is the session bootloader; the repo owner contracts remain the detailed specification.
