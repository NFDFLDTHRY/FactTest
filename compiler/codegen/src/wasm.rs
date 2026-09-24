//! First-party WebAssembly binary emitter for wasm64 modules.
//!
//! Authority: binary format https://webassembly.github.io/spec/core/binary/index.html ;
//! memory type with i64 address (limits flag bit 2) https://webassembly.github.io/spec/core/text/types.html#text-memtype ;
//! memory.copy (bulk memory) https://webassembly.github.io/spec/core/binary/instructions.html#memory-instructions
//!
//! The emitter builds a module from a bounded function library.  It never emits an i32-address memory.

use factc_foundation::{OutBuf, OutputTooSmall};

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum FuncKind {
    /// () -> i32 constant
    ConstI32(i32),
    /// () -> i64 constant
    ConstI64(i64),
    /// (src: i64, dst: i64, len: i64) -> () ; memory.copy within memory 0
    CopyBytes,
}

#[derive(Copy, Clone, Debug)]
pub struct Func {
    pub name: &'static str,
    pub kind: FuncKind,
}

pub struct ModuleSpec<'a> {
    pub memory_min_pages: u64,
    pub memory_export: &'static str,
    pub funcs: &'a [Func],
}

fn leb_u(out: &mut OutBuf<'_>, mut v: u64) -> Result<(), OutputTooSmall> {
    loop {
        let b = (v & 0x7f) as u8;
        v >>= 7;
        if v == 0 {
            return out.byte(b);
        }
        out.byte(b | 0x80)?;
    }
}

fn leb_s(out: &mut OutBuf<'_>, mut v: i64) -> Result<(), OutputTooSmall> {
    loop {
        let b = (v & 0x7f) as u8;
        v >>= 7;
        let done = (v == 0 && b & 0x40 == 0) || (v == -1 && b & 0x40 != 0);
        if done {
            return out.byte(b);
        }
        out.byte(b | 0x80)?;
    }
}

/// Write a section: id, size, payload (payload produced into a scratch buffer first).
fn section(out: &mut OutBuf<'_>, id: u8, payload: &[u8]) -> Result<(), OutputTooSmall> {
    out.byte(id)?;
    leb_u(out, payload.len() as u64)?;
    out.bytes(payload)
}

/// Distinct function types used, in a fixed order: 0: ()->i32, 1: ()->i64, 2: (i64,i64,i64)->()
fn type_index(k: FuncKind) -> u64 {
    match k {
        FuncKind::ConstI32(_) => 0,
        FuncKind::ConstI64(_) => 1,
        FuncKind::CopyBytes => 2,
    }
}

pub fn emit(spec: &ModuleSpec<'_>, out: &mut OutBuf<'_>) -> Result<(), OutputTooSmall> {
    out.bytes(b"\0asm")?;
    out.bytes(&[1, 0, 0, 0])?;
    let mut scratch = [0u8; 4096];
    // type section
    {
        let mut p = OutBuf::new(&mut scratch);
        leb_u(&mut p, 3)?;
        p.bytes(&[0x60, 0x00, 0x01, 0x7f])?; // () -> i32
        p.bytes(&[0x60, 0x00, 0x01, 0x7e])?; // () -> i64
        p.bytes(&[0x60, 0x03, 0x7e, 0x7e, 0x7e, 0x00])?; // (i64,i64,i64) -> ()
        let n = p.len();
        section(out, 1, &scratch[..n])?;
    }
    // function section
    {
        let mut p = OutBuf::new(&mut scratch);
        leb_u(&mut p, spec.funcs.len() as u64)?;
        for f in spec.funcs {
            leb_u(&mut p, type_index(f.kind))?;
        }
        let n = p.len();
        section(out, 3, &scratch[..n])?;
    }
    // memory section: one memory, limits flags 0x04 (i64 address type, no max, not shared)
    {
        let mut p = OutBuf::new(&mut scratch);
        leb_u(&mut p, 1)?;
        p.byte(0x04)?;
        leb_u(&mut p, spec.memory_min_pages)?;
        let n = p.len();
        section(out, 5, &scratch[..n])?;
    }
    // export section
    {
        let mut p = OutBuf::new(&mut scratch);
        leb_u(&mut p, spec.funcs.len() as u64 + 1)?;
        leb_u(&mut p, spec.memory_export.len() as u64)?;
        p.bytes(spec.memory_export.as_bytes())?;
        p.byte(0x02)?; // memory export
        leb_u(&mut p, 0)?;
        for (i, f) in spec.funcs.iter().enumerate() {
            leb_u(&mut p, f.name.len() as u64)?;
            p.bytes(f.name.as_bytes())?;
            p.byte(0x00)?; // func export
            leb_u(&mut p, i as u64)?;
        }
        let n = p.len();
        section(out, 7, &scratch[..n])?;
    }
    // code section
    {
        let mut p = OutBuf::new(&mut scratch);
        leb_u(&mut p, spec.funcs.len() as u64)?;
        for f in spec.funcs {
            let mut body = [0u8; 64];
            let mut b = OutBuf::new(&mut body);
            b.byte(0x00)?; // no locals
            match f.kind {
                FuncKind::ConstI32(v) => {
                    b.byte(0x41)?; // i32.const
                    leb_s(&mut b, v as i64)?;
                }
                FuncKind::ConstI64(v) => {
                    b.byte(0x42)?; // i64.const
                    leb_s(&mut b, v)?;
                }
                FuncKind::CopyBytes => {
                    // memory.copy pops (dst, src, len): push dst=param1, src=param0, len=param2
                    b.bytes(&[0x20, 0x01, 0x20, 0x00, 0x20, 0x02])?;
                    b.bytes(&[0xFC, 0x0A, 0x00, 0x00])?; // memory.copy mem0 mem0
                }
            }
            b.byte(0x0b)?; // end
            let n = b.len();
            leb_u(&mut p, n as u64)?;
            p.bytes(&body[..n])?;
        }
        let n = p.len();
        section(out, 10, &scratch[..n])?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn emits_memory64_module_with_exports() {
        let funcs = [
            Func {
                name: "abi_version",
                kind: FuncKind::ConstI32(1),
            },
            Func {
                name: "copy_bytes",
                kind: FuncKind::CopyBytes,
            },
            Func {
                name: "region_in",
                kind: FuncKind::ConstI64(0),
            },
        ];
        let spec = ModuleSpec {
            memory_min_pages: 32,
            memory_export: "memory",
            funcs: &funcs,
        };
        let mut bytes = [0u8; 1024];
        let mut o = OutBuf::new(&mut bytes);
        emit(&spec, &mut o).unwrap();
        let info = factc_foundation::wasm::read(o.as_slice()).unwrap();
        assert!(info.all_memories_i64());
        assert_eq!(info.memories[0].min, 32);
        assert!(info.export_named(o.as_slice(), b"memory"));
        assert!(info.export_named(o.as_slice(), b"copy_bytes"));
        assert!(info.export_named(o.as_slice(), b"region_in"));
        assert!(info.imports.is_empty());
    }
}
