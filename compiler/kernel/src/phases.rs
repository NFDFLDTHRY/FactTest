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

/// Lowering: TYPED_SYSTEM_IR -> CAPABILITY_IR (+ obligation set).  Selects no implementation.
pub fn lowering(ws: &mut Workspace) {
    let (model, ir) = (&ws.model, &mut ws.capability_ir);
    factc_capability::lower(model, ir);
}

/// Contract registry + metric evidence + machine state (all registry dialect) -> Registry; then H_G.
/// Registry inputs are DATA; absent inputs leave the hypergraph empty (no backend is assumed).
pub fn contracts(ws: &mut Workspace) -> bool {
    ws.registry.clear();
    if ws.contracts_len == 0 {
        return true;
    }
    let (bytes, len, reg, diags) = (
        &ws.contracts,
        ws.contracts_len,
        &mut ws.registry,
        &mut ws.diagnostics,
    );
    // registry islands are attributed to a synthetic source id beyond the submitted units
    let src_id = SourceId::new(0xC0DE);
    factc_implementation::parse(&bytes[..len], src_id, reg, diags);
    let ok = reg.ok;
    if ws.metrics_len > 0 {
        let (mb, ml, reg, diags) = (
            &ws.metrics,
            ws.metrics_len,
            &mut ws.registry,
            &mut ws.diagnostics,
        );
        factc_implementation::parse(&mb[..ml], SourceId::new(0xC0DF), reg, diags);
    }
    if ws.machine_state_len > 0 {
        let (mb, ml, reg, diags) = (
            &ws.machine_state,
            ws.machine_state_len,
            &mut ws.registry,
            &mut ws.diagnostics,
        );
        factc_implementation::parse(&mb[..ml], SourceId::new(0xC0E0), reg, diags);
    }
    let (model, ir, reg, hg) = (
        &ws.model,
        &ws.capability_ir,
        &ws.registry,
        &mut ws.hypergraph,
    );
    factc_implementation::enumerate(model, ir, reg, hg);
    ok && ws.registry.ok
}

/// Planning + independent verification + activation model.  Runs only when the source is well typed, the
/// registry is coherent and every requirement has a legal edge.
pub fn plan_and_verify(ws: &mut Workspace) -> bool {
    ws.strategy.clear();
    ws.verification.clear();
    ws.activation = None;
    if ws.contracts_len == 0 || !ws.registry.ok || !ws.hypergraph.unsatisfied.is_empty() {
        return false;
    }
    {
        let (model, ir, reg, hg, strat) = (
            &ws.model,
            &ws.capability_ir,
            &ws.registry,
            &ws.hypergraph,
            &mut ws.strategy,
        );
        factc_planning::plan(model, ir, reg, hg, strat);
    }
    if ws.strategy.strength == factc_planning::Strength::NoPlan {
        ws.diagnostics.push(Diagnostic::new(
            DiagCode::NoLegalPlan,
            Phase::Planning,
            SourceId::default(),
            None,
            ws.strategy.explanation,
        ));
        return false;
    }
    {
        let (model, ir, reg, hg, strat, ver) = (
            &ws.model,
            &ws.capability_ir,
            &ws.registry,
            &ws.hypergraph,
            &ws.strategy,
            &mut ws.verification,
        );
        factc_verifier::verify_strategy(model, ir, reg, hg, strat, ver);
    }
    if ws.verification.verified.is_none() {
        let (rule, detail) = factc_verifier::first_failure(&ws.verification).unwrap_or((
            factc_verifier::Rule::Strategy,
            "strategy verification failed",
        ));
        let _ = rule;
        ws.diagnostics.push(Diagnostic::new(
            DiagCode::ProofFailed,
            Phase::Verification,
            SourceId::default(),
            None,
            detail,
        ));
        return false;
    }
    if ws.registry.epoch.is_some() {
        let vs = ws.verification.verified.as_ref().unwrap();
        ws.activation = Some(factc_verifier::activation::activate(vs, &ws.registry));
    }
    true
}

