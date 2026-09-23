import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useCollapseStyle } from "../flow/collapseStyle";
import { useAnimationFrame } from "motion/react";

import { SearchBar } from "./SearchBar";
import { Icon } from "../icons/Icon";
import { traceFrame } from "../motion/trace";
import { QUERY, nudge } from "../data/copy";
import { useNudgeMotion } from "../motion/useNudgeMotion";
import {
  BASE, SHEEN, exitLook, makeGeom, pillLooks, sheenAt, watermarkEnter, watermarkExit, wordLooks,
  type Layout, type StateId,
} from "../motion/nudge-core";

/**
 * The language nudge, with the handoff's motion (`nudge-motion-handoff/SPEC.md`).
 *
 * Roles per SPEC §2: `container` is the pale card and clips; `search` sits
 * above it; ONE `icon` lives outside the clip and travels the Bézier between
 * the nudge row and the collapsed button; `buttonSurface` is a bare square the
 * icon lands on. The visual design is untouched — every resting style is the
 * same as before, and only geometry and opacity are animated.
 *
 * Measured from node 303:26898, not from the handoff's 526pt frame.
 */
const LAYOUT: Layout = {
  width: 351,
  searchInset: 10,
  searchTop: 10,
  searchTopB: 0,
  searchH: 44,
  gap: 8,
  cardH: 108,
  collapsedH: 44,
  haloH: 64,
  iconA: { x: 26, y: 82 },
  iconSizeA: 20,
  iconSizeB: 20,
  radii: { card: 16, searchA: 12, searchB: 12 },
};

/** Stage origin inside the header: 42.57 status bar + the frame's 8pt inset. */
const STAGE_Y = 50.57;
const STAGE_X = 12;
/** Our collapsed frame has asymmetric insets — 4 below the card open, 14 shut. */
const PAD_B = { open: 4, shut: 14 };

const WORDS = nudge.label.split(" ");
/** Our watermark rests at 0.1, not the handoff's 0.75. Its curves are kept;
 *  only the amplitude is scaled, so the design is unchanged. */
const WM_REST = 1; // the Figma glyph (303:13394) carries its own white radial fade
const NEUTRAL = { opacity: 1, blur: 0, tx: 0, ty: 0, sx: 1, sy: 1 };

type Props = {
  state: StateId;
  onSwitch: () => void;
  onDismiss: () => void;
  /** Header height in px, so the scroller's inset can follow it. */
  onHeight?: (h: number) => void;
};

/**
 * Dev-only recorder for the acceptance checks in SPEC §9. It samples inside the
 * component's own frame loop, so the numbers are frame-accurate even when an
 * external polling loop is being throttled.
 */
function record(g: ReturnType<ReturnType<typeof makeGeom>>, v: { iv: number; lay: number; drop: number }) {
  const w = window as unknown as { __nudgeAC?: Record<string, number> };
  const a = (w.__nudgeAC ??= { iconClearance: Infinity, entranceOverhang: -Infinity, layMin: Infinity, layMax: -Infinity });
  const i = { x: g.icon.cx - g.icon.size / 2, y: g.icon.cy - g.icon.size / 2, w: g.icon.size, h: g.icon.size };
  // §9.1 — icon vs search field, any time
  a.iconClearance = Math.min(a.iconClearance, Math.max(
    g.search.x - (i.x + i.w), i.x - (g.search.x + g.search.w),
    g.search.y - (i.y + i.h), i.y - (g.search.y + LAYOUT.searchH),
  ));
  // §9.2 — icon inside the card while it is visible
  if (v.iv > 0.25) {
    const over = Math.max(
      g.card.x - i.x, g.card.y - i.y,
      (i.x + i.w) - (g.card.x + g.card.w), (i.y + i.h) - (g.card.y + g.card.h),
    );
    if (over > a.entranceOverhang) {
      a.entranceOverhang = over;
      (a as Record<string, number>).atIv = v.iv;
      (a as Record<string, number>).atDrop = (v as unknown as { drop: number }).drop;
      (a as Record<string, number>).atCardH = g.card.h;
      (a as Record<string, number>).atIconBottom = i.y + i.h;
    }
  }
  // §9.3 — `lay` must not overshoot
  a.layMin = Math.min(a.layMin, v.lay);
  a.layMax = Math.max(a.layMax, v.lay);
}

