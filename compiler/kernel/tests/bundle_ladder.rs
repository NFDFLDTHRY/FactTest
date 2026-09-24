//! Codegen/bundle witnesses: P6-B01..B06, P6-C1/C2, P5-C01..C05, P6-G04 (type level), P6-X06 (no slice branch).
use factc_bundle::{BundleCertificate, Expected, File};
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

fn run_bytes(src: Vec<u8>, contracts: Vec<u8>, metrics: Vec<u8>, mode: Mode) -> Run {
    std::thread::Builder::new()
        .stack_size(256 * 1024 * 1024)
        .spawn(move || {
            let mut ws = Box::new(Workspace::new());
            factc_kernel::submit_source_bytes(&mut ws, &src).unwrap();
            factc_kernel::submit_contracts(&mut ws, &contracts).unwrap();
            factc_kernel::submit_metrics(&mut ws, &metrics).unwrap();
            let status = factc_kernel::check_or_compile(&mut ws, mode);
            Run { ws, status }
        })
        .unwrap()
        .join()
        .unwrap()
}

fn build() -> Run {
    run_bytes(
        fixture("commissioning/byte-relay.ascii"),
        fixture("commissioning/contracts.ascii"),
        fixture("commissioning/metrics.ascii"),
        Mode::Build,
    )
}

impl Run {
    fn codes(&self) -> Vec<&'static str> {
        self.ws.diagnostics.iter().map(|d| d.code.name()).collect()
    }
    fn file(&self, path: &str) -> Vec<u8> {
        self.ws
            .bundle
            .get(path.as_bytes())
            .unwrap_or_else(|| panic!("bundle file {}", path))
            .to_vec()
    }
    fn files(&self) -> Vec<(Vec<u8>, Vec<u8>)> {
        self.ws
            .bundle
            .files
            .iter()
            .map(|f| (f.path().to_vec(), self.ws.bundle.bytes(f).to_vec()))
            .collect()
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
    fn reverify(&self, files: &[(Vec<u8>, Vec<u8>)]) -> BundleCertificate {
        let vs = self.ws.verification.verified.as_ref().unwrap();
        let flat: Vec<File<'_>> = files
            .iter()
            .map(|(p, b)| File { path: p, bytes: b })
            .collect();
        let source_sha = factc_foundation::sha256::digest(self.ws.source(&self.ws.sources[0]));
        let canonical_sha = self
            .ws
            .artifacts
            .iter()
            .find(|a| a.kind == ArtifactKind::CanonicalAscii)
            .unwrap()
            .sha256;
        let mut cert = BundleCertificate::new();
        factc_bundle::verify(
            &self.ws.model,
            &self.ws.registry,
            &self.ws.hypergraph,
            vs,
            &flat,
            &Expected {
                source_sha256: &source_sha,
                canonical_sha256: &canonical_sha,
            },
            &mut cert,
        );
        cert
    }
}

fn failing(c: &BundleCertificate) -> Vec<&'static str> {
    c.checks.iter().filter(|x| !x.pass).map(|x| x.id).collect()
}

#[test]
fn p6_b01_b02_c1_c2_bundle_emits_both_verified_variants_and_selector_only() {
    let r = build();
    assert_eq!(r.status, Status::Ok, "{:?}", r.codes());
    let paths: Vec<String> =
        r.ws.bundle
            .files
            .iter()
            .map(|f| String::from_utf8_lossy(f.path()).to_string())
            .collect();
    for p in [
        "wasm64_relay.wasm",
        "membrane.js",
        "selector.js",
        "runtime.js",
        "index.html",
        "manifest.webmanifest",
        "sw.js",
        "bundle.json",
    ] {
        assert!(
            paths.contains(&p.to_string()),
            "missing {} in {:?}",
            p,
            paths
        );
    }
    let membrane = String::from_utf8(r.file("membrane.js")).unwrap();
    assert!(
        membrane.contains("/*ADAPTER-BEGIN:wasm64_relay*/")
            && membrane.contains("/*ADAPTER-BEGIN:webgpu_relay*/")
    );
    assert_eq!(
        membrane.matches("/*ADAPTER-BEGIN:").count(),
        2,
        "C2: exactly the two verified variants, no third adapter"
    );
    let selector = String::from_utf8(r.file("selector.js")).unwrap();
    assert!(
        selector.contains("\"dispatch_order\":[1,0]"),
        "{}",
        selector
    );
    assert!(
        selector.contains("\"guard\":[\"WEBGPU\"]")
            && selector.contains("\"guard\":[\"CPU_WASM64\"]")
    );
    let cert = r.artifact(ArtifactKind::BundleCertificate);
    assert!(cert.contains("\"status\":\"PASS\""), "{}", cert);
    assert!(r.ws.bundle_certificate.pass);
}

