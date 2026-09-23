# Language switch nudge — full-flow motion handoff

**Claude Code: start here.** This package specifies the motion for the whole
language-switch flow. The flow runs from Home to search, then results with the
nudge, the confirmation sheet and the relaunch into Arabic, and the round trip
back to English. The screens already exist in the codebase, built from Figma
(`JovVwactrtpNkNSPfu4tsm`).

Your job is to reproduce this motion **exactly** — not approximately, not "in
the spirit of". The package gives you the source of the motion, frame-by-frame
golden traces of it, and a tool that proves whether your build matches.

## Fidelity contract
1. **Port the cores verbatim; don't reinterpret them.**
   - `reference/src/motion/nudge-core.ts`, `tooltip-core.ts` and `springs.ts` are pure logic, with no DOM and no React: states, delay plans, spring constants, icon/tile paths and per-frame geometry.
   - Import them as-is (TypeScript / React Native), or translate them line for line (Swift/Kotlin).
   - Never retune a number, simplify a path, or replace a spring with a duration and a curve.
2. **Run springs with the same semantics as Motion** (`tools/spring-sim.ts` states them exactly):
   - Mass 1, closed-form damped spring.
   - Starting an animation stops the running one. With a delay, the value holds still through the delay, then springs from there with the velocity captured when the animation was started.
   - It settles by snapping to the target under the rest thresholds (0.005 / 0.01 when |Δ| < 5, otherwise 0.5 / 2).
   - Reanimated's `withDelay(d, withSpring(to, { mass: 1, stiffness, damping, velocity }))` and SwiftUI's `.spring(response:dampingFraction:)` both match this.
3. **Snap only while invisible, and with zero velocity.** Use `jump()`, not `set()` (SPEC §9).
4. **Don't change how anything looks at rest.** Motion adds movement; resting frames must still match Figma.
5. **Prove it** (below). A beat isn't done until its trace passes.

## How to prove it
1. Add a trace hook to your build, the same way `reference/src/motion/trace.ts` does:
   - When a nudge transition is triggered, start a trace.
   - On every rendered frame, append `{ t, channels }`, where `t` is seconds since the trigger and `channels` are the channel values of `SPEC §5` or `§6`.
   - On React Native, a `useFrameCallback` reading the shared values works.
2. Trigger each transition in the build and save each trace as JSON: `{ frames: [{ t, channels }] }`.
3. Compare it:
   `npx tsx tools/compare-trace.ts goldens/inline-collapse-AB.json my-trace.json`
   - It prints the max error per channel and exits 0 on **PASS**.
   - Tolerances: 0.015 on 0–1 channels and 0.75 pt on pixel channels.
   - It allows up to 2 frames of start latency, and one frame of sampling jitter (widened after dropped frames).
4. Do this for every golden in `goldens/`:

| Golden | Transition |
|---|---|
| `inline-arrive-PA` / `tooltip-arrive-PA` | The nudge arrives out of the plain bar |
| `inline-collapse-AB` / `tooltip-collapse-AB` | Scroll past the trigger |
| `inline-expand-BA` / `tooltip-expand-BA` | Back to the top |
| `inline-dismiss-AC` / `tooltip-dismiss-AC` | Not now |
| `inline-settle-PC` / `tooltip-settle-PC` | English landing after the round trip |
| `inline-scrolled-during-hold-PB` | The user scrolled before the nudge arrived |
| `*-interrupt-AB-BA-AB` | Reversals mid-flight at 0.2 s and 0.45 s |
| `roles.json` | Unit step response of every spring role (use it for the non-nudge beats) |

`goldens/validated-live-traces/` holds traces recorded from the running prototype in a browser. All eight pass against the goldens, so the goldens are verified to be the motion you saw, not a model of it.

5. For the beats outside the nudge (Home loading, the search bar hand-off, keyboard, placeholders, sheet, relaunch, Arabic and English landings), verify the role, from/to values and delays against `SPEC.md` and `motion-tokens.json`. Then compare side by side with `videos/` and `reference/prototype.html`.

## What's in the folder
| Path | What it is |
|---|---|
| `SPEC.md` | Every beat: spring roles, choreography, states and plans, both nudge layouts, the sheet, the relaunch, engine rules, edge cases and acceptance checks |
| `motion-tokens.json` | The same numbers, machine-readable |
| `reference/src/motion/` | The cores to port (`nudge-core`, `tooltip-core`, `springs`) and the runners (`useNudgeMotion`, `useChannels`, `useRubberBand`), plus the trace hook |
| `reference/src/…` | How each beat is wired in the prototype (React + Motion) |
| `reference/prototype.html` | The whole prototype in one file; open it in a browser |
| `goldens/` | Golden traces at 60 fps: channels, plus the geometry drawn from them |
| `tools/` | `spring-sim.ts` (Motion's spring semantics), `goldens.ts` (regenerates goldens from the cores), `compare-trace.ts` (the conformance check) |
| `videos/` | 1× screen recordings of the full flow and of dismiss, for both layouts. The relaunch clip shows white here because the headless recorder doesn't decode it; in the prototype it plays. |
| `assets/` | Halftones, the watermark glyph and both relaunch clips |

## Build notes
- **Stack:** use the project's own animation library. Reanimated on React Native: one shared value per channel, with geometry computed in `useAnimatedStyle` from the ported core. Don't add a second library.
- **Reduced motion:** everything snaps to its end state, and shimmer, sweeps and the sheet's breathing stop.
- **Clipping:** the icon or tile never leaves the header while it travels. A native header clips, and the paths are built for that.
