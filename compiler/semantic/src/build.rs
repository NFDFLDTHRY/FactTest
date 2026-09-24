//! SystemAst -> ResolvedSystem -> TypedSystemIR construction (ASCII-GRAMMAR.md sections 20-21,
//! SEMANTIC-MODEL.md sections 4-5, 16).  Three passes: declare, resolve, check.  Source order is not semantic.

use crate::model::*;
use factc_foundation::{DiagCode, Diagnostic, Diagnostics, Phase, SourceId, Span, Str};
use factc_source::{ExprKind, ParsedUnit, Ref, Stmt};

pub type Units<'a> = &'a [(
    &'a ParsedUnit<
        { factc_foundation::limits::MAX_ISLANDS },
        { factc_foundation::limits::MAX_EXPR_NODES },
    >,
    &'a [u8],
)];

struct Ctx<'a, const D: usize> {
    m: &'a mut Model,
    diags: &'a mut Diagnostics<D>,
    src: &'a [u8],
    source: SourceId,
    sys: u32,
    ok: bool,
}

impl<'a, const D: usize> Ctx<'a, D> {
    fn text(&self, s: Span) -> &'a [u8] {
        s.slice(self.src)
    }
    fn intern(&mut self, s: Span) -> Str {
        let bytes = s.slice(self.src);
        match self.m.text.intern(bytes) {
            Ok(x) => x,
            Err(_) => {
                self.fail(DiagCode::WorkspaceExhausted, s, "text arena exhausted");
                Str::EMPTY
            }
        }
    }
    fn fail(&mut self, code: DiagCode, span: Span, class: &'static str) {
        self.ok = false;
        self.diags.push(Diagnostic::new(
            code,
            phase_of(code),
            self.source,
            Some(span),
            class,
        ));
    }
    fn fail_rel(&mut self, code: DiagCode, span: Span, related: Span, class: &'static str) {
        self.ok = false;
        self.diags.push(
            Diagnostic::new(code, phase_of(code), self.source, Some(span), class)
                .with_related(related),
        );
    }
    fn exhausted(&mut self, span: Span) {
        self.fail(
            DiagCode::WorkspaceExhausted,
            span,
            "semantic arena exhausted",
        );
    }

    // ---------- namespace lookups (local system) ----------
    fn find_type(&self, sys: u32, name: &[u8]) -> Option<u32> {
        self.m
            .types
            .iter()
            .position(|t| t.sys == sys && self.m.text.eq_bytes(t.name, name))
            .map(|i| i as u32)
    }
    fn find_component(&self, sys: u32, name: &[u8]) -> Option<u32> {
        self.m
            .components
            .iter()
            .position(|c| c.sys == sys && self.m.text.eq_bytes(c.name, name))
            .map(|i| i as u32)
    }
    fn find_port(&self, comp: u32, name: &[u8]) -> Option<u32> {
        self.m
            .ports
            .iter()
            .position(|p| p.comp == comp && self.m.text.eq_bytes(p.name, name))
            .map(|i| i as u32)
    }
    fn find_effect(&self, sys: u32, name: &[u8]) -> Option<u32> {
        self.m
            .effects
            .iter()
            .position(|n| n.sys == sys && self.m.text.eq_bytes(n.name, name))
            .map(|i| i as u32)
    }
    fn find_capability(&self, sys: u32, name: &[u8]) -> Option<u32> {
        self.m
            .capabilities
            .iter()
            .position(|n| n.sys == sys && self.m.text.eq_bytes(n.name, name))
            .map(|i| i as u32)
    }
    fn find_implementation(&self, sys: u32, name: &[u8]) -> Option<u32> {
        self.m
            .implementations
            .iter()
            .position(|n| n.sys == sys && self.m.text.eq_bytes(n.name, name))
            .map(|i| i as u32)
    }
    fn find_objective(&self, sys: u32, name: &[u8]) -> Option<u32> {
        self.m
            .objectives
            .iter()
            .position(|n| n.sys == sys && self.m.text.eq_bytes(n.name, name))
            .map(|i| i as u32)
    }
    fn find_resource(&self, sys: u32, name: &[u8]) -> Option<u32> {
        self.m
            .resources
            .iter()
            .position(|r| r.sys == sys && self.m.text.eq_bytes(r.name, name))
            .map(|i| i as u32)
    }
    fn find_invariant(&self, sys: u32, name: &[u8]) -> Option<u32> {
        self.m
            .invariants
            .iter()
            .position(|r| r.sys == sys && self.m.text.eq_bytes(r.name, name))
            .map(|i| i as u32)
    }
    fn find_test(&self, sys: u32, name: &[u8]) -> Option<u32> {
        self.m
            .tests
            .iter()
            .position(|r| r.sys == sys && self.m.text.eq_bytes(r.name, name))
            .map(|i| i as u32)
    }
    fn find_evidence(&self, sys: u32, name: &[u8]) -> Option<u32> {
        self.m
            .evidences
            .iter()
            .position(|r| r.sys == sys && self.m.text.eq_bytes(r.name, name))
            .map(|i| i as u32)
    }
    fn find_issue(&self, sys: u32, name: &[u8]) -> Option<u32> {
        self.m
            .issues
            .iter()
            .position(|r| r.sys == sys && self.m.text.eq_bytes(r.name, name))
            .map(|i| i as u32)
    }
    fn find_relation(&self, sys: u32, name: &[u8]) -> Option<u32> {
        self.m
            .relations
            .iter()
            .position(|r| r.sys == sys && self.m.text.eq_bytes(r.name, name))
            .map(|i| i as u32)
    }
    fn find_metric(&self, sys: u32, name: &[u8]) -> Option<u32> {
        self.m
            .metrics
            .iter()
            .position(|r| r.sys == sys && self.m.text.eq_bytes(r.name, name))
            .map(|i| i as u32)
    }
    fn find_system(&self, name: &[u8]) -> Option<u32> {
        self.m
            .systems
            .iter()
            .position(|s| self.m.text.eq_bytes(s.name, name))
            .map(|i| i as u32)
    }
    fn imported(&self, name: &[u8]) -> Option<u32> {
        let sys = &self.m.systems[self.sys as usize];
        sys.imports
            .iter()
            .flatten()
            .copied()
            .find(|&i| self.m.text.eq_bytes(self.m.systems[i as usize].name, name))
    }

    /// Generic object reference: all namespaces, unique elaboration required (SEMANTIC-MODEL.md section 16).
    fn resolve_any(&mut self, r: &Ref) -> Option<Obj> {
        let a = self.text(r.a);
        if let Some(sysref) = r.sys {
            // qualified: sys::comp.port (public port only) or sys::comp
            let sname = self.text(sysref);
            let Some(s) = self.imported(sname) else {
                self.fail(
                    DiagCode::UnresolvedName,
                    r.span,
                    "system not imported with @{use}",
                );
                return None;
            };
            return self.resolve_in_foreign(s, r);
        }
        if let Some(b) = r.b {
            // comp.port (local first, then imports)
            let bname = self.text(b);
            if let Some(c) = self.find_component(self.sys, a) {
                return match self.find_port(c, bname) {
                    Some(p) => Some(Obj::Port(p)),
                    None => {
                        self.fail(
                            DiagCode::UnresolvedName,
                            r.span,
                            "port not declared on component",
                        );
                        None
                    }
                };
            }
            // imported public ports
            let mut found: Option<Obj> = None;
            let mut count = 0;
            let sys = self.m.systems[self.sys as usize];
            for s in sys.imports.iter().flatten() {
                if let Some(c) = self.find_component(*s, a) {
                    if let Some(p) = self.find_port(c, bname) {
                        count += 1;
                        found = Some(Obj::Port(p));
                    }
                }
            }
            return match count {
                0 => {
                    self.fail(
                        DiagCode::UnresolvedName,
                        r.span,
                        "unresolved component.port reference",
                    );
                    None
                }
                1 => {
                    if let Some(Obj::Port(p)) = found {
                        if !self.m.ports[p as usize].public {
                            self.fail(
                                DiagCode::VisibilityViolation,
                                r.span,
                                "imported port is private",
                            );
                            return None;
                        }
                    }
                    found
                }
                _ => {
                    self.fail(
                        DiagCode::AmbiguousReference,
                        r.span,
                        "reference resolves in more than one imported system",
                    );
                    None
                }
            };
        }
        // bare identifier: every namespace of the local system
        let sys = self.sys;
        let mut hits: [Option<Obj>; 16] = [None; 16];
        let mut n = 0;
        let mut hit = |o: Obj| {
            if n < 16 {
                hits[n] = Some(o);
            }
            n += 1;
        };
        if let Some(i) = self.find_component(sys, a) {
            hit(Obj::Component(i));
        }
        if let Some(i) = self.find_type(sys, a) {
            hit(Obj::Type(i));
        }
        if let Some(i) = self.find_resource(sys, a) {
            hit(Obj::Resource(i));
        }
        if let Some(i) = self.find_effect(sys, a) {
            hit(Obj::Effect(i));
        }
        if let Some(i) = self.find_capability(sys, a) {
            hit(Obj::Capability(i));
        }
        if let Some(i) = self.find_implementation(sys, a) {
            hit(Obj::Implementation(i));
        }
        if let Some(i) = self.find_invariant(sys, a) {
            hit(Obj::Invariant(i));
        }
        if let Some(i) = self.find_test(sys, a) {
            hit(Obj::Test(i));
        }
        if let Some(i) = self.find_evidence(sys, a) {
            hit(Obj::Evidence(i));
        }
        if let Some(i) = self.find_issue(sys, a) {
            hit(Obj::Issue(i));
        }
        if let Some(i) = self.find_relation(sys, a) {
            hit(Obj::Relation(i));
        }
        if let Some(i) = self.find_metric(sys, a) {
            hit(Obj::Metric(i));
        }
        if let Some(i) = self.find_objective(sys, a) {
            hit(Obj::Objective(i));
        }
        if self.m.text.eq_bytes(self.m.systems[sys as usize].name, a) {
            hit(Obj::System(sys));
        }
        match n {
            0 => {
                self.fail(DiagCode::UnresolvedName, r.span, "unresolved identifier");
                None
            }
            1 => hits[0],
            _ => {
                self.fail(DiagCode::AmbiguousReference, r.span, "identifier exists in more than one namespace; qualify by kind-specific directive");
                None
            }
        }
    }

    fn resolve_in_foreign(&mut self, s: u32, r: &Ref) -> Option<Obj> {
        let a = self.text(r.a);
        let Some(c) = self.find_component(s, a) else {
            self.fail(
                DiagCode::UnresolvedName,
                r.span,
                "component not found in imported system",
            );
            return None;
        };
        match r.b {
            Some(b) => {
                let bname = self.text(b);
                match self.find_port(c, bname) {
                    Some(p) if self.m.ports[p as usize].public => Some(Obj::Port(p)),
                    Some(_) => {
                        self.fail(
                            DiagCode::VisibilityViolation,
                            r.span,
                            "external reference to a private port",
                        );
                        None
                    }
                    None => {
                        self.fail(
                            DiagCode::UnresolvedName,
                            r.span,
                            "port not declared on imported component",
                        );
                        None
                    }
                }
            }
            None => {
                self.fail(DiagCode::VisibilityViolation, r.span, "components are private to their system; only public ports are externally referenceable");
                None
            }
        }
    }

    fn resolve_port(&mut self, r: &Ref) -> Option<u32> {
        match self.resolve_any(r) {
            Some(Obj::Port(p)) => Some(p),
            Some(_) => {
                self.fail(
                    DiagCode::UnresolvedName,
                    r.span,
                    "expected a port reference (component.port)",
                );
                None
            }
            None => None,
        }
    }
    fn resolve_component(&mut self, r: &Ref) -> Option<u32> {
        if r.sys.is_some() || r.b.is_some() {
            self.fail(
                DiagCode::UnresolvedName,
                r.span,
                "expected a local component identifier",
            );
            return None;
        }
        let a = self.text(r.a);
        match self.find_component(self.sys, a) {
            Some(c) => Some(c),
            None => {
                self.fail(DiagCode::UnresolvedName, r.span, "unresolved component");
                None
            }
        }
    }
    fn resolve_type(&mut self, r: &Ref) -> Option<u32> {
        if r.sys.is_some() {
            self.fail(
                DiagCode::VisibilityViolation,
                r.span,
                "types are private to their system in language version 1",
            );
            return None;
        }
        if r.b.is_some() {
            self.fail(
                DiagCode::UnresolvedName,
                r.span,
                "expected a type identifier",
            );
            return None;
        }
        let a = self.text(r.a);
        match self.find_type(self.sys, a) {
            Some(t) => Some(t),
            None => {
                self.fail(DiagCode::UnresolvedName, r.span, "unresolved type");
                None
            }
        }
    }
    fn resolve_kind(
        &mut self,
        r: &Ref,
        kind: &'static str,
        find: fn(&Self, u32, &[u8]) -> Option<u32>,
    ) -> Option<u32> {
        if r.sys.is_some() || r.b.is_some() {
            self.fail(DiagCode::UnresolvedName, r.span, kind);
            return None;
        }
        let a = self.text(r.a);
        match find(self, self.sys, a) {
            Some(i) => Some(i),
            None => {
                self.fail(DiagCode::UnresolvedName, r.span, kind);
                None
            }
        }
    }
}