#[test]
fn p6_b05_wasm_module_is_memory64_with_recipe_exports() {
    let r = build();
    let wasm = r.file("wasm64_relay.wasm");
    let info = factc_foundation::wasm::read(&wasm).unwrap();
    assert!(info.all_memories_i64());
    assert!(info.imports.is_empty());
    for e in [
        "memory",
        "abi_version",
        "copy_bytes",
        "region_in",
        "region_out",
        "region_capacity",
    ] {
        assert!(info.export_named(&wasm, e.as_bytes()), "export {}", e);
    }
    // tamper: flip the memory limits flag to i32 (wasm32 address type) => B-05 FAIL
    let mut files = r.files();
    let w = files
        .iter_mut()
        .find(|(p, _)| p == b"wasm64_relay.wasm")
        .unwrap();
    let pos =
        w.1.windows(3)
            .position(|x| x == [5, 3, 1])
            .expect("memory section");
    assert_eq!(w.1[pos + 3], 0x04);
    w.1[pos + 3] = 0x00;
    let cert = r.reverify(&files);
    assert!(!cert.pass);
    assert!(
        failing(&cert).contains(&"B-05-wasm64"),
        "{:?}",
        failing(&cert)
    );
}

#[test]
fn p6_b03_undeclared_third_adapter_fails() {
    let r = build();
    let mut files = r.files();
    let m = files.iter_mut().find(|(p, _)| p == b"membrane.js").unwrap();
    m.1.extend_from_slice(b"\n/*ADAPTER-BEGIN:opfs_relay*/\nadapters['opfs_relay'] = {};\n/*ADAPTER-END:opfs_relay*/\n");
    let cert = r.reverify(&files);
    assert!(!cert.pass);
    let f = failing(&cert);
    assert!(
        f.contains(&"B-02-adapters-subset") && f.contains(&"B-03-no-undeclared-adapter"),
        "{:?}",
        f
    );
}

#[test]
fn p6_b04_missing_strategy_variant_fails() {
    let r = build();
    // remove the wasm adapter from the membrane: a verified variant is no longer emitted
    let mut files = r.files();
    let m = files.iter_mut().find(|(p, _)| p == b"membrane.js").unwrap();
    let s = String::from_utf8(m.1.clone()).unwrap();
    let a = s.find("/*ADAPTER-BEGIN:wasm64_relay*/").unwrap();
    let b = s.find("/*ADAPTER-END:wasm64_relay*/").unwrap() + "/*ADAPTER-END:wasm64_relay*/".len();
    m.1 = format!("{}{}", &s[..a], &s[b..]).into_bytes();
    let cert = r.reverify(&files);
    assert!(
        failing(&cert).contains(&"B-04-all-variants-emitted"),
        "{:?}",
        failing(&cert)
    );
    // remove a variant from the selector data: selector no longer equals the VerifiedStrategy
    let mut files = r.files();
    let sel = files.iter_mut().find(|(p, _)| p == b"selector.js").unwrap();
    let s = String::from_utf8(sel.1.clone())
        .unwrap()
        .replace("\"dispatch_order\":[1,0]", "\"dispatch_order\":[1]");
    sel.1 = s.into_bytes();
    let cert = r.reverify(&files);
    assert!(
        failing(&cert).contains(&"B-06-selector-variants"),
        "{:?}",
        failing(&cert)
    );
}

#[test]
fn p6_b06_p5_c05_lineage_mismatch_fails() {
    let r = build();
    let mut files = r.files();
    let man = files.iter_mut().find(|(p, _)| p == b"bundle.json").unwrap();
    let s = String::from_utf8(man.1.clone()).unwrap();
    let i = s.find("\"source_sha256\":\"").unwrap() + "\"source_sha256\":\"".len();
    let mut t = s.clone();
    t.replace_range(i..i + 4, "dead");
    man.1 = t.into_bytes();
    let cert = r.reverify(&files);
    assert!(
        failing(&cert).contains(&"B-08-lineage-source"),
        "{:?}",
        failing(&cert)
    );
    // artifact identity mismatch: modify runtime.js without updating the manifest
    let mut files = r.files();
    let rt = files.iter_mut().find(|(p, _)| p == b"runtime.js").unwrap();
    rt.1.extend_from_slice(b"\n// tampered\n");
    let cert = r.reverify(&files);
    assert!(
        failing(&cert).contains(&"B-08-artifact-identities"),
        "{:?}",
        failing(&cert)
    );
}

