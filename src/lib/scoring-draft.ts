/**
 * The in-progress state of the manual Scoring Calculator screen: a hand being
 * assembled tile-by-tile, its context, and the settlement rules — plus a pure
 * reducer that drives every edit.
 *
 * Pure: no react / react-native / expo imports (Vitest runs this in `node`).
 * May import from src/core.
 *
 * Winning-tile model: the user places ALL their tiles including the one they won
 * on into `concealed`, then marks one (`winningIndex`). `buildHand`
 * (hand-builder.ts) splices that instance back out into `Hand.winningTile` —
 * exactly how `parseHand` recombines them — so the concealed bucket's target is
 * `expectedConcealedCount(meldCount)` = 17 / 14 / 11 / 8 / 5 for 0..4 melds.
 */

import type { FlowerTileId, PlayingTileId, TileId } from '../core/tiles/tiles';
import type { Wind } from '../core/game-state/rotation';

export type Bucket = { kind: 'concealed' } | { kind: 'flowers' } | { kind: 'meld'; index: number };

export type MeldKind = 'chi' | 'pon' | 'kan';

export interface MeldDraft {
  kind: MeldKind;
  tiles: PlayingTileId[];
  /** 暗槓 — only meaningful when `kind === 'kan'`. */
  concealed: boolean;
}

export interface HandDraft {
  /** Concealed tiles in tap order, INCLUDING the winning tile. Never sorted in
   *  place — sort a copy for display. */
  concealed: PlayingTileId[];
  melds: MeldDraft[];
  /** Index into `concealed` of the tile marked as the winning tile. */
  winningIndex: number | null;
  flowers: FlowerTileId[];
  focus: Bucket;
}

export interface ContextDraft {
  selfDraw: boolean;
  isDealer: boolean;
  linZong: number;
  seatWind: Wind;
  roundWind: Wind;
}

export interface RulesDraft {
  /** Raw TextInput text — parsed on Calculate. */
  base: string;
  fanValue: string;
  winnerSeat: number;
  discarderSeat: number;
  splitDiscardPayment: boolean;
}

export interface ScoringDraft {
  hand: HandDraft;
  context: ContextDraft;
  rules: RulesDraft;
}

export const TILE_MAX = 4;
export const FLOWER_MAX = 1;
export const MAX_MELDS = 5;

export function meldCapacity(kind: MeldKind): number {
  return kind === 'kan' ? 4 : 3;
}

/** Tiles the concealed bucket should hold (winning tile included) for a hand
 *  with `meldCount` exposed melds. Mirrors `parseHand`'s length check. */
export function expectedConcealedCount(meldCount: number): number {
  return (5 - meldCount) * 3 + 2;
}

export function initialScoringDraft(): ScoringDraft {
  return {
    hand: {
      concealed: [],
      melds: [],
      winningIndex: null,
      flowers: [],
      focus: { kind: 'concealed' },
    },
    context: {
      selfDraw: false,
      isDealer: false,
      linZong: 0,
      seatWind: 'S',
      roundWind: 'E',
    },
    rules: {
      base: '5',
      fanValue: '1',
      winnerSeat: 0,
      discarderSeat: 1,
      splitDiscardPayment: false,
    },
  };
}

export type ScoringDraftAction =
  | { type: 'ADD_TILE'; tile: PlayingTileId }
  | { type: 'ADD_FLOWER'; tile: FlowerTileId }
  | { type: 'REMOVE_CONCEALED'; index: number }
  | { type: 'REMOVE_FLOWER'; index: number }
  | { type: 'REMOVE_MELD_TILE'; meldIndex: number; tileIndex: number }
  | { type: 'MARK_WINNING'; index: number }
  | { type: 'SET_FOCUS'; bucket: Bucket }
  | { type: 'ADD_MELD' }
  | { type: 'REMOVE_MELD'; index: number }
  | { type: 'SET_MELD_KIND'; index: number; kind: MeldKind }
  | { type: 'SET_MELD_CONCEALED'; index: number; value: boolean }
  | { type: 'SET_CONTEXT'; patch: Partial<ContextDraft> }
  | { type: 'SET_RULES'; patch: Partial<RulesDraft> }
  | { type: 'RESET' };

function withHand(state: ScoringDraft, patch: Partial<HandDraft>): ScoringDraft {
  return { ...state, hand: { ...state.hand, ...patch } };
}

function replaceAt<T>(arr: readonly T[], index: number, value: T): T[] {
  return arr.map((item, i) => (i === index ? value : item));
}

function countUsage(state: ScoringDraft, tile: TileId): number {
  let n = 0;
  for (const t of state.hand.concealed) if (t === tile) n += 1;
  for (const m of state.hand.melds) for (const t of m.tiles) if (t === tile) n += 1;
  for (const t of state.hand.flowers) if (t === tile) n += 1;
  return n;
}

