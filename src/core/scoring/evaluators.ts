/**
 * 番 pattern evaluators — one pure function per pattern.
 *
 * Each evaluator inspects a single `HandPartition` (+ context) and returns a
 * scored `FanLine` if the pattern applies, or `null` if it doesn't. `scoreHand`
 * runs all of them against every partition and keeps the highest-scoring set.
 *
 * `p.sets` is the uniform list of every non-pair set (concealed sets the parser
 * found + exposed melds); `p.melds` is just the exposed ones. A set's
 * `concealed` flag is 暗 vs 明 — already adjusted by `scoreHand` for a
 * won-by-discard downgrade.
 *
 * Naming: pattern functions and their display `name` use HK-Taiwanese terms
 * (對對糊, not 碰碰胡; 糊, not 胡). Each identifier is the Jyutping romanisation
 * of its own displayed term; plain helpers stay in English.
 *
 * The `fan` numbers here must match `FAN-TABLE.md` (the house 計番表). Most rows
 * in that table are still unimplemented — the file marks each one ready / needs
 * wait / needs flags / special hand. Add them one fixture at a time.
 */

import { isHonor, rankOf, suitOf } from '../tiles/tiles';
import type { DragonTileId, Suit, WindTileId } from '../tiles/tiles';
import type { Wind } from '../game-state/rotation';
import type { HandPartition, ParsedSet } from './parse';
import type { FanLine, HandContext } from './types';

/** An evaluator may score more than one line for the same partition (e.g. one
 *  番子刻 line per honor 刻), or `null` when the pattern does not apply. */
export type Evaluator = (p: HandPartition, ctx: HandContext) => FanLine | FanLine[] | null;

const isConcealed = (p: HandPartition) => p.melds.length === 0;

const allSequences = (p: HandPartition) => p.sets.every((s) => s.kind === 'chi');

const allTriplets = (p: HandPartition) => p.sets.every((s) => s.kind === 'pon' || s.kind === 'kan');

const triplets = (p: HandPartition) => p.sets.filter((s) => s.kind === 'pon' || s.kind === 'kan');
const sequences = (p: HandPartition) => p.sets.filter((s) => s.kind === 'chi');

/** Every tile in the partition — all five sets plus the pair. */
const allTiles = (p: HandPartition) => [...p.sets.flatMap((s) => s.tiles), ...p.pair.tiles];

const isDragonTile = (t: string) => t === 'dR' || t === 'dG' || t === 'dW';
const isWindTile = (t: string) => t[0] === 'w';

/** 暗刻/暗槓 count — triplets/kans that are still 暗 after the discard downgrade. */
const concealedTripletCount = (p: HandPartition) =>
  p.sets.filter((s) => (s.kind === 'pon' || s.kind === 'kan') && s.concealed).length;

// 平糊 — every set a sequence, pair a plain (non-honor) tile
const pingWu: Evaluator = (p) =>
  allSequences(p) && !isHonor(p.pair.tiles[0]) ? { name: '平糊', fan: 3 } : null;

// 對對糊 — every set a triplet / kan
const deoiDeoiWu: Evaluator = (p) => (allTriplets(p) ? { name: '對對糊', fan: 30 } : null);

// 混一色 / 清一色 — one suit only. 清一色 if there are no honors, 混一色 if the
// hand mixes that single suit with 字牌. (A pure all-honor hand scores neither.)
const wuJatSik: Evaluator = (p) => {
  const suits = new Set<Suit>();
  let hasHonor = false;
  for (const t of allTiles(p)) {
    const s = suitOf(t);
    if (s === null) hasHonor = true;
    else suits.add(s);
  }
  if (suits.size !== 1) return null;
  return hasHonor ? { name: '混一色', fan: 30 } : { name: '清一色', fan: 80 };
};

// 三元 — 小三元: two 龍牌 刻/槓 + the pair is the third 龍. 大三元: all three as 刻.
const saamJyun: Evaluator = (p) => {
  const dragonKe = triplets(p).filter((s) => isDragonTile(s.tiles[0])).length;
  if (dragonKe === 3) return { name: '大三元', fan: 40 };
  if (dragonKe === 2 && isDragonTile(p.pair.tiles[0])) return { name: '小三元', fan: 20 };
  return null;
};

