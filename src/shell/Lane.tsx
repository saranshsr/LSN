import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { HomeScreen } from "../screens/HomeScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { ResultsScreen } from "../screens/ResultsScreen";
import { TransitionScreen } from "../screens/TransitionScreen";
import { SkeletonScreen } from "../screens/SkeletonScreen";
import { ConfirmSheet } from "../components/Sheet";
import { UndoToast } from "../components/UndoToast";
import { chrome, dirFor, type Locale } from "../data/copy";
import { useConfirm, otherLocale } from "../flow/v5";
import { BarFlight, chromeOf, readLook, type Flight } from "./BarFlight";
import { SPR, at } from "../motion/springs";
import { initialFor, stateFor, stepOf, stepsFor, type FlowState, type Screen } from "../flow/flow";

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
  state: FlowState;
  setState: React.Dispatch<React.SetStateAction<FlowState>>;
  /** Parked on one beat for comparison — no timers, scroll forced. */
  pinned?: boolean;
};

/** The 375 × 812 phone. */
export function Device({ state, setState, pinned }: DeviceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef<Screen>(state.screen);
  const patch = (next: Partial<FlowState>) => setState((s) => ({ ...s, ...next }));
  const confirm = useConfirm();

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
    dev.querySelector(`.screen-layer[data-screen="${state.screen}"]`)?.removeAttribute("data-bar-left");
    const a = bar(was), b = bar(state.screen);
    if (!a || !b) { setFlight(null); return; }
    a.closest(".screen-layer")?.setAttribute("data-bar-left", "");
    setFlight({
      id: ++flightId.current,
      from: readLook(chromeOf(a), dev),
      to: () => { const live = bar(state.screen); return live ? readLook(chromeOf(live), dev) : null; },
      src: leg === "open" ? { placeholder: chrome[state.locale].searchPlaceholder } : { query: state.query, caret: true },
      dst: leg === "open" ? { query: "", caret: true, typing: true } : { query: state.query, back: true },
    });
  }, [state.screen, state.locale, state.query, reduced]);

  useEffect(() => {
    if (pinned || state.screen !== "skeleton") return;
    const t = setTimeout(() => patch({ screen: "results" }), SKELETON_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.screen, pinned]);

  useEffect(() => {
    if (!pinned || state.nudge !== "collapsed") return;
    const el = ref.current?.querySelector<HTMLElement>(".scroll");
    if (el) el.scrollTop = 238;
  }, [pinned, state.nudge, state.screen]);

  /** Relaunch into `to`. The language flips behind the clip, never on a
   *  screen the user can still see. */
  const relaunch = (to: Locale, extra: Partial<FlowState> = {}) =>
    patch({ screen: "transition", switchTo: to, sheetOpen: false, toast: false, ...extra });

  // The nudge's switch: the sheet asks first; the instant switch just goes, a
  // beat after the press so the pill's press is seen.
  const onSwitch = () => {
    if (confirm === "instant") setTimeout(() => relaunch(otherLocale(state.locale)), HANDOFF_MS);
    else patch({ sheetOpen: true });
  };

  const screen = (() => {
    switch (state.screen) {
      case "home":
        return <HomeScreen locale={state.locale} onSearch={() => patch({ screen: "search" })} />;
      case "search":
        return <SearchScreen onSubmit={() => patch({ screen: "results" })} />;
      case "transition":
        return (
          <TransitionScreen
            to={state.switchTo ?? "ar"}
            onDone={() => setState((s) => {
              const to = s.switchTo ?? "ar";
              return {
                ...s, screen: "skeleton", locale: to, nudge: "dismissed", offer: false,
                toast: confirm === "instant" && !s.undoing,
                undone: s.undoing || s.undone, undoing: false,
              };
            })}
          />
        );
      case "skeleton":
        return <SkeletonScreen />;
      case "results":
        return (
          <ResultsScreen
            key={`${state.locale}-${state.offer}`}
            locale={state.locale}
            offer={state.offer}
            query={state.query}
            nudge={state.nudge}
            entrance={from === "search" ? "search" : from === "skeleton" ? "skeleton" : "none"}
            onSwitch={onSwitch}
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

      <UndoToast
        show={state.screen === "results" && !!state.toast}
        to={state.locale}
        onTimeout={() => { if (!pinned) patch({ toast: false }); }}
        onUndo={() => relaunch(otherLocale(state.locale), { undoing: true })}
      />

      {confirm !== "instant" ? (
        <ConfirmSheet
          open={state.sheetOpen}
          variant={confirm}
          locale={state.locale}
          onCancel={() => patch({ sheetOpen: false })}
          onConfirm={() => {
            patch({ sheetOpen: false });
            setTimeout(() => relaunch(otherLocale(state.locale)), HANDOFF_MS);
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * Solo mode: one device, no shell, parked on one beat — for comparing against
 * Figma, and for capturing motion frames.
 */
export function SoloDevice({ start, beat, live }: { start: Locale; beat: string; live?: boolean }) {
  const [state, setState] = useState<FlowState>(() => stateFor(start, beat));
  const confirm = useConfirm();
  // A new confirm style starts the flow over — the sheet or toast in play
  // belongs to the old one.
  const firstConfirm = useRef(true);
  useEffect(() => {
    if (firstConfirm.current) { firstConfirm.current = false; return; }
    if (live) setState(initialFor(start));
  }, [confirm, live, start]);

  useEffect(() => {
    if (!live) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.toLowerCase() !== "r") return;
      setState(initialFor(start));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [live, start]);

  const device = <Device state={state} setState={setState} pinned={!live} />;
  if (!live) return device;
  return (
    <div className="solo-live">
      {device}
      <RestartButton label="Restart the prototype" onRestart={() => setState(initialFor(start))} keyHint />
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

type Props = { start: Locale; name: string; tag: string; note: string };

/** One phone plus its rail and controls: each lane runs its flow independently. */
export function Lane({ start, name, tag, note }: Props) {
  const [state, setState] = useState<FlowState>(() => initialFor(start));
  const confirm = useConfirm();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setState(initialFor(start));
  }, [confirm, start]);
  const steps = stepsFor(start, confirm);
  const step = stepOf(state);
  const at = steps.findIndex((x) => x.id === step);

  return (
    <section className="lane">
      <div className="lane-head">
        <div className="lane-title">
          <h2 className="lane-name">{name}</h2>
          <span className="lane-tag">{tag}</span>
        </div>
        <RestartButton label={`Restart the ${name} prototype`} onRestart={() => setState(initialFor(start))} />
      </div>
      <p className="lane-note">{note}</p>

      <Device state={state} setState={setState} />

      <ol className="rail">
        {steps.map((s, i) => (
          <li key={s.id} className="rail-step" data-state={i === at ? "current" : i < at ? "done" : "todo"}>
            <span className="rail-num">{i + 1}</span>
            {s.label}
          </li>
        ))}
      </ol>

      <div className="lane-foot">
        <span className="lane-state">
          {state.screen} · {state.locale} · {state.offer ? state.nudge : "no nudge"}{state.sheetOpen ? " · sheet" : ""}{state.toast ? " · toast" : ""}
        </span>
      </div>
    </section>
  );
}
