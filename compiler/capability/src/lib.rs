//! Capability lowering (LOWERING-MODEL.md sections 2-3, 9-10; BOOTSTRAP-CONTRACTS C7).
//!
//! Pass-4 meaning becomes implementation *requirements*.  Nothing here names a browser API, picks a backend or
//! rewrites an objective: DATA relations become transfer requirements, REQUIRES links become semantic capability
//! requirements, invariants/refinements/tests/evidence become obligations with status.
#![no_std]
#![forbid(unsafe_code)]

use factc_foundation::json::JsonW;
use factc_foundation::{BVec, OutBuf, OutputTooSmall, Str};
use factc_semantic::{LinkKind, Model, Obj, RelKind};
use factc_source::{Mode, TestKind};

#[derive(Copy, Clone, Debug)]
pub struct TransferRequirement {
    pub relation: u32,
    pub name: Str,
    /// nominal type index in the model
    pub ty: u32,
    pub mode: Mode,
    pub src_comp: u32,
    pub dst_comp: u32,
    pub src_port: u32,
    pub dst_port: u32,
}

#[derive(Copy, Clone, Debug)]
pub struct CapabilityRequirement {
    pub obj: Obj,
    pub capability: u32,
}

#[derive(Copy, Clone, Debug)]
pub struct EffectRequirement {
    pub obj: Obj,
    pub effect: u32,
}

#[derive(Copy, Clone, Debug)]
pub struct Pin {
    pub obj: Obj,
    pub implementation: u32,
}

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum ObligationStatus {
    Pass,
    Fail,
    Open,
}

impl ObligationStatus {
    pub const fn name(self) -> &'static str {
        match self {
            ObligationStatus::Pass => "PASS",
            ObligationStatus::Fail => "FAIL",
            ObligationStatus::Open => "OPEN",
        }
    }
}

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum ObligationKind {
    Invariant,
    Refinement,
    Transfer,
    Capability,
    Effect,
    Sequence,
    Ownership,
    Test,
    Evidence,
}

impl ObligationKind {
    pub const fn name(self) -> &'static str {
        match self {
            ObligationKind::Invariant => "SEMANTIC_INVARIANT",
            ObligationKind::Refinement => "REFINEMENT",
            ObligationKind::Transfer => "TRANSFER",
            ObligationKind::Capability => "CAPABILITY",
            ObligationKind::Effect => "EFFECT",
            ObligationKind::Sequence => "SEQUENCE",
            ObligationKind::Ownership => "OWNERSHIP",
            ObligationKind::Test => "TEST",
            ObligationKind::Evidence => "EVIDENCE",
        }
    }
}

#[derive(Copy, Clone, Debug)]
pub struct Obligation {
    pub id: u32,
    pub kind: ObligationKind,
    pub subject: Obj,
    pub status: ObligationStatus,
    /// index into the matching requirement table (transfer/capability/...) or the model table
    pub index: u32,
}

#[derive(Clone, Debug)]
pub struct CapabilityIr {
    pub transfers: BVec<TransferRequirement, 128>,
    pub capabilities: BVec<CapabilityRequirement, 128>,
    pub effects: BVec<EffectRequirement, 128>,
    pub pins: BVec<Pin, 64>,
    pub obligations: BVec<Obligation, 512>,
}

impl Default for CapabilityIr {
    fn default() -> Self {
        Self::new()
    }
}

impl CapabilityIr {
    pub const fn new() -> Self {
        CapabilityIr {
            transfers: BVec::new(),
            capabilities: BVec::new(),
            effects: BVec::new(),
            pins: BVec::new(),
            obligations: BVec::new(),
        }
    }
    pub fn clear(&mut self) {
        *self = CapabilityIr::new();
    }
    pub fn obligation_count(&self, status: ObligationStatus) -> usize {
        self.obligations
            .iter()
            .filter(|o| o.status == status)
            .count()
    }
}

fn push_ob(
    ir: &mut CapabilityIr,
    kind: ObligationKind,
    subject: Obj,
    status: ObligationStatus,
    index: u32,
) {
    let id = ir.obligations.len() as u32;
    let _ = ir.obligations.push(Obligation {
        id,
        kind,
        subject,
        status,
        index,
    });
}

