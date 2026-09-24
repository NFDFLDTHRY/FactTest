//! FactTest semantic kernel (PASS4).  Consumes parsed statements; produces the resolved, typed semantic graph,
//! evaluates the bounded invariant kernel and refinement law, and renders the canonical witness.
//!
//! Identity is typed (foundation ids); display labels never participate in identity; geometry never enters.
#![no_std]
#![forbid(unsafe_code)]

pub mod build;
pub mod invariants;
pub mod model;
pub mod refinement;
pub mod render;

pub use model::*;
