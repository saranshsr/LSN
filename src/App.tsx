import { useEffect, useState } from "react";

import { Lane, SoloDevice } from "./shell/Lane";
import type { Locale } from "./data/copy";
import { ConfirmContext, confirmFromUrl } from "./flow/v5";

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

type SheetType = "sheet1" | "sheet2";
const SHEETS: { id: SheetType; label: string }[] = [
  { id: "sheet1", label: "Option 1 · compact" },
  { id: "sheet2", label: "Option 2 · illustrated" },
];
const sheetFromUrl = (): SheetType => (new URLSearchParams(location.search).get("sheet") === "2" ? "sheet2" : "sheet1");

/**
 * The page is laid out the way the Figma page is: the flows WITH the sheet
 * (A1, B1) together, then the INSTANT switch + undo (A2, B2). Each section
 * shows its English-app and Arabic-app phone side by side. The only choice
 * left to make is which sheet the first section uses — keys 1 / 2.
 */
export default function App() {
  const [sheet, setSheet] = useState<SheetType>(sheetFromUrl);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest("input, textarea")) return;
      if (e.key === "1") setSheet("sheet1");
      if (e.key === "2") setSheet("sheet2");
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const u = new URL(location.href);
    if (sheet === "sheet1") u.searchParams.delete("sheet"); else u.searchParams.set("sheet", "2");
    history.replaceState(null, "", u);
  }, [sheet]);

  const only = solo();
  if (only) {
    // Device and solo modes keep `?confirm=` for one phone on one flow.
    return (
      <ConfirmContext.Provider value={confirmFromUrl()}>
        <div className="solo">
          <SoloDevice start={only.start} beat={only.beat} live={only.live} />
        </div>
      </ConfirmContext.Provider>
    );
  }

  return (
    <div className="shell">
      <header className="shell-head">
        <p className="shell-eyebrow">noon · app language</p>
        <h1 className="shell-title">Language switch nudge · v5</h1>
        <p className="shell-sub">
          Iteration 5. The nudge offers the other language — Arabic in the English app, English in the Arabic
          app — and forms its button in the app’s language before turning it into the offered one.
        </p>
        <nav className="shell-index" aria-label="Versions">
          <a href="#with-sheet"><b>A1 · B1</b> With the sheet</a>
          <a href="#instant"><b>A2 · B2</b> Instant switch + undo</a>
        </nav>
        <p className="shell-source">
          Mirrored from <code>{SOURCE}</code>. Motion is the approved tooltip motion — arrival, the fold into the bar
          on scroll and back on the way up, dismiss — mirrored for the Arabic app.
        </p>
      </header>

      <section className="version" id="with-sheet" aria-labelledby="with-sheet-title">
        <div className="version-head">
          <div>
            <h2 className="version-title" id="with-sheet-title"><span className="version-ids">A1 · B1</span> With the sheet</h2>
            <p className="version-sub">Tapping the banner’s button opens a sheet that confirms the switch and shows the way back.</p>
          </div>
          <div className="shell-toggle version-toggle">
            <span className="shell-toggle-label">Sheet</span>
            <div className="seg" role="radiogroup" aria-label="Bottom sheet">
              {SHEETS.map((c) => (
                <button key={c.id} className="seg-opt" role="radio" aria-checked={sheet === c.id} data-on={sheet === c.id ? "" : undefined} onClick={() => setSheet(c.id)}>
                  {c.label}
                </button>
              ))}
            </div>
            <span className="shell-toggle-hint">keys 1 2</span>
          </div>
        </div>
        <ConfirmContext.Provider value={sheet}>
          <div className="stage">
            <Lane start="en" name="English app → Arabic" tag="A1" note="Search in Arabic on the English app. The banner offers العربية; scroll and it folds into the bar, and comes back on the way up. ✕ dismisses it." />
            <Lane start="ar" name="Arabic app → English" tag="B1" note="The Arabic app, searched in English. The same banner, mirrored, offers English." />
          </div>
        </ConfirmContext.Provider>
      </section>

      <section className="version" id="instant" aria-labelledby="instant-title">
        <div className="version-head">
          <div>
            <h2 className="version-title" id="instant-title"><span className="version-ids">A2 · B2</span> Instant switch + undo</h2>
            <p className="version-sub">No sheet: the app switches straight away, and a toast offers Undo for 4 seconds — in the language the person came from.</p>
          </div>
        </div>
        <ConfirmContext.Provider value="instant">
          <div className="stage">
            <Lane start="en" name="English app → Arabic" tag="A2" note="Tap Switch and the app goes straight to Arabic. Undo on the toast brings English back, without the nudge." />
            <Lane start="ar" name="Arabic app → English" tag="B2" note="Tap Switch and the app goes straight to English. تراجع on the toast brings Arabic back, without the nudge." />
          </div>
        </ConfirmContext.Provider>
      </section>
    </div>
  );
}
