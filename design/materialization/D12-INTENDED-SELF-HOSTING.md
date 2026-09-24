# D12 - Intended Self-Hosting Factory ASCII (architecture pass)

STATUS: ASCII ASSEMBLY ONLY - no production machinery changed by this pass
DATE: 2026-09-24
BASE: f71c59b5ec6e0095294549c660884ddbd1a26dd7 (main = merge of PR #2; tree ed738d61 identical to D11 head fdb9c32)
REQUEST: design/materialization/D12-SELF-HOSTING-PROMPT.md (tracked verbatim by this delta)
LAW: FACTORY-LAW.md, FACTORY-CONTRACTS.md, FINAL-HANDOFF-REQUIREMENTS.md, D10 prompt invariants, D11 map

Question: what minimum capabilities must move from the Linux/Git/process-hosted Factory into browser-native machinery
so that an installed Factory WebApp can manufacture, verify, activate and recover its own successor without the
original server?  This file answers it from the repository, the D11 graph, pinned authority sources and physical
Chromium probes.  It preserves every earlier [RUN]/[OBS]/[ERR]/[GAP]/[UNK].  It implements nothing.

## 0. Observation before drawing

### 0.1 Repository and premise

[OBS] PR #2 (D9-D11) was merged to main as f71c59b.  The designated branch had only merged history and was
      fast-forwarded to f71c59b.  HEAD at assembly = f71c59b, working tree clean.
[OBS] THERE IS NO FACTORY WEBAPP.  The Factory is `factory/` (Rust std crate, 1963 lines, one path dependency on
      factc-foundation) driven from a Linux shell.  The only WebApp in the repository is generated object B (the
      Byte Relay bundle: index.html, runtime/selector/membrane JS, wasm64_relay.wasm, manifest, sw.js), produced by
      the native host driver `factc`.  Every self-hosting level below is therefore measured against machinery that
      mostly does not exist yet.  This is the first boundary, not a detail.
[OBS] Factory state operations are git subprocesses (factory/src/git.rs): rev-parse, show <base>:<path>,
      cat-file -e, add -A + write-tree under a temporary GIT_INDEX_FILE, diff-tree -r --name-only,
      worktree add --detach, add -A + commit, merge --ff-only, status --porcelain.
[OBS] Station execution is process spawn (factory/src/ops.rs run_command): program + args + env + cwd, verdict = exit
      code.  Census over every fixture D0-D11 (138 commands) and every re-inspection command (14):
        sh 47 | cargo 35 | factory binary (absolute path) 22 | node 13 | grep 12 | git 5 | rustc 3 | test 1
        re-inspection: cargo 9 | sh 3 | node 2
        inside the 47 `sh -c` strings: grep 37, node 13, awk 2, ls, wc, cp, sort ...
      Zero of the 152 commands are executable by a browser (the web platform exposes no process spawn).
[OBS] Stations do not author anything.  Between `station open` and `station close` the agent writes files into the
      workpiece; the Factory snapshots the tree before and after, runs the fixture's check commands, and judges the
      changed paths against authority.  Confinement is DETECTION (tree comparison after the fact), not prevention:
      station commands run as the same OS user with full filesystem access.
[OBS] The verifier that judges delta N is whatever `factory` binary the operator built.  The route scripts build it
      from the canonical HEAD (so N verifies N+1 by practice), but no receipt records the verifier's identity.  The
      fixtures also call a second binary at /home/user/factory-target/debug/factory whose provenance is unrecorded.
      [GAP] verifier provenance.
[OBS] Workpiece state files (W<n>.state.json, including failed station runs) live outside the tree and are never
      committed; 12 worktrees W0..W11 remain attached; nothing cleans them up.  [GAP] workpiece cleanup and audit
      durability.
[OBS] GitHub is not part of Factory law today: the canonical ref is a local branch; the agent pushes; the owner
      merges pull requests on GitHub, which moves `main` outside the Factory.  Remote synchronization is already a
      separate, unlawed boundary.
[OBS] Compiler surfaces: the wasm64 kernel exports 13 symbols (query_abi_version, query_required_workspace,
      input/output buffer ptr/len, submit_source_bytes, submit_machine_state, check_or_compile, read_diagnostics,
      read_artifact_metadata, reset_workspace, memory).  The kernel's own ABI (compiler/kernel/src/abi.rs) also has
      submit_contracts, submit_metrics, submit_evidence_tape, observe, read_artifact, bundle_file - NOT exported.
      Codegen templates (membrane, adapters, selector, runtime, index.html, manifest, sw.js) are compiled into the
      kernel with include_str!: changing generated-WebApp host code requires recompiling the kernel.

### 0.2 Network and authority access

[OBS] Published authority hosts remain DENIED by the environment's network policy (gpuweb.github.io, w3c.github.io,
      doc.rust-lang.org, ...).  api.github.com answered 200 in this session (it was denied during D11): the
      network_egress.policy dimension moved, which D11 records as a STALE_IF condition.
[OBS] raw.githack.com / rawcdn.githack.com: DENIED (proxy 403 on CONNECT).  The githack HTTPS path requested by the
      owner as the secure-context testing path could not be exercised in this session.  It is not recorded in the
      repository or this session's transcript; it is carried below as a required evidence step with status [UNK].
[OBS] New authority sources pinned by commit (published renderings not re-opened; same method as D11):
        w3c/ServiceWorker@2f5ec0663a index.bs      Update: "Set request's service-workers mode to none" (line 2821);
                                                  Install: installFailed -> installing worker redundant, newest kept
                                                  (2994-2998); Register: script URL must be potentially trustworthy and
                                                  same origin (2759-2765); stale after 86400 s (281); note: sandboxed
                                                  iframes without allow-same-origin have no active service worker (353)
        whatwg/fs@cd55e5582e index.bs             FileSystemHandle [Exposed=(Window,Worker), SecureContext];
                                                  createSyncAccessHandle [Exposed=DedicatedWorker] (429-434)
        whatwg/storage@1933f424de storage.bs      bucket mode "best-effort" | "persistent" (364); under storage pressure
                                                  the UA should clear best-effort buckets (568-572); persist() is
                                                  [Exposed=Window] (619)
        w3c/IndexedDB@f70491894a index.bs          transaction = atomic and durable set of operations (882); durability
                                                  hint strict | relaxed | default (928, 2491)
        w3c/web-locks@a61a77307d index.bs         [SecureContext, Exposed=(Window,Worker)] (357, 578)
        whatwg/compression@770f314342 index.bs     "deflate" = ZLIB Compressed Data Format RFC1950 (40-45)
        w3c/webcrypto@811c24c69e spec/Overview.html  digest recognizes SHA-1 and SHA-256
        whatwg/html@cd8ac6f1bb source              sandboxed origin browsing context flag forces an opaque origin
                                                  (96158-96162); cross-origin isolation from COOP same-origin-plus-COEP;
                                                  SharedArrayBuffer serialization requires cross-origin isolated
                                                  capability (10512-10520)
        git/git@0f8e75abeb Documentation           object name = SHA-1 of "<type> <size>\0" + content, zlib-deflated
                                                  (user-manual.adoc 4082-4097); update-ref <new> <old> updates only if
                                                  the current value is <old> (git-update-ref.adoc 23-27);
                                                  gitformat-pack.adoc; hash-function-transition.adoc (SHA-256 chosen)
        w3c/manifest@8ae3046968 index.html         any website is an installable web application; installation is
                                                  UA behaviour, not manifest proof (2612-2615)

### 0.3 Physical probes (tests/selfhost/primitives-probe.mjs; Chromium HeadlessChrome/141.0.7390.37
###     revision @9f043f63b0e5, V8 14.1.146.11; Playwright persistent profile; origin http://127.0.0.1:47311)

