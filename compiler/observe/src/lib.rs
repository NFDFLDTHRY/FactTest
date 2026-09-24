//! Evidence tape -> ObservationDelta -> observed ASCII.
//!
//! Tape dialect (emitted by the generated runtime, one island per record):
//! ```text
//! @{epoch <EpochId>}
//! @{admission <Backend> <ADMITTED|REJECTED> evidence=<word> [reason=<word>]}
//! @{activation <EpochId> plan=<n|none> status=<PASS|NO_ACTIVE_PLAN>}
//! @{executed <EpochId> plan=<n> relation=<RelationId> bytes=<n> input="<sha256>" output="<sha256>" exact=<true|false>}
//! @{executed <EpochId> plan=<n> relation=<RelationId> status=<ResultClass>}
//! @{bundle strategy_data="<sha256>" strategy=<n> certificate=<n>}   (the verified strategy data the tape executed under)
//! @{loss <EpochId> <Backend> reason=<word>}
//! @{transition <EpochId> -> <EpochId> stale_plan=<n|none> replacement=<n|none>}
//! @{no_active_plan <EpochId>}
//! ```
//! The observed ASCII is a derived human/AI view; the authored source is never touched here.
#![no_std]
#![forbid(unsafe_code)]

use factc_foundation::json::JsonW;
use factc_foundation::limits::MAX_ISLANDS;
use factc_foundation::{
    BVec, DiagCode, Diagnostic, Diagnostics, OutBuf, OutputTooSmall, Phase, SourceId, Span, Str,
    TextArena,
};
use factc_source::lexer::{lex, Tok, TokKind};

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum Kind {
    Epoch,
    Admission,
    Activation,
    Executed,
    Loss,
    Transition,
    NoActivePlan,
    Bundle,
}

#[derive(Copy, Clone, Debug)]
pub struct Record {
    pub kind: Kind,
    pub epoch: Str,
    pub epoch_to: Str,
    pub subject: Str,
    pub decision: Str,
    pub evidence: Str,
    pub reason: Str,
    pub plan: Option<u32>,
    pub plan2: Option<u32>,
    pub relation: Str,
    pub bytes: u64,
    pub input: Str,
    pub output: Str,
    pub exact: Option<bool>,
    pub status: Str,
    pub span: Span,
}

impl Record {
    const fn blank(kind: Kind, span: Span) -> Record {
        Record {
            kind,
            epoch: Str::EMPTY,
            epoch_to: Str::EMPTY,
            subject: Str::EMPTY,
            decision: Str::EMPTY,
            evidence: Str::EMPTY,
            reason: Str::EMPTY,
            plan: None,
            plan2: None,
            relation: Str::EMPTY,
            bytes: 0,
            input: Str::EMPTY,
            output: Str::EMPTY,
            exact: None,
            status: Str::EMPTY,
            span,
        }
    }
}

#[derive(Clone, Debug)]
pub struct Observation {
    pub text: TextArena<16384>,
    pub records: BVec<Record, 256>,
    pub ok: bool,
}

impl Default for Observation {
    fn default() -> Self {
        Self::new()
    }
}

impl Observation {
    pub const fn new() -> Self {
        Observation {
            text: TextArena::new(),
            records: BVec::new(),
            ok: false,
        }
    }
    pub fn clear(&mut self) {
        *self = Observation::new();
    }
    pub fn name(&self, s: Str) -> &[u8] {
        self.text.get(s)
    }
    pub fn epochs(&self) -> impl Iterator<Item = Str> + '_ {
        self.records
            .iter()
            .filter(|r| r.kind == Kind::Epoch)
            .map(|r| r.epoch)
    }
    pub fn count(&self, kind: Kind) -> usize {
        self.records.iter().filter(|r| r.kind == kind).count()
    }
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
            DiagCode::EvidenceParse,
            Phase::Observe,
            self.source,
            Some(span),
            class,
        )
        .with_related(self.island)
    }
    fn text(&self, s: Span) -> &'a [u8] {
        s.slice(self.src)
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
    fn at_key(&self, key: &[u8]) -> bool {
        matches!((self.toks.get(self.i), self.toks.get(self.i + 1)), (Some(t), Some(e)) if t.kind == TokKind::Ident && self.text(t.span) == key && e.kind == TokKind::Eq)
    }
    /// key=<ident|string|int>
    fn kv(&mut self, key: &[u8]) -> Result<Tok, Diagnostic> {
        if !self.at_key(key) {
            return Err(self.err("expected key"));
        }
        self.i += 2;
        match self.toks.get(self.i) {
            Some(t) if matches!(t.kind, TokKind::Ident | TokKind::Str | TokKind::Int) => {
                let t = *t;
                self.i += 1;
                Ok(t)
            }
            _ => Err(self.err("expected value")),
        }
    }
    fn plan_value(&mut self, key: &[u8]) -> Result<Option<u32>, Diagnostic> {
        let t = self.kv(key)?;
        Ok(match t.kind {
            TokKind::Int => Some(t.int as u32),
            _ => None, // `none`
        })
    }
}

