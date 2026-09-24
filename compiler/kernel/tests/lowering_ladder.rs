//! PASS5 lowering witnesses (P5-L01, L02, L03, L04, L06 at the H_G level), P5-S01 target preservation,
//! P6-G03 (CodegenRecipe required), plus CapabilityIR/obligation extraction on the Byte Relay slice.
use factc_foundation::{ArtifactKind, DiagCode};
use factc_implementation::{ContractStatus, EdgeKind};
use factc_kernel::{Mode, Status, Workspace};
use std::path::PathBuf;

fn fixture(rel: &str) -> Vec<u8> {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../fixtures")
        .join(rel);
    std::fs::read(&p).unwrap_or_else(|e| panic!("{}: {}", p.display(), e))
}

struct Run {
    ws: Box<Workspace>,
    status: Status,
}

fn run(
    source: &str,
    contracts: Option<&str>,
    metrics: Option<&str>,
    machine: Option<&str>,
    mode: Mode,
) -> Run {
    let src = fixture(source);
    let c = contracts.map(fixture);
    let mt = metrics.map(fixture);
    let mc = machine.map(fixture);
    std::thread::Builder::new()
        .stack_size(256 * 1024 * 1024)
        .spawn(move || {
            let mut ws = Box::new(Workspace::new());
            factc_kernel::submit_source_bytes(&mut ws, &src).unwrap();
            if let Some(c) = c {
                factc_kernel::submit_contracts(&mut ws, &c).unwrap();
            }
            if let Some(m) = mt {
                factc_kernel::submit_metrics(&mut ws, &m).unwrap();
            }
            if let Some(m) = mc {
                factc_kernel::submit_machine_state(&mut ws, &m).unwrap();
            }
            let status = factc_kernel::check_or_compile(&mut ws, mode);
            Run { ws, status }
        })
        .unwrap()
        .join()
        .unwrap()
}

impl Run {
    fn artifact(&self, kind: ArtifactKind) -> String {
        let idx = self
            .ws
            .artifacts
            .iter()
            .position(|a| a.kind == kind)
            .unwrap_or_else(|| panic!("artifact {:?}", kind));
        String::from_utf8(self.ws.artifact(idx).unwrap().to_vec()).unwrap()
    }
    fn codes(&self) -> Vec<&'static str> {
        self.ws.diagnostics.iter().map(|d| d.code.name()).collect()
    }
    fn backend_names(&self, e: &factc_implementation::Edge) -> Vec<String> {
        e.backends
            .iter()
            .map(|b| String::from_utf8_lossy(self.ws.registry.name(b)).to_string())
            .collect()
    }
}

const SRC: &str = "commissioning/byte-relay.ascii";
const REG: &str = "commissioning/contracts.ascii";

#[test]
fn capability_ir_extracts_transfer_and_obligations_without_choosing_a_backend() {
    let r = run(SRC, None, None, None, Mode::Analyze);
    assert_eq!(r.status, Status::Ok, "{:?}", r.codes());
    let ir = &r.ws.capability_ir;
    assert_eq!(ir.transfers.len(), 1);
    assert_eq!(ir.transfers[0].mode, factc_source::Mode::Copy);
    assert!(
        ir.capabilities.is_empty(),
        "the source names no semantic capability"
    );
    let json = r.artifact(ArtifactKind::CapabilityIr);
    assert!(json.contains("\"relation\":\"relay\",\"type\":\"Bytes\",\"mode\":\"copy\""));
    assert!(
        !json.contains("WEBGPU") && !json.contains("WASM"),
        "lowering inserts no backend"
    );
    // obligations: 4 invariants PASS, transfer OPEN, runtime test OPEN, evidence OPEN
    assert!(
        json.contains("\"kind\":\"SEMANTIC_INVARIANT\",\"subject\":\"i_type\",\"status\":\"PASS\"")
    );
    assert!(json.contains("\"kind\":\"TRANSFER\",\"subject\":\"relay\",\"status\":\"OPEN\""));
    assert!(json.contains("\"kind\":\"TEST\",\"subject\":\"t_roundtrip\",\"status\":\"OPEN\""));
    assert!(json.contains("\"kind\":\"EVIDENCE\",\"subject\":\"e_roundtrip\",\"status\":\"OPEN\""));
    assert!(
        json.contains("\"metric\":\"preference_rank\",\"unit\":\"ordinal\""),
        "objective passes through unchanged"
    );
    assert!(
        r.ws.hypergraph.edges.is_empty(),
        "no registry submitted => no edges assumed"
    );
}

