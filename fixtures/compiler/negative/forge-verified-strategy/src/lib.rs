//! P5-V01 / P6-G05 negative fixture: planner-side code cannot manufacture a VerifiedStrategy.
//! The struct has a private sealing field and no public constructor; this must not compile.
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
        strategy_certificate_id: 0,
        planner_strength: Strength::ExactOptimum,
    }
}
