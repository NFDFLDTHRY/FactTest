//! Foundation witnesses (BOOTSTRAP-TESTS B3, B4 and arena laws).
use crate::*;

#[test]
fn b3_span_requires_valid_interval() {
    assert!(Span::new(SourceId::new(0), 3, 3).is_some());
    assert!(Span::new(SourceId::new(0), 4, 3).is_none());
    let s = Span::new(SourceId::new(7), 2, 5).unwrap();
    assert_eq!(s.source(), SourceId::new(7));
    assert_eq!(s.len(), 3);
}

#[test]
fn bvec_exhaustion_is_a_value() {
    let mut v: BVec<u8, 2> = BVec::new();
    assert!(v.push(1).is_ok());
    assert!(v.push(2).is_ok());
    assert_eq!(v.push(3), Err(Exhausted));
    assert_eq!(v.len(), 2);
}

#[test]
fn text_arena_interns_and_compares_by_bytes() {
    let mut a: TextArena<64> = TextArena::new();
    let x = a.intern(b"ingress").unwrap();
    let y = a.intern(b"ingress").unwrap();
    let z = a.intern(b"egress").unwrap();
    assert_eq!(x, y);
    assert!(a.eq(x, y));
    assert!(!a.eq(x, z));
    let mut small: TextArena<4> = TextArena::new();
    assert_eq!(small.intern(b"toolong"), Err(Exhausted));
}

#[test]
fn outbuf_reports_output_too_small() {
    let mut bytes = [0u8; 4];
    let mut o = OutBuf::new(&mut bytes);
    assert!(o.str("abc").is_ok());
    assert_eq!(o.str("de"), Err(OutputTooSmall));
    assert_eq!(o.as_slice(), b"abc");
}

#[test]
fn json_writer_is_deterministic_and_escapes() {
    let mut bytes = [0u8; 256];
    let mut o = OutBuf::new(&mut bytes);
    let mut w = json::JsonW::new(&mut o);
    w.obj_begin().unwrap();
    w.kv_str("a", b"x\"y\n").unwrap();
    w.key("b").unwrap();
    w.arr().unwrap();
    w.int(-3).unwrap();
    w.bool(true).unwrap();
    w.null().unwrap();
    w.arr_end().unwrap();
    w.kv_hex("h", &[0xde, 0xad]).unwrap();
    w.obj_end().unwrap();
    assert_eq!(
        o.as_slice(),
        br#"{"a":"x\"y\n","b":[-3,true,null],"h":"dead"}"#
    );
}

#[test]
fn b4_diagnostics_deterministic_order() {
    let s0 = SourceId::new(0);
    let d1 = Diagnostic::new(
        DiagCode::UnresolvedName,
        Phase::Resolve,
        s0,
        Span::new(s0, 40, 50),
        "x",
    );
    let d2 = Diagnostic::new(
        DiagCode::DuplicateIdentity,
        Phase::Resolve,
        s0,
        Span::new(s0, 10, 20),
        "y",
    );
    let d3 = Diagnostic::new(
        DiagCode::TypeMismatch,
        Phase::Type,
        s0,
        Span::new(s0, 10, 20),
        "z",
    );
    let mut a: Diagnostics<8> = Diagnostics::new();
    a.push(d1);
    a.push(d2);
    a.push(d3);
    a.sort();
    let mut b: Diagnostics<8> = Diagnostics::new();
    b.push(d3);
    b.push(d1);
    b.push(d2);
    b.sort();
    let ka: [_; 3] = [
        a.iter().next().unwrap().key(),
        a.iter().nth(1).unwrap().key(),
        a.iter().nth(2).unwrap().key(),
    ];
    let kb: [_; 3] = [
        b.iter().next().unwrap().key(),
        b.iter().nth(1).unwrap().key(),
        b.iter().nth(2).unwrap().key(),
    ];
    assert_eq!(ka, kb);
    assert_eq!(a.iter().next().unwrap().code, DiagCode::DuplicateIdentity);
}
