import { useEffect } from "react";
import { animate } from "motion/react";

/**
 * iOS rubber-banding for a scroll container.
 *
 * Chrome will not bounce an `overflow: auto` div, and `overscroll-behavior:
 * contain` explicitly suppresses what bounce there is — so a hard stop is what
 * you get, and a hard stop reads as frozen rather than "there is nothing more
 * here". This resists progressively instead, using Apple's own damping curve
 * from Designing Fluid Interfaces:
 *
 *   (overshoot · dimension · 0.55) / (dimension + 0.55 · |overshoot|)
 *
 * The element itself is translated rather than a wrapper: content slides out
 * from under the header, which is where it goes on a real device. Settling is
 * a critically damped spring, because no gesture carried momentum into it.
 */
export function useRubberBand(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let overshoot = 0;
    let settling: { stop: () => void } | null = null;
    let idle: ReturnType<typeof setTimeout>;

    const paint = () => {
      const d = el.clientHeight || 1;
      const y = (overshoot * d * 0.55) / (d + 0.55 * Math.abs(overshoot));
      el.style.transform = y ? `translateY(${y}px)` : "";
    };

    const release = () => {
      if (!overshoot) return;
      const from = overshoot;
      settling = animate(from, 0, {
        type: "spring", bounce: 0, duration: 0.45,
        onUpdate: (v) => { overshoot = v; paint(); },
      });
    };

    const onWheel = (e: WheelEvent) => {
      const atTop = el.scrollTop <= 0;
      const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      const pulling = (atTop && e.deltaY < 0) || (atEnd && e.deltaY > 0);

      if (!pulling) {
        if (overshoot) { overshoot = 0; paint(); }
        return;
      }
      e.preventDefault();
      settling?.stop();
      settling = null;
      overshoot -= e.deltaY * 0.5;
      paint();

      clearTimeout(idle);
      idle = setTimeout(release, 70);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      clearTimeout(idle);
      settling?.stop();
      el.style.transform = "";
    };
  }, [ref]);
}
