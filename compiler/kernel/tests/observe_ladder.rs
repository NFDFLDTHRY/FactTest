//! Evidence loop witnesses: P5-R04/R05/R06 shape, P6-R07 (ObservationDelta renders observed ASCII), P6-R08
//! (authored source unchanged is a derived statement), negative witness 10 (omit ObservationDelta -> loop failure)
//! and 11 (runtime source mutation -> source-of-record failure).  The tape here is a SAMPLE; physical evidence is
//! produced by the BROWSER_PROBE station.
use factc_foundation::{ArtifactKind, DiagCode, Diagnostics, SourceId};
use factc_kernel::{Status, Workspace};
use factc_observe::{Kind, Observation};
use std::path::PathBuf;

fn fixture(rel: &str) -> Vec<u8> {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../fixtures")
        .join(rel);
    std::fs::read(&p).unwrap_or_else(|e| panic!("{}: {}", p.display(), e))
}

fn observe(
    tape: Vec<u8>,
    after: Option<[u8; 32]>,
    lineage: Option<[u8; 32]>,
) -> (Box<Workspace>, Status) {
    std::thread::Builder::new()
        .stack_size(256 * 1024 * 1024)
        .spawn(move || {
            let mut ws = Box::new(Workspace::new());
            factc_kernel::submit_evidence_tape(&mut ws, &tape).unwrap();
            let st = factc_kernel::observe(
                &mut ws,
                b"byte_relay",
                after.as_ref(),
                lineage.as_ref(),
                None,
                b"SAMPLE",
            );
            (ws, st)
        })
        .unwrap()
        .join()
        .unwrap()
}

fn artifact(ws: &Workspace, kind: ArtifactKind) -> String {
    let idx = ws.artifacts.iter().position(|a| a.kind == kind).unwrap();
    String::from_utf8(ws.artifact(idx).unwrap().to_vec()).unwrap()
}

#[test]
fn tape_parses_into_records() {
    let mut obs = Observation::new();
    let mut d: Diagnostics<64> = Diagnostics::new();
    factc_observe::parse(
        &fixture("commissioning/tape-sample.ascii"),
        SourceId::new(9),
        &mut obs,
        &mut d,
    );
    assert!(
        obs.ok,
        "{:?}",
        d.iter().map(|x| x.code.name()).collect::<Vec<_>>()
    );
    assert_eq!(obs.count(Kind::Bundle), 1);
    assert_eq!(obs.count(Kind::Epoch), 2);
    assert_eq!(obs.count(Kind::Admission), 3);
    assert_eq!(obs.count(Kind::Executed), 4);
    assert_eq!(obs.count(Kind::Loss), 1);
    assert_eq!(obs.count(Kind::Transition), 1);
    let t = obs
        .records
        .iter()
        .find(|r| r.kind == Kind::Transition)
        .unwrap();
    assert_eq!((t.plan, t.plan2), (Some(1), Some(0)));
}

#[test]
fn p6_r07_observation_delta_renders_observed_ascii() {
    let sha = [7u8; 32];
    let (ws, st) = observe(
        fixture("commissioning/tape-sample.ascii"),
        Some(sha),
        Some(sha),
    );
    assert_eq!(st, Status::Ok);
    let ascii = artifact(&ws, ArtifactKind::ObservedAscii);
    for needle in [
        "@{system byte_relay_observed \"Observed: byte_relay\"}",
        "@{issue admission_E0_WEBGPU RUN \"WEBGPU admitted at E0 (evidence webgpu_known_answer)\"}",
        "@{issue executed_E0_relay_1 RUN \"relay: exact roundtrip of 8 bytes at E0 via plan 1",
        "@{issue executed_E0_relay_2 RUN \"relay: exact roundtrip of 10 bytes at E0 via plan 1",
        "@{issue executed_E1_relay_1 RUN \"relay: exact roundtrip of 8 bytes at E1 via plan 0",
        "@{issue loss_E0_WEBGPU ERR \"WEBGPU lost at E0 (reason destroyed)\"}",
        "@{issue admission_E1_WEBGPU ERR \"WEBGPU rejected at E1 (evidence device_lost, reason destroyed)\"}",
        "@{issue activation_E1 RUN \"plan 0 active at E1\"}",
        "@{issue transition_E0_E1 OBS \"E0 -> E1: plan 1 -> plan 0; reselection inside the VerifiedStrategy, no codegen\"}",
        "@{issue source_of_record OBS \"authored source unchanged: sha256 0707",
    ] {
        assert!(ascii.contains(needle), "missing {}\n{}", needle, ascii);
    }
    let delta = artifact(&ws, ArtifactKind::ObservationDelta);
    assert!(delta.contains(
        "\"from_epoch\":\"E0\",\"to_epoch\":\"E1\",\"stale_plan\":1,\"replacement_plan\":0"
    ));
    assert!(delta.contains("\"source_unchanged\":true"));
    assert!(delta.contains("\"evidence_class\":\"SAMPLE\""));
}