/// Lower the typed model into CapabilityIR + ObligationSet.  Deterministic in model order.
pub fn lower(m: &Model, ir: &mut CapabilityIr) {
    ir.clear();
    // DATA relations -> transfer requirements (LOWERING-MODEL.md section 10); status OPEN until a legal path is
    // planned and verified.
    for (ri, r) in m.relations.iter().enumerate() {
        if r.kind != RelKind::Data {
            continue;
        }
        if let (Obj::Port(s), Obj::Port(d)) = (r.from, r.to) {
            let t = TransferRequirement {
                relation: ri as u32,
                name: r.name,
                ty: m.nominal(m.ports[s as usize].ty),
                mode: r.mode.unwrap_or(Mode::Copy),
                src_comp: m.port_comp(s),
                dst_comp: m.port_comp(d),
                src_port: s,
                dst_port: d,
            };
            if let Ok(idx) = ir.transfers.push(t) {
                push_ob(
                    ir,
                    ObligationKind::Transfer,
                    Obj::Relation(ri as u32),
                    ObligationStatus::Open,
                    idx as u32,
                );
            }
        }
    }
    // SEQUENCE relations -> precedence obligations for plans (OPEN until a plan orders them)
    for (ri, r) in m.relations.iter().enumerate() {
        if r.kind == RelKind::Sequence {
            push_ob(
                ir,
                ObligationKind::Sequence,
                Obj::Relation(ri as u32),
                ObligationStatus::Open,
                ri as u32,
            );
        }
    }
    for l in m.links.iter() {
        match l.kind {
            LinkKind::Requires => {
                if let Obj::Capability(c) = l.b {
                    if let Ok(idx) = ir.capabilities.push(CapabilityRequirement {
                        obj: l.a,
                        capability: c,
                    }) {
                        push_ob(
                            ir,
                            ObligationKind::Capability,
                            l.a,
                            ObligationStatus::Open,
                            idx as u32,
                        );
                    }
                }
            }
            LinkKind::Uses => {
                if let Obj::Effect(e) = l.b {
                    if let Ok(idx) = ir.effects.push(EffectRequirement {
                        obj: l.a,
                        effect: e,
                    }) {
                        push_ob(
                            ir,
                            ObligationKind::Effect,
                            l.a,
                            ObligationStatus::Open,
                            idx as u32,
                        );
                    }
                }
            }
            LinkKind::Pin => {
                if let Obj::Implementation(i) = l.b {
                    let _ = ir.pins.push(Pin {
                        obj: l.a,
                        implementation: i,
                    });
                }
            }
            LinkKind::Owns => {
                push_ob(
                    ir,
                    ObligationKind::Ownership,
                    l.a,
                    ObligationStatus::Open,
                    0,
                );
            }
            LinkKind::Refines => {
                let st = match l.holds {
                    Some(true) => ObligationStatus::Pass,
                    Some(false) => ObligationStatus::Fail,
                    None => ObligationStatus::Open,
                };
                push_ob(ir, ObligationKind::Refinement, l.a, st, 0);
            }
            _ => {}
        }
    }
    for (ii, inv) in m.invariants.iter().enumerate() {
        let st = match inv.holds {
            Some(true) => ObligationStatus::Pass,
            Some(false) => ObligationStatus::Fail,
            None => ObligationStatus::Open,
        };
        push_ob(
            ir,
            ObligationKind::Invariant,
            Obj::Invariant(ii as u32),
            st,
            ii as u32,
        );
    }
    // Tests: a static test targeting a holding invariant is CHECKED (PASS) statically; runtime/property tests stay
    // OPEN until runtime evidence.  Declaring a test never satisfies it (LOWERING-MODEL.md section 2).
    for (ti, t) in m.tests.iter().enumerate() {
        let mut st = ObligationStatus::Open;
        if t.kind == TestKind::Static {
            let targets_hold = m
                .links
                .iter()
                .filter(|l| l.kind == LinkKind::Tests && l.a == Obj::Test(ti as u32))
                .all(|l| match l.b {
                    Obj::Invariant(i) => m.invariants[i as usize].holds == Some(true),
                    _ => false,
                });
            let has_target = m
                .links
                .iter()
                .any(|l| l.kind == LinkKind::Tests && l.a == Obj::Test(ti as u32));
            if has_target && targets_hold {
                st = ObligationStatus::Pass;
            } else if has_target {
                st = ObligationStatus::Fail;
            }
        }
        push_ob(
            ir,
            ObligationKind::Test,
            Obj::Test(ti as u32),
            st,
            ti as u32,
        );
    }
    for (ei, _e) in m.evidences.iter().enumerate() {
        push_ob(
            ir,
            ObligationKind::Evidence,
            Obj::Evidence(ei as u32),
            ObligationStatus::Open,
            ei as u32,
        );
    }
}

