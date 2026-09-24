//! FactTest compiler kernel facade and bootstrap ABI (BOOTSTRAP-CONTRACTS.md C1, C2, C5, C14, C15).
//!
//! The kernel is a pure transformation machine over a caller-owned `Workspace`.  It never touches a filesystem,
//! clock, network, browser or environment.  CHECK_OR_COMPILE runs the phase spine (front end, semantic, lowering,
//! contracts, planning + verification, codegen + bundle; `phases::run`); OBSERVE turns an evidence tape into an
//! ObservationDelta and observed ASCII.  Every operation of `abi` is transport-neutral: the native driver
//! (host/factc) and the wasm64 export surface (compiler/wasm-abi) transport the same functions.
#![no_std]
#![forbid(unsafe_code)]

pub mod abi;
pub mod phases;
pub mod workspace;

pub use abi::*;
pub use workspace::{Mode, Status, Workspace};
