/**
 * Language nudge — motion core (framework-agnostic).
 * Pure functions: add 'worklet' directives if running on the Reanimated UI thread.
 * Spec: ./SPEC.md   Tokens: ./motion-tokens.json
 */

export type StateId = 'A' | 'B' | 'C'; // A nudge · B collapsed · C dismissed
export type Channel =
  | 'geo' | 'drop' | 'sx' | 'swd' | 'ic' | 'iv' | 'btn' | 'lay' | 'txt' | 'nn' | 'sb' | 'wm';
export type Values = Record<Channel, number>;

export const BASE = { response: 0.52, dampingFraction: 0.9 };

export interface SpringCfg { response: number; dampingFraction: number; mass: 1; stiffness: number; damping: number }
export const spring = (response: number, dampingFraction: number): SpringCfg => ({
  response, dampingFraction, mass: 1,
  stiffness: Math.pow((2 * Math.PI) / response, 2),
  damping: (4 * Math.PI * dampingFraction) / response,
});

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Per-channel springs, derived from one base response / damping. */
export function channelSprings(R = BASE.response, Z = BASE.dampingFraction): Record<Channel, SpringCfg> {
  return {
    geo: spring(R, Z),
    sx: spring(R * 0.9, Z * 0.92),
    swd: spring(R * 0.9, Z * 0.92),
    ic: spring(R * 1.08, clamp(Z * 0.8, 0.35, 1)),
    btn: spring(R * 0.8, clamp(Z * 0.72, 0.35, 1)),
    iv: spring(R * 0.6, 1),
    lay: spring(R * 1.2, 1),
    drop: spring(R * 1.05, clamp(Z * 0.82, 0.35, 1)),
    wm: spring(R * 0.7, 1),
    txt: spring(R * 0.55, 1),
    nn: spring(R * 0.55, 1),
    sb: spring(R * 0.55, 1),
  };
}
/** Applied only for the entrance (C → A). */
export function entranceOverrides(R = BASE.response): Partial<Record<Channel, SpringCfg>> {
  return { nn: spring(R * 0.75, 0.68), sb: spring(R * 0.75, 0.68), iv: spring(R * 0.7, 0.62), txt: spring(R * 0.95, 1) };
}

/** Measure these from the real component; values in comments are the Figma frame at 526 wide. */
export interface Layout {
  width: number;        // 526
  searchInset: number;  // 16
  searchTop: number;    // 15
  searchH: number;      // 66
  gap: number;          // 13
  cardH: number;        // 162
  iconA: { x: number; y: number }; // (38,124) centre of icon in the nudge row
  iconSizeA: number;    // 28
  iconSizeB: number;    // 30
  radii: { card: number; searchA: number; searchB: number }; // 26, 18, 20
}

export function derive(L: Layout) {
  const btnSize = L.searchH, btnX = L.width - btnSize;
  const iconB = { x: btnX + btnSize / 2, y: L.searchTop + L.searchH / 2 };
  const collapsedH = 2 * L.searchTop + L.searchH;
  const search = {
    A: { x: L.searchInset, w: L.width - 2 * L.searchInset },
    B: { x: 0, w: btnX - L.gap },
    C: { x: 0, w: L.width },
  };
  return { btnSize, btnX, iconB, collapsedH, search };
}

/** Target channel values per state. `undefined` = leave as is. */
export function stateTargets(L: Layout): Record<StateId, Partial<Values>> {
  const d = derive(L);
  return {
    A: { geo: 0, drop: 0, sx: d.search.A.x, swd: d.search.A.w, ic: 0, iv: 1, btn: 0, lay: 0, txt: 0, nn: 0, sb: 0, wm: 0 },
    B: { geo: 1, sx: d.search.B.x, swd: d.search.B.w, ic: 1, iv: 1, btn: 1, lay: 1, txt: 1, nn: 1, sb: 1, wm: 1 },
    C: { geo: 1, sx: d.search.C.x, swd: d.search.C.w, iv: 0, btn: 0, lay: 1, txt: 1, nn: 1, sb: 1, wm: 1 },
  };
}

