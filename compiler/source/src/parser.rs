//! Statement parser: one island -> one `Stmt` (ASCII-GRAMMAR.md sections 3-23).  Unknown keywords are errors
//! (section 22), never ignored.

use crate::ast::*;
use crate::lexer::{lex, Tok, TokKind};
use crate::scanner::Island;
use factc_foundation::limits::MAX_TOKENS_PER_ISLAND;
use factc_foundation::{BVec, DiagCode, Diagnostic, Phase, SourceId, Span};

struct P<'a> {
    src: &'a [u8],
    source: SourceId,
    toks: BVec<Tok, MAX_TOKENS_PER_ISLAND>,
    i: usize,
    island: Span,
}

type PResult<T> = Result<T, Diagnostic>;

impl<'a> P<'a> {
    fn err(&self, code: DiagCode, class: &'static str) -> Diagnostic {
        let span = self.toks.get(self.i).map(|t| t.span).unwrap_or(self.island);
        Diagnostic::new(code, Phase::Parse, self.source, Some(span), class)
            .with_related(self.island)
    }
    fn peek(&self) -> Option<&Tok> {
        self.toks.get(self.i)
    }
    fn at(&self, k: TokKind) -> bool {
        self.peek().map(|t| t.kind == k).unwrap_or(false)
    }
    fn text(&self, s: Span) -> &'a [u8] {
        s.slice(self.src)
    }
    fn expect(&mut self, k: TokKind, class: &'static str) -> PResult<Tok> {
        match self.peek() {
            Some(t) if t.kind == k => {
                let t = *t;
                self.i += 1;
                Ok(t)
            }
            _ => Err(self.err(DiagCode::ParseUnexpected, class)),
        }
    }
    fn ident(&mut self, class: &'static str) -> PResult<Span> {
        self.expect(TokKind::Ident, class).map(|t| t.span)
    }
    fn keyword(&mut self, word: &[u8]) -> PResult<()> {
        match self.peek() {
            Some(t) if t.kind == TokKind::Ident && self.text(t.span) == word => {
                self.i += 1;
                Ok(())
            }
            _ => Err(self.err(DiagCode::ParseUnexpected, "expected keyword")),
        }
    }
    fn opt_str(&mut self) -> Option<Span> {
        match self.peek() {
            Some(t) if t.kind == TokKind::Str => {
                let s = t.span;
                self.i += 1;
                Some(s)
            }
            _ => None,
        }
    }
    fn end(&self) -> PResult<()> {
        if self.i == self.toks.len() {
            Ok(())
        } else {
            Err(self.err(DiagCode::ParseUnexpected, "trailing tokens in island"))
        }
    }
    /// `[sys::]a[.b]`
    fn reference(&mut self) -> PResult<Ref> {
        let start = self.peek().map(|t| t.span).unwrap_or(self.island);
        let first = self.ident("expected identifier")?;
        let mut r = Ref {
            sys: None,
            a: first,
            b: None,
            span: first,
        };
        if self.at(TokKind::DColon) {
            self.i += 1;
            r.sys = Some(first);
            r.a = self.ident("expected identifier after ::")?;
        }
        if self.at(TokKind::Dot) {
            self.i += 1;
            r.b = Some(self.ident("expected port identifier after .")?);
        }
        let last = self.toks.get(self.i - 1).map(|t| t.span).unwrap_or(start);
        r.span = Span::new(self.source, start.start(), last.end()).unwrap_or(start);
        Ok(r)
    }
    fn word(&mut self) -> PResult<&'a [u8]> {
        let s = self.ident("expected word")?;
        Ok(self.text(s))
    }
    fn expr<const E: usize>(&mut self, exprs: &mut BVec<ExprNode, E>) -> PResult<u32> {
        let head = *self
            .peek()
            .ok_or_else(|| self.err(DiagCode::ParseUnexpected, "expected invariant expression"))?;
        let name = self.ident("expected predicate or combinator")?;
        let word = self.text(name);
        let kind = match word {
            b"all" => ExprKind::All,
            b"any" => ExprKind::Any,
            b"not" => ExprKind::Not,
            _ => match Pred::from_bytes(word) {
                Some(p) => ExprKind::Pred(p),
                None => {
                    return Err(Diagnostic::new(
                        DiagCode::ParseUnknownKeyword,
                        Phase::Parse,
                        self.source,
                        Some(name),
                        "unknown invariant predicate; the kernel vocabulary is fixed",
                    )
                    .with_related(self.island));
                }
            },
        };
        self.expect(TokKind::LParen, "expected (")?;
        let node_idx = exprs
            .push(ExprNode {
                kind,
                args: [None, None],
                first_child: None,
                next_sibling: None,
                span: head.span,
            })
            .map_err(|_| self.err(DiagCode::WorkspaceExhausted, "expression arena exhausted"))?
            as u32;
        match kind {
            ExprKind::Pred(p) => {
                let mut n = 0u8;
                if !self.at(TokKind::RParen) {
                    loop {
                        let r = self.reference()?;
                        if n < 2 {
                            exprs[node_idx as usize].args[n as usize] = Some(r);
                        }
                        n += 1;
                        if self.at(TokKind::Comma) {
                            self.i += 1;
                        } else {
                            break;
                        }
                    }
                }
                if n != p.arity() {
                    return Err(Diagnostic::new(
                        DiagCode::InvalidInvariantArity,
                        Phase::Parse,
                        self.source,
                        Some(name),
                        "predicate arity mismatch",
                    )
                    .with_params(p.arity() as u32, n as u32, 0)
                    .with_related(self.island));
                }
            }
            ExprKind::Not => {
                let c = self.expr(exprs)?;
                exprs[node_idx as usize].first_child = Some(c);
            }
            ExprKind::All | ExprKind::Any => {
                let mut prev: Option<u32> = None;
                loop {
                    let c = self.expr(exprs)?;
                    match prev {
                        None => exprs[node_idx as usize].first_child = Some(c),
                        Some(p) => exprs[p as usize].next_sibling = Some(c),
                    }
                    prev = Some(c);
                    if self.at(TokKind::Comma) {
                        self.i += 1;
                    } else {
                        break;
                    }
                }
            }
        }
        self.expect(TokKind::RParen, "expected )")?;
        let end = self
            .toks
            .get(self.i - 1)
            .map(|t| t.span.end())
            .unwrap_or(head.span.end());
        exprs[node_idx as usize].span =
            Span::new(self.source, head.span.start(), end).unwrap_or(head.span);
        Ok(node_idx)
    }
}

