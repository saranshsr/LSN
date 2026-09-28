import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useAnimate, useReducedMotion, type PanInfo } from "motion/react";

import { Icon } from "../icons/Icon";
import type { Locale } from "../data/copy";
import { SHEET } from "../flow/v5";
import { SPR, at, spring } from "../motion/springs";

/** Grabber + sheet + home indicator — the travel a full dismissal covers. */
const DOCK_H = { sheet1: 28 + 212 + 33 };
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
  variant: "sheet1";
  /** The app's language — the sheet is written in it and offers the other. */
  locale: Locale;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * M-BottomSheet, iteration 5: the compact "Sheet · option 1" (530:27774) and
 * its Arabic-app twin. The illustrated option 2 is components/LanguageSheet. The device's dir
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
            <SheetOne locale={locale} onCancel={onCancel} onConfirm={onConfirm} />
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
const CHEV_PATH = "M12.0706 12.0704C11.9898 12.1512 11.8786 12.2005 11.7558 12.2005L6.71763 12.2005C6.47202 12.2005 6.27259 12.0011 6.27207 11.755C6.27207 11.5094 6.47149 11.3099 6.71763 11.3094L11.3107 11.3094L11.3107 6.71632C11.3107 6.47071 11.5102 6.27129 11.7563 6.27076C12.0019 6.27076 12.2013 6.47019 12.2018 6.71632L12.2018 11.7545C12.2018 11.8773 12.152 11.989 12.0717 12.0693L12.0706 12.0704Z";

/** The illustrated sheet's cadence (LanguageSheet): the first beat 0.45 s after
 *  the illustration lands, then every 1.55 s. */
const LOOP_FIRST = 0.45, LOOP_EVERY = 1.55;
/** The illustrated switch's `press` role: quick, no overshoot. */
const PRESS = spring(0.3, 1);
const walk = { duration: 0.42, ease: [0.23, 1, 0.32, 1] as const };

/**
 * The way back, drawn: profile → five chevrons → language (530:26606), built
 * in the same order as the illustrated sheet builds its scene, on the same
 * springs:
 *
 *   0.06  the tile's light swells in (the glows, `layout`)
 *   0.14  the profile stop rises (the phone, `rise`: y 14 → 0, 0.86 → 1)
 *   0.38  the chevrons light one after another toward the language (`form`)
 *   0.73  the language stop pops (`pop`)
 *
 * and then, like the illustrated switch, it keeps showing the route: every
 * 1.55 s a light walks down the chevrons and a fingertip lands on the language
 * stop — it squeezes (`press`), pops back (`pop`), a ring spreads off it.
 * Reduced motion: the resting frame, no loop.
 */
function WayBack() {
  const reduced = !!useReducedMotion();
  const [scope, animate] = useAnimate<HTMLDivElement>();

  useEffect(() => {
    if (reduced) return;
    const el = scope.current;
    const q = (sel: string) => el.querySelector<HTMLElement>(sel)!;
    const chevs = [...el.querySelectorAll<SVGElement>(".s1-chev")];
    const lang = q(".s1-stop--lang"), ring = q(".s1-ring");
    // 0.73: the language stop pops in.
    animate(lang, { opacity: 1, scale: [0.6, 1] }, { opacity: SPR.fade, scale: SPR.pop, delay: at(0.38 + CHEVRONS.length * 0.07) } as never);
    const timers: ReturnType<typeof setTimeout>[] = [];
    let alive = true;
    const beat = () => {
      if (!alive) return;
      chevs.forEach((c, i) => {
        animate(c, { opacity: [CHEVRONS[i], 1, CHEVRONS[i]], scale: [1, 1.14, 1] }, { ...walk, delay: i * 0.06 });
      });
      const land = CHEVRONS.length * 0.06 + 0.08;
      // The pop back is started when the squeeze lands — queued up front, it
      // would replace the squeeze before it ever played.
      timers.push(setTimeout(() => {
        if (!alive) return;
        animate(lang, { scale: 0.9 }, PRESS);
        timers.push(setTimeout(() => { if (alive) animate(lang, { scale: 1 }, SPR.pop); }, 160));
      }, land * 1000));
      // From 0, so nothing shows while it waits for the tap.
      animate(ring, { opacity: [0, 0.55, 0], scale: [1, 1.2, 1.9] }, { duration: 0.6, times: [0, 0.12, 1], ease: "easeOut", delay: land + 0.05 });
      timers.push(setTimeout(beat, LOOP_EVERY * 1000));
    };
    // The build lands at ~0.73 s + the pop's settle.
    timers.push(setTimeout(beat, (at(0.73) + 0.35 + LOOP_FIRST) * 1000));
    return () => { alive = false; timers.forEach(clearTimeout); };
  }, [reduced, animate, scope]);

  return (
    // The outer tile keeps the Arabic mirror (a CSS transform); the swell runs
    // on the layer inside it so the two never overwrite each other.
    <div className="s1-path" aria-hidden="true" ref={scope}>
    <motion.div
      className="s1-path-in"
      initial={reduced ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1, transition: { ...SPR.layout, delay: at(0.06) } }}
    >
      <motion.span
        className="s1-stop s1-stop--profile"
        initial={reduced ? false : { opacity: 0, y: 14, scale: 0.86 }}
        animate={{ opacity: 1, y: 0, scale: 1, transition: { ...SPR.rise, delay: at(0.14) } }}
      >
        <Icon name="bottomnav-profile" size={20.4} />
      </motion.span>
      {CHEVRONS.map((o, i) => (
        <motion.svg
          key={i}
          className="s1-chev"
          width={21} height={21} viewBox="0 0 21 21"
          style={{ left: 45.7 + 6.1 * i - 10.5, top: 44.7 + 6.1 * i - 10.5 }}
          initial={reduced ? false : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: o, scale: 1, transition: { ...SPR.form, delay: at(0.38 + i * 0.07) } }}
        >
          <path d={CHEV_PATH} fill="currentColor" />
        </motion.svg>
      ))}
      {/* Driven by the same `animate` as the loop's press, so the two never
          fight over its scale. */}
      <span className="s1-stop s1-stop--lang" style={reduced ? undefined : { opacity: 0, transform: "scale(0.6)" }}>
        <span className="s1-ring" />
        <Icon name="system-language-bold" size={20.4} />
      </span>
    </motion.div>
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
