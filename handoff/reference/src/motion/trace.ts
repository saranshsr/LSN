/**
 * Motion trace recorder — the conformance hook.
 *
 * Off unless `window.__MOTION_TRACE__ = true`. When on, every nudge transition
 * starts a trace and every rendered frame appends its channel values, so a
 * build can be compared against `goldens/*.json` with `tools/compare-trace.ts`.
 * Any port should emit the same shape: { layout, from, to, frames: [{ t, channels }] }.
 */
type Trace = { layout: string; from: string; to: string; t0: number; frames: { t: number; channels: Record<string, number> }[] };
type W = { __MOTION_TRACE__?: boolean; __motionTraces?: Trace[] };

export function traceStart(layout: string, from: string, to: string) {
  const w = window as unknown as W;
  if (!w.__MOTION_TRACE__) return;
  (w.__motionTraces ??= []).push({ layout, from, to, t0: performance.now(), frames: [] });
}
export function traceFrame(layout: string, channels: Record<string, number>) {
  const w = window as unknown as W;
  if (!w.__MOTION_TRACE__ || !w.__motionTraces) return;
  for (let i = w.__motionTraces.length - 1; i >= 0; i--) {
    const tr = w.__motionTraces[i];
    if (tr.layout !== layout) continue;
    const t = (performance.now() - tr.t0) / 1000;
    if (t <= 2.4) tr.frames.push({ t, channels: { ...channels } });
    return;
  }
}
