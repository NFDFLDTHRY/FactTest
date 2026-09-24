//! Typed identity domains (C3 + C19).  Different domains are distinct nominal types; no conversion between them
//! exists.  A raw string is never an identity.

macro_rules! typed_id {
    ($($(#[$m:meta])* $name:ident),* $(,)?) => {
        $(
            $(#[$m])*
            #[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Default)]
            pub struct $name(u32);
            impl $name {
                pub const fn new(raw: u32) -> Self { Self(raw) }
                pub const fn raw(self) -> u32 { self.0 }
                pub const fn index(self) -> usize { self.0 as usize }
            }
        )*
    };
}

typed_id! {
    /// Identity of one submitted source unit (host maps files to it; never a path).
    SourceId,
    NodeId,
    SymbolId,
    TypeId,
    CapabilityId,
    ImplementationId,
    InvariantId,
    ObligationId,
    DiagnosticId,
    ArtifactId,
    EvidenceId,
    ReceiptId,
    // C19 closure
    ObjectiveId,
    MetricId,
    RepresentationId,
    ConversionId,
    PlanId,
    StrategyId,
    EpochId,
    ProbeId,
    CodegenRecipeId,
    CertificateId,
    BundleId,
    DeltaId,
    WorkpieceId,
    FixtureId,
    StationId,
    // Pass-4 semantic namespaces
    SystemId,
    ComponentId,
    PortId,
    ResourceId,
    EffectId,
    TestId,
    IssueId,
    RelationId,
}

/// Byte offset inside one source unit.
#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Default)]
pub struct ByteOffset(pub u32);

/// A span always names exactly one source unit and a valid byte interval (start <= end).
#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Default)]
pub struct Span {
    source: SourceId,
    start: ByteOffset,
    end: ByteOffset,
}

impl Span {
    /// Returns `None` when the interval is inverted; an inverted span cannot exist.
    pub const fn new(source: SourceId, start: u32, end: u32) -> Option<Span> {
        if start <= end {
            Some(Span {
                source,
                start: ByteOffset(start),
                end: ByteOffset(end),
            })
        } else {
            None
        }
    }
    pub const fn source(&self) -> SourceId {
        self.source
    }
    pub const fn start(&self) -> u32 {
        self.start.0
    }
    pub const fn end(&self) -> u32 {
        self.end.0
    }
    pub const fn len(&self) -> u32 {
        self.end.0 - self.start.0
    }
    pub const fn is_empty(&self) -> bool {
        self.start.0 == self.end.0
    }
    pub fn slice<'a>(&self, bytes: &'a [u8]) -> &'a [u8] {
        let s = self.start.0 as usize;
        let e = self.end.0 as usize;
        if e <= bytes.len() {
            &bytes[s..e]
        } else {
            &[]
        }
    }
}
