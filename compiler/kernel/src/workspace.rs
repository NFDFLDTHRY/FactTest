//! Caller-owned bootstrap workspace (C2): borrowed inputs, bounded arenas, structured capacity errors.

use factc_foundation::limits::*;
use factc_foundation::{ArtifactMeta, BVec, Diagnostics, SourceId, Span};

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

#[derive(Clone, Debug)]
pub struct Workspace {
    pub source_bytes: [u8; SOURCE_BYTES],
    pub source_used: usize,
    pub sources: BVec<SourceUnit, MAX_SOURCE_UNITS>,
    pub machine_state: BVec<u8, 4096>,
    pub diagnostics: Diagnostics<MAX_DIAGNOSTICS>,
    pub artifacts: BVec<ArtifactMetaSlot, MAX_ARTIFACTS>,
    pub last_status: Status,
}

/// ArtifactMeta is not Copy (it carries a BVec); store a compact copyable slot instead.
#[derive(Copy, Clone, Debug)]
pub struct ArtifactMetaSlot {
    pub id: u32,
    pub kind: factc_foundation::ArtifactKind,
    pub schema_version: u32,
    pub producer: &'static str,
    pub status: factc_foundation::ArtifactStatus,
    pub sha256: [u8; 32],
    pub byte_len: u32,
    pub inputs: [Option<u32>; MAX_INPUT_IDS],
}

impl From<&ArtifactMeta> for ArtifactMetaSlot {
    fn from(m: &ArtifactMeta) -> Self {
        let mut inputs = [None; MAX_INPUT_IDS];
        for (i, id) in m.inputs.iter().enumerate() {
            inputs[i] = Some(id.raw());
        }
        ArtifactMetaSlot {
            id: m.id.raw(),
            kind: m.kind,
            schema_version: m.schema_version,
            producer: m.producer,
            status: m.status,
            sha256: m.sha256,
            byte_len: m.byte_len,
            inputs,
        }
    }
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

impl Workspace {
    pub const fn new() -> Self {
        Workspace {
            source_bytes: [0; SOURCE_BYTES],
            source_used: 0,
            sources: BVec::new(),
            machine_state: BVec::new(),
            diagnostics: Diagnostics::new(),
            artifacts: BVec::new(),
            last_status: Status::Idle,
        }
    }
    pub fn reset(&mut self) {
        self.source_used = 0;
        self.sources.clear();
        self.machine_state.clear();
        self.diagnostics.clear();
        self.artifacts.clear();
        self.last_status = Status::Idle;
    }
    pub fn source(&self, unit: &SourceUnit) -> &[u8] {
        &self.source_bytes[unit.off as usize..(unit.off + unit.len) as usize]
    }
}

impl Default for Workspace {
    fn default() -> Self {
        Self::new()
    }
}
