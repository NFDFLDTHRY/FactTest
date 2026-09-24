//! Independent verifier (VERIFICATION-CERTIFICATES.md; BOOTSTRAP-CONTRACTS C9; PASS5 sections 16-17).
//!
//! The verifier decides legality of a CandidateStrategy by re-deriving every fact from the typed model, the
//! obligation set and the contract registry.  It never consults planner ranking or heuristics.  Only this crate
//! can construct `VerifiedStrategy`: its constructor is private and the type has a private field.
#![no_std]
#![forbid(unsafe_code)]
#![allow(clippy::needless_range_loop)] // bounded stack arrays walked by position

pub mod activation;

use factc_capability::{CapabilityIr, ObligationKind, ObligationStatus};
use factc_foundation::json::JsonW;
use factc_foundation::limits::MAX_VARIANTS;
use factc_foundation::{BVec, OutBuf, OutputTooSmall};
use factc_implementation::{ContractStatus, EdgeKind, Hypergraph, Registry, StrList};
use factc_planning::{CandidatePlan, CandidateStrategy, Strength, MAX_GOALS, MAX_REQ};
use factc_semantic::{Model, Obj};
use factc_source::{Cmp, GoalDir};

/// Rule classes (VERIFICATION-CERTIFICATES.md section 2).  Generic rule identities; no fixture names.
#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum Rule {
    Semantic,
    Refinement,
    Lowering,
    Representation,
    Ownership,
    Capability,
    Admission,
    Plan,
    Effect,
    Strategy,
}

impl Rule {
    pub const fn id(self) -> &'static str {
        match self {
            Rule::Semantic => "V-SEM",
            Rule::Refinement => "V-REF",
            Rule::Lowering => "V-LOW",
            Rule::Representation => "V-REP",
            Rule::Ownership => "V-OWN",
            Rule::Capability => "V-CAP",
            Rule::Admission => "V-ADM",
            Rule::Plan => "V-PLAN",
            Rule::Effect => "V-EFF",
            Rule::Strategy => "V-STRAT",
        }
    }
}

#[derive(Copy, Clone, Debug)]
pub struct ObligationResult {
    pub rule: Rule,
    pub pass: bool,
    pub detail: &'static str,
    /// subject index (obligation id, slot or variant) for diagnostics
    pub subject: u32,
}

#[derive(Copy, Clone, Debug)]
pub struct ProofCertificate {
    pub certificate_id: u32,
    pub plan_id: u32,
    pub results: BVec<ObligationResult, 128>,
    pub pass: bool,
}

impl ProofCertificate {
    fn new(certificate_id: u32, plan_id: u32) -> Self {
        ProofCertificate {
            certificate_id,
            plan_id,
            results: BVec::new(),
            pass: true,
        }
    }
    fn check(&mut self, rule: Rule, pass: bool, detail: &'static str, subject: u32) {
        if !pass {
            self.pass = false;
        }
        let _ = self.results.push(ObligationResult {
            rule,
            pass,
            detail,
            subject,
        });
    }
}

/// A verified plan variant: the plan data plus its conditional proof (guard => obligations preserved).
#[derive(Copy, Clone, Debug)]
pub struct VerifiedPlanVariant {
    pub plan: CandidatePlan,
    pub certificate_id: u32,
}

/// Only the verifier can construct this (private field `_sealed`).  Codegen accepts nothing else.
#[derive(Clone, Debug)]
pub struct VerifiedStrategy {
    pub strategy_id: u32,
    pub variants: BVec<VerifiedPlanVariant, MAX_VARIANTS>,
    /// dispatch order (indices into variants), best first, recomputed by the verifier
    pub order: [u32; MAX_VARIANTS],
    pub goals: [Option<(GoalDir, u32)>; MAX_GOALS],
    pub ngoals: u8,
    pub objective: Option<u32>,
    pub strategy_certificate_id: u32,
    pub planner_strength: Strength,
    _sealed: Sealed,
}

#[derive(Clone, Copy, Debug)]
struct Sealed;

