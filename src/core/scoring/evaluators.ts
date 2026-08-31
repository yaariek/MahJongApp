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
import type { DragonTileId, PlayingTileId, Suit, WindTileId } from '../tiles/tiles';
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

const isTerminal = (t: PlayingTileId) => rankOf(t) === 1 || rankOf(t) === 9;
const isTerminalOrHonor = (t: PlayingTileId) => rankOf(t) === null || isTerminal(t);

// 帶么九 — every set and the pair carries a 1/9 or a 字牌.
//   清么 20→80: every set a 刻/槓 of a terminal, no 字, no 順.
//   全帶么 15: every set/pair carries a plain terminal, no 字, at least one 順.
//   混么 30: same but 字牌 are involved, at least one 順.
const wanJiu: Evaluator = (p) => {
  const everyGroupQualifies =
    p.sets.every((s) => s.tiles.some(isTerminalOrHonor)) && p.pair.tiles.some(isTerminalOrHonor);
  if (!everyGroupQualifies) return null;

  const tiles = allTiles(p);
  const anyHonor = tiles.some((t) => rankOf(t) === null);
  const anySequence = p.sets.some((s) => s.kind === 'chi');

  if (!anyHonor && !anySequence && tiles.every(isTerminal)) return { name: '清么', fan: 80 };
  if (!anySequence) return null;
  return anyHonor ? { name: '混么', fan: 30 } : { name: '全帶么', fan: 15 };
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

// 兄弟 — 刻子 of the same rank across suits. 大三兄弟: all three suits. 小三兄弟:
// two suits + the pair is that rank in the third suit. 二兄弟: two suits, other
// pair. One line per qualifying rank.
const hingDai: Evaluator = (p) => {
  const suitsByRank = new Map<number, Set<Suit>>();
  for (const s of triplets(p)) {
    const r = rankOf(s.tiles[0]);
    const su = suitOf(s.tiles[0]);
    if (r === null || su === null) continue;
    const seen = suitsByRank.get(r) ?? new Set<Suit>();
    seen.add(su);
    suitsByRank.set(r, seen);
  }
  const pairRank = rankOf(p.pair.tiles[0]);
  const pairSuit = suitOf(p.pair.tiles[0]);
  const lines: FanLine[] = [];
  for (const [r, suits] of suitsByRank) {
    if (suits.size === 3) {
      lines.push({ name: '大三兄弟', fan: 15 });
    } else if (suits.size === 2) {
      const pairCompletes = pairRank === r && pairSuit !== null && !suits.has(pairSuit);
      lines.push(pairCompletes ? { name: '小三兄弟', fan: 10 } : { name: '二兄弟', fan: 3 });
    }
  }
  return lines.length > 0 ? lines : null;
};

// 姊妹 — 刻子 of consecutive ranks in the SAME suit. 大三姊妹: three in a row.
// 小三姊妹: two in a row + the pair (same suit) extends the run. One line per suit.
const ziMui: Evaluator = (p) => {
  const pairRank = rankOf(p.pair.tiles[0]);
  const pairSuit = suitOf(p.pair.tiles[0]);
  const lines: FanLine[] = [];
  for (const su of ['m', 'p', 's'] as const) {
    const ranks = new Set(
      triplets(p)
        .filter((s) => suitOf(s.tiles[0]) === su)
        .map((s) => rankOf(s.tiles[0]) as number),
    );
    for (let r = 1; r <= 7; r++) {
      if (ranks.has(r) && ranks.has(r + 1) && ranks.has(r + 2)) {
        lines.push({ name: '大三姊妹', fan: 15 });
      }
    }
    if (pairSuit === su && pairRank !== null) {
      for (let r = 1; r <= 8; r++) {
        if (ranks.has(r) && ranks.has(r + 1) && (pairRank === r - 1 || pairRank === r + 2)) {
          lines.push({ name: '小三姊妹', fan: 8 });
        }
      }
    }
  }
  return lines.length > 0 ? lines : null;
};

// 四歸n — all four copies of one suited tile, spread across the hand.
//   四歸一: 3 in a 刻 + 1 in a 順.
//   四歸二: 2 as the pair + 2 in 順子.
//   四歸四: all four in 順子 of at least two distinct shapes (four copies of the
//           same 順 is 般高, not 四歸).
// One line per qualifying tile. A declared 槓 (all four in one set) does not count.
const seiGwai: Evaluator = (p) => {
  type Spread = { pon: number; chi: number; kan: number; pair: number; chiShapes: Set<string> };
  const spread = new Map<PlayingTileId, Spread>();
  const of = (t: PlayingTileId) => {
    let s = spread.get(t);
    if (!s) {
      s = { pon: 0, chi: 0, kan: 0, pair: 0, chiShapes: new Set() };
      spread.set(t, s);
    }
    return s;
  };
  for (const set of p.sets) {
    if (set.kind === 'chi') {
      const shape = set.tiles.join('');
      for (const t of set.tiles) {
        const s = of(t);
        s.chi += 1;
        s.chiShapes.add(shape);
      }
    } else {
      const key = set.kind === 'kan' ? 'kan' : 'pon';
      for (const t of set.tiles) of(t)[key] += 1;
    }
  }
  for (const t of p.pair.tiles) of(t).pair += 1;

  const lines: FanLine[] = [];
  for (const [t, s] of spread) {
    if (suitOf(t) === null) continue;
    if (s.pon + s.chi + s.kan + s.pair !== 4 || s.kan > 0) continue;
    if (s.pon === 3 && s.chi === 1) lines.push({ name: '四歸一', fan: 5 });
    else if (s.pair === 2 && s.chi === 2) lines.push({ name: '四歸二', fan: 10 });
    else if (s.chi === 4 && s.chiShapes.size >= 2) lines.push({ name: '四歸四', fan: 20 });
  }
  return lines.length > 0 ? lines : null;
};

// 龍 — a 123 + 456 + 789 straight. 清龍 (one suit): 暗龍 20 if all three 順 are
// concealed, else 明龍 10. 雜龍 (one leg in each of the three suits): 暗雜龍 15 /
// 明雜龍 8.
const lung: Evaluator = (p) => {
  const seqs = sequences(p);

  const bySuit = new Map<Suit, ParsedSet[]>();
  for (const s of seqs) {
    const su = suitOf(s.tiles[0]);
    if (su === null) continue;
    const arr = bySuit.get(su) ?? [];
    arr.push(s);
    bySuit.set(su, arr);
  }
  for (const arr of bySuit.values()) {
    const runs = new Map<number, ParsedSet>();
    for (const s of arr) runs.set(rankOf(s.tiles[0]) as number, s);
    if (runs.has(1) && runs.has(4) && runs.has(7)) {
      const concealed = [1, 4, 7].every((r) => (runs.get(r) as ParsedSet).concealed);
      return concealed ? { name: '暗龍', fan: 20 } : { name: '明龍', fan: 10 };
    }
  }

  const pick = (r: number) => seqs.find((s) => rankOf(s.tiles[0]) === r);
  const lo = pick(1);
  const mid = pick(4);
  const hi = pick(7);
  if (lo && mid && hi) {
    const suits = new Set([lo, mid, hi].map((s) => suitOf(s.tiles[0])));
    if (suits.size === 3) {
      const concealed = lo.concealed && mid.concealed && hi.concealed;
      return concealed ? { name: '暗雜龍', fan: 15 } : { name: '明雜龍', fan: 8 };
    }
  }
  return null;
};

// 般高 / 相逢 / 同順 — repeated 順子, grouped by their starting rank.
//   般高: identical 順 in the SAME suit — 一般高 (2) 3 / 三般高 (3) 15 / 四般高 (4) 30.
//   相逢: the same 順 rank across different suits — 二相逢 (2) 2 / 三相逢 (3) 10.
//   四同順 20: four 順 of one rank in any mix of suits — supersedes 般高/相逢 for
//   that rank (house rule). One line group per starting rank.
const bunGou: Evaluator = (p) => {
  const bySuitByRank = new Map<number, Map<Suit, number>>();
  for (const s of sequences(p)) {
    const r = rankOf(s.tiles[0]);
    const su = suitOf(s.tiles[0]);
    if (r === null || su === null) continue;
    const perSuit = bySuitByRank.get(r) ?? new Map<Suit, number>();
    perSuit.set(su, (perSuit.get(su) ?? 0) + 1);
    bySuitByRank.set(r, perSuit);
  }

  const lines: FanLine[] = [];
  for (const perSuit of bySuitByRank.values()) {
    const counts = [...perSuit.values()];
    const total = counts.reduce((a, b) => a + b, 0);
    const maxInSuit = Math.max(...counts);

    if (maxInSuit === 4) {
      lines.push({ name: '四般高', fan: 30 });
      continue;
    }
    if (total === 4) {
      lines.push({ name: '四同順', fan: 20 });
      continue;
    }
    if (maxInSuit === 3) lines.push({ name: '三般高', fan: 15 });
    else if (maxInSuit === 2) lines.push({ name: '一般高', fan: 3 });
    if (perSuit.size === 3) lines.push({ name: '三相逢', fan: 10 });
    else if (perSuit.size === 2) lines.push({ name: '二相逢', fan: 2 });
  }
  return lines.length > 0 ? lines : null;
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

// 將眼 — the pair is a 2 / 5 / 8.
const zeungNgaan: Evaluator = (p) =>
  [2, 5, 8].includes(rankOf(p.pair.tiles[0]) as number) ? { name: '將眼', fan: 1 } : null;

// 老少 — a suit holding both a 123 順 and a 789 順. One line per suit.
const louSiu: Evaluator = (p) => {
  const lines: FanLine[] = [];
  for (const su of ['m', 'p', 's'] as const) {
    const starts = sequences(p)
      .filter((s) => suitOf(s.tiles[0]) === su)
      .map((s) => rankOf(s.tiles[0]));
    if (starts.includes(1) && starts.includes(7)) lines.push({ name: '老少', fan: 2 });
  }
  return lines.length > 0 ? lines : null;
};

// 無字 — no 風牌 or 箭牌 anywhere in the hand.
const mouZi: Evaluator = (p) =>
  allTiles(p).every((t) => suitOf(t) !== null) ? { name: '無字', fan: 1 } : null;

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
  wanJiu,
  saamJyun,
  seiHei,
  hingDai,
  ziMui,
  seiGwai,
  lung,
  bunGou,
  amHak,
  faanZiHak,
  zeungNgaan,
  louSiu,
  mouZi,
  munCinCing,
  batKauJan,
  ziMo,
  linZong,
];
