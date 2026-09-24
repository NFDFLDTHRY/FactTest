//! Execution-environment identity for receipts (receipt_format "2", D13).  The Factory records what it can observe
//! itself (its own binary, the host, git) and runs the identity probes a fixture declares (toolchains, runtimes,
//! browsers).  It never guesses a toolchain, target, profile or flag: those are fixture declarations and command
//! arguments, recorded as observed.

use crate::json::Value;
use crate::model::IdentityProbe;
use std::path::Path;

pub const RECEIPT_FORMAT: &str = "2";

pub fn sha256_hex(bytes: &[u8]) -> String {
    let digest = factc_foundation::sha256::digest(bytes);
    let mut hex = [0u8; 64];
    factc_foundation::hex::encode_into(&digest, &mut hex);
    String::from_utf8_lossy(&hex).to_string()
}

/// The running factory binary: the judge that produced a receipt or a verification.
pub fn binary_identity() -> Value {
    match std::env::current_exe() {
        Ok(p) => match std::fs::read(&p) {
            Ok(b) => Value::obj()
                .with("path", Value::s(&p.to_string_lossy()))
                .with("sha256", Value::s(&sha256_hex(&b)))
                .with("bytes", Value::Int(b.len() as i64)),
            Err(e) => Value::obj()
                .with("path", Value::s(&p.to_string_lossy()))
                .with("error", Value::s(&e.to_string())),
        },
        Err(e) => Value::obj().with("error", Value::s(&e.to_string())),
    }
}

pub fn host_identity() -> Value {
    let release = std::fs::read_to_string("/proc/sys/kernel/osrelease")
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|_| "unavailable".into());
    Value::obj()
        .with("os", Value::s(std::env::consts::OS))
        .with("arch", Value::s(std::env::consts::ARCH))
        .with("kernel_release", Value::s(&release))
}

fn first_lines(text: &str, n: usize) -> Vec<String> {
    text.lines().take(n).map(|l| l.to_string()).collect()
}

/// Run one declared identity probe in `dir`; the observation (never a verdict) goes into the receipt.
pub fn run_probe(dir: &Path, p: &IdentityProbe) -> Value {
    let mut cmd = std::process::Command::new(&p.program);
    cmd.args(&p.args).current_dir(dir);
    let base = Value::obj().with("name", Value::s(&p.name)).with(
        "command",
        Value::str_arr(
            &std::iter::once(p.program.clone())
                .chain(p.args.iter().cloned())
                .collect::<Vec<_>>(),
        ),
    );
    match cmd.output() {
        Ok(o) => {
            let mut text = String::from_utf8_lossy(&o.stdout).to_string();
            text.push_str(&String::from_utf8_lossy(&o.stderr));
            base.with("exit", Value::Int(o.status.code().unwrap_or(-1) as i64))
                .with("output", Value::str_arr(&first_lines(&text, 12)))
        }
        Err(e) => base.with("spawn_error", Value::s(&e.to_string())),
    }
}

pub fn environment_identity(dir: &Path, probes: &[IdentityProbe]) -> Value {
    let git = crate::git::run(dir, &["--version"]).unwrap_or_else(|e| e);
    Value::obj()
        .with("factory_binary", binary_identity())
        .with("host", host_identity())
        .with("git", Value::s(&git))
        .with(
            "identity_probes",
            Value::Arr(probes.iter().map(|p| run_probe(dir, p)).collect()),
        )
}
