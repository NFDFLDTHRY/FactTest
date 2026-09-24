//! Thin, explicit wrapper over the trusted bootstrap Git binary.

use std::path::Path;
use std::process::Command;

pub fn run(repo: &Path, args: &[&str]) -> Result<String, String> {
    run_env(repo, args, &[])
}

pub fn run_env(repo: &Path, args: &[&str], env: &[(&str, &str)]) -> Result<String, String> {
    let mut cmd = Command::new("git");
    cmd.arg("-C").arg(repo).args(args);
    for (k, v) in env {
        cmd.env(k, v);
    }
    let out = cmd
        .output()
        .map_err(|e| format!("git spawn failed: {}", e))?;
    if !out.status.success() {
        return Err(format!(
            "git {} failed ({}): {}",
            args.join(" "),
            out.status,
            String::from_utf8_lossy(&out.stderr).trim()
        ));
    }
    Ok(String::from_utf8_lossy(&out.stdout).trim_end().to_string())
}

pub fn rev_parse(repo: &Path, rev: &str) -> Result<String, String> {
    run(repo, &["rev-parse", "--verify", rev])
}

pub fn tree_of_commit(repo: &Path, commit: &str) -> Result<String, String> {
    rev_parse(repo, &format!("{}^{{tree}}", commit))
}

/// Hash the complete working tree (tracked + untracked, honoring .gitignore) without touching the real index.
pub fn write_tree_of_worktree(dir: &Path) -> Result<String, String> {
    let idx =
        std::env::temp_dir().join(format!("factory-index-{}-{}", std::process::id(), nonce()));
    let idx_s = idx.to_string_lossy().to_string();
    run_env(
        dir,
        &["add", "-A", "--", "."],
        &[("GIT_INDEX_FILE", &idx_s)],
    )?;
    let tree = run_env(dir, &["write-tree"], &[("GIT_INDEX_FILE", &idx_s)])?;
    let _ = std::fs::remove_file(&idx);
    Ok(tree)
}

fn nonce() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos() as u64)
        .unwrap_or(0)
}

/// Paths changed between two trees (recursive), sorted, unique.
pub fn diff_tree_paths(repo: &Path, a: &str, b: &str) -> Result<Vec<String>, String> {
    let out = run(
        repo,
        &["diff-tree", "-r", "--name-only", "--no-commit-id", a, b],
    )?;
    let mut v: Vec<String> = out
        .lines()
        .filter(|l| !l.is_empty())
        .map(|s| s.to_string())
        .collect();
    v.sort();
    v.dedup();
    Ok(v)
}

pub fn worktree_add_detached(repo: &Path, dir: &Path, commit: &str) -> Result<(), String> {
    run(
        repo,
        &[
            "worktree",
            "add",
            "--detach",
            &dir.to_string_lossy(),
            commit,
        ],
    )
    .map(|_| ())
}

pub fn commit_all(dir: &Path, message: &str) -> Result<String, String> {
    run(dir, &["add", "-A", "--", "."])?;
    run(
        dir,
        &[
            "-c",
            "user.name=FactTest Factory",
            "-c",
            "user.email=factory@facttest.invalid",
            "commit",
            "-q",
            "-m",
            message,
        ],
    )?;
    rev_parse(dir, "HEAD")
}

pub fn ff_merge(repo: &Path, commit: &str) -> Result<(), String> {
    run(repo, &["merge", "--ff-only", commit]).map(|_| ())
}

pub fn current_branch(repo: &Path) -> Result<String, String> {
    run(repo, &["rev-parse", "--abbrev-ref", "HEAD"])
}

pub fn head_of_branch(repo: &Path, branch: &str) -> Result<String, String> {
    rev_parse(repo, &format!("refs/heads/{}", branch))
}

pub fn init_repo(dir: &Path) -> Result<(), String> {
    std::fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    run(dir, &["init", "-q", "-b", "main"])?;
    run(dir, &["config", "user.name", "selftest"])?;
    run(dir, &["config", "user.email", "selftest@facttest.invalid"])?;
    Ok(())
}
