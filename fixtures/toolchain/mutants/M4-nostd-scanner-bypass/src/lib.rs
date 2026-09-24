//! Mutant: declares #![no_std], but after an early `#[cfg(test)]` item the file links std for production code.
//! factory nostd-check stops scanning at the first #[cfg(test)] line of a file; ::std and grouped-use forms escape too.
#![no_std]

#[cfg(test)]
fn marker_the_textual_scanner_stops_here() {}

extern crate std;
use ::std::collections::BTreeMap;

pub fn table() -> BTreeMap<u32, u32> {
    let mut t = BTreeMap::new();
    t.insert(1, 2);
    t
}

#[cfg(test)]
mod t {
    #[test]
    fn native_is_green() { assert_eq!(super::table().len(), 1); }
}
