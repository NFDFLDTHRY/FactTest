//! Codegen (CODEGEN-BUNDLE-CONTRACT.md).  Input: TypedSystemIR (model), VerifiedStrategy, registry contracts and
//! CodegenRecipes.  Output: GeneratedBundle.  Codegen may realize the verified plan and nothing else: it never
//! selects a backend, never adds an adapter that no verified variant needs, never touches source semantics.
#![no_std]
#![forbid(unsafe_code)]

pub mod bundle;
pub mod wasm;

use bundle::{BundleStore, Role};
use factc_foundation::json::JsonW;
use factc_foundation::{OutBuf, OutputTooSmall};
use factc_implementation::{Hypergraph, Registry, StrList};
use factc_semantic::Model;
use factc_verifier::VerifiedStrategy;

/// Byte region layout of the generated relay module: two regions of REGION bytes inside a 2*REGION memory.
pub const REGION: i64 = 1 << 20;
pub const MEMORY_PAGES: u64 = (2 * REGION as u64) / 65536;

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum CodegenError {
    UnknownAdapterTemplate,
    UnknownExport,
    RecipeMissing,
    Output,
    TooManyAdapters,
}

const TEMPLATE_MEMBRANE: &str = include_str!("../templates/membrane-core.js");
const TEMPLATE_WASM64_RELAY: &str = include_str!("../templates/adapter-wasm64_relay.js");
const TEMPLATE_WEBGPU_RELAY: &str = include_str!("../templates/adapter-webgpu_relay.js");
const TEMPLATE_SELECTOR: &str = include_str!("../templates/selector.js");
const TEMPLATE_RUNTIME: &str = include_str!("../templates/runtime.js");
const TEMPLATE_INDEX: &str = include_str!("../templates/index.html");
const TEMPLATE_MANIFEST: &str = include_str!("../templates/manifest.webmanifest");
const TEMPLATE_SW: &str = include_str!("../templates/sw.js");

/// Adapter template library, keyed by the recipe's `adapter=` name.  A recipe naming an adapter absent here is
/// a codegen GAP (structured error), never a silent substitution.
fn adapter_template(name: &[u8]) -> Option<&'static str> {
    match name {
        b"wasm64_relay" => Some(TEMPLATE_WASM64_RELAY),
        b"webgpu_relay" => Some(TEMPLATE_WEBGPU_RELAY),
        _ => None,
    }
}

/// Wasm function library, keyed by recipe export names.
fn export_func(name: &[u8]) -> Option<wasm::Func> {
    Some(match name {
        b"abi_version" => wasm::Func {
            name: "abi_version",
            kind: wasm::FuncKind::ConstI32(1),
        },
        b"copy_bytes" => wasm::Func {
            name: "copy_bytes",
            kind: wasm::FuncKind::CopyBytes,
        },
        b"region_in" => wasm::Func {
            name: "region_in",
            kind: wasm::FuncKind::ConstI64(0),
        },
        b"region_out" => wasm::Func {
            name: "region_out",
            kind: wasm::FuncKind::ConstI64(REGION),
        },
        b"region_capacity" => wasm::Func {
            name: "region_capacity",
            kind: wasm::FuncKind::ConstI64(REGION),
        },
        _ => return None,
    })
}

/// Substitute `needle` -> `value` while streaming `template` into `out`.
fn subst(
    template: &str,
    pairs: &[(&str, &[u8])],
    out: &mut OutBuf<'_>,
) -> Result<(), OutputTooSmall> {
    let t = template.as_bytes();
    let mut i = 0;
    'outer: while i < t.len() {
        for (needle, value) in pairs {
            let n = needle.as_bytes();
            if t[i..].starts_with(n) {
                out.bytes(value)?;
                i += n.len();
                continue 'outer;
            }
        }
        out.byte(t[i])?;
        i += 1;
    }
    Ok(())
}

