//! LANGUAGE-TESTS.md L0-L35 witnesses plus PASS6 grammar witnesses (P6-G01, P6-G02, P6-A01..A03).
//! Every test drives the kernel through the public ABI with fixture sources under fixtures/language.

use factc_foundation::{ArtifactKind, DiagCode, OutBuf};
use factc_kernel::{Mode, Status, Workspace};
use std::path::PathBuf;

fn fixture(name: &str) -> Vec<u8> {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../fixtures/language")
        .join(name);
    std::fs::read(&p).unwrap_or_else(|e| panic!("{}: {}", p.display(), e))
}

struct Run {
    ws: Box<Workspace>,
    status: Status,
}

fn run_units(units: &[&[u8]], mode: Mode) -> Run {
    // The kernel owns no heap: its bounded arenas live in the caller's Workspace, so give the caller a real stack.
    let owned: Vec<Vec<u8>> = units.iter().map(|u| u.to_vec()).collect();
    std::thread::Builder::new()
        .stack_size(256 * 1024 * 1024)
        .spawn(move || {
            let mut ws = Box::new(Workspace::new());
            for u in &owned {
                factc_kernel::submit_source_bytes(&mut ws, u).unwrap();
            }
            let status = factc_kernel::check_or_compile(&mut ws, mode);
            Run { ws, status }
        })
        .unwrap()
        .join()
        .unwrap()
}

fn run(name: &str) -> Run {
    run_units(&[&fixture(name)], Mode::Analyze)
}

impl Run {
    fn has(&self, code: DiagCode) -> bool {
        self.ws.diagnostics.has_code(code)
    }
    fn codes(&self) -> Vec<&'static str> {
        self.ws.diagnostics.iter().map(|d| d.code.name()).collect()
    }
    fn canonical(&self, sys: u32) -> Vec<u8> {
        let idx = self
            .ws
            .artifacts
            .iter()
            .position(|a| a.kind == ArtifactKind::CanonicalAscii && a.system == Some(sys))
            .expect("canonical artifact");
        self.ws.artifact(idx).unwrap().to_vec()
    }
    fn typed_ir(&self) -> String {
        let idx = self
            .ws
            .artifacts
            .iter()
            .position(|a| a.kind == ArtifactKind::TypedSystemIr)
            .expect("typed ir");
        String::from_utf8(self.ws.artifact(idx).unwrap().to_vec()).unwrap()
    }
    fn diag_json(&self) -> String {
        let mut bytes = vec![0u8; 1 << 16];
        let mut o = OutBuf::new(&mut bytes);
        factc_kernel::read_diagnostics(&self.ws, &mut o).unwrap();
        String::from_utf8(o.as_slice().to_vec()).unwrap()
    }
}

fn canonical_of(name: &str) -> Vec<u8> {
    let r = run(name);
    assert_eq!(r.status, Status::Ok, "{}: {:?}", name, r.codes());
    r.canonical(0)
}

#[test]
fn l00_minimal_source_unit() {
    let r = run("L00-minimal.ascii");
    assert_eq!(r.status, Status::Ok, "{:?}", r.codes());
    assert_eq!(r.ws.model.systems.len(), 1);
    assert!(String::from_utf8(r.canonical(0))
        .unwrap()
        .contains("@{system minimal}"));
}

#[test]
fn l01_l02_l03_l04_l24_presentation_invariance() {
    let base = canonical_of("L01-base.ascii");
    assert_eq!(base, canonical_of("L01-whitespace.ascii"), "L1 whitespace");
    assert_eq!(
        base,
        canonical_of("L02-ascii-frames.ascii"),
        "L2/L3 frames + relocation + L24 reorder"
    );
    assert_eq!(base, canonical_of("L04-prose.ascii"), "L4 prose");
    let text = String::from_utf8(base).unwrap();
    assert!(text.contains("@{data frame_flow camera.frame -> encoder.frame mode=move}"));
    assert!(
        !text.contains("WebGPU"),
        "L18: prose never becomes semantics"
    );
}

#[test]
fn l05_duplicate_identity_with_both_spans() {
    let r = run("L05-duplicate.ascii");
    assert!(r.has(DiagCode::DuplicateIdentity), "{:?}", r.codes());
    let d =
        r.ws.diagnostics
            .iter()
            .find(|d| d.code == DiagCode::DuplicateIdentity)
            .unwrap();
    assert!(
        d.primary.is_some() && d.related[0].is_some(),
        "both spans present"
    );
    assert_ne!(d.primary.unwrap().start(), d.related[0].unwrap().start());
}