fn intern(o: &mut Observation, s: &[u8]) -> Str {
    o.text.intern(s).unwrap_or(Str::EMPTY)
}

pub fn parse<const D: usize>(
    tape: &[u8],
    source: SourceId,
    obs: &mut Observation,
    diags: &mut Diagnostics<D>,
) {
    obs.clear();
    let mut islands: BVec<factc_source::Island, MAX_ISLANDS> = BVec::new();
    factc_source::scan(tape, source, &mut islands, diags);
    let mut ok = true;
    for isl in islands.iter() {
        let mut p = P {
            src: tape,
            source,
            toks: BVec::new(),
            i: 0,
            island: isl.span,
        };
        if let Err(span) = lex(
            tape,
            source,
            isl.inner.start(),
            isl.inner.end(),
            &mut p.toks,
        ) {
            diags.push(Diagnostic::new(
                DiagCode::EvidenceParse,
                Phase::Observe,
                source,
                Some(span),
                "bad token in evidence tape",
            ));
            ok = false;
            continue;
        }
        match parse_one(&mut p, obs) {
            Ok(r) => {
                if obs.records.push(r).is_err() {
                    diags.push(Diagnostic::new(
                        DiagCode::WorkspaceExhausted,
                        Phase::Observe,
                        source,
                        Some(isl.span),
                        "evidence record arena exhausted",
                    ));
                    ok = false;
                    break;
                }
            }
            Err(d) => {
                diags.push(d);
                ok = false;
            }
        }
    }
    obs.ok = ok;
}

