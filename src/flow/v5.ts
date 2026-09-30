import { createContext, useContext } from "react";

import type { Locale } from "../data/copy";

/**
 * Iteration 5 (Figma JovVwactrtpNkNSPfu4tsm · page 528:2, 25 Sep).
 *
 * Two starting points, each offering the other language:
 *   A · English app → Arabic   (A1 with the sheet, A2 instant switch + undo)
 *   B · Arabic app → English   (B1 with the sheet, B2 instant switch + undo)
 *
 * and three ways to confirm, shared by both:
 *   sheet2  — "Sheet · option 2" (530:28151): the Account page illustration,
 *             one dark switch button
 *   sheet3  — "Sheet · option 3" (805:26233): the language glyph, the title,
 *             the two buttons and a one-line hint of the way back
 *   instant — no sheet: the switch happens, and an undo toast offers the way
 *             back for 4 s
 * (Option 1, the compact sheet, was dropped on 30 Sep.)
 * `?confirm=sheet2` opens a link on one; keys 1 2 switch the sheet live.
 */
export type Confirm = "sheet2" | "sheet3" | "instant";

export const ConfirmContext = createContext<Confirm>("sheet2");
export const useConfirm = () => useContext(ConfirmContext);

export const confirmFromUrl = (): Confirm => {
  const c = new URLSearchParams(location.search).get("confirm");
  // The illustrated sheet (520:108779) is the primary one since 25 Sep.
  return c === "sheet3" || c === "instant" ? c : "sheet2";
};

/** noon, or super mall (SM1 / SM2, 603:41789 · 603:45751). */
export type Store = "noon" | "sm";

/** The query each app searched with. The English app searched in Arabic; the
 *  Arabic app in English (B1 · 02, 539:26596). super mall searches makeup. */
export const QUERY_FOR: Record<Store, Record<Locale, string>> = {
  noon: { en: "عبايات", ar: "abaya" }, // "abayas"
  sm: { en: "مكياج", ar: "makeup" }, // "makeup" (super mall is EN → AR only)
};

/** SM1 · 02 Search, typing (603:26596). */
export const SM_SUGGESTIONS = [
  { text: "مكياج عيون", gloss: "eye makeup" },
  { text: "مكياج ميبيلين", gloss: "Maybelline makeup" },
  { text: "أحمر شفاه", gloss: "lipstick" },
  { text: "كريم أساس", gloss: "foundation" },
];

/** How the banner teaches the offered language (the 28 Sep review):
 *   whole  — it arrives entirely in the offered language, then the sentence
 *            turns into the app's; the button stays in the offered one
 *   button — the sentence is in the app's language; only the button turns
 *            (CTA · transition 535:4693)
 *   flip   — the reverse of whole (28 Sep): it arrives entirely in the APP's
 *            language, holds, then the whole of it — sentence and button —
 *            turns into the offered language, and rests there
 * "button" is the default (28 Sep); `?text=whole` / `?text=flip` open the others. */
export type TextStyle = "whole" | "button" | "flip";
export const TextStyleContext = createContext<TextStyle>("button");
export const useTextStyle = () => useContext(TextStyleContext);

const other = (l: Locale): Locale => (l === "en" ? "ar" : "en");
export { other as otherLocale };

type Word = { text: string; strong?: boolean };

/**
 * The nudge, in the app's language, offering the other one. The offered
 * language is named in its own script and set SemiBold; the rest is Medium
 * (Nudge banner 528:26664).
 *
 * The action forms in the APP's language and, once the banner has settled,
 * cross-fades into the OFFERED language (CTA · transition 535:4693: 0 ms app
 * language → 300 ms cross-fade, 2 px blur → 600 ms offered language, holds).
 */
