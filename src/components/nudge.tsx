import { motion, type Variants } from "motion/react";

import { Icon } from "../icons/Icon";
import { nudge } from "../data/copy";
import { SPR, at, formSurface, popIn, rise, stagger } from "../motion/springs";

/** The 32-square glyph button that lives in the nudge row. */
export function GlyphButton({ standalone, onClick }: { standalone?: boolean; onClick?: () => void }) {
  return (
    <button
      className={standalone ? "glyph-btn glyph-btn--standalone" : "glyph-btn"}
      onClick={onClick}
      aria-label={nudge.label}
    >
      <Icon name={standalone ? "system-language" : "system-language-bold"} size={20} />
    </button>
  );
}

type NudgeProps = { onSwitch: () => void; onDismiss: () => void };

/**
 * The panel opens out of the glyph it hangs off (origin at the trigger) with a
 * soft overshoot, then its content forms the way the inline nudge's does: the
 * glyph pops, the words rise one by one, the buttons form after. It leaves the
 * way the tooltip dismiss does — one layer receding back toward the glyph
 * (fade, slight scale, lift, soft blur) on a spring that never overshoots.
 */
const panel: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: -6, filter: "blur(4px)" },
  shown: {
    opacity: 1, scale: 1, y: 0, filter: "blur(0px)",
    transition: { ...SPR.form, delay: at(0.35), ...stagger(0.05, 0.43) },
  },
  gone: { opacity: 0, scale: 0.94, y: -8, filter: "blur(3px)", transition: SPR.recede },
};
// Children only form in; on exit they leave with the panel as one layer.
const only = (v: Variants): Variants => ({ hidden: v.hidden, shown: v.shown });
const words = { shown: { transition: stagger(0.05) } };
// The close cross rests at 0.7, so its pop lands there rather than at 1.
const closePop: Variants = { hidden: popIn.hidden, shown: { ...(popIn.shown as object), opacity: 0.7 } };
// Motion writes `transform` inline, which would override the CSS press
// feedback — so the forming happens on a wrapper and the button keeps :active.

/**
 * Variant B — tooltip. Derived, not mirrored: the Figma section only draws the
 * inline layout, so this is a first pass at the other surviving direction.
 * It hangs off the glyph in the search bar and floats over the results, which
 * is the whole point of the comparison — nothing below it moves.
 */
export function TooltipNudge({ onSwitch, onDismiss }: NudgeProps) {
  const label = nudge.label.split(" ");
  return (
    <motion.div
      className="tooltip"
      role="dialog"
      aria-label={nudge.label}
      variants={panel}
      initial="hidden"
      animate="shown"
      exit="gone"
    >
      <div className="tooltip-head">
        <motion.span className="tooltip-glyph" variants={only(popIn)}>
          <Icon name="system-language-bold" size={18} />
        </motion.span>
        <motion.span className="tooltip-label" variants={words}>
          {label.map((w, i) => (
            <motion.span className="tooltip-word" key={i} variants={only(rise)}>
              {w}{i < label.length - 1 ? " " : ""}
            </motion.span>
          ))}
        </motion.span>
        <motion.span className="tooltip-wrap" variants={closePop}>
          <button className="tooltip-close" onClick={onDismiss} aria-label={nudge.dismiss}>
            <Icon name="system-cross" size={16} />
          </button>
        </motion.span>
      </div>
      <div className="tooltip-actions">
        <motion.span className="tooltip-wrap" variants={only(formSurface)}>
          <button className="tooltip-btn tooltip-btn--quiet" onClick={onDismiss}>{nudge.dismiss}</button>
        </motion.span>
        <motion.span className="tooltip-wrap" variants={only(formSurface)}>
          <button className="tooltip-btn tooltip-btn--bold" onClick={onSwitch}>{nudge.action}</button>
        </motion.span>
      </div>
    </motion.div>
  );
}