#[test]
fn l06_unresolved_endpoint() {
    let r = run("L06-unresolved.ascii");
    assert!(r.has(DiagCode::UnresolvedName), "{:?}", r.codes());
}

#[test]
fn l07_ambiguous_import_reference_is_not_chosen() {
    let r = run_units(
        &[
            &fixture("L07-imp-a.ascii"),
            &fixture("L07-imp-b.ascii"),
            &fixture("L07-ambiguous.ascii"),
        ],
        Mode::Analyze,
    );
    assert!(r.has(DiagCode::AmbiguousReference), "{:?}", r.codes());
    let ir = r.typed_ir();
    assert!(
        !ir.contains("\"path\":\"impa::shared.p\"") && !ir.contains("\"path\":\"impb::shared.p\"")
    );
}

#[test]
fn l08_direction_check() {
    let r = run("L08-direction.ascii");
    assert!(r.has(DiagCode::DirectionMismatch), "{:?}", r.codes());
}

#[test]
fn l09_type_compatibility_and_alias() {
    let r = run("L09-type.ascii");
    assert!(r.has(DiagCode::TypeMismatch), "{:?}", r.codes());
    let ok = run("L09-alias-ok.ascii");
    assert_eq!(ok.status, Status::Ok, "{:?}", ok.codes());
}

#[test]
fn l10_private_boundary_protection() {
    let r = run_units(
        &[
            &fixture("L10-provider.ascii"),
            &fixture("L10-private-ref.ascii"),
        ],
        Mode::Analyze,
    );
    assert!(r.has(DiagCode::VisibilityViolation), "{:?}", r.codes());
}

#[test]
fn l11_incomplete_abstract_boundary_fails_refinement() {
    let r = run("L11-incomplete-abstract.ascii");
    assert!(r.has(DiagCode::RefinementFailed), "{:?}", r.codes());
    let b = run_units(&[&fixture("L11-incomplete-abstract.ascii")], Mode::Build);
    assert_ne!(b.status, Status::Ok, "BUILD cannot silently accept");
}

#[test]
fn l12_compatible_refinement_passes() {
    let r = run("L12-compatible.ascii");
    assert_eq!(r.status, Status::Ok, "{:?}", r.codes());
    let ir = r.typed_ir();
    assert!(ir.contains("\"kind\":\"REFINES\"") && ir.contains("\"holds\":true"));
    assert!(ir.contains(
        "\"name\":\"inv_ref\",\"expression\":\"refines(concrete_x, abstract_x)\",\"holds\":true"
    ));
}

#[test]
fn l13_effect_escape() {
    let r = run("L13-effect-escape.ascii");
    assert!(r.has(DiagCode::EffectEscape), "{:?}", r.codes());
}

#[test]
fn l14_l15_l17_l35_governance_preserved_analyze_vs_build() {
    let a = run("L14-gap.ascii");
    assert_eq!(
        a.status,
        Status::Ok,
        "ANALYZE preserves partial graph: {:?}",
        a.codes()
    );
    let text = String::from_utf8(a.canonical(0)).unwrap();
    for s in [
        "@{status gpu_backend GAP \"implementation contract not selected\"}",
        "@{status src OBS \"observed\"}",
        "@{status d RUN \"witnessed\"}",
        "@{status T NEW \"proposed\"}",
        "@{status gpu_backend.i ERR \"contradiction\"}",
        "@{issue gap_allocator GAP \"first-party allocator unresolved\"}",
        "@{issue unknown_thing UNK \"not established\"}",
    ] {
        assert!(text.contains(s), "missing {} in\n{}", s, text);
    }
    let b = run_units(&[&fixture("L14-gap.ascii")], Mode::Build);
    assert!(b.has(DiagCode::BuildBlockedByGovernance), "{:?}", b.codes());
    assert_eq!(b.status, Status::Diagnostics);
    assert_eq!(
        b.ws.source(&b.ws.sources[0]),
        fixture("L14-gap.ascii").as_slice()
    );
}