export const NUDGE: Record<Locale, {
  words: Word[];
  /** The same question in the offered language — the first thing "whole"
   *  shows. Written as the other app's banner writes it (528:26664). */
  offered: { words: Word[]; dir: "ltr" | "rtl" };
  /** The flip's first sentence (28 Sep): ALL of it in the app's language,
   *  the offered language named in the app's own words too. */
  own: Word[];
  gloss: string;
  from: { text: string; lang: Locale };
  to: { text: string; lang: Locale };
  close: string;
}> = {
  en: {
    // U+200E keeps the "?" after the Arabic word in the left-to-right line.
    words: [{ text: "Switch" }, { text: "app" }, { text: "to" }, { text: "العربية‎?", strong: true }],
    // "Switch app to Arabic?"
    offered: { dir: "rtl", words: [{ text: "تحويل" }, { text: "التطبيق" }, { text: "إلى" }, { text: "العربية؟", strong: true }] },
    own: [{ text: "Switch" }, { text: "app" }, { text: "to" }, { text: "Arabic?", strong: true }],
    gloss: "Switch app to Arabic?",
    from: { text: "Switch", lang: "en" },
    to: { text: "تبديل", lang: "ar" }, // "Switch"
    close: "Dismiss",
  },
  ar: {
    // "Switch app to English?" — U+200F keeps the "؟" after the Latin word.
    words: [{ text: "تحويل" }, { text: "التطبيق" }, { text: "إلى" }, { text: "English‏؟", strong: true }],
    offered: { dir: "ltr", words: [{ text: "Switch" }, { text: "app" }, { text: "to" }, { text: "English?", strong: true }] },
    // "Switch app to English?", English named in Arabic.
    own: [{ text: "تحويل" }, { text: "التطبيق" }, { text: "إلى" }, { text: "الإنجليزية؟", strong: true }],
    gloss: "Switch app to English?",
    from: { text: "تبديل", lang: "ar" }, // "Switch"
    to: { text: "Switch", lang: "en" },
    close: "إغلاق", // "Close"
  },
};

/** The two sheets, in the app's language. The switch button is in the
 *  OFFERED language, the rest in the app's. */
export const SHEET: Record<Locale, {
  two: { title: string; body: string; cancel: string; action: string; actionLang: Locale };
  /** 805:26233: option 1's title and buttons, the way back as a hint whose
   *  destination is set Bold. */
  three: { title: string; hint: string; hintStrong: string; cancel: string; action: string; actionLang: Locale };
}> = {
  en: {
    two: {
      title: "You’re switching to العربية‎",
      body: "Go to Accounts and choose Language to change it anytime.",
      // Not "Not now": it would clash with "change it anytime" (28 Sep).
      cancel: "Keep English",
      action: "تبديل", actionLang: "ar",
    },
    three: {
      title: "You’re switching the app to العربية‎",
      hint: "You can change it anytime from ", hintStrong: "Account → Language",
      cancel: "Keep English",
      action: "تبديل", actionLang: "ar", // "Switch"
    },
  },
  ar: {
    two: {
      title: "أنت تنتقل إلى English", // "You're switching to English"
      body: "اذهب إلى الحساب واختر اللغة لتغييرها في أي وقت.", // "Go to Account and choose Language to change it anytime."
      cancel: "الإبقاء على العربية", // "Keep Arabic"
      action: "Switch", actionLang: "en",
    },
    three: {
      title: "أنت تنقل التطبيق إلى English", // "You're switching the app to English"
      // "You can change it anytime from Account ← Language"
      hint: "يمكنك تغييرها في أي وقت من ", hintStrong: "الحساب ← اللغة",
      cancel: "الإبقاء على العربية", // "Keep Arabic"
      action: "Switch", actionLang: "en",
    },
  },
};

/**
 * The undo toast (528:26667), keyed by the language the app switched TO. The
 * message is in the new language; Undo stays in the old one, so the person who
 * can only read the old language can still find the way back.
 */
export const TOAST: Record<Locale, { title: string; undo: string; undoLang: Locale }> = {
  ar: { title: "تحولت إلى العربية", undo: "Undo", undoLang: "en" }, // "Switched to Arabic"
  en: { title: "Switched to English", undo: "تراجع", undoLang: "ar" }, // "Undo"
};
/** How long the toast stays before it leaves on its own (A2 · 09, "4 s"). */
export const TOAST_MS = 4000;
