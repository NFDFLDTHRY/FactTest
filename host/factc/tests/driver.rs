//! Driver tests of the native transport (D23, I-19): `factc` exercised through its binary on the commissioning
//! fixtures.  They assert the driver's contract (exit codes, files, determinism), never source semantics.
use std::path::PathBuf;
use std::process::Command;

fn factc() -> PathBuf {
    PathBuf::from(env!("CARGO_BIN_EXE_factc"))
}

fn fixture(rel: &str) -> String {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../fixtures/commissioning")
        .join(rel)
        .to_string_lossy()
        .to_string()
}

fn scratch(name: &str) -> PathBuf {
    let d = std::env::temp_dir().join(format!("factc-driver-{}-{}", name, std::process::id()));
    let _ = std::fs::remove_dir_all(&d);
    std::fs::create_dir_all(&d).unwrap();
    d
}

fn run(args: &[&str]) -> (i32, String, String) {
    let o = Command::new(factc())
        .args(args)
        .output()
        .expect("spawn factc");
    (
        o.status.code().unwrap_or(-1),
        String::from_utf8_lossy(&o.stdout).to_string(),
        String::from_utf8_lossy(&o.stderr).to_string(),
    )
}

fn read(dir: &std::path::Path, name: &str) -> String {
    std::fs::read_to_string(dir.join(name)).unwrap_or_else(|e| panic!("{}: {}", name, e))
}

fn build(dir: &std::path::Path) -> (i32, String, String) {
    run(&[
        "check",
        "build",
        "--out",
        &dir.to_string_lossy(),
        "--contracts",
        &fixture("contracts.ascii"),
        "--metrics",
        &fixture("metrics.ascii"),
        &fixture("byte-relay.ascii"),
    ])
}

#[test]
fn d01_queries_report_abi_and_workspace() {
    let (code, out, _) = run(&["abi-version"]);
    assert_eq!(code, 0);
    assert_eq!(out.trim(), "1");
    let (code, out, _) = run(&["required-workspace"]);
    assert_eq!(code, 0);
    let ws: u64 = out.trim().parse().expect("workspace size");
    assert!(ws > 1 << 20, "workspace {} bytes", ws);
}

#[test]
fn d02_usage_and_missing_inputs_are_driver_exit_codes() {
    assert_eq!(run(&[]).0, 2, "no command: usage");
    assert_eq!(run(&["check", "analyze"]).0, 2, "no --out: usage");
    let d = scratch("d02");
    let (code, _, err) = run(&[
        "check",
        "analyze",
        "--out",
        &d.to_string_lossy(),
        "/nonexistent/source.ascii",
    ]);
    assert_eq!(code, 3, "unreadable input: {}", err);
    assert!(err.contains("/nonexistent/source.ascii"));
}

#[test]
fn d03_analyze_writes_diagnostics_lineage_and_artifacts() {
    let d = scratch("d03");
    let (code, out, err) = run(&[
        "check",
        "analyze",
        "--out",
        &d.to_string_lossy(),
        &fixture("byte-relay.ascii"),
    ]);
    assert_eq!(code, 0, "{}{}", out, err);
    assert!(out.contains("factc: status OK"));
    let diag = read(&d, "diagnostics.json");
    assert!(diag.contains("\"abi_version\":1") && diag.contains("\"status\":\"OK\""));
    let lineage = read(&d, "source-lineage.json");
    assert!(lineage.contains("\"source_id\":0") && lineage.contains("\"sha256\":\""));
    let meta = read(&d, "artifacts.json");
    for kind in ["CANONICAL_ASCII", "TYPED_SYSTEM_IR", "CAPABILITY_IR"] {
        assert!(meta.contains(&format!("\"kind\":\"{}\"", kind)), "{}", kind);
    }
    for f in [
        "canonical-ascii-0.ascii",
        "typed-system-ir.json",
        "capability-ir.json",
    ] {
        assert!(d.join(f).exists(), "{}", f);
    }
    assert!(!d.join("bundle").exists(), "ANALYZE emits no bundle");
}

