# D28-D33 - Six-part analysis and mapping series: owner requests and the approved plan (tracked verbatim)

STATUS: OWNER REQUESTS AND APPROVED PLAN, tracked verbatim by D28-PROMPT-INTAKE (base 2bbda62, the D27 integration) before
any part of the series is assembled.  The owner wrote the three requests below in the session that closed D27; the two
plan texts are the agent's, reproduced exactly as the owner saw them; the owner's "Proceed with pass 1" approves pass 1
under that plan.  Nothing here is law: FACTORY-LAW.md governs; the live target is
design/foundation-closure/FOUNDATION-CLOSURE-TARGET.md; each part is one StructuralDelta with its own intended ASCII.

## 1. Owner request (verbatim)

```text
Plan a 6 part analysis and mapping that will produce an implementation plan to get the repo functioning as intended.
```

## 2. Agent plan for the six parts (verbatim, as approved)

```text
Below is the plan. It is designed to run under the repo's own law (one StructuralDelta per part, intended ASCII first,
tools forged and registered, evidence bound to the graph), and to end with one machine-checked implementation plan
rather than six documents.

## What "functioning as intended" means, and where D27 left it

The repository's intent is the foundation-closure target (design/foundation-closure/FOUNDATION-CLOSURE-TARGET.md): an
installed Factory WebApp that continues Factory work, manufactures and qualifies its own successor, and evolves the
ASCII language. The measurable definition of done is the 16-step acceptance test in the registers. Today every step
needs the Linux host, and D27 mapped why: 30 blockers, an 8-delta sequence FC-1..FC-8, 5 open owner decisions, and one
boundary (RUST_BUILD) nobody has measured.

The sequence is correct in order but not yet buildable: each FC delta names blockers, not specifications. The six parts
below turn blockers into specifications, tests and exit criteria, then assemble the plan. They precede FC-1, so the
sequence register gets re-baselined in part 6 (the analysis parts become D28-D33; implementation starts at D34).

## The six parts

Each part is one delta with the same shape: a question, inputs that already exist as evidence, a data-driven tool that
produces a register, a mechanical check that the register is complete (an extension of
tests/closure/structural-check.mjs), a graph epoch, and the slice of the implementation plan it fixes.

1. D28 Decisions and constraints. Question: which open decisions and environment limits gate the plan, and what is the
   evidence-backed default for each? Inputs: the owner rows of the handoff register (D-1 home origin, D-2 app origins,
   D-3 RUST_BUILD, D-5 BUILD without registry, D-6 hash, D-8 seed replacement, D-9 history horizon, D-10 sensors),
   issues I-29/I-33/I-39, the public-HTTPS and persist() boundaries. Tool: a decision register with options, evidence
   per option, consequence on each FC delta, and a status of DECIDED / ASSUMED-DEFAULT. Check: every FC delta's
   dependency on a decision is explicit; no delta depends on an undecided one without a stated assumption. Plan
   contribution: the assumptions every later part builds on, and the list of external inputs only the owner or another
   environment can supply.

2. D29 Law-engine decomposition. Question: exactly which functions of the host Factory are pure law and which are host
   adapters? Inputs: the nine files of factory/src (ops, git, hygiene, model, paths, checks, identity, json, main), the
   witness register and f00-f28. Tool: a function-level census that classifies every function (pure law / git /
   process / filesystem / identity) and records its inputs and outputs as bytes, tree ids and verdicts. Check: 100
   percent of functions classified; every pure-law function has a verdict table derived from the witness scenarios.
   Plan contribution: the no_std law-crate API, the verdict-parity test design, and the object-store API the engine
   needs (specs for FC-2 and FC-3).

3. D30 Capability catalog. Question: what operation classes do all fixture and re-inspection commands reduce to, and
   which already have browser-capable code? Inputs: every fixture command of D0-D27 (the D12 census counted 152 for
   D0-D11), the reinspect commands, the node harnesses under host/harness and tests/{genericity,physical,selfhost}.
   Tool: a command census reducing each command to an operation class with input/output contracts, plus a residue list
   of commands that reduce to nothing. Check: residue empty or each residue item classified Linux-only with a reason;
   each class names its Linux adapter and its browser adapter (existing code or [GAP]). Plan contribution: the
   capability catalog, receipt schema 3, and the parity test for FC-4.

4. D31 Seed and generation state machine. Question: what is the exact seed, broker protocol, pointer schema and failure
   matrix, as executable cases? Inputs: the seed/TCB register, D12 sections 8-11, the P01-P16 probe records re-proved in
   D26. Tool: a formal state machine (states, transactions, attempts, deadlines, broker messages, manifest and pointer
   schemas) rendered from data, and the failure matrix as test cases each bound to the primitive that proves it
   possible. Check: every transition has a case; every case cites a current primitive fact; no generation-reachable
   path to pointers exists in the protocol. Plan contribution: the FC-1 test matrix and the FC-2 object-store layout.

5. D32 Language 2 and kernel capacity. Question: what does the first language evolution contain, and can the language
   describe a Factory-scale system? Inputs: the hardening register, the LANGUAGE 1 manifest and corpus oracle, parser.rs
   and ast.rs, limits.rs, the 8 include_str! templates. Tool: a proposal register for each LANGUAGE 2 candidate (version
   statement, source-role statement, vocabulary query ABI operation, expected-forms diagnostic, separate compilation by
   public contract) with grammar delta, corpus migration records and the derived unknown-keyword attack set; plus a
   capacity measurement that writes the target's own diagrams as source units and counts islands, objects and relations
   against the kernel limits. Check: every candidate has tests L38-L43 assigned and its migration rows enumerated; the
   capacity result is a number, not an estimate. Plan contribution: the FC-5 specification and the templates-as-data
   design for FC-6.

6. D33 RUST_BUILD measurement and plan assembly. Question: what can this environment measure about candidates
   B1/B4/B5, and what is the complete plan? Inputs: the rust-build register, the toolchain census, the pinned kernel
   identity. Tool: measure what is measurable here (peak memory and time of the pinned kernel build as a lower bound for
   any hosted toolchain, the closure of core the kernel actually uses, the B3 import receipt), and record what cannot be
   measured and why. Then assemble the plan register: one row per implementation delta with intended-ASCII outline,
   stations, may-change surfaces, tests, evidence, acceptance steps closed, exit criteria, dependencies and risks.
   Check: every open blocker appears in exactly one implementation delta or an explicit boundary; every acceptance step
   is closed by some delta or gated by a named decision. Plan contribution: the plan itself, rendered as a generated
   page beside the target, plus the re-baselined sequence and handoff.

## How the series closes and what happens first

The series is done when the plan register passes its structural check on the integrated tree, the six epochs are in the
graph, and the handoff names the first implementation delta with no unspecified blocker. Two laws carry over unchanged:
every part is tested before the next begins, and nothing is implemented during analysis except the tools that produce
the registers.

Rough size: parts 1 and 4 are register-and-ASCII work (a day each); parts 2, 3 and 5 forge census tools and are the
heaviest (two to three days each); part 6 is measurement plus assembly (two days).

First action, if you approve: track this plan verbatim as D28-PROMPT-INTAKE through the Factory, as was done for the
D21-D26 series, before any part begins.
```

