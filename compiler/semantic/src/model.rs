//! The resolved semantic model (SEMANTIC-MODEL.md sections 2-5, 17).  All entries are Copy records in bounded
//! arenas; names are interned `Str` handles compared by bytes.

use factc_foundation::limits::*;
use factc_foundation::{BVec, Span, Str, TextArena};
use factc_source::{Cmp, Dir, EvidenceKind, ExprNode, GoalDir, GovStatus, Mode, TestKind};

/// Resolved object reference across namespaces.
#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub enum Obj {
    System(u32),
    Type(u32),
    Component(u32),
    Port(u32),
    Resource(u32),
    Effect(u32),
    Capability(u32),
    Implementation(u32),
    Invariant(u32),
    Test(u32),
    Evidence(u32),
    Issue(u32),
    Relation(u32),
    Metric(u32),
    Objective(u32),
}

#[derive(Copy, Clone, Debug)]
pub struct System {
    pub name: Str,
    pub label: Option<Str>,
    pub source: factc_foundation::SourceId,
    pub span: Span,
    /// imported systems (indices into systems) for this unit
    pub imports: [Option<u32>; 8],
}

#[derive(Copy, Clone, Debug)]
pub struct Type {
    pub sys: u32,
    pub name: Str,
    pub span: Span,
    /// alias target (resolved nominal type index) — None for a nominal type
    pub alias_of: Option<u32>,
}

#[derive(Copy, Clone, Debug)]
pub struct Component {
    pub sys: u32,
    pub name: Str,
    pub label: Option<Str>,
    pub span: Span,
    pub subsystem: bool,
    /// containing subsystem (component index), if any
    pub parent: Option<u32>,
}

#[derive(Copy, Clone, Debug)]
pub struct Port {
    pub comp: u32,
    pub name: Str,
    pub span: Span,
    pub dir: Dir,
    pub ty: u32,
    pub public: bool,
}

#[derive(Copy, Clone, Debug)]
pub struct Resource {
    pub sys: u32,
    pub name: Str,
    pub span: Span,
    pub ty: Option<u32>,
    pub owner: Option<u32>,
}

#[derive(Copy, Clone, Debug)]
pub struct Named {
    pub sys: u32,
    pub name: Str,
    pub span: Span,
}

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum RelKind {
    Data,
    Sequence,
}

#[derive(Copy, Clone, Debug)]
pub struct Relation {
    pub sys: u32,
    pub name: Str,
    pub span: Span,
    pub kind: RelKind,
    /// Data: src port, dst port.  Sequence: from obj, to obj (encoded as Obj)
    pub from: Obj,
    pub to: Obj,
    pub mode: Option<Mode>,
}

#[derive(Copy, Clone, Debug)]
pub struct Invariant {
    pub sys: u32,
    pub name: Str,
    pub span: Span,
    pub expr: u32,
    /// evaluation result (None until evaluated)
    pub holds: Option<bool>,
}

#[derive(Copy, Clone, Debug)]
pub struct Test {
    pub sys: u32,
    pub name: Str,
    pub span: Span,
    pub kind: TestKind,
}

#[derive(Copy, Clone, Debug)]
pub struct Evidence {
    pub sys: u32,
    pub name: Str,
    pub span: Span,
    pub kind: EvidenceKind,
}

#[derive(Copy, Clone, Debug)]
pub struct Issue {
    pub sys: u32,
    pub name: Str,
    pub span: Span,
    pub status: GovStatus,
    pub desc: Str,
}

#[derive(Copy, Clone, Debug)]
pub struct Metric {
    pub sys: u32,
    pub name: Str,
    pub span: Span,
    pub unit: Str,
    pub desc: Option<Str>,
}

#[derive(Copy, Clone, Debug)]
pub struct Goal {
    pub objective: u32,
    pub priority: u32,
    pub dir: GoalDir,
    pub metric: u32,
    pub span: Span,
}

#[derive(Copy, Clone, Debug)]
pub struct Hard {
    pub objective: u32,
    pub metric: u32,
    pub cmp: Cmp,
    pub value: i64,
    pub span: Span,
}

/// Binary links between objects (uses/requires/pin/owns/contains/refines/tests/witnesses/status/authority).
#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum LinkKind {
    Uses,
    Requires,
    Pin,
    Owns,
    Contains,
    Refines,
    Tests,
    Witnesses,
}

#[derive(Copy, Clone, Debug)]
pub struct Link {
    pub kind: LinkKind,
    pub a: Obj,
    pub b: Obj,
    pub span: Span,
    /// refinement obligation result (Refines only)
    pub holds: Option<bool>,
}

#[derive(Copy, Clone, Debug)]
pub struct StatusTag {
    pub obj: Obj,
    pub status: GovStatus,
    pub reason: Option<Str>,
    pub span: Span,
}

#[derive(Copy, Clone, Debug)]
pub struct Authority {
    pub obj: Obj,
    pub url: Str,
    pub span: Span,
}

/// Resolved invariant expression node (mirrors the source ExprNode with resolved args).
#[derive(Copy, Clone, Debug)]
pub struct RExpr {
    pub node: ExprNode,
    pub args: [Option<Obj>; 2],
}

