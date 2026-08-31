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

    expect(result.lines).toEqual([{ name: '平糊', fan: 2 }]);
    expect(result.fanTotal).toBe(2);
  });

  it('stacks 對對糊 + 五暗刻 + 不求人 on a concealed self-drawn all-triplet hand', () => {
    // 刻 m1 p2 s3 wE s9 | 對 dR, self-draw on s9, nothing exposed → all 5 刻 are 暗
    const hand: Hand = {
      concealed: [
        'm1', 'm1', 'm1',
        'p2', 'p2', 'p2',
        's3', 's3', 's3',
        'wE', 'wE', 'wE',
        's9', 's9',
        'dR', 'dR',
      ],
      winningTile: 's9',
      melds: [],
      flowers: [],
    };

    const result = scoreHand(hand, { ...baseContext, selfDraw: true });

    expect(result.lines).toEqual([
      { name: '對對糊', fan: 40 },
      { name: '五暗刻', fan: 8 },
      { name: '不求人', fan: 3 },
    ]);
    expect(result.fanTotal).toBe(51);
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
        { name: '三暗刻', fan: 2 },
        { name: '自摸', fan: 1 },
      ]);
      expect(result.fanTotal).toBe(3);
    });

    it('winning on a discarded s5 downgrades that 刻 to 明 → 三暗刻 does not fire', () => {
      const result = scoreHand(makeHand(), baseContext);

      expect(result.lines.map((l) => l.name)).not.toContain('三暗刻');
      expect(result.lines).toEqual([]);
      expect(result.fanTotal).toBe(0);
    });
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
