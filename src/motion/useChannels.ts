import { useMemo } from "react";
import { animate, motionValue, useReducedMotion, type MotionValue } from "motion/react";

import type { Spring } from "./springs";
import { at } from "./springs";

/**
 * The nudge's channel engine, generalised: one MotionValue per channel, each
 * its own spring. A transition is a set of delayed retargets, and every
 * retarget carries the channel's live velocity — so any transition can be
 * interrupted and reversed without a seam (SPEC §9.4).
 */
export function useChannels<K extends string>(initial: Record<K, number>) {
  const reduced = useReducedMotion();
  return useMemo(() => {
    const keys = Object.keys(initial) as K[];
    const values = Object.fromEntries(keys.map((k) => [k, motionValue(initial[k])])) as Record<K, MotionValue<number>>;
    const timers = new Set<ReturnType<typeof setTimeout>>();

    const read = () => Object.fromEntries(keys.map((k) => [k, values[k].get()])) as Record<K, number>;

    /** Jump invisibly — only ever used while the thing it moves can't be seen. */
    const snap = (next: Partial<Record<K, number>>) => {
      for (const k of Object.keys(next) as K[]) { values[k].stop(); values[k].jump(next[k] as number); }
    };

    /** Spring each listed channel to its target, after its delay (seconds at response 0.52). */
    const to = (targets: Partial<Record<K, number>>, delays: Partial<Record<K, number>>, spring: (k: K) => Spring) => {
      for (const k of Object.keys(targets) as K[]) {
        const want = targets[k] as number, mv = values[k];
        if (reduced) { mv.jump(want); continue; }
        animate(mv, want, { ...spring(k), velocity: mv.getVelocity(), delay: at(delays[k] ?? 0) });
      }
    };

    /** Run `fn` after `sec` (scaled like the delays); cancelled by `cancel()`. */
    const later = (sec: number, fn: () => void) => {
      const t = setTimeout(() => { timers.delete(t); fn(); }, reduced ? 0 : at(sec) * 1000);
      timers.add(t);
    };
    const cancel = () => { timers.forEach(clearTimeout); timers.clear(); };

    return { values, read, snap, to, later, cancel, reduced: !!reduced };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
