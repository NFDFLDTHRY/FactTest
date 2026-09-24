//! Invariant kernel evaluation (ASCII-GRAMMAR.md section 14, SEMANTIC-MODEL.md section 10).
//! Finite, deterministic, side-effect free, closed over resolved IDs.

use crate::model::*;
use factc_source::{ExprKind, Pred};

fn port_component(m: &Model, o: Obj) -> Option<u32> {
    match o {
        Obj::Component(c) => Some(c),
        Obj::Port(p) => Some(m.port_comp(p)),
        _ => None,
    }
}

/// Component-level successors over DATA (src comp -> dst comp) and SEQUENCE (obj -> obj) edges.
fn successors(m: &Model, c: u32, mut f: impl FnMut(u32)) {
    for r in m.relations.iter() {
        match r.kind {
            RelKind::Data => {
                if let (Obj::Port(s), Obj::Port(d)) = (r.from, r.to) {
                    if m.port_comp(s) == c {
                        f(m.port_comp(d));
                    }
                }
            }
            RelKind::Sequence => {
                if let (Some(a), Some(b)) = (port_component(m, r.from), port_component(m, r.to)) {
                    if a == c {
                        f(b);
                    }
                }
            }
        }
    }
}

/// Reflexive-transitive reachability over DATA+SEQUENCE component edges (bounded BFS, no allocation).
pub fn reachable(m: &Model, from: u32, to: u32) -> bool {
    if from == to {
        return true;
    }
    let n = m.components.len();
    let mut seen = [false; factc_foundation::limits::MAX_OBJECTS];
    let mut queue = [0u32; factc_foundation::limits::MAX_OBJECTS];
    let (mut head, mut tail) = (0usize, 0usize);
    seen[from as usize] = true;
    queue[tail] = from;
    tail += 1;
    while head < tail {
        let c = queue[head];
        head += 1;
        let mut found = false;
        successors(m, c, |d| {
            if d == to {
                found = true;
            }
            if (d as usize) < n && !seen[d as usize] && tail < queue.len() {
                seen[d as usize] = true;
                queue[tail] = d;
                tail += 1;
            }
        });
        if found {
            return true;
        }
    }
    false
}

/// Transitive sequence_before over SEQUENCE edges only.
pub fn sequence_before(m: &Model, a: Obj, b: Obj) -> bool {
    let (Some(a), Some(b)) = (port_component(m, a), port_component(m, b)) else {
        return false;
    };
    let mut seen = [false; factc_foundation::limits::MAX_OBJECTS];
    let mut queue = [0u32; factc_foundation::limits::MAX_OBJECTS];
    let (mut head, mut tail) = (0usize, 0usize);
    queue[tail] = a;
    tail += 1;
    seen[a as usize] = true;
    while head < tail {
        let c = queue[head];
        head += 1;
        for r in m.relations.iter().filter(|r| r.kind == RelKind::Sequence) {
            if let (Some(x), Some(y)) = (port_component(m, r.from), port_component(m, r.to)) {
                if x == c {
                    if y == b {
                        return true;
                    }
                    if !seen[y as usize] && tail < queue.len() {
                        seen[y as usize] = true;
                        queue[tail] = y;
                        tail += 1;
                    }
                }
            }
        }
    }
    false
}

/// acyclic(scope): no cycle among components inside the scope (system or subsystem) over DATA+SEQUENCE edges.
pub fn acyclic(m: &Model, scope: Obj) -> bool {
    let in_scope = |c: u32| match scope {
        Obj::System(s) => m.components[c as usize].sys == s,
        Obj::Component(sub) => m.inside(Obj::Component(c), sub),
        _ => false,
    };
    for c in 0..m.components.len() as u32 {
        if !in_scope(c) {
            continue;
        }
        // a cycle through c exists iff some successor (in scope) reaches c
        let mut cyc = false;
        successors(m, c, |d| {
            if in_scope(d) && reachable(m, d, c) {
                cyc = true;
            }
        });
        if cyc {
            return false;
        }
    }
    true
}

fn is_public(m: &Model, o: Obj) -> bool {
    match o {
        Obj::Port(p) => m.ports[p as usize].public,
        _ => false,
    }
}

pub fn eval(m: &Model, idx: u32) -> bool {
    let e = m.exprs[idx as usize];
    match e.node.kind {
        ExprKind::Pred(p) => {
            let a = e.args;
            match (p, a[0], a[1]) {
                (Pred::Connected, Some(Obj::Port(x)), _) => m.relations.iter().any(|r| {
                    r.kind == RelKind::Data && (r.from == Obj::Port(x) || r.to == Obj::Port(x))
                }),
                (Pred::ExactlyOneProducer, Some(Obj::Port(x)), _) => {
                    m.relations
                        .iter()
                        .filter(|r| r.kind == RelKind::Data && r.to == Obj::Port(x))
                        .count()
                        == 1
                }
                (Pred::HasConsumer, Some(Obj::Port(x)), _) => m
                    .relations
                    .iter()
                    .any(|r| r.kind == RelKind::Data && r.from == Obj::Port(x)),
                (Pred::TypeEqual, Some(Obj::Port(x)), Some(Obj::Port(y))) => {
                    m.nominal(m.ports[x as usize].ty) == m.nominal(m.ports[y as usize].ty)
                }
                (Pred::Owns, Some(Obj::Component(c)), Some(Obj::Resource(r))) => {
                    m.resources[r as usize].owner == Some(c)
                }
                (Pred::Requires, Some(o), Some(cap @ Obj::Capability(_))) => {
                    m.has_link(LinkKind::Requires, o, cap)
                }
                (Pred::UsesEffect, Some(o), Some(eff @ Obj::Effect(_))) => {
                    m.has_link(LinkKind::Uses, o, eff)
                }
                (Pred::SequenceBefore, Some(x), Some(y)) => sequence_before(m, x, y),
                (Pred::Reachable, Some(x), Some(y)) => {
                    match (port_component(m, x), port_component(m, y)) {
                        (Some(a), Some(b)) => reachable(m, a, b),
                        _ => false,
                    }
                }
                (Pred::Acyclic, Some(scope), _) => acyclic(m, scope),
                (Pred::Public, Some(o), _) => is_public(m, o),
                (Pred::Refines, Some(Obj::Component(c)), Some(Obj::Component(a))) => {
                    crate::refinement::check(m, c, a).holds()
                }
                _ => false,
            }
        }
        ExprKind::Not => e.node.first_child.map(|c| !eval(m, c)).unwrap_or(false),
        ExprKind::All | ExprKind::Any => {
            let want_all = e.node.kind == ExprKind::All;
            let mut c = e.node.first_child;
            let mut result = want_all;
            let mut guard = 0;
            while let Some(ci) = c {
                let v = eval(m, ci);
                if want_all {
                    result &= v;
                } else {
                    result |= v;
                }
                c = m.exprs[ci as usize].node.next_sibling;
                guard += 1;
                if guard > 512 {
                    break;
                }
            }
            result
        }
    }
}

/// Evaluate every invariant, recording `holds`.  Returns the number of failing invariants.
pub fn evaluate_all(m: &mut Model) -> usize {
    let n = m.invariants.len();
    let mut failing = 0;
    for i in 0..n {
        let root = m.invariants[i].expr;
        let v = eval(m, root);
        m.invariants[i].holds = Some(v);
        if !v {
            failing += 1;
        }
    }
    failing
}