#[test]
fn l16_l25_relation_kinds_separate_and_sequence_explicit() {
    let r = run("L16-relation-kinds.ascii");
    assert_eq!(r.status, Status::Ok, "{:?}", r.codes());
    let text = String::from_utf8(r.canonical(0)).unwrap();
    assert!(text.contains("@{data d a.o -> b.i mode=copy}"));
    assert!(text.contains("@{sequence s a -> b}"));
    assert!(text.contains("@{invariant inv_seq sequence_before(a, b)}"));
    assert!(r
        .typed_ir()
        .contains("\"name\":\"inv_seq\",\"expression\":\"sequence_before(a, b)\",\"holds\":true"));
    let n = run("L25-nosequence.ascii");
    assert_eq!(n.status, Status::Ok);
    assert!(
        n.ws.model.relations.is_empty(),
        "layout creates no sequence"
    );
}

#[test]
fn l18_prose_cannot_create_semantics_but_pin_can() {
    let p = run("L18-prose-only.ascii");
    assert!(p.ws.model.implementations.is_empty() && p.ws.model.links.is_empty());
    let q = run("L18-pin.ascii");
    assert_eq!(q.status, Status::Ok, "{:?}", q.codes());
    assert!(String::from_utf8(q.canonical(0))
        .unwrap()
        .contains("@{pin gpu WEBGPU}"));
}

#[test]
fn l19_l20_canonical_round_trip_and_idempotence() {
    for name in [
        "L01-base.ascii",
        "L12-compatible.ascii",
        "L14-gap.ascii",
        "L16-relation-kinds.ascii",
        "L26-modes.ascii",
        "L29-recursive.ascii",
        "P6-objective.ascii",
        "L09-alias-ok.ascii",
    ] {
        let r = run(name);
        let c1 = r.canonical(0);
        let r2 = run_units(&[&c1], Mode::Analyze);
        assert_eq!(
            r2.status,
            r.status,
            "{}: reparse status {:?}",
            name,
            r2.codes()
        );
        let c2 = r2.canonical(0);
        assert_eq!(
            c1, c2,
            "{}: render(parse(render(AST))) == render(AST)",
            name
        );
        assert_eq!(
            r.typed_ir(),
            r2.typed_ir(),
            "{}: typed IR differs after round trip",
            name
        );
    }
}

#[test]
fn l21_span_integrity() {
    let src = fixture("L06-unresolved.ascii");
    let r = run("L06-unresolved.ascii");
    let d =
        r.ws.diagnostics
            .iter()
            .find(|d| d.code == DiagCode::UnresolvedName)
            .unwrap();
    let sp = d.primary.unwrap();
    let text = &src[sp.start() as usize..sp.end() as usize];
    assert_eq!(
        text, b"ghost.in",
        "diagnostic points at the authored island text"
    );
}

#[test]
fn l22_escaping_and_unclosed() {
    let e = run("L22-escape.ascii");
    assert_eq!(e.status, Status::Ok, "{:?}", e.codes());
    assert_eq!(e.ws.model.systems.len(), 1);
    assert!(!String::from_utf8(e.canonical(0))
        .unwrap()
        .contains("not_a_system"));
    let u = run("L22-unclosed.ascii");
    assert!(u.has(DiagCode::ParseUnclosedIsland), "{:?}", u.codes());
    assert!(
        u.ws.model
            .components
            .iter()
            .any(|c| u.ws.model.name(c.name) == b"b"),
        "later islands still parsed"
    );
}

#[test]
fn l23_unknown_keyword_rejected_not_ignored() {
    let r = run("L23-unknown.ascii");
    assert!(r.has(DiagCode::ParseUnknownKeyword), "{:?}", r.codes());
    assert_ne!(r.status, Status::Ok);
}

#[test]
fn l26_transfer_modes_distinct() {
    let r = run("L26-modes.ascii");
    assert_eq!(r.status, Status::Ok, "{:?}", r.codes());
    let text = String::from_utf8(r.canonical(0)).unwrap();
    for m in ["move", "copy", "borrow", "share", "observe"] {
        assert!(text.contains(&format!("mode={}}}", m)));
    }
}

#[test]
fn l27_source_unit_path_independence() {
    let a = run_units(&[&fixture("L01-base.ascii")], Mode::Analyze);
    let b = run_units(&[&fixture("L01-base.ascii")], Mode::Analyze);
    assert_eq!(a.canonical(0), b.canonical(0));
    assert_eq!(a.diag_json(), b.diag_json());
}

#[test]
fn l28_private_visual_exposure_stays_private() {
    let r = run("L28-private-exposed.ascii");
    assert!(r.has(DiagCode::VisibilityViolation), "{:?}", r.codes());
}