// 四喜 — by wind 刻/槓 count. 大四喜: four. 小四喜: three + a wind pair. 大三風:
// three + a non-wind pair. 小三風: two + a wind pair.
const seiHei: Evaluator = (p) => {
  const windKe = triplets(p).filter((s) => isWindTile(s.tiles[0])).length;
  const windPair = isWindTile(p.pair.tiles[0]);
  if (windKe === 4) return { name: '大四喜', fan: 80 };
  if (windKe === 3) return windPair ? { name: '小四喜', fan: 60 } : { name: '大三風', fan: 30 };
  if (windKe === 2 && windPair) return { name: '小三風', fan: 15 };
  return null;
};

// 二/三/四/五暗刻 — mutually exclusive, only the highest tier fires.
const amHak: Evaluator = (p) => {
  const n = concealedTripletCount(p);
  if (n >= 5) return { name: '五暗刻', fan: 80 };
  if (n === 4) return { name: '四暗刻', fan: 30 };
  if (n === 3) return { name: '三暗刻', fan: 10 };
  if (n === 2) return { name: '二暗刻', fan: 3 };
  return null;
};

const WIND_TILE: Record<Wind, WindTileId> = { E: 'wE', S: 'wS', W: 'wW', N: 'wN' };
const DRAGON_KE_NAME: Record<DragonTileId, string> = { dR: '中刻', dG: '發刻', dW: '白刻' };

// 番子刻 — 中/發/白 刻 (+2 each); 圈風刻 / 門風刻 (+2 each); 客風刻 (+1). One line
// per qualifying 刻/槓. A wind 刻 that is BOTH the round wind and the seat wind
// scores 圈風刻 + 門風刻 = 4 (FAN-TABLE.md, open question 1 — confirmed).
const faanZiHak: Evaluator = (p, ctx) => {
  const roundTile = WIND_TILE[ctx.roundWind];
  const seatTile = WIND_TILE[ctx.seatWind];
  const lines: FanLine[] = [];
  for (const s of p.sets) {
    if (s.kind !== 'pon' && s.kind !== 'kan') continue;
    const t = s.tiles[0];
    if (t === 'dR' || t === 'dG' || t === 'dW') {
      lines.push({ name: DRAGON_KE_NAME[t], fan: 2 });
    } else if (t[0] === 'w') {
      const isRound = t === roundTile;
      const isSeat = t === seatTile;
      if (isRound) lines.push({ name: '圈風刻', fan: 2 });
      if (isSeat) lines.push({ name: '門風刻', fan: 2 });
      if (!isRound && !isSeat) lines.push({ name: '客風刻', fan: 1 });
    }
  }
  return lines.length > 0 ? lines : null;
};

// 門前清 — fully concealed, won on a discard
const munCinCing: Evaluator = (p, ctx) =>
  isConcealed(p) && !ctx.selfDraw ? { name: '門前清', fan: 3 } : null;

// 不求人 — fully concealed + self-draw (replaces 門前清 + 自摸)
const batKauJan: Evaluator = (p, ctx) =>
  isConcealed(p) && ctx.selfDraw ? { name: '不求人', fan: 5 } : null;

// 自摸 — self-draw with at least one exposed meld
const ziMo: Evaluator = (p, ctx) =>
  !isConcealed(p) && ctx.selfDraw ? { name: '自摸', fan: 1 } : null;

// 連N拉N — dealer on an N-hand streak
const linZong: Evaluator = (_p, ctx) =>
  ctx.linZong > 0 ? { name: `連${ctx.linZong}拉${ctx.linZong}`, fan: 2 * ctx.linZong + 1 } : null;

export const EVALUATORS: Evaluator[] = [
  pingWu,
  deoiDeoiWu,
  wuJatSik,
  saamJyun,
  seiHei,
  amHak,
  faanZiHak,
  munCinCing,
  batKauJan,
  ziMo,
  linZong,
];
