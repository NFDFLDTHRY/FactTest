//! B1 negative fixture: a kernel-style no_std crate that reaches for std must fail to build.
#![no_std]
pub fn leak() -> std::string::String {
    std::string::String::new()
}
