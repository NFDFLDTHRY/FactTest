//! Mutant: a perfectly valid wasm module built for wasm32-unknown-unknown.  "cargo build for a wasm target
//! succeeded and a .wasm exists" is not a wasm64 proof; the memory address type is i32.
#![no_std]
#[panic_handler]
fn panic(_: &core::panic::PanicInfo) -> ! { loop {} }
static mut BUF: [u8; 64] = [0; 64];
#[no_mangle]
pub extern "C" fn query_abi_version() -> u32 { 1 }
#[no_mangle]
pub extern "C" fn input_buffer_ptr() -> *mut u8 { unsafe { core::ptr::addr_of_mut!(BUF) as *mut u8 } }
