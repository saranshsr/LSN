import { useEffect, useMemo, useRef } from "react";
import { animate, motionValue, useReducedMotion, type AnimationPlaybackControls } from "motion/react";

import { SPR } from "./springs";

/**
 * "Whole nudge" (the 28 Sep review): the banner arrives entirely in the
 * OFFERED language — for the English app, "تحويل التطبيق إلى العربية؟" with
 * تبديل — so an Arabic reader gets all of it first. Once the entrance has
 * settled it holds a beat, then only the sentence turns into the app's
 * language; the button stays in the offered one. It settles on the same
 * resting banner as "Button only".
 *
 * The same grammar as the button turn (useCtaMorph), so the two read as one
 * system: ONE spring (`SPR.move`) drives a progress 0 → 1; the first sentence
 * fades, blurs ≤ 2 px and drifts up 3 px, gone by 0.6; the second rises from
 * 4 px below from 0.25, sharpening as it lands. Once per arrival: a banner
 * that comes back (scrolled away and back) is already settled.
 * Reduced motion: a plain cross-fade.
 */
const HOLD_MS = 900;
const OUT_END = 0.6, IN_START = 0.25, DRIFT_OUT = 3, RISE_IN = 4, BLUR = 2;
const clamp = (v: number) => Math.min(1, Math.max(0, v));

type Stage = "wait" | "hold" | "morph" | "done";

export function useTextMorph(active: boolean) {
  const reduced = !!useReducedMotion();
  const reducedRef = useRef(reduced); reducedRef.current = reduced;
  const stage = useRef<Stage>(active ? "wait" : "done");
  const p = useMemo(() => motionValue(active ? 0 : 1), []);
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const settledAt = useRef(0);

  // Toggled live: replay on the banner as it is.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    anim.current?.stop(); anim.current = null;
    if (active) { stage.current = "wait"; p.jump(0); } else { stage.current = "done"; p.jump(1); }
  }, [active, p]);

  const set = (n: HTMLElement | null, o: number, blur: number, ty: number) => {
    if (!n) return;
    n.style.opacity = String(o);
    n.style.filter = blur > 0.05 ? `blur(${blur}px)` : "none";
    n.style.transform = ty ? `translateY(${ty}px)` : "none";
  };

  /** Per frame: `resting` = the banner is in A and every channel has stopped. */
  const frame = (label: HTMLElement | null, resting: boolean) => {
    if (!label) return;
    const firstL = label.querySelector<HTMLElement>(".tt-lbl--first");
    const appL = label.querySelector<HTMLElement>(".tt-lbl--app");
    const now = performance.now();
    if (stage.current === "wait" && resting) { stage.current = "hold"; settledAt.current = now; }
    if (stage.current === "hold" && now - settledAt.current >= HOLD_MS) {
      stage.current = "morph";
      anim.current = animate(p, 1, { ...(reducedRef.current ? SPR.fade : SPR.move), velocity: 0 });
      anim.current.then(() => { if (stage.current === "morph") stage.current = "done"; });
    }
    const t = p.get();
    if (reducedRef.current) { set(firstL, 1 - clamp(t), 0, 0); set(appL, clamp(t), 0, 0); return; }
    const o = clamp(t / OUT_END), q = clamp((t - IN_START) / (1 - IN_START));
    set(firstL, 1 - o, o * BLUR, -o * DRIFT_OUT);
    set(appL, q, (1 - q) * BLUR, (1 - q) * RISE_IN);
  };

  /** Which sentence the entrance should form: the first one until it turns. */
  const showingFirst = () => stage.current !== "done" && p.get() < 0.5;

  /** Left A before turning: the next arrival is already settled. */
  const leave = () => {
    if (stage.current === "wait" || stage.current === "hold" || stage.current === "morph") {
      anim.current?.stop(); anim.current = null; stage.current = "done"; p.jump(1);
    }
  };

  return { frame, showingFirst, leave };
}
