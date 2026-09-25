import { useRef } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";

import { Icon } from "../icons/Icon";
import type { Locale } from "../data/copy";
import { SHEET } from "../flow/v5";
import { SPR, at } from "../motion/springs";

/** Grabber + sheet + home indicator — the travel a full dismissal covers. */
const DOCK_H = { sheet1: 28 + 212 + 33, sheet2: 28 + 500 + 33 };
/** Apple's projection constant from Designing Fluid Interfaces. */
const DECEL = 0.998;
const project = (v: number) => (v / 1000) * DECEL / (1 - DECEL);
/** Past this share of the dock, the projected landing point means "dismiss". */
const COMMIT = 0.35;

/** Docks on the `sheet` spring (a whisper of settle); leaves on `recede`, which
 *  never overshoots — the system responding, not the user deciding. */
const enter = SPR.sheet;
const exit = SPR.recede;

type Props = {
  open: boolean;
  variant: "sheet1" | "sheet2";
  /** The app's language — the sheet is written in it and offers the other. */
  locale: Locale;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * M-BottomSheet, iteration 5: "Sheet · option 1" (530:27774) or "Sheet ·
 * option 2" (530:28151), each with its Arabic-app twin. The device's dir
 * mirrors them; the switch button is in the offered language.
 *
 * Enter and exit share the same `y` the drag writes to, so an interrupted
 * gesture keeps its velocity instead of restarting from zero. Option 2 has no
 * Not now: the scrim and the drag are its way out.
 */
export function ConfirmSheet({ open, variant, locale, onCancel, onConfirm }: Props) {
  const release = useRef(0);
  const onDragEnd = (_: unknown, info: PanInfo) => {
    release.current = info.velocity.y;
    const projected = info.offset.y + project(info.velocity.y);
    if (projected > DOCK_H[variant] * COMMIT) onCancel();
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="scrim"
            className="sheet-scrim v5-scrim"
            onClick={onCancel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: SPR.fade }}
            exit={{ opacity: 0, transition: exit }}
          />
          <motion.div
            key="dock"
            className="sheet-dock"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.03, bottom: 0.9 }}
            onDragEnd={onDragEnd}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%", transition: { ...exit, velocity: release.current } }}
            transition={enter}
          >
            <div className="sheet-grabber" />
            {variant === "sheet1"
              ? <SheetOne locale={locale} onCancel={onCancel} onConfirm={onConfirm} />
              : <SheetTwo locale={locale} onConfirm={onConfirm} />}
            <div className="sheet-homebar v5-homebar" />
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

/** The five chevrons between the two stops, as Figma draws them: 6.1 apart on
 *  the diagonal, fading up from 0.3 at the profile to 1 at the language. */
const CHEVRONS = [0.3, 0.55, 0.75, 0.9, 1];

/**
 * The way back, drawn: profile → five chevrons → language (530:26606). When the
 * sheet docks, the chevrons light up one after another from the profile to the
 * language, once — the route the copy describes, walked. Reduced motion: they
 * are simply there.
 */
function WayBack() {
  const reduced = useReducedMotion();
  return (
    <div className="s1-path" aria-hidden="true">
      <span className="s1-stop s1-stop--profile"><Icon name="bottomnav-profile" size={20.4} /></span>
      {CHEVRONS.map((o, i) => (
        <motion.svg
          key={i}
          className="s1-chev"
          width={21} height={21} viewBox="0 0 21 21"
          style={{ left: 45.7 + 6.1 * i - 10.5, top: 44.7 + 6.1 * i - 10.5 }}
          initial={reduced ? false : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: o, scale: 1, transition: { ...SPR.form, delay: at(0.38 + i * 0.07) } }}
        >
          <path d="M12.0706 12.0704C11.9898 12.1512 11.8786 12.2005 11.7558 12.2005L6.71763 12.2005C6.47202 12.2005 6.27259 12.0011 6.27207 11.755C6.27207 11.5094 6.47149 11.3099 6.71763 11.3094L11.3107 11.3094L11.3107 6.71632C11.3107 6.47071 11.5102 6.27129 11.7563 6.27076C12.0019 6.27076 12.2013 6.47019 12.2018 6.71632L12.2018 11.7545C12.2018 11.8773 12.152 11.989 12.0717 12.0693L12.0706 12.0704Z" fill="currentColor" />
        </motion.svg>
      ))}
      <motion.span
        className="s1-stop s1-stop--lang"
        initial={reduced ? false : { scale: 0.86 }}
        animate={{ scale: 1, transition: { ...SPR.pop, delay: at(0.38 + CHEVRONS.length * 0.07) } }}
      >
        <Icon name="system-language-bold" size={20.4} />
      </motion.span>
    </div>
  );
}

function SheetOne({ locale, onCancel, onConfirm }: { locale: Locale; onCancel: () => void; onConfirm: () => void }) {
  const c = SHEET[locale].one;
  return (
    <div className="v5-sheet s1" role="dialog" aria-label={c.title}>
      <div className="s1-head">
        <div className="s1-copy">
          <h2 className="s1-title">{c.title}</h2>
          <p className="s1-body">{c.body}</p>
        </div>
        <WayBack />
      </div>
      <div className="s1-actions">
        <button className="v5-btn v5-btn--quiet" onClick={onCancel}>{c.cancel}</button>
        <button className="v5-btn v5-btn--go" onClick={onConfirm} lang={c.actionLang}>{c.action}</button>
      </div>
    </div>
  );
}

/** Option 2: the Account page with its Language row lifted out of it, then one
 *  line of instruction and one dark button (530:28151). The illustration is
 *  Figma's render of the popup with its text taken out. */
function SheetTwo({ locale, onConfirm }: { locale: Locale; onConfirm: () => void }) {
  const c = SHEET[locale].two;
  return (
    <div className="v5-sheet s2" role="dialog" aria-label={c.title}>
      <img className="s2-art" src="/img/v5/sheet2-art.png" alt="" width={351} height={500} />
      <div className="s2-copy">
        <h2 className="s2-title">{c.title}</h2>
        <p className="s2-body">{c.body}</p>
        <button className="v5-btn v5-btn--dark" onClick={onConfirm} lang={c.actionLang}>{c.action}</button>
      </div>
    </div>
  );
}
