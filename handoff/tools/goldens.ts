/**
 * Records the approved motion as golden traces — frame-by-frame channel values
 * and the geometry the components draw from them — using the same cores the
 * prototype renders from. `npx tsx tools/goldens.ts` → goldens/*.json
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { BASE, PLANS, channelSprings, entranceOverrides, makeGeom, preSnaps, stateTargets, type Layout, type StateId, type Values } from "../reference/src/motion/nudge-core";
import * as TT from "../reference/src/motion/tooltip-core";
import { SPR } from "../reference/src/motion/springs";
import { Channel } from "./spring-sim";

const FPS = 60, DUR = 2.2, R = BASE.response, SCALE = R / 0.52;
const r3 = (n: number) => Math.round(n * 1000) / 1000;
const out = "goldens";
mkdirSync(out, { recursive: true });

/* ── Inline nudge ─────────────────────────────────────────────────────────── */
const LAYOUT: Layout = {
  width: 351, searchInset: 10, searchTop: 10, searchTopB: 0, searchH: 44, gap: 8,
  cardH: 108, collapsedH: 44, haloH: 64, iconA: { x: 26, y: 82 }, iconSizeA: 20, iconSizeB: 20,
  radii: { card: 16, searchA: 12, searchB: 12 },
} as Layout;
const CH = ["geo", "drop", "sx", "swd", "ic", "iv", "btn", "lay", "txt", "nn", "sb", "wm"] as const;

function inline(name: string, start: StateId, steps: [number, StateId][]) {
  const T = stateTargets(LAYOUT), springs = channelSprings(), ov = entranceOverrides(), geom = makeGeom(LAYOUT);
  const ch = Object.fromEntries(CH.map((c) => [c, new Channel((T[start] as Values)[c] ?? 0)])) as Record<string, Channel>;
  let state = start, entering = false;
  const frames: unknown[] = [];
  let si = 0;
  for (let f = 0; f <= DUR * FPS; f++) {
    const t = f / FPS;
    while (si < steps.length && steps[si][0] <= t + 1e-9) {
      const to = steps[si++][1], from = state;
      const v = Object.fromEntries(CH.map((c) => [c, ch[c].at(t).x])) as Values;
      for (const [c, x] of Object.entries(preSnaps(from, to, v, LAYOUT))) ch[c].jump(t, x as number);
      entering = (from === "C" || from === "P") && to === "A";
      const plan = (PLANS as Record<string, Record<string, number>>)[from + to] ?? {};
      for (const c of CH) {
        const want = (T[to] as Values)[c]; if (want === undefined) continue;
        const settle = from === "P" && to === "C" && (c === "btn" || c === "iv") ? ov.iv : undefined;
        const cfg = (entering && (ov as Record<string, typeof springs.geo>)[c]) || settle || springs[c];
        ch[c].animate(t, want, cfg, (plan[c] ?? 0) * SCALE);
      }
      state = to;
    }
    const v = Object.fromEntries(CH.map((c) => [c, ch[c].at(t).x])) as Values;
    const g = geom(v, entering);
    frames.push({
      t: r3(t),
      channels: Object.fromEntries(CH.map((c) => [c, r3(v[c])])),
      geom: {
        card: { x: r3(g.card.x), y: r3(g.card.y), w: r3(g.card.w), h: r3(g.card.h), r: r3(g.card.radius) },
        search: { x: r3(g.search.x), y: r3(g.search.y), w: r3(g.search.w) },
        icon: { cx: r3(g.icon.cx), cy: r3(g.icon.cy), size: r3(g.icon.size), opacity: r3(g.icon.opacity) },
        button: { opacity: r3(g.button.opacity), scale: r3(g.button.scale) },
        headerH: r3(g.headerH), belowOffsetY: r3(g.belowOffsetY),
      },
    });
  }
  write(`inline-${name}`, { layout: "inline", start, steps, frames });
}

