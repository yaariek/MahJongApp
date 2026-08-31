import type { PlayingTileId } from '../tiles/tiles';
import type { Hand, HandContext, ScoreResult } from './types';
import { EVALUATORS } from './evaluators';
import { parseHand, type HandPartition } from './parse';

export * from './types';
export * from './settlement';
export * from './parse';

/**
 * Won-by-discard downgrade: the set completed by `winningTile` becomes 明,
 * because the tile that finished it came from an opponent — so a triplet there
 * is 明刻, not 暗刻. Only applied when the win is not 自摸.
 *
 * Known limitation: if `winningTile` sits in both a triplet and a sequence, we
 * downgrade the first concealed set that contains it (the triplet, given canonical
 * order). Revisit with a fixture if a real hand needs the other reading.
 */
function applyDiscardDowngrade(
  partition: HandPartition,
  winningTile: PlayingTileId,
): HandPartition {
  const idx = partition.sets.findIndex((s) => s.concealed && s.tiles.includes(winningTile));
  if (idx === -1) return partition;
  return {
    ...partition,
    sets: partition.sets.map((s, i) => (i === idx ? { ...s, concealed: false } : s)),
  };
}

/**
 * Score a finished hand into 番.
 *
 * Pipeline:
 *   1. parse — decompose into every valid 5-sets-+-pair layout
 *   2. downgrade — mark the discard-completed set 明 (unless 自摸)
 *   3. evaluate — run every 番 evaluator against each layout
 *   4. score — keep the layout with the highest 番總
 *
 * SKELETON: only a handful of patterns exist so far and their 番 values are
 * placeholders (see evaluators.ts). Grow EVALUATORS one fixture at a time.
 */
export function scoreHand(hand: Hand, context: HandContext): ScoreResult {
  const partitions = parseHand(hand);
  if (partitions.length === 0) {
    throw new Error('scoreHand: tiles do not form a valid 5 melds + 1 pair');
  }

  let best: ScoreResult = { lines: [], fanTotal: -1 };
  for (const parsed of partitions) {
    const partition = context.selfDraw ? parsed : applyDiscardDowngrade(parsed, hand.winningTile);
    const lines = EVALUATORS.flatMap((evaluate) => {
      const line = evaluate(partition, context);
      return line == null ? [] : Array.isArray(line) ? line : [line];
    });
    const fanTotal = lines.reduce((sum, line) => sum + line.fan, 0);
    if (fanTotal > best.fanTotal) best = { lines, fanTotal };
  }
  return best;
}
