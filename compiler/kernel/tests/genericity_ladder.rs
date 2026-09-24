//! D24 genericity ladder: the SAME kernel over semantically distinct specimens (fixtures/genericity/*), with the
//! attacks that must fail at the compiler level.  Nothing here names a backend, relation or system except as the
//! specimen data under test; every expectation is read from the specimen's fixture directory.
use factc_bundle::{BundleCertificate, Expected, File};
use factc_foundation::{ArtifactKind, DiagCode};
use factc_kernel::{Mode, Status, Workspace};
use std::path::PathBuf;

fn fixtures() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../fixtures")
}

fn read(rel: &str) -> Vec<u8> {
    let p = fixtures().join(rel);
    std::fs::read(&p).unwrap_or_else(|e| panic!("{}: {}", p.display(), e))
}

/// A specimen as fixtures/genericity/<name>/specimen.json declares it (paths relative to the repository root).
struct Specimen {
    name: &'static str,
    system: String,
    source: Vec<u8>,
    contracts: Vec<u8>,
    metrics: Vec<u8>,
    transfers: Vec<String>,
    variants: usize,
}

fn field<'a>(json: &'a str, key: &str) -> &'a str {
    let k = format!("\"{}\":", key);
    let i = json
        .find(&k)
        .unwrap_or_else(|| panic!("specimen field {}", key))
        + k.len();
    let rest = json[i..].trim_start();
    if let Some(r) = rest.strip_prefix('"') {
        &r[..r.find('"').unwrap()]
    } else if let Some(r) = rest.strip_prefix('[') {
        &r[..r.find(']').unwrap()]
    } else {
        let e = rest.find([',', '}', '\n']).unwrap();
        rest[..e].trim()
    }
}

fn specimen(name: &'static str) -> Specimen {
    let json = String::from_utf8(read(&format!("genericity/{}/specimen.json", name))).unwrap();
    let repo = |p: &str| p.strip_prefix("fixtures/").unwrap().to_string();
    let metrics = field(&json, "metrics");
    Specimen {
        name,
        system: field(&json, "system").to_string(),
        source: read(&repo(field(&json, "source"))),
        contracts: read(&repo(field(&json, "contracts"))),
        metrics: if metrics == "null" {
            Vec::new()
        } else {
            read(&repo(metrics))
        },
        transfers: field(&json, "transfers")
            .split(',')
            .map(|s| s.trim().trim_matches('"').to_string())
            .collect(),
        variants: field(&json, "variants").parse().unwrap(),
    }
}

const SPECIMENS: [&str; 4] = ["byte-relay", "ledger-mirror", "pixel-vault", "dual-stream"];

struct Run {
    ws: Box<Workspace>,
    status: Status,
}

fn run_bytes(src: Vec<u8>, contracts: Vec<u8>, metrics: Vec<u8>, mode: Mode) -> Run {
    std::thread::Builder::new()
        .stack_size(256 * 1024 * 1024)
        .spawn(move || {
            let mut ws = Box::new(Workspace::new());
            factc_kernel::submit_source_bytes(&mut ws, &src).unwrap();
            factc_kernel::submit_contracts(&mut ws, &contracts).unwrap();
            if !metrics.is_empty() {
                factc_kernel::submit_metrics(&mut ws, &metrics).unwrap();
            }
            let status = factc_kernel::check_or_compile(&mut ws, mode);
            Run { ws, status }
        })
        .unwrap()
        .join()
        .unwrap()
}

fn build(s: &Specimen) -> Run {
    run_bytes(
        s.source.clone(),
        s.contracts.clone(),
        s.metrics.clone(),
        Mode::Build,
    )
}

