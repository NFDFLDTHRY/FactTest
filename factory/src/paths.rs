//! Path authority arithmetic: MAY READ / MAY CHANGE / MUST NOT CHANGE are prefix sets.
//!
//! Surfaces are LITERAL: the exact entry "*", a directory prefix ending in '/', or an exact file.  There is no glob
//! semantics, so an entry that looks like a pattern would silently authorize or protect nothing;
//! `validate_surface` rejects such entries wherever a surface is declared (delta, fixture, station spec).

/// A surface entry ending in '/' authorizes the whole directory; otherwise an exact file.
pub fn covers(surface: &str, path: &str) -> bool {
    if surface == "*" {
        return true;
    }
    if let Some(dir) = surface.strip_suffix('/') {
        dir.is_empty() || path == dir || path.starts_with(&format!("{}/", dir))
    } else {
        path == surface
    }
}

pub fn within(surfaces: &[String], path: &str) -> bool {
    surfaces.iter().any(|s| covers(s, path))
}

/// Every path authorized by `narrow` must be authorized by `wide` (fixture <= station law).
pub fn subset(narrow: &[String], wide: &[String]) -> Vec<String> {
    narrow
        .iter()
        .filter(|n| {
            let probe = n.strip_suffix('/').unwrap_or(n);
            !within(wide, probe)
        })
        .cloned()
        .collect()
}

pub fn overlap(a: &[String], b: &[String]) -> Vec<String> {
    let mut out = Vec::new();
    for x in a {
        for y in b {
            let px = x.strip_suffix('/').unwrap_or(x);
            let py = y.strip_suffix('/').unwrap_or(y);
            if covers(x, py) || covers(y, px) {
                out.push(format!("{} <-> {}", x, y));
            }
        }
    }
    out
}

/// Characters that would make an entry look like a pattern under the literal rule.
const PATTERN_CHARS: [char; 7] = ['*', '?', '[', ']', '{', '}', '\\'];

/// A surface entry is valid when `covers()` gives it the meaning it appears to have: the exact entry "*", or a
/// relative path without pattern characters, empty/"."/".." segments or a leading '/'.
pub fn validate_surface(surface: &str) -> Result<(), String> {
    if surface == "*" {
        return Ok(());
    }
    if surface.is_empty() {
        return Err("empty surface".into());
    }
    if let Some(c) = surface.chars().find(|c| PATTERN_CHARS.contains(c)) {
        return Err(format!(
            "{:?}: '{}' has no meaning under literal path authority (only the exact entry \"*\" is special)",
            surface, c
        ));
    }
    if surface.starts_with('/') {
        return Err(format!("{:?}: absolute path", surface));
    }
    let body = surface.strip_suffix('/').unwrap_or(surface);
    if body
        .split('/')
        .any(|seg| seg.is_empty() || seg == "." || seg == "..")
    {
        return Err(format!("{:?}: empty, '.' or '..' segment", surface));
    }
    Ok(())
}

/// Every invalid entry of a surface list, with the reason.
pub fn invalid_surfaces(surfaces: &[String]) -> Vec<String> {
    surfaces
        .iter()
        .filter_map(|s| validate_surface(s).err())
        .collect()
}
