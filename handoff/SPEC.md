# Language switch nudge — motion spec (full flow)

Reference: `reference/prototype.html`. Source of every number: `reference/src/`.
Goldens: `goldens/`, which you prove against with `tools/compare-trace.ts` (§12).
Coordinates are pt on a 375 × 812 screen; the header stage sits at x12 y50.57 and is 351 wide.

## 1. The flow
| # | Beat | Trigger |
|---|---|---|
| 1 | Home loads | App start |
| 2 | Home → search overlay | Tap the search bar |
| 3 | The query types itself; suggestions rise | The overlay has settled (0.52 s) |
| 4 | Search → results | Tap a suggestion |
| 5 | Results load, then the nudge arrives | Placeholders for 0.6 s; the nudge follows 1.45 s after landing |
| 6 | Nudge collapse / dismiss | Scroll past 48 pt collapses it; "Not now" dismisses it |
| 7 | Confirmation sheet | "Switch", or the glyph |
| 8 | Relaunch → skeleton → Arabic results | Switch in the sheet |
| 9 | Arabic landing: the glyph settles in on the left | Arabic results arrive |
| 10 | The way back: Arabic sheet → relaunch → English | The glyph on the Arabic bar |

## 2. One spring system
Every animation is a spring derived from the base (R = 0.52 s, Z = 0.90) as `spring(R·mul, damping)`:
- stiffness = (2π / response)²
- damping = 4π · dampingFraction / response
- mass = 1

Delays are in seconds at R = 0.52 and scale by R / 0.52. Step responses for every role are in `goldens/roles.json`.

| Role | Response | Damping fraction | Stiffness | Damping | Used for |
|---|---|---|---|---|---|
| move | 0.520 | 0.90 | 146.0 | 21.75 | Containers and shared elements travelling (bar morphs) |
| layout | 0.624 | 1.00 | 101.4 | 20.14 | Anything that pushes content; never overshoots |
| dock | 0.468 | 0.94 | 180.2 | 25.24 | The keyboard |
| sheet | 0.468 | 0.86 | 180.2 | 23.09 | The sheet arriving |
| clear | 0.286 | 1.00 | 482.6 | 43.94 | Content fading out of the way |
| rise | 0.494 | 1.00 | 161.8 | 25.44 | Words, rows and groups arriving (9 pt up, from blur 4 px) |
| form | 0.390 | 0.68 | 259.6 | 21.91 | Surfaces forming (scale 0.72 × 0.6 → 1) before their label |
| pop | 0.364 | 0.62 | 298.0 | 21.40 | A glyph popping in from 40 %, from blur 5 px |
| recede | 0.374 | 1.00 | 281.6 | 33.56 | Anything leaving as one layer; never overshoots |
| fade | 0.312 | 1.00 | 405.6 | 40.28 | Screen cross-fades |
| relaunch | 0.780 | 1.00 | 64.9 | 16.11 | The app switching language |
| press | 0.177 | 0.62 | 1263.0 | 44.07 | Press feedback (scale 0.97); in CSS a baked `linear()` easing |

**Rules:**
- Content clears before its container moves.
- Containers settle before content forms.
- Layout never overshoots, and exits never bounce.
- The sheet's copy never animates.

## 3. Home loads
One staggered sequence runs top to bottom, 0.055 s apart, starting 0.04 s after load:
- **Marketplace rail:** rises as a row, and its tiles fade in 0.035 s apart (opacity and blur only).
- **Then, each on `rise`:** the address, the cashback strip, the promo rail, the promo terms (fade only), the section title and each category row. Tiles inside rows fade only.

Tiles own the press transform, so they never get a motion transform. The Home search bar only fades: it is the shared element for beat 2.

## 4. Search → results
- **Home → search:**
  - The bar morphs up on `move`, while Home cross-fades on `fade`.
  - The keyboard docks up from off-screen on `dock`, 0.06 s after the overlay.
- **Typing:** begins once the bar has settled. Suggestions rise 0.05 s apart on `rise`.
- **Submit:**
  - The bar travels from the overlay (x16 y70, 343 × 48) into the results header's bar position (x12 y50.57, 351 × 44) on `move`. The transform uses origin (16, 70), translate (−4, −19.43) and scale (351/343, 44/48).
  - At the same time, the keyboard drops on `recede` and the suggestions clear (y −6, blur 3 px, `clear`).
  - The overlay fades 0.22 s later.
  - The results screen fades up underneath with its bar already in that spot.
- **Results load:**
  - Placeholders on the real card geometry show for 0.6 s: chips of 75 / 71 / 97 / 99 / 108 × 36, and 2 × 2 skeleton cards with the sweep.
  - The placeholder layer then fades on `fade`, and the content rises into place: chips at 0, the grid at +0.07 s.
  - The user lands on the plain, full-width bar (nudge state P).
- **The nudge:** arrives 1.45 s after landing (§5 P → A, or §6). If the user has scrolled past the trigger during that hold, it arrives collapsed instead (P → B).

