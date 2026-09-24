//! Caller-provided output buffer with a cursor.  Overflow is a structured error (OUTPUT_TOO_SMALL).

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub struct OutputTooSmall;

#[derive(Debug)]
pub struct OutBuf<'a> {
    bytes: &'a mut [u8],
    len: usize,
}

impl<'a> OutBuf<'a> {
    pub fn new(bytes: &'a mut [u8]) -> Self {
        OutBuf { bytes, len: 0 }
    }
    pub fn len(&self) -> usize {
        self.len
    }
    pub fn is_empty(&self) -> bool {
        self.len == 0
    }
    pub fn capacity(&self) -> usize {
        self.bytes.len()
    }
    pub fn as_slice(&self) -> &[u8] {
        &self.bytes[..self.len]
    }
    pub fn truncate(&mut self, n: usize) {
        if n < self.len {
            self.len = n;
        }
    }
    pub fn bytes(&mut self, s: &[u8]) -> Result<(), OutputTooSmall> {
        if self.len + s.len() > self.bytes.len() {
            return Err(OutputTooSmall);
        }
        self.bytes[self.len..self.len + s.len()].copy_from_slice(s);
        self.len += s.len();
        Ok(())
    }
    pub fn byte(&mut self, b: u8) -> Result<(), OutputTooSmall> {
        self.bytes(&[b])
    }
    pub fn str(&mut self, s: &str) -> Result<(), OutputTooSmall> {
        self.bytes(s.as_bytes())
    }
    pub fn u64(&mut self, mut v: u64) -> Result<(), OutputTooSmall> {
        let mut tmp = [0u8; 20];
        let mut i = tmp.len();
        if v == 0 {
            return self.byte(b'0');
        }
        while v > 0 {
            i -= 1;
            tmp[i] = b'0' + (v % 10) as u8;
            v /= 10;
        }
        self.bytes(&tmp[i..])
    }
    pub fn i64(&mut self, v: i64) -> Result<(), OutputTooSmall> {
        if v < 0 {
            self.byte(b'-')?;
            self.u64(v.unsigned_abs())
        } else {
            self.u64(v as u64)
        }
    }
    pub fn hex(&mut self, data: &[u8]) -> Result<(), OutputTooSmall> {
        for b in data {
            self.byte(crate::hex::DIGITS[(b >> 4) as usize])?;
            self.byte(crate::hex::DIGITS[(b & 0xf) as usize])?;
        }
        Ok(())
    }
    /// Repeat a byte n times (used by ASCII renderers for padding).
    pub fn fill(&mut self, b: u8, n: usize) -> Result<(), OutputTooSmall> {
        for _ in 0..n {
            self.byte(b)?;
        }
        Ok(())
    }
}
