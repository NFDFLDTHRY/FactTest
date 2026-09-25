// FactTest generated runtime selector (RUNTIME-ADMISSION-REPLAN.md Pass 6 amendment).
// STRATEGY is the VerifiedStrategy as data; select() evaluates activation guards over admissions in dispatch
// order and can only ever name a plan_id that appears in STRATEGY.variants.  Nothing here generates code.
export const STRATEGY = /*STRATEGY-BEGIN*/{"strategy_id":1,"strategy_certificate_id":1000,"transfers":[{"relation":"feed","type":"Chunk","mode":"copy"},{"relation":"drain","type":"Chunk","mode":"copy"}],"goals":[{"metric":"preference_rank","direction":"maximize"}],"dispatch_order":[0,1,2,3],"variants":[{"plan_id":0,"certificate_id":1,"guard":["CPU_WASM64"],"adapters":["wasm64_relay"],"conversions":["chunk_to_wasm","chunk_from_wasm","chunk_to_wasm","chunk_from_wasm"],"requirements":[{"relation":"feed","backends":["CPU_WASM64"],"adapters":["wasm64_relay"],"conversions":["chunk_to_wasm","chunk_from_wasm"]},{"relation":"drain","backends":["CPU_WASM64"],"adapters":["wasm64_relay"],"conversions":["chunk_to_wasm","chunk_from_wasm"]}]},{"plan_id":1,"certificate_id":2,"guard":["WEBGPU","CPU_WASM64"],"adapters":["webgpu_relay","wasm64_relay"],"conversions":["chunk_to_gpu","chunk_from_gpu","chunk_to_wasm","chunk_from_wasm"],"requirements":[{"relation":"feed","backends":["WEBGPU"],"adapters":["webgpu_relay"],"conversions":["chunk_to_gpu","chunk_from_gpu"]},{"relation":"drain","backends":["CPU_WASM64"],"adapters":["wasm64_relay"],"conversions":["chunk_to_wasm","chunk_from_wasm"]}]},{"plan_id":2,"certificate_id":3,"guard":["CPU_WASM64","WEBGPU"],"adapters":["wasm64_relay","webgpu_relay"],"conversions":["chunk_to_wasm","chunk_from_wasm","chunk_to_gpu","chunk_from_gpu"],"requirements":[{"relation":"feed","backends":["CPU_WASM64"],"adapters":["wasm64_relay"],"conversions":["chunk_to_wasm","chunk_from_wasm"]},{"relation":"drain","backends":["WEBGPU"],"adapters":["webgpu_relay"],"conversions":["chunk_to_gpu","chunk_from_gpu"]}]},{"plan_id":3,"certificate_id":4,"guard":["WEBGPU"],"adapters":["webgpu_relay"],"conversions":["chunk_to_gpu","chunk_from_gpu","chunk_to_gpu","chunk_from_gpu"],"requirements":[{"relation":"feed","backends":["WEBGPU"],"adapters":["webgpu_relay"],"conversions":["chunk_to_gpu","chunk_from_gpu"]},{"relation":"drain","backends":["WEBGPU"],"adapters":["webgpu_relay"],"conversions":["chunk_to_gpu","chunk_from_gpu"]}]}]}/*STRATEGY-END*/;
// sha256 of the strategy data above, as the compiler rendered it: every evidence tape of this bundle names it
export const STRATEGY_SHA256 = '2292e2eef2dca72ccfd02bc2dc49c6dcf0dfee45f18de517bb63a6c18cdf2790';
export function select(admissions) {
  const guardResults = [];
  let chosen = null;
  for (const pid of STRATEGY.dispatch_order) {
    const v = STRATEGY.variants.find(x => x.plan_id === pid);
    const satisfied = v.guard.every(b => admissions[b] && admissions[b].decision === 'ADMITTED');
    guardResults.push({ plan_id: pid, guard: v.guard, satisfied });
    if (satisfied && chosen === null) chosen = v;
  }
  return { strategy_id: STRATEGY.strategy_id, plan_id: chosen ? chosen.plan_id : null, variant: chosen, status: chosen ? 'PASS' : 'NO_ACTIVE_PLAN', guard_results: guardResults };
}
