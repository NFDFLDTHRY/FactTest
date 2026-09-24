//! Contract registry dialect.  One island per record:
//!
//! ```text
//! @{registry <RegistryId> version=<n>}
//! @{representation <RepId> type=<TypeName> domain=<StorageDomain> modes=<m,...|none> lifetime=<word>}
//! @{boundary <TypeName> <RepId>}                      host-boundary representation of a semantic type
//! @{conversion <ConvId> <FromRep> -> <ToRep> mode=<transfer mode> preserves=<value|none> requires=<BackendId|none>}
//! @{backend <BackendId> status=<READY-CONTRACT|GAP|ERR|UNK> capabilities=<c,...|none> accepts=<rep,...|none>
//!           produces=<rep,...|none> modes=<m,...|none> effects=<e,...|none> probes=<p,...|none> recipe=<RecipeId|none>
//!           lifecycle=<s,...|none> failures=<f,...|none>}
//! @{authority_link <BackendId|ConvId> "<url>"}
//! @{recipe <RecipeId> backend=<BackendId> roles=<r,...> exports=<e,...|none> imports=<i,...|none> adapter=<name>}
//! @{metric_value <MetricId> <BackendId> <integer> provenance=<word>}      metric evidence (fixture or measured)
//! @{epoch <EpochId>}                                                     machine epoch header
//! @{admission <BackendId> <ADMITTED|REJECTED> evidence=<word> [reason=<word>]}
//! ```

use factc_foundation::limits::{MAX_CONTRACTS, MAX_ISLANDS};
use factc_foundation::{
    BVec, DiagCode, Diagnostic, Diagnostics, Phase, SourceId, Span, Str, TextArena,
};
use factc_source::lexer::{lex, Tok, TokKind};
use factc_source::Mode;

pub const LIST: usize = 12;

#[derive(Copy, Clone, Debug, Default)]
pub struct StrList {
    pub items: [Option<Str>; LIST],
    pub len: u8,
}

impl StrList {
    pub fn iter(&self) -> impl Iterator<Item = Str> + '_ {
        self.items[..self.len as usize].iter().flatten().copied()
    }
    pub fn push(&mut self, s: Str) -> bool {
        if (self.len as usize) < LIST {
            self.items[self.len as usize] = Some(s);
            self.len += 1;
            true
        } else {
            false
        }
    }
}

#[derive(Copy, Clone, Debug)]
pub struct Representation {
    pub name: Str,
    pub ty: Str,
    pub domain: Str,
    pub modes: [bool; 5],
    pub lifetime: Str,
    pub span: Span,
}

#[derive(Copy, Clone, Debug)]
pub struct Boundary {
    pub ty: Str,
    pub rep: Str,
    pub span: Span,
}

#[derive(Copy, Clone, Debug)]
pub struct Conversion {
    pub name: Str,
    pub from: Str,
    pub to: Str,
    pub mode: Mode,
    pub preserves_value: bool,
    pub requires: Option<Str>,
    pub span: Span,
}

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum ContractStatus {
    ReadyContract,
    Gap,
    Err,
    Unk,
}

impl ContractStatus {
    pub const fn name(self) -> &'static str {
        match self {
            ContractStatus::ReadyContract => "READY-CONTRACT",
            ContractStatus::Gap => "GAP",
            ContractStatus::Err => "ERR",
            ContractStatus::Unk => "UNK",
        }
    }
}

#[derive(Copy, Clone, Debug)]
pub struct Backend {
    pub name: Str,
    pub status: ContractStatus,
    pub capabilities: StrList,
    pub accepts: StrList,
    pub produces: StrList,
    pub modes: [bool; 5],
    pub effects: StrList,
    pub probes: StrList,
    pub recipe: Option<Str>,
    pub lifecycle: StrList,
    pub failures: StrList,
    pub span: Span,
}

#[derive(Copy, Clone, Debug)]
pub struct Recipe {
    pub name: Str,
    pub backend: Str,
    pub roles: StrList,
    pub exports: StrList,
    pub imports: StrList,
    pub adapter: Str,
    pub span: Span,
}

#[derive(Copy, Clone, Debug)]
pub struct AuthorityLink {
    pub subject: Str,
    pub url: Str,
}

