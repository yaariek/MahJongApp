# `src/core` — framework-free domain logic

Everything in this folder is **plain TypeScript**. It must never import from
`react`, `react-native`, `expo-*`, or anything that touches a screen or a
device API. That rule is what lets Vitest run it in milliseconds with no
simulator, and what would let this code be lifted onto a server later.

- `tiles/` — the tile vocabulary (the ~42 Taiwanese tile faces) and helpers.
- `scoring/` — turn a finished hand + context into 番 and into who-pays-whom
  transfers. The crown jewel; keep its test suite large.
- `game-state/` — seat winds, dealer / round-wind rotation, running balances.

UI code lives in `src/app` and `src/components` and imports _from_ here, never
the other way around.
