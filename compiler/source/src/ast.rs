//! Statement forms of the ASCII language (one per semantic island).  Spans point into the authored source so
//! every diagnostic can name the exact island (L21).  Identity strings are NOT resolved here (that is the
//! semantic crate's job); the AST carries spans of identifier text only.

use factc_foundation::{BVec, Span};

/// Textual reference: `[sys::]a[.b]` — e.g. `ingress`, `ingress.bytes`, `other::ingress.bytes`.
#[derive(Copy, Clone, Debug, Default)]
pub struct Ref {
    pub sys: Option<Span>,
    pub a: Span,
    pub b: Option<Span>,
    pub span: Span,
}

#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub enum Dir {
    In,
    Out,
}

#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub enum Mode {
    Move,
    Borrow,
    Copy,
    Share,
    Observe,
}

impl Mode {
    pub const fn name(self) -> &'static str {
        match self {
            Mode::Move => "move",
            Mode::Borrow => "borrow",
            Mode::Copy => "copy",
            Mode::Share => "share",
            Mode::Observe => "observe",
        }
    }
}

#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub enum TestKind {
    Static,
    Runtime,
    Property,
}

impl TestKind {
    pub const fn name(self) -> &'static str {
        match self {
            TestKind::Static => "static",
            TestKind::Runtime => "runtime",
            TestKind::Property => "property",
        }
    }
}

#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub enum EvidenceKind {
    StaticProof,
    RuntimeProbe,
    Artifact,
    HumanObservation,
}

impl EvidenceKind {
    pub const fn name(self) -> &'static str {
        match self {
            EvidenceKind::StaticProof => "static_proof",
            EvidenceKind::RuntimeProbe => "runtime_probe",
            EvidenceKind::Artifact => "artifact",
            EvidenceKind::HumanObservation => "human_observation",
        }
    }
}

#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub enum GovStatus {
    Obs,
    Run,
    New,
    Gap,
    Err,
    Unk,
}

impl GovStatus {
    pub const fn name(self) -> &'static str {
        match self {
            GovStatus::Obs => "OBS",
            GovStatus::Run => "RUN",
            GovStatus::New => "NEW",
            GovStatus::Gap => "GAP",
            GovStatus::Err => "ERR",
            GovStatus::Unk => "UNK",
        }
    }
    /// Execution-critical unresolved states block BUILD (SEMANTIC-MODEL.md section 11/12).
    pub const fn blocks_build(self) -> bool {
        matches!(self, GovStatus::Gap | GovStatus::Err | GovStatus::Unk)
    }
}

#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub enum GoalDir {
    Minimize,
    Maximize,
}

#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub enum Cmp {
    AtMost,
    AtLeast,
    Equal,
}

impl Cmp {
    pub const fn name(self) -> &'static str {
        match self {
            Cmp::AtMost => "at_most",
            Cmp::AtLeast => "at_least",
            Cmp::Equal => "equal",
        }
    }
}

/// Invariant predicate vocabulary (ASCII-GRAMMAR.md section 14).  Fixed; extension = language version change.
#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub enum Pred {
    Connected,
    ExactlyOneProducer,
    HasConsumer,
    TypeEqual,
    Owns,
    Requires,
    UsesEffect,
    SequenceBefore,
    Reachable,
    Acyclic,
    Public,
    Refines,
}

