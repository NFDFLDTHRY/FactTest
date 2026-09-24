//! Factory operations.  Every operation reports structured results; none "fixes" a workpiece.

use crate::git;
use crate::json::{self, Value};
use crate::model::*;
use crate::paths;
use std::path::{Path, PathBuf};

#[derive(Debug, Default)]
pub struct Report {
    pub checks: Vec<(String, bool, String)>,
    /// Proof weight of a heuristic diagnostic (e.g. "NONE"); `None` for Factory law checks.
    pub weight: Option<String>,
}

impl Report {
    pub fn check(&mut self, name: &str, ok: bool, detail: impl Into<String>) {
        self.checks.push((name.to_string(), ok, detail.into()));
    }
    pub fn pass(&self) -> bool {
        self.checks.iter().all(|c| c.1)
    }
    pub fn to_value(&self) -> Value {
        Value::Arr(
            self.checks
                .iter()
                .map(|(n, ok, d)| {
                    Value::obj()
                        .with("check", Value::s(n))
                        .with("status", Value::s(if *ok { "PASS" } else { "FAIL" }))
                        .with("detail", Value::s(d))
                })
                .collect(),
        )
    }
    pub fn print(&self, title: &str) {
        println!(
            "== {} : {}{}",
            title,
            if self.pass() { "PASS" } else { "FAIL" },
            match &self.weight {
                Some(w) => format!(" [HEURISTIC: proof weight {}]", w),
                None => String::new(),
            }
        );
        for (n, ok, d) in &self.checks {
            println!(
                "  [{}] {}{}",
                if *ok { "PASS" } else { "FAIL" },
                n,
                if d.is_empty() {
                    String::new()
                } else {
                    format!(" - {}", d)
                }
            );
        }
    }
}

/// What a station or re-inspection command may never change: the canonical checkout (D22).  Head of the canonical
/// branch plus the porcelain status of its working tree, taken before and after the commands run.
fn canonical_snapshot(delta: &StructuralDelta) -> Result<String, String> {
    let repo = Path::new(&delta.canonical_repo);
    let head = git::head_of_branch(repo, &delta.canonical_branch)?;
    let status = git::run(repo, &["status", "--porcelain"])?;
    Ok(format!("head {}\n{}", head, status))
}

fn snapshot_detail(before: &str, after: &str) -> String {
    if before == after {
        "canonical checkout unchanged".to_string()
    } else {
        format!(
            "canonical checkout changed: before [{}] after [{}]",
            before.lines().take(4).collect::<Vec<_>>().join("; "),
            after.lines().take(4).collect::<Vec<_>>().join("; ")
        )
    }
}

fn station_path(delta_id_unused: &str, station_id: &str) -> String {
    let _ = delta_id_unused;
    format!("factory/registry/stations/{}.json", station_id)
}

/// Load the StationSpec that governs a fixture.  Canonical base wins; a spec that exists only in the
/// workpiece is bootstrap registry material and is reported as such.
pub fn load_station(
    delta: &StructuralDelta,
    station_id: &str,
) -> Result<(StationSpec, String), String> {
    let rel = station_path(&delta.delta_id, station_id);
    let repo = Path::new(&delta.canonical_repo);
    match git::run(
        repo,
        &["show", &format!("{}:{}", delta.canonical_base, rel)],
    ) {
        Ok(text) => Ok((StationSpec::from_text(&text)?, "canonical-base".into())),
        Err(_) => {
            let p = delta.workpiece_dir().join(&rel);
            let spec = StationSpec::load(&p).map_err(|e| {
                format!(
                    "station {} not registered in canonical base or workpiece: {}",
                    station_id, e
                )
            })?;
            Ok((spec, "workpiece-bootstrap".into()))
        }
    }
}

