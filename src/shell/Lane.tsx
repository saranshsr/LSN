import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { HomeScreen } from "../screens/HomeScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { ResultsScreen } from "../screens/ResultsScreen";
import { TransitionScreen } from "../screens/TransitionScreen";
import { SkeletonScreen } from "../screens/SkeletonScreen";
import { ConfirmSheet } from "../components/Sheet";
import { QUERY, chrome, dirFor } from "../data/copy";
import { BarFlight, chromeOf, readLook, type Flight } from "./BarFlight";
import { SPR, at } from "../motion/springs";
import {
  STEPS, initialState, stateForStep, stepOf,
  type FlowState, type Screen, type StepId, type Variant,
} from "../flow/flow";

/** How long the skeleton holds — one shimmer sweep plus its rest, then a beat. */
const SKELETON_MS = 1600;
/** How long the sheet gets to recede before the app starts to fade away. */
const HANDOFF_MS = 160;

/**
 * Screen changes run on the flow's one spring system (`motion/springs.ts`).
 *
 * Home, search and results share the search bar, so the BAR carries those
 * transitions — it flies between its positions on the `move` spring, lifted
 * above both screens (see BarFlight) — while the screens behind it cross-fade
 * on `fade`. No scale on these: the flight measures the bars it travels
 * between, and a scaling parent would hand it a distorted box.
 *
 * The screens are VARIANT parents (`hidden` → `shown` → `gone`), so their
 * children can choreograph against them: the keyboard docks after the search
 * screen arrives and drops before it leaves, and the search screen holds a
 * beat on exit so that drop is seen.
 *
 * The reload beats — the wordmark clip and the skeleton — are not navigation;
 * the app relaunched. They just fade.
 */
const fadeIn = { hidden: { opacity: 0 }, shown: { opacity: 1, transition: SPR.fade }, gone: { opacity: 0, transition: SPR.fade } };
/**
 * The switch. No burst, no wipe — the app softly lets go of the English
 * screen (it dims, blurs a little and settles back a touch) while the relaunch
 * fades up underneath, slower than a navigation fade, so it reads as the whole
 * app changing rather than a screen being replaced.
 */
const RELAUNCH = SPR.relaunch;
const letGo = { ...fadeIn, gone: { opacity: 0, scale: 0.985, filter: "blur(6px)", transition: RELAUNCH } };
const fadeUp = { hidden: { opacity: 0 }, shown: { opacity: 1, transition: RELAUNCH }, gone: { opacity: 0, transition: RELAUNCH } };
const SCREEN_ANIM = {
  home:       { variants: fadeIn, initial: "hidden" },
  // Holds until its bar has travelled into the results header (SearchScreen).
  search:     { variants: { ...fadeIn, gone: { opacity: 0, transition: { ...SPR.fade, delay: at(0.22) } } }, initial: "hidden" },
  results:    { variants: letGo, initial: "hidden" },
  transition: { variants: fadeUp, initial: "hidden" },
  skeleton:   { variants: fadeUp, initial: "hidden" },
} satisfies Record<Screen, Record<string, unknown>>;

type DeviceProps = {
  variant: Variant;
  state: FlowState;
  setState: React.Dispatch<React.SetStateAction<FlowState>>;
  /** Parked on one beat for comparison — no timers, scroll forced. */
  pinned?: boolean;
};

