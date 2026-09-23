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
