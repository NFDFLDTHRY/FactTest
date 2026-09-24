//! Activation model (RUNTIME-ADMISSION-REPLAN.md, Pass 6 amendment): given a VerifiedStrategy and an epoch's
//! admissions, select the first variant in dispatch order whose guard passes.  This is the compile-time model of
//! the emitted runtime selector; it can activate only verified variants because it takes a VerifiedStrategy.

use crate::VerifiedStrategy;
use factc_foundation::json::JsonW;
use factc_foundation::{OutBuf, OutputTooSmall};
use factc_implementation::{Decision, Registry};

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum ActivationStatus {
    Pass,
    NoActivePlan,
}

#[derive(Copy, Clone, Debug)]
pub struct ActivationReceipt {
    pub strategy_id: u32,
    pub plan_id: Option<u32>,
    pub status: ActivationStatus,
    /// per variant (dispatch order): guard satisfied?
    pub guard_results: [Option<bool>; factc_foundation::limits::MAX_VARIANTS],
}

pub fn guard_passes(reg: &Registry, guard: &factc_implementation::StrList) -> bool {
    guard
        .iter()
        .all(|b| matches!(reg.admission_of(b), Some(a) if a.decision == Decision::Admitted))
}

pub fn activate(vs: &VerifiedStrategy, reg: &Registry) -> ActivationReceipt {
    let mut r = ActivationReceipt {
        strategy_id: vs.strategy_id,
        plan_id: None,
        status: ActivationStatus::NoActivePlan,
        guard_results: [None; factc_foundation::limits::MAX_VARIANTS],
    };
    for (i, v) in vs.ordered().enumerate() {
        let ok = guard_passes(reg, &v.plan.guard);
        r.guard_results[i] = Some(ok);
        if ok && r.plan_id.is_none() {
            r.plan_id = Some(v.plan.plan_id);
            r.status = ActivationStatus::Pass;
        }
    }
    r
}

pub fn receipt_json(
    vs: &VerifiedStrategy,
    reg: &Registry,
    r: &ActivationReceipt,
    out: &mut OutBuf<'_>,
) -> Result<(), OutputTooSmall> {
    let mut w = JsonW::new(out);
    w.obj_begin()?;
    w.kv_str("kind", b"ACTIVATION_RECEIPT")?;
    w.kv_uint("schema_version", 1)?;
    match reg.epoch {
        Some(e) => w.kv_str("epoch_id", reg.name(e))?,
        None => w.kv_null("epoch_id")?,
    }
    w.kv_str("evidence_class", b"SYNTHETIC_MODEL")?;
    w.kv_uint("strategy_id", r.strategy_id as u64)?;
    match r.plan_id {
        Some(p) => w.kv_uint("plan_id", p as u64)?,
        None => w.kv_null("plan_id")?,
    }
    w.kv_str(
        "status",
        if r.status == ActivationStatus::Pass {
            b"PASS"
        } else {
            b"NO_ACTIVE_PLAN"
        },
    )?;
    w.key("admissions")?;
    w.arr()?;
    for a in reg.admissions.iter() {
        w.obj()?;
        w.kv_str("backend", reg.name(a.backend))?;
        w.kv_str(
            "decision",
            if a.decision == Decision::Admitted {
                b"ADMITTED"
            } else {
                b"REJECTED"
            },
        )?;
        w.kv_str("evidence", reg.name(a.evidence))?;
        match a.reason {
            Some(rs) => w.kv_str("reason", reg.name(rs))?,
            None => w.kv_null("reason")?,
        }
        w.obj_end()?;
    }
    w.arr_end()?;
    w.key("guard_results")?;
    w.arr()?;
    for (i, v) in vs.ordered().enumerate() {
        w.obj()?;
        w.kv_uint("plan_id", v.plan.plan_id as u64)?;
        w.key("guard")?;
        w.arr()?;
        for b in v.plan.guard.iter() {
            w.str(reg.name(b))?;
        }
        w.arr_end()?;
        match r.guard_results[i] {
            Some(g) => w.kv_bool("satisfied", g)?,
            None => w.kv_null("satisfied")?,
        }
        w.obj_end()?;
    }
    w.arr_end()?;
    w.obj_end()
}