/** The 375 × 812 phone. */
export function Device({ variant, state, setState, pinned }: DeviceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef<Screen>(state.screen);
  const patch = (next: Partial<FlowState>) => setState((s) => ({ ...s, ...next }));

  // Results entering straight from the search overlay is a content arrival and
  // gets a short settle. Entering from the skeleton must NOT — there the
  // placeholder and the content occupy the same pixels and nothing should move.
  const from = prev.current;
  useEffect(() => { prev.current = state.screen; }, [state.screen]);

  // The shared search bar. Measured in a layout effect so both ends are read
  // after the incoming screen has laid out its header and BEFORE first paint:
  // the flight and the hiding of the real bars land on the same frame.
  const reduced = useReducedMotion();
  const [flight, setFlight] = useState<Flight | null>(null);
  const flightId = useRef(0);
  const lastScreen = useRef(state.screen);
  useLayoutEffect(() => {
    const was = lastScreen.current;
    lastScreen.current = state.screen;
    if (was === state.screen) return;
    const dev = ref.current;
    const leg = was === "home" && state.screen === "search" ? "open"
      : was === "search" && state.screen === "results" ? "submit" : null;
    if (!leg || reduced || !dev) { setFlight(null); return; }
    const bar = (scr: Screen) => dev.querySelector<HTMLElement>(`.screen-layer[data-screen="${scr}"] .searchbar`);
    // A screen coming back mid-exit is the same element re-entering, so it must
    // not keep a mark from when it was the one being left.
    dev.querySelector(`.screen-layer[data-screen="${state.screen}"]`)?.removeAttribute("data-bar-left");
    const a = bar(was), b = bar(state.screen);
    if (!a || !b) { setFlight(null); return; }
    // The bar has left this screen for good. The flight lands (~450ms) before
    // the screen finishes fading (it holds for the keyboard drop), so hiding
    // only while in flight let its bar reappear beside the landed one.
    a.closest(".screen-layer")?.setAttribute("data-bar-left", "");
    setFlight({
      id: ++flightId.current,
      from: readLook(chromeOf(a), dev),
      // Live, not a snapshot: the results headers keep animating their bar
      // while the flight is in the air.
      to: () => { const live = bar(state.screen); return live ? readLook(chromeOf(live), dev) : null; },
      // Contents at each end, as the two screens draw them.
      src: leg === "open" ? { placeholder: chrome[state.locale].searchPlaceholder } : { query: QUERY, caret: true },
      dst: leg === "open" ? { query: "", caret: true, typing: true } : { query: QUERY, back: true },
    });
  }, [state.screen, state.locale, reduced]);

  useEffect(() => {
    if (pinned || state.screen !== "skeleton") return;
    const t = setTimeout(() => patch({ screen: "results" }), SKELETON_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.screen, pinned]);

  useEffect(() => {
    if (!pinned || state.nudge !== "collapsed") return;
    const el = ref.current?.querySelector<HTMLElement>(".scroll");
    if (el) el.scrollTop = 238; // lines the grid up with the frame
  }, [pinned, state.nudge, state.screen]);

  const screen = (() => {
    switch (state.screen) {
      case "home":
        return <HomeScreen locale={state.locale} onSearch={() => patch({ screen: "search" })} />;
      case "search":
        return <SearchScreen onSubmit={() => patch({ screen: "results" })} />;
      case "transition":
        // The language flips here, behind the relaunch clip — never on a screen
        // the user can still see, which would mirror it mid-fade.
        return (
          <TransitionScreen
            to={state.switchTo ?? "ar"}
            onDone={() => {
              const to = state.switchTo ?? "ar";
              patch({ screen: "skeleton", locale: to, nudge: "dismissed", returned: to === "en" });
            }}
          />
        );
      case "skeleton":
        return <SkeletonScreen />;
      case "results":
        return (
          <ResultsScreen
            locale={state.locale}
            variant={variant}
            nudge={state.nudge}
            entrance={from === "search" ? "search" : from === "skeleton" ? "skeleton" : "none"}
            onSwitch={() => patch({ sheetOpen: true })}
            onDismiss={() => patch({ nudge: "dismissed" })}
            onCollapse={(collapsed) =>
              setState((s) => (s.nudge === "dismissed" ? s : { ...s, nudge: collapsed ? "collapsed" : "offered" }))
            }
          />
        );
    }
  })();

  return (
    <div className="device" dir={dirFor[state.locale]} ref={ref} data-flying={flight ? "" : undefined}>
      {/* The layer the sheet pushes back. */}
      <div className="device-screens">
        <AnimatePresence initial={false}>
          <motion.div
            key={state.screen}
            data-screen={state.screen}
            className="screen-layer"
            {...SCREEN_ANIM[state.screen]}
            animate="shown"
            exit="gone"
          >
            {screen}
          </motion.div>
        </AnimatePresence>
        {flight ? <BarFlight key={flight.id} flight={flight} onLand={(id) => setFlight((f) => (f?.id === id ? null : f))} /> : null}
      </div>

      <ConfirmSheet
        open={state.sheetOpen}
        locale={state.locale}
        onCancel={() => patch({ sheetOpen: false })}
        onConfirm={() => {
          patch({ sheetOpen: false });
          // The sheet always offers the OTHER language.
          const to = state.locale === "ar" ? "en" : "ar";
          setTimeout(() => patch({ screen: "transition", switchTo: to }), HANDOFF_MS);
        }}
      />
    </div>
  );
}

/**
 * Solo mode: one device, no shell, parked on one beat — for comparing against
 * Figma, and for capturing motion frames deterministically.
 *
 * `collapseAt` flips the nudge to collapsed after N ms, so a headless capture
 * with `--virtual-time-budget` lands on a chosen frame of the transition
 * instead of whatever the screenshot timer happens to catch.
 */
export function SoloDevice({ variant, beat, collapseAt, live }: { variant: Variant; beat: StepId; collapseAt?: number; live?: boolean }) {
  const [state, setState] = useState<FlowState>(stateForStep[beat]);

  useEffect(() => {
    if (collapseAt === undefined) return;
    const t = setTimeout(() => setState((s) => ({ ...s, nudge: "collapsed" })), collapseAt);
    return () => clearTimeout(t);
  }, [collapseAt]);

  // Presenting (?device=) gets a restart too. It never sits on the phone —
  // that would cover the app mid-demo — so it goes beside it, or wraps below
  // on a phone-width screen; and R restarts with nothing on screen at all.
  // Parked capture beats (?solo=) stay bare.
  useEffect(() => {
    if (!live) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.toLowerCase() !== "r") return;
      setState(initialState);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [live]);

  const device = <Device variant={variant} state={state} setState={setState} pinned={!live && collapseAt === undefined} />;
  if (!live) return device;
  return (
    <div className="solo-live">
      {device}
      <RestartButton label="Restart the prototype from the home screen" onRestart={() => setState(initialState)} keyHint />
    </div>
  );
}

function RestartButton({ label, onRestart, keyHint }: { label: string; onRestart: () => void; keyHint?: boolean }) {
  return (
    <button type="button" className="lane-restart" onClick={onRestart} aria-label={label}
      aria-keyshortcuts={keyHint ? "R" : undefined}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2.75 8a5.25 5.25 0 1 0 1.54-3.71" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M2.5 2.75v2.9h2.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Restart
      {keyHint ? <kbd className="lane-restart-key" aria-hidden="true">R</kbd> : null}
    </button>
  );
}

type Props = { variant: Variant; name: string; tag: string; note: string };

/** One phone plus its rail and controls: each variant runs the flow independently. */
export function Lane({ variant, name, tag, note }: Props) {
  const [state, setState] = useState<FlowState>(initialState);
  const step = stepOf(state);
  const at = STEPS.findIndex((x) => x.id === step);

  return (
    <section className="lane">
      {/* Restart lives in the header row, above the phone: below it, it sat
          under 812px of device and the step rail, off-screen on most laptops. */}
      <div className="lane-head">
        <div className="lane-title">
          <h2 className="lane-name">{name}</h2>
          <span className="lane-tag">{tag}</span>
        </div>
        <RestartButton label={`Restart the ${name} prototype from the home screen`} onRestart={() => setState(initialState)} />
      </div>
      <p className="lane-note">{note}</p>

      <Device variant={variant} state={state} setState={setState} />

      <ol className="rail">
        {STEPS.map((s, i) => (
          <li key={s.id} className="rail-step" data-state={i === at ? "current" : i < at ? "done" : "todo"}>
            <span className="rail-num">{i + 1}</span>
            {s.label}
          </li>
        ))}
      </ol>

      <div className="lane-foot">
        <span className="lane-state">
          {state.screen} · {state.locale} · {state.nudge}{state.sheetOpen ? " · sheet" : ""}
        </span>
      </div>
    </section>
  );
}
