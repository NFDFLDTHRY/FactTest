//! Implementation-plane data (contract registry, metric evidence, machine epochs) and the implementation
//! hypergraph H_G / H_A(E).
//!
//! Contract instances are DATA supplied to the compiler, never compiled-in knowledge about a slice.  The registry
//! dialect reuses the semantic-island scanner but is a separate language surface from the source language.
#![no_std]
#![forbid(unsafe_code)]

pub mod hypergraph;
pub mod registry;

pub use hypergraph::*;
pub use registry::*;
