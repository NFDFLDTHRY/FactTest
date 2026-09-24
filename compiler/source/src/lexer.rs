//! Tokens inside one semantic island (ASCII-GRAMMAR.md section 2).

use factc_foundation::{BVec, SourceId, Span};

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum TokKind {
    Ident,
    Str,
    Int,
    Colon,
    Eq,
    Arrow,
    DColon,
    Dot,
    LParen,
    RParen,
    Comma,
    Bad,
}

#[derive(Copy, Clone, Debug)]
pub struct Tok {
    pub kind: TokKind,
    /// span of the token text (for Str: without the quotes)
    pub span: Span,
    pub int: u64,
}

pub fn is_ident_start(c: u8) -> bool {
    c.is_ascii_alphabetic() || c == b'_'
}
pub fn is_ident_char(c: u8) -> bool {
    c.is_ascii_alphanumeric() || c == b'_' || c == b'-'
}

/// Tokenize `src[start..end]`.  Returns Err(span) at the first bad byte.
pub fn lex<const N: usize>(
    src: &[u8],
    source: SourceId,
    start: u32,
    end: u32,
    out: &mut BVec<Tok, N>,
) -> Result<(), Span> {
    let mut i = start as usize;
    let end = end as usize;
    let sp = |a: usize, b: usize| Span::new(source, a as u32, b as u32).unwrap_or_default();
    while i < end {
        let c = src[i];
        if c == b' ' || c == b'\t' {
            i += 1;
            continue;
        }
        let (kind, len, int) = if is_ident_start(c) {
            let mut j = i + 1;
            while j < end && is_ident_char(src[j]) {
                // do not swallow the `-` of an `->` glued to an identifier
                if src[j] == b'-' && j + 1 < end && src[j + 1] == b'>' {
                    break;
                }
                j += 1;
            }
            (TokKind::Ident, j - i, 0)
        } else if c.is_ascii_digit() {
            let mut j = i;
            let mut v: u64 = 0;
            while j < end && src[j].is_ascii_digit() {
                v = v.saturating_mul(10).saturating_add((src[j] - b'0') as u64);
                j += 1;
            }
            (TokKind::Int, j - i, v)
        } else if c == b'"' {
            let mut j = i + 1;
            let mut ok = false;
            while j < end {
                if src[j] == b'\\' {
                    j += 2;
                    continue;
                }
                if src[j] == b'"' {
                    ok = true;
                    break;
                }
                j += 1;
            }
            if !ok {
                return Err(sp(i, end));
            }
            let tok = Tok {
                kind: TokKind::Str,
                span: sp(i + 1, j),
                int: 0,
            };
            out.push(tok).map_err(|_| sp(i, j + 1))?;
            i = j + 1;
            continue;
        } else if c == b'-' && i + 1 < end && src[i + 1] == b'>' {
            (TokKind::Arrow, 2, 0)
        } else if c == b':' && i + 1 < end && src[i + 1] == b':' {
            (TokKind::DColon, 2, 0)
        } else {
            let k = match c {
                b':' => TokKind::Colon,
                b'=' => TokKind::Eq,
                b'.' => TokKind::Dot,
                b'(' => TokKind::LParen,
                b')' => TokKind::RParen,
                b',' => TokKind::Comma,
                _ => return Err(sp(i, i + 1)),
            };
            (k, 1, 0)
        };
        out.push(Tok {
            kind,
            span: sp(i, i + len),
            int,
        })
        .map_err(|_| sp(i, i + len))?;
        i += len;
    }
    Ok(())
}
