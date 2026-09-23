# Language nudge — motion spec

Approved base spring: **response 0.52 s, damping fraction 0.90** (mass 1 → stiffness 146.0, damping 21.75).
Reference build: `reference/prototype.html` (open it; use 0.25× to compare).

## 1. States
| Id | Name | What's on screen |
|---|---|---|
| **A** | Nudge | Search field inset inside the blue container card. Below it sit: translate icon, "Switch app to Arabic?", "Not now" and "Switch". |
| **B** | Collapsed | Search field alone, then the square translate button to its right. |
| **C** | Dismissed | Search field alone at full width. No button. |

Triggers:
- "Switch" → B.
- "Not now" → C.
- Tapping the collapsed translate button → A.
- Scrolling past the trigger → B, and scrolling back near the top → A (§7).
- Showing the nudge from C plays the **entrance** (C → A, §6).
- **Mount behaviour:** if the nudge should appear on first render, mount in C and run the entrance after it is laid out.

## 2. Element roles (map these to the existing Figma-wired layers)
| Role | Notes |
|---|---|
| `container` | The blue card: gradient fill, dot texture and rounded corners. It must clip its children (overflow hidden). |
| `search` | The search field: back chevron, query text, divider and camera. It sits above `container` in z-order. |
| `divider`, `camera` | Positioned from the search field's **right** edge, so they travel with its width. |
| `icon` | **One** translate icon instance, absolutely positioned above everything and outside the container clip. It travels between the nudge row and the collapsed button. If Figma has two icon instances (nudge row + button), render one moving icon and hide the static ones. |
| `buttonSurface` | The square surface of the collapsed button. It sits at the same x/y as B's button and has no icon of its own (the moving icon lands on it). |
| `prompt` | "Switch app to Arabic?". For the entrance it must be split into per-word spans or views. |
| `notNow`, `switch` | Each needs two layers: `surface` (pill background) and `label`. Split them if the Figma output is a single node. |
| `watermark` | The large faint translate glyph inside the container. |
| `sheenRim`, `sheenTint`, `glint` | New overlay layers added for the entrance shimmer (§6.2). |
| `below` | Everything under the header. It moves with the layout spring. |

## 3. Geometry (derive from the real layout; never hard-code)
Measure these from the component. Values in brackets are the Figma values at a 526 pt container width.
- `W` container width [526]
- `inset` search inset inside the card [16]
- `top` search top offset [15]
- `h` search height [66]
- `gap` between search and collapsed button [13]
- `cardH` nudge card height [162]
- `iconA` icon centre in the nudge row [(38, 124)]
- icon sizes [28 → 30]
- radii: card 26, search 18 in A and 20 in B/C, collapsed button 20

Derived values:
- `btnSize = h`, `btnX = W − btnSize`, `iconB = (btnX + btnSize/2, top + h/2)`.
- Search frame per state:
  - A: x = inset, w = W − 2·inset
  - B: x = 0, w = btnX − gap
  - C: x = 0, w = W
- `collapsedH = 2·top + h` [96].

Per-frame geometry from the channel values (all functions are in `motion-core.ts → geom()`):
- **Search:** x = `sx`, w = `swd`, radius = lerp(18, 20, clamp(geo)). Its border opacity is clamp((geo − 0.35)/0.55). The divider sits at `swd − lerp(62, 59, geo)`, and the camera centre at `swd − lerp(34, 31, geo)`.
- **Card:** the rect interpolates from the full card toward the current search rect by `geo`.
  - x = lerp(0, sx, geo), y = lerp(0, top, geo), w = lerp(W, swd, geo).
  - h = lerp(lerp(cardH, collapsedH, drop), h, geo). The `drop` term only matters during the entrance.
  - Radius = lerp(26, 20, clamp(geo)).
  - Gradient opacity = clamp(1 − 1.25·geo). Dot texture = clamp(1 − 2·geo).
  - Behind the gradient the card is white, so it disappears into the search field.
- **Card children:** keep them fixed in header space. Counter-translate the card's inner content by (−cardX, −cardY), so the clip reveals and hides them rather than moving them.
- **Icon:**
  - Position = `pathAt(ic)` (§4).
  - Size = lerp(28, 30, clamp(ic)) × lerp(k, 1, iv), where k = 0.40 during the entrance and 0.55 otherwise. Use raw `iv` here so the spring overshoot shows.
  - Opacity = clamp(iv). Blur = (1 − iv)·5 px.
