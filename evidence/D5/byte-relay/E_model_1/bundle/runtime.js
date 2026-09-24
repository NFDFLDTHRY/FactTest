// FactTest generated runtime: machine epochs, admission, activation, execution, evidence (RUNTIME-ADMISSION-REPLAN.md).
// Runtime adaptation = reselection inside the finite VerifiedStrategy.  No code generation happens here.
import { adapters, Result, sha256hex, bytesEqual } from './membrane.js';
import { STRATEGY, select } from './selector.js';

const state = {
  epochIndex: -1, epochs: [], admissions: {}, activation: null, activePlan: null,
  evidence: [], tape: [], deltas: [], nextEvidenceId: 1, secureContext: typeof isSecureContext !== 'undefined' ? isSecureContext : null,
};
const epochId = () => 'E' + state.epochIndex;
function record(eventClass, subject, observation, expected, artifactRefs) {
  const rec = { evidence_id: 'RE-' + (state.nextEvidenceId++), epoch_id: epochId(), plan_id: state.activePlan ? state.activePlan.plan_id : null, event_class: eventClass, subject, observation, expected: expected === undefined ? null : expected, monotonic_marker: performance.now(), artifact_refs: artifactRefs || [] };
  state.evidence.push(rec);
  return rec;
}
function island(text) { state.tape.push('@{' + text + '}'); }
function adapterFor(backend) { return Object.values(adapters).find(a => a.backend === backend) || null; }
function backendsNeeded() { const s = new Set(); for (const v of STRATEGY.variants) for (const b of v.guard) s.add(b); return [...s]; }

async function admit(backend) {
  /*EVIDENCE-HOOK:admission*/
  const a = adapterFor(backend);
  const probes = [];
  let decision = 'REJECTED', reason = null;
  if (!a) { reason = 'no_adapter_emitted'; }
  else {
    const d = await a.discover(); probes.push({ step: 'DISCOVER', ...d });
    if (d.result === Result.OK) {
      const r = await a.request(); probes.push({ step: 'REQUEST', ...r });
      if (r.result === Result.OK) {
        const p = await a.probe(); probes.push({ step: 'PROBE', ...p });
        if (p.result === Result.OK) decision = 'ADMITTED'; else reason = 'probe_' + p.result.toLowerCase();
      } else reason = 'request_' + r.result.toLowerCase();
    } else reason = 'discover_' + d.result.toLowerCase();
  }
  const evidenceName = probes.length && probes[probes.length - 1].probe ? probes[probes.length - 1].probe : (probes.length ? probes[probes.length - 1].step.toLowerCase() : 'none');
  const receipt = { receipt_id: 'ADM-' + epochId() + '-' + backend, epoch_id: epochId(), implementation_id: backend, decision, evaluated_requirements: probes, rejection_reason: reason, adapter_info: a && a.info ? a.info : null, status: decision };
  state.admissions[backend] = receipt;
  record('ADMISSION', backend, receipt, 'ADMITTED');
  island('admission ' + backend + ' ' + decision + ' evidence=' + evidenceName + (reason ? ' reason=' + reason : ''));
  return receipt;
}

function activate() {
  /*EVIDENCE-HOOK:activation*/
  const sel = select(state.admissions);
  state.activation = { epoch_id: epochId(), strategy_id: sel.strategy_id, plan_id: sel.plan_id, admission_refs: Object.values(state.admissions).map(r => r.receipt_id), metric_evidence_refs: ['fixture:preference_rank'], guard_result: sel.guard_results, status: sel.status };
  state.activePlan = sel.variant;
  record('ACTIVATION', 'selector', state.activation, 'PASS');
  island('activation ' + epochId() + ' plan=' + (sel.plan_id === null ? 'none' : sel.plan_id) + ' status=' + sel.status);
  return state.activation;
}

async function newEpoch(reason) {
  state.epochIndex++;
  const e = { epoch_id: epochId(), reason, environment: navigator.userAgent, secure_context: state.secureContext, established: new Date().toISOString() };
  state.epochs.push(e);
  island('epoch ' + epochId());
  return e;
}

export async function init() {
  await newEpoch('initial observation');
  for (const b of backendsNeeded()) await admit(b);
  for (const b of backendsNeeded()) { const a = adapterFor(b); if (a) a.observe(onLoss); }
  return activate();
}