## 3. Owner request (verbatim)

```text
Plan pass 1
```

## 4. Agent plan for pass 1 (verbatim, as approved)

```text
Pass 1 is the first part of the series: D28-DECISIONS-AND-CONSTRAINTS. Its job is to make every open owner decision and
every environment limit an explicit, evidence-backed row that the later passes and the implementation deltas can cite,
without deciding anything on the owner's behalf.

## Question, scope, inputs

The question it answers: which decisions and environment limits gate the implementation plan, what does the evidence say
about each option, and what default may the plan assume until the owner decides?

In scope: the eight owner decisions carried since D12 (D-1 home origin, D-2 generated-app origins, D-3 RUST_BUILD
strategy, D-5 BUILD without a registry, D-6 object hash, D-8 seed replacement, D-9 history horizon, D-10 sensor
routing), the owner issues (I-12, I-13, I-18 law wording, I-29 C14 text, I-33 runtime self-integrity), and the
environmental boundaries (public HTTPS, persist() in the headless shell, no installed Chrome, no GPU device, no wasm-host
rustc, Linux only, the egress policy). Out of scope: any implementation, any language change, any decision taken by the
agent.

Inputs that already exist: the boundary register in docs/HANDOFF.md section 6, the blocker and rust-build registers
under tests/closure/registers, the D12 probe facts (P03, P07, P08, P09), FACT-D25-PUBLIC-HTTPS with its deployable probe,
the toolchain census in evidence/D27, and the sequence register FC-1..FC-8.

## What the pass produces and how it is checked

Two new registers, one register extension, one tool extension, one epoch.

1. decisions.json. One row per decision: the options, the evidence for and against each (current graph facts and
   evidence paths only), the consequence of each option on each FC delta, the evidence-backed default, and a status from
   {DECIDED, ASSUMED-DEFAULT, OWNER-ONLY}. The defaults the evidence supports today, to be written as assumptions and not
   as choices: D-1 a dedicated origin (loopback is a secure context and serves every FC delta's evidence; githack and
   github.io are shared origins); D-2 one origin per generated app, probed in FC-8; D-3 import-only first (B3), FC-7
   measures B4 against B1/B5; D-5 refuse BUILD without a registry (NO_PLAN), routed as a compiler change under the
   evolution contract in FC-5; D-6 git SHA-1 for GitHub compatibility; D-8 seed replacement only as an origin event with
   owner approval; D-9 start the browser canonical state at a recorded tree, packfiles deferred to FC-8; D-10 not gating
   (no FC delta needs a sensor). The law-wording issues and I-33 are classified NOT GATING with the reason (the seed
   hash-checks every object it serves).
2. constraints.json. One row per environment limit: what it prevents, whether it is provable in this environment or only
   externally, the external procedure when external (the deployable-probe pattern of
   tests/physical/PUBLIC-HTTPS-PROBE.md, with an evidence schema), and which acceptance steps it touches. Expected
   result: public HTTPS, persist() and browser-update behaviour external; everything else provable here on loopback.
3. sequence.json gains a `decisions` field per FC delta, listing the decision ids it depends on and the assumption it
   runs under.
4. structural-check.mjs extended: every decision has at least two options with current-fact evidence; every consequence
   names an existing FC delta; every FC delta that depends on an OWNER-ONLY decision states an assumption; every
   constraint is either provable here with an evidence path or names its external procedure; every acceptance step
   touched by an external constraint says so. The check must pass on the integrated tree and its render joins
   CLOSURE-REGISTERS.md.
5. Epoch D28 with facts: decisions mapped [OBS], constraints mapped [OBS], external inputs pending [UNK] (one fact naming
   exactly what only the owner or another environment can supply), plus the pass's process facts from the STALE_IF
   re-proof.

Stations, in the D27 pattern: S-DOC (intended ASCII, ledger, records), S-FIXTURE (registers, the check extension, facts
spec, runbook entries), S-BROWSER (identity), S-EVIDENCE (selection, structural-check record, queries, audit), S-BUILD
(whatever the selector marks stale is re-proved; nothing else). No compiler, host, factory or law text changes, so no
S-RUST, S-ANNOTATE or S-LANGUAGE-LAW.

Invariants: the agent decides nothing (every default is ASSUMED-DEFAULT with evidence, and the owner can flip it by
editing one row through S-FIXTURE); no acceptance step is marked closer than D27 left it; history stays immutable; the
consistency audit recomputes PASS.

Exit criteria: the two registers complete, the structural check green with the new rules, every FC row carrying its
decisions, the handoff pointing at the decision register as the owner's action list, and the observed record matching
the intended one. Pass 2 (law-engine decomposition) then starts from a fixed set of assumptions instead of open
questions.

First action: track the six-part prompt verbatim as D28-PROMPT-INTAKE, then route D28-DECISIONS-AND-CONSTRAINTS. Both
are ready to start on your go.
```

## 5. Owner request (verbatim)

```text
Proceed with pass 1
```
