//! Bootstrap ABI operations (C14).  Transport-neutral Rust functions; the wasm-abi crate exports them.

use crate::workspace::{Mode, SourceUnit, Status, Workspace};
use factc_foundation::json::JsonW;
use factc_foundation::{DiagCode, Diagnostic, OutBuf, Phase, SourceId};

pub const ABI_VERSION: u32 = 1;
pub const KERNEL_VERSION: u32 = 1;

pub const fn query_abi_version() -> u32 {
    ABI_VERSION
}

pub fn query_required_workspace() -> u64 {
    core::mem::size_of::<Workspace>() as u64
}

/// SUBMIT_SOURCE_BYTES (B7): opaque bytes become a SourceUnit with identity and span accounting.  No grammar is
/// consulted here.
pub fn submit_source_bytes(ws: &mut Workspace, bytes: &[u8]) -> Result<SourceId, Status> {
    if ws.source_used + bytes.len() > ws.source_bytes.len()
        || ws.sources.len() >= ws.sources.capacity()
    {
        ws.diagnostics.push(
            Diagnostic::new(
                DiagCode::WorkspaceExhausted,
                Phase::Bootstrap,
                SourceId::new(ws.sources.len() as u32),
                None,
                "source arena exhausted",
            )
            .with_params(bytes.len() as u32, ws.source_bytes.len() as u32, 0),
        );
        ws.last_status = Status::Exhausted;
        return Err(Status::Exhausted);
    }
    let id = SourceId::new(ws.sources.len() as u32);
    let off = ws.source_used;
    ws.source_bytes[off..off + bytes.len()].copy_from_slice(bytes);
    ws.source_used += bytes.len();
    let _ = ws.sources.push(SourceUnit {
        id,
        off: off as u32,
        len: bytes.len() as u32,
    });
    Ok(id)
}

/// SUBMIT_MACHINE_STATE: opaque bytes in the machine-state dialect (consumed by planning once it exists).
pub fn submit_machine_state(ws: &mut Workspace, bytes: &[u8]) -> Result<(), Status> {
    ws.machine_state.clear();
    for &b in bytes {
        if ws.machine_state.push(b).is_err() {
            ws.diagnostics.push(Diagnostic::new(
                DiagCode::WorkspaceExhausted,
                Phase::Bootstrap,
                SourceId::default(),
                None,
                "machine-state arena exhausted",
            ));
            ws.last_status = Status::Exhausted;
            return Err(Status::Exhausted);
        }
    }
    Ok(())
}

/// CHECK_OR_COMPILE.  Bootstrap-era behaviour (B8): every submitted source reaches the front-end boundary and
/// receives a deterministic LANGUAGE_KERNEL_NOT_IMPLEMENTED diagnostic with exact source lineage.
pub fn check_or_compile(ws: &mut Workspace, _mode: Mode) -> Status {
    ws.diagnostics.clear();
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
    let units: [Option<SourceUnit>; factc_foundation::limits::MAX_SOURCE_UNITS] = {
        let mut u = [None; factc_foundation::limits::MAX_SOURCE_UNITS];
        for (i, s) in ws.sources.iter().enumerate() {
            u[i] = Some(*s);
        }
        u
    };
    for unit in units.iter().flatten() {
        ws.diagnostics.push(
            Diagnostic::new(
                DiagCode::LanguageKernelNotImplemented,
                Phase::Scan,
                unit.id,
                Some(unit.span()),
                "front-end boundary reached; ASCII language kernel not materialized",
            )
            .with_params(unit.len, 0, 0),
        );
    }
    ws.diagnostics.sort();
    ws.last_status = Status::NotImplemented;
    ws.last_status
}

