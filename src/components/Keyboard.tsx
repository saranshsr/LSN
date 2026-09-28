import { motion } from "motion/react";

import { Icon } from "../icons/Icon";
import { SPR, at } from "../motion/springs";

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];
/** iOS Arabic, for the Arabic query on the English app — read right to left. */
const ROWS_AR = [
  ["ض", "ص", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج"],
  ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك"],
  ["ظ", "ط", "ذ", "د", "ز", "ر", "و", "ة", "ث"],
];

/**
 * A prop, not a real IME. Measured off the frame: the grey block starts at
 * y516, rows are 41.5 tall on a 52 pitch starting at y539, keys are 30 wide on
 * a 36.5 pitch, and the home-indicator strip below the block is white.
 *
 * Docks on the `dock` spring a beat after the overlay arrives, and drops on
 * `recede` before the overlay leaves — it takes its cue from the screen's
 * variants (`hidden` / `shown` / `gone`), so it needs no state of its own.
 */
const dock = {
  hidden: { y: "100%" },
  shown: { y: 0, transition: { ...SPR.dock, delay: at(0.06) } },
  gone: { y: "100%", transition: SPR.recede },
};
/** `down` is the key the query is typing right now: it lights the way a
 *  finger on it would, so the typing reads as typed. */
export function Keyboard({ onReturn, layout = "en", down }: { onReturn: () => void; layout?: "en" | "ar"; down?: string | null }) {
  const ar = layout === "ar";
  const rows = ar ? ROWS_AR : ROWS;
  const key = (k: string) => <span className="key" key={k} data-down={down === k ? "" : undefined}>{k}</span>;
  return (
    <motion.div className="keyboard" variants={dock} dir="ltr">
      <div className="keyboard-keys">
        <div className="keyboard-row" dir={ar ? "rtl" : undefined}>{rows[0].map(key)}</div>
        <div className={ar ? "keyboard-row" : "keyboard-row keyboard-row--indent"} dir={ar ? "rtl" : undefined}>{rows[1].map(key)}</div>
        <div className="keyboard-row">
          {ar ? null : <span className="key key--mod">⇧</span>}
          <span className="keyboard-letters" dir={ar ? "rtl" : undefined}>{rows[2].map(key)}</span>
          <span className="key key--mod">⌫</span>
        </div>
        <div className="keyboard-row">
          <span className="key key--abc">{ar ? "123" : "ABC"}</span>
          <span className="key key--space">{ar ? "مسافة" : ""}</span>
          <span className="key key--dot">.</span>
          <button className="key key--return" onClick={onReturn} aria-label="Search">↵</button>
        </div>
      </div>
      <div className="keyboard-foot">
        <Smiley />
        <Icon name="system-mic" size={20} />
      </div>
    </motion.div>
  );
}

/** The emoji key. Not a DS icon — iOS draws its own. */
function Smiley() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9.2" />
      <path d="M8.2 14.2a4.6 4.6 0 0 0 7.6 0" strokeLinecap="round" />
      <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
