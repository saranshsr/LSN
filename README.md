# Language switch nudge — web prototype

A standalone, runnable prototype of **noon's app-language-switch nudge flow**:
a user searches in Arabic on an English app, the app notices and offers to
switch, and the whole thing plays out end to end — home, the Arabic query, the
nudge, the scroll collapse, the confirmation sheet, the shipped app's own
Hala → هلا wordmark morph, the loading skeleton, and the mirrored Arabic
results. Two surviving nudge layouts (inline and tooltip) run side by side.

Mirrored from `figma.com/design/JovVwactrtpNkNSPfu4tsm` → section
**`278:110006` "flow"**.

## Running it

Node 18+ and npm. Nothing else — no design-system checkout, no private
registry, no env vars.

```bash
npm install
npm run dev        # http://localhost:5180
```

Other scripts:

```bash
npm run build      # tsc --noEmit && vite build  →  dist/
npm run preview    # serve the built output
npm run typecheck  # tsc --noEmit
```

## URL modes

Everything is driven by query params on the one page.

| URL | What you get |
| --- | --- |
| `/` | The **two-lane review shell** — both nudge layouts side by side, with the notes. The default. |
| `/?device=inline` | **One interactive phone** at true 375 × 812, no shell around it. The mode to present from, and the one to open when a preview pane is sized to the device. Swap `inline` for `tooltip` for the other layout. |
| `/?solo=inline&beat=<id>` | The same bare phone **parked on one beat**, for Figma comparison and headless frame capture. |
| `/?ac=1` | The **motion acceptance readout** — a dev-only overlay that records the checks in `docs/motion-handoff/SPEC.md` §9 as the flow runs. Combines with the modes above. |

Beats, in order:

`home · search · offered · collapsed · sheet · transition · skeleton · switched`

## Self-contained by design

`src/styles/tokens.css`, `src/motion/tokens.ts` and `src/icons/icons.ts` are
**generated from the Field design system, but committed on purpose** so this
package runs on its own.

The two scripts in `scripts/` — `gen-tokens.py` and `gen-icons.py` — are the
generators. You do **not** need them to run the prototype. They are only for
regenerating that output after a DS bump, and each one hard-codes an **absolute
path into a local checkout of the Field DS repo** that will not exist on another
machine. Repoint the `RAW` / `SRC` constant at the top of each script at your own
checkout before running either of them.

`docs/motion-handoff/` is the motion handoff bundle that goes with this build:
the spec, the extracted motion tokens, a framework-agnostic `motion-core.ts`,
and a single-file reference prototype.

## What it covers

| # | Beat | Figma frame |
|---|------|-------------|
| 1 | Home | `278:46104` |
| 2 | Arabic query on an English app | `278:45836` |
| 3 | Nudge offered | `278:18930` |
| 4 | Scrolled — nudge collapses to the glyph | `278:47000` |
| 5 | Confirmation sheet | `278:89196` |
| 6 | Hala → هلا wordmark morph | `278:109973` |
| 7 | Loading skeleton | `294:2` |
| 8 | Mirrored Arabic PLP | `278:67831` |

Frames 3 and 4 are one screen here, because the only difference between them is
scroll position. Frame 7 is the same screen at `locale = "ar"`.

## The two lanes

- **True inline** — mirrored from the Figma. The nudge takes a row inside the
  pale card under the search bar and pushes the results down.
- **Tooltip** — *derived, not mirrored.* The section only draws the inline
  layout, so this is a first pass at the other direction that survived the
  21 Sep review. It hangs off the glyph and floats over the results.

## Layout

```
src/
  data/        copy.ts (every string, mirrored from the frames) · products.ts
  flow/        flow.ts — the state machine and the seven beats
  screens/     Home · Search · Results (LTR + RTL) · Splash
  components/  chrome · SearchBar · ProductCard · nudge · Sheet · Keyboard
  icons/       generated from @field-ds/icons, plus the dirham mark
  shell/       Lane.tsx — one phone, one copy of the flow
  styles/      tokens.css (generated) · app.css
scripts/       gen-tokens.py · gen-icons.py — DS regeneration only, not needed to run
docs/
  motion-handoff/  SPEC.md · motion-tokens.json · motion-core.ts · reference/
```