impl Run {
    fn codes(&self) -> Vec<&'static str> {
        self.ws.diagnostics.iter().map(|d| d.code.name()).collect()
    }
    fn file(&self, path: &str) -> String {
        String::from_utf8_lossy(
            self.ws
                .bundle
                .get(path.as_bytes())
                .unwrap_or_else(|| panic!("bundle file {}", path)),
        )
        .to_string()
    }
    fn files(&self) -> Vec<(Vec<u8>, Vec<u8>)> {
        self.ws
            .bundle
            .files
            .iter()
            .map(|f| (f.path().to_vec(), self.ws.bundle.bytes(f).to_vec()))
            .collect()
    }
    fn strategy_json(&self) -> String {
        let sel = self.file("selector.js");
        let a = sel.find("/*STRATEGY-BEGIN*/").unwrap() + "/*STRATEGY-BEGIN*/".len();
        let b = sel.find("/*STRATEGY-END*/").unwrap();
        sel[a..b].to_string()
    }
    fn strategy_sha(&self) -> String {
        let sel = self.file("selector.js");
        let a = sel.find("STRATEGY_SHA256 = '").unwrap() + "STRATEGY_SHA256 = '".len();
        sel[a..a + 64].to_string()
    }
    fn certificate(&self) -> String {
        let idx = self
            .ws
            .artifacts
            .iter()
            .position(|a| a.kind == ArtifactKind::BundleCertificate)
            .expect("bundle certificate");
        String::from_utf8(self.ws.artifact(idx).unwrap().to_vec()).unwrap()
    }
    fn reverify(&self, files: &[(Vec<u8>, Vec<u8>)]) -> BundleCertificate {
        let vs = self.ws.verification.verified.as_ref().unwrap();
        let flat: Vec<File<'_>> = files
            .iter()
            .map(|(p, b)| File { path: p, bytes: b })
            .collect();
        let source_sha = factc_foundation::sha256::digest(self.ws.source(&self.ws.sources[0]));
        let canonical_sha = self
            .ws
            .artifacts
            .iter()
            .find(|a| a.kind == ArtifactKind::CanonicalAscii)
            .unwrap()
            .sha256;
        let mut cert = BundleCertificate::new();
        factc_bundle::verify(
            &self.ws.model,
            &self.ws.registry,
            &self.ws.hypergraph,
            vs,
            &flat,
            &Expected {
                source_sha256: &source_sha,
                canonical_sha256: &canonical_sha,
            },
            &mut cert,
        );
        cert
    }
}

fn failing(c: &BundleCertificate) -> Vec<&'static str> {
    c.checks.iter().filter(|x| !x.pass).map(|x| x.id).collect()
}

fn edited(
    files: &[(Vec<u8>, Vec<u8>)],
    path: &str,
    from: &str,
    to: &str,
) -> Vec<(Vec<u8>, Vec<u8>)> {
    let mut out = files.to_vec();
    let f = out.iter_mut().find(|(p, _)| p == path.as_bytes()).unwrap();
    let text = String::from_utf8(f.1.clone()).unwrap();
    assert!(text.contains(from), "{} lacks {}", path, from);
    f.1 = text.replacen(from, to, 1).into_bytes();
    out
}

#[test]
fn g01_every_specimen_builds_with_per_transfer_strategy_data() {
    for name in SPECIMENS {
        let s = specimen(name);
        let r = build(&s);
        assert_eq!(r.status, Status::Ok, "{}: {:?}", name, r.codes());
        assert!(r.certificate().contains("\"status\":\"PASS\""), "{}", name);
        let j = r.strategy_json();
        // transfers in source order, each with type and mode
        let mut expect = String::from("\"transfers\":[");
        for (i, t) in s.transfers.iter().enumerate() {
            if i > 0 {
                expect.push(',');
            }
            expect.push_str(&format!("{{\"relation\":\"{}\",", t));
        }
        for t in &s.transfers {
            assert!(
                j.contains(&format!("{{\"relation\":\"{}\",\"type\":\"", t)),
                "{}: {}",
                name,
                j
            );
        }
        assert_eq!(
            j.matches("\"plan_id\":").count(),
            s.variants,
            "{}: {}",
            name,
            j
        );
        // every variant lists a requirement for every transfer, with at least one backend and its adapter
        let reqs = j.matches("\"requirements\":[").count();
        assert_eq!(reqs, s.variants, "{}", name);
        for t in &s.transfers {
            assert_eq!(
                j.matches(&format!("{{\"relation\":\"{}\",\"backends\":[\"", t))
                    .count(),
                s.variants,
                "{}: requirement for {} in every variant",
                name,
                t
            );
        }
        assert!(
            !j.contains("\"adapters\":[null"),
            "{}: an adapter is missing",
            name
        );
        // the selector names the identity of its data; the manifest names the same
        let sha = r.strategy_sha();
        let mut hex = [0u8; 64];
        factc_foundation::hex::encode_into(
            &factc_foundation::sha256::digest(j.as_bytes()),
            &mut hex,
        );
        assert_eq!(sha.as_bytes(), &hex, "{}", name);
        assert!(
            r.file("bundle.json")
                .contains(&format!("\"strategy_data_sha256\":\"{}\"", sha)),
            "{}",
            name
        );
        assert!(
            r.file("bundle.json")
                .contains(&format!("\"system\":\"{}\"", s.system)),
            "{}",
            name
        );
    }
}

