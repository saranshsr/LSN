import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useAnimationFrame } from "motion/react";

import { SearchBar } from "./SearchBar";
import { Icon } from "../icons/Icon";
import { QUERY, nudge } from "../data/copy";
import { BASE } from "../motion/nudge-core";
import { useChannels } from "../motion/useChannels";
import { SPR, spring, type Spring } from "../motion/springs";
import type { StateId } from "../motion/nudge-core";

/**
 * The tooltip layout — the pale card hangs under the search bar off a small
 * pointer — with the motion from its prototype, fitted to the 351pt header:
 *
 *   P → A  arrival: the pointer slips out from under the bar, the card unfolds
 *          from it (a sliver spreads, then drops open), the icon tile pops, the
 *          words rise one by one, the pills form, and one slow, soft band of
 *          light passes over the card's background.
 *   A → B  collapse: the bar makes room, the tile slides along its own row and
 *          curves up into the button slot — becoming the button — and only then
 *          does the card retract up into the bar and the content close up.
 *   A → C  dismiss: the whole tooltip recedes toward its pointer as one layer.
 *          The glyph survives (the product's dismiss ≠ never), so the bar then
 *          makes room and the glyph pops in beside it.
 *
 * The tile never leaves the header area, so nothing is drawn over the results.
 */
const W = 351, SH = 44, GAP = 8, BTN = 44, BTNX = W - BTN;
const CARD = { y: 58, h: 52, r: 16 };
const NOTCH = { tip: 44, w: 18, h: 7 };
const TILE = { A: { x: 25, y: 84, s: 32, r: 8 }, B: { x: BTNX + BTN / 2, y: SH / 2, s: 44, r: 12 } };
const STAGE_A = CARD.y + CARD.h, STAGE_B = SH;
const STAGE_Y = 50.57, STAGE_X = 12, PAD_B = 14;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);