fn phase_of(code: DiagCode) -> Phase {
    match code {
        DiagCode::UnresolvedName
        | DiagCode::DuplicateIdentity
        | DiagCode::AmbiguousReference
        | DiagCode::VisibilityViolation => Phase::Resolve,
        DiagCode::ParseMissingSystem | DiagCode::ParseMultipleSystems => Phase::Parse,
        _ => Phase::Type,
    }
}

/// Build the model from all parsed units.  Returns true when every unit is well-typed.
pub fn build<const D: usize>(units: Units<'_>, m: &mut Model, diags: &mut Diagnostics<D>) -> bool {
    m.clear();
    let mut all_ok = true;
    // ---- pass 0: systems ----
    for (unit, src) in units {
        let mut sys_stmt: Option<(Span, Option<Span>, Span)> = None;
        let mut count = 0;
        for st in unit.statements.iter() {
            if let Stmt::System { id, label } = st.stmt {
                count += 1;
                if sys_stmt.is_none() {
                    sys_stmt = Some((id, label, st.island));
                } else {
                    diags.push(Diagnostic::new(
                        DiagCode::ParseMultipleSystems,
                        Phase::Parse,
                        unit.source,
                        Some(st.island),
                        "more than one @{system} in a source unit",
                    ));
                    all_ok = false;
                }
            }
        }
        let _ = count;
        match sys_stmt {
            None => {
                diags.push(Diagnostic::new(
                    DiagCode::ParseMissingSystem,
                    Phase::Parse,
                    unit.source,
                    None,
                    "source unit declares no @{system}",
                ));
                all_ok = false;
                // still register a placeholder system so later passes can attach diagnostics
                let name = m.text.intern(b"").unwrap_or(Str::EMPTY);
                let _ = m.systems.push(System {
                    name,
                    label: None,
                    source: unit.source,
                    span: Span::new(unit.source, 0, 0).unwrap_or_default(),
                    imports: [None; 8],
                });
            }
            Some((id, label, island)) => {
                let name = m.text.intern(id.slice(src)).unwrap_or(Str::EMPTY);
                let label = label.map(|l| m.text.intern(l.slice(src)).unwrap_or(Str::EMPTY));
                if m.systems
                    .iter()
                    .any(|s| m.text.eq(s.name, name) && !name.is_empty())
                {
                    diags.push(Diagnostic::new(
                        DiagCode::DuplicateIdentity,
                        Phase::Resolve,
                        unit.source,
                        Some(island),
                        "duplicate SystemId across source units",
                    ));
                    all_ok = false;
                }
                let _ = m.systems.push(System {
                    name,
                    label,
                    source: unit.source,
                    span: island,
                    imports: [None; 8],
                });
            }
        }
    }
    // ---- pass 1: declarations per unit ----
    for (ui, (unit, src)) in units.iter().enumerate() {
        let mut cx = Ctx {
            m: &mut *m,
            diags: &mut *diags,
            src,
            source: unit.source,
            sys: ui as u32,
            ok: true,
        };
        declare(&mut cx, unit);
        all_ok &= cx.ok;
    }
    // ---- pass 2: resolution ----
    for (ui, (unit, src)) in units.iter().enumerate() {
        let mut cx = Ctx {
            m: &mut *m,
            diags: &mut *diags,
            src,
            source: unit.source,
            sys: ui as u32,
            ok: true,
        };
        resolve(&mut cx, unit);
        all_ok &= cx.ok;
    }
    // ---- pass 3: typed/structural checks ----
    let mut cx = Ctx {
        m: &mut *m,
        diags: &mut *diags,
        src: &[],
        source: SourceId::new(0),
        sys: 0,
        ok: true,
    };
    check(&mut cx);
    all_ok &= cx.ok;
    m.well_typed = all_ok;
    all_ok
}

