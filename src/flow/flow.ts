import type { Locale } from "../data/copy";
import { QUERY_FOR, type Confirm } from "./v5";

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

/** Each lane's first beat. The English app starts on Home and searches in
 *  Arabic (A1/A2 · 01); the Arabic app starts on its results for an English
 *  query, the banner already offering (B1/B2 · 01). */
export const initialFor = (start: Locale): FlowState => ({
  screen: start === "en" ? "home" : "results",
  locale: start,
  nudge: "offered",
  sheetOpen: false,
  offer: true,
  query: QUERY_FOR[start],
});

export type StepId = "home" | "search" | "nudge" | "sheet" | "splash" | "loading" | "switched" | "undo";

/** The beats, per lane and confirm style — the rail under each phone. */
export function stepsFor(start: Locale, confirm: Confirm): { id: StepId; label: string }[] {
  const to = start === "en" ? "Arabic" : "English";
  return [
    ...(start === "en" ? [{ id: "home" as const, label: "Home" }, { id: "search" as const, label: "Arabic query" }] : []),
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
export function stateFor(start: Locale, beat: string): FlowState {
  const base = initialFor(start);
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