/// Codegen + BundleVerifier.  Runs only with a VerifiedStrategy (the type guarantees it) in BUILD mode.
pub fn codegen_and_bundle(
    ws: &mut Workspace,
    source_sha: &[u8; 32],
    canonical_sha: &[u8; 32],
    typed_sha: &[u8; 32],
) -> bool {
    let Some(vs) = ws.verification.verified.clone() else {
        return false;
    };
    let mut scratch = [0u8; 128 * 1024];
    let sys_name_len;
    let mut sys_name = [0u8; 64];
    {
        let n = ws.model.name(ws.model.systems[0].name);
        sys_name_len = n.len().min(64);
        sys_name[..sys_name_len].copy_from_slice(&n[..sys_name_len]);
    }
    let lineage = factc_codegen::Lineage {
        system_name: &sys_name[..sys_name_len],
        source_sha256: source_sha,
        canonical_sha256: canonical_sha,
        typed_ir_sha256: typed_sha,
    };
    {
        let (model, reg, hg, store) = (&ws.model, &ws.registry, &ws.hypergraph, &mut ws.bundle);
        if let Err(e) = factc_codegen::generate(model, reg, hg, &vs, &lineage, store, &mut scratch)
        {
            let class: &'static str = match e {
                factc_codegen::CodegenError::UnknownAdapterTemplate => {
                    "recipe names an adapter template absent from the codegen library [GAP]"
                }
                factc_codegen::CodegenError::UnknownExport => {
                    "recipe names a wasm export absent from the function library [GAP]"
                }
                factc_codegen::CodegenError::RecipeMissing => {
                    "verified backend has no CodegenRecipe"
                }
                factc_codegen::CodegenError::TooManyAdapters => "adapter arena exhausted",
                factc_codegen::CodegenError::Output => "bundle arena exhausted",
            };
            ws.diagnostics.push(Diagnostic::new(
                DiagCode::BundleCheckFailed,
                Phase::Codegen,
                SourceId::default(),
                None,
                class,
            ));
            return false;
        }
    }
    let store = &ws.bundle;
    let mut flat: [factc_bundle::File<'_>; factc_codegen::bundle::MAX_FILES] =
        core::array::from_fn(|_| factc_bundle::File {
            path: b"",
            bytes: b"",
        });
    let mut n = 0;
    for f in store.files.iter() {
        flat[n] = factc_bundle::File {
            path: f.path(),
            bytes: store.bytes(f),
        };
        n += 1;
    }
    let expected = factc_bundle::Expected {
        source_sha256: source_sha,
        canonical_sha256: canonical_sha,
    };
    let mut cert = factc_bundle::BundleCertificate::new();
    factc_bundle::verify(
        &ws.model,
        &ws.registry,
        &ws.hypergraph,
        &vs,
        &flat[..n],
        &expected,
        &mut cert,
    );
    let pass = cert.pass;
    ws.bundle_certificate = cert;
    if !pass {
        ws.diagnostics.push(Diagnostic::new(
            DiagCode::BundleCheckFailed,
            Phase::Bundle,
            SourceId::default(),
            None,
            "BundleVerifier rejected the generated bundle",
        ));
    }
    pass
}