/// Recipes used by the verified variants: (recipe index, adapter name), deduplicated in registry order.
pub fn recipes_used(reg: &Registry, vs: &VerifiedStrategy) -> Result<StrList, CodegenError> {
    let mut adapters = StrList::default();
    for v in vs.variants.iter() {
        for b in v.plan.guard.iter() {
            let bi = reg
                .find_backend(reg.name(b))
                .ok_or(CodegenError::RecipeMissing)?;
            let recipe = reg.backends[bi as usize]
                .recipe
                .ok_or(CodegenError::RecipeMissing)?;
            let ri = reg
                .find_recipe(reg.name(recipe))
                .ok_or(CodegenError::RecipeMissing)?;
            let ad = reg.recipes[ri as usize].adapter;
            if !adapters.iter().any(|x| reg.text.eq(x, ad)) && !adapters.push(ad) {
                return Err(CodegenError::TooManyAdapters);
            }
        }
    }
    Ok(adapters)
}

fn adapter_of_backend(
    reg: &Registry,
    backend: factc_foundation::Str,
) -> Option<factc_foundation::Str> {
    let bi = reg.find_backend(reg.name(backend))?;
    let recipe = reg.backends[bi as usize].recipe?;
    let ri = reg.find_recipe(reg.name(recipe))?;
    Some(reg.recipes[ri as usize].adapter)
}

/// Strategy data embedded in selector.js.  The BundleVerifier re-renders this from the VerifiedStrategy and
/// compares bytes, so any drift between emitted selector data and verified state is caught.
pub fn strategy_data_json(
    m: &Model,
    reg: &Registry,
    hg: &Hypergraph,
    vs: &VerifiedStrategy,
    out: &mut OutBuf<'_>,
) -> Result<(), OutputTooSmall> {
    let mut w = JsonW::new(out);
    w.obj_begin()?;
    w.kv_uint("strategy_id", vs.strategy_id as u64)?;
    w.kv_uint("strategy_certificate_id", vs.strategy_certificate_id as u64)?;
    // relation name of the first transfer (adaptive relay targets have one); generic name otherwise
    let rel = m
        .relations
        .iter()
        .find(|r| r.kind == factc_semantic::RelKind::Data)
        .map(|r| m.name(r.name))
        .unwrap_or(b"data");
    w.kv_str("relation", rel)?;
    w.key("dispatch_order")?;
    w.arr()?;
    for v in vs.ordered() {
        w.uint(v.plan.plan_id as u64)?;
    }
    w.arr_end()?;
    w.key("variants")?;
    w.arr()?;
    for v in vs.variants.iter() {
        w.obj()?;
        w.kv_uint("plan_id", v.plan.plan_id as u64)?;
        w.kv_uint("certificate_id", v.certificate_id as u64)?;
        w.key("guard")?;
        w.arr()?;
        for b in v.plan.guard.iter() {
            w.str(reg.name(b))?;
        }
        w.arr_end()?;
        w.key("adapters")?;
        w.arr()?;
        for b in v.plan.guard.iter() {
            match adapter_of_backend(reg, b) {
                Some(a) => w.str(reg.name(a))?,
                None => w.null()?,
            }
        }
        w.arr_end()?;
        w.key("conversions")?;
        w.arr()?;
        for e in v.plan.edges.iter().take(v.plan.nreq as usize).flatten() {
            if let Some(edge) = hg.edges.iter().find(|x| x.id == *e) {
                for ci in edge.steps() {
                    w.str(reg.name(reg.conversions[ci as usize].name))?;
                }
            }
        }
        w.arr_end()?;
        w.obj_end()?;
    }
    w.arr_end()?;
    w.obj_end()
}

pub struct Lineage<'a> {
    pub system_name: &'a [u8],
    pub source_sha256: &'a [u8; 32],
    pub canonical_sha256: &'a [u8; 32],
    pub typed_ir_sha256: &'a [u8; 32],
}

