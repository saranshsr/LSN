import { motion } from "motion/react";

import { SearchBar } from "./SearchBar";
import { Icon } from "../icons/Icon";
import { QUERY, nudge } from "../data/copy";
import { SPR, at } from "../motion/springs";

/**
 * The switched (Arabic) header. When the app comes back up after the switch,
 * the user first sees the full-width bar — exactly where the skeleton's bar
 * was, so nothing jumps — and then the nudge settles into its contracted form:
 * the bar makes room on the leading side and the language glyph pops into the
 * slot, on the left, because the layout is now RTL. It says "this is where the
 * language lives now" — and it is the way back to English.
 *
 * NOTE: the 23 Sep Figma component (278:68265) removed this glyph. Adding it
 * back here is the designer's call from the 24 Sep review (DIVERGENCES #11).
 */
export function ArHeader({ settle }: { settle: boolean }) {
  const initial = settle ? "hidden" : false;
  return (
    <header className="plp-header plp-header--plain plp-header--ar">
      <div className="plp-row plp-row--ar ar-row">
        <SearchBar query={QUERY} back />
        <motion.div
          className="ar-slot"
          initial={initial}
          animate="shown"
          variants={{
            hidden: { width: 0 },
            shown: { width: 52, transition: { ...SPR.move, delay: at(0.55) } },
          }}
        >
          <motion.span
            className="ar-glyph"
            initial={initial}
            animate="shown"
            variants={{
              hidden: { opacity: 0, scale: 0.35 },
              shown: { opacity: 1, scale: 1, transition: { ...SPR.form, delay: at(0.68) } },
            }}
          >
            <motion.span
              className="ar-glyph-icon"
              initial={initial}
              animate="shown"
              variants={{
                hidden: { opacity: 0, scale: 0.4, filter: "blur(5px)" },
                shown: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { ...SPR.pop, delay: at(0.78) } },
              }}
            >
              <button className="glyph-btn glyph-btn--standalone" aria-label={nudge.label}>
                <Icon name="system-language" size={20} />
              </button>
            </motion.span>
          </motion.span>
        </motion.div>
      </div>
    </header>
  );
}