/// Emit artifacts: canonical ASCII per system, TypedSystemIR JSON.
pub fn emit(
    ws: &mut Workspace,
    well_typed: bool,
    mode: Mode,
) -> Result<(), crate::workspace::ArenaExhausted> {
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
    let typed = ws.store_artifact(
        ArtifactKind::TypedSystemIr,
        "factc-semantic/typed-ir",
        status,
        &scratch[..n],
        &[],
        None,
    )?;
    let mut o = OutBuf::new(&mut scratch);
    if factc_capability::capability_ir_json(&ws.model, &ws.capability_ir, &mut o).is_err() {
        ws.diagnostics.push(Diagnostic::new(
            DiagCode::OutputTooSmall,
            Phase::Lowering,
            SourceId::default(),
            None,
            "capability IR rendering exceeds scratch",
        ));
        return Err(crate::workspace::ArenaExhausted);
    }
    let n = o.len();
    let cap = ws.store_artifact(
        ArtifactKind::CapabilityIr,
        "factc-capability/lower",
        status,
        &scratch[..n],
        &[typed],
        None,
    )?;
    if ws.contracts_len > 0 {
        let mut o = OutBuf::new(&mut scratch);
        if factc_implementation::hypergraph_json(
            &ws.model,
            &ws.capability_ir,
            &ws.registry,
            &ws.hypergraph,
            &mut o,
        )
        .is_err()
        {
            ws.diagnostics.push(Diagnostic::new(
                DiagCode::OutputTooSmall,
                Phase::Contracts,
                SourceId::default(),
                None,
                "hypergraph rendering exceeds scratch",
            ));
            return Err(crate::workspace::ArenaExhausted);
        }
        let n = o.len();
        let hstatus = if ws.registry.ok && ws.hypergraph.unsatisfied.is_empty() {
            ArtifactStatus::Ok
        } else {
            ArtifactStatus::Partial
        };
        let hg_id = ws.store_artifact(
            ArtifactKind::ImplementationHypergraph,
            "factc-implementation/enumerate",
            hstatus,
            &scratch[..n],
            &[cap],
            None,
        )?;
        if ws.strategy.strength != factc_planning::Strength::NoPlan
            || !ws.strategy.variants.is_empty()
        {
            let mut o = OutBuf::new(&mut scratch);
            if factc_planning::strategy_json(
                &ws.model,
                &ws.capability_ir,
                &ws.registry,
                &ws.hypergraph,
                &ws.strategy,
                &mut o,
            )
            .is_err()
            {
                return Err(crate::workspace::ArenaExhausted);
            }
            let n = o.len();
            let cs = ws.store_artifact(
                ArtifactKind::CandidateStrategy,
                "factc-planning/plan",
                ArtifactStatus::Ok,
                &scratch[..n],
                &[hg_id],
                None,
            )?;
            let mut o = OutBuf::new(&mut scratch);
            if factc_verifier::certificates_json(&ws.verification, &mut o).is_err() {
                return Err(crate::workspace::ArenaExhausted);
            }
            let n = o.len();
            let vstatus = if ws.verification.verified.is_some() {
                ArtifactStatus::Ok
            } else {
                ArtifactStatus::Failed
            };
            let certs = ws.store_artifact(
                ArtifactKind::VerificationCertificates,
                "factc-verifier/verify",
                vstatus,
                &scratch[..n],
                &[cs],
                None,
            )?;
            let verified = ws.verification.verified.clone();
            if let Some(vs) = verified.as_ref() {
                let mut o = OutBuf::new(&mut scratch);
                if factc_verifier::verified_strategy_json(
                    &ws.model,
                    &ws.registry,
                    &ws.hypergraph,
                    vs,
                    &mut o,
                )
                .is_err()
                {
                    return Err(crate::workspace::ArenaExhausted);
                }
                let n = o.len();
                let vsid = ws.store_artifact(
                    ArtifactKind::VerifiedStrategy,
                    "factc-verifier/verify",
                    ArtifactStatus::Ok,
                    &scratch[..n],
                    &[certs],
                    None,
                )?;
                if mode == Mode::Build {
                    let source_sha = factc_foundation::sha256::digest(ws.source(&ws.sources[0]));
                    let canonical_sha = ws
                        .artifacts
                        .iter()
                        .find(|a| a.kind == ArtifactKind::CanonicalAscii)
                        .map(|a| a.sha256)
                        .unwrap_or([0; 32]);
                    let typed_sha = ws
                        .artifacts
                        .iter()
                        .find(|a| a.kind == ArtifactKind::TypedSystemIr)
                        .map(|a| a.sha256)
                        .unwrap_or([0; 32]);
                    let ok = codegen_and_bundle(ws, &source_sha, &canonical_sha, &typed_sha);
                    let mut o = OutBuf::new(&mut scratch);
                    if factc_bundle::certificate_json(&ws.bundle_certificate, &mut o).is_err() {
                        return Err(crate::workspace::ArenaExhausted);
                    }
                    let n = o.len();
                    ws.store_artifact(
                        ArtifactKind::BundleCertificate,
                        "factc-bundle/verify",
                        if ok {
                            ArtifactStatus::Ok
                        } else {
                            ArtifactStatus::Failed
                        },
                        &scratch[..n],
                        &[vsid],
                        None,
                    )?;
                }
                let activation = ws.activation;
                if let Some(act) = activation.as_ref() {
                    let mut o = OutBuf::new(&mut scratch);
                    if factc_verifier::activation::receipt_json(vs, &ws.registry, act, &mut o)
                        .is_err()
                    {
                        return Err(crate::workspace::ArenaExhausted);
                    }
                    let n = o.len();
                    let astatus =
                        if act.status == factc_verifier::activation::ActivationStatus::Pass {
                            ArtifactStatus::Ok
                        } else {
                            ArtifactStatus::Failed
                        };
                    ws.store_artifact(
                        ArtifactKind::RuntimeEvidence,
                        "factc-verifier/activation-model",
                        astatus,
                        &scratch[..n],
                        &[vsid],
                        None,
                    )?;
                }
            }
        }
    }
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
    lowering(ws);
    let contracts_ok = contracts(ws);
    if mode == Mode::Build
        && ws.contracts_len > 0
        && (!contracts_ok || !ws.hypergraph.unsatisfied.is_empty())
    {
        ws.diagnostics.push(Diagnostic::new(
            DiagCode::NoLegalPlan,
            Phase::Contracts,
            SourceId::default(),
            None,
            "a requirement has no statically legal implementation edge in H_G",
        ));
    }
    if well_typed && contracts_ok {
        let _ = plan_and_verify(ws);
    }
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
    if emit(ws, well_typed, mode).is_err() {
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
