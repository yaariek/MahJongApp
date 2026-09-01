import { isHonor } from '../tiles/tiles';
import type { PlayingTileId } from '../tiles/tiles';
import type { Wind } from '../game-state/rotation';
import type { FanLine, Hand, HandContext, ScoreResult } from './types';
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

const SEAT_FLOWER_NUM: Record<Wind, number> = { E: 1, S: 2, W: 3, N: 4 };

/**
 * Flower lines + the 無字 / 無花 / 無字花 / 大平糊 ladder — none of which a
 * partition evaluator can see, since they depend on `hand.flowers` and the seat.
 *
 * - 正花: a flower whose number matches the seat (2 番 each).
 * - 爛花: a flower whose number doesn't (1 番 each).
 * - Ladder (top tier only): 大平糊 10 (無字花 + 平糊) → 無字花 5 (no 字, no 花) →
 *   無字 1 (no 字) / 無花 1 (no 花). 大平糊 replaces 平糊 in `finalize`.
 */
function closingLines(
  hand: Hand,
  context: HandContext,
  partition: HandPartition,
  evaluatorLines: FanLine[],
): FanLine[] {
  const lines: FanLine[] = [];

  const seatNum = SEAT_FLOWER_NUM[context.seatWind];
  for (const flower of hand.flowers) {
    const matchesSeat = Number(flower[2]) === seatNum;
    lines.push(matchesSeat ? { name: '正花', fan: 2 } : { name: '爛花', fan: 1 });
  }

  const noFlowers = hand.flowers.length === 0;
  const tiles = [...partition.sets.flatMap((s) => s.tiles), ...partition.pair.tiles];
  const noHonors = tiles.every((t) => !isHonor(t));
  const isPingWu = evaluatorLines.some((l) => l.name === '平糊');

  if (noHonors && noFlowers && isPingWu) lines.push({ name: '大平糊', fan: 10 });
  else if (noHonors && noFlowers) lines.push({ name: '無字花', fan: 5 });
  else if (noHonors) lines.push({ name: '無字', fan: 1 });
  else if (noFlowers) lines.push({ name: '無花', fan: 1 });

  return lines;
}

const isLinZongLine = (l: FanLine) => /^連\d+拉\d+$/.test(l.name);

/**
 * Rules that can only be applied once the whole line-up is known — a pattern
 * that *replaces* others rather than adding to them.
 *
 * - 大平糊 replaces 平糊.
 * - 間間糊 replaces 對對糊 + 不求人.
 * - 雞糊: if the hand's own patterns (everything but 連N拉N) total exactly 1 番,
 *   that becomes 雞糊 10.
 */
function finalize(lines: FanLine[]): FanLine[] {
  let out = lines;

  if (out.some((l) => l.name === '大平糊')) {
    out = out.filter((l) => l.name !== '平糊');
  }
  if (out.some((l) => l.name === '間間糊')) {
    out = out.filter((l) => l.name !== '對對糊' && l.name !== '不求人');
  }

  const linZong = out.filter(isLinZongLine);
  const own = out.filter((l) => !isLinZongLine(l));
  if (own.reduce((sum, l) => sum + l.fan, 0) === 1) {
    out = [{ name: '雞糊', fan: 10 }, ...linZong];
  }

  return out;
}

/**
 * Score a finished hand into 番.
 *
 * Pipeline:
 *   1. parse — decompose into every valid 5-sets-+-pair layout
 *   2. downgrade — mark the discard-completed set 明 (unless 自摸)
 *   3. evaluate — run every 番 evaluator against each layout, keep the best 番總
 *   4. closing lines — flowers + the 無字/無花/無字花/大平糊 ladder
 *   5. finalize — apply the "replace, don't add" rules (大平糊 / 間間糊 / 雞糊)
 */
export function scoreHand(hand: Hand, context: HandContext): ScoreResult {
  const partitions = parseHand(hand);
  if (partitions.length === 0) {
    throw new Error('scoreHand: tiles do not form a valid 5 melds + 1 pair');
  }

  let best = { lines: [] as FanLine[], fanTotal: -1, partition: partitions[0] };
  for (const parsed of partitions) {
    const partition = context.selfDraw ? parsed : applyDiscardDowngrade(parsed, hand.winningTile);
    const lines = EVALUATORS.flatMap((evaluate) => {
      const line = evaluate(partition, context);
      return line == null ? [] : Array.isArray(line) ? line : [line];
    });
    const fanTotal = lines.reduce((sum, line) => sum + line.fan, 0);
    if (fanTotal > best.fanTotal) best = { lines, fanTotal, partition };
  }

  const withClosing = [...best.lines, ...closingLines(hand, context, best.partition, best.lines)];
  const lines = finalize(withClosing);
  return { lines, fanTotal: lines.reduce((sum, l) => sum + l.fan, 0) };
}
