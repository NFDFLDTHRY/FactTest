# Environment Map Schema (design/environment-map/graph.json)

STATUS: D11 - node/edge classes, owners, environment-state schema.  The machine-readable copy of this schema lives in
graph.json under `node_classes` and `edge_semantics`; tests/envmap/envmap.mjs validates every node and edge against it.

## 1. Graph envelope

```text
schema             "facttest-environment-map/1"
delta              the StructuralDelta that assembled this graph
repository_commit  the FactTest commit every IMPLEMENTATION node and every LAW-* pin refers to
assembled          date of assembly (not an authority observation date)
invariants[]       the eleven [INV] lines of the D10 prompt, carried verbatim
node_classes{}     class -> { owner_rule, required[] }
edge_semantics{}   type  -> { from[], to[], meaning, requires[]? }
nodes[]            sorted by (class, id)
edges[]            sorted by (type, from, to, condition)
```

## 2. Node classes

Every node carries `id`, `class` and `owner`.  Ownership is who may assert the node, never who wrote the file.

```text
AUTHORITY             owner_rule: authority_owner (external editor/body) or a FactTest law file (PROJECT_LAW)
  authority_id, title
  exact_url, exact_fragment        the CURRENT authority (hyperlink + clause); fragment null = document root (coarse)
  authority_owner
  authority_class                  STANDARD_RELEASE | LIVING_STANDARD | EDITOR_DRAFT | PROPOSAL | RUST_REFERENCE |
                                   TOOL_DOC | TARGET_DOC | IMPLEMENTATION_DOC | IMPLEMENTATION_SOURCE | PROJECT_LAW
  maturity                         free text preserving the document's own status wording
  observed_date                    when the CURRENT authority was last opened (2026-09-23 = Pass 2 when reopen DENIED)
  reopen_status                    OPENED | DENIED | NOT_ATTEMPTED   (DENIED = egress policy; published text unverified)
  reproducibility_pin              { repo, branch, commit, path, sha256, observed, locator } of the SOURCE file opened by
                                   commit; a separate identity from the current authority (never merged)
  extracted_consequence            the computational consequence FactTest relies on (identity + consequence, not prose)
  fragment_status                  PRESENT_IN_SOURCE | NO_FRAGMENT_CITED | DERIVED_FROM_DFN_UNVERIFIED |
                                   DERIVED_FROM_HEADING_UNVERIFIED | FRAGMENT_DRIFT: ... [ERR]
  secure_context_required?         true when the clause exposes the interface only in secure contexts

CONSTRAINT            owner_rule: CONSTRAINT-LEDGER.md (LEDGER ids) | D11 (PROPOSED ids) | contract files (kind=contract)
  constraint_id, statement, authority_refs[] (AUTHORITY ids), scope, conflicts[] (CONFLICT-LEDGER ids)
  ledger_status                    LEDGER | PROPOSED   (PROPOSED = discovered by traversal; returned to ASCII, not yet law)
  kind                             project | external | contract
  contract_status?                 READY-CONTRACT | GAP | ERR | UNK   (kind=contract only; from the registry data)
  external_refs_unmapped?          document-root URLs cited by a contract that have no AUTHORITY node (coarse citation)

COMPUTATIONAL_FACT    owner_rule: D11, derived only from evidence edges or their absence
  fact_id, subject, predicate
  required_environment[]           environment predicates the fact depends on (dimension names, see section 4)
  constraint_refs[]                CONSTRAINT ids the fact satisfies or violates
  status                           RUN (executed and observed) | ERR | GAP | UNK | OBS (observed, not an execution claim)
  note?, source_ref?               where the status comes from (D9 ids, evidence locators)

ENVIRONMENT           owner_rule: the epoch/evidence that recorded it
  environment_id
  environment_class                PHYSICAL_HOST | PHYSICAL_BROWSER | SYNTHETIC_MODEL
  toolchain                        { stable{rustc, rustc_commit, llvm, cargo}, nightly{..., components[], clippy} } or null
  target                           compilation/execution target(s)
  host_runtime                     node / browser / git identity as recorded
  versions                         exact version strings observed (userAgent, product, revision, jsVersion, node, playwright, os, kernel)
  flags                            launch args, RUSTFLAGS, cargo flags, network policy
  build_profile                    dev | release | mixed | n/a
  origin_security                  { origin, secure_context, cross_origin_isolated }
  permissions_policy               requested permissions / policy state
  implementation_hardware_class    e.g. "software GPU: SwiftShader (fallback adapter)" | "CPU only" | "modeled"
  dependency_graph_identity        cargo metadata identity / bundle hash set
  other_state                      epochs, limits, pins
  identity_completeness            { missing[], present[] }   -> query Q11 lists evidence whose environment misses fields

PROBE                 owner_rule: the harness/adapter that executes it (implemented_by)
  probe_id, proves_fact[] (COMPUTATIONAL_FACT ids), command_or_operation
  expected_observations[], failure_meaning[]     what a PASS shows and what each failure means under the governing constraint
  implemented_by                   IMPLEMENTATION id

EVIDENCE              owner_rule: the Factory receipt that produced the artifact
  evidence_id, probe_ref (PROBE id), environment_ref (ENVIRONMENT id)
  artifact_identity                { path, sha256 | "git-commit:<sha1>", locator, identity_source }
  observed_result, epoch
  status                           RUN | ERR | GAP | UNK | OBS | PENDING (PENDING only for evidence this delta is about to produce)
  evidence_class                   PHYSICAL_HOST | PHYSICAL_BROWSER | SYNTHETIC_MODEL   (synthetic never counts as execution)

IMPLEMENTATION        owner_rule: the repository path at a commit
  impl_id, repo_path, commit, kind (compiler | template | harness | factory | fixture_data), note
```

