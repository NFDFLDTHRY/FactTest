// FactTest generated runtime selector (RUNTIME-ADMISSION-REPLAN.md Pass 6 amendment).
// STRATEGY is the VerifiedStrategy as data; select() evaluates activation guards over admissions in dispatch
// order and can only ever name a plan_id that appears in STRATEGY.variants.  Nothing here generates code.
export const STRATEGY = /*STRATEGY-BEGIN*/{"strategy_id":1,"strategy_certificate_id":1000,"transfers":[{"relation":"relay","type":"Bytes","mode":"copy"}],"goals":[{"metric":"preference_rank","direction":"minimize"}],"dispatch_order":[1,0],"variants":[{"plan_id":0,"certificate_id":1,"guard":["CPU_WASM64"],"adapters":["wasm64_relay"],"conversions":["host_to_wasm","wasm_to_host"],"requirements":[{"relation":"relay","backends":["CPU_WASM64"],"adapters":["wasm64_relay"],"conversions":["host_to_wasm","wasm_to_host"]}]},{"plan_id":1,"certificate_id":2,"guard":["WEBGPU"],"adapters":["webgpu_relay"],"conversions":["host_to_gpu","gpu_to_host"],"requirements":[{"relation":"relay","backends":["WEBGPU"],"adapters":["webgpu_relay"],"conversions":["host_to_gpu","gpu_to_host"]}]}]}/*STRATEGY-END*/;
// sha256 of the strategy data above, as the compiler rendered it: every evidence tape of this bundle names it
export const STRATEGY_SHA256 = '46a712089c3077d5924ec725affb2d6293a24a9c034b4704a224b2fd705a0b38';
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
