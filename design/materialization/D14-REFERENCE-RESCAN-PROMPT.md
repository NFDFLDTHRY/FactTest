# D14 - Owner prompt for the technical reference rescan (tracked verbatim)

STATUS: OWNER PROMPT RECORD (routed through the Factory as D14-PROMPT-INTAKE before any assembly)
MERGE ANNOTATION (PR #5 x PR #6): the paths factory/deltas/D14.json, factory/fixtures/D14/, evidence/D14/ and design/environment-map/epochs/D14.json named below were relocated under D14-TECHNICAL-REFERENCE-RESCAN / D14-RESCAN by design/materialization/D14-MERGE-RECONCILIATION.md; the text is preserved as written.
DATE: 2026-09-24
RECEIVED IN: the session that had integrated D9 (development branch claude/d9-rust-cargo-proof-4nys6s, restarted on
main 4d8a4c0e2568ecda75981aeaef0dc797fb23d928 = merge of PR #4 = D13-REPO-HYGIENE)
CONTEXT NAMED BY THE REPOSITORY: docs/HANDOFF.md section 1 "next: D14 TECHNICAL REFERENCE RESCAN, starting from
design/materialization/D13-PRE-RESCAN-BASELINE.md"; PRE-RESCAN-BASELINE D-R1..D-R5 (published authority hosts denied
by the egress policy; 49 of 64 authority nodes never reopened; js-api #internal-storage drift; source-line citations).

## Prompt (verbatim)

```text
Solve the retrieval problem and get all the relevant sources to the factor ingested.
```

## Reading adopted for assembly (interpretation, not part of the prompt)

- "the retrieval problem": the D11-D13 finding that every published authority host (doc.rust-lang.org,
  webassembly.github.io, gpuweb.github.io, w3c.github.io, *.spec.whatwg.org, tc39.es, git-scm.com, www.w3.org,
  source.chromium.org, chromium.googlesource.com, raw.githack.com) is denied by the session egress policy, so the
  technical references could be read only from source repositories pinned by commit.
- "the factor": the Factory.  "ingested": brought into the repository through the Factory (StructuralDelta,
  workpiece, stations, receipts, verification, integration), as reproducibility copies with recorded identity.
- "all the relevant sources": every document cited by REFERENCE-AUTHORITY.md (99 links, 21 hosts) and every
  AUTHORITY node of design/environment-map/graph.json (64 nodes, 56 GitHub-pinned).
- The prompt does not authorize editing law text, pinning new authority as current, or routing around the policy
  by any means other than hosts the policy already allows.