fn parse_one(p: &mut P<'_>, obs: &mut Observation) -> Result<Record, Diagnostic> {
    let kw = p.ident()?;
    let word = p.text(kw);
    let src = p.src;
    let mut r = match word {
        b"epoch" => {
            let mut r = Record::blank(Kind::Epoch, p.island);
            let e = p.ident()?;
            r.epoch = intern(obs, e.slice(src));
            r
        }
        b"admission" => {
            let mut r = Record::blank(Kind::Admission, p.island);
            let b = p.ident()?;
            let d = p.ident()?;
            r.subject = intern(obs, b.slice(src));
            r.decision = intern(obs, d.slice(src));
            let ev = p.kv(b"evidence")?;
            r.evidence = intern(obs, ev.span.slice(src));
            if p.at_key(b"reason") {
                let rs = p.kv(b"reason")?;
                r.reason = intern(obs, rs.span.slice(src));
            }
            r
        }
        b"activation" => {
            let mut r = Record::blank(Kind::Activation, p.island);
            let e = p.ident()?;
            r.epoch = intern(obs, e.slice(src));
            r.plan = p.plan_value(b"plan")?;
            let st = p.kv(b"status")?;
            r.status = intern(obs, st.span.slice(src));
            r
        }
        b"executed" => {
            let mut r = Record::blank(Kind::Executed, p.island);
            let e = p.ident()?;
            r.epoch = intern(obs, e.slice(src));
            r.plan = p.plan_value(b"plan")?;
            let rel = p.kv(b"relation")?;
            r.relation = intern(obs, rel.span.slice(src));
            if p.at_key(b"status") {
                let st = p.kv(b"status")?;
                r.status = intern(obs, st.span.slice(src));
            } else {
                let n = p.kv(b"bytes")?;
                r.bytes = n.int;
                let i = p.kv(b"input")?;
                r.input = intern(obs, i.span.slice(src));
                let o = p.kv(b"output")?;
                r.output = intern(obs, o.span.slice(src));
                let ex = p.kv(b"exact")?;
                r.exact = Some(ex.span.slice(src) == b"true");
                r.status = intern(
                    obs,
                    if r.exact == Some(true) {
                        b"EXECUTED_EXACT"
                    } else {
                        b"EXECUTED_MISMATCH"
                    },
                );
            }
            r
        }
        b"loss" => {
            let mut r = Record::blank(Kind::Loss, p.island);
            let e = p.ident()?;
            let b = p.ident()?;
            r.epoch = intern(obs, e.slice(src));
            r.subject = intern(obs, b.slice(src));
            let rs = p.kv(b"reason")?;
            r.reason = intern(obs, rs.span.slice(src));
            r
        }
        b"transition" => {
            let mut r = Record::blank(Kind::Transition, p.island);
            let e = p.ident()?;
            p.expect(TokKind::Arrow)?;
            let e2 = p.ident()?;
            r.epoch = intern(obs, e.slice(src));
            r.epoch_to = intern(obs, e2.slice(src));
            r.plan = p.plan_value(b"stale_plan")?;
            r.plan2 = p.plan_value(b"replacement")?;
            r
        }
        b"no_active_plan" => {
            let mut r = Record::blank(Kind::NoActivePlan, p.island);
            let e = p.ident()?;
            r.epoch = intern(obs, e.slice(src));
            r
        }
        b"bundle" => {
            // strategy data identity in `output`, ids in plan/plan2
            let mut r = Record::blank(Kind::Bundle, p.island);
            let d = p.kv(b"strategy_data")?;
            r.output = intern(obs, d.span.slice(src));
            r.plan = p.plan_value(b"strategy")?;
            r.plan2 = p.plan_value(b"certificate")?;
            r
        }
        _ => {
            return Err(Diagnostic::new(
                DiagCode::ParseUnknownKeyword,
                Phase::Observe,
                p.source,
                Some(kw),
                "unknown evidence tape keyword",
            )
            .with_related(p.island))
        }
    };
    if p.i != p.toks.len() {
        return Err(p.err("trailing tokens in evidence record"));
    }
    r.span = p.island;
    Ok(r)
}

/// Context the host supplies: system name and the lineage identities it can compare (never invented here).
pub struct Context<'a> {
    pub system_name: &'a [u8],
    /// sha256 of the authored source as read AFTER the runtime session
    pub source_sha_after: Option<&'a [u8; 32]>,
    /// sha256 the bundle manifest recorded when it was generated
    pub source_sha_lineage: Option<&'a [u8; 32]>,
    /// sha256 of the strategy data the bundle manifest recorded (the tape's `bundle` record must name it)
    pub strategy_data_sha_lineage: Option<&'a [u8; 32]>,
    pub evidence_class: &'a [u8],
}

/// Whether the tape's `bundle` record names the strategy data the host's manifest names.
/// None when the host supplied no manifest identity to compare against.
pub fn evidence_bound(obs: &Observation, cx: &Context<'_>) -> Option<bool> {
    let want = cx.strategy_data_sha_lineage?;
    let Some(b) = obs.records.iter().find(|r| r.kind == Kind::Bundle) else {
        return Some(false);
    };
    Some(obs.name(b.output) == hexbuf(want))
}

fn hexbuf(d: &[u8; 32]) -> [u8; 64] {
    let mut o = [0u8; 64];
    factc_foundation::hex::encode_into(d, &mut o);
    o
}

