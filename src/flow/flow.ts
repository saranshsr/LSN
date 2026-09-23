import type { Locale } from "../data/copy";

/** The two nudge layouts that survived the 21 Sep review. */
export type Variant = "inline" | "tooltip";

/**
 * `transition` is the real app's Hala → هلا wordmark morph, played from a
 * screen recording. `skeleton` is what the app shows while it reloads.
 */
export type Screen = "home" | "search" | "results" | "transition" | "skeleton";

/**
 * `offered`   — the nudge is on screen
 * `collapsed` — scrolled past; the offer survives as the glyph in the search bar
 * `dismissed` — the user said Not now; the glyph is the only way back in
 */
export type NudgeState = "offered" | "collapsed" | "dismissed";

export type FlowState = {
  screen: Screen;
  locale: Locale;
  nudge: NudgeState;
  sheetOpen: boolean;
};

export const initialState: FlowState = {
  screen: "home",
  locale: "en",
  nudge: "offered",
  sheetOpen: false,
};

/** The beats of the Figma `flow` section, in order. */
export const STEPS = [
  { id: "home", label: "Home", node: "278:46104" },
  { id: "search", label: "Arabic query", node: "278:45836" },
  { id: "offered", label: "Nudge offered", node: "278:18930" },
  { id: "collapsed", label: "Scrolled · collapsed", node: "278:47000" },
  { id: "sheet", label: "Confirm", node: "278:89196" },
  { id: "transition", label: "Hala → هلا", node: "278:109973" },
  { id: "skeleton", label: "Loading", node: "" },
  { id: "switched", label: "Arabic PLP", node: "278:67831" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

/** Which beat a given state is sitting on — drives the rail in the shell. */
export function stepOf(s: FlowState): StepId {
  if (s.screen === "home") return "home";
  if (s.screen === "search") return "search";
  if (s.screen === "transition") return "transition";
  if (s.screen === "skeleton") return "skeleton";
  if (s.locale === "ar") return "switched";
  if (s.sheetOpen) return "sheet";
  return s.nudge === "offered" ? "offered" : "collapsed";
}

/** The state each beat corresponds to — used by the side-by-side compare mode. */
export const stateForStep: Record<StepId, FlowState> = {
  home: { screen: "home", locale: "en", nudge: "offered", sheetOpen: false },
  search: { screen: "search", locale: "en", nudge: "offered", sheetOpen: false },
  offered: { screen: "results", locale: "en", nudge: "offered", sheetOpen: false },
  collapsed: { screen: "results", locale: "en", nudge: "collapsed", sheetOpen: false },
  // The Figma sheet frame sits over the un-scrolled results, not the collapsed one.
  sheet: { screen: "results", locale: "en", nudge: "offered", sheetOpen: true },
  // The language is already Arabic by the time the wordmark morphs.
  transition: { screen: "transition", locale: "ar", nudge: "dismissed", sheetOpen: false },
  skeleton: { screen: "skeleton", locale: "ar", nudge: "dismissed", sheetOpen: false },
  switched: { screen: "results", locale: "ar", nudge: "dismissed", sheetOpen: false },
};