fn gov(word: &[u8]) -> Option<GovStatus> {
    Some(match word {
        b"OBS" => GovStatus::Obs,
        b"RUN" => GovStatus::Run,
        b"NEW" => GovStatus::New,
        b"GAP" => GovStatus::Gap,
        b"ERR" => GovStatus::Err,
        b"UNK" => GovStatus::Unk,
        _ => return None,
    })
}

/// Parse one island into a statement; expression nodes go to `exprs`.
pub fn parse_island<const E: usize>(
    src: &[u8],
    source: SourceId,
    island: &Island,
    exprs: &mut BVec<ExprNode, E>,
) -> PResult<Statement> {
    let mut p = P {
        src,
        source,
        toks: BVec::new(),
        i: 0,
        island: island.span,
    };
    if let Err(span) = lex(
        src,
        source,
        island.inner.start(),
        island.inner.end(),
        &mut p.toks,
    ) {
        return Err(Diagnostic::new(
            DiagCode::ParseBadLiteral,
            Phase::Parse,
            source,
            Some(span),
            "bad token in semantic island",
        )
        .with_related(island.span));
    }
    let kw = p.ident("expected statement keyword")?;
    let word = p.text(kw);
    let stmt = match word {
        b"system" => {
            let id = p.ident("expected SystemId")?;
            let label = p.opt_str();
            Stmt::System { id, label }
        }
        b"use" => Stmt::Use {
            id: p.ident("expected SystemId")?,
        },
        b"type" => Stmt::Type {
            id: p.ident("expected TypeId")?,
        },
        b"alias" => {
            let id = p.ident("expected TypeId")?;
            p.expect(TokKind::Eq, "expected =")?;
            Stmt::Alias {
                id,
                target: p.reference()?,
            }
        }
        b"component" | b"subsystem" => {
            let id = p.ident("expected ComponentId")?;
            let label = p.opt_str();
            Stmt::Component {
                id,
                label,
                subsystem: word == b"subsystem",
            }
        }
        b"contains" => {
            let sub = p.reference()?;
            p.expect(TokKind::Arrow, "expected ->")?;
            Stmt::Contains {
                sub,
                obj: p.reference()?,
            }
        }
        b"port" => {
            let r = p.reference()?;
            let port = match r.b {
                Some(b) => b,
                None => {
                    return Err(p.err(
                        DiagCode::ParseUnexpected,
                        "port requires <ComponentRef>.<PortId>",
                    ))
                }
            };
            let comp = Ref {
                sys: r.sys,
                a: r.a,
                b: None,
                span: r.span,
            };
            let dir = match p.word()? {
                b"in" => Dir::In,
                b"out" => Dir::Out,
                _ => return Err(p.err(DiagCode::ParseUnexpected, "expected in|out")),
            };
            p.expect(TokKind::Colon, "expected :")?;
            let ty = p.reference()?;
            let public = match p.word()? {
                b"public" => true,
                b"private" => false,
                _ => return Err(p.err(DiagCode::ParseUnexpected, "expected public|private")),
            };
            Stmt::Port {
                comp,
                port,
                dir,
                ty,
                public,
            }
        }
        b"resource" => {
            let id = p.ident("expected ResourceId")?;
            let ty = if p.at(TokKind::Colon) {
                p.i += 1;
                Some(p.reference()?)
            } else {
                None
            };
            Stmt::Resource { id, ty }
        }
        b"owns" => {
            let comp = p.reference()?;
            p.expect(TokKind::Arrow, "expected ->")?;
            Stmt::Owns {
                comp,
                res: p.reference()?,
            }
        }
        b"data" => {
            let id = p.ident("expected RelationId")?;
            let src_r = p.reference()?;
            p.expect(TokKind::Arrow, "expected ->")?;
            let dst = p.reference()?;
            p.keyword(b"mode")?;
            p.expect(TokKind::Eq, "expected =")?;
            let mode = match p.word()? {
                b"move" => Mode::Move,
                b"borrow" => Mode::Borrow,
                b"copy" => Mode::Copy,
                b"share" => Mode::Share,
                b"observe" => Mode::Observe,
                _ => {
                    return Err(p.err(
                        DiagCode::ParseUnexpected,
                        "expected transfer mode move|borrow|copy|share|observe",
                    ))
                }
            };
            Stmt::Data {
                id,
                src: src_r,
                dst,
                mode,
            }
        }
        b"sequence" => {
            let id = p.ident("expected RelationId")?;
            let from = p.reference()?;
            p.expect(TokKind::Arrow, "expected ->")?;
            Stmt::Sequence {
                id,
                from,
                to: p.reference()?,
            }
        }
        b"effect" => Stmt::Effect {
            id: p.ident("expected EffectId")?,
        },
        b"uses" => {
            let obj = p.reference()?;
            Stmt::Uses {
                obj,
                eff: p.reference()?,
            }
        }
        b"capability" => Stmt::Capability {
            id: p.ident("expected CapabilityId")?,
        },
        b"requires" => {
            let obj = p.reference()?;
            Stmt::Requires {
                obj,
                cap: p.reference()?,
            }
        }
        b"implementation" => Stmt::Implementation {
            id: p.ident("expected ImplementationId")?,
        },
        b"pin" => {
            let obj = p.reference()?;
            Stmt::Pin {
                obj,
                imp: p.reference()?,
            }
        }
        b"refines" => {
            let concrete = p.reference()?;
            p.expect(TokKind::Arrow, "expected ->")?;
            Stmt::Refines {
                concrete,
                abstract_: p.reference()?,
            }
        }
        b"invariant" => {
            let id = p.ident("expected InvariantId")?;
            let expr = p.expr(exprs)?;
            Stmt::Invariant { id, expr }
        }
        b"test" => {
            let id = p.ident("expected TestId")?;
            let kind = match p.word()? {
                b"static" => TestKind::Static,
                b"runtime" => TestKind::Runtime,
                b"property" => TestKind::Property,
                _ => {
                    return Err(p.err(
                        DiagCode::ParseUnexpected,
                        "expected static|runtime|property",
                    ))
                }
            };
            Stmt::Test { id, kind }
        }
        b"tests" => {
            let test = p.reference()?;
            p.expect(TokKind::Arrow, "expected ->")?;
            Stmt::Tests {
                test,
                target: p.reference()?,
            }
        }
        b"evidence" => {
            let id = p.ident("expected EvidenceId")?;
            let kind = match p.word()? {
                b"static_proof" => EvidenceKind::StaticProof,
                b"runtime_probe" => EvidenceKind::RuntimeProbe,
                b"artifact" => EvidenceKind::Artifact,
                b"human_observation" => EvidenceKind::HumanObservation,
                _ => return Err(p.err(DiagCode::ParseUnexpected, "expected evidence kind")),
            };
            Stmt::Evidence { id, kind }
        }
        b"witnesses" => {
            let ev = p.reference()?;
            p.expect(TokKind::Arrow, "expected ->")?;
            Stmt::Witnesses {
                ev,
                test: p.reference()?,
            }
        }
        b"status" => {
            let obj = p.reference()?;
            let status = gov(p.word()?).ok_or_else(|| {
                p.err(
                    DiagCode::ParseUnexpected,
                    "expected OBS|RUN|NEW|GAP|ERR|UNK",
                )
            })?;
            let reason = p.opt_str();
            Stmt::Status {
                obj,
                status,
                reason,
            }
        }
        b"issue" => {
            let id = p.ident("expected IssueId")?;
            let status = gov(p.word()?).ok_or_else(|| {
                p.err(
                    DiagCode::ParseUnexpected,
                    "expected OBS|RUN|NEW|GAP|ERR|UNK",
                )
            })?;
            let desc = p
                .expect(TokKind::Str, "expected issue description string")?
                .span;
            Stmt::Issue { id, status, desc }
        }
        b"authority" => {
            let obj = p.reference()?;
            let url = p.expect(TokKind::Str, "expected URL string")?.span;
            Stmt::Authority { obj, url }
        }
        b"metric" => {
            let id = p.ident("expected MetricId")?;
            let unit = p.ident("expected UnitId")?;
            let desc = p.opt_str();
            Stmt::Metric { id, unit, desc }
        }
        b"objective" => Stmt::Objective {
            id: p.ident("expected ObjectiveId")?,
        },
        b"goal" => {
            let obj = p.reference()?;
            let pr = p.expect(TokKind::Int, "expected priority integer")?;
            if pr.int == 0 || pr.int > u32::MAX as u64 {
                return Err(Diagnostic::new(
                    DiagCode::ParseBadLiteral,
                    Phase::Parse,
                    source,
                    Some(pr.span),
                    "goal priority must be a positive integer",
                )
                .with_related(island.span));
            }
            let dir = match p.word()? {
                b"minimize" => GoalDir::Minimize,
                b"maximize" => GoalDir::Maximize,
                _ => return Err(p.err(DiagCode::ParseUnexpected, "expected minimize|maximize")),
            };
            Stmt::Goal {
                obj,
                priority: pr.int as u32,
                dir,
                metric: p.reference()?,
            }
        }
        b"hard" => {
            let obj = p.reference()?;
            let metric = p.reference()?;
            let cmp = match p.word()? {
                b"at_most" => Cmp::AtMost,
                b"at_least" => Cmp::AtLeast,
                b"equal" => Cmp::Equal,
                _ => {
                    return Err(p.err(DiagCode::ParseUnexpected, "expected at_most|at_least|equal"))
                }
            };
            let v = p.expect(TokKind::Int, "expected number")?;
            Stmt::Hard {
                obj,
                metric,
                cmp,
                value: v.int as i64,
            }
        }
        _ => {
            return Err(Diagnostic::new(
                DiagCode::ParseUnknownKeyword,
                Phase::Parse,
                source,
                Some(kw),
                "unknown semantic keyword (language version 1)",
            )
            .with_related(island.span));
        }
    };
    p.end()?;
    Ok(Statement {
        stmt,
        island: island.span,
    })
}

/// Front-end entry: scan + parse one source unit.  Parse failures are collected; parsing continues.
pub fn parse_unit<const S: usize, const E: usize, const I: usize, const D: usize>(
    src: &[u8],
    source: SourceId,
    islands: &mut BVec<Island, I>,
    unit: &mut ParsedUnit<S, E>,
    diags: &mut factc_foundation::Diagnostics<D>,
) {
    islands.clear();
    crate::scanner::scan(src, source, islands, diags);
    for isl in islands.iter() {
        match parse_island(src, source, isl, &mut unit.exprs) {
            Ok(st) => {
                if unit.statements.push(st).is_err() {
                    diags.push(Diagnostic::new(
                        DiagCode::WorkspaceExhausted,
                        Phase::Parse,
                        source,
                        Some(isl.span),
                        "statement arena exhausted",
                    ));
                    break;
                }
            }
            Err(d) => diags.push(d),
        }
    }
}
