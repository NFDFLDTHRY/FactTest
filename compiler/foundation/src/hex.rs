pub const DIGITS: &[u8; 16] = b"0123456789abcdef";

pub fn encode_into(data: &[u8], out: &mut [u8]) -> usize {
    let n = core::cmp::min(out.len() / 2, data.len());
    for i in 0..n {
        out[2 * i] = DIGITS[(data[i] >> 4) as usize];
        out[2 * i + 1] = DIGITS[(data[i] & 0xf) as usize];
    }
    2 * n
}

pub fn decode_nibble(c: u8) -> Option<u8> {
    match c {
        b'0'..=b'9' => Some(c - b'0'),
        b'a'..=b'f' => Some(c - b'a' + 10),
        b'A'..=b'F' => Some(c - b'A' + 10),
        _ => None,
    }
}

/// Decode hex text (whitespace-separated or contiguous) into `out`; returns bytes written or None on bad digit.
pub fn decode_into(text: &[u8], out: &mut [u8]) -> Option<usize> {
    let mut n = 0;
    let mut hi: Option<u8> = None;
    for &c in text {
        if c == b' ' || c == b'\n' || c == b'\r' || c == b'\t' {
            continue;
        }
        let v = decode_nibble(c)?;
        match hi {
            None => hi = Some(v),
            Some(h) => {
                if n >= out.len() {
                    return None;
                }
                out[n] = (h << 4) | v;
                n += 1;
                hi = None;
            }
        }
    }
    if hi.is_some() {
        return None;
    }
    Some(n)
}