## 3. Edge types (defined semantics; no generic links)

```text
AUTHORIZES      AUTHORITY -> CONSTRAINT | COMPUTATIONAL_FACT     the cited clause permits/requires the statement
DEPENDS_ON      AUTHORITY -> AUTHORITY ; CONSTRAINT -> CONSTRAINT  relies on the prerequisite clause/constraint (followed sublink)
REQUIRES        COMPUTATIONAL_FACT -> ENVIRONMENT ; CONSTRAINT -> COMPUTATIONAL_FACT
                                                                 fact holds only under that environment state; constraint holds only if the fact holds
CONFLICTS_WITH  AUTHORITY <-> AUTHORITY ; CONSTRAINT <-> CONSTRAINT  preserved disagreement; edge carries conflict_id and note
IMPLEMENTED_BY  COMPUTATIONAL_FACT | CONSTRAINT | PROBE -> IMPLEMENTATION   the repository code that realizes it
BUILT_WITH      IMPLEMENTATION | EVIDENCE -> ENVIRONMENT           produced by that toolchain/host state
EXPOSED_BY      COMPUTATIONAL_FACT -> ENVIRONMENT                  interface present in that environment (presence only)
ADMITTED_BY     COMPUTATIONAL_FACT -> EVIDENCE                     the AdmissionReceipt that admitted it at an epoch
PROBED_BY       COMPUTATIONAL_FACT -> PROBE                        the probe that can establish or refute it
EVIDENCED_BY    COMPUTATIONAL_FACT | PROBE -> EVIDENCE             the recorded observation
INVALIDATED_BY  COMPUTATIONAL_FACT | EVIDENCE -> EVIDENCE | ENVIRONMENT   the observation/epoch that revoked it
STALE_IF        COMPUTATIONAL_FACT | EVIDENCE -> ENVIRONMENT  + condition {dimension, relation}
                                                                 stops being claimable when that dimension of that environment changes
FALLS_BACK_TO   COMPUTATIONAL_FACT -> COMPUTATIONAL_FACT           verified alternative selected when the former is invalidated
GOVERNS         CONSTRAINT -> PROBE                                the constraint under which the probe's failure_meaning is read
```

## 4. Environment-state dimensions (used by STALE_IF conditions and required_environment)

