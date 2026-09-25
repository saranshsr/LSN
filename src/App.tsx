import { useEffect, useState } from "react";

import { Lane, SoloDevice } from "./shell/Lane";
import type { Locale } from "./data/copy";
import { ConfirmContext, confirmFromUrl, type Confirm } from "./flow/v5";

const SOURCE = "figma.com/design/JovVwactrtpNkNSPfu4tsm · page 528:2 “Iteration 5 - 25 Sep”";

/**
 * `?device=en` / `?device=ar` renders one bare, fully interactive phone at
 * true 375 × 812 — the mode to present from.
 * `?solo=en&beat=sheet` parks one phone on a beat, for Figma comparison and
 * frame capture.
 */
function solo() {
  const q = new URLSearchParams(location.search);
  const live = q.get("device") as Locale | null;
  if (live === "en" || live === "ar") return { start: live, beat: "home", live: true };
  const s = q.get("solo") as Locale | null;
  if (s !== "en" && s !== "ar") return null;
  return { start: s, beat: q.get("beat") ?? "home", live: false };
}

const CONFIRMS: { id: Confirm; label: string; note: string }[] = [
  { id: "sheet1", label: "Sheet 1", note: "A1 · B1 — the sheet asks first: copy, the way-back icon path, Not now + the switch" },
  { id: "sheet2", label: "Sheet 2", note: "A1 · B1 — the sheet asks first: the Account page illustration, one switch button" },
  { id: "instant", label: "Instant + undo", note: "A2 · B2 — no sheet: the app switches, and an undo toast offers the way back for 4 s" },
];

/** The confirm style, shared by both lanes and device mode. Keys 1 2 3 switch
 *  it live; the URL keeps it so a shared link opens on the same one. */
export default function App() {
  const [confirm, setConfirm] = useState<Confirm>(confirmFromUrl);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest("input, textarea")) return;
      const i = ["1", "2", "3"].indexOf(e.key);
      if (i >= 0) setConfirm(CONFIRMS[i].id);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const u = new URL(location.href);
    if (confirm === "sheet1") u.searchParams.delete("confirm"); else u.searchParams.set("confirm", confirm);
    history.replaceState(null, "", u);
  }, [confirm]);
  return (
    <ConfirmContext.Provider value={confirm}>
      <Page confirm={confirm} setConfirm={setConfirm} />
    </ConfirmContext.Provider>
  );
}

function Page({ confirm, setConfirm }: { confirm: Confirm; setConfirm: (c: Confirm) => void }) {
  const only = solo();
  const toggle = (
    <div className="shell-toggle">
      <span className="shell-toggle-label">Confirm</span>
      <div className="seg" role="radiogroup" aria-label="How the switch is confirmed">
        {CONFIRMS.map((c) => (
          <button key={c.id} className="seg-opt" role="radio" aria-checked={confirm === c.id} data-on={confirm === c.id ? "" : undefined} onClick={() => setConfirm(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <span className="shell-toggle-hint">{CONFIRMS.find((c) => c.id === confirm)!.note} — keys 1 2 3</span>
    </div>
  );

  if (only) {
    return (
      <div className="solo">
        <SoloDevice start={only.start} beat={only.beat} live={only.live} />
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="shell-head">
        <p className="shell-eyebrow">noon · app language</p>
        <h1 className="shell-title">Language switch nudge · v5</h1>
        <p className="shell-sub">
          Iteration 5. The nudge offers the other language — to Arabic in the English app, to English in the
          Arabic app — and forms its button in the app’s language before turning it into the offered one. Pick how
          the switch is confirmed: one of the two sheets, or an instant switch with an undo toast.
        </p>
        {toggle}
        <p className="shell-source">
          Screens, copy and components mirrored from <code>{SOURCE}</code>. Motion is the approved tooltip motion
          — arrival, the fold into the bar on scroll and back on the way up, dismiss — mirrored for the Arabic app.
        </p>
      </header>

      <div className="stage">
        <Lane
          start="en"
          name="English app → Arabic"
          tag={confirm === "instant" ? "A2" : "A1"}
          note="Search in Arabic on the English app. The banner offers Arabic; scroll and it folds into the bar, and comes back on the way up. ✕ dismisses it for the session."
        />
        <Lane
          start="ar"
          name="Arabic app → English"
          tag={confirm === "instant" ? "B2" : "B1"}
          note="The Arabic app, searched in English. The same banner, mirrored, offers English — the same motion, from the other side."
        />
      </div>
    </div>
  );
}
