import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion } from "motion/react";

import { StatusBar, BottomNav, ChipRow } from "../components/chrome";
import { ProductCard } from "../components/ProductCard";
import { TooltipHeader } from "../components/TooltipHeader";
import { ArHeader } from "../components/ArHeader";
import { NudgeHeader } from "../components/NudgeHeader";
import { useRubberBand } from "../motion/useRubberBand";
import { SPR, at, rise } from "../motion/springs";
import { SCROLL, scrollDecision, shouldSettleToTop, type StateId } from "../motion/nudge-core";
import type { Locale } from "../data/copy";
import { products } from "../data/products";
import { SkeletonCard } from "./SkeletonScreen";
import type { NudgeState, Variant } from "../flow/flow";

type Props = {
  locale: Locale;
  variant: Variant;
  nudge: NudgeState;
  /** `search` = arrived from the overlay, so the content settles in;
   *  `skeleton` = the app just came back up after the switch. */
  entrance: "search" | "skeleton" | "none";
  onSwitch: () => void;
  onDismiss: () => void;
  onCollapse: (collapsed: boolean) => void;
};

const AS_STATE: Record<NudgeState, StateId> = { offered: "A", collapsed: "B", dismissed: "C" };

/**
 * Frames `3 · Results — nudge offered` and `4 · Results — scrolled`: one
 * screen, because the difference between them is scroll position. Also serves
 * the switched RTL state (frame 8) at locale `ar`.
 */
export function ResultsScreen({ locale, variant, nudge: state, entrance, onSwitch, onDismiss, onCollapse }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  useRubberBand(scroller);

  // The user lands on the plain, full-width bar (P) while the results rise in;
  // only once that has settled does the nudge bloom out of the bar — so it
  // reads as something that has just come up, and grabs attention for it.
  // Coming back to English after the round trip, the same beat plays in
  // reverse of the Arabic landing: full bar first, then the glyph settles in.
  const arrive = entrance === "search";
  const settling = locale === "en" && entrance === "skeleton";
  const wantsEntrance = locale === "en" && (state === "offered" || settling);
  const [mounted, setMounted] = useState(!wantsEntrance);
  useEffect(() => {
    if (mounted) return;
    const t = setTimeout(() => {
      // Edge case: the user scrolled past the trigger during the hold. Don't
      // bloom a nudge they have already moved on from — arrive collapsed, as
      // the glyph settling into its slot.
      if (!settling && (scroller.current?.scrollTop ?? 0) > SCROLL.trigger) onCollapse(true);
      setMounted(true);
    }, at(settling ? 0.45 : arrive ? 1.45 : 0.9) * 1000);
    return () => clearTimeout(t);
  }, [mounted, settling, arrive]);

  const nudgeState: StateId = mounted ? AS_STATE[state] : "P";

  // The header reports its own height; the scroller's inset follows it so the
  // header stays pinned and the content below moves with `lay`.
  const [inset, setInset] = useState(162.57);

  // SPEC §7: scroll triggers the springs, it does not scrub them.
  const settle = useRef<ReturnType<typeof setTimeout>>();
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (locale !== "en" || state === "dismissed" || !mounted) return;
    const el = e.currentTarget;
    const y = el.scrollTop;

    const next = scrollDecision(AS_STATE[state], y);
    if (next === "B") onCollapse(true);
    if (next === "A") onCollapse(false);

    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      if (!shouldSettleToTop(AS_STATE[state], el.scrollTop)) return;
      animate(el.scrollTop, 0, {
        ...SPR.layout,
        onUpdate: (v) => { el.scrollTop = v; },
      });
    }, 90);
  };

  // Submitting a search is a real request: the bar settles into the results
  // header, the results area shows placeholders on the real card geometry for a
  // beat, and then the content arrives into them — chips, then the grid.
  const [loading, setLoading] = useState(arrive);
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), at(0.6) * 1000);
    return () => clearTimeout(t);
  }, [loading]);
  const groupIn = (delay: number) => ({
    hidden: rise.hidden,
    shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: { ...SPR.rise, delay: at(delay) } },
  });

  return (
    <div className="screen" data-entrance={entrance}>
      <StatusBar />

      {locale === "ar" ? (
        <ArHeader settle={entrance === "skeleton"} onSwitch={onSwitch} />
      ) : variant === "inline" ? (
        <NudgeHeader state={nudgeState} onSwitch={onSwitch} onDismiss={onDismiss} onHeight={setInset} />
      ) : (
        <TooltipHeader state={nudgeState} onSwitch={onSwitch} onDismiss={onDismiss} onHeight={setInset} />
      )}

      <div
        className="scroll"
        ref={scroller}
        onScroll={onScroll}
        style={{ paddingTop: locale === "ar" ? 106.57 : inset }}
      >
        {/* Arriving from search, the content arrives into its placeholders as
            two groups — chips, then the grid. Arriving from the relaunch
            skeleton it must NOT move: placeholder and content share pixels. */}
        <div className="plp-content">
          <motion.div initial={arrive ? "hidden" : false} animate={loading ? "hidden" : "shown"} variants={groupIn(0)}>
            <ChipRow locale={locale} />
          </motion.div>
          <motion.div className="grid" initial={arrive ? "hidden" : false} animate={loading ? "hidden" : "shown"} variants={groupIn(0.07)}>
            {products.map((pr) => <ProductCard key={pr.slug} product={pr} locale={locale} />)}
            {products.map((pr) => <ProductCard key={`${pr.slug}-2`} product={pr} locale={locale} />)}
          </motion.div>

          <AnimatePresence>
            {loading ? (
              <motion.div
                key="placeholders"
                className="plp-loading"
                aria-hidden="true"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, transition: SPR.fade }}
              >
                <div className="sk-chips plp-loading-chips">
                  {[75, 71, 97, 99, 108].map((w, i) => <div className="sk sk-chip" key={i} style={{ width: w }} />)}
                </div>
                <div className="sk-grid plp-loading-grid">
                  {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                </div>
                <div className="sk-shimmer" />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <BottomNav locale={locale} />
    </div>
  );
}

export { SCROLL };