#[test]
fn l29_recursive_refinement() {
    let r = run("L29-recursive.ascii");
    assert_eq!(r.status, Status::Ok, "{:?}", r.codes());
    let ir = r.typed_ir();
    assert!(
        ir.contains("\"name\":\"inv_outer\",\"expression\":\"refines(a1, a_abs)\",\"holds\":true")
    );
    assert!(ir.contains(
        "\"name\":\"inv_inner\",\"expression\":\"refines(a1x1, a1x_abs)\",\"holds\":true"
    ));
    assert!(
        ir.contains("\"name\":\"a1x1\",\"subsystem\":true,\"parent\":"),
        "identity not flattened"
    );
}

#[test]
fn l31_semantic_mutation_sensitivity() {
    let base = canonical_of("L01-base.ascii");
    let mut src = fixture("L01-base.ascii");
    let pos = src.windows(9).position(|w| w == b"mode=move").unwrap();
    src.splice(pos..pos + 9, b"mode=copy".iter().copied());
    let r = run_units(&[&src], Mode::Analyze);
    assert_eq!(r.status, Status::Ok);
    let changed = r.canonical(0);
    assert_ne!(base, changed);
    let base_s = String::from_utf8(base).unwrap();
    let diff: Vec<String> = String::from_utf8(changed)
        .unwrap()
        .lines()
        .filter(|l| !base_s.contains(l))
        .map(|s| s.to_string())
        .collect();
    assert_eq!(
        diff,
        vec!["| @{data frame_flow camera.frame -> encoder.frame mode=copy}"],
        "exactly the explicit delta changes"
    );
}

#[test]
fn l33_drawn_arrow_creates_no_relation() {
    let r = run("L33-drawn-arrow.ascii");
    assert_eq!(r.status, Status::Ok, "{:?}", r.codes());
    assert!(r.ws.model.relations.is_empty());
}

#[test]
fn l34_invariant_kernel_boundedness() {
    let bad = run("L34-bad-invariant.ascii");
    assert!(bad.has(DiagCode::ParseUnknownKeyword), "{:?}", bad.codes());
    let ar = run("L34-bad-arity.ascii");
    assert!(ar.has(DiagCode::InvalidInvariantArity), "{:?}", ar.codes());
    let ok = run("L01-base.ascii");
    assert!(ok.typed_ir().contains("\"name\":\"inv_frame\",\"expression\":\"exactly_one_producer(encoder.frame)\",\"holds\":true"));
}

#[test]
fn invariant_failure_is_reported_not_repaired() {
    let r = run("INV-fail.ascii");
    assert_eq!(
        r.ws.diagnostics.count_code(DiagCode::InvariantFailed),
        2,
        "{:?}",
        r.codes()
    );
    assert!(
        r.ws.model.relations.is_empty(),
        "no relation was invented to satisfy the invariant"
    );
}

#[test]
fn system_declaration_rules() {
    assert!(run("SYS-multiple.ascii").has(DiagCode::ParseMultipleSystems));
    assert!(run("SYS-missing.ascii").has(DiagCode::ParseMissingSystem));
}

#[test]
fn p6_g01_a03_objective_parses_and_renders() {
    let r = run("P6-objective.ascii");
    assert_eq!(r.status, Status::Ok, "{:?}", r.codes());
    let text = String::from_utf8(r.canonical(0)).unwrap();
    assert!(text.contains(
        "@{metric preference_rank ordinal \"commissioning preference only; not performance\"}"
    ));
    assert!(text.contains("@{objective commissioning}"));
    assert!(text.contains("@{goal commissioning 1 minimize preference_rank}"));
    assert!(text.contains("@{hard commissioning preference_rank at_most 5}"));
}

#[test]
fn p6_g02_metric_and_objective_are_distinct_namespaces() {
    assert!(run("P6-dup-priority.ascii").has(DiagCode::DuplicateGoalPriority));
    assert!(run("P6-undeclared-metric.ascii").has(DiagCode::UnresolvedName));
    let r = run("P6-objective.ascii");
    assert_eq!(r.ws.model.metrics.len(), 1);
    assert_eq!(r.ws.model.objectives.len(), 1);
}

#[test]
fn b4_b8_diagnostics_json_deterministic_and_kernel_present() {
    let a = run("L05-duplicate.ascii").diag_json();
    let b = run("L05-duplicate.ascii").diag_json();
    assert_eq!(a, b);
    assert!(!a.contains("LANGUAGE_KERNEL_NOT_IMPLEMENTED"));
}
