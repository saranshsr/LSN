import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import type { Locale } from "../data/copy";
import { TOAST, TOAST_MS } from "../flow/v5";
import { SPR, at } from "../motion/springs";

/**
 * The undo toast (528:26667), over the switched results just above the bottom
 * nav (A2 · 08: y659). It rises 17pt into place as the results land and, after
 * 4 s, sinks back the same 17pt as it fades (A2 · 09 draws it mid-way: y676,
 * 40%). Enter and exit share one path, so the way it goes explains where it
 * came from.
 *
 * `to` is the language the app switched to: the message is in it, the Undo in
 * the language the person came from, so the way back reads in their language.
 */
export function UndoToast({ show, to, top = 659, onUndo, onTimeout }: { show: boolean; to: Locale; top?: number; onUndo: () => void; onTimeout: () => void }) {
  const c = TOAST[to];
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onTimeout, TOAST_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="toast"
          className="v5-toast"
          role="status"
          style={{ top }}
          initial={{ opacity: 0, y: 17 }}
          animate={{ opacity: 1, y: 0, transition: SPR.move }}
          exit={{ opacity: 0, y: 17, transition: SPR.recede }}
        >
          <SuccessCheck />
          <span className="v5-toast-title">{c.title}</span>
          <button className="v5-toast-undo" onClick={onUndo} lang={c.undoLang}>{c.undo}</button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * check-circle-filled, animated very slightly: once the toast has risen, the
 * circle settles in from 85% and the tick draws itself on — a confirmation
 * that the switch happened, seen once. Reduced motion: it is simply there.
 */
function SuccessCheck() {
  const reduced = useReducedMotion();
  return (
    <svg className="v5-toast-check" width={24} height={24} viewBox="0 0 24 24" aria-hidden="true">
      <motion.circle
        cx={12} cy={12} r={9.75} fill="#0F61FF"
        style={{ transformOrigin: "12px 12px" }}
        initial={reduced ? false : { scale: 0.85, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1, transition: { ...SPR.pop, delay: at(0.16) } }}
      />
      <motion.path
        d="M8.5 12.5 L10.5 14.5 L15.5 9.5"
        fill="none" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
        // Round caps draw a dot at zero length, so the tick stays hidden until it starts.
        initial={reduced ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1, transition: { pathLength: { ...SPR.rise, delay: at(0.28) }, opacity: { duration: 0.01, delay: at(0.28) } } }}
      />
    </svg>
  );
}
