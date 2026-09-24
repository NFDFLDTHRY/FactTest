//! Kernel witnesses for BOOTSTRAP-TESTS B5, B7, B8 (native).  B9-B11 are witnessed by host/harness in wasm64.
use factc_foundation::{DiagCode, OutBuf};
use factc_kernel::{Mode, Status, Workspace};

fn ws() -> Box<Workspace> {
    Box::new(Workspace::new())
}

/// Run a closure on a thread with a stack large enough for the bounded-arena workspace.
fn big_stack<T: Send + 'static>(f: impl FnOnce() -> T + Send + 'static) -> T {
    std::thread::Builder::new()
        .stack_size(256 * 1024 * 1024)
        .spawn(f)
        .unwrap()
        .join()
        .unwrap()
}

#[test]
fn b7_opaque_source_reaches_front_end_boundary() {
    big_stack(|| {
        let mut w = ws();
        let id =
            factc_kernel::submit_source_bytes(&mut w, b"arbitrary \xff bytes {{ not a grammar")
                .unwrap();
        assert_eq!(id.raw(), 0);
        let unit = *w.sources.get(0).unwrap();
        assert_eq!(unit.len, 34);
        assert_eq!(w.source(&unit), b"arbitrary \xff bytes {{ not a grammar");
        let id2 = factc_kernel::submit_source_bytes(&mut w, b"second").unwrap();
        assert_eq!(id2.raw(), 1);
        assert_eq!(w.sources.get(1).unwrap().off, 34);
    });
}

#[test]
fn b8_front_end_boundary_is_structured_and_deterministic() {
    // Pass-3 era: LANGUAGE_KERNEL_NOT_IMPLEMENTED.  After M3 the kernel exists; opaque non-grammar bytes still
    // reach the boundary deterministically and yield structured diagnostics (no @{system} => PARSE_MISSING_SYSTEM).
    big_stack(|| {
        let render = |src: &[u8]| {
            let mut w = ws();
            factc_kernel::submit_source_bytes(&mut w, src).unwrap();
            let st = factc_kernel::check_or_compile(&mut w, Mode::Analyze);
            assert_eq!(st, Status::Diagnostics);
            assert!(w.diagnostics.has_code(DiagCode::ParseMissingSystem));
            assert!(!w
                .diagnostics
                .has_code(DiagCode::LanguageKernelNotImplemented));
            let mut bytes = vec![0u8; 8192];
            let mut o = OutBuf::new(&mut bytes);
            factc_kernel::read_diagnostics(&w, &mut o).unwrap();
            o.as_slice().to_vec()
        };
        let a = render(b"opaque bytes with no islands");
        let b = render(b"opaque bytes with no islands");
        assert_eq!(
            a, b,
            "identical input must render identical structured diagnostics"
        );
    });
}

#[test]
fn b2_workspace_exhaustion_is_structured() {
    big_stack(|| {
        let mut w = ws();
        let big = vec![b'x'; factc_foundation::limits::SOURCE_BYTES + 1];
        assert_eq!(
            factc_kernel::submit_source_bytes(&mut w, &big),
            Err(Status::Exhausted)
        );
        assert!(w.diagnostics.has_code(DiagCode::WorkspaceExhausted));
    });
}

#[test]
fn no_source_is_a_diagnostic_not_a_panic() {
    big_stack(|| {
        let mut w = ws();
        assert_eq!(
            factc_kernel::check_or_compile(&mut w, Mode::Build),
            Status::Diagnostics
        );
        assert!(w.diagnostics.has_code(DiagCode::NoSourceSubmitted));
    });
}
