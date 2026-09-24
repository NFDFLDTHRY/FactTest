//! Bounded vector over a caller-sized inline array.  No allocation; exhaustion is a value.

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub struct Exhausted;

#[derive(Clone, Debug)]
pub struct BVec<T: Copy, const N: usize> {
    items: [Option<T>; N],
    len: usize,
}

impl<T: Copy, const N: usize> Default for BVec<T, N> {
    fn default() -> Self {
        Self::new()
    }
}

impl<T: Copy, const N: usize> BVec<T, N> {
    pub const fn new() -> Self {
        BVec {
            items: [None; N],
            len: 0,
        }
    }
    pub const fn capacity(&self) -> usize {
        N
    }
    pub fn len(&self) -> usize {
        self.len
    }
    pub fn is_empty(&self) -> bool {
        self.len == 0
    }
    pub fn clear(&mut self) {
        for i in 0..self.len {
            self.items[i] = None;
        }
        self.len = 0;
    }
    pub fn push(&mut self, v: T) -> Result<usize, Exhausted> {
        if self.len >= N {
            return Err(Exhausted);
        }
        self.items[self.len] = Some(v);
        self.len += 1;
        Ok(self.len - 1)
    }
    pub fn get(&self, i: usize) -> Option<&T> {
        if i < self.len {
            self.items[i].as_ref()
        } else {
            None
        }
    }
    pub fn get_mut(&mut self, i: usize) -> Option<&mut T> {
        if i < self.len {
            self.items[i].as_mut()
        } else {
            None
        }
    }
    pub fn iter(&self) -> impl Iterator<Item = &T> + '_ {
        self.items[..self.len].iter().filter_map(|x| x.as_ref())
    }
    pub fn iter_mut(&mut self) -> impl Iterator<Item = &mut T> + '_ {
        self.items[..self.len].iter_mut().filter_map(|x| x.as_mut())
    }
    pub fn last(&self) -> Option<&T> {
        if self.len == 0 {
            None
        } else {
            self.items[self.len - 1].as_ref()
        }
    }
    pub fn contains_by(&self, f: impl FnMut(&T) -> bool) -> bool {
        self.iter().any(f)
    }
    pub fn position(&self, f: impl FnMut(&T) -> bool) -> Option<usize> {
        self.iter().position(f)
    }
    pub fn truncate(&mut self, n: usize) {
        while self.len > n {
            self.len -= 1;
            self.items[self.len] = None;
        }
    }
    /// Deterministic in-place insertion sort (stable) by a key; sizes here are small and bounded.
    pub fn sort_by_key<K: Ord>(&mut self, mut key: impl FnMut(&T) -> K) {
        for i in 1..self.len {
            let mut j = i;
            while j > 0 {
                let a = self.items[j - 1].as_ref().map(&mut key);
                let b = self.items[j].as_ref().map(&mut key);
                if a > b {
                    self.items.swap(j - 1, j);
                    j -= 1;
                } else {
                    break;
                }
            }
        }
    }
}

impl<T: Copy, const N: usize> core::ops::Index<usize> for BVec<T, N> {
    type Output = T;
    fn index(&self, i: usize) -> &T {
        self.get(i).expect("BVec index out of bounds")
    }
}

impl<T: Copy, const N: usize> core::ops::IndexMut<usize> for BVec<T, N> {
    fn index_mut(&mut self, i: usize) -> &mut T {
        self.get_mut(i).expect("BVec index out of bounds")
    }
}
