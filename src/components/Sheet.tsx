import { useRef } from "react";
import { AnimatePresence, motion, type PanInfo } from "motion/react";

import { Icon } from "../icons/Icon";
import { sheet } from "../data/copy";
import { duration, easing } from "../motion/tokens";

/** Grabber + sheet + home indicator — the travel a full dismissal covers. */
const DOCK_H = 341;
/** Apple's projection constant from Designing Fluid Interfaces. */
const DECEL = 0.998;
const project = (v: number) => (v / 1000) * DECEL / (1 - DECEL);
/** Past this share of the dock, the projected landing point means "dismiss". */
const COMMIT = 0.35;

const enter = { type: "spring", duration: 0.42, bounce: 0.12 } as const;
/** Exit faster than it entered — the system responding, not the user deciding. */
const exit = { duration: duration.base, ease: easing.standard } as const;

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
            <div className="sheet" role="dialog" aria-label={sheet.title}>
              <div className="sheet-header">
                <Icon name="system-language-bold" size={48} />
              </div>
              <h2 className="sheet-title">{sheet.title}</h2>
              <p className="sheet-body">
                {before}
                <b>{sheet.bodyEmphasis}</b>
                {after}
              </p>
              <div className="sheet-actions">
                <button className="btn-lg btn-lg--secondary" onClick={onCancel}>{sheet.cancel}</button>
                <button
                  className="btn-lg btn-lg--primary"
                  onClick={(e) => onConfirm(e.currentTarget.getBoundingClientRect())}
                >
                  {sheet.action}
                </button>
              </div>
            </div>
            <div className="sheet-homebar" />
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
