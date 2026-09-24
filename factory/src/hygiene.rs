//! Workpiece hygiene (D13): a read-only audit of everything under the workpiece root and a guarded retire that removes
//! only what the audit PROVES disposable.  Nothing is ever forced: an object that fails any guard is kept and the
//! failed guard is recorded as the reason.
//!
//! Guards (design/materialization/D13-INTENDED-REPO-HYGIENE.md section 2.9):
//!   worktree  state verification PASS, integration PASS, reinspect MATCH; the integration commit is an ancestor of
//!             the canonical branch head; worktree HEAD == integration commit; `status --porcelain --ignored` empty;
//!             registered in `git worktree list`; not the current workpiece.  Removal: `git worktree remove` (no
//!             --force, so git refuses an unclean tree by itself).
//!   stage     a state file with integration PASS exists for the same workpiece and tree(stage) versus the
//!             integration tree has deletions only ("D"): every byte in the stage is already in the canonical history.
//!             The stage tree is computed with a temporary index AND a temporary object directory, so the audit
//!             writes nothing into the canonical object store.

use crate::git;
use crate::json::{self, Value};
use crate::ops::Report;
use std::path::{Path, PathBuf};

pub struct AuditItem {
    pub object: PathBuf,
    pub kind: &'static str,
    pub workpiece_id: String,
    pub decision: &'static str,
    pub reasons: Vec<String>,
    pub proof: Value,
}

impl AuditItem {
    fn to_value(&self) -> Value {
        Value::obj()
            .with("object", Value::s(&self.object.to_string_lossy()))
            .with("kind", Value::s(self.kind))
            .with("workpiece_id", Value::s(&self.workpiece_id))
            .with("decision", Value::s(self.decision))
            .with("reasons", Value::str_arr(&self.reasons))
            .with("proof", self.proof.clone())
    }
}

fn nonce() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let n = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    format!("{}-{}", std::process::id(), n)
}

fn registered_worktrees(repo: &Path) -> Vec<String> {
    git::run(repo, &["worktree", "list", "--porcelain"])
        .unwrap_or_default()
        .lines()
        .filter_map(|l| l.strip_prefix("worktree "))
        .map(|s| s.to_string())
        .collect()
}

fn state_str(v: &Value, obj: &str, key: &str) -> String {
    v.get(obj)
        .and_then(|o| o.get(key))
        .and_then(|s| s.as_str())
        .unwrap_or("")
        .to_string()
}

/// tree(stage) computed into throwaway index/object storage; returns the "name-status" diff against `tree`.
fn stage_diff(repo: &Path, stage: &Path, tree: &str) -> Result<Vec<String>, String> {
    let common = git::run(
        repo,
        &["rev-parse", "--path-format=absolute", "--git-common-dir"],
    )?;
    let tmp = std::env::temp_dir().join(format!("factory-stage-audit-{}", nonce()));
    let objects = tmp.join("objects");
    std::fs::create_dir_all(&objects).map_err(|e| e.to_string())?;
    let idx = tmp.join("index").to_string_lossy().to_string();
    let obj = objects.to_string_lossy().to_string();
    let alt = format!("{}/objects", common);
    let env = [
        ("GIT_INDEX_FILE", idx.as_str()),
        ("GIT_OBJECT_DIRECTORY", obj.as_str()),
        ("GIT_ALTERNATE_OBJECT_DIRECTORIES", alt.as_str()),
    ];
    let stage_s = stage.to_string_lossy().to_string();
    let res = (|| {
        git::run_env(
            stage,
            &[
                "--git-dir",
                &common,
                "--work-tree",
                &stage_s,
                "add",
                "-A",
                "-f",
                "--",
                ".",
            ],
            &env,
        )?;
        let st = git::run_env(stage, &["--git-dir", &common, "write-tree"], &env)?;
        let d = git::run_env(
            stage,
            &[
                "--git-dir",
                &common,
                "diff-tree",
                "-r",
                "--no-commit-id",
                "--name-status",
                tree,
                &st,
            ],
            &env,
        )?;
        Ok(d.lines()
            .filter(|l| !l.is_empty())
            .map(|s| s.to_string())
            .collect())
    })();
    let _ = std::fs::remove_dir_all(&tmp);
    res
}

