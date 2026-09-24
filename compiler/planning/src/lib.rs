//! Planner (PLANNER-COST-MODEL.md, BOOTSTRAP-CONTRACTS C8).
//!
//! Proposes a finite CandidateStrategy: one CandidatePlan per combination of legal H_G edges, each with an
//! activation guard (the backends it needs admitted), dispatched by the authored Objective.  The planner ranks;
//! it never certifies.  Unknown metric values stay unknown and forbid an optimality claim.
#![no_std]
#![forbid(unsafe_code)]
#![allow(clippy::needless_range_loop)] // bounded stack arrays walked by position

use factc_capability::CapabilityIr;
use factc_foundation::json::JsonW;
use factc_foundation::limits::MAX_VARIANTS;
use factc_foundation::{BVec, OutBuf, OutputTooSmall};
use factc_implementation::{EdgeKind, Hypergraph, Registry, StrList};
use factc_semantic::Model;
use factc_source::{Cmp, GoalDir};

pub const MAX_REQ: usize = 16;
pub const MAX_GOALS: usize = 8;

#[derive(Copy, Clone, Debug)]
pub struct CandidatePlan {
    pub plan_id: u32,
    /// H_G edge id per requirement slot (transfers first, then capability requirements)
    pub edges: [Option<u32>; MAX_REQ],
    pub nreq: u8,
    /// activation guard: every backend here must be ADMITTED in the epoch
    pub guard: StrList,
    /// per-goal aggregated metric value (SUM over guard backends); None = UNKNOWN (never zero)
    pub goal_values: [Option<i64>; MAX_GOALS],
    /// hard constraints satisfied (or no hard constraints)
    pub hard_ok: bool,
}

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum Strength {
    Feasible,
    ExactOptimum,
    BoundedOptimum,
    Heuristic,
    NoPlan,
}

impl Strength {
    pub const fn name(self) -> &'static str {
        match self {
            Strength::Feasible => "FEASIBLE",
            Strength::ExactOptimum => "EXACT_OPTIMUM",
            Strength::BoundedOptimum => "BOUNDED_OPTIMUM",
            Strength::Heuristic => "HEURISTIC",
            Strength::NoPlan => "NO_PLAN",
        }
    }
}

#[derive(Copy, Clone, Debug)]
pub struct RejectedCandidate {
    pub plan_id: u32,
    pub reason: &'static str,
}

#[derive(Clone, Debug)]
pub struct CandidateStrategy {
    pub strategy_id: u32,
    pub variants: BVec<CandidatePlan, MAX_VARIANTS>,
    /// dispatch order: indices into `variants`, best first
    pub order: [u32; MAX_VARIANTS],
    pub objective: Option<u32>,
    pub goals: [Option<(GoalDir, u32)>; MAX_GOALS],
    pub ngoals: u8,
    pub strength: Strength,
    pub complete_enumeration: bool,
    pub unknown_metric_seen: bool,
    pub rejected: BVec<RejectedCandidate, 32>,
    pub explanation: &'static str,
}

impl Default for CandidateStrategy {
    fn default() -> Self {
        Self::new()
    }
}

impl CandidateStrategy {
    pub const fn new() -> Self {
        CandidateStrategy {
            strategy_id: 0,
            variants: BVec::new(),
            order: [0; MAX_VARIANTS],
            objective: None,
            goals: [None; MAX_GOALS],
            ngoals: 0,
            strength: Strength::NoPlan,
            complete_enumeration: true,
            unknown_metric_seen: false,
            rejected: BVec::new(),
            explanation: "",
        }
    }
    pub fn clear(&mut self) {
        *self = CandidateStrategy::new();
    }
    pub fn ordered(&self) -> impl Iterator<Item = &CandidatePlan> + '_ {
        self.order[..self.variants.len()]
            .iter()
            .map(move |i| &self.variants[*i as usize])
    }
}

/// SUM aggregation of a metric over the guard backends; UNKNOWN if any backend lacks a value.
pub fn aggregate(reg: &Registry, guard: &StrList, metric: &[u8]) -> Option<i64> {
    let mut sum = 0i64;
    for b in guard.iter() {
        sum = sum.checked_add(reg.metric_value(metric, b)?)?;
    }
    Some(sum)
}

/// Compare two plans under the ordered goals: known values first (an unknown never ranks as free), then value
/// by goal direction, then canonical tie-break by plan_id.
pub fn compare(
    a: &CandidatePlan,
    b: &CandidatePlan,
    goals: &[Option<(GoalDir, u32)>; MAX_GOALS],
    ngoals: usize,
) -> core::cmp::Ordering {
    use core::cmp::Ordering::*;
    for g in 0..ngoals {
        let Some((dir, _)) = goals[g] else { continue };
        match (a.goal_values[g], b.goal_values[g]) {
            (Some(x), Some(y)) => {
                let o = if dir == GoalDir::Minimize {
                    x.cmp(&y)
                } else {
                    y.cmp(&x)
                };
                if o != Equal {
                    return o;
                }
            }
            (Some(_), None) => return Less,
            (None, Some(_)) => return Greater,
            (None, None) => {}
        }
    }
    a.plan_id.cmp(&b.plan_id)
}

