//! `factc` host driver.  Reads files, hands bytes to the no_std kernel, writes artifacts.  It never interprets
//! source semantics itself.

use factc_foundation::OutBuf;
use factc_kernel::{Mode, Workspace};
use std::path::PathBuf;

const OUT_BYTES: usize = 1 << 20;

fn usage() -> ! {
    eprintln!("usage:\n  factc abi-version\n  factc required-workspace\n  factc check <analyze|build> --out <dir> [--contracts <file>] [--metrics <file>] [--machine <file>] <source files...>");
    std::process::exit(2)
}

fn main() {
    // The workspace holds bounded arenas; run on a thread with a generous stack so it never needs a heap.
    let handle = std::thread::Builder::new()
        .stack_size(256 * 1024 * 1024)
        .spawn(real_main)
        .expect("spawn");
    let code = handle.join().unwrap_or(3);
    std::process::exit(code);
}

fn real_main() -> i32 {
    let args: Vec<String> = std::env::args().skip(1).collect();
    match args.first().map(|s| s.as_str()) {
        Some("abi-version") => {
            println!("{}", factc_kernel::query_abi_version());
            0
        }
        Some("required-workspace") => {
            println!("{}", factc_kernel::query_required_workspace());
            0
        }
        Some("check") => check(&args[1..]),
        _ => usage(),
    }
}

fn check(args: &[String]) -> i32 {
    let mode = match args.first().map(|s| s.as_str()) {
        Some("analyze") => Mode::Analyze,
        Some("build") => Mode::Build,
        _ => usage(),
    };
    let mut out_dir: Option<PathBuf> = None;
    let mut files: Vec<PathBuf> = Vec::new();
    let mut contracts: Option<PathBuf> = None;
    let mut metrics: Option<PathBuf> = None;
    let mut machine: Option<PathBuf> = None;
    let mut i = 1;
    while i < args.len() {
        if args[i] == "--out" {
            out_dir = args.get(i + 1).map(PathBuf::from);
            i += 2;
        } else if args[i] == "--contracts" {
            contracts = args.get(i + 1).map(PathBuf::from);
            i += 2;
        } else if args[i] == "--metrics" {
            metrics = args.get(i + 1).map(PathBuf::from);
            i += 2;
        } else if args[i] == "--machine" {
            machine = args.get(i + 1).map(PathBuf::from);
            i += 2;
        } else {
            files.push(PathBuf::from(&args[i]));
            i += 1;
        }
    }
    let out_dir = out_dir.unwrap_or_else(|| usage());
    if let Err(e) = std::fs::create_dir_all(&out_dir) {
        eprintln!("factc: {}: {}", out_dir.display(), e);
        return 3;
    }
    let mut ws = Workspace::new();
    let mut lineage = String::from("{\"sources\":[");
    for (n, f) in files.iter().enumerate() {
        let bytes = match std::fs::read(f) {
            Ok(b) => b,
            Err(e) => {
                eprintln!("factc: {}: {}", f.display(), e);
                return 3;
            }
        };
        match factc_kernel::submit_source_bytes(&mut ws, &bytes) {
            Ok(id) => {
                let digest = factc_foundation::sha256::digest(&bytes);
                let mut hex = [0u8; 64];
                factc_foundation::hex::encode_into(&digest, &mut hex);
                if n > 0 {
                    lineage.push(',');
                }
                lineage.push_str(&format!(
                    "{{\"source_id\":{},\"host_path\":{:?},\"byte_len\":{},\"sha256\":\"{}\"}}",
                    id.raw(),
                    f.display().to_string(),
                    bytes.len(),
                    std::str::from_utf8(&hex).unwrap()
                ));
            }
            Err(status) => {
                eprintln!("factc: source submission failed: {:?}", status);
                // still write diagnostics below
                let _ = status;
                break;
            }
        }
    }
    lineage.push_str("]}\n");
    for (path, which) in [
        (&contracts, "contracts"),
        (&metrics, "metrics"),
        (&machine, "machine"),
    ] {
        if let Some(p) = path {
            let bytes = match std::fs::read(p) {
                Ok(b) => b,
                Err(e) => {
                    eprintln!("factc: {}: {}", p.display(), e);
                    return 3;
                }
            };
            let r = match which {
                "contracts" => factc_kernel::submit_contracts(&mut ws, &bytes),
                "metrics" => factc_kernel::submit_metrics(&mut ws, &bytes),
                _ => factc_kernel::submit_machine_state(&mut ws, &bytes),
            };
            if let Err(st) = r {
                eprintln!("factc: {} submission failed: {:?}", which, st);
                return 3;
            }
        }
    }
    let status = factc_kernel::check_or_compile(&mut ws, mode);
    let mut out_bytes = vec![0u8; OUT_BYTES];
    let mut buf = OutBuf::new(&mut out_bytes);
    if factc_kernel::read_diagnostics(&ws, &mut buf).is_err() {
        eprintln!("factc: diagnostics output too small");
        return 3;
    }
    let diag_len = buf.len();
    std::fs::write(out_dir.join("diagnostics.json"), &out_bytes[..diag_len])
        .expect("write diagnostics");
    std::fs::write(out_dir.join("source-lineage.json"), lineage).expect("write lineage");
    let mut buf = OutBuf::new(&mut out_bytes);
    if factc_kernel::read_artifact_metadata(&ws, &mut buf).is_ok() {
        let n = buf.len();
        std::fs::write(out_dir.join("artifacts.json"), &out_bytes[..n]).expect("write artifacts");
    }
    // every emitted artifact, named by kind (and system index where applicable)
    for i in 0..factc_kernel::artifact_count(&ws) {
        let slot = *ws.artifacts.get(i).unwrap();
        let mut buf = OutBuf::new(&mut out_bytes);
        if factc_kernel::read_artifact(&ws, i, &mut buf).is_err() {
            eprintln!("factc: artifact {} too large for output buffer", i);
            return 3;
        }
        let n = buf.len();
        let ext = match slot.kind {
            factc_foundation::ArtifactKind::CanonicalAscii
            | factc_foundation::ArtifactKind::ObservedAscii => "ascii",
            factc_foundation::ArtifactKind::GeneratedBundle => "bin",
            _ => "json",
        };
        let kind_name = match slot.kind {
            factc_foundation::ArtifactKind::RuntimeEvidence => {
                "activation-receipt-model".to_string()
            }
            k => k.name().to_lowercase().replace('_', "-"),
        };
        let name = match slot.system {
            Some(s) => format!("{}-{}.{}", kind_name, s, ext),
            None => format!("{}.{}", kind_name, ext),
        };
        std::fs::write(out_dir.join(&name), &out_bytes[..n]).expect("write artifact");
    }
    if factc_kernel::bundle_file_count(&ws) > 0 {
        let bdir = out_dir.join("bundle");
        std::fs::create_dir_all(&bdir).expect("bundle dir");
        for i in 0..factc_kernel::bundle_file_count(&ws) {
            let (path, bytes) = factc_kernel::bundle_file(&ws, i).unwrap();
            std::fs::write(bdir.join(std::str::from_utf8(path).unwrap()), bytes)
                .expect("write bundle file");
        }
    }
    println!("factc: status {}", factc_kernel::status_name(status));
    match status {
        factc_kernel::Status::Ok => 0,
        _ => 1,
    }
}
