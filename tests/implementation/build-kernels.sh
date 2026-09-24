#!/bin/sh
# D17 kernel builds under two rustup install names of ONE toolchain (design/materialization/
# D17-INTENDED-IMPLEMENTATION-REALITY.md section 4).  Usage: sh tests/implementation/build-kernels.sh <out dir> <work dir>
#   A  cargo +<pinned> (the WASM64_KERNEL_SET pin from tests/toolchain/proof-sets.json, its own install path)
#   B  the same toolchain directory bind-mounted over <second name>'s path inside a PRIVATE mount namespace (unshare -m):
#      nothing on disk changes; outside the namespace <second name> keeps its own toolchain
# then compares the two release kernels section by section (tests/implementation/wasm-sections.mjs).
set -e
OUT=$1; WORK=$2; mkdir -p "$OUT" "$WORK"
PIN=$(node -e 'const s=JSON.parse(require("fs").readFileSync("tests/toolchain/proof-sets.json"));console.log(s.sets.WASM64_KERNEL_SET.toolchain)')
SECOND=nightly
TC=$HOME/.rustup/toolchains; HOST=x86_64-unknown-linux-gnu
FLAGS="-C link-arg=-zstack-size=16777216"
build() { RUSTFLAGS="$FLAGS" CARGO_TARGET_DIR="$WORK/$2" cargo "+$1" build -q --release -p factc-wasm-abi -Z build-std=core --target wasm64-unknown-unknown; }
rm -rf "$WORK/A" "$WORK/B"
build "$PIN" A
unshare -m sh -c "mount --bind '$TC/$PIN-$HOST' '$TC/$SECOND-$HOST' && RUSTFLAGS='$FLAGS' CARGO_TARGET_DIR='$WORK/B' cargo +$SECOND build -q --release -p factc-wasm-abi -Z build-std=core --target wasm64-unknown-unknown && rustc +$SECOND -vV | grep commit-hash > '$WORK/B.rustc'"
KA=$WORK/A/wasm64-unknown-unknown/release/factc_wasm_abi.wasm; KB=$WORK/B/wasm64-unknown-unknown/release/factc_wasm_abi.wasm
node -e '
const fs=require("fs"),cp=require("child_process"),crypto=require("crypto");const [pin,second,tc,host,flags,ka,kb,bRustc,out]=process.argv.slice(1);
const v=(c)=>cp.execSync(c,{encoding:"utf8"}).trim();const rc=v("rustc +"+pin+" -vV");const f=(re)=>(rc.match(re)||[])[1];
const sha=p=>crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const r={tool:"tests/implementation/build-kernels.sh",rustc:f(/commit-hash: (\S+)/),llvm:f(/LLVM version: (\S+)/),cargo:v("cargo +"+pin+" -V"),host:v("uname -srm"),rustflags:flags,
 builds:[{label:"INSTALL-PINNED",toolchain:pin,install_name:pin,install_path:tc+"/"+pin+"-"+host,rustc_commit:f(/commit-hash: (\S+)/),wasm_sha256:sha(ka),bytes:fs.statSync(ka).size},
         {label:"INSTALL-RENAMED",toolchain:pin,install_name:second,install_path:tc+"/"+second+"-"+host+" (bind mount of "+pin+" in a private namespace)",rustc_commit:(fs.readFileSync(bRustc,"utf8").match(/commit-hash: (\S+)/)||[])[1],wasm_sha256:sha(kb),bytes:fs.statSync(kb).size}]};
if(r.builds[1].rustc_commit!==r.rustc)throw new Error("renamed build did not use the pinned toolchain");
fs.writeFileSync(out,JSON.stringify(r,null,1)+"\n");console.log(JSON.stringify(r.builds.map(b=>b.label+" "+b.wasm_sha256.slice(0,16))))' "$PIN" "$SECOND" "$TC" "$HOST" "$FLAGS" "$KA" "$KB" "$WORK/B.rustc" "$OUT/builds.json"
node tests/implementation/wasm-sections.mjs --label "INSTALL-PINNED=$KA" --label "INSTALL-RENAMED=$KB" --exclude-custom name --out "$OUT/sections.json"