/** Delays in seconds at response 0.52; multiply by (response / 0.52). Channels not listed start at 0. */
export const PLANS: Record<string, Partial<Record<Channel, number>>> = {
  AB: { txt: 0, nn: 0.025, sb: 0.05, wm: 0, geo: 0.03, sx: 0.06, swd: 0.06, ic: 0.05, btn: 0.2, lay: 0.08 },
  BA: { btn: 0, ic: 0, sx: 0.08, swd: 0.08, geo: 0.05, lay: 0, wm: 0.1, txt: 0.15, nn: 0.19, sb: 0.23 },
  AC: { txt: 0, nn: 0.025, sb: 0.05, wm: 0, iv: 0, geo: 0.03, sx: 0.06, swd: 0.06, lay: 0.08 },
  CA: { sx: 0, swd: 0, geo: 0.03, lay: 0.1, drop: 0.16, iv: 0.34, wm: 0.36, txt: 0.4, nn: 0.5, sb: 0.57 }, // entrance
  BC: { btn: 0, iv: 0, sx: 0.04, swd: 0.04 },
  CB: { sx: 0, swd: 0, btn: 0.14, iv: 0.18 },
};

/**
 * Pre-transition snaps (invisible, so they never show):
 *  - leaving C with iv < 0.05 → snap ic to the target's ic (icon reappears at rest spot)
 *  - entrance (C→A) with geo > 0.98 → snap drop to 1 (card becomes a halo inside the search)
 */
export function preSnaps(from: StateId, to: StateId, v: Values, L: Layout): Partial<Values> {
  const t = stateTargets(L)[to], out: Partial<Values> = {};
  if (to !== 'C' && v.iv < 0.05 && t.ic !== undefined) out.ic = t.ic;
  if (from === 'C' && to === 'A' && v.geo > 0.98) out.drop = 1;
  return out;
}

export const SHEEN = { startAfter: 0.8, duration: 1.5 }; // seconds at response 0.52

/* ---------------- icon path ---------------- */
export function makeIconPath(L: Layout, samples = 400) {
  const { iconB } = derive(L);
  const P = [
    [L.iconA.x, L.iconA.y],
    [L.iconA.x + 0.4 * (iconB.x - L.iconA.x), L.iconA.y + 16],
    [L.width - 2, L.iconA.y + 24],
    [iconB.x, iconB.y],
  ];
  const bez = (t: number) => {
    const u = 1 - t;
    return [0, 1].map(i => u * u * u * P[0][i] + 3 * u * u * t * P[1][i] + 3 * u * t * t * P[2][i] + t * t * t * P[3][i]);
  };
  const pts: number[][] = [], len: number[] = [0];
  for (let i = 0; i <= samples; i++) pts.push(bez(i / samples));
  for (let i = 1; i <= samples; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = len[samples], OVR = 140;

  return function pathAt(s: number): [number, number] {
    const n = samples;
    if (s <= 0) { const dx = pts[1][0] - pts[0][0], dy = pts[1][1] - pts[0][1], m = Math.hypot(dx, dy);
      return [pts[0][0] + (dx / m) * s * OVR, pts[0][1] + (dy / m) * s * OVR]; }
    if (s >= 1) { const dx = pts[n][0] - pts[n - 1][0], dy = pts[n][1] - pts[n - 1][1], m = Math.hypot(dx, dy);
      return [pts[n][0] + (dx / m) * (s - 1) * OVR, pts[n][1] + (dy / m) * (s - 1) * OVR]; }
    const target = s * total; let lo = 0, hi = n;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (len[mid] < target) lo = mid; else hi = mid; }
    const f = (target - len[lo]) / (len[hi] - len[lo]);
    return [lerp(pts[lo][0], pts[hi][0], f), lerp(pts[lo][1], pts[hi][1], f)];
  };
}

