// Bootstrap host harness for the wasm64 kernel ABI (BOOTSTRAP-TESTS B7, B8, B10, B11).
// Usage: node kernel-host.mjs <module.wasm> <source file> [--browser <chromium executable dir marker>]
// The harness supplies ONLY declared imports (none) and exchanges (address,len) pairs with i64 addresses.
import { readFileSync } from 'node:fs';

export async function driveKernel(WebAssemblyImpl, wasmBytes, sourceBytes, log) {
  const module = await WebAssemblyImpl.compile(wasmBytes);
  const imports = WebAssemblyImpl.Module.imports(module).map(i => `${i.module}.${i.name}:${i.kind}`);
  const exports = WebAssemblyImpl.Module.exports(module).map(e => `${e.name}:${e.kind}`);
  if (imports.length !== 0) throw new Error(`undeclared imports: ${imports.join(',')}`);
  const instance = await WebAssemblyImpl.instantiate(module, {});
  const ex = instance.exports;
  const mem = ex.memory;
  const abi = ex.query_abi_version();
  const ws = ex.query_required_workspace();
  const inPtr = ex.input_buffer_ptr();
  const inLen = ex.input_buffer_len();
  const outPtr = ex.output_buffer_ptr();
  if (sourceBytes.length > Number(inLen)) throw new Error('source larger than input buffer');
  new Uint8Array(mem.buffer, Number(inPtr), sourceBytes.length).set(sourceBytes);
  const sid = ex.submit_source_bytes(BigInt(sourceBytes.length));
  const status = ex.check_or_compile(0);
  const n = ex.read_diagnostics();
  const diagText = new TextDecoder().decode(new Uint8Array(mem.buffer, Number(outPtr), Number(n)));
  const diag = JSON.parse(diagText);
  return {
    abi_version: abi, required_workspace: ws.toString(), input_buffer_len: inLen.toString(),
    memory_pages: mem.buffer.byteLength / 65536, imports, exports, source_id_plus_one: sid,
    status, diagnostics: diag,
  };
}

const [, , wasmPath, srcPath, ...rest] = process.argv;
if (wasmPath) {
  const wasm = readFileSync(wasmPath);
  const src = readFileSync(srcPath);
  const wantBrowser = rest.includes('--browser');
  if (!wantBrowser) {
    const r = await driveKernel(WebAssembly, new Uint8Array(wasm), new Uint8Array(src));
    console.log(JSON.stringify({ host: `node ${process.version} v8 ${process.versions.v8}`, ...r }, null, 2));
  } else {
    const { chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs');
    const b = await chromium.launch({ headless: true });
    const p = await b.newPage();
    const fnSrc = driveKernel.toString();
    const r = await p.evaluate(async ([fn, wasmB64, srcB64]) => {
      const drive = new Function('return ' + fn)();
      const toBytes = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
      return await drive(WebAssembly, toBytes(wasmB64), toBytes(srcB64));
    }, [fnSrc, wasm.toString('base64'), src.toString('base64')]);
    const ua = await p.evaluate(() => navigator.userAgent);
    await b.close();
    console.log(JSON.stringify({ host: ua, ...r }, null, 2));
  }
}