```text
toolchain.stable.rustc_release      toolchain.nightly.rustc_commit      toolchain.nightly.components
browser.product                     browser.revision                    browser.js_engine        browser.flags
host_runtime.node_version           host_runtime.git_version            host.gpu_device_node
origin_security.origin              origin_security.secure_context      origin_security.cross_origin_isolated
network_egress.policy               dependency_graph_identity           authority.source_commit  repo.commit
```

## 5. Validation rules (tests/envmap/envmap.mjs validate)

node ids unique; every class declared; required fields present; every node has an owner; every edge type has semantics;
no dangling edges; endpoints match the semantics; STALE_IF carries condition; a DENIED reopen never inherits the pin's
date; authorities have exact_url; IMPLEMENTATION never carries authority_class and AUTHORITY never carries repo_path;
probes prove resolvable facts and state failure meanings; evidence has environment and probe refs; non-PENDING evidence
carries an artifact identity; SYNTHETIC_MODEL evidence never has status RUN; every RUN fact has EVIDENCED_BY or
ADMITTED_BY; fact status vocabulary; refs resolve; the eleven prompt invariants are carried.

## 6. Evidence epochs (D13)

```text
graph.json = merge( D11 graph at fdb9c32 , epochs/D12.json , epochs/D13.json )      tests/envmap/envmap.mjs merge
epoch file  { schema "facttest-environment-map-epoch/1", epoch, delta, commit, summary, nodes[], edges[] }
merge law   an epoch only ADDS nodes and edges (an existing id or an identical edge is an error); each added node gets
            introduced_in = <epoch>; the envelope gains epochs[] {epoch, delta, commit, summary, nodes_added,
            edges_added} and current_epoch.  Earlier nodes are never edited: a later epoch that supersedes an earlier
            fact adds INVALIDATED_BY / CONFLICTS_WITH edges and new nodes instead.
merge-check re-merges and byte-compares graph.json; every base node and edge must be present unchanged.
bind        fills sha256/bytes of an epoch's PENDING evidence from the committed files after the stations ran
            (status_after_bind), then the graph is re-merged and the views re-rendered.
validate    + epochs_consistent (every introduced_in names an epoch; node counts add up)
Q16         what each epoch added (nodes by class, facts -> probes -> evidence -> environments, authorities) and its
            cross-epoch edges.
```

## 7. Authority revisions (D14)

```text
epoch-declared schema   an epoch file may declare node_classes / edge_semantics (add-only; redeclaring a name is an
                        error); merge records them in the envelope with declared_in = <epoch>
AUTHORITY_REVISION      a later observation of one AUTHORITY: current_authority {url, status, fragment_published},
                        source {repo, branch, ref_status, commit, path, sha256, pin_check, relation_to_pin},
                        fragment {cited, recorded, at_pin, at_tip}, clause {method, status, pin_lines, tip_lines},
                        maturity {recorded, declared_at_pin, declared_at_tip, observed, drift}, movement[] (UNCHANGED
                        MOVED EDITORIAL SEMANTIC MATURITY REMOVED SPLIT/MERGED UNREACHABLE AMBIGUOUS), locator
                        {old, new, kind, verified} | null, rationale.  The AUTHORITY node is never edited.
REVISES                 AUTHORITY_REVISION -> AUTHORITY
OBSERVED_IN             AUTHORITY_REVISION -> EVIDENCE (the reopen record)
validate                + revision_revises_its_authority, revision_movement_vocabulary, revision_has_reopen_evidence
Q17                     latest revision per authority (epoch order) -> movement -> downstream constraints, facts,
                        probes, evidence, with the consequence of each class; facts_to_recheck excludes EDITORIAL and
                        UNREACHABLE (which alone change no claim)
builder                 tests/reference/build-revisions.mjs (reopen evidence + tests/reference/<epoch>-review.json)
```


## 8. Exact clauses and claim traversal (D15)