#[test]
fn d04_build_with_registry_emits_bundle_and_certificates() {
    let d = scratch("d04");
    let (code, out, err) = build(&d);
    assert_eq!(code, 0, "{}{}", out, err);
    assert!(read(&d, "diagnostics.json").contains("\"status\":\"OK\""));
    assert!(read(&d, "bundle-certificate.json").contains("\"status\":\"PASS\""));
    for f in [
        "candidate-strategy.json",
        "verified-strategy.json",
        "verification-certificates.json",
        "implementation-hypergraph.json",
    ] {
        assert!(d.join(f).exists(), "{}", f);
    }
    let bundle = d.join("bundle");
    let files: Vec<String> = std::fs::read_dir(&bundle)
        .unwrap()
        .map(|e| e.unwrap().file_name().to_string_lossy().to_string())
        .collect();
    assert!(files.contains(&"bundle.json".to_string()), "{:?}", files);
    assert!(files.iter().any(|f| f.ends_with(".wasm")), "{:?}", files);
    assert!(files.iter().any(|f| f.ends_with(".html")), "{:?}", files);
    assert!(
        files.iter().filter(|f| f.ends_with(".js")).count() >= 3,
        "{:?}",
        files
    );
    let manifest = read(&bundle, "bundle.json");
    let lineage = read(&d, "source-lineage.json");
    let sha = lineage.split("\"sha256\":\"").nth(1).unwrap()[..64].to_string();
    assert!(
        manifest.contains(&sha),
        "the bundle manifest carries the source identity"
    );
}

#[test]
fn d05_build_without_registry_is_the_recorded_b07_behaviour() {
    // D12 B-07 (owner decision D-5, open): BUILD with no registry reports OK, emits the front-end artifacts and no
    // bundle.  The driver test records the current behaviour; it does not decide it.
    let d = scratch("d05");
    let (code, out, err) = run(&[
        "check",
        "build",
        "--out",
        &d.to_string_lossy(),
        &fixture("byte-relay.ascii"),
    ]);
    assert_eq!(code, 0, "{}{}", out, err);
    assert!(read(&d, "diagnostics.json").contains("\"status\":\"OK\""));
    assert!(d.join("capability-ir.json").exists());
    assert!(
        !d.join("bundle").exists(),
        "no bundle without a verified strategy"
    );
    assert!(!d.join("verified-strategy.json").exists());
}

#[test]
fn d06_build_is_deterministic() {
    let a = scratch("d06a");
    let b = scratch("d06b");
    assert_eq!(build(&a).0, 0);
    assert_eq!(build(&b).0, 0);
    let mut names: Vec<String> = std::fs::read_dir(&a)
        .unwrap()
        .map(|e| e.unwrap().file_name().to_string_lossy().to_string())
        .filter(|n| n != "bundle")
        .collect();
    names.sort();
    assert!(names.len() >= 10, "{:?}", names);
    for n in &names {
        assert_eq!(
            std::fs::read(a.join(n)).unwrap(),
            std::fs::read(b.join(n)).unwrap(),
            "{}",
            n
        );
    }
    for e in std::fs::read_dir(a.join("bundle")).unwrap() {
        let n = e.unwrap().file_name();
        assert_eq!(
            std::fs::read(a.join("bundle").join(&n)).unwrap(),
            std::fs::read(b.join("bundle").join(&n)).unwrap(),
            "{:?}",
            n
        );
    }
}

#[test]
fn d07_observe_renders_delta_and_observed_ascii() {
    let b = scratch("d07b");
    assert_eq!(build(&b).0, 0);
    let d = scratch("d07");
    let manifest = b.join("bundle/bundle.json").to_string_lossy().to_string();
    let (code, out, err) = run(&[
        "observe",
        "--out",
        &d.to_string_lossy(),
        "--tape",
        &fixture("tape-sample.ascii"),
        "--system",
        "byte_relay",
        "--source",
        &fixture("byte-relay.ascii"),
        "--bundle-manifest",
        &manifest,
        "--evidence-class",
        "PHYSICAL_BROWSER",
    ]);
    assert_eq!(code, 0, "{}{}", out, err);
    assert!(out.contains("factc: observe status OK"));
    assert!(read(&d, "diagnostics.json").contains("\"status\":\"OK\""));
    assert!(read(&d, "observation-delta.json").contains("\"source_unchanged\":true"));
    assert!(!read(&d, "observed.ascii").is_empty());
}
