import { useEffect, useState } from "react";

import { Lane, SoloDevice } from "./shell/Lane";
import type { Locale } from "./data/copy";
import { ConfirmContext, confirmFromUrl, TextStyleContext, type Store, type TextStyle } from "./flow/v5";

/**
 * Three flows, each shown as its two versions side by side — the sheet, and
 * the instant switch with undo — the way the Figma page lays them out:
 *
 *   English → Arabic   A1 · A2   (noon, English app)
 *   Arabic → English   B1 · B2   (noon, Arabic app)
 *   super mall         SM1 · SM2 (super mall, English app)
 *
 * One toggle picks the sheet. Nothing else is on the page: the people trying
 * it already know the context.
 *
 * `?flow=ar|sm`, `?sheet=2` open a link on a view. `?device=en|ar|sm` (with
 * `&confirm=sheet1|sheet2|instant`) is one bare phone to present from;
 * `?solo=en&beat=sheet` parks one on a beat.
 */
type Flow = "en" | "ar" | "sm";
type SheetType = "sheet1" | "sheet2" | "sheet3";

const FLOWS: { id: Flow; label: string; start: Locale; store: Store; ids: [string, string] }[] = [
  { id: "en", label: "noon · English → Arabic", start: "en", store: "noon", ids: ["A1", "A2"] },
  { id: "ar", label: "noon · Arabic → English", start: "ar", store: "noon", ids: ["B1", "B2"] },
  { id: "sm", label: "super mall · English → Arabic", start: "en", store: "sm", ids: ["SM1", "SM2"] },
];

const q = () => new URLSearchParams(location.search);
const flowFromUrl = (): Flow => { const f = q().get("flow"); return f === "ar" || f === "sm" ? f : "en"; };
// "whole" left the toggle on 15 Oct; an old `?text=whole` link opens the default.
const textFromUrl = (): TextStyle => (q().get("text") === "flip" ? "flip" : "button");
/** How much of the nudge turns into the offered language; the URL ids stay
 *  as they were so older links still open the same view. */
const TEXTS: { id: TextStyle; label: string }[] = [
  // Only the button turns into the offered language.
  { id: "button", label: "Button only" },
  // App's language first, then all of it turns into the offered one.
  { id: "flip", label: "Entire nudge" },
];
/** The minimal sheet (805:26233) is the default since 30 Sep;
 *  `?sheet=illustrated` / `?sheet=compact` open the others. */
const sheetFromUrl = (): SheetType => { const s = q().get("sheet"); return s === "compact" ? "sheet1" : s === "illustrated" ? "sheet2" : "sheet3"; };
const SHEETS: { id: SheetType; label: string; rec?: boolean }[] = [
  // 805:26233: glyph, title, the two buttons, a one-line hint.
  { id: "sheet3", label: "Minimal", rec: true },
  { id: "sheet2", label: "Illustrated" },
  { id: "sheet1", label: "Compact" },
];

function solo() {
  const p = q();
  const d = p.get("device") ?? p.get("solo");
  if (d !== "en" && d !== "ar" && d !== "sm") return null;
  const f = FLOWS.find((x) => x.id === d)!;
  return { start: f.start, store: f.store, beat: p.get("beat") ?? "home", live: p.has("device") };
}

export default function App() {
  const [flow, setFlow] = useState<Flow>(flowFromUrl);
  const [sheet, setSheet] = useState<SheetType>(sheetFromUrl);
  const [text, setText] = useState<TextStyle>(textFromUrl);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "1") setSheet("sheet3");
      if (e.key === "2") setSheet("sheet2");
      if (e.key === "3") setSheet("sheet1");
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const u = new URL(location.href);
    if (flow === "en") u.searchParams.delete("flow"); else u.searchParams.set("flow", flow);
    if (sheet === "sheet3") u.searchParams.delete("sheet"); else u.searchParams.set("sheet", sheet === "sheet1" ? "compact" : "illustrated");
    if (text === "button") u.searchParams.delete("text"); else u.searchParams.set("text", text);
    u.searchParams.delete("buttons");
    history.replaceState(null, "", u);
  }, [flow, sheet, text]);

  const only = solo();
  if (only) {
    return (
      <TextStyleContext.Provider value={text}>
        <ConfirmContext.Provider value={confirmFromUrl()}>
          <div className="solo">
            <SoloDevice start={only.start} store={only.store} beat={only.beat} live={only.live} />
          </div>
        </ConfirmContext.Provider>
      </TextStyleContext.Provider>
    );
  }

  const f = FLOWS.find((x) => x.id === flow)!;
  return (
    <div className="shell v5-shell">
      {/* Scenario is the one choice that changes the story; the options sit
          under it, smaller, for anyone who wants to explore. The defaults are
          the recommended setup, so a fresh link needs no clicks. */}
      <header className="v5-bar">
        <div className="v5-intro">
          <h1 className="v5-mark">Language switch nudge · v5</h1>
          <p className="v5-hint">Tap the search bar on either phone to start.</p>
        </div>
        <div className="v5-row">
          <span className="v5-label" id="v5-scenario">Scenario</span>
          <div className="seg seg--lg" role="radiogroup" aria-labelledby="v5-scenario">
            {FLOWS.map((x) => (
              <button key={x.id} className="seg-opt" role="radio" aria-checked={flow === x.id} data-on={flow === x.id ? "" : undefined} onClick={() => setFlow(x.id)}>
                {x.label}
              </button>
            ))}
          </div>
        </div>
        <div className="v5-row v5-row--options">
          <span className="v5-label v5-label--quiet">Options</span>
          <div className="v5-opt">
            <span className="v5-opt-label" id="v5-sheet">Bottom sheet <span className="v5-opt-scope">· {f.ids[0]} only</span></span>
            <div className="seg seg--sm" role="radiogroup" aria-labelledby="v5-sheet">
              {SHEETS.map((x, i) => (
                <button key={x.id} className="seg-opt" role="radio" aria-checked={sheet === x.id} data-on={sheet === x.id ? "" : undefined} onClick={() => setSheet(x.id)} title={`${x.label} (key ${i + 1})`}>
                  {x.label}{x.rec && <span className="seg-rec">Recommended</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="v5-opt">
            <span className="v5-opt-label" id="v5-text">Nudge translation <span className="v5-opt-scope">· both phones</span></span>
            <div className="seg seg--sm" role="radiogroup" aria-labelledby="v5-text">
              {TEXTS.map((x) => (
                <button key={x.id} className="seg-opt" role="radio" aria-checked={text === x.id} data-on={text === x.id ? "" : undefined} onClick={() => setText(x.id)}>
                  {x.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Keyed on the flow, so switching flows starts both phones afresh. */}
      <TextStyleContext.Provider value={text}>
      <div className="stage v5-stage" key={`${flow}-${text}`}>
        <ConfirmContext.Provider value={sheet}>
          <Lane start={f.start} store={f.store} tag={f.ids[0]} name="With sheet" rank="recommended" />
        </ConfirmContext.Provider>
        <ConfirmContext.Provider value="instant">
          <Lane start={f.start} store={f.store} tag={f.ids[1]} name="Instant switch + undo" rank="alternative" />
        </ConfirmContext.Provider>
      </div>
      </TextStyleContext.Provider>
    </div>
  );
}
