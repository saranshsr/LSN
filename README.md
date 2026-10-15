# Language switch nudge · v5

Prototype of noon's app-language nudge, iteration 5 — Figma
`JovVwactrtpNkNSPfu4tsm`, page `528:2` "Iteration 5 - 25 Sep".

Pick a flow; each shows its two versions side by side — with the sheet, and the
instant switch with undo. Two more toggles pick the sheet (keys 1 / 2 / 3) and
how the nudge's text teaches the offered language.

| Flow | Versions | Starts on |
| --- | --- | --- |
| English → Arabic | A1 · A2 | the Eid home, English app |
| Arabic → English | B1 · B2 | the Eid home, Arabic app |
| super mall | SM1 · SM2 | super mall's home, English app |

Homes and super mall's product grids are Figma's own renders, with the status
bar, bottom nav and search bar live on top. The banner, sheets, toast, search,
noon's results and all motion are code.

```
npm install
npm run dev        # http://localhost:5193
```

- `?flow=ar` / `?flow=sm` — open on a flow
- `?sheet=illustrated` / `?sheet=compact` — the other sheets (Minimal, 805:26233, is the default)
- `?text=whole` / `?text=flip` — the other text styles (Button only is the default)
- `?device=en|ar|sm&confirm=sheet1|sheet2|sheet3|instant` — one bare phone to present from (R restarts)
- `?solo=sm&beat=sheet` — park a phone on a beat

The page header and its toggles (flows, sheets, text) are in `src/App.tsx` —
the `FLOWS`, `SHEETS` and `TEXTS` lists and the `.v5-bar` markup; their styles
are the `.v5-bar` / `.seg` rules in `src/styles/app.css`.

Deployed by hand with the Vercel CLI (`vercel deploy --prod`); pushing does not deploy.
