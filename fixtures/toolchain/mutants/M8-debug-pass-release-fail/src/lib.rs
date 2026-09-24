//! Mutant: bounded-arena index arithmetic whose only "bounds check" is the debug-profile overflow panic.
//! The #[should_panic] witness passes in debug and fails in release, where the addition wraps silently.
#![no_std]

pub fn next_slot(cur: u8, step: u8) -> u8 {
    cur + step
}

#[cfg(test)]
mod t {
    extern crate std;
    #[test]
    #[should_panic]
    fn slot_overflow_is_rejected() {
        let cur = std::hint::black_box(250u8);
        let _ = super::next_slot(cur, 10);
    }
}
