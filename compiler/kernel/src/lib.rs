//! FactTest compiler kernel facade and bootstrap ABI (BOOTSTRAP-CONTRACTS.md C1, C2, C5, C14, C15).
//!
//! The kernel is a pure transformation machine over a caller-owned `Workspace`.  It never touches a filesystem,
//! clock, network, browser or environment.  Semantic phases are added by later materialization steps; until the
//! language kernel exists, CHECK_OR_COMPILE reports LANGUAGE_KERNEL_NOT_IMPLEMENTED (B8).
#![no_std]
#![forbid(unsafe_code)]

pub mod abi;
pub mod workspace;

pub use abi::*;
pub use workspace::{Mode, Status, Workspace};
