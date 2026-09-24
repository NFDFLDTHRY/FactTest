You are taking over "NFDFLDTHRY/FactTest" after the D11 computational-environment mapping pass.

Your task is NOT to immediately implement self-hosting.

Your task is to rigorously determine what it would mean, what machinery is missing, and what minimum architecture is required for the installed Factory WebApp to become genuinely self-hosting.

CURRENT REPO STATE

Start by re-observing the repository yourself.

Important recent authority:

- D9 qualified the Rust/Cargo proof harness.
- D10 installed the computational-environment mapping prompt through the Factory.
- D11 materialized the computational environment map.
- D11 branch head was "fdb9c32d1346408f184ccf0cc4880112282f164e" when handed off.
- Do not assume that is still HEAD. Observe first.
- Do not trust this prompt over the repository if the repo has moved.

READ FIRST

1. "FACTORY-LAW.md"
2. "FACTORY-CONTRACTS.md"
3. "FINAL-HANDOFF-REQUIREMENTS.md"
4. "design/materialization/D10-COMPUTATIONAL-ENVIRONMENT-MAP-PROMPT.md"
5. "design/materialization/D11-INTENDED-ENVIRONMENT-MAP.md"
6. "design/materialization/D11-OBSERVED-ENVIRONMENT-MAP.md"
7. "design/environment-map/ENVIRONMENT-MAP.md"
8. "design/environment-map/SCHEMA.md"
9. "design/environment-map/TRACEABILITY.md"
10. "design/environment-map/graph.json"
11. "design/materialization/D9-INTENDED-PROOF-HARNESS.md"
12. "design/materialization/D9-OBSERVED-PROOF-HARNESS.md"
13. current Factory source, station registry, compiler/host surfaces and generated WebApp machinery

Preserve every existing "[RUN]", "[OBS]", "[ERR]", "[GAP]", "[UNK]".

Do not erase disagreement merely because a new architecture would make it inconvenient.

CANONICAL MUTATION LAW

AGENT → ASCII → FACTORY → WORKPIECE → VERIFY → REPO

NEVER:

AGENT -------------------------------------> REPO

FIRST PHASE IS ASCII ASSEMBLY ONLY.

Do not modify production machinery until the intended self-hosting system has been assembled and structurally checked.

────────────────────────────────────────────────────────────

QUESTION TO ANSWER

What minimum capabilities must move from the current Linux/Git/process-hosted Factory environment into browser-native machinery so that, once installed, the Factory WebApp can manufacture, verify, activate and recover its own successor without requiring the original server?

────────────────────────────────────────────────────────────

DEFINE SELF-HOSTING PRECISELY

Do not collapse these into one claim:

L0  installed PWA launches offline

L1  installed Factory locally serves/stores generated WebApps

L2  installed Factory owns its working state locally and can:
      ASCII → compile → verify → execute
    without the original server

L3  installed Factory can manufacture a replacement Factory:
      Factory N
        → build candidate N+1
        → verify N+1
        → execute qualification
        → activate N+1
        → rollback to N if startup/qualification fails

L4  Factory also independently owns/synchronizes canonical Git history
    without depending on the original Linux/Git host

Treat L3 as the target definition of genuine self-hosting unless the repository establishes a better definition.

L4 may remain a separate later boundary if appropriate.

Do not claim self-hosting merely because Service Worker caching allows offline launch.

────────────────────────────────────────────────────────────

ASSEMBLY MODEL

Begin with something approximately like:

╔══════════════════════════════════════════════════════════════════════╗
║                  FACTORY WEBAPP SELF-HOSTING                       ║
╚══════════════════════════════════════════════════════════════════════╝

                       INSTALLED FACTORY N
                              │
                              ▼
                         ASCII CHANGE
                              │
                              ▼
                      FACTORY CORE LAW
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
       REPOSITORY         EXECUTION          STORAGE
        ADAPTER            ADAPTER           ADAPTER
            │                 │                 │
            ▼                 ▼                 ▼
      local Git-like      browser/Wasm        OPFS /
       object model        capabilities       IndexedDB
            │                 │                 │
            └─────────────────┼─────────────────┘
                              ▼
                       ISOLATED CANDIDATE
                           FACTORY N+1
                              │
                              ▼
                           VERIFY
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
                  FAIL                 PASS
                    │                   │
                    ▼                   ▼
              preserve N          qualify N+1
                                        │
                                        ▼
                                 transactional
                                   activation
                                        │
                          ┌─────────────┴─────────────┐
                          ▼                           ▼
                    startup good                 startup bad
                          │                           │
                          ▼                           ▼
                    Factory N+1                rollback N

