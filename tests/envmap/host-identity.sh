#!/bin/sh
# D11 host identity probe: records the computational environment of THIS host as an ENVIRONMENT record (never a pin).
# Usage: host-identity.sh <out.json>.  Uses sh + node + rustup/rustc/cargo/git (whatever is present; absence is recorded).
OUT="$1"; mkdir -p "$(dirname "$OUT")"; T=$(mktemp -d)
cap() { name="$1"; shift; ( "$@" ) > "$T/$name" 2>&1; echo "$?" > "$T/$name.exit"; }
cap rustc_stable rustc +stable -vV
cap cargo_stable cargo +stable -vV
cap rustc_nightly rustc +nightly -vV
cap cargo_nightly cargo +nightly -vV
cap rustup_active rustup show active-toolchain
cap nightly_components rustup component list --installed --toolchain nightly
cap nightly_clippy cargo +nightly clippy --version
cap node_versions node -p 'JSON.stringify(process.versions)'
cap os_release cat /etc/os-release
cap uname uname -srmo
cap nproc nproc
cap cpu sh -c "grep -m1 'model name' /proc/cpuinfo"
cap mem sh -c "grep MemTotal /proc/meminfo"
cap dri sh -c "ls /dev/dri"
cap git git --version
cap playwright node -p 'JSON.stringify(JSON.parse(require("fs").readFileSync("/opt/node22/lib/node_modules/playwright/node_modules/playwright-core/browsers.json","utf8")).browsers.filter(b=>b.name.startsWith("chromium")).map(b=>({name:b.name,revision:b.revision,browserVersion:b.browserVersion})))'
cap playwright_version node -p 'JSON.parse(require("fs").readFileSync("/opt/node22/lib/node_modules/playwright/package.json","utf8")).version'
cap toolchain_file sh -c "test -f rust-toolchain.toml && cat rust-toolchain.toml || echo ABSENT"
cap proxy_status sh -c 'curl -sS --max-time 10 "$HTTPS_PROXY/__agentproxy/status" | node -e "let s=\"\";process.stdin.on(\"data\",d=>s+=d).on(\"end\",()=>{try{const j=JSON.parse(s);console.log(JSON.stringify({enabled:j.enabled,denied_hosts:[...new Set((j.recentRelayFailures||[]).filter(f=>/403/.test(f.detail)).map(f=>f.host))].sort()}))}catch(e){console.log(\"{}\")}})"'
node -e '
const fs=require("fs"),T=process.argv[1],out=process.argv[2];
const rd=n=>({exit:Number(fs.readFileSync(T+"/"+n+".exit","utf8").trim()),text:fs.readFileSync(T+"/"+n,"utf8").trim()});
const pick=(t,k)=>(t.match(new RegExp("^"+k+": (.*)$","m"))||[])[1]||null;
const tc=n=>{const r=rd(n);return r.exit===0?{line:r.text.split("\n")[0],commit:pick(r.text,"commit-hash"),date:pick(r.text,"commit-date"),release:pick(r.text,"release"),host:pick(r.text,"host"),llvm:pick(r.text,"LLVM version")}:{absent:true,error:r.text.split("\n")[0]}};
const j=n=>{const r=rd(n);try{return JSON.parse(r.text)}catch{return {raw:r.text}}};
const rec={tool:"tests/envmap/host-identity.sh",observed:new Date().toISOString(),environment_class:"PHYSICAL_HOST",
 toolchain:{stable:{rustc:tc("rustc_stable"),cargo:tc("cargo_stable")},nightly:{rustc:tc("rustc_nightly"),cargo:tc("cargo_nightly"),components:rd("nightly_components").text.split("\n").filter(Boolean),clippy:rd("nightly_clippy").exit===0?rd("nightly_clippy").text:"ABSENT: "+rd("nightly_clippy").text.split("\n")[0]},active:rd("rustup_active").text,repository_pin:rd("toolchain_file").text==="ABSENT"?"ABSENT":"PRESENT: "+rd("toolchain_file").text},
 host_runtime:{node:j("node_versions"),git:rd("git").text,playwright:{version:rd("playwright_version").text,chromium:j("playwright")}},
 os:{release:rd("os_release").text.split("\n").filter(l=>/^(PRETTY_NAME|VERSION_ID)=/.test(l)).join(" "),uname:rd("uname").text},
 hardware:{logical_cpus:Number(rd("nproc").text),cpu:rd("cpu").text.replace(/.*:\s*/,""),memory:rd("mem").text.replace(/\s+/g," "),gpu_device_node:rd("dri").exit===0?rd("dri").text:"ABSENT (no /dev/dri)"},
 network_egress:j("proxy_status")};
fs.mkdirSync(require("path").dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(rec,null,2)+"\n");
console.log("host identity ->",out,"nightly",rec.toolchain.nightly.rustc.line||rec.toolchain.nightly.rustc.error,"clippy",rec.toolchain.nightly.clippy.split(":")[0]);
' "$T" "$OUT"
rm -rf "$T"