impl VerifiedStrategy {
    pub fn ordered(&self) -> impl Iterator<Item = &VerifiedPlanVariant> + '_ {
        self.order[..self.variants.len()]
            .iter()
            .map(move |i| &self.variants[*i as usize])
    }
    pub fn variant_by_plan(&self, plan_id: u32) -> Option<&VerifiedPlanVariant> {
        self.variants.iter().find(|v| v.plan.plan_id == plan_id)
    }
}

#[derive(Copy, Clone, Debug)]
pub struct StrategyCertificate {
    pub certificate_id: u32,
    pub results: BVec<ObligationResult, 64>,
    pub pass: bool,
}

#[derive(Clone, Debug)]
pub struct Verification {
    pub certificates: BVec<ProofCertificate, MAX_VARIANTS>,
    pub strategy_certificate: StrategyCertificate,
    pub verified: Option<VerifiedStrategy>,
}

impl Default for Verification {
    fn default() -> Self {
        Self::new()
    }
}

impl Verification {
    pub const fn new() -> Self {
        Verification {
            certificates: BVec::new(),
            strategy_certificate: StrategyCertificate {
                certificate_id: 0,
                results: BVec::new(),
                pass: false,
            },
            verified: None,
        }
    }
    pub fn clear(&mut self) {
        *self = Verification::new();
    }
}

fn guard_recomputed(reg: &Registry, hg: &Hypergraph, plan: &CandidatePlan) -> Option<StrList> {
    let mut g = StrList::default();
    for e in plan.edges.iter().take(plan.nreq as usize) {
        let eid = (*e)?;
        let edge = hg.edges.iter().find(|x| x.id == eid)?;
        for ci in edge.steps() {
            if let Some(r) = reg.conversions.get(ci as usize).and_then(|c| c.requires) {
                if !g.iter().any(|x| reg.text.eq(x, r)) {
                    g.push(r);
                }
            }
        }
        if edge.kind == EdgeKind::Capability {
            for b in edge.backends.iter() {
                if !g.iter().any(|x| reg.text.eq(x, b)) {
                    g.push(b);
                }
            }
        }
    }
    Some(g)
}

