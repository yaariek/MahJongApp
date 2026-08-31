# Getting started

## What's already set up

- **Expo SDK 57** app (TypeScript, Expo Router). Demo screens still live in
  `src/app/` — you'll replace them.
- **Vitest** wired to `src/core/**/*.test.ts` — `npm test` (19 tests passing).
- **ESLint + Prettier** configured and clean.
- **expo-sqlite + Drizzle ORM** installed (not wired to a database yet).
- `src/core/` domain layer started:
  - `tiles/` — the 42 tile faces + helpers (done, tested)
  - `game-state/rotation.ts` — dealer / round-wind / 連莊 state machine (done, tested)
  - `scoring/settlement.ts` — `底 + 番總` → transfers (done, tested)
  - `scoring/index.ts` — `scoreHand()` is a **stub that throws**; this is your first real task

## One-time: run the app on your phone

1. Install **Expo Go** from the App Store / Play Store.
2. In this folder: `npm start`
3. Scan the QR code (iOS: Camera app; Android: the Expo Go app).
4. You should see the template's tab screens. Edit `src/app/index.tsx` and save —
   it hot-reloads.

If the phone can't connect, run `npm start -- --tunnel`.

## Your first task: the scoring engine

`scoreHand(hand, context)` in `src/core/scoring/index.ts` throws today. Build it
**test-first**:

1. Create `src/core/scoring/scoreHand.test.ts`.
2. Write one `it(...)` for the simplest win you know the 番 of — e.g. a plain
   平糊 by discard, non-dealer, no flowers → whatever 番 your group scores it.
3. Run `npm run test:watch`. It fails.
4. Implement just enough to pass: start with the **hand parser** (decompose
   `concealed + winningTile` into every valid `5 melds + 1 pair` layout), then a
   couple of **pattern evaluators** (`平糊`, `對對糊`, `門前清`, `自摸`…), then sum.
5. Add the next fixture. Repeat. Every disputed ruling in real games becomes a
   new fixture.

Reference decompositions: any open-source _Japanese_ mahjong scorer's hand
parser is a fine starting point — Taiwanese is simpler (no fu, pure additive 番),
just 16 tiles instead of 13.

## Then: wire the UI (Phase 1)

- Replace `src/app/` with: a **new game** screen (pick 4 players, seats), a
  **record hand** screen (tile picker grid → `Hand` + `HandContext`), a
  **game** screen (4 seats, running balances), and an **end-of-game 找數**
  screen with the "已找 / mark paid" toggle.
- Add the SQLite layer with Drizzle: tables `players`, `games`, `game_players`,
  `hands`, `rule_presets`, `settlement_payments` (see the plan). Give every row
  a UUID and `created_at` / `updated_at` so Phase 4 sync is mechanical.
- Don't add the camera yet — that's Phase 2. But _do_ add an optional
  "attach photo" button on the record-hand screen now, storing a 512px image,
  so the training set starts growing early.

## Handy

| Command                           |                   |
| --------------------------------- | ----------------- |
| `npm start`                       | Expo dev server   |
| `npm test` / `npm run test:watch` | domain tests      |
| `npm run typecheck`               | `tsc --noEmit`    |
| `npm run lint` / `npm run format` | ESLint / Prettier |

Full plan: `.claude/plans/so-i-have-resilient-umbrella.md`
Project rules for AI help: `CLAUDE.md`
