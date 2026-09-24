//! Canonical semantic rendering (SEMANTIC-MODEL.md section 13, ASCII-GRAMMAR.md section 23) and JSON artifact
//! renderings of the SystemAst / TypedSystemIR / obligation set.
//!
//! The canonical rendering is a witness: parse(render(AST)) == AST and render(parse(render(AST))) == render(AST).
//! It contains only semantic islands plus non-semantic grouping prose; no hidden metadata.
#![allow(clippy::needless_range_loop)] // sorted index arrays are bounded stack arrays walked by position

use crate::model::*;
use factc_foundation::json::JsonW;
use factc_foundation::{OutBuf, OutputTooSmall};
use factc_source::{ExprKind, GovStatus};

type R = Result<(), OutputTooSmall>;

fn port_path(m: &Model, p: u32, o: &mut OutBuf<'_>, from_sys: u32) -> R {
    let port = m.ports[p as usize];
    let comp = m.components[port.comp as usize];
    if comp.sys != from_sys {
        o.bytes(m.name(m.systems[comp.sys as usize].name))?;
        o.str("::")?;
    }
    o.bytes(m.name(comp.name))?;
    o.byte(b'.')?;
    o.bytes(m.name(port.name))
}

pub fn obj_path(m: &Model, ob: Obj, o: &mut OutBuf<'_>, from_sys: u32) -> R {
    match ob {
        Obj::Port(p) => port_path(m, p, o, from_sys),
        Obj::System(s) => o.bytes(m.name(m.systems[s as usize].name)),
        Obj::Type(i) => o.bytes(m.name(m.types[i as usize].name)),
        Obj::Component(i) => o.bytes(m.name(m.components[i as usize].name)),
        Obj::Resource(i) => o.bytes(m.name(m.resources[i as usize].name)),
        Obj::Effect(i) => o.bytes(m.name(m.effects[i as usize].name)),
        Obj::Capability(i) => o.bytes(m.name(m.capabilities[i as usize].name)),
        Obj::Implementation(i) => o.bytes(m.name(m.implementations[i as usize].name)),
        Obj::Invariant(i) => o.bytes(m.name(m.invariants[i as usize].name)),
        Obj::Test(i) => o.bytes(m.name(m.tests[i as usize].name)),
        Obj::Evidence(i) => o.bytes(m.name(m.evidences[i as usize].name)),
        Obj::Issue(i) => o.bytes(m.name(m.issues[i as usize].name)),
        Obj::Relation(i) => o.bytes(m.name(m.relations[i as usize].name)),
        Obj::Metric(i) => o.bytes(m.name(m.metrics[i as usize].name)),
        Obj::Objective(i) => o.bytes(m.name(m.objectives[i as usize].name)),
    }
}

pub fn obj_kind(ob: Obj) -> &'static str {
    match ob {
        Obj::Port(_) => "port",
        Obj::System(_) => "system",
        Obj::Type(_) => "type",
        Obj::Component(_) => "component",
        Obj::Resource(_) => "resource",
        Obj::Effect(_) => "effect",
        Obj::Capability(_) => "capability",
        Obj::Implementation(_) => "implementation",
        Obj::Invariant(_) => "invariant",
        Obj::Test(_) => "test",
        Obj::Evidence(_) => "evidence",
        Obj::Issue(_) => "issue",
        Obj::Relation(_) => "relation",
        Obj::Metric(_) => "metric",
        Obj::Objective(_) => "objective",
    }
}

fn quoted(o: &mut OutBuf<'_>, s: &[u8]) -> R {
    o.byte(b'"')?;
    for &b in s {
        if b == b'"' || b == b'\\' {
            o.byte(b'\\')?;
        }
        o.byte(b)?;
    }
    o.byte(b'"')
}

pub fn expr(m: &Model, idx: u32, o: &mut OutBuf<'_>, sys: u32) -> R {
    let e = m.exprs[idx as usize];
    match e.node.kind {
        ExprKind::Pred(p) => {
            o.str(p.name())?;
            o.byte(b'(')?;
            let n = p.arity() as usize;
            for k in 0..n {
                if k > 0 {
                    o.str(", ")?;
                }
                match e.args[k] {
                    Some(ob) => obj_path(m, ob, o, sys)?,
                    None => {
                        if e.node.args[k].is_some() {
                            o.str("<unresolved>")?;
                        }
                    }
                }
            }
            o.byte(b')')
        }
        ExprKind::All | ExprKind::Any | ExprKind::Not => {
            o.str(match e.node.kind {
                ExprKind::All => "all",
                ExprKind::Any => "any",
                _ => "not",
            })?;
            o.byte(b'(')?;
            let mut c = e.node.first_child;
            let mut first = true;
            let mut guard = 0;
            while let Some(ci) = c {
                if !first {
                    o.str(", ")?;
                }
                first = false;
                expr(m, ci, o, sys)?;
                c = m.exprs[ci as usize].node.next_sibling;
                guard += 1;
                if guard > 512 {
                    break;
                }
            }
            o.byte(b')')
        }
    }
}

