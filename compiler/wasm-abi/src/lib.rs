//! Wasm export surface for the bootstrap ABI (C14) and the transport extensions the native driver already carries
//! (submit_contracts / submit_metrics / submit_evidence_tape, observe, read_artifact, bundle files; D23).  The
//! workspace and I/O buffers live in static linear memory so that the host only ever exchanges (address, length)
//! pairs; addresses are i64 on wasm64.  Every export calls one `factc_kernel` function; the input-buffer framing of
//! `observe` is transport encoding (C14 defers encoding), not a semantic.
//!
//! This crate is transport.  It defines no source-language semantics.
#![no_std]

use core::cell::UnsafeCell;
use factc_foundation::OutBuf;
use factc_kernel::{Mode, Status, Workspace};

/// Large enough for any single artifact (the artifact arena is 512 KiB) and any generated bundle file.
pub const IO_BYTES: usize = 512 * 1024;

struct Cell<T>(UnsafeCell<T>);
// SAFETY: the wasm module is single-threaded (current JS embedding is agent-local, see CONFLICT-LEDGER ERR-002);
// the native rlib build is only used for type checking and never shares this state across threads.
unsafe impl<T> Sync for Cell<T> {}

static WS: Cell<Workspace> = Cell(UnsafeCell::new(Workspace::new()));
static IN: Cell<[u8; IO_BYTES]> = Cell(UnsafeCell::new([0; IO_BYTES]));
static OUT: Cell<[u8; IO_BYTES]> = Cell(UnsafeCell::new([0; IO_BYTES]));

#[cfg(all(target_arch = "wasm64", not(test)))]
#[panic_handler]
fn panic(_: &core::panic::PanicInfo) -> ! {
    loop {}
}

#[no_mangle]
pub extern "C" fn query_abi_version() -> u32 {
    factc_kernel::query_abi_version()
}

#[no_mangle]
pub extern "C" fn query_required_workspace() -> u64 {
    factc_kernel::query_required_workspace()
}

/// Address of the host->kernel input buffer (host writes source bytes here before SUBMIT_SOURCE_BYTES).
#[no_mangle]
pub extern "C" fn input_buffer_ptr() -> *mut u8 {
    IN.0.get() as *mut u8
}

#[no_mangle]
pub extern "C" fn input_buffer_len() -> u64 {
    IO_BYTES as u64
}

#[no_mangle]
pub extern "C" fn output_buffer_ptr() -> *const u8 {
    OUT.0.get() as *const u8
}

#[no_mangle]
pub extern "C" fn output_buffer_len() -> u64 {
    IO_BYTES as u64
}

/// SUBMIT_SOURCE_BYTES: consume `len` bytes from the input buffer.  Returns SourceId+1, or 0 on exhaustion.
#[no_mangle]
pub extern "C" fn submit_source_bytes(len: u64) -> u32 {
    let n = core::cmp::min(len as usize, IO_BYTES);
    // SAFETY: single-threaded static access, see Cell.
    let (ws, input) = unsafe { (&mut *WS.0.get(), &*IN.0.get()) };
    match factc_kernel::submit_source_bytes(ws, &input[..n]) {
        Ok(id) => id.raw() + 1,
        Err(_) => 0,
    }
}

#[no_mangle]
pub extern "C" fn submit_machine_state(len: u64) -> u32 {
    let n = core::cmp::min(len as usize, IO_BYTES);
    let (ws, input) = unsafe { (&mut *WS.0.get(), &*IN.0.get()) };
    match factc_kernel::submit_machine_state(ws, &input[..n]) {
        Ok(()) => 1,
        Err(_) => 0,
    }
}

/// SUBMIT_CONTRACTS: consume `len` bytes of registry dialect from the input buffer.  Returns 1, or 0 on exhaustion.
#[no_mangle]
pub extern "C" fn submit_contracts(len: u64) -> u32 {
    let n = core::cmp::min(len as usize, IO_BYTES);
    let (ws, input) = unsafe { (&mut *WS.0.get(), &*IN.0.get()) };
    match factc_kernel::submit_contracts(ws, &input[..n]) {
        Ok(()) => 1,
        Err(_) => 0,
    }
}

/// SUBMIT_METRICS: consume `len` bytes of metric evidence from the input buffer.  Returns 1, or 0 on exhaustion.
#[no_mangle]
pub extern "C" fn submit_metrics(len: u64) -> u32 {
    let n = core::cmp::min(len as usize, IO_BYTES);
    let (ws, input) = unsafe { (&mut *WS.0.get(), &*IN.0.get()) };
    match factc_kernel::submit_metrics(ws, &input[..n]) {
        Ok(()) => 1,
        Err(_) => 0,
    }
}

/// SUBMIT_EVIDENCE_TAPE: consume `len` bytes of evidence tape from the input buffer.  Returns 1, or 0 on exhaustion.
#[no_mangle]
pub extern "C" fn submit_evidence_tape(len: u64) -> u32 {
    let n = core::cmp::min(len as usize, IO_BYTES);
    let (ws, input) = unsafe { (&mut *WS.0.get(), &*IN.0.get()) };
    match factc_kernel::submit_evidence_tape(ws, &input[..n]) {
        Ok(()) => 1,
        Err(_) => 0,
    }
}

