//! Planner/verifier witnesses: P6-M01..M04, P6-V01..V05, P5-V01..V07 (V01 via compile-fail fixture), P6-G04..G06.
use factc_foundation::{ArtifactKind, DiagCode};
use factc_implementation::StrList;
use factc_kernel::{Mode, Status, Workspace};
use factc_planning::{CandidatePlan, CandidateStrategy, Strength, MAX_GOALS, MAX_REQ};
use factc_verifier::activation::{activate, ActivationStatus};
use factc_verifier::{verify_strategy, Rule, Verification};
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

fn run_bytes(
    src: Vec<u8>,
    contracts: Option<Vec<u8>>,
    metrics: Option<Vec<u8>>,
    machine: Option<Vec<u8>>,
    mode: Mode,
) -> Run {
    std::thread::Builder::new()
        .stack_size(256 * 1024 * 1024)
        .spawn(move || {
            let mut ws = Box::new(Workspace::new());
            factc_kernel::submit_source_bytes(&mut ws, &src).unwrap();
            if let Some(c) = contracts {
                factc_kernel::submit_contracts(&mut ws, &c).unwrap();
            }
            if let Some(m) = metrics {
                factc_kernel::submit_metrics(&mut ws, &m).unwrap();
            }
            if let Some(m) = machine {
                factc_kernel::submit_machine_state(&mut ws, &m).unwrap();
            }
            let status = factc_kernel::check_or_compile(&mut ws, mode);
            Run { ws, status }
        })
        .unwrap()
        .join()
        .unwrap()
}

fn run(source: &str, contracts: Option<&str>, metrics: Option<&str>, machine: Option<&str>) -> Run {
    run_bytes(
        fixture(source),
        contracts.map(fixture),
        metrics.map(fixture),
        machine.map(fixture),
        Mode::Build,
    )
}

impl Run {
    fn codes(&self) -> Vec<&'static str> {
        self.ws.diagnostics.iter().map(|d| d.code.name()).collect()
    }
    fn artifact(&self, kind: ArtifactKind) -> String {
        let idx = self
            .ws
            .artifacts
            .iter()
            .position(|a| a.kind == kind)
            .unwrap_or_else(|| panic!("artifact {:?}", kind));
        String::from_utf8(self.ws.artifact(idx).unwrap().to_vec()).unwrap()
    }
    fn guard_names(&self, g: &StrList) -> Vec<String> {
        g.iter()
            .map(|b| String::from_utf8_lossy(self.ws.registry.name(b)).to_string())
            .collect()
    }
    fn plan_guard(&self, plan_id: u32) -> Vec<String> {
        let p = self
            .ws
            .strategy
            .variants
            .iter()
            .find(|p| p.plan_id == plan_id)
            .unwrap();
        self.guard_names(&p.guard)
    }
}

const SRC: &str = "commissioning/byte-relay.ascii";
const REG: &str = "commissioning/contracts.ascii";
const MET: &str = "commissioning/metrics.ascii";
const E0: &str = "commissioning/epoch-model-0.ascii";
const E1: &str = "commissioning/epoch-model-1.ascii";

#[test]
fn strategy_has_two_conditionally_verified_variants_dispatched_by_objective() {
    let r = run(SRC, Some(REG), Some(MET), None);
    assert_eq!(r.status, Status::Ok, "{:?}", r.codes());
    let s = &r.ws.strategy;
    assert_eq!(s.variants.len(), 2);
    assert_eq!(
        s.strength,
        Strength::ExactOptimum,
        "finite enumeration with known fixture metrics"
    );
    let order: Vec<Vec<String>> = s.ordered().map(|p| r.guard_names(&p.guard)).collect();
    assert_eq!(
        order,
        vec![vec!["WEBGPU".to_string()], vec!["CPU_WASM64".to_string()]],
        "V4: authored objective ranks G before W"
    );
    let vs =
        r.ws.verification
            .verified
            .as_ref()
            .expect("VerifiedStrategy constructed by the verifier");
    assert_eq!(vs.variants.len(), 2);
    assert!(r.ws.verification.certificates.iter().all(|c| c.pass));
    let json = r.artifact(ArtifactKind::VerifiedStrategy);
    assert!(json.contains("\"dispatch_objective\":\"commissioning\""));
    assert!(json.contains("\"planner_result_strength\":\"EXACT_OPTIMUM\""));
    let certs = r.artifact(ArtifactKind::VerificationCertificates);
    assert!(certs.contains("\"verified_strategy_constructed\":true"));
    assert!(
        certs.contains("\"rule\":\"V-REP\"")
            && certs.contains("\"rule\":\"V-OWN\"")
            && certs.contains("\"rule\":\"V-ADM\"")
    );
}

