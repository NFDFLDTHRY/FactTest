# D11 - Intended Computational Environment Map ASCII

STATUS: MATERIALIZATION D11 - INTENDED SYSTEM (ASCII WORKING SURFACE, ROUTED ONLY AFTER STRUCTURAL CHECK: PASS)
DATE: 2026-09-24
PROMPT: design/materialization/D10-COMPUTATIONAL-ENVIRONMENT-MAP-PROMPT.md (tracked by D10-PROMPT-INTAKE, commit 4a151c9)
CANONICAL BASE: 4a151c9ae58f9968c70b9b85cef82a02fba12b85 (branch claude/facttest-materialization-27amc7 = D9 head e10d279 + D10)
LAW: FACTORY-LAW.md, FACTORY-CONTRACTS.md, REFERENCE-AUTHORITY.md "Citation law", FINAL-HANDOFF-REQUIREMENTS.md "Evidence honesty".

D11 builds the MAP.  It repairs nothing in production, adds no capability implementation, pins no toolchain, and rewrites
no earlier evidence.  The map converts hyperlink-first authority into hyperlink-connected, computationally evidenced
claims: every node of the graph says who owns it, every edge says what it means, every [RUN] says in which environment
it ran, and every [ERR]/[GAP]/[UNK] from D9 stays visible.

## 0. Observation before drawing (no repository change)

[OBS] Git: PR #1 (D0-D8) merged to main f4395df; D9 (e10d279, Factory-authored) sits on the unmerged branch
      claude/d9-rust-cargo-proof-4nys6s; the prompt's required D9 inputs exist only there.  The designated branch was
      fast-forwarded to e10d279 (no history discarded); D10 tracked the prompt on top (4a151c9).  Working tree clean.
[OBS] Network egress: the published authority hosts are DENIED by the environment's network policy (HTTP 403 on
      CONNECT through the agent proxy): doc.rust-lang.org, webassembly.github.io, gpuweb.github.io, w3c.github.io,
      html.spec.whatwg.org, git-scm.com, chromium.googlesource.com, v8.dev, api.github.com.  WebFetch reports the
      same EGRESS_BLOCKED.  Reachable: github.com (git protocol) and raw.githubusercontent.com.
      Consequence for the SUBLINK TRAVERSAL LAW: the "actual current authority" (the published editor's draft / release
      page) could NOT be re-opened in this session.  What CAN be opened is each authority's source repository at a
      commit resolved by `git ls-remote` at observation time.  The map therefore carries, per authority, two separate
      identities that must never be conflated:
        exact_url + exact_fragment  = the published authority (observed_date = 2026-09-23 from Pass 2; reopen DENIED)
        reproducibility_pin         = {repo, commit, path, sha256} of the SOURCE file opened on 2026-09-24
      A clause extracted from the source is marked source_observed; the published rendering remains [UNK] for D11.
[OBS] Source pins resolved and fetched (branch tip at 2026-09-24T04:2xZ, then fetched BY COMMIT):
        rust-lang/reference 52ffdc09065e0043e877546da923c01bf875d41d  src/names/preludes.md
        rust-lang/cargo     694054f34bcb04025b16d0eaf075038c0e58a15d  doc/book/src/reference/unstable.md
        rust-lang/rust      3670d2532bdf51abbe0b8fea22284d7ca340ffe3  src/doc/rustc/src/platform-support/wasm64-unknown-unknown.md,
                                                                     compiler/rustc_target/src/spec/targets/wasm64_unknown_unknown.rs
        WebAssembly/spec    608711107b7f1edb13efd57b7d79b49477462d36  document/core/{text,syntax,binary}/types.rst,
                                                                     document/core/appendix/changes.rst, document/js-api/index.bs,
                                                                     document/web-api/index.bs
        WebAssembly/threads cc535ada1aa21cfaa3cabf3ac73b89acef78a0a0  proposals/threads/Overview.md
        WebAssembly/shared-everything-threads (tip)                  proposals/shared-everything-threads/Overview.md
        gpuweb/gpuweb       454d33cfdf6b8c8a1efafe490623cf0905e6c245  spec/index.bs, wgsl/index.bs
        w3c/webappsec-secure-contexts 68191bb08a685c1e2d2270e72d2b14b36ba96f42  index.bs
        whatwg/html         cd8ac6f1bbf86dd0bd09ef75d27dacaebe7b4c1d  source
        git/git             0f8e75abebff0877cae681a3d5ff31ac47f54220  Documentation/{gitrevisions,glossary-content,gitrepository-layout,git-worktree}.adoc
        google/swiftshader  (tip)                                    README.md
        chromium/chromium   75d6f0c05bd0871db3f3bc97fccf6605115250c4  docs/gpu/swiftshader.md, gpu/config/gpu_switches.cc,
                                                                     ui/gl/gl_switches.cc, content/public/common/content_switches.cc
        v8/v8               36de2a2334c9129db7f6fe0db76fd7d5fa64df78  src/flags/flag-definitions.h
      Not resolvable: Chromium's `--enable-features` switch definition (base/base_switches.cc absent at that commit; four
      candidate paths 404) -> [UNK] exact definition; the flag remains recorded as used by the probe.
