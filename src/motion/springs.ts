import type { Transition, Variants } from "motion/react";

import { BASE, spring as solve } from "./nudge-core";

/**
 * One motion system for the whole flow — the nudge's.
 *
 * Every animation in the prototype is a spring derived from ONE base
 * (response 0.52 s, damping fraction 0.90), exactly as the nudge's twelve
 * channels are (`nudge-core.ts → channelSprings`). Nothing runs on a duration
 * and a curve any more, so:
 *
 *   · everything is interruptible — retargeting keeps velocity, a reversal
 *     mid-flight continues instead of restarting;
 *   · the whole flow retunes from `BASE` in one place;
 *   · the same roles move the same way everywhere: containers move on `move`,
 *     layout on `layout` (never overshoots), content forms on `form`/`rise`,
 *     things that leave go on `recede` (never overshoots).
 *
 * Choreography follows the nudge too: content clears before its container
 * moves, containers settle before content forms, and delays are in seconds at
 * response 0.52, scaled with the base (`at()`).
 */
const R = BASE.response, Z = BASE.dampingFraction;

export type Spring = { type: "spring"; mass: number; stiffness: number; damping: number };
const s = (responseMul: number, damping: number): Spring => {
  const c = solve(R * responseMul, Math.min(1, Math.max(0.35, damping)));
  return { type: "spring", mass: 1, stiffness: c.stiffness, damping: c.damping };
};

export const SPR = {
  /** Containers and shared elements travelling through space (nudge `geo`). */
  move: s(1, Z),
  /** Layout — surfaces that push content around. Critically damped (nudge `lay`). */
  layout: s(1.2, 1),
  /** Panels that dock to an edge: keyboard, sheet. A touch of settle, no bounce. */
  dock: s(0.9, 0.94),
  /** Content fading out of the way (nudge `txt` / `nn` / `sb`). */
  clear: s(0.55, 1),
  /** Content rising into place — words, rows, suggestions (entrance `txt`). */
  rise: s(0.95, 1),
  /** Surfaces forming before their labels — pills, buttons (entrance `nn` / `sb`). */
  form: s(0.75, 0.68),
  /** A glyph popping in with a soft overshoot (entrance `iv`). */
  pop: s(0.7, 0.62),
  /** Leaving as one layer — dismissals, exits (tooltip dismiss). Never overshoots. */
  recede: s(0.72, 1),
  /** Screen-level fades. */
  fade: s(0.6, 1),
  /** The reload growing out of the Switch button. Fast, no bounce. */
  burst: s(0.62, 1),
  /** Bottom sheet arriving — docks with a whisper of settle. */
  sheet: s(0.9, 0.86),
} as const;

/** Delay in seconds at response 0.52, scaled with the base like the nudge's plans. */
export const at = (sec: number) => sec * (R / 0.52);

/* ── Shared looks ──────────────────────────────────────────────────────────
   The same shapes the nudge uses (`wordLooks`, `pillLooks`, `exitLook`), as
   Motion variants so any screen can use them. `shown` is always the resting
   style, so nothing here changes how a screen looks at rest. */

/** A word, row or item rising into place: 9px up, sharpening as it lands. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 9, filter: "blur(4px)" },
  shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: SPR.rise },
  gone: { opacity: 0, filter: "blur(4px)", scale: 0.98, transition: SPR.clear },
};

/** A surface forming (with a little overshoot) before its label settles. */
export const formSurface: Variants = {
  hidden: { opacity: 0, scaleX: 0.72, scaleY: 0.6 },
  shown: { opacity: 1, scaleX: 1, scaleY: 1, transition: SPR.form },
  gone: { opacity: 0, transition: SPR.clear },
};
export const formLabel: Variants = {
  hidden: { opacity: 0, y: 5, filter: "blur(3px)" },
  shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: { ...SPR.rise, delay: at(0.08) } },
  gone: { opacity: 0, transition: SPR.clear },
};

/** A glyph popping in from 40%, sharpening as it lands. */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.4, filter: "blur(5px)" },
  shown: { opacity: 1, scale: 1, filter: "blur(0px)", transition: SPR.pop },
  gone: { opacity: 0, scale: 0.8, filter: "blur(4px)", transition: SPR.clear },
};

/** Staggered children: `gap` between siblings, `lead` before the first. */
export const stagger = (gap: number, lead = 0): Transition => ({
  staggerChildren: at(gap), delayChildren: at(lead),
});
