import { useEffect, useRef } from "react";

import type { Locale } from "../data/copy";
import { SHEET } from "../flow/v5";

/**
 * "You're switching the app to العربية" (Figma 660:21128, "Sheet · option 2";
 * first handed off as 520:108779) — the sheet
 * that shows the way back before the switch. Ported line for line from the
 * approved handoff (language-sheet-motion-handoff: SPEC.md, motion-tokens.json,
 * reference/prototype.html):
 *
 *   1  dock       the sheet rises on `sheet`, the scrim fades to 0.8 on `fade`
 *   2  light      0.06 glows swell 0.8 → 1; 0.12 the tile pattern blooms out
 *                 from (176, 166) through a radial mask, 0 → 560 pt, 140 edge
 *   3  rise       0.14 the phone rises on `rise`: perspective 900, y 150 → 0,
 *                 rotateX 26° → 0, scale 0.86 → 1
 *   4  lift       the in-phone Language row tints, then the card lifts out of
 *                 it on `lift` (scale 229/311.37 → 1, shadow deepening by
 *                 sin πt) while the phone frosts back
 *   5  switching  0.45 s after the card lands, then every 1.55 s: a fingertip
 *                 lands, the thumb squeezes (`press`), stretches on two edges
 *                 (`lead` / `trail`), lifts, and pops back (`pop`)
 *   6  close      scrim or the button runs it out on `recede`
 *
 * Its own springs, as the handoff specifies: base response 0.52 s, damping
 * fraction 0.90, mass 1, stiffness (2π/r)², damping 4πζ/r, integrated per frame.
 * The copy never moves. Under reduced motion: the resting frame, English
 * selected, no loop.
 *
 * Every class is prefixed `ls-`, so none of the page's own rules reach in.
 */
const R = 0.52;
const ROLES: Record<string, [number, number]> = {
  press: [0.3, 1], lead: [0.5, 0.74], trail: [0.78, 0.86], rise: [1.05, 0.82], sheet: [0.9, 0.86],
  fade: [0.6, 1], layout: [1.2, 1], lift: [1.05, 0.8], pop: [0.7, 0.62], recede: [0.72, 1],
};
const L = (a: number, b: number, t: number) => a + (b - a) * t;
const C = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

type Props = { open: boolean; locale: Locale; onCancel: () => void; onConfirm: () => void };

