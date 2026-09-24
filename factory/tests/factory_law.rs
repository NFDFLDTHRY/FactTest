//! P5-F01..F06 / P6-F01..F06 Factory-law witnesses on a scratch repository.
//! Each test builds a throwaway canonical repo + registry and drives the Factory library API.

use factory::json::{self, Value};
use factory::model::{Fixture, StructuralDelta};
use factory::{checks, git, hygiene, ops, paths};
use std::path::{Path, PathBuf};

struct Scratch {
    root: PathBuf,
    repo: PathBuf,
    wroot: PathBuf,
    base: String,
}

fn scratch(name: &str) -> Scratch {
    scratch_with(name, &[])
}

/// A scratch canonical repository whose registry also carries `extra` (station id, spec JSON) entries.
fn scratch_with(name: &str, extra: &[(&str, &str)]) -> Scratch {
    let root = std::env::temp_dir().join(format!("factory-law-{}-{}", name, std::process::id()));
    let _ = std::fs::remove_dir_all(&root);
    let repo = root.join("canonical");
    let wroot = root.join("workpieces");
    git::init_repo(&repo).unwrap();
    std::fs::create_dir_all(repo.join("factory/registry/stations")).unwrap();
    std::fs::create_dir_all(repo.join("src")).unwrap();
    std::fs::write(repo.join("FACTORY-LAW.md"), "law\n").unwrap();
    std::fs::write(repo.join("src/lib.txt"), "source v1\n").unwrap();
    std::fs::write(
        repo.join("factory/registry/stations/S-DOC.json"),
        r#"{"station_id":"S-DOC","version":"1","capability_tags":["DOC_CONTRACT_FORGE"],"may_read":["*"],"may_change":["design/","factory/"],"must_not_change":["FACTORY-LAW.md","src/"],"source_nonmutating":false,"receipt_schema_version":"1"}"#,
    )
    .unwrap();
    std::fs::write(
        repo.join("factory/registry/stations/S-BUILD.json"),
        r#"{"station_id":"S-BUILD","version":"1","capability_tags":["BUILD_VERIFY"],"may_read":["*"],"may_change":["evidence/"],"must_not_change":["FACTORY-LAW.md","src/"],"source_nonmutating":true,"receipt_schema_version":"1"}"#,
    )
    .unwrap();
    for (id, spec) in extra {
        std::fs::write(
            repo.join(format!("factory/registry/stations/{}.json", id)),
            spec,
        )
        .unwrap();
    }
    let base = git::commit_all(&repo, "base").unwrap();
    Scratch {
        root,
        repo,
        wroot,
        base,
    }
}

fn delta_value(s: &Scratch, id: &str, fixtures: &[&str]) -> Value {
    Value::obj()
        .with("delta_id", Value::s(id))
        .with("canonical_repo", Value::s(&s.repo.to_string_lossy()))
        .with("canonical_branch", Value::s("main"))
        .with("canonical_base", Value::s(&s.base))
        .with("workpiece_root", Value::s(&s.wroot.to_string_lossy()))
        .with("workpiece_id", Value::s(&format!("W-{}", id)))
        .with(
            "approved_ascii_refs",
            Value::str_arr(&["design/ASCII.md".to_string()]),
        )
        .with("intent", Value::s("scratch delta"))
        .with("may_read", Value::str_arr(&["*".to_string()]))
        .with(
            "may_change",
            Value::str_arr(&[
                "design/".to_string(),
                "factory/fixtures/".to_string(),
                "factory/receipts/".to_string(),
                "evidence/".to_string(),
            ]),
        )
        .with(
            "must_not_change",
            Value::str_arr(&["FACTORY-LAW.md".to_string(), "src/".to_string()]),
        )
        .with(
            "required_station_capabilities",
            Value::str_arr(&["DOC_CONTRACT_FORGE".to_string()]),
        )
        .with("invariants", Value::str_arr(&["law untouched".to_string()]))
        .with("tests", Value::str_arr(&["factory_law".to_string()]))
        .with(
            "evidence_requirements",
            Value::str_arr(&["receipts".to_string()]),
        )
        .with(
            "expected_output_contract",
            Value::obj().with(
                "required_paths",
                Value::str_arr(&["design/ASCII.md".to_string()]),
            ),
        )
        .with(
            "fixtures",
            Value::str_arr(&fixtures.iter().map(|s| s.to_string()).collect::<Vec<_>>()),
        )
}

fn fixture_value(
    id: &str,
    station: &str,
    delta: &str,
    may_change: &[&str],
    commands: Vec<Value>,
) -> Value {
    Value::obj()
        .with("fixture_id", Value::s(id))
        .with("station_id", Value::s(station))
        .with("delta_id", Value::s(delta))
        .with("selected_inputs", Value::Arr(vec![]))
        .with("narrowed_may_read", Value::str_arr(&["*".to_string()]))
        .with(
            "narrowed_may_change",
            Value::str_arr(&may_change.iter().map(|s| s.to_string()).collect::<Vec<_>>()),
        )
        .with(
            "job_parameters",
            Value::obj().with("commands", Value::Arr(commands)),
        )
        .with("expected_outputs", Value::Arr(vec![]))
}

fn write_delta(s: &Scratch, v: &Value) -> StructuralDelta {
    let p = s.root.join(format!(
        "{}.json",
        v.get("delta_id").unwrap().as_str().unwrap()
    ));
    json::write_file(&p, v).unwrap();
    StructuralDelta::load(&p).unwrap()
}

