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
 *   sheet1  — "Sheet · option 1" (530:27774): copy + the way-back icon path,
 *             Not now + the switch
 *   sheet2  — "Sheet · option 2" (530:28151): the Account page illustration,
 *             one dark switch button
 *   instant — no sheet: the switch happens, and an undo toast offers the way
 *             back for 4 s
 *
 * `?confirm=sheet2` opens a link on one; keys 1 2 3 switch it live.
 */
export type Confirm = "sheet1" | "sheet2" | "instant";

export const ConfirmContext = createContext<Confirm>("sheet2");
export const useConfirm = () => useContext(ConfirmContext);

export const confirmFromUrl = (): Confirm => {
  const c = new URLSearchParams(location.search).get("confirm");
  // The illustrated sheet (520:108779) is the primary one since 25 Sep.
  return c === "sheet1" || c === "instant" ? c : "sheet2";
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

/** The flip's two buttons (28 Sep): today's Switch + ✕, or Yes (primary) + No.
 *  `?buttons=yesno`. Only the flip offers the choice. */
export type ButtonStyle = "switch" | "yesno";
export const ButtonStyleContext = createContext<ButtonStyle>("switch");
export const useButtonStyle = () => useContext(ButtonStyleContext);

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
  gloss: string;
  from: { text: string; lang: Locale };
  to: { text: string; lang: Locale };
  close: string;
  /** Yes / No (the flip's second button style): app's language → offered. */
  yes: { from: { text: string; lang: Locale }; to: { text: string; lang: Locale } };
  no: { from: { text: string; lang: Locale }; to: { text: string; lang: Locale } };
}> = {
  en: {
    // U+200E keeps the "?" after the Arabic word in the left-to-right line.
    words: [{ text: "Switch" }, { text: "app" }, { text: "to" }, { text: "العربية‎?", strong: true }],
    // "Switch app to Arabic?"
    offered: { dir: "rtl", words: [{ text: "تحويل" }, { text: "التطبيق" }, { text: "إلى" }, { text: "العربية؟", strong: true }] },
    gloss: "Switch app to Arabic?",
    from: { text: "Switch", lang: "en" },
    to: { text: "تبديل", lang: "ar" }, // "Switch"
    close: "Dismiss",
    yes: { from: { text: "Yes", lang: "en" }, to: { text: "نعم", lang: "ar" } },
    no: { from: { text: "No", lang: "en" }, to: { text: "لا", lang: "ar" } },
  },
  ar: {
    // "Switch app to English?" — U+200F keeps the "؟" after the Latin word.
    words: [{ text: "تحويل" }, { text: "التطبيق" }, { text: "إلى" }, { text: "English‏؟", strong: true }],
    offered: { dir: "ltr", words: [{ text: "Switch" }, { text: "app" }, { text: "to" }, { text: "English?", strong: true }] },
    gloss: "Switch app to English?",
    from: { text: "تبديل", lang: "ar" }, // "Switch"
    to: { text: "Switch", lang: "en" },
    close: "إغلاق", // "Close"
    yes: { from: { text: "نعم", lang: "ar" }, to: { text: "Yes", lang: "en" } }, // "Yes"
    no: { from: { text: "لا", lang: "ar" }, to: { text: "No", lang: "en" } }, // "No"
  },
};

/** The two sheets, in the app's language. The switch button is in the
 *  OFFERED language, the rest in the app's. */
export const SHEET: Record<Locale, {
  one: { title: string; body: string; cancel: string; action: string; actionLang: Locale };
  two: { title: string; body: string; cancel: string; action: string; actionLang: Locale };
}> = {
  en: {
    one: {
      title: "You’re switching the app to العربية‎",
      body: "Head to Accounts and choose Language to change it anytime.",
      cancel: "Not now",
      action: "تبديل", actionLang: "ar", // "Switch"
    },
    two: {
      title: "You’re switching to العربية‎",
      body: "Head to Accounts and choose Language to change it anytime.",
      cancel: "Not now",
      action: "تبديل", actionLang: "ar",
    },
  },
  ar: {
    one: {
      // "You're switching the app to English"
      title: "أنت تنقل التطبيق إلى English",
      // "Head to Account and choose Language to change it anytime."
      body: "توجّه إلى الحساب واختر اللغة لتغييرها في أي وقت.",
      cancel: "ليس الآن", // "Not now"
      action: "Switch", actionLang: "en",
    },
    two: {
      title: "أنت تنتقل إلى English", // "You're switching to English"
      body: "توجّه إلى الحساب واختر اللغة لتغييرها في أي وقت.", // "Head to Account and choose Language to change it anytime."
      cancel: "ليس الآن", // "Not now"
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