/// Deterministic ordering helper: indices sorted by name bytes (insertion sort into a bounded array).
fn sorted_by<const N: usize>(
    count: usize,
    mut key: impl FnMut(usize, usize) -> core::cmp::Ordering,
    keep: impl Fn(usize) -> bool,
) -> ([u32; N], usize) {
    let mut idx = [0u32; N];
    let mut n = 0;
    for i in 0..count.min(N) {
        if keep(i) {
            idx[n] = i as u32;
            n += 1;
        }
    }
    for i in 1..n {
        let mut j = i;
        while j > 0 && key(idx[j - 1] as usize, idx[j] as usize) == core::cmp::Ordering::Greater {
            idx.swap(j - 1, j);
            j -= 1;
        }
    }
    (idx, n)
}

struct Lines<'a, 'b> {
    o: &'b mut OutBuf<'a>,
    start: usize,
    width: usize,
}

impl<'a, 'b> Lines<'a, 'b> {
    fn line_begin(&mut self) -> R {
        self.start = self.o.len();
        self.o.str("| ")
    }
    fn line_end(&mut self) -> R {
        let len = self.o.len() - self.start;
        if len > self.width {
            self.width = len;
        }
        self.o.byte(b'\n')
    }
    fn prose(&mut self, s: &str) -> R {
        self.line_begin()?;
        self.o.str(s)?;
        self.line_end()
    }
}

