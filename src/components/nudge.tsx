import { Icon } from "../icons/Icon";
import { nudge } from "../data/copy";

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
 * Variant B — tooltip. Derived, not mirrored: the Figma section only draws the
 * inline layout, so this is a first pass at the other surviving direction.
 * It hangs off the glyph in the search bar and floats over the results, which
 * is the whole point of the comparison — nothing below it moves.
 */
export function TooltipNudge({ onSwitch, onDismiss }: NudgeProps) {
  return (
    <div className="tooltip" role="dialog" aria-label={nudge.label}>
      <div className="tooltip-head">
        <Icon name="system-language-bold" size={18} />
        <span className="tooltip-label">{nudge.label}</span>
        <button className="tooltip-close" onClick={onDismiss} aria-label={nudge.dismiss}>
          <Icon name="system-cross" size={16} />
        </button>
      </div>
      <div className="tooltip-actions">
        <button className="tooltip-btn tooltip-btn--quiet" onClick={onDismiss}>{nudge.dismiss}</button>
        <button className="tooltip-btn tooltip-btn--bold" onClick={onSwitch}>{nudge.action}</button>
      </div>
    </div>
  );
}
