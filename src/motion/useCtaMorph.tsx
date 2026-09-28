import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { animate, motionValue, useReducedMotion, type AnimationPlaybackControls } from "motion/react";

import type { Locale } from "../data/copy";
import { NUDGE } from "../flow/v5";
import { SPR } from "./springs";

/**
 * The nudge's action pill and its turn from the app's language into the
 * offered one (CTA · transition 535:4693): the pill forms reading the app's
 * word, and once the entrance has settled (every channel at rest) it holds a
 * beat to be read, then turns — Switch → تبديل in the English app, تبديل →
 * Switch in the Arabic one.
 *
 * The turn is ONE spring (`SPR.move`, the base response and damping) driving a
 * progress `p` 0 → 1. Everything in the beat reads off it, so it cannot drift
 * apart and can be stopped at any frame:
 *   · the pill's width, from the first word's natural width to the second's.
 *     The pill sits before the ✕ in a row pushed to the end by an auto margin,
 *     so it resizes from its LEADING edge: the ✕ and the pill's trailing edge
 *     never move, and nothing outside the pill is laid out again.
 *   · the first word leaving: fades, blurs ≤ 2px and drifts up 3px, gone by p 0.6;
 *   · the second arriving from 4px below, sharpening as it lands, from p 0.25 —
 *     so the two overlap for a third of the beat, a cross-fade, not a swap.
 *
 * Once the spring is at rest the pill goes back to plain markup, so the final
 * state IS the resting design. Once per arrival: a banner that comes back —
 * scrolled away and back, or tapped mid-turn — already reads the offered
 * language. Reduced motion: a plain cross-fade, the width snapping at its start.
 */

/** Reading time for the English after the entrance settles. Not a motion
 *  delay, so it does not scale with the base response. */
const HOLD_MS = 750;
/** Where the outgoing word is gone and the incoming one starts, in `p`. */
const OUT_END = 0.6, IN_START = 0.25;
const DRIFT_OUT = 3, RISE_IN = 4, BLUR = 2;

/** Dev only: beat times on `window.__cta`, for a headless capture to read. */
const trace = (beat: string) => {
  if (!import.meta.env.DEV) return;
  const w = window as unknown as { __cta?: Record<string, number>[] };
  (w.__cta ??= []).push({ [beat]: Math.round(performance.now()) });
};

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** wait → (entrance settles) → hold → (HOLD_MS) → morph → done.
 *  `spent`: this arrival ended in English (left, or tapped) — the next shows Arabic. */
type Stage = "wait" | "hold" | "morph" | "done" | "spent";

/**
 * Iteration 5: the turn is the design, in both apps — the pill forms in the
 * app's language and turns into the offered one (CTA · transition 535:4693).
 * Below, `en` is the word the pill STARTS with and `ar` the one it ends on;
 * the names are kept from the English → Arabic original, whose maths this is.
 */
type Opts = {
  /** Reading time before the turn — the flip holds as long as its sentence
   *  (useTextMorph), so the sentence and the button turn on the same frame. */
  hold?: number;
};