/// Canonical rendering of one system.  Every island on its own line; declarations in deterministic
/// namespace/ID order; grouping headers are prose (non-semantic).
pub fn canonical(m: &Model, sys: u32, out: &mut OutBuf<'_>) -> R {
    let mut l = Lines {
        o: out,
        start: 0,
        width: 0,
    };
    let _ = &l.width;
    let sysrec = m.systems[sys as usize];
    let name_cmp = |a: factc_foundation::Str, b: factc_foundation::Str| m.text.cmp(a, b);
    // fixed-width rules top and bottom (presentation only; island lines may exceed the rule width)
    l.o.byte(b'+')?;
    l.o.fill(b'-', RULE_WIDTH)?;
    l.o.str("+\n")?;
    l.prose("SYSTEM")?;
    l.line_begin()?;
    l.o.str("@{system ")?;
    l.o.bytes(m.name(sysrec.name))?;
    if let Some(lb) = sysrec.label {
        l.o.byte(b' ')?;
        quoted(l.o, m.name(lb))?;
    }
    l.o.byte(b'}')?;
    l.line_end()?;
    // use
    let (imp, n) = sorted_by::<8>(
        8,
        |a, b| {
            name_cmp(
                m.systems[sysrec.imports[a].unwrap_or(0) as usize].name,
                m.systems[sysrec.imports[b].unwrap_or(0) as usize].name,
            )
        },
        |i| sysrec.imports[i].is_some(),
    );
    for k in 0..n {
        let s = sysrec.imports[imp[k] as usize].unwrap();
        l.line_begin()?;
        l.o.str("@{use ")?;
        l.o.bytes(m.name(m.systems[s as usize].name))?;
        l.o.byte(b'}')?;
        l.line_end()?;
    }
    // types (nominal first, then aliases), both by name
    let (ti, tn) = sorted_by::<{ factc_foundation::limits::MAX_OBJECTS }>(
        m.types.len(),
        |a, b| name_cmp(m.types[a].name, m.types[b].name),
        |i| m.types[i].sys == sys,
    );
    if tn > 0 {
        l.prose("TYPES")?;
    }
    for pass in 0..2 {
        for k in 0..tn {
            let t = m.types[ti[k] as usize];
            if (pass == 0) != t.alias_of.is_none() {
                continue;
            }
            l.line_begin()?;
            match t.alias_of {
                None => {
                    l.o.str("@{type ")?;
                    l.o.bytes(m.name(t.name))?;
                }
                Some(a) => {
                    l.o.str("@{alias ")?;
                    l.o.bytes(m.name(t.name))?;
                    l.o.str(" = ")?;
                    l.o.bytes(m.name(m.types[a as usize].name))?;
                }
            }
            l.o.byte(b'}')?;
            l.line_end()?;
        }
    }
    // effects, capabilities, implementations, metrics, objectives (declarations)
    let (ei, en) = sorted_by::<64>(
        m.effects.len(),
        |a, b| name_cmp(m.effects[a].name, m.effects[b].name),
        |i| m.effects[i].sys == sys,
    );
    let (ci, cn) = sorted_by::<64>(
        m.capabilities.len(),
        |a, b| name_cmp(m.capabilities[a].name, m.capabilities[b].name),
        |i| m.capabilities[i].sys == sys,
    );
    let (ii, inn) = sorted_by::<64>(
        m.implementations.len(),
        |a, b| name_cmp(m.implementations[a].name, m.implementations[b].name),
        |i| m.implementations[i].sys == sys,
    );
    if en + cn + inn > 0 {
        l.prose("EFFECTS / CAPABILITIES / IMPLEMENTATIONS")?;
    }
    for k in 0..en {
        l.line_begin()?;
        l.o.str("@{effect ")?;
        l.o.bytes(m.name(m.effects[ei[k] as usize].name))?;
        l.o.byte(b'}')?;
        l.line_end()?;
    }
    for k in 0..cn {
        l.line_begin()?;
        l.o.str("@{capability ")?;
        l.o.bytes(m.name(m.capabilities[ci[k] as usize].name))?;
        l.o.byte(b'}')?;
        l.line_end()?;
    }
    for k in 0..inn {
        l.line_begin()?;
        l.o.str("@{implementation ")?;
        l.o.bytes(m.name(m.implementations[ii[k] as usize].name))?;
        l.o.byte(b'}')?;
        l.line_end()?;
    }
    // components with their ports, links
    let (co, con) = sorted_by::<{ factc_foundation::limits::MAX_OBJECTS }>(
        m.components.len(),
        |a, b| name_cmp(m.components[a].name, m.components[b].name),
        |i| m.components[i].sys == sys,
    );
    if con > 0 {
        l.prose("COMPONENTS")?;
    }
    for k in 0..con {
        let c = co[k];
        let comp = m.components[c as usize];
        l.line_begin()?;
        l.o.str(if comp.subsystem {
            "@{subsystem "
        } else {
            "@{component "
        })?;
        l.o.bytes(m.name(comp.name))?;
        if let Some(lb) = comp.label {
            l.o.byte(b' ')?;
            quoted(l.o, m.name(lb))?;
        }
        l.o.byte(b'}')?;
        l.line_end()?;
        let (pi, pn) = sorted_by::<{ factc_foundation::limits::MAX_OBJECTS }>(
            m.ports.len(),
            |a, b| name_cmp(m.ports[a].name, m.ports[b].name),
            |i| m.ports[i].comp == c,
        );
        for q in 0..pn {
            let p = m.ports[pi[q] as usize];
            l.line_begin()?;
            l.o.str("@{port ")?;
            l.o.bytes(m.name(comp.name))?;
            l.o.byte(b'.')?;
            l.o.bytes(m.name(p.name))?;
            l.o.str(if p.dir == factc_source::Dir::In {
                " in: "
            } else {
                " out: "
            })?;
            l.o.bytes(m.name(m.types[p.ty as usize].name))?;
            l.o.str(if p.public { " public}" } else { " private}" })?;
            l.line_end()?;
        }
    }
    // resources
    let (ri, rn) = sorted_by::<64>(
        m.resources.len(),
        |a, b| name_cmp(m.resources[a].name, m.resources[b].name),
        |i| m.resources[i].sys == sys,
    );
    if rn > 0 {
        l.prose("RESOURCES")?;
    }
    for k in 0..rn {
        let r = m.resources[ri[k] as usize];
        l.line_begin()?;
        l.o.str("@{resource ")?;
        l.o.bytes(m.name(r.name))?;
        if let Some(t) = r.ty {
            l.o.str(": ")?;
            l.o.bytes(m.name(m.types[t as usize].name))?;
        }
        l.o.byte(b'}')?;
        l.line_end()?;
    }
    // links by kind, sorted by rendered endpoints
    let link_words = [
        (LinkKind::Contains, "contains", true),
        (LinkKind::Owns, "owns", true),
        (LinkKind::Uses, "uses", false),
        (LinkKind::Requires, "requires", false),
        (LinkKind::Pin, "pin", false),
        (LinkKind::Refines, "refines", true),
    ];
    let mut any_links = false;
    for (kind, word, arrow) in link_words {
        let (li, ln) = sorted_by::<{ factc_foundation::limits::MAX_RELATIONS }>(
            m.links.len(),
            |a, b| {
                cmp_obj(m, m.links[a].a, m.links[b].a).then(cmp_obj(m, m.links[a].b, m.links[b].b))
            },
            |i| m.links[i].kind == kind && m.obj_sys(m.links[i].a) == sys,
        );
        if ln > 0 && !any_links {
            l.prose("RELATIONS")?;
            any_links = true;
        }
        for k in 0..ln {
            let lk = m.links[li[k] as usize];
            l.line_begin()?;
            l.o.str("@{")?;
            l.o.str(word)?;
            l.o.byte(b' ')?;
            obj_path(m, lk.a, l.o, sys)?;
            l.o.str(if arrow { " -> " } else { " " })?;
            obj_path(m, lk.b, l.o, sys)?;
            l.o.byte(b'}')?;
            l.line_end()?;
        }
    }
    // data / sequence relations by name
    let (rli, rln) = sorted_by::<{ factc_foundation::limits::MAX_RELATIONS }>(
        m.relations.len(),
        |a, b| name_cmp(m.relations[a].name, m.relations[b].name),
        |i| m.relations[i].sys == sys,
    );
    for pass in [RelKind::Data, RelKind::Sequence] {
        for k in 0..rln {
            let r = m.relations[rli[k] as usize];
            if r.kind != pass {
                continue;
            }
            if !any_links {
                l.prose("RELATIONS")?;
                any_links = true;
            }
            l.line_begin()?;
            l.o.str(if r.kind == RelKind::Data {
                "@{data "
            } else {
                "@{sequence "
            })?;
            l.o.bytes(m.name(r.name))?;
            l.o.byte(b' ')?;
            obj_path(m, r.from, l.o, sys)?;
            l.o.str(" -> ")?;
            obj_path(m, r.to, l.o, sys)?;
            if let Some(mode) = r.mode {
                l.o.str(" mode=")?;
                l.o.str(mode.name())?;
            }
            l.o.byte(b'}')?;
            l.line_end()?;
        }
    }
    // invariants, tests, evidence
    let (ni, nn) = sorted_by::<128>(
        m.invariants.len(),
        |a, b| name_cmp(m.invariants[a].name, m.invariants[b].name),
        |i| m.invariants[i].sys == sys,
    );
    if nn > 0 {
        l.prose("INVARIANTS")?;
    }
    for k in 0..nn {
        let inv = m.invariants[ni[k] as usize];
        l.line_begin()?;
        l.o.str("@{invariant ")?;
        l.o.bytes(m.name(inv.name))?;
        l.o.byte(b' ')?;
        expr(m, inv.expr, l.o, sys)?;
        l.o.byte(b'}')?;
        l.line_end()?;
    }
    let (ti2, tn2) = sorted_by::<64>(
        m.tests.len(),
        |a, b| name_cmp(m.tests[a].name, m.tests[b].name),
        |i| m.tests[i].sys == sys,
    );
    let (ev, evn) = sorted_by::<64>(
        m.evidences.len(),
        |a, b| name_cmp(m.evidences[a].name, m.evidences[b].name),
        |i| m.evidences[i].sys == sys,
    );
    if tn2 + evn > 0 {
        l.prose("TESTS / EVIDENCE")?;
    }
    for k in 0..tn2 {
        let t = m.tests[ti2[k] as usize];
        l.line_begin()?;
        l.o.str("@{test ")?;
        l.o.bytes(m.name(t.name))?;
        l.o.byte(b' ')?;
        l.o.str(t.kind.name())?;
        l.o.byte(b'}')?;
        l.line_end()?;
    }
    for k in 0..evn {
        let e = m.evidences[ev[k] as usize];
        l.line_begin()?;
        l.o.str("@{evidence ")?;
        l.o.bytes(m.name(e.name))?;
        l.o.byte(b' ')?;
        l.o.str(e.kind.name())?;
        l.o.byte(b'}')?;
        l.line_end()?;
    }
    for (kind, word) in [
        (LinkKind::Tests, "tests"),
        (LinkKind::Witnesses, "witnesses"),
    ] {
        let (li, ln) = sorted_by::<{ factc_foundation::limits::MAX_RELATIONS }>(
            m.links.len(),
            |a, b| {
                cmp_obj(m, m.links[a].a, m.links[b].a).then(cmp_obj(m, m.links[a].b, m.links[b].b))
            },
            |i| m.links[i].kind == kind && m.obj_sys(m.links[i].a) == sys,
        );
        for k in 0..ln {
            let lk = m.links[li[k] as usize];
            l.line_begin()?;
            l.o.str("@{")?;
            l.o.str(word)?;
            l.o.byte(b' ')?;
            obj_path(m, lk.a, l.o, sys)?;
            l.o.str(" -> ")?;
            obj_path(m, lk.b, l.o, sys)?;
            l.o.byte(b'}')?;
            l.line_end()?;
        }
    }
    // metrics / objectives / goals / hard
    let (mi, mn) = sorted_by::<32>(
        m.metrics.len(),
        |a, b| name_cmp(m.metrics[a].name, m.metrics[b].name),
        |i| m.metrics[i].sys == sys,
    );
    let (oi, on) = sorted_by::<16>(
        m.objectives.len(),
        |a, b| name_cmp(m.objectives[a].name, m.objectives[b].name),
        |i| m.objectives[i].sys == sys,
    );
    if mn + on > 0 {
        l.prose("OBJECTIVES")?;
    }
    for k in 0..mn {
        let mt = m.metrics[mi[k] as usize];
        l.line_begin()?;
        l.o.str("@{metric ")?;
        l.o.bytes(m.name(mt.name))?;
        l.o.byte(b' ')?;
        l.o.bytes(m.name(mt.unit))?;
        if let Some(d) = mt.desc {
            l.o.byte(b' ')?;
            quoted(l.o, m.name(d))?;
        }
        l.o.byte(b'}')?;
        l.line_end()?;
    }
    for k in 0..on {
        let ob = oi[k];
        l.line_begin()?;
        l.o.str("@{objective ")?;
        l.o.bytes(m.name(m.objectives[ob as usize].name))?;
        l.o.byte(b'}')?;
        l.line_end()?;
        let (gi, gn) = sorted_by::<32>(
            m.goals.len(),
            |a, b| m.goals[a].priority.cmp(&m.goals[b].priority),
            |i| m.goals[i].objective == ob,
        );
        for q in 0..gn {
            let g = m.goals[gi[q] as usize];
            l.line_begin()?;
            l.o.str("@{goal ")?;
            l.o.bytes(m.name(m.objectives[ob as usize].name))?;
            l.o.byte(b' ')?;
            l.o.u64(g.priority as u64)?;
            l.o.str(if g.dir == factc_source::GoalDir::Minimize {
                " minimize "
            } else {
                " maximize "
            })?;
            l.o.bytes(m.name(m.metrics[g.metric as usize].name))?;
            l.o.byte(b'}')?;
            l.line_end()?;
        }
        let (hi, hn) = sorted_by::<32>(
            m.hards.len(),
            |a, b| {
                name_cmp(
                    m.metrics[m.hards[a].metric as usize].name,
                    m.metrics[m.hards[b].metric as usize].name,
                )
                .then(m.hards[a].value.cmp(&m.hards[b].value))
            },
            |i| m.hards[i].objective == ob,
        );
        for q in 0..hn {
            let h = m.hards[hi[q] as usize];
            l.line_begin()?;
            l.o.str("@{hard ")?;
            l.o.bytes(m.name(m.objectives[ob as usize].name))?;
            l.o.byte(b' ')?;
            l.o.bytes(m.name(m.metrics[h.metric as usize].name))?;
            l.o.byte(b' ')?;
            l.o.str(h.cmp.name())?;
            l.o.byte(b' ')?;
            l.o.i64(h.value)?;
            l.o.byte(b'}')?;
            l.line_end()?;
        }
    }
    // governance: status, issue, authority
    let (si, sn) = sorted_by::<128>(
        m.statuses.len(),
        |a, b| {
            cmp_obj(m, m.statuses[a].obj, m.statuses[b].obj)
                .then(m.statuses[a].status.cmp(&m.statuses[b].status))
        },
        |i| m.obj_sys(m.statuses[i].obj) == sys,
    );
    let (isi, isn) = sorted_by::<64>(
        m.issues.len(),
        |a, b| name_cmp(m.issues[a].name, m.issues[b].name),
        |i| m.issues[i].sys == sys,
    );
    let (ai, an) = sorted_by::<64>(
        m.authorities.len(),
        |a, b| cmp_obj(m, m.authorities[a].obj, m.authorities[b].obj),
        |i| m.obj_sys(m.authorities[i].obj) == sys,
    );
    if sn + isn + an > 0 {
        l.prose("GOVERNANCE")?;
    }
    for k in 0..sn {
        let s = m.statuses[si[k] as usize];
        l.line_begin()?;
        l.o.str("@{status ")?;
        obj_path(m, s.obj, l.o, sys)?;
        l.o.byte(b' ')?;
        l.o.str(s.status.name())?;
        if let Some(r) = s.reason {
            l.o.byte(b' ')?;
            quoted(l.o, m.name(r))?;
        }
        l.o.byte(b'}')?;
        l.line_end()?;
    }
    for k in 0..isn {
        let is = m.issues[isi[k] as usize];
        l.line_begin()?;
        l.o.str("@{issue ")?;
        l.o.bytes(m.name(is.name))?;
        l.o.byte(b' ')?;
        l.o.str(is.status.name())?;
        l.o.byte(b' ')?;
        quoted(l.o, m.name(is.desc))?;
        l.o.byte(b'}')?;
        l.line_end()?;
    }
    for k in 0..an {
        let a = m.authorities[ai[k] as usize];
        l.line_begin()?;
        l.o.str("@{authority ")?;
        obj_path(m, a.obj, l.o, sys)?;
        l.o.byte(b' ')?;
        quoted(l.o, m.name(a.url))?;
        l.o.byte(b'}')?;
        l.line_end()?;
    }
    l.o.byte(b'+')?;
    l.o.fill(b'-', RULE_WIDTH)?;
    l.o.str("+\n")
}