fn obj_path(m: &Model, ob: Obj, tmp: &mut [u8; 256]) -> Result<usize, OutputTooSmall> {
    let mut o = OutBuf::new(tmp);
    factc_semantic::render::obj_path(m, ob, &mut o, m.obj_sys(ob))?;
    Ok(o.len())
}

/// CapabilityIR + ObligationSet as one JSON artifact (LOWERING-MODEL.md section 3).
pub fn capability_ir_json(
    m: &Model,
    ir: &CapabilityIr,
    out: &mut OutBuf<'_>,
) -> Result<(), OutputTooSmall> {
    let mut w = JsonW::new(out);
    let mut tmp = [0u8; 256];
    w.obj_begin()?;
    w.kv_str("kind", b"CAPABILITY_IR")?;
    w.kv_uint("schema_version", 1)?;
    w.key("transfer_requirements")?;
    w.arr()?;
    for t in ir.transfers.iter() {
        w.obj()?;
        w.kv_str("relation", m.name(t.name))?;
        w.kv_str("type", m.name(m.types[t.ty as usize].name))?;
        w.kv_str("mode", t.mode.name().as_bytes())?;
        w.kv_str(
            "from_component",
            m.name(m.components[t.src_comp as usize].name),
        )?;
        w.kv_str(
            "to_component",
            m.name(m.components[t.dst_comp as usize].name),
        )?;
        let n = obj_path(m, Obj::Port(t.src_port), &mut tmp)?;
        w.kv_str("from_port", &tmp[..n])?;
        let n = obj_path(m, Obj::Port(t.dst_port), &mut tmp)?;
        w.kv_str("to_port", &tmp[..n])?;
        w.obj_end()?;
    }
    w.arr_end()?;
    w.key("semantic_requirements")?;
    w.arr()?;
    for c in ir.capabilities.iter() {
        w.obj()?;
        let n = obj_path(m, c.obj, &mut tmp)?;
        w.kv_str("object", &tmp[..n])?;
        w.kv_str(
            "capability",
            m.name(m.capabilities[c.capability as usize].name),
        )?;
        w.obj_end()?;
    }
    w.arr_end()?;
    w.key("effect_requirements")?;
    w.arr()?;
    for e in ir.effects.iter() {
        w.obj()?;
        let n = obj_path(m, e.obj, &mut tmp)?;
        w.kv_str("object", &tmp[..n])?;
        w.kv_str("effect", m.name(m.effects[e.effect as usize].name))?;
        w.obj_end()?;
    }
    w.arr_end()?;
    w.key("implementation_pins")?;
    w.arr()?;
    for p in ir.pins.iter() {
        w.obj()?;
        let n = obj_path(m, p.obj, &mut tmp)?;
        w.kv_str("object", &tmp[..n])?;
        w.kv_str(
            "implementation",
            m.name(m.implementations[p.implementation as usize].name),
        )?;
        w.obj_end()?;
    }
    w.arr_end()?;
    w.key("objectives")?;
    w.arr()?;
    for (oi, ob) in m.objectives.iter().enumerate() {
        w.obj()?;
        w.kv_str("name", m.name(ob.name))?;
        w.key("goals")?;
        w.arr()?;
        for g in m.goals.iter().filter(|g| g.objective == oi as u32) {
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
            w.kv_str("unit", m.name(m.metrics[g.metric as usize].unit))?;
            w.obj_end()?;
        }
        w.arr_end()?;
        w.key("hard")?;
        w.arr()?;
        for h in m.hards.iter().filter(|h| h.objective == oi as u32) {
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
    w.key("obligations")?;
    w.arr()?;
    for o in ir.obligations.iter() {
        w.obj()?;
        w.kv_uint("obligation_id", o.id as u64)?;
        w.kv_str("kind", o.kind.name().as_bytes())?;
        let n = obj_path(m, o.subject, &mut tmp)?;
        w.kv_str("subject", &tmp[..n])?;
        w.kv_str("status", o.status.name().as_bytes())?;
        w.obj_end()?;
    }
    w.arr_end()?;
    w.kv_uint("pass", ir.obligation_count(ObligationStatus::Pass) as u64)?;
    w.kv_uint("fail", ir.obligation_count(ObligationStatus::Fail) as u64)?;
    w.kv_uint("open", ir.obligation_count(ObligationStatus::Open) as u64)?;
    w.obj_end()
}