fn write_fixture(wp: &Path, rel: &str, v: &Value) -> Fixture {
    json::write_file(&wp.join(rel), v).unwrap();
    Fixture::load(&wp.join(rel)).unwrap()
}

fn happy_path(s: &Scratch, id: &str) -> (StructuralDelta, Fixture) {
    let d = write_delta(s, &delta_value(s, id, &["factory/fixtures/fx.json"]));
    let fx = open_happy(&d, id);
    (d, fx)
}

/// Create the workpiece of `d`, open its one S-DOC fixture and write the approved ASCII (station still open).
fn open_happy(d: &StructuralDelta, id: &str) -> Fixture {
    let r = ops::workpiece_create(d).unwrap();
    assert!(r.pass(), "{:?}", r);
    let wp = d.workpiece_dir();
    let fx = write_fixture(
        &wp,
        "factory/fixtures/fx.json",
        &fixture_value("fx", "S-DOC", id, &["design/", "factory/fixtures/"], vec![]),
    );
    let r = ops::station_open(d, &fx).unwrap();
    assert!(r.pass(), "{:?}", r);
    std::fs::create_dir_all(wp.join("design")).unwrap();
    std::fs::write(wp.join("design/ASCII.md"), "approved ascii\n").unwrap();
    fx
}

#[test]
fn f00_happy_path_integrates_and_reinspects() {
    let s = scratch("f00");
    let (d, fx) = happy_path(&s, "D-OK");
    let r = ops::station_close(&d, &fx).unwrap();
    assert!(r.pass(), "{:?}", r);
    let r = ops::verify(&d).unwrap();
    assert!(r.pass(), "{:?}", r);
    let r = ops::integrate(&d).unwrap();
    assert!(r.pass(), "{:?}", r);
    let r = ops::reinspect(&d).unwrap();
    assert!(r.pass(), "{:?}", r);
    assert_ne!(git::head_of_branch(&s.repo, "main").unwrap(), s.base);
}

#[test]
fn f01_unauthorized_mutation_fails_verification() {
    let s = scratch("f01");
    let (d, fx) = happy_path(&s, "D-F01");
    std::fs::write(d.workpiece_dir().join("src/lib.txt"), "mutated\n").unwrap();
    let r = ops::station_close(&d, &fx).unwrap();
    assert!(!r.pass(), "station close must fail: {:?}", r);
    let r = ops::verify(&d).unwrap();
    assert!(!r.pass());
    assert!(r
        .checks
        .iter()
        .any(|c| c.0 == "must_not_change_tree_identical" && !c.1));
    let r = ops::integrate(&d).unwrap();
    assert!(!r.pass());
}

#[test]
fn f02_fixture_authority_expansion_rejected_at_open() {
    let s = scratch("f02");
    let d = write_delta(&s, &delta_value(&s, "D-F02", &["factory/fixtures/fx.json"]));
    assert!(ops::workpiece_create(&d).unwrap().pass());
    let wp = d.workpiece_dir();
    let fx = write_fixture(
        &wp,
        "factory/fixtures/fx.json",
        &fixture_value("fx", "S-DOC", "D-F02", &["src/"], vec![]),
    );
    let r = ops::station_open(&d, &fx).unwrap();
    assert!(!r.pass());
    assert!(r
        .checks
        .iter()
        .any(|c| c.0 == "fixture_may_change_subset_of_station" && !c.1));
}

#[test]
fn f03_missing_receipt_blocks_verification() {
    let s = scratch("f03");
    let (d, _fx) = happy_path(&s, "D-F03");
    let r = ops::verify(&d).unwrap();
    assert!(!r.pass());
    assert!(r
        .checks
        .iter()
        .any(|c| c.0.starts_with("receipt_exists") && !c.1));
    assert!(!ops::integrate(&d).unwrap().pass());
}

#[test]
fn f04_failed_station_check_cannot_be_pass() {
    let s = scratch("f04");
    let d = write_delta(&s, &delta_value(&s, "D-F04", &["factory/fixtures/fx.json"]));
    assert!(ops::workpiece_create(&d).unwrap().pass());
    let wp = d.workpiece_dir();
    let cmd = Value::obj()
        .with("program", Value::s("false"))
        .with("args", Value::Arr(vec![]))
        .with("log", Value::s("design/false.log"));
    let fx = write_fixture(
        &wp,
        "factory/fixtures/fx.json",
        &fixture_value(
            "fx",
            "S-DOC",
            "D-F04",
            &["design/", "factory/fixtures/"],
            vec![cmd],
        ),
    );
    let r = ops::station_open(&d, &fx).unwrap();
    assert!(r.pass(), "{:?}", r);
    std::fs::create_dir_all(wp.join("design")).unwrap();
    std::fs::write(wp.join("design/ASCII.md"), "x\n").unwrap();
    let r = ops::station_close(&d, &fx).unwrap();
    assert!(!r.pass());
    let receipt = json::read_file(&wp.join("factory/receipts/D-F04/fx.json")).unwrap();
    assert_eq!(receipt.get("status").unwrap().as_str().unwrap(), "FAIL");
    assert!(!ops::verify(&d).unwrap().pass());
    assert!(!ops::integrate(&d).unwrap().pass());
}