const RULE_WIDTH: usize = 72;

fn cmp_obj(m: &Model, a: Obj, b: Obj) -> core::cmp::Ordering {
    let ka = (
        obj_kind(a),
        match a {
            Obj::Port(p) => (
                m.components[m.ports[p as usize].comp as usize].name,
                m.ports[p as usize].name,
            ),
            _ => (name_of(m, a), factc_foundation::Str::EMPTY),
        },
    );
    let kb = (
        obj_kind(b),
        match b {
            Obj::Port(p) => (
                m.components[m.ports[p as usize].comp as usize].name,
                m.ports[p as usize].name,
            ),
            _ => (name_of(m, b), factc_foundation::Str::EMPTY),
        },
    );
    ka.0.cmp(kb.0)
        .then(m.text.cmp(ka.1 .0, kb.1 .0))
        .then(m.text.cmp(ka.1 .1, kb.1 .1))
}

fn name_of(m: &Model, o: Obj) -> factc_foundation::Str {
    match o {
        Obj::System(s) => m.systems[s as usize].name,
        Obj::Type(i) => m.types[i as usize].name,
        Obj::Component(i) => m.components[i as usize].name,
        Obj::Port(i) => m.ports[i as usize].name,
        Obj::Resource(i) => m.resources[i as usize].name,
        Obj::Effect(i) => m.effects[i as usize].name,
        Obj::Capability(i) => m.capabilities[i as usize].name,
        Obj::Implementation(i) => m.implementations[i as usize].name,
        Obj::Invariant(i) => m.invariants[i as usize].name,
        Obj::Test(i) => m.tests[i as usize].name,
        Obj::Evidence(i) => m.evidences[i as usize].name,
        Obj::Issue(i) => m.issues[i as usize].name,
        Obj::Relation(i) => m.relations[i as usize].name,
        Obj::Metric(i) => m.metrics[i as usize].name,
        Obj::Objective(i) => m.objectives[i as usize].name,
    }
}

