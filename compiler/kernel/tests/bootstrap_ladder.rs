//! Kernel witnesses for BOOTSTRAP-TESTS B5, B7, B8 (native).  B9-B11 are witnessed by host/harness in wasm64.
use factc_foundation::{DiagCode, OutBuf};
use factc_kernel::{Mode, Status, Workspace};

fn ws() -> Box<Workspace> {
    Box::new(Workspace::new())
}

#[test]
fn b7_opaque_source_reaches_front_end_boundary() {
    let mut w = ws();
    let id = factc_kernel::submit_source_bytes(&mut w, b"arbitrary \xff bytes {{ not a grammar")
        .unwrap();
    assert_eq!(id.raw(), 0);
    let unit = *w.sources.get(0).unwrap();
    assert_eq!(unit.len, 34);
    assert_eq!(w.source(&unit), b"arbitrary \xff bytes {{ not a grammar");
    let id2 = factc_kernel::submit_source_bytes(&mut w, b"second").unwrap();
    assert_eq!(id2.raw(), 1);
    assert_eq!(w.sources.get(1).unwrap().off, 34);
}

#[test]
fn b8_language_kernel_absent_is_structured_and_deterministic() {
    let render = |src: &[u8]| {
        let mut w = ws();
        factc_kernel::submit_source_bytes(&mut w, src).unwrap();
        let st = factc_kernel::check_or_compile(&mut w, Mode::Analyze);
        assert_eq!(st, Status::NotImplemented);
        assert!(w
            .diagnostics
            .has_code(DiagCode::LanguageKernelNotImplemented));
        let d = w.diagnostics.iter().next().unwrap();
        assert_eq!(d.primary.unwrap().end(), src.len() as u32);
        let mut bytes = vec![0u8; 8192];
        let mut o = OutBuf::new(&mut bytes);
        factc_kernel::read_diagnostics(&w, &mut o).unwrap();
        o.as_slice().to_vec()
    };
    let a = render(b"@{system x}");
    let b = render(b"@{system x}");
    assert_eq!(
        a, b,
        "identical input must render identical structured diagnostics"
    );
    let text = String::from_utf8(a).unwrap();
    assert!(text.contains("\"code\":\"LANGUAGE_KERNEL_NOT_IMPLEMENTED\""));
    assert!(text.contains("\"phase\":\"SCAN\""));
}

#[test]
fn b2_workspace_exhaustion_is_structured() {
    let mut w = ws();
    let big = vec![b'x'; factc_foundation::limits::SOURCE_BYTES + 1];
    assert_eq!(
        factc_kernel::submit_source_bytes(&mut w, &big),
        Err(Status::Exhausted)
    );
    assert!(w.diagnostics.has_code(DiagCode::WorkspaceExhausted));
}

#[test]
fn no_source_is_a_diagnostic_not_a_panic() {
    let mut w = ws();
    assert_eq!(
        factc_kernel::check_or_compile(&mut w, Mode::Build),
        Status::Diagnostics
    );
    assert!(w.diagnostics.has_code(DiagCode::NoSourceSubmitted));
}