[OBS] Fragment drift found while locating cited clauses in the sources (published rendering unverifiable, see above):
        REFERENCE-AUTHORITY / CONSTRAINT-LEDGER WA-005 / contracts.ascii cite js-api/#internal-storage; the source's
        section is <h2 id="webassembly-storage">Internal storage</h2> with the agent-sharing note under
        <h3 id="store">.  The cited fragment is not an id in the source.                              [ERR] fragment
        html workers.html#navigator.hardwareconcurrency: source has <h4 id="navigator.hardwareconcurrency"> (heading)
        and the attribute dfn data-x="dom-navigator-hardwareConcurrency".  Cited fragment is the heading id -> OK.
        gitglossary#def_commit: source anchor [[def_commit]] present -> OK.
        gpuweb #dom-gpu-requestadapter / #dom-gpuadapter-requestdevice / #dom-gpudevice-lost / #dom-gpudevice-destroy:
        the source defines these as <dfn> entries under dfn-for=GPU / GPUAdapter / GPUDevice; Bikeshed derives the
        published ids from them -> plausible, unverified [UNK] (published page denied).
[OBS] This container (ENV-D11-HOST, probed 2026-09-24T04:23Z): stable rustc 1.94.1 (e408947bf 2026-03-25, LLVM 21.1.8),
      cargo 1.94.1 (29ea6fb6a); nightly rustc 1.100.0-nightly (6bb1652a0 2026-09-22, LLVM 23.1.1), cargo 1.100.0-nightly
      (495c385d0 2026-09-16); nightly components: cargo, rust-src, rust-std, rustc -> NO nightly clippy; no
      rust-toolchain.toml; Node v22.22.2 (V8 12.4.254.21-node.39); Playwright 1.56.1 -> Chromium 141.0.7390.37
      (revision 1194, /opt/pw-browsers/chromium-1194); Ubuntu 24.04.4, Linux 6.18.44-fc-v37 x86_64, 4 logical CPUs
      (Intel Xeon 2.80GHz), 16 GB, no /dev/dri (no GPU device node); git 2.43.0; wasm-tools/wabt absent.
      Compared with D9's container: same stable; DIFFERENT nightly (D9: 6eeff9a52 2026-09-23 with clippy).  Compared with
      D1-D3: SAME nightly commit (6bb1652a0).  The nightly identity has now been observed in three states across four
      evidence epochs with no repository pin: [GAP] T9-P7 stays open and is now a mapped STALE_IF relation.
      D9's T9-P3-04 (nightly clippy over the wasm64 graph) is NOT reproducible on ENV-D11-HOST (component absent):
      that [RUN] is valid for ENV-D9 only.
[OBS] D9 findings carried unchanged (preserved as nodes, never resolved here): [ERR] workspace not natively buildable
      as a whole (T9-P1-01, T9-P2-02, T9-P3-02); [GAP] no toolchain pin (T9-P7-01); [GAP] heuristic nostd-check/depcheck
      in factory/src (weight none); [GAP] literal wildcard surfaces in factory/src/paths.rs (S-FIXTURE "compiler/*/tests/",
      "compiler/*/src/" never match); [UNK] vendored-code blindness of path rules; [UNK] dev-profile wasm64 module
      reproducibility; [UNK] compile-fail expectations pinned to rustc 1.94.1 messages; [RUN] T9-P2/P4/P5/P6/P8 and
      M1-M8; HISTORY overstatements (full suite / clippy clean / rejected-by-rustc / nostd-check / depcheck).
[OBS] Existing physical evidence carries PARTIAL environment identity: probe records hold userAgent, launch flags,
      origin, secure-context bit and adapter info, but no Chromium revision, no V8 version, no OS/CPU identity, and no
      isFallbackAdapter bit; D0-D8 station receipts carry no toolchain identity at all (only D1 build logs and D9
      records do).  Mapped as FACT-EVIDENCE-IDENTITY-GAPS with per-evidence missing fields (query Q11).

## 1. Intended system