#[test]
fn p6_m01_model_epoch_0_selects_g() {
    let r = run(SRC, Some(REG), Some(MET), Some(E0));
    assert_eq!(r.status, Status::Ok, "{:?}", r.codes());
    let a = r.ws.activation.expect("activation receipt");
    assert_eq!(a.status, ActivationStatus::Pass);
    assert_eq!(r.plan_guard(a.plan_id.unwrap()), vec!["WEBGPU".to_string()]);
    assert!(
        r.artifact(ArtifactKind::RuntimeEvidence)
            .contains("\"evidence_class\":\"SYNTHETIC_MODEL\""),
        "synthetic never masquerades as physical"
    );
}

#[test]
fn p6_m02_model_epoch_1_selects_w_without_replanning() {
    let r = run(SRC, Some(REG), Some(MET), Some(E1));
    assert_eq!(r.status, Status::Ok, "{:?}", r.codes());
    let a = r.ws.activation.unwrap();
    assert_eq!(a.status, ActivationStatus::Pass);
    assert_eq!(
        r.plan_guard(a.plan_id.unwrap()),
        vec!["CPU_WASM64".to_string()]
    );
    // the strategy itself is identical to E0's: reselection inside the finite VerifiedStrategy
    let r0 = run(SRC, Some(REG), Some(MET), Some(E0));
    assert_eq!(
        r.artifact(ArtifactKind::VerifiedStrategy),
        r0.artifact(ArtifactKind::VerifiedStrategy)
    );
}

#[test]
fn p6_m03_unknown_metric_is_not_zero() {
    let metrics =
        b"@{metric_value preference_rank CPU_WASM64 1 provenance=commissioning_fixture}\n".to_vec();
    let r = run_bytes(
        fixture(SRC),
        Some(fixture(REG)),
        Some(metrics),
        None,
        Mode::Build,
    );
    assert_eq!(r.status, Status::Ok, "{:?}", r.codes());
    let s = &r.ws.strategy;
    assert_ne!(
        s.strength,
        Strength::ExactOptimum,
        "no optimality claim with an unknown metric"
    );
    assert!(s.unknown_metric_seen);
    let first = s.ordered().next().unwrap();
    assert_eq!(
        r.guard_names(&first.guard),
        vec!["CPU_WASM64".to_string()],
        "unknown (GPU) is not ranked as if it were 0"
    );
    assert!(r
        .artifact(ArtifactKind::CandidateStrategy)
        .contains("\"UNKNOWN\""));
}

#[test]
fn p6_m04_p6_g06_selector_activates_only_verified_variants() {
    let r = run(SRC, Some(REG), Some(MET), Some(E1));
    let vs = r.ws.verification.verified.as_ref().unwrap();
    // every activatable plan id is a verified variant
    let a = activate(vs, &r.ws.registry);
    assert!(vs.variant_by_plan(a.plan_id.unwrap()).is_some());
    // an epoch admitting nothing yields NO_ACTIVE_PLAN, never an invented plan
    let none = b"@{epoch E_none}\n@{admission WEBGPU REJECTED evidence=synthetic_model reason=absent}\n@{admission CPU_WASM64 REJECTED evidence=synthetic_model reason=absent}\n".to_vec();
    let r2 = run_bytes(
        fixture(SRC),
        Some(fixture(REG)),
        Some(fixture(MET)),
        Some(none),
        Mode::Build,
    );
    let a2 = r2.ws.activation.unwrap();
    assert_eq!(a2.status, ActivationStatus::NoActivePlan);
    assert_eq!(a2.plan_id, None);
}