```text
CLAUSE                  one exact clause of one AUTHORITY at a named source tip: clause_id, authority_ref, trace, epoch,
                        source {repo, commit, path, sha256}, locator {requested, line_start, line_end, derivation,
                        enclosing_section}, excerpt_sha256, quoted[] (the phrases verified present), consequence.
                        Admitted only VERIFIED (located at the tip, every quoted phrase present).  Declared by epoch D15.
CLAUSE_OF               CLAUSE -> AUTHORITY (the document the clause lives in)
GROUNDS                 CLAUSE -> CONSTRAINT | COMPUTATIONAL_FACT (the clause text is the ground)
LEADS_TO                CLAUSE -> CLAUSE (a sublink followed because it changes legality, lifecycle, failure, security,
                        storage, admission or proof interpretation)
EXTRACTED_IN            CLAUSE -> EVIDENCE (the extraction record: commit, sha256, lines, excerpt)
validate                + clause_of_its_authority, clause_has_extraction_identity, clause_connected (every clause grounds
                        something or leads to a clause that does)
Q18                     claim traversal for every COMPUTATIONAL_FACT: CLAIM -> CURRENT AUTHORITY -> EXACT CLAUSE ->
                        AUTHORITY MATURITY -> REPRODUCIBILITY PIN -> PROJECT CONSTRAINT -> IMPLEMENTATION CONTRACT ->
                        ENVIRONMENT -> PROBE -> PHYSICAL EVIDENCE -> STALE CONDITIONS; terminal COMPLETE, the first
                        broken step, or the claim's own [GAP]/[OBS]/[UNK]/[ERR] status.  An unverified published
                        rendering is an annotation on the maturity step, not a stop.
proposed constraints    CONSTRAINT nodes with ledger_status PROPOSED (not yet in CONSTRAINT-LEDGER.md; reconciled in D18)
extractor / builder     tests/reference/clauses.mjs (manifest tests/reference/<epoch>-clauses.json) and
                        tests/reference/build-clauses.mjs
```

## 9. Capability universe (D16)

```text
CAPABILITY_FAMILY       one approved family of G (one row of CAPABILITY-MATRIX.md): family_id, matrix_row, in_G,
                        current_authority, admission_contract, lifecycle_failure, evidence_required (verbatim from the
                        matrix), steps {API, SECURE_CONTEXT, PERMISSION_POLICY, REQUEST, FEATURES_LIMITS, LIFECYCLE, LOSS:
                        CLAUSE | NONE_DEFINED | GAP + reason}, census {state, record}, classification [RUN|OBS|GAP|ERR|UNK],
                        rationale, run_parts, maturity.  Declared by epoch D16.  Only an ASCII decision removes a family.
TRACE_STEP              CAPABILITY_FAMILY -> CLAUSE  + step (+ none_defined when the clause verified an absence)
WITNESSED_BY            CAPABILITY_FAMILY -> COMPUTATIONAL_FACT (the runtime/evidence facts the classification rests on)
CLAUSE (extension)      absent_in_document[]: phrases verified absent from the whole source at the tip
validate                + family_classification_vocabulary, family_steps_match_edges; clause_connected counts TRACE_STEP
Q19                     per family: the seven authority steps, RUNTIME ADMISSION (classification), PROBE OBLIGATION (matrix
                        evidence + witness probes), EVIDENCE; first gap; totals by classification
census facts            FACT-CAP-<family>-EXPOSURE [OBS]: exposure / non-prompting discovery / permission state / policy
                        answer in one browser environment; never admission (CON-CAP-001)
tools                   tests/capability/{census.mjs, universe.json, build-universe.mjs, gate.mjs}
```

## 10. Implementation behaviour (D17)

