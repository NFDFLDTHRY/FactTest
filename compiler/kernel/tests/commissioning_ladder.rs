//! PASS6-TESTS anti-cheating and ASCII witnesses at the compiler level: P6-A01, P6-X01, P6-X03, P6-X04, P6-X05.
//! (P6-X02 and P6-X06 are witnessed by tests/commissioning/run-physical.sh and run-anti-cheat.sh.)
use factc_foundation::{ArtifactKind, DiagCode};
use factc_kernel::{Mode, Status, Workspace};
use std::path::PathBuf;

fn fixture(rel: &str) -> Vec<u8> {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../fixtures")
        .join(rel);
    std::fs::read(&p).unwrap_or_else(|e| panic!("{}: {}", p.display(), e))
}

struct Run {
    ws: Box<Workspace>,
    status: Status,
}

fn build(src: Vec<u8>) -> Run {
    let contracts = fixture("commissioning/contracts.ascii");
    let metrics = fixture("commissioning/metrics.ascii");
    std::thread::Builder::new()
        .stack_size(256 * 1024 * 1024)
        .spawn(move || {
            let mut ws = Box::new(Workspace::new());
            factc_kernel::submit_source_bytes(&mut ws, &src).unwrap();
            factc_kernel::submit_contracts(&mut ws, &contracts).unwrap();
            factc_kernel::submit_metrics(&mut ws, &metrics).unwrap();
            let status = factc_kernel::check_or_compile(&mut ws, Mode::Build);
            Run { ws, status }
        })
        .unwrap()
        .join()
        .unwrap()
}

impl Run {
    fn codes(&self) -> Vec<&'static str> {
        self.ws.diagnostics.iter().map(|d| d.code.name()).collect()
    }
    fn artifact(&self, kind: ArtifactKind) -> String {
        let idx = self
            .ws
            .artifacts
            .iter()
            .position(|a| a.kind == kind)
            .unwrap_or_else(|| panic!("artifact {:?}", kind));
        String::from_utf8(self.ws.artifact(idx).unwrap().to_vec()).unwrap()
    }
    fn strategy_shape(&self) -> (usize, Vec<u32>, Vec<Vec<String>>) {
        let vs = self.ws.verification.verified.as_ref().expect("verified");
        let order: Vec<u32> = vs.ordered().map(|v| v.plan.plan_id).collect();
        let guards: Vec<Vec<String>> = vs
            .ordered()
            .map(|v| {
                v.plan
                    .guard
                    .iter()
                    .map(|b| String::from_utf8_lossy(self.ws.registry.name(b)).to_string())
                    .collect()
            })
            .collect();
        (vs.variants.len(), order, guards)
    }
}

const AUTH: &str = "commissioning/byte-relay.ascii";

#[test]
fn p6_a01_x03_compact_layout_is_semantically_identical() {
    let a = build(fixture(AUTH));
    let b = build(fixture("commissioning/byte-relay-compact.ascii"));
    assert_eq!(a.status, Status::Ok, "{:?}", a.codes());
    assert_eq!(b.status, Status::Ok, "{:?}", b.codes());
    assert_eq!(
        a.artifact(ArtifactKind::CanonicalAscii),
        b.artifact(ArtifactKind::CanonicalAscii)
    );
    assert_eq!(
        a.artifact(ArtifactKind::TypedSystemIr),
        b.artifact(ArtifactKind::TypedSystemIr)
    );
    assert_eq!(
        a.artifact(ArtifactKind::VerifiedStrategy),
        b.artifact(ArtifactKind::VerifiedStrategy)
    );
    assert_eq!(a.strategy_shape(), b.strategy_shape());
    // bundle bytes differ only through lineage (source sha) - membrane/selector/runtime/wasm are identical
    for f in [
        "membrane.js",
        "selector.js",
        "runtime.js",
        "wasm64_relay.wasm",
    ] {
        assert_eq!(
            a.ws.bundle.get(f.as_bytes()).unwrap(),
            b.ws.bundle.get(f.as_bytes()).unwrap(),
            "{}",
            f
        );
    }
    assert!(a.ws.bundle_certificate.pass && b.ws.bundle_certificate.pass);
}

