/**
 * The tooltip layout's motion, as pure data and geometry — no DOM, no React.
 * `TooltipHeader.tsx` renders it; `tools/goldens.ts` records it. Port this
 * file verbatim: every number in it is the approved motion.
 */
import { BASE, type StateId } from "./nudge-core";
import { spring, type Spring } from "./springs";

export const W = 351, SH = 44, GAP = 8, BTN = 44, BTNX = W - BTN;
export const CARD = { y: 58, h: 52, r: 16 };
export const NOTCH = { tip: 44, w: 18, h: 7 };
export const TILE = { A: { x: 25, y: 84, s: 32, r: 8 }, B: { x: BTNX + BTN / 2, y: SH / 2, s: 44, r: 12 } };
export const STAGE_A = CARD.y + CARD.h, STAGE_B = SH;
export const STAGE_Y = 50.57, STAGE_X = 12, PAD_B = 14;

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);

/* Tile path: along its row, then up into the slot (arc-length paced). */
export const pathAt = (() => {
  const P = [[TILE.A.x, TILE.A.y], [250, 83], [370, 95], [TILE.B.x, TILE.B.y]];
  const bez = (t: number) => { const u = 1 - t; return [0, 1].map((i) => u * u * u * P[0][i] + 3 * u * u * t * P[1][i] + 3 * u * t * t * P[2][i] + t * t * t * P[3][i]); };
  const n = 300, pts: number[][] = [], len = [0];
  for (let i = 0; i <= n; i++) pts.push(bez(i / n));
  for (let i = 1; i <= n; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = len[n], OVR = 80;
  return (s: number): [number, number] => {
    if (s <= 0) { const dx = pts[1][0] - pts[0][0], dy = pts[1][1] - pts[0][1], m = Math.hypot(dx, dy); return [pts[0][0] + dx / m * s * OVR, pts[0][1] + dy / m * s * OVR]; }
    if (s >= 1) { const dx = pts[n][0] - pts[n - 1][0], dy = pts[n][1] - pts[n - 1][1], m = Math.hypot(dx, dy); return [pts[n][0] + dx / m * (s - 1) * OVR, pts[n][1] + dy / m * (s - 1) * OVR]; }
    const target = s * total; let lo = 0, hi = n;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (len[mid] < target) lo = mid; else hi = mid; }
    const f = (target - len[lo]) / (len[hi] - len[lo]);
    return [lerp(pts[lo][0], pts[hi][0], f), lerp(pts[lo][1], pts[hi][1], f)];
  };
})();

export type K = "geo" | "uf" | "drop" | "nt" | "dm" | "sx" | "swd" | "ic" | "iv" | "lay" | "txt" | "nn" | "sb" | "wm";
const Z = BASE.dampingFraction;
export const SPRINGS: Record<K, Spring> = {
  geo: spring(1, Z), sx: spring(0.9, Z * 0.92), swd: spring(0.9, Z * 0.92),
  ic: spring(1.08, Z * 0.8), iv: spring(0.6, 1), lay: spring(1.2, 1),
  uf: spring(0.95, Z * 0.9), drop: spring(1.05, Z * 0.82), nt: spring(0.7, Z * 0.8),
  wm: spring(0.7, 1), dm: spring(0.72, 1), txt: spring(0.55, 1), nn: spring(0.55, 1), sb: spring(0.55, 1),
};
export const ENTRANCE: Partial<Record<K, Spring>> = { nn: spring(0.75, 0.68), sb: spring(0.75, 0.68), iv: spring(0.7, 0.62), txt: spring(0.95, 1) };

export const HIDDEN_COPY = { txt: 1, nn: 1, sb: 1, wm: 1 };
export const STATES: Record<StateId, Partial<Record<K, number>>> = {
  P: { geo: 1, uf: 0, drop: 0, nt: 0, dm: 0, sx: 0, swd: W, iv: 0, lay: 1, ...HIDDEN_COPY },
  A: { geo: 0, uf: 1, drop: 1, nt: 1, dm: 0, sx: 0, swd: W, ic: 0, iv: 1, lay: 0, txt: 0, nn: 0, sb: 0, wm: 0 },
  B: { geo: 1, dm: 0, sx: 0, swd: BTNX - GAP, ic: 1, iv: 1, lay: 1, ...HIDDEN_COPY },
  C: { geo: 1, dm: 0, sx: 0, swd: BTNX - GAP, ic: 1, iv: 1, lay: 1, ...HIDDEN_COPY },
};
export const PLANS: Record<string, Partial<Record<K, number>>> = {
  PA: { nt: 0, lay: 0.02, uf: 0.07, drop: 0.12, iv: 0.3, wm: 0.32, txt: 0.36, nn: 0.46, sb: 0.53 },
  CA: { nt: 0, lay: 0.02, uf: 0.07, drop: 0.12, iv: 0.3, wm: 0.32, txt: 0.36, nn: 0.46, sb: 0.53 },
  AB: { txt: 0, nn: 0.025, sb: 0.05, wm: 0, sx: 0, swd: 0, ic: 0.06, geo: 0.2, lay: 0.2 },
  BA: { geo: 0, lay: 0, ic: 0.12, sx: 0.32, swd: 0.32, wm: 0.12, txt: 0.16, nn: 0.2, sb: 0.24 },
};
export const SHEEN = { at: 0.95, dur: 2.4 };
/** Delays and the shimmer scale with the base response. */
export const R = BASE.response;

/** Per-frame geometry from the channel values — exactly what the header draws. */
export function tooltipGeom(v: Record<K, number>, entering: boolean) {
  const g = v.geo;
  const uX = lerp(NOTCH.tip - NOTCH.w / 2, 0, v.uf), uW = Math.max(1, lerp(NOTCH.w, W, v.uf)), uH = Math.max(1, lerp(3, CARD.h, v.drop));
  const cardX = lerp(uX, v.sx, g), cardY = lerp(CARD.y, 0, g), cardW = Math.max(1, lerp(uW, v.swd, g)), cardH = Math.max(1, lerp(uH, SH, g));
  const cardR = Math.min(lerp(CARD.r, 12, clamp(g)), cardH / 2, cardW / 2);
  const grow = v.ic <= 0 ? 0 : v.ic >= 1 ? 1 : ease(clamp((v.ic - 0.8) / 0.2));
  const [tx, ty] = pathAt(v.ic);
  const pop = lerp(entering ? 0.4 : 0.55, 1, v.iv);
  const ts = lerp(TILE.A.s, TILE.B.s, grow) * pop, tr = lerp(TILE.A.r, TILE.B.r, grow) * pop;
  const iv = clamp(v.iv), dm = clamp(v.dm);
  const stageH = lerp(STAGE_A, STAGE_B, v.lay);
  const tileBottom = (ty + ts / 2) * clamp(v.iv * 1.5) * (1 - dm);
  return { g, cardX, cardY, cardW, cardH, cardR, grow, tx, ty, pop, ts, tr, iv, dm, stageH, tileBottom };
}