#[test]
fn f05_moved_base_blocks_integration_without_force() {
    let s = scratch("f05");
    let (d, fx) = happy_path(&s, "D-F05");
    let r = ops::station_close(&d, &fx).unwrap();
    assert!(r.pass(), "{:?}", r);
    let r = ops::verify(&d).unwrap();
    assert!(r.pass(), "{:?}", r);
    // move the canonical base
    std::fs::write(s.repo.join("moved.txt"), "moved\n").unwrap();
    let moved = git::commit_all(&s.repo, "someone else moved the base").unwrap();
    let r = ops::integrate(&d).unwrap();
    assert!(!r.pass());
    assert!(r
        .checks
        .iter()
        .any(|c| c.0 == "canonical_base_unmoved" && !c.1));
    assert_eq!(
        git::head_of_branch(&s.repo, "main").unwrap(),
        moved,
        "no force update"
    );
}

#[test]
fn f06_read_only_station_mutating_source_fails() {
    let s = scratch("f06");
    let d = write_delta(&s, &delta_value(&s, "D-F06", &["factory/fixtures/fx.json"]));
    assert!(ops::workpiece_create(&d).unwrap().pass());
    let wp = d.workpiece_dir();
    // S-BUILD may only change evidence/; delta requires DOC capability, so also add BUILD to required set
    let mut dv = delta_value(&s, "D-F06", &["factory/fixtures/fx.json"]);
    dv.set(
        "required_station_capabilities",
        Value::str_arr(&["BUILD_VERIFY".to_string()]),
    );
    let d = write_delta(&s, &dv);
    let fx = write_fixture(
        &wp,
        "factory/fixtures/fx.json",
        &fixture_value("fx", "S-BUILD", "D-F06", &["evidence/"], vec![]),
    );
    let r = ops::station_open(&d, &fx).unwrap();
    assert!(r.pass(), "{:?}", r);
    std::fs::write(wp.join("design/ASCII.md"), "x\n").unwrap_or_else(|_| {
        std::fs::create_dir_all(wp.join("design")).unwrap();
        std::fs::write(wp.join("design/ASCII.md"), "x\n").unwrap();
    });
    let r = ops::station_close(&d, &fx).unwrap();
    assert!(!r.pass());
    assert!(r
        .checks
        .iter()
        .any(|c| c.0 == "read_only_station_source_nonmutating" && !c.1));
}

#[test]
fn f07_unreceipted_change_fails_verification() {
    let s = scratch("f07");
    let (d, fx) = happy_path(&s, "D-F07");
    let r = ops::station_close(&d, &fx).unwrap();
    assert!(r.pass(), "{:?}", r);
    std::fs::write(d.workpiece_dir().join("design/hidden.md"), "no receipt\n").unwrap();
    let r = ops::verify(&d).unwrap();
    assert!(!r.pass());
    assert!(r
        .checks
        .iter()
        .any(|c| c.0 == "no_unreceipted_change" && !c.1));
}

#[test]
fn f08_delta_with_overlapping_authority_fails_structural_check() {
    let s = scratch("f08");
    let mut dv = delta_value(&s, "D-F08", &["factory/fixtures/fx.json"]);
    dv.set("must_not_change", Value::str_arr(&["design/".to_string()]));
    let d = write_delta(&s, &dv);
    let r = ops::delta_check(&d);
    assert!(!r.pass());
    assert!(r
        .checks
        .iter()
        .any(|c| c.0 == "may_change_disjoint_from_must_not_change" && !c.1));
}

// ------------------------------------------------------------------------------------------------ D13 witnesses

fn has_failed(r: &ops::Report, name: &str) -> bool {
    r.checks.iter().any(|c| c.0 == name && !c.1)
}

#[test]
fn f09_wildcard_station_surface_rejected_at_open() {
    // the D9/D11 defect: under literal covers() a wildcard-looking entry matches nothing
    assert!(!paths::covers(
        "compiler/*/tests/",
        "compiler/kernel/tests/t.rs"
    ));
    assert!(!paths::covers(
        "compiler/*/src/",
        "compiler/kernel/src/lib.rs"
    ));
    let glob = r#"{"station_id":"S-GLOB","version":"1","capability_tags":["DOC_CONTRACT_FORGE"],"may_read":["*"],"may_change":["design/","compiler/*/tests/"],"must_not_change":["FACTORY-LAW.md","compiler/*/src/"],"source_nonmutating":false,"receipt_schema_version":"1"}"#;
    let s = scratch_with("f09", &[("S-GLOB", glob)]);
    let d = write_delta(&s, &delta_value(&s, "D-F09", &["factory/fixtures/fx.json"]));
    assert!(ops::workpiece_create(&d).unwrap().pass());
    let fx = write_fixture(
        &d.workpiece_dir(),
        "factory/fixtures/fx.json",
        &fixture_value("fx", "S-GLOB", "D-F09", &["design/"], vec![]),
    );
    let r = ops::station_open(&d, &fx).unwrap();
    assert!(!r.pass(), "{:?}", r);
    assert!(has_failed(&r, "station_may_change_surfaces_literal"));
    assert!(has_failed(&r, "station_must_not_change_surfaces_literal"));
}