#[test]
fn g02_no_specimen_bundle_carries_another_specimens_semantics() {
    let all: Vec<Specimen> = SPECIMENS.iter().map(|n| specimen(n)).collect();
    for s in &all {
        let r = build(s);
        let body: String = [
            "index.html",
            "runtime.js",
            "membrane.js",
            "selector.js",
            "sw.js",
        ]
        .iter()
        .map(|f| r.file(f))
        .collect::<Vec<_>>()
        .join("\n");
        for other in all.iter().filter(|o| o.name != s.name) {
            for n in std::iter::once(&other.system).chain(other.transfers.iter()) {
                for q in ['"', '\''] {
                    assert!(
                        !body.contains(&format!("{}{}{}", q, n, q)),
                        "{} bundle names {} of {}",
                        s.name,
                        n,
                        other.name
                    );
                }
            }
        }
        // the runtime template executes by requirement, never by a fixed relation or a fixed guard index
        let rt = r.file("runtime.js");
        assert!(rt.contains("requirementFor(plan, relation)"), "{}", s.name);
        assert!(
            !rt.contains("plan.guard[0]"),
            "{}: fixed first-backend execution",
            s.name
        );
        assert!(
            !rt.contains("function relay("),
            "{}: fixed operation name",
            s.name
        );
    }
}

#[test]
fn g03_renamed_and_reordered_relations_change_the_verified_strategy_identity() {
    let s = specimen("ledger-mirror");
    let base = build(&s);
    let src = String::from_utf8(s.source.clone()).unwrap();
    let renamed = run_bytes(
        src.replacen("@{data post ", "@{data posted ", 1)
            .into_bytes(),
        s.contracts.clone(),
        s.metrics.clone(),
        Mode::Build,
    );
    assert_eq!(renamed.status, Status::Ok, "{:?}", renamed.codes());
    assert!(renamed
        .strategy_json()
        .contains("{\"relation\":\"posted\",\"type\":\""));
    assert!(!renamed
        .strategy_json()
        .contains("{\"relation\":\"post\",\"type\":\""));
    assert_ne!(
        renamed.strategy_sha(),
        base.strategy_sha(),
        "a renamed relation is a different verified strategy"
    );
    let post = src
        .lines()
        .find(|l| l.contains("@{data post "))
        .unwrap()
        .to_string();
    let mirror = src
        .lines()
        .find(|l| l.contains("@{data mirror "))
        .unwrap()
        .to_string();
    let swapped = src
        .replacen(&post, "\u{1}", 1)
        .replacen(&mirror, &post, 1)
        .replacen("\u{1}", &mirror, 1);
    let reordered = run_bytes(
        swapped.into_bytes(),
        s.contracts.clone(),
        s.metrics.clone(),
        Mode::Build,
    );
    assert_eq!(reordered.status, Status::Ok, "{:?}", reordered.codes());
    let j = reordered.strategy_json();
    assert!(
        j.find("{\"relation\":\"mirror\",\"type\":\"").unwrap()
            < j.find("{\"relation\":\"post\",\"type\":\"").unwrap()
    );
    assert_ne!(reordered.strategy_sha(), base.strategy_sha());
}

#[test]
fn g04_missing_conversion_and_single_backend_registry() {
    let s = specimen("ledger-mirror");
    let contracts = String::from_utf8(s.contracts.clone()).unwrap();
    let without: String = contracts
        .lines()
        .filter(|l| !l.contains("conversion entry_out"))
        .collect::<Vec<_>>()
        .join("\n");
    let r = run_bytes(
        s.source.clone(),
        without.into_bytes(),
        Vec::new(),
        Mode::Build,
    );
    assert_ne!(r.status, Status::Ok);
    assert!(r.codes().contains(&"NO_LEGAL_PLAN"), "{:?}", r.codes());
    assert!(
        r.ws.bundle.files.is_empty(),
        "no bundle without a legal plan"
    );
    let d = specimen("dual-stream");
    let dc = String::from_utf8(d.contracts.clone()).unwrap();
    let single: String = dc
        .lines()
        .filter(|l| {
            ![
                "WEBGPU",
                "chunk_to_gpu",
                "chunk_from_gpu",
                "R_CHUNK_GPU",
                "GPU_CHUNK",
            ]
            .iter()
            .any(|k| l.contains(k))
        })
        .collect::<Vec<_>>()
        .join("\n");
    let dm = String::from_utf8(d.metrics.clone()).unwrap();
    let single_m: String = dm
        .lines()
        .filter(|l| !l.contains("WEBGPU"))
        .collect::<Vec<_>>()
        .join("\n");
    let r = run_bytes(
        d.source.clone(),
        single.into_bytes(),
        single_m.into_bytes(),
        Mode::Build,
    );
    assert_eq!(r.status, Status::Ok, "{:?}", r.codes());
    assert_eq!(r.strategy_json().matches("\"plan_id\":").count(), 1);
}