```text
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║            D11 · COMPUTATIONAL ENVIRONMENT MAP  (authority -> requirement -> environment ->    ║
║                     execution -> evidence -> what FactTest may claim)                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

 SOURCES (read-only)                                   MAP DATA (S-DOC)                 [NEW]
 REFERENCE-AUTHORITY.md  (frontier)      ---+          design/environment-map/graph.json
 CONSTRAINT-LEDGER.md, CONFLICT-LEDGER.md   |  assemble   nodes: AUTHORITY, CONSTRAINT, COMPUTATIONAL_FACT,
 IMPLEMENTATION-CONTRACTS.md, CAPABILITY-   +---------->        ENVIRONMENT, PROBE, EVIDENCE, IMPLEMENTATION
 MATRIX.md, RUNTIME-ADMISSION-REPLAN.md     |          edges: AUTHORIZES DEPENDS_ON REQUIRES CONFLICTS_WITH
 EVIDENCE-OBLIGATIONS.md, D9 docs+evidence  |                 IMPLEMENTED_BY BUILT_WITH EXPOSED_BY ADMITTED_BY
 evidence/D1,D3,D6,D7,D9 records            |                 PROBED_BY EVIDENCED_BY INVALIDATED_BY STALE_IF
 authority SOURCE files pinned by commit ---+                 FALLS_BACK_TO GOVERNS   (each with defined semantics)
                                                       design/environment-map/SCHEMA.md      (node/edge classes, owners,
                                                                                              environment-state schema)
                                                                   |
                                                                   v
                                          MAP MACHINERY (S-FIXTURE)                              [NEW]
                                          tests/envmap/envmap.mjs   first-party node ESM, no deps
                                             validate : schema, owners, endpoints, edge semantics, id uniqueness,
                                                        authority identity (url+fragment vs pin separate), probe
                                                        proves_fact resolvable, evidence has environment_ref
                                             query    : Q01..Q15 (the STRUCTURAL QUESTIONS) by deterministic traversal
                                             stale    : STALE_IF closure per environment dimension
                                             render   : AUTHORITY-REGISTER.md, TRACEABILITY.md (deterministic text)
                                          tests/envmap/authority-fetch.mjs  re-resolve tips, fetch pins BY COMMIT,
                                                        sha256, record DENIED hosts (evidence, never a station failure)
                                          tests/envmap/host-identity.sh     toolchain/node/browser/OS identity -> JSON
                                          tests/envmap/browser-probe.mjs    Chromium: CDP Browser.getVersion (product,
                                                        jsVersion), userAgent, isSecureContext, crossOriginIsolated,
                                                        SharedArrayBuffer presence, 'gpu' in navigator, requestAdapter
                                                        -> info{vendor,architecture,isFallbackAdapter}, features,
                                                        limits.maxBufferSize, WebAssembly.validate(i64-memory module);
                                                        two launch configurations (GPU flags | default)
                                                                   |
                                                                   v
                                          EXECUTE / PROBE (S-BUILD, S-BROWSER)                    [NEW]
                                          evidence/D11/validate.json, queries/Q01..Q15.json, stale.json,
                                          render-check.json, authority/fetch-records.json, host/identity.json,
                                          browser/{gpu-flags,default}.json     (S-EVIDENCE indexes with sha256)
                                                                   |
                                                                   v
                                          OBSERVED (S-DOC)                                       [NEW]
                                          design/materialization/D11-OBSERVED-ENVIRONMENT-MAP.md
                                          intended predictions (section 7) vs observed answers; [ERR]/[GAP]/[UNK] kept
                                                                   |
                                                                   v
                                                          USER + FABLE (ASCII loop)
```

### 1.1 Node classes and owners

```text
CLASS               OWNER (who may assert it)                 IDENTITY FIELDS (schema in SCHEMA.md)
AUTHORITY           the external editor/body named in         authority_id, title, exact_url, exact_fragment, authority_owner,
                    authority_owner; project law nodes are    authority_class {STANDARD_RELEASE, LIVING_STANDARD, EDITOR_DRAFT,
                    owned by FactTest law files               PROPOSAL, RUST_REFERENCE, TOOL_DOC, TARGET_DOC, IMPLEMENTATION_DOC,
                                                              IMPLEMENTATION_SOURCE, PROJECT_LAW}, maturity, observed_date,
                                                              reopen_status {OPENED, DENIED, NOT_ATTEMPTED}, reproducibility_pin?
                                                              {repo, commit, path, sha256, observed}, extracted_consequence
CONSTRAINT          CONSTRAINT-LEDGER.md (existing ids) or    constraint_id, statement, authority_refs[], scope, conflicts[],
                    D11 (new ids, ledger_status PROPOSED)     ledger_status {LEDGER, PROPOSED}, kind {project, external, contract}
COMPUTATIONAL_FACT  D11 (derived from evidence or its absence) fact_id, subject, predicate, required_environment[], constraint_refs[],
                                                              status {RUN, ERR, GAP, UNK, OBS}
ENVIRONMENT         the epoch that recorded it (evidence)     environment_id, class {PHYSICAL_HOST, PHYSICAL_BROWSER, SYNTHETIC_MODEL},
                                                              toolchain, target, host_runtime, versions, flags, build_profile,
                                                              origin_security, permissions_policy, implementation_hardware_class,
                                                              dependency_graph_identity, other_state, identity_completeness
PROBE               the harness/adapter that executes it      probe_id, proves_fact[], command_or_operation, expected_observations[],
                                                              failure_meaning[], implemented_by
EVIDENCE            the Factory receipt that produced it      evidence_id, probe_ref, environment_ref, artifact_identity{path,sha256},
                                                              observed_result, epoch, status, evidence_class
IMPLEMENTATION      the repository path at a commit           impl_id, repo_path, commit, kind {compiler, template, harness, factory,
                                                              fixture_data}, note   (needed as the target of IMPLEMENTED_BY; kept
                                                              distinct from AUTHORITY per [INV] authority != implementation)
```

### 1.2 Edge semantics (every edge is one of these; no generic "related to")