/// READ_DIAGNOSTICS: deterministic JSON rendering of the structured diagnostics.
pub fn read_diagnostics(
    ws: &Workspace,
    out: &mut OutBuf<'_>,
) -> Result<(), factc_foundation::OutputTooSmall> {
    let mut w = JsonW::new(out);
    w.obj_begin()?;
    w.kv_uint("abi_version", ABI_VERSION as u64)?;
    w.kv_uint("kernel_version", KERNEL_VERSION as u64)?;
    w.kv_str("status", status_name(ws.last_status).as_bytes())?;
    w.kv_bool("overflowed", ws.diagnostics.overflowed())?;
    w.key("diagnostics")?;
    w.arr()?;
    for d in ws.diagnostics.iter() {
        w.obj()?;
        w.kv_str("code", d.code.name().as_bytes())?;
        w.kv_uint("code_id", d.code as u16 as u64)?;
        w.kv_str("severity", severity_name(d.severity).as_bytes())?;
        w.kv_str("phase", d.phase.name().as_bytes())?;
        w.kv_uint("source", d.source.raw() as u64)?;
        w.key("primary")?;
        span_json(&mut w, d.primary)?;
        w.key("related")?;
        w.arr()?;
        for r in d.related.iter().flatten() {
            span_json(&mut w, Some(*r))?;
        }
        w.arr_end()?;
        w.kv_str("message_class", d.message_class.as_bytes())?;
        w.key("params")?;
        w.arr()?;
        w.uint(d.params.a as u64)?;
        w.uint(d.params.b as u64)?;
        w.uint(d.params.c as u64)?;
        w.arr_end()?;
        match d.authority {
            Some(a) => w.kv_str("authority", a.as_bytes())?,
            None => w.kv_null("authority")?,
        }
        w.obj_end()?;
    }
    w.arr_end()?;
    w.obj_end()?;
    Ok(())
}

fn span_json(
    w: &mut JsonW<'_, '_>,
    s: Option<factc_foundation::Span>,
) -> Result<(), factc_foundation::OutputTooSmall> {
    match s {
        Some(sp) => {
            w.obj()?;
            w.kv_uint("source", sp.source().raw() as u64)?;
            w.kv_uint("start", sp.start() as u64)?;
            w.kv_uint("end", sp.end() as u64)?;
            w.obj_end()
        }
        None => w.null(),
    }
}

/// READ_ARTIFACT_METADATA: envelope listing (C6).
pub fn read_artifact_metadata(
    ws: &Workspace,
    out: &mut OutBuf<'_>,
) -> Result<(), factc_foundation::OutputTooSmall> {
    let mut w = JsonW::new(out);
    w.obj_begin()?;
    w.kv_uint("abi_version", ABI_VERSION as u64)?;
    w.key("artifacts")?;
    w.arr()?;
    for a in ws.artifacts.iter() {
        w.obj()?;
        w.kv_uint("artifact_id", a.id as u64)?;
        w.kv_str("kind", a.kind.name().as_bytes())?;
        w.kv_uint("schema_version", a.schema_version as u64)?;
        w.kv_str("producer", a.producer.as_bytes())?;
        w.kv_str("status", a.status.name().as_bytes())?;
        w.kv_hex("sha256", &a.sha256)?;
        w.kv_uint("byte_len", a.byte_len as u64)?;
        w.key("inputs")?;
        w.arr()?;
        for i in a.inputs.iter().flatten() {
            w.uint(*i as u64)?;
        }
        w.arr_end()?;
        w.obj_end()?;
    }
    w.arr_end()?;
    w.obj_end()?;
    Ok(())
}

pub fn reset_workspace(ws: &mut Workspace) {
    ws.reset();
}

pub const fn status_name(s: Status) -> &'static str {
    match s {
        Status::Idle => "IDLE",
        Status::Ok => "OK",
        Status::Diagnostics => "DIAGNOSTICS",
        Status::Exhausted => "EXHAUSTED",
        Status::NotImplemented => "NOT_IMPLEMENTED",
    }
}

pub const fn severity_name(s: factc_foundation::Severity) -> &'static str {
    match s {
        factc_foundation::Severity::Error => "ERROR",
        factc_foundation::Severity::Warning => "WARNING",
        factc_foundation::Severity::Note => "NOTE",
    }
}