#[test]
fn f10_wildcard_delta_surface_rejected_at_check() {
    let s = scratch("f10");
    let mut dv = delta_value(&s, "D-F10", &["factory/fixtures/fx.json"]);
    dv.set(
        "may_change",
        Value::str_arr(&[
            "design/*.md".to_string(),
            "factory/fixtures/".to_string(),
            "factory/receipts/".to_string(),
        ]),
    );
    dv.set("must_not_change", Value::str_arr(&["/abs/".to_string()]));
    let d = write_delta(&s, &dv);
    let r = ops::delta_check(&d);
    assert!(has_failed(&r, "delta_may_change_surfaces_literal"));
    assert!(has_failed(&r, "delta_must_not_change_surfaces_literal"));
    let r = ops::workpiece_create(&d).unwrap();
    assert!(!r.pass());
    assert!(
        !d.workpiece_dir().exists(),
        "no workpiece for a malformed delta"
    );
}

#[test]
fn f11_literal_surface_forms() {
    for ok in [
        "*",
        "design/",
        "a/b.md",
        "README.md",
        "factory/receipts/D13-X/",
    ] {
        assert!(paths::validate_surface(ok).is_ok(), "{}", ok);
    }
    for bad in [
        "", "/abs", "a/../b", "./a", "a//b", "a/*", "**", "?", "[ab]", "{a,b}", "a\\b", "..",
    ] {
        assert!(paths::validate_surface(bad).is_err(), "{:?}", bad);
    }
}

#[test]
fn f12_fixture_wildcard_rejected_at_open() {
    let s = scratch("f12");
    let d = write_delta(&s, &delta_value(&s, "D-F12", &["factory/fixtures/fx.json"]));
    assert!(ops::workpiece_create(&d).unwrap().pass());
    let fx = write_fixture(
        &d.workpiece_dir(),
        "factory/fixtures/fx.json",
        &fixture_value("fx", "S-DOC", "D-F12", &["design/*"], vec![]),
    );
    let r = ops::station_open(&d, &fx).unwrap();
    assert!(!r.pass());
    assert!(has_failed(&r, "fixture_may_change_surfaces_literal"));
}

#[test]
fn f13_receipt_and_verification_carry_environment_identity() {
    let s = scratch("f13");
    let d = write_delta(&s, &delta_value(&s, "D-F13", &["factory/fixtures/fx.json"]));
    assert!(ops::workpiece_create(&d).unwrap().pass());
    let wp = d.workpiece_dir();
    let mut fv = fixture_value(
        "fx",
        "S-DOC",
        "D-F13",
        &["design/", "factory/fixtures/"],
        vec![],
    );
    fv.set(
        "job_parameters",
        Value::obj().with("commands", Value::Arr(vec![])).with(
            "identity_probes",
            Value::Arr(vec![Value::obj()
                .with("name", Value::s("git"))
                .with("program", Value::s("git"))
                .with("args", Value::str_arr(&["--version".to_string()]))]),
        ),
    );
    let fx = write_fixture(&wp, "factory/fixtures/fx.json", &fv);
    assert_eq!(fx.identity_probes.len(), 1);
    assert!(ops::station_open(&d, &fx).unwrap().pass());
    std::fs::create_dir_all(wp.join("design")).unwrap();
    std::fs::write(wp.join("design/ASCII.md"), "approved ascii\n").unwrap();
    assert!(ops::station_close(&d, &fx).unwrap().pass());
    let rc = json::read_file(&wp.join("factory/receipts/D-F13/fx.json")).unwrap();
    assert_eq!(rc.get("receipt_format").unwrap().as_str(), Some("2"));
    let env = rc.get("environment_identity").unwrap();
    let sha = env
        .get("factory_binary")
        .unwrap()
        .get("sha256")
        .unwrap()
        .as_str()
        .unwrap();
    assert_eq!(sha.len(), 64);
    assert_eq!(
        env.get("host").unwrap().get("os").unwrap().as_str(),
        Some(std::env::consts::OS)
    );
    let probe = &env.get("identity_probes").unwrap().as_arr().unwrap()[0];
    assert_eq!(probe.get("exit").unwrap().as_int(), Some(0));
    assert!(probe.get("output").unwrap().as_arr().unwrap()[0]
        .as_str()
        .unwrap()
        .starts_with("git version"));
    assert!(ops::verify(&d).unwrap().pass());
    let v = json::read_file(&wp.join("factory/receipts/D-F13/verification.json")).unwrap();
    assert_eq!(
        v.get("verifier_identity")
            .unwrap()
            .get("sha256")
            .unwrap()
            .as_str()
            .unwrap()
            .len(),
        64
    );
}

/// D-OK integrated and reinspected; D-OPEN created only; stage copies and a stray file beside them.
fn audit_scene(name: &str, stage_text: &str) -> (Scratch, StructuralDelta, StructuralDelta) {
    let s = scratch(name);
    let (d, fx) = happy_path(&s, "D-OK");
    assert!(ops::station_close(&d, &fx).unwrap().pass());
    assert!(ops::verify(&d).unwrap().pass());
    assert!(ops::integrate(&d).unwrap().pass());
    assert!(ops::reinspect(&d).unwrap().pass());
    let open = write_delta(
        &s,
        &delta_value(&s, "D-OPEN", &["factory/fixtures/fx.json"]),
    );
    assert!(ops::workpiece_create(&open).unwrap().pass());
    let stage = s.wroot.join("W-D-OK-stage/design");
    std::fs::create_dir_all(&stage).unwrap();
    std::fs::write(stage.join("ASCII.md"), stage_text).unwrap();
    std::fs::create_dir_all(s.wroot.join("W-D-OPEN-stage")).unwrap();
    std::fs::write(s.wroot.join("W-D-OPEN-stage/x.md"), "draft\n").unwrap();
    std::fs::write(s.wroot.join("stray-binary"), "?\n").unwrap();
    (s, d, open)
}

