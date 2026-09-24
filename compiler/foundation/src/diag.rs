//! Structured diagnostics (C4).  The machine-readable structure is the identity; text is rendering.

use crate::bvec::{BVec, Exhausted};
use crate::ids::{SourceId, Span};

#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub enum Severity {
    Error,
    Warning,
    Note,
}

#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub enum Phase {
    Bootstrap,
    Scan,
    Parse,
    Resolve,
    Type,
    Obligation,
    Lowering,
    Contracts,
    Planning,
    Verification,
    Codegen,
    Bundle,
    Observe,
}

impl Phase {
    pub const fn name(self) -> &'static str {
        match self {
            Phase::Bootstrap => "BOOTSTRAP",
            Phase::Scan => "SCAN",
            Phase::Parse => "PARSE",
            Phase::Resolve => "RESOLVE",
            Phase::Type => "TYPE",
            Phase::Obligation => "OBLIGATION",
            Phase::Lowering => "LOWERING",
            Phase::Contracts => "CONTRACTS",
            Phase::Planning => "PLANNING",
            Phase::Verification => "VERIFICATION",
            Phase::Codegen => "CODEGEN",
            Phase::Bundle => "BUNDLE",
            Phase::Observe => "OBSERVE",
        }
    }
}

/// Stable machine-readable diagnostic classes.  Names are generic rule identities, never fixture names.
#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Debug)]
#[repr(u16)]
pub enum DiagCode {
    // bootstrap / workspace
    LanguageKernelNotImplemented = 1,
    WorkspaceExhausted = 2,
    OutputTooSmall = 3,
    NoSourceSubmitted = 4,
    // scanner / parser
    ParseUnclosedIsland = 100,
    ParseNestedIsland = 101,
    ParseUnexpected = 102,
    ParseUnknownKeyword = 103,
    ParseBadLiteral = 104,
    ParseMissingSystem = 105,
    ParseMultipleSystems = 106,
    // resolution
    UnresolvedName = 200,
    DuplicateIdentity = 201,
    AmbiguousReference = 202,
    VisibilityViolation = 203,
    // typing / structure
    TypeMismatch = 300,
    DirectionMismatch = 301,
    MissingProducer = 302,
    DuplicateGoalPriority = 303,
    InvalidInvariantArity = 304,
    InvariantFailed = 305,
    RefinementFailed = 306,
    EffectEscape = 307,
    BuildBlockedByGovernance = 308,
    // lowering / contracts
    ContractParse = 400,
    ContractDuplicate = 401,
    ContractUnresolved = 402,
    NoBoundaryRepresentation = 403,
    // planning
    NoLegalPlan = 500,
    // verification
    ProofFailed = 600,
    // bundle
    BundleCheckFailed = 700,
    // observe
    EvidenceParse = 800,
}

impl DiagCode {
    pub const fn name(self) -> &'static str {
        match self {
            DiagCode::LanguageKernelNotImplemented => "LANGUAGE_KERNEL_NOT_IMPLEMENTED",
            DiagCode::WorkspaceExhausted => "WORKSPACE_EXHAUSTED",
            DiagCode::OutputTooSmall => "OUTPUT_TOO_SMALL",
            DiagCode::NoSourceSubmitted => "NO_SOURCE_SUBMITTED",
            DiagCode::ParseUnclosedIsland => "PARSE_UNCLOSED_ISLAND",
            DiagCode::ParseNestedIsland => "PARSE_NESTED_ISLAND",
            DiagCode::ParseUnexpected => "PARSE_UNEXPECTED",
            DiagCode::ParseUnknownKeyword => "PARSE_UNKNOWN_KEYWORD",
            DiagCode::ParseBadLiteral => "PARSE_BAD_LITERAL",
            DiagCode::ParseMissingSystem => "PARSE_MISSING_SYSTEM",
            DiagCode::ParseMultipleSystems => "PARSE_MULTIPLE_SYSTEMS",
            DiagCode::UnresolvedName => "UNRESOLVED_NAME",
            DiagCode::DuplicateIdentity => "DUPLICATE_IDENTITY",
            DiagCode::AmbiguousReference => "AMBIGUOUS_REFERENCE",
            DiagCode::VisibilityViolation => "VISIBILITY_VIOLATION",
            DiagCode::TypeMismatch => "TYPE_MISMATCH",
            DiagCode::DirectionMismatch => "DIRECTION_MISMATCH",
            DiagCode::MissingProducer => "MISSING_PRODUCER",
            DiagCode::DuplicateGoalPriority => "DUPLICATE_GOAL_PRIORITY",
            DiagCode::InvalidInvariantArity => "INVALID_INVARIANT_ARITY",
            DiagCode::InvariantFailed => "INVARIANT_FAILED",
            DiagCode::RefinementFailed => "REFINEMENT_FAILED",
            DiagCode::EffectEscape => "EFFECT_ESCAPE",
            DiagCode::BuildBlockedByGovernance => "BUILD_BLOCKED_BY_GOVERNANCE",
            DiagCode::ContractParse => "CONTRACT_PARSE",
            DiagCode::ContractDuplicate => "CONTRACT_DUPLICATE",
            DiagCode::ContractUnresolved => "CONTRACT_UNRESOLVED",
            DiagCode::NoBoundaryRepresentation => "NO_BOUNDARY_REPRESENTATION",
            DiagCode::NoLegalPlan => "NO_LEGAL_PLAN",
            DiagCode::ProofFailed => "PROOF_FAILED",
            DiagCode::BundleCheckFailed => "BUNDLE_CHECK_FAILED",
            DiagCode::EvidenceParse => "EVIDENCE_PARSE",
        }
    }
    pub const fn severity(self) -> Severity {
        Severity::Error
    }
}

