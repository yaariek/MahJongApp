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

      // The three 龍牌 刻 are also 大三元 (dW completed by the winning discard).
      expect(result.lines).toEqual([
        { name: '大三元', fan: 40 },
        { name: '二暗刻', fan: 3 },
        { name: '中刻', fan: 2 },
        { name: '發刻', fan: 2 },
        { name: '白刻', fan: 2 },
      ]);
      expect(result.fanTotal).toBe(49);
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

      // Three wind 刻 with a non-wind pair is also 大三風.
      expect(result.lines).toEqual([
        { name: '大三風', fan: 30 },
        { name: '三暗刻', fan: 10 },
        { name: '圈風刻', fan: 2 },
        { name: '門風刻', fan: 2 },
        { name: '客風刻', fan: 1 },
      ]);
      expect(result.fanTotal).toBe(45);
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

      // Also 四歸二 (all four m9 — two in the pair, two in m7m8m9) and 暗龍
      // (a concealed m1-9 straight).
      expect(result.lines).toEqual([
        { name: '平糊', fan: 3 },
        { name: '清一色', fan: 80 },
        { name: '四歸二', fan: 10 },
        { name: '暗龍', fan: 20 },
        { name: '不求人', fan: 5 },
      ]);
      expect(result.fanTotal).toBe(118);
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

      // The concealed m1m2m3 / m4m5m6 / m7m8m9 is also a 暗龍.
      expect(result.lines).toEqual([
        { name: '混一色', fan: 30 },
        { name: '暗龍', fan: 20 },
        { name: '二暗刻', fan: 3 },
        { name: '門風刻', fan: 2 },
        { name: '中刻', fan: 2 },
        { name: '不求人', fan: 5 },
      ]);
      expect(result.fanTotal).toBe(62);
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

  describe('三元 / 四喜', () => {
    it('scores 大三元 (+ 對對糊 + 四暗刻) — three 龍牌 刻, one downgraded by the win', () => {
      // 刻 dR dG dW m2 s7 | 對 p5 — win on the discarded 3rd m2, so that 刻 is 明.
      const hand: Hand = {
        concealed: [
          'dR',
          'dR',
          'dR',
          'dG',
          'dG',
          'dG',
          'dW',
          'dW',
          'dW',
          'm2',
          'm2',
          's7',
          's7',
          's7',
          'p5',
          'p5',
        ],
        winningTile: 'm2',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '對對糊', fan: 30 },
        { name: '大三元', fan: 40 },
        { name: '四暗刻', fan: 30 },
        { name: '中刻', fan: 2 },
        { name: '發刻', fan: 2 },
        { name: '白刻', fan: 2 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(109);
    });

    it('scores 小三元 — two 龍牌 刻 + a 龍牌 pair', () => {
      // 刻 dR dG | 對 dW | 順 m1m2m3 p1p2p3 s1s2s3 — win on the discarded s3.
      const hand: Hand = {
        concealed: [
          'dR',
          'dR',
          'dR',
          'dG',
          'dG',
          'dG',
          'dW',
          'dW',
          'm1',
          'm2',
          'm3',
          'p1',
          'p2',
          'p3',
          's1',
          's2',
        ],
        winningTile: 's3',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '小三元', fan: 20 },
        { name: '二暗刻', fan: 3 },
        { name: '中刻', fan: 2 },
        { name: '發刻', fan: 2 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(30);
    });

    it('scores 大四喜 (+ 對對糊 + 四暗刻) — four wind 刻', () => {
      // 刻 wE wS wW wN m5 | 對 p2 — win on the discarded 3rd m5. Seat S, round E.
      const hand: Hand = {
        concealed: [
          'wE',
          'wE',
          'wE',
          'wS',
          'wS',
          'wS',
          'wW',
          'wW',
          'wW',
          'wN',
          'wN',
          'wN',
          'm5',
          'm5',
          'p2',
          'p2',
        ],
        winningTile: 'm5',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '對對糊', fan: 30 },
        { name: '大四喜', fan: 80 },
        { name: '四暗刻', fan: 30 },
        { name: '圈風刻', fan: 2 },
        { name: '門風刻', fan: 2 },
        { name: '客風刻', fan: 1 },
        { name: '客風刻', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(149);
    });

    it('scores 小四喜 — three wind 刻 + a wind pair', () => {
      // 刻 wE wS wW | 對 wN | 順 m1m2m3 p1p2p3 — win on the discarded p3.
      const hand: Hand = {
        concealed: [
          'wE',
          'wE',
          'wE',
          'wS',
          'wS',
          'wS',
          'wW',
          'wW',
          'wW',
          'wN',
          'wN',
          'm1',
          'm2',
          'm3',
          'p1',
          'p2',
        ],
        winningTile: 'p3',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '小四喜', fan: 60 },
        { name: '三暗刻', fan: 10 },
        { name: '圈風刻', fan: 2 },
        { name: '門風刻', fan: 2 },
        { name: '客風刻', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(78);
    });

    it('scores 大三風 — three wind 刻 with a non-wind pair', () => {
      // 刻 wE wS wW m1 | 順 p1p2p3 | 對 s5 — win on the discarded p3.
      const hand: Hand = {
        concealed: [
          'wE',
          'wE',
          'wE',
          'wS',
          'wS',
          'wS',
          'wW',
          'wW',
          'wW',
          'm1',
          'm1',
          'm1',
          'p1',
          'p2',
          's5',
          's5',
        ],
        winningTile: 'p3',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '大三風', fan: 30 },
        { name: '四暗刻', fan: 30 },
        { name: '圈風刻', fan: 2 },
        { name: '門風刻', fan: 2 },
        { name: '客風刻', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(68);
    });

    it('scores 小三風 — two wind 刻 + a wind pair', () => {
      // 刻 wE wS | 對 wW | 順 m1m2m3 p1p2p3 s1s2s3 — win on the discarded s3.
      const hand: Hand = {
        concealed: [
          'wE',
          'wE',
          'wE',
          'wS',
          'wS',
          'wS',
          'wW',
          'wW',
          'm1',
          'm2',
          'm3',
          'p1',
          'p2',
          'p3',
          's1',
          's2',
        ],
        winningTile: 's3',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '小三風', fan: 15 },
        { name: '二暗刻', fan: 3 },
        { name: '圈風刻', fan: 2 },
        { name: '門風刻', fan: 2 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(25);
    });
  });

  describe('兄弟 / 姊妹', () => {
    it('scores 二兄弟 — same-rank 刻 in two suits, other pair', () => {
      // 刻 m5 p5 | 順 m1m2m3 p1p2p3 s1s2s3 | 對 s7 — win on the discarded s3.
      const hand: Hand = {
        concealed: [
          'm5',
          'm5',
          'm5',
          'p5',
          'p5',
          'p5',
          'm1',
          'm2',
          'm3',
          'p1',
          'p2',
          'p3',
          's1',
          's2',
          's7',
          's7',
        ],
        winningTile: 's3',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '二兄弟', fan: 3 },
        { name: '二暗刻', fan: 3 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(9);
    });

    it('scores 小三兄弟 — same-rank 刻 in two suits + a same-rank pair in the third', () => {
      // 刻 m5 p5 | 對 s5 | 順 m1m2m3 p1p2p3 s1s2s3 — win on the discarded s3.
      const hand: Hand = {
        concealed: [
          'm5',
          'm5',
          'm5',
          'p5',
          'p5',
          'p5',
          's5',
          's5',
          'm1',
          'm2',
          'm3',
          'p1',
          'p2',
          'p3',
          's1',
          's2',
        ],
        winningTile: 's3',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '小三兄弟', fan: 10 },
        { name: '二暗刻', fan: 3 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(16);
    });

    it('scores 大三兄弟 — same-rank 刻 in all three suits', () => {
      // 刻 m5 p5 s5 | 順 m1m2m3 p1p2p3 | 對 s7 — win on the discarded p3.
      const hand: Hand = {
        concealed: [
          'm5',
          'm5',
          'm5',
          'p5',
          'p5',
          'p5',
          's5',
          's5',
          's5',
          'm1',
          'm2',
          'm3',
          'p1',
          'p2',
          's7',
          's7',
        ],
        winningTile: 'p3',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '大三兄弟', fan: 15 },
        { name: '三暗刻', fan: 10 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(28);
    });

    it('scores 大三姊妹 — three consecutive-rank 刻 in one suit', () => {
      // 刻 m4 m5 m6 | 順 p1p2p3 s1s2s3 | 對 s7 — win on the discarded s3.
      const hand: Hand = {
        concealed: [
          'm4',
          'm4',
          'm4',
          'm5',
          'm5',
          'm5',
          'm6',
          'm6',
          'm6',
          'p1',
          'p2',
          'p3',
          's1',
          's2',
          's7',
          's7',
        ],
        winningTile: 's3',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '大三姊妹', fan: 15 },
        { name: '三暗刻', fan: 10 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(28);
    });

    it('scores 小三姊妹 — two consecutive-rank 刻 + the pair extends the run', () => {
      // 刻 m4 m5 | 對 m6 | 順 p1p2p3 s1s2s3 s7s8s9 — win on the discarded s9.
      const hand: Hand = {
        concealed: [
          'm4',
          'm4',
          'm4',
          'm5',
          'm5',
          'm5',
          'm6',
          'm6',
          'p1',
          'p2',
          'p3',
          's1',
          's2',
          's3',
          's7',
          's8',
        ],
        winningTile: 's9',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '小三姊妹', fan: 8 },
        { name: '二暗刻', fan: 3 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(14);
    });
  });

  describe('四歸n', () => {
    it('scores 四歸一 — a 刻 of m2 plus one more m2 in a 順', () => {
      // 刻 m2m2m2 | 順 m1m2m3 p1p2p3 s1s2s3 s7s8s9 | 對 p5 — win on the discarded s9.
      const hand: Hand = {
        concealed: [
          'm2',
          'm2',
          'm2',
          'm2',
          'm1',
          'm3',
          'p1',
          'p2',
          'p3',
          's1',
          's2',
          's3',
          's7',
          's8',
          'p5',
          'p5',
        ],
        winningTile: 's9',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '四歸一', fan: 5 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(8);
    });

    it('scores 四歸二 — an m5 pair plus two more m5 in 順子', () => {
      // 對 m5 | 順 m3m4m5 m5m6m7 p1p2p3 s1s2s3 | 刻 s7 — win on the discarded s3.
      const hand: Hand = {
        concealed: [
          'm5',
          'm5',
          'm5',
          'm5',
          'm3',
          'm4',
          'm6',
          'm7',
          'p1',
          'p2',
          'p3',
          's1',
          's2',
          's7',
          's7',
          's7',
        ],
        winningTile: 's3',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '四歸二', fan: 10 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(13);
    });

    it('scores 四歸四 — every copy of m5 sitting in a different 順', () => {
      // 順 m3m4m5 m4m5m6 m5m6m7 m5m6m7 s1s2s3 | 對 p5 — win on the discarded s3.
      const hand: Hand = {
        concealed: [
          'm3',
          'm4',
          'm4',
          'm5',
          'm5',
          'm5',
          'm5',
          'm6',
          'm6',
          'm6',
          'm7',
          'm7',
          's1',
          's2',
          'p5',
          'p5',
        ],
        winningTile: 's3',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '平糊', fan: 3 },
        { name: '四歸四', fan: 20 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(26);
    });
  });

  describe('龍 / 雜龍', () => {
    it('scores 暗龍 — a concealed 1-9 straight in one suit', () => {
      // 順 m1m2m3 m4m5m6 m7m8m9 p1p2p3 | 刻 s5 | 對 p7 — self-drawn m6.
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
          'p1',
          'p2',
          'p3',
          's5',
          's5',
          's5',
          'p7',
          'p7',
        ],
        winningTile: 'm6',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, { ...baseContext, selfDraw: true });

      expect(result.lines).toEqual([
        { name: '暗龍', fan: 20 },
        { name: '不求人', fan: 5 },
      ]);
      expect(result.fanTotal).toBe(25);
    });

    it('scores 明龍 — the 789 leg completed by the winning discard', () => {
      // same straight, but won on a discarded m9.
      const hand: Hand = {
        concealed: [
          'm1',
          'm2',
          'm3',
          'm4',
          'm5',
          'm6',
          'm7',
          'm8',
          'p1',
          'p2',
          'p3',
          's5',
          's5',
          's5',
          'p7',
          'p7',
        ],
        winningTile: 'm9',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '明龍', fan: 10 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(13);
    });

    it('scores 暗雜龍 — a concealed 1-9 straight, one leg in each suit', () => {
      // 順 m1m2m3 (123) p4p5p6 (456) s7s8s9 (789) | 刻 m5 p8 | 對 s3 — self-drawn p6.
      const hand: Hand = {
        concealed: [
          'm1',
          'm2',
          'm3',
          'm5',
          'm5',
          'm5',
          'p4',
          'p5',
          'p8',
          'p8',
          'p8',
          's7',
          's8',
          's9',
          's3',
          's3',
        ],
        winningTile: 'p6',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, { ...baseContext, selfDraw: true });

      expect(result.lines).toEqual([
        { name: '暗雜龍', fan: 15 },
        { name: '二暗刻', fan: 3 },
        { name: '不求人', fan: 5 },
      ]);
      expect(result.fanTotal).toBe(23);
    });

    it('scores 明雜龍 — cross-suit straight, 789 leg won by discard', () => {
      // 順 m1m2m3 (123) p4p5p6 (456) s7s8s9 (789) | 刻 m5 s2 | 對 p1 — win on s9.
      const hand: Hand = {
        concealed: [
          'm1',
          'm2',
          'm3',
          'm5',
          'm5',
          'm5',
          's2',
          's2',
          's2',
          'p4',
          'p5',
          'p6',
          's7',
          's8',
          'p1',
          'p1',
        ],
        winningTile: 's9',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '明雜龍', fan: 8 },
        { name: '二暗刻', fan: 3 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(14);
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