/// Read-only audit of the workpiece root.  `current` is the workpiece id of the running delta (never retirable).
pub fn audit(
    root: &Path,
    repo: &Path,
    branch: &str,
    current: &str,
) -> Result<Vec<AuditItem>, String> {
    let head = git::head_of_branch(repo, branch)?;
    let registered = registered_worktrees(repo);
    let mut names: Vec<String> = std::fs::read_dir(root)
        .map_err(|e| format!("{}: {}", root.display(), e))?
        .flatten()
        .map(|e| e.file_name().to_string_lossy().to_string())
        .collect();
    names.sort();
    let states: Vec<String> = names
        .iter()
        .filter_map(|n| n.strip_suffix(".state.json").map(|s| s.to_string()))
        .collect();
    let mut items = Vec::new();
    let mut explained: Vec<String> = Vec::new();
    for id in &states {
        explained.push(format!("{}.state.json", id));
        explained.push(format!("{}.reinspect.json", id));
        explained.push(format!("{}.reinspect", id));
        let st = json::read_file(&root.join(format!("{}.state.json", id)))?;
        let commit = state_str(&st, "integration", "commit");
        let integ = state_str(&st, "integration", "status");
        let verif = state_str(&st, "verification", "status");
        let reinspect = json::read_file(&root.join(format!("{}.reinspect.json", id)))
            .ok()
            .and_then(|v| {
                v.get("status")
                    .and_then(|s| s.as_str())
                    .map(|s| s.to_string())
            })
            .unwrap_or_default();
        let ancestor = !commit.is_empty()
            && git::run(repo, &["merge-base", "--is-ancestor", &commit, &head]).is_ok();
        // the worktree
        let wdir = root.join(id);
        explained.push(id.clone());
        let mut reasons = Vec::new();
        let mut proof = Value::obj()
            .with("verification", Value::s(&verif))
            .with("integration", Value::s(&integ))
            .with("integration_commit", Value::s(&commit))
            .with("reinspect", Value::s(&reinspect))
            .with("canonical_head", Value::s(&head))
            .with("commit_is_ancestor_of_head", Value::Bool(ancestor));
        if !wdir.exists() {
            items.push(AuditItem {
                object: wdir,
                kind: "worktree",
                workpiece_id: id.clone(),
                decision: "ABSENT",
                reasons: vec!["worktree directory not present".into()],
                proof,
            });
        } else {
            let wt_head = git::rev_parse(&wdir, "HEAD").unwrap_or_default();
            let dirty = git::run(&wdir, &["status", "--porcelain", "--ignored"])
                .unwrap_or_else(|e| format!("status failed: {}", e));
            let is_registered = registered.iter().any(|r| Path::new(r) == wdir.as_path());
            proof.set("worktree_head", Value::s(&wt_head));
            proof.set(
                "status_porcelain_ignored_entries",
                Value::Int(dirty.lines().count() as i64),
            );
            proof.set("registered_worktree", Value::Bool(is_registered));
            if id == current {
                reasons.push("current workpiece of the running delta".into());
            }
            if verif != "PASS" {
                reasons.push(format!(
                    "verification {}",
                    if verif.is_empty() { "MISSING" } else { &verif }
                ));
            }
            if integ != "PASS" {
                reasons.push(format!(
                    "integration {}",
                    if integ.is_empty() { "MISSING" } else { &integ }
                ));
            }
            if reinspect != "MATCH" {
                reasons.push(format!(
                    "reinspect {}",
                    if reinspect.is_empty() {
                        "MISSING"
                    } else {
                        &reinspect
                    }
                ));
            }
            if !ancestor {
                reasons.push("integration commit is not an ancestor of the canonical head".into());
            }
            if wt_head != commit {
                reasons.push(format!("worktree HEAD {} != integration commit", wt_head));
            }
            if !dirty.is_empty() {
                reasons.push("worktree has modified, untracked or ignored entries".into());
            }
            if !is_registered {
                reasons.push("not a registered worktree of the canonical repository".into());
            }
            let decision = if id == current {
                "CURRENT"
            } else if reasons.is_empty() {
                "RETIRABLE"
            } else {
                "KEEP"
            };
            items.push(AuditItem {
                object: wdir,
                kind: "worktree",
                workpiece_id: id.clone(),
                decision,
                reasons,
                proof: proof.clone(),
            });
        }
        // the staging copy
        let sdir = root.join(format!("{}-stage", id));
        explained.push(format!("{}-stage", id));
        if sdir.is_dir() {
            let mut reasons = Vec::new();
            let mut sproof = Value::obj()
                .with("integration", Value::s(&integ))
                .with("integration_commit", Value::s(&commit));
            if id == current {
                reasons.push("staging copy of the current workpiece".into());
            }
            if integ != "PASS" {
                reasons.push("workpiece not integrated".into());
            } else if !ancestor {
                reasons.push("integration commit is not an ancestor of the canonical head".into());
            } else {
                match git::tree_of_commit(repo, &commit).and_then(|t| stage_diff(repo, &sdir, &t)) {
                    Ok(lines) => {
                        let not_deleted: Vec<String> = lines
                            .iter()
                            .filter(|l| !l.starts_with('D'))
                            .cloned()
                            .collect();
                        sproof.set(
                            "paths_only_in_integration",
                            Value::Int((lines.len() - not_deleted.len()) as i64),
                        );
                        sproof.set(
                            "paths_added_or_modified_in_stage",
                            Value::str_arr(&not_deleted),
                        );
                        if !not_deleted.is_empty() {
                            reasons.push(format!(
                                "{} stage path(s) differ from or are absent in the integrated tree",
                                not_deleted.len()
                            ));
                        }
                    }
                    Err(e) => reasons.push(format!("stage tree not computable: {}", e)),
                }
            }
            let decision = if id == current {
                "CURRENT"
            } else if reasons.is_empty() {
                "RETIRABLE"
            } else {
                "KEEP"
            };
            items.push(AuditItem {
                object: sdir,
                kind: "stage",
                workpiece_id: id.clone(),
                decision,
                reasons,
                proof: sproof,
            });
        }
    }
    // anything else under the root has no Factory record that could prove it disposable
    for n in &names {
        if explained.contains(n) {
            continue;
        }
        let p = root.join(n);
        let is_registered = registered.iter().any(|r| Path::new(r) == p.as_path());
        let (kind, why) = if n.ends_with("-stage") {
            ("stage", "no state file for this staging copy")
        } else if is_registered {
            (
                "worktree",
                "registered worktree without a Factory state file",
            )
        } else {
            ("unmanaged", "no Factory record describes this object")
        };
        items.push(AuditItem {
            object: p,
            kind,
            workpiece_id: String::new(),
            decision: if n.starts_with(current) && !current.is_empty() {
                "CURRENT"
            } else {
                "KEEP"
            },
            reasons: vec![why.into()],
            proof: Value::obj().with("registered_worktree", Value::Bool(is_registered)),
        });
    }
    Ok(items)
}

