//! Implementation hypergraph (PASS5 section 9, LOWERING-MODEL.md sections 4-6, RUNTIME-ADMISSION-REPLAN.md
//! section 3).
//!
//! H_G   = every statically legal implementation edge for the requirements of the source.
//! H_A(E) = H_G filtered by the admissions of machine epoch E (computed by `admitted_in`).
//! Rejected candidates stay recorded with structured reasons; they are never silently dropped.

use crate::registry::{ContractStatus, Decision, Registry, StrList};
use factc_capability::CapabilityIr;
use factc_foundation::json::JsonW;
use factc_foundation::limits::MAX_PATH_LEN;
use factc_foundation::{BVec, OutBuf, OutputTooSmall, Str};
use factc_semantic::{Model, Obj};

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum EdgeKind {
    /// representation/conversion path realizing one transfer requirement
    Transfer,
    /// backend covering one semantic capability requirement
    Capability,
}

#[derive(Copy, Clone, Debug)]
pub struct Edge {
    pub id: u32,
    pub kind: EdgeKind,
    /// index into CapabilityIr.transfers or .capabilities
    pub requirement: u32,
    /// conversion indices (registry) in order; Transfer edges only
    pub steps: [Option<u32>; MAX_PATH_LEN],
    pub nsteps: u8,
    /// backends whose admission the edge requires (its activation guard)
    pub backends: StrList,
    pub legal: bool,
    pub reason: &'static str,
}

impl Edge {
    pub fn steps(&self) -> impl Iterator<Item = u32> + '_ {
        self.steps[..self.nsteps as usize].iter().flatten().copied()
    }
}

#[derive(Clone, Debug)]
pub struct Hypergraph {
    pub edges: BVec<Edge, 128>,
    pub rejected: BVec<Edge, 128>,
    /// transfer requirements with no legal edge at all
    pub unsatisfied: BVec<u32, 64>,
}

impl Default for Hypergraph {
    fn default() -> Self {
        Self::new()
    }
}

impl Hypergraph {
    pub const fn new() -> Self {
        Hypergraph {
            edges: BVec::new(),
            rejected: BVec::new(),
            unsatisfied: BVec::new(),
        }
    }
    pub fn clear(&mut self) {
        *self = Hypergraph::new();
    }
    pub fn edges_for(&self, kind: EdgeKind, requirement: u32) -> impl Iterator<Item = &Edge> + '_ {
        self.edges
            .iter()
            .filter(move |e| e.kind == kind && e.requirement == requirement)
    }
}

fn add_backend(list: &mut StrList, reg: &Registry, b: Str) {
    if !list.iter().any(|x| reg.text.eq(x, b)) {
        list.push(b);
    }
}

/// Pins on the source/destination components of a transfer, as backend names in the registry's arena.
fn pins_for(
    m: &Model,
    ir: &CapabilityIr,
    reg: &Registry,
    t: &factc_capability::TransferRequirement,
    out: &mut StrList,
) {
    for p in ir.pins.iter() {
        let comp = match p.obj {
            Obj::Component(c) => Some(c),
            Obj::Port(pt) => Some(m.port_comp(pt)),
            _ => None,
        };
        if comp == Some(t.src_comp) || comp == Some(t.dst_comp) {
            let name = m.name(m.implementations[p.implementation as usize].name);
            if let Some(bi) = reg.find_backend(name) {
                add_backend(out, reg, reg.backends[bi as usize].name);
            } else {
                // pinned implementation unknown to the registry: keep the name so no path can satisfy it
                out.push(Str::EMPTY);
            }
        }
    }
}

fn static_reason(reg: &Registry, backends: &StrList, pins: &StrList) -> Option<&'static str> {
    for b in backends.iter() {
        let st = reg
            .find_backend(reg.name(b))
            .map(|i| reg.backends[i as usize].status);
        match st {
            Some(ContractStatus::ReadyContract) => {}
            Some(ContractStatus::Gap) => {
                return Some("backend contract status GAP (in G, not in C)")
            }
            Some(ContractStatus::Err) => return Some("backend contract status ERR"),
            Some(ContractStatus::Unk) => return Some("backend contract status UNK"),
            None => return Some("backend not registered"),
        }
    }
    for p in pins.iter() {
        if p.is_empty() {
            return Some("implementation pin names a backend unknown to the registry");
        }
        if !backends.iter().any(|b| reg.text.eq(b, p)) {
            return Some("implementation pin excludes this path");
        }
    }
    None
}

