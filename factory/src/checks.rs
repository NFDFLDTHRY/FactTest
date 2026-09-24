//! Project-law verification tools used by station fixtures (S-RUST VERIFY, B0/B1/B2/B9, B12 evidence).
//! All first-party: no third-party crate is involved in checking that there are no third-party crates.

use crate::json::Value;
use crate::ops::Report;
use std::path::{Path, PathBuf};

/// B2 / PASS1: every `[dependencies]`, `[dev-dependencies]` and `[build-dependencies]` entry must be a
/// `path = ` dependency that resolves inside the repository root.  Registry/git dependencies are rejected.
pub fn depcheck(root: &Path, manifests: &[PathBuf]) -> Report {
    let mut r = Report::default();
    let root = root.canonicalize().unwrap_or_else(|_| root.to_path_buf());
    for m in manifests {
        let text = match std::fs::read_to_string(m) {
            Ok(t) => t,
            Err(e) => {
                r.check(
                    &format!("manifest_readable:{}", m.display()),
                    false,
                    e.to_string(),
                );
                continue;
            }
        };
        let mut section = String::new();
        let mut deps = 0usize;
        for raw in text.lines() {
            let line = raw.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            if line.starts_with('[') {
                section = line.trim_matches(|c| c == '[' || c == ']').to_string();
                continue;
            }
            let is_dep_section = section == "dependencies"
                || section == "dev-dependencies"
                || section == "build-dependencies"
                || section.ends_with(".dependencies");
            if !is_dep_section {
                continue;
            }
            deps += 1;
            let (name, spec) = match line.split_once('=') {
                Some((n, s)) => (n.trim(), s.trim()),
                None => {
                    r.check(
                        &format!("dependency_parsable:{}:{}", m.display(), line),
                        false,
                        "",
                    );
                    continue;
                }
            };
            let path_dep = spec.contains("path");
            let registry_or_git = spec.contains("version")
                || spec.contains("git")
                || spec.contains("registry")
                || spec.starts_with('"');
            if !path_dep || registry_or_git {
                r.check(
                    &format!("first_party_only:{}:{}", m.display(), name),
                    false,
                    format!("non-path dependency: {}", spec),
                );
                continue;
            }
            let rel = spec
                .split("path")
                .nth(1)
                .and_then(|s| s.split('"').nth(1))
                .unwrap_or("");
            let target = m.parent().unwrap_or(Path::new(".")).join(rel);
            let inside = target
                .canonicalize()
                .map(|t| t.starts_with(&root))
                .unwrap_or(false);
            r.check(
                &format!("first_party_only:{}:{}", m.display(), name),
                inside,
                format!("path {}", rel),
            );
        }
        r.check(
            &format!("manifest_scanned:{}", m.display()),
            true,
            format!("{} dependency entries", deps),
        );
    }
    r
}

/// B1 companion: kernel crates must declare `#![no_std]` and never name `std::` / `extern crate std`.
pub fn nostd_check(crate_dirs: &[PathBuf]) -> Report {
    let mut r = Report::default();
    for dir in crate_dirs {
        let lib = dir.join("src/lib.rs");
        let text = std::fs::read_to_string(&lib).unwrap_or_default();
        r.check(
            &format!("no_std_attribute:{}", dir.display()),
            text.contains("#![no_std]"),
            "",
        );
        let mut offenders = Vec::new();
        walk(&dir.join("src"), &mut |p| {
            if p.extension().map(|e| e == "rs").unwrap_or(false) {
                let t = std::fs::read_to_string(p).unwrap_or_default();
                let mut in_test = false;
                for line in t.lines() {
                    let l = line.trim();
                    if l.starts_with("#[cfg(test)]") {
                        in_test = true;
                    }
                    if !in_test
                        && (l.starts_with("use std::")
                            || l.contains("extern crate std")
                            || l.contains(" std::"))
                    {
                        offenders.push(format!("{}: {}", p.display(), l));
                    }
                }
            }
        });
        r.check(
            &format!("no_std_use:{}", dir.display()),
            offenders.is_empty(),
            offenders.join(" | "),
        );
    }
    r
}

fn walk(dir: &Path, f: &mut dyn FnMut(&Path)) {
    if let Ok(rd) = std::fs::read_dir(dir) {
        let mut entries: Vec<_> = rd.flatten().map(|e| e.path()).collect();
        entries.sort();
        for p in entries {
            if p.is_dir() {
                walk(&p, f);
            } else {
                f(&p);
            }
        }
    }
}

