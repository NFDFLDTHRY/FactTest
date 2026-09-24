//! Minimal first-party WebAssembly binary reader: sections, memory limits (address type), imports, exports.
//! Used for B9 module inspection and by the bundle verifier.  It validates structure it reads; it is not a
//! full validator (the host/browser is the validating embedder).
//!
//! Authority: https://webassembly.github.io/spec/core/binary/modules.html
//! Memory address type flag (bit 2 of limits flags = i64): https://webassembly.github.io/spec/core/text/types.html#text-memtype

use crate::bvec::BVec;

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum AddressType {
    I32,
    I64,
}

#[derive(Copy, Clone, Debug)]
pub struct MemoryDecl {
    pub address: AddressType,
    pub shared: bool,
    pub min: u64,
    pub max: Option<u64>,
}

#[derive(Copy, Clone, Debug)]
pub struct Named {
    /// (offset, len) into the module bytes
    pub module: (u32, u32),
    pub name: (u32, u32),
    pub kind: u8,
}

#[derive(Clone, Debug, Default)]
pub struct ModuleInfo {
    pub memories: BVec<MemoryDecl, 4>,
    pub imports: BVec<Named, 32>,
    pub exports: BVec<Named, 64>,
    pub section_ids: BVec<u8, 32>,
}

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum WasmError {
    BadMagic,
    BadVersion,
    Truncated,
    BadLeb,
    TooMany,
}

fn leb_u64(b: &[u8], i: &mut usize) -> Result<u64, WasmError> {
    let mut r: u64 = 0;
    let mut s = 0;
    loop {
        let c = *b.get(*i).ok_or(WasmError::Truncated)?;
        *i += 1;
        r |= ((c & 0x7f) as u64) << s;
        if c < 0x80 {
            return Ok(r);
        }
        s += 7;
        if s > 63 {
            return Err(WasmError::BadLeb);
        }
    }
}

fn name(b: &[u8], i: &mut usize) -> Result<(u32, u32), WasmError> {
    let len = leb_u64(b, i)? as usize;
    let off = *i;
    if off + len > b.len() {
        return Err(WasmError::Truncated);
    }
    *i += len;
    Ok((off as u32, len as u32))
}

fn limits(b: &[u8], i: &mut usize) -> Result<MemoryDecl, WasmError> {
    let flags = *b.get(*i).ok_or(WasmError::Truncated)?;
    *i += 1;
    let min = leb_u64(b, i)?;
    let max = if flags & 1 != 0 {
        Some(leb_u64(b, i)?)
    } else {
        None
    };
    Ok(MemoryDecl {
        address: if flags & 4 != 0 {
            AddressType::I64
        } else {
            AddressType::I32
        },
        shared: flags & 2 != 0,
        min,
        max,
    })
}

pub fn read(b: &[u8]) -> Result<ModuleInfo, WasmError> {
    if b.len() < 8 {
        return Err(WasmError::Truncated);
    }
    if &b[0..4] != b"\0asm" {
        return Err(WasmError::BadMagic);
    }
    if b[4..8] != [1, 0, 0, 0] {
        return Err(WasmError::BadVersion);
    }
    let mut info = ModuleInfo::default();
    let mut i = 8;
    while i < b.len() {
        let id = b[i];
        i += 1;
        let size = leb_u64(b, &mut i)? as usize;
        let start = i;
        let end = start + size;
        if end > b.len() {
            return Err(WasmError::Truncated);
        }
        info.section_ids.push(id).map_err(|_| WasmError::TooMany)?;
        match id {
            2 => {
                let mut j = start;
                let n = leb_u64(b, &mut j)?;
                for _ in 0..n {
                    let module = name(b, &mut j)?;
                    let nm = name(b, &mut j)?;
                    let kind = *b.get(j).ok_or(WasmError::Truncated)?;
                    j += 1;
                    match kind {
                        0 => {
                            leb_u64(b, &mut j)?;
                        }
                        1 => {
                            j += 1;
                            limits(b, &mut j)?;
                        }
                        2 => {
                            let m = limits(b, &mut j)?;
                            info.memories.push(m).map_err(|_| WasmError::TooMany)?;
                        }
                        3 => {
                            j += 2;
                        }
                        _ => return Err(WasmError::Truncated),
                    }
                    info.imports
                        .push(Named {
                            module,
                            name: nm,
                            kind,
                        })
                        .map_err(|_| WasmError::TooMany)?;
                }
            }
            5 => {
                let mut j = start;
                let n = leb_u64(b, &mut j)?;
                for _ in 0..n {
                    let m = limits(b, &mut j)?;
                    info.memories.push(m).map_err(|_| WasmError::TooMany)?;
                }
            }
            7 => {
                let mut j = start;
                let n = leb_u64(b, &mut j)?;
                for _ in 0..n {
                    let nm = name(b, &mut j)?;
                    let kind = *b.get(j).ok_or(WasmError::Truncated)?;
                    j += 1;
                    leb_u64(b, &mut j)?;
                    info.exports
                        .push(Named {
                            module: (0, 0),
                            name: nm,
                            kind,
                        })
                        .map_err(|_| WasmError::TooMany)?;
                }
            }
            _ => {}
        }
        i = end;
    }
    Ok(info)
}

impl ModuleInfo {
    pub fn export_named(&self, bytes: &[u8], nm: &[u8]) -> bool {
        self.exports
            .iter()
            .any(|e| &bytes[e.name.0 as usize..(e.name.0 + e.name.1) as usize] == nm)
    }
    pub fn all_memories_i64(&self) -> bool {
        !self.memories.is_empty() && self.memories.iter().all(|m| m.address == AddressType::I64)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn reads_memory64_flag() {
        let m = [0, b'a', b's', b'm', 1, 0, 0, 0, 5, 3, 1, 0x04, 1];
        let info = read(&m).unwrap();
        assert_eq!(info.memories.len(), 1);
        assert_eq!(info.memories[0].address, AddressType::I64);
        let m32 = [0, b'a', b's', b'm', 1, 0, 0, 0, 5, 3, 1, 0x00, 1];
        assert_eq!(read(&m32).unwrap().memories[0].address, AddressType::I32);
        assert!(!read(&m32).unwrap().all_memories_i64());
    }
    #[test]
    fn rejects_bad_magic() {
        assert_eq!(read(b"nope....").unwrap_err(), WasmError::BadMagic);
    }
}