#[derive(Copy, Clone, Debug)]
pub struct MetricValue {
    pub metric: Str,
    pub backend: Str,
    pub value: i64,
    pub provenance: Str,
    pub span: Span,
}

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum Decision {
    Admitted,
    Rejected,
}

#[derive(Copy, Clone, Debug)]
pub struct Admission {
    pub backend: Str,
    pub decision: Decision,
    pub evidence: Str,
    pub reason: Option<Str>,
    pub span: Span,
}

#[derive(Clone, Debug)]
pub struct Registry {
    pub text: TextArena<16384>,
    pub id: Option<Str>,
    pub version: u32,
    pub representations: BVec<Representation, 32>,
    pub boundaries: BVec<Boundary, 32>,
    pub conversions: BVec<Conversion, 64>,
    pub backends: BVec<Backend, MAX_CONTRACTS>,
    pub recipes: BVec<Recipe, 32>,
    pub authorities: BVec<AuthorityLink, 96>,
    pub metric_values: BVec<MetricValue, 64>,
    pub epoch: Option<Str>,
    pub admissions: BVec<Admission, 64>,
    pub ok: bool,
}

impl Default for Registry {
    fn default() -> Self {
        Self::new()
    }
}

impl Registry {
    pub const fn new() -> Self {
        Registry {
            text: TextArena::new(),
            id: None,
            version: 0,
            representations: BVec::new(),
            boundaries: BVec::new(),
            conversions: BVec::new(),
            backends: BVec::new(),
            recipes: BVec::new(),
            authorities: BVec::new(),
            metric_values: BVec::new(),
            epoch: None,
            admissions: BVec::new(),
            ok: false,
        }
    }
    pub fn clear(&mut self) {
        *self = Registry::new();
    }
    pub fn name(&self, s: Str) -> &[u8] {
        self.text.get(s)
    }
    pub fn find_rep(&self, n: &[u8]) -> Option<u32> {
        self.representations
            .iter()
            .position(|r| self.text.eq_bytes(r.name, n))
            .map(|i| i as u32)
    }
    pub fn find_backend(&self, n: &[u8]) -> Option<u32> {
        self.backends
            .iter()
            .position(|b| self.text.eq_bytes(b.name, n))
            .map(|i| i as u32)
    }
    pub fn find_recipe(&self, n: &[u8]) -> Option<u32> {
        self.recipes
            .iter()
            .position(|r| self.text.eq_bytes(r.name, n))
            .map(|i| i as u32)
    }
    pub fn find_conversion(&self, n: &[u8]) -> Option<u32> {
        self.conversions
            .iter()
            .position(|c| self.text.eq_bytes(c.name, n))
            .map(|i| i as u32)
    }
    pub fn boundary_for(&self, ty: &[u8]) -> Option<u32> {
        self.boundaries
            .iter()
            .find(|b| self.text.eq_bytes(b.ty, ty))
            .and_then(|b| self.find_rep(self.text.get(b.rep)))
    }
    pub fn metric_value(&self, metric: &[u8], backend: Str) -> Option<i64> {
        self.metric_values
            .iter()
            .find(|v| self.text.eq_bytes(v.metric, metric) && self.text.eq(v.backend, backend))
            .map(|v| v.value)
    }
    pub fn admission_of(&self, backend: Str) -> Option<&Admission> {
        self.admissions
            .iter()
            .find(|a| self.text.eq(a.backend, backend))
    }
}

pub fn mode_index(m: Mode) -> usize {
    match m {
        Mode::Move => 0,
        Mode::Borrow => 1,
        Mode::Copy => 2,
        Mode::Share => 3,
        Mode::Observe => 4,
    }
}

pub const MODE_NAMES: [&str; 5] = ["move", "borrow", "copy", "share", "observe"];

fn mode_of(b: &[u8]) -> Option<Mode> {
    Some(match b {
        b"move" => Mode::Move,
        b"borrow" => Mode::Borrow,
        b"copy" => Mode::Copy,
        b"share" => Mode::Share,
        b"observe" => Mode::Observe,
        _ => return None,
    })
}

struct P<'a> {
    src: &'a [u8],
    source: SourceId,
    toks: BVec<Tok, { factc_foundation::limits::MAX_TOKENS_PER_ISLAND }>,
    i: usize,
    island: Span,
}