```text
IMPLEMENTATION_BEHAVIOR what a named implementation version does: behavior_id, implementation, version,
                        relation_to_standard (CONFORMS | HOST_CHOICE_PERMITTED | PLATFORM_DEFAULT | FLAG_GATED |
                        EXPERIMENTAL_NOT_SHIPPED | NOT_IMPLEMENTED | SHIPPED | VERSION_SPECIFIC | TEST_HARNESS_CHOICE |
                        TOOLING), statement, environment_dimension, stale_if, runtime_status (OBS | UNK), label.  The class
                        declaration carries the vocabularies and the implementation authority classes (IMPLEMENTATION_SOURCE,
                        IMPLEMENTATION_DOC, TARGET_DOC, TOOL_DOC).  Declared by epoch D17.
SOURCED_BY              IMPLEMENTATION_BEHAVIOR -> CLAUSE of an implementation-class authority, pinned to the version run
RELATES_TO_STANDARD     IMPLEMENTATION_BEHAVIOR -> CLAUSE (standard class) | CONSTRAINT  + relation
EXPLAINS                IMPLEMENTATION_BEHAVIOR -> COMPUTATIONAL_FACT (observed runtime); the builder adds STALE_IF on the
                        explained fact for the behaviour's environment dimension
clause sources          a branch tip (D15/D16), a pinned commit, or an installed local file (tests/reference/lib.mjs sourceKey)
validate                + behavior_vocabulary, behavior_sourced_by_implementation, behavior_standard_is_not_implementation;
                        clause_connected counts SOURCED_BY
Q18                     EXACT CLAUSE also accepts implementation clauses reached through a behaviour that EXPLAINS the claim
                        (labelled "implementation")
Q20                     per behaviour: implementation layer, standard layer, runtime layer, stale condition
tools                   tests/implementation/{reality.json, label-audit.json, label-audit.mjs, build-kernels.sh,
                        wasm-sections.mjs, build-reality.mjs, gate.mjs}
```

## 11. Reconciliation and the current model (D18)

```text
RECONCILIATION          one re-examination: reconciliation_id, subject, traversal {AUTHORITY_CHANGED, CONSTRAINT, FACT,
                        IMPLEMENTATION_CONTRACT, ENVIRONMENT, OLD_PROBE_SUFFICIENT, OLD_EVIDENCE_APPLICABLE}, outcome
                        (HOLDS | SUPERSEDED | RESOLVED | CORRECTED | LEDGERED | ANNOTATED | OPEN), surfaces, note,
                        new_probe_obligation.  The class declaration carries both vocabularies.  Declared by epoch D18.
RECONCILES              RECONCILIATION -> any node it re-examined
SUPERSEDES              successor -> superseded (AUTHORITY or COMPUTATIONAL_FACT, same class) + reconciliation; the
                        superseded node stays as history; the declaration lists the inheritable edge types per class and
                        direction, and the successor carries each such edge with both endpoints mapped to current nodes
LEDGERED_IN             CONSTRAINT (ledger_status PROPOSED on the node) -> project-law AUTHORITY + locator, reconciliation
current                 a node is current unless superseded; RESOLVED closes a non-RUN fact record; CORRECTED attaches
                        the current reading of a wording
validate                + reconciliation_vocabulary, reconciliation_has_subject, resolved_only_non_run_facts,
                        supersession_well_formed, successor_carries_inherited_edges, ledgered_constraints_well_formed,
                        stale_facts_reconciled
Q17                     a claim introduced at or after a revision's epoch is not made stale by it; with reconciliations:
                        reconciled_by / current_authority per movement, facts_reconciled, facts_open
Q18                     authority steps use current authorities; terminal [SUPERSEDED] by X / [RESOLVED]; reconciled_by
Q19, Q20                current witnesses / explained facts only; Q02, Q09 mark superseded_by
Q21                     reconciliation traversal, current model, new probe obligations
tools                   tests/reconcile/{d18-reconciliation.json, surfaces.json, build-reconciliation.mjs, surfaces.mjs,
                        gate.mjs, stage-audit.mjs}
```

## 12. Repair epochs (D18R)

```text
repair epoch            an epoch that declares nothing and uses the reconciliation classes to correct what contradicts
                        committed evidence (register tests/reconcile/<epoch>-reconciliation.json with optional parts)
supersession chains     a successor may itself be superseded; currentOf follows the chain; the builder inherits through
                        the graph's existing SUPERSEDES edges; validate checks every link
retired_texts           register field: texts no current AUTHORITY / COMPUTATIONAL_FACT may carry (gate)
Q21                     revised_by on a reconciliation row and its obligation when a successor it introduced was
                        superseded later
```

## 13. Re-proof and the entitled-claim surface (D19)

