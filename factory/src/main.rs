use factory::model::{Fixture, StructuralDelta};
use factory::ops;
use std::path::Path;

fn usage() -> ! {
    eprintln!(
        "usage:\n  factory delta check <delta.json>\n  factory workpiece create <delta.json>\n  factory station open <delta.json> <fixture.json>\n  factory station close <delta.json> <fixture.json>\n  factory verify <delta.json>\n  factory integrate <delta.json>\n  factory reinspect <delta.json>"
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