#[test]
fn p5_l01_h_g_contains_explicit_w_and_g_paths() {
    let r = run(SRC, Some(REG), None, None, Mode::Build);
    assert_eq!(r.status, Status::Ok, "{:?}", r.codes());
    assert!(r.ws.registry.ok);
    let hg = &r.ws.hypergraph;
    let edges: Vec<_> = hg.edges_for(EdgeKind::Transfer, 0).collect();
    assert_eq!(edges.len(), 2, "exactly W and G paths: {:?}", edges);
    let mut guards: Vec<Vec<String>> = edges.iter().map(|e| r.backend_names(e)).collect();
    guards.sort();
    assert_eq!(
        guards,
        vec![vec!["CPU_WASM64".to_string()], vec!["WEBGPU".to_string()]]
    );
    for e in &edges {
        assert_eq!(e.nsteps, 2, "boundary -> domain -> boundary");
    }
    let json = r.artifact(ArtifactKind::ImplementationHypergraph);
    assert!(
        json.contains("\"conversion\":\"host_to_wasm\"")
            && json.contains("\"conversion\":\"gpu_to_host\"")
    );
    assert!(json.contains("\"unsatisfied_requirements\":[]"));
}

#[test]
fn p5_l02_implementation_pin_restricts_candidates() {
    let r = run(
        "commissioning/byte-relay-pinned.ascii",
        Some(REG),
        None,
        None,
        Mode::Build,
    );
    assert_eq!(r.status, Status::Ok, "{:?}", r.codes());
    let legal: Vec<Vec<String>> =
        r.ws.hypergraph
            .edges_for(EdgeKind::Transfer, 0)
            .map(|e| r.backend_names(e))
            .collect();
    assert_eq!(legal, vec![vec!["CPU_WASM64".to_string()]]);
    let rejected: Vec<&str> = r.ws.hypergraph.rejected.iter().map(|e| e.reason).collect();
    assert!(
        rejected.contains(&"implementation pin excludes this path"),
        "{:?}",
        rejected
    );
}

#[test]
fn p5_l03_h_a_filters_by_epoch_admission_while_h_g_keeps_the_edge() {
    let r0 = run(
        SRC,
        Some(REG),
        None,
        Some("commissioning/epoch-model-0.ascii"),
        Mode::Build,
    );
    assert_eq!(r0.status, Status::Ok, "{:?}", r0.codes());
    let admitted0: Vec<Vec<String>> = r0
        .ws
        .hypergraph
        .edges
        .iter()
        .filter(|e| factc_implementation::admitted_in(&r0.ws.registry, e))
        .map(|e| r0.backend_names(e))
        .collect();
    assert_eq!(admitted0.len(), 2);
    let r1 = run(
        SRC,
        Some(REG),
        None,
        Some("commissioning/epoch-model-1.ascii"),
        Mode::Build,
    );
    assert_eq!(
        r1.ws.hypergraph.edges.len(),
        2,
        "H_G unchanged by admission"
    );
    let admitted1: Vec<Vec<String>> = r1
        .ws
        .hypergraph
        .edges
        .iter()
        .filter(|e| factc_implementation::admitted_in(&r1.ws.registry, e))
        .map(|e| r1.backend_names(e))
        .collect();
    assert_eq!(admitted1, vec![vec!["CPU_WASM64".to_string()]]);
}

#[test]
fn p5_l04_missing_representation_path_yields_no_candidate() {
    let r = run(
        "commissioning/byte-relay-other-type.ascii",
        Some(REG),
        None,
        None,
        Mode::Build,
    );
    assert!(r.ws.hypergraph.edges.is_empty());
    assert_eq!(r.ws.hypergraph.unsatisfied.len(), 1);
    assert!(
        r.ws.diagnostics.has_code(DiagCode::NoLegalPlan),
        "{:?}",
        r.codes()
    );
    assert_ne!(r.status, Status::Ok);
}

#[test]
fn p5_l06_p6_v03_copy_only_conversions_cannot_serve_move() {
    let r = run(
        "commissioning/byte-relay-move.ascii",
        Some(REG),
        None,
        None,
        Mode::Build,
    );
    assert!(
        r.ws.hypergraph.edges.is_empty(),
        "no conversion supports move; nothing may be substituted"
    );
    assert!(
        r.ws.diagnostics.has_code(DiagCode::NoLegalPlan),
        "{:?}",
        r.codes()
    );
}

