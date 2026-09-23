/**
 * Compare a recorded trace against a golden.
 *
 *   npx tsx tools/compare-trace.ts goldens/inline-collapse-AB.json my-trace.json
 *
 * The trace may come from any build (web, React Native, iOS) as long as it has
 * the shape { frames: [{ t, channels: { <name>: number } }] } with t in seconds
 * from the moment the transition was triggered. Frames need not be at 60 fps:
 * the golden is interpolated at each recorded time. A start-latency of up to
 * two frames is allowed (the best offset is used), and each sample may sit up
 * to one frame early or late — a renderer computes values for the frame it is
 * drawing, not for the instant the trace hook happens to run.
 *
 * Pass: every channel within tolerance at every frame.
 *   progress channels (0..1):      ≤ 0.015
 *   pixel channels (sx, swd):      ≤ 0.75 pt
 * After a dropped frame, the sample's time window widens to the gap since the
 * previous sample (the drawn value belongs to the frame, not the hook call).
 */
import { readFileSync } from "node:fs";

type Frame = { t: number; channels: Record<string, number> };
const [gPath, aPath] = process.argv.slice(2);
if (!gPath || !aPath) { console.error("usage: compare-trace <golden.json> <trace.json>"); process.exit(2); }
const golden: { fps: number; frames: Frame[] } = JSON.parse(readFileSync(gPath, "utf8"));
const actualRaw = JSON.parse(readFileSync(aPath, "utf8"));
const actual: Frame[] = actualRaw.frames ?? actualRaw;

const PX = new Set(["sx", "swd"]);
const tol = (k: string) => (PX.has(k) ? 0.75 : 0.015);
const at = (t: number, k: string) => {
  const f = golden.frames, dt = 1 / golden.fps, i = Math.max(0, Math.min(f.length - 2, Math.floor(t / dt)));
  const a = f[i], b = f[i + 1], u = Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t)));
  return a.channels[k] + (b.channels[k] - a.channels[k]) * u;
};

let best: { off: number; worst: Record<string, { err: number; t: number }>; fail: number } | null = null;
for (let off = -2 / golden.fps; off <= 2 / golden.fps + 1e-9; off += 1 / (4 * golden.fps)) {
  const worst: Record<string, { err: number; t: number }> = {};
  let fail = 0;
  for (let n = 0; n < actual.length; n++) {
    const fr = actual[n], t = fr.t + off;
    const win = Math.max(1 / golden.fps, n > 0 ? fr.t - actual[n - 1].t : 0);
    if (t < 0 || t > golden.frames[golden.frames.length - 1].t) continue;
    for (const [k, x] of Object.entries(fr.channels)) {
      if (!(k in golden.frames[0].channels)) continue;
      let err = Infinity;
      for (let j = -8; j <= 8; j++) err = Math.min(err, Math.abs(x - at(Math.max(0, t + (j / 8) * win), k)));
      if (!worst[k] || err > worst[k].err) worst[k] = { err, t: fr.t };
      if (err > tol(k)) fail++;
    }
  }
  if (!best || fail < best.fail || (fail === best.fail && Math.abs(off) < Math.abs(best.off))) best = { off, worst, fail };
}
const b = best!;
console.log(`start offset ${(b.off * 1000).toFixed(1)} ms`);
for (const [k, w] of Object.entries(b.worst)) console.log(`${w.err <= tol(k) ? "ok  " : "FAIL"} ${k.padEnd(5)} max error ${w.err.toFixed(4)} at t=${w.t.toFixed(3)}s (tolerance ${tol(k)})`);
console.log(b.fail === 0 ? "PASS" : `FAIL — ${b.fail} samples out of tolerance`);
process.exit(b.fail === 0 ? 0 : 1);