fn decision(items: &[hygiene::AuditItem], suffix: &str) -> &'static str {
    items
        .iter()
        .find(|i| i.object.to_string_lossy().ends_with(suffix))
        .map(|i| i.decision)
        .unwrap_or("MISSING")
}

#[test]
fn f14_audit_classifies_only_proven_objects_retirable() {
    let (s, d, open) = audit_scene("f14", "approved ascii\n");
    let items = hygiene::audit(&s.wroot, &s.repo, "main", "W-NONE").unwrap();
    assert_eq!(decision(&items, "/W-D-OK"), "RETIRABLE");
    assert_eq!(decision(&items, "/W-D-OK-stage"), "RETIRABLE");
    assert_eq!(decision(&items, "/W-D-OPEN"), "KEEP");
    assert_eq!(decision(&items, "/W-D-OPEN-stage"), "KEEP");
    assert_eq!(decision(&items, "/stray-binary"), "KEEP");
    // a dirty integrated worktree is not retirable
    std::fs::write(d.workpiece_dir().join("design/extra.md"), "x\n").unwrap();
    let items = hygiene::audit(&s.wroot, &s.repo, "main", "W-NONE").unwrap();
    assert_eq!(decision(&items, "/W-D-OK"), "KEEP");
    // the current workpiece is never retirable
    std::fs::remove_file(d.workpiece_dir().join("design/extra.md")).unwrap();
    let items = hygiene::audit(&s.wroot, &s.repo, "main", "W-D-OK").unwrap();
    assert_eq!(decision(&items, "/W-D-OK"), "CURRENT");
    let _ = open;
    // the audit wrote nothing into the canonical object store
    let loose = git::run(&s.repo, &["count-objects"]).unwrap();
    let items2 = hygiene::audit(&s.wroot, &s.repo, "main", "W-NONE").unwrap();
    assert_eq!(items2.len(), items.len());
    assert_eq!(git::run(&s.repo, &["count-objects"]).unwrap(), loose);
}

#[test]
fn f15_retire_removes_exactly_the_proven_objects() {
    let (s, d, open) = audit_scene("f15", "stage text differs from the integrated tree\n");
    assert!(hygiene::retire(&s.wroot, &s.repo, "main", "", &s.root.join("r.json")).is_err());
    let r = hygiene::retire(
        &s.wroot,
        &s.repo,
        "main",
        "W-D-OPEN",
        &s.root.join("r.json"),
    )
    .unwrap();
    assert!(r.pass(), "{:?}", r);
    assert!(
        !d.workpiece_dir().exists(),
        "integrated clean worktree removed"
    );
    assert!(open.workpiece_dir().exists(), "current workpiece kept");
    assert!(
        s.wroot.join("W-D-OK-stage").exists(),
        "stage with unique bytes kept"
    );
    assert!(s.wroot.join("W-D-OPEN-stage").exists());
    assert!(s.wroot.join("stray-binary").exists());
    assert!(
        s.wroot.join("W-D-OK.state.json").exists(),
        "state records kept"
    );
    let rc = json::read_file(&s.root.join("r.json")).unwrap();
    let actions = rc.get("actions").unwrap().as_arr().unwrap();
    assert_eq!(actions.len(), 1);
    assert_eq!(actions[0].get("result").unwrap().as_str(), Some("REMOVED"));
    let items = hygiene::audit(&s.wroot, &s.repo, "main", "W-D-OPEN").unwrap();
    assert_eq!(decision(&items, "/W-D-OK"), "ABSENT");
    assert!(items.iter().all(|i| i.decision != "RETIRABLE"));
}

#[test]
fn f16_heuristic_checkers_carry_proof_weight_none() {
    let dir = std::env::temp_dir().join(format!("factory-law-f16-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(dir.join("src")).unwrap();
    std::fs::write(dir.join("src/lib.rs"), "#![no_std]\n").unwrap();
    std::fs::write(dir.join("Cargo.toml"), "[package]\nname = \"x\"\n").unwrap();
    let n = checks::nostd_check(std::slice::from_ref(&dir));
    assert!(n.pass());
    assert_eq!(n.weight.as_deref(), Some("NONE"));
    let d = checks::depcheck(&dir, &[dir.join("Cargo.toml")]);
    assert_eq!(d.weight.as_deref(), Some("NONE"));
    // Factory law reports carry no heuristic weight
    let s = scratch("f16");
    let dl = write_delta(&s, &delta_value(&s, "D-F16", &["factory/fixtures/fx.json"]));
    assert!(ops::delta_check(&dl).weight.is_none());
}

// ------------------------------------------------------------------------------------------------ D22 witnesses
// Negative witnesses of the D21-D26 prompt (D22 FACTORY PROVES FACTORY): each attack must be REFUSED FOR THE NAMED
// REASON (the check name asserted here); a failure for an unrelated reason is not a pass.

/// A fixture command value.
fn cmd(program: &str, args: &[&str], log: &str) -> Value {
    Value::obj()
        .with("program", Value::s(program))
        .with(
            "args",
            Value::str_arr(&args.iter().map(|a| a.to_string()).collect::<Vec<_>>()),
        )
        .with("log", Value::s(log))
}

/// Happy path closed PASS and verified PASS: ready to integrate.
fn verified(s: &Scratch, id: &str) -> (StructuralDelta, Fixture) {
    let (d, fx) = happy_path(s, id);
    let r = ops::station_close(&d, &fx).unwrap();
    assert!(r.pass(), "{:?}", r);
    let r = ops::verify(&d).unwrap();
    assert!(r.pass(), "{:?}", r);
    (d, fx)
}

fn item<'a>(items: &'a [hygiene::AuditItem], name: &str) -> &'a hygiene::AuditItem {
    items
        .iter()
        .find(|i| i.object.ends_with(name))
        .unwrap_or_else(|| panic!("no audit item {}", name))
}