export function LanguageSheet({ open, locale, onCancel, onConfirm }: Props) {
  const c = SHEET[locale].two;
  const root = useRef<HTMLDivElement>(null);
  // The engine lives for the component's life; open/close drive it.
  const engine = useRef<ReturnType<typeof makeEngine> | null>(null);

  useEffect(() => {
    const el = root.current!;
    const e = makeEngine(el);
    engine.current = e;
    e.reset();
    return () => e.destroy();
  }, []);

  useEffect(() => {
    const e = engine.current;
    if (!e) return;
    if (open) e.play(); else e.close();
  }, [open]);

  return (
    <div className="ls-root" ref={root} data-open={open ? "" : undefined}>
      <div className="ls-scrim" data-k="scrim" onClick={onCancel} />
      <div className="ls-dock" data-k="dock">
        <div className="ls-grab" />
        <div className="ls-popup" role="dialog" aria-label={c.title}>
          <div className="ls-ell ls-ell--a" data-k="ellA" />
          <div className="ls-ell ls-ell--b" data-k="ellB" />
          <img className="ls-layer ls-pattern" data-k="pattern" src="/img/sheet520/tile-pattern@2x.png" alt="" />
          <div className="ls-phone-wrap" data-k="wrap">
            <div className="ls-screen">
              <div className="ls-scroll" data-k="scroll"><img src="/img/sheet520/account-screen@2x.png" alt="" /></div>
              <div className="ls-rowhl" data-k="rowhl" />
              <img className="ls-layer ls-pill" src="/img/sheet520/floating-pill@2x.png" alt="" />
              <img className="ls-layer ls-status" src="/img/sheet520/status-bar@2x.png" alt="" />
            </div>
            <img className="ls-layer ls-phone" src="/img/sheet520/iphone-15-pro-frame@2x.png" alt="" />
            <div className="ls-frost" data-k="frost" />
          </div>
          {/* The two wave fades under the copy (660:20228 at 0.82, 660:20227),
              lifted 20 over the frame so less of the phone reads behind the text. */}
          <img className="ls-layer ls-fade ls-fade--back" src="/img/sheet520/wave-fade.svg" alt="" width={351} height={329} />
          <img className="ls-layer ls-fade" src="/img/sheet520/wave-fade.svg" alt="" width={351} height={329} />
          {/* Lifted, the fade ends above the popup's foot: its white carries on down. */}
          <div className="ls-layer ls-fade-base" />
          <div className="ls-copy">
            <div className="ls-t">
              <h2 dir="auto">{c.title}</h2>
              <p dir="auto">{c.body}</p>
            </div>
            {/* Not now + the switch (660:21128 · Actions): 12 apart, the switch in
                the offered language. The device's dir puts it on the right in
                the English app and on the left in the Arabic one. */}
            <div className="ls-actions">
              <button className="ls-btn ls-btn--quiet" onClick={onCancel}>{c.cancel}</button>
              <button className="ls-btn ls-btn--go" onClick={onConfirm} lang={c.actionLang}>{c.action}</button>
            </div>
          </div>
          <div className="ls-card" data-k="card" dir="ltr">
            <div className="ls-li">
              <div className="ls-l">
                <span className="ls-ic"><img src="/img/sheet520/language-icon.svg" alt="" width={17.742} height={17.742} /></span>
                <span className="ls-txt">Language</span>
              </div>
              <div className="ls-seg">
                <span className="ls-thumb" data-k="thumb" />
                <span className="ls-h ls-h--en" data-k="en">English</span>
                <span className="ls-h ls-h--ar" data-k="ar" dir="rtl">العربية</span>
              </div>
            </div>
          </div>
          <div className="ls-touch" data-k="touch" />
          <div className="ls-ring" data-k="ring" />
        </div>
        <div className="ls-home" />
      </div>
    </div>
  );
}

