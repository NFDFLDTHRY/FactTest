use factory::model::{Fixture, StructuralDelta};
use factory::ops;
use std::path::{Path, PathBuf};

fn usage() -> ! {
    eprintln!(
        "usage:\n  factory delta check <delta.json>\n  factory workpiece create <delta.json>\n  factory station open <delta.json> <fixture.json>\n  factory station close <delta.json> <fixture.json>\n  factory verify <delta.json>\n  factory integrate <delta.json>\n  factory reinspect <delta.json>\n  factory depcheck <repo root> <Cargo.toml...>\n  factory nostd-check <crate dir...>\n  factory wasm-inspect <module.wasm> [--out report.json | --allow-wasm32]\n  factory evidence index <dir> <out.json>"
    );
    std::process::exit(2)
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let res = (|| -> Result<ops::Report, String> {
        match args
            .iter()
            .map(|s| s.as_str())
            .collect::<Vec<_>>()
            .as_slice()
        {
            [_, "delta", "check", d] => Ok(ops::delta_check(&StructuralDelta::load(Path::new(d))?)),
            [_, "workpiece", "create", d] => {
                ops::workpiece_create(&StructuralDelta::load(Path::new(d))?)
            }
            [_, "station", "open", d, f] => {
                let delta = StructuralDelta::load(Path::new(d))?;
                let fx = Fixture::load(&delta.workpiece_dir().join(f))?;
                ops::station_open(&delta, &fx)
            }
            [_, "station", "close", d, f] => {
                let delta = StructuralDelta::load(Path::new(d))?;
                let fx = Fixture::load(&delta.workpiece_dir().join(f))?;
                ops::station_close(&delta, &fx)
            }
            [_, "verify", d] => ops::verify(&StructuralDelta::load(Path::new(d))?),
            [_, "integrate", d] => ops::integrate(&StructuralDelta::load(Path::new(d))?),
            [_, "reinspect", d] => ops::reinspect(&StructuralDelta::load(Path::new(d))?),
            [_, "depcheck", root, manifests @ ..] => Ok(factory::checks::depcheck(
                Path::new(root),
                &manifests.iter().map(PathBuf::from).collect::<Vec<_>>(),
            )),
            [_, "nostd-check", dirs @ ..] if !dirs.is_empty() => Ok(factory::checks::nostd_check(
                &dirs.iter().map(PathBuf::from).collect::<Vec<_>>(),
            )),
            [_, "wasm-inspect", module] => {
                Ok(factory::checks::wasm_inspect(Path::new(module), true, None))
            }
            [_, "wasm-inspect", module, "--out", out] => Ok(factory::checks::wasm_inspect(
                Path::new(module),
                true,
                Some(Path::new(out)),
            )),
            [_, "wasm-inspect", module, "--allow-wasm32"] => Ok(factory::checks::wasm_inspect(
                Path::new(module),
                false,
                None,
            )),
            [_, "evidence", "index", dir, out] => Ok(factory::checks::evidence_index(
                Path::new(dir),
                Path::new(out),
            )),
            _ => usage(),
        }
    })();
    match res {
        Ok(r) => {
            r.print(&args[1..].join(" "));
            std::process::exit(if r.pass() { 0 } else { 1 });
        }
        Err(e) => {
            eprintln!("factory error: {}", e);
            std::process::exit(3);
        }
    }
}