#[test]
fn f17_edited_receipt_rejected_by_verify() {
    // forged receipt identity (1): a FAIL receipt edited by hand into PASS
    let s = scratch("f17");
    let d = write_delta(&s, &delta_value(&s, "D-F17", &["factory/fixtures/fx.json"]));
    assert!(ops::workpiece_create(&d).unwrap().pass());
    let wp = d.workpiece_dir();
    let fx = write_fixture(
        &wp,
        "factory/fixtures/fx.json",
        &fixture_value(
            "fx",
            "S-DOC",
            "D-F17",
            &["design/", "factory/fixtures/"],
            vec![cmd("false", &[], "design/false.log")],
        ),
    );
    assert!(ops::station_open(&d, &fx).unwrap().pass());
    std::fs::create_dir_all(wp.join("design")).unwrap();
    std::fs::write(wp.join("design/ASCII.md"), "approved ascii\n").unwrap();
    assert!(!ops::station_close(&d, &fx).unwrap().pass());
    let p = wp.join("factory/receipts/D-F17/fx.json");
    let forged = std::fs::read_to_string(&p)
        .unwrap()
        .replace("\"FAIL\"", "\"PASS\"");
    std::fs::write(&p, forged).unwrap();
    let r = ops::verify(&d).unwrap();
    assert!(!r.pass(), "an edited receipt must not verify: {:?}", r);
    assert!(has_failed(&r, "receipt_matches_station_run:fx"), "{:?}", r);
    assert!(!ops::integrate(&d).unwrap().pass());
    assert_eq!(git::head_of_branch(&s.repo, "main").unwrap(), s.base);
}

#[test]
fn f18_handwritten_receipt_rejected_by_verify() {
    // forged receipt identity (2): a PASS receipt no station wrote
    let s = scratch("f18");
    let (d, _fx) = happy_path(&s, "D-F18");
    let wp = d.workpiece_dir();
    let receipt = Value::obj()
        .with("receipt_format", Value::s("2"))
        .with("receipt_id", Value::s("R-D-F18-fx"))
        .with("station_id", Value::s("S-DOC"))
        .with("station_version", Value::s("1"))
        .with("fixture_id", Value::s("fx"))
        .with("workpiece_id", Value::s(&d.workpiece_id))
        .with("delta_id", Value::s("D-F18"))
        .with("canonical_base", Value::s(&s.base))
        .with(
            "changed_paths",
            Value::str_arr(&["design/ASCII.md".to_string()]),
        )
        .with("verification_results", Value::Arr(vec![]))
        .with("status", Value::s("PASS"));
    json::write_file(&wp.join("factory/receipts/D-F18/fx.json"), &receipt).unwrap();
    let r = ops::verify(&d).unwrap();
    assert!(
        !r.pass(),
        "a receipt no station wrote must not verify: {:?}",
        r
    );
    assert!(has_failed(&r, "receipt_matches_station_run:fx"), "{:?}", r);
    assert!(!ops::integrate(&d).unwrap().pass());
}

#[test]
fn f19_stale_verification_rejected_by_integrate() {
    // stale verification: a station ran again after the verification
    let s = scratch("f19");
    let (d, fx) = verified(&s, "D-F19");
    assert!(ops::station_open(&d, &fx).unwrap().pass());
    std::fs::write(d.workpiece_dir().join("design/more.md"), "more\n").unwrap();
    assert!(ops::station_close(&d, &fx).unwrap().pass());
    let r = ops::integrate(&d).unwrap();
    assert!(!r.pass());
    assert!(
        has_failed(&r, "workpiece_unchanged_since_verification"),
        "{:?}",
        r
    );
    assert_eq!(git::head_of_branch(&s.repo, "main").unwrap(), s.base);
}

#[test]
fn f20_workpiece_changed_after_verification_rejected() {
    let s = scratch("f20");
    let (d, _fx) = verified(&s, "D-F20");
    std::fs::write(
        d.workpiece_dir().join("design/ASCII.md"),
        "changed after verification\n",
    )
    .unwrap();
    let r = ops::integrate(&d).unwrap();
    assert!(!r.pass());
    assert!(
        has_failed(&r, "workpiece_unchanged_since_verification"),
        "{:?}",
        r
    );
    assert_eq!(git::head_of_branch(&s.repo, "main").unwrap(), s.base);
}