/// Verify one CandidatePlan against the model, obligations and registry.
pub fn verify_plan(
    m: &Model,
    ir: &CapabilityIr,
    reg: &Registry,
    hg: &Hypergraph,
    plan: &CandidatePlan,
    certificate_id: u32,
) -> ProofCertificate {
    let mut c = ProofCertificate::new(certificate_id, plan.plan_id);
    // SEMANTIC: every invariant obligation PASS in the resolved graph
    for o in ir
        .obligations
        .iter()
        .filter(|o| o.kind == ObligationKind::Invariant)
    {
        c.check(
            Rule::Semantic,
            o.status == ObligationStatus::Pass,
            "source invariant holds",
            o.id,
        );
    }
    // REFINEMENT
    for o in ir
        .obligations
        .iter()
        .filter(|o| o.kind == ObligationKind::Refinement)
    {
        c.check(
            Rule::Refinement,
            o.status == ObligationStatus::Pass,
            "refinement obligation holds",
            o.id,
        );
    }
    // LOWERING: exactly one edge per requirement slot, of the right kind and requirement
    let nt = ir.transfers.len();
    let nc = ir.capabilities.len();
    c.check(
        Rule::Lowering,
        plan.nreq as usize == nt + nc,
        "plan covers every transfer and capability requirement",
        plan.nreq as u32,
    );
    for slot in 0..(nt + nc).min(MAX_REQ) {
        let ok = match plan.edges.get(slot).copied().flatten() {
            None => false,
            Some(eid) => match hg.edges.iter().find(|e| e.id == eid) {
                None => false,
                Some(e) => {
                    let (kind, req) = if slot < nt {
                        (EdgeKind::Transfer, slot as u32)
                    } else {
                        (EdgeKind::Capability, (slot - nt) as u32)
                    };
                    e.kind == kind && e.requirement == req && e.legal
                }
            },
        };
        c.check(
            Rule::Lowering,
            ok,
            "requirement slot is realized by a legal H_G edge of its own kind",
            slot as u32,
        );
    }
    // REPRESENTATION + OWNERSHIP per transfer edge: re-derive the chain from the registry
    for slot in 0..nt.min(MAX_REQ) {
        let t = ir.transfers[slot];
        let Some(eid) = plan.edges[slot] else {
            continue;
        };
        let Some(e) = hg.edges.iter().find(|x| x.id == eid) else {
            continue;
        };
        let ty_name = m.name(m.types[t.ty as usize].name);
        let boundary = reg.boundary_for(ty_name);
        c.check(
            Rule::Representation,
            boundary.is_some(),
            "semantic type has a host-boundary representation",
            slot as u32,
        );
        let Some(boundary) = boundary else { continue };
        let mut at = boundary;
        let mut steps = 0;
        let mut chain_ok = true;
        for ci in e.steps() {
            steps += 1;
            let Some(conv) = reg.conversions.get(ci as usize).copied() else {
                c.check(
                    Rule::Representation,
                    false,
                    "conversion is not declared in the registry",
                    ci,
                );
                chain_ok = false;
                break;
            };
            let from = reg.find_rep(reg.name(conv.from));
            let to = reg.find_rep(reg.name(conv.to));
            c.check(
                Rule::Representation,
                from == Some(at),
                "conversion source matches the current representation",
                ci,
            );
            chain_ok &= from == Some(at);
            c.check(
                Rule::Ownership,
                conv.mode == t.mode,
                "conversion supports the relation's transfer mode",
                ci,
            );
            c.check(
                Rule::Ownership,
                conv.preserves_value,
                "conversion preserves the semantic value",
                ci,
            );
            if let (Some(f), Some(tt)) = (from, to) {
                let mi = factc_implementation::mode_index(t.mode);
                c.check(
                    Rule::Ownership,
                    reg.representations[f as usize].modes[mi]
                        && reg.representations[tt as usize].modes[mi],
                    "both representations support the transfer mode",
                    ci,
                );
            }
            // representation type matches the semantic type
            if let Some(tt) = to {
                c.check(
                    Rule::Representation,
                    reg.text
                        .eq_bytes(reg.representations[tt as usize].ty, ty_name),
                    "representation is a representation of the semantic type",
                    ci,
                );
            }
            match to {
                Some(tt) => at = tt,
                None => {
                    chain_ok = false;
                }
            }
        }
        c.check(
            Rule::Representation,
            steps > 0,
            "transfer path is explicit (no implicit conversion)",
            slot as u32,
        );
        c.check(
            Rule::Representation,
            chain_ok && at == boundary,
            "path returns to the host-boundary representation",
            slot as u32,
        );
    }
    // CAPABILITY per capability edge
    for slot in nt..(nt + nc).min(MAX_REQ) {
        let creq = ir.capabilities[slot - nt];
        let Some(eid) = plan.edges[slot] else {
            continue;
        };
        let Some(e) = hg.edges.iter().find(|x| x.id == eid) else {
            continue;
        };
        let cap = m.name(m.capabilities[creq.capability as usize].name);
        let covered = e.backends.iter().all(|b| {
            reg.find_backend(reg.name(b))
                .map(|bi| {
                    reg.backends[bi as usize]
                        .capabilities
                        .iter()
                        .any(|x| reg.text.eq_bytes(x, cap))
                })
                .unwrap_or(false)
        });
        c.check(
            Rule::Capability,
            covered && e.backends.len > 0,
            "selected backend covers the semantic capability",
            slot as u32,
        );
    }
    // ADMISSION: guard recomputed equals the plan's guard; each guard backend is READY-CONTRACT with a recipe
    match guard_recomputed(reg, hg, plan) {
        None => c.check(
            Rule::Admission,
            false,
            "guard cannot be recomputed from the registry",
            plan.plan_id,
        ),
        Some(g) => {
            let same = g.len == plan.guard.len
                && g.iter()
                    .all(|x| plan.guard.iter().any(|y| reg.text.eq(x, y)));
            c.check(
                Rule::Admission,
                same,
                "activation guard equals the set of backends the path requires",
                plan.plan_id,
            );
            for b in plan.guard.iter() {
                let ok = reg
                    .find_backend(reg.name(b))
                    .map(|bi| {
                        reg.backends[bi as usize].status == ContractStatus::ReadyContract
                            && reg.backends[bi as usize].recipe.is_some()
                    })
                    .unwrap_or(false);
                c.check(
                    Rule::Admission,
                    ok,
                    "guard backend is READY-CONTRACT with a CodegenRecipe",
                    plan.plan_id,
                );
            }
        }
    }
    // PLAN: pins honoured; sequence obligations acknowledged; hard constraints re-evaluated
    for p in ir.pins.iter() {
        let comp = match p.obj {
            Obj::Component(x) => Some(x),
            Obj::Port(pt) => Some(m.port_comp(pt)),
            _ => None,
        };
        let relevant = ir
            .transfers
            .iter()
            .any(|t| Some(t.src_comp) == comp || Some(t.dst_comp) == comp)
            || ir.capabilities.iter().any(|cr| cr.obj == p.obj);
        if relevant {
            let name = m.name(m.implementations[p.implementation as usize].name);
            c.check(
                Rule::Plan,
                plan.guard.iter().any(|b| reg.text.eq_bytes(b, name)),
                "implementation pin is honoured by the plan",
                p.implementation,
            );
        }
    }
    for o in ir
        .obligations
        .iter()
        .filter(|o| o.kind == ObligationKind::Sequence)
    {
        let r = m.relations[o.index as usize];
        let ok = matches!(r.from, Obj::Component(_) | Obj::Port(_))
            && matches!(r.to, Obj::Component(_) | Obj::Port(_));
        c.check(
            Rule::Plan,
            ok,
            "sequence obligation has resolved endpoints (ordering is host-sequential in v1)",
            o.id,
        );
    }
    if !m.objectives.is_empty() {
        for h in m.hards.iter().filter(|h| h.objective == 0) {
            let v = factc_planning::aggregate(
                reg,
                &plan.guard,
                m.name(m.metrics[h.metric as usize].name),
            );
            let ok = match v {
                None => false,
                Some(v) => match h.cmp {
                    Cmp::AtMost => v <= h.value,
                    Cmp::AtLeast => v >= h.value,
                    Cmp::Equal => v == h.value,
                },
            };
            c.check(
                Rule::Plan,
                ok,
                "hard metric constraint holds (unknown is not zero)",
                h.metric,
            );
        }
    }
    // EFFECT: backends in the guard declare no effect that the endpoint components do not declare
    for b in plan.guard.iter() {
        if let Some(bi) = reg.find_backend(reg.name(b)) {
            for eff in reg.backends[bi as usize].effects.iter() {
                let declared = ir.effects.iter().any(|e| {
                    reg.text
                        .eq_bytes(eff, m.name(m.effects[e.effect as usize].name))
                });
                c.check(Rule::Effect, declared, "backend effect is declared on the source object (no undeclared effect escapes)", bi);
            }
        }
    }
    c
}

