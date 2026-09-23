# Language nudge — motion handoff

**Claude Code: start here.** This folder specifies the motion for the search-bar language nudge ("Switch app to Arabic?"). The visual component already exists in the codebase, built from Figma. Your job is to add the motion to that component **without changing its visual design**.

## What's in the folder
| File | What it is |
|---|---|
| `SPEC.md` | The source of truth: states, choreography, springs, derived geometry, and acceptance checks. |
| `motion-tokens.json` | The same numbers in machine-readable form: springs (response/damping plus stiffness/damping/mass), delays, geometry ratios and colours. |
| `motion-core.ts` | Framework-agnostic TypeScript: spring configs, state targets, plans, the icon path (arc-length Bézier) and the per-frame geometry function. Import it or port it. |
| `reference/prototype.html` | The approved interactive prototype. Open it in a browser to compare against your build. Its defaults are the approved values (response 0.52, damping 0.90). |

## Task for Claude Code
1. **Find the component.** Locate the existing nudge / search-header component (Figma-wired). Map its layers to the roles in `SPEC.md §2`: container card, search field, translate icon, prompt text, "Not now", "Switch", watermark and collapsed button. If a role is ambiguous, or the component lacks it (for example, the collapsed button exists only as a separate Figma frame), ask before restructuring.
2. **Keep the design as-is.** Don't change colours, type, radii, spacing or tokens. Read every size from the component's real layout (measure at runtime). Don't hard-code the prototype's pixel values. `SPEC.md §3` gives every geometry value as a derivation from the layout.
3. **Use the project's animation stack.** Detect what the project already uses. On React Native, use Reanimated: one shared value per channel, `withDelay` + `withSpring`, and `useAnimatedStyle` computing the geometry. On the web, use Framer Motion or plain rAF springs. On iOS, use SwiftUI `.spring(response:dampingFraction:)`. Don't add a new animation library if one is already present.
4. **Build all four transitions plus the entrance.** Implement Nudge ↔ Collapsed, Nudge → Dismissed, Collapsed → Dismissed, Dismissed → Collapsed, and the entrance (Dismissed → Nudge). Also add the scroll trigger (`SPEC.md §7`).
5. **Make it interruptible.** Retarget running springs and keep their velocity. Never restart from zero.
6. **Respect reduced motion.** With reduced motion on, snap to the end states with no springs, stagger or shimmer.
7. **Verify against the acceptance checks** in `SPEC.md §9`, and compare side by side with `reference/prototype.html` at 0.25× speed.

The approved spring is **response 0.52 s, damping fraction 0.90**. Every channel's spring is a fixed multiple of it (`SPEC.md §5`), so changing it in one place should retune everything.
