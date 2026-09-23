import { Icon } from "../icons/Icon";

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

/**
 * A prop, not a real IME. Measured off the frame: the grey block starts at
 * y516, rows are 41.5 tall on a 52 pitch starting at y539, keys are 30 wide on
 * a 36.5 pitch, and the home-indicator strip below the block is white.
 */
export function Keyboard({ onReturn }: { onReturn: () => void }) {
  return (
    <div className="keyboard">
      <div className="keyboard-keys">
        <div className="keyboard-row">
          {ROWS[0].map((k) => <span className="key" key={k}>{k}</span>)}
        </div>
        <div className="keyboard-row keyboard-row--indent">
          {ROWS[1].map((k) => <span className="key" key={k}>{k}</span>)}
        </div>
        <div className="keyboard-row">
          <span className="key key--mod">⇧</span>
          {ROWS[2].map((k) => <span className="key" key={k}>{k}</span>)}
          <span className="key key--mod">⌫</span>
        </div>
        <div className="keyboard-row">
          <span className="key key--abc">ABC</span>
          <span className="key key--space" />
          <span className="key key--dot">.</span>
          <button className="key key--return" onClick={onReturn} aria-label="Search">↵</button>
        </div>
      </div>
      <div className="keyboard-foot">
        <Smiley />
        <Icon name="system-mic" size={20} />
      </div>
    </div>
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