impl<'a> P<'a> {
    fn err(&self, class: &'static str) -> Diagnostic {
        let span = self.toks.get(self.i).map(|t| t.span).unwrap_or(self.island);
        Diagnostic::new(
            DiagCode::ContractParse,
            Phase::Contracts,
            self.source,
            Some(span),
            class,
        )
        .with_related(self.island)
    }
    fn text(&self, s: Span) -> &'a [u8] {
        s.slice(self.src)
    }
    fn at(&self, k: TokKind) -> bool {
        self.toks.get(self.i).map(|t| t.kind == k).unwrap_or(false)
    }
    fn ident(&mut self) -> Result<Span, Diagnostic> {
        match self.toks.get(self.i) {
            Some(t) if t.kind == TokKind::Ident => {
                let s = t.span;
                self.i += 1;
                Ok(s)
            }
            _ => Err(self.err("expected identifier")),
        }
    }
    fn expect(&mut self, k: TokKind) -> Result<Tok, Diagnostic> {
        match self.toks.get(self.i) {
            Some(t) if t.kind == k => {
                let t = *t;
                self.i += 1;
                Ok(t)
            }
            _ => Err(self.err("unexpected token")),
        }
    }
    /// key=value where value is an identifier list (comma separated) or `none`; returns the raw value spans.
    fn kv_list(&mut self, key: &[u8], out: &mut [Option<Span>; LIST]) -> Result<usize, Diagnostic> {
        let k = self.ident()?;
        if self.text(k) != key {
            return Err(self.err("unexpected key (registry keys are positional)"));
        }
        self.expect(TokKind::Eq)?;
        let mut n = 0;
        loop {
            let v = self.ident()?;
            if self.text(v) != b"none" {
                if n < LIST {
                    out[n] = Some(v);
                }
                n += 1;
            }
            if self.at(TokKind::Comma) {
                self.i += 1;
            } else {
                break;
            }
        }
        Ok(n.min(LIST))
    }
    fn kv_word(&mut self, key: &[u8]) -> Result<Span, Diagnostic> {
        let k = self.ident()?;
        if self.text(k) != key {
            return Err(self.err("unexpected key (registry keys are positional)"));
        }
        self.expect(TokKind::Eq)?;
        self.ident()
    }
    fn kv_int(&mut self, key: &[u8]) -> Result<u64, Diagnostic> {
        let k = self.ident()?;
        if self.text(k) != key {
            return Err(self.err("unexpected key"));
        }
        self.expect(TokKind::Eq)?;
        Ok(self.expect(TokKind::Int)?.int)
    }
    fn end(&self) -> Result<(), Diagnostic> {
        if self.i == self.toks.len() {
            Ok(())
        } else {
            Err(self.err("trailing tokens"))
        }
    }
}

fn intern(reg: &mut Registry, s: &[u8]) -> Str {
    reg.text.intern(s).unwrap_or(Str::EMPTY)
}

fn list(reg: &mut Registry, src: &[u8], spans: &[Option<Span>; LIST], n: usize) -> StrList {
    let mut l = StrList::default();
    for sp in spans.iter().take(n).flatten() {
        let s = intern(reg, sp.slice(src));
        l.push(s);
    }
    l
}

fn modes(
    reg: &Registry,
    src: &[u8],
    spans: &[Option<Span>; LIST],
    n: usize,
) -> Result<[bool; 5], &'static str> {
    let _ = reg;
    let mut m = [false; 5];
    for sp in spans.iter().take(n).flatten() {
        match mode_of(sp.slice(src)) {
            Some(md) => m[mode_index(md)] = true,
            None => return Err("unknown transfer mode"),
        }
    }
    Ok(m)
}

