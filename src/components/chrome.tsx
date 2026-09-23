import { Icon } from "../icons/Icon";
import type { Locale } from "../data/copy";
import { chrome } from "../data/copy";

/**
 * iOS status bar, taken as-is from the frame's `Bars / Status Bar / iPhone / Dark`
 * instance: these are Figma's own vector paths, and the positions are measured
 * off a 3× export — time ink x33–61 y17–28, cellular x293 w17, wifi x315 w15,
 * battery x335.33 w24.33. Non-interactive, so it is a faithful copy, not a
 * re-drawing. Sized generously so the battery cap cannot clip.
 */
export function StatusBar() {
  return (
    <div className="statusbar" dir="ltr" aria-hidden="true">
      <span className="statusbar-time">9:41</span>

      <svg className="statusbar-cellular" width="17" height="10.667" viewBox="0 0 17 10.667" fill="none">
        <path
          d="M2 6.66699C2.55228 6.66699 3 7.11471 3 7.66699V9.66699C2.99982 10.2191 2.55218 10.667 2 10.667H1C0.447824 10.667 0.000175969 10.2191 0 9.66699V7.66699C0 7.11471 0.447715 6.66699 1 6.66699H2ZM6.66699 4.66699C7.21913 4.66717 7.66699 5.11482 7.66699 5.66699V9.66699C7.66682 10.219 7.21902 10.6668 6.66699 10.667H5.66699C5.11482 10.667 4.66717 10.2191 4.66699 9.66699V5.66699C4.66699 5.11471 5.11471 4.66699 5.66699 4.66699H6.66699ZM11.333 2.33301C11.8852 2.33301 12.3328 2.78087 12.333 3.33301V9.66699C12.3328 10.2191 11.8852 10.667 11.333 10.667H10.333C9.78098 10.6668 9.33318 10.219 9.33301 9.66699V3.33301C9.33318 2.78098 9.78098 2.33318 10.333 2.33301H11.333ZM16 0C16.5523 0 17 0.447715 17 1V9.66699C16.9998 10.2191 16.5522 10.667 16 10.667H15C14.4478 10.667 14.0002 10.2191 14 9.66699V1C14 0.447715 14.4477 0 15 0H16Z"
          fill="currentColor"
        />
      </svg>

      <svg className="statusbar-wifi" width="15.333" height="11" viewBox="0 0 15.333 10.9999" fill="none">
        <path
          d="M5.44825 8.42669C6.72891 7.34442 8.60509 7.34442 9.88575 8.42669C9.9501 8.4849 9.98749 8.56751 9.98926 8.65423C9.99092 8.74086 9.95644 8.82399 9.89454 8.8847L7.88965 10.9072C7.83087 10.9666 7.7506 10.9999 7.667 10.9999C7.5834 10.9999 7.50311 10.9666 7.44434 10.9072L5.43848 8.8847C5.37688 8.824 5.34303 8.74066 5.34473 8.65423C5.34657 8.56755 5.3839 8.48485 5.44825 8.42669ZM2.77247 5.72942C5.5316 3.16504 9.80432 3.1651 12.5635 5.72942C12.6258 5.78956 12.6612 5.87238 12.6621 5.95892C12.6629 6.04526 12.6293 6.12811 12.5684 6.18938L11.4092 7.36028C11.2897 7.47959 11.0971 7.48144 10.9746 7.36517C10.0685 6.5454 8.88933 6.09165 7.667 6.09173C6.4456 6.09225 5.26773 6.5461 4.36231 7.36517C4.23976 7.48151 4.04623 7.47979 3.92676 7.36028L2.76856 6.18938C2.70748 6.12818 2.67313 6.04533 2.67383 5.95892C2.67465 5.87244 2.71026 5.78954 2.77247 5.72942ZM0.0966847 3.03899C4.3285 -1.01307 11.0044 -1.01292 15.2363 3.03899C15.2976 3.09919 15.3325 3.18166 15.333 3.26751C15.3335 3.35327 15.2998 3.43615 15.2393 3.497L14.0791 4.66692C13.9595 4.78702 13.765 4.7881 13.6436 4.66985C12.0312 3.13845 9.89158 2.28421 7.667 2.28411C5.44211 2.28412 3.30199 3.13822 1.68946 4.66985C1.56818 4.78822 1.37441 4.78703 1.25489 4.66692L0.0937551 3.497C0.0333244 3.43612 -0.000475824 3.35324 5.06194e-06 3.26751C0.000570337 3.18166 0.0353826 3.09915 0.0966847 3.03899Z"
          fill="currentColor"
        />
      </svg>

      <svg className="statusbar-battery" width="24.328" height="11.333" viewBox="0 0 24.3281 11.3333" fill="none">
        <rect opacity="0.35" x="0.5" y="0.5" width="21" height="10.3333" rx="2.16667" stroke="currentColor" />
        <path
          opacity="0.4"
          d="M23 3.66667V7.66667C23.8047 7.32789 24.328 6.5398 24.328 5.66667C24.328 4.79353 23.8047 4.00544 23 3.66667"
          fill="currentColor"
        />
        <rect x="2" y="2" width="18" height="7.33333" rx="1.33333" fill="currentColor" />
      </svg>
    </div>
  );
}

export function HomeBar() {
  return <div className="homebar" />;
}

/** M-Bottomnav — 60pt row plus the 25pt home bar. */
export function BottomNav({ locale, home }: { locale: Locale; home?: boolean }) {
  const labels = home ? chrome[locale].homeNav : chrome[locale].nav;
  const icons = ["bottomnav-home-filled", "bottomnav-categories", "bottomnav-deals", "bottomnav-profile", "bottomnav-cart"] as const;
  return (
    <nav className="bottomnav">
      <div className="bottomnav-row">
        {labels.map((label, i) => (
          <span key={label} className="bottomnav-item" data-active={i === 0}>
            <Icon name={icons[i]} size={24} />
            {label}
          </span>
        ))}
      </div>
      <HomeBar />
    </nav>
  );
}

/** The horizontally scrolling filter pills, taken from the designer's own node. */
export function ChipRow({ locale }: { locale: Locale }) {
  const labels = chrome[locale].chips;
  const leading = ["system-preferences", "system-sort", "system-discount", "system-discount-tag"] as const;
  const caret = [false, false, true, true, false, false, false];
  return (
    <div className="chiprow">
      <div className="hscroll chiprow-track">
        {labels.map((label, i) => (
          <span key={label} className="chip">
            {i < leading.length ? <Icon name={leading[i]} size={16} /> : null}
            {label}
            {caret[i] ? <Icon name="system-chevron-down" size={16} /> : null}
          </span>
        ))}
      </div>
    </div>
  );
}
