import { useRef } from "react";
import { AnimatePresence, motion, type PanInfo } from "motion/react";

import { Icon } from "../icons/Icon";
import { sheet, sheetAr, type Locale } from "../data/copy";
import { SPR } from "../motion/springs";

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

type Props = {
  open: boolean;
  /** The CURRENT language — the sheet offers the other one, in this one. */
  locale: Locale;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * M-BottomSheet + M-StackedActionBar, frame 278:89196 — and its Arabic twin,
 * opened from the glyph on the switched screen to go back to English.
 *
 * The copy does not animate: it is what the user has to read and decide on,
 * so it is simply there when the sheet docks. What moves is the background —
 * a few soft pools of light drifting slowly behind the glyph, so the sheet
 * feels alive without anything competing with the words.
 *
 * Enter and exit share the same `y` the drag writes to, so an interrupted
 * gesture keeps its velocity instead of restarting from zero.
 */
export function ConfirmSheet({ open, locale, onCancel, onConfirm }: Props) {
  const c = locale === "ar" ? sheetAr : sheet;
  const [before, after] = c.body.split(c.bodyEmphasis);
  const release = useRef(0);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    release.current = info.velocity.y;
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
            animate={{ opacity: 1, transition: SPR.fade }}
            exit={{ opacity: 0, transition: exit }}
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
            <div className={locale === "ar" ? "sheet sheet--ar" : "sheet"} role="dialog" aria-label={c.title}>
              <div className="sheet-aura" aria-hidden="true"><i /><i /><i /></div>
              <div className="sheet-header">
                <Icon name="system-language-bold" size={48} />
              </div>
              <h2 className="sheet-title">{c.title}</h2>
              {locale === "ar" ? <p className="sheet-gloss" dir="ltr" lang="en">{sheetAr.gloss}</p> : null}
              <p className="sheet-body">
                {before}
                <b>{c.bodyEmphasis}</b>
                {after}
              </p>
              <div className="sheet-actions">
                <button className="btn-lg btn-lg--secondary" onClick={onCancel}>{c.cancel}</button>
                <button className="btn-lg btn-lg--primary" onClick={onConfirm}>{c.action}</button>
              </div>
            </div>
            <div className="sheet-homebar" />
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