/// Verify the whole strategy.  Any invalid variant fails the strategy (preference cannot rescue invalidity).
pub fn verify_strategy(
    m: &Model,
    ir: &CapabilityIr,
    reg: &Registry,
    hg: &Hypergraph,
    s: &CandidateStrategy,
    out: &mut Verification,
) {
    out.clear();
    let mut all_pass = true;
    for (i, p) in s.variants.iter().enumerate() {
        let cert = verify_plan(m, ir, reg, hg, p, i as u32 + 1);
        all_pass &= cert.pass;
        let _ = out.certificates.push(cert);
    }
    let sc = &mut out.strategy_certificate;
    sc.certificate_id = 1000;
    sc.pass = true;
    let mut chk = |rule: Rule, pass: bool, detail: &'static str, subject: u32| {
        if !pass {
            sc.pass = false;
        }
        let _ = sc.results.push(ObligationResult {
            rule,
            pass,
            detail,
            subject,
        });
    };
    chk(
        Rule::Strategy,
        !s.variants.is_empty(),
        "strategy has at least one variant",
        0,
    );
    chk(
        Rule::Strategy,
        all_pass,
        "every variant is independently verified",
        0,
    );
    // selector candidates subset of verified variants: the order must be a permutation of variant indices
    let n = s.variants.len();
    let mut seen = [false; MAX_VARIANTS];
    let mut perm = true;
    for i in 0..n {
        let k = s.order[i] as usize;
        if k >= n || seen[k] {
            perm = false;
        } else {
            seen[k] = true;
        }
    }
    chk(
        Rule::Strategy,
        perm,
        "selector order names each verified variant exactly once",
        0,
    );
    // predicates use declared admission facts only: every guard entry is a registered backend
    let facts_ok = s.variants.iter().all(|p| {
        p.guard
            .iter()
            .all(|b| reg.find_backend(reg.name(b)).is_some())
    });
    chk(
        Rule::Strategy,
        facts_ok,
        "activation guards reference registered backends only",
        0,
    );
    // dispatch respects the authored objective: recompute the order independently
    let mut order = [0u32; MAX_VARIANTS];
    for i in 0..n {
        order[i] = i as u32;
    }
    for i in 1..n {
        let mut j = i;
        while j > 0 {
            let a = &s.variants[order[j - 1] as usize];
            let b = &s.variants[order[j] as usize];
            if factc_planning::compare(a, b, &s.goals, s.ngoals as usize)
                == core::cmp::Ordering::Greater
            {
                order.swap(j - 1, j);
                j -= 1;
            } else {
                break;
            }
        }
    }
    let same_order = (0..n).all(|i| order[i] == s.order[i]);
    chk(
        Rule::Strategy,
        same_order,
        "dispatch order equals the order derived from the authored objective",
        0,
    );
    // goals correspond to the source objective
    let goals_ok = match s.objective {
        None => m.objectives.is_empty(),
        Some(o) => {
            (o as usize) < m.objectives.len()
                && s.ngoals as usize == m.goals.iter().filter(|g| g.objective == o).count()
        }
    };
    chk(
        Rule::Strategy,
        goals_ok,
        "dispatch goals are exactly the authored objective's goals",
        0,
    );
    // goal values re-aggregated from metric evidence
    let mut values_ok = true;
    for p in s.variants.iter() {
        for g in 0..s.ngoals as usize {
            if let Some((_, metric)) = s.goals[g] {
                let v = factc_planning::aggregate(
                    reg,
                    &p.guard,
                    m.name(m.metrics[metric as usize].name),
                );
                if v != p.goal_values[g] {
                    values_ok = false;
                }
            }
        }
    }
    chk(
        Rule::Strategy,
        values_ok,
        "goal values equal the metric evidence aggregation (UNKNOWN stays UNKNOWN)",
        0,
    );
    chk(
        Rule::Strategy,
        s.strength != Strength::ExactOptimum || (s.complete_enumeration && !s.unknown_metric_seen),
        "an optimality claim is backed by complete enumeration with known metrics",
        0,
    );
    if sc.pass {
        let mut vs = VerifiedStrategy {
            strategy_id: s.strategy_id,
            variants: BVec::new(),
            order: s.order,
            goals: s.goals,
            ngoals: s.ngoals,
            objective: s.objective,
            strategy_certificate_id: 1000,
            planner_strength: s.strength,
            _sealed: Sealed,
        };
        for (i, p) in s.variants.iter().enumerate() {
            let _ = vs.variants.push(VerifiedPlanVariant {
                plan: *p,
                certificate_id: i as u32 + 1,
            });
        }
        out.verified = Some(vs);
    }
}

