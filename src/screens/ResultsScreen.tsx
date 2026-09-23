import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion } from "motion/react";

import { StatusBar, BottomNav, ChipRow } from "../components/chrome";
import { SearchBar } from "../components/SearchBar";
import { ProductCard } from "../components/ProductCard";
import { GlyphButton, TooltipNudge } from "../components/nudge";
import { NudgeHeader } from "../components/NudgeHeader";
import { useRubberBand } from "../motion/useRubberBand";
import { SPR, at, rise } from "../motion/springs";
import { SCROLL, scrollDecision, shouldSettleToTop, type StateId } from "../motion/nudge-core";
import { QUERY, type Locale } from "../data/copy";
import { products } from "../data/products";
import type { NudgeState, Variant } from "../flow/flow";

type Props = {
  locale: Locale;
  variant: Variant;
  nudge: NudgeState;
  /** `search` = arrived from the overlay, so the content settles in. */
  entrance: "search" | "none";
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

  // SPEC §1 mount behaviour: if the nudge should appear on first render, mount
  // in C and run the entrance once laid out.
  const wantsEntrance = locale === "en" && variant === "inline" && state === "offered";
  const [mounted, setMounted] = useState(!wantsEntrance);
  useEffect(() => {
    if (mounted) return;
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [mounted]);

  const nudgeState: StateId = mounted ? AS_STATE[state] : "C";

  // The header reports its own height; the scroller's inset follows it so the
  // header stays pinned and the content below moves with `lay`.
  const [inset, setInset] = useState(162.57);

  // SPEC §7: scroll triggers the springs, it does not scrub them.
  const settle = useRef<ReturnType<typeof setTimeout>>();
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (locale !== "en" || variant !== "inline" || state === "dismissed") return;
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

  const tooltipOpen = locale === "en" && state === "offered" && variant === "tooltip";
  const arrive = entrance === "search";

  return (
    <div className="screen" data-entrance={entrance}>
      <StatusBar />

      {locale === "ar" ? (
        <header className="plp-header plp-header--plain plp-header--ar">
          <div className="plp-row plp-row--ar">
            <SearchBar query={QUERY} back />
          </div>
        </header>
      ) : variant === "inline" ? (
        <NudgeHeader state={nudgeState} onSwitch={onSwitch} onDismiss={onDismiss} onHeight={setInset} />
      ) : (
        <header className="plp-header plp-header--plain">
          <div className="plp-row tooltip-anchor">
            <SearchBar query={QUERY} back />
            <GlyphButton standalone onClick={onSwitch} />
            <AnimatePresence>
              {tooltipOpen ? <TooltipNudge key="tooltip" onSwitch={onSwitch} onDismiss={onDismiss} /> : null}
            </AnimatePresence>
          </div>
        </header>
      )}

      <div
        className="scroll"
        ref={scroller}
        onScroll={onScroll}
        style={{ paddingTop: locale === "ar" ? 106.57 : variant === "inline" ? inset : 108.57 }}
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