────────────────────────────────────────────────────────────

DO NOT ASSUME CURRENT OS MECHANISMS ARE FUNDAMENTAL

For every current Factory operation, separate:

SEMANTIC REQUIREMENT
        ≠
CURRENT LINUX IMPLEMENTATION

For example:

git worktree
    may actually mean:
    "isolated mutable tree based on canonical object identity"

git diff-tree
    may actually mean:
    "deterministic tree comparison"

git commit
    may actually mean:
    "content-addressed immutable tree + parent + metadata"

git merge --ff-only
    may actually mean:
    "atomic canonical-ref movement only if base is unchanged"

cargo / rustc
    may actually mean:
    "RUST_BUILD capability"

process spawn
    may actually mean:
    "invoke a bounded registered station capability"

Determine which current mechanisms are incidental adapters and which are genuine architectural dependencies.

────────────────────────────────────────────────────────────

USE D11 AS THE DEPENDENCY GRAPH

Do not brainstorm browser capabilities from memory first.

Use "design/environment-map/graph.json" and its traversal machinery to derive the Factory's current environmental dependencies.

For each current operation identify:

- required authority
- computational requirement
- current implementation
- environment dependency
- probe/evidence
- stale conditions
- browser-native replacement candidate
- current status:
  "[RUN]", "[GAP]", "[ERR]", "[UNK]"

Add missing relationships only through the ASCII working surface.

────────────────────────────────────────────────────────────

MAP THESE FACTORY FUNCTIONS

At minimum decompose:

1. CANONICAL STATE
   
   - canonical ref
   - commit identity
   - tree identity
   - parent lineage
   - base-unmoved test

2. WORKPIECE
   
   - isolated tree
   - copy-on-write semantics
   - authorization boundaries
   - cleanup/recovery

3. STRUCTURAL DELTA
   
   - intake
   - path authority
   - required capabilities
   - invariants
   - evidence requirements

4. STATIONS
   
   - station registry
   - fixture binding
   - capability invocation
   - current arbitrary-process dependence
   - browser-native operation dispatch

5. VERIFICATION
   
   - tree comparison
   - receipts
   - invariant checking
   - independent verifier
   - evidence indexing

6. COMPILER
   
   - existing wasm64 kernel
   - browser execution
   - missing compilation layers
   - whether current FactTest compiler can compile the Factory itself
   - what still depends on rustc/Cargo outside the browser

7. GENERATED WEBAPP HOSTING
   
   - Service Worker
   - CacheStorage
   - OPFS
   - IndexedDB
   - virtual request routing
   - locally generated/imported application objects

8. PERSISTENCE
   
   - canonical objects
   - workpieces
   - evidence
   - source
   - authority graph
   - rollback generations

9. UPDATE / ACTIVATION
   
   - candidate version
   - qualification
   - atomic activation
   - startup checkpoint
   - rollback

10. RECOVERY
    
    - corrupt active Factory
    - interrupted update
    - bad candidate
    - bad Service Worker
    - storage corruption
    - schema migration failure

11. NETWORK / REMOTE SYNC
    
    - optional GitHub synchronization
    - fetch/push authority
    - offline operation
    - divergence handling

────────────────────────────────────────────────────────────

SELF-HOSTING MUST INCLUDE ROLLBACK

Do not design self-modification as overwriting the active application.

Prefer an A/B or immutable-generation model:

IMMUTABLE BOOTSTRAP
      │
      ├── active generation pointer
      ├── previous known-good generation
      ├── candidate verification state
      └── startup/recovery logic
      │
      ▼
FACTORY GENERATION N
      │
      ▼
FACTORY GENERATION N+1

The immutable bootstrap should be as small as possible.

Determine the smallest seed capable of:

- finding active generation
- verifying object identity
- detecting failed activation/startup
- selecting previous known-good generation
- launching the chosen Factory

Do not put the entire Factory into the immutable seed.

────────────────────────────────────────────────────────────

IMPORTANT BROWSER BOUNDARIES

Investigate rather than assume:

- Service Worker as virtual request router
- OPFS persistence
- IndexedDB metadata/indexing
- CacheStorage shell/update behavior
- browser-origin stability
- storage persistence/quota
- browser update effects
- WebAssembly execution
- worker availability
- cross-origin isolation
- SharedArrayBuffer/threading
- browser-native Git/object-store feasibility
- GitHub API access from installed origin
- credential/security model
- offline operation
- atomic activation semantics
- recovery after a broken Service Worker

Use actual current authority and physical probes where needed.