struct Dfs<'a> {
    reg: &'a Registry,
    mode: factc_source::Mode,
    target: u32,
    steps: [Option<u32>; MAX_PATH_LEN],
    visited: [Option<u32>; MAX_PATH_LEN + 1],
}

fn dfs(
    d: &mut Dfs<'_>,
    at: u32,
    depth: usize,
    emit: &mut dyn FnMut(&[Option<u32>; MAX_PATH_LEN], usize),
) {
    if depth >= MAX_PATH_LEN {
        return;
    }
    let n = d.reg.conversions.len();
    for ci in 0..n {
        let c = d.reg.conversions[ci];
        let from = d.reg.find_rep(d.reg.name(c.from));
        if from != Some(at) {
            continue;
        }
        if c.mode != d.mode || !c.preserves_value {
            continue;
        }
        let Some(to) = d.reg.find_rep(d.reg.name(c.to)) else {
            continue;
        };
        d.steps[depth] = Some(ci as u32);
        if to == d.target {
            emit(&d.steps, depth + 1);
        } else if !d.visited[..=depth].contains(&Some(to)) {
            d.visited[depth + 1] = Some(to);
            dfs(d, to, depth + 1, emit);
            d.visited[depth + 1] = None;
        }
        d.steps[depth] = None;
    }
}

/// Build H_G.  Deterministic: registry order drives enumeration order.
pub fn enumerate(m: &Model, ir: &CapabilityIr, reg: &Registry, hg: &mut Hypergraph) {
    hg.clear();
    let mut next_id = 0u32;
    // transfer requirements: paths boundary -> ... -> boundary over explicit conversions
    for (ti, t) in ir.transfers.iter().enumerate() {
        let ty_name = m.name(m.types[t.ty as usize].name);
        let Some(boundary) = reg.boundary_for(ty_name) else {
            let e = Edge {
                id: next_id,
                kind: EdgeKind::Transfer,
                requirement: ti as u32,
                steps: [None; MAX_PATH_LEN],
                nsteps: 0,
                backends: StrList::default(),
                legal: false,
                reason: "no host-boundary representation declared for the semantic type",
            };
            next_id += 1;
            let _ = hg.rejected.push(e);
            let _ = hg.unsatisfied.push(ti as u32);
            continue;
        };
        let mut pins = StrList::default();
        pins_for(m, ir, reg, t, &mut pins);
        let mut found_legal = false;
        let mut d = Dfs {
            reg,
            mode: t.mode,
            target: boundary,
            steps: [None; MAX_PATH_LEN],
            visited: [None; MAX_PATH_LEN + 1],
        };
        d.visited[0] = Some(boundary);
        let mut emit = |steps: &[Option<u32>; MAX_PATH_LEN], n: usize| {
            let mut backends = StrList::default();
            for ci in steps[..n].iter().flatten() {
                if let Some(r) = reg.conversions[*ci as usize].requires {
                    add_backend(&mut backends, reg, r);
                }
            }
            let mut e = Edge {
                id: next_id,
                kind: EdgeKind::Transfer,
                requirement: ti as u32,
                steps: *steps,
                nsteps: n as u8,
                backends,
                legal: true,
                reason: "statically legal",
            };
            next_id += 1;
            match static_reason(reg, &e.backends, &pins) {
                None => {
                    found_legal = true;
                    let _ = hg.edges.push(e);
                }
                Some(r) => {
                    e.legal = false;
                    e.reason = r;
                    let _ = hg.rejected.push(e);
                }
            }
        };
        dfs(&mut d, boundary, 0, &mut emit);
        if !found_legal {
            let _ = hg.unsatisfied.push(ti as u32);
        }
    }
    // semantic capability requirements: backends whose contract covers the capability
    for (ci, c) in ir.capabilities.iter().enumerate() {
        let cap_name = m.name(m.capabilities[c.capability as usize].name);
        let mut pins = StrList::default();
        for p in ir.pins.iter().filter(|p| p.obj == c.obj) {
            let name = m.name(m.implementations[p.implementation as usize].name);
            match reg.find_backend(name) {
                Some(bi) => add_backend(&mut pins, reg, reg.backends[bi as usize].name),
                None => {
                    pins.push(Str::EMPTY);
                }
            }
        }
        let mut any = false;
        for b in reg.backends.iter() {
            if !b
                .capabilities
                .iter()
                .any(|x| reg.text.eq_bytes(x, cap_name))
            {
                continue;
            }
            let mut backends = StrList::default();
            backends.push(b.name);
            let mut e = Edge {
                id: next_id,
                kind: EdgeKind::Capability,
                requirement: ci as u32,
                steps: [None; MAX_PATH_LEN],
                nsteps: 0,
                backends,
                legal: true,
                reason: "statically legal",
            };
            next_id += 1;
            match static_reason(reg, &e.backends, &pins) {
                None => {
                    any = true;
                    let _ = hg.edges.push(e);
                }
                Some(r) => {
                    e.legal = false;
                    e.reason = r;
                    let _ = hg.rejected.push(e);
                }
            }
        }
        if !any {
            let _ = hg.unsatisfied.push(0x8000_0000 | ci as u32);
        }
    }
}