pub fn delta_owned(delta: &StructuralDelta, path: &str) -> bool {
    if paths::covers(&delta.receipts_dir(), path) {
        return true;
    }
    if delta.fixtures.iter().any(|f| f == path) {
        return true;
    }
    let wp = delta.workpiece_dir();
    if let Ok(rel) = delta.path.strip_prefix(&wp) {
        if rel.to_string_lossy() == path {
            return true;
        }
    }
    // Bootstrap registry: a StationSpec used by this delta's fixtures that does not yet exist in the canonical
    // base is Factory control material carried by the delta.  Once integrated, later deltas load the spec from
    // the canonical base and this rule no longer applies to it.
    if let Some(name) = path
        .strip_prefix("factory/registry/stations/")
        .and_then(|n| n.strip_suffix(".json"))
    {
        let used = delta
            .fixtures
            .iter()
            .filter_map(|f| Fixture::load(&wp.join(f)).ok())
            .any(|fx| fx.station_id == name);
        if used {
            let repo = Path::new(&delta.canonical_repo);
            let in_base = git::run(
                repo,
                &[
                    "cat-file",
                    "-e",
                    &format!("{}:{}", delta.canonical_base, path),
                ],
            )
            .is_ok();
            return !in_base;
        }
    }
    false
}

pub fn delta_check(delta: &StructuralDelta) -> Report {
    let mut r = Report::default();
    let repo = Path::new(&delta.canonical_repo);
    r.check(
        "delta_id_present",
        !delta.delta_id.is_empty(),
        delta.delta_id.clone(),
    );
    match git::tree_of_commit(repo, &delta.canonical_base) {
        Ok(t) => r.check("canonical_base_resolves", true, format!("tree {}", t)),
        Err(e) => r.check("canonical_base_resolves", false, e),
    }
    for (name, surfaces) in [
        ("may_read", &delta.may_read),
        ("may_change", &delta.may_change),
        ("must_not_change", &delta.must_not_change),
    ] {
        let bad = paths::invalid_surfaces(surfaces);
        r.check(
            &format!("delta_{}_surfaces_literal", name),
            bad.is_empty(),
            bad.join("; "),
        );
    }
    let ov = paths::overlap(&delta.may_change, &delta.must_not_change);
    r.check(
        "may_change_disjoint_from_must_not_change",
        ov.is_empty(),
        ov.join(", "),
    );
    r.check("may_change_nonempty", !delta.may_change.is_empty(), "");
    r.check("intent_present", !delta.intent.is_empty(), "");
    r.check(
        "approved_ascii_refs_present",
        !delta.approved_ascii_refs.is_empty(),
        delta.approved_ascii_refs.join(", "),
    );
    r.check(
        "tests_attached",
        !delta.tests.is_empty(),
        format!("{} tests", delta.tests.len()),
    );
    r.check(
        "evidence_requirements_attached",
        !delta.evidence_requirements.is_empty(),
        format!("{} requirements", delta.evidence_requirements.len()),
    );
    r.check(
        "invariants_attached",
        !delta.invariants.is_empty(),
        format!("{} invariants", delta.invariants.len()),
    );
    r.check(
        "fixtures_listed",
        !delta.fixtures.is_empty(),
        format!("{} fixtures", delta.fixtures.len()),
    );
    r.check(
        "receipts_dir_within_may_change",
        paths::within(
            &delta.may_change,
            delta.receipts_dir().trim_end_matches('/'),
        ),
        delta.receipts_dir(),
    );
    // every required capability must be satisfiable by a registered station (canonical or bootstrap)
    let wp = delta.workpiece_dir();
    for cap in &delta.required_station_capabilities {
        let mut found = Vec::new();
        // registries: canonical repo, workpiece, and the delta payload's own factory/ root (bootstrap)
        let payload_registry = delta
            .path
            .parent()
            .and_then(|p| p.parent())
            .map(|p| p.join("registry/stations"))
            .unwrap_or_else(|| PathBuf::from("/nonexistent"));
        for dir in [
            repo.join("factory/registry/stations"),
            wp.join("factory/registry/stations"),
            payload_registry,
        ] {
            if let Ok(rd) = std::fs::read_dir(&dir) {
                for e in rd.flatten() {
                    if let Ok(spec) = StationSpec::load(&e.path()) {
                        if spec.capability_tags.iter().any(|t| t == cap) {
                            found.push(spec.station_id.clone());
                        }
                    }
                }
            }
        }
        found.sort();
        found.dedup();
        r.check(
            &format!("station_capability_registered:{}", cap),
            !found.is_empty(),
            found.join(","),
        );
    }
    r
}