```text
ID   QUESTION                                                         RESULT                                                VERDICT
P01  generated bundle offline from its own SW                         index + runtime + wasm64 served from its versioned    [RUN]
                                                                      CacheStorage with the server stopped, relay exact,
                                                                      again after a browser restart
P02  can a SW replace its own script from local bytes                 NO: the update fetch bypasses the SW (the SW would     [RUN]
                                                                      have answered v2; the origin's v1 was used); with the
                                                                      origin gone update() rejects; active stays v1
P03  storage across restart; what scopes it                           OPFS, IndexedDB, CacheStorage, localStorage survive    [RUN]
                                                                      restart on the same origin; port 47312 on the same
                                                                      host and profile sees none of it
P04  generated WebApp served from OPFS by a SW router                 HTML + JS modules + wasm64 from OPFS via SW, server    [RUN]
                                                                      stopped, relay exact, again after restart
P05  cross-origin isolation granted by the SW                         COOP/COEP on SW-synthesized navigation: crossOrigin-   [RUN]
                                                                      Isolated true, SharedArrayBuffer and shared
                                                                      WebAssembly.Memory available (precondition only)
P06  atomic generation pointer / CAS ref in IndexedDB                  aborted multi-key tx left pointers intact; two         [RUN]
                                                                      concurrent CAS from g1: exactly one winner
P07  persistent storage                                               persist() false; bucket stays best-effort              [GAP]
P08  candidate confinement                                            opaque sandbox: IDB/OPFS/Cache/SW/localStorage         [RUN]
                                                                      SecurityError, origin fetch TypeError; still secure
                                                                      context, navigator.gpu, memory64, workers.  A
                                                                      same-origin frame reaches everything.
P09  git identity without the git executable                          880/880 blob ids, HEAD tree ed738d61 and commit        [RUN]
                                                                      f71c59b recomputed; 6/6 loose objects inflated and
                                                                      verified; browser-built commit == git commit-tree;
                                                                      browser-written loose object read by git
P10  wasm64 kernel in a dedicated worker                              runs; ANALYZE and BUILD status OK; BUILD emitted only  [OBS]
                                                                      CANONICAL_ASCII, TYPED_SYSTEM_IR, CAPABILITY_IR (no
                                                                      registry can be submitted); 6 ABI operations absent;
                                                                      Web Locks and OPFS sync handles available in workers
P14  broken SW recovery                                               a SW answering Response.error() blocks every           [RUN]
                                                                      navigation in scope even with the origin up; offline no
                                                                      page can unregister it; recovery needed the origin
P15  SW update interrupted by browser shutdown                        previous worker still active after restart              [RUN]
P16  confined generation fed only by a broker                         offline, inline-bootstrapped opaque frame imported its  [RUN]
                                                                      module from a broker-sent blob and ran the wasm64 relay
                                                                      exactly; the same frame loaded BY URL never loaded
                                                                      offline (opaque frames have no active SW)
GH   GitHub from a browser origin (host-side HTTP observation)         api.github.com: Access-Control-Allow-Origin: *;        [OBS]
                                                                      github.com smart-HTTP info/refs: no ACAO header;
                                                                      OPTIONS preflights answered 405 through the
                                                                      intercepting egress proxy                               [UNK]
KRN  kernel rebuilt today with nightly 6bb1652a0 from the D9-identical  3,350,085 bytes sha256 a1bb6f86...; D9 (nightly        [OBS]
     compiler tree                                                    6eeff9a52): 3,350,252 bytes sha256 30958994...
                                                                      -> compiled identity follows the unpinned toolchain
```

## 1. Self-hosting levels (never collapsed)

```text
L0   installed PWA launches offline
L1   installed Factory locally serves / stores generated WebApps
L2   installed Factory owns its working state locally and runs ASCII -> compile -> verify -> execute, no server
L3   installed Factory manufactures its replacement:
       Factory N -> build candidate N+1 -> verify N+1 -> qualify -> activate N+1 -> rollback to N on failure
     L3-A  the successor may change every non-compiled object (UI, law engine source if interpreted, data, registry,
           authority graph, templates once they are data); compiled objects (the wasm64 kernel) are REUSED by
           identity or IMPORTED with external build provenance and qualified in the browser
     L3-B  the successor may change compiled objects and rebuilds them inside the browser
L4   the Factory owns and synchronizes canonical Git history without the original Linux/Git host
```

L3 remains the target definition.  The repository shows that L3 splits on one question - who compiles the compiled
objects - so both halves are carried.  L3-A is the smallest claim that deserves the word self-hosting; L3-B is full
self-hosting.  Neither is claimed.  L4 is a separate, later boundary.

## 2. Intended self-hosting system

```text
╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                 FACTORY WEBAPP SELF-HOSTING (intended)                                        ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════╝

 HOME ORIGIN  https://<dedicated host>  (identity = scheme+host+port, P03; must NOT be shared: see 7, D-1)
 │
 │  (origin server needed ONLY to install or replace the seed: P02, P14, P15)
 ▼
┌─ IMMUTABLE SEED  (service worker script + inline broker page; the only code never replaced from local objects) ─┐
│  boot:   read pointers {active, previous_good, pending{gen, attempts, deadline}} from IndexedDB (atomic, P06)     │
│  serve:  generation objects by content id from OPFS, sha256-checked on read (WebCrypto)                           │
│  host:   top-level broker page = seed-owned; generation runs in an opaque sandboxed frame bootstrapped INLINE    │
│          (srcdoc), fed code/wasm/data ONLY by postMessage (P08, P16)                                              │
│  broker: object get / put-once (content-addressed), pointer PROPOSE-pending only, canonical-ref CAS only         │
│  recover: built-in recovery view (no generation code): list generations, select previous_good, export objects   │
│  never:  compile, verify law, run stations, talk to GitHub, hold credentials in generation reach                 │
└──────────────────────────────────────────────┬────────────────────────────────────────────────────────────────┘
                                               │ inline bootstrap + postMessage
                                               ▼
┌─ FACTORY GENERATION N  (confined, opaque origin; secure context; gpu; memory64; workers - P08) ─────────────────┐
│  UI (ASCII working surface)          FACTORY CORE LAW (deterministic; no I/O of its own)                        │
│      │                                  delta check | fixture authority | station open/close | verify |       │
│      ▼                                  integrate (CAS) | re-inspect                                           │
│  ASCII CHANGE ──► StructuralDelta ──────────────┬───────────────────────────────┬──────────────────┐          │
│                                                 ▼                               ▼                  ▼          │
│                                        REPOSITORY ADAPTER               EXECUTION ADAPTER     STORAGE ADAPTER  │
│                                        git-compatible objects           capability ops:       broker messages │
│                                        (P09) + CAS refs (P06)           TREE_SNAPSHOT,        -> OPFS objects │
│                                        workpiece = overlay on           TREE_DIFF, AUTHORITY, -> IDB pointers │
│                                        base tree id                     FILE/JSON_ASSERT,        (seed-owned) │
│                                                                         KERNEL_BUILD (wasm64,               │
│                                                                         worker: P10), WASM_INSPECT,          │
│                                                                         EVIDENCE_INDEX, QUALIFY, PROBE       │
│                                                                         RUST_BUILD = IMPORT ONLY (L3-A)      │
│                                                 └───────────────────────────────┴──────────────────┘          │
│                                                                   ▼                                            │
│                                     ISOLATED CANDIDATE GENERATION N+1 (objects written once; manifest)         │
│                                                                   │                                            │
│                                  VERIFY with N's law + N's kernel verifiers + N's hashes (never N+1's)         │
│                                                                   │                                            │
│                                  QUALIFY: N+1 runs CONFINED in a nested opaque frame; N feeds the specimen;    │
│                                  N re-verifies N+1's artifacts with N's BundleVerifier/verifier; the specimen  │
│                                  bundle executes (exact relay) ; law self-tests f00..f08 analogues            │
│                                        FAIL ─► preserve N (candidate objects stay unreferenced)               │
│                                        PASS ─► broker: pending := N+1 (IDB transaction)                        │
└────────────────────────────────────────────────────────────┬───────────────────────────────────────────────────┘
                                                             ▼
                        SEED next navigation: attempts < K and deadline open ─► boot N+1 confined
                                     │                                           │
                          N+1 posts startup_ok(N+1) within deadline      no startup_ok / crash / hash mismatch
                                     │                                           │
                          broker tx: active:=N+1, previous_good:=N       broker tx: pending:=null; boot previous_good
                                     ▼                                           ▼
                               FACTORY N+1                                   ROLLBACK N

 EXTERNAL, OUTSIDE THE INSTALLED FACTORY (explicit trust, never silent):
   RUST_BUILD epoch (Linux: nightly + rust-src + cargo -Z build-std=core)  ──► compiled object + build receipt
                                                                              (toolchain identity, source tree id)
   origin server  ──► seed install / seed replacement only (L4-class event)
   GitHub         ──► L4 synchronization (REST API CORS-open; smart-HTTP not CORS-open)
```

