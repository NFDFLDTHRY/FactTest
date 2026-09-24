# FactTest Station Registry

STATUS: PASS 5 INITIAL REGISTRY  
DATE: 2026-09-23

This registry defines reusable station classes for the eventual Fable materialization.

It does not implement them.

## S-DOC - DOC_CONTRACT_FORGE

Purpose:
materialize approved project-law/design/reference/control surfaces.

INPUT:
approved ASCII/design delta + text artifacts.

OUTPUT:
documentation/control-file workpiece changes.

MAY READ:
project law/design/reference surfaces and fixture inputs.

MAY CHANGE:
fixture-authorized documentation/control paths only.

MUST NOT CHANGE:
compiler source, generated artifacts, unrelated evidence.

VERIFY:
exact expected paths/content contracts, link/lint checks when required.

## S-RUST - RUST_FORGE

Purpose:
materialize approved first-party Rust compiler/runtime source.

INPUT:
approved crate/module contracts and fixture.

OUTPUT:
Rust source/Cargo surfaces in workpiece.

MAY READ:
approved compiler architecture/contracts, existing first-party code, relevant fixtures.

MAY CHANGE:
fixture-authorized compiler paths.

MUST NOT CHANGE:
Factory law/design source unless separately authorized; generated WebApp; canonical repo directly.

VERIFY:
no_std rules where applicable, no third-party dependencies, declared dependency DAG, build/check/tests.

## S-WEB - WEB_HOST_FORGE

Purpose:
materialize approved JavaScript/HTML/manifest/service-worker host machinery.

INPUT:
VerifiedStrategy/codegen contract or explicitly authorized host fixture.

OUTPUT:
host/WebApp surfaces in workpiece.

MAY CHANGE:
fixture-authorized host/generated-object assembly paths.

VERIFY:
authority-linked browser contract tests, import/export/adapters, bundle constraints.

## S-FIXTURE - FIXTURE_FORGE

Purpose:
create deterministic positive/negative fixtures.

OUTPUT:
test/fixture artifacts only.

MUST NOT:
change production semantics merely to make a test pass.

VERIFY:
fixture is bounded, deterministic where required, and has explicit expected outcome.

## S-BUILD - BUILD_VERIFY

Purpose:
build/check/test an isolated workpiece.

MAY READ:
workpiece + toolchain + fixture configuration.

MAY CHANGE:
ephemeral build outputs/evidence surfaces only.

MUST NOT CHANGE:
source or authoritative design.

OUTPUT:
structured build/test evidence.

## S-BROWSER - BROWSER_PROBE

Purpose:
run an approved generated bundle/runtime probe.

MAY READ:
verified/generated artifacts and probe fixture.

MAY CHANGE:
ephemeral/runtime/evidence surfaces only.

MUST NOT CHANGE:
source, project law, compiler source, authored ASCII.

OUTPUT:
RuntimeEvidence.

## S-EVIDENCE - EVIDENCE_ASSEMBLER

Purpose:
normalize raw station/build/probe outputs into declared evidence schemas.

MUST NOT:
rewrite failed evidence into PASS,
discard required failures,
invent observations.

OUTPUT:
evidence artifacts/indices.

## S-BUNDLE - BUNDLE_ASSEMBLER

Purpose:
assemble manufactured object B from already verified compiler/codegen outputs.

INPUT:
bundle parts + VerifiedStrategy + codegen/bundle manifest.

OUTPUT:
GeneratedBundle workpiece.

MUST NOT:
select new implementations or change source semantics.

VERIFY:
bundle manifest/lineage and BundleVerifier obligations.

## Registry law

A new reusable operation not represented here is [GAP] until a StationSpec is designed, qualified, and registered.

Station identity does not imply permanent filesystem ownership; fixture scope supplies the authorized workpiece surfaces for each job.

Read-only verification/probe stations must remain source-nonmutating.

D13 ANNOTATION (registry amendment, D13-REPO-HYGIENE): the JSON registry factory/registry/stations/*.json is authoritative for surfaces.  Surfaces are LITERAL ("*", "dir/" or an exact file); the Factory rejects wildcard-looking, absolute and dot-segment entries in station specs, deltas and fixtures.  S-FIXTURE version 2: the dead entries "compiler/*/tests/" (may change) and "compiler/*/src/" (must not change) are replaced by nothing and by the literal "compiler/" respectively; its effective authority is unchanged (a future grant to compiler/<crate>/tests/ is an explicit literal entry approved in ASCII).  New station S-ANNOTATE (LAW_ANNOTATION): insertion-only annotations of an explicit list of root documents, never FACTORY-LAW.md.  The legacy scanners `factory nostd-check` and `factory depcheck` are HEURISTIC diagnostics with proof weight NONE and may not be used as gates.