fn declare<const D: usize>(
    cx: &mut Ctx<'_, D>,
    unit: &ParsedUnit<
        { factc_foundation::limits::MAX_ISLANDS },
        { factc_foundation::limits::MAX_EXPR_NODES },
    >,
) {
    let sys = cx.sys;
    for st in unit.statements.iter() {
        let island = st.island;
        match st.stmt {
            Stmt::Use { id } => {
                let name = cx.text(id);
                match cx.find_system(name) {
                    Some(s) if s != sys => {
                        let imports = &mut cx.m.systems[sys as usize].imports;
                        if let Some(slot) = imports.iter_mut().find(|x| x.is_none()) {
                            *slot = Some(s);
                        } else {
                            cx.exhausted(island);
                        }
                    }
                    _ => cx.fail(
                        DiagCode::UnresolvedName,
                        island,
                        "@{use} names a system that is not submitted",
                    ),
                }
            }
            Stmt::Type { id } | Stmt::Alias { id, .. } => {
                let name = cx.text(id);
                if let Some(prev) = cx.find_type(sys, name) {
                    let ps = cx.m.types[prev as usize].span;
                    cx.fail_rel(DiagCode::DuplicateIdentity, island, ps, "duplicate TypeId");
                    continue;
                }
                let n = cx.intern(id);
                if cx
                    .m
                    .types
                    .push(Type {
                        sys,
                        name: n,
                        span: island,
                        alias_of: None,
                    })
                    .is_err()
                {
                    cx.exhausted(island);
                }
            }
            Stmt::Component {
                id,
                label,
                subsystem,
            } => {
                let name = cx.text(id);
                if let Some(prev) = cx.find_component(sys, name) {
                    let ps = cx.m.components[prev as usize].span;
                    cx.fail_rel(
                        DiagCode::DuplicateIdentity,
                        island,
                        ps,
                        "duplicate ComponentId",
                    );
                    continue;
                }
                let n = cx.intern(id);
                let l = label.map(|l| cx.intern(l));
                if cx
                    .m
                    .components
                    .push(Component {
                        sys,
                        name: n,
                        label: l,
                        span: island,
                        subsystem,
                        parent: None,
                    })
                    .is_err()
                {
                    cx.exhausted(island);
                }
            }
            Stmt::Resource { id, .. } => {
                let name = cx.text(id);
                if let Some(prev) = cx.find_resource(sys, name) {
                    let ps = cx.m.resources[prev as usize].span;
                    cx.fail_rel(
                        DiagCode::DuplicateIdentity,
                        island,
                        ps,
                        "duplicate ResourceId",
                    );
                    continue;
                }
                let n = cx.intern(id);
                if cx
                    .m
                    .resources
                    .push(Resource {
                        sys,
                        name: n,
                        span: island,
                        ty: None,
                        owner: None,
                    })
                    .is_err()
                {
                    cx.exhausted(island);
                }
            }
            Stmt::Effect { id } => {
                let name = cx.text(id);
                if let Some(prev) = cx.find_effect(sys, name) {
                    let ps = cx.m.effects[prev as usize].span;
                    cx.fail_rel(
                        DiagCode::DuplicateIdentity,
                        island,
                        ps,
                        "duplicate EffectId",
                    );
                    continue;
                }
                let n = cx.intern(id);
                if cx
                    .m
                    .effects
                    .push(Named {
                        sys,
                        name: n,
                        span: island,
                    })
                    .is_err()
                {
                    cx.exhausted(island);
                }
            }
            Stmt::Capability { id } => {
                let name = cx.text(id);
                if let Some(prev) = cx.find_capability(sys, name) {
                    let ps = cx.m.capabilities[prev as usize].span;
                    cx.fail_rel(
                        DiagCode::DuplicateIdentity,
                        island,
                        ps,
                        "duplicate CapabilityId",
                    );
                    continue;
                }
                let n = cx.intern(id);
                if cx
                    .m
                    .capabilities
                    .push(Named {
                        sys,
                        name: n,
                        span: island,
                    })
                    .is_err()
                {
                    cx.exhausted(island);
                }
            }
            Stmt::Implementation { id } => {
                let name = cx.text(id);
                if let Some(prev) = cx.find_implementation(sys, name) {
                    let ps = cx.m.implementations[prev as usize].span;
                    cx.fail_rel(
                        DiagCode::DuplicateIdentity,
                        island,
                        ps,
                        "duplicate ImplementationId",
                    );
                    continue;
                }
                let n = cx.intern(id);
                if cx
                    .m
                    .implementations
                    .push(Named {
                        sys,
                        name: n,
                        span: island,
                    })
                    .is_err()
                {
                    cx.exhausted(island);
                }
            }
            Stmt::Invariant { id, expr } => {
                let name = cx.text(id);
                if let Some(prev) = cx.find_invariant(sys, name) {
                    let ps = cx.m.invariants[prev as usize].span;
                    cx.fail_rel(
                        DiagCode::DuplicateIdentity,
                        island,
                        ps,
                        "duplicate InvariantId",
                    );
                    continue;
                }
                let n = cx.intern(id);
                // copy the expression subtree into the model arena (indices are remapped by offset)
                let base = cx.m.exprs.len() as u32;
                let mut ok = true;
                for node in unit.exprs.iter() {
                    let mut nn = *node;
                    nn.first_child = nn.first_child.map(|c| c + base);
                    nn.next_sibling = nn.next_sibling.map(|c| c + base);
                    if cx
                        .m
                        .exprs
                        .push(RExpr {
                            node: nn,
                            args: [None, None],
                        })
                        .is_err()
                    {
                        ok = false;
                        break;
                    }
                }
                if !ok {
                    cx.exhausted(island);
                    continue;
                }
                if cx
                    .m
                    .invariants
                    .push(Invariant {
                        sys,
                        name: n,
                        span: island,
                        expr: expr + base,
                        holds: None,
                    })
                    .is_err()
                {
                    cx.exhausted(island);
                }
            }
            Stmt::Test { id, kind } => {
                let name = cx.text(id);
                if let Some(prev) = cx.find_test(sys, name) {
                    let ps = cx.m.tests[prev as usize].span;
                    cx.fail_rel(DiagCode::DuplicateIdentity, island, ps, "duplicate TestId");
                    continue;
                }
                let n = cx.intern(id);
                if cx
                    .m
                    .tests
                    .push(Test {
                        sys,
                        name: n,
                        span: island,
                        kind,
                    })
                    .is_err()
                {
                    cx.exhausted(island);
                }
            }
            Stmt::Evidence { id, kind } => {
                let name = cx.text(id);
                if let Some(prev) = cx.find_evidence(sys, name) {
                    let ps = cx.m.evidences[prev as usize].span;
                    cx.fail_rel(
                        DiagCode::DuplicateIdentity,
                        island,
                        ps,
                        "duplicate EvidenceId",
                    );
                    continue;
                }
                let n = cx.intern(id);
                if cx
                    .m
                    .evidences
                    .push(Evidence {
                        sys,
                        name: n,
                        span: island,
                        kind,
                    })
                    .is_err()
                {
                    cx.exhausted(island);
                }
            }
            Stmt::Issue { id, status, desc } => {
                let name = cx.text(id);
                if let Some(prev) = cx.find_issue(sys, name) {
                    let ps = cx.m.issues[prev as usize].span;
                    cx.fail_rel(DiagCode::DuplicateIdentity, island, ps, "duplicate IssueId");
                    continue;
                }
                let n = cx.intern(id);
                let d = cx.intern(desc);
                if cx
                    .m
                    .issues
                    .push(Issue {
                        sys,
                        name: n,
                        span: island,
                        status,
                        desc: d,
                    })
                    .is_err()
                {
                    cx.exhausted(island);
                }
            }
            Stmt::Metric { id, unit: u, desc } => {
                let name = cx.text(id);
                if let Some(prev) = cx.find_metric(sys, name) {
                    let ps = cx.m.metrics[prev as usize].span;
                    cx.fail_rel(
                        DiagCode::DuplicateIdentity,
                        island,
                        ps,
                        "duplicate MetricId",
                    );
                    continue;
                }
                let n = cx.intern(id);
                let un = cx.intern(u);
                let d = desc.map(|d| cx.intern(d));
                if cx
                    .m
                    .metrics
                    .push(Metric {
                        sys,
                        name: n,
                        span: island,
                        unit: un,
                        desc: d,
                    })
                    .is_err()
                {
                    cx.exhausted(island);
                }
            }
            Stmt::Objective { id } => {
                let name = cx.text(id);
                if let Some(prev) = cx.find_objective(sys, name) {
                    let ps = cx.m.objectives[prev as usize].span;
                    cx.fail_rel(
                        DiagCode::DuplicateIdentity,
                        island,
                        ps,
                        "duplicate ObjectiveId",
                    );
                    continue;
                }
                let n = cx.intern(id);
                if cx
                    .m
                    .objectives
                    .push(Named {
                        sys,
                        name: n,
                        span: island,
                    })
                    .is_err()
                {
                    cx.exhausted(island);
                }
            }
            Stmt::Data { id, .. } | Stmt::Sequence { id, .. } => {
                let name = cx.text(id);
                if let Some(prev) = cx.find_relation(sys, name) {
                    let ps = cx.m.relations[prev as usize].span;
                    cx.fail_rel(
                        DiagCode::DuplicateIdentity,
                        island,
                        ps,
                        "duplicate RelationId",
                    );
                    continue;
                }
                let n = cx.intern(id);
                let kind = if matches!(st.stmt, Stmt::Data { .. }) {
                    RelKind::Data
                } else {
                    RelKind::Sequence
                };
                let mode = if let Stmt::Data { mode, .. } = st.stmt {
                    Some(mode)
                } else {
                    None
                };
                // endpoints resolved in pass 2; placeholders now
                if cx
                    .m
                    .relations
                    .push(Relation {
                        sys,
                        name: n,
                        span: island,
                        kind,
                        from: Obj::System(sys),
                        to: Obj::System(sys),
                        mode,
                    })
                    .is_err()
                {
                    cx.exhausted(island);
                }
            }
            _ => {}
        }
    }
    // ports need components + types: second sweep within declarations (order-insensitive)
    for st in unit.statements.iter() {
        if let Stmt::Port {
            comp,
            port,
            dir,
            ty,
            public,
        } = st.stmt
        {
            let island = st.island;
            let Some(c) = cx.resolve_component(&comp) else {
                continue;
            };
            let pname = cx.text(port);
            if let Some(prev) = cx.find_port(c, pname) {
                let ps = cx.m.ports[prev as usize].span;
                cx.fail_rel(
                    DiagCode::DuplicateIdentity,
                    island,
                    ps,
                    "duplicate PortId on component",
                );
                continue;
            }
            let Some(t) = cx.resolve_type(&ty) else {
                continue;
            };
            let n = cx.intern(port);
            if cx
                .m
                .ports
                .push(Port {
                    comp: c,
                    name: n,
                    span: island,
                    dir,
                    ty: t,
                    public,
                })
                .is_err()
            {
                cx.exhausted(island);
            }
        }
    }
}

