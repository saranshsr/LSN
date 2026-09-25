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
 * `dimension` is a fixed 110pt, not the scroller's height: with the height, a
 * trackpad's long wheel stream could drag the page almost half a screen down
 * and expose white under the header. With 110 the pull resists hard and can
 * never pass ~110pt — a hint that there is nothing more, not a gap. Wheel
 * input is also damped (0.25), and momentum events that arrive after the pull
 * has been released no longer restart it.
 *
 * The element itself is translated rather than a wrapper: content slides out
 * from under the header, which is where it goes on a real device. Settling is
 * a critically damped spring, because no gesture carried momentum into it.
 */
const PULL_DIMENSION = 110;

export function useRubberBand(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let overshoot = 0;
    let releasedAt = 0;
    let settling: { stop: () => void } | null = null;
    let idle: ReturnType<typeof setTimeout>;

    const paint = () => {
      const d = PULL_DIMENSION;
      const y = (overshoot * d * 0.55) / (d + 0.55 * Math.abs(overshoot));
      el.style.transform = y ? `translateY(${y}px)` : "";
    };

    const release = () => {
      releasedAt = performance.now();
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
      // A trackpad keeps sending decaying "momentum" wheel events after the
      // fingers lift. Once a pull has been released, ignore the tail instead of
      // letting it drag the page back out.
      if (performance.now() - releasedAt < 450 && Math.abs(e.deltaY) < 40) return;
      settling?.stop();
      settling = null;
      overshoot -= e.deltaY * 0.25;
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
