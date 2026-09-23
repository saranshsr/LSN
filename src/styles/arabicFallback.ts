/**
 * Noontree has no Arabic glyphs, so Arabic runs would fall through to whatever
 * the OS picks — which differs per machine and wrecks a review. Load Noto Sans
 * Arabic and let the font stack in app.css pick it up for Arabic codepoints.
 * Fails soft: offline, the system Arabic font is used.
 */
const HREF = "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap";

export function installArabicFallback() {
  if (document.querySelector(`link[href="${HREF}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = HREF;
  document.head.append(link);
}
