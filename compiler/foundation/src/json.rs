//! Deterministic JSON writer over an `OutBuf`.  No parser here: the kernel never consumes JSON.

use crate::buf::{OutBuf, OutputTooSmall};
use crate::bvec::BVec;

#[derive(Debug)]
pub struct JsonW<'a, 'b> {
    out: &'b mut OutBuf<'a>,
    /// stack of "has emitted an element" flags per open container
    stack: BVec<bool, 32>,
    pending_value: bool,
}

impl<'a, 'b> JsonW<'a, 'b> {
    pub fn new(out: &'b mut OutBuf<'a>) -> Self {
        JsonW {
            out,
            stack: BVec::new(),
            pending_value: false,
        }
    }
    fn sep(&mut self) -> Result<(), OutputTooSmall> {
        let n = self.stack.len();
        if n > 0 {
            if self.stack[n - 1] {
                self.out.byte(b',')?;
            }
            self.stack[n - 1] = true;
        }
        Ok(())
    }
    pub fn obj_begin(&mut self) -> Result<(), OutputTooSmall> {
        self.sep()?;
        self.out.byte(b'{')?;
        self.stack.push(false).map_err(|_| OutputTooSmall)?;
        Ok(())
    }
    pub fn obj_end(&mut self) -> Result<(), OutputTooSmall> {
        self.stack.truncate(self.stack.len().saturating_sub(1));
        self.out.byte(b'}')
    }
    pub fn arr_begin(&mut self) -> Result<(), OutputTooSmall> {
        self.sep()?;
        self.out.byte(b'[')?;
        self.stack.push(false).map_err(|_| OutputTooSmall)?;
        Ok(())
    }
    pub fn arr_end(&mut self) -> Result<(), OutputTooSmall> {
        self.stack.truncate(self.stack.len().saturating_sub(1));
        self.out.byte(b']')
    }
    pub fn key(&mut self, k: &str) -> Result<(), OutputTooSmall> {
        self.sep()?;
        self.string_raw(k.as_bytes())?;
        self.out.byte(b':')?;
        // the value that follows is bound to this key: no separator before it
        self.pending_value = true;
        Ok(())
    }
    fn value_sep(&mut self) -> Result<(), OutputTooSmall> {
        if self.pending_value {
            self.pending_value = false;
            let n = self.stack.len();
            if n > 0 {
                self.stack[n - 1] = true;
            }
            Ok(())
        } else {
            self.sep()
        }
    }
    pub fn str(&mut self, s: &[u8]) -> Result<(), OutputTooSmall> {
        self.value_sep()?;
        self.string_raw(s)
    }
    pub fn int(&mut self, v: i64) -> Result<(), OutputTooSmall> {
        self.value_sep()?;
        self.out.i64(v)
    }
    pub fn uint(&mut self, v: u64) -> Result<(), OutputTooSmall> {
        self.value_sep()?;
        self.out.u64(v)
    }
    pub fn bool(&mut self, v: bool) -> Result<(), OutputTooSmall> {
        self.value_sep()?;
        self.out.str(if v { "true" } else { "false" })
    }
    pub fn null(&mut self) -> Result<(), OutputTooSmall> {
        self.value_sep()?;
        self.out.str("null")
    }
    pub fn hex(&mut self, data: &[u8]) -> Result<(), OutputTooSmall> {
        self.value_sep()?;
        self.out.byte(b'"')?;
        self.out.hex(data)?;
        self.out.byte(b'"')
    }
    pub fn obj(&mut self) -> Result<(), OutputTooSmall> {
        self.value_sep()?;
        self.out.byte(b'{')?;
        self.stack.push(false).map_err(|_| OutputTooSmall)?;
        Ok(())
    }
    pub fn arr(&mut self) -> Result<(), OutputTooSmall> {
        self.value_sep()?;
        self.out.byte(b'[')?;
        self.stack.push(false).map_err(|_| OutputTooSmall)?;
        Ok(())
    }
    pub fn kv_str(&mut self, k: &str, v: &[u8]) -> Result<(), OutputTooSmall> {
        self.key(k)?;
        self.str(v)
    }
    pub fn kv_int(&mut self, k: &str, v: i64) -> Result<(), OutputTooSmall> {
        self.key(k)?;
        self.int(v)
    }
    pub fn kv_uint(&mut self, k: &str, v: u64) -> Result<(), OutputTooSmall> {
        self.key(k)?;
        self.uint(v)
    }
    pub fn kv_bool(&mut self, k: &str, v: bool) -> Result<(), OutputTooSmall> {
        self.key(k)?;
        self.bool(v)
    }
    pub fn kv_hex(&mut self, k: &str, v: &[u8]) -> Result<(), OutputTooSmall> {
        self.key(k)?;
        self.hex(v)
    }
    pub fn kv_null(&mut self, k: &str) -> Result<(), OutputTooSmall> {
        self.key(k)?;
        self.null()
    }
    fn string_raw(&mut self, s: &[u8]) -> Result<(), OutputTooSmall> {
        self.out.byte(b'"')?;
        for &b in s {
            match b {
                b'"' => self.out.bytes(b"\\\"")?,
                b'\\' => self.out.bytes(b"\\\\")?,
                b'\n' => self.out.bytes(b"\\n")?,
                b'\r' => self.out.bytes(b"\\r")?,
                b'\t' => self.out.bytes(b"\\t")?,
                0..=0x1f => {
                    self.out.bytes(b"\\u00")?;
                    self.out.byte(crate::hex::DIGITS[(b >> 4) as usize])?;
                    self.out.byte(crate::hex::DIGITS[(b & 0xf) as usize])?;
                }
                _ => self.out.byte(b)?,
            }
        }
        self.out.byte(b'"')
    }
}