/* ── Tooltip nudge ────────────────────────────────────────────────────────── */
const TK = ["geo", "uf", "drop", "nt", "dm", "sx", "swd", "ic", "iv", "lay", "txt", "nn", "sb", "wm"] as const;
function tooltip(name: string, start: StateId, steps: [number, StateId][]) {
  const init = { ...TT.STATES.P, ic: 0 } as Record<string, number>;
  // Non-P starts are reached from A in the flow, so channels a state leaves
  // untouched keep A's values (e.g. uf/drop/nt stay 1 while collapsed).
  const base = start === "P" ? init : { ...init, ...TT.STATES.A, ...TT.STATES[start] };
  const ch = Object.fromEntries(TK.map((k) => [k, new Channel(base[k] ?? 0)])) as Record<string, Channel>;
  let state = start, entering = false;
  const timers: [number, () => void][] = [];
  const frames: unknown[] = [];
  let si = 0;
  const to = (t: number, targets: Partial<Record<TT.K, number>>, delays: Partial<Record<TT.K, number>>, spr: (k: TT.K) => { stiffness: number; damping: number }) => {
    for (const k of Object.keys(targets) as TT.K[]) ch[k].animate(t, targets[k] as number, spr(k), (delays[k] ?? 0) * SCALE);
  };
  const snap = (t: number, next: Partial<Record<TT.K, number>>) => { for (const k of Object.keys(next)) ch[k].jump(t, next[k as TT.K] as number); };
  for (let f = 0; f <= DUR * FPS; f++) {
    const t = f / FPS;
    for (let i = timers.length - 1; i >= 0; i--) if (timers[i][0] <= t + 1e-9) { const fn = timers[i][1]; timers.splice(i, 1); fn(); }
    while (si < steps.length && steps[si][0] <= t + 1e-9) {
      const target = steps[si++][1], from = state; state = target; timers.length = 0;
      const spr = (k: TT.K) => (entering && TT.ENTRANCE[k]) || TT.SPRINGS[k];
      entering = target === "A" && (from === "P" || from === "C");
      if (target === "C" && from === "A") {
        to(t, { dm: 1, lay: 1 }, { lay: 0.07 }, spr);
        timers.push([t + 0.3 * SCALE, () => {
          snap(t + 0.3 * SCALE, { geo: 1, uf: 0, drop: 0, nt: 0, ic: 1, iv: 0, dm: 0, ...TT.HIDDEN_COPY });
          to(t + 0.3 * SCALE, { sx: 0, swd: TT.BTNX - TT.GAP, iv: 1 }, { iv: 0.08 }, (k) => (k === "iv" ? SPR.pop : TT.SPRINGS[k]));
        }]);
        continue;
      }
      if (from === "P" && target === "C") {
        snap(t, { ic: 1, iv: 0 });
        to(t, { sx: 0, swd: TT.BTNX - TT.GAP, iv: 1 }, { iv: 0.12 }, (k) => (k === "iv" ? SPR.pop : TT.SPRINGS[k]));
        continue;
      }
      if (entering) snap(t, { geo: 0, uf: 0, drop: 0, nt: 0, dm: 0, ic: 0, iv: 0 });
      else if (target !== "C" && ch.iv.at(t).x < 0.05) snap(t, { ic: TT.STATES[target].ic ?? 0 });
      to(t, TT.STATES[target], TT.PLANS[from + target] ?? {}, spr);
    }
    const v = Object.fromEntries(TK.map((k) => [k, ch[k].at(t).x])) as Record<TT.K, number>;
    const g = TT.tooltipGeom(v, entering);
    frames.push({
      t: r3(t),
      channels: Object.fromEntries(TK.map((k) => [k, r3(v[k])])),
      geom: {
        card: { x: r3(g.cardX), y: r3(g.cardY), w: r3(g.cardW), h: r3(g.cardH), r: r3(g.cardR) },
        search: { x: r3(v.sx), w: r3(v.swd) },
        tile: { cx: r3(g.tx), cy: r3(g.ty), size: r3(g.ts), radius: r3(g.tr), opacity: r3(g.iv) },
        recede: r3(g.dm), stageH: r3(g.stageH), tileBottom: r3(g.tileBottom),
      },
    });
  }
  write(`tooltip-${name}`, { layout: "tooltip", start, steps, frames });
}

/* ── Role curves: every spring role's unit step response ─────────────────── */
function roles() {
  const res: Record<string, number[]> = {};
  for (const [k, cfg] of Object.entries(SPR)) {
    const c = new Channel(0); c.animate(0, 1, cfg);
    res[k] = Array.from({ length: Math.round(1.5 * FPS) + 1 }, (_, f) => r3(c.at(f / FPS).x));
  }
  write("roles", { fps: FPS, note: "Unit step response of each spring role (0 → 1, zero initial velocity).", curves: res });
}

function write(name: string, body: object) {
  writeFileSync(`${out}/${name}.json`, JSON.stringify({ fps: FPS, base: { response: R, dampingFraction: BASE.dampingFraction }, ...body }));
}

inline("arrive-PA", "P", [[0, "A"]]);
inline("collapse-AB", "A", [[0, "B"]]);
inline("expand-BA", "B", [[0, "A"]]);
inline("dismiss-AC", "A", [[0, "C"]]);
inline("settle-PC", "P", [[0, "C"]]);
inline("scrolled-during-hold-PB", "P", [[0, "B"]]);
inline("interrupt-AB-BA-AB", "A", [[0, "B"], [0.2, "A"], [0.45, "B"]]);
tooltip("arrive-PA", "P", [[0, "A"]]);
tooltip("collapse-AB", "A", [[0, "B"]]);
tooltip("expand-BA", "B", [[0, "A"]]);
tooltip("dismiss-AC", "A", [[0, "C"]]);
tooltip("settle-PC", "P", [[0, "C"]]);
tooltip("interrupt-AB-BA-AB", "A", [[0, "B"], [0.2, "A"], [0.45, "B"]]);
roles();
console.log("goldens written");