pub fn workpiece_create(delta: &StructuralDelta) -> Result<Report, String> {
    let mut r = delta_check(delta);
    if !r.pass() {
        return Ok(r);
    }
    let repo = Path::new(&delta.canonical_repo);
    let dir = delta.workpiece_dir();
    if dir.exists() {
        r.check(
            "workpiece_dir_absent",
            false,
            format!("{} already exists", dir.display()),
        );
        return Ok(r);
    }
    std::fs::create_dir_all(&delta.workpiece_root).map_err(|e| e.to_string())?;
    git::worktree_add_detached(repo, &dir, &delta.canonical_base)?;
    let base_tree = git::tree_of_commit(repo, &delta.canonical_base)?;
    let state = WorkpieceState {
        v: Value::obj()
            .with("workpiece_id", Value::s(&delta.workpiece_id))
            .with("delta_id", Value::s(&delta.delta_id))
            .with("canonical_repo", Value::s(&delta.canonical_repo))
            .with("canonical_branch", Value::s(&delta.canonical_branch))
            .with("canonical_base", Value::s(&delta.canonical_base))
            .with("base_tree", Value::s(&base_tree))
            .with("path", Value::s(&dir.to_string_lossy()))
            .with("created", Value::s(&now_iso()))
            .with("station_runs", Value::Arr(Vec::new())),
    };
    state.save(&delta.state_path())?;
    r.check(
        "workpiece_created",
        true,
        format!("{} @ {}", dir.display(), base_tree),
    );
    Ok(r)
}

/// Structural check of a fixture against station and delta authority (P5-F02).
pub fn fixture_check(
    delta: &StructuralDelta,
    fx: &Fixture,
) -> Result<(Report, StationSpec), String> {
    let mut r = Report::default();
    let (spec, origin) = load_station(delta, &fx.station_id)?;
    r.check(
        "station_registered",
        true,
        format!("{} v{} ({})", spec.station_id, spec.version, origin),
    );
    r.check(
        "fixture_delta_matches",
        fx.delta_id == delta.delta_id,
        fx.delta_id.clone(),
    );
    for (name, surfaces) in [
        ("station_may_read", &spec.may_read),
        ("station_may_change", &spec.may_change),
        ("station_must_not_change", &spec.must_not_change),
        ("fixture_may_read", &fx.narrowed_may_read),
        ("fixture_may_change", &fx.narrowed_may_change),
    ] {
        let bad = paths::invalid_surfaces(surfaces);
        r.check(
            &format!("{}_surfaces_literal", name),
            bad.is_empty(),
            bad.join("; "),
        );
    }
    let esc = paths::subset(&fx.narrowed_may_change, &spec.may_change);
    r.check(
        "fixture_may_change_subset_of_station",
        esc.is_empty(),
        esc.join(", "),
    );
    let esc = paths::subset(&fx.narrowed_may_read, &spec.may_read);
    r.check(
        "fixture_may_read_subset_of_station",
        esc.is_empty(),
        esc.join(", "),
    );
    let esc = paths::subset(&fx.narrowed_may_change, &delta.may_change);
    r.check(
        "fixture_may_change_subset_of_delta",
        esc.is_empty(),
        esc.join(", "),
    );
    let ov = paths::overlap(&fx.narrowed_may_change, &spec.must_not_change);
    r.check(
        "fixture_may_change_disjoint_from_station_must_not_change",
        ov.is_empty(),
        ov.join(", "),
    );
    let ov = paths::overlap(&fx.narrowed_may_change, &delta.must_not_change);
    r.check(
        "fixture_may_change_disjoint_from_delta_must_not_change",
        ov.is_empty(),
        ov.join(", "),
    );
    let cap_ok = spec
        .capability_tags
        .iter()
        .any(|t| delta.required_station_capabilities.contains(t));
    r.check(
        "station_capability_required_by_delta",
        cap_ok,
        spec.capability_tags.join(","),
    );
    for c in &fx.commands {
        r.check(
            &format!("command_log_within_may_change:{}", c.log),
            paths::within(&fx.narrowed_may_change, &c.log),
            "",
        );
        // D22: a command runs inside the workpiece and logs inside it; "." or a literal relative path only
        r.check(
            &format!("command_cwd_within_workpiece:{}", c.cwd),
            c.cwd == "." || paths::validate_surface(&c.cwd).is_ok(),
            paths::validate_surface(&c.cwd).err().unwrap_or_default(),
        );
        r.check(
            &format!("command_log_within_workpiece:{}", c.log),
            paths::validate_surface(&c.log).is_ok(),
            paths::validate_surface(&c.log).err().unwrap_or_default(),
        );
    }
    Ok((r, spec))
}