fn hard_ok(m: &Model, reg: &Registry, objective: u32, guard: &StrList) -> bool {
    for h in m.hards.iter().filter(|h| h.objective == objective) {
        let metric = m.name(m.metrics[h.metric as usize].name);
        match aggregate(reg, guard, metric) {
            None => return false, // unknown cannot prove a hard bound
            Some(v) => {
                let ok = match h.cmp {
                    Cmp::AtMost => v <= h.value,
                    Cmp::AtLeast => v >= h.value,
                    Cmp::Equal => v == h.value,
                };
                if !ok {
                    return false;
                }
            }
        }
    }
    true
}

/// Plan: enumerate the finite product of legal edges (bounded), guard each variant, apply hard constraints,
/// dispatch by the authored objective.  Deterministic.
pub fn plan(
    m: &Model,
    ir: &CapabilityIr,
    reg: &Registry,
    hg: &Hypergraph,
    out: &mut CandidateStrategy,
) {
    out.clear();
    out.strategy_id = 1;
    // requirement slots
    let nt = ir.transfers.len();
    let nc = ir.capabilities.len();
    let nreq = nt + nc;
    if nreq > MAX_REQ {
        out.explanation = "too many requirements for the bounded planner";
        return;
    }
    // objective: the first authored objective (language v1 has at most one meaningful dispatch objective)
    if !m.objectives.is_empty() {
        out.objective = Some(0);
        let mut goals: [Option<(GoalDir, u32)>; MAX_GOALS] = [None; MAX_GOALS];
        let mut n = 0;
        // goals in priority order
        let mut prios: [Option<u32>; MAX_GOALS] = [None; MAX_GOALS];
        for g in m.goals.iter().filter(|g| g.objective == 0) {
            if n < MAX_GOALS {
                prios[n] = Some(g.priority);
                n += 1;
            }
        }
        // insertion sort priorities
        for i in 1..n {
            let mut j = i;
            while j > 0 && prios[j - 1] > prios[j] {
                prios.swap(j - 1, j);
                j -= 1;
            }
        }
        for (k, p) in prios.iter().take(n).enumerate() {
            if let Some(g) = m
                .goals
                .iter()
                .find(|g| g.objective == 0 && Some(g.priority) == *p)
            {
                goals[k] = Some((g.dir, g.metric));
            }
        }
        out.goals = goals;
        out.ngoals = n as u8;
    }
    // odometer over legal edges per slot
    let mut counts = [0usize; MAX_REQ];
    for slot in 0..nreq {
        let (kind, req) = if slot < nt {
            (EdgeKind::Transfer, slot as u32)
        } else {
            (EdgeKind::Capability, (slot - nt) as u32)
        };
        counts[slot] = hg.edges_for(kind, req).count();
        if counts[slot] == 0 {
            out.strength = Strength::NoPlan;
            out.explanation = "a requirement has no legal edge in H_G";
            return;
        }
    }
    let mut idx = [0usize; MAX_REQ];
    let mut plan_id = 0u32;
    loop {
        // build the variant
        let mut plan = CandidatePlan {
            plan_id,
            edges: [None; MAX_REQ],
            nreq: nreq as u8,
            guard: StrList::default(),
            goal_values: [None; MAX_GOALS],
            hard_ok: true,
        };
        for slot in 0..nreq {
            let (kind, req) = if slot < nt {
                (EdgeKind::Transfer, slot as u32)
            } else {
                (EdgeKind::Capability, (slot - nt) as u32)
            };
            let e = hg.edges_for(kind, req).nth(idx[slot]).unwrap();
            plan.edges[slot] = Some(e.id);
            for b in e.backends.iter() {
                if !plan.guard.iter().any(|x| reg.text.eq(x, b)) {
                    plan.guard.push(b);
                }
            }
        }
        for g in 0..out.ngoals as usize {
            if let Some((_, metric)) = out.goals[g] {
                let v = aggregate(reg, &plan.guard, m.name(m.metrics[metric as usize].name));
                if v.is_none() {
                    out.unknown_metric_seen = true;
                }
                plan.goal_values[g] = v;
            }
        }
        if let Some(obj) = out.objective {
            plan.hard_ok = hard_ok(m, reg, obj, &plan.guard);
        }
        if plan.hard_ok {
            if out.variants.push(plan).is_err() {
                out.complete_enumeration = false;
                let _ = out.rejected.push(RejectedCandidate {
                    plan_id,
                    reason: "variant arena exhausted; enumeration incomplete",
                });
                break;
            }
        } else {
            let _ = out.rejected.push(RejectedCandidate {
                plan_id,
                reason: "hard constraint not satisfied (or metric unknown)",
            });
        }
        plan_id += 1;
        // advance odometer
        let mut slot = 0;
        loop {
            if slot >= nreq {
                break;
            }
            idx[slot] += 1;
            if idx[slot] < counts[slot] {
                break;
            }
            idx[slot] = 0;
            slot += 1;
        }
        if slot >= nreq {
            break;
        }
    }
    // dispatch order
    let n = out.variants.len();
    for i in 0..n {
        out.order[i] = i as u32;
    }
    for i in 1..n {
        let mut j = i;
        while j > 0 {
            let a = &out.variants[out.order[j - 1] as usize];
            let b = &out.variants[out.order[j] as usize];
            if compare(a, b, &out.goals, out.ngoals as usize) == core::cmp::Ordering::Greater {
                out.order.swap(j - 1, j);
                j -= 1;
            } else {
                break;
            }
        }
    }
    out.strength = if n == 0 {
        Strength::NoPlan
    } else if out.objective.is_none() || out.ngoals == 0 {
        Strength::Feasible
    } else if out.complete_enumeration && !out.unknown_metric_seen {
        Strength::ExactOptimum
    } else {
        Strength::Heuristic
    };
    out.explanation = match out.strength {
        Strength::NoPlan => "no candidate survived legality and hard constraints",
        Strength::Feasible => "legal candidates found; no objective => canonical tie-break, no optimality claim",
        Strength::ExactOptimum => "finite exhaustive enumeration over H_G with all goal metrics known under the stated (fixture) model",
        _ => "ranking used unknown metric values or an incomplete enumeration; no optimality claim",
    };
}

