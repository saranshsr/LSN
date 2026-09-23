/**
 * Language nudge — motion core (framework-agnostic).
 * Pure functions: add 'worklet' directives if running on the Reanimated UI thread.
 * Spec: ./SPEC.md   Tokens: ./motion-tokens.json
 */

// P plain (the bar before the nudge arrives) · A nudge · B collapsed · C dismissed
export type StateId = 'P' | 'A' | 'B' | 'C';
export type Channel =
  | 'geo' | 'drop' | 'sx' | 'swd' | 'ic' | 'iv' | 'btn' | 'lay' | 'txt' | 'nn' | 'sb' | 'wm';
export type Values = Record<Channel, number>;

// Damping 0.92, up from the handoff's approved 0.90 at the user's call: a touch
// less overshoot everywhere. Every channel is a multiple of this, so the whole
// flow — nudge, tooltip, search bar, sheet — retunes from here.
export const BASE = { response: 0.52, dampingFraction: 0.92 };

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

/**
 * Measure these from the real component; the comments are the handoff's Figma
 * frame at 526 wide, ours is 351 (node 303:26898).
 *
 * TWO DOCUMENTED EXTENSIONS to the handoff's model, both required by our
 * layout and both permitted by SPEC §3 ("derive from the real layout"):
 *
 *  1. `searchTopB` — the handoff assumes one constant `top`. Our collapsed
 *     frame drops the card's padding entirely, so the search sits at y10 in A
 *     and y0 in B. `top` therefore interpolates with `geo`.
 *  2. `collapsedH` is measured, not `2·top + h`. That formula gives 64; our
 *     collapsed card (303:20152) is 44.
 */
export interface Layout {
  width: number;        // 526 → 351
  searchInset: number;  // 16  → 10
  searchTop: number;    // 15  → 10   (state A)
  searchTopB: number;   //     → 0    (states B and C)
  searchH: number;      // 66  → 44
  gap: number;          // 13  → 8
  cardH: number;        // 162 → 108
  collapsedH: number;   // 96  → 44   (measured stage height in B, not derived)
  /** Entrance halo height: top + search + top, per SPEC §6.1 step 3. In the
   *  handoff's frame this equals collapsedH; in ours it does not, because our
   *  collapsed card drops its padding. 2·10 + 44 = 64. */
  haloH: number;
  iconA: { x: number; y: number }; // (38,124) → (26,82)
  iconSizeA: number;    // 28  → 20
  iconSizeB: number;    // 30  → 20
  radii: { card: number; searchA: number; searchB: number }; // 26,18,20 → 16,12,12
}

/** The search's y at a given `geo` — see extension 1. */
export const topAt = (L: Layout, geo: number) => lerp(L.searchTop, L.searchTopB, clamp(geo));

export function derive(L: Layout) {
  const btnSize = L.searchH, btnX = L.width - btnSize;
  const iconB = { x: btnX + btnSize / 2, y: L.searchTopB + L.searchH / 2 };
  const collapsedH = L.collapsedH;
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
    /**
     * DIVERGENCE FROM THE HANDOFF, on the designer's call.
     *
     * SPEC §1 defines C as "search field alone at full width, no button". Our
     * product keeps the glyph: the 17 Sep benchmarking landed on Chrome's
     * model, where dismiss ≠ never and the in-field entry point survives, and
     * there is no C frame in Figma to draw the buttonless state from.
     *
     * So dismissing collapses the nudge INTO the button — C rests exactly
     * where B does. The states stay distinct in behaviour, not in pixels:
     * scrolling can bring the nudge back from B, and never from C (§7).
     */
    C: { geo: 1, sx: d.search.B.x, swd: d.search.B.w, ic: 1, iv: 1, btn: 1, lay: 1, txt: 1, nn: 1, sb: 1, wm: 1 },
    /**
     * P — what the user lands on: the plain, full-width search bar, no card,
     * no glyph. The nudge then blooms out of it (P → A), so it reads as
     * something that has just arrived rather than something already there.
     * This is the handoff's C (SPEC §1); ours is taken by the glyph state.
     */
    P: { geo: 1, sx: 0, swd: L.width, ic: 0, iv: 0, btn: 0, lay: 1, txt: 1, nn: 1, sb: 1, wm: 1 },
  };
}

