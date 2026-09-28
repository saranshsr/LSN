import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useAnimationFrame } from "motion/react";

import { SearchBar } from "./SearchBar";
import { Icon } from "../icons/Icon";
import { spring } from "../motion/springs";
import type { Locale } from "../data/copy";
import { NUDGE, useButtonStyle, useTextStyle, type Store } from "../flow/v5";
import { HOLD_MS as SENTENCE_HOLD, useTextMorph } from "../motion/useTextMorph";
import { useChannels } from "../motion/useChannels";
import { useCtaMorph } from "../motion/useCtaMorph";
import { traceFrame, traceStart } from "../motion/trace";
import type { StateId } from "../motion/nudge-core";

/**
 * The tooltip layout — the pale card hangs under the search bar off a small
 * pointer — with the motion from its prototype, fitted to the 351pt header:
 *
 *   P → A  arrival: the pointer slips out from under the bar, the card unfolds
 *          from it (a sliver spreads, then drops open), the icon tile pops, the
 *          words rise one by one, the pills form, and one slow, soft band of
 *          light passes over the card's background.
 *   A → B  collapse (scroll): the banner morphs back into the bar it came
 *          out of and dissolves as it goes — the card rises, carrying its
 *          glyph, copy and buttons, reshaping into the bar's 351 × 44 while the
 *          whole layer fades out under a light blur; the results close up in
 *          the same spring. Scrolling back reverses it.
 *   A → C  dismiss: the whole tooltip recedes toward its pointer as one layer.
 *          The glyph survives (the product's dismiss ≠ never), so the bar then
 *          makes room and the glyph pops in beside it.
 *
 * The tile never leaves the header area, so nothing is drawn over the results.
 */
import {
  W, NOTCH, CARD, R, STAGE_Y, STAGE_X, PAD_B, clamp, lerp,
  SPRINGS, ENTRANCE, HIDDEN_COPY, STATES, PLANS, SHEEN, tooltipGeom, type K,
} from "../motion/tooltip-core";
// Flow v2 (Figma 382:136974): the tooltip now says the same line as the
// attached nudge — its own "Want noon in العربية?" copy is gone.

type Props = {
  state: StateId;
  /** The app's language. The Arabic app draws the same banner mirrored
   *  (Nudge banner 528:26664, Language=Arabic app). */
  locale: Locale;
  query: string;
  /** noon, or super mall — whose results bar sits a little higher, with
   *  the banner 11 pt under it (SM1 · 03, 678:85896). */
  store?: Store;
  onSwitch: () => void; onDismiss: () => void; onHeight?: (h: number) => void;
};

/** Where each header's bar sits, and what it leaves below.
 *  noon (A1 · 03): the stage at 50.57, 14 of white under it either way.
 *  super mall (SM1 · 03 / 04): the bar at y49, the card at y104, the chips at
 *  157 open and 105 shut. The stage sits 3 higher and the bar 3 lower inside
 *  it, so the card lands on 104 without changing the shared motion core. */
const GEO = {
  noon: { stageY: STAGE_Y, searchTop: 0, padOpen: PAD_B, padShut: PAD_B },
  sm: { stageY: 46, searchTop: 3, padOpen: 5, padShut: 15 },
};