## 3. Current Factory dependency decomposition (semantic requirement != Linux implementation)

Status marks refer to the BROWSER replacement.  "Evidence" names the probe or D11 node that establishes it.

```text
1 CANONICAL STATE
  canonical ref            SEM  a named mutable pointer to a commit id          LINUX  refs/heads/<branch> via git
                           AUTH git-update-ref <new> <old>; D11 AUTH-GIT-*       BROWSER IDB key refs/heads/<b> in a
                           ENV  host git 2.43.0 (D11 FACT-WORKPIECE-ISOLATION)          seed-owned database        [RUN P06]
  commit identity          SEM  sha1("commit <n>\0" + tree, parents, author,     LINUX  git commit / rev-parse
                                committer, message)                              BROWSER WebCrypto SHA-1 over the
                           STALE if object format moves to SHA-256                       same bytes                 [RUN P09]
  tree identity            SEM  sha1 of sorted (mode, name, id) entries          LINUX  add -A + write-tree (temp index)
                                                                                 BROWSER recursive tree hash        [RUN P09]
  parent lineage           SEM  commit parents                                   LINUX  git log / merge-base
                                                                                 BROWSER walk parent ids in store   [GAP impl]
  base-unmoved test        SEM  compare-and-swap: move ref only if == base       LINUX  rev-parse + merge --ff-only
                                                                                 BROWSER IDB readwrite CAS          [RUN P06]
2 WORKPIECE
  isolated tree            SEM  mutable tree derived from canonical base id      LINUX  git worktree add --detach
                                                                                 BROWSER overlay {path -> blob id}
                                                                                         over base tree id          [GAP impl]
  copy-on-write            SEM  base objects never mutated                       LINUX  separate working dir
                                                                                 BROWSER write-once objects         [RUN P09
                                                                                                                     semantics]
  authorization boundary   SEM  changed paths within MAY CHANGE, disjoint MUST   LINUX  paths.rs literal prefix rule
                                NOT CHANGE                                       BROWSER same rule, pure function   [GAP impl]
                                                                                 carries D9 [GAP] literal wildcards
  cleanup / recovery       SEM  discard or resume an unfinished workpiece        LINUX  none (12 worktrees remain)  [GAP]
                                                                                 BROWSER overlay record in IDB;
                                                                                         drop = delete record       [GAP impl]
3 STRUCTURAL DELTA
  intake / path authority /  SEM pure validation over JSON + registry            LINUX  factory delta check; station
  capabilities / invariants                                                              specs read by git show
  / evidence requirements                                                        BROWSER same logic; registry read
                                                                                         from the base tree          [GAP impl]
4 STATIONS
  registry                 SEM  reusable authority envelope + capability tag     LINUX  factory/registry/*.json     [RUN, data]
  fixture binding          SEM  fixture authority <= station <= delta            LINUX  paths.rs subset/overlap     [GAP impl]
  capability invocation    SEM  run a bounded, registered operation              LINUX  process spawn of ANY program
                                                                                 BROWSER capability op + adapter
                                                                                         (section 5)                 [GAP arch]
  arbitrary-process dependence  152/152 commands are OS programs                 BROWSER none executable            [ERR for
                                                                                                                     portability]
5 VERIFICATION
  tree comparison          SEM  changed paths between two tree ids               LINUX  git diff-tree -r
                                                                                 BROWSER compare trees by id,
                                                                                         skip equal subtrees        [GAP impl;
                                                                                                                     ids RUN P09]
  receipts                 SEM  signed-off record per station run                LINUX  JSON files in receipts/     [GAP impl]
                                                                                 plus: record adapter + environment identity
  invariant checking       SEM  must-not-change identical, outputs present,       LINUX  ops.rs verify               [GAP impl]
                                no unreceipted change
  independent verifier     SEM  N's verifier judges N+1                          LINUX  by operator practice only   [GAP]
                                                                                 BROWSER structural: N's objects verify
  evidence indexing        SEM  sha256 of every evidence file                     LINUX  first-party sha256 (foundation)
                                                                                 BROWSER WebCrypto SHA-256 + kernel
                                                                                         sha256 cross-check         [GAP impl]
6 COMPILER  (section 6)
  wasm64 kernel            runs in Chromium main thread (D9 T9-P8-03) and in a dedicated worker                     [RUN P10]
  ASCII -> plan -> bundle  not reachable in the browser: contracts/metrics cannot be submitted; bundle/artifact
                           bytes cannot be read                                                                     [GAP]
  compile the Factory      impossible with the existing compiler (it is not a compiler for Rust, JS or itself)     [GAP arch]
  rustc / Cargo            required for every compiled object and for every template change (include_str!)          [UNK arch]
7 GENERATED WEBAPP HOSTING
  SW / CacheStorage        generated bundle shell offline                                                           [RUN P01]
  OPFS objects + router    generated WebApp served from local objects                                               [RUN P04]
  IndexedDB                metadata, pointers                                                                       [RUN P06]
  virtual request routing  SW fetch handler synthesizes responses (with COOP/COEP when needed)                      [RUN P04 P05]
  trust domain             generated apps on the Factory origin share ALL Factory storage (P03 + P08)               [ERR D-2]
8 PERSISTENCE              canonical objects, workpieces, evidence, source, authority graph, generations            [RUN P03]
                           durability: best-effort bucket, persist() false                                          [GAP P07]
9 UPDATE / ACTIVATION      section 9                                                                                [GAP impl;
                                                                                                                     primitives RUN]
10 RECOVERY                section 11                                                                               mixed
11 NETWORK / REMOTE SYNC   section 12                                                                               [GAP] / [UNK]
```

D11 traversal used for this table (tests/envmap/envmap.mjs query): FACT-WORKPIECE-ISOLATION and
FACT-FF-ONLY-INTEGRATION are [RUN] for ENV-D11-HOST only and REQUIRE host git 2.43.0; FACT-LITERAL-PATH-MATCH [OBS]
is STALE_IF repo.commit; FACT-STATION-ENV-UNRECORDED [GAP] has no probe; FACT-WASM64-ABI-EXEC [RUN] is valid for
ENV-D1-D3-BROWSER only; FACT-CORE-ONLY-GRAPH [RUN] is valid for ENV-D9-HOST only.  None of the browser storage,
service-worker, confinement or git-format authorities exist in graph.json (section 18 proposes them).