/// B9 / P6-B05: inspect a wasm binary; require every memory to use the i64 address type (wasm64), list
/// imports/exports.  Writes a JSON report when `out` is given.
pub fn wasm_inspect(path: &Path, require_wasm64: bool, out: Option<&Path>) -> Report {
    let mut r = Report::default();
    let bytes = match std::fs::read(path) {
        Ok(b) => b,
        Err(e) => {
            r.check("module_readable", false, e.to_string());
            return r;
        }
    };
    let info = match factc_foundation::wasm::read(&bytes) {
        Ok(i) => i,
        Err(e) => {
            r.check("module_structure", false, format!("{:?}", e));
            return r;
        }
    };
    r.check(
        "module_structure",
        true,
        format!("{} sections", info.section_ids.len()),
    );
    let mems: Vec<String> = info
        .memories
        .iter()
        .map(|m| {
            format!(
                "{:?} min={} max={:?} shared={}",
                m.address, m.min, m.max, m.shared
            )
        })
        .collect();
    r.check(
        "memory_declared",
        !info.memories.is_empty(),
        mems.join("; "),
    );
    if require_wasm64 {
        r.check(
            "all_memories_i64_address_type",
            info.all_memories_i64(),
            "wasm32 (i32 address) memories are forbidden by project law FT-003",
        );
    }
    let nm = |n: (u32, u32)| {
        String::from_utf8_lossy(&bytes[n.0 as usize..(n.0 + n.1) as usize]).to_string()
    };
    let imports: Vec<String> = info
        .imports
        .iter()
        .map(|i| format!("{}.{}:{}", nm(i.module), nm(i.name), i.kind))
        .collect();
    let exports: Vec<String> = info
        .exports
        .iter()
        .map(|e| format!("{}:{}", nm(e.name), e.kind))
        .collect();
    r.check("imports_listed", true, imports.join(", "));
    r.check("exports_listed", true, exports.join(", "));
    let digest = factc_foundation::sha256::digest(&bytes);
    let mut hex = [0u8; 64];
    factc_foundation::hex::encode_into(&digest, &mut hex);
    let sha = String::from_utf8_lossy(&hex).to_string();
    r.check(
        "artifact_identity",
        true,
        format!("sha256 {} bytes {}", sha, bytes.len()),
    );
    if let Some(o) = out {
        let v = Value::obj()
            .with("module", Value::s(&path.to_string_lossy()))
            .with("sha256", Value::s(&sha))
            .with("byte_len", Value::Int(bytes.len() as i64))
            .with("memories", Value::str_arr(&mems))
            .with("imports", Value::str_arr(&imports))
            .with("exports", Value::str_arr(&exports))
            .with("checks", r.to_value());
        if let Err(e) = crate::json::write_file(o, &v) {
            r.check("report_written", false, e);
        }
    }
    r
}

/// B12: evidence index with artifact identities (sha256) for every file under a directory.
pub fn evidence_index(dir: &Path, out: &Path) -> Report {
    let mut r = Report::default();
    let mut files: Vec<PathBuf> = Vec::new();
    walk(dir, &mut |p| {
        if p != out {
            files.push(p.to_path_buf());
        }
    });
    let mut entries = Vec::new();
    for f in &files {
        let bytes = std::fs::read(f).unwrap_or_default();
        let digest = factc_foundation::sha256::digest(&bytes);
        let mut hex = [0u8; 64];
        factc_foundation::hex::encode_into(&digest, &mut hex);
        let rel = f
            .strip_prefix(dir)
            .unwrap_or(f)
            .to_string_lossy()
            .to_string();
        entries.push(
            Value::obj()
                .with("path", Value::s(&rel))
                .with("byte_len", Value::Int(bytes.len() as i64))
                .with("sha256", Value::s(&String::from_utf8_lossy(&hex))),
        );
    }
    let v = Value::obj()
        .with("evidence_dir", Value::s(&dir.to_string_lossy()))
        .with("entries", Value::Arr(entries));
    match crate::json::write_file(out, &v) {
        Ok(()) => r.check(
            "evidence_index_written",
            true,
            format!("{} files -> {}", files.len(), out.display()),
        ),
        Err(e) => r.check("evidence_index_written", false, e),
    }
    r
}