export function scoringDraftReducer(state: ScoringDraft, action: ScoringDraftAction): ScoringDraft {
  switch (action.type) {
    case 'ADD_TILE': {
      if (countUsage(state, action.tile) >= TILE_MAX) return state;
      const { focus } = state.hand;

      if (focus.kind === 'concealed') {
        return withHand(state, { concealed: [...state.hand.concealed, action.tile] });
      }
      if (focus.kind === 'meld') {
        const meld = state.hand.melds[focus.index];
        if (!meld || meld.tiles.length >= meldCapacity(meld.kind)) return state;
        return withHand(state, {
          melds: replaceAt(state.hand.melds, focus.index, {
            ...meld,
            tiles: [...meld.tiles, action.tile],
          }),
        });
      }
      return state; // the flowers bucket ignores playing tiles
    }

    case 'ADD_FLOWER': {
      if (countUsage(state, action.tile) >= FLOWER_MAX) return state;
      return withHand(state, { flowers: [...state.hand.flowers, action.tile] });
    }

    case 'REMOVE_CONCEALED': {
      if (action.index < 0 || action.index >= state.hand.concealed.length) return state;
      const concealed = state.hand.concealed.filter((_, i) => i !== action.index);
      let winningIndex = state.hand.winningIndex;
      if (winningIndex !== null) {
        if (action.index === winningIndex) winningIndex = null;
        else if (action.index < winningIndex) winningIndex -= 1;
      }
      return withHand(state, { concealed, winningIndex });
    }

    case 'REMOVE_FLOWER': {
      if (action.index < 0 || action.index >= state.hand.flowers.length) return state;
      return withHand(state, {
        flowers: state.hand.flowers.filter((_, i) => i !== action.index),
      });
    }

    case 'REMOVE_MELD_TILE': {
      const meld = state.hand.melds[action.meldIndex];
      if (!meld || action.tileIndex < 0 || action.tileIndex >= meld.tiles.length) return state;
      return withHand(state, {
        melds: replaceAt(state.hand.melds, action.meldIndex, {
          ...meld,
          tiles: meld.tiles.filter((_, i) => i !== action.tileIndex),
        }),
      });
    }

    case 'MARK_WINNING': {
      if (action.index < 0 || action.index >= state.hand.concealed.length) return state;
      const winningIndex = state.hand.winningIndex === action.index ? null : action.index;
      return withHand(state, { winningIndex });
    }

    case 'SET_FOCUS':
      return withHand(state, { focus: action.bucket });

    case 'ADD_MELD': {
      if (state.hand.melds.length >= MAX_MELDS) return state;
      const newMeld: MeldDraft = { kind: 'chi', tiles: [], concealed: false };
      const melds = [...state.hand.melds, newMeld];
      const focus: Bucket = { kind: 'meld', index: melds.length - 1 };
      return withHand(state, { melds, focus });
    }

    case 'REMOVE_MELD': {
      if (action.index < 0 || action.index >= state.hand.melds.length) return state;
      const melds = state.hand.melds.filter((_, i) => i !== action.index);
      let focus = state.hand.focus;
      if (focus.kind === 'meld') {
        if (focus.index === action.index) focus = { kind: 'concealed' };
        else if (focus.index > action.index) focus = { kind: 'meld', index: focus.index - 1 };
      }
      return withHand(state, { melds, focus });
    }

    case 'SET_MELD_KIND': {
      const meld = state.hand.melds[action.index];
      if (!meld) return state;
      return withHand(state, {
        melds: replaceAt(state.hand.melds, action.index, {
          ...meld,
          kind: action.kind,
          tiles: meld.tiles.slice(0, meldCapacity(action.kind)),
          concealed: action.kind === 'kan' ? meld.concealed : false,
        }),
      });
    }

    case 'SET_MELD_CONCEALED': {
      const meld = state.hand.melds[action.index];
      if (!meld) return state;
      return withHand(state, {
        melds: replaceAt(state.hand.melds, action.index, { ...meld, concealed: action.value }),
      });
    }

    case 'SET_CONTEXT':
      return { ...state, context: { ...state.context, ...action.patch } };

    case 'SET_RULES': {
      const rules = { ...state.rules, ...action.patch };
      if (rules.discarderSeat === rules.winnerSeat) {
        rules.discarderSeat = (rules.winnerSeat + 1) % 4;
      }
      return { ...state, rules };
    }

    case 'RESET':
      return initialScoringDraft();

    default:
      return state;
  }
}

/** Every tile's count across concealed + melds + flowers — drives the grid caps. */
export function tileUsage(draft: ScoringDraft): Map<TileId, number> {
  const usage = new Map<TileId, number>();
  const bump = (t: TileId) => usage.set(t, (usage.get(t) ?? 0) + 1);
  for (const t of draft.hand.concealed) bump(t);
  for (const m of draft.hand.melds) for (const t of m.tiles) bump(t);
  for (const t of draft.hand.flowers) bump(t);
  return usage;
}

/** Structural gate for the Calculate button (buildHand + scoreHand still validate). */
export function canCalculate(draft: ScoringDraft): boolean {
  const { hand } = draft;
  if (hand.winningIndex === null) return false;
  if (hand.concealed.length !== expectedConcealedCount(hand.melds.length)) return false;
  if (!hand.melds.every((m) => m.tiles.length === meldCapacity(m.kind))) return false;
  const base = Number(draft.rules.base.trim());
  if (!Number.isFinite(base) || base < 0) return false;
  return true;
}
