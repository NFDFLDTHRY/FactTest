#![no_std]
pub fn alpha() -> u32 { 1 }
#[cfg(test)]
mod t { #[test] fn alpha_ok() { assert_eq!(super::alpha(), 1); } }
