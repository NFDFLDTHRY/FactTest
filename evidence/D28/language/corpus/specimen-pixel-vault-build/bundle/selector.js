// FactTest generated runtime selector (RUNTIME-ADMISSION-REPLAN.md Pass 6 amendment).
// STRATEGY is the VerifiedStrategy as data; select() evaluates activation guards over admissions in dispatch
// order and can only ever name a plan_id that appears in STRATEGY.variants.  Nothing here generates code.
export const STRATEGY = /*STRATEGY-BEGIN*/{"strategy_id":1,"strategy_certificate_id":1000,"transfers":[{"relation":"stash","type":"Tile","mode":"copy"}],"goals":[],"dispatch_order":[0],"variants":[{"plan_id":0,"certificate_id":1,"guard":["WEBGPU"],"adapters":["webgpu_relay"],"conversions":["tile_up","tile_down"],"requirements":[{"relation":"stash","backends":["WEBGPU"],"adapters":["webgpu_relay"],"conversions":["tile_up","tile_down"]}]}]}/*STRATEGY-END*/;
// sha256 of the strategy data above, as the compiler rendered it: every evidence tape of this bundle names it
export const STRATEGY_SHA256 = 'dfdceb5aab517ceb2954c015157a272e8a0bf023a7b8dea328dc1149d7e9207b';
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
