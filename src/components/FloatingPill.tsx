import type { Locale } from "../data/copy";

/**
 * Sort · Filter · share, floating over the results (678:91534 English,
 * 678:91550 Arabic). Drawn, not a render, so the grid shows through around
 * it — the Figma export bakes in whatever sits behind it.
 *
 *   English  [Sort ⇅ | Filter ▽] (share)   160 + 8 + 36
 *   Arabic   (share) [ترتيب ⇅ | تصفية ▽]    36 + 8 + 214
 *
 * Both keep the icon to the right of its word, as the frames do.
 */
const LABEL = { en: ["Sort", "Filter"], ar: ["تصفية", "ترتيب"] } as const;

/** Two of the DS left-arrows, turned up and down (the "Sort" instance). */
function SortIcon() {
  // Stem and head as separate shapes: in one path their windings cancel where
  // they overlap and leave a notch at the join.
  const stem = "M1.272 4.5363H15.672V6.3363H1.272V4.5363Z";
  const head = "M2.54558 5.4364L6.70919 1.27279L5.43639 0L0 5.4364L5.43639 10.8728L6.70919 9.6L2.54558 5.4364Z";
  const arrow = (t: string) => <g transform={t}><path d={stem} fill="#fff" /><path d={head} fill="#fff" /></g>;
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden="true">
      {arrow("translate(13.273 4.2) rotate(90)")}
      {arrow("translate(10.8 19.872) rotate(-90)")}
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden="true">
      <path transform="translate(2.7 3.9)" d="M17.7 0.9H0.900016L7.62002 8.468V13.7L10.98 15.3V8.468L17.7 0.9Z" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden="true">
      <path transform="translate(3.4 2.5)" fill="#3866DF" d="M13.7295 0C15.6436 0 17.1953 1.55169 17.1953 3.46582C17.1953 5.37998 15.6437 6.93164 13.7295 6.93164C12.7789 6.93157 11.9181 6.54851 11.292 5.92871L6.80957 8.54395C6.88824 8.83381 6.9316 9.13836 6.93164 9.45312C6.93164 9.76666 6.88859 10.0705 6.81055 10.3594L11.2959 12.9727C11.9217 12.3554 12.7811 11.9747 13.7295 11.9746C15.6437 11.9746 17.1953 13.5263 17.1953 15.4404C17.1951 17.3544 15.6435 18.9062 13.7295 18.9062C11.8156 18.9061 10.2638 17.3544 10.2637 15.4404C10.2637 15.1242 10.3064 14.8175 10.3857 14.5264L5.9043 11.915C5.27803 12.5355 4.41704 12.9199 3.46582 12.9199C1.55169 12.9199 0 11.3673 0 9.45312C0.000250019 7.5392 1.55185 5.98734 3.46582 5.9873C4.41581 5.9873 5.27628 6.37023 5.90234 6.98926L10.3848 4.37402C10.3064 4.08453 10.2637 3.78012 10.2637 3.46582C10.2637 1.55178 11.8155 0.000145305 13.7295 0ZM13.7295 13.7744C13.1516 13.7745 12.6425 14.0687 12.3438 14.5156C12.3308 14.5444 12.317 14.5737 12.3008 14.6016C12.284 14.6303 12.2654 14.6574 12.2461 14.6836C12.1301 14.9107 12.0635 15.1679 12.0635 15.4404C12.0636 16.3602 12.8097 17.1063 13.7295 17.1064C14.6494 17.1064 15.3953 16.3603 15.3955 15.4404C15.3955 14.5204 14.6495 13.7744 13.7295 13.7744ZM3.46582 7.78809C2.54596 7.78812 1.80005 8.53332 1.7998 9.45312C1.7998 10.3731 2.54581 11.1191 3.46582 11.1191C4.38587 11.1191 5.13184 10.3732 5.13184 9.45312C5.13159 8.53329 4.38571 7.78809 3.46582 7.78809ZM13.7295 1.7998C12.8096 1.79995 12.0635 2.5459 12.0635 3.46582C12.0635 3.76668 12.1447 4.04838 12.2842 4.29199C12.2866 4.296 12.2896 4.29965 12.292 4.30371C12.2929 4.3052 12.2931 4.3071 12.2939 4.30859C12.5834 4.80071 13.1173 5.13174 13.7295 5.13184C14.6495 5.13184 15.3955 4.38587 15.3955 3.46582C15.3955 2.54581 14.6495 1.7998 13.7295 1.7998Z" />
    </svg>
  );
}

export function FloatingPill({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const [a, b] = LABEL[locale];
  const share = <span className="fpill-share"><ShareIcon /></span>;
  return (
    <div className={ar ? "fpill fpill--ar" : "fpill"} dir="ltr" lang={locale}>
      {ar ? share : null}
      <div className="fpill-bar">
        <span className="fpill-item">{ar ? b : a}<SortIcon /></span>
        <span className="fpill-sep" />
        <span className="fpill-item">{ar ? a : b}<FilterIcon /></span>
      </div>
      {ar ? null : share}
    </div>
  );
}
