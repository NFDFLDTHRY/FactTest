# fixtures/reference - technical reference corpus (reproducibility pins)

STATUS: LIVE FIXTURE DATA, ingested by D14-TECHNICAL-REFERENCE-RESCAN through the Factory (S-FIXTURE).
LAW: REFERENCE-AUTHORITY.md citation law; PASS1.md ("living/editor documents are used for current semantics";
"dated snapshots/PDFs are historical unless explicitly pinned for reproducibility").

Every file under `published/` and `sources/` is a REPRODUCIBILITY PIN: a byte-exact copy of one authority document at
one recorded repository commit.  It is never the current authority.  The current authority remains the hyperlink in
REFERENCE-AUTHORITY.md; a copy here says what that link resolved to at ingest time, so that a claim can be re-checked
without the network and so that drift can be measured later.

```text
ROUTES.json      the retrieval solution as data: for every cited host, which GitHub repository/branch holds the
                 published rendering (gh-pages) and the source, and which URLs map to which copy (url_map)
REGISTER.json    identity of every copy: repository, branch, branch head commit (git ls-remote at ingest), path,
                 bytes, sha256, git blob id, fetch time; plus the D11/D12 authority pins re-fetched and compared
published/<host>/<path>      rendering taken from the publisher's gh-pages branch (PAGES_BRANCH route)
sources/<owner>/<repo>/<path> source taken from the publisher's default branch
```

The retrieval problem and its route (evidence/D14/ingress/hosts.json): the session egress policy denies every
published authority host (CONNECT 403).  A publisher that serves through GitHub Pages keeps the rendering in its
gh-pages branch; that branch's head is resolved through the session git proxy (`git ls-remote`) and each file is
fetched immutably by commit from raw.githubusercontent.com, which the policy allows.  A rendering obtained this way
was NOT observed at the published host; the register and the environment graph say so (reopen status
REOPENED_VIA_PAGES_BRANCH).  Hosts without a Pages branch (WHATWG standards, doc.rust-lang.org, git-scm.com, W3C TR
snapshots, Chromium code search) have NO_ROUTE for the rendering and are pinned as source only.

Re-check without the network:   node tests/reference/ingress.mjs verify --routes fixtures/reference/ROUTES.json --corpus fixtures/reference --register fixtures/reference/REGISTER.json --out /tmp/verify.json
Re-fetch by recorded commit:    add --refetch (every copy must be byte-identical)
Re-audit the citations:         node tests/reference/ingress.mjs audit --routes ... --corpus ... --register ... --map REFERENCE-AUTHORITY.md --graph design/environment-map/graph.json --out <dir>
Re-ingest at new branch heads:  node tests/reference/ingress.mjs fetch ... (a new StructuralDelta; the register's commits move, history keeps the old copies)

Fragment vocabulary used by the audit: VERIFIED_IN_PUBLISHED_RENDERING (id present in the Pages-branch copy),
ABSENT_IN_PUBLISHED_RENDERING [ERR] (cited fragment is not an id there; nearest ids listed), PRESENT_IN_SOURCE
(explicit id/label/anchor in the source copy), DERIVED_FROM_DFN_UNVERIFIED / DERIVED_FROM_HEADING_UNVERIFIED (the
generator would derive the id; not observed), NOT_FOUND_IN_SOURCE [ERR], NO_FRAGMENT_CITED (document root),
NO_ROUTE [UNK] (no copy exists for that URL).
