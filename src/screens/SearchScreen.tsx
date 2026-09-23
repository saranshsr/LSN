import { useEffect, useState } from "react";
import { motion } from "motion/react";

import { StatusBar } from "../components/chrome";
import { SearchBar } from "../components/SearchBar";
import { Keyboard } from "../components/Keyboard";
import { Icon } from "../icons/Icon";
import { QUERY, SUGGESTIONS } from "../data/copy";

/** Per character. Fast enough to read as typing, slow enough to watch. */
const KEY_MS = 95;
/** The overlay has to arrive and settle before anything is typed into it —
 *  the push takes ~400ms, so typing into a moving field looks wrong. */
const START_MS = 520;

/**
 * Frame `2 · Search — Arabic query` (278:45836). The user has typed an Arabic
 * query on an English app — the mismatch that arms the whole flow.
 *
 * The query types itself out. That is a presentation affordance, not product
 * behaviour: it exists so the mismatch is something the room watches happen
 * rather than something already on screen when the slide appears. Suggestions
 * hold until the query lands, then stagger in, which is also the honest
 * ordering — they are a response to the query.
 */
export function SearchScreen({ onSubmit }: { onSubmit: () => void }) {
  const [typed, setTyped] = useState(0);
  const done = typed >= QUERY.length;

  useEffect(() => {
    let i = 0;
    const tick = () => { i += 1; setTyped(i); };
    const start = setTimeout(function step() {
      tick();
      if (i < QUERY.length) timer = setTimeout(step, KEY_MS);
    }, START_MS);
    let timer: ReturnType<typeof setTimeout>;
    return () => { clearTimeout(start); clearTimeout(timer); };
  }, []);

  return (
    <div className="screen search-screen">
      <StatusBar />
      <motion.div className="search-head" layoutId="searchbar">
        <SearchBar query={QUERY.slice(0, typed)} caret height={48} typing={!done} />
      </motion.div>
      <div className="scroll">
        {done ? (
          <ul>
            {SUGGESTIONS.map((s) => (
              <li className="suggestion-item" key={s.text}>
                <button className="suggestion" onClick={onSubmit} title={s.gloss}>
                  <Icon name="system-search" size={24} />
                  {s.text}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <Keyboard onReturn={done ? onSubmit : () => {}} />
    </div>
  );
}