```text
EDGE             FROM -> TO                                MEANING
AUTHORIZES       AUTHORITY -> CONSTRAINT|FACT              the cited clause permits/requires the statement
DEPENDS_ON       AUTHORITY -> AUTHORITY                    the clause relies on the prerequisite clause (followed sublink)
                 CONSTRAINT -> CONSTRAINT                  the constraint presupposes the other
REQUIRES         FACT -> ENVIRONMENT                       the fact holds only in an environment with the stated state
                 CONSTRAINT -> FACT                        the constraint is satisfied only if the fact holds
CONFLICTS_WITH   AUTHORITY <-> AUTHORITY, CONSTRAINT <->    preserved disagreement (CONFLICT-LEDGER ids; never flattened)
IMPLEMENTED_BY   FACT|CONSTRAINT -> IMPLEMENTATION          the repository code that realizes it
BUILT_WITH       IMPLEMENTATION|EVIDENCE -> ENVIRONMENT     the artifact was produced by that toolchain/host state
EXPOSED_BY       FACT -> ENVIRONMENT                        the interface is present in that environment (presence only)
ADMITTED_BY      FACT -> EVIDENCE                           the AdmissionReceipt that admitted the implementation at an epoch
PROBED_BY        FACT -> PROBE                              the probe whose observations can establish/refute the fact
EVIDENCED_BY     FACT|PROBE -> EVIDENCE                     the recorded observation
INVALIDATED_BY   FACT|EVIDENCE -> EVIDENCE|ENVIRONMENT      the observation/epoch that revoked it
STALE_IF         FACT|EVIDENCE -> ENVIRONMENT  (+condition) the fact/evidence stops being claimable when the named dimension
                                                            of that environment changes (condition = {dimension, relation})
FALLS_BACK_TO    FACT -> FACT                               verified alternative selected when the former is invalidated
GOVERNS          CONSTRAINT -> PROBE                        the constraint under which the probe's failure_meaning is read
```

### 1.3 The three vertical traces (node ids as they will appear in graph.json)