pub fn station_open(delta: &StructuralDelta, fx: &Fixture) -> Result<Report, String> {
    let (mut r, _spec) = fixture_check(delta, fx)?;
    if !r.pass() {
        return Ok(r);
    }
    let mut state = WorkpieceState::load(&delta.state_path())?;
    let open_tree = git::write_tree_of_worktree(&delta.workpiece_dir())?;
    let run = Value::obj()
        .with("fixture_id", Value::s(&fx.fixture_id))
        .with("station_id", Value::s(&fx.station_id))
        .with("opened", Value::s(&now_iso()))
        .with("open_tree", Value::s(&open_tree))
        .with("status", Value::s("OPEN"));
    state.runs_mut().push(run);
    state.save(&delta.state_path())?;
    r.check("station_opened", true, format!("open_tree {}", open_tree));
    Ok(r)
}

fn run_command(wp: &Path, c: &Command) -> (bool, String) {
    let mut cmd = std::process::Command::new(&c.program);
    cmd.args(&c.args).current_dir(wp.join(&c.cwd));
    for (k, v) in &c.env {
        cmd.env(k, v);
    }
    let out = cmd.output();
    let log_path = wp.join(&c.log);
    if let Some(p) = log_path.parent() {
        let _ = std::fs::create_dir_all(p);
    }
    match out {
        Ok(o) => {
            let code = o.status.code().unwrap_or(-1) as i64;
            let mut text = format!("$ {} {}\n(cwd {})\n", c.program, c.args.join(" "), c.cwd);
            text.push_str(&String::from_utf8_lossy(&o.stdout));
            text.push_str(&String::from_utf8_lossy(&o.stderr));
            text.push_str(&format!("\n[exit {}] expected {}\n", code, c.expect_exit));
            let _ = std::fs::write(&log_path, text);
            (
                code == c.expect_exit,
                format!("exit {} (expected {}) log {}", code, c.expect_exit, c.log),
            )
        }
        Err(e) => {
            let _ = std::fs::write(&log_path, format!("spawn failed: {}\n", e));
            (false, format!("spawn failed: {}", e))
        }
    }
}

