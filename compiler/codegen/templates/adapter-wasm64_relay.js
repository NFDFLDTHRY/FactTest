/*ADAPTER-BEGIN:wasm64_relay*/
// Backend CPU_WASM64.  Representation path HOST_BYTES -> WASM_LINEAR_BYTES -> HOST_BYTES.
// Authority: https://webassembly.github.io/spec/js-api/#memories (i64 address type), wasm64 target.
adapters['wasm64_relay'] = {
  backend: 'CPU_WASM64', kind: 'wasm64', instance: null, state: 'UNAVAILABLE', lossHandlers: [],
  async discover() {
    if (typeof WebAssembly === 'undefined') return { result: Result.UNAVAILABLE, detail: 'no WebAssembly' };
    // Memory64 support probe: a minimal module declaring an i64-addressed memory must validate.
    const m64 = new Uint8Array([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0, 5, 3, 1, 0x04, 1]);
    if (!WebAssembly.validate(m64)) return { result: Result.UNSUPPORTED, detail: 'memory64 not supported by this host' };
    this.state = 'DISCOVERED';
    return { result: Result.OK, detail: 'WebAssembly + memory64 present' };
  },
  async request() {
    try {
      const resp = await fetch('__WASM_FILE__');
      if (!resp.ok) return { result: Result.UNAVAILABLE, detail: 'module fetch failed: ' + resp.status };
      const bytes = new Uint8Array(await resp.arrayBuffer());
      const module = await WebAssembly.compile(bytes);
      const imports = WebAssembly.Module.imports(module);
      if (imports.length !== 0) return { result: Result.INVALID, detail: 'module declares imports' };
      this.instance = await WebAssembly.instantiate(module, {});
      this.exports = this.instance.exports;
      this.regionIn = this.exports.region_in(); this.regionOut = this.exports.region_out(); this.capacity = this.exports.region_capacity();
      this.moduleSha = await sha256hex(bytes);
      this.state = 'READY';
      return { result: Result.OK, detail: 'instantiated; abi_version ' + this.exports.abi_version() + '; module sha256 ' + this.moduleSha };
    } catch (e) { this.state = 'UNAVAILABLE'; return { result: Result.INTERNAL_FAILURE, detail: String(e) }; }
  },
  async probe() {
    // known-answer roundtrip through linear memory (not the fixture payload)
    const pat = probePattern(256);
    const out = await this.operate(pat);
    if (out.result !== Result.OK) return out;
    const ok = bytesEqual(out.bytes, pat);
    return { result: ok ? Result.OK : Result.INVALID, detail: ok ? 'wasm64_known_answer roundtrip exact (256 bytes)' : 'known-answer mismatch', probe: 'wasm64_known_answer' };
  },
  async operate(bytes) {
    if (this.state !== 'READY' && this.state !== 'ACTIVE') return { result: Result.UNAVAILABLE, detail: 'not ready' };
    if (BigInt(bytes.length) > this.capacity) return { result: Result.RESOURCE_EXHAUSTED, detail: 'payload exceeds region capacity' };
    try {
      this.state = 'ACTIVE';
      const mem = this.exports.memory;
      // HOST_BYTES -> WASM_LINEAR_BYTES (conversion host_to_wasm, mode copy)
      new Uint8Array(mem.buffer, Number(this.regionIn), bytes.length).set(bytes);
      // semantic copy inside wasm64 linear memory (i64 addresses)
      this.exports.copy_bytes(this.regionIn, this.regionOut, BigInt(bytes.length));
      // WASM_LINEAR_BYTES -> HOST_BYTES (conversion wasm_to_host, mode copy)
      const out = new Uint8Array(bytes.length);
      out.set(new Uint8Array(mem.buffer, Number(this.regionOut), bytes.length));
      this.state = 'READY';
      return { result: Result.OK, bytes: out };
    } catch (e) { return { result: Result.INTERNAL_FAILURE, detail: String(e) }; }
  },
  observe(onLoss) { this.lossHandlers.push(onLoss); },
  async release() { this.instance = null; this.exports = null; this.state = 'CLOSED'; for (const h of this.lossHandlers) h({ backend: 'CPU_WASM64', reason: 'released' }); return { result: Result.OK }; },
};
/*ADAPTER-END:wasm64_relay*/