```text
TRACE 1  RUST -> WASM64
AUTH-RUST-REF-NOSTD (r[names.preludes.extern.no_std.intro]: no_std = std not linked, core prelude)
  -AUTHORIZES-> CON-RS-001 -REQUIRES-> FACT-CORE-ONLY-GRAPH (12 crates compile with core only for wasm64)
AUTH-CARGO-BUILD-STD (unstable.md "build-std": rust-src component, nightly cargo AND rustc, -Z build-std on every
  invocation, `-Z build-std=core,...` form) -AUTHORIZES-> CON-RS-002 -REQUIRES-> FACT-CORE-ONLY-GRAPH
AUTH-RUSTC-WASM64-DOC (Tier 3; no prebuilt std -> build-std; cfg(target_arch="wasm64"); 64-bit pointers; no
  panic=unwind; prose "memory64 ... not standardized") -DEPENDS_ON-> AUTH-RUSTC-WASM64-TARGET-SPEC (features
  +bulk-memory,+mutable-globals,+sign-ext,+nontrapping-fptoint; -mwasm64; pointer_width 64)
  -AUTHORIZES-> CON-RS-003, CON-EM-004 (engine must accept the four merged proposals) ; CONFLICTS_WITH AUTH-WASM-CORE-CHANGES-64 (ERR-001)
AUTH-WASM-CORE-SYNTAX-ADDRTYPE (address types = subset of number types) <-DEPENDS_ON- AUTH-WASM-CORE-TEXT-ADDRTYPE (WA-001)
AUTH-WASM-CORE-TEXT-MEMTYPE (WA-002) -DEPENDS_ON-> AUTH-WASM-CORE-BINARY-LIMITS (limits flag carries address type)
AUTH-WASM-CORE-CHANGES-64 ("64-bit Address Space" under Release 3.0)
  -AUTHORIZES-> FACT-WASM64-MODULE-I64 (kernel module declares i64 memory: I64 min 311/312) -PROBED_BY-> PROBE-WASM-INSPECT
AUTH-WASM-JSAPI-MEMORIES (MemoryDescriptor.address: AddressType i32|i64) ; AUTH-WASM-JSAPI-VALIDATE (validate(bytes))
  -AUTHORIZES-> FACT-MEMORY64-DISCOVERED (host validates an i64-memory module) -PROBED_BY-> PROBE-WASM64-DISCOVER
AUTH-WASM-JSAPI-STORAGE (id webassembly-storage/store: no sharing among agents) -AUTHORIZES-> CON-WA-005 ; CONFLICTS_WITH AUTH-WASM-THREADS (ERR-002)
AUTH-WASM-WEBAPI-STREAMING (application/wasm + ok + CORS-same-origin) -AUTHORIZES-> CON-WA-004 ... no PROBE  [GAP]
FACT-WASM64-ABI-EXEC (Chromium 141 instantiates the kernel module, abi_version 1, imports [])
  -REQUIRES-> ENV-D9-BROWSER-DEFAULT / ENV-D1-D3-BROWSER ; -PROBED_BY-> PROBE-KERNEL-HOST-BROWSER ; -EVIDENCED_BY-> EV-D9-T9-P8-03, EV-D1-B10-B11
FACT-NODE-NO-MEMORY64 (Node 22 / V8 12.4 CompileError on the module) -EVIDENCED_BY-> EV-D1-B10-NODE  [OBS]
FACT-NATIVE-WORKSPACE-UNBUILDABLE [ERR], FACT-DEFAULT-MEMBERS-13 [ERR], FACT-TOOLCHAIN-DRIFT [GAP] (3 nightly states),
FACT-NIGHTLY-CLIPPY-ABSENT-D11 [OBS] -> STALE_IF edges to ENV-* on toolchain.nightly.rustc_commit / components
TRACE 2  WEBGPU
AUTH-SECCTX-TRUSTWORTHY (https/wss; 127.0.0.0/8; localhost; file) -AUTHORIZES-> CON-SEC-001, FACT-LOOPBACK-SECURE-CONTEXT
AUTH-GPU-NAVIGATOR-GPU ([SecureContext] attribute gpu on Navigator/WorkerNavigator) -DEPENDS_ON-> AUTH-SECCTX-TRUSTWORTHY
  -AUTHORIZES-> CON-EM-001 (navigator.gpu requires a secure context) -REQUIRES-> FACT-GPU-EXPOSED (navigator.gpu present)
AUTH-GPU-REQUESTADAPTER (may return null; implementation-defined; sets [[fallback]]) -AUTHORIZES-> CON-GPU-001
  -REQUIRES-> FACT-GPU-ADAPTER-SWIFTSHADER (vendor google, architecture swiftshader)  and FACT-GPU-ADAPTER-NULL-DEFAULT
AUTH-GPU-FALLBACK-ADAPTER (definition; GPUAdapterInfo.isFallbackAdapter) -AUTHORIZES-> CON-EM-002 (fallback/software != hardware)
AUTH-GPU-ADAPTERINFO (vendor/architecture normalized identifiers) ; AUTH-SWIFTSHADER-README (CPU-based Vulkan) ;
  AUTH-CHROMIUM-SWIFTSHADER-DOC (--use-angle=swiftshader; --enable-unsafe-swiftshader is a WebGL opt-in, "not intended
  for running untrusted content") ; AUTH-CHROMIUM-GPU-SWITCHES (enable-unsafe-webgpu, ignore-gpu-blocklist) ;
  AUTH-CHROMIUM-GL-SWITCHES (use-angle, "swiftshader", enable-unsafe-swiftshader) ; AUTH-CHROMIUM-CONTENT-SWITCHES (disable-gpu)
  -AUTHORIZES-> FACT-GPU-ADAPTER-SWIFTSHADER -REQUIRES-> ENV-D6-D7-BROWSER-GPUFLAGS  (implementation documentation, NOT standards law)
AUTH-GPU-ADAPTER-EXPIRE (adapters may expire at any time; requestAdapter again before requestDevice) -AUTHORIZES-> CON-EM-003
AUTH-GPU-REQUESTDEVICE (requiredFeatures subset; adapter consumed; expired -> device lost "unknown") -AUTHORIZES-> CON-GPU-001b
AUTH-WGSL (ED) -AUTHORIZES-> CON-GPU-003 -> FACT-WGSL-UNEXERCISED [GAP] (no shader in any evidence; relay = buffer copy)
AUTH-GPU-LIMITS-MAXBUFFERSIZE (default 256 MiB) -> FACT-GPU-MAXBUFFERSIZE-OBSERVED (1 GiB on SwiftShader)
FACT-GPU-KNOWN-ANSWER (upload/copy/readback exact 256 B) -PROBED_BY-> PROBE-WEBGPU-KNOWN-ANSWER -ADMITTED_BY-> EV-D7-ADM-E0-WEBGPU
FACT-GPU-RELAY-EXACT-E0 (payloads A,B exact via plan 1) -EVIDENCED_BY-> EV-D7-E0-RELAY
AUTH-GPU-DESTROY (destroy -> lose the device(this, "destroyed")) -DEPENDS_ON-> AUTH-GPU-LOSE-DEVICE (invalidate; resolve lost)
  -DEPENDS_ON-> AUTH-GPU-LOST (promise pending for device lifetime) -AUTHORIZES-> CON-GPU-002
  -> FACT-GPU-LOSS-DESTROYED -PROBED_BY-> PROBE-CONTROLLED-LOSS -EVIDENCED_BY-> EV-D7-CONTROLLED-LOSS
FACT-GPU-ADMITTED-E0 -INVALIDATED_BY-> EV-D7-ADM-E1-WEBGPU (REJECTED device_lost) ; -FALLS_BACK_TO-> FACT-WASM64-ADMITTED-E1
FACT-RESELECTION-NO-CODEGEN (plan 1 -> plan 0, bundle hashes unchanged) -EVIDENCED_BY-> EV-D7-E1-RELAY, EV-D7-BUNDLE-UNCHANGED
every physical [RUN] above -STALE_IF-> ENV-D6-D7-BROWSER-GPUFLAGS {browser.product|flags|adapter|origin changes}
TRACE 3  FACTORY EXECUTION ENVIRONMENT
AUTH-GIT-GLOSSARY-COMMIT, AUTH-GIT-REVISIONS -AUTHORIZES-> CON-FT-004 (canonical_base is a commit object name)
AUTH-GIT-WORKTREE, AUTH-GIT-REPO-LAYOUT (worktrees/<id>) -AUTHORIZES-> FACT-WORKPIECE-ISOLATION (git worktree add --detach at
  canonical_base; state outside the tree) -IMPLEMENTED_BY-> IMPL-FACTORY-GIT
LAW-FACTORY-CONTRACTS-4 (StationSpec MAY/MUST surfaces) -AUTHORIZES-> CON-FT-005 (station surfaces are prefix sets)
  -> FACT-LITERAL-PATH-MATCH (covers(): "*" | dir/ prefix | exact file; no glob) [GAP D9] -IMPLEMENTED_BY-> IMPL-FACTORY-PATHS
  -> FACT-WILDCARD-SURFACES-DEAD (S-FIXTURE "compiler/*/tests/", "compiler/*/src/" match nothing) -PROBED_BY-> PROBE-PATHS-LITERAL
FACT-STATION-ENV-UNRECORDED (fixture commands inherit the container's PATH/toolchain; receipts carry no toolchain identity)
  -EVIDENCED_BY-> EV-D6-F5-RECEIPT (fields) ; -> Q11
FACT-FF-ONLY-INTEGRATION (merge --ff-only; canonical_base_unmoved; canonical_working_tree_clean) -IMPLEMENTED_BY-> IMPL-FACTORY-OPS
FACT-REINSPECTION-MATCH (canonical tree == verified workpiece tree) -EVIDENCED_BY-> W<n>.state.json (outside tree) [OBS]
```