#[test]
fn f21_malformed_fixture_rejected() {
    let s = scratch("f21");
    let d = write_delta(&s, &delta_value(&s, "D-F21", &["factory/fixtures/fx.json"]));
    assert!(ops::workpiece_create(&d).unwrap().pass());
    let wp = d.workpiece_dir();
    // a command without a log never loads; verification names the fixture
    let bad = Value::obj()
        .with("program", Value::s("true"))
        .with("args", Value::Arr(vec![]));
    json::write_file(
        &wp.join("factory/fixtures/fx.json"),
        &fixture_value("fx", "S-DOC", "D-F21", &["design/"], vec![bad]),
    )
    .unwrap();
    let e = Fixture::load(&wp.join("factory/fixtures/fx.json")).unwrap_err();
    assert!(e.contains("'log'"), "{}", e);
    let r = ops::verify(&d).unwrap();
    assert!(!r.pass());
    assert!(
        has_failed(&r, "fixture_loads:factory/fixtures/fx.json"),
        "{:?}",
        r
    );
    // a fixture of another delta
    let fx = write_fixture(
        &wp,
        "factory/fixtures/fx.json",
        &fixture_value("fx", "S-DOC", "D-OTHER", &["design/"], vec![]),
    );
    let r = ops::station_open(&d, &fx).unwrap();
    assert!(!r.pass());
    assert!(has_failed(&r, "fixture_delta_matches"), "{:?}", r);
    // a fixture naming a station nobody registered
    let fx = write_fixture(
        &wp,
        "factory/fixtures/fx.json",
        &fixture_value("fx", "S-NOWHERE", "D-F21", &["design/"], vec![]),
    );
    let e = ops::station_open(&d, &fx).unwrap_err();
    assert!(e.contains("not registered"), "{}", e);
}

#[test]
fn f22_failed_identity_probe_rejected_at_close() {
    // bad environment identity: a declared identity probe that fails or cannot run
    let s = scratch("f22");
    let d = write_delta(&s, &delta_value(&s, "D-F22", &["factory/fixtures/fx.json"]));
    assert!(ops::workpiece_create(&d).unwrap().pass());
    let wp = d.workpiece_dir();
    let mut fv = fixture_value(
        "fx",
        "S-DOC",
        "D-F22",
        &["design/", "factory/fixtures/"],
        vec![],
    );
    fv.set(
        "job_parameters",
        Value::obj().with("commands", Value::Arr(vec![])).with(
            "identity_probes",
            Value::Arr(vec![
                Value::obj()
                    .with("name", Value::s("toolchain"))
                    .with("program", Value::s("false"))
                    .with("args", Value::Arr(vec![])),
                Value::obj()
                    .with("name", Value::s("browser"))
                    .with("program", Value::s("/nonexistent/browser"))
                    .with("args", Value::Arr(vec![])),
            ]),
        ),
    );
    let fx = write_fixture(&wp, "factory/fixtures/fx.json", &fv);
    assert!(ops::station_open(&d, &fx).unwrap().pass());
    std::fs::create_dir_all(wp.join("design")).unwrap();
    std::fs::write(wp.join("design/ASCII.md"), "approved ascii\n").unwrap();
    let r = ops::station_close(&d, &fx).unwrap();
    assert!(
        !r.pass(),
        "a receipt whose environment could not be identified is not PASS: {:?}",
        r
    );
    assert!(
        has_failed(&r, "identity_probe_observed:toolchain"),
        "{:?}",
        r
    );
    assert!(has_failed(&r, "identity_probe_observed:browser"), "{:?}", r);
    let rc = json::read_file(&wp.join("factory/receipts/D-F22/fx.json")).unwrap();
    assert_eq!(rc.get("status").unwrap().as_str(), Some("FAIL"));
    assert!(!ops::verify(&d).unwrap().pass());
}

#[test]
fn f23_command_escaping_the_workpiece_rejected_at_open() {
    let s = scratch("f23");
    let d = write_delta(&s, &delta_value(&s, "D-F23", &["factory/fixtures/fx.json"]));
    assert!(ops::workpiece_create(&d).unwrap().pass());
    let wp = d.workpiece_dir();
    let repo = s.repo.to_string_lossy().to_string();
    let up = cmd("true", &[], "design/up.log").with("cwd", Value::s("../"));
    let abs = cmd("true", &[], "design/abs.log").with("cwd", Value::s(&repo));
    let log = cmd("true", &[], "../escaped.log");
    let fx = write_fixture(
        &wp,
        "factory/fixtures/fx.json",
        &fixture_value(
            "fx",
            "S-DOC",
            "D-F23",
            &["design/", "factory/fixtures/"],
            vec![up, abs, log],
        ),
    );
    let r = ops::station_open(&d, &fx).unwrap();
    assert!(!r.pass());
    assert!(
        has_failed(&r, "command_cwd_within_workpiece:../"),
        "{:?}",
        r
    );
    assert!(
        has_failed(&r, &format!("command_cwd_within_workpiece:{}", repo)),
        "{:?}",
        r
    );
    assert!(
        has_failed(&r, "command_log_within_workpiece:../escaped.log"),
        "{:?}",
        r
    );
}

