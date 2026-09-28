import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

import { StatusBar } from "../components/chrome";
import { SearchBar } from "../components/SearchBar";
import { Keyboard } from "../components/Keyboard";
import { SPR, stagger } from "../motion/springs";
import type { Locale } from "../data/copy";

/** Per character. Fast enough to read as typing, slow enough to watch. */
const KEY_MS = 95;
/** The overlay settles before anything is typed into it (the bar's flight
 *  lands in ~500ms). */
const START_MS = 520;
/** How long a key stays lit under the typing finger. */
const TAP_MS = 80;

/**
 * Search, iteration 5 (A · 02 687:88297, B · 01b 695:23775, SM · 02 687:88469):
 * the pre-results page — recently searched, trending searches, the noon One
 * banner, recently viewed categories — with the query in the bar.
 *
 * The page is Figma's own render with its header taken out; the bar on top is
 * live — the shared element Home's bar flies into (shell/BarFlight). The
 * keyboard docks a beat after the overlay lands, the sections rise in behind
 * it, and the query types itself in, as a presentation affordance, each key
 * lighting as it goes — in Arabic for the Arabic query. Return searches (so
 * does a tap on the page once the query is in); the keyboard drops as the bar
 * flies on into the results header.
 */
const page = { shown: { transition: stagger(0.06, 0.12) } };
const band = {
  hidden: { opacity: 0, y: 9, filter: "blur(4px)" },
  shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: SPR.rise },
};
/** The page's sections, in the render's own coordinates (y from the frame top). */
const BANDS: [number, number][] = [[102, 300], [300, 440], [440, 515], [515, 812]];

export function SearchScreen({ onSubmit, query, locale, image }: { onSubmit: () => void; query: string; locale: Locale; image: string }) {
  const [typed, setTyped] = useState(0);
  const [down, setDown] = useState<string | null>(null);
  const done = typed >= query.length;
  const sent = useRef(false);
  const submit = () => { if (sent.current) return; sent.current = true; onSubmit(); };

  useEffect(() => {
    let i = 0;
    let timer: ReturnType<typeof setTimeout>, lift: ReturnType<typeof setTimeout>;
    const start = setTimeout(function step() {
      setDown(query[i]); i += 1; setTyped(i);
      clearTimeout(lift); lift = setTimeout(() => setDown(null), TAP_MS);
      if (i < query.length) timer = setTimeout(step, KEY_MS);
    }, START_MS);
    return () => { clearTimeout(start); clearTimeout(timer); clearTimeout(lift); };
  }, [query]);

  return (
    <div className="screen search-screen v5-search" onClick={done ? submit : undefined}>
      <StatusBar />
      <div className="v5-search-head" dir={locale === "ar" ? "rtl" : "ltr"}>
        <SearchBar query={query.slice(0, typed)} caret back height={48} typing={!done} variant="search" />
      </div>
      <motion.div className="v5-search-page" initial="hidden" animate="shown" variants={page} dir="ltr">
        {BANDS.map(([top, bottom]) => (
          <motion.div
            key={top}
            className="v5-search-band"
            variants={band}
            style={{ top, height: bottom - top, backgroundImage: `url(${image})`, backgroundPosition: `0 ${-top}px` }}
          />
        ))}
      </motion.div>
      <div className="v5-search-kbd" onClick={(e) => e.stopPropagation()}>
        <Keyboard layout={/[\u0600-\u06ff]/.test(query) ? "ar" : "en"} down={down} onReturn={done ? submit : () => {}} />
      </div>
    </div>
  );
}