fn resolve<const D: usize>(
    cx: &mut Ctx<'_, D>,
    unit: &ParsedUnit<
        { factc_foundation::limits::MAX_ISLANDS },
        { factc_foundation::limits::MAX_EXPR_NODES },
    >,
) {
    let sys = cx.sys;
    let mut inv_counter = 0u32;
    for st in unit.statements.iter() {
        let island = st.island;
        match st.stmt {
            Stmt::Alias { id, target } => {
                let name = cx.text(id);
                let Some(me) = cx.find_type(sys, name) else {
                    continue;
                };
                if let Some(t) = cx.resolve_type(&target) {
                    if t == me {
                        cx.fail(DiagCode::UnresolvedName, island, "alias of itself");
                    } else {
                        cx.m.types[me as usize].alias_of = Some(t);
                    }
                }
            }
            Stmt::Resource { id, ty: Some(ty) } => {
                let name = cx.text(id);
                let Some(me) = cx.find_resource(sys, name) else {
                    continue;
                };
                if let Some(t) = cx.resolve_type(&ty) {
                    cx.m.resources[me as usize].ty = Some(t);
                }
            }
            Stmt::Contains { sub, obj } => {
                let Some(s) = cx.resolve_component(&sub) else {
                    continue;
                };
                if !cx.m.components[s as usize].subsystem {
                    cx.fail(
                        DiagCode::UnresolvedName,
                        island,
                        "contains requires a @{subsystem} container",
                    );
                    continue;
                }
                let Some(o) = cx.resolve_any(&obj) else {
                    continue;
                };
                if let Obj::Component(c) = o {
                    if c == s {
                        cx.fail(
                            DiagCode::UnresolvedName,
                            island,
                            "subsystem cannot contain itself",
                        );
                        continue;
                    }
                    if let Some(prev) = cx.m.components[c as usize].parent {
                        let ps = cx.m.components[prev as usize].span;
                        cx.fail_rel(
                            DiagCode::DuplicateIdentity,
                            island,
                            ps,
                            "object contained by more than one subsystem",
                        );
                        continue;
                    }
                    cx.m.components[c as usize].parent = Some(s);
                }
                push_link(cx, LinkKind::Contains, Obj::Component(s), o, island);
            }
            Stmt::Owns { comp, res } => {
                let Some(c) = cx.resolve_component(&comp) else {
                    continue;
                };
                let Some(r) = cx.resolve_kind(&res, "unresolved resource", |cx, s, n| {
                    cx.find_resource(s, n)
                }) else {
                    continue;
                };
                if let Some(prev) = cx.m.resources[r as usize].owner {
                    let ps = cx.m.components[prev as usize].span;
                    cx.fail_rel(
                        DiagCode::DuplicateIdentity,
                        island,
                        ps,
                        "resource already has a logical owner",
                    );
                    continue;
                }
                cx.m.resources[r as usize].owner = Some(c);
                push_link(
                    cx,
                    LinkKind::Owns,
                    Obj::Component(c),
                    Obj::Resource(r),
                    island,
                );
            }
            Stmt::Data { id, src, dst, .. } => {
                let name = cx.text(id);
                let Some(me) = cx.find_relation(sys, name) else {
                    continue;
                };
                let s = cx.resolve_port(&src);
                let d = cx.resolve_port(&dst);
                if let (Some(s), Some(d)) = (s, d) {
                    cx.m.relations[me as usize].from = Obj::Port(s);
                    cx.m.relations[me as usize].to = Obj::Port(d);
                } else {
                    // keep the relation object (ANALYZE partial graph) but mark unresolved endpoints as system refs
                }
            }
            Stmt::Sequence { id, from, to } => {
                let name = cx.text(id);
                let Some(me) = cx.find_relation(sys, name) else {
                    continue;
                };
                let f = cx.resolve_any(&from);
                let t = cx.resolve_any(&to);
                if let (Some(f), Some(t)) = (f, t) {
                    cx.m.relations[me as usize].from = f;
                    cx.m.relations[me as usize].to = t;
                }
            }
            Stmt::Uses { obj, eff } => {
                let Some(o) = cx.resolve_any(&obj) else {
                    continue;
                };
                let Some(e) =
                    cx.resolve_kind(&eff, "unresolved effect", |cx, s, n| cx.find_effect(s, n))
                else {
                    continue;
                };
                push_link(cx, LinkKind::Uses, o, Obj::Effect(e), island);
            }
            Stmt::Requires { obj, cap } => {
                let Some(o) = cx.resolve_any(&obj) else {
                    continue;
                };
                let Some(c) = cx.resolve_kind(&cap, "unresolved capability", |cx, s, n| {
                    cx.find_capability(s, n)
                }) else {
                    continue;
                };
                push_link(cx, LinkKind::Requires, o, Obj::Capability(c), island);
            }
            Stmt::Pin { obj, imp } => {
                let Some(o) = cx.resolve_any(&obj) else {
                    continue;
                };
                let Some(i) = cx.resolve_kind(&imp, "unresolved implementation", |cx, s, n| {
                    cx.find_implementation(s, n)
                }) else {
                    continue;
                };
                push_link(cx, LinkKind::Pin, o, Obj::Implementation(i), island);
            }
            Stmt::Refines {
                concrete,
                abstract_,
            } => {
                let Some(c) = cx.resolve_component(&concrete) else {
                    continue;
                };
                let Some(a) = cx.resolve_component(&abstract_) else {
                    continue;
                };
                push_link(
                    cx,
                    LinkKind::Refines,
                    Obj::Component(c),
                    Obj::Component(a),
                    island,
                );
            }
            Stmt::Invariant { id, .. } => {
                inv_counter += 1;
                let name = cx.text(id);
                let Some(me) = cx.find_invariant(sys, name) else {
                    continue;
                };
                let root = cx.m.invariants[me as usize].expr;
                resolve_expr(cx, root);
            }
            Stmt::Tests { test, target } => {
                let Some(t) =
                    cx.resolve_kind(&test, "unresolved test", |cx, s, n| cx.find_test(s, n))
                else {
                    continue;
                };
                let Some(o) = cx.resolve_any(&target) else {
                    continue;
                };
                push_link(cx, LinkKind::Tests, Obj::Test(t), o, island);
            }
            Stmt::Witnesses { ev, test } => {
                let Some(e) = cx.resolve_kind(&ev, "unresolved evidence", |cx, s, n| {
                    cx.find_evidence(s, n)
                }) else {
                    continue;
                };
                let Some(t) =
                    cx.resolve_kind(&test, "unresolved test", |cx, s, n| cx.find_test(s, n))
                else {
                    continue;
                };
                push_link(
                    cx,
                    LinkKind::Witnesses,
                    Obj::Evidence(e),
                    Obj::Test(t),
                    island,
                );
            }
            Stmt::Status {
                obj,
                status,
                reason,
            } => {
                let Some(o) = cx.resolve_any(&obj) else {
                    continue;
                };
                let r = reason.map(|r| cx.intern(r));
                if cx
                    .m
                    .statuses
                    .push(StatusTag {
                        obj: o,
                        status,
                        reason: r,
                        span: island,
                    })
                    .is_err()
                {
                    cx.exhausted(island);
                }
            }
            Stmt::Authority { obj, url } => {
                let Some(o) = cx.resolve_any(&obj) else {
                    continue;
                };
                let u = cx.intern(url);
                if cx
                    .m
                    .authorities
                    .push(Authority {
                        obj: o,
                        url: u,
                        span: island,
                    })
                    .is_err()
                {
                    cx.exhausted(island);
                }
            }
            Stmt::Goal {
                obj,
                priority,
                dir,
                metric,
            } => {
                let Some(o) = cx.resolve_kind(&obj, "unresolved objective", |cx, s, n| {
                    cx.find_objective(s, n)
                }) else {
                    continue;
                };
                let Some(mtr) = cx.resolve_kind(
                    &metric,
                    "objective references an undeclared MetricId",
                    |cx, s, n| cx.find_metric(s, n),
                ) else {
                    continue;
                };
                let dup =
                    cx.m.goals
                        .iter()
                        .find(|g| g.objective == o && g.priority == priority)
                        .map(|g| g.span);
                if let Some(ps) = dup {
                    cx.fail_rel(
                        DiagCode::DuplicateGoalPriority,
                        island,
                        ps,
                        "goal priorities within one objective must be unique",
                    );
                    continue;
                }
                if cx
                    .m
                    .goals
                    .push(Goal {
                        objective: o,
                        priority,
                        dir,
                        metric: mtr,
                        span: island,
                    })
                    .is_err()
                {
                    cx.exhausted(island);
                }
            }
            Stmt::Hard {
                obj,
                metric,
                cmp,
                value,
            } => {
                let Some(o) = cx.resolve_kind(&obj, "unresolved objective", |cx, s, n| {
                    cx.find_objective(s, n)
                }) else {
                    continue;
                };
                let Some(mtr) = cx.resolve_kind(
                    &metric,
                    "hard constraint references an undeclared MetricId",
                    |cx, s, n| cx.find_metric(s, n),
                ) else {
                    continue;
                };
                if cx
                    .m
                    .hards
                    .push(Hard {
                        objective: o,
                        metric: mtr,
                        cmp,
                        value,
                        span: island,
                    })
                    .is_err()
                {
                    cx.exhausted(island);
                }
            }
            _ => {}
        }
    }
    let _ = inv_counter;
}

