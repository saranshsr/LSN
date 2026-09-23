/**
 * An exact reimplementation of how Motion runs these springs, used to record
 * golden traces. Semantics that matter for fidelity:
 *
 *  - `animate(value, target, { delay, velocity })` STOPS the running animation
 *    at call time. The value holds still during the delay, then springs from
 *    there with the velocity captured at call time.
 *  - The spring is the closed-form damped oscillator (mass 1).
 *  - It ends by snapping to the target once both displacement and speed are
 *    under Motion's rest thresholds (granular scale when |Δ| < 5).
 */
export type Cfg = { stiffness: number; damping: number; mass?: number };

type Seg = { t0: number; delay: number; from: number; to: number; v0: number; cfg: Cfg };

function springAt(seg: Seg, t: number): { x: number; v: number } {
  const { from, to, v0, cfg } = seg;
  const m = cfg.mass ?? 1, k = cfg.stiffness, c = cfg.damping;
  const w0 = Math.sqrt(k / m), zeta = c / (2 * Math.sqrt(k * m));
  const d0 = from - to;
  let d: number, dv: number;
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta), e = Math.exp(-zeta * w0 * t);
    const A = d0, B = (v0 + zeta * w0 * d0) / wd;
    d = e * (A * Math.cos(wd * t) + B * Math.sin(wd * t));
    dv = e * ((-zeta * w0) * (A * Math.cos(wd * t) + B * Math.sin(wd * t)) + (-A * wd * Math.sin(wd * t) + B * wd * Math.cos(wd * t)));
  } else if (zeta === 1) {
    const e = Math.exp(-w0 * t), B = v0 + w0 * d0;
    d = e * (d0 + B * t); dv = e * (B - w0 * (d0 + B * t));
  } else {
    const s = w0 * Math.sqrt(zeta * zeta - 1), r1 = -zeta * w0 + s, r2 = -zeta * w0 - s;
    const C2 = (v0 - r1 * d0) / (r2 - r1), C1 = d0 - C2;
    d = C1 * Math.exp(r1 * t) + C2 * Math.exp(r2 * t); dv = C1 * r1 * Math.exp(r1 * t) + C2 * r2 * Math.exp(r2 * t);
  }
  const granular = Math.abs(d0) < 5, restDelta = granular ? 0.005 : 0.5, restSpeed = granular ? 0.01 : 2;
  if (t > 0.05 && Math.abs(d) <= restDelta && Math.abs(dv) <= restSpeed) return { x: to, v: 0 };
  return { x: to + d, v: dv };
}

export class Channel {
  private seg: Seg | null = null;
  private held = 0;
  constructor(private value: number) { this.held = value; }
  /** Value and velocity at absolute time t. */
  at(t: number) {
    const s = this.seg;
    if (!s) return { x: this.held, v: 0 };
    if (t < s.t0 + s.delay) return { x: s.from, v: 0 };
    return springAt(s, t - s.t0 - s.delay);
  }
  /** Motion's animate(): stop now, hold through the delay, spring with the velocity seen now. */
  animate(t: number, to: number, cfg: Cfg, delay = 0) {
    const cur = this.at(t);
    this.seg = { t0: t, delay, from: cur.x, to, v0: cur.v, cfg };
  }
  /** MotionValue.jump(): stop, set, zero velocity. */
  jump(t: number, x: number) { void t; this.seg = null; this.held = x; }
}
