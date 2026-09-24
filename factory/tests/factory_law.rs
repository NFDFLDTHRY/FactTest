//! P5-F01..F06 / P6-F01..F06 Factory-law witnesses on a scratch repository.
//! Each test builds a throwaway canonical repo + registry and drives the Factory library API.

use factory::json::{self, Value};
use factory::model::{Fixture, StructuralDelta};
use factory::{git, ops};
use std::path::{Path, PathBuf};

struct Scratch {
    root: PathBuf,
    repo: PathBuf,
    wroot: PathBuf,
    base: String,
}

fn scratch(name: &str) -> Scratch {
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
    let r = ops::workpiece_create(&d).unwrap();
    assert!(r.pass(), "{:?}", r);
    let wp = d.workpiece_dir();
    let fx = write_fixture(
        &wp,
        "factory/fixtures/fx.json",
        &fixture_value("fx", "S-DOC", id, &["design/", "factory/fixtures/"], vec![]),
    );
    let r = ops::station_open(&d, &fx).unwrap();
    assert!(r.pass(), "{:?}", r);
    std::fs::create_dir_all(wp.join("design")).unwrap();
    std::fs::write(wp.join("design/ASCII.md"), "approved ascii\n").unwrap();
    (d, fx)
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
