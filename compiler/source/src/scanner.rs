//! Semantic-island scanner (ASCII-GRAMMAR.md section 1).
//! - `@{` opens an island; the island ends at the first `}` on the same physical line.
//! - `@@{` is an escaped literal and carries no semantics.
//! - a nested `@{` inside an island is PARSE_NESTED_ISLAND; a newline/EOF before `}` is PARSE_UNCLOSED_ISLAND.

use factc_foundation::{BVec, DiagCode, Diagnostic, Diagnostics, Phase, SourceId, Span};

#[derive(Copy, Clone, Debug)]
pub struct Island {
    /// whole island including `@{` and `}`
    pub span: Span,
    /// statement text between `@{` and `}`
    pub inner: Span,
}

pub fn scan<const N: usize, const D: usize>(
    src: &[u8],
    source: SourceId,
    islands: &mut BVec<Island, N>,
    diags: &mut Diagnostics<D>,
) {
    let mut i = 0usize;
    while i < src.len() {
        if src[i] == b'@' {
            // escaped literal @@{
            if i + 2 < src.len() && src[i + 1] == b'@' && src[i + 2] == b'{' {
                i += 3;
                continue;
            }
            if i + 1 < src.len() && src[i + 1] == b'{' {
                let start = i;
                let mut j = i + 2;
                let mut closed = false;
                while j < src.len() {
                    let c = src[j];
                    if c == b'}' {
                        closed = true;
                        break;
                    }
                    if c == b'\n' || c == b'\r' {
                        break;
                    }
                    if c == b'@' && j + 1 < src.len() && src[j + 1] == b'{' {
                        diags.push(Diagnostic::new(
                            DiagCode::ParseNestedIsland,
                            Phase::Scan,
                            source,
                            Span::new(source, start as u32, (j + 2) as u32),
                            "nested semantic island",
                        ));
                        // treat the rest of the line as consumed
                        while j < src.len() && src[j] != b'\n' {
                            j += 1;
                        }
                        break;
                    }
                    j += 1;
                }
                if closed {
                    let span = Span::new(source, start as u32, (j + 1) as u32).unwrap_or_default();
                    let inner = Span::new(source, (start + 2) as u32, j as u32).unwrap_or_default();
                    if islands.push(Island { span, inner }).is_err() {
                        diags.push(Diagnostic::new(
                            DiagCode::WorkspaceExhausted,
                            Phase::Scan,
                            source,
                            Some(span),
                            "island arena exhausted",
                        ));
                        return;
                    }
                    i = j + 1;
                } else {
                    if j >= src.len() || src[j] == b'\n' || src[j] == b'\r' {
                        diags.push(Diagnostic::new(
                            DiagCode::ParseUnclosedIsland,
                            Phase::Scan,
                            source,
                            Span::new(source, start as u32, j as u32),
                            "unclosed semantic island",
                        ));
                    }
                    i = j;
                }
                continue;
            }
        }
        i += 1;
    }
}
