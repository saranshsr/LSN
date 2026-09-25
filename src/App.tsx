import { useEffect, useState } from "react";

import { Lane, SoloDevice } from "./shell/Lane";
import type { Locale } from "./data/copy";
import { ConfirmContext, confirmFromUrl, type Store } from "./flow/v5";

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
type SheetType = "sheet1" | "sheet2";

const FLOWS: { id: Flow; label: string; start: Locale; store: Store; ids: [string, string] }[] = [
  { id: "en", label: "English → Arabic", start: "en", store: "noon", ids: ["A1", "A2"] },
  { id: "ar", label: "Arabic → English", start: "ar", store: "noon", ids: ["B1", "B2"] },
  { id: "sm", label: "super mall", start: "en", store: "sm", ids: ["SM1", "SM2"] },
];

const q = () => new URLSearchParams(location.search);
const flowFromUrl = (): Flow => { const f = q().get("flow"); return f === "ar" || f === "sm" ? f : "en"; };
/** The illustrated sheet (520:108779) is primary; `?sheet=compact` opens the other. */
const sheetFromUrl = (): SheetType => (q().get("sheet") === "compact" ? "sheet1" : "sheet2");
const SHEETS: { id: SheetType; label: string }[] = [
  { id: "sheet2", label: "Illustrated sheet" },
  { id: "sheet1", label: "Compact sheet" },
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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "1") setSheet("sheet2");
      if (e.key === "2") setSheet("sheet1");
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const u = new URL(location.href);
    if (flow === "en") u.searchParams.delete("flow"); else u.searchParams.set("flow", flow);
    if (sheet === "sheet2") u.searchParams.delete("sheet"); else u.searchParams.set("sheet", "compact");
    history.replaceState(null, "", u);
  }, [flow, sheet]);

  const only = solo();
  if (only) {
    return (
      <ConfirmContext.Provider value={confirmFromUrl()}>
        <div className="solo">
          <SoloDevice start={only.start} store={only.store} beat={only.beat} live={only.live} />
        </div>
      </ConfirmContext.Provider>
    );
  }

  const f = FLOWS.find((x) => x.id === flow)!;
  return (
    <div className="shell v5-shell">
      <header className="v5-bar">
        <span className="v5-mark">Language nudge</span>
        <div className="seg" role="radiogroup" aria-label="Flow">
          {FLOWS.map((x) => (
            <button key={x.id} className="seg-opt" role="radio" aria-checked={flow === x.id} data-on={flow === x.id ? "" : undefined} onClick={() => setFlow(x.id)}>
              {x.label}
            </button>
          ))}
        </div>
        <div className="seg" role="radiogroup" aria-label="Bottom sheet">
          {SHEETS.map((x, i) => (
            <button key={x.id} className="seg-opt" role="radio" aria-checked={sheet === x.id} data-on={sheet === x.id ? "" : undefined} onClick={() => setSheet(x.id)} title={`Key ${i + 1}`}>
              {x.label}
            </button>
          ))}
        </div>
      </header>

      {/* Keyed on the flow, so switching flows starts both phones afresh. */}
      <div className="stage v5-stage" key={flow}>
        <ConfirmContext.Provider value={sheet}>
          <Lane start={f.start} store={f.store} tag={f.ids[0]} name="With sheet" />
        </ConfirmContext.Provider>
        <ConfirmContext.Provider value="instant">
          <Lane start={f.start} store={f.store} tag={f.ids[1]} name="Instant + undo" />
        </ConfirmContext.Provider>
      </div>
    </div>
  );
}
