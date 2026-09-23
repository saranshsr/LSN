import { useState } from "react";

import { Lane, SoloDevice } from "./shell/Lane";
import { CollapseStyleContext, collapseStyleFromUrl, type CollapseStyle } from "./flow/collapseStyle";
import type { StepId, Variant } from "./flow/flow";

const SOURCE = "figma.com/design/JovVwactrtpNkNSPfu4tsm · section 278:110006 “flow”";

/**
 * `?device=inline` renders one bare, fully interactive phone at true 375 × 812
 * — the mode to present from, and the one to open when the preview pane is
 * sized to the device.
 *
 * `?solo=inline&beat=offered` is the same shell but parked on a beat, for
 * Figma comparison and frame capture.
 */
function solo() {
  const q = new URLSearchParams(location.search);
  const live = q.get("device") as Variant | null;
  if (live) return { variant: live, beat: "home" as StepId, slow: 1, collapseAt: undefined, live: true };
  const variant = q.get("solo") as Variant | null;
  if (!variant) return null;
  const slow = Number(q.get("slow") ?? 1);
  const collapseAt = q.has("collapseAt") ? Number(q.get("collapseAt")) : undefined;
  return { variant, beat: (q.get("beat") ?? "home") as StepId, slow, collapseAt, live: false };
}

const STYLES: { id: CollapseStyle; label: string; hint: string }[] = [
  { id: "travel", label: "Travel", hint: "The glyph flies along its path into the bar." },
  { id: "recede", label: "Recede", hint: "The nudge steps back and is gone; the glyph comes in from the side." },
];

export default function App() {
  const [style, setStyle] = useState<CollapseStyle>(collapseStyleFromUrl);
  const pick = (s: CollapseStyle) => {
    setStyle(s);
    // Keep it in the link, so a shared URL opens on the same style.
    const u = new URL(location.href);
    if (s === "recede") u.searchParams.set("collapse", "recede"); else u.searchParams.delete("collapse");
    history.replaceState(null, "", u);
  };
  return (
    <CollapseStyleContext.Provider value={style}>
      <Page style={style} pick={pick} />
    </CollapseStyleContext.Provider>
  );
}

function Page({ style, pick }: { style: CollapseStyle; pick: (s: CollapseStyle) => void }) {
  const only = solo();
  if (only) {
    // `?slow=6` stretches the motion tokens for frame-by-frame inspection.
    const slow = only.slow > 1
      ? ({ "--d-nudge": `${260 * only.slow}ms`, "--d-press": `${160 * only.slow}ms` } as React.CSSProperties)
      : undefined;
    return (
      <div className="solo" style={slow}>
        <SoloDevice variant={only.variant} beat={only.beat} collapseAt={only.collapseAt} live={only.live} />
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="shell-head">
        <p className="shell-eyebrow">noon · app language</p>
        <h1 className="shell-title">Language switch nudge</h1>
        <p className="shell-sub">
          A user searches in Arabic on an English app. The prototype runs the flow end to end — home,
          the Arabic query, the nudge, the scroll collapse, the confirmation sheet, the shipped app’s
          own Hala → هلا morph, the loading skeleton, and the mirrored Arabic results — with the two
          surviving nudge layouts side by side.
        </p>
        <p className="shell-source">
          Screens, copy and metrics mirrored from <code>{SOURCE}</code>. Copy is left exactly as drawn,
          including the gaps against the 21 Sep review — those are listed in <code>DIVERGENCES.md</code>.
          Motion runs on the Field DS curves and durations; the grid and the chips deliberately do not
          animate.
        </p>
        {/* Applies to both phones: the scroll collapse, and the tooltip's "Not now". */}
        <div className="shell-toggle" role="radiogroup" aria-label="How the nudge collapses">
          <span className="shell-toggle-label">Collapse</span>
          <div className="seg">
            {STYLES.map((s) => (
              <button key={s.id} type="button" role="radio" aria-checked={style === s.id}
                className="seg-opt" data-on={style === s.id || undefined} onClick={() => pick(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
          <span className="shell-toggle-hint">{STYLES.find((s) => s.id === style)?.hint}</span>
        </div>
      </header>

      <div className="stage">
        <Lane
          variant="inline"
          name="True inline"
          tag="mirrored from Figma"
          note="The nudge takes a row under the search bar and pushes the results down. Scroll past 24px and it gives up the row — the glyph travels into the search bar rather than the offer disappearing."
        />
        <Lane
          variant="tooltip"
          name="Tooltip"
          tag="derived — no frame yet"
          note="The nudge floats off the glyph instead of taking layout — it scales out of the icon it belongs to, and nothing below it moves. Same copy, same two actions, plus a cross."
        />
      </div>
    </div>
  );
}