pub fn station_close(delta: &StructuralDelta, fx: &Fixture) -> Result<Report, String> {
    let (mut r, spec) = fixture_check(delta, fx)?;
    let wp = delta.workpiece_dir();
    let mut state = WorkpieceState::load(&delta.state_path())?;
    let runs = state.runs();
    let open = runs
        .iter()
        .rev()
        .find(|x| {
            x.get("fixture_id").and_then(|s| s.as_str()) == Some(fx.fixture_id.as_str())
                && x.get("status").and_then(|s| s.as_str()) == Some("OPEN")
        })
        .cloned()
        .ok_or_else(|| format!("fixture {} has no OPEN station run", fx.fixture_id))?;
    let open_tree = open.str_field("open_tree")?;
    let canonical_before = canonical_snapshot(delta)?;

    // 1. operation / verification commands
    for c in &fx.commands {
        let (ok, detail) = run_command(&wp, c);
        r.check(
            &format!("command:{} {}", c.program, c.args.join(" ")),
            ok,
            detail,
        );
    }
    // D22: nothing a station runs may reach the canonical checkout
    let canonical_after = canonical_snapshot(delta)?;
    r.check(
        "canonical_repository_untouched_by_station",
        canonical_before == canonical_after,
        snapshot_detail(&canonical_before, &canonical_after),
    );
    // 2. changed paths
    let close_tree = git::write_tree_of_worktree(&wp)?;
    let changed = git::diff_tree_paths(&wp, &open_tree, &close_tree)?;
    let outside: Vec<String> = changed
        .iter()
        .filter(|p| !paths::within(&fx.narrowed_may_change, p))
        .cloned()
        .collect();
    r.check(
        "changed_paths_within_fixture_may_change",
        outside.is_empty(),
        outside.join(", "),
    );
    let forbidden: Vec<String> = changed
        .iter()
        .filter(|p| {
            paths::within(&spec.must_not_change, p) || paths::within(&delta.must_not_change, p)
        })
        .cloned()
        .collect();
    r.check(
        "must_not_change_untouched",
        forbidden.is_empty(),
        forbidden.join(", "),
    );
    if spec.source_nonmutating {
        let src: Vec<String> = changed
            .iter()
            .filter(|p| !paths::within(&spec.may_change, p))
            .cloned()
            .collect();
        r.check(
            "read_only_station_source_nonmutating",
            src.is_empty(),
            src.join(", "),
        );
    }
    for o in &fx.expected_outputs {
        r.check(
            &format!("expected_output_exists:{}", o),
            wp.join(o).exists(),
            "",
        );
    }
    // D22: a receipt claims the environment its probes identified; a probe that failed or could not run identifies
    // nothing, so the receipt cannot be PASS
    let environment = crate::identity::environment_identity(&wp, &fx.identity_probes);
    if let Some(probes) = environment.get("identity_probes").and_then(|a| a.as_arr()) {
        for p in probes {
            let name = p.get("name").and_then(|s| s.as_str()).unwrap_or("?");
            let exit = p.get("exit").and_then(|x| x.as_int());
            let spawn = p.get("spawn_error").and_then(|s| s.as_str());
            r.check(
                &format!("identity_probe_observed:{}", name),
                exit == Some(0) && spawn.is_none(),
                match (exit, spawn) {
                    (_, Some(e)) => format!("spawn error: {}", e),
                    (Some(c), None) => format!("exit {}", c),
                    (None, None) => "no exit status".to_string(),
                },
            );
        }
    }
    let status = if r.pass() { "PASS" } else { "FAIL" };
    let receipt_id = format!("R-{}-{}", delta.delta_id, fx.fixture_id);
    let receipt = Value::obj()
        .with("receipt_format", Value::s(crate::identity::RECEIPT_FORMAT))
        .with("receipt_id", Value::s(&receipt_id))
        .with("station_id", Value::s(&spec.station_id))
        .with("station_version", Value::s(&spec.version))
        .with("fixture_id", Value::s(&fx.fixture_id))
        .with("workpiece_id", Value::s(&delta.workpiece_id))
        .with("delta_id", Value::s(&delta.delta_id))
        .with("canonical_base", Value::s(&delta.canonical_base))
        .with("input_artifacts", Value::str_arr(&fx.selected_inputs))
        .with("open_tree", Value::s(&open_tree))
        .with("close_tree", Value::s(&close_tree))
        .with("changed_paths", Value::str_arr(&changed))
        .with("output_artifacts", Value::str_arr(&fx.expected_outputs))
        .with("verification_results", r.to_value())
        .with(
            "evidence_refs",
            Value::str_arr(
                &fx.commands
                    .iter()
                    .map(|c| c.log.clone())
                    .collect::<Vec<_>>(),
            ),
        )
        .with("environment_identity", environment)
        .with("closed", Value::s(&now_iso()))
        .with("status", Value::s(status));
    let rel = format!("{}{}.json", delta.receipts_dir(), fx.fixture_id);
    json::write_file(&wp.join(&rel), &receipt)?;
    // D22: the Factory-owned state (outside the workpiece) remembers the receipt it wrote, byte for byte
    let receipt_sha256 = std::fs::read(wp.join(&rel))
        .map(|b| crate::identity::sha256_hex(&b))
        .map_err(|e| e.to_string())?;
    for run in state.runs_mut().iter_mut().rev() {
        if run.get("fixture_id").and_then(|s| s.as_str()) == Some(fx.fixture_id.as_str())
            && run.get("status").and_then(|s| s.as_str()) == Some("OPEN")
        {
            run.set("status", Value::s(status));
            run.set("close_tree", Value::s(&close_tree));
            run.set("receipt", Value::s(&rel));
            run.set("receipt_sha256", Value::s(&receipt_sha256));
            break;
        }
    }
    state.save(&delta.state_path())?;
    r.check("receipt_written", true, rel);
    Ok(r)
}