#[derive(Clone, Debug)]
pub struct Model {
    pub text: TextArena<TEXT_ARENA_BYTES>,
    pub systems: BVec<System, MAX_SOURCE_UNITS>,
    pub types: BVec<Type, MAX_OBJECTS>,
    pub components: BVec<Component, MAX_OBJECTS>,
    pub ports: BVec<Port, MAX_OBJECTS>,
    pub resources: BVec<Resource, 64>,
    pub effects: BVec<Named, 64>,
    pub capabilities: BVec<Named, 64>,
    pub implementations: BVec<Named, 64>,
    pub relations: BVec<Relation, MAX_RELATIONS>,
    pub invariants: BVec<Invariant, 128>,
    pub tests: BVec<Test, 64>,
    pub evidences: BVec<Evidence, 64>,
    pub issues: BVec<Issue, 64>,
    pub metrics: BVec<Metric, 32>,
    pub objectives: BVec<Named, 16>,
    pub goals: BVec<Goal, 32>,
    pub hards: BVec<Hard, 32>,
    pub links: BVec<Link, MAX_RELATIONS>,
    pub statuses: BVec<StatusTag, 128>,
    pub authorities: BVec<Authority, 64>,
    pub exprs: BVec<RExpr, MAX_EXPR_NODES>,
    /// true once every reference resolved and typed checks ran without errors
    pub well_typed: bool,
}

impl Default for Model {
    fn default() -> Self {
        Self::new()
    }
}

impl Model {
    pub const fn new() -> Self {
        Model {
            text: TextArena::new(),
            systems: BVec::new(),
            types: BVec::new(),
            components: BVec::new(),
            ports: BVec::new(),
            resources: BVec::new(),
            effects: BVec::new(),
            capabilities: BVec::new(),
            implementations: BVec::new(),
            relations: BVec::new(),
            invariants: BVec::new(),
            tests: BVec::new(),
            evidences: BVec::new(),
            issues: BVec::new(),
            metrics: BVec::new(),
            objectives: BVec::new(),
            goals: BVec::new(),
            hards: BVec::new(),
            links: BVec::new(),
            statuses: BVec::new(),
            authorities: BVec::new(),
            exprs: BVec::new(),
            well_typed: false,
        }
    }
    pub fn clear(&mut self) {
        *self = Model::new();
    }
    pub fn name(&self, s: Str) -> &[u8] {
        self.text.get(s)
    }
    /// Resolve aliases to the nominal TypeId (bounded walk; cycles yield the last visited).
    pub fn nominal(&self, mut t: u32) -> u32 {
        for _ in 0..16 {
            match self.types.get(t as usize).and_then(|x| x.alias_of) {
                Some(n) => t = n,
                None => return t,
            }
        }
        t
    }
    pub fn port_comp(&self, p: u32) -> u32 {
        self.ports[p as usize].comp
    }
    /// Is object `inner` inside subsystem `sub` (transitively)?
    pub fn inside(&self, obj: Obj, sub: u32) -> bool {
        let mut c = match obj {
            Obj::Component(c) => Some(c),
            Obj::Port(p) => Some(self.port_comp(p)),
            _ => None,
        };
        for _ in 0..32 {
            match c {
                Some(x) if x == sub => return true,
                Some(x) => c = self.components[x as usize].parent,
                None => return false,
            }
        }
        false
    }
    pub fn obj_sys(&self, obj: Obj) -> u32 {
        match obj {
            Obj::System(s) => s,
            Obj::Type(i) => self.types[i as usize].sys,
            Obj::Component(i) => self.components[i as usize].sys,
            Obj::Port(i) => self.components[self.ports[i as usize].comp as usize].sys,
            Obj::Resource(i) => self.resources[i as usize].sys,
            Obj::Effect(i) => self.effects[i as usize].sys,
            Obj::Capability(i) => self.capabilities[i as usize].sys,
            Obj::Implementation(i) => self.implementations[i as usize].sys,
            Obj::Invariant(i) => self.invariants[i as usize].sys,
            Obj::Test(i) => self.tests[i as usize].sys,
            Obj::Evidence(i) => self.evidences[i as usize].sys,
            Obj::Issue(i) => self.issues[i as usize].sys,
            Obj::Relation(i) => self.relations[i as usize].sys,
            Obj::Metric(i) => self.metrics[i as usize].sys,
            Obj::Objective(i) => self.objectives[i as usize].sys,
        }
    }
    pub fn obj_span(&self, obj: Obj) -> Span {
        match obj {
            Obj::System(s) => self.systems[s as usize].span,
            Obj::Type(i) => self.types[i as usize].span,
            Obj::Component(i) => self.components[i as usize].span,
            Obj::Port(i) => self.ports[i as usize].span,
            Obj::Resource(i) => self.resources[i as usize].span,
            Obj::Effect(i) => self.effects[i as usize].span,
            Obj::Capability(i) => self.capabilities[i as usize].span,
            Obj::Implementation(i) => self.implementations[i as usize].span,
            Obj::Invariant(i) => self.invariants[i as usize].span,
            Obj::Test(i) => self.tests[i as usize].span,
            Obj::Evidence(i) => self.evidences[i as usize].span,
            Obj::Issue(i) => self.issues[i as usize].span,
            Obj::Relation(i) => self.relations[i as usize].span,
            Obj::Metric(i) => self.metrics[i as usize].span,
            Obj::Objective(i) => self.objectives[i as usize].span,
        }
    }
    pub fn has_link(&self, kind: LinkKind, a: Obj, b: Obj) -> bool {
        self.links
            .iter()
            .any(|l| l.kind == kind && l.a == a && l.b == b)
    }
    pub fn status_of(&self, obj: Obj) -> Option<GovStatus> {
        self.statuses
            .iter()
            .filter(|s| s.obj == obj)
            .map(|s| s.status)
            .next()
    }
}