/// Observed ASCII: a derived source unit made only of governance islands (issues) whose text is computed from the
/// evidence records.  Never a rewrite of the authored diagram.
pub fn render_observed_ascii(
    obs: &Observation,
    cx: &Context<'_>,
    out: &mut OutBuf<'_>,
) -> Result<(), OutputTooSmall> {
    let rule = |o: &mut OutBuf<'_>| -> Result<(), OutputTooSmall> {
        o.byte(b'+')?;
        o.fill(b'-', 78)?;
        o.str("+\n")
    };
    rule(out)?;
    out.str("| OBSERVED ")?;
    out.bytes(cx.system_name)?;
    out.str("  (derived from runtime evidence; evidence class ")?;
    out.bytes(cx.evidence_class)?;
    out.str(")\n")?;
    out.str("| @{system ")?;
    out.bytes(cx.system_name)?;
    out.str("_observed \"Observed: ")?;
    out.bytes(cx.system_name)?;
    out.str("\"}\n")?;
    // per-epoch summaries
    for e in obs.epochs() {
        out.str("| EPOCH ")?;
        out.bytes(obs.name(e))?;
        out.byte(b'\n')?;
        // admissions belong to the most recent epoch record preceding them: we attribute by tape order
        let mut current = Str::EMPTY;
        let mut executed_n: u64 = 0;
        for r in obs.records.iter() {
            if r.kind == Kind::Epoch {
                current = r.epoch;
                executed_n = 0;
                continue;
            }
            if !obs.text.eq(current, e) {
                continue;
            }
            match r.kind {
                Kind::Admission => {
                    let admitted = obs.name(r.decision) == b"ADMITTED";
                    out.str("| @{issue admission_")?;
                    out.bytes(obs.name(e))?;
                    out.byte(b'_')?;
                    out.bytes(obs.name(r.subject))?;
                    out.str(if admitted { " RUN \"" } else { " ERR \"" })?;
                    out.bytes(obs.name(r.subject))?;
                    out.str(if admitted {
                        " admitted at "
                    } else {
                        " rejected at "
                    })?;
                    out.bytes(obs.name(e))?;
                    out.str(" (evidence ")?;
                    out.bytes(obs.name(r.evidence))?;
                    if !r.reason.is_empty() {
                        out.str(", reason ")?;
                        out.bytes(obs.name(r.reason))?;
                    }
                    out.str(")\"}\n")?;
                }
                Kind::Activation => {
                    out.str("| @{issue activation_")?;
                    out.bytes(obs.name(e))?;
                    match r.plan {
                        Some(pl) => {
                            out.str(" RUN \"plan ")?;
                            out.u64(pl as u64)?;
                            out.str(" active at ")?;
                        }
                        None => out.str(" ERR \"no active plan at ")?,
                    }
                    out.bytes(obs.name(e))?;
                    out.str("\"}\n")?;
                }
                Kind::Executed => {
                    executed_n += 1;
                    out.str("| @{issue executed_")?;
                    out.bytes(obs.name(e))?;
                    out.str("_")?;
                    out.bytes(obs.name(r.relation))?;
                    out.byte(b'_')?;
                    out.u64(executed_n)?;
                    match r.exact {
                        Some(true) => {
                            out.str(" RUN \"")?;
                            out.bytes(obs.name(r.relation))?;
                            out.str(": exact roundtrip of ")?;
                            out.u64(r.bytes)?;
                            out.str(" bytes at ")?;
                            out.bytes(obs.name(e))?;
                            out.str(" via plan ")?;
                            out.u64(r.plan.unwrap_or(0) as u64)?;
                            out.str(" (sha256 ")?;
                            out.bytes(obs.name(r.output))?;
                            out.str(")\"}\n")?;
                        }
                        Some(false) => {
                            out.str(" ERR \"")?;
                            out.bytes(obs.name(r.relation))?;
                            out.str(": output differs from input at ")?;
                            out.bytes(obs.name(e))?;
                            out.str(" (input ")?;
                            out.bytes(obs.name(r.input))?;
                            out.str(" output ")?;
                            out.bytes(obs.name(r.output))?;
                            out.str(")\"}\n")?;
                        }
                        None => {
                            out.str(" ERR \"")?;
                            out.bytes(obs.name(r.relation))?;
                            out.str(": execution failed at ")?;
                            out.bytes(obs.name(e))?;
                            out.str(" (")?;
                            out.bytes(obs.name(r.status))?;
                            out.str(")\"}\n")?;
                        }
                    }
                }
                Kind::Loss => {
                    out.str("| @{issue loss_")?;
                    out.bytes(obs.name(e))?;
                    out.byte(b'_')?;
                    out.bytes(obs.name(r.subject))?;
                    out.str(" ERR \"")?;
                    out.bytes(obs.name(r.subject))?;
                    out.str(" lost at ")?;
                    out.bytes(obs.name(e))?;
                    out.str(" (reason ")?;
                    out.bytes(obs.name(r.reason))?;
                    out.str(")\"}\n")?;
                }
                Kind::NoActivePlan => {
                    out.str("| @{issue no_active_plan_")?;
                    out.bytes(obs.name(e))?;
                    out.str(" ERR \"NO_ACTIVE_PLAN at ")?;
                    out.bytes(obs.name(e))?;
                    out.str("\"}\n")?;
                }
                _ => {}
            }
        }
    }
    for r in obs.records.iter().filter(|r| r.kind == Kind::Transition) {
        out.str("| @{issue transition_")?;
        out.bytes(obs.name(r.epoch))?;
        out.byte(b'_')?;
        out.bytes(obs.name(r.epoch_to))?;
        out.str(" OBS \"")?;
        out.bytes(obs.name(r.epoch))?;
        out.str(" -> ")?;
        out.bytes(obs.name(r.epoch_to))?;
        out.str(": plan ")?;
        match r.plan {
            Some(p) => out.u64(p as u64)?,
            None => out.str("none")?,
        }
        out.str(" -> plan ")?;
        match r.plan2 {
            Some(p) => out.u64(p as u64)?,
            None => out.str("none")?,
        }
        out.str("; reselection inside the VerifiedStrategy, no codegen\"}\n")?;
    }
    // source-of-record statement, only when the host supplied both identities
    match (cx.source_sha_after, cx.source_sha_lineage) {
        (Some(a), Some(l)) => {
            let same = a == l;
            out.str("| @{issue source_of_record ")?;
            out.str(if same {
                "OBS \"authored source unchanged: sha256 "
            } else {
                "ERR \"authored source changed since compilation: sha256 "
            })?;
            out.bytes(&hexbuf(a))?;
            if !same {
                out.str(" vs lineage ")?;
                out.bytes(&hexbuf(l))?;
            }
            out.str("\"}\n")?;
        }
        _ => {
            out.str("| @{issue source_of_record UNK \"host did not supply source identities\"}\n")?
        }
    }
    // evidence lineage: the tape names the bundle it came from; compared with the manifest the host supplied
    match evidence_bound(obs, cx) {
        Some(true) => {
            out.str("| @{issue evidence_lineage OBS \"evidence tape bound to this bundle: strategy data sha256 ")?;
            out.bytes(&hexbuf(cx.strategy_data_sha_lineage.unwrap_or(&[0; 32])))?;
            out.str("\"}\n")?;
        }
        Some(false) => {
            out.str("| @{issue evidence_lineage ERR \"evidence tape is not bound to this bundle: ")?;
            match obs.records.iter().find(|r| r.kind == Kind::Bundle) {
                Some(b) => {
                    out.str("tape strategy data ")?;
                    out.bytes(obs.name(b.output))?;
                    out.str(" vs manifest ")?;
                    out.bytes(&hexbuf(cx.strategy_data_sha_lineage.unwrap_or(&[0; 32])))?;
                }
                None => out.str("the tape carries no bundle record")?,
            }
            out.str("\"}\n")?;
        }
        None => out.str("| @{issue evidence_lineage UNK \"host did not supply the bundle's strategy data identity\"}\n")?,
    }
    rule(out)
}

