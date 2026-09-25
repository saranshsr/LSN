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

export const ConfirmContext = createContext<Confirm>("sheet1");
export const useConfirm = () => useContext(ConfirmContext);

export const confirmFromUrl = (): Confirm => {
  const c = new URLSearchParams(location.search).get("confirm");
  return c === "sheet2" || c === "instant" ? c : "sheet1";
};

/** noon, or super mall (SM1 / SM2, 603:41789 · 603:45751). */
export type Store = "noon" | "sm";

/** The query each app searched with. The English app searched in Arabic; the
 *  Arabic app in English (B1 · 02, 539:26596). super mall searches makeup. */
export const QUERY_FOR: Record<Store, Record<Locale, string>> = {
  noon: { en: "عبايات", ar: "abaya" }, // "abayas"
  sm: { en: "مكياج", ar: "مكياج" }, // "makeup"
};

/** SM1 · 02 Search, typing (603:26596). */
export const SM_SUGGESTIONS = [
  { text: "مكياج عيون", gloss: "eye makeup" },
  { text: "مكياج ميبيلين", gloss: "Maybelline makeup" },
  { text: "أحمر شفاه", gloss: "lipstick" },
  { text: "كريم أساس", gloss: "foundation" },
];

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
  gloss: string;
  from: { text: string; lang: Locale };
  to: { text: string; lang: Locale };
  close: string;
}> = {
  en: {
    // U+200E keeps the "?" after the Arabic word in the left-to-right line.
    words: [{ text: "Switch" }, { text: "app" }, { text: "to" }, { text: "العربية‎?", strong: true }],
    gloss: "Switch app to Arabic?",
    from: { text: "Switch", lang: "en" },
    to: { text: "تبديل", lang: "ar" }, // "Switch"
    close: "Dismiss",
  },
  ar: {
    // "Switch app to English?" — U+200F keeps the "؟" after the Latin word.
    words: [{ text: "تحويل" }, { text: "التطبيق" }, { text: "إلى" }, { text: "English‏؟", strong: true }],
    gloss: "Switch app to English?",
    from: { text: "تبديل", lang: "ar" }, // "Switch"
    to: { text: "Switch", lang: "en" },
    close: "إغلاق", // "Close"
  },
};

/** The two sheets, in the app's language. The switch button is in the
 *  OFFERED language, the rest in the app's. */
export const SHEET: Record<Locale, {
  one: { title: string; body: string; cancel: string; action: string; actionLang: Locale };
  two: { title: string; body: string; action: string; actionLang: Locale };
}> = {
  en: {
    one: {
      title: "You’re switching the app to العربية‎",
      body: "Tap the profile icon, go to Account and select Language to switch anytime.",
      cancel: "Not now",
      action: "تبديل", actionLang: "ar", // "Switch"
    },
    two: {
      title: "You’re switching to العربية‎",
      body: "Tap the profile icon, go to Account then to Language to switch anytime.",
      action: "تبديل", actionLang: "ar",
    },
  },
  ar: {
    one: {
      // "You're switching the app to English"
      title: "أنت تنقل التطبيق إلى English",
      // "Tap the profile icon, then Account, and choose Language to switch anytime."
      body: "اضغط على أيقونة الملف الشخصي، ثم الحساب، واختر اللغة للتبديل في أي وقت.",
      cancel: "ليس الآن", // "Not now"
      action: "Switch", actionLang: "en",
    },
    two: {
      title: "أنت تنتقل إلى English", // "You're switching to English"
      // "Tap the profile icon, then Account, then Language to switch anytime."
      body: "اضغط على أيقونة الملف الشخصي، ثم الحساب، ثم اللغة للتبديل في أي وقت.",
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