export function TooltipHeader({ state, locale, query, store = "noon", onSwitch, onDismiss, onHeight }: Props) {
  const geo = GEO[store];
  const bar = store === "sm" ? "title" : "search";
  const style = useTextStyle();
  const whole = style === "whole";
  // The flip: the whole banner starts in the app's language and turns into the
  // offered one — sentence and button on the same frame.
  const flip = style === "flip";
  const buttons = useButtonStyle();
  const yesno = flip && buttons === "yesno";
  const tm = useTextMorph(whole || flip);
  const geoRef = useRef(geo); geoRef.current = geo;
  const copy = NUDGE[locale];
  const WORDS = copy.words;
  // Mirrored, the geometry is reflected about the stage's centre line — every
  // x this component writes goes through `mx` — and the row itself is laid
  // out right-to-left by the device's dir. Nothing is flipped with a
  // transform, so text and icons read the right way round.
  const mirror = locale === "ar";
  const mirrorRef = useRef(mirror); mirrorRef.current = mirror;
  const ch = useChannels<K>({ ...STATES.P, ic: 0 } as Record<K, number>);
  const cta = useCtaMorph(locale, !whole, flip ? { hold: SENTENCE_HOLD, ...(yesno ? { ...copy.yes, gloss: copy.yes.to.text, pillClass: "btn-neutral btn-neutral--bold btn-neutral--pair" } : {}) } : {});
  // Yes / No: the No pill turns with it (it stands where the ✕ was).
  const ctaNo = useCtaMorph(locale, yesno, { ...copy.no, gloss: copy.no.to.text, hold: SENTENCE_HOLD, pillClass: "btn-neutral btn-neutral--quiet btn-neutral--text btn-neutral--pair" });
  const cur = useRef<StateId>("P");
  const entering = useRef(false);
  const sheenStart = useRef<number | null>(null);

  const r = {
    header: useRef<HTMLElement>(null), pop: useRef<HTMLDivElement>(null), notch: useRef<SVGSVGElement>(null),
    card: useRef<HTMLDivElement>(null), grad: useRef<HTMLDivElement>(null), shine: useRef<HTMLDivElement>(null),
    inner: useRef<HTMLDivElement>(null), ht: useRef<HTMLDivElement>(null), wm: useRef<HTMLImageElement>(null), label: useRef<HTMLParagraphElement>(null),
    nn: useRef<HTMLButtonElement>(null), sb: useRef<HTMLButtonElement>(null),
    search: useRef<HTMLDivElement>(null), tile: useRef<HTMLButtonElement>(null), ring: useRef<HTMLSpanElement>(null),
  };

  const arrived = useRef(false);
  /** super mall: the banner last left by morphing into the title bar (scroll),
   *  so it comes back by morphing out of it rather than unfolding afresh. */
  const morphed = useRef(false);
  /** The banner is travelling into (or out of) the bar: its contents ride
   *  with the card instead of staying pinned while the card wipes over them. */
  const riding = useRef(false);
  const barRef = useRef(bar); barRef.current = bar;
  useEffect(() => {
    // Flow v2 (382:79086): no glyph. B (scrolled) and C (✕) both rest as P, the
    // bar alone and full width — the attached nudge does the same.
    const to: StateId = state === "B" || state === "C" ? "P" : state;
    const from = cur.current;
    if (from === to) return;
    cur.current = to;
    if (from === "A") { cta.leave(); ctaNo.leave(); tm.leave(); }
    traceStart("tooltip", from, to);
    ch.cancel();
    const spr = (k: K) => (entering.current && ENTRANCE[k]) || SPRINGS[k];
    entering.current = to === "A" && (from === "P" || from === "C");
    // The shimmer belongs to the first arrival only; scrolling back replays the
    // entrance without it.
    sheenStart.current = entering.current && !ch.reduced && !arrived.current ? performance.now() + (SHEEN.at * R / 0.52) * 1000 : null;
    if (entering.current) { arrived.current = true; cta.arrive(); ctaNo.arrive(); }

    // Scrolled away (B, not ✕) — both stores: the banner doesn't recede — it
    // tucks back into the bar. The copy clears, then the card itself slides up and
    // reshapes from 351 × 48 into the title bar's 351 × 44 while its tint
    // dissolves; the back arrow, title and search stay drawn above it, and the
    // results close up under it in the same motion.
    // noon took the recede before (28 Sep: "it just fades unclearly"); it
    // now retracts the way it arrived, like super mall.
    const morph = true;
    if (morph && from === "A" && to === "P" && state === "B") {
      morphed.current = true; riding.current = true;
      // The copy lets go a beat before the card moves, so it reads as tucked
      // away rather than smeared; the glyph goes last, with the card.
      ch.to(
        { ...HIDDEN_COPY, geo: 1, uf: 1, drop: 1, nt: 1, iv: 0, ic: 0, dm: 0, lay: 1 },
        { txt: 0, nn: 0.02, sb: 0.04, wm: 0, iv: 0.08, geo: 0.06, lay: 0.06 },
        (k) => (k === "geo" ? spring(1.05, 1) : k === "lay" ? spring(1.05, 1) : k === "iv" ? spring(0.8, 1) : SPRINGS[k]),
      );
      return;
    }
    if (morph && entering.current && morphed.current) {
      // Back up: the reverse — the title bar lets the card go, it drops and
      // reshapes into the banner as its tint returns, then the copy forms.
      morphed.current = false; riding.current = true;
      ch.to(STATES.A, { geo: 0, lay: 0, nt: 0, iv: 0.22, wm: 0.2, txt: 0.24, nn: 0.3, sb: 0.36 },
        (k) => (k === "geo" ? spring(1.05, 1) : k === "lay" ? spring(1.1, 1) : spr(k)));
      return;
    }
    morphed.current = false; riding.current = false;

    if (from === "A" && to === "P") {
      // Out: step back as one layer toward the pointer while the layout gives the
      // space back, then fold the tooltip away unseen. The bar is already full
      // width, so nothing else moves.
      // The recede and the closing space run as ONE motion: same response, no
      // stagger, so the tooltip is folding away while the results come up under
      // it rather than vanishing first and leaving a gap to close.
      ch.to({ dm: 1, lay: 1 }, {}, (k) => (k === "dm" || k === "lay" ? spring(0.95, 1) : spr(k)));
      // Then tidy up what is already invisible. NOT lay/sx/swd: lay is still
      // mid-flight here, and snapping it jumped the results 22px in one frame.
      ch.later(0.45, () => ch.snap({ geo: 1, uf: 0, drop: 0, nt: 0, ic: 0, iv: 0, dm: 0, ...HIDDEN_COPY }));
      return;
    }
    if (entering.current) {
      // The card is hidden inside the bar: reshape it into a sliver under the pointer.
      ch.snap({ geo: 0, uf: 0, drop: 0, nt: 0, dm: 0, ic: 0, iv: 0 });
    } else if (ch.values.iv.get() < 0.05) {
      ch.snap({ ic: STATES[to].ic ?? 0 });
    }
    ch.to(STATES[to], PLANS[from + to] ?? {}, spr);
  }, [state, ch]);

  const apply = () => {
    const v = ch.read();
    traceFrame("tooltip", v);
    const { g, cardX, cardY, cardW, cardH, cardR, tx, ty, ts, tr, iv, dm, stageH, tileBottom } = tooltipGeom(v, entering.current);

    const s = (el: HTMLElement | SVGElement | null, css: Record<string, string>) => { if (el) Object.assign(el.style, css); };
    const M = mirrorRef.current;
    /** An x for a box of width w, reflected when mirrored. */
    const mx = (x: number, w = 0) => (M ? W - x - w : x);
    const cx = mx(cardX, cardW);

    s(r.card.current, { transform: `translate(${cx}px, ${cardY}px)`, width: `${cardW}px`, height: `${cardH}px`, borderRadius: `${cardR}px`, opacity: String(clamp(v.nt * 2)) });
    // Riding, the layer's own dissolve carries the tint away; the card itself
    // stays pale so its travel reads as one shape morphing into the bar.
    const tint = riding.current ? 1 : clamp(1 - g * 1.3);
    s(r.grad.current, { opacity: String(tint) });
    // Riding: the contents keep their place in the CARD, so they travel with it.
    const innerY = riding.current ? -CARD.y : -cardY, rise = riding.current ? cardY - CARD.y : 0;
    s(r.inner.current, { transform: `translate(${-cx}px, ${innerY}px)` });
    s(r.ht.current, { transform: `translate(${-cx}px, ${innerY}px)${M ? " scaleX(-1)" : ""}`, opacity: String(tint) });
    s(r.notch.current, {
      opacity: String(clamp(v.nt * 1.5) * clamp(1 - g * 2.2)),
      transform: `translate(${mx(NOTCH.tip - NOTCH.w / 2, NOTCH.w)}px, ${cardY - NOTCH.h + lerp(-12, 0, v.nt)}px) scale(${Math.max(0, lerp(0.5, 1, v.nt))}, ${Math.max(0, v.nt)})`,
    });
    s(r.search.current, { transform: `translate(${mx(v.sx, v.swd)}px, 0px)`, width: `${v.swd}px` });

    s(r.tile.current, {
      transform: `translate(${mx(tx - ts / 2, ts)}px, ${ty + rise - ts / 2}px)`, width: `${ts}px`, height: `${ts}px`, borderRadius: `${tr}px`,
      // Riding, the glyph goes under the bar with the card.
      opacity: String(iv), filter: iv < 0.999 && !riding.current ? `blur(${(1 - iv) * 4}px)` : "none",
      zIndex: riding.current ? "1" : "",
      pointerEvents: cur.current !== "A" && v.ic > 0.6 && iv > 0.6 ? "auto" : "none",
    });
    s(r.ring.current, { opacity: String(clamp((v.ic - 0.4) / 0.5)) });

    // One layer receding toward the pointer (dismiss).
    // ✕: the fade LEADS — gone by 42% of the spring, eased — so the results
    // closing up never show through a half-faded card.
    const fo = clamp(dm / 0.42), fe = fo * fo * (3 - 2 * fo);
    // Scroll: the banner morphs up into the bar AND dissolves as it goes — one
    // layer, eased, gone by 70% of the travel, blur held under 1.5 px.
    const mo = clamp(g / 0.7), me = mo * mo * (3 - 2 * mo);
    s(r.pop.current, riding.current && g > 0.0005
      ? { opacity: String(1 - me), transform: "", filter: mo < 1 ? `blur(${me * 1.5}px)` : "none" }
      : dm > 0.0005
      ? { opacity: String(1 - fe), transform: `translateY(${-8 * dm}px) scale(${lerp(1, 0.97, dm)})`, filter: fo < 1 ? `blur(${fe * 1.5}px)` : "none" }
      : { opacity: "", transform: "", filter: "" });

    // Copy: forms on arrival, clears on collapse.
    const look = (el: HTMLElement | null, o: number, blur: number, tx2: number, ty2: number, sx = 1, sy = sx) => {
      if (!el) return;
      el.style.opacity = String(o); el.style.filter = blur > 0.05 ? `blur(${blur}px)` : "none";
      el.style.transform = `translate(${tx2}px, ${ty2}px) scale(${sx}, ${sy})`;
    };
    // "Whole nudge" forms its first sentence, in the offered language; after the
    // turn (or in "Button only") the entrance forms the app's sentence.
    const layer = tm.showingFirst() ? ".tt-lbl--first" : ".tt-lbl--app";
    const words = r.label.current ? [...r.label.current.querySelectorAll<HTMLElement>(`${layer} .tt-word`)] : [];
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
      if (r.wm.current) { r.wm.current.style.opacity = String(clamp(w2)); r.wm.current.style.transform = `scale(${lerp(1.12, 1, w2)})`; }
    } else {
      words.forEach((w) => look(w, 1, 0, 0, 0));
      const ride = riding.current;
      const exit = (el: HTMLElement | null, c: number, drift: number) => {
        if (!el) return;
        // Riding, the card carries it up: it only lifts a little and clears.
        if (ride) look(el, clamp(1 - c * 1.6), clamp(c) * 2, 0, -c * 4);
        else look(el, clamp(1 - c * 1.15), clamp(c) * 7, c * drift, -c * 10, 1 - clamp(c) * 0.06);
        el.style.pointerEvents = c > 0.5 ? "none" : "auto";
        el.querySelectorAll<HTMLElement>(".pill-surface, .pill-label").forEach((n) => look(n, 1, 0, 0, 0));
      };
      exit(r.label.current, v.txt, 18); exit(r.nn.current, v.nn, 12); exit(r.sb.current, v.sb, 8);
      const sg = M ? -1 : 1;
      if (r.wm.current) { r.wm.current.style.opacity = String(clamp(1 - v.wm)); r.wm.current.style.transform = ride ? "none" : `translate(${sg * v.wm * 30}px, ${-v.wm * 14}px) rotate(${-sg * v.wm * 8}deg)`; }
    }

    // "English → Arabic": settled once every channel is at rest in A.
    const resting = cur.current === "A" && (Object.values(ch.values) as { isAnimating(): boolean }[]).every((c) => !c.isAnimating());
    cta.frame(r.nn.current, resting);
    if (yesno) ctaNo.frame(r.sb.current, resting);
    tm.frame(r.label.current, cur.current === "A" && (Object.values(ch.values) as { isAnimating(): boolean }[]).every((c) => !c.isAnimating()));

    // Slow, soft band of light across the card's background — arrival only, once.
    const t0 = sheenStart.current;
    const sp = t0 === null ? -1 : (performance.now() - t0) / (SHEEN.dur * R / 0.52 * 1000);
    if (sp >= 0 && sp <= 1) {
      const x = lerp(-240, W + 80, (1 - Math.cos(Math.PI * sp)) / 2);
      // Mirrored, the band sweeps right to left — the way the Arabic app reads.
      const left = M ? W - (x - 130) - 240 : x - 130;
      s(r.shine.current, { opacity: String(Math.pow(Math.sin(Math.PI * sp), 0.8) * 0.6), transform: `translateX(${left - cx}px) skewX(${M ? 16 : -16}deg)` });
    } else {
      s(r.shine.current, { opacity: "0" });
      if (sp > 1) sheenStart.current = null;
    }

    // The header's box follows the layout alone, same as the inset it reports.
    // Counting the card bottom in here made the box jump 17px on the first
    // frame of the return — the card starts as an invisible 3px sliver at y58,
    // already below the collapsed bar. The card floats; it may overhang.
    const held = Math.max(stageH, tileBottom);
    const G = geoRef.current, pad = lerp(G.padOpen, G.padShut, clamp(v.lay));
    s(r.header.current, { height: `${G.stageY + held + pad}px` });
    onHeight?.(G.stageY + Math.max(stageH, tileBottom) + pad);
  };

  useLayoutEffect(apply);
  useAnimationFrame(apply);

  const tileIcon = useMemo(() => <Icon name="system-language-bold" size={20} />, []);
  const sentence = (ws: typeof WORDS) => ws.map((w, i) => (
    <span key={i} className={w.strong ? "tt-word tt-word--strong" : "tt-word"}>{w.text}{i < ws.length - 1 ? " " : ""}</span>
  ));

  return (
    <header className="plp-header tt-header" ref={r.header}>
      <div className={mirror ? "tt-stage tt-stage--mirror" : "tt-stage"} style={{ left: STAGE_X, top: geo.stageY, width: W }}>
        {/* Recedes toward its pointer, wherever the pointer is. */}
        <div className="tt-pop" ref={r.pop} style={{ transformOrigin: `${mirror ? W - NOTCH.tip : NOTCH.tip}px ${CARD.y - 7}px` }}>
          <svg className="tt-notch" ref={r.notch} width={NOTCH.w} height={NOTCH.h} viewBox="0 0 18 7" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 7 C5 7 6.8 0.6 9 0.6 C11.2 0.6 13 7 18 7 Z" />
          </svg>
          <div className="tt-card" ref={r.card}>
            <div className="nudge-grad" ref={r.grad} />
            <div className="tt-halftone" ref={r.ht} aria-hidden="true" />
            <div className="tt-shine" ref={r.shine} />
            <div className="tt-inner" ref={r.inner}>
              {/* The white radial glyph from the banner (Watermark glyph 528:26610). */}
              <img className="tt-watermark" ref={r.wm} src="/img/v5/watermark.svg" alt="" width={160} height={48} />
              <div className="tt-row">
                <span className="tt-tile-slot" />
                <p className="nudge-label tt-label" ref={r.label} aria-label={copy.gloss}>
                  {/* Two layers: the sentence the banner arrives with (--first) and
                      the one it rests on (--app). Whole: offered → app. Flip:
                      app → offered. Button only: the app's alone. */}
                  {whole || flip ? (
                    <span className="tt-lbl tt-lbl--first" {...(whole ? { dir: copy.offered.dir, lang: locale === "en" ? "ar" : "en" } : {})}>
                      {sentence(whole ? copy.offered.words : WORDS)}
                    </span>
                  ) : null}
                  <span className="tt-lbl tt-lbl--app" {...(flip ? { dir: copy.offered.dir, lang: locale === "en" ? "ar" : "en" } : {})}>
                    {sentence(flip ? copy.offered.words : WORDS)}
                  </span>
                </p>
                <div className="nudge-actions">
                  {/* [تبديل][✕], by position like the attached nudge: nn is the lead. */}
                  <button className={yesno ? "btn-neutral btn-neutral--bold btn-neutral--pair" : "btn-neutral btn-neutral--bold"} ref={r.nn} onClick={() => { cta.tap(); onSwitch(); }} lang={cta.lang} aria-label={cta.gloss}>
                    <span className="pill-surface" />{cta.label}
                  </button>
                  {yesno ? (
                    // No, where the ✕ was: a quiet pill that turns with Yes.
                    <button className="btn-neutral btn-neutral--quiet btn-neutral--text btn-neutral--pair" ref={r.sb} onClick={() => { ctaNo.tap(); onDismiss(); }} lang={ctaNo.lang} aria-label={ctaNo.gloss}>
                      <span className="pill-surface" />{ctaNo.label}
                    </button>
                  ) : (
                    <button className="btn-neutral btn-neutral--quiet btn-neutral--icon" ref={r.sb} onClick={onDismiss} aria-label={copy.close}>
                      <span className="pill-surface" /><span className="pill-label"><Icon name="system-cross" size={20} /></span>
                    </button>
                  )}
                  {cta.measurers}
                  {yesno ? ctaNo.measurers : null}
                </div>
              </div>
            </div>
          </div>
          <button className="tt-tile" ref={r.tile} onClick={onSwitch} aria-label={copy.gloss}>
            <span className="tt-tile-ring" ref={r.ring} />
            {tileIcon}
          </button>
        </div>
        <div className="tt-search" ref={r.search} style={{ top: geo.searchTop }}>
          <SearchBar query={query} back variant={store === "sm" ? "smres" : undefined} />
        </div>
      </div>
    </header>
  );
}