export function useCtaMorph(locale: Locale, enabled = true, opts: Opts = {}) {
  const n = NUDGE[locale];
  const from = n.from, to = n.to;
  const hold = opts.hold ?? HOLD_MS;
  const action = { text: to.text, lang: to.lang, gloss: n.gloss };
  // Off in "Whole nudge": there the button reads the offered language throughout.
  const active = enabled;
  const words = { en: from.text, ar: to.text };
  const langs = { en: from.lang, ar: to.lang };
  // The attached header reads these from a frame loop created once, so every
  // function below reads refs, never render-time values.
  const reducedNow = !!useReducedMotion();
  const reducedRef = useRef(reducedNow);
  reducedRef.current = reducedNow;
  // Whether the pill renders the two-word morph markup (vs today's label).
  const [english, setEnglishState] = useState(active);
  const englishRef = useRef(english);
  const setEnglish = (on: boolean) => { englishRef.current = on; setEnglishState(on); };
  const stage = useRef<Stage>(active ? "wait" : "done");
  const p = useMemo(() => motionValue(0), []);
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const settledAt = useRef(0);
  const pill = useRef<HTMLElement | null>(null);
  const widths = useRef<{ en: number; ar: number } | null>(null);
  const measEn = useRef<HTMLSpanElement>(null);
  const measAr = useRef<HTMLSpanElement>(null);

  const finish = () => {
    anim.current?.stop(); anim.current = null;
    if (stage.current === "morph") trace("done");
    stage.current = "done";
    setEnglish(false);
  };

  // The toggle, or an option change that turns it on or off. Turning it on
  // replays on the nudge as it is — a resting nudge holds and turns; a hidden
  // one turns on its next arrival.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    anim.current?.stop(); anim.current = null;
    p.jump(0);
    if (active) { stage.current = "wait"; setEnglish(true); }
    else finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Widths come from hidden copies of the pill, so they are the natural widths
  // the layout gives each word — fractional, and untouched by the transforms
  // the entrance writes. A late web font or new copy changes them.
  const measuring = english;
  useEffect(() => {
    widths.current = null;
    if (!measuring) return;
    const stale = () => { widths.current = null; };
    document.fonts?.addEventListener("loadingdone", stale);
    return () => document.fonts?.removeEventListener("loadingdone", stale);
  }, [measuring, words.en, words.ar]);
  const englishAction = useRef(false);
  englishAction.current = false;
  const measure = () => {
    // The box's own width, exact to the layout unit. The computed style is
    // rounded to 4 decimals (54.7656 for 54.765625), which lands one 1/64px
    // short; it is only the fallback for when an ancestor scales the box.
    const px = (n: HTMLElement | null) => {
      if (!n) return NaN;
      const box = n.getBoundingClientRect().width, css = parseFloat(getComputedStyle(n).width);
      return Math.abs(box - css) < 0.01 ? box : css;
    };
    const en = px(measEn.current), ar = px(measAr.current);
    return Number.isFinite(en) && Number.isFinite(ar) ? (widths.current = { en, ar }) : null;
  };

  // Back on today's markup: the width is the layout's again.
  useLayoutEffect(() => {
    if (!english) pill.current?.style.removeProperty("width");
  }, [english]);

  const start = () => {
    stage.current = "morph";
    measure();
    anim.current = animate(p, 1, { ...(reducedRef.current ? SPR.fade : SPR.move), velocity: 0 });
    anim.current.then(() => { if (stage.current === "morph") finish(); });
  };

  /**
   * Per frame, from the header's own loop. `resting`: the nudge is in A and
   * every entrance channel has come to rest — the real settle, not a timer.
   */
  const frame = (el: HTMLElement | null, resting: boolean) => {
    pill.current = el;
    if (!englishRef.current || !el) return;
    const reduced = reducedRef.current;
    const now = performance.now();
    if (stage.current === "wait" && resting) { stage.current = "hold"; settledAt.current = now; trace("settled"); }
    if (stage.current === "hold" && now - settledAt.current >= hold) { start(); trace("morph"); }

    const w = widths.current ?? measure();
    if (!w) return;
    const t = p.get();
    el.style.width = `${reduced ? (stage.current === "morph" ? w.ar : w.en) : lerp(w.en, w.ar, t)}px`;
    const [en, ar] = el.querySelectorAll<HTMLElement>(".pill-word");
    if (!en || !ar) return;
    const set = (n: HTMLElement, o: number, blur: number, ty: number) => {
      n.style.opacity = String(o);
      n.style.filter = blur > 0.05 ? `blur(${blur}px)` : "none";
      n.style.transform = ty ? `translateY(${ty}px)` : "none";
    };
    if (reduced) { set(en, 1 - clamp(t), 0, 0); set(ar, clamp(t), 0, 0); return; }
    const o = clamp(t / OUT_END), q = clamp((t - IN_START) / (1 - IN_START));
    set(en, 1 - o, o * BLUR, -o * DRIFT_OUT);
    set(ar, q, (1 - q) * BLUR, (1 - q) * RISE_IN);
  };

  /** The nudge arrived (P/C → A). A second arrival shows the Arabic at once. */
  const arrive = () => {
    if (stage.current === "wait" || stage.current === "done") return;
    finish(); // the label is still hidden here — the entrance forms it after
  };
  /** The nudge left A. Unless it is mid-turn, this arrival stays English. */
  const leave = () => {
    if (stage.current === "wait" || stage.current === "hold") stage.current = "spent";
  };
  /** Tapped: the switch goes ahead; a turn that has not started never will. */
  const tap = () => {
    if (stage.current === "wait" || stage.current === "hold") stage.current = "spent";
  };

  /** How much wider than the Arabic pill it is right now — the pill the
   *  glint was placed for — so the arrival glint stays parked on the pill's
   *  leading edge. 0 for an Arabic action once it reads Arabic. */
  const extra = () => {
    if (!englishRef.current && !englishAction.current) return 0;
    const w = widths.current ?? measure();
    if (!w) return 0;
    if (!englishRef.current) return w.en - w.ar; // option 1: English throughout
    return reducedRef.current ? (stage.current === "morph" ? 0 : w.en - w.ar) : (w.en - w.ar) * (1 - p.get());
  };

  const label = english ? (
    <span className="pill-label pill-label--morph">
      <span className="pill-word" lang={langs.en}>{words.en}</span>
      <span className="pill-word" lang={langs.ar} style={{ opacity: 0 }}>{words.ar}</span>
    </span>
  ) : (
    <span className="pill-label">{action.text}</span>
  );
  const measurers = measuring ? (
    <>
      <span className="btn-neutral btn-neutral--bold pill-measure" ref={measEn} lang={langs.en} aria-hidden="true">{words.en}</span>
      <span className="btn-neutral btn-neutral--bold pill-measure" ref={measAr} lang={langs.ar} aria-hidden="true">{words.ar}</span>
    </>
  ) : null;

  return {
    /** For the pill's `lang=` and `aria-label`: the gloss throughout, so a
     *  screen reader hears "Switch" whether the pill reads English or Arabic. */
    lang: english ? langs.en : action.lang,
    gloss: action.gloss,
    label, measurers, frame, arrive, leave, tap, extra,
  };
}