```text
FULFILLS                EVIDENCE -> RECONCILIATION + obligation: the evidence discharges the probe obligation a
                        reconciliation addressed to a later pass (Q21 fulfilled_by).  Declared by epoch D19.
re-proof epoch          new ENVIRONMENT nodes for the current identity (host as the proof sets bind it, browser default
                        and GPU flag set with the executable launched, authority sources with every tip read recorded in
                        other_state.sources); one EVIDENCE node per record a re-proved fact rests on; the re-proved fact
                        is EVIDENCED_BY it and STALE_IF the new environment in each dimension it was already stale in;
                        a failed re-proof is INVALIDATED_BY its record
selection               tests/reprove/select.mjs: a current RUN/OBS fact is selected on DRIFT of a STALE_IF dimension
                        (tests/reprove/dimensions.json rules; UNK never counts as SAME), on a change of its
                        implementation or probe harness after its newest physical evidence (git), or on an obligation
                        addressed to the pass; tests/reprove/runbook.json maps each to the group that re-proves it
Q22                     entitled-claim surface: per current fact the claim bounded to the environments of its newest
                        physical evidence, that epoch, whether the current epoch re-proved it, and its Q18 terminal;
                        explicit_stops separates open [GAP]/[ERR]/[UNK] facts from those later evidence INVALIDATED
                        (closed history; D19 route finding, repaired by fixture F11 before the graph was built)
tools                   tests/reprove/{identity.mjs, select.mjs, run-selected.mjs, lineage.mjs, build-reprove.mjs,
                        gate.mjs, dimensions.json, runbook.json, obligations.json}; tests/envmap/browser-probe.mjs records
                        the executable launched
```

## 14. Joined lines and the second re-proof (D20)

```text
epoch alias             an epoch entry FILE=LABEL merges FILE under LABEL when its own label is taken by another line's
                        epoch; the file stays byte-identical and the merged epoch list records relabeled_from
                        (epochs/D14-RESCAN.json is the D14 epoch of the line merged into main by pull request #5)
line import             tests/sync/import-line.mjs with a map (tests/sync/<delta>-line.json): every change of the other
                        line is added or relocated byte-identically, unioned (law documents, insertion-only), embedded
                        (the ledger block), regenerated (graph and views) or live (the handoff); --check verifies each
inheritance             build-reconciliation.mjs carries inheritable edges for every supersession in the graph, so an
                        epoch merged later that attached edges to a superseded node has them on the current successor
carried conditions      select.mjs: once a claim was re-proved, the stale condition carried to the environment of its
                        newest evidence (same dimension and relation) supersedes the older one (superseded_conditions);
                        --pass names the pass the obligations are addressed to
lineage                 non-Factory merges are owner pull-request merges or SYNC merges (tree equal to the first parent:
                        no content); any other merge is a violation
```

## 15. Execution manifest epochs (D21)