pub fn strategy_json(
    m: &Model,
    ir: &CapabilityIr,
    reg: &Registry,
    hg: &Hypergraph,
    s: &CandidateStrategy,
    out: &mut OutBuf<'_>,
) -> Result<(), OutputTooSmall> {
    let mut w = JsonW::new(out);
    w.obj_begin()?;
    w.kv_str("kind", b"CANDIDATE_STRATEGY")?;
    w.kv_uint("schema_version", 1)?;
    w.kv_uint("strategy_id", s.strategy_id as u64)?;
    w.kv_str("result_strength", s.strength.name().as_bytes())?;
    w.kv_bool("complete_enumeration", s.complete_enumeration)?;
    w.kv_bool("unknown_metric_seen", s.unknown_metric_seen)?;
    w.kv_str("explanation", s.explanation.as_bytes())?;
    match s.objective {
        Some(o) => w.kv_str("dispatch_objective", m.name(m.objectives[o as usize].name))?,
        None => w.kv_null("dispatch_objective")?,
    }
    w.key("goals")?;
    w.arr()?;
    for g in s.goals.iter().take(s.ngoals as usize).flatten() {
        w.obj()?;
        w.kv_str(
            "direction",
            if g.0 == GoalDir::Minimize {
                b"minimize"
            } else {
                b"maximize"
            },
        )?;
        w.kv_str("metric", m.name(m.metrics[g.1 as usize].name))?;
        w.kv_str(
            "aggregation",
            b"SUM over guard backends; UNKNOWN if any value unknown",
        )?;
        w.obj_end()?;
    }
    w.arr_end()?;
    w.kv_str("tie_break", b"canonical plan_id ascending")?;
    w.key("variants")?;
    w.arr()?;
    for p in s.variants.iter() {
        w.obj()?;
        w.kv_uint("plan_id", p.plan_id as u64)?;
        w.key("edges")?;
        w.arr()?;
        for (slot, e) in p.edges.iter().take(p.nreq as usize).enumerate() {
            let Some(eid) = e else { continue };
            let edge = hg.edges.iter().find(|x| x.id == *eid);
            w.obj()?;
            w.kv_uint("edge_id", *eid as u64)?;
            if slot < ir.transfers.len() {
                w.kv_str("requirement", m.name(ir.transfers[slot].name))?;
            } else {
                let c = ir.capabilities[slot - ir.transfers.len()];
                w.kv_str(
                    "requirement",
                    m.name(m.capabilities[c.capability as usize].name),
                )?;
            }
            w.key("conversions")?;
            w.arr()?;
            if let Some(edge) = edge {
                for ci in edge.steps() {
                    w.str(reg.name(reg.conversions[ci as usize].name))?;
                }
            }
            w.arr_end()?;
            w.obj_end()?;
        }
        w.arr_end()?;
        w.key("activation_guard")?;
        w.arr()?;
        for b in p.guard.iter() {
            w.str(reg.name(b))?;
        }
        w.arr_end()?;
        w.key("goal_values")?;
        w.arr()?;
        for v in p.goal_values.iter().take(s.ngoals as usize) {
            match v {
                Some(x) => w.int(*x)?,
                None => w.str(b"UNKNOWN")?,
            }
        }
        w.arr_end()?;
        w.kv_bool("hard_constraints_ok", p.hard_ok)?;
        w.obj_end()?;
    }
    w.arr_end()?;
    w.key("dispatch_order")?;
    w.arr()?;
    for p in s.ordered() {
        w.uint(p.plan_id as u64)?;
    }
    w.arr_end()?;
    w.key("rejected")?;
    w.arr()?;
    for r in s.rejected.iter() {
        w.obj()?;
        w.kv_uint("plan_id", r.plan_id as u64)?;
        w.kv_str("reason", r.reason.as_bytes())?;
        w.obj_end()?;
    }
    w.arr_end()?;
    w.obj_end()
}
