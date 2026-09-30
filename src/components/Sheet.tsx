import { useRef } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";

import type { Locale } from "../data/copy";
import { SHEET } from "../flow/v5";
import { SPR, at } from "../motion/springs";

/** Grabber + sheet + home indicator — the travel a full dismissal covers. */
const DOCK_H = { sheet3: 28 + 230 + 33 };
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
  variant: "sheet3";
  /** The app's language — the sheet is written in it and offers the other. */
  locale: Locale;
  /** The scrim or a drag down: the sheet closes, the nudge stays. */
  onCancel: () => void;
  /** "Keep English": the sheet closes and the nudge goes too (28 Sep). */
  onKeep: () => void;
  onConfirm: () => void;
};

/**
 * M-BottomSheet, iteration 5: "Sheet · option 3" (805:26233) and its
 * Arabic-app twin. The illustrated option 2 is components/LanguageSheet; the
 * compact option 1 was dropped on 30 Sep. The device's dir mirrors it; the
 * switch button is in the offered language.
 *
 * Enter and exit share the same `y` the drag writes to, so an interrupted
 * gesture keeps its velocity instead of restarting from zero.
 */
export function ConfirmSheet({ open, variant, locale, onCancel, onKeep, onConfirm }: Props) {
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
            <SheetThree locale={locale} onKeep={onKeep} onConfirm={onConfirm} />
            <div className="sheet-homebar v5-homebar" />
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

/** language-bold at 48 with its blue → navy gradient (805:26195). */
function LangGlyph() {
  return (
    <svg width={48} height={48} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="s3-lang" x1="-4.52631" y1="2.87321" x2="48.7446" y2="40.9865" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F61FF" />
          <stop offset="1" stopColor="#101628" />
        </linearGradient>
      </defs>
      <g transform="translate(2 3.762)" fill="url(#s3-lang)">
        <path d="M24.785 27.0875C22.38 25.175 20.3225 23.085 18.5 20.82C20.885 17.43 23.0175 13.565 25.3025 8.4725H30.0025C31.1075 8.4725 32.0025 7.5775 32.0025 6.4725C32.0025 5.3675 31.1075 4.4725 30.0025 4.4725H24.035C24.035 4.4725 24.0225 4.4725 24.0175 4.4725H18.005V2C18.005 0.895 17.11 0 16.005 0C14.9 0 14.005 0.895 14.005 2V4.4725H2C0.895 4.4725 0 5.3675 0 6.4725C0 7.5775 0.895 8.4725 2 8.4725H20.9C19.4 11.685 17.8175 14.6575 16 17.4C14.4675 15.09 13.1 12.6175 11.81 9.9725H7.38C9.0875 13.65 11.0425 17.3275 13.5075 20.8175C11.115 23.79 8.315 26.4525 4.865 28.825C3.955 29.45 3.725 30.695 4.35 31.605C4.7375 32.17 5.3625 32.4725 6 32.4725C6.39 32.4725 6.785 32.3575 7.13 32.12C10.4775 29.82 13.4025 27.1625 16.005 24.0625C18.0625 26.5125 20.4375 28.8325 23.2375 30.9475L24.7825 27.085L24.785 27.0875Z" />
        <path d="M43.8575 37.7325L35.8575 17.7325C35.555 16.9725 34.8175 16.475 34 16.475H32C31.1825 16.475 30.4475 16.9725 30.1425 17.7325L22.1425 37.7325C21.7325 38.7575 22.23 39.9225 23.2575 40.3325C24.2825 40.7425 25.4475 40.245 25.8575 39.2175L27.755 34.475H38.2475L40.145 39.2175C40.4575 40 41.21 40.475 42.0025 40.475C42.25 40.475 42.5 40.43 42.745 40.3325C43.77 39.9225 44.27 38.7575 43.86 37.7325H43.8575ZM29.355 30.475L33 21.36L36.645 30.475H29.3525H29.355Z" />
      </g>
    </svg>
  );
}

/** info-circle at 14 (805:26203). */
function InfoIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden="true" fill="#666D85">
      <g transform="translate(1.3125 1.3125)">
        <path d="M5.25 8.02083V5.10417C5.25 4.86254 5.44588 4.66667 5.6875 4.66667C5.92912 4.66667 6.125 4.86254 6.125 5.10417V8.02083C6.125 8.26246 5.92912 8.45833 5.6875 8.45833C5.44588 8.45833 5.25 8.26246 5.25 8.02083Z" />
        <path d="M5.6875 4.01042C6.04994 4.01042 6.34375 3.7166 6.34375 3.35417C6.34375 2.99173 6.04994 2.69792 5.6875 2.69792C5.32506 2.69792 5.03125 2.99173 5.03125 3.35417C5.03125 3.7166 5.32506 4.01042 5.6875 4.01042Z" />
        <path d="M10.5 5.6875C10.5 3.02963 8.34537 0.875 5.6875 0.875C3.02963 0.875 0.875 3.02963 0.875 5.6875C0.875 8.34537 3.02963 10.5 5.6875 10.5C8.34537 10.5 10.5 8.34537 10.5 5.6875ZM11.375 5.6875C11.375 8.82862 8.82862 11.375 5.6875 11.375C2.54638 11.375 0 8.82862 0 5.6875C0 2.54638 2.54638 0 5.6875 0C8.82862 0 11.375 2.54638 11.375 5.6875Z" />
      </g>
    </svg>
  );
}

/**
 * "Sheet · option 3" (805:26233): the language glyph, the title, Keep English
 * + the switch, and the way back as one line under them. It builds the way
 * the other two build their scenes, on the same springs — the sheet docks,
 * then 0.14 the glyph pops (`pop`), 0.2 the title rises (`rise`), 0.3 the hint
 * follows; the buttons are there from the start, like the others'. No loop:
 * there is no switch in the picture to show. Reduced motion: at rest.
 */
function SheetThree({ locale, onKeep, onConfirm }: { locale: Locale; onKeep: () => void; onConfirm: () => void }) {
  const c = SHEET[locale].three;
  const reduced = useReducedMotion();
  const up = (delay: number, spring = SPR.rise) => reduced ? {} : {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { ...spring, delay: at(delay) } },
  };
  return (
    <div className="v5-sheet s3" role="dialog" aria-label={c.title}>
      <div className="s3-head">
        <motion.span
          className="s3-glyph"
          initial={reduced ? false : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1, transition: { opacity: { ...SPR.fade, delay: at(0.14) }, scale: { ...SPR.pop, delay: at(0.14) } } }}
        >
          <LangGlyph />
        </motion.span>
        <motion.h2 className="s3-title" {...up(0.2)}>{c.title}</motion.h2>
      </div>
      <div className="s3-body">
        <div className="s3-actions">
          <button className="v5-btn v5-btn--quiet" onClick={onKeep}>{c.cancel}</button>
          <button className="v5-btn v5-btn--go" onClick={onConfirm} lang={c.actionLang}>{c.action}</button>
        </div>
        <motion.p className="s3-hint" {...up(0.3)}>
          <InfoIcon />
          <span>{c.hint}<b>{c.hintStrong}</b></span>
        </motion.p>
      </div>
    </div>
  );
}
