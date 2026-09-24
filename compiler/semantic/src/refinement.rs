//! Refinement law (REFINEMENT-LAW.md section 3).  Concrete C refines abstract A only when the public contract of
//! A is preserved by C: interface, types, direction, effects, capabilities, pins, invariants promised by A.
//! Sequence and failure-contract preservation are not modeled in language version 1 and are reported as such.

use crate::model::*;

#[derive(Copy, Clone, Debug, Default)]
pub struct RefinementResult {
    pub interface: bool,
    pub types: bool,
    pub direction: bool,
    pub effects: bool,
    pub capabilities: bool,
    pub pins: bool,
    pub invariants: bool,
    /// first offending object, for diagnostics
    pub offender: Option<Obj>,
}

impl RefinementResult {
    pub fn holds(&self) -> bool {
        self.interface
            && self.types
            && self.direction
            && self.effects
            && self.capabilities
            && self.pins
            && self.invariants
    }
}

/// Effects/capabilities used by `c` or by anything contained in `c` (transitively).
fn collected_links(m: &Model, c: u32, kind: LinkKind, mut f: impl FnMut(Obj)) {
    for l in m.links.iter().filter(|l| l.kind == kind) {
        let owner = match l.a {
            Obj::Component(x) => Some(x),
            Obj::Port(p) => Some(m.port_comp(p)),
            _ => None,
        };
        if let Some(o) = owner {
            if o == c || m.inside(Obj::Component(o), c) {
                f(l.b);
            }
        }
    }
}

fn declared_on(m: &Model, a: u32, kind: LinkKind, target: Obj) -> bool {
    m.links
        .iter()
        .any(|l| l.kind == kind && l.a == Obj::Component(a) && l.b == target)
}

pub fn check(m: &Model, c: u32, a: u32) -> RefinementResult {
    let mut r = RefinementResult {
        interface: true,
        types: true,
        direction: true,
        effects: true,
        capabilities: true,
        pins: true,
        invariants: true,
        offender: None,
    };
    // Interface / types / direction: every public port of A has a public port of C with the same PortId.
    for (pi, ap) in m.ports.iter().enumerate() {
        if ap.comp != a || !ap.public {
            continue;
        }
        let cp = m
            .ports
            .iter()
            .find(|cp| cp.comp == c && cp.public && m.text.eq(cp.name, ap.name));
        match cp {
            None => {
                r.interface = false;
                r.offender.get_or_insert(Obj::Port(pi as u32));
            }
            Some(cp) => {
                if cp.dir != ap.dir {
                    r.direction = false;
                    r.offender.get_or_insert(Obj::Port(pi as u32));
                }
                if m.nominal(cp.ty) != m.nominal(ap.ty) {
                    r.types = false;
                    r.offender.get_or_insert(Obj::Port(pi as u32));
                }
            }
        }
    }
    // Effects: every effect used inside C must be surfaced on A.
    collected_links(m, c, LinkKind::Uses, |eff| {
        if !declared_on(m, a, LinkKind::Uses, eff) {
            r.effects = false;
            r.offender.get_or_insert(eff);
        }
    });
    // Capabilities: every semantic capability required inside C must be exposed on A.
    collected_links(m, c, LinkKind::Requires, |cap| {
        if !declared_on(m, a, LinkKind::Requires, cap) {
            r.capabilities = false;
            r.offender.get_or_insert(cap);
        }
    });
    // Pins: an implementation pin promised by A must be honoured by C.
    for l in m
        .links
        .iter()
        .filter(|l| l.kind == LinkKind::Pin && l.a == Obj::Component(a))
    {
        if !declared_on(m, c, LinkKind::Pin, l.b) {
            r.pins = false;
            r.offender.get_or_insert(l.b);
        }
    }
    // Invariants promised by A: every invariant mentioning A (or A's ports) is re-evaluated with C substituted.
    // Invariants that themselves state a refinement obligation (`refines(...)`) are the obligation, not a promise
    // A makes to its users; they are checked through the REFINES links and excluded here (no re-entrancy).
    for inv in m.invariants.iter() {
        if mentions(m, inv.expr, a) && !contains_refines(m, inv.expr) {
            let v = crate::invariants::eval(&substituted(m, a, c), inv.expr);
            if !v {
                r.invariants = false;
                r.offender.get_or_insert(Obj::Component(c));
            }
        }
    }
    r
}

fn contains_refines(m: &Model, idx: u32) -> bool {
    let e = m.exprs[idx as usize];
    if matches!(
        e.node.kind,
        factc_source::ExprKind::Pred(factc_source::Pred::Refines)
    ) {
        return true;
    }
    let mut c = e.node.first_child;
    let mut guard = 0;
    while let Some(ci) = c {
        if contains_refines(m, ci) {
            return true;
        }
        c = m.exprs[ci as usize].node.next_sibling;
        guard += 1;
        if guard > 512 {
            break;
        }
    }
    false
}

fn mentions(m: &Model, idx: u32, comp: u32) -> bool {
    let e = m.exprs[idx as usize];
    let hit = e.args.iter().flatten().any(|o| match *o {
        Obj::Component(x) => x == comp,
        Obj::Port(p) => m.port_comp(p) == comp,
        _ => false,
    });
    if hit {
        return true;
    }
    let mut c = e.node.first_child;
    let mut guard = 0;
    while let Some(ci) = c {
        if mentions(m, ci, comp) {
            return true;
        }
        c = m.exprs[ci as usize].node.next_sibling;
        guard += 1;
        if guard > 512 {
            break;
        }
    }
    false
}

/// A copy of the model where references to abstract `a` (and its ports) are replaced by concrete `c`
/// (and C's same-named ports) inside invariant expressions.  Bounded arenas make this a plain clone.
fn substituted(m: &Model, a: u32, c: u32) -> Model {
    let mut s = m.clone();
    for e in s.exprs.iter_mut() {
        for arg in e.args.iter_mut() {
            *arg = match *arg {
                Some(Obj::Component(x)) if x == a => Some(Obj::Component(c)),
                Some(Obj::Port(p)) if m.port_comp(p) == a => {
                    let name = m.ports[p as usize].name;
                    m.ports
                        .iter()
                        .position(|cp| cp.comp == c && m.text.eq(cp.name, name))
                        .map(|i| Obj::Port(i as u32))
                        .or(Some(Obj::Port(p)))
                }
                other => other,
            };
        }
    }
    s
}

/// Evaluate every `refines` link; record `holds`; return failures via callback with structured reasons.
pub fn evaluate_all(
    m: &mut Model,
    mut on_fail: impl FnMut(&Model, u32, u32, RefinementResult, factc_foundation::Span),
) -> usize {
    let n = m.links.len();
    let mut failures = 0;
    for i in 0..n {
        let l = m.links[i];
        if l.kind != LinkKind::Refines {
            continue;
        }
        let (Obj::Component(c), Obj::Component(a)) = (l.a, l.b) else {
            continue;
        };
        let r = check(m, c, a);
        m.links[i].holds = Some(r.holds());
        if !r.holds() {
            failures += 1;
            on_fail(m, c, a, r, l.span);
        }
    }
    failures
}
