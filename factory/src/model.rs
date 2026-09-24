//! Factory records (FACTORY-CONTRACTS.md sections 1-5) loaded from JSON files.

use crate::json::Value;
use std::path::{Path, PathBuf};

#[derive(Clone, Debug)]
pub struct Command {
    pub cwd: String,
    pub program: String,
    pub args: Vec<String>,
    pub env: Vec<(String, String)>,
    pub expect_exit: i64,
    pub log: String,
}

impl Command {
    pub fn from_value(v: &Value) -> Result<Command, String> {
        let env = v
            .get("env")
            .and_then(|e| match e {
                Value::Obj(o) => Some(
                    o.iter()
                        .filter_map(|(k, x)| x.as_str().map(|s| (k.clone(), s.to_string())))
                        .collect(),
                ),
                _ => None,
            })
            .unwrap_or_default();
        Ok(Command {
            cwd: v
                .get("cwd")
                .and_then(|x| x.as_str())
                .unwrap_or(".")
                .to_string(),
            program: v.str_field("program")?,
            args: v.str_list("args"),
            env,
            expect_exit: v.get("expect_exit").and_then(|x| x.as_int()).unwrap_or(0),
            log: v.str_field("log")?,
        })
    }
}

/// An identity probe declared by a fixture (`job_parameters.identity_probes`): a command whose output identifies part
/// of the execution environment (toolchain, runtime, browser).  Its output is recorded in the receipt; it is never a
/// verification verdict.
#[derive(Clone, Debug)]
pub struct IdentityProbe {
    pub name: String,
    pub program: String,
    pub args: Vec<String>,
}

impl IdentityProbe {
    pub fn from_value(v: &Value) -> Result<IdentityProbe, String> {
        Ok(IdentityProbe {
            name: v.str_field("name")?,
            program: v.str_field("program")?,
            args: v.str_list("args"),
        })
    }
}

#[derive(Clone, Debug)]
pub struct StationSpec {
    pub station_id: String,
    pub version: String,
    pub capability_tags: Vec<String>,
    pub may_read: Vec<String>,
    pub may_change: Vec<String>,
    pub must_not_change: Vec<String>,
    pub source_nonmutating: bool,
    pub receipt_schema_version: String,
}

impl StationSpec {
    pub fn load(path: &Path) -> Result<StationSpec, String> {
        let v = crate::json::read_file(path)?;
        StationSpec::from_value(&v)
    }
    pub fn from_text(text: &str) -> Result<StationSpec, String> {
        StationSpec::from_value(&crate::json::parse(text)?)
    }
    pub fn from_value(v: &Value) -> Result<StationSpec, String> {
        Ok(StationSpec {
            station_id: v.str_field("station_id")?,
            version: v.str_field("version")?,
            capability_tags: v.str_list("capability_tags"),
            may_read: v.str_list("may_read"),
            may_change: v.str_list("may_change"),
            must_not_change: v.str_list("must_not_change"),
            source_nonmutating: v
                .get("source_nonmutating")
                .and_then(|x| x.as_bool())
                .unwrap_or(false),
            receipt_schema_version: v.str_field("receipt_schema_version")?,
        })
    }
}

#[derive(Clone, Debug)]
pub struct StructuralDelta {
    pub path: PathBuf,
    pub delta_id: String,
    pub canonical_repo: String,
    pub canonical_branch: String,
    pub canonical_base: String,
    pub workpiece_root: String,
    pub workpiece_id: String,
    pub approved_ascii_refs: Vec<String>,
    pub intent: String,
    pub may_read: Vec<String>,
    pub may_change: Vec<String>,
    pub must_not_change: Vec<String>,
    pub required_station_capabilities: Vec<String>,
    pub invariants: Vec<String>,
    pub tests: Vec<String>,
    pub evidence_requirements: Vec<String>,
    pub required_paths: Vec<String>,
    pub forbidden_paths: Vec<String>,
    pub fixtures: Vec<String>,
    pub reinspect_commands: Vec<Command>,
    pub commit_trailers: Vec<String>,
    pub raw: Value,
}