#[test]
fn p6_x01_same_structure_under_different_system_id_compiles_identically_shaped() {
    let a = build(fixture(AUTH));
    let r = build(fixture("commissioning/byte-relay-renamed.ascii"));
    assert_eq!(r.status, Status::Ok, "{:?}", r.codes());
    assert_eq!(
        a.strategy_shape(),
        r.strategy_shape(),
        "no fixture-name special case anywhere in the pipeline"
    );
    assert!(r.ws.bundle_certificate.pass);
    let sel = String::from_utf8(r.ws.bundle.get(b"selector.js").unwrap().to_vec()).unwrap();
    assert!(
        sel.contains("\"relation\":\"flow\""),
        "runtime learns the relation name from the strategy data only"
    );
    assert!(!sel.contains("byte_relay"));
}

#[test]
fn p6_x04_display_label_rename_changes_nothing_executable() {
    let a = build(fixture(AUTH));
    let l = build(fixture("commissioning/byte-relay-labels.ascii"));
    assert_eq!(l.status, Status::Ok, "{:?}", l.codes());
    assert_eq!(
        a.artifact(ArtifactKind::TypedSystemIr),
        l.artifact(ArtifactKind::TypedSystemIr),
        "labels are not identity"
    );
    assert_eq!(
        a.artifact(ArtifactKind::VerifiedStrategy),
        l.artifact(ArtifactKind::VerifiedStrategy)
    );
    assert_ne!(
        a.artifact(ArtifactKind::CanonicalAscii),
        l.artifact(ArtifactKind::CanonicalAscii),
        "labels are preserved for humans"
    );
    for f in [
        "membrane.js",
        "selector.js",
        "runtime.js",
        "wasm64_relay.wasm",
    ] {
        assert_eq!(
            a.ws.bundle.get(f.as_bytes()).unwrap(),
            l.ws.bundle.get(f.as_bytes()).unwrap(),
            "{}",
            f
        );
    }
}

#[test]
fn p6_x05_failures_use_generic_rule_ids() {
    // a failing verification and failing diagnostics must never name the slice
    let bad_reg = String::from_utf8(fixture("commissioning/contracts.ascii"))
        .unwrap()
        .replace("recipe=R_WEBGPU_RELAY", "recipe=none");
    let r = std::thread::Builder::new()
        .stack_size(256 * 1024 * 1024)
        .spawn(move || {
            let mut ws = Box::new(Workspace::new());
            factc_kernel::submit_source_bytes(&mut ws, &fixture(AUTH)).unwrap();
            factc_kernel::submit_contracts(&mut ws, bad_reg.as_bytes()).unwrap();
            let status = factc_kernel::check_or_compile(&mut ws, Mode::Build);
            let mut bytes = vec![0u8; 1 << 16];
            let mut o = factc_foundation::OutBuf::new(&mut bytes);
            factc_kernel::read_diagnostics(&ws, &mut o).unwrap();
            let n = o.len();
            (status, String::from_utf8(bytes[..n].to_vec()).unwrap())
        })
        .unwrap()
        .join()
        .unwrap();
    assert_ne!(r.0, Status::Ok);
    assert!(r.1.contains("CONTRACT_UNRESOLVED"));
    assert!(
        !r.1.to_lowercase().contains("byte_relay") && !r.1.to_lowercase().contains("commissioning"),
        "{}",
        r.1
    );
    // verifier rule ids and bundle check ids are generic
    let ok = build(fixture(AUTH));
    let certs = ok.artifact(ArtifactKind::VerificationCertificates);
    let bundle = ok.artifact(ArtifactKind::BundleCertificate);
    for text in [&certs, &bundle] {
        assert!(
            !text.to_lowercase().contains("byte_relay")
                && !text.to_lowercase().contains("commissioning")
        );
    }
    assert!(certs.contains("\"rule\":\"V-REP\"") && bundle.contains("\"check\":\"B-05-wasm64\""));
    let _ = DiagCode::ProofFailed;
}