#[test]
fn f24_station_command_writing_into_canonical_rejected_at_close() {
    // attempted direct canonical mutation (1): a station command reaches the canonical checkout
    let s = scratch("f24");
    let d = write_delta(&s, &delta_value(&s, "D-F24", &["factory/fixtures/fx.json"]));
    assert!(ops::workpiece_create(&d).unwrap().pass());
    let wp = d.workpiece_dir();
    let target = s.repo.join("direct.txt");
    let write = cmd(
        "sh",
        &["-c", &format!("echo direct > {}", target.display())],
        "design/direct.log",
    );
    let fx = write_fixture(
        &wp,
        "factory/fixtures/fx.json",
        &fixture_value(
            "fx",
            "S-DOC",
            "D-F24",
            &["design/", "factory/fixtures/"],
            vec![write],
        ),
    );
    assert!(ops::station_open(&d, &fx).unwrap().pass());
    std::fs::create_dir_all(wp.join("design")).unwrap();
    std::fs::write(wp.join("design/ASCII.md"), "approved ascii\n").unwrap();
    let r = ops::station_close(&d, &fx).unwrap();
    assert!(
        !r.pass(),
        "a station that wrote into the canonical repository is not PASS: {:?}",
        r
    );
    assert!(
        has_failed(&r, "canonical_repository_untouched_by_station"),
        "{:?}",
        r
    );
    assert!(
        target.exists(),
        "the witness did write (the Factory names it)"
    );
    assert!(!ops::verify(&d).unwrap().pass());
    assert!(!ops::integrate(&d).unwrap().pass());
}

#[test]
fn f25_direct_canonical_edit_blocks_integration() {
    // attempted direct canonical mutation (2): an uncommitted edit in the canonical checkout
    let s = scratch("f25");
    let (d, _fx) = verified(&s, "D-F25");
    std::fs::write(
        s.repo.join("src/lib.txt"),
        "edited directly in the canonical checkout\n",
    )
    .unwrap();
    let r = ops::integrate(&d).unwrap();
    assert!(!r.pass());
    assert!(has_failed(&r, "canonical_working_tree_clean"), "{:?}", r);
    assert_eq!(git::head_of_branch(&s.repo, "main").unwrap(), s.base);
}

#[test]
fn f26_reinspect_command_writing_into_canonical_is_differ() {
    // attempted direct canonical mutation (3): the delta's own re-inspection probe leaves litter in the canonical
    // checkout
    let s = scratch("f26");
    let mut dv = delta_value(&s, "D-F26", &["factory/fixtures/fx.json"]);
    dv.set(
        "reinspect_commands",
        Value::Arr(vec![cmd(
            "sh",
            &["-c", "echo litter > reinspect-litter.txt"],
            "litter.log",
        )]),
    );
    let d = write_delta(&s, &dv);
    let fx = open_happy(&d, "D-F26");
    assert!(ops::station_close(&d, &fx).unwrap().pass());
    assert!(ops::verify(&d).unwrap().pass());
    assert!(ops::integrate(&d).unwrap().pass());
    let r = ops::reinspect(&d).unwrap();
    assert!(!r.pass(), "{:?}", r);
    assert!(
        has_failed(&r, "canonical_repository_untouched_by_reinspect"),
        "{:?}",
        r
    );
    let v = json::read_file(&s.wroot.join("W-D-F26.reinspect.json")).unwrap();
    assert_eq!(v.get("status").unwrap().as_str(), Some("DIFFER"));
}

#[test]
fn f27_unintegrated_workpiece_never_retired() {
    let s = scratch("f27");
    let (d, _fx) = verified(&s, "D-F27");
    let items = hygiene::audit(&s.wroot, &s.repo, "main", "W-OTHER").unwrap();
    let it = item(&items, "W-D-F27");
    assert_eq!(it.decision, "KEEP");
    assert!(
        it.reasons.iter().any(|x| x == "integration MISSING"),
        "{:?}",
        it.reasons
    );
    let r = hygiene::retire(&s.wroot, &s.repo, "main", "W-OTHER", &s.root.join("r.json")).unwrap();
    assert!(r.pass(), "{:?}", r);
    assert!(
        d.workpiece_dir().exists(),
        "verified-not-integrated workpiece kept"
    );
}

#[test]
fn f28_differing_reinspection_keeps_the_workpiece() {
    // unsafe cleanup candidate: integrated, but the re-inspection did not match
    let s = scratch("f28");
    let (d, _fx) = verified(&s, "D-F28");
    assert!(ops::integrate(&d).unwrap().pass());
    std::fs::write(s.repo.join("later.txt"), "later\n").unwrap();
    git::commit_all(&s.repo, "the branch moved on before re-inspection").unwrap();
    let r = ops::reinspect(&d).unwrap();
    assert!(!r.pass());
    assert!(
        has_failed(&r, "canonical_head_is_integrated_commit"),
        "{:?}",
        r
    );
    let items = hygiene::audit(&s.wroot, &s.repo, "main", "W-OTHER").unwrap();
    let it = item(&items, "W-D-F28");
    assert_eq!(it.decision, "KEEP");
    assert!(
        it.reasons.iter().any(|x| x == "reinspect DIFFER"),
        "{:?}",
        it.reasons
    );
    let r = hygiene::retire(&s.wroot, &s.repo, "main", "W-OTHER", &s.root.join("r.json")).unwrap();
    assert!(r.pass(), "{:?}", r);
    assert!(
        d.workpiece_dir().exists(),
        "differing workpiece kept as evidence"
    );
}