/// OBSERVE: the input buffer holds, in order, the system name (`name_len` bytes), the authored-source sha256 after
/// the run (32 bytes, present when bit 0 of `flags` is set), the lineage sha256 (32 bytes, present when bit 1 is set),
/// the strategy data sha256 the bundle manifest names (32 bytes, present when bit 2 is set) and the evidence class
/// (`class_len` bytes).  Returns the Status discriminant; a frame that does not fit the input
/// buffer returns EXHAUSTED without touching the workspace.
#[no_mangle]
pub extern "C" fn observe(name_len: u64, class_len: u64, flags: u32) -> u32 {
    let (ws, input) = unsafe { (&mut *WS.0.get(), &*IN.0.get()) };
    let name_len = name_len as usize;
    let class_len = class_len as usize;
    let shas =
        32 * ((flags & 1) as usize + ((flags >> 1) & 1) as usize + ((flags >> 2) & 1) as usize);
    if name_len > IO_BYTES || class_len > IO_BYTES || name_len + shas + class_len > IO_BYTES {
        return Status::Exhausted as u32;
    }
    let name = &input[..name_len];
    let mut off = name_len;
    let mut take = |present: bool| -> Option<&[u8; 32]> {
        if !present {
            return None;
        }
        let a: &[u8; 32] = input[off..off + 32].try_into().ok()?;
        off += 32;
        Some(a)
    };
    let after = take(flags & 1 != 0);
    let lineage = take(flags & 2 != 0);
    let strategy_data = take(flags & 4 != 0);
    let class = &input[off..off + class_len];
    factc_kernel::observe(ws, name, after, lineage, strategy_data, class) as u32
}

/// CHECK_OR_COMPILE: mode 0 = ANALYZE, 1 = BUILD.  Returns the Status discriminant.
#[no_mangle]
pub extern "C" fn check_or_compile(mode: u32) -> u32 {
    let ws = unsafe { &mut *WS.0.get() };
    let m = if mode == 1 {
        Mode::Build
    } else {
        Mode::Analyze
    };
    factc_kernel::check_or_compile(ws, m) as u32
}

/// READ_DIAGNOSTICS: render JSON into the output buffer; returns byte length (0 = output too small).
#[no_mangle]
pub extern "C" fn read_diagnostics() -> u64 {
    let (ws, out) = unsafe { (&*WS.0.get(), &mut *OUT.0.get()) };
    let mut buf = OutBuf::new(out);
    match factc_kernel::read_diagnostics(ws, &mut buf) {
        Ok(()) => buf.len() as u64,
        Err(_) => 0,
    }
}

#[no_mangle]
pub extern "C" fn read_artifact_metadata() -> u64 {
    let (ws, out) = unsafe { (&*WS.0.get(), &mut *OUT.0.get()) };
    let mut buf = OutBuf::new(out);
    match factc_kernel::read_artifact_metadata(ws, &mut buf) {
        Ok(()) => buf.len() as u64,
        Err(_) => 0,
    }
}

/// READ_ARTIFACT: bytes of artifact `index` into the output buffer; returns the byte length (0 = no such artifact
/// or output too small).
#[no_mangle]
pub extern "C" fn artifact_count() -> u64 {
    let ws = unsafe { &*WS.0.get() };
    factc_kernel::artifact_count(ws) as u64
}

#[no_mangle]
pub extern "C" fn read_artifact(index: u64) -> u64 {
    let (ws, out) = unsafe { (&*WS.0.get(), &mut *OUT.0.get()) };
    let mut buf = OutBuf::new(out);
    match factc_kernel::read_artifact(ws, index as usize, &mut buf) {
        Ok(()) => buf.len() as u64,
        Err(_) => 0,
    }
}

/// READ_BUNDLE_FILE: `bundle_file_path` / `bundle_file_bytes` copy the path / the bytes of generated bundle file
/// `index` into the output buffer and return the length (0 = no such file or output too small).
#[no_mangle]
pub extern "C" fn bundle_file_count() -> u64 {
    let ws = unsafe { &*WS.0.get() };
    factc_kernel::bundle_file_count(ws) as u64
}

fn bundle_part(index: u64, which: usize) -> u64 {
    let (ws, out) = unsafe { (&*WS.0.get(), &mut *OUT.0.get()) };
    let Some((path, bytes)) = factc_kernel::bundle_file(ws, index as usize) else {
        return 0;
    };
    let mut buf = OutBuf::new(out);
    let part = if which == 0 { path } else { bytes };
    match buf.bytes(part) {
        Ok(()) => buf.len() as u64,
        Err(_) => 0,
    }
}

#[no_mangle]
pub extern "C" fn bundle_file_path(index: u64) -> u64 {
    bundle_part(index, 0)
}

#[no_mangle]
pub extern "C" fn bundle_file_bytes(index: u64) -> u64 {
    bundle_part(index, 1)
}

#[no_mangle]
pub extern "C" fn reset_workspace() -> u32 {
    let ws = unsafe { &mut *WS.0.get() };
    factc_kernel::reset_workspace(ws);
    Status::Idle as u32
}