## 4. Browser-native replacement matrix

```text
FACTORY OPERATION             BROWSER PRIMITIVE                             EVIDENCE          IMPLEMENTATION STATUS
content-addressed objects     WebCrypto SHA-1 (git) / SHA-256 (artifacts)   P09               [GAP] object store
zlib object encoding          CompressionStream / DecompressionStream       P09               [GAP] (loose done by probe)
                              ("deflate" = RFC1950)
packfile import / export      none built in (format in gitformat-pack)      -                 [GAP]
refs + base-unmoved CAS       IndexedDB readwrite transaction               P06               [GAP]
tree snapshot / diff          recursive tree hash over overlay              P09 (hash only)   [GAP]
workpiece                     overlay record in IndexedDB + OPFS objects    P03 persistence   [GAP]
multi-tab exclusion           Web Locks (window, worker, SW)                P02, P10          [GAP]
station check commands        capability ops (section 5)                    -                 [GAP]
compile ASCII                 wasm64 kernel in a dedicated worker           P10               [GAP] ABI exports
compile Rust                  none                                          -                 [UNK] (section 6)
serve Factory / generated     SW fetch handler over OPFS objects            P01, P04          [GAP] router
apps
isolation headers             SW-synthesized COOP/COEP                      P05               [GAP]
candidate confinement         opaque sandboxed frame + broker postMessage   P08, P16          [GAP] broker
atomic activation             IDB pointer transaction                       P06               [GAP]
seed replacement              SW Update with origin server only             P02, P15          external (L4-class)
broken-seed recovery          none offline; origin server or UI site-data   P14               architectural limit
                              clearing
durability                    navigator.storage.persist()                   P07 (false)       [GAP]/[UNK] installed
GitHub REST                   fetch with token (CORS *)                     GH                [GAP] (L4)
git smart-HTTP                not CORS-readable                             GH                architectural limit
                                                                                              without a proxy
```

## 5. Station execution abstraction analysis

Question: must stations move to capability_id + adapters, or is that only elegant?

```text
PREMISES
  P-a  the web platform has no process-spawn API (HTML, Workers, WebAssembly JS API expose none)
  P-b  152 of 152 current fixture and re-inspection commands are OS program invocations (census, 0.1)
  P-c  the verdict of a command is its exit code, which exists only if the program runs
  P-d  L3 requires the installed Factory to execute its own delta pipeline (snapshot, diff, authority, verify,
       build, qualify, index) without a host
CONSEQUENCE
  from P-a..P-d: a browser Factory can execute none of today's fixtures.  Exactly two ways out exist:
    (i)  emulate the programs in the browser: a POSIX sh, grep/awk/ls/wc/cp/sort, node, git, cargo AND rustc.
         (i) contains RUST_BUILD (section 6) and strictly contains (ii); it is never smaller.
    (ii) replace "program" by a registered operation class with explicit inputs/outputs and adapters.
  => (ii) is NECESSARY for every operation the installed Factory must run itself.  It is not required for
     operations that only ever run on Linux (RUST_BUILD), which keep a Linux adapter and enter the browser as
     IMPORT receipts.
WHY A LINUX ADAPTER TOO (necessity, not symmetry)
  - Factory generation 0 is built on Linux: the same capability must produce comparable receipts in both places, or
    the first browser generation cannot be verified against the Linux history (receipt parity).
  - RUST_BUILD exists only on Linux (L3-A).
MINIMUM CAPABILITY SET (derived from ops.rs + the census; every `sh -c` string reduces to these)
  TREE_SNAPSHOT     TREE_DIFF       PATH_AUTHORITY     FILE_ASSERT (grep/test)     JSON_ASSERT (node -e)
  EVIDENCE_INDEX    WASM_INSPECT    KERNEL_BUILD       QUALIFY_SPECIMEN            BROWSER_PROBE (confined frame)
  RUST_BUILD (Linux only; browser side = IMPORT_COMPILED_OBJECT with provenance)
RECEIPT CONSEQUENCE
  a receipt must name capability_id, adapter_id, adapter build identity and environment identity (browser product,
  revision, V8; or toolchain -vV).  This is the D11 [GAP] FACT-STATION-ENV-UNRECORDED turned into a requirement.
NOT PROVEN NECESSARY
  converting Linux-only fixtures of past deltas; they stay as history.  Existing StationSpecs keep their authority
  envelopes; operation_class becomes an executable key only for the capabilities above.
```

## 6. Compiler / bootstrap dependency analysis

```text
WHAT A FACTORY GENERATION IS MADE OF           HOW IT IS PRODUCED TODAY                 IN-BROWSER PRODUCIBLE?
UI / broker-side JS (does not exist yet)        -                                        yes (source = artifact)
Factory core law                               Rust std crate `factory` (native only)   NO as Rust; yes if expressed
                                                                                        as interpreted source or as
                                                                                        a precompiled wasm object
wasm64 compiler kernel (12 crates)             rustc nightly + rust-src + cargo         NO  (RUST_BUILD)
                                               -Z build-std=core (D9 T9-P5/P8)
generated-WebApp templates                     include_str! into the kernel             NO  (kernel rebuild)
registry / fixtures / authority graph / law    data files                               yes
```

- The existing FactTest compiler cannot compile the Factory.  It compiles ASCII systems into recipe-bound bundles:
  semantic front end + planner + verifier + a first-party emitter for relay-class wasm64 modules + template
  instantiation.  It is not a compiler for Rust, for JavaScript, or for itself.
- In-browser ASCII -> bundle (L2) is blocked by six missing wasm exports, not by missing compiler layers: P10 shows
  BUILD stops at CAPABILITY_IR because no registry can be submitted.  [GAP small]
- P10 also shows BUILD returning status OK with no registry and no plan.  Whether BUILD without a contract registry
  must report NO_PLAN is a semantics question returned to ASCII (D-5), not decided here.  [UNK]
- Compiled-object identity follows the unpinned toolchain: the same compiler tree built today (nightly 6bb1652a0)
  gives sha256 a1bb6f86..., D9 (nightly 6eeff9a52) gave 30958994...  Reproducing a successor's compiled objects is
  undefined until the toolchain is pinned (D9 T9-P7 [GAP], now with a concrete consequence).
- Three strategies for compiled objects, none decided (D-3):
    B1  host rustc + LLVM in the browser                        [UNK] feasibility (size, 4 GB wasm32 memory for a
                                                                 hosted toolchain, FT-003 applicability to a toolchain
                                                                 host) ; third-party toolchain in the TCB
    B2  extend FactTest's own language/codegen until the Factory [GAP] architectural; the language describes systems,
        is expressible and compilable by FactTest                not general computation
    B3  no in-browser rebuild: compiled objects are imported     achievable; defines L3-A; the external build epoch
        with build receipts and qualified by execution           stays in the TCB
- Widening L3-A without touching B1/B2: move generated-WebApp templates out of include_str! into data objects
  consumed by the kernel (recipe data), so host/JS changes stop requiring a kernel rebuild.  Candidate, not decided.
- Non-circular compiler qualification: a candidate kernel is never trusted on its own outputs.  N feeds the specimen
  to N+1's kernel inside a confined frame; N re-verifies the resulting VerifiedStrategy / bundle with N's verifier and
  BundleVerifier (requires artifact-schema compatibility, [GAP] when schemas change) and executes the specimen bundle
  (physical exact relay).  Compiler built by the candidate as sole proof that it works: forbidden (circular).

## 7. Trusted computing base