Design tokens and icons are **generated from the Field DS repo**, not
hand-copied — but the generated output is committed, so nothing here needs the
DS repo to run. Only after a DS bump, and only once you have repointed the
absolute `RAW` / `SRC` paths at the top of the two scripts at your own Field DS
checkout:

```bash
npm run tokens && python3 scripts/gen-icons.py
```

## Comparing against Figma

`?solo=<variant>&beat=<id>` renders one bare phone at 375 × 812, parked on one
beat, with no shell around it — so a headless capture lines up 1:1 with a Figma
frame export:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --force-device-scale-factor=2 --window-size=375,812 \
  --screenshot=offered.png "http://localhost:5180/?solo=inline&beat=offered"
```

Beats: `home · search · offered · collapsed · sheet · transition · skeleton · switched`
(also listed under **URL modes** above).

Two more params for inspecting motion, since the Claude browser pane throttles
`requestAnimationFrame` and cannot be trusted for mid-flight frames:

- `?slow=6` — multiplies the motion durations, for frame-by-frame review.
- `?collapseAt=500` — fires the collapse 500ms after load, so a headless capture
  lands on a chosen frame instead of whatever the screenshot timer catches.

The skeleton was built the other way round — specced first, then built in Figma
(`294:2`) and in the prototype against the same numbers. They agree to within
1px on every band: chips at x288 / 209 / 104 / −3 / −119, cards 171.5 × 421.33
at x12 and x191.5, rows at y163 and y592.33.

Every other screen was built by measuring the frame, not by eye. Verified matches:
card 171.5 × 421.33 at x12 with an 8px gutter and a 12px grid inset; PLP header
card 351 × 108 with the bar at 331 × 44 and the nudge row 331 × 32 split
183 / 148; sheet 351 × 280 with glyph, title, body box and buttons landing
within 1–2px of the frame's ink; keyboard block y516–770 with 41.5pt rows on a
52 pitch. Typography comes from the DS text styles, letter-spacing included.

Known gaps, all deliberate:

- **Home** is a cloned legacy screen whose promo and cashback artwork are
  bitmaps in the frame. Rebuilt in CSS from measurements, so the art crops and
  the second category row differ from the export.
- **The RTL frame is a detached mirror** with its own internal spacing — its
  cards run ~10px tighter than the LTR cards they were copied from. The
  prototype keeps one card component, matched to the LTR frame.
- Two DS icons the legacy Home nav uses (the sparkle on Categories, the badge
  on Deals) are not in `@field-ds/icons`; the nearest published ones are used.
- **The status bar is Figma's own component**, not a re-drawing: its cellular,
  wifi and battery paths are exported from the frame and placed at measured
  positions (time x33, cellular x293, wifi x315, battery x335.33). It is
  absolutely positioned so no flex shrink can clip the battery cap. The clock
  renders in the OS font — a couple of pixels wider than SF Pro in a headless
  capture, exact in a real browser.

## Notes

- Copy is mirrored **exactly as drawn**, including the places where the frames
  have not caught up with the copy decisions. Those are listed in
  [DIVERGENCES.md](DIVERGENCES.md) rather than quietly fixed here.
- Noontree has no Arabic glyphs; Noto Sans Arabic is loaded for Arabic runs.
- Arabic strings carry an English gloss in a comment, since the designer does
  not read Arabic.
## Motion

Curves and durations come from `@field-ds/tokens`, not a parallel system —
`loft` (0.22, 1, 0.36, 1) for every entrance and exit, `standard`
(0.32, 0.72, 0, 1), the Ionic drawer curve, for the sheet and the glyph's
travel. No `ease-in` anywhere; nothing over 300ms.

| Beat | What moves | How |
| --- | --- | --- |
| Screen changes | Every swap cross-fades instead of cutting. 100ms into search and results, 200ms into the transition and the skeleton | `AnimatePresence`, per-destination |
| Search overlay | Bar travels the 124px from Home's y194 to y70; the query **types itself** at 95ms/char starting 260ms in; suggestions hold until it lands, then stagger; keyboard rises | CSS + state, 200–260ms |
| Nudge arrival | Card mounts closed and opens a beat (120ms) later — results yield downward, the glyph flies out of the search bar into the row, then pulses once | CSS, 260ms |
| Results arrival | Chips and grid settle 6px with a 25ms offset — two groups, not eight cards | CSS, 160ms |
| Sheet recede | The screen behind scales to 0.94, lifts 8px and rounds to 12, and comes back **as the sheet is dragged down** | CSS + drag-written transform |
| Nudge collapse | Card height 108 → 44, bar yields 52px, glyph translates from the in-row slot to the standalone one | CSS transitions, 260ms |
| Glyph pulse | One scale beat, 120ms after the screen lands, once | CSS keyframes, 320ms |
| Tooltip | Scales out of the glyph — `transform-origin: 100% 0` | `@starting-style`, 200ms |
| Sheet | Springs up; drag down to dismiss on 100px or a 0.4 px/ms flick | Motion, spring in / 200ms out |
| Transition | The shipped app's own Hala → هلا morph, from a 16 Sep screen recording, cut at 2.35s — the frame its fade-out completes. The real capture then sits blank for 580ms before its skeleton; that dead air is trimmed. | `<video>`, 2.35s |
| Skeleton | Placeholders on the real PLP geometry, so content lands where its placeholder was. One white band at `alpha 0.38` translating right to left, 762ms of travel then a 508ms rest — the period measured off the recording. | CSS transform, 1.27s loop |
| Dismiss vs collapse | Collapsing parks the offer, so the glyph travels to the bar. Dismissing ends it, so the glyph hands off with a cross-fade and the card leaves at `--d-exit` instead of `--d-nudge`. | CSS, 180–260ms |
| Press | `scale(0.97)` on everything pressable | CSS, 160ms |

**Deliberately not animated:** the product grid and the filter chips. They are
data the user reads, and they are on screen constantly — motion there is cost
with no purpose. The suggestions animate once with the overlay, never per
keystroke.

`prefers-reduced-motion` is honoured globally (CSS) and by Motion
(`<MotionConfig reducedMotion="user">`). Hover states are gated behind
`@media (hover: hover) and (pointer: fine)`.

Height is animated on the nudge card — the one place transform-only is broken.
It is deliberate: the results below have to move *with* the header, and a
layout-projection morph would snap them instead.


## Nudge motion — one deliberate divergence from the handoff

`docs/motion-handoff/SPEC.md` §1 defines state **C (Dismissed)** as "search field
alone at full width. No button."

This build does not do that. Dismissing collapses the nudge **into the glyph
button**, so C rests exactly where B does. Two reasons:

- The 17 Sep benchmarking landed on Chrome's model — dismiss ≠ never, and the
  in-field entry point survives so the offer is recoverable.
- There is no C frame in Figma to draw a buttonless state from.

The states stay distinct in behaviour rather than in pixels: scrolling can bring
the nudge back from B, and never from C (SPEC §7). `A → C` therefore travels the
icon to the button on the same beats as `A → B`, instead of fading it in place.

The change is localised to `stateTargets().C` and `PLANS.AC` in
`src/motion/nudge-core.ts`, both commented. Reverting to the spec's C is a
one-line edit.

Everything else follows the handoff. Acceptance checks (SPEC §9), measured in
headless Chrome with the recorder that `?ac=1` prints:

| Check | Result | Required |
|---|---|---|
| §9.1 icon ↔ search clearance | 18 | ≥ 2 |
| §9.2 icon inside card while visible | −16 (inside) | ≤ 0 |
| §9.3 `lay` range | [0, 1] | no overshoot |

§9.7 — a side-by-side against `docs/motion-handoff/reference/prototype.html` at
0.25× — has **not** been done.