/// Generate the bundle.  `scratch` must be large enough for the biggest single file.
pub fn generate(
    m: &Model,
    reg: &Registry,
    hg: &Hypergraph,
    vs: &VerifiedStrategy,
    lineage: &Lineage<'_>,
    store: &mut BundleStore,
    scratch: &mut [u8],
) -> Result<(), CodegenError> {
    store.clear();
    let adapters = recipes_used(reg, vs)?;
    // 1. wasm modules for recipes whose roles include wasm_module
    let mut wasm_file: [u8; 64] = [0; 64];
    let mut wasm_file_len = 0usize;
    for r in reg.recipes.iter() {
        if !adapters.iter().any(|a| reg.text.eq(a, r.adapter))
            || !r.roles.iter().any(|x| reg.text.eq_bytes(x, b"wasm_module"))
        {
            continue;
        }
        let mut funcs: [wasm::Func; 8] = [wasm::Func {
            name: "",
            kind: wasm::FuncKind::ConstI32(0),
        }; 8];
        let mut nf = 0;
        for ex in r.exports.iter() {
            let name = reg.name(ex);
            if name == b"memory" {
                continue;
            }
            let f = export_func(name).ok_or(CodegenError::UnknownExport)?;
            if nf < funcs.len() {
                funcs[nf] = f;
                nf += 1;
            }
        }
        let spec = wasm::ModuleSpec {
            memory_min_pages: MEMORY_PAGES,
            memory_export: "memory",
            funcs: &funcs[..nf],
        };
        let mut o = OutBuf::new(scratch);
        wasm::emit(&spec, &mut o).map_err(|_| CodegenError::Output)?;
        let n = o.len();
        let adapter = reg.name(r.adapter);
        let mut path = [0u8; 64];
        let mut po = OutBuf::new(&mut path);
        po.bytes(adapter).map_err(|_| CodegenError::Output)?;
        po.str(".wasm").map_err(|_| CodegenError::Output)?;
        let pl = po.len();
        wasm_file[..pl].copy_from_slice(&path[..pl]);
        wasm_file_len = pl;
        store
            .add(&path[..pl], Role::WasmModule, &scratch[..n])
            .map_err(|_| CodegenError::Output)?;
    }
    // 2. membrane.js = core + one template per adapter used
    {
        let mut o = OutBuf::new(scratch);
        o.str(TEMPLATE_MEMBRANE).map_err(|_| CodegenError::Output)?;
        for a in adapters.iter() {
            let t = adapter_template(reg.name(a)).ok_or(CodegenError::UnknownAdapterTemplate)?;
            o.byte(b'\n').map_err(|_| CodegenError::Output)?;
            subst(t, &[("__WASM_FILE__", &wasm_file[..wasm_file_len])], &mut o)
                .map_err(|_| CodegenError::Output)?;
        }
        let n = o.len();
        store
            .add(b"membrane.js", Role::HostMembrane, &scratch[..n])
            .map_err(|_| CodegenError::Output)?;
    }
    // 3. selector.js with embedded strategy data
    {
        let mut data = [0u8; 8192];
        let mut d = OutBuf::new(&mut data);
        strategy_data_json(m, reg, hg, vs, &mut d).map_err(|_| CodegenError::Output)?;
        let dn = d.len();
        let mut o = OutBuf::new(scratch);
        subst(
            TEMPLATE_SELECTOR,
            &[("__STRATEGY_JSON__", &data[..dn])],
            &mut o,
        )
        .map_err(|_| CodegenError::Output)?;
        let n = o.len();
        store
            .add(b"selector.js", Role::RuntimeSelector, &scratch[..n])
            .map_err(|_| CodegenError::Output)?;
    }
    // 4. runtime.js
    store
        .add(
            b"runtime.js",
            Role::RuntimeEvidence,
            TEMPLATE_RUNTIME.as_bytes(),
        )
        .map_err(|_| CodegenError::Output)?;
    // 5. bundle id = sha256 over the sha256s of the files so far + lineage (computed before shell so the shell can
    //    display it; the manifest below records everything)
    let bundle_id = store.identity(lineage.source_sha256);
    let mut bid_hex = [0u8; 64];
    factc_foundation::hex::encode_into(&bundle_id, &mut bid_hex);
    let short_bid = &bid_hex[..16];
    // 6. shell, manifest, service worker
    let title = lineage.system_name;
    let mut sid = [0u8; 20];
    let mut so = OutBuf::new(&mut sid);
    so.u64(vs.strategy_id as u64)
        .map_err(|_| CodegenError::Output)?;
    let sl = so.len();
    {
        let mut o = OutBuf::new(scratch);
        subst(
            TEMPLATE_INDEX,
            &[
                ("__TITLE__", title),
                ("__BUNDLE_ID__", short_bid),
                ("__STRATEGY_ID__", &sid[..sl]),
            ],
            &mut o,
        )
        .map_err(|_| CodegenError::Output)?;
        let n = o.len();
        store
            .add(b"index.html", Role::Shell, &scratch[..n])
            .map_err(|_| CodegenError::Output)?;
    }
    {
        let mut o = OutBuf::new(scratch);
        subst(
            TEMPLATE_MANIFEST,
            &[
                ("__TITLE__", title),
                ("__SHORT__", title),
                ("__BUNDLE_ID__", short_bid),
            ],
            &mut o,
        )
        .map_err(|_| CodegenError::Output)?;
        let n = o.len();
        store
            .add(b"manifest.webmanifest", Role::Manifest, &scratch[..n])
            .map_err(|_| CodegenError::Output)?;
    }
    {
        // shell file list = every file emitted so far plus the sw itself's siblings
        let mut list = [0u8; 512];
        let mut lo = OutBuf::new(&mut list);
        lo.byte(b'[').map_err(|_| CodegenError::Output)?;
        let mut first = true;
        for f in store.files.iter() {
            if !first {
                lo.byte(b',').map_err(|_| CodegenError::Output)?;
            }
            first = false;
            lo.str("'./").map_err(|_| CodegenError::Output)?;
            lo.bytes(f.path()).map_err(|_| CodegenError::Output)?;
            lo.byte(b'\'').map_err(|_| CodegenError::Output)?;
        }
        lo.byte(b']').map_err(|_| CodegenError::Output)?;
        let ln = lo.len();
        let mut o = OutBuf::new(scratch);
        subst(
            TEMPLATE_SW,
            &[
                ("__BUNDLE_ID__", short_bid),
                ("__SHELL_FILES__", &list[..ln]),
            ],
            &mut o,
        )
        .map_err(|_| CodegenError::Output)?;
        let n = o.len();
        store
            .add(b"sw.js", Role::ServiceWorker, &scratch[..n])
            .map_err(|_| CodegenError::Output)?;
    }
    // 7. bundle.json manifest (lineage + inventories)
    {
        let mut o = OutBuf::new(scratch);
        manifest_json(m, reg, hg, vs, lineage, store, &bundle_id, &mut o)
            .map_err(|_| CodegenError::Output)?;
        let n = o.len();
        store
            .add(b"bundle.json", Role::Metadata, &scratch[..n])
            .map_err(|_| CodegenError::Output)?;
    }
    store.bundle_id = bundle_id;
    Ok(())
}