```text
COMPONENT                           ROLE                                              TRUST                    CIRCULARITY
browser engine (Chromium 141,       executes everything; implements SW, OPFS, IDB,     assumed (unavoidable)    none (cannot self-verify)
V8 14.1.146.11)                     WebCrypto, Compression, sandbox isolation
storage substrate (profile on       holds objects and pointers                        assumed; durability      none; eviction risk P07
the OS filesystem)                                                                    NOT established [GAP]
home origin identity                scheme+host+port = the installed Factory (P03)    whoever serves it can    none; a shared origin
                                                                                      replace the seed         (githack, *.github.io)
                                                                                                               breaks confinement (D-1)
origin server                       seed install / replacement only (P02, P15)         trusted at seed events   none
immutable seed                      pointer boot, hash-checked serving, broker,       verified before install  none if seed never
                                    recovery view                                     (P14: defects are fatal  verifies itself at runtime
                                                                                      offline)
hash implementations                WebCrypto SHA-256 / SHA-1; FactTest first-party   browser + first-party    two independent sha256
                                    sha256 inside the kernel                                                   implementations can
                                                                                                               cross-check generation roots
active Factory N verifier           judges candidate N+1                              trusted (qualified when  N verifies N+1:
                                                                                      N was activated)         ACCEPTABLE
candidate N+1 self-check            startup_ok liveness signal only                   NOT sufficient           N+1 verifying only
                                                                                                               itself: INSUFFICIENT
compiler kernel N                   builds and verifies specimens for N's own         trusted as part of N     -
                                    qualification of N+1's artifacts
compiler kernel N+1                 builds the specimen under qualification           UNTRUSTED until N        kernel N+1 as sole
                                                                                      re-verifies its outputs  proof of itself:
                                                                                      and the bundle runs      CIRCULAR (forbidden)
RUST_BUILD epoch (Linux, rustc      produces compiled objects (L3-A import)           trusted, witnessed by    compiled object checking
nightly, rust-src, cargo)                                                             build receipt; toolchain its own build: CIRCULAR;
                                                                                      unpinned [GAP]           two epochs agreeing on
                                                                                                               bytes: requires a pin
git object semantics                identity of source, trees, commits                git format documents;    none (git binary leaves
                                                                                      reproduced in browser    the TCB; P09)
                                                                                      (P09); plain SHA-1, no
                                                                                      SHA-1DC detection
authority graph (D11 graph.json)    law data: constraints, stale conditions,          data, not code; truth    none
                                    qualification sets                                bounded by source pins
                                                                                      and DENIED reopen [UNK]
GitHub (L4 only)                    remote mirror of canonical history                optional; credentials    none
                                                                                      must stay in the broker
```

Minimal TCB for L3-A: browser engine + storage substrate + home origin (at seed events) + immutable seed + hash
implementations + active generation N (law engine, kernel N) + the recorded RUST_BUILD epoch for any imported compiled
object.  The git executable, cargo, node, sh and the Linux Factory are NOT in the L3-A TCB once generation 0 exists,
except RUST_BUILD for compiled-object changes.

## 8. Immutable bootstrap boundary (the smallest seed)

Derived from evidence, not preference:

```text
FACT                                                         CONSEQUENCE FOR THE SEED
P02  SW script updates bypass the SW and need the origin     the SW script cannot be a generation; it IS the seed
P14  a broken SW blocks its scope; offline unrecoverable     the seed must be total (never throws), minimal, and
                                                             qualified BEFORE installation; recovery must not depend on
                                                             generation code
P15  interrupted SW update keeps the old worker              seed replacement (with an origin) is already atomic
P06  IDB transactions are atomic; CAS has one winner         pointers live in IDB, written only in transactions
P03  storage is origin-scoped and survives restart           generations and pointers persist; port changes lose them
P16  opaque frames have no active SW; inline bootstrap works the seed must inline the generation bootstrap (srcdoc) and
                                                             feed code by postMessage; a URL-loaded confined frame fails
                                                             offline
P08  same-origin frames reach all storage                    generation code must never run same-origin, or rollback and
                                                             canonical state are at its mercy
```

```text
SEED = { sw.js (fetch router + boot + pointer read + hash check) , broker page (inline in sw.js strings) }
MUST
  1 find the active generation: read {active, previous_good, pending} in one IDB readonly transaction
  2 verify object identity: sha256 of every object served against the generation manifest; manifest id checked
    against the pointer
  3 detect failed activation/startup: pending.attempts incremented in a transaction BEFORE booting pending;
    promotion only on startup_ok(pending) received by the broker before the deadline
  4 select previous known-good: pending exhausted, hash mismatch, or boot failure -> previous_good (transaction)
  5 launch the chosen generation confined: inline srcdoc bootstrap in an opaque sandboxed frame; code, wasm and data
    only via postMessage
  6 broker (the only storage path): get(object id); put(bytes) -> id (write-once); propose_pending(manifest id);
    cas_ref(name, old, new); startup_ok(id).  No delete of objects referenced by the last K generations; no write to
    active/previous_good except by the seed's own promotion/rollback rules
  7 recovery view reachable from the seed alone (reserved path handled inside sw.js): list generations and states,
    force previous_good, clear pending, export objects (download)
  8 grant COOP/COEP on the broker page only if a generation requires cross-origin isolation (P05); default off
MUST NOT
  compile, run stations, evaluate Factory law, parse ASCII, talk to GitHub, hold credentials reachable by
  generations, depend on any generation object to boot or to recover
SIZE TARGET
  one self-contained script, no imports, no wasm; the pointer schema and manifest schema are frozen inside it
  (schema changes are seed replacements = origin events)
```

## 9. Generation / update / rollback design

```text
OBJECTS (write-once, content-addressed, OPFS)       POINTERS (IDB 'seed' db, seed/broker-owned)
  generation manifest {schema, files{path: sha256},   active        : manifest id
    parent_generation, source_tree (git tree id),     previous_good : manifest id
    compiled_objects{id: build receipt},              pending       : {manifest id, attempts, deadline} | null
    qualification_evidence[], browser_identity}        history       : [manifest ids] (GC keeps last K)
  file objects (JS, wasm64 kernel, data)
  evidence objects

STATE MACHINE (seed)
                  propose_pending(M) by N (after N verified + qualified M)
  ACTIVE(N) ─────────────────────────────────────────────────► PENDING(M, attempts=0)
      ▲                                                            │ navigation: attempts < K -> attempts+1 (tx), boot M
      │ rollback tx: pending:=null                                 ▼
      │   (attempts >= K, deadline passed, hash mismatch,     BOOTING(M) ── startup_ok(M) before deadline ──►
      │    or M's bootstrap throws)                                │           promotion tx: previous_good:=N,
      └────────────────────────────────────────────────────────────┘           active:=M, pending:=null -> ACTIVE(M)
  corrupt active (hash mismatch on read) -> boot previous_good, surface the recovery view

QUALIFICATION (performed by N before propose_pending; never by M alone)
  Q1  manifest completeness: every file present, sha256 matches (N's hashes, both implementations)
  Q2  source provenance: manifest.source_tree == canonical tree id recomputed by N (P09 method)
  Q3  compiled objects: identical to the ones N runs (reuse) OR carry a RUST_BUILD receipt whose source tree and
      toolchain identity are recorded; toolchain unpinned => import is [GAP] for reproducibility claims
  Q4  law self-tests: the f00..f08 scenarios (happy path, unauthorized mutation, authority expansion, missing receipt,
      failed check, moved base, read-only station mutation, unreceipted change, overlapping authority) executed by M
      CONFINED on synthetic repositories that N supplies, with N comparing verdicts to the expected table
  Q5  specimen: M manufactures the Byte Relay (and every commissioning witness) from the authored ASCII; N re-verifies
      M's VerifiedStrategy and bundle with N's verifier/BundleVerifier and runs the bundle (exact relay)
  Q6  re-qualification set from the D11 graph: every COMPUTATIONAL_FACT IMPLEMENTED_BY an object that differs between
      N and M is stale (STALE_IF repo.commit and IMPLEMENTED_BY edges); its probes rerun
  Q7  non-mutation: canonical ref and canonical tree id recomputed by N after qualification are unchanged
```