- **Collapsed button surface:** opacity clamp(1.4·btn), scale max(0, lerp(0.35, 1, btn)) around its centre. It is tappable only when btn > 0.6.
- **Header height:** max(lerp(cardH, collapsedH, lay), cardBottom). `below` translates by lerp(cardH, collapsedH, lay) − cardH.

## 4. Icon path
The icon follows a cubic Bézier that dips under the search field and rises into the button. It is **re-parameterised by arc length**, so the spring drives even travel along the curve.
- Control points:
  - P0 = iconA
  - P1 = (iconA.x + 0.40·(iconB.x − iconA.x), iconA.y + 16)
  - P2 = (W − 2, iconA.y + 24)
  - P3 = iconB
- Past either end (spring overshoot), extrapolate along the end tangent at **140 px per unit** of overshoot. This gives about 5–7 px of lift above the button at damping 0.90. Don't extrapolate along the curve's full length.
- The curve must never overlap the search field; this is verified in §9.

## 5. Springs
Each channel is its own spring with value, velocity and target. When a state changes, the channel retargets and keeps its current velocity.

| Channel | Drives | Response | Damping fraction | Stiffness | Damping |
|---|---|---|---|---|---|
| `geo` | card absorbed into search (0 → 1) | 0.520 | 0.900 | 146.0 | 21.75 |
| `sx`, `swd` | search x / width (px) | 0.468 | 0.828 | 180.2 | 22.23 |
| `ic` | icon travel along path | 0.562 | 0.720 | 125.2 | 16.11 |
| `btn` | collapsed button surface | 0.416 | 0.648 | 228.1 | 19.57 |
| `iv` | icon visibility | 0.312 | 1.000 | 405.6 | 40.28 |
| `lay` | layout height / content below (**never overshoots**) | 0.624 | 1.000 | 101.4 | 20.14 |
| `drop` | entrance: halo → full card | 0.546 | 0.738 | 132.4 | 16.99 |
| `wm` | watermark | 0.364 | 1.000 | 298.0 | 34.52 |
| `txt`, `nn`, `sb` | prompt, Not now, Switch (0 = shown, 1 = hidden) | 0.286 | 1.000 | 482.6 | 43.94 |

**Entrance-only overrides** (C → A). Apply them when the entrance starts; restore the table values on the next transition.
- `nn`, `sb`: response 0.39, damping 0.68 (259.6 / 21.91).
- `iv`: 0.364, damping 0.62 (298.0 / 21.40).
- `txt`: 0.494, damping 1.0 (161.8 / 25.44).

Responses are multiples of the base (see `motion-tokens.json`), so the whole system retunes from one number. Delays scale by `response / 0.52`.
- Reanimated: `withSpring(target, { mass: 1, stiffness, damping })`.
- Framer Motion: `{ type: 'spring', mass: 1, stiffness, damping }`.
- SwiftUI: `.spring(response:, dampingFraction:)`.