### 1.4 Structural questions -> queries (deterministic traversal; each writes evidence/D11/queries/Qnn.json)

```text
Q01 why believe capability X works       FACT(status RUN) <-PROBED_BY/EVIDENCED_BY/ADMITTED_BY chain to EVIDENCE with environment_ref
Q02 which authority permits/requires X   AUTHORIZES edges into FACT and into its constraint_refs, with exact_url+fragment+pin
Q03 which subclauses does X depend on    transitive DEPENDS_ON closure from Q02's authorities
Q04 which toolchain/browser/target state  REQUIRES/BUILT_WITH/EXPOSED_BY edges to ENVIRONMENT nodes (full identity printed)
Q05 what evidence executed X              EVIDENCED_BY edges whose evidence status is RUN and evidence_class PHYSICAL_*
Q06 stale if rustc changes                STALE_IF edges whose condition.dimension starts with toolchain.rustc|toolchain.nightly|toolchain.stable
Q07 stale if Chromium changes             STALE_IF edges whose condition.dimension starts with browser.
Q08 claims requiring secure context       FACT/CONSTRAINT with required_environment containing origin_security.secure_context=true,
                                          plus AUTHORITY nodes whose extracted_consequence carries secure_context_required
Q09 authority with no probe               AUTHORITY -AUTHORIZES-> {CONSTRAINT|FACT} with no PROBED_BY reachable (2 hops)   [GAP list]
Q10 probes with no governing constraint   PROBE with no incoming GOVERNS and no proves_fact whose constraint_refs is non-empty
Q11 evidence lacking environment identity EVIDENCE whose environment_ref's identity_completeness lists missing fields
Q12 contracts citing authority coarsely   CONSTRAINT(kind contract) whose authority_refs point to AUTHORITY with exact_fragment null
                                          or reopen_status DENIED + fragment not found in source (fragment drift)
Q13 [RUN] valid for one machine epoch     FACT status RUN whose REQUIRES/EVIDENCED_BY environments are all a single environment_id
Q14 proposal mistaken for baseline        AUTHORITY class PROPOSAL that AUTHORIZES a FACT with status RUN (must be empty) + registry
                                          contract families whose authority is PROPOSAL but status is READY-CONTRACT (must be empty)
Q15 implementation doc mistaken for law   AUTHORITY class IMPLEMENTATION_DOC|IMPLEMENTATION_SOURCE|TARGET_DOC that AUTHORIZES a
                                          CONSTRAINT of kind external without a STANDARD_* co-authority (list; ERR-001 expected)
```

### 1.5 Stale/dependency relations (representable as STALE_IF edges with conditions)

```text
dimension                                   what becomes unclaimable when it changes
toolchain.nightly.rustc_commit              FACT-CORE-ONLY-GRAPH, FACT-WASM64-MODULE-I64 (dev/release sha), EV-D9-T9-P5-*, EV-D9-T9-P8-*, EV-D1-D3-B9
toolchain.nightly.components                FACT-CORE-ONLY-GRAPH (rust-src), EV-D9-T9-P3-04 (clippy)  <- already stale on ENV-D11-HOST
toolchain.stable.rustc_release              EV-D9-T9-P4-* (diagnostic wording pinned to 1.94.1), EV-D9-T9-P2-*
browser.product / browser.revision          every PHYSICAL_BROWSER evidence (D1 B10-B11, D6/D7 physical, D9 T9-P8-03)
browser.flags                               FACT-GPU-ADAPTER-SWIFTSHADER, FACT-GPU-ADMITTED-E0, all E0 WEBGPU evidence
browser.js_engine                           FACT-MEMORY64-DISCOVERED, FACT-WASM64-ABI-EXEC
host.gpu_device_node / adapter identity     FACT-GPU-ADAPTER-SWIFTSHADER (a hardware adapter would be a different fact)
origin_security.secure_context              FACT-GPU-EXPOSED (navigator.gpu is [SecureContext])
authority.source_commit                     every extracted_consequence (re-extract when the pin moves; published page still DENIED)
repo.commit                                 every IMPLEMENTATION node (impl at commit 4a151c9)
```

### 1.6 Components, ownership, sequence