fn jobj(m: &Model, w: &mut JsonW<'_, '_>, ob: Obj, sys: u32, tmp: &mut [u8; 256]) -> R {
    let mut o = OutBuf::new(tmp);
    obj_path(m, ob, &mut o, sys)?;
    let n = o.len();
    w.obj()?;
    w.kv_str("kind", obj_kind(ob).as_bytes())?;
    w.kv_str("path", &tmp[..n])?;
    w.obj_end()
}

/// TypedSystemIR as JSON: typed graph with resolved identities, invariant results, refinement results.
/// Entries are emitted in canonical name order and identified by path, never by arena position, so two sources
/// with the same semantic graph produce byte-identical typed IR (SEMANTIC-MODEL.md section 15).
pub fn typed_ir_json(m: &Model, out: &mut OutBuf<'_>) -> R {
    let mut w = JsonW::new(out);
    let mut tmp = [0u8; 256];
    let name_cmp = |a: factc_foundation::Str, b: factc_foundation::Str| m.text.cmp(a, b);
    w.obj_begin()?;
    w.kv_str("kind", b"TYPED_SYSTEM_IR")?;
    w.kv_uint("schema_version", 1)?;
    w.kv_bool("well_typed", m.well_typed)?;
    w.key("systems")?;
    w.arr()?;
    for (si, s) in m.systems.iter().enumerate() {
        let si = si as u32;
        w.obj()?;
        w.kv_str("name", m.name(s.name))?;
        w.kv_uint("source", s.source.raw() as u64)?;
        w.key("imports")?;
        w.arr()?;
        let (imp, n) = sorted_by::<8>(
            8,
            |a, b| {
                name_cmp(
                    m.systems[s.imports[a].unwrap_or(0) as usize].name,
                    m.systems[s.imports[b].unwrap_or(0) as usize].name,
                )
            },
            |i| s.imports[i].is_some(),
        );
        for k in 0..n {
            w.str(m.name(m.systems[s.imports[imp[k] as usize].unwrap() as usize].name))?;
        }
        w.arr_end()?;
        w.key("types")?;
        w.arr()?;
        let (ti, tn) = sorted_by::<{ factc_foundation::limits::MAX_OBJECTS }>(
            m.types.len(),
            |a, b| name_cmp(m.types[a].name, m.types[b].name),
            |i| m.types[i].sys == si,
        );
        for k in 0..tn {
            let t = m.types[ti[k] as usize];
            w.obj()?;
            w.kv_str("name", m.name(t.name))?;
            w.kv_str("nominal", m.name(m.types[m.nominal(ti[k]) as usize].name))?;
            w.obj_end()?;
        }
        w.arr_end()?;
        w.key("components")?;
        w.arr()?;
        let (co, con) = sorted_by::<{ factc_foundation::limits::MAX_OBJECTS }>(
            m.components.len(),
            |a, b| name_cmp(m.components[a].name, m.components[b].name),
            |i| m.components[i].sys == si,
        );
        for k in 0..con {
            let ci = co[k];
            let c = m.components[ci as usize];
            w.obj()?;
            w.kv_str("name", m.name(c.name))?;
            w.kv_bool("subsystem", c.subsystem)?;
            match c.parent {
                Some(p) => w.kv_str("parent", m.name(m.components[p as usize].name))?,
                None => w.kv_null("parent")?,
            }
            w.key("ports")?;
            w.arr()?;
            let (pi, pn) = sorted_by::<{ factc_foundation::limits::MAX_OBJECTS }>(
                m.ports.len(),
                |a, b| name_cmp(m.ports[a].name, m.ports[b].name),
                |i| m.ports[i].comp == ci,
            );
            for q in 0..pn {
                let p = m.ports[pi[q] as usize];
                w.obj()?;
                w.kv_str("name", m.name(p.name))?;
                w.kv_str(
                    "direction",
                    if p.dir == factc_source::Dir::In {
                        b"in"
                    } else {
                        b"out"
                    },
                )?;
                w.kv_str("type", m.name(m.types[m.nominal(p.ty) as usize].name))?;
                w.kv_bool("public", p.public)?;
                w.obj_end()?;
            }
            w.arr_end()?;
            w.obj_end()?;
        }
        w.arr_end()?;
        w.key("relations")?;
        w.arr()?;
        let (rli, rln) = sorted_by::<{ factc_foundation::limits::MAX_RELATIONS }>(
            m.relations.len(),
            |a, b| name_cmp(m.relations[a].name, m.relations[b].name),
            |i| m.relations[i].sys == si,
        );
        for k in 0..rln {
            let r = m.relations[rli[k] as usize];
            w.obj()?;
            w.kv_str("name", m.name(r.name))?;
            w.kv_str(
                "kind",
                if r.kind == RelKind::Data {
                    b"DATA"
                } else {
                    b"SEQUENCE"
                },
            )?;
            w.key("from")?;
            jobj(m, &mut w, r.from, si, &mut tmp)?;
            w.key("to")?;
            jobj(m, &mut w, r.to, si, &mut tmp)?;
            match r.mode {
                Some(md) => w.kv_str("mode", md.name().as_bytes())?,
                None => w.kv_null("mode")?,
            }
            if let (RelKind::Data, Obj::Port(p)) = (r.kind, r.from) {
                w.kv_str(
                    "type",
                    m.name(m.types[m.nominal(m.ports[p as usize].ty) as usize].name),
                )?;
            }
            w.obj_end()?;
        }
        w.arr_end()?;
        w.key("links")?;
        w.arr()?;
        let (li, ln) = sorted_by::<{ factc_foundation::limits::MAX_RELATIONS }>(
            m.links.len(),
            |a, b| {
                (m.links[a].kind as u8)
                    .cmp(&(m.links[b].kind as u8))
                    .then(cmp_obj(m, m.links[a].a, m.links[b].a))
                    .then(cmp_obj(m, m.links[a].b, m.links[b].b))
            },
            |i| m.obj_sys(m.links[i].a) == si,
        );
        for k in 0..ln {
            let l = m.links[li[k] as usize];
            w.obj()?;
            w.kv_str(
                "kind",
                match l.kind {
                    LinkKind::Uses => b"USES" as &[u8],
                    LinkKind::Requires => b"REQUIRES",
                    LinkKind::Pin => b"PIN",
                    LinkKind::Owns => b"OWNS",
                    LinkKind::Contains => b"CONTAINS",
                    LinkKind::Refines => b"REFINES",
                    LinkKind::Tests => b"TESTS",
                    LinkKind::Witnesses => b"WITNESSES",
                },
            )?;
            w.key("a")?;
            jobj(m, &mut w, l.a, si, &mut tmp)?;
            w.key("b")?;
            jobj(m, &mut w, l.b, si, &mut tmp)?;
            match l.holds {
                Some(h) => w.kv_bool("holds", h)?,
                None => w.kv_null("holds")?,
            }
            w.obj_end()?;
        }
        w.arr_end()?;
        w.key("invariants")?;
        w.arr()?;
        let (ni, nn) = sorted_by::<128>(
            m.invariants.len(),
            |a, b| name_cmp(m.invariants[a].name, m.invariants[b].name),
            |i| m.invariants[i].sys == si,
        );
        for k in 0..nn {
            let inv = m.invariants[ni[k] as usize];
            w.obj()?;
            w.kv_str("name", m.name(inv.name))?;
            let mut o = OutBuf::new(&mut tmp);
            expr(m, inv.expr, &mut o, si)?;
            let n = o.len();
            w.kv_str("expression", &tmp[..n])?;
            match inv.holds {
                Some(h) => w.kv_bool("holds", h)?,
                None => w.kv_null("holds")?,
            }
            w.obj_end()?;
        }
        w.arr_end()?;
        w.key("tests")?;
        w.arr()?;
        let (ti2, tn2) = sorted_by::<64>(
            m.tests.len(),
            |a, b| name_cmp(m.tests[a].name, m.tests[b].name),
            |i| m.tests[i].sys == si,
        );
        for k in 0..tn2 {
            let t = m.tests[ti2[k] as usize];
            w.obj()?;
            w.kv_str("name", m.name(t.name))?;
            w.kv_str("kind", t.kind.name().as_bytes())?;
            w.obj_end()?;
        }
        w.arr_end()?;
        w.key("evidence")?;
        w.arr()?;
        let (ev, evn) = sorted_by::<64>(
            m.evidences.len(),
            |a, b| name_cmp(m.evidences[a].name, m.evidences[b].name),
            |i| m.evidences[i].sys == si,
        );
        for k in 0..evn {
            let e = m.evidences[ev[k] as usize];
            w.obj()?;
            w.kv_str("name", m.name(e.name))?;
            w.kv_str("kind", e.kind.name().as_bytes())?;
            w.obj_end()?;
        }
        w.arr_end()?;
        w.key("metrics")?;
        w.arr()?;
        let (mi, mn) = sorted_by::<32>(
            m.metrics.len(),
            |a, b| name_cmp(m.metrics[a].name, m.metrics[b].name),
            |i| m.metrics[i].sys == si,
        );
        for k in 0..mn {
            let mt = m.metrics[mi[k] as usize];
            w.obj()?;
            w.kv_str("name", m.name(mt.name))?;
            w.kv_str("unit", m.name(mt.unit))?;
            w.obj_end()?;
        }
        w.arr_end()?;
        w.key("objectives")?;
        w.arr()?;
        let (oi, on) = sorted_by::<16>(
            m.objectives.len(),
            |a, b| name_cmp(m.objectives[a].name, m.objectives[b].name),
            |i| m.objectives[i].sys == si,
        );
        for k in 0..on {
            let ob = oi[k];
            w.obj()?;
            w.kv_str("name", m.name(m.objectives[ob as usize].name))?;
            w.key("goals")?;
            w.arr()?;
            let (gi, gn) = sorted_by::<32>(
                m.goals.len(),
                |a, b| m.goals[a].priority.cmp(&m.goals[b].priority),
                |i| m.goals[i].objective == ob,
            );
            for q in 0..gn {
                let g = m.goals[gi[q] as usize];
                w.obj()?;
                w.kv_uint("priority", g.priority as u64)?;
                w.kv_str(
                    "direction",
                    if g.dir == factc_source::GoalDir::Minimize {
                        b"minimize"
                    } else {
                        b"maximize"
                    },
                )?;
                w.kv_str("metric", m.name(m.metrics[g.metric as usize].name))?;
                w.obj_end()?;
            }
            w.arr_end()?;
            w.key("hard")?;
            w.arr()?;
            let (hi, hn) = sorted_by::<32>(
                m.hards.len(),
                |a, b| {
                    name_cmp(
                        m.metrics[m.hards[a].metric as usize].name,
                        m.metrics[m.hards[b].metric as usize].name,
                    )
                    .then(m.hards[a].value.cmp(&m.hards[b].value))
                },
                |i| m.hards[i].objective == ob,
            );
            for q in 0..hn {
                let h = m.hards[hi[q] as usize];
                w.obj()?;
                w.kv_str("metric", m.name(m.metrics[h.metric as usize].name))?;
                w.kv_str("cmp", h.cmp.name().as_bytes())?;
                w.kv_int("value", h.value)?;
                w.obj_end()?;
            }
            w.arr_end()?;
            w.obj_end()?;
        }
        w.arr_end()?;
        w.key("governance")?;
        w.arr()?;
        let (sti, stn) = sorted_by::<128>(
            m.statuses.len(),
            |a, b| {
                cmp_obj(m, m.statuses[a].obj, m.statuses[b].obj)
                    .then(m.statuses[a].status.cmp(&m.statuses[b].status))
            },
            |i| m.obj_sys(m.statuses[i].obj) == si,
        );
        for k in 0..stn {
            let s = m.statuses[sti[k] as usize];
            w.obj()?;
            w.key("object")?;
            jobj(m, &mut w, s.obj, si, &mut tmp)?;
            w.kv_str("status", s.status.name().as_bytes())?;
            match s.reason {
                Some(r) => w.kv_str("reason", m.name(r))?,
                None => w.kv_null("reason")?,
            }
            w.obj_end()?;
        }
        let (isi, isn) = sorted_by::<64>(
            m.issues.len(),
            |a, b| name_cmp(m.issues[a].name, m.issues[b].name),
            |i| m.issues[i].sys == si,
        );
        for k in 0..isn {
            let is = m.issues[isi[k] as usize];
            w.obj()?;
            w.key("object")?;
            w.obj()?;
            w.kv_str("kind", b"issue")?;
            w.kv_str("path", m.name(is.name))?;
            w.obj_end()?;
            w.kv_str("status", is.status.name().as_bytes())?;
            w.kv_str("reason", m.name(is.desc))?;
            w.obj_end()?;
        }
        w.arr_end()?;
        w.key("authorities")?;
        w.arr()?;
        let (ai, an) = sorted_by::<64>(
            m.authorities.len(),
            |a, b| cmp_obj(m, m.authorities[a].obj, m.authorities[b].obj),
            |i| m.obj_sys(m.authorities[i].obj) == si,
        );
        for k in 0..an {
            let a = m.authorities[ai[k] as usize];
            w.obj()?;
            w.key("object")?;
            jobj(m, &mut w, a.obj, si, &mut tmp)?;
            w.kv_str("url", m.name(a.url))?;
            w.obj_end()?;
        }
        w.arr_end()?;
        w.obj_end()?;
    }
    w.arr_end()?;
    w.obj_end()
}

/// Governance blocking check for BUILD (SEMANTIC-MODEL.md sections 11-12): returns first blocking status.
pub fn build_blocker(m: &Model) -> Option<(Obj, GovStatus)> {
    for s in m.statuses.iter() {
        if s.status.blocks_build() {
            return Some((s.obj, s.status));
        }
    }
    for (i, is) in m.issues.iter().enumerate() {
        if is.status.blocks_build() {
            return Some((Obj::Issue(i as u32), is.status));
        }
    }
    None
}
