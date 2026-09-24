//! Compiler phase spine (PASS3 section 6, BOOTSTRAP-CONTRACTS C5): each phase consumes its declared input
//! artifact class and produces only its declared output class.  No phase performs another phase's work.

use crate::workspace::{Mode, Status, Unit, Workspace};
use factc_foundation::limits::MAX_SOURCE_UNITS;
use factc_foundation::{
    ArtifactKind, ArtifactStatus, DiagCode, Diagnostic, OutBuf, Phase, SourceId,
};

const SCRATCH: usize = 256 * 1024;

/// Front end: SOURCE -> SYSTEM_AST (parsed statements per unit).
pub fn front_end(ws: &mut Workspace) {
    let units_meta: [Option<crate::workspace::SourceUnit>; MAX_SOURCE_UNITS] = {
        let mut u = [None; MAX_SOURCE_UNITS];
        for (i, s) in ws.sources.iter().enumerate() {
            u[i] = Some(*s);
        }
        u
    };
    for (i, su) in units_meta.iter().enumerate() {
        let Some(su) = su else { continue };
        let mut unit = Unit::new(su.id);
        let (src_bytes, islands, diags) = (&ws.source_bytes, &mut ws.islands, &mut ws.diagnostics);
        let src = &src_bytes[su.off as usize..(su.off + su.len) as usize];
        factc_source::parser::parse_unit(src, su.id, islands, &mut unit, diags);
        ws.units[i] = Some(unit);
    }
}

static EMPTY_UNIT: Unit = Unit::new(SourceId::new(u32::MAX));

/// Semantic phases: SYSTEM_AST -> RESOLVED -> TYPED_SYSTEM_IR (+ invariant/refinement evaluation).
pub fn semantic(ws: &mut Workspace) -> bool {
    let mut flat: [(&Unit, &[u8]); MAX_SOURCE_UNITS] = [(&EMPTY_UNIT, &[]); MAX_SOURCE_UNITS];
    let mut n = 0;
    for (i, u) in ws.units.iter().enumerate() {
        if let (Some(u), Some(su)) = (u.as_ref(), ws.sources.get(i)) {
            flat[n] = (
                u,
                &ws.source_bytes[su.off as usize..(su.off + su.len) as usize],
            );
            n += 1;
        }
    }
    let (model, diags) = (&mut ws.model, &mut ws.diagnostics);
    let ok = factc_semantic::build::build(&flat[..n], model, diags);
    let failing = factc_semantic::invariants::evaluate_all(model);
    for inv in model.invariants.iter() {
        if inv.holds == Some(false) {
            diags.push(Diagnostic::new(
                DiagCode::InvariantFailed,
                Phase::Type,
                model.systems[inv.sys as usize].source,
                Some(inv.span),
                "invariant does not hold in the resolved semantic graph",
            ));
        }
    }
    let mut ref_fail = 0;
    factc_semantic::refinement::evaluate_all(model, |m, c, a, r, span| {
        ref_fail += 1;
        let src = m.systems[m.components[c as usize].sys as usize].source;
        let code = if !r.effects {
            DiagCode::EffectEscape
        } else {
            DiagCode::RefinementFailed
        };
        let class: &'static str = if !r.interface {
            "abstract public port missing on concrete subsystem"
        } else if !r.direction {
            "boundary port direction not preserved"
        } else if !r.types {
            "boundary port type not preserved"
        } else if !r.effects {
            "concrete internals use an effect not surfaced by the abstract contract"
        } else if !r.capabilities {
            "concrete internals require a capability not exposed by the abstract contract"
        } else if !r.pins {
            "abstract implementation pin not honoured"
        } else {
            "invariant promised by the abstract contract fails for the concrete subsystem"
        };
        let mut d = Diagnostic::new(code, Phase::Type, src, Some(span), class).with_params(c, a, 0);
        if let Some(o) = r.offender {
            d = d.with_related(m.obj_span(o));
        }
        diags.push(d);
    });
    ok && failing == 0 && ref_fail == 0
}

/// Emit artifacts: canonical ASCII per system, TypedSystemIR JSON.
pub fn emit(ws: &mut Workspace, well_typed: bool) -> Result<(), crate::workspace::ArenaExhausted> {
    let mut scratch = [0u8; SCRATCH];
    let status = if well_typed {
        ArtifactStatus::Ok
    } else {
        ArtifactStatus::Partial
    };
    let nsys = ws.model.systems.len();
    for s in 0..nsys {
        let mut o = OutBuf::new(&mut scratch);
        if factc_semantic::render::canonical(&ws.model, s as u32, &mut o).is_err() {
            ws.diagnostics.push(Diagnostic::new(
                DiagCode::OutputTooSmall,
                Phase::Type,
                ws.model.systems[s].source,
                None,
                "canonical rendering exceeds scratch",
            ));
            return Err(crate::workspace::ArenaExhausted);
        }
        let n = o.len();
        ws.store_artifact(
            ArtifactKind::CanonicalAscii,
            "factc-semantic/render",
            status,
            &scratch[..n],
            &[],
            Some(s as u32),
        )?;
    }
    let mut o = OutBuf::new(&mut scratch);
    if factc_semantic::render::typed_ir_json(&ws.model, &mut o).is_err() {
        ws.diagnostics.push(Diagnostic::new(
            DiagCode::OutputTooSmall,
            Phase::Type,
            SourceId::default(),
            None,
            "typed IR rendering exceeds scratch",
        ));
        return Err(crate::workspace::ArenaExhausted);
    }
    let n = o.len();
    ws.store_artifact(
        ArtifactKind::TypedSystemIr,
        "factc-semantic/typed-ir",
        status,
        &scratch[..n],
        &[],
        None,
    )?;
    Ok(())
}

/// CHECK_OR_COMPILE driver.
pub fn run(ws: &mut Workspace, mode: Mode) -> Status {
    ws.diagnostics.clear();
    ws.artifacts.clear();
    ws.artifact_used = 0;
    if ws.sources.is_empty() {
        ws.diagnostics.push(Diagnostic::new(
            DiagCode::NoSourceSubmitted,
            Phase::Bootstrap,
            SourceId::default(),
            None,
            "no source unit submitted",
        ));
        ws.last_status = Status::Diagnostics;
        return ws.last_status;
    }
    front_end(ws);
    let well_typed = semantic(ws) && !ws.diagnostics.has_errors();
    if mode == Mode::Build {
        if let Some((obj, st)) = factc_semantic::render::build_blocker(&ws.model) {
            let src = ws.model.systems[ws.model.obj_sys(obj) as usize].source;
            ws.diagnostics.push(
                Diagnostic::new(
                    DiagCode::BuildBlockedByGovernance,
                    Phase::Type,
                    src,
                    Some(ws.model.obj_span(obj)),
                    "execution-critical governance state blocks BUILD",
                )
                .with_params(st as u32, 0, 0),
            );
        }
    }
    if emit(ws, well_typed).is_err() {
        ws.last_status = Status::Exhausted;
        ws.diagnostics.sort();
        return ws.last_status;
    }
    ws.diagnostics.sort();
    ws.last_status = if ws.diagnostics.has_errors() {
        Status::Diagnostics
    } else {
        Status::Ok
    };
    ws.last_status
}
