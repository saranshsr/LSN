import { createContext, useContext } from "react";

/**
 * How the nudge gets out of the way — on scroll (both variants) and on the
 * tooltip's "Not now". A presentation toggle: both are valid directions and the
 * room should be able to compare them on the same phone.
 *
 *  - `travel`: the glyph is one object that flies along its path into the
 *    header button while the copy clears around it.
 *  - `recede`: the nudge steps back as one layer and is gone; then the bar
 *    narrows to make room and the glyph comes in from the side. Scrolling back
 *    reverses it: the glyph pops out, the bar takes its space, and the nudge
 *    blooms back in with its entrance.
 *
 * `?collapse=recede` opens a link on the second style.
 */
export type CollapseStyle = "travel" | "recede";

export const CollapseStyleContext = createContext<CollapseStyle>("travel");
export const useCollapseStyle = () => useContext(CollapseStyleContext);

export const collapseStyleFromUrl = (): CollapseStyle =>
  new URLSearchParams(location.search).get("collapse") === "recede" ? "recede" : "travel";
