#!/bin/sh
# Rust-build boundary census (D27; design/foundation-closure/FOUNDATION-CLOSURE-TARGET.md section 8).
# Usage: sh tests/closure/rust-build-census.sh <out.json>
# Records, from the host that builds the current kernel, what an in-browser RUST_BUILD would have to reproduce: the
# pinned toolchains and their on-disk size (compiler driver, LLVM, rust-src), installed targets and codegen backends,
# the wasm targets rustc knows, and the size and shape of the first-party source the Factory must be able to rebuild
# (crates, lines, no_std and forbid(unsafe_code) census, the pinned kernel identity).  Observation only.
set -e
OUT="$1"; [ -n "$OUT" ] || { echo "usage: $0 <out.json>"; exit 2; }
mkdir -p "$(dirname "$OUT")"
PIN=$(node -e 'const p=JSON.parse(require("fs").readFileSync("tests/toolchain/proof-sets.json"));process.stdout.write(JSON.stringify({host:p.sets.HOST_NATIVE_SET.toolchain||p.sets.HOST_NATIVE_SET,wasm:p.sets.WASM64_KERNEL_SET.toolchain||{},kernel:p.sets.WASM64_KERNEL_SET.kernel_identity.exec_identity}))')
TC=""
for t in $(rustup toolchain list | awk '{print $1}'); do
  d="$HOME/.rustup/toolchains/$t"; [ -d "$d" ] || continue
  mb=$(du -sm "$d" | cut -f1)
  drv=$(du -sm "$d"/lib/librustc_driver-*.so 2>/dev/null | cut -f1 | head -1)
  llvm=$(du -sm "$d"/lib/libLLVM.so* 2>/dev/null | sort -n | tail -1 | cut -f1)
  src=$(du -sm "$d/lib/rustlib/src" 2>/dev/null | cut -f1)
  ver=$("$d/bin/rustc" -vV 2>/dev/null | tr '\n' ';')
  tg=$(ls "$d/lib/rustlib" | grep -v -E '^(components|etc|manifest-|multirust|rust-installer|src)' | tr '\n' ',')
  be=$(ls "$d/lib/rustlib/x86_64-unknown-linux-gnu/codegen-backends" 2>/dev/null | tr '\n' ',')
  TC="$TC{\"name\":\"$t\",\"megabytes\":${mb:-0},\"rustc_driver_mb\":${drv:-0},\"llvm_mb\":${llvm:-0},\"rust_src_mb\":${src:-0},\"targets\":\"$tg\",\"codegen_backends\":\"${be:-none}\",\"rustc\":\"$ver\"},"
done
WASM=$(rustc --print target-list 2>/dev/null | grep -c wasm || echo 0)
WASML=$(rustc --print target-list 2>/dev/null | grep wasm | tr '\n' ',')
CR=$(find compiler -name Cargo.toml | wc -l); FL=$(find factory -name Cargo.toml | wc -l); HL=$(find host -name Cargo.toml | wc -l)
LC=$(find compiler -name '*.rs' | xargs cat | wc -l); LF=$(find factory -name '*.rs' | xargs cat | wc -l); LH=$(find host -name '*.rs' | xargs cat | wc -l)
NS=$(grep -rl '^#!\[no_std\]' compiler --include=lib.rs | wc -l); FU=$(grep -rl 'forbid(unsafe_code)' compiler --include=*.rs | wc -l); UN=$(grep -rn '\bunsafe\b' compiler --include=*.rs | grep -v 'forbid(unsafe_code)' | wc -l)
CORE=$(du -sm "$HOME/.rustup/toolchains/nightly-2026-09-24-x86_64-unknown-linux-gnu/lib/rustlib/src/rust/library/core" 2>/dev/null | cut -f1)
TPL=$(grep -c 'include_str!' compiler/codegen/src/lib.rs || echo 0)
printf '{"tool":"tests/closure/rust-build-census.sh","pins":%s,"toolchains":[%s],"rustc_wasm_targets":{"count":%s,"list":"%s"},"first_party":{"crates":{"compiler":%s,"factory":%s,"host":%s},"rust_lines":{"compiler":%s,"factory":%s,"host":%s},"no_std_crates":%s,"forbid_unsafe_crates":%s,"unsafe_occurrences_outside_forbid":%s,"templates_include_str":%s},"core_source_mb":%s,"host":{"os":"%s","arch":"%s"}}\n' \
  "$PIN" "${TC%,}" "$WASM" "${WASML%,}" "$CR" "$FL" "$HL" "$LC" "$LF" "$LH" "$NS" "$FU" "$UN" "$TPL" "${CORE:-0}" "$(uname -s)" "$(uname -m)" > "$OUT"
node -e 'JSON.parse(require("fs").readFileSync(process.argv[1]))' "$OUT"
echo "rust-build census: toolchains $(rustup toolchain list | wc -l), first-party rust lines compiler $LC factory $LF host $LH, no_std crates $NS, wasm targets $WASM"