## 5. Nudge — inline layout (`nudge-core.ts`, `NudgeHeader.tsx`)
**States:**
- **P:** the plain bar at full width, with no card and no glyph.
- **A:** the nudge.
- **B:** collapsed — the bar plus a 44 × 44 glyph button.
- **C:** dismissed, with the same look as B (dismissing keeps the glyph).

**Channels:** geo, drop, sx, swd, ic, iv, btn, lay, txt, nn, sb, wm. Each is its own spring from `channelSprings`.

**Plans** (delays in seconds):

| Plan | Delays |
|---|---|
| P → A arrival | sx/swd 0 · geo .03 · lay .10 · drop .16 · iv .34 · wm .36 · txt .40 · nn .50 · sb .57 |
| A → B collapse | txt 0 · nn .025 · sb .05 · wm 0 · sx/swd 0 · ic .04 · geo .20 · btn .22 · lay .20 |
| B → A expand | btn 0 · geo 0 · lay 0 · ic .16 · sx/swd .32 · wm .10 · txt .15 · nn .19 · sb .23 |
| A → C dismiss | as A → B |
| P → C English landing | sx/swd 0 · btn .11 · iv .21 (btn and iv on `pop`) |

**The arrival, beat by beat:**
1. The bar insets.
2. The card blooms out as a halo.
3. It drops open with a soft bounce.
4. The icon pops.
5. The words rise one at a time (step 0.13, 9 pt, blur 4 → 0).
6. The pills form: surface first, then label.
7. The watermark settles in.
8. The shimmer passes once (starting 0.8 s in, lasting 1.5 s).

**Entrance overrides:** nn and sb use 0.75× / 0.68; iv uses 0.70× / 0.62; txt uses 0.95× / 1.0.

**Icon path:**
- An arc-length Bézier through P0 = iconA, P1 = (iconB.x + 16, iconA.y + 1), P2 = (W + 6, iconA.y + 10), P3 = iconB. Overshoot moves 140 pt per unit of spring overshoot.
- The icon slides along its own row and then curves up. The card and the content below only close up once it has risen out.

**Pre-snaps (only while invisible):**
- Leaving C with iv < 0.05 sets ic to the target's value.
- Entering A from P or C with geo > 0.98 sets drop to 1.
- P → C sets ic to 1.

**Background (Figma 303:13393):**
- **Fill:** `linear-gradient(104.2deg, #F5FAFF 0.5%, #EBF4FF 76.3%)`.
- **Halftone:** `assets/halftone-nudge.png`, 351 × 108, at 30 % opacity with `plus-lighter`, on the card's own layer.
- **Watermark:** `assets/watermark.svg` at 99, 4.4, with rest opacity 1.
- The halftone and watermark stay fixed in header space while the card absorbs (via a counter-translate), and fade with the fill.

## 6. Nudge — tooltip layout (`tooltip-core.ts`, `TooltipHeader.tsx`)
**Layout:**
- A full-width bar, with a pale 351 × 52 card (radius 16) hanging 14 pt below it off a pointer (18 × 7, tip at x44).
- The card holds an icon tile (32, radius 8), the line "Want noon in العربية?" (13/20 semibold), then Not now and Switch.
- Collapsed, it becomes a 44 × 44 button beside a 299 pt bar.

**Channels:** geo, uf, drop, nt, dm, sx, swd, ic, iv, lay, txt, nn, sb, wm.

**Arrival (P → A):**
- Delays: nt 0 · lay .02 · uf .07 · drop .12 · iv .30 · wm .32 · txt .36 · nn .46 · sb .53.
- The pointer slips out from under the bar (y −12 → 0, scale 0.5 → 1).
- The card unfolds from it: a sliver 18 pt wide spreads to full width, then drops to full height.
- The tile pops, the words rise and the pills form.
- One slow band of light crosses the background: 2.4 s, starting 0.95 s in, with sine easing and a 60 % peak, behind the copy.

**Collapse (A → B):**
- Delays: txt 0 · nn .025 · sb .05 · wm 0 · sx/swd 0 · ic .06 · geo .20 · lay .20.
- The tile slides along its row and then curves up into the slot.
- It stays 32 pt until 80 % of the path, then grows to 44 with its border fading in. It lifts with a soft shadow of sin(π·ic).
- The path runs P0 (25, 84), P1 (250, 83), P2 (370, 95), P3 (329, 22), with 80 pt of overshoot per unit.

**Expand (B → A):** geo 0 · lay 0 · ic .12 · sx/swd .32 · wm .12 · txt .16 · nn .20 · sb .24.

**Dismiss (A → C):**
1. The whole tooltip recedes toward the pointer tip (44, 51) as one layer, on `recede`: opacity 1 − 1.1d, y −6d, scale 1 → 0.94, blur 3d px.
2. The layout gives the space back from 0.07 s.
3. At 0.30 s, invisibly, the tooltip folds away and the tile parks in the slot with iv = 0.
4. The bar narrows and the glyph pops in (iv from 0.08 s, on `pop`).

The header always contains the tile, so the tile is never drawn over the results. Background: the §5 fill, plus the halftone anchored to the card's bottom edge.

