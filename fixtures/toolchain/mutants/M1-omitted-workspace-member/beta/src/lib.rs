#![no_std]
// beta is a workspace member that default-members omits: a bare `cargo test` never runs this failing test.
pub fn beta() -> u32 { 2 }
#[cfg(test)]
mod t { #[test] fn beta_is_broken() { assert_eq!(super::beta(), 3, "beta invariant violated"); } }