impl Pred {
    pub const fn name(self) -> &'static str {
        match self {
            Pred::Connected => "connected",
            Pred::ExactlyOneProducer => "exactly_one_producer",
            Pred::HasConsumer => "has_consumer",
            Pred::TypeEqual => "type_equal",
            Pred::Owns => "owns",
            Pred::Requires => "requires",
            Pred::UsesEffect => "uses_effect",
            Pred::SequenceBefore => "sequence_before",
            Pred::Reachable => "reachable",
            Pred::Acyclic => "acyclic",
            Pred::Public => "public",
            Pred::Refines => "refines",
        }
    }
    pub const fn arity(self) -> u8 {
        match self {
            Pred::Connected
            | Pred::ExactlyOneProducer
            | Pred::HasConsumer
            | Pred::Acyclic
            | Pred::Public => 1,
            _ => 2,
        }
    }
    pub fn from_bytes(b: &[u8]) -> Option<Pred> {
        Some(match b {
            b"connected" => Pred::Connected,
            b"exactly_one_producer" => Pred::ExactlyOneProducer,
            b"has_consumer" => Pred::HasConsumer,
            b"type_equal" => Pred::TypeEqual,
            b"owns" => Pred::Owns,
            b"requires" => Pred::Requires,
            b"uses_effect" => Pred::UsesEffect,
            b"sequence_before" => Pred::SequenceBefore,
            b"reachable" => Pred::Reachable,
            b"acyclic" => Pred::Acyclic,
            b"public" => Pred::Public,
            b"refines" => Pred::Refines,
            _ => return None,
        })
    }
}

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum ExprKind {
    Pred(Pred),
    All,
    Any,
    Not,
}

/// Invariant expression node; combinators link children via first_child/next_sibling.
#[derive(Copy, Clone, Debug)]
pub struct ExprNode {
    pub kind: ExprKind,
    pub args: [Option<Ref>; 2],
    pub first_child: Option<u32>,
    pub next_sibling: Option<u32>,
    pub span: Span,
}

#[derive(Copy, Clone, Debug)]
pub enum Stmt {
    System {
        id: Span,
        label: Option<Span>,
    },
    Use {
        id: Span,
    },
    Type {
        id: Span,
    },
    Alias {
        id: Span,
        target: Ref,
    },
    Component {
        id: Span,
        label: Option<Span>,
        subsystem: bool,
    },
    Contains {
        sub: Ref,
        obj: Ref,
    },
    Port {
        comp: Ref,
        port: Span,
        dir: Dir,
        ty: Ref,
        public: bool,
    },
    Resource {
        id: Span,
        ty: Option<Ref>,
    },
    Owns {
        comp: Ref,
        res: Ref,
    },
    Data {
        id: Span,
        src: Ref,
        dst: Ref,
        mode: Mode,
    },
    Sequence {
        id: Span,
        from: Ref,
        to: Ref,
    },
    Effect {
        id: Span,
    },
    Uses {
        obj: Ref,
        eff: Ref,
    },
    Capability {
        id: Span,
    },
    Requires {
        obj: Ref,
        cap: Ref,
    },
    Implementation {
        id: Span,
    },
    Pin {
        obj: Ref,
        imp: Ref,
    },
    Refines {
        concrete: Ref,
        abstract_: Ref,
    },
    Invariant {
        id: Span,
        expr: u32,
    },
    Test {
        id: Span,
        kind: TestKind,
    },
    Tests {
        test: Ref,
        target: Ref,
    },
    Evidence {
        id: Span,
        kind: EvidenceKind,
    },
    Witnesses {
        ev: Ref,
        test: Ref,
    },
    Status {
        obj: Ref,
        status: GovStatus,
        reason: Option<Span>,
    },
    Issue {
        id: Span,
        status: GovStatus,
        desc: Span,
    },
    Authority {
        obj: Ref,
        url: Span,
    },
    Metric {
        id: Span,
        unit: Span,
        desc: Option<Span>,
    },
    Objective {
        id: Span,
    },
    Goal {
        obj: Ref,
        priority: u32,
        dir: GoalDir,
        metric: Ref,
    },
    Hard {
        obj: Ref,
        metric: Ref,
        cmp: Cmp,
        value: i64,
    },
}

#[derive(Copy, Clone, Debug)]
pub struct Statement {
    pub stmt: Stmt,
    /// span of the whole island (`@{...}`)
    pub island: Span,
}

/// One parsed source unit: statements plus the expression arena they reference.
#[derive(Clone, Debug)]
pub struct ParsedUnit<const S: usize, const E: usize> {
    pub source: factc_foundation::SourceId,
    pub statements: BVec<Statement, S>,
    pub exprs: BVec<ExprNode, E>,
}

impl<const S: usize, const E: usize> ParsedUnit<S, E> {
    pub const fn new(source: factc_foundation::SourceId) -> Self {
        ParsedUnit {
            source,
            statements: BVec::new(),
            exprs: BVec::new(),
        }
    }
}