/** Delays in seconds at response 0.52; multiply by (response / 0.52). Channels not listed start at 0. */
export const PLANS: Record<string, Partial<Record<Channel, number>>> = {
  // The icon travels along its row inside the card, so the card has to stay
  // until the icon has risen out of it: the search makes room first, the icon
  // sets off, and only then do the card and the content below close up.
  AB: { txt: 0, nn: 0.025, sb: 0.05, wm: 0, sx: 0, swd: 0, ic: 0.04, geo: 0.2, btn: 0.22, lay: 0.2 },
  // Reverse: the card comes out first so the icon has a row to drop into; the
  // search only widens once the icon is clear of the button slot.
  BA: { btn: 0, geo: 0, lay: 0, ic: 0.16, sx: 0.32, swd: 0.32, wm: 0.1, txt: 0.15, nn: 0.19, sb: 0.23 },
  // A → C now travels the icon to the button rather than fading it in place,
  // because the button is where the nudge ends up. Same beats as A → B.
  AC: { txt: 0, nn: 0.025, sb: 0.05, wm: 0, sx: 0, swd: 0, ic: 0.04, geo: 0.2, btn: 0.22, lay: 0.2 },
  CA: { sx: 0, swd: 0, geo: 0.03, lay: 0.1, drop: 0.16, iv: 0.34, wm: 0.36, txt: 0.4, nn: 0.5, sb: 0.57 }, // entrance
  // The arrival: the bar insets, the card blooms out from behind it and drops
  // open, then the icon pops and the copy forms (SPEC §6.1).
  PA: { sx: 0, swd: 0, geo: 0.03, lay: 0.1, drop: 0.16, iv: 0.34, wm: 0.36, txt: 0.4, nn: 0.5, sb: 0.57 },
  // Back in English after the round trip: the bar makes room, the glyph's
  // button forms in the slot and the glyph pops onto it — the nudge settling
  // into its contracted form, mirror of the Arabic landing.
  PC: { sx: 0, swd: 0, btn: 0.11, iv: 0.21 },
  // B and C rest identically, so these carry no visible change.
  BC: {},
  CB: {},
  // RECEDE (the collapse-style toggle). P is this repo's name for the spec's
  // buttonless dismissed state, so these are the spec's own C beats, verbatim:
  // A → P is SPEC §6 "A → C dismiss" (copy clears, the icon fades in place,
  // the card folds into the bar); P → B reuses PC above (the bar makes room,
  // the button forms, the glyph pops onto it); B/C → P is SPEC §6 "B → C" (the
  // glyph goes, the search grows into the button's space).
  AP: { txt: 0, nn: 0.025, sb: 0.05, wm: 0, iv: 0, geo: 0.03, sx: 0.06, swd: 0.06, lay: 0.08 },
  PB: { sx: 0, swd: 0, btn: 0.11, iv: 0.21 },
  BP: { btn: 0, iv: 0, sx: 0.04, swd: 0.04 },
  CP: { btn: 0, iv: 0, sx: 0.04, swd: 0.04 },
};

/**
 * Pre-transition snaps (invisible, so they never show):
 *  - leaving C with iv < 0.05 → snap ic to the target's ic (icon reappears at rest spot)
 *  - entrance (C→A) with geo > 0.98 → snap drop to 1 (card becomes a halo inside the search)
 */
export function preSnaps(from: StateId, to: StateId, v: Values, L: Layout): Partial<Values> {
  const t = stateTargets(L)[to], out: Partial<Values> = {};
  if (to !== 'C' && v.iv < 0.05 && t.ic !== undefined) out.ic = t.ic;
  if ((from === 'C' || from === 'P') && to === 'A' && v.geo > 0.98) out.drop = 1;
  if (from === 'P' && to === 'C') out.ic = 1; // the glyph appears in its slot, not in the row
  return out;
}

export const SHEEN = { startAfter: 0.8, duration: 1.5 }; // seconds at response 0.52

/* ---------------- icon path ---------------- */
export function makeIconPath(L: Layout, samples = 400) {
  const { iconB } = derive(L);
  // The icon slides along its own row inside the card, then curves up into the
  // button slot. It never drops below its resting row, so it never has to be
  // drawn over the results under the header — something a native build could
  // not do anyway (the header clips). Fitted to our 351pt layout: 15pt of
  // clearance from the search field, and the icon stays inside the card.
  const P = [
    [L.iconA.x, L.iconA.y],
    [iconB.x + 16, L.iconA.y + 1],
    [L.width + 6, L.iconA.y + 10],
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
    const haloH = lerp(L.cardH, L.haloH, v.drop || 0);
    const top = topAt(L, g);
    const card = {
      x: lerp(0, v.sx, g), y: lerp(0, top, g),
      w: Math.max(1, lerp(L.width, v.swd, g)), h: Math.max(1, lerp(haloH, L.searchH, g)),
      radius: lerp(L.radii.card, 20, ga),
      gradientOpacity: clamp(1 - g * 1.25), dotsOpacity: clamp(1 - g * 2),
    };
    const search = {
      x: v.sx, y: top, w: v.swd, radius: lerp(L.radii.searchA, L.radii.searchB, ga),
      borderOpacity: clamp((g - 0.35) / 0.55),
      // Our search bar lays the camera and divider out in flow, so these are
      // unused — kept so the module stays a faithful port.
      dividerX: v.swd - lerp(62, 59, ga), cameraCentreX: v.swd - lerp(34, 31, ga),
    };
    const [ix, iy] = pathAt(v.ic);
    const icon = {
      cx: ix, cy: iy,
      size: lerp(L.iconSizeA, L.iconSizeB, clamp(v.ic)) * lerp(entering ? 0.4 : 0.55, 1, v.iv),
      opacity: clamp(v.iv), blur: (1 - clamp(v.iv)) * 5,
    };
    const button = { x: d.btnX, y: L.searchTopB, size: d.btnSize, opacity: clamp(v.btn * 1.4), scale: Math.max(0, lerp(0.35, 1, v.btn)), interactive: v.btn > 0.6 };
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