```text
execution manifest      design/execution-manifest/{manifest.json, CURRENT-EXECUTION-MANIFEST.md}, generated by
                        tests/manifest/build-manifest.mjs from git ls-files, cargo metadata, this graph, the receipts and
                        the station registry over the reviewed component register tests/manifest/components.json: every
                        tracked path in exactly one tier (PRODUCTION, FACTORY, TEST, FIXTURE, REFERENCE, RECORD, LAW,
                        HISTORICAL, EVIDENCE); per live component its owner (law), input/operation/output, dependencies,
                        consumers, authorized and receipting stations, tests, task regression, probes, graph claims,
                        evidence and stale dimensions; automated findings
issue inventory         tests/manifest/issues.json: every automated finding and every reviewed finding classified A..G
                        (GAP CLASSIFICATION LAW) with the task that repairs it; tests/manifest/gate.mjs refuses an
                        unclassified finding or an issue that covers nothing
manifest epoch          tests/manifest/build-epoch.mjs: ENV-<E>-HOST (identity capture), one IMPLEMENTATION node per live
                        component the graph did not cover, PROBE-EXECUTION-MANIFEST, evidence for the manifest, the gate
                        and the inventory, FACT-<E>-LIVE-SURFACES-ENUMERATED [OBS] IMPLEMENTED_BY every live
                        implementation node and STALE_IF repo.commit, FACT-<E>-ISSUES-CLASSIFIED [OBS]
enumeration vs claim    an enumeration fact is [OBS]: it states what exists and is connected, never that it executes;
                        execution claims of the enumerated components are added by the tasks that run them
rebuild check           tests/manifest/rebuild-check.sh (D21R): the committed manifest rebuilds byte-identically in a clean
                        clone at its integration commit, from the graph as committed there (the delta's own epoch merged
                        in) and from the graph merged without it; the builder removes its own epoch (the merge's
                        introduced_in tag: nodes, touching edges, epochs entry) before any claim is read
fact epochs             tests/envmap/build-fact-epoch.mjs (D21R): one add-only epoch per repair delta binding its physical
                        results - sha256 EVIDENCE records, a PROBE, ENV-<E>-HOST from the identity capture - to a [RUN]
                        fact IMPLEMENTED_BY the repaired component, from a delta-owned spec (tests/envmap/facts/<E>.json)
witness register        tests/factory/witnesses.json (D22): every refusal reason of the D21-D26 prompt -> the Factory law
                        witnesses (factory/tests/factory_law.rs) that assert the refusing check, the refusal texts, the
                        stage; tests/factory/run-witnesses.sh builds the judge from the tree, runs the suite, checks the
                        register and records the judge's sha256; tests/sync/collision-witness.sh witnesses the import
                        collision in a scratch repository.  A witness that fails for an unrelated reason is not a pass.
crate DAG execution     tests/toolchain/run-crate-dag.mjs (D23): every HOST_NATIVE_SET root in Cargo's dependency order -
                        build dev, build release, focused tests, the tests of each direct consumer - then the
                        WASM64_KERNEL_SET root built core-only; per-crate records and a summary (evidence/<E>/crates)
transport probe         host/harness/kernel-build-probe.mjs (D23; proof.mjs browser-build, Q-WASM-08): BUILD and OBSERVE
                        driven in Chromium through the wasm exports, every artifact and bundle file compared
                        byte-for-byte with host/factc; the wasm export surface is the whole kernel API (21 exports)
genericity specimens    fixtures/genericity/<name>/specimen.json (D24): an executable specimen as data - source, registry,
                        metrics, payloads, what it varies, and its expectations (transfers, variants, strength, E0/loss/E1
                        backends with and without WebGPU); tests/genericity/run-specimens.mjs executes every specimen
                        through the same machinery and tests/genericity/run-attacks.mjs the attack list; the generated
                        runtime executes transfer(relation, bytes) by the verified requirement of the relation
evidence binding        the generated runtime opens every evidence tape with @{bundle strategy_data=<sha256> ...} (D24):
                        the sha256 of the verified strategy data (STRATEGY_SHA256 in selector.js, strategy_data_sha256 in
                        bundle.json, BundleVerifier B-06/B-08); factc observe compares it with the manifest it is given
                        (evidence_lineage OBS/ERR, EVIDENCE_UNBOUND) - evidence of one bundle is not evidence of another
physical webapp probe   host/harness/webapp-probe.mjs (D25): the generated shell driven through its own controls with the
                        exact environment identity (browser, host, origin, secure context, isolation, WebGPU adapter,
                        artifact hashes vs bundle.json, toolchain, epochs) beside every observation; loopback-served
                        (optionally COOP/COEP) or a public https:// URL; tests/physical/run-webapp.mjs maps every runtime
                        behaviour of the D25 prompt to its evidence; tests/physical/public-https-probe.sh records the
                        public-HTTPS boundary of the execution environment (no localhost substituted)
commissioning epoch     epochs/D26.json (D26) = the re-proof fragment (tests/reprove/build-reprove.mjs: ENV-D26-*, the
                        selection and group records as evidence, the re-proved facts' edges, the process facts) + the fact
                        fragment (tests/envmap/build-fact-epoch.mjs on the graph holding the first: the whole-system,
                        consistency and final-condition facts), concatenated by tests/envmap/concat-epochs.mjs; the runbook
                        now maps every current claim (groups manifest, physical, qualified-proof with the crate DAG)
final audit             tests/audit/consistency-audit.mjs (the five equalities of the D26 prompt from the registers) and
                        tests/audit/final-condition.mjs (the 21 [PASS] lines from named evidence): computed, never asserted
```