/// Parse registry / metric / epoch islands from `src` into `reg` (additive: several inputs may be merged).
pub fn parse<const D: usize>(
    src: &[u8],
    source: SourceId,
    reg: &mut Registry,
    diags: &mut Diagnostics<D>,
) {
    let mut islands: BVec<factc_source::Island, MAX_ISLANDS> = BVec::new();
    factc_source::scan(src, source, &mut islands, diags);
    let mut ok = true;
    for isl in islands.iter() {
        let mut p = P {
            src,
            source,
            toks: BVec::new(),
            i: 0,
            island: isl.span,
        };
        if let Err(span) = lex(src, source, isl.inner.start(), isl.inner.end(), &mut p.toks) {
            diags.push(Diagnostic::new(
                DiagCode::ContractParse,
                Phase::Contracts,
                source,
                Some(span),
                "bad token in registry island",
            ));
            ok = false;
            continue;
        }
        if let Err(d) = parse_one(&mut p, reg) {
            diags.push(d);
            ok = false;
        }
    }
    reg.ok = ok && check(reg, source, diags);
}

fn parse_one(p: &mut P<'_>, reg: &mut Registry) -> Result<(), Diagnostic> {
    let kw = p.ident()?;
    let word = p.text(kw);
    let src = p.src;
    let mut tmp: [Option<Span>; LIST] = [None; LIST];
    match word {
        b"registry" => {
            let id = p.ident()?;
            let v = p.kv_int(b"version")?;
            reg.id = Some(intern(reg, p.text(id)));
            reg.version = v as u32;
        }
        b"representation" => {
            let id = p.ident()?;
            let ty = p.kv_word(b"type")?;
            let domain = p.kv_word(b"domain")?;
            let n = p.kv_list(b"modes", &mut tmp)?;
            let lifetime = p.kv_word(b"lifetime")?;
            let m = modes(reg, src, &tmp, n).map_err(|c| p.err(c))?;
            let r = Representation {
                name: intern(reg, p.text(id)),
                ty: intern(reg, p.text(ty)),
                domain: intern(reg, p.text(domain)),
                modes: m,
                lifetime: intern(reg, p.text(lifetime)),
                span: p.island,
            };
            if reg
                .representations
                .iter()
                .any(|x| reg.text.eq(x.name, r.name))
            {
                return Err(Diagnostic::new(
                    DiagCode::ContractDuplicate,
                    Phase::Contracts,
                    p.source,
                    Some(p.island),
                    "duplicate RepresentationId",
                ));
            }
            reg.representations
                .push(r)
                .map_err(|_| p.err("registry arena exhausted"))?;
        }
        b"boundary" => {
            let ty = p.ident()?;
            let rep = p.ident()?;
            let b = Boundary {
                ty: intern(reg, p.text(ty)),
                rep: intern(reg, p.text(rep)),
                span: p.island,
            };
            if reg.boundaries.iter().any(|x| reg.text.eq(x.ty, b.ty)) {
                return Err(Diagnostic::new(
                    DiagCode::ContractDuplicate,
                    Phase::Contracts,
                    p.source,
                    Some(p.island),
                    "duplicate boundary for type",
                ));
            }
            reg.boundaries
                .push(b)
                .map_err(|_| p.err("registry arena exhausted"))?;
        }
        b"conversion" => {
            let id = p.ident()?;
            let from = p.ident()?;
            p.expect(TokKind::Arrow)?;
            let to = p.ident()?;
            let mode = p.kv_word(b"mode")?;
            let preserves = p.kv_word(b"preserves")?;
            let requires = p.kv_word(b"requires")?;
            let md = mode_of(p.text(mode)).ok_or_else(|| p.err("unknown transfer mode"))?;
            let c = Conversion {
                name: intern(reg, p.text(id)),
                from: intern(reg, p.text(from)),
                to: intern(reg, p.text(to)),
                mode: md,
                preserves_value: p.text(preserves) == b"value",
                requires: if p.text(requires) == b"none" {
                    None
                } else {
                    Some(intern(reg, p.text(requires)))
                },
                span: p.island,
            };
            if reg.conversions.iter().any(|x| reg.text.eq(x.name, c.name)) {
                return Err(Diagnostic::new(
                    DiagCode::ContractDuplicate,
                    Phase::Contracts,
                    p.source,
                    Some(p.island),
                    "duplicate ConversionId",
                ));
            }
            reg.conversions
                .push(c)
                .map_err(|_| p.err("registry arena exhausted"))?;
        }
        b"backend" => {
            let id = p.ident()?;
            let status = p.kv_word(b"status")?;
            let st = match p.text(status) {
                b"READY-CONTRACT" => ContractStatus::ReadyContract,
                b"GAP" => ContractStatus::Gap,
                b"ERR" => ContractStatus::Err,
                b"UNK" => ContractStatus::Unk,
                _ => return Err(p.err("backend status must be READY-CONTRACT|GAP|ERR|UNK")),
            };
            let n = p.kv_list(b"capabilities", &mut tmp)?;
            let capabilities = list(reg, src, &tmp, n);
            let n = p.kv_list(b"accepts", &mut tmp)?;
            let accepts = list(reg, src, &tmp, n);
            let n = p.kv_list(b"produces", &mut tmp)?;
            let produces = list(reg, src, &tmp, n);
            let n = p.kv_list(b"modes", &mut tmp)?;
            let m = modes(reg, src, &tmp, n).map_err(|c| p.err(c))?;
            let n = p.kv_list(b"effects", &mut tmp)?;
            let effects = list(reg, src, &tmp, n);
            let n = p.kv_list(b"probes", &mut tmp)?;
            let probes = list(reg, src, &tmp, n);
            let recipe = p.kv_word(b"recipe")?;
            let n = p.kv_list(b"lifecycle", &mut tmp)?;
            let lifecycle = list(reg, src, &tmp, n);
            let n = p.kv_list(b"failures", &mut tmp)?;
            let failures = list(reg, src, &tmp, n);
            let b = Backend {
                name: intern(reg, p.text(id)),
                status: st,
                capabilities,
                accepts,
                produces,
                modes: m,
                effects,
                probes,
                recipe: if p.text(recipe) == b"none" {
                    None
                } else {
                    Some(intern(reg, p.text(recipe)))
                },
                lifecycle,
                failures,
                span: p.island,
            };
            if reg.backends.iter().any(|x| reg.text.eq(x.name, b.name)) {
                return Err(Diagnostic::new(
                    DiagCode::ContractDuplicate,
                    Phase::Contracts,
                    p.source,
                    Some(p.island),
                    "duplicate BackendId",
                ));
            }
            reg.backends
                .push(b)
                .map_err(|_| p.err("registry arena exhausted"))?;
        }
        b"authority_link" => {
            let subject = p.ident()?;
            let url = p.expect(TokKind::Str)?.span;
            let a = AuthorityLink {
                subject: intern(reg, p.text(subject)),
                url: intern(reg, p.text(url)),
            };
            reg.authorities
                .push(a)
                .map_err(|_| p.err("registry arena exhausted"))?;
        }
        b"recipe" => {
            let id = p.ident()?;
            let backend = p.kv_word(b"backend")?;
            let n = p.kv_list(b"roles", &mut tmp)?;
            let roles = list(reg, src, &tmp, n);
            let n = p.kv_list(b"exports", &mut tmp)?;
            let exports = list(reg, src, &tmp, n);
            let n = p.kv_list(b"imports", &mut tmp)?;
            let imports = list(reg, src, &tmp, n);
            let adapter = p.kv_word(b"adapter")?;
            let r = Recipe {
                name: intern(reg, p.text(id)),
                backend: intern(reg, p.text(backend)),
                roles,
                exports,
                imports,
                adapter: intern(reg, p.text(adapter)),
                span: p.island,
            };
            if reg.recipes.iter().any(|x| reg.text.eq(x.name, r.name)) {
                return Err(Diagnostic::new(
                    DiagCode::ContractDuplicate,
                    Phase::Contracts,
                    p.source,
                    Some(p.island),
                    "duplicate CodegenRecipeId",
                ));
            }
            reg.recipes
                .push(r)
                .map_err(|_| p.err("registry arena exhausted"))?;
        }
        b"metric_value" => {
            let metric = p.ident()?;
            let backend = p.ident()?;
            let neg = if p
                .toks
                .get(p.i)
                .map(|t| t.kind == TokKind::Ident && p.text(t.span) == b"-")
                .unwrap_or(false)
            {
                p.i += 1;
                true
            } else {
                false
            };
            let v = p.expect(TokKind::Int)?.int as i64;
            let prov = p.kv_word(b"provenance")?;
            let mv = MetricValue {
                metric: intern(reg, p.text(metric)),
                backend: intern(reg, p.text(backend)),
                value: if neg { -v } else { v },
                provenance: intern(reg, p.text(prov)),
                span: p.island,
            };
            reg.metric_values
                .push(mv)
                .map_err(|_| p.err("registry arena exhausted"))?;
        }
        b"epoch" => {
            let id = p.ident()?;
            reg.epoch = Some(intern(reg, p.text(id)));
        }
        b"admission" => {
            let backend = p.ident()?;
            let dspan = p.ident()?;
            let dec = match p.text(dspan) {
                b"ADMITTED" => Decision::Admitted,
                b"REJECTED" => Decision::Rejected,
                _ => return Err(p.err("admission decision must be ADMITTED|REJECTED")),
            };
            let ev = p.kv_word(b"evidence")?;
            let reason = if p.i < p.toks.len() {
                Some(p.kv_word(b"reason")?)
            } else {
                None
            };
            let a = Admission {
                backend: intern(reg, p.text(backend)),
                decision: dec,
                evidence: intern(reg, p.text(ev)),
                reason: reason.map(|r| intern(reg, p.text(r))),
                span: p.island,
            };
            reg.admissions
                .push(a)
                .map_err(|_| p.err("registry arena exhausted"))?;
        }
        _ => {
            return Err(Diagnostic::new(
                DiagCode::ParseUnknownKeyword,
                Phase::Contracts,
                p.source,
                Some(kw),
                "unknown registry keyword",
            )
            .with_related(p.island));
        }
    }
    p.end()
}