fn push_link<const D: usize>(cx: &mut Ctx<'_, D>, kind: LinkKind, a: Obj, b: Obj, span: Span) {
    if cx
        .m
        .links
        .push(Link {
            kind,
            a,
            b,
            span,
            holds: None,
        })
        .is_err()
    {
        cx.exhausted(span);
    }
}

fn resolve_expr<const D: usize>(cx: &mut Ctx<'_, D>, idx: u32) {
    let node = cx.m.exprs[idx as usize].node;
    match node.kind {
        ExprKind::Pred(p) => {
            for k in 0..2 {
                if let Some(r) = node.args[k] {
                    let resolved = cx.resolve_any(&r);
                    cx.m.exprs[idx as usize].args[k] = resolved;
                }
            }
            // arity/type shape checks
            let a = cx.m.exprs[idx as usize].args;
            let shape_ok = match p {
                factc_source::Pred::Connected
                | factc_source::Pred::ExactlyOneProducer
                | factc_source::Pred::HasConsumer => matches!(a[0], Some(Obj::Port(_))),
                factc_source::Pred::TypeEqual => {
                    matches!((a[0], a[1]), (Some(Obj::Port(_)), Some(Obj::Port(_))))
                }
                factc_source::Pred::Owns => matches!(
                    (a[0], a[1]),
                    (Some(Obj::Component(_)), Some(Obj::Resource(_)))
                ),
                factc_source::Pred::Requires => {
                    matches!(a[1], Some(Obj::Capability(_))) && a[0].is_some()
                }
                factc_source::Pred::UsesEffect => {
                    matches!(a[1], Some(Obj::Effect(_))) && a[0].is_some()
                }
                factc_source::Pred::SequenceBefore | factc_source::Pred::Reachable => {
                    a[0].is_some() && a[1].is_some()
                }
                factc_source::Pred::Acyclic => {
                    matches!(a[0], Some(Obj::System(_)) | Some(Obj::Component(_)))
                }
                factc_source::Pred::Public => a[0].is_some(),
                factc_source::Pred::Refines => matches!(
                    (a[0], a[1]),
                    (Some(Obj::Component(_)), Some(Obj::Component(_)))
                ),
            };
            if !shape_ok && a[0].is_some() && (p.arity() == 1 || a[1].is_some()) {
                cx.fail(
                    DiagCode::InvalidInvariantArity,
                    node.span,
                    "predicate argument kind mismatch",
                );
            }
        }
        ExprKind::All | ExprKind::Any | ExprKind::Not => {
            let mut c = node.first_child;
            let mut guard = 0;
            while let Some(ci) = c {
                resolve_expr(cx, ci);
                c = cx.m.exprs[ci as usize].node.next_sibling;
                guard += 1;
                if guard > 512 {
                    break;
                }
            }
        }
    }
}