/// Independent Factory verification (FACTORY-CONTRACTS.md section 6).  Consumes delta, base tree, workpiece tree,
/// receipts.  Never modifies anything except writing verification.json into the receipts surface.
pub fn verify(delta: &StructuralDelta) -> Result<Report, String> {
    let mut r = Report::default();
    let repo = Path::new(&delta.canonical_repo);
    let wp = delta.workpiece_dir();
    let mut state = WorkpieceState::load(&delta.state_path())?;
    let base_tree = git::tree_of_commit(repo, &delta.canonical_base)?;
    r.check(
        "state_base_tree_matches_canonical_base",
        state.base_tree()? == base_tree,
        base_tree.clone(),
    );
    let current_tree = git::write_tree_of_worktree(&wp)?;
    let changed = git::diff_tree_paths(&wp, &base_tree, &current_tree)?;
    let outside: Vec<String> = changed
        .iter()
        .filter(|p| !paths::within(&delta.may_change, p))
        .cloned()
        .collect();
    r.check(
        "changed_paths_within_delta_may_change",
        outside.is_empty(),
        outside.join(", "),
    );
    let forbidden: Vec<String> = changed
        .iter()
        .filter(|p| paths::within(&delta.must_not_change, p))
        .cloned()
        .collect();
    r.check(
        "must_not_change_tree_identical",
        forbidden.is_empty(),
        forbidden.join(", "),
    );

    let mut receipted: Vec<String> = Vec::new();
    let mut caps_covered: Vec<String> = Vec::new();
    for fxp in &delta.fixtures {
        let fx = match Fixture::load(&wp.join(fxp)) {
            Ok(f) => f,
            Err(e) => {
                r.check(&format!("fixture_loads:{}", fxp), false, e);
                continue;
            }
        };
        let rel = format!("{}{}.json", delta.receipts_dir(), fx.fixture_id);
        match json::read_file(&wp.join(&rel)) {
            Ok(rc) => {
                let status = rc
                    .get("status")
                    .and_then(|s| s.as_str())
                    .unwrap_or("MISSING");
                r.check(
                    &format!("receipt_pass:{}", fx.fixture_id),
                    status == "PASS",
                    format!("{} status {}", rel, status),
                );
                r.check(
                    &format!("receipt_station_matches_fixture:{}", fx.fixture_id),
                    rc.get("station_id").and_then(|s| s.as_str()) == Some(fx.station_id.as_str()),
                    "",
                );
                r.check(
                    &format!("receipt_base_matches:{}", fx.fixture_id),
                    rc.get("canonical_base").and_then(|s| s.as_str())
                        == Some(delta.canonical_base.as_str()),
                    "",
                );
                let all_pass = rc
                    .get("verification_results")
                    .and_then(|a| a.as_arr())
                    .map(|a| {
                        a.iter()
                            .all(|x| x.get("status").and_then(|s| s.as_str()) == Some("PASS"))
                    })
                    .unwrap_or(false);
                r.check(
                    &format!("receipt_all_checks_pass:{}", fx.fixture_id),
                    all_pass,
                    "",
                );
                // D22: a receipt counts only as the Factory wrote it - the latest closed station run of this fixture
                // in the Factory-owned state must name this receipt, its close tree and its exact bytes, with PASS
                let latest = state
                    .runs()
                    .iter()
                    .rev()
                    .find(|x| {
                        x.get("fixture_id").and_then(|s| s.as_str()) == Some(fx.fixture_id.as_str())
                            && x.get("status").and_then(|s| s.as_str()) != Some("OPEN")
                    })
                    .cloned();
                let file_sha = std::fs::read(wp.join(&rel))
                    .map(|b| crate::identity::sha256_hex(&b))
                    .unwrap_or_default();
                let (run_ok, run_detail) = match &latest {
                    None => (
                        false,
                        "no closed station run recorded for this fixture".to_string(),
                    ),
                    Some(run) => {
                        let f = |k: &str| {
                            run.get(k)
                                .and_then(|s| s.as_str())
                                .unwrap_or("")
                                .to_string()
                        };
                        let mut bad = Vec::new();
                        if f("status") != "PASS" {
                            bad.push(format!("station run status {}", f("status")));
                        }
                        if f("receipt") != rel {
                            bad.push(format!("station run receipt {}", f("receipt")));
                        }
                        if rc.get("close_tree").and_then(|s| s.as_str()).unwrap_or("")
                            != f("close_tree")
                        {
                            bad.push("receipt close_tree differs from the station run".to_string());
                        }
                        if f("receipt_sha256") != file_sha {
                            bad.push(
                                "receipt bytes differ from those the Factory wrote".to_string(),
                            );
                        }
                        (bad.is_empty(), bad.join("; "))
                    }
                };
                r.check(
                    &format!("receipt_matches_station_run:{}", fx.fixture_id),
                    run_ok,
                    run_detail,
                );
                receipted.extend(rc.str_list("changed_paths"));
                if let Ok((spec, _)) = load_station(delta, &fx.station_id) {
                    caps_covered.extend(spec.capability_tags.clone());
                }
            }
            Err(e) => r.check(&format!("receipt_exists:{}", fx.fixture_id), false, e),
        }
    }
    for cap in &delta.required_station_capabilities {
        r.check(
            &format!("required_capability_receipted:{}", cap),
            caps_covered.contains(cap),
            "",
        );
    }
    // Delta-owned control surfaces: the delta file, its fixture files and its receipts directory are the
    // StructuralDelta's own records; they are structurally checked above rather than station-receipted.
    let unreceipted: Vec<String> = changed
        .iter()
        .filter(|p| !receipted.contains(p) && !delta_owned(delta, p))
        .cloned()
        .collect();
    r.check(
        "no_unreceipted_change",
        unreceipted.is_empty(),
        unreceipted.join(", "),
    );
    for p in &delta.required_paths {
        r.check(
            &format!("required_path_exists:{}", p),
            wp.join(p).exists(),
            "",
        );
    }
    for p in &delta.forbidden_paths {
        r.check(
            &format!("forbidden_path_absent:{}", p),
            !wp.join(p).exists(),
            "",
        );
    }
    let status = if r.pass() { "PASS" } else { "FAIL" };
    let verification = Value::obj()
        .with("delta_id", Value::s(&delta.delta_id))
        .with("workpiece_id", Value::s(&delta.workpiece_id))
        .with("canonical_base", Value::s(&delta.canonical_base))
        .with("base_tree", Value::s(&base_tree))
        .with("verified_tree", Value::s(&current_tree))
        .with("changed_paths", Value::str_arr(&changed))
        .with("checks", r.to_value())
        .with("verifier_identity", crate::identity::binary_identity())
        .with("host", crate::identity::host_identity())
        .with("verified", Value::s(&now_iso()))
        .with("status", Value::s(status));
    let rel = format!("{}verification.json", delta.receipts_dir());
    json::write_file(&wp.join(&rel), &verification)?;
    let final_tree = git::write_tree_of_worktree(&wp)?;
    state.v.set(
        "verification",
        Value::obj()
            .with("status", Value::s(status))
            .with("verified_tree", Value::s(&current_tree))
            .with("final_tree", Value::s(&final_tree))
            .with("path", Value::s(&rel)),
    );
    state.save(&delta.state_path())?;
    r.check(
        "verification_written",
        true,
        format!("{} final_tree {}", rel, final_tree),
    );
    Ok(r)
}