/// Referential checks: conversion endpoints, backend recipes, recipe backends must exist.
fn check<const D: usize>(reg: &Registry, source: SourceId, diags: &mut Diagnostics<D>) -> bool {
    let mut ok = true;
    for c in reg.conversions.iter() {
        if reg.find_rep(reg.name(c.from)).is_none() || reg.find_rep(reg.name(c.to)).is_none() {
            diags.push(Diagnostic::new(
                DiagCode::ContractUnresolved,
                Phase::Contracts,
                source,
                Some(c.span),
                "conversion endpoint representation not declared",
            ));
            ok = false;
        }
        if let Some(r) = c.requires {
            if reg.find_backend(reg.name(r)).is_none() {
                diags.push(Diagnostic::new(
                    DiagCode::ContractUnresolved,
                    Phase::Contracts,
                    source,
                    Some(c.span),
                    "conversion requires an undeclared backend",
                ));
                ok = false;
            }
        }
    }
    for b in reg.backends.iter() {
        if let Some(r) = b.recipe {
            if reg.find_recipe(reg.name(r)).is_none() {
                diags.push(Diagnostic::new(
                    DiagCode::ContractUnresolved,
                    Phase::Contracts,
                    source,
                    Some(b.span),
                    "backend names an undeclared CodegenRecipe",
                ));
                ok = false;
            }
        }
        if b.status == ContractStatus::ReadyContract && b.recipe.is_none() {
            diags.push(Diagnostic::new(
                DiagCode::ContractUnresolved,
                Phase::Contracts,
                source,
                Some(b.span),
                "READY-CONTRACT backend requires a CodegenRecipe (P6-G03)",
            ));
            ok = false;
        }
        for r in b.accepts.iter().chain(b.produces.iter()) {
            if reg.find_rep(reg.name(r)).is_none() {
                diags.push(Diagnostic::new(
                    DiagCode::ContractUnresolved,
                    Phase::Contracts,
                    source,
                    Some(b.span),
                    "backend representation not declared",
                ));
                ok = false;
            }
        }
    }
    for r in reg.recipes.iter() {
        if reg.find_backend(reg.name(r.backend)).is_none() {
            diags.push(Diagnostic::new(
                DiagCode::ContractUnresolved,
                Phase::Contracts,
                source,
                Some(r.span),
                "recipe names an undeclared backend",
            ));
            ok = false;
        }
    }
    for bd in reg.boundaries.iter() {
        if reg.find_rep(reg.name(bd.rep)).is_none() {
            diags.push(Diagnostic::new(
                DiagCode::ContractUnresolved,
                Phase::Contracts,
                source,
                Some(bd.span),
                "boundary representation not declared",
            ));
            ok = false;
        }
    }
    ok
}
