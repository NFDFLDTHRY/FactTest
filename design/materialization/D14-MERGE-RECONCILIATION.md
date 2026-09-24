# Merge reconciliation of PR #5 (D14-TECHNICAL-REFERENCE-RESCAN) and PR #6 (D14-D19 review series)

STATUS: OWNER-DIRECTED GIT MERGE RECORD (not a StructuralDelta; see the [GAP] in section 4)
DATE: 2026-09-24
PARENTS: main 1205fda00deff8c66cd7e3bb8eb529c87d6a472c (merge of PR #5) and 780aee1b50c4a799a62b760823a3d1460d386d0f
(PR #6 head, claude/facttest-materialization-27amc7).  Both descend from 4d8a4c0 (PR #4, D13-REPO-HYGIENE).
INSTRUCTION: "Resolve merge conflicts." (owner, in the PR #5 session).

## 1. What conflicted

```text
Two deltas both named D14 were assembled from different owner prompts on different branches:
  PR #5  D14-PROMPT-INTAKE 6778133, D14-TECHNICAL-REFERENCE-RESCAN 8d5ea6f   (retrieval route + reference ingress)
  PR #6  D14-D19-PROMPT-INTAKE 5e57467, D14-FRONTIER-REOPEN 46cc28b .. D19-REPROVE-REOBSERVE 780aee1
33 conflicting files: factory/deltas/D14.json, factory/fixtures/D14/F0..F2, evidence/D14/{envmap,workpieces,index.json},
design/environment-map/epochs/D14.json (add/add); design/environment-map/{graph.json, AUTHORITY-REGISTER.md,
TRACEABILITY.md}, design/materialization/LEDGER.md, docs/HANDOFF.md, REFERENCE-AUTHORITY.md, CONSTRAINT-LEDGER.md,
CONFLICT-LEDGER.md, IMPLEMENTATION-CONTRACTS.md, EVIDENCE-OBLIGATIONS.md (content).
```

## 2. Decision and resolution

```text
BOTH LINES KEPT WHOLE.  Nothing of either line is dropped or rewritten in substance.
D14-D19 series          every path kept as integrated on the PR #6 branch (the larger, cross-referencing line).
rescan line             relocated under its full delta id because the paths collided:
  factory/deltas/D14.json                       -> factory/deltas/D14-TECHNICAL-REFERENCE-RESCAN.json
  factory/fixtures/D14/                         -> factory/fixtures/D14-TECHNICAL-REFERENCE-RESCAN/
  evidence/D14/                                 -> evidence/D14-TECHNICAL-REFERENCE-RESCAN/
  design/environment-map/epochs/D14.json        -> design/environment-map/epochs/D14-RESCAN.json  (epoch id D14-RESCAN)
  inside the relocated delta, fixtures and epoch the same path strings were rewritten; EVIDENCE nodes keep their
  sha256 (the files did not change); receipts under factory/receipts/D14-TECHNICAL-REFERENCE-RESCAN/ are untouched
  and still name the original paths (they are the record of the run at 8d5ea6f, where the originals live).
graph                   regenerated with the D19 envmap tool from the D11 base and epochs D12, D13, D14, D15, D16, D17,
                        D18, D18R, D14-RESCAN, D19 (1213 nodes / 2897 edges; validate 42 PASS; merge-check PASS;
                        render-check PASS).  The rescan epoch is merged after D18R and before D19 so that D19 stays the
                        current evidence epoch of the stable baseline (Q22; merging it last made the D19 gate's claim
                        surface fail); ten AUTHORIZES edges from authorities that D18 superseded are carried by their
                        D18 successors (rule successor_carries_inherited_edges).
ROUTES.json             29 explicit NO_ROUTE rules added for authority URLs that the D14-D19 series introduced after the
                        rescan ingest (plan-check requires every graph authority URL to resolve or be declared NO_ROUTE;
                        nothing new was ingested; a later re-ingest may add copies for them).
law files               PR #6 versions, then the rescan's insertion-only D14 ANNOTATION lines re-applied with
                        tests/reference/ingress.mjs annotate (idempotent); under a citation the order is D13, D14, D18;
                        0 deleted lines in every law file; FACTORY-LAW.md untouched by both lines.
LEDGER.md               PR #6 entries, the D19 AFTER (780aee1, PR #6), the two rescan entries with the D14 AFTER (8d5ea6f,
                        PR #5 -> main 1205fda) and the relocation map, then this reconciliation; one placeholder.
docs/HANDOFF.md         PR #6 text plus the rescan's state rows (sections 1, 5, 6) and the merge boundary row.
tests/reference/        holds both lines: the series' <epoch>-clauses.json manifests and the rescan's ingress.mjs.
```

## 3. Observed after the resolution

```text
[RUN] envmap validate 42 PASS; merge-check base 211 nodes / 475 edges preserved; render-check identical views
[RUN] ingress plan-check PASS; ingress verify PASS (83 copies unchanged); handoff-check PASS; status-scan PASS
[RUN] D19 gate PASS on the merged graph (identity recorded; claim surface: 106 current RUN claims, 105 claimable,
      1 invalidated by design, 29 re-proved in D19); STABLE-BASELINE: ESTABLISHED still holds
[OBS] the D19 delta's own re-inspection command lists epochs D12..D19 only; on the merged graph that merge-check
      reports the extra D14-RESCAN epoch: expected, historical (it was true at 780aee1)
[ERR] kept: the nine drifted fragments (rescan) and D18's two resolutions overlap on #internal-storage and
      #streaming-modules; the seven others still need an owner law delta
```

## 4. Boundary

```text
[GAP] FACTORY-LAW.md integrates fast-forward only and has no merge station; a two-parent reconciliation of parallel
      lines cannot be produced by the Factory.  This merge is an owner-directed change outside station execution,
      recorded here and in the ledger, never presented as a delta.  Returned to ASCII: a reconciliation station (or a
      law clause) for parallel lines, and a rule that a delta id is reserved before assembly so two D14 cannot recur.
[OBS] the PR #6 branch was not rewritten; the merge commit lives on claude/d9-rust-cargo-proof-4nys6s and contains
      780aee1, so the PR #6 branch can fast-forward to it.
```
