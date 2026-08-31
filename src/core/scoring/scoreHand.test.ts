import { describe, expect, it } from 'vitest';
import { scoreHand } from './index';
import type { Hand, HandContext } from './types';

const baseContext: HandContext = {
  seatWind: 'S',
  roundWind: 'E',
  isDealer: false,
  linZong: 0,
  selfDraw: false,
};

describe('scoreHand', () => {
  it('scores a plain 平糊 — all sequences, won by discard, one exposed 吃', () => {
    // 吃 m1m2m3 | concealed 順 p1p2p3 p4p5p6 s1s2s3 s7s8s9 | 對 m5, win on p3
    const hand: Hand = {
      concealed: ['p1', 'p2', 'p4', 'p5', 'p6', 's1', 's2', 's3', 's7', 's8', 's9', 'm5', 'm5'],
      winningTile: 'p3',
      melds: [{ kind: 'chi', tiles: ['m1', 'm2', 'm3'] }],
      flowers: [],
    };

    const result = scoreHand(hand, baseContext);

    expect(result.lines).toEqual([{ name: '平糊', fan: 3 }]);
    expect(result.fanTotal).toBe(3);
  });

  it('adds the 連N拉N line while the dealer is on a streak (連2 → fan 2·2+1 = 5)', () => {
    // same 平糊 hand, but played while the dealer is 連2莊
    const hand: Hand = {
      concealed: ['p1', 'p2', 'p4', 'p5', 'p6', 's1', 's2', 's3', 's7', 's8', 's9', 'm5', 'm5'],
      winningTile: 'p3',
      melds: [{ kind: 'chi', tiles: ['m1', 'm2', 'm3'] }],
      flowers: [],
    };

    const result = scoreHand(hand, { ...baseContext, linZong: 2 });

    expect(result.lines).toEqual([
      { name: '平糊', fan: 3 },
      { name: '連2拉2', fan: 5 },
    ]);
    expect(result.fanTotal).toBe(8);
  });

  it('stacks 對對糊 + 五暗刻 + 圈風刻 + 不求人 on a concealed self-drawn all-triplet hand', () => {
    // 刻 m1 p2 s3 wE s9 | 對 dR, self-draw on s9, nothing exposed → all 5 刻 are 暗.
    // wE 刻 in the E round is a 圈風刻.
    const hand: Hand = {
      concealed: [
        'm1',
        'm1',
        'm1',
        'p2',
        'p2',
        'p2',
        's3',
        's3',
        's3',
        'wE',
        'wE',
        'wE',
        's9',
        's9',
        'dR',
        'dR',
      ],
      winningTile: 's9',
      melds: [],
      flowers: [],
    };

    const result = scoreHand(hand, { ...baseContext, selfDraw: true });

    expect(result.lines).toEqual([
      { name: '對對糊', fan: 30 },
      { name: '五暗刻', fan: 80 },
      { name: '圈風刻', fan: 2 },
      { name: '不求人', fan: 5 },
    ]);
    expect(result.fanTotal).toBe(117);
  });

  describe('暗刻 vs 明刻 — same tiles, different win source', () => {
    // 吃 m1m2m3 | 刻 p1 p9 s5 | 順 s7s8s9 | 對 dR
    const makeHand = (): Hand => ({
      concealed: ['p1', 'p1', 'p1', 'p9', 'p9', 'p9', 's5', 's5', 's7', 's8', 's9', 'dR', 'dR'],
      winningTile: 's5',
      melds: [{ kind: 'chi', tiles: ['m1', 'm2', 'm3'] }],
      flowers: [],
    });

    it('self-drawing the 3rd s5 keeps three 暗刻 → 三暗刻', () => {
      const result = scoreHand(makeHand(), { ...baseContext, selfDraw: true });

      expect(result.lines).toEqual([
        { name: '三暗刻', fan: 10 },
        { name: '自摸', fan: 1 },
      ]);
      expect(result.fanTotal).toBe(11);
    });

    it('winning on a discarded s5 downgrades that 刻 to 明 → 三暗刻 drops to 二暗刻', () => {
      const result = scoreHand(makeHand(), baseContext);

      expect(result.lines.map((l) => l.name)).not.toContain('三暗刻');
      expect(result.lines).toEqual([{ name: '二暗刻', fan: 3 }]);
      expect(result.fanTotal).toBe(3);
    });
  });

  describe('番子刻 — 中/發/白 and wind 刻', () => {
    it('scores 中刻 + 發刻 + 白刻 (+2 each); winning on the 白 discard downgrades that 刻, leaving 二暗刻', () => {
      // 吃 m1m2m3 | 刻 dR (中) dG (發) dW (白, completed by the winning discard) |
      // 順 p1p2p3 | 對 s5 — seat S, round E so none of these are wind 刻.
      const hand: Hand = {
        concealed: ['dR', 'dR', 'dR', 'dG', 'dG', 'dG', 'dW', 'dW', 'p1', 'p2', 'p3', 's5', 's5'],
        winningTile: 'dW',
        melds: [{ kind: 'chi', tiles: ['m1', 'm2', 'm3'] }],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '二暗刻', fan: 3 },
        { name: '中刻', fan: 2 },
        { name: '發刻', fan: 2 },
        { name: '白刻', fan: 2 },
      ]);
      expect(result.fanTotal).toBe(9);
    });

    it('tells 圈風刻 / 門風刻 / 客風刻 apart for the seat and round wind', () => {
      // 吃 m1m2m3 | 刻 wE (round) wS (seat) wN (guest) | 順 p1p2p3 | 對 s5, win on s5.
      const hand: Hand = {
        concealed: ['wE', 'wE', 'wE', 'wS', 'wS', 'wS', 'wN', 'wN', 'wN', 'p1', 'p2', 'p3', 's5'],
        winningTile: 's5',
        melds: [{ kind: 'chi', tiles: ['m1', 'm2', 'm3'] }],
        flowers: [],
      };

      const result = scoreHand(hand, { ...baseContext, seatWind: 'S', roundWind: 'E' });

      expect(result.lines).toEqual([
        { name: '三暗刻', fan: 10 },
        { name: '圈風刻', fan: 2 },
        { name: '門風刻', fan: 2 },
        { name: '客風刻', fan: 1 },
      ]);
      expect(result.fanTotal).toBe(15);
    });
  });

  describe('混一色 / 清一色', () => {
    it('scores 清一色 on an all-萬 concealed hand (with 平糊 + 不求人)', () => {
      // 順 m1m2m3 ×2 | m4m5m6 | m7m8m9 ×2 | 對 m9 — self-drawn m6, nothing exposed.
      const hand: Hand = {
        concealed: [
          'm1',
          'm1',
          'm2',
          'm2',
          'm3',
          'm3',
          'm4',
          'm5',
          'm7',
          'm7',
          'm8',
          'm8',
          'm9',
          'm9',
          'm9',
          'm9',
        ],
        winningTile: 'm6',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, { ...baseContext, selfDraw: true });

      expect(result.lines).toEqual([
        { name: '平糊', fan: 3 },
        { name: '清一色', fan: 80 },
        { name: '不求人', fan: 5 },
      ]);
      expect(result.fanTotal).toBe(88);
    });

    it('scores 混一色 on a one-suit + 字牌 hand', () => {
      // 順 m1m2m3 | m4m5m6 | m7m8m9 | 刻 wS (seat) | 刻 dR | 對 wE — self-drawn m6.
      const hand: Hand = {
        concealed: [
          'm1',
          'm2',
          'm3',
          'm4',
          'm5',
          'm7',
          'm8',
          'm9',
          'wS',
          'wS',
          'wS',
          'dR',
          'dR',
          'dR',
          'wE',
          'wE',
        ],
        winningTile: 'm6',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, { ...baseContext, selfDraw: true });

      expect(result.lines).toEqual([
        { name: '混一色', fan: 30 },
        { name: '二暗刻', fan: 3 },
        { name: '門風刻', fan: 2 },
        { name: '中刻', fan: 2 },
        { name: '不求人', fan: 5 },
      ]);
      expect(result.fanTotal).toBe(42);
    });
  });

  it('stacks 圈風刻 + 門風刻 (fan 4) when the seat wind and round wind are the same', () => {
    // 吃 m1m2m3 | 刻 wE | 順 p1p2p3 | 順 s1s2s3 | 順 s7s8s9 | 對 s5 — East seat, East round.
    const hand: Hand = {
      concealed: ['wE', 'wE', 'wE', 'p1', 'p2', 'p3', 's1', 's2', 's3', 's7', 's8', 's5', 's5'],
      winningTile: 's9',
      melds: [{ kind: 'chi', tiles: ['m1', 'm2', 'm3'] }],
      flowers: [],
    };

    const result = scoreHand(hand, { ...baseContext, seatWind: 'E', roundWind: 'E' });

    expect(result.lines).toEqual([
      { name: '圈風刻', fan: 2 },
      { name: '門風刻', fan: 2 },
    ]);
    expect(result.fanTotal).toBe(4);
  });

  it('throws when the tiles cannot form 5 sets + a pair', () => {
    const hand: Hand = {
      concealed: ['m1', 'm1', 'm3', 'p2', 'p4', 'p6', 's1', 's3', 's5', 's7', 's9', 'wE', 'wS'],
      winningTile: 'wW',
      melds: [{ kind: 'chi', tiles: ['m7', 'm8', 'm9'] }],
      flowers: [],
    };

    expect(() => scoreHand(hand, baseContext)).toThrow(/valid 5 melds/);
  });
});
