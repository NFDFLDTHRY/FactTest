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
