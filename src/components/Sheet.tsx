import { useRef } from "react";
import { AnimatePresence, motion, type PanInfo } from "motion/react";

import { Icon } from "../icons/Icon";
import { sheet } from "../data/copy";
import { SPR, popIn, rise, stagger } from "../motion/springs";

/** Grabber + sheet + home indicator — the travel a full dismissal covers. */
const DOCK_H = 341;
/** Apple's projection constant from Designing Fluid Interfaces. */
const DECEL = 0.998;
const project = (v: number) => (v / 1000) * DECEL / (1 - DECEL);
/** Past this share of the dock, the projected landing point means "dismiss". */
const COMMIT = 0.35;

/** Docks on the `sheet` spring (a whisper of settle); leaves on `recede`, which
 *  never overshoots — the system responding, not the user deciding. */
const enter = SPR.sheet;
const exit = SPR.recede;

/**
 * Once the sheet is docking, its content forms the way the nudge's does:
 * the glyph pops, the title's words rise one by one, the body rises, then the
 * buttons settle in. On exit nothing moves on its own — the sheet leaves as
 * one layer. Buttons keep their CSS press, so the forming is on wrappers.
 */
const content = { shown: { transition: stagger(0.05, 0.1) } };
const only = (v: typeof rise) => ({ hidden: v.hidden, shown: v.shown });
const words = { shown: { transition: stagger(0.045) } };
const settle = {
  hidden: { opacity: 0, y: 8, scale: 0.96, filter: "blur(3px)" },
  shown: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: SPR.form },
};

type Props = {
  open: boolean;
  onCancel: () => void;
  /** Receives the button's rect, so the reload can grow out of it. */
  onConfirm: (from: DOMRect) => void;
};

/**
 * M-BottomSheet + M-StackedActionBar, frame 278:89196.
 *
 * Enter and exit share the same `y` the drag writes to, so an interrupted
 * gesture keeps its velocity instead of restarting from zero. Downward drag
 * runs free; upward meets rising resistance rather than a wall.
 *
 */
export function ConfirmSheet({ open, onCancel, onConfirm }: Props) {
  const [before, after] = sheet.body.split(sheet.bodyEmphasis);
  // Carried into the exit spring so there is no seam between the finger
  // letting go and the animation taking over.
  const release = useRef(0);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    release.current = info.velocity.y;
    // Where the flick was heading, not how far it got. A short fast flick
    // dismisses; a long slow drag that stopped short does not.
    const projected = info.offset.y + project(info.velocity.y);
    if (projected > DOCK_H * COMMIT) onCancel();
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="sheet-scrim"
            onClick={onCancel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={exit}
          />
          <motion.div
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
            <motion.div className="sheet" role="dialog" aria-label={sheet.title} initial="hidden" animate="shown" variants={content}>
              <div className="sheet-header">
                <motion.span className="sheet-glyph" variants={only(popIn)}>
                  <Icon name="system-language-bold" size={48} />
                </motion.span>
              </div>
              <motion.h2 className="sheet-title" variants={words}>
                {sheet.title.split(" ").map((w, i, all) => (
                  <motion.span className="sheet-word" key={i} variants={only(rise)}>
                    {w}{i < all.length - 1 ? " " : ""}
                  </motion.span>
                ))}
              </motion.h2>
              <motion.p className="sheet-body" variants={only(rise)}>
                {before}
                <b>{sheet.bodyEmphasis}</b>
                {after}
              </motion.p>
              <div className="sheet-actions">
                <motion.div className="sheet-action" variants={settle}>
                  <button className="btn-lg btn-lg--secondary" onClick={onCancel}>{sheet.cancel}</button>
                </motion.div>
                <motion.div className="sheet-action" variants={settle}>
                  <button
                    className="btn-lg btn-lg--primary"
                    onClick={(e) => onConfirm(e.currentTarget.getBoundingClientRect())}
                  >
                    {sheet.action}
                  </button>
                </motion.div>
              </div>
            </motion.div>
            <div className="sheet-homebar" />
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
