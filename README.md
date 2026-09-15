# MahJongApp 🀄

A mobile app for **HK-flavoured Taiwanese mahjong** (16-tile, additive 番 scoring):
enter — and later photograph — a winning hand (食糊), auto-compute the 番, track
seats and dealer/round rotation, and settle who pays whom.

## Current phase: Phase 1 — Manual calculator + seat tracker 🚧

| Phase | Scope                                                                     | Status          |
| ----- | ------------------------------------------------------------------------- | --------------- |
| 0     | Setup: Expo SDK 57, TypeScript, Vitest, ESLint/Prettier, Drizzle          | ✅ done         |
| **1** | **Tile-picker calculator, seat/rotation tracker, settlement, 找數 sheet** | **in progress** |
| 2     | Photo scoring via a vision-model (VLM) proxy                              | planned         |
| 3     | On-device tile recognition (YOLO detector + CNN classifier)               | planned         |
| 4     | Cloud sync & accounts (Supabase)                                          | planned         |
| 5     | Tutorial + searchable 番 table                                            | planned         |

### Phase 1 progress

- [x] Tile vocabulary — 42 faces incl. flowers (`src/core/tiles`)
- [x] Hand parser — every 5 sets + pair layout, 暗/明 aware (`src/core/scoring/parse.ts`)
- [x] Pattern evaluators for the house 番 table ([`FAN-TABLE.md`](src/core/scoring/FAN-TABLE.md))
- [x] Settlement — `底 + 番總 × 番底` → who pays whom (`src/core/scoring/settlement.ts`)
- [x] Dealer / round-wind / 連莊 rotation state machine (`src/core/game-state`)
- [x] Manual 計番 scoring calculator screen (`src/app/index.tsx`)
- [ ] Game screen — 4 seats, record-hand flow, running balances
- [ ] SQLite persistence (Drizzle) + game history
- [ ] End-of-game 找數 summary with "已找 / mark paid" tracking
- [ ] Optional "attach photo" on record-hand (seeds the Phase 3 training set)

## Getting started

```bash
npm install
npm start          # Expo dev server — scan the QR code with Expo Go
```

If your phone can't reach the dev server, use `npm start -- --tunnel`.

## Commands

| Command                                   | What it does                    |
| ----------------------------------------- | ------------------------------- |
| `npm start`                               | Expo dev server                 |
| `npm test` / `npm run test:watch`         | Vitest — `src/core` + `src/lib` |
| `npm run typecheck`                       | `tsc --noEmit`                  |
| `npm run lint`                            | ESLint (`eslint-config-expo`)   |
| `npm run format` / `npm run format:check` | Prettier                        |

## Project layout

```
src/core/        pure TypeScript domain logic — tiles, scoring, game-state (no React/Expo)
src/lib/         framework-free helpers bridging core ↔ UI (draft state, hand builder, glyphs)
src/app/         screens (Expo Router file routes)
src/components/  UI building blocks (scoring/ holds the calculator widgets)
src/hooks/, src/constants/
```

`src/core` and `src/lib` must never import React, React Native or `expo-*`, so the
whole scoring engine is unit-tested with Vitest and could run on a server later.

## Scoring model

Each losing player pays **`底 + 番總`** (× optional `番底`, default 1), where `番總` =
hand 番 + any 連莊/拉莊 番. No HK doubling. House rules (放銃一家付, 莊家加倍, 花槓,
詐胡 penalties, draw-keeps-dealer, rounds per game) are configurable.
