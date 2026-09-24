//! Bounded-arena capacities.  These are bootstrap workspace limits (C2), not language semantics.
//! Exceeding one yields a WORKSPACE_EXHAUSTED / OUTPUT_TOO_SMALL diagnostic.

pub const MAX_SOURCE_UNITS: usize = 8;
pub const SOURCE_BYTES: usize = 64 * 1024;
pub const MAX_ISLANDS: usize = 512;
pub const MAX_TOKENS_PER_ISLAND: usize = 48;
pub const MAX_DIAGNOSTICS: usize = 256;
pub const MAX_ARTIFACTS: usize = 32;
pub const TEXT_ARENA_BYTES: usize = 32 * 1024;
pub const MAX_OBJECTS: usize = 256;
pub const MAX_RELATIONS: usize = 256;
pub const MAX_EXPR_NODES: usize = 512;
pub const MAX_INPUT_IDS: usize = 4;
pub const MAX_CONTRACTS: usize = 96;
pub const MAX_VARIANTS: usize = 16;
pub const MAX_PATH_LEN: usize = 6;
