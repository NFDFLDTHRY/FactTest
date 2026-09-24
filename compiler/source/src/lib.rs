//! FactTest front end (ASCII-GRAMMAR.md sections 1-2, 21).
//!
//! The ONLY way bytes become semantics is a semantic island `@{...}`.  Nothing here looks at boxes, arrows,
//! alignment or prose.  Everything outside islands is presentation tape.
#![no_std]
#![forbid(unsafe_code)]

pub mod ast;
pub mod lexer;
pub mod parser;
pub mod scanner;

pub use ast::*;
pub use scanner::{scan, Island};
