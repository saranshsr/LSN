# Where the frames and the decisions disagree

Read from the Figma section `278:110006` on 23 Sep 2026, against the decisions
logged on 17, 18 and 21 Sep. The prototype mirrors the **frames**; this is the
list of things that would change if it mirrored the **decisions** instead.

## Copy

1. **Nothing is bilingual.** The inline nudge (`Switch app to Arabic?`) and the
   sheet are English-only. The 21 Sep review settled that bilingual is
   mandatory — not line-by-line duplication, but an Arabic-only reader must be
   able to act. As drawn, they cannot. This is the biggest gap.
2. **The sheet body reads as truncated** — “…you can always switch back from the
   **Account**” stops before naming the path. The ask was to name
   *Account → Language* explicitly.
3. **The sheet icon is the shipped DS glyph**, not the “single phrase being
   translated” illustration described on 21 Sep.

## Interaction

4. **The CTA hierarchy was meant to soften.** `Switch` is still a solid dark
   pill sitting directly against `Not now`. The ask was to reduce its boldness
   and separate the dismiss control from the button.
5. **There is no dismiss cross.** The hotspot is named
   *“Dismiss ✕ (session suppression)”* but the frame draws a `Not now` pill.
   Layer names and pixels disagree.
6. **Swipe-past is not represented.** Three pathways were locked — act, dismiss,
   and ignore at zero cost. The scroll-collapse arguably *is* the third, which
   is worth saying out loud in the review rather than leaving implicit.
7. **Dead `Undo (تراجع)` hotspot** on the RTL frame at y667, with no toast above
   it. Left over from the killed toast.
8. **Hotspot labels are stale** (`→ 1.4`, `→ 1.3`, from the old numbering), so
   the frames do not state whether the glyph routes through the sheet or
   straight to the switch. The prototype routes it **through the sheet**, since
   confirmation-always is a locked decision.

## Content

9. **The RTL frame localises the product titles.** The 21 Sep note says search
   results stay English until a manual switch. Mirrored as drawn — worth
   confirming it is deliberate.

## Missing

10. **No tooltip frame.** Two layouts survived the cut; only inline is drawn.
    The tooltip lane in the prototype is a derivation, not a mirror.

## Found while matching the frames pixel by pixel

11. **The switched Arabic screen now has no way back to English.** Component
    `278:68265` was updated on 23 Sep to remove the language glyph from the RTL
    search bar — it is now camera · divider · query · chevron. Every other
    screen carries the glyph as a persistent entry point, and the 17 Sep
    benchmarking landed on "build the way out before the way in". As drawn,
    the exit exists only in Account settings. Mirrored as-is; worth a decision.
12. **The RTL cards are spaced ~10px tighter** than the LTR cards they were
    copied from — a side effect of detaching for the mirror, not a decision.
13. **Two dark inks are in play for the Mega Deal strip**: the LTR frame uses
    `surface/primary-inverted` (#101628), which is what the prototype uses.
14. **Row 2 of the results grid uses an 8px gutter**, the same as the column
    gutter — worth confirming, since 8 between rows reads tight next to the
    12px page inset.

15. **Status bar.** Taken as-is from the frame's own component: Figma's vector
    paths for cellular / wifi / battery, positioned from a 3× export. The clock
    uses the OS font, since that is what the real status bar renders.
