# ASCII Systems Factory Law

STATUS: PROJECT CONSTITUTION

This file carries the governing mutation law for FactTest.

## Working surface

USER + CHAT
    |
    v
ASCII SYSTEMS DIAGRAM
    |
    | assemble before materialization
    v
STRUCTURAL CHECK
    |
    +-- FAIL --> ASCII
    |
    '-- PASS --> FACTORY ROUTER
                    |
                    v
              ISOLATED WORKPIECE
                    |
                    v
               STATION(S)
                    |
                    v
                 VERIFY
                    |
             +------+------+
             |             |
           FAIL           PASS
             |             |
             v             v
           ASCII     INTEGRATION GATE
                           |
                           v
                    CANONICAL REPO
                           |
                           v
                    EXECUTE / PROBE
                           |
                           v
                       EVIDENCE
                           |
                           v
                    RE-OBSERVE SYSTEM
                           |
                           v
                         ASCII

## Canonical mutation law

```text
AGENT -> ASCII -> FACTORY -> WORKPIECE -> VERIFY -> REPO

NEVER:

AGENT ---------------------------------------------> REPO
```

## ASCII working-surface requirements

Before materialization, show enough to establish:

- components
- connections
- inputs and outputs
- ownership
- sequence
- invariants
- tests
- evidence requirements
- unresolved gaps

Status vocabulary:

- `[OBS]` existing/observed
- `[RUN]` witnessed in execution
- `[NEW]` proposed
- `[GAP]` required mechanism/tool missing
- `[ERR]` contradiction/failure
- `[UNK]` not established

## Structural check

Before routing work, verify:

- all required inputs are supplied
- outputs have consumers or explicit terminal roles
- types/contracts match
- forbidden bypasses are absent
- illegal cycles are absent
- invariants are represented
- tests/evidence obligations are attached

## Station contract

A STATION is a reusable bounded capability.
A FIXTURE is the job-specific instruction set for one workpiece.

Every station defines:

- INPUT
- OPERATION
- OUTPUT
- MAY READ
- MAY CHANGE IN WORKPIECE
- MUST NOT CHANGE
- PRECONDITIONS
- INVARIANTS
- VERIFICATION
- RECEIPT

If required machinery does not exist, mark `[GAP]`, forge reusable tooling, test/attack/qualify it, then register it before use.

## Integration law

Independent verification checks:

- authorized surfaces only
- contracts preserved
- invariants preserved
- consumers remain valid
- tests pass
- materialized delta matches approved ASCII

The integration gate additionally checks:

- canonical base has not moved
- receipts are valid
- verification is valid
- only the authorized delta is present

After integration:

```text
execute/probe -> evidence -> observed ASCII
```

If intended and observed structure differ, preserve the disagreement as `[ERR]` or `[GAP]`.
Never rewrite the drawing merely to hide disagreement.
