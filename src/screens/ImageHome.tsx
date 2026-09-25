import { motion } from "motion/react";

import { StatusBar, BottomNav } from "../components/chrome";
import { SearchBar } from "../components/SearchBar";
import { SPR, rise, stagger } from "../motion/springs";
import { chrome, type Locale } from "../data/copy";
import type { Store } from "../flow/v5";

/**
 * Home, iteration 5: the Eid home (A · 01 571:11619, and its Arabic twin
 * B · 01 584:13888) and super mall's (SM · 01 603:41790).
 *
 * The page itself is Figma's own render, exported with its status bar, bottom
 * nav and search bar taken out — so every banner and tile is exactly as drawn.
 * What the person touches is live: the status bar, the bottom nav, and the
 * search bar, which is the same element the search overlay lifts and flies
 * (shell/BarFlight).
 *
 * The render is cut into bands along its own sections, and the bands rise into
 * place one after another the way the coded home did — the bar's band only
 * fades, because the bar is a shared element and must not carry a transform.
 */
type Band = [number, number];
type HomeSpec = {
  src: string;
  height: number;
  /** The live search bar, in the render's own coordinates. */
  bar: { x: number; y: number; w: number; h: number };
  bands: Band[];
  /** Index of the band the bar sits in. */
  barBand: number;
  lightStatus?: boolean;
  navSrc?: string;
};

const SPECS: Record<Store, Record<Locale, HomeSpec>> = {
  noon: {
    en: {
      src: "/img/v5/home-en.jpg", height: 4059,
      bar: { x: 12.7, y: 181.3, w: 348.3, h: 48.5 },
      bands: [[0, 176], [176, 236], [236, 600], [600, 705], [705, 4059]], barBand: 1,
    },
    ar: {
      src: "/img/v5/home-ar.jpg", height: 4106,
      bar: { x: 12.7, y: 181.3, w: 348.3, h: 48.5 },
      bands: [[0, 176], [176, 236], [236, 600], [600, 705], [705, 4106]], barBand: 1,
    },
  },
  sm: {
    // super mall exists in the English app only (SM1 / SM2).
    en: {
      src: "/img/v5/home-sm.jpg", height: 3415,
      bar: { x: 12, y: 201, w: 351, h: 48 },
      bands: [[0, 195], [195, 255], [255, 313], [313, 557], [557, 3415]], barBand: 1,
      lightStatus: true, navSrc: "/img/v5/sm-nav-home.png",
    },
    ar: {
      src: "/img/v5/home-sm.jpg", height: 3415,
      bar: { x: 12, y: 201, w: 351, h: 48 },
      bands: [[0, 195], [195, 255], [255, 313], [313, 557], [557, 3415]], barBand: 1,
      lightStatus: true, navSrc: "/img/v5/sm-nav-home.png",
    },
  },
};

const page = { shown: { transition: stagger(0.06, 0.04) } };
const fadeOnly = { hidden: { opacity: 0 }, shown: { opacity: 1, transition: SPR.rise } };

export function ImageHome({ locale, store, onSearch }: { locale: Locale; store: Store; onSearch: () => void }) {
  const s = SPECS[store][locale];
  const c = chrome[locale];
  return (
    <div className="screen screen--home v5-home" data-store={store}>
      <StatusBar />
      <div className="scroll v5-home-scroll" dir="ltr">
        <motion.div className="v5-home-page" style={{ height: s.height }} initial="hidden" animate="shown" variants={page}>
          {s.bands.map(([top, bottom], i) => (
            <motion.div
              key={top}
              className="v5-home-band"
              style={{ top, height: bottom - top, backgroundImage: `url(${s.src})`, backgroundPosition: `0 ${-top}px`, backgroundSize: `375px ${s.height}px` }}
              variants={i === s.barBand ? fadeOnly : rise}
            />
          ))}
          <motion.div
            className="v5-home-bar"
            dir={locale === "ar" ? "rtl" : "ltr"}
            style={{ left: s.bar.x, top: s.bar.y, width: s.bar.w }}
            variants={fadeOnly}
          >
            <SearchBar
              placeholder={store === "sm" ? "Search for “Maybelline 1014”" : c.searchPlaceholder}
              height={s.bar.h as 48}
              variant={store === "sm" ? "sm" : "home"}
              onClick={onSearch}
            />
          </motion.div>
        </motion.div>
      </div>
      {s.navSrc
        ? <img className="v5-home-nav" src={s.navSrc} alt="" width={375} height={96} />
        : <BottomNav locale={locale} />}
      {s.lightStatus ? <style>{`.v5-home[data-store="${store}"] .statusbar { color: #fff; }`}</style> : null}
    </div>
  );
}