## 10. Local repository / object-store model

```text
- Git-compatible objects (blob/tree/commit, SHA-1 names) are sufficient for canonical identity and are fully
  reproducible in the browser (P09: all 880 blobs, the HEAD tree and commit, a new commit byte-identical to git).
- Canonical state requires Git-compatible objects, not GitHub and not the git executable.
- Store layout: OPFS objects/<2>/<38> zlib loose objects (git-readable, P09) ; IDB refs with CAS (P06) ; IDB reflog.
- Workpiece = {base commit, overlay path -> blob id, station runs, receipts}; snapshot = tree id of base+overlay;
  diff = compare tree ids recursively (equal ids short-circuit); cleanup = delete overlay; nothing like git worktree
  metadata is needed.
- Integration = broker cas_ref(canonical, base, new_commit): exactly the gate `canonical_base_unmoved` +
  `merge --ff-only`, without a working tree to keep clean (canonical_working_tree_clean becomes vacuous).
- Import of existing history: packfile parsing (zlib + delta) [GAP]; or import of the current tree only with an
  explicit "history horizon" record [decision].
- Hash choice: git SHA-1 keeps GitHub compatibility; WebCrypto SHA-1 has no SHA-1DC collision detection [OBS];
  git's SHA-256 object format exists (hash-function-transition) but GitHub interoperability is [UNK] (D-6).
```

## 11. Recovery matrix

```text
FAILURE                           DETECTION                               RECOVERY                                  STATUS
corrupt active generation         seed hash check on read                 boot previous_good; recovery view         primitives [RUN]; impl [GAP]
interrupted generation update     pending with attempts, no startup_ok    rollback tx                               [RUN P06] ; impl [GAP]
bad candidate                     N's qualification Q1..Q7                never proposed; objects unreferenced       [GAP impl]
bad activated generation          no startup_ok / crash within deadline   rollback; confinement keeps N's objects    [RUN P08 P16]; [GAP impl]
                                                                          and pointers out of its reach
bad generation that passes        none automatic                          recovery view -> previous_good (manual)   [GAP]
startup then misbehaves
bad seed (broken SW)              every navigation fails                  origin server or browser-UI site-data      [RUN P14]: architectural
                                                                          clearing ONLY                              limit
interrupted seed update           old seed stays active                   platform behaviour                         [RUN P15]
storage eviction / corruption     objects missing / hash mismatch         re-install seed from origin + restore from [GAP] (P07: best-effort)
                                                                          export or remote (L4)
schema migration failure          generation-side data schemas migrate    old generation + old objects remain;       [GAP impl]
                                  copy-on-write into new objects          rollback restores them
browser update                    epoch change; D11 browser.product       re-run admission and the generation's      [UNK]; not testable here
                                  STALE_IF edges                          qualification probes; seed failure = P14
                                                                          class
```

## 12. Network / remote synchronization (L4, deferrable)

```text
- L3 does not depend on GitHub: canonical state is local Git-compatible objects + a CAS ref.  Remote synchronization
  can be deferred until after local self-hosting (yes).
- Offline base movement: the local canonical ref moves only through local integrations (CAS; Web Locks across tabs).
  Remote divergence is detected at sync: local ancestor of remote -> fast-forward local; remote ancestor of local ->
  fast-forward push; otherwise DIVERGED -> return to ASCII (an explicit merge delta), never an automatic merge.
- Browser -> GitHub paths observed from this host: REST API answers with Access-Control-Allow-Origin: * [OBS];
  smart-HTTP git protocol answers without CORS headers [OBS] (a browser cannot read it without a proxy, which would
  join the TCB); OPTIONS preflights answered 405 through the intercepting egress proxy [UNK - environment artefact
  not separated from GitHub behaviour].
- Credentials: a token in origin storage is readable by every same-origin script; it must live behind the broker and
  never enter a generation frame [GAP].
- Packfile import/export for full history [GAP]; ref update through REST requires fast-forward-only semantics
  (force=false) and an explicit base check before the call [GAP].
```

## 13. Open D9/D11 findings and their effect on self-hosting (preserved, not repaired)

```text
FINDING                                        STATUS  EFFECT ON SELF-HOSTING
native workspace build/clippy mismatch         [ERR]   the compiled set of a generation must be defined by the core-only
(factc-wasm-abi, default-members 13/14)                wasm64 graph (D9 T9-P5), never by bare cargo commands
unpinned Rust toolchain (T9-P7)                [GAP]   compiled identity drifts (a1bb6f86 today vs 30958994 in D9): L3-A
                                                       imports cannot claim reproducibility; blocks "reproduce successor"
weak nostd-check / depcheck heuristics         [GAP]   must not be ported to the browser verifier; qualified judge
                                                       semantics (core-only graph, resolved graph) come from the RUST_BUILD
                                                       epoch receipts
literal wildcard station surfaces              [GAP]   a browser PATH_AUTHORITY port reproduces dead surfaces unless the
(S-FIXTURE compiler/*/...)                             glob question is decided (D-7)
authority fragment drift (#internal-storage)   [ERR]   none on execution; the authority graph shipped in a generation stays
                                                       stale data until the owners correct the law files
incomplete earlier environment identity        [GAP]   receipts in the browser must carry environment identity (section 5)
hardware GPU unknown                           [UNK]   not needed by the Factory; generated apps only
WGSL unprobed                                  [GAP]   not needed by the Factory
shared/threaded Wasm not admitted              [ERR]   not needed (kernel is single-threaded); P05 shows the COI
(ERR-002/ERR-003)                                      precondition is locally grantable; admission unchanged
broad capability-map gaps                      [GAP]   storage/SW/confinement authorities used here are proposed as graph
                                                       additions (section 18), not yet applied
authority reopen denied                        [UNK]   also blocks the githack public-origin path in this session
```

## 14. Required questions