fn results_json(w: &mut JsonW<'_, '_>, results: &[ObligationResult]) -> Result<(), OutputTooSmall> {
    w.arr()?;
    for r in results {
        w.obj()?;
        w.kv_str("rule", r.rule.id().as_bytes())?;
        w.kv_str("status", if r.pass { b"PASS" } else { b"FAIL" })?;
        w.kv_str("detail", r.detail.as_bytes())?;
        w.kv_uint("subject", r.subject as u64)?;
        w.obj_end()?;
    }
    w.arr_end()
}

pub fn certificates_json(v: &Verification, out: &mut OutBuf<'_>) -> Result<(), OutputTooSmall> {
    let mut w = JsonW::new(out);
    w.obj_begin()?;
    w.kv_str("kind", b"VERIFICATION_CERTIFICATES")?;
    w.kv_uint("schema_version", 1)?;
    w.key("proof_certificates")?;
    w.arr()?;
    for c in v.certificates.iter() {
        w.obj()?;
        w.kv_uint("certificate_id", c.certificate_id as u64)?;
        w.kv_uint("plan_id", c.plan_id as u64)?;
        w.kv_str("status", if c.pass { b"PASS" } else { b"FAIL" })?;
        w.key("obligation_results")?;
        let mut buf: [ObligationResult; 128] = [ObligationResult {
            rule: Rule::Semantic,
            pass: true,
            detail: "",
            subject: 0,
        }; 128];
        let mut n = 0;
        for r in c.results.iter() {
            buf[n] = *r;
            n += 1;
        }
        results_json(&mut w, &buf[..n])?;
        w.obj_end()?;
    }
    w.arr_end()?;
    w.key("strategy_certificate")?;
    w.obj()?;
    w.kv_uint(
        "certificate_id",
        v.strategy_certificate.certificate_id as u64,
    )?;
    w.kv_str(
        "status",
        if v.strategy_certificate.pass {
            b"PASS"
        } else {
            b"FAIL"
        },
    )?;
    w.key("results")?;
    let mut buf: [ObligationResult; 64] = [ObligationResult {
        rule: Rule::Strategy,
        pass: true,
        detail: "",
        subject: 0,
    }; 64];
    let mut n = 0;
    for r in v.strategy_certificate.results.iter() {
        buf[n] = *r;
        n += 1;
    }
    results_json(&mut w, &buf[..n])?;
    w.obj_end()?;
    w.kv_bool("verified_strategy_constructed", v.verified.is_some())?;
    w.obj_end()
}

