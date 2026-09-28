import type { Locale } from "../data/copy";
import { QUERY_FOR, type Confirm, type Store } from "./v5";

/**
 * `transition` is the rebrand wordmark morph (Hala ⇄ هلا). `skeleton` is what
 * the app shows while it reloads.
 */
export type Screen = "home" | "search" | "results" | "transition" | "skeleton";

/**
 * `offered`   — the banner is on screen
 * `collapsed` — scrolled past; the banner folds away into the bar and comes
 *               back on the way up
 * `dismissed` — ✕: gone for the session
 */
export type NudgeState = "offered" | "collapsed" | "dismissed";

export type FlowState = {
  screen: Screen;
  locale: Locale;
  nudge: NudgeState;
  sheetOpen: boolean;
  /** The results page carries the nudge (the search was in the other
   *  language). Off after a switch, and after an undo. */
  offer: boolean;
  query: string;
  /** noon or super mall — which home, search, results and nav. */
  store: Store;
  /** Where a relaunch in flight is heading. */
  switchTo?: Locale;
  /** Instant switch: the undo toast is due on the switched results. */
  toast?: boolean;
  /** This relaunch is the undo going back — no toast, and no nudge after
   *  (A2 · 08d / B2 · 06d: "no nudge"). */
  undoing?: boolean;
  /** The round trip ended in an undo. */
  undone?: boolean;
};

/** Every lane starts on its Home (A · 01, B · 01, SM · 01) — except super
 *  mall in the Arabic app, which has no Home or Search frames: it opens on
 *  its Arabic results (SM1 · 08's layout) with the banner offering English. */
export const initialFor = (start: Locale, store: Store = "noon"): FlowState => ({
  screen: store === "sm" && start === "ar" ? "results" : "home",
  locale: start,
  nudge: "offered",
  sheetOpen: false,
  offer: true,
  query: QUERY_FOR[store][start],
  store,
});

export type StepId = "home" | "search" | "nudge" | "sheet" | "splash" | "loading" | "switched" | "undo";

/** The beats, per lane and confirm style — the rail under each phone. */
export function stepsFor(start: Locale, confirm: Confirm): { id: StepId; label: string }[] {
  const to = start === "en" ? "Arabic" : "English";
  return [
    { id: "home" as const, label: "Home" },
    ...(start === "en" ? [{ id: "search" as const, label: "Search" }] : []),
    { id: "nudge", label: "Nudge" },
    ...(confirm === "instant" ? [] : [{ id: "sheet" as const, label: confirm === "sheet1" ? "Sheet · option 1" : "Sheet · option 2" }]),
    { id: "splash", label: start === "en" ? "Hala → هلا" : "هلا → Hala" },
    { id: "loading", label: "Loading" },
    { id: "switched", label: `${to} results${confirm === "instant" ? " · toast" : ""}` },
    ...(confirm === "instant" ? [{ id: "undo" as const, label: "Undo" }] : []),
  ];
}

export function stepOf(s: FlowState): StepId {
  if (s.screen === "home") return "home";
  if (s.screen === "search") return "search";
  if (s.undoing || s.undone) return "undo";
  if (s.screen === "transition") return "splash";
  if (s.screen === "skeleton") return "loading";
  if (s.offer) return s.sheetOpen ? "sheet" : "nudge";
  return "switched";
}

/** Parked beats for `?solo=` captures. */
export function stateFor(start: Locale, beat: string, store: Store = "noon"): FlowState {
  const base = initialFor(start, store);
  const to: Locale = start === "en" ? "ar" : "en";
  switch (beat) {
    case "search": return { ...base, screen: "search" };
    case "offered": return { ...base, screen: "results" };
    case "sheet": return { ...base, screen: "results", sheetOpen: true };
    case "transition": return { ...base, screen: "transition", switchTo: to, offer: false, nudge: "dismissed" };
    case "skeleton": return { ...base, screen: "skeleton", locale: to, offer: false, nudge: "dismissed" };
    case "switched": return { ...base, screen: "results", locale: to, offer: false, nudge: "dismissed" };
    case "toast": return { ...base, screen: "results", locale: to, offer: false, nudge: "dismissed", toast: true };
    default: return base;
  }
}
