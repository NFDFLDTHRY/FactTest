//! Interned byte strings inside a caller-owned arena.  A `Str` is a handle, never an identity.

use crate::bvec::Exhausted;

#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Default)]
pub struct Str {
    off: u32,
    len: u32,
}

impl Str {
    pub const EMPTY: Str = Str { off: 0, len: 0 };
    pub const fn len(&self) -> usize {
        self.len as usize
    }
    pub const fn is_empty(&self) -> bool {
        self.len == 0
    }
}

#[derive(Clone, Debug)]
pub struct TextArena<const N: usize> {
    bytes: [u8; N],
    used: usize,
}

impl<const N: usize> Default for TextArena<N> {
    fn default() -> Self {
        Self::new()
    }
}

impl<const N: usize> TextArena<N> {
    pub const fn new() -> Self {
        TextArena {
            bytes: [0; N],
            used: 0,
        }
    }
    pub fn clear(&mut self) {
        self.used = 0;
    }
    pub fn used(&self) -> usize {
        self.used
    }
    /// Intern bytes; identical content returns the existing handle (linear scan; arenas are small).
    pub fn intern(&mut self, s: &[u8]) -> Result<Str, Exhausted> {
        if let Some(existing) = self.find(s) {
            return Ok(existing);
        }
        if self.used + s.len() > N {
            return Err(Exhausted);
        }
        let off = self.used;
        self.bytes[off..off + s.len()].copy_from_slice(s);
        self.used += s.len();
        Ok(Str {
            off: off as u32,
            len: s.len() as u32,
        })
    }
    fn find(&self, s: &[u8]) -> Option<Str> {
        if s.is_empty() {
            return Some(Str::EMPTY);
        }
        let hay = &self.bytes[..self.used];
        if hay.len() < s.len() {
            return None;
        }
        (0..=hay.len() - s.len())
            .find(|&i| &hay[i..i + s.len()] == s)
            .map(|i| Str {
                off: i as u32,
                len: s.len() as u32,
            })
    }
    pub fn get(&self, s: Str) -> &[u8] {
        let o = s.off as usize;
        let e = o + s.len as usize;
        if e <= self.used {
            &self.bytes[o..e]
        } else {
            &[]
        }
    }
    pub fn eq(&self, a: Str, b: Str) -> bool {
        self.get(a) == self.get(b)
    }
    pub fn cmp(&self, a: Str, b: Str) -> core::cmp::Ordering {
        self.get(a).cmp(self.get(b))
    }
    pub fn eq_bytes(&self, a: Str, b: &[u8]) -> bool {
        self.get(a) == b
    }
}