/// Integration gate (FACTORY-CONTRACTS.md section 7).  Fast-forward only.  A moved base stops here.
pub fn integrate(delta: &StructuralDelta) -> Result<Report, String> {
    let mut r = Report::default();
    let repo = Path::new(&delta.canonical_repo);
    let wp = delta.workpiece_dir();
    let mut state = WorkpieceState::load(&delta.state_path())?;
    let ver = state.v.get("verification").cloned().unwrap_or(Value::obj());
    let vstatus = ver
        .get("status")
        .and_then(|s| s.as_str())
        .unwrap_or("MISSING")
        .to_string();
    r.check("verification_pass", vstatus == "PASS", vstatus.clone());
    let final_tree = ver
        .get("final_tree")
        .and_then(|s| s.as_str())
        .unwrap_or("")
        .to_string();
    let current_tree = git::write_tree_of_worktree(&wp)?;
    r.check(
        "workpiece_unchanged_since_verification",
        current_tree == final_tree,
        format!("{} vs {}", current_tree, final_tree),
    );
    let head = git::head_of_branch(repo, &delta.canonical_branch)?;
    r.check(
        "canonical_base_unmoved",
        head == delta.canonical_base,
        format!(
            "branch {} head {} base {}",
            delta.canonical_branch, head, delta.canonical_base
        ),
    );
    let checked_out = git::current_branch(repo)?;
    r.check(
        "canonical_branch_checked_out",
        checked_out == delta.canonical_branch,
        checked_out,
    );
    let dirty = git::run(repo, &["status", "--porcelain"])?;
    r.check(
        "canonical_working_tree_clean",
        dirty.is_empty(),
        dirty.lines().take(5).collect::<Vec<_>>().join("; "),
    );
    if !r.pass() {
        r.check(
            "integration",
            false,
            "STOP: gate conditions failed; no force update performed",
        );
        return Ok(r);
    }
    let mut msg = format!("{}: {}\n", delta.delta_id, delta.intent);
    if !delta.commit_trailers.is_empty() {
        msg.push('\n');
        for t in &delta.commit_trailers {
            msg.push_str(t);
            msg.push('\n');
        }
    }
    // idempotent: a previous integration attempt may already have committed exactly the verified tree
    let head = git::rev_parse(&wp, "HEAD")?;
    let commit = if head != delta.canonical_base && git::tree_of_commit(&wp, &head)? == final_tree {
        head
    } else {
        git::commit_all(&wp, &msg)?
    };
    let commit_tree = git::tree_of_commit(&wp, &commit)?;
    r.check(
        "commit_tree_matches_final_tree",
        commit_tree == final_tree,
        commit.clone(),
    );
    if commit_tree != final_tree {
        r.check("integration", false, "STOP: commit tree diverged");
        return Ok(r);
    }
    // re-check the base immediately before moving the ref
    let head2 = git::head_of_branch(repo, &delta.canonical_branch)?;
    if head2 != delta.canonical_base {
        r.check(
            "integration",
            false,
            format!("STOP: base moved to {} during integration", head2),
        );
        return Ok(r);
    }
    git::ff_merge(repo, &commit)?;
    let new_head = git::head_of_branch(repo, &delta.canonical_branch)?;
    r.check(
        "integration",
        new_head == commit,
        format!("{} -> {}", delta.canonical_base, new_head),
    );
    state.v.set(
        "integration",
        Value::obj()
            .with("commit", Value::s(&commit))
            .with("integrated", Value::s(&now_iso()))
            .with("status", Value::s("PASS")),
    );
    state.save(&delta.state_path())?;
    Ok(r)
}