#[test]
fn g05_undeclared_adapter_and_wrong_implementation_family_fail_verification() {
    let s = specimen("ledger-mirror");
    let c = String::from_utf8(s.contracts.clone()).unwrap().replacen(
        "adapter=wasm64_relay",
        "adapter=opfs_relay",
        1,
    );
    let r = run_bytes(s.source.clone(), c.into_bytes(), Vec::new(), Mode::Build);
    assert_ne!(
        r.status,
        Status::Ok,
        "an adapter the compiler does not carry cannot build"
    );
    let v = specimen("pixel-vault");
    let c = String::from_utf8(v.contracts.clone()).unwrap().replacen(
        "adapter=webgpu_relay",
        "adapter=wasm64_relay",
        1,
    );
    let r = run_bytes(v.source.clone(), c.into_bytes(), Vec::new(), Mode::Build);
    assert_ne!(r.status, Status::Ok);
    assert!(
        r.ws.diagnostics.has_code(DiagCode::BundleCheckFailed),
        "{:?}",
        r.codes()
    );
    assert!(
        r.certificate()
            .contains("\"check\":\"B-11-adapter-realizes-backend\",\"status\":\"FAIL\""),
        "{}",
        r.certificate()
    );
}

#[test]
fn g06_tampered_strategy_guard_and_certificate_fail_reverification() {
    for name in ["ledger-mirror", "dual-stream"] {
        let s = specimen(name);
        let r = build(&s);
        let files = r.files();
        assert!(
            r.reverify(&files).pass,
            "{}: untouched bundle re-verifies",
            name
        );
        let guard = edited(
            &files,
            "selector.js",
            "\"guard\":[\"CPU_WASM64\"]",
            "\"guard\":[\"NOBACKEND\"]",
        );
        let f = failing(&r.reverify(&guard));
        assert!(
            f.contains(&"B-06-selector-variants") && f.contains(&"B-08-artifact-identities"),
            "{}: {:?}",
            name,
            f
        );
        let identity = edited(
            &files,
            "selector.js",
            "STRATEGY_SHA256 = '",
            "STRATEGY_SHA256 = '0",
        );
        let f = failing(&r.reverify(&identity));
        assert!(
            f.contains(&"B-06-selector-strategy-identity"),
            "{}: {:?}",
            name,
            f
        );
        let cert = edited(
            &files,
            "selector.js",
            "\"strategy_certificate_id\":1000",
            "\"strategy_certificate_id\":1001",
        );
        let f = failing(&r.reverify(&cert));
        assert!(f.contains(&"B-06-selector-variants"), "{}: {:?}", name, f);
        let man = edited(
            &files,
            "bundle.json",
            "\"strategy_certificate_id\":1000",
            "\"strategy_certificate_id\":1001",
        );
        let f = failing(&r.reverify(&man));
        assert!(f.contains(&"B-08-lineage-certificate"), "{}: {:?}", name, f);
        let id = edited(
            &files,
            "bundle.json",
            "\"strategy_data_sha256\":\"",
            "\"strategy_data_sha256\":\"0",
        );
        let f = failing(&r.reverify(&id));
        assert!(
            f.contains(&"B-08-lineage-strategy-data"),
            "{}: {:?}",
            name,
            f
        );
    }
}

#[test]
fn g07_evidence_of_one_bundle_is_not_evidence_of_another() {
    let a = build(&specimen("ledger-mirror"));
    let b = build(&specimen("dual-stream"));
    let tape = format!(
        "@{{bundle strategy_data=\"{}\" strategy=1 certificate=1000}}\n@{{epoch E0}}\n@{{admission CPU_WASM64 ADMITTED evidence=wasm64_known_answer}}\n@{{activation E0 plan=0 status=PASS}}\n",
        a.strategy_sha()
    );
    let observe = |want: &str| {
        let want = want.to_string();
        let tape = tape.clone();
        std::thread::Builder::new()
            .stack_size(256 * 1024 * 1024)
            .spawn(move || {
                let mut sha = [0u8; 32];
                factc_foundation::hex::decode_into(want.as_bytes(), &mut sha).unwrap();
                let mut ws = Box::new(Workspace::new());
                factc_kernel::submit_evidence_tape(&mut ws, tape.as_bytes()).unwrap();
                let st = factc_kernel::observe(
                    &mut ws,
                    b"ledger_mirror",
                    None,
                    None,
                    Some(&sha),
                    b"SAMPLE",
                );
                let unbound = ws.diagnostics.has_code(DiagCode::EvidenceUnbound);
                (st, unbound)
            })
            .unwrap()
            .join()
            .unwrap()
    };
    assert_eq!(observe(&a.strategy_sha()), (Status::Ok, false));
    assert_eq!(observe(&b.strategy_sha()), (Status::Diagnostics, true));
}
