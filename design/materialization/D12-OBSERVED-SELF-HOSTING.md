# D12 - Observed Self-Hosting Probes vs Intended

STATUS: RE-OBSERVATION OF THE D12 WORKPIECE (W12 on canonical base f71c59b5ec6e0095294549c660884ddbd1a26dd7)
LAW: compares design/materialization/D12-INTENDED-SELF-HOSTING.md (section 0.3, assembly-time probe runs, and the
ledger's PREDICTED line) with what the Factory stations F2-build and F3-browser recorded under evidence/D12/.  The
intended drawing is not rewritten.  NO PRODUCTION REPAIR, no self-hosting implementation and no toolchain pin
occurred in D12.

## 1. Environment of the Factory run

```text
browser    HeadlessChrome/141.0.7390.37, revision @9f043f63b0e5b728c8d09f3e3ddfc1681a4bd58e, V8 14.1.146.11
           Playwright 1.56.1 chromium.launchPersistentContext({headless:true}); origin http://127.0.0.1:47311
           (second origin :47312 for the partition check)                                   [OBS] same as assembly
kernel     rebuilt by F2 from the base tree: rustc 1.100.0-nightly (6bb1652a0 2026-09-22), -Z build-std=core,
           wasm64-unknown-unknown, release; I64 memory min 311; 3,350,085 bytes;
           sha256 a1bb6f866d41f7bbaeb74093f5cb99d1b4775223db0c258906f54f28f8610895        [OBS] = assembly build;
                                                                                             != D9 (30958994...)
network    raw.githack.com and rawcdn.githack.com: proxy 403 on CONNECT; published authority host: 403;
           api.github.com: 200 with Access-Control-Allow-Origin: *; github.com smart-HTTP info/refs: 200 without
           CORS headers; OPTIONS preflight for PATCH: 405 through the intercepting egress proxy
```

## 2. Probe by probe

```text
ID                              PREDICTED  FACTORY RUN  DETAIL                                                     VERDICT
P01-GENERATED-BUNDLE-OFFLINE    RUN        RUN          shell + wasm64 from the bundle's own CacheStorage, server  MATCH [RUN]
                                                        stopped; relay exact via CPU_WASM64; again after restart
P02-SW-CANNOT-SELF-UPDATE       RUN        RUN          update fetch used the origin's v1 although the SW answers   MATCH [RUN]
                                                        v2; origin down -> update rejected; v1 stays
P03-STORAGE-RESTART-ORIGIN      RUN        RUN          OPFS, IDB, CacheStorage, localStorage all survive restart;  MATCH [RUN]
                                                        port 47312 sees none (OPFS NotFoundError, others ABSENT)
P04-OPFS-SERVED-APP             RUN        RUN          generated app served from OPFS by the SW router offline,    MATCH [RUN]
                                                        relay exact; again after restart
P05-SW-CROSS-ORIGIN-ISOLATION   RUN        RUN          crossOriginIsolated true, SharedArrayBuffer and shared      MATCH [RUN]
                                                        WebAssembly.Memory available (precondition only; ERR-002/003
                                                        unchanged)
P06-IDB-ATOMIC-POINTER          RUN        RUN          abort leaves g1/g0; concurrent CAS: one winner              MATCH [RUN]
P07-STORAGE-PERSISTENCE         GAP        GAP          persist() false; quota 162,331,904,409 bytes; best-effort   MATCH [GAP]
P08-CANDIDATE-CONFINEMENT       RUN        RUN          opaque frame: IDB/OPFS/Cache/SW/localStorage SecurityError, MATCH [RUN]
                                                        origin fetch TypeError; secure context, gpu, memory64,
                                                        workers available; same-origin frame reaches everything
P09-GIT-OBJECTS-IN-BROWSER      RUN        RUN          880/880 blob ids; tree ed738d619001 == git; commit          MATCH [RUN]
                                                        f71c59b5ec6e == git; 6/6 loose objects; browser commit
                                                        c9044fef79e9 == git commit-tree; git reads the browser's
                                                        loose object; 2.1 s (run inside the W12 worktree: the probe
                                                        resolves the common object directory)
P10-KERNEL-IN-WORKER            OBS        OBS          ANALYZE 1, BUILD 1; BUILD artifacts CANONICAL_ASCII,        MATCH [OBS]
                                                        TYPED_SYSTEM_IR, CAPABILITY_IR only; absent exports:
                                                        submit_contracts, submit_metrics, submit_evidence_tape,
                                                        observe, read_artifact, bundle_file; OPFS sync handle and
                                                        Web Locks available in the worker                          -> [GAP] B-06
P14-BROKEN-SW-RECOVERY          RUN        RUN          broken SW blocks its scope with the origin up and down;     MATCH [RUN]
                                                        offline recovery page unreachable; online recovery page
                                                        unregistered it
P15-INTERRUPTED-SW-UPDATE       RUN        RUN          v2 install interrupted by closing the browser; v1 active    MATCH [RUN]
                                                        after restart, nothing installing or waiting
P16-CONFINED-GENERATION-LOAD    RUN        RUN          frame by URL: NOT LOADED offline; inline (srcdoc) frame:    MATCH [RUN]
                                                        origin null, module from a broker blob, wasm64 relay exact,
                                                        storage/parent DOM/origin fetch refused
network: githack                DENIED     DENIED       proxy 403 on CONNECT (raw and CDN hosts)                   MATCH [UNK] (B-19)
network: GitHub                 OBS        OBS          REST CORS-open; smart-HTTP not CORS-readable; preflight     MATCH [OBS]/[UNK]
                                                        405 not separable from the egress proxy
kernel identity                 a1bb6f86   a1bb6f86     toolchain drift vs D9 reconfirmed                           MATCH [OBS] (B-12)
```

## 3. Differences preserved and what returns to ASCII

```text
[UNK] B-19  the owner's githack HTTPS path (public secure-context origin) is still unreachable from this environment;
            every browser result above is for the loopback origin only.  The run must be repeated on a public HTTPS
            origin once raw.githack.com / rawcdn.githack.com are allowed.  Githack remains a TEST path: as a home origin
            it would share storage with every other page it serves (D-1).
[GAP] B-06  six wasm exports missing; BUILD in the browser stops at CAPABILITY_IR.
[UNK] B-07  BUILD reports OK without a registry and without a plan (D-5).
[GAP] B-11  persist() false; durability of an installed Factory not established.
[OBS] B-08/B-09/B-10  architectural limits confirmed by the Factory run (seed immutability without an origin, fatal
            broken seed offline, same-origin reach, opaque frames uncontrolled by the SW).
[GAP] B-12  kernel identity follows the unpinned nightly.
[ERR] B-03/B-16 unchanged (process-bound stations; generated apps sharing the Factory trust domain).
Every other blocker of the intended section 16 stays as drawn; nothing here moves a level.
```

## 4. Match / differ

```text
predictions vs Factory run: MATCH on all 13 browser probes, the kernel rebuild and the network observations.
assembly-time vs Factory run: identical verdicts; P09 additionally proven inside a worktree.
structure: MATCH (ASCII + observation only; stations S-DOC, S-FIXTURE, S-BUILD, S-BROWSER, S-EVIDENCE; no station
forged; no production path changed).
the self-hosting boundary drawn in D12-INTENDED sections 15-17 stands: L0 Factory [GAP], L1 [GAP]/[ERR], L2 [GAP],
L3-A [GAP] with primitives [RUN], L3-B [UNK], L4 [GAP]/[UNK].  Next bounded delta: D13-SEED-BROKER-QUALIFICATION,
after the owner decisions D-1..D-9 are visible.
NO PRODUCTION REPAIR was performed or folded into D12.
```
