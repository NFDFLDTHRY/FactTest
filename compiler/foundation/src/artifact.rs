//! Artifact envelope (C6): kind, schema version, producer, lineage, status, identity.

use crate::bvec::BVec;
use crate::ids::ArtifactId;
use crate::limits::MAX_INPUT_IDS;

#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub enum ArtifactKind {
    Source,
    Diagnostics,
    SystemAst,
    ResolvedSystem,
    TypedSystemIr,
    CanonicalAscii,
    ObligationSet,
    CapabilityIr,
    ContractRegistry,
    ImplementationHypergraph,
    CandidateStrategy,
    VerificationCertificates,
    VerifiedStrategy,
    GeneratedBundle,
    BundleCertificate,
    RuntimeEvidence,
    ObservationDelta,
    ObservedAscii,
}

impl ArtifactKind {
    pub const fn name(self) -> &'static str {
        match self {
            ArtifactKind::Source => "SOURCE",
            ArtifactKind::Diagnostics => "DIAGNOSTICS",
            ArtifactKind::SystemAst => "SYSTEM_AST",
            ArtifactKind::ResolvedSystem => "RESOLVED_SYSTEM",
            ArtifactKind::TypedSystemIr => "TYPED_SYSTEM_IR",
            ArtifactKind::CanonicalAscii => "CANONICAL_ASCII",
            ArtifactKind::ObligationSet => "OBLIGATION_SET",
            ArtifactKind::CapabilityIr => "CAPABILITY_IR",
            ArtifactKind::ContractRegistry => "CONTRACT_REGISTRY",
            ArtifactKind::ImplementationHypergraph => "IMPLEMENTATION_HYPERGRAPH",
            ArtifactKind::CandidateStrategy => "CANDIDATE_STRATEGY",
            ArtifactKind::VerificationCertificates => "VERIFICATION_CERTIFICATES",
            ArtifactKind::VerifiedStrategy => "VERIFIED_STRATEGY",
            ArtifactKind::GeneratedBundle => "GENERATED_BUNDLE",
            ArtifactKind::BundleCertificate => "BUNDLE_CERTIFICATE",
            ArtifactKind::RuntimeEvidence => "RUNTIME_EVIDENCE",
            ArtifactKind::ObservationDelta => "OBSERVATION_DELTA",
            ArtifactKind::ObservedAscii => "OBSERVED_ASCII",
        }
    }
}

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum ArtifactStatus {
    Ok,
    Partial,
    Failed,
}

impl ArtifactStatus {
    pub const fn name(self) -> &'static str {
        match self {
            ArtifactStatus::Ok => "OK",
            ArtifactStatus::Partial => "PARTIAL",
            ArtifactStatus::Failed => "FAILED",
        }
    }
}

#[derive(Clone, Debug)]
pub struct ArtifactMeta {
    pub id: ArtifactId,
    pub kind: ArtifactKind,
    pub schema_version: u32,
    pub producer: &'static str,
    pub producer_version: u32,
    pub inputs: BVec<ArtifactId, MAX_INPUT_IDS>,
    pub status: ArtifactStatus,
    pub sha256: [u8; 32],
    pub byte_len: u32,
}