impl StructuralDelta {
    pub fn load(path: &Path) -> Result<StructuralDelta, String> {
        let v = crate::json::read_file(path)?;
        let contract = v
            .get("expected_output_contract")
            .cloned()
            .unwrap_or(Value::obj());
        let reinspect = v
            .get("reinspect_commands")
            .and_then(|x| x.as_arr())
            .map(|a| {
                a.iter()
                    .map(Command::from_value)
                    .collect::<Result<Vec<_>, _>>()
            })
            .unwrap_or(Ok(Vec::new()))?;
        Ok(StructuralDelta {
            path: path.to_path_buf(),
            delta_id: v.str_field("delta_id")?,
            canonical_repo: v.str_field("canonical_repo")?,
            canonical_branch: v.str_field("canonical_branch")?,
            canonical_base: v.str_field("canonical_base")?,
            workpiece_root: v.str_field("workpiece_root")?,
            workpiece_id: v.str_field("workpiece_id")?,
            approved_ascii_refs: v.str_list("approved_ascii_refs"),
            intent: v.str_field("intent")?,
            may_read: v.str_list("may_read"),
            may_change: v.str_list("may_change"),
            must_not_change: v.str_list("must_not_change"),
            required_station_capabilities: v.str_list("required_station_capabilities"),
            invariants: v.str_list("invariants"),
            tests: v.str_list("tests"),
            evidence_requirements: v.str_list("evidence_requirements"),
            required_paths: contract.str_list("required_paths"),
            forbidden_paths: contract.str_list("forbidden_paths"),
            fixtures: v.str_list("fixtures"),
            reinspect_commands: reinspect,
            commit_trailers: v.str_list("commit_trailers"),
            raw: v,
        })
    }
    pub fn workpiece_dir(&self) -> PathBuf {
        Path::new(&self.workpiece_root).join(&self.workpiece_id)
    }
    pub fn state_path(&self) -> PathBuf {
        Path::new(&self.workpiece_root).join(format!("{}.state.json", self.workpiece_id))
    }
    pub fn receipts_dir(&self) -> String {
        format!("factory/receipts/{}/", self.delta_id)
    }
}

#[derive(Clone, Debug)]
pub struct Fixture {
    pub path: PathBuf,
    pub fixture_id: String,
    pub station_id: String,
    pub delta_id: String,
    pub selected_inputs: Vec<String>,
    pub narrowed_may_read: Vec<String>,
    pub narrowed_may_change: Vec<String>,
    pub commands: Vec<Command>,
    pub identity_probes: Vec<IdentityProbe>,
    pub expected_outputs: Vec<String>,
    pub tests: Vec<String>,
    pub evidence_requirements: Vec<String>,
}

impl Fixture {
    pub fn load(path: &Path) -> Result<Fixture, String> {
        let v = crate::json::read_file(path)?;
        let commands = v
            .get("job_parameters")
            .and_then(|j| j.get("commands"))
            .and_then(|x| x.as_arr())
            .map(|a| {
                a.iter()
                    .map(Command::from_value)
                    .collect::<Result<Vec<_>, _>>()
            })
            .unwrap_or(Ok(Vec::new()))?;
        let identity_probes = v
            .get("job_parameters")
            .and_then(|j| j.get("identity_probes"))
            .and_then(|x| x.as_arr())
            .map(|a| {
                a.iter()
                    .map(IdentityProbe::from_value)
                    .collect::<Result<Vec<_>, _>>()
            })
            .unwrap_or(Ok(Vec::new()))?;
        Ok(Fixture {
            path: path.to_path_buf(),
            fixture_id: v.str_field("fixture_id")?,
            station_id: v.str_field("station_id")?,
            delta_id: v.str_field("delta_id")?,
            selected_inputs: v.str_list("selected_inputs"),
            narrowed_may_read: v.str_list("narrowed_may_read"),
            narrowed_may_change: v.str_list("narrowed_may_change"),
            commands,
            identity_probes,
            expected_outputs: v.str_list("expected_outputs"),
            tests: v.str_list("tests"),
            evidence_requirements: v.str_list("evidence_requirements"),
        })
    }
}

/// Workpiece state lives OUTSIDE the workpiece tree (FACTORY-CONTRACTS.md section 2).
#[derive(Clone, Debug)]
pub struct WorkpieceState {
    pub v: Value,
}

impl WorkpieceState {
    pub fn load(path: &Path) -> Result<WorkpieceState, String> {
        Ok(WorkpieceState {
            v: crate::json::read_file(path)?,
        })
    }
    pub fn save(&self, path: &Path) -> Result<(), String> {
        crate::json::write_file(path, &self.v)
    }
    pub fn base_tree(&self) -> Result<String, String> {
        self.v.str_field("base_tree")
    }
    pub fn runs_mut(&mut self) -> &mut Vec<Value> {
        if self.v.get("station_runs").is_none() {
            self.v.set("station_runs", Value::Arr(Vec::new()));
        }
        match self.v.get_mut_runs() {
            Some(a) => a,
            None => unreachable!(),
        }
    }
    pub fn runs(&self) -> Vec<Value> {
        self.v
            .get("station_runs")
            .and_then(|a| a.as_arr())
            .cloned()
            .unwrap_or_default()
    }
}

impl Value {
    fn get_mut_runs(&mut self) -> Option<&mut Vec<Value>> {
        if let Value::Obj(o) = self {
            for (k, v) in o.iter_mut() {
                if k == "station_runs" {
                    if let Value::Arr(a) = v {
                        return Some(a);
                    }
                }
            }
        }
        None
    }
}

pub fn now_iso() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    // civil-from-days (Howard Hinnant), UTC
    let days = (secs / 86400) as i64;
    let rem = secs % 86400;
    let z = days + 719468;
    let era = if z >= 0 { z } else { z - 146096 } / 146097;
    let doe = z - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        y,
        m,
        d,
        rem / 3600,
        (rem % 3600) / 60,
        rem % 60
    )
}