export function NudgeHeader({ state, onSwitch, onDismiss, onHeight }: Props) {
  const m = useNudgeMotion(LAYOUT, state);
  const geom = useMemo(() => makeGeom(LAYOUT), []);

  const header = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const grad = useRef<HTMLDivElement>(null);
  const tint = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const halftone = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLDivElement>(null);
  const icon = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const watermark = useRef<HTMLSpanElement>(null);
  const prompt = useRef<HTMLParagraphElement>(null);
  const notNow = useRef<HTMLButtonElement>(null);
  const switchBtn = useRef<HTMLButtonElement>(null);
  const rim = useRef<HTMLDivElement>(null);
  const glint = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLDivElement>(null);
  const showProbe = useMemo(() => new URLSearchParams(location.search).has("ac"), []);

  // Recede is composed from states this header already has, not new motion.
  // P (the bar alone, full width) is the spec's buttonless dismissed state:
  //   out  A → P → B|C  the nudge disappears into the bar, then the bar makes
  //                     room and the glyph comes in at its side;
  //   back B → P → A    the glyph goes and the bar takes its space, then the
  //                     nudge blooms back on the arrival entrance.
  // Holds leave the icon invisible (iv < .05) at each hand-over, so the
  // pre-snaps that move it between the row and the slot are never seen.
  const style = useCollapseStyle();
  const last = useRef<StateId>(state);
  const seq = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    const from = last.current;
    // `m` is a fresh object every render and this header re-renders mid-motion
    // (it reports its height as it changes), so the effect re-runs with the same
    // state. The old one-liner shrugged that off — go() is a no-op to the
    // current state — but a timed sequence is not, and a re-run jumped straight
    // to the last step before the icon had faded. Only a real change counts.
    if (from === state) return;
    clearTimeout(seq.current);
    last.current = state;
    const hold = (sec: number) => (sec * BASE.response / 0.52) * 1000;
    if (style === "recede" && from === "A" && (state === "B" || state === "C")) {
      m.go("P");
      seq.current = setTimeout(() => m.go(state), hold(0.3));
      return;
    }
    if (style === "recede" && from === "B" && state === "A") {
      m.go("P");
      // P rests the glyph back in the row, so going there would slide it along
      // its path as it fades. Pin it to the slot instead: it goes out where it
      // sits, and the arrival's pre-snap moves it while it is invisible.
      m.values.ic.jump(m.values.ic.get());
      seq.current = setTimeout(() => {
        m.go("A");
        m.sheenStart.current = null; // the shimmer is the first arrival's, once
      }, hold(0.28));
      return;
    }
    m.go(state);
  }, [state, m, style]);
  useEffect(() => () => clearTimeout(seq.current), []);

  const apply = useCallback(() => {
    const v = m.read();
    traceFrame("inline", v);
    const g = geom(v, m.entering.current);

    const el = (r: React.RefObject<HTMLElement | null>) => r.current;
    const put = (r: React.RefObject<HTMLElement | null>, css: Partial<CSSStyleDeclaration>) => {
      const n = el(r); if (!n) return;
      Object.assign(n.style, css);
    };

    put(card, {
      transform: `translate(${g.card.x}px, ${g.card.y}px)`,
      width: `${g.card.w}px`, height: `${g.card.h}px`,
      borderRadius: `${g.card.radius}px`,
    });
    put(grad, { opacity: String(g.card.gradientOpacity) });
    // Children stay put in header space; the clip reveals and hides them.
    put(inner, { transform: `translate(${g.contentCounterOffset.x}px, ${g.contentCounterOffset.y}px)` });
    // The halftone stays put in header space like the content, but lives on the
    // card's own layer so its linear-dodge blends with the card's gradient.
    put(halftone, { transform: `translate(${g.contentCounterOffset.x}px, ${g.contentCounterOffset.y}px)`, opacity: String(0.3 * g.card.gradientOpacity) });

    put(search, {
      transform: `translate(${g.search.x}px, ${g.search.y}px)`,
      width: `${g.search.w}px`, height: `${LAYOUT.searchH}px`,
      borderRadius: `${g.search.radius}px`,
      borderColor: `rgba(234, 236, 240, ${g.search.borderOpacity})`,
    });

    put(icon, {
      transform: `translate(${g.icon.cx - g.icon.size / 2}px, ${g.icon.cy - g.icon.size / 2}px)`,
      width: `${g.icon.size}px`, height: `${g.icon.size}px`,
      opacity: String(g.icon.opacity),
      filter: g.icon.blur > 0.05 ? `blur(${g.icon.blur}px)` : "none",
    });

    put(button, {
      transform: `translate(${g.button.x}px, ${g.button.y}px) scale(${g.button.scale})`,
      width: `${g.button.size}px`, height: `${g.button.size}px`,
      opacity: String(g.button.opacity),
      pointerEvents: g.button.interactive ? "auto" : "none",
    });

    const look = (n: HTMLElement | null, l: { opacity: number; blur: number; tx: number; ty: number; sx: number; sy: number }) => {
      if (!n) return;
      n.style.opacity = String(l.opacity);
      n.style.filter = l.blur > 0.05 ? `blur(${l.blur}px)` : "none";
      n.style.transform = `translate(${l.tx}px, ${l.ty}px) scale(${l.sx}, ${l.sy})`;
    };

    if (m.entering.current) {
      // The entrance styles the words and pill parts, so their CONTAINERS must
      // be reset — otherwise they keep the hidden styling the exit branch wrote
      // while the component was still in C, and never come back.
      look(prompt.current, NEUTRAL);
      look(notNow.current, NEUTRAL);
      look(switchBtn.current, NEUTRAL);

      // Entrance: words rise one by one, then each pill forms before its label.
      const looks = wordLooks(v.txt, WORDS.length);
      prompt.current?.querySelectorAll<HTMLElement>("span").forEach((w, i) => look(w, looks[i]));
      for (const [ref, ch] of [[notNow, v.nn], [switchBtn, v.sb]] as const) {
        const pl = pillLooks(ch);
        const n = ref.current; if (!n) continue;
        look(n.querySelector(".pill-surface"), pl.surface);
        look(n.querySelector(".pill-label"), pl.label);
        n.style.pointerEvents = pl.interactive ? "auto" : "none";
      }
      const w = watermarkEnter(v.wm);
      put(watermark, { opacity: String(w.opacity * (WM_REST / 0.75)), transform: `scale(${w.scale})` });
    } else {
      look(prompt.current, exitLook(v.txt, 18));
      prompt.current?.querySelectorAll<HTMLElement>("span").forEach((w) => {
        w.style.opacity = "1"; w.style.filter = "none"; w.style.transform = "none";
      });
      for (const [ref, ch, drift] of [[notNow, v.nn, 12], [switchBtn, v.sb, 8]] as const) {
        const n = ref.current; if (!n) continue;
        look(n, exitLook(ch, drift));
        n.style.pointerEvents = ch > 0.5 ? "none" : "auto";
        const s = n.querySelector<HTMLElement>(".pill-surface");
        const l = n.querySelector<HTMLElement>(".pill-label");
        if (s) { s.style.opacity = "1"; s.style.transform = "none"; }
        if (l) { l.style.opacity = "1"; l.style.filter = "none"; l.style.transform = "none"; }
      }
      const w = watermarkExit(v.wm);
      put(watermark, {
        opacity: String(w.opacity * (WM_REST / 0.75)),
        transform: `translate(${w.tx}px, ${w.ty}px) rotate(${w.rotateDeg}deg)`,
      });
    }

    // Two different heights, on purpose (SPEC §3, §6.1 step 4):
    //  · the header ELEMENT follows `headerH`, which includes the card's
    //    entrance bloom, so the white backdrop always covers it;
    //  · the content BELOW follows `lay` alone, which is critically damped, so
    //    it never overshoots (AC3). Wiring the scroller to the header height
    //    instead made the whole page bounce 5px past its resting inset.
    const padB = PAD_B.open + (PAD_B.shut - PAD_B.open) * Math.min(1, Math.max(0, v.lay));
    put(header, { height: `${STAGE_Y + g.headerH + padB}px` });
    onHeight?.(STAGE_Y + (g.belowOffsetY + LAYOUT.cardH) + padB);

    // Shimmer — entrance only, once (SPEC §6.2).
    const t0 = m.sheenStart.current;
    const s = t0 === null ? null : sheenAt((performance.now() - t0) / 1000, LAYOUT, 292, BASE.response);
    if (!s) {
      put(rim, { opacity: "0" }); put(tint, { opacity: "0" }); put(glint, { opacity: "0" });
      if (t0 !== null && (performance.now() - t0) / 1000 > (SHEEN.startAfter + SHEEN.duration) * 1.1) {
        m.sheenStart.current = null;
      }
    } else {
      const bg = (cx: number, w: number, h: number, stops: string) =>
        `radial-gradient(${w}px ${h}px at ${cx}px ${stops}`;
      put(rim, {
        opacity: String(s.opacity),
        background: bg(s.x, 200, 150, "35%, rgba(92,134,255,.95) 0%, rgba(150,120,255,.55) 38%, rgba(120,200,255,0) 72%)"),
      });
      put(tint, {
        opacity: String(s.opacity),
        background: bg(s.x, 220, 170, "40%, rgba(98,138,255,.13) 0%, rgba(140,120,255,.06) 45%, transparent 72%)"),
      });
      put(glint, { opacity: String(s.glintOpacity), transform: `translateX(${s.x - 292}px) skewX(-20deg)` });
    }

    if (import.meta.env.DEV) {
      record(g, v);
      // Printed into the DOM so a headless capture can read it; the browser
      // pane throttles rAF hard enough that polling from outside lies.
      const w = window as unknown as { __nudgeAC?: Record<string, number> };
      const a = w.__nudgeAC;
      if (a && probe.current) {
        const r2 = (x: number) => Math.round(x * 100) / 100;
        probe.current.textContent =
          `AC1 clearance ${r2(a.iconClearance)} (need >=2) | ` +
          `AC2 overhang ${r2(a.entranceOverhang)} (need <=0) | ` +
          `AC3 lay [${r2(a.layMin)}, ${r2(a.layMax)}] (need [0,1])`;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write geometry before the first paint. Without this the card renders at
  // 0 × 0 and the icon at its CSS default opacity for one frame.
  useLayoutEffect(apply, [apply]);
  useAnimationFrame(apply);

  return (
    <header className="plp-header" ref={header}>
      <div className="nudge-stage" style={{ left: STAGE_X, top: STAGE_Y, width: LAYOUT.width }}>
        <div className="nudge-card" ref={card}>
          <div className="nudge-grad" ref={grad} />
          <div className="nudge-halftone" ref={halftone} aria-hidden="true" />
          <div className="nudge-tint" ref={tint} />
          <div className="nudge-inner" ref={inner}>
            <span className="nudge-watermark" ref={watermark}>
              <img src="/img/nudge/watermark.svg" width={160} height={104} alt="" />
            </span>
            <div className="nudge-row">
              <span className="nudge-icon-slot" />
              <p className="nudge-label" ref={prompt}>
                {WORDS.map((w, i) => <span key={i}>{w}{i < WORDS.length - 1 ? " " : ""}</span>)}
              </p>
              <div className="nudge-actions">
                <button className="btn-neutral btn-neutral--quiet" ref={notNow} onClick={onDismiss}>
                  <span className="pill-surface" />
                  <span className="pill-label">{nudge.dismiss}</span>
                </button>
                <button className="btn-neutral btn-neutral--bold" ref={switchBtn} onClick={onSwitch}>
                  <span className="pill-surface" />
                  <span className="pill-label">{nudge.action}</span>
                  <span className="pill-glint" ref={glint} />
                </button>
              </div>
            </div>
          </div>
          <div className="nudge-rim" ref={rim} />
        </div>

        <div className="nudge-search" ref={search}>
          <SearchBar query={QUERY} back bare />
        </div>

        <button className="nudge-button" ref={button} onClick={onSwitch} aria-label={nudge.label} />
        <span className="nudge-icon" ref={icon} aria-hidden="true">
          <Icon name="system-language-bold" size={20} />
        </span>
      </div>
      {showProbe ? <div className="ac-probe" ref={probe} /> : null}
    </header>
  );
}
