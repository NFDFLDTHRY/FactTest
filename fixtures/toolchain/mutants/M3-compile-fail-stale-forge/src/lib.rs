//! Mutant of the P5-V01 forge fixture with ONE stale field name (`certificate_id`).  rustc reports only E0560
//! "no field named certificate_id" and never reaches the private-field rejection: the sealing invariant is not witnessed,
//! yet `cargo build` still exits non-zero.
#![no_std]
use factc_planning::{Strength, MAX_GOALS};
use factc_verifier::VerifiedStrategy;

pub fn forge() -> VerifiedStrategy {
    VerifiedStrategy {
        strategy_id: 1,
        variants: factc_foundation::BVec::new(),
        order: [0; factc_foundation::limits::MAX_VARIANTS],
        goals: [None; MAX_GOALS],
        ngoals: 0,
        objective: None,
        certificate_id: 0,
        planner_strength: Strength::ExactOptimum,
    }
}