/** The reference prototype's script, scoped to one mounted sheet. */
function makeEngine(root: HTMLElement) {
  const q = (k: string) => root.querySelector<HTMLElement>(`[data-k="${k}"]`)!;
  const el = {
    dock: q("dock"), scrim: q("scrim"), scroll: q("scroll"), frost: q("frost"), card: q("card"), rowhl: q("rowhl"),
    thumb: q("thumb"), en: q("en"), ar: q("ar"), touch: q("touch"), ring: q("ring"),
    wrap: q("wrap"), pattern: q("pattern"), ellA: q("ellA"), ellB: q("ellB"),
  };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const jobs = new Set<{ stop: boolean }>();
  const later = (s: number, fn: () => void) => {
    const t = setTimeout(() => { timers.delete(t); fn(); }, s * 1000);
    timers.add(t);
  };
  const stopAll = () => { timers.forEach(clearTimeout); timers.clear(); jobs.forEach((j) => (j.stop = true)); jobs.clear(); };

  function spring(role: string, from: number, to: number, apply: (v: number) => void, { delay = 0, v0 = 0, done }: { delay?: number; v0?: number; done?: () => void } = {}) {
    const [m, d] = ROLES[role], r = R * m, k = (2 * Math.PI / r) ** 2, c = 4 * Math.PI * d / r;
    if (reduced) { apply(to); done?.(); return; }
    const j = { stop: false }; jobs.add(j);
    later(delay, () => {
      let x = from, v = v0, last = performance.now();
      const tick = (now: number) => {
        if (j.stop) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        const n = Math.max(1, Math.ceil(dt * 480));
        for (let i = 0; i < n; i++) { const h = dt / n; v += (-k * (x - to) - c * v) * h; x += v * h; }
        const span = Math.max(1, Math.abs(to - from));
        if (Math.abs(x - to) < 1e-4 * span && Math.abs(v) < 1e-3 * span) { apply(to); jobs.delete(j); done?.(); return; }
        apply(x); requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* The switch: two edges on two springs, a press, a lift, a pop. */
  let seg = 0;
  const sw = { l: 0, r: 0, sy: 1, lift: 0 };
  const ends = () => [[el.en.offsetLeft, el.en.offsetLeft + el.en.offsetWidth], [el.ar.offsetLeft, el.ar.offsetLeft + el.ar.offsetWidth]];
  const mix = (a: string, b: string, t: number) => {
    const p = (x: string) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return `rgb(${A.map((v, i) => Math.round(L(v, B[i], t))).join(",")})`;
  };
  function paint() {
    const [e0, e1] = ends(), c = (sw.l + sw.r) / 2, c0 = (e0[0] + e0[1]) / 2, c1 = (e1[0] + e1[1]) / 2;
    const t = C((c - c0) / (c1 - c0)); seg = t;
    el.thumb.style.transform = `translateX(${sw.l}px) scale(${L(1, 0.985, sw.lift)}, ${sw.sy})`;
    el.thumb.style.width = Math.max(10, sw.r - sw.l) + "px";
    el.thumb.style.boxShadow = `-.887px -.887px 2.661px rgba(34,34,34,.02), -.887px .887px 2.661px rgba(34,34,34,.04), 0 ${1 + sw.lift * 3}px ${4 + sw.lift * 10}px rgba(16,22,40,${0.04 + sw.lift * 0.08})`;
    el.en.style.color = mix("#1d2539", "#666d85", t); el.ar.style.color = mix("#666d85", "#1d2539", t);
  }
  function setSeg(t: number) { const [e0, e1] = ends(); sw.l = L(e0[0], e1[0], t); sw.r = L(e0[1], e1[1], t); sw.sy = 1; sw.lift = 0; paint(); }
  function flip(to: number) {
    const [e0, e1] = ends(), dest = to ? e1 : e0, right = to === 1;
    spring("press", sw.sy, 0.9, (v) => { sw.sy = v; paint(); });
    spring(right ? "lead" : "trail", sw.r, dest[1], (v) => { sw.r = v; paint(); }, { delay: 0.06 });
    spring(right ? "trail" : "lead", sw.l, dest[0], (v) => { sw.l = v; paint(); }, { delay: 0.06 });
    spring("fade", sw.lift, 1, (v) => { sw.lift = v; paint(); }, { delay: 0.04 });
    spring("pop", 0.9, 1, (v) => { sw.sy = v; paint(); }, { delay: 0.2 });
    spring("fade", 1, 0, (v) => { sw.lift = v; paint(); }, { delay: 0.34 });
  }
  function touch(x: number, y: number) {
    Object.assign(el.touch.style, { left: x + "px", top: y + "px" }); Object.assign(el.ring.style, { left: x + "px", top: y + "px" });
    spring("pop", 0, 1, (v) => { el.touch.style.opacity = String(C(v)); el.touch.style.transform = `scale(${L(0.55, 1, v)})`; });
    spring("fade", 0, 1, (v) => { el.ring.style.opacity = String((1 - v) * 0.9); el.ring.style.transform = `scale(${L(1, 2.4, v)})`; }, { delay: 0.05 });
    spring("recede", 1, 0, (v) => { el.touch.style.opacity = String(C(v)); }, { delay: 0.28 });
  }

  let open = false, looping = false, dockAt = 1, scrimAt = 0;
  const setDock = (v: number) => { dockAt = v; el.dock.style.transform = `translateY(${v * 100}%)`; };
  const setScrim = (v: number) => { scrimAt = v; el.scrim.style.opacity = String(v); };

  function reset() {
    stopAll(); looping = false; open = false;
    setDock(1); setScrim(0);
    el.scroll.style.transform = "translateY(0px)"; el.frost.style.opacity = "0";
    el.wrap.style.opacity = "0"; el.wrap.style.transform = "perspective(900px) translateY(150px) rotateX(26deg) scale(.86)";
    el.pattern.style.setProperty("--r", "0px"); el.ellA.style.opacity = "0"; el.ellB.style.opacity = "0";
    el.card.style.opacity = "0"; el.rowhl.style.opacity = "0";
    el.touch.style.opacity = "0"; el.ring.style.opacity = "0"; setSeg(0);
  }

  function play() {
    reset(); open = true;
    if (reduced) {
      // The resting frame, English selected, no loop.
      setDock(0); setScrim(0.8); el.wrap.style.opacity = "1"; el.wrap.style.transform = "none";
      el.pattern.style.setProperty("--r", "560px"); el.ellA.style.opacity = "0.8"; el.ellB.style.opacity = "1";
      el.card.style.opacity = "1"; el.card.style.transform = "none"; el.frost.style.opacity = "1";
      return;
    }
    spring("sheet", 1, 0, setDock);
    spring("fade", 0, 0.8, (v) => setScrim(C(v, 0, 0.8)));
    spring("layout", 0, 1, (v) => {
      for (const g of [el.ellA, el.ellB]) g.style.transform = `scale(${L(0.8, 1, v)})`;
      el.ellA.style.opacity = String(C(v) * 0.8); el.ellB.style.opacity = String(C(v));
    }, { delay: 0.06 });
    spring("layout", 0, 560, (v) => el.pattern.style.setProperty("--r", v + "px"), { delay: 0.12 });
    spring("rise", 0, 1, (v) => {
      el.wrap.style.opacity = String(C(v * 1.8));
      el.wrap.style.transform = `perspective(900px) translateY(${L(150, 0, v)}px) rotateX(${L(26, 0, v)}deg) scale(${L(0.86, 1, v)})`;
    }, { delay: 0.14, done: lift });
  }

  function lift() {
    spring("fade", 0, 0.7, (v) => { el.rowhl.style.opacity = String(C(v)); }, { delay: 0.02 });
    later(0.12, () => {
      // 660:21128: the phone and the card sit 10 lower than in 520:108779.
      const from = { x: 53.12 + 7.83, y: 161, w: 229.1, h: 35.5 }, to = { x: 20.27, y: 149, w: 311.37, h: 55 };
      const s0 = from.w / to.w, fy = from.y + from.h / 2 - to.h * s0 / 2;
      spring("fade", 0, 1, (v) => { el.frost.style.opacity = String(C(v)); });
      spring("lift", 0, 1, (v) => {
        const s = L(s0, 1, v), x = L(from.x, to.x, v), y = L(fy, to.y, v), up = Math.sin(Math.PI * C(v));
        el.card.style.opacity = String(C(v * 2.5));
        el.card.style.transform = `translate(${x - to.x}px, ${y - to.y}px) scale(${s})`;
        el.card.style.boxShadow = `0 ${up * 12}px ${12 + up * 24}px rgba(16, 22, 40, ${0.06 + up * 0.1})`;
      }, { done: () => { looping = true; loop(0.45); } });
    });
  }

  function loop(delay: number) {
    if (!looping) return;
    later(delay, () => {
      const to = seg < 0.5 ? 1 : 0, n = to ? el.ar : el.en;
      const segEl = n.offsetParent as HTMLElement;
      const cx = 20.27 + 10.645 + segEl.offsetLeft + n.offsetLeft + n.offsetWidth / 2, cy = 149 + 27.5;
      touch(cx, cy);
      flip(to);
      loop(1.55);
    });
  }

  function close() {
    if (!open) return;
    open = false; stopAll(); looping = false;
    const d0 = dockAt, s0 = scrimAt;
    spring("recede", d0, 1, setDock);
    spring("recede", s0, 0, (v) => setScrim(C(v)));
  }

  document.fonts?.ready.then(() => { if (!open) setSeg(0); });
  return { play, close, reset, destroy: stopAll };
}