```text
FIXTURE      STATION     MAY CHANGE (narrowed)                                         PRODUCES
F0-doc       S-DOC       design/materialization/D11-INTENDED-ENVIRONMENT-MAP.md,        this ASCII, ledger BEFORE (+D10 AFTER),
                         design/materialization/LEDGER.md, design/environment-map/,     graph.json, SCHEMA.md, ENVIRONMENT-MAP.md,
                         factory/deltas/D11.json, factory/fixtures/D11/, receipts       AUTHORITY-REGISTER.md + TRACEABILITY.md (rendered
                                                                                        by the tool in the stage; S-BUILD re-renders and diffs)
F1-fixture   S-FIXTURE   tests/envmap/, receipts                                         envmap.mjs, authority-fetch.mjs, host-identity.sh,
                                                                                        browser-probe.mjs, run-envmap.sh, i64 probe module bytes
F2-build     S-BUILD     evidence/D11/                                                   validate.json, queries/, stale.json, render-check.json,
                         (source-nonmutating)                                            authority/fetch-records.json, host/identity.json
F3-browser   S-BROWSER   evidence/D11/browser/                                           browser identity + exposure probe records (2 launches)
F4-doc       S-DOC       design/materialization/D11-OBSERVED-ENVIRONMENT-MAP.md, ledger  observed comparison, [ERR]/[GAP]/[UNK] preserved
F5-evidence  S-EVIDENCE  evidence/D11/                                                   index.json (sha256 of every evidence file)

SEQUENCE  delta check -> W11 (worktree @ 4a151c9) -> F0 -> F1 -> F2 -> F3 -> F4 -> F5 -> verify -> integrate (ff-only)
          -> re-inspect (reinspect_commands: envmap validate + render-check on the canonical tree) -> observed compare
```

### 1.7 Inputs / outputs / consumers

```text
INPUT                                        OWNER              CONSUMER
REFERENCE-AUTHORITY.md + ledgers/contracts   Pass 2/5 law       assembly of AUTHORITY/CONSTRAINT nodes (read-only)
authority SOURCE files (pinned by commit)    external repos     extracted_consequence + reproducibility_pin fields; fetch probe
evidence/D1,D3,D6,D7,D9 records              earlier deltas     EVIDENCE nodes (artifact sha256 from index.json)
container state (toolchain, node, browser)   environment        ENV-D11-* nodes via host-identity.sh / browser-probe.mjs
OUTPUT                                       PRODUCER           TERMINAL ROLE / CONSUMER
graph.json                                   S-DOC              envmap.mjs (validate/query/stale/render); future deltas
SCHEMA.md, ENVIRONMENT-MAP.md                S-DOC              human/AI reader (outputs 1 and 4)
AUTHORITY-REGISTER.md, TRACEABILITY.md       tool via S-DOC     human/AI reader (outputs 2, 5, 6); S-BUILD render-check
evidence/D11/**                              S-BUILD/S-BROWSER  observed ASCII, index, re-inspection
D11-OBSERVED-ENVIRONMENT-MAP.md              S-DOC              human/AI interaction layer (output 8)
receipts + verification.json                 Factory            integration gate
```

### 1.8 Invariants (delta invariants; the prompt's [INV] set is carried verbatim into graph.json "invariants")

```text
I1  production untouched: compiler/, host/, factory/src/, factory/registry/, all law docs, D0-D10 deltas/fixtures/receipts/
    evidence, fixtures/{language,compiler,commissioning,toolchain}, tests/{bootstrap,commissioning,language,toolchain},
    Cargo.toml, Cargo.lock; rust-toolchain.toml stays absent (no pin)
I2  no third-party dependency: sh + node ESM + curl/git for fetch + existing factory binary + Playwright already in the host
I3  authority != implementation: IMPLEMENTATION nodes never carry authority_class; AUTHORITY nodes never carry repo_path
I4  current authority != reproducibility pin: exact_url/exact_fragment/observed_date/reopen_status vs reproducibility_pin
    are separate fields; a DENIED reopen never inherits the pin's date
I5  API presence != usable capability: EXPOSED_BY (presence) and ADMITTED_BY (admission receipt) are different edges
I6  synthetic != physical: ENVIRONMENT.class and EVIDENCE.evidence_class carry SYNTHETIC_MODEL vs PHYSICAL_*; a query never
    counts SYNTHETIC evidence as execution (Q05 filters evidence_class)
I7  recorded toolchain != pinned toolchain: ENVIRONMENT.toolchain is recorded; the pin field is absent everywhere (T9-P7 GAP)
I8  evidence without environment_ref fails validation; incomplete identity is listed, never invented (identity_completeness)
I9  no D9 [ERR]/[GAP]/[UNK] disappears: each is a node with status ERR/GAP/UNK and a source_ref to D9-OBSERVED
I10 the map machinery is generic over the graph: envmap.mjs knows node/edge classes, never FactTest facts
I11 probes run by stations only observe; a denied host, a null adapter, a missing component are evidence, not station failures
```

### 1.9 Tests and evidence obligations attached to the delta

