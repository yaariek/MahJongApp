@AGENTS.md

# MahJongApp

A mobile app for **HK-flavoured Taiwanese mahjong**: photograph a winning hand
(食糊) and auto-compute the 番, track seats and dealer/round rotation, and settle
who pays whom.

Full design + phased roadmap: `.claude/plans/so-i-have-resilient-umbrella.md`.

## Stack

- **Expo SDK 57** + Expo Router (file routes under `src/app/`), React Native 0.86, React 19, TypeScript.
- **Vitest** for domain-logic tests. **ESLint** (`eslint-config-expo` + Prettier compat) + **Prettier**.
- **SQLite** via `expo-sqlite` + **Drizzle ORM** (installed; DB layer not wired yet).
- Later phases: a serverless VLM proxy, then an on-device YOLO + CNN model, then Supabase for sync.

## Architecture rule (important)

```
src/core/     ← pure TypeScript domain logic. NO react / react-native / expo-* imports.
src/lib/      ← pure framework-free helpers bridging core ↔ UI (draft state, hand
                builder, tile→glyph). May import src/core; NO react/react-native/expo.
src/app/      ← screens (Expo Router). Imports from src/core & src/lib, never the reverse.
src/components/, src/hooks/, src/constants/  ← UI building blocks.
```

`src/core` is the crown jewel and must stay framework-free so Vitest can run it
with no simulator and so it could move to a server later. `src/lib` follows the
same no-framework rule so it is unit-tested too. Vitest (`vitest.config.mts`)
looks at `src/core/**/*.test.ts` and `src/lib/**/*.test.ts`.

The first screen (`src/app/index.tsx`, the manual 計番 Scoring Calculator) now
consumes `core/scoring` + `core/tiles` via `src/lib`.

### `src/core` modules

| Module                       | Status       | Purpose                                                                                                                                                                                                             |
| ---------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core/tiles`                 | done         | The 42 Taiwanese tile faces (`m1`..`s9`, `wE`..`dW`, `hp1`..`hs4`) + helpers.                                                                                                                                       |
| `core/game-state`            | done         | `seatWind`, `nextRotation` — dealer/round-wind/連莊 state machine. Pure.                                                                                                                                            |
| `core/scoring/settlement`    | done         | `底 + 番總 × 番底` → `Transfer[]` (放銃一家付 / 自摸 / split).                                                                                                                                                      |
| `core/scoring` (`scoreHand`) | **skeleton** | `parse.ts` (all 5-sets+pair layouts, each set tagged 暗/明) → `scoreHand` won-by-discard downgrade → `evaluators.ts` (7 patterns incl. 三/四/五暗刻, **placeholder 番**) → max-scoring partition. Grow per fixture. |

## Scoring model (decided — do not change without asking)

- Taiwanese **16-tile** structure, **additive** scoring. Each losing player pays
  **`底 + 番總`**, where `番總` = hand 番 + any 連莊/拉莊 番.
- Unit is **displayed as 番** (config label, not 台). Optional per-番 multiplier
  `番底` **defaults to 1**.
- No HK doubling / laap table.
- House rules must be **configurable**, never hardcoded: 放銃一家付, 莊家加倍,
  花槓, 詐胡 penalties, draw-keeps-dealer, rounds per game.

## Commands

```bash
npm start            # Expo dev server (scan QR with Expo Go)
npm test             # vitest run  — src/core + src/lib
npm run test:watch   # vitest watch
npm run typecheck    # tsc --noEmit
npm run lint         # expo lint
npm run format       # prettier --write .
```

## Conventions

- Domain logic is **test-first**: add a failing fixture for a hand whose 番 you
  know, then make it pass. Aim for `src/core` to have more tests than the rest.
- Every settlement fixture asserts the `Transfer[]` and that net-by-seat sums to 0.
- Keep `src/core` import-clean — if you need a UUID or the clock, pass it in as
  an argument rather than importing a device API.
- Prettier owns formatting (single quotes, 100 cols, trailing commas). Don't
  fight it in ESLint.


## Others

Make a git commit after every change for easier code management.
Write of update related testing after every changes, and make sure all the test and verification has passed before handing the finished task to user.