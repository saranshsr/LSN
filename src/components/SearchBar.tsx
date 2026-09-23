import { Icon } from "../icons/Icon";

type Props = {
  /** Typed query, or undefined for the resting placeholder state. */
  query?: string;
  placeholder?: string;
  /** Leading chevron — the PLP header has one, Home does not. */
  back?: boolean;
  caret?: boolean;
  /** Mid-keystroke: the caret holds solid instead of blinking. */
  typing?: boolean;
  /** Border handled by a wrapper the header animates. */
  bare?: boolean;
  /** 44 in the PLP header, 48 on Home and in the search overlay. */
  height?: 44 | 48;
  onClick?: () => void;
};

const hasArabic = (s: string) => /[؀-ۿ]/.test(s);

/** M-SearchBar. The camera sits behind a hairline divider. */
export function SearchBar({ query, placeholder, back, caret, typing, bare, height = 44, onClick }: Props) {
  // In an LTR field an Arabic run is laid out first, so the caret — the logical
  // end of the text — lands on its LEFT. The frames show exactly that.
  // An empty query has no Arabic to detect yet, but the caret still belongs
  // on the left, where the Arabic run will grow from.
  const caretFirst = caret && query !== undefined && (hasArabic(query) || query === "");
  const bar = <span className="searchbar-caret" data-typing={!!typing} />;
  return (
    <div className={bare ? "searchbar searchbar--bare" : "searchbar"} style={{ height }} onClick={onClick} role={onClick ? "button" : undefined}>
      {back
        ? <Icon name="system-chevron-left" size={20} className="searchbar-icon searchbar-icon--back" />
        : <Icon name="system-search" size={20} className="searchbar-icon" />}
      <span className="searchbar-input" data-placeholder={query === undefined}>
        {caretFirst ? bar : null}
        <span className="searchbar-value">{query ?? placeholder}</span>
        {caret && !caretFirst ? bar : null}
      </span>
      <span className="searchbar-divider" />
      <Icon name="system-camera" size={20} className="searchbar-icon" />
    </div>
  );
}