pub fn verified_strategy_json(
    m: &Model,
    reg: &Registry,
    hg: &Hypergraph,
    vs: &VerifiedStrategy,
    out: &mut OutBuf<'_>,
) -> Result<(), OutputTooSmall> {
    let mut w = JsonW::new(out);
    w.obj_begin()?;
    w.kv_str("kind", b"VERIFIED_STRATEGY")?;
    w.kv_uint("schema_version", 1)?;
    w.kv_uint("strategy_id", vs.strategy_id as u64)?;
    w.kv_uint("strategy_certificate_id", vs.strategy_certificate_id as u64)?;
    w.kv_str(
        "planner_result_strength",
        vs.planner_strength.name().as_bytes(),
    )?;
    match vs.objective {
        Some(o) => w.kv_str("dispatch_objective", m.name(m.objectives[o as usize].name))?,
        None => w.kv_null("dispatch_objective")?,
    }
    w.key("verified_variants")?;
    w.arr()?;
    for v in vs.variants.iter() {
        w.obj()?;
        w.kv_uint("plan_id", v.plan.plan_id as u64)?;
        w.kv_uint("proof_certificate_id", v.certificate_id as u64)?;
        w.key("activation_guard")?;
        w.arr()?;
        for b in v.plan.guard.iter() {
            w.str(reg.name(b))?;
        }
        w.arr_end()?;
        w.key("edges")?;
        w.arr()?;
        for e in v.plan.edges.iter().take(v.plan.nreq as usize).flatten() {
            w.obj()?;
            w.kv_uint("edge_id", *e as u64)?;
            w.key("conversions")?;
            w.arr()?;
            if let Some(edge) = hg.edges.iter().find(|x| x.id == *e) {
                for ci in edge.steps() {
                    w.str(reg.name(reg.conversions[ci as usize].name))?;
                }
            }
            w.arr_end()?;
            w.obj_end()?;
        }
        w.arr_end()?;
        w.key("goal_values")?;
        w.arr()?;
        for gv in v.plan.goal_values.iter().take(vs.ngoals as usize) {
            match gv {
                Some(x) => w.int(*x)?,
                None => w.str(b"UNKNOWN")?,
            }
        }
        w.arr_end()?;
        w.obj_end()?;
    }
    w.arr_end()?;
    w.key("dispatch_order")?;
    w.arr()?;
    for v in vs.ordered() {
        w.uint(v.plan.plan_id as u64)?;
    }
    w.arr_end()?;
    w.kv_str("tie_break", b"canonical plan_id ascending")?;
    w.obj_end()
}

/// Re-exports used by the kernel for diagnostics.
pub fn first_failure(v: &Verification) -> Option<(Rule, &'static str)> {
    for c in v.certificates.iter() {
        if let Some(r) = c.results.iter().find(|r| !r.pass) {
            return Some((r.rule, r.detail));
        }
    }
    v.strategy_certificate
        .results
        .iter()
        .find(|r| !r.pass)
        .map(|r| (r.rule, r.detail))
}
