//! Caller-owned bootstrap workspace (C2): borrowed inputs, bounded arenas, structured capacity errors.
//! Phase state (parsed units, semantic model) and emitted artifacts live here so the host only ever moves bytes.

use factc_foundation::limits::*;
use factc_foundation::{ArtifactKind, ArtifactStatus, BVec, Diagnostics, SourceId, Span};

pub const ARTIFACT_BYTES: usize = 512 * 1024;
pub const MACHINE_STATE_BYTES: usize = 16 * 1024;
pub const CONTRACT_BYTES: usize = 32 * 1024;
pub const METRIC_BYTES: usize = 8 * 1024;

#[derive(Copy, Clone, Debug)]
pub struct SourceUnit {
    pub id: SourceId,
    pub off: u32,
    pub len: u32,
}

impl SourceUnit {
    pub fn span(&self) -> Span {
        Span::new(self.id, 0, self.len).unwrap_or_default()
    }
}

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum Mode {
    Analyze,
    Build,
}

/// Artifact arena or slot table exhausted (structured, never a panic).
#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub struct ArenaExhausted;

/// Emitted artifact: envelope + location in the artifact arena.
#[derive(Copy, Clone, Debug)]
pub struct ArtifactSlot {
    pub id: u32,
    pub kind: ArtifactKind,
    pub schema_version: u32,
    pub producer: &'static str,
    pub status: ArtifactStatus,
    pub sha256: [u8; 32],
    pub off: u32,
    pub len: u32,
    pub inputs: [Option<u32>; MAX_INPUT_IDS],
    /// which system (unit) the artifact belongs to, if any
    pub system: Option<u32>,
}

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
#[repr(u32)]
pub enum Status {
    Idle = 0,
    Ok = 1,
    Diagnostics = 2,
    Exhausted = 3,
    NotImplemented = 4,
}

pub type Unit = factc_source::ParsedUnit<MAX_ISLANDS, MAX_EXPR_NODES>;

pub struct Workspace {
    pub source_bytes: [u8; SOURCE_BYTES],
    pub source_used: usize,
    pub sources: BVec<SourceUnit, MAX_SOURCE_UNITS>,
    pub machine_state: [u8; MACHINE_STATE_BYTES],
    pub machine_state_len: usize,
    pub diagnostics: Diagnostics<MAX_DIAGNOSTICS>,
    pub islands: BVec<factc_source::Island, MAX_ISLANDS>,
    pub units: [Option<Unit>; MAX_SOURCE_UNITS],
    pub model: factc_semantic::Model,
    pub contracts: [u8; CONTRACT_BYTES],
    pub contracts_len: usize,
    pub metrics: [u8; METRIC_BYTES],
    pub metrics_len: usize,
    pub capability_ir: factc_capability::CapabilityIr,
    pub registry: factc_implementation::Registry,
    pub hypergraph: factc_implementation::Hypergraph,
    pub strategy: factc_planning::CandidateStrategy,
    pub verification: factc_verifier::Verification,
    pub activation: Option<factc_verifier::activation::ActivationReceipt>,
    pub artifact_bytes: [u8; ARTIFACT_BYTES],
    pub artifact_used: usize,
    pub artifacts: BVec<ArtifactSlot, MAX_ARTIFACTS>,
    pub last_status: Status,
}

impl core::fmt::Debug for Workspace {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        f.debug_struct("Workspace")
            .field("sources", &self.sources.len())
            .field("artifacts", &self.artifacts.len())
            .field("status", &self.last_status)
            .finish()
    }
}

impl Workspace {
    pub const fn new() -> Self {
        Workspace {
            source_bytes: [0; SOURCE_BYTES],
            source_used: 0,
            sources: BVec::new(),
            machine_state: [0; MACHINE_STATE_BYTES],
            machine_state_len: 0,
            diagnostics: Diagnostics::new(),
            islands: BVec::new(),
            units: [None, None, None, None, None, None, None, None],
            model: factc_semantic::Model::new(),
            contracts: [0; CONTRACT_BYTES],
            contracts_len: 0,
            metrics: [0; METRIC_BYTES],
            metrics_len: 0,
            capability_ir: factc_capability::CapabilityIr::new(),
            registry: factc_implementation::Registry::new(),
            hypergraph: factc_implementation::Hypergraph::new(),
            strategy: factc_planning::CandidateStrategy::new(),
            verification: factc_verifier::Verification::new(),
            activation: None,
            artifact_bytes: [0; ARTIFACT_BYTES],
            artifact_used: 0,
            artifacts: BVec::new(),
            last_status: Status::Idle,
        }
    }
    pub fn reset(&mut self) {
        self.source_used = 0;
        self.sources.clear();
        self.machine_state_len = 0;
        self.diagnostics.clear();
        self.islands.clear();
        for u in self.units.iter_mut() {
            *u = None;
        }
        self.model.clear();
        self.contracts_len = 0;
        self.metrics_len = 0;
        self.capability_ir.clear();
        self.registry.clear();
        self.hypergraph.clear();
        self.strategy.clear();
        self.verification.clear();
        self.activation = None;
        self.artifact_used = 0;
        self.artifacts.clear();
        self.last_status = Status::Idle;
    }
    pub fn source(&self, unit: &SourceUnit) -> &[u8] {
        &self.source_bytes[unit.off as usize..(unit.off + unit.len) as usize]
    }
    pub fn artifact(&self, i: usize) -> Option<&[u8]> {
        self.artifacts
            .get(i)
            .map(|a| &self.artifact_bytes[a.off as usize..(a.off + a.len) as usize])
    }
    /// Copy rendered bytes into the artifact arena and register the envelope.  Returns the artifact index.
    pub fn store_artifact(
        &mut self,
        kind: ArtifactKind,
        producer: &'static str,
        status: ArtifactStatus,
        bytes: &[u8],
        inputs: &[u32],
        system: Option<u32>,
    ) -> Result<u32, ArenaExhausted> {
        if self.artifact_used + bytes.len() > ARTIFACT_BYTES
            || self.artifacts.len() >= self.artifacts.capacity()
        {
            return Err(ArenaExhausted);
        }
        let off = self.artifact_used;
        self.artifact_bytes[off..off + bytes.len()].copy_from_slice(bytes);
        self.artifact_used += bytes.len();
        let mut ins = [None; MAX_INPUT_IDS];
        for (i, x) in inputs.iter().take(MAX_INPUT_IDS).enumerate() {
            ins[i] = Some(*x);
        }
        let id = self.artifacts.len() as u32;
        let slot = ArtifactSlot {
            id,
            kind,
            schema_version: 1,
            producer,
            status,
            sha256: factc_foundation::sha256::digest(bytes),
            off: off as u32,
            len: bytes.len() as u32,
            inputs: ins,
            system,
        };
        self.artifacts.push(slot).map_err(|_| ArenaExhausted)?;
        Ok(id)
    }
}

impl Default for Workspace {
    fn default() -> Self {
        Self::new()
    }
}
