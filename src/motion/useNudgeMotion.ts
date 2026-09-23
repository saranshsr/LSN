import { useCallback, useMemo, useRef } from "react";
import { animate, useMotionValue, useReducedMotion, type MotionValue } from "motion/react";

import {
  BASE, PLANS, channelSprings, entranceOverrides, preSnaps, stateTargets,
  type Channel, type Layout, type StateId, type Values,
} from "./nudge-core";

const CHANNELS: Channel[] = ["geo", "drop", "sx", "swd", "ic", "iv", "btn", "lay", "txt", "nn", "sb", "wm"];

export type NudgeMotion = {
  state: StateId;
  values: Record<Channel, MotionValue<number>>;
  /** Seconds since the entrance began, or null. Drives the shimmer. */
  sheenStart: React.MutableRefObject<number | null>;
  /** True while a C → A entrance is in flight; changes the icon's pop scale. */
  entering: React.MutableRefObject<boolean>;
  go: (to: StateId) => void;
  read: () => Values;
};

/**
 * Drives the nudge's twelve motion channels per the handoff spec.
 *
 * Every channel is its own spring with its own response and damping, and a
 * transition is a set of delayed retargets — not one timeline. Retargeting a
 * live MotionValue carries its velocity, which is what makes a reversal
 * mid-flight continue rather than restart (SPEC §9.4).
 */
export function useNudgeMotion(L: Layout, initial: StateId): NudgeMotion {
  const reduced = useReducedMotion();
  const stateRef = useRef<StateId>(initial);
  const entering = useRef(false);
  const sheenStart = useRef<number | null>(null);

  const targets = useMemo(() => stateTargets(L), [L]);
  const springs = useMemo(() => channelSprings(BASE.response, BASE.dampingFraction), []);
  const overrides = useMemo(() => entranceOverrides(BASE.response), []);

  // One MotionValue per channel, seeded at the initial state's resting values.
  const start = targets[initial];
  const values = {
    geo: useMotionValue(start.geo ?? 0),
    drop: useMotionValue(start.drop ?? 0),
    sx: useMotionValue(start.sx ?? 0),
    swd: useMotionValue(start.swd ?? L.width),
    ic: useMotionValue(start.ic ?? 0),
    iv: useMotionValue(start.iv ?? 1),
    btn: useMotionValue(start.btn ?? 0),
    lay: useMotionValue(start.lay ?? 0),
    txt: useMotionValue(start.txt ?? 0),
    nn: useMotionValue(start.nn ?? 0),
    sb: useMotionValue(start.sb ?? 0),
    wm: useMotionValue(start.wm ?? 0),
  } as Record<Channel, MotionValue<number>>;

  const read = useCallback(
    () => Object.fromEntries(CHANNELS.map((c) => [c, values[c].get()])) as Values,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const go = useCallback(
    (to: StateId) => {
      const from = stateRef.current;
      if (from === to) return;
      stateRef.current = to;

      const isEntrance = (from === "C" || from === "P") && to === "A";
      entering.current = isEntrance;
      sheenStart.current = isEntrance && !reduced ? performance.now() : null;

      // Invisible pre-snaps, so nothing is ever seen jumping (SPEC §6).
      const snaps = preSnaps(from, to, read(), L);
      for (const [c, v] of Object.entries(snaps)) values[c as Channel].set(v as number);

      const plan = PLANS[`${from}${to}`] ?? {};
      const target = targets[to];
      const scale = BASE.response / 0.52; // delays scale with the base response

      for (const c of CHANNELS) {
        const want = target[c];
        if (want === undefined) continue;
        const mv = values[c];

        if (reduced) { mv.set(want); continue; }

        const cfg = (isEntrance && overrides[c]) || springs[c];
        animate(mv, want, {
          type: "spring",
          mass: 1,
          stiffness: cfg.stiffness,
          damping: cfg.damping,
          velocity: mv.getVelocity(),
          delay: (plan[c] ?? 0) * scale,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [L, reduced],
  );

  return { state: stateRef.current, values, sheenStart, entering, go, read };
}