#[test]
fn p5_s01_every_capability_family_of_g_is_represented() {
    let r = run(SRC, Some(REG), None, None, Mode::Analyze);
    let reg = &r.ws.registry;
    let families = [
        "CPU_WASM64",
        "WORKER_DEDICATED",
        "WASM_SHARED_THREADS",
        "WEBGPU",
        "WEBNN",
        "WEBCODECS",
        "CAMERA",
        "MICROPHONE",
        "GENERIC_SENSOR",
        "ACCELEROMETER",
        "GYROSCOPE",
        "MAGNETOMETER",
        "ORIENTATION_SENSOR",
        "DEVICE_ORIENTATION_MOTION",
        "PROXIMITY_SENSOR",
        "AMBIENT_LIGHT_SENSOR",
        "GEOLOCATION",
        "WEBXR",
        "FETCH_STREAMS",
        "STORAGE_MANAGER",
        "OPFS",
        "INDEXEDDB",
        "CACHE_STORAGE",
        "SERVICE_WORKER",
        "WEBAPP_MANIFEST",
        "SECURE_CONTEXT",
        "PERMISSIONS",
        "PERMISSIONS_POLICY",
        "WEBHID",
        "WEBUSB",
        "WEB_SERIAL",
        "WEB_BLUETOOTH",
        "FUTURE_EXPLICIT_CAPABILITY",
    ];
    for f in families {
        let b = reg
            .find_backend(f.as_bytes())
            .unwrap_or_else(|| panic!("family {} missing from registry", f));
        let st = reg.backends[b as usize].status;
        if f == "CPU_WASM64" || f == "WEBGPU" {
            assert_eq!(st, ContractStatus::ReadyContract);
        } else {
            assert_ne!(
                st,
                ContractStatus::ReadyContract,
                "{} must stay GAP/ERR/UNK until materialized",
                f
            );
        }
        assert!(
            reg.authorities
                .iter()
                .any(|a| reg.name(a.subject) == f.as_bytes())
                || f == "FUTURE_EXPLICIT_CAPABILITY",
            "{} needs an authority link",
            f
        );
    }
    // P5-S03: GAP backends cannot enter H_G
    assert!(r
        .ws
        .hypergraph
        .rejected
        .iter()
        .all(|e| e.reason != "statically legal"));
}

#[test]
fn p6_g03_ready_contract_requires_a_codegen_recipe() {
    let mut reg = fixture(REG);
    let s = String::from_utf8(reg.clone())
        .unwrap()
        .replace("recipe=R_WEBGPU_RELAY", "recipe=none");
    reg = s.into_bytes();
    let r = std::thread::Builder::new()
        .stack_size(256 * 1024 * 1024)
        .spawn(move || {
            let mut ws = Box::new(Workspace::new());
            factc_kernel::submit_source_bytes(&mut ws, &fixture(SRC)).unwrap();
            factc_kernel::submit_contracts(&mut ws, &reg).unwrap();
            let status = factc_kernel::check_or_compile(&mut ws, Mode::Build);
            Run { ws, status }
        })
        .unwrap()
        .join()
        .unwrap();
    assert!(
        r.ws.diagnostics.has_code(DiagCode::ContractUnresolved),
        "{:?}",
        r.codes()
    );
    assert!(!r.ws.registry.ok);
    assert_ne!(r.status, Status::Ok);
}

#[test]
fn registry_rejects_unknown_keywords_and_duplicates() {
    let bad = b"@{backend X status=GAP capabilities=none accepts=none produces=none modes=none effects=none probes=none recipe=none lifecycle=none failures=none}\n@{backend X status=GAP capabilities=none accepts=none produces=none modes=none effects=none probes=none recipe=none lifecycle=none failures=none}\n@{teleport Y}\n".to_vec();
    let r = std::thread::Builder::new()
        .stack_size(256 * 1024 * 1024)
        .spawn(move || {
            let mut ws = Box::new(Workspace::new());
            factc_kernel::submit_source_bytes(&mut ws, &fixture(SRC)).unwrap();
            factc_kernel::submit_contracts(&mut ws, &bad).unwrap();
            let status = factc_kernel::check_or_compile(&mut ws, Mode::Analyze);
            Run { ws, status }
        })
        .unwrap()
        .join()
        .unwrap();
    assert!(r.ws.diagnostics.has_code(DiagCode::ContractDuplicate));
    assert!(r.ws.diagnostics.has_code(DiagCode::ParseUnknownKeyword));
}

#[test]
fn metric_evidence_and_epochs_parse_into_the_registry() {
    let r = run(
        SRC,
        Some(REG),
        Some("commissioning/metrics.ascii"),
        Some("commissioning/epoch-model-1.ascii"),
        Mode::Analyze,
    );
    let reg = &r.ws.registry;
    let gpu = reg.find_backend(b"WEBGPU").unwrap();
    assert_eq!(
        reg.metric_value(b"preference_rank", reg.backends[gpu as usize].name),
        Some(0)
    );
    let wasm = reg.find_backend(b"CPU_WASM64").unwrap();
    assert_eq!(
        reg.metric_value(b"preference_rank", reg.backends[wasm as usize].name),
        Some(1)
    );
    assert_eq!(
        reg.metric_value(b"execution_time_ns", reg.backends[wasm as usize].name),
        None,
        "unknown stays unknown, never zero"
    );
    assert_eq!(reg.name(reg.epoch.unwrap()), b"E_model_1");
    let a = reg.admission_of(reg.backends[gpu as usize].name).unwrap();
    assert_eq!(a.decision, factc_implementation::Decision::Rejected);
    assert_eq!(reg.name(a.reason.unwrap()), b"device_lost");
}
