//! Path authority arithmetic: MAY READ / MAY CHANGE / MUST NOT CHANGE are prefix sets.

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