## 7. Sheet (`Sheet.tsx`, Figma 278:89200)
- **Movement:** it docks on `sheet` with the scrim on `fade`, and leaves on `recede` with the drag's release velocity. A drag commits to dismissing past 35 % of the 341 pt travel, measured with a projection factor of 0.998.
- **Copy:** never animates.
- **Background:**
  - A flat #F2F3F7, plus the Header Slot halftone (`assets/halftone-sheet.png`, 351 × 120 at 0, 0, at 28 %).
  - The halftone fades in after the sheet docks (1.2 s, starting at 0.3 s).
  - It then breathes: opacity 0.28 ↔ 0.40 with a 6 × 2 pt drift, on a 7 s alternating loop. It holds still under reduced motion.
- **Arabic twin:**
  - Title "تغيير لغة التطبيق إلى الإنجليزية؟", with an English line under it ("Switch the app to English?", 12/16 tertiary).
  - Buttons إلغاء / تبديل.
  - 296 pt tall, with a 28 pt title line height, mirrored under RTL.

## 8. Relaunch and landings
- **Relaunch:**
  - The sheet recedes. 0.16 s later, the current screen lets go (opacity 0, blur 6 px, scale 0.985, on `relaunch`) while the clip fades up underneath on `relaunch`.
  - Clips: `hala-morph.mp4` (to Arabic, cut at 2.35 s) and `hala-morph-back.mp4` (to English, cut at 2.40 s). A timer ends the beat at the cut.
- **Language flip:** the locale and layout direction flip behind the clip, as the skeleton takes over — never on a visible screen.
- **Skeleton → results:** a cross-fade on `relaunch`. Results arriving from the skeleton must not move.
- **Arabic landing:**
  - The full-width bar shows first.
  - The slot on the leading side (the left, in RTL) opens from 0 to 52 pt on `move` at 0.55 s.
  - The button surface forms (0.35 → 1, `form`, at 0.68 s) and the glyph pops (`pop`, at 0.78 s).
  - Tapping it opens the Arabic sheet.
- **English landing:** P → C (§5 and §6), mounted 0.45 s after landing. The nudge is never re-offered.

## 9. Engine rules
- **Channels:** one value per channel. A retarget carries the current velocity, so a reversal continues rather than restarting.
- **Starting an animation** stops the running one. With a delay, the value holds still, then springs with the velocity captured at the call (`tools/spring-sim.ts`).
- **Snaps** happen only while invisible, as a zero-velocity jump. A `set()` infers a velocity from the instant change and flings the next spring past its target.
- **Overscroll:** (o · 110 · 0.55) / (110 + 0.55 · |o|), so it never exceeds about 110 pt. Wheel input is damped ×0.25, momentum after release is ignored for 450 ms, and the pull settles on `layout`.
- **Chip row:** bleeds to the screen edges, carrying its 12 pt inset itself plus a trailing 4 pt spacer. Use logical properties.
- **Inner search bar:** inside a bordered wrapper, it carries no fixed height of its own.

## 10. Edge cases to decide in product
1. **Bilingual users:** cap the frequency, and never re-offer after "Not now" or a round trip.
2. **Mixed or transliterated queries:** decide what triggers the nudge.
3. **Arabic phone, English app:** this is a stronger signal.
4. **What survives the relaunch:** cart, filters, sort, scroll position, the back stack, and whether the query is localised.
5. **A failed relaunch:** a timeout, an error state, and which language it is shown in.
6. **Double taps:** guard Switch, and the glyph while it is travelling.
7. **Large text:** wrap or stack the nudge row.
8. **Screen readers:** announce the nudge without stealing focus, and label the glyph in both languages.
9. **The way back without a glyph:** it must be readable by someone who can't read Arabic.

## 11. Acceptance checks
1. The icon or tile never overlaps the search bar, including across interrupts. The prototype's minimum clearance is 12 pt inline and 3 pt tooltip.
2. The icon or tile never drops below its resting row and never leaves the header.
3. Layout never overshoots, and exits never bounce.
4. Reversals mid-flight are seamless.
5. Under reduced motion, everything snaps and all loops stop.
6. Every resting state matches Figma.
7. No half-mirrored screen appears during the relaunch.
8. Results arriving from the skeleton don't shift by a pixel.
9. **Every golden in `goldens/` passes `tools/compare-trace.ts`** (§12).

## 12. Conformance
- **Golden traces:** `goldens/*.json` are the approved motion, sampled at 60 fps. Each frame holds `channels` (what you record) and `geom` (what gets drawn: card, search, icon or tile rects, header height), so you can also check your geometry functions against them.
- **Generation:** they are generated by `tools/goldens.ts` from the same cores the prototype renders, driven through `tools/spring-sim.ts`. They were validated against live traces from the running prototype (`goldens/validated-live-traces/`; all pass).
- **Tolerances:** 0.015 on 0–1 channels and 0.75 pt on pixel channels, with 2 frames of start latency and one frame of sampling jitter (widened after a dropped frame).
- **If a trace fails:** the report names the channel and the time. The usual causes are:
  - a retuned spring;
  - a delay that doesn't hold the value still;
  - a snap done with `set()`;
  - a plan applied from the wrong origin state.
