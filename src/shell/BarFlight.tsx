import { useEffect, useRef, type ComponentProps } from "react";
import { animate, motion, useAnimationFrame, useMotionValue } from "motion/react";

import { SearchBar } from "../components/SearchBar";
import { SPR } from "../motion/springs";

/**
 * The search bar as ONE object across home → search → results.
 *
 * During a navigation the bar is lifted out of both screens into this layer,
 * flies from where it was to where it is going, and is handed back on landing.
 * It is how iOS does a shared-element push, and it exists because the two
 * cheaper routes both failed here:
 *
 *  - `layoutId` morphed boxes of different shapes (the 343×48 home bar into the
 *    375×126 search HEADER), and inherited both screens' cross-fades, so the
 *    bar ghosted 51px apart and dimmed to ~50% mid-flight. Without a namespaced
 *    LayoutGroup it also paired the two phones' bars across the page.
 *  - A fixed exit transform into the results header was tuned for one variant;
 *    the inline and tooltip headers put their bars in different places.
 *
 * So nothing is hard-coded, and the destination is not a snapshot either: the
 * results headers keep animating their bar while the flight is in the air (the
 * tooltip header fades its border out and back during its own entrance). A
 * snapshot landed with stale chrome and popped. Instead one spring drives a
 * progress value, and every frame the shell is placed at
 *   lerp(source, the destination AS IT IS RIGHT NOW, progress)
 * — box, radius, border colour, fill — read off the element that actually
 * draws each bar. Landing is exact by construction. The shell is the one opaque
 * surface; only the contents cross-fade inside it.
 */
export type BarLook = {
  x: number; y: number; w: number; h: number;
  radius: number; border: RGBA; bg: RGBA;
};
type RGBA = [number, number, number, number];

type Face = ComponentProps<typeof SearchBar>;
export type Flight = {
  id: number;
  from: BarLook;
  /** Re-read every frame. Null if the destination has gone (flight cancelled). */
  to: () => BarLook | null;
  src: Face;
  dst: Face;
};

/** Which element paints a bar's chrome. The inline header draws it on its
 *  wrapper and zeroes the inner bar's border; everywhere else it is the bar. */
export const chromeOf = (bar: HTMLElement) => bar.closest<HTMLElement>(".nudge-search") ?? bar;

const rgba = (c: string): RGBA => {
  const n = c.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0];
  return [n[0] ?? 0, n[1] ?? 0, n[2] ?? 0, n[3] ?? 1];
};

/** Reads a bar's box and chrome in the device's own 375-wide coordinates. */
export function readLook(el: HTMLElement, device: HTMLElement): BarLook {
  const d = device.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const s = d.width / 375 || 1; // lanes may be scaled; the device is not
  const cs = getComputedStyle(el);
  return {
    x: (r.x - d.x) / s, y: (r.y - d.y) / s, w: r.width / s, h: r.height / s,
    radius: parseFloat(cs.borderTopLeftRadius) || 0,
    border: rgba(cs.borderTopColor), bg: rgba(cs.backgroundColor),
  };
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixC = (a: RGBA, b: RGBA, t: number) => {
  const c = a.map((v, i) => mix(v, b[i], t));
  return `rgba(${c[0].toFixed(1)}, ${c[1].toFixed(1)}, ${c[2].toFixed(1)}, ${Math.min(1, Math.max(0, c[3])).toFixed(3)})`;
};

export function BarFlight({ flight, onLand }: { flight: Flight; onLand: (id: number) => void }) {
  const shell = useRef<HTMLDivElement | null>(null);
  const p = useMotionValue(0);

  useEffect(() => {
    p.set(0);
    // Land within half a pixel of a ~124px travel, not at full rest: the
    // spring's sub-pixel tail ran to ~930ms and only held the real bar hidden.
    const run = animate(p, 1, { ...SPR.move, restDelta: 0.004, restSpeed: 0.05 });
    run.then(() => onLand(flight.id));
    return () => run.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight.id]);

  const place = () => {
    const el = shell.current;
    const to = flight.to();
    if (!el || !to) return;
    const t = p.get(); // may pass 1 briefly — the spring's settle, carried through
    const f = flight.from;
    el.style.left = `${mix(f.x, to.x, t)}px`;
    el.style.top = `${mix(f.y, to.y, t)}px`;
    el.style.width = `${mix(f.w, to.w, t)}px`;
    el.style.height = `${mix(f.h, to.h, t)}px`;
    el.style.borderRadius = `${mix(f.radius, to.radius, t)}px`;
    el.style.borderColor = mixC(f.border, to.border, t);
    el.style.backgroundColor = mixC(f.bg, to.bg, t);
  };
  useAnimationFrame(place);

  return (
    <div
      ref={(n) => { shell.current = n; if (n) place(); }}
      className="bar-flight"
      aria-hidden="true"
      style={{ left: flight.from.x, top: flight.from.y, width: flight.from.w, height: flight.from.h }}
    >
      {/* Leaving contents clear early; arriving ones settle in once the bar is
          under way. Faces are content only — the shell is the one surface. */}
      <motion.div
        className="bar-flight-face"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.16, ease: [0.4, 0, 1, 1] }}
      >
        <SearchBar {...flight.src} />
      </motion.div>
      <motion.div
        className="bar-flight-face"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.22, delay: 0.06, ease: [0.23, 1, 0.32, 1] }}
      >
        <SearchBar {...flight.dst} />
      </motion.div>
    </div>
  );
}