#[test]
fn p5_c02_c03_adapter_inventory_matches_verified_plan() {
    // a registry with only the wasm path verified => exactly one adapter, no webgpu adapter emitted
    let reg = String::from_utf8(fixture("commissioning/contracts.ascii"))
        .unwrap()
        .lines()
        .filter(|l| {
            !l.contains("@{conversion host_to_gpu") && !l.contains("@{conversion gpu_to_host")
        })
        .collect::<Vec<_>>()
        .join("\n");
    let r = run_bytes(
        fixture("commissioning/byte-relay.ascii"),
        reg.into_bytes(),
        fixture("commissioning/metrics.ascii"),
        Mode::Build,
    );
    assert_eq!(r.status, Status::Ok, "{:?}", r.codes());
    let membrane = String::from_utf8(r.file("membrane.js")).unwrap();
    assert_eq!(membrane.matches("/*ADAPTER-BEGIN:").count(), 1);
    assert!(
        !membrane.contains("webgpu_relay"),
        "no adapter without a verified variant"
    );
    assert!(r.ws.bundle_certificate.pass);
    let man = String::from_utf8(r.file("bundle.json")).unwrap();
    assert!(man.contains("\"adapter_inventory\":[\"wasm64_relay\"]"));
}

#[test]
fn p5_c01_p6_g04_codegen_requires_verified_strategy_and_analyze_emits_no_bundle() {
    // type level: factc_codegen::generate takes &VerifiedStrategy (sealed). Behaviour level: ANALYZE mode never
    // generates a bundle, and a failed verification leaves no bundle behind.
    let a = run_bytes(
        fixture("commissioning/byte-relay.ascii"),
        fixture("commissioning/contracts.ascii"),
        fixture("commissioning/metrics.ascii"),
        Mode::Analyze,
    );
    assert_eq!(a.ws.bundle.files.len(), 0);
    assert!(a
        .ws
        .artifacts
        .iter()
        .all(|x| x.kind != ArtifactKind::BundleCertificate));
    let reg = String::from_utf8(fixture("commissioning/contracts.ascii"))
        .unwrap()
        .replace("recipe=R_WEBGPU_RELAY", "recipe=none");
    let b = run_bytes(
        fixture("commissioning/byte-relay.ascii"),
        reg.into_bytes(),
        fixture("commissioning/metrics.ascii"),
        Mode::Build,
    );
    assert!(b.ws.verification.verified.is_none());
    assert_eq!(b.ws.bundle.files.len(), 0);
    assert!(b.ws.diagnostics.has_code(DiagCode::ContractUnresolved));
}

#[test]
fn p6_x06_bundle_content_is_recipe_driven_not_slice_named() {
    let r = build();
    for f in ["membrane.js", "selector.js", "runtime.js"] {
        let s = String::from_utf8(r.file(f)).unwrap();
        assert!(
            !s.to_lowercase().contains("byte_relay"),
            "{} names the slice",
            f
        );
        assert!(!s.contains("DE AD BE EF"), "{} hard-codes a payload", f);
    }
    // the relation name reaches the runtime only as data from the verified strategy
    assert!(String::from_utf8(r.file("selector.js"))
        .unwrap()
        .contains("\"relation\":\"relay\""));
}

#[test]
fn bundle_manifest_records_lineage_and_roles() {
    let r = build();
    let man = String::from_utf8(r.file("bundle.json")).unwrap();
    assert!(man.contains("\"kind\":\"GENERATED_BUNDLE\""));
    assert!(man.contains("\"wasm_target\":\"wasm64-unknown-unknown"));
    assert!(
        man.contains("\"role\":\"WASM_MODULE\"") && man.contains("\"role\":\"SERVICE_WORKER\"")
    );
    assert!(man.contains("\"memory64\":true"));
    assert!(
        man.contains("\"proof_certificate_id\":1") && man.contains("\"proof_certificate_id\":2")
    );
    let sw = String::from_utf8(r.file("sw.js")).unwrap();
    assert!(sw.contains("'./membrane.js'") && sw.contains("'./wasm64_relay.wasm'"));
}
