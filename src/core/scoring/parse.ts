/**
 * Hand parser — decompose a hand into every valid `5 sets + 1 pair` layout.
 *
 * Taiwanese 16-tile: a winning hand is 5 sets (刻/順/槓) + 1 pair (對) = 17 tiles.
 * Exposed melds (吃/碰/槓) are already-formed sets, so we only need to partition
 * the concealed tiles + the winning tile into the *remaining* sets and the pair.
 *
 * `parseHand` returns one `HandPartition` per distinct decomposition — a hand
 * like 1112345678999 has several, and the scorer picks the highest-scoring one.
 *
 * Each `ParsedSet` carries a `concealed` flag (暗 vs 明): sets the parser finds
 * in the concealed tiles are 暗; exposed melds are 明 (an 暗槓 stays 暗). The
 * "won by discard" downgrade — the set completed by an opponent's tile becomes
 * 明 — is applied later, per-partition, in `scoreHand`.
 *
 * Pure: no framework imports.
 */

import type { PlayingTileId } from '../tiles/tiles';
import { PLAYING_TILES, rankOf, suitOf } from '../tiles/tiles';
import type { Hand, Meld } from './types';

export type ParsedSetKind = 'pair' | 'pon' | 'chi' | 'kan';

export interface ParsedSet {
  kind: ParsedSetKind;
  tiles: PlayingTileId[];
  /** 暗 (formed in hand / self-drawn) vs 明 (claimed, or completed by a discard
   *  we won on). Pairs are always concealed. */
  concealed: boolean;
}

export interface HandPartition {
  pair: ParsedSet;
  /** Every non-pair set: the sets the parser found in the concealed tiles,
   *  followed by the exposed melds. Evaluators read this one uniform list. */
  sets: ParsedSet[];
  /** The raw exposed melds, kept for checks like "is the hand 門清?". */
  melds: Meld[];
}

type Counts = Map<PlayingTileId, number>;

const get = (c: Counts, t: PlayingTileId) => c.get(t) ?? 0;
const add = (c: Counts, t: PlayingTileId, delta: number) => c.set(t, get(c, t) + delta);

const toCounts = (tiles: PlayingTileId[]): Counts => {
  const c: Counts = new Map();
  for (const t of tiles) add(c, t, 1);
  return c;
};

/** Remaining tiles, in canonical order (萬 → 筒 → 條 → 風 → 箭). */
const remaining = (c: Counts): PlayingTileId[] => PLAYING_TILES.filter((t) => get(c, t) > 0);

/** An exposed meld as a `ParsedSet`. Only an 暗槓 counts as concealed. */
const meldToParsedSet = (m: Meld): ParsedSet => ({
  kind: m.kind,
  tiles: m.tiles,
  concealed: m.kind === 'kan' ? m.concealed === true : false,
});

/**
 * Recursively pull `needed` sets (刻 or 順) out of `c`. Always consumes the
 * lowest remaining tile first, so each decomposition is produced exactly once.
 * Mutates `c` in place but always restores it before returning.
 */
function extractSets(c: Counts, needed: number): ParsedSet[][] {
  if (needed === 0) return remaining(c).length === 0 ? [[]] : [];

  const lowest = remaining(c)[0];
  if (lowest === undefined) return [];

  const solutions: ParsedSet[][] = [];

  // 刻 — triplet of the lowest tile
  if (get(c, lowest) >= 3) {
    add(c, lowest, -3);
    for (const rest of extractSets(c, needed - 1)) {
      solutions.push([{ kind: 'pon', tiles: [lowest, lowest, lowest], concealed: true }, ...rest]);
    }
    add(c, lowest, 3);
  }

  // 順 — run starting at the lowest tile
  const suit = suitOf(lowest);
  const rank = rankOf(lowest);
  if (suit !== null && rank !== null && rank <= 7) {
    const b = `${suit}${rank + 1}` as PlayingTileId;
    const d = `${suit}${rank + 2}` as PlayingTileId;
    if (get(c, b) > 0 && get(c, d) > 0) {
      add(c, lowest, -1);
      add(c, b, -1);
      add(c, d, -1);
      for (const rest of extractSets(c, needed - 1)) {
        solutions.push([{ kind: 'chi', tiles: [lowest, b, d], concealed: true }, ...rest]);
      }
      add(c, lowest, 1);
      add(c, b, 1);
      add(c, d, 1);
    }
  }

  return solutions;
}

export function parseHand(hand: Hand): HandPartition[] {
  const tiles = [...hand.concealed, hand.winningTile];
  const neededSets = 5 - hand.melds.length;
  if (neededSets < 0) return [];
  if (tiles.length !== neededSets * 3 + 2) return [];

  const meldSets = hand.melds.map(meldToParsedSet);
  const counts = toCounts(tiles);
  const partitions: HandPartition[] = [];

  for (const tile of remaining(counts)) {
    if (get(counts, tile) < 2) continue;
    add(counts, tile, -2);
    for (const sets of extractSets(counts, neededSets)) {
      partitions.push({
        pair: { kind: 'pair', tiles: [tile, tile], concealed: true },
        sets: [...sets, ...meldSets],
        melds: hand.melds,
      });
    }
    add(counts, tile, 2);
  }

  return partitions;
}