```text
tests:      node tests/envmap/envmap.mjs validate design/environment-map/graph.json           (exit 0 = graph well-formed)
            node tests/envmap/envmap.mjs render ... && diff against committed register/traceability (render-check)
            node tests/envmap/envmap.mjs query --all ; stale --all                            (Q01..Q15, stale.json)
            node tests/envmap/authority-fetch.mjs (records; denied hosts are evidence)
            sh tests/envmap/host-identity.sh ; node tests/envmap/browser-probe.mjs (two launches)
            sh -n / node --check on every script (F1)
evidence:   evidence/D11/{validate.json, render-check.json, stale.json, queries/Q01..Q15.json, authority/fetch-records.json,
            host/identity.json, browser/gpu-flags.json, browser/default.json, index.json}
required:   design/environment-map/{graph.json, SCHEMA.md, ENVIRONMENT-MAP.md, AUTHORITY-REGISTER.md, TRACEABILITY.md},
            tests/envmap/envmap.mjs, D11-INTENDED/-OBSERVED, evidence/D11/validate.json, evidence/D11/index.json
forbidden:  target, rust-toolchain.toml, any change under compiler/ host/ factory/src/ factory/registry/
```

## 2. Expected observed outcome (predictions compared in D11-OBSERVED)

```text
validate            PASS: every node has an owner field; every edge type in the defined set; every endpoint resolves
render-check        PASS: committed AUTHORITY-REGISTER.md/TRACEABILITY.md byte-identical to a fresh render
authority-fetch     tips may have MOVED since assembly (recorded as current_tip != pinned commit, never an error);
                    every pinned fetch returns the same sha256 as graph.json; published hosts DENIED (403) again
host identity       equals section 0 (ENV-D11-HOST); nightly clippy ABSENT
browser (gpu flags) product Chrome/141.0.7390.37, jsVersion 14.1.x [UNK until observed], secureContext true on 127.0.0.1,
                    gpu exposed, adapter vendor google / architecture swiftshader, isFallbackAdapter [UNK: true expected],
                    memory64 validates, SharedArrayBuffer present iff crossOriginIsolated (expected false: no COOP/COEP headers)
browser (default)   gpu exposed (interface present), requestAdapter null (as D7 no-webgpu run), memory64 validates
Q06/Q07             non-empty (all D9 wasm64 evidence; all physical browser evidence)
Q09 (no probe)      WA-004 streaming/MIME, WGSL (GPU-003), WB-001 workers, WB-002 hardwareConcurrency, THREAD-001/002,
                    and every non-Byte-Relay capability family (29 GAP registry entries)                       [GAP list]
Q10 (no constraint) expected empty after GOVERNS edges; any residue is a mapping [GAP]
Q11 (identity gaps) D0-D8 receipts: toolchain absent; D6/D7 physical: browser revision, js engine, OS, isFallbackAdapter absent;
                    D9 T9-P8-03: launch flags absent (default launch); D1 B10-B11: same
Q12 (coarse)        WASM_SHARED_THREADS -> #internal-storage (fragment drift [ERR]); ACCELEROMETER/GYROSCOPE/MAGNETOMETER/
                    ORIENTATION_SENSOR/PROXIMITY_SENSOR/... cite document roots (no fragment); CPU_WASM64 cites the rustc
                    page root (page-level authority acceptable, flagged as coarse)
Q13 (one epoch)     every PHYSICAL_BROWSER RUN (D6, D7, D9 P8-03, D1 B10-B11); EV-D9-T9-P3-04 (ENV-D9 only)
Q14 (proposal)      empty in code; registry WASM_SHARED_THREADS status ERR/GAP (correct)
Q15 (impl-as-law)   ERR-001 (rustc doc prose vs Core 3.0); Chromium swiftshader.md governs WebGL fallback yet its flags are
                    the only documented basis for the WebGPU SwiftShader admission -> [UNK] WebGPU-specific documentation
```

## 3. Structural check

```text
every node class has an owner ............ 1.1 (7 classes, owner column) ............................................ PASS
every output has a consumer/terminal role  1.7 ......................................................................... PASS
every edge has defined semantics ......... 1.2 (13 required + GOVERNS, each with FROM/TO/MEANING) ....................... PASS
external claims point to exact authority . exact_url+exact_fragment where a stable clause exists; roots flagged coarse (Q12) PASS
authority and reproducibility pins separate  I4; two field groups; DENIED reopen keeps observed_date 2026-09-23 ........ PASS
probes identify what fact they can prove . PROBE.proves_fact[] + failure_meaning[]; validated .......................... PASS
evidence identifies its environment ...... EVIDENCE.environment_ref mandatory; identity_completeness lists gaps (Q11) ... PASS
stale conditions representable ........... STALE_IF edges with {dimension, relation}; 1.5 ................................ PASS
D9 findings remain visible ............... section 0 list -> nodes with status ERR/GAP/UNK and source_ref ................ PASS
no production repair hidden .............. delta MUST NOT CHANGE covers compiler/ host/ factory/src/ factory/registry/ ..... PASS
no illegal AGENT -> REPO path ............ all writes through W11 stations; canonical repo read-only until the gate ....... PASS
stations sufficient ...................... S-DOC (design/), S-FIXTURE (tests/), S-BUILD/S-BROWSER/S-EVIDENCE (evidence/);
                                           no new reusable capability missing -> no station forged ...................... PASS
network denial ........................... recorded as evidence and as reopen_status; not a reason to stop (the pass is
                                           still assemblable with source pins) ....................................... PASS (with [UNK])

STRUCTURAL CHECK: PASS  -> route StructuralDelta D11-COMPUTATIONAL-ENVIRONMENT-MAP
```
