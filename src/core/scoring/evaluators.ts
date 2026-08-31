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
 * ⚠️ The `fan` numbers below are PLACEHOLDERS to get the pipeline under test.
 * Replace each with your play group's agreed value as you add fixtures — that
 * is the whole point of the test-first approach. Add new patterns here
 * (清一色, 混一色, 三元, 四喜, 字一色, 花牌對位, …).
 */

import { isHonor } from '../tiles/tiles';
import type { HandPartition } from './parse';
import type { FanLine, HandContext } from './types';

export type Evaluator = (p: HandPartition, ctx: HandContext) => FanLine | null;

const isConcealed = (p: HandPartition) => p.melds.length === 0;

const allSequences = (p: HandPartition) => p.sets.every((s) => s.kind === 'chi');

const allTriplets = (p: HandPartition) => p.sets.every((s) => s.kind === 'pon' || s.kind === 'kan');

/** 暗刻/暗槓 count — triplets/kans that are still 暗 after the discard downgrade. */
const concealedTripletCount = (p: HandPartition) =>
  p.sets.filter((s) => (s.kind === 'pon' || s.kind === 'kan') && s.concealed).length;

// 平糊 — every set a sequence, pair a plain (non-honor) tile
const pingWu: Evaluator = (p) =>
  allSequences(p) && !isHonor(p.pair.tiles[0]) ? { name: '平糊', fan: 2 } : null;

// 對對糊 — every set a triplet / kan
const deoiDeoiWu: Evaluator = (p) => (allTriplets(p) ? { name: '對對糊', fan: 40 } : null);

// 三暗刻 / 四暗刻 / 五暗刻 — mutually exclusive, only the highest tier fires
const amHak: Evaluator = (p) => {
  const n = concealedTripletCount(p);
  if (n >= 5) return { name: '五暗刻', fan: 8 };
  if (n === 4) return { name: '四暗刻', fan: 5 };
  if (n === 3) return { name: '三暗刻', fan: 2 };
  return null;
};

// 門前清 — fully concealed, won on a discard
const munCinCing: Evaluator = (p, ctx) =>
  isConcealed(p) && !ctx.selfDraw ? { name: '門前清', fan: 1 } : null;

// 不求人 — fully concealed + self-draw (replaces 門前清 + 自摸)
const batKauJan: Evaluator = (p, ctx) =>
  isConcealed(p) && ctx.selfDraw ? { name: '不求人', fan: 3 } : null;

// 自摸 — self-draw with at least one exposed meld
const ziMo: Evaluator = (p, ctx) =>
  !isConcealed(p) && ctx.selfDraw ? { name: '自摸', fan: 1 } : null;

// 連N拉N — dealer on an N-hand streak
const linZong: Evaluator = (_p, ctx) =>
  ctx.linZong > 0
    ? { name: `連${ctx.linZong}拉${ctx.linZong}`, fan: 2 * ctx.linZong }
    : null;

export const EVALUATORS: Evaluator[] = [
  pingWu,
  deoiDeoiWu,
  amHak,
  munCinCing,
  batKauJan,
  ziMo,
  linZong,
];