```text
Q  What exactly prevents L3 self-hosting today?
A  (1) no Factory exists in the browser at all; (2) every Factory state operation is a git subprocess and every
   station check an OS subprocess; (3) every compiled object and every generated-app template change needs rustc on a
   host; (4) the wasm64 ABI cannot take a registry or return bundle/artifact bytes; (5) no seed, broker, pointer
   schema or generation manifest exists; (6) same-origin code can rewrite all storage unless confined; (7) storage is
   best-effort; (8) the toolchain is unpinned; (9) the home origin is undecided.
Q  Architectural versus merely unimplemented?
A  Architectural: (3) RUST_BUILD in the browser; seed immutability without an origin (P02) and fatal seed defects
   offline (P14); same-origin trust (P08) forcing the broker design; git smart-HTTP not CORS-readable; storage
   durability owned by the UA.  Unimplemented: (1), (2), (4), (5), object store, packfiles, law engine port,
   capability ops, qualification runner, recovery view.
Q  Which Factory operations fundamentally require Linux?
A  Only RUST_BUILD (rustc + LLVM + rust-src + cargo -Z build-std).  git, sh, grep, node and the process model are
   incidental adapters.
Q  Which can be browser-native deterministic state transitions?
A  Delta check, fixture/station authority, tree snapshot, tree diff, verification checks, evidence indexing, wasm
   inspection, ASCII compile (with ABI exports), integration (CAS), re-inspection, activation, rollback.
Q  Can Git semantics be retained without the git executable?
A  Yes for identity and loose objects (P09, [RUN]); packfiles and history walks are unimplemented [GAP].
Q  Does canonical state require GitHub or only Git-compatible objects?
A  Only Git-compatible objects and a CAS ref.  GitHub is L4.
Q  Can generated WebApps be served entirely from persisted local objects?
A  Yes (P04 [RUN], offline and after restart).  Hosting them on the Factory origin merges trust domains [ERR] (D-2).
Q  Can the Factory build its own successor with the existing compiler?
A  No.  The compiler builds ASCII systems into relay-class bundles; it does not compile Rust, JS or itself.
Q  If not, what compiler/bootstrap layer is missing?
A  Either an in-browser RUST_BUILD (B1, [UNK]) or a FactTest language/codegen able to express the Factory (B2, [GAP]);
   without either, compiled objects are imported with build receipts (B3 = L3-A).  Independently: six ABI exports
   (L2) and templates-as-data (to keep host changes out of the kernel).
Q  What is the minimum immutable seed?
A  Section 8: SW router + pointer boot + hash-checked serving + broker + recovery view; nothing else.
Q  What is the rollback mechanism?
A  Section 9: pending pointer with attempts and deadline; promotion only on startup_ok; rollback transaction to
   previous_good; objects write-once; generations confined so they cannot touch pointers or N's objects.
Q  What survives browser restart?
A  OPFS, IndexedDB, CacheStorage, localStorage and SW registrations on the same origin (P01, P03, P04, P15); nothing
   when the port or host changes (P03).
Q  What survives offline use?
A  Everything served by the SW from CacheStorage/OPFS (P01, P04, P05, P16).  Not: seed replacement (P02), broken-seed
   recovery (P14), GitHub sync, RUST_BUILD, authority reopen.
Q  What happens when the browser version changes?
A  All PHYSICAL_BROWSER [RUN] facts become stale (D11 STALE_IF browser.product); the active generation must re-run its
   admission and qualification probes; a seed incompatibility would be a P14-class failure.  Not testable here [UNK].
Q  What evidence becomes stale after a Factory update?
A  Every fact IMPLEMENTED_BY a changed object (D11 edges) plus FACT-LITERAL-PATH-MATCH and FACT-WILDCARD-SURFACES-DEAD
   (STALE_IF repo.commit); after a kernel change also FACT-CORE-ONLY-GRAPH and FACT-WASM64-MODULE-I64; after a template
   change the adapter facts.  Traversal yields the re-qualification set (Q6).
Q  How does a candidate prove it did not mutate authoritative source?
A  It cannot prove it itself.  N proves it: the candidate runs confined without storage access (P08, P16), receives
   inputs by object id, returns new objects; N recomputes the canonical tree id and reads the canonical ref (Q7).
Q  How is base movement handled while offline?
A  Locally by CAS under Web Locks; remotely only at sync, where divergence returns to ASCII.
Q  Can remote synchronization be deferred until after local self-hosting?
A  Yes.
```

## 15. L0-L4 status

```text
LEVEL  FACTORY WEBAPP                                   PRIMITIVES (evidence)                         STATUS
L0     no Factory WebApp exists                          generated bundle offline + restart (P01);     Factory [GAP]
                                                        manifest installation not observed            generated bundle [RUN]
                                                        (headless); public HTTPS origin not reached    loopback; install [UNK];
                                                        (githack DENIED)                              HTTPS [UNK]
L1     no Factory host                                   OPFS-served app offline (P04); storage         [GAP]; trust domain [ERR]
                                                        persists (P03); best-effort (P07)
L2     no browser Factory state; ASCII -> compile in     kernel in worker (P10) up to CAPABILITY_IR;   [GAP] (small ABI gap +
       browser stops before planning                    ABI lacks 6 exports                           state model)
L3-A   none                                             identity (P09), atomic pointers (P06),         [GAP] implementation;
                                                        confinement (P08, P16), seed semantics         primitives [RUN]
                                                        (P02, P14, P15)
L3-B   none                                             no RUST_BUILD in any browser                   [UNK] architectural
L4     GitHub outside Factory law today                 REST CORS-open, smart-HTTP not                 [GAP] / [UNK]
```

## 16. Blockers classified

```text
ID    BLOCKER                                                             CLASS            STATUS
B-01  no Factory WebApp / UI / state model                               unimplemented    [GAP]
B-02  git subprocess for all canonical/workpiece state                   unimplemented    [GAP]  (primitives [RUN] P06, P09)
B-03  station commands are OS programs (152/152)                         architectural    [ERR]  for portability; section 5
B-04  RUST_BUILD only on a host                                          architectural    [UNK]  B1/B2 ; B3 defines L3-A
B-05  templates compiled into the kernel                                 design choice    [GAP]  widens L3-A if moved to data
B-06  wasm ABI lacks submit_contracts/metrics/evidence_tape, observe,    unimplemented    [GAP]
      read_artifact, bundle_file
B-07  BUILD reports OK with no registry and no plan                      semantics        [UNK]  D-5
B-08  seed cannot self-update offline; broken seed unrecoverable offline  architectural    [RUN] limit (P02, P14)
B-09  same-origin code reaches all storage                               architectural    [RUN] (P08); broker required
B-10  opaque frames have no active SW; bootstrap must be inline          architectural    [RUN] (P16)
B-11  storage best-effort; persist() false                               environmental    [GAP] / [UNK] installed
B-12  toolchain unpinned; compiled identity drifts                       governance       [GAP] (T9-P7, KRN)
B-13  verifier provenance unrecorded                                     unimplemented    [GAP]
B-14  workpiece cleanup / audit durability                               unimplemented    [GAP]
B-15  home origin undecided; githack/github.io are shared origins        decision         [UNK] D-1
B-16  generated apps on the Factory origin share its trust domain        decision         [ERR] D-2
B-17  packfile import/export; history walk                              unimplemented    [GAP]
B-18  GitHub smart-HTTP not CORS-readable; credentials in origin         architectural    [OBS] / [GAP]
B-19  public HTTPS origin path (githack) not reachable in this session   environmental    [UNK]
B-20  browser update behaviour of seed and generations                   environmental    [UNK]
```

## 17. Tests and evidence required to promote each level

```text
L0 (Factory)   seed + minimal generation installed at the home origin; launch offline with the origin server stopped;
               launch after browser restart; run on loopback AND on a public HTTPS origin (githack for testing only,
               once raw.githack.com / rawcdn.githack.com are allowed); manifest installation observed where the
               environment allows, otherwise [UNK] kept
L1             generated app served from Factory-held objects offline and after restart (P04 re-run under the seed);
               decision D-2 applied and its isolation probed (P08-style: the app cannot reach Factory storage)
L2             ABI exports added (B-06) and a byte-for-byte comparison: the Byte Relay bundle built in the browser
               worker == the bundle built by native factc from the same source/registry/metrics; BundleVerifier PASS in
               both; the in-browser bundle executes exactly (P04 method); workpiece + receipts persisted locally
L3-A           seed failure matrix all PASS: boot, promote, bad-startup rollback, crash rollback, corrupt-object
               rollback, interrupted pointer write, restart during PENDING, offline throughout; then one real
               generation swap N -> N+1 where N+1 changes only non-compiled objects, qualified by Q1-Q7, activated,
               and a deliberately broken N+2 rolled back; kernel reused by identity
L3-A (import)  a compiled-object change imported with a RUST_BUILD receipt under a PINNED toolchain; two independent
               build epochs produce identical bytes before import
L3-B           an in-browser RUST_BUILD producing the kernel byte-identical to the pinned Linux build (B1) or a
               FactTest-native build of the Factory (B2); until then [UNK]
L4             packfile import of this repository in the browser with every object id verified; divergence detection
               test (remote moved while offline -> DIVERGED returned to ASCII); fast-forward push of a
               Factory-integrated commit through the chosen transport with credentials outside generations
```