pub fn delta_json(
    obs: &Observation,
    cx: &Context<'_>,
    out: &mut OutBuf<'_>,
) -> Result<(), OutputTooSmall> {
    let mut w = JsonW::new(out);
    w.obj_begin()?;
    w.kv_str("kind", b"OBSERVATION_DELTA")?;
    w.kv_uint("schema_version", 1)?;
    w.kv_str("system", cx.system_name)?;
    w.kv_str("evidence_class", cx.evidence_class)?;
    w.key("epochs")?;
    w.arr()?;
    for e in obs.epochs() {
        w.str(obs.name(e))?;
    }
    w.arr_end()?;
    w.key("records")?;
    w.arr()?;
    for r in obs.records.iter() {
        w.obj()?;
        w.kv_str(
            "kind",
            match r.kind {
                Kind::Epoch => b"EPOCH" as &[u8],
                Kind::Admission => b"ADMISSION",
                Kind::Activation => b"ACTIVATION",
                Kind::Executed => b"EXECUTED",
                Kind::Loss => b"LOSS",
                Kind::Transition => b"TRANSITION",
                Kind::NoActivePlan => b"NO_ACTIVE_PLAN",
                Kind::Bundle => b"BUNDLE",
            },
        )?;
        if !r.epoch.is_empty() {
            w.kv_str("epoch", obs.name(r.epoch))?;
        }
        if !r.epoch_to.is_empty() {
            w.kv_str("to_epoch", obs.name(r.epoch_to))?;
        }
        if !r.subject.is_empty() {
            w.kv_str("subject", obs.name(r.subject))?;
        }
        if !r.decision.is_empty() {
            w.kv_str("decision", obs.name(r.decision))?;
        }
        if !r.evidence.is_empty() {
            w.kv_str("evidence", obs.name(r.evidence))?;
        }
        if !r.reason.is_empty() {
            w.kv_str("reason", obs.name(r.reason))?;
        }
        if let Some(p) = r.plan {
            w.kv_uint("plan", p as u64)?;
        }
        if let Some(p) = r.plan2 {
            w.kv_uint("replacement_plan", p as u64)?;
        }
        if !r.relation.is_empty() {
            w.kv_str("relation", obs.name(r.relation))?;
            w.kv_uint("bytes", r.bytes)?;
            w.kv_str("input_sha256", obs.name(r.input))?;
            w.kv_str("output_sha256", obs.name(r.output))?;
        }
        if let Some(x) = r.exact {
            w.kv_bool("exact", x)?;
        }
        if !r.status.is_empty() {
            w.kv_str("status", obs.name(r.status))?;
        }
        w.obj_end()?;
    }
    w.arr_end()?;
    w.key("transitions")?;
    w.arr()?;
    for r in obs.records.iter().filter(|r| r.kind == Kind::Transition) {
        w.obj()?;
        w.kv_str("from_epoch", obs.name(r.epoch))?;
        w.kv_str("to_epoch", obs.name(r.epoch_to))?;
        match r.plan {
            Some(p) => w.kv_uint("stale_plan", p as u64)?,
            None => w.kv_null("stale_plan")?,
        }
        match r.plan2 {
            Some(p) => w.kv_uint("replacement_plan", p as u64)?,
            None => w.kv_null("replacement_plan")?,
        }
        w.obj_end()?;
    }
    w.arr_end()?;
    match (cx.source_sha_after, cx.source_sha_lineage) {
        (Some(a), Some(l)) => {
            w.kv_hex("source_sha256_after", a)?;
            w.kv_hex("source_sha256_lineage", l)?;
            w.kv_bool("source_unchanged", a == l)?;
        }
        _ => w.kv_null("source_unchanged")?,
    }
    w.key("evidence_lineage")?;
    w.obj()?;
    match obs.records.iter().find(|r| r.kind == Kind::Bundle) {
        Some(b) => w.kv_str("tape_strategy_data_sha256", obs.name(b.output))?,
        None => w.kv_null("tape_strategy_data_sha256")?,
    }
    match cx.strategy_data_sha_lineage {
        Some(l) => w.kv_hex("manifest_strategy_data_sha256", l)?,
        None => w.kv_null("manifest_strategy_data_sha256")?,
    }
    match evidence_bound(obs, cx) {
        Some(b) => w.kv_bool("bound", b)?,
        None => w.kv_null("bound")?,
    }
    w.obj_end()?;
    w.obj_end()
}