/// Re-inspection (FACTORY-CONTRACTS.md section 8): fetch canonical tree again and compare to the verified workpiece.
pub fn reinspect(delta: &StructuralDelta) -> Result<Report, String> {
    let mut r = Report::default();
    let repo = Path::new(&delta.canonical_repo);
    let state = WorkpieceState::load(&delta.state_path())?;
    let final_tree = state
        .v
        .get("verification")
        .and_then(|v| v.get("final_tree"))
        .and_then(|s| s.as_str())
        .unwrap_or("")
        .to_string();
    let commit = state
        .v
        .get("integration")
        .and_then(|v| v.get("commit"))
        .and_then(|s| s.as_str())
        .unwrap_or("")
        .to_string();
    let head = git::head_of_branch(repo, &delta.canonical_branch)?;
    r.check(
        "canonical_head_is_integrated_commit",
        head == commit,
        format!("head {} commit {}", head, commit),
    );
    let head_tree = git::tree_of_commit(repo, &head)?;
    r.check(
        "canonical_tree_matches_verified_workpiece",
        head_tree == final_tree,
        format!("{} vs {}", head_tree, final_tree),
    );
    let out_dir: PathBuf =
        Path::new(&delta.workpiece_root).join(format!("{}.reinspect", delta.workpiece_id));
    std::fs::create_dir_all(&out_dir).map_err(|e| e.to_string())?;
    let canonical_before = canonical_snapshot(delta)?;
    for c in &delta.reinspect_commands {
        let c2 = Command {
            log: out_dir.join(&c.log).to_string_lossy().to_string(),
            ..c.clone()
        };
        let (ok, detail) = run_command(repo, &c2);
        r.check(
            &format!("reinspect_command:{} {}", c.program, c.args.join(" ")),
            ok,
            detail,
        );
    }
    // D22: a re-inspection probes the canonical checkout; it may not change it
    let canonical_after = canonical_snapshot(delta)?;
    r.check(
        "canonical_repository_untouched_by_reinspect",
        canonical_before == canonical_after,
        snapshot_detail(&canonical_before, &canonical_after),
    );
    let v = Value::obj()
        .with("delta_id", Value::s(&delta.delta_id))
        .with("canonical_head", Value::s(&head))
        .with("canonical_tree", Value::s(&head_tree))
        .with("checks", r.to_value())
        .with("reinspected", Value::s(&now_iso()))
        .with(
            "status",
            Value::s(if r.pass() { "MATCH" } else { "DIFFER" }),
        );
    json::write_file(
        &Path::new(&delta.workpiece_root).join(format!("{}.reinspect.json", delta.workpiece_id)),
        &v,
    )?;
    Ok(r)
}