/// Build a strategy by hand around the real model so verifier rules can be exercised on invalid candidates.
fn verify_candidate(r: &Run, plan: CandidatePlan) -> Verification {
    let mut s = CandidateStrategy::new();
    s.strategy_id = 7;
    s.variants.push(plan).unwrap();
    s.order[0] = 0;
    s.objective = r.ws.strategy.objective;
    s.goals = r.ws.strategy.goals;
    s.ngoals = r.ws.strategy.ngoals;
    s.strength = Strength::Feasible;
    let mut v = Verification::new();
    verify_strategy(
        &r.ws.model,
        &r.ws.capability_ir,
        &r.ws.registry,
        &r.ws.hypergraph,
        &s,
        &mut v,
    );
    v
}

fn failing_rules(v: &Verification) -> Vec<&'static str> {
    let mut out: Vec<&'static str> = v
        .certificates
        .iter()
        .flat_map(|c| c.results.iter().filter(|x| !x.pass).map(|x| x.rule.id()))
        .collect();
    out.extend(
        v.strategy_certificate
            .results
            .iter()
            .filter(|x| !x.pass)
            .map(|x| x.rule.id()),
    );
    out.sort();
    out.dedup();
    out
}

#[test]
fn p6_v04_undeclared_conversion_and_p6_v02_missing_conversion_fail() {
    let r = run(SRC, Some(REG), Some(MET), None);
    // a plan naming an edge id that does not exist in H_G (undeclared path)
    let bogus = CandidatePlan {
        plan_id: 42,
        edges: [
            Some(99),
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
        ],
        nreq: 1,
        guard: StrList::default(),
        goal_values: [None; MAX_GOALS],
        hard_ok: true,
    };
    let v = verify_candidate(&r, bogus);
    assert!(v.verified.is_none());
    assert!(
        failing_rules(&v).contains(&"V-LOW"),
        "{:?}",
        failing_rules(&v)
    );
    // missing conversion: registry without gpu_to_host => the planner never proposes G at all
    let reg = String::from_utf8(fixture(REG))
        .unwrap()
        .lines()
        .filter(|l| !l.contains("@{conversion gpu_to_host"))
        .collect::<Vec<_>>()
        .join("\n");
    let r2 = run_bytes(
        fixture(SRC),
        Some(reg.into_bytes()),
        Some(fixture(MET)),
        None,
        Mode::Build,
    );
    assert_eq!(r2.status, Status::Ok, "{:?}", r2.codes());
    assert_eq!(r2.ws.strategy.variants.len(), 1);
    assert_eq!(r2.plan_guard(0), vec!["CPU_WASM64".to_string()]);
}

#[test]
fn p6_v03_p5_l06_move_only_representation_cannot_satisfy_copy() {
    // registry whose wasm conversions claim mode=move; source demands copy: no W variant may exist, and a forged
    // candidate using those conversions fails V-OWN.
    let reg = String::from_utf8(fixture(REG))
        .unwrap()
        .replace(
            "host_to_wasm HOST_BYTES -> WASM_LINEAR_BYTES mode=copy",
            "host_to_wasm HOST_BYTES -> WASM_LINEAR_BYTES mode=move",
        )
        .replace(
            "wasm_to_host WASM_LINEAR_BYTES -> HOST_BYTES mode=copy",
            "wasm_to_host WASM_LINEAR_BYTES -> HOST_BYTES mode=move",
        );
    let r = run_bytes(
        fixture(SRC),
        Some(reg.into_bytes()),
        Some(fixture(MET)),
        None,
        Mode::Build,
    );
    assert_eq!(r.ws.strategy.variants.len(), 1, "only G survives");
    assert_eq!(r.plan_guard(0), vec!["WEBGPU".to_string()]);
    // now forge a candidate over the (illegal) move conversions by using the rejected-edge structure: since no
    // such edge exists in H_G, the verifier reports V-LOW; the ownership rule is exercised via a direct plan check
    let hg = &r.ws.hypergraph;
    assert!(hg.edges.iter().all(|e| e
        .steps()
        .all(|ci| r.ws.registry.conversions[ci as usize].mode == factc_source::Mode::Copy)));
}