## 18. Proposed D11 graph additions (ASCII only; not applied by this pass)

```text
AUTHORITY  AUTH-SW-UPDATE-BYPASS (ServiceWorker index.bs Update, service-workers mode none)
           AUTH-SW-INSTALL-FAILED (Install, installFailed)   AUTH-SW-REGISTER-TRUST (Register)
           AUTH-SW-SANDBOX-NO-CONTROLLER (note line 353)     AUTH-FS-OPFS (fs index.bs exposure, sync handles)
           AUTH-STORAGE-BUCKET-MODE (storage.bs best-effort/persistent, storage pressure)
           AUTH-IDB-TRANSACTION (atomic, durability)         AUTH-WEB-LOCKS   AUTH-COMPRESSION-ZLIB
           AUTH-WEBCRYPTO-DIGEST   AUTH-HTML-SANDBOX-ORIGIN   AUTH-HTML-COOP-COEP
           AUTH-GIT-OBJECT-FORMAT  AUTH-GIT-UPDATE-REF-CAS    AUTH-GIT-PACK-FORMAT   AUTH-GIT-SHA256-TRANSITION
           AUTH-MANIFEST-INSTALLABLE
FACT       FACT-SH-GENERATED-OFFLINE (P01)  FACT-SH-SW-NO-SELF-UPDATE (P02)  FACT-SH-ORIGIN-SCOPED-STORAGE (P03)
           FACT-SH-OPFS-SERVED-APP (P04)    FACT-SH-SW-GRANTS-COI (P05)      FACT-SH-IDB-CAS (P06)
           FACT-SH-STORAGE-BEST-EFFORT (P07) FACT-SH-OPAQUE-CONFINEMENT (P08) FACT-SH-GIT-IDENTITY (P09)
           FACT-SH-KERNEL-WORKER-PARTIAL (P10) FACT-SH-BROKEN-SEED-FATAL (P14) FACT-SH-INTERRUPTED-UPDATE (P15)
           FACT-SH-BROKER-FED-GENERATION (P16) FACT-SH-NO-FACTORY-WEBAPP  FACT-SH-KERNEL-TOOLCHAIN-DRIFT (KRN)
ENVIRONMENT ENV-D12-BROWSER-PERSISTENT (Chromium 141 rev @9f043f63, persistent profile, origin 127.0.0.1:47311)
            ENV-D12-HOST (nightly 6bb1652a0, no clippy)
EDGES      STALE_IF browser.product / browser.revision on every FACT-SH-* ; STALE_IF origin_security.origin on P03/P04 ;
           STALE_IF toolchain.nightly.rustc_commit on KRN ; CONFLICTS_WITH D-2 (hosting vs confinement)
```

## 19. Decisions returned to ASCII (owner decisions; this pass does not choose)

```text
D-1  home origin of the installed Factory: dedicated HTTPS host (recommended by the evidence) versus loopback server
     versus shared hosts.  raw.githack.com and <user>.github.io are shared origins: every page served there shares
     OPFS/IDB/CacheStorage with the Factory (P03 + P08).  githack is suitable as a secure-context TEST path, not as the
     installed home.
D-2  generated WebApps: separate origins per app, or the Factory origin with explicit acceptance that apps share the
     Factory's trust domain [ERR as drawn today: "FactTest.git != generated WebApp" versus shared storage]
D-3  RUST_BUILD strategy: B1 in-browser toolchain, B2 FactTest-native Factory, B3 import-only (L3-A)
D-4  toolchain pin (D9 T9-P7), now with a measured consequence (KRN)
D-5  BUILD with no contract registry: status OK (today) or NO_PLAN
D-6  object hash: git SHA-1 (GitHub-compatible, no SHA-1DC in WebCrypto) versus git SHA-256 object format
D-7  PATH_AUTHORITY glob semantics for the browser port (keep literal and the dead surfaces, or define globbing)
D-8  whether seed replacement after installation is permitted at all, and by whom
D-9  history horizon: import full history (packfiles) or start browser canonical state at a recorded tree
```

## 20. Next bounded delta

```text
D13-SEED-BROKER-QUALIFICATION   (implementation; production surface = a new host/seed/ only)
  WHY FIRST   the seed is the only component that can never be repaired offline (P02, P14); every later delta runs
              inside it.  Its failure matrix must be qualified before anything is built on top.
  MAY CHANGE  host/seed/ (sw.js with inline broker + recovery view), tests/selfhost/ (seed failure-matrix harness,
              two synthetic generations: good, bad), evidence/D13/, design/materialization/D13-*, ledger
  MUST NOT    compiler/, factory/src/, factory/registry/, existing host/harness, templates, law documents, D0-D12
              evidence and receipts; no toolchain pin; no Factory law port; no GitHub access
  STATIONS    S-WEB (host/seed/), S-FIXTURE (tests/selfhost/), S-BROWSER, S-DOC, S-EVIDENCE (existing registry)
  EVIDENCE    boot; promote on startup_ok; rollback on no startup_ok, on crash, on corrupt object, on interrupted
              pointer transaction; restart during PENDING; everything with the origin server stopped; generation
              confinement (cannot read pointers or other objects except through the broker); recovery view reachable
              with a broken generation; seed size and dependency census; loopback now, public HTTPS (githack test
              path) when D-1/network allow
  NOT IN D13  object store, law engine, capability ops, ABI exports (D14 candidate: S-RUST, six exports + the L2
              byte-equality test), qualification runner, RUST_BUILD import, L4
```

## 21. Structural check

```text
SELF-HOSTING SYSTEM (sections 2-12)
every component has an owner ............... seed (origin/owner), broker (seed), generation (manifest), law engine
                                             (generation), objects (content id), pointers (seed), RUST_BUILD epoch
                                             (receipt), GitHub (L4) ........................................... PASS
every output has a consumer/terminal role .. manifest -> seed; objects -> broker; receipts -> law; qualification
                                             evidence -> propose_pending; startup_ok -> promotion ................ PASS
every relation has defined semantics ....... sections 8-10; graph additions use existing D11 edge types ........... PASS
external claims point to exact authority ... 0.2 pins by commit with line locators; published reopen DENIED [UNK] .. PASS (UNK)
authority and reproducibility pins separate  pins are source identities; published URLs unchanged ................. PASS
probes identify what they can prove ........ 0.3 table, each with its question ................................... PASS
evidence identifies its environment ........ browser identity recorded per run; host toolchain recorded ........... PASS
stale conditions representable ............. section 14 (Q browser/Factory update), 18 ......................... PASS
D9/D11 findings visible .................... section 13 ....................................................... PASS
no production repair hidden ................ this pass changes design/, tests/selfhost/, evidence/D12/ only ......... PASS
no illegal AGENT -> REPO path .............. routed as D12 through W12 ......................................... PASS
illegal cycles absent ...................... N verifies N+1; candidate never verifies itself alone; seed never
                                             depends on a generation .......................................... PASS
invariants carried ......................... D10 [INV] set; ASCII authority; FactTest.git != generated WebApp (D-2
                                             [ERR] preserved, not resolved) ..................................... PASS (ERR kept)
next bounded delta identified .............. D13-SEED-BROKER-QUALIFICATION ...................................... PASS

STRUCTURAL CHECK: PASS  -> route D12-SELF-HOSTING-ARCHITECTURE (ASCII + observation probes + evidence only)
                        -> implementation begins no earlier than D13, after owner decisions D-1..D-9 are visible
```
