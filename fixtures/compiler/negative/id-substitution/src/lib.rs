//! B3 negative fixture: typed identity domains must not be interchangeable.
#![no_std]
use factc_foundation::{ArtifactId, CapabilityId, EvidenceId, ImplementationId, NodeId, SymbolId};

fn takes_impl(_: ImplementationId) {}
fn takes_evidence(_: EvidenceId) {}
fn takes_symbol(_: SymbolId) {}

pub fn substitute() {
    takes_impl(CapabilityId::new(1)); // CapabilityId used as ImplementationId
    takes_evidence(ArtifactId::new(2)); // ArtifactId used as EvidenceId
    takes_symbol(NodeId::new(3)); // NodeId used as SymbolId
}