/// H_A(E): is this edge admitted under the registry's current epoch admissions?
pub fn admitted_in(reg: &Registry, e: &Edge) -> bool {
    e.backends
        .iter()
        .all(|b| matches!(reg.admission_of(b), Some(a) if a.decision == Decision::Admitted))
}

fn edge_json(
    m: &Model,
    ir: &CapabilityIr,
    reg: &Registry,
    e: &Edge,
    w: &mut JsonW<'_, '_>,
) -> Result<(), OutputTooSmall> {
    w.obj()?;
    w.kv_uint("edge_id", e.id as u64)?;
    w.kv_str(
        "kind",
        if e.kind == EdgeKind::Transfer {
            b"TRANSFER"
        } else {
            b"CAPABILITY"
        },
    )?;
    match e.kind {
        EdgeKind::Transfer => {
            let t = ir.transfers[e.requirement as usize];
            w.kv_str("requirement", m.name(t.name))?;
        }
        EdgeKind::Capability => {
            let c = ir.capabilities[e.requirement as usize];
            w.kv_str(
                "requirement",
                m.name(m.capabilities[c.capability as usize].name),
            )?;
        }
    }
    w.key("conversions")?;
    w.arr()?;
    for ci in e.steps() {
        let c = reg.conversions[ci as usize];
        w.obj()?;
        w.kv_str("conversion", reg.name(c.name))?;
        w.kv_str("from", reg.name(c.from))?;
        w.kv_str("to", reg.name(c.to))?;
        w.kv_str("mode", c.mode.name().as_bytes())?;
        w.obj_end()?;
    }
    w.arr_end()?;
    w.key("guard_backends")?;
    w.arr()?;
    for b in e.backends.iter() {
        w.str(reg.name(b))?;
    }
    w.arr_end()?;
    w.kv_bool("statically_legal", e.legal)?;
    w.kv_str("reason", e.reason.as_bytes())?;
    w.obj_end()
}

pub fn hypergraph_json(
    m: &Model,
    ir: &CapabilityIr,
    reg: &Registry,
    hg: &Hypergraph,
    out: &mut OutBuf<'_>,
) -> Result<(), OutputTooSmall> {
    let mut w = JsonW::new(out);
    w.obj_begin()?;
    w.kv_str("kind", b"IMPLEMENTATION_HYPERGRAPH")?;
    w.kv_uint("schema_version", 1)?;
    match reg.id {
        Some(id) => w.kv_str("registry", reg.name(id))?,
        None => w.kv_null("registry")?,
    }
    w.key("H_G")?;
    w.arr()?;
    for e in hg.edges.iter() {
        edge_json(m, ir, reg, e, &mut w)?;
    }
    w.arr_end()?;
    w.key("rejected")?;
    w.arr()?;
    for e in hg.rejected.iter() {
        edge_json(m, ir, reg, e, &mut w)?;
    }
    w.arr_end()?;
    w.key("unsatisfied_requirements")?;
    w.arr()?;
    for u in hg.unsatisfied.iter() {
        if u & 0x8000_0000 != 0 {
            let c = ir.capabilities[(u & 0x7fff_ffff) as usize];
            w.str(m.name(m.capabilities[c.capability as usize].name))?;
        } else {
            w.str(m.name(ir.transfers[*u as usize].name))?;
        }
    }
    w.arr_end()?;
    w.key("registry_backends")?;
    w.arr()?;
    for b in reg.backends.iter() {
        w.obj()?;
        w.kv_str("backend", reg.name(b.name))?;
        w.kv_str("status", b.status.name().as_bytes())?;
        w.obj_end()?;
    }
    w.arr_end()?;
    w.obj_end()
}
