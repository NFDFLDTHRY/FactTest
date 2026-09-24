//! FactTest compiler foundation (PASS3 / BOOTSTRAP-CONTRACTS.md C2-C4, C6, C19).
//!
//! `#![no_std]`, no `alloc`, no third-party crates.  Everything here is a pure data structure or a pure
//! transformation over caller-owned storage.  Capacity exhaustion is a structured result, never a panic path
//! that the kernel relies on.
#![no_std]
#![forbid(unsafe_code)]
#![deny(missing_debug_implementations)]

pub mod artifact;
pub mod buf;
pub mod bvec;
pub mod diag;
pub mod hex;
pub mod ids;
pub mod json;
pub mod limits;
pub mod sha256;
pub mod text;
pub mod wasm;

pub use artifact::{ArtifactKind, ArtifactMeta, ArtifactStatus};
pub use buf::{OutBuf, OutputTooSmall};
pub use bvec::{BVec, Exhausted};
pub use diag::{DiagCode, Diagnostic, Diagnostics, Phase, Severity};
pub use ids::*;
pub use text::{Str, TextArena};

#[cfg(test)]
mod tests_foundation;