/* Tile path: along its row, then up into the slot (arc-length paced). */
const pathAt = (() => {
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

type K = "geo" | "uf" | "drop" | "nt" | "dm" | "sx" | "swd" | "ic" | "iv" | "lay" | "txt" | "nn" | "sb" | "wm";
const R = BASE.response, Z = BASE.dampingFraction;
const SPRINGS: Record<K, Spring> = {
  geo: spring(1, Z), sx: spring(0.9, Z * 0.92), swd: spring(0.9, Z * 0.92),
  ic: spring(1.08, Z * 0.8), iv: spring(0.6, 1), lay: spring(1.2, 1),
  uf: spring(0.95, Z * 0.9), drop: spring(1.05, Z * 0.82), nt: spring(0.7, Z * 0.8),
  wm: spring(0.7, 1), dm: spring(0.72, 1), txt: spring(0.55, 1), nn: spring(0.55, 1), sb: spring(0.55, 1),
};
const ENTRANCE: Partial<Record<K, Spring>> = { nn: spring(0.75, 0.68), sb: spring(0.75, 0.68), iv: spring(0.7, 0.62), txt: spring(0.95, 1) };

const HIDDEN_COPY = { txt: 1, nn: 1, sb: 1, wm: 1 };
const STATES: Record<StateId, Partial<Record<K, number>>> = {
  P: { geo: 1, uf: 0, drop: 0, nt: 0, dm: 0, sx: 0, swd: W, iv: 0, lay: 1, ...HIDDEN_COPY },
  A: { geo: 0, uf: 1, drop: 1, nt: 1, dm: 0, sx: 0, swd: W, ic: 0, iv: 1, lay: 0, txt: 0, nn: 0, sb: 0, wm: 0 },
  B: { geo: 1, dm: 0, sx: 0, swd: BTNX - GAP, ic: 1, iv: 1, lay: 1, ...HIDDEN_COPY },
  C: { geo: 1, dm: 0, sx: 0, swd: BTNX - GAP, ic: 1, iv: 1, lay: 1, ...HIDDEN_COPY },
};
const PLANS: Record<string, Partial<Record<K, number>>> = {
  PA: { nt: 0, lay: 0.02, uf: 0.07, drop: 0.12, iv: 0.3, wm: 0.32, txt: 0.36, nn: 0.46, sb: 0.53 },
  CA: { nt: 0, lay: 0.02, uf: 0.07, drop: 0.12, iv: 0.3, wm: 0.32, txt: 0.36, nn: 0.46, sb: 0.53 },
  AB: { txt: 0, nn: 0.025, sb: 0.05, wm: 0, sx: 0, swd: 0, ic: 0.06, geo: 0.2, lay: 0.2 },
  BA: { geo: 0, lay: 0, ic: 0.12, sx: 0.32, swd: 0.32, wm: 0.12, txt: 0.16, nn: 0.2, sb: 0.24 },
};
const SHEEN = { at: 0.95, dur: 2.4 };
const WORDS = [...nudge.tooltipLead.split(" "), nudge.tooltipLang];

type Props = { state: StateId; onSwitch: () => void; onDismiss: () => void; onHeight?: (h: number) => void };

export function TooltipHeader({ state, onSwitch, onDismiss, onHeight }: Props) {
  const ch = useChannels<K>({ ...STATES.P, ic: 0 } as Record<K, number>);
  const cur = useRef<StateId>("P");
  const entering = useRef(false);
  const sheenStart = useRef<number | null>(null);

  const r = {
    header: useRef<HTMLElement>(null), pop: useRef<HTMLDivElement>(null), notch: useRef<SVGSVGElement>(null),
    card: useRef<HTMLDivElement>(null), grad: useRef<HTMLDivElement>(null), shine: useRef<HTMLDivElement>(null),
    inner: useRef<HTMLDivElement>(null), wm: useRef<HTMLSpanElement>(null), label: useRef<HTMLParagraphElement>(null),
    nn: useRef<HTMLButtonElement>(null), sb: useRef<HTMLButtonElement>(null),
    search: useRef<HTMLDivElement>(null), tile: useRef<HTMLButtonElement>(null), ring: useRef<HTMLSpanElement>(null),
  };

  useEffect(() => {
    const from = cur.current, to = state;
    if (from === to) return;
    cur.current = to;
    ch.cancel();
    const spr = (k: K) => (entering.current && ENTRANCE[k]) || SPRINGS[k];
    entering.current = to === "A" && (from === "P" || from === "C");
    sheenStart.current = entering.current && !ch.reduced ? performance.now() + (SHEEN.at * R / 0.52) * 1000 : null;

    if (to === "C" && from === "A") {
      // Recede as one layer toward the pointer; the layout gives the space back.
      ch.to({ dm: 1, lay: 1 }, { lay: 0.07 }, spr);
      // Then, invisibly, fold the tooltip away and park the tile in the slot —
      // and bring the glyph in beside a bar that makes room for it.
      ch.later(0.3, () => {
        ch.snap({ geo: 1, uf: 0, drop: 0, nt: 0, ic: 1, iv: 0, dm: 0, ...HIDDEN_COPY });
        ch.to({ sx: 0, swd: BTNX - GAP, iv: 1 }, { iv: 0.08 }, (k) => (k === "iv" ? SPR.pop : SPRINGS[k]));
      });
      return;
    }
    if (from === "P" && to === "C") {
      // Back in English: the bar makes room and the glyph pops into its slot.
      ch.snap({ ic: 1, iv: 0 });
      ch.to({ sx: 0, swd: BTNX - GAP, iv: 1 }, { iv: 0.12 }, (k) => (k === "iv" ? SPR.pop : SPRINGS[k]));
      return;
    }
    if (entering.current) {
      // The card is hidden inside the bar: reshape it into a sliver under the pointer.
      ch.snap({ geo: 0, uf: 0, drop: 0, nt: 0, dm: 0, ic: 0, iv: 0 });
    } else if (to !== "C" && ch.values.iv.get() < 0.05) {
      ch.snap({ ic: STATES[to].ic ?? 0 });
    }
    ch.to(STATES[to], PLANS[from + to] ?? {}, spr);
  }, [state, ch]);

  const apply = () => {
    const v = ch.read();
    const g = v.geo;
    const uX = lerp(NOTCH.tip - NOTCH.w / 2, 0, v.uf), uW = Math.max(1, lerp(NOTCH.w, W, v.uf)), uH = Math.max(1, lerp(3, CARD.h, v.drop));
    const cardX = lerp(uX, v.sx, g), cardY = lerp(CARD.y, 0, g), cardW = Math.max(1, lerp(uW, v.swd, g)), cardH = Math.max(1, lerp(uH, SH, g));
    const cardR = Math.min(lerp(CARD.r, 12, clamp(g)), cardH / 2, cardW / 2);
    const grow = v.ic <= 0 ? 0 : v.ic >= 1 ? 1 : ease(clamp((v.ic - 0.8) / 0.2));
    const [tx, ty] = pathAt(v.ic);
    const pop = lerp(entering.current ? 0.4 : 0.55, 1, v.iv);
    const ts = lerp(TILE.A.s, TILE.B.s, grow) * pop, tr = lerp(TILE.A.r, TILE.B.r, grow) * pop;
    const iv = clamp(v.iv), dm = clamp(v.dm);
    const stageH = lerp(STAGE_A, STAGE_B, v.lay);
    const tileBottom = (ty + ts / 2) * clamp(v.iv * 1.5) * (1 - dm);

    const s = (el: HTMLElement | SVGElement | null, css: Record<string, string>) => { if (el) Object.assign(el.style, css); };

    s(r.card.current, { transform: `translate(${cardX}px, ${cardY}px)`, width: `${cardW}px`, height: `${cardH}px`, borderRadius: `${cardR}px`, opacity: String(clamp(v.nt * 2)) });
    s(r.grad.current, { opacity: String(clamp(1 - g * 1.3)) });
    s(r.inner.current, { transform: `translate(${-cardX}px, ${-cardY}px)` });
    s(r.notch.current, {
      opacity: String(clamp(v.nt * 1.5) * clamp(1 - g * 2.2)),
      transform: `translate(${NOTCH.tip - NOTCH.w / 2}px, ${cardY - NOTCH.h + lerp(-12, 0, v.nt)}px) scale(${Math.max(0, lerp(0.5, 1, v.nt))}, ${Math.max(0, v.nt)})`,
    });
    s(r.search.current, { transform: `translate(${v.sx}px, 0px)`, width: `${v.swd}px` });

    const lift = Math.sin(Math.PI * clamp(v.ic));
    s(r.tile.current, {
      transform: `translate(${tx - ts / 2}px, ${ty - ts / 2}px)`, width: `${ts}px`, height: `${ts}px`, borderRadius: `${tr}px`,
      opacity: String(iv), filter: iv < 0.999 ? `blur(${(1 - iv) * 4}px)` : "none",
      boxShadow: `0 ${2 + lift * 8}px ${lift * 20}px rgba(24, 36, 72, ${lift * 0.14})`,
      pointerEvents: cur.current !== "A" && v.ic > 0.6 && iv > 0.6 ? "auto" : "none",
    });
    s(r.ring.current, { opacity: String(clamp((v.ic - 0.4) / 0.5)) });

    // One layer receding toward the pointer (dismiss).
    s(r.pop.current, dm > 0.0005
      ? { opacity: String(clamp(1 - dm * 1.1)), transform: `translateY(${-6 * dm}px) scale(${lerp(1, 0.94, dm)})`, filter: `blur(${dm * 3}px)` }
      : { opacity: "", transform: "", filter: "" });

    // Copy: forms on arrival, clears on collapse.
    const look = (el: HTMLElement | null, o: number, blur: number, tx2: number, ty2: number, sx = 1, sy = sx) => {
      if (!el) return;
      el.style.opacity = String(o); el.style.filter = blur > 0.05 ? `blur(${blur}px)` : "none";
      el.style.transform = `translate(${tx2}px, ${ty2}px) scale(${sx}, ${sy})`;
    };
    const words = r.label.current ? [...r.label.current.querySelectorAll<HTMLElement>("span")] : [];
    if (entering.current) {
      look(r.label.current, 1, 0, 0, 0);
      const e = 1 - v.txt, step = 0.13, span = 1 - step * (words.length - 1);
      words.forEach((w, i) => { const p = clamp((e - i * step) / span), q = 1 - p; look(w, clamp(p * 1.3), q * 4, 0, q * 9); });
      for (const [el, c] of [[r.nn.current, v.nn], [r.sb.current, v.sb]] as const) {
        if (!el) continue;
        look(el, 1, 0, 0, 0);
        const e2 = 1 - c, sx = Math.max(0, e2), l = clamp((e2 - 0.35) / 0.65);
        look(el.querySelector(".pill-surface"), clamp(e2 * 1.8), 0, 0, 0, lerp(0.72, 1, sx), lerp(0.6, 1, sx));
        look(el.querySelector(".pill-label"), l, (1 - l) * 3, 0, (1 - l) * 5);
        el.style.pointerEvents = e2 > 0.5 ? "auto" : "none";
      }
      const w2 = 1 - v.wm;
      if (r.wm.current) { r.wm.current.style.opacity = String(0.1 * clamp(w2)); r.wm.current.style.transform = `scale(${lerp(1.12, 1, w2)})`; }
    } else {
      words.forEach((w) => look(w, 1, 0, 0, 0));
      const exit = (el: HTMLElement | null, c: number, drift: number) => {
        if (!el) return;
        look(el, clamp(1 - c * 1.15), clamp(c) * 7, c * drift, -c * 10, 1 - clamp(c) * 0.06);
        el.style.pointerEvents = c > 0.5 ? "none" : "auto";
        el.querySelectorAll<HTMLElement>(".pill-surface, .pill-label").forEach((n) => look(n, 1, 0, 0, 0));
      };
      exit(r.label.current, v.txt, 18); exit(r.nn.current, v.nn, 12); exit(r.sb.current, v.sb, 8);
      if (r.wm.current) { r.wm.current.style.opacity = String(0.1 * clamp(1 - v.wm)); r.wm.current.style.transform = `translate(${v.wm * 30}px, ${-v.wm * 14}px) rotate(${-v.wm * 8}deg)`; }
    }

    // Slow, soft band of light across the card's background — arrival only, once.
    const t0 = sheenStart.current;
    const sp = t0 === null ? -1 : (performance.now() - t0) / (SHEEN.dur * R / 0.52 * 1000);
    if (sp >= 0 && sp <= 1) {
      const x = lerp(-240, W + 80, (1 - Math.cos(Math.PI * sp)) / 2);
      s(r.shine.current, { opacity: String(Math.pow(Math.sin(Math.PI * sp), 0.8) * 0.6), transform: `translateX(${x - 130 - cardX}px) skewX(-16deg)` });
    } else {
      s(r.shine.current, { opacity: "0" });
      if (sp > 1) sheenStart.current = null;
    }

    const held = Math.max(stageH, lerp(cardY + cardH, 0, dm), tileBottom);
    s(r.header.current, { height: `${STAGE_Y + held + PAD_B}px` });
    onHeight?.(STAGE_Y + Math.max(stageH, tileBottom) + PAD_B);
  };

  useLayoutEffect(apply);
  useAnimationFrame(apply);

  const tileIcon = useMemo(() => <Icon name="system-language-bold" size={20} />, []);

  return (
    <header className="plp-header tt-header" ref={r.header}>
      <div className="tt-stage" style={{ left: STAGE_X, top: STAGE_Y, width: W }}>
        <div className="tt-pop" ref={r.pop}>
          <svg className="tt-notch" ref={r.notch} width={NOTCH.w} height={NOTCH.h} viewBox="0 0 18 7" aria-hidden="true">
            <path d="M0 7 C5 7 6.8 0.6 9 0.6 C11.2 0.6 13 7 18 7 Z" />
          </svg>
          <div className="tt-card" ref={r.card}>
            <div className="nudge-grad" ref={r.grad} />
            <div className="tt-shine" ref={r.shine} />
            <div className="tt-inner" ref={r.inner}>
              <span className="tt-watermark" ref={r.wm}><Icon name="system-language-bold" size={56} /></span>
              <div className="tt-row">
                <span className="tt-tile-slot" />
                <p className="nudge-label tt-label" ref={r.label}>
                  {WORDS.map((w, i) => (
                    <span key={i} lang={i === WORDS.length - 1 ? "ar" : undefined}>
                      {i === WORDS.length - 1 ? <><bdi>{w}</bdi>?</> : `${w} `}
                    </span>
                  ))}
                </p>
                <div className="nudge-actions">
                  <button className="btn-neutral btn-neutral--quiet" ref={r.nn} onClick={onDismiss}>
                    <span className="pill-surface" /><span className="pill-label">{nudge.dismiss}</span>
                  </button>
                  <button className="btn-neutral btn-neutral--bold" ref={r.sb} onClick={onSwitch}>
                    <span className="pill-surface" /><span className="pill-label">{nudge.action}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button className="tt-tile" ref={r.tile} onClick={onSwitch} aria-label={nudge.label}>
            <span className="tt-tile-ring" ref={r.ring} />
            {tileIcon}
          </button>
        </div>
        <div className="tt-search" ref={r.search}>
          <SearchBar query={QUERY} back />
        </div>
      </div>
    </header>
  );
}
