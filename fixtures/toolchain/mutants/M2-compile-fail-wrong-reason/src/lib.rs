//! Mutant of the B3 id-substitution fixture: an unrelated syntax error makes `cargo build` fail, so an exit-code
//! rule reports "rejected by rustc (expected)" although no type mismatch is ever reached.
#![no_std]
use factc_foundation::{ArtifactId, CapabilityId, EvidenceId, ImplementationId, NodeId, SymbolId};

fn takes_impl(_: ImplementationId) {}
fn takes_evidence(_: EvidenceId) {}
fn takes_symbol(_: SymbolId) {}

pub fn substitute() {
    takes_impl(CapabilityId::new(1));
    takes_evidence(ArtifactId::new(2));
    takes_symbol(NodeId::new(3));
}

pub fn broken( { }