let lossChain = Promise.resolve();
function onLoss(info) {
  /*EVIDENCE-HOOK:loss*/
  lossChain = lossChain.then(async () => {
    const from = epochId();
    record('LOSS', info.backend, info, null);
    island('loss ' + from + ' ' + info.backend + ' reason=' + String(info.reason).replace(/[^A-Za-z0-9_-]/g, '_'));
    const staleAdmission = state.admissions[info.backend];
    const stalePlan = state.activePlan && state.activePlan.guard.includes(info.backend) ? state.activePlan.plan_id : null;
    await newEpoch('loss of ' + info.backend + ' (' + info.reason + ')');
    state.admissions[info.backend] = { ...staleAdmission, receipt_id: 'ADM-' + epochId() + '-' + info.backend, epoch_id: epochId(), decision: 'REJECTED', rejection_reason: String(info.reason), status: 'REJECTED' };
    island('admission ' + info.backend + ' REJECTED evidence=device_lost reason=' + String(info.reason).replace(/[^A-Za-z0-9_-]/g, '_'));
    const act = activate();
    /*EVIDENCE-HOOK:transition*/
    const delta = { from_epoch: from, to_epoch: epochId(), changed_observations: [{ backend: info.backend, from: 'ADMITTED', to: 'REJECTED', reason: info.reason }], invalidated_admissions: [staleAdmission ? staleAdmission.receipt_id : null], stale_plans: stalePlan === null ? [] : [stalePlan], replacement_plan: act.plan_id, evidence_refs: state.evidence.slice(-3).map(r => r.evidence_id) };
    state.deltas.push(delta);
    record('OBSERVATION_DELTA', 'runtime', delta, null);
    island('transition ' + from + ' -> ' + epochId() + ' stale_plan=' + (stalePlan === null ? 'none' : stalePlan) + ' replacement=' + (act.plan_id === null ? 'none' : act.plan_id));
  });
  return lossChain;
}

export async function relay(bytes) {
  /*EVIDENCE-HOOK:executed*/
  await lossChain;
  if (!state.activePlan) { record('EXECUTE', 'relay', { status: 'NO_ACTIVE_PLAN' }, null); island('no_active_plan ' + epochId()); return { status: 'NO_ACTIVE_PLAN' }; }
  const plan = state.activePlan;
  const a = adapterFor(plan.guard[0]);
  const inputSha = await sha256hex(bytes);
  const out = await a.operate(bytes);
  if (out.result !== Result.OK) {
    record('EXECUTE', 'relay', { status: 'FAILED', result: out.result, detail: out.detail, input_sha256: inputSha }, null);
    island('executed ' + epochId() + ' plan=' + plan.plan_id + ' relation=' + STRATEGY.relation + ' status=' + out.result);
    return { status: 'FAILED', result: out.result, detail: out.detail };
  }
  const outputSha = await sha256hex(out.bytes);
  const exact = bytesEqual(out.bytes, bytes);
  record('EXECUTE', 'relay', { status: 'EXECUTED', plan_id: plan.plan_id, backend: plan.guard[0], conversions: plan.conversions, bytes: bytes.length, input_sha256: inputSha, output_sha256: outputSha, exact }, { output_sha256: inputSha });
  island('executed ' + epochId() + ' plan=' + plan.plan_id + ' relation=' + STRATEGY.relation + ' bytes=' + bytes.length + ' input="' + inputSha + '" output="' + outputSha + '" exact=' + exact);
  return { status: 'EXECUTED', plan_id: plan.plan_id, backend: plan.guard[0], bytes: out.bytes, exact, input_sha256: inputSha, output_sha256: outputSha };
}

export async function destroyBackend(backend) {
  const a = adapterFor(backend);
  if (!a) return { result: Result.UNAVAILABLE };
  const r = await a.release();
  await lossChain;
  return r;
}

export function snapshot() { return { strategy: STRATEGY, epochs: state.epochs, admissions: state.admissions, activation: state.activation, evidence: state.evidence, observation_deltas: state.deltas, tape: state.tape.join('\n') + '\n' }; }
window.factRuntime = { init, relay, destroyBackend, snapshot, STRATEGY };