fn check<const D: usize>(cx: &mut Ctx<'_, D>) {
    // DATA relations: direction, nominal type equality, visibility (SEMANTIC-MODEL.md section 5, 9)
    let n = cx.m.relations.len();
    for i in 0..n {
        let r = cx.m.relations[i];
        if r.kind != RelKind::Data {
            continue;
        }
        let (Obj::Port(s), Obj::Port(d)) = (r.from, r.to) else {
            continue;
        };
        let sp = cx.m.ports[s as usize];
        let dp = cx.m.ports[d as usize];
        cx.source = cx.m.systems[r.sys as usize].source;
        if sp.dir != factc_source::Dir::Out {
            cx.fail_rel(
                DiagCode::DirectionMismatch,
                r.span,
                sp.span,
                "DATA source must be an output port",
            );
        }
        if dp.dir != factc_source::Dir::In {
            cx.fail_rel(
                DiagCode::DirectionMismatch,
                r.span,
                dp.span,
                "DATA destination must be an input port",
            );
        }
        if cx.m.nominal(sp.ty) != cx.m.nominal(dp.ty) {
            cx.fail_rel(
                DiagCode::TypeMismatch,
                r.span,
                sp.span,
                "resolved nominal TypeIds differ and no alias relates them",
            );
        }
        // visibility: a private port may only be referenced from inside its enclosing boundary
        for (p, other) in [(s, d), (d, s)] {
            let pp = cx.m.ports[p as usize];
            if pp.public {
                continue;
            }
            let pc = cx.m.components[pp.comp as usize];
            let oc = cx.m.ports[other as usize].comp;
            let allowed = match pc.parent {
                Some(boundary) => cx.m.inside(Obj::Component(oc), boundary),
                None => cx.m.components[oc as usize].sys == pc.sys,
            };
            if !allowed {
                cx.fail_rel(
                    DiagCode::VisibilityViolation,
                    r.span,
                    pp.span,
                    "DATA relation reaches a private port across its subsystem/system boundary",
                );
            }
        }
    }
}
