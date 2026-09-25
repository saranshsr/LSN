import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { Locale } from "../data/copy";
import { TOAST, TOAST_MS } from "../flow/v5";
import { SPR } from "../motion/springs";

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
export function UndoToast({ show, to, onUndo, onTimeout }: { show: boolean; to: Locale; onUndo: () => void; onTimeout: () => void }) {
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
          initial={{ opacity: 0, y: 17 }}
          animate={{ opacity: 1, y: 0, transition: SPR.move }}
          exit={{ opacity: 0, y: 17, transition: SPR.recede }}
        >
          <svg className="v5-toast-check" width={24} height={24} viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd" fill="#0F61FF" d="M12 2.25C17.3848 2.25 21.75 6.61522 21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61522 21.75 2.25 17.3848 2.25 12C2.25 6.61522 6.61522 2.25 12 2.25ZM16.0303 8.96973C15.7374 8.67683 15.2626 8.67684 14.9697 8.96973L10.5 13.4395L9.03027 11.9697C8.73738 11.6768 8.26262 11.6768 7.96973 11.9697C7.67683 12.2626 7.67683 12.7374 7.96973 13.0303L9.96973 15.0303C10.2626 15.3232 10.7374 15.3232 11.0303 15.0303L16.0303 10.0303C16.3232 9.73738 16.3232 9.26262 16.0303 8.96973Z" />
          </svg>
          <span className="v5-toast-title">{c.title}</span>
          <button className="v5-toast-undo" onClick={onUndo} lang={c.undoLang}>{c.undo}</button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