/* ---------------- per-frame geometry ---------------- */
export function makeGeom(L: Layout) {
  const d = derive(L), pathAt = makeIconPath(L);
  return function geom(v: Values, entering: boolean) {
    const g = v.geo, ga = clamp(g);
    const haloH = lerp(L.cardH, d.collapsedH, v.drop || 0);
    const card = {
      x: lerp(0, v.sx, g), y: lerp(0, L.searchTop, g),
      w: Math.max(1, lerp(L.width, v.swd, g)), h: Math.max(1, lerp(haloH, L.searchH, g)),
      radius: lerp(L.radii.card, 20, ga),
      gradientOpacity: clamp(1 - g * 1.25), dotsOpacity: clamp(1 - g * 2),
    };
    const search = {
      x: v.sx, y: L.searchTop, w: v.swd, radius: lerp(L.radii.searchA, L.radii.searchB, ga),
      borderOpacity: clamp((g - 0.35) / 0.55),
      dividerX: v.swd - lerp(62, 59, ga), cameraCentreX: v.swd - lerp(34, 31, ga),
    };
    const [ix, iy] = pathAt(v.ic);
    const icon = {
      cx: ix, cy: iy,
      size: lerp(L.iconSizeA, L.iconSizeB, clamp(v.ic)) * lerp(entering ? 0.4 : 0.55, 1, v.iv),
      opacity: clamp(v.iv), blur: (1 - clamp(v.iv)) * 5,
    };
    const button = { x: d.btnX, y: L.searchTop, size: d.btnSize, opacity: clamp(v.btn * 1.4), scale: Math.max(0, lerp(0.35, 1, v.btn)), interactive: v.btn > 0.6 };
    const stageH = lerp(L.cardH, d.collapsedH, v.lay);
    return {
      card, search, icon, button,
      headerH: Math.max(stageH, card.y + card.h),
      belowOffsetY: stageH - L.cardH,
      contentCounterOffset: { x: -card.x, y: -card.y }, // apply to the card's inner content
    };
  };
}

/* ---------------- content styling ---------------- */
export interface Look { opacity: number; blur: number; tx: number; ty: number; sx: number; sy: number }

/** Exit / collapse styling for prompt (drift 18), Not now (12), Switch (8). v: 0 shown → 1 hidden. */
export const exitLook = (v: number, drift: number): Look => ({
  opacity: clamp(1 - v * 1.15), blur: clamp(v) * 7, tx: v * drift, ty: -v * 10, sx: 1 - clamp(v) * 0.06, sy: 1 - clamp(v) * 0.06,
});
export const watermarkExit = (v: number) => ({ opacity: 0.75 * clamp(1 - v), tx: v * 30, ty: -v * 14, rotateDeg: -v * 8 });
export const watermarkEnter = (v: number) => ({ opacity: 0.75 * clamp(1 - v), scale: lerp(1.12, 1, 1 - v) });

/** Entrance: per-word rise. txt = channel value (1 hidden → 0 shown). */
export function wordLooks(txt: number, n: number, step = 0.13): Look[] {
  const e = 1 - txt, span = 1 - step * (n - 1);
  return Array.from({ length: n }, (_, i) => {
    const p = clamp((e - i * step) / span), q = 1 - p;
    return { opacity: clamp(p * 1.3), blur: q * 4, tx: 0, ty: q * 9, sx: 1, sy: 1 };
  });
}
/** Entrance: pill surface forms (with overshoot), then label settles. ch = channel value (1 → 0). */
export function pillLooks(ch: number) {
  const e = 1 - ch, s = Math.max(0, e), l = clamp((e - 0.35) / 0.65), lq = 1 - l;
  return {
    surface: { opacity: clamp(e * 1.8), blur: 0, tx: 0, ty: 0, sx: lerp(0.72, 1, s), sy: lerp(0.6, 1, s) } as Look,
    label: { opacity: l, blur: lq * 3, tx: 0, ty: lq * 5, sx: 1, sy: 1 } as Look,
    interactive: e > 0.5,
  };
}

/** Shimmer at elapsed seconds since entrance start (already scaled by response/0.52 by caller). */
export function sheenAt(elapsed: number, L: Layout, switchCentreX: number, response = BASE.response) {
  const k = response / 0.52, p = (elapsed - SHEEN.startAfter * k) / (SHEEN.duration * k);
  if (p < 0 || p > 1) return null;
  const ease = 1 - Math.pow(1 - p, 3), env = Math.pow(Math.sin(Math.PI * p), 1.2);
  const x = lerp(-160, L.width + 174, ease);
  return { x, opacity: env, glintOpacity: env * clamp(1 - Math.abs(x - switchCentreX) / 140) };
}

/* ---------------- scroll trigger ---------------- */
export const SCROLL = { trigger: 48, reopenBelow: (t: number) => Math.min(t * 0.35, 16) };
export function scrollDecision(state: StateId, y: number, trigger = SCROLL.trigger): StateId | null {
  if (state === 'A' && y > trigger) return 'B';
  if (state === 'B' && y < SCROLL.reopenBelow(trigger)) return 'A';
  return null;
}
/** On release (drag end + momentum end): true → animate scroll to 0. */
export const shouldSettleToTop = (state: StateId, y: number, trigger = SCROLL.trigger) => state === 'A' && y > 0.5 && y <= trigger;
