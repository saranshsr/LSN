import { useEffect, useRef, useState } from "react";
import { animate, motion } from "motion/react";

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
  const wantsEntrance = locale === "en" && state === "offered";
  const [mounted, setMounted] = useState(!wantsEntrance);
  useEffect(() => {
    if (mounted) return;
    const t = setTimeout(() => setMounted(true), at(0.9) * 1000);
    return () => clearTimeout(t);
  }, [mounted]);

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

  const arrive = entrance === "search";

  return (
    <div className="screen" data-entrance={entrance}>
      <StatusBar />

      {locale === "ar" ? (
        <ArHeader settle={entrance === "skeleton"} />
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
        {/* Arriving from search, the content rises in as two groups — chips,
            then the grid — while the nudge blooms above it. Arriving from the
            skeleton it must NOT move: placeholder and content share pixels. */}
        <motion.div
          initial={arrive ? "hidden" : false}
          animate="shown"
          variants={rise}
          transition={{ ...SPR.rise, delay: at(0.12) }}
        >
          <ChipRow locale={locale} />
        </motion.div>
        <motion.div
          className="grid"
          initial={arrive ? "hidden" : false}
          animate="shown"
          variants={rise}
          transition={{ ...SPR.rise, delay: at(0.2) }}
        >
          {products.map((pr) => <ProductCard key={pr.slug} product={pr} locale={locale} />)}
          {products.map((pr) => <ProductCard key={`${pr.slug}-2`} product={pr} locale={locale} />)}
        </motion.div>
      </div>

      <BottomNav locale={locale} />
    </div>
  );
}

export { SCROLL };