pub fn audit_value(
    root: &Path,
    repo: &Path,
    branch: &str,
    current: &str,
    items: &[AuditItem],
) -> Value {
    let count = |d: &str| items.iter().filter(|i| i.decision == d).count() as i64;
    Value::obj()
        .with("workpiece_root", Value::s(&root.to_string_lossy()))
        .with("canonical_repo", Value::s(&repo.to_string_lossy()))
        .with("canonical_branch", Value::s(branch))
        .with(
            "canonical_head",
            Value::s(&git::head_of_branch(repo, branch).unwrap_or_default()),
        )
        .with("current_workpiece", Value::s(current))
        .with("audited", Value::s(&crate::model::now_iso()))
        .with(
            "totals",
            Value::obj()
                .with("RETIRABLE", Value::Int(count("RETIRABLE")))
                .with("KEEP", Value::Int(count("KEEP")))
                .with("CURRENT", Value::Int(count("CURRENT")))
                .with("ABSENT", Value::Int(count("ABSENT"))),
        )
        .with(
            "objects",
            Value::Arr(items.iter().map(|i| i.to_value()).collect()),
        )
}

pub fn audit_report(
    root: &Path,
    repo: &Path,
    branch: &str,
    current: &str,
    out: &Path,
) -> Result<Report, String> {
    let items = audit(root, repo, branch, current)?;
    let mut r = Report::default();
    for i in &items {
        r.check(
            &format!("audited:{}", i.object.display()),
            true,
            format!("{} {} {}", i.kind, i.decision, i.reasons.join("; ")),
        );
    }
    json::write_file(out, &audit_value(root, repo, branch, current, &items))?;
    r.check("audit_written", true, out.to_string_lossy().to_string());
    Ok(r)
}

/// Remove exactly the RETIRABLE objects of a fresh audit; everything else is untouched.  Writes a retire receipt.
pub fn retire(
    root: &Path,
    repo: &Path,
    branch: &str,
    current: &str,
    out: &Path,
) -> Result<Report, String> {
    if current.is_empty() {
        return Err("retire requires the current workpiece id".into());
    }
    let items = audit(root, repo, branch, current)?;
    let mut r = Report::default();
    let mut actions = Vec::new();
    for i in items.iter().filter(|i| i.decision == "RETIRABLE") {
        let path = i.object.to_string_lossy().to_string();
        let res = match i.kind {
            "worktree" => git::run(repo, &["worktree", "remove", &path]).map(|_| ()),
            "stage" => std::fs::remove_dir_all(&i.object).map_err(|e| e.to_string()),
            other => Err(format!("kind {} is never retirable", other)),
        };
        let gone = !i.object.exists();
        let ok = res.is_ok() && gone;
        r.check(
            &format!("retired:{}", path),
            ok,
            match &res {
                Ok(()) => format!("{} removed", i.kind),
                Err(e) => e.clone(),
            },
        );
        actions.push(
            i.to_value()
                .with(
                    "action",
                    Value::s(if i.kind == "worktree" {
                        "git worktree remove"
                    } else {
                        "remove staging copy"
                    }),
                )
                .with("result", Value::s(if ok { "REMOVED" } else { "FAILED" }))
                .with("error", Value::s(&res.err().unwrap_or_default())),
        );
    }
    let kept: Vec<Value> = items
        .iter()
        .filter(|i| i.decision != "RETIRABLE")
        .map(|i| i.to_value())
        .collect();
    let v = Value::obj()
        .with("workpiece_root", Value::s(&root.to_string_lossy()))
        .with(
            "canonical_head",
            Value::s(&git::head_of_branch(repo, branch).unwrap_or_default()),
        )
        .with("current_workpiece", Value::s(current))
        .with("retired_at", Value::s(&crate::model::now_iso()))
        .with("actions", Value::Arr(actions))
        .with("kept", Value::Arr(kept));
    json::write_file(out, &v)?;
    r.check(
        "retire_receipt_written",
        true,
        out.to_string_lossy().to_string(),
    );
    Ok(r)
}