## 6. Choreography (delays in seconds, relative to the trigger)
| Transition | Sequence |
|---|---|
| **A → B** collapse | txt 0 · nn .025 · sb .05 · wm 0 · geo .03 · ic .05 · sx/swd .06 · lay .08 · btn .20 |
| **B → A** expand | btn 0 · ic 0 · lay 0 · geo .05 · sx/swd .08 · wm .10 · txt .15 · nn .19 · sb .23 |
| **A → C** dismiss | txt 0 · nn .025 · sb .05 · wm 0 · iv 0 · geo .03 · sx/swd .06 · lay .08 (icon fades in place, no button) |
| **B → C** | btn 0 · iv 0 · sx/swd .04 (search grows into the button's space) |
| **C → B** | sx/swd 0 · btn .14 · iv .18. Before starting, snap `ic` to 1 while the icon is invisible. |
| **C → A** entrance | See §6.1 |

Before any transition out of C, if `iv < 0.05`, snap `ic` to the target state's value so the icon reappears in its resting spot.

**Exit styling of copy** (used for collapse and dismiss; v = channel value, 0 → 1):
- opacity clamp(1 − 1.15v), blur 7v px, translate(v·drift, −10v), scale 1 − 0.06v.
- Drift: prompt 18, Not now 12, Switch 8.
- Watermark: opacity 0.75·(1 − v), translate(30v, −14v), rotate(−8v°).
- Disable hit-testing when v > 0.5.

### 6.1 Entrance (C → A)
1. **Before starting,** with the card fully inside the search field (geo ≈ 1), snap `drop` to 1. This is invisible and turns the card into a "halo" shape.
2. `sx`/`swd` at 0: the search field insets from full width, which opens a rim around it.
3. `geo` at .03: the halo blooms out from behind the search field, covering the top, sides and 15 pt below it.
4. `lay` at .10: the content below moves down (no overshoot). Its delay is shorter than `drop`'s, so the card never covers it.
5. `drop` at .16: the halo drops open to the full card with a soft bounce.
6. `iv` at .34: the icon pops from 40 % scale with overshoot and sharpens. There is no rotation.
7. `wm` at .36: the watermark settles in, scale 1.12 → 1, opacity to 0.75.
8. `txt` at .40: **words** rise in one by one. Let e = 1 − txt, n = 4 words, step = 0.13, span = 1 − step·(n − 1). For word i, p = clamp((e − i·step)/span) and q = 1 − p. Style: opacity clamp(1.3p), blur 4q px, translateY 9q.
9. `nn` at .50 and `sb` at .57: each **pill forms**. Let e = 1 − channel.
   - Surface: opacity clamp(1.8e), scale(lerp(.72, 1, e), lerp(.6, 1, e)). Use unclamped e, so its overshoot shows.
   - Label: l = clamp((e − .35)/.65). Opacity l, blur 3(1 − l) px, translateY 5(1 − l).
   - Tappable when e > 0.5.

### 6.2 Shimmer (entrance only, once)
The shimmer starts 0.80 s after the entrance begins and lasts 1.5 s (both scale with response). Let p go from 0 to 1 over the duration:
- Position: x = lerp(−160, W + 174, easeOutCubic(p)), in container coordinates.
- Envelope: env = sin(πp)^1.2.
- **Rim:** a 1.5 pt border-only ring on the card, following the card radius. Its fill is a radial ellipse (200 × 150) centred at (x, 35 %), with stops rgba(92,134,255,.95) 0 % → rgba(150,120,255,.55) 38 % → transparent 72 %. Opacity = env.
- **Tint:** a radial ellipse (220 × 170) centred at (x, 40 %) inside the card, behind the content. Stops rgba(98,138,255,.13) → rgba(140,120,255,.06) 45 % → transparent 72 %. Opacity = env.
- **Glint on Switch:** a 34 pt skewed (−20°) band of rgba(255,255,255,.28), clipped to the Switch pill. It is positioned at x relative to the pill. Opacity = env · clamp(1 − |x − switchCentreX| / 140).
- Never render it above the copy. Skip it if reduced motion is on or the stagger is disabled.

## 7. Scroll trigger
Scrolling does **not** scrub the animation; it triggers the springs.
- The header stays pinned. When `scrollY > 48`, go to B.
- In B, when `scrollY < min(48·0.35, 16)`, go to A. This hysteresis stops flicker around the line.
- **Settle back to top:** if the user releases (drag end, then momentum end) with 0 < scrollY ≤ 48 while in A, animate the scroll to 0.
- Content below uses the `lay` translation, the same as in toggle transitions.
- In C, scrolling does nothing.

## 8. Platform notes
- **Reanimated:**
  - Use one `useSharedValue` per channel and run `geom()` inside `useAnimatedStyle`. The path LUT can be precomputed on the JS thread and passed in as a plain array, or rebuilt in a worklet.
  - Mark `motion-core.ts` functions as `'worklet'` if you call them on the UI thread.
  - For delays, use `withDelay(d, withSpring(target, cfg))`. Starting a new `withSpring` inherits the current velocity.
- **Blur on native:** if blur isn't cheaply available (for example, no Skia), drop the blur terms and keep opacity, translate and scale. Don't fake blur with extra layers.
- **Shimmer on native:** build the rim and tint with react-native-svg radial gradients (the rim as a stroked rounded rect with a radial-gradient stroke), or with Skia.
- **Web:** use the CSS `mask-composite: exclude` ring for the rim, as in the prototype.

## 9. Acceptance checks
1. The icon's bounding box never intersects the search field during any transition, including interruptions (for example, collapse then expand at 0.25 s). Minimum clearance is at least 2 pt at 0.52 / 0.90.
2. During the entrance, the icon's bounding box stays inside the card while iv > 0.25.
3. The content below never overshoots (`lay` is critically damped).
4. Toggling mid-flight reverses smoothly with preserved velocity. There are no jumps.
5. Reduced motion: every transition snaps, with no shimmer.
6. Visual parity: at rest, A, B and C match the Figma frames pixel for pixel. Motion must not change resting styles.
7. Side by side with `reference/prototype.html` at 0.25×, the order and overlap of beats match §6.