/// Small fixed parameter tuple; meaning is defined per code (C4 "ordered parameters").
#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Debug, Default)]
pub struct Params {
    pub a: u32,
    pub b: u32,
    pub c: u32,
}

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub struct Diagnostic {
    pub code: DiagCode,
    pub severity: Severity,
    pub phase: Phase,
    pub source: SourceId,
    pub primary: Option<Span>,
    pub related: [Option<Span>; 2],
    /// Message class: a static string selecting a rendering template (not identity).
    pub message_class: &'static str,
    pub params: Params,
    pub authority: Option<&'static str>,
}

impl Diagnostic {
    pub const fn new(
        code: DiagCode,
        phase: Phase,
        source: SourceId,
        primary: Option<Span>,
        message_class: &'static str,
    ) -> Diagnostic {
        Diagnostic {
            code,
            severity: code.severity(),
            phase,
            source,
            primary,
            related: [None, None],
            message_class,
            params: Params { a: 0, b: 0, c: 0 },
            authority: None,
        }
    }
    pub const fn with_related(mut self, s: Span) -> Diagnostic {
        if self.related[0].is_none() {
            self.related[0] = Some(s);
        } else {
            self.related[1] = Some(s);
        }
        self
    }
    pub const fn with_params(mut self, a: u32, b: u32, c: u32) -> Diagnostic {
        self.params = Params { a, b, c };
        self
    }
    pub const fn with_authority(mut self, url: &'static str) -> Diagnostic {
        self.authority = Some(url);
        self
    }
    /// Deterministic ordering key: (source, primary span start, code, params).
    pub fn key(&self) -> (u32, u32, u32, u16, u32, u32, u32) {
        let (s, e) = match self.primary {
            Some(sp) => (sp.start(), sp.end()),
            None => (u32::MAX, u32::MAX),
        };
        (
            self.source.raw(),
            s,
            e,
            self.code as u16,
            self.params.a,
            self.params.b,
            self.params.c,
        )
    }
}

#[derive(Clone, Debug)]
pub struct Diagnostics<const N: usize> {
    items: BVec<Diagnostic, N>,
    overflowed: bool,
}

impl<const N: usize> Default for Diagnostics<N> {
    fn default() -> Self {
        Self::new()
    }
}

impl<const N: usize> Diagnostics<N> {
    pub const fn new() -> Self {
        Diagnostics {
            items: BVec::new(),
            overflowed: false,
        }
    }
    pub fn clear(&mut self) {
        self.items.clear();
        self.overflowed = false;
    }
    pub fn push(&mut self, d: Diagnostic) {
        if self.items.push(d).is_err() {
            self.overflowed = true;
        }
    }
    pub fn overflowed(&self) -> bool {
        self.overflowed
    }
    pub fn len(&self) -> usize {
        self.items.len()
    }
    pub fn is_empty(&self) -> bool {
        self.items.is_empty()
    }
    pub fn iter(&self) -> impl Iterator<Item = &Diagnostic> + '_ {
        self.items.iter()
    }
    pub fn has_errors(&self) -> bool {
        self.items.iter().any(|d| d.severity == Severity::Error)
    }
    pub fn has_code(&self, code: DiagCode) -> bool {
        self.items.iter().any(|d| d.code == code)
    }
    pub fn count_code(&self, code: DiagCode) -> usize {
        self.items.iter().filter(|d| d.code == code).count()
    }
    /// Deterministic order regardless of emission order (C4).
    pub fn sort(&mut self) {
        self.items.sort_by_key(|d| d.key());
    }
    pub fn try_push(&mut self, d: Diagnostic) -> Result<(), Exhausted> {
        self.items.push(d).map(|_| ())
    }
}
