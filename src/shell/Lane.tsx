import { useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";

import { HomeScreen } from "../screens/HomeScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { ResultsScreen } from "../screens/ResultsScreen";
import { TransitionScreen } from "../screens/TransitionScreen";
import { SkeletonScreen } from "../screens/SkeletonScreen";
import { ConfirmSheet } from "../components/Sheet";
import { dirFor } from "../data/copy";
import { SPR, at } from "../motion/springs";
import {
  STEPS, initialState, stateForStep, stepOf,
  type FlowState, type Screen, type StepId, type Variant,
} from "../flow/flow";

/** How long the skeleton holds — one shimmer sweep plus its rest, then a beat. */
const SKELETON_MS = 1600;
/** How long the reload takes to grow out of the Switch button. */
const BURST_MS = 340;

/**
 * Screen changes run on the flow's one spring system (`motion/springs.ts`).
 *
 * Home, search and results share the search bar, so the BAR carries those
 * transitions — it morphs between its positions on the `move` spring — while
 * the screens behind it cross-fade on `fade`. No scale on these: scaling a
 * parent during a layout animation distorts what the shared element measures.
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
const SCREEN_ANIM = {
  home:       { variants: fadeIn, initial: "hidden" },
  search:     { variants: { ...fadeIn, gone: { opacity: 0, transition: { ...SPR.fade, delay: at(0.1) } } }, initial: "hidden" },
  results:    { variants: fadeIn, initial: "hidden" },
  transition: { variants: fadeIn, initial: "hidden" },
  skeleton:   { variants: fadeIn, initial: "hidden" },
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
  // The reload grows out of the button that caused it. Rare, high-emotion,
  // and the clip it hands to opens on white — so the two meet seamlessly.
  const [burst, setBurst] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const patch = (next: Partial<FlowState>) => setState((s) => ({ ...s, ...next }));

  // Results entering straight from the search overlay is a content arrival and
  // gets a short settle. Entering from the skeleton must NOT — there the
  // placeholder and the content occupy the same pixels and nothing should move.
  const from = prev.current;
  useEffect(() => { prev.current = state.screen; }, [state.screen]);

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
        return <TransitionScreen onDone={() => patch({ screen: "skeleton" })} />;
      case "skeleton":
        return <SkeletonScreen />;
      case "results":
        return (
          <ResultsScreen
            locale={state.locale}
            variant={variant}
            nudge={state.nudge}
            entrance={from === "search" ? "search" : "none"}
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
    <div className="device" dir={dirFor[state.locale]} ref={ref}>
      {/* The layer the sheet pushes back. */}
      <div className="device-screens">
        <LayoutGroup>
        <AnimatePresence initial={false}>
          <motion.div
            key={state.screen}
            className="screen-layer"
            {...SCREEN_ANIM[state.screen]}
            animate="shown"
            exit="gone"
          >
            {screen}
          </motion.div>
        </AnimatePresence>
        </LayoutGroup>
      </div>

      <AnimatePresence>
        {burst ? (
          <motion.div
            key="burst"
            className="burst"
            initial={{ left: burst.x, top: burst.y, width: burst.w, height: burst.h, borderRadius: 12, opacity: 1 }}
            animate={{ left: 0, top: 0, width: 375, height: 812, borderRadius: 0 }}
            // Holds until the relaunch screen has faded in underneath, so the
            // outgoing screen — already mirrored to Arabic — is never seen.
            exit={{ opacity: 0, transition: { ...SPR.fade, delay: at(0.32) } }}
            transition={SPR.burst}
          />
        ) : null}
      </AnimatePresence>

      <ConfirmSheet
        open={state.sheetOpen}
        onCancel={() => patch({ sheetOpen: false })}
        onConfirm={(from) => {
          const box = ref.current?.getBoundingClientRect();
          if (box) setBurst({ x: from.x - box.x, y: from.y - box.y, w: from.width, h: from.height });
          patch({ sheetOpen: false });
          setTimeout(() => {
            patch({ screen: "transition", locale: "ar", nudge: "dismissed" });
            setBurst(null);
          }, BURST_MS);
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

  return <Device variant={variant} state={state} setState={setState} pinned={!live && collapseAt === undefined} />;
}

type Props = { variant: Variant; name: string; tag: string; note: string };

/** One phone plus its rail and controls: each variant runs the flow independently. */
export function Lane({ variant, name, tag, note }: Props) {
  const [state, setState] = useState<FlowState>(initialState);
  const step = stepOf(state);
  const at = STEPS.findIndex((x) => x.id === step);

  return (
    <section className="lane">
      <div className="lane-head">
        <h2 className="lane-name">{name}</h2>
        <span className="lane-tag">{tag}</span>
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
        <button className="lane-btn" onClick={() => setState(initialState)}>Reset</button>
        <span className="lane-state">
          {state.screen} · {state.locale} · {state.nudge}{state.sheetOpen ? " · sheet" : ""}
        </span>
      </div>
    </section>
  );
}