#[allow(clippy::too_many_arguments)]
fn manifest_json(
    m: &Model,
    reg: &Registry,
    hg: &Hypergraph,
    vs: &VerifiedStrategy,
    lineage: &Lineage<'_>,
    store: &BundleStore,
    bundle_id: &[u8; 32],
    out: &mut OutBuf<'_>,
) -> Result<(), OutputTooSmall> {
    let mut w = JsonW::new(out);
    w.obj_begin()?;
    w.kv_str("kind", b"GENERATED_BUNDLE")?;
    w.kv_uint("schema_version", 1)?;
    w.kv_hex("bundle_id", bundle_id)?;
    w.key("source_lineage")?;
    w.obj()?;
    w.kv_str("system", lineage.system_name)?;
    w.kv_hex("source_sha256", lineage.source_sha256)?;
    w.kv_hex("canonical_ascii_sha256", lineage.canonical_sha256)?;
    w.kv_hex("typed_ir_sha256", lineage.typed_ir_sha256)?;
    w.obj_end()?;
    w.kv_uint("verified_strategy_id", vs.strategy_id as u64)?;
    w.kv_uint("strategy_certificate_id", vs.strategy_certificate_id as u64)?;
    w.kv_str(
        "machine_epoch_assumption",
        b"adaptive: none (runtime selects among preverified variants)",
    )?;
    w.kv_str(
        "wasm_target",
        b"wasm64-unknown-unknown (memory address type i64)",
    )?;
    w.kv_str("runtime_selector_artifact", b"selector.js")?;
    w.key("variant_inventory")?;
    w.arr()?;
    for v in vs.variants.iter() {
        w.obj()?;
        w.kv_uint("plan_id", v.plan.plan_id as u64)?;
        w.kv_uint("proof_certificate_id", v.certificate_id as u64)?;
        w.key("guard")?;
        w.arr()?;
        for b in v.plan.guard.iter() {
            w.str(reg.name(b))?;
        }
        w.arr_end()?;
        w.key("recipes")?;
        w.arr()?;
        for b in v.plan.guard.iter() {
            if let Some(bi) = reg.find_backend(reg.name(b)) {
                if let Some(r) = reg.backends[bi as usize].recipe {
                    w.str(reg.name(r))?;
                }
            }
        }
        w.arr_end()?;
        w.key("adapters")?;
        w.arr()?;
        for b in v.plan.guard.iter() {
            if let Some(a) = adapter_of_backend(reg, b) {
                w.str(reg.name(a))?;
            }
        }
        w.arr_end()?;
        w.key("conversions")?;
        w.arr()?;
        for e in v.plan.edges.iter().take(v.plan.nreq as usize).flatten() {
            if let Some(edge) = hg.edges.iter().find(|x| x.id == *e) {
                for ci in edge.steps() {
                    w.str(reg.name(reg.conversions[ci as usize].name))?;
                }
            }
        }
        w.arr_end()?;
        w.obj_end()?;
    }
    w.arr_end()?;
    w.key("adapter_inventory")?;
    w.arr()?;
    if let Ok(ads) = recipes_used(reg, vs) {
        for a in ads.iter() {
            w.str(reg.name(a))?;
        }
    }
    w.arr_end()?;
    w.key("artifact_roles")?;
    w.arr()?;
    for f in store.files.iter() {
        w.obj()?;
        w.kv_str("path", f.path())?;
        w.kv_str("role", f.role.name().as_bytes())?;
        w.kv_hex("sha256", &f.sha256)?;
        w.kv_uint("byte_len", f.len as u64)?;
        w.obj_end()?;
    }
    w.arr_end()?;
    w.key("import_export_inventory")?;
    w.arr()?;
    for f in store.files.iter().filter(|f| f.role == Role::WasmModule) {
        let bytes = store.bytes(f);
        w.obj()?;
        w.kv_str("path", f.path())?;
        if let Ok(info) = factc_foundation::wasm::read(bytes) {
            w.key("imports")?;
            w.arr()?;
            for i in info.imports.iter() {
                w.str(&bytes[i.name.0 as usize..(i.name.0 + i.name.1) as usize])?;
            }
            w.arr_end()?;
            w.key("exports")?;
            w.arr()?;
            for e in info.exports.iter() {
                w.str(&bytes[e.name.0 as usize..(e.name.0 + e.name.1) as usize])?;
            }
            w.arr_end()?;
            w.kv_bool("memory64", info.all_memories_i64())?;
        }
        w.obj_end()?;
    }
    w.arr_end()?;
    w.key("evidence_hooks")?;
    w.arr()?;
    for h in ["admission", "activation", "executed", "loss", "transition"] {
        w.str(h.as_bytes())?;
    }
    w.arr_end()?;
    w.kv_str("evidence_tape_dialect", b"@{epoch|admission|activation|executed|loss|transition|no_active_plan ...} islands (see runtime.js)")?;
    let _ = m;
    w.obj_end()
}
