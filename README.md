# Language switch nudge · v5

Prototype of noon's app-language nudge, iteration 5 — Figma
`JovVwactrtpNkNSPfu4tsm`, page `528:2` "Iteration 5 - 25 Sep".

Two phones, each offering the other language:

| Lane | Starts on | Offers |
| --- | --- | --- |
| English app → Arabic (A1 / A2) | Home → an Arabic search | العربية |
| Arabic app → English (B1 / B2) | Arabic results for an English search | English |

One switcher picks how the switch is confirmed, for both lanes:

| Key | Confirm | Figma |
| --- | --- | --- |
| 1 | Sheet · option 1 — copy, the way-back icon path, Not now + switch | 530:27774 |
| 2 | Sheet · option 2 — the Account page illustration, one switch button | 530:28151 |
| 3 | Instant switch + undo toast (4 s) | A2 / B2, 528:26667 |

The banner (528:26664) forms its button in the app's language and turns it
into the offered one (535:4693). Motion is the approved tooltip motion — the
arrival, the fold into the bar on scroll and back on the way up, ✕ — mirrored
for the Arabic app; the splash is the rebrand Hala ⇄ هلا morph, reversed for
the way back to English.

```
npm install
npm run dev        # http://localhost:5193
```

- `?confirm=sheet2` / `?confirm=instant` — open on a confirm style
- `?device=en` / `?device=ar` — one bare 375 × 812 phone to present from (R restarts)
- `?solo=ar&beat=sheet` — park a phone on a beat (home, search, offered, sheet,
  transition, skeleton, switched, toast)
