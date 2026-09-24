//! Mutant: std reached only on non-wasm64 targets.  Native `cargo test` is green; the core-only wasm64 build is not.
#![no_std]

#[cfg(not(target_arch = "wasm64"))]
extern crate std;

#[cfg(not(target_arch = "wasm64"))]
pub fn describe() -> std::string::String {
    std::string::String::from("native only")
}

#[cfg(target_arch = "wasm64")]
pub fn describe() -> &'static str {
    std::hint::black_box("wasm64")
}

#[cfg(test)]
mod t {
    #[test]
    fn native_is_green() { assert!(!super::describe().is_empty()); }
}