#[test]
fn observed_ascii_is_itself_a_valid_analyze_unit_and_never_the_source() {
    let (ws, _) = observe(fixture("commissioning/tape-sample.ascii"), None, None);
    let ascii = artifact(&ws, ArtifactKind::ObservedAscii);
    assert!(ascii.contains("@{issue source_of_record UNK"));
    // the derived view parses under ANALYZE as its own unit
    let bytes = ascii.clone().into_bytes();
    let r = std::thread::Builder::new()
        .stack_size(256 * 1024 * 1024)
        .spawn(move || {
            let mut w = Box::new(Workspace::new());
            factc_kernel::submit_source_bytes(&mut w, &bytes).unwrap();
            let st = factc_kernel::check_or_compile(&mut w, factc_kernel::Mode::Analyze);
            (
                st,
                w.diagnostics
                    .iter()
                    .map(|d| d.code.name())
                    .collect::<Vec<_>>(),
                w.model.issues.len(),
            )
        })
        .unwrap()
        .join()
        .unwrap();
    assert_eq!(r.0, Status::Ok, "{:?}", r.1);
    assert!(r.2 >= 8);
    assert!(
        !ascii.contains("@{data "),
        "observed view carries no authored relations"
    );
}

#[test]
fn negative_11_runtime_source_mutation_is_a_source_of_record_failure() {
    let (ws, _) = observe(
        fixture("commissioning/tape-sample.ascii"),
        Some([1u8; 32]),
        Some([2u8; 32]),
    );
    let ascii = artifact(&ws, ArtifactKind::ObservedAscii);
    assert!(
        ascii.contains("@{issue source_of_record ERR \"authored source changed since compilation")
    );
    assert!(artifact(&ws, ArtifactKind::ObservationDelta).contains("\"source_unchanged\":false"));
}

#[test]
fn negative_10_missing_transition_and_mismatch_are_visible_not_hidden() {
    let tape = b"@{epoch E0}\n@{admission CPU_WASM64 ADMITTED evidence=wasm64_known_answer}\n@{activation E0 plan=0 status=PASS}\n@{executed E0 plan=0 relation=relay bytes=8 input=\"aa\" output=\"bb\" exact=false}\n@{loss E0 CPU_WASM64 reason=released}\n@{epoch E1}\n@{activation E1 plan=none status=NO_ACTIVE_PLAN}\n@{no_active_plan E1}\n".to_vec();
    let (ws, st) = observe(tape, None, None);
    assert_eq!(st, Status::Ok);
    let ascii = artifact(&ws, ArtifactKind::ObservedAscii);
    assert!(ascii.contains("ERR \"relay: output differs from input at E0"));
    assert!(ascii.contains("@{issue no_active_plan_E1 ERR"));
    assert!(
        !ascii.contains("transition_"),
        "no ObservationDelta was recorded: nothing is invented"
    );
    assert_eq!(ws.observation.count(Kind::Transition), 0);
}

#[test]
fn tape_dialect_rejects_unknown_records() {
    let (ws, st) = observe(b"@{epoch E0}\n@{teleport E0}\n".to_vec(), None, None);
    assert_eq!(st, Status::Diagnostics);
    assert!(ws.diagnostics.has_code(DiagCode::ParseUnknownKeyword));
}
