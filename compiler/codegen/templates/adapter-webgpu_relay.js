/*ADAPTER-BEGIN:webgpu_relay*/
// Backend WEBGPU.  Representation path HOST_BYTES -> GPU_BUFFER_BYTES -> HOST_BYTES.
// Authority: requestAdapter https://gpuweb.github.io/gpuweb/#dom-gpu-requestadapter ;
// requestDevice https://gpuweb.github.io/gpuweb/#dom-gpuadapter-requestdevice ;
// lost https://gpuweb.github.io/gpuweb/#dom-gpudevice-lost ; destroy https://gpuweb.github.io/gpuweb/#dom-gpudevice-destroy
adapters['webgpu_relay'] = {
  backend: 'WEBGPU', kind: 'webgpu', device: null, state: 'UNAVAILABLE', lossHandlers: [], info: null,
  async discover() {
    if (!('gpu' in navigator)) return { result: Result.UNAVAILABLE, detail: 'navigator.gpu absent (WebGPU not exposed; requires a secure context)' };
    this.state = 'DISCOVERED';
    return { result: Result.OK, detail: 'navigator.gpu present' };
  },
  async request() {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) return { result: Result.UNAVAILABLE, detail: 'requestAdapter returned null' };
      this.info = adapter.info ? { vendor: adapter.info.vendor, architecture: adapter.info.architecture, device: adapter.info.device, description: adapter.info.description } : null;
      this.state = 'REQUESTING';
      const device = await adapter.requestDevice();
      this.device = device;
      this.lost = device.lost.then(info => { this.state = 'LOST'; for (const h of this.lossHandlers) h({ backend: 'WEBGPU', reason: info.reason, message: info.message }); return info; });
      this.state = 'READY';
      return { result: Result.OK, detail: 'device acquired; adapter ' + JSON.stringify(this.info) + '; maxBufferSize ' + adapter.limits.maxBufferSize, info: this.info };
    } catch (e) { this.state = 'UNAVAILABLE'; return { result: Result.INTERNAL_FAILURE, detail: String(e) }; }
  },
  async probe() {
    const pat = probePattern(256);
    const out = await this.operate(pat);
    if (out.result !== Result.OK) return out;
    const ok = bytesEqual(out.bytes, pat);
    return { result: ok ? Result.OK : Result.INVALID, detail: ok ? 'webgpu_known_answer buffer upload/copy/readback exact (256 bytes)' : 'known-answer mismatch', probe: 'webgpu_known_answer' };
  },
  async operate(bytes) {
    if (this.state !== 'READY' && this.state !== 'ACTIVE') return { result: this.state === 'LOST' ? Result.LOST : Result.UNAVAILABLE, detail: 'device state ' + this.state };
    try {
      this.state = 'ACTIVE';
      const size = Math.max(4, Math.ceil(bytes.length / 4) * 4);
      // HOST_BYTES -> GPU_BUFFER_BYTES (conversion host_to_gpu, mode copy)
      const src = this.device.createBuffer({ size, usage: GPUBufferUsage.COPY_SRC, mappedAtCreation: true });
      new Uint8Array(src.getMappedRange()).set(bytes);
      src.unmap();
      const dst = this.device.createBuffer({ size, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
      const enc = this.device.createCommandEncoder();
      enc.copyBufferToBuffer(src, 0, dst, 0, size);
      this.device.queue.submit([enc.finish()]);
      // GPU_BUFFER_BYTES -> HOST_BYTES (conversion gpu_to_host, mode copy)
      await dst.mapAsync(GPUMapMode.READ);
      const out = new Uint8Array(bytes.length);
      out.set(new Uint8Array(dst.getMappedRange()).subarray(0, bytes.length));
      dst.unmap(); src.destroy(); dst.destroy();
      if (this.state === 'ACTIVE') this.state = 'READY';
      return { result: Result.OK, bytes: out };
    } catch (e) { return { result: this.state === 'LOST' ? Result.LOST : Result.INTERNAL_FAILURE, detail: String(e) }; }
  },
  observe(onLoss) { this.lossHandlers.push(onLoss); },
  async release() {
    // Controlled loss: GPUDevice.destroy() -> device.lost resolves with reason "destroyed".
    if (!this.device) return { result: Result.UNAVAILABLE, detail: 'no device' };
    this.device.destroy();
    const info = await this.lost;
    return { result: Result.OK, detail: 'destroy() invoked; lost reason ' + info.reason };
  },
};
/*ADAPTER-END:webgpu_relay*/
