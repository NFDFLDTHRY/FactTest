//! Wasm export surface for the bootstrap ABI (C14).  The workspace and I/O buffers live in static linear memory
//! so that the host only ever exchanges (address, length) pairs; addresses are i64 on wasm64.
//!
//! This crate is transport.  It defines no source-language semantics.
#![no_std]

use core::cell::UnsafeCell;
use factc_foundation::OutBuf;
use factc_kernel::{Mode, Status, Workspace};

pub const IO_BYTES: usize = 256 * 1024;

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

#[no_mangle]
pub extern "C" fn reset_workspace() -> u32 {
    let ws = unsafe { &mut *WS.0.get() };
    factc_kernel::reset_workspace(ws);
    Status::Idle as u32
}