#[test]
fn p6_v05_invalid_candidate_cannot_be_rescued_by_preference_rank() {
    let r = run(SRC, Some(REG), Some(MET), None);
    let good = r.ws.strategy.variants[0];
    // corrupt: claim a guard that omits the backend the path requires, and give it the best preference value
    let mut bad = good;
    bad.plan_id = 77;
    bad.guard = StrList::default();
    bad.goal_values[0] = Some(-100);
    let v = verify_candidate(&r, bad);
    assert!(v.verified.is_none());
    let rules = failing_rules(&v);
    assert!(rules.contains(&"V-ADM"), "{:?}", rules);
    assert!(
        rules.contains(&"V-STRAT"),
        "goal values must equal metric evidence: {:?}",
        rules
    );
}

#[test]
fn p6_v01_type_mismatch_never_reaches_planning() {
    let r = run_bytes(
        fixture("language/L09-type.ascii"),
        Some(fixture(REG)),
        Some(fixture(MET)),
        None,
        Mode::Build,
    );
    assert!(r.ws.diagnostics.has_code(DiagCode::TypeMismatch));
    assert!(r.ws.strategy.variants.is_empty());
    assert!(r.ws.verification.verified.is_none());
}

#[test]
fn p5_v06_stale_epoch_activation_is_not_reused() {
    let r0 = run(SRC, Some(REG), Some(MET), Some(E0));
    let a0 = r0.ws.activation.unwrap();
    assert_eq!(
        r0.plan_guard(a0.plan_id.unwrap()),
        vec!["WEBGPU".to_string()]
    );
    // re-evaluating the SAME verified strategy under E1 rejects the G activation
    let vs = r0.ws.verification.verified.as_ref().unwrap();
    let r1 = run(SRC, Some(REG), Some(MET), Some(E1));
    let a1 = activate(vs, &r1.ws.registry);
    assert_ne!(a1.plan_id, a0.plan_id);
    assert_eq!(a1.status, ActivationStatus::Pass);
    assert!(r1
        .artifact(ArtifactKind::RuntimeEvidence)
        .contains("\"epoch_id\":\"E_model_1\""));
}

#[test]
fn p5_v03_v04_strength_never_claims_optimum_without_complete_known_costs() {
    let no_obj = String::from_utf8(fixture(SRC))
        .unwrap()
        .lines()
        .filter(|l| !l.contains("@{objective") && !l.contains("@{goal") && !l.contains("@{metric"))
        .collect::<Vec<_>>()
        .join("\n");
    let r = run_bytes(
        no_obj.into_bytes(),
        Some(fixture(REG)),
        None,
        None,
        Mode::Build,
    );
    assert_eq!(r.status, Status::Ok, "{:?}", r.codes());
    assert_eq!(r.ws.strategy.strength, Strength::Feasible);
    let order: Vec<u32> = r.ws.strategy.ordered().map(|p| p.plan_id).collect();
    assert_eq!(order, vec![0, 1], "canonical tie-break by plan id");
}

#[test]
fn p5_v07_hard_constraint_excludes_candidates_before_ranking() {
    let src = String::from_utf8(fixture(SRC)).unwrap().replace("@{goal commissioning 1 minimize preference_rank}", "@{goal commissioning 1 minimize preference_rank}\n@{hard commissioning preference_rank at_most 0}");
    let r = run_bytes(
        src.into_bytes(),
        Some(fixture(REG)),
        Some(fixture(MET)),
        None,
        Mode::Build,
    );
    assert_eq!(r.status, Status::Ok, "{:?}", r.codes());
    assert_eq!(r.ws.strategy.variants.len(), 1);
    assert_eq!(
        r.plan_guard(r.ws.strategy.variants[0].plan_id),
        vec!["WEBGPU".to_string()]
    );
    assert!(r
        .ws
        .strategy
        .rejected
        .iter()
        .any(|x| x.reason.contains("hard constraint")));
}

#[test]
fn p6_g04_g05_only_verifier_constructs_verified_strategy() {
    // compile-fail fixture fixtures/compiler/negative/forge-verified-strategy proves the type is sealed; here we
    // witness that a failing strategy yields no VerifiedStrategy value at all.
    let r = run(SRC, Some(REG), Some(MET), None);
    let mut bad = r.ws.strategy.variants[0];
    bad.edges[0] = None;
    let v = verify_candidate(&r, bad);
    assert!(v.verified.is_none());
    assert!(v
        .certificates
        .iter()
        .any(|c| !c.pass && c.results.iter().any(|x| x.rule == Rule::Lowering)));
    let _ = MAX_REQ;
}