────────────────────────────────────────────────────────────

STATION ABSTRACTION QUESTION

Pay special attention to this:

Current fixtures invoke OS programs:

program = cargo
program = rustc
program = git
program = node
...

Determine whether self-hosting requires stations to move toward:

STATION
    operation_class / capability_id
             │
       ┌─────┴─────┐
       ▼           ▼
 Linux adapter   Browser adapter

Example:

RUST_BUILD
   ├─ Linux → cargo/rustc
   └─ Browser → browser-native compiler machinery

Do not implement this merely because it looks elegant.

Prove whether it is necessary.

────────────────────────────────────────────────────────────

BOOTSTRAP / REPRODUCTION TEST

A genuine L3 self-host should eventually be able to perform something like:

Factory N
    │
    ├─ reads its own authoritative source
    │
    ├─ produces candidate Factory N+1
    │
    ├─ verifies N+1 using machinery not supplied by N+1
    │
    ├─ runs Factory-law self tests
    │
    ├─ asks N+1 to manufacture a known specimen
    │
    ├─ compares resulting semantics/evidence
    │
    └─ activates N+1 only after qualification

Identify what must remain externally trusted to make this non-circular.

Explicitly map the trusted computing base.

────────────────────────────────────────────────────────────

TRUSTED COMPUTING BASE

Produce a proposed minimal TCB.

At minimum consider:

- browser
- immutable bootstrap
- cryptographic hash implementation
- persistent storage substrate
- currently active Factory verifier
- compiler bootstrap
- Git/object semantics
- authority graph

Mark circular trust.

Example:

Factory N verifying Factory N+1       acceptable

Factory N+1 verifying itself only     insufficient

compiler built by candidate used as
sole proof candidate compiler works   circular

────────────────────────────────────────────────────────────

REQUIRED QUESTIONS

The ASCII system must make these answerable:

- What exactly prevents L3 self-hosting today?
- Which blockers are architectural versus merely unimplemented?
- Which current Factory operations fundamentally require Linux?
- Which can be expressed as browser-native deterministic state transitions?
- Can Git semantics be retained without the git executable?
- Does canonical state require GitHub or only Git-compatible objects?
- Can generated WebApps be served entirely from persisted local objects?
- Can the Factory build its own successor with the existing compiler?
- If not, what compiler/bootstrap layer is missing?
- What is the minimum immutable seed?
- What is the rollback mechanism?
- What survives browser restart?
- What survives offline use?
- What happens when the browser version changes?
- What evidence becomes stale after a Factory update?
- How does a candidate prove it did not mutate authoritative source?
- How is base movement handled while offline?
- Can remote synchronization be deferred until after local self-hosting?

────────────────────────────────────────────────────────────

DO NOT REPAIR D9/D11 GAPS INCIDENTALLY

Existing open findings include things such as:

- native workspace build/clippy mismatch
- unpinned Rust toolchain
- weak legacy Factory no_std/depcheck heuristics
- literal wildcard station authority issue
- authority fragment drift
- incomplete earlier environment identity
- hardware GPU unknown
- WGSL unprobed
- shared/threaded Wasm not admitted
- broad capability-map gaps

They may matter to self-hosting.

Map their effects.

Do not silently repair them during the architecture pass.

────────────────────────────────────────────────────────────

EXPECTED FIRST PASS OUTPUT

Before implementation, produce:

1. intended self-hosting ASCII system
2. current Factory dependency decomposition
3. browser-native replacement matrix
4. trusted computing base
5. immutable bootstrap boundary
6. generation/update/rollback design
7. local repository/object-store model
8. station execution abstraction analysis
9. compiler/bootstrap dependency analysis
10. L0/L1/L2/L3/L4 status table
11. blockers classified "[RUN]/[GAP]/[ERR]/[UNK]"
12. explicit tests/evidence required to promote each level
13. structural check

Do not materialize implementation until the structural check passes and the ASCII explicitly identifies the next bounded delta.

────────────────────────────────────────────────────────────

SUCCESS CRITERION FOR THIS PASS

Not:

"We have a plan for a PWA."

Not:

"The app works offline."

But:

We can point to the exact remaining boundary between
the currently installed Factory and a Factory that can
reproduce, independently verify, transactionally activate,
and recover its own successor.

If that boundary is larger than expected, preserve it.

Do not design around inconvenient evidence.

Let the machine tell us what machine is still missing.

────────────────────────────────────────────────────────────
OWNER FOLLOW-UP DURING THE PASS (same session, verbatim):

Use Githack, remember? We already had a secure context testing path identified.
