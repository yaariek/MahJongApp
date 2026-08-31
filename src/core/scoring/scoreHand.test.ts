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

    expect(result.lines).toEqual([
      { name: '平糊', fan: 3 },
      { name: '三相逢', fan: 10 },
      { name: '將眼', fan: 1 },
      { name: '老少', fan: 2 },
      { name: '無字', fan: 1 },
    ]);
    expect(result.fanTotal).toBe(17);
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
      { name: '三相逢', fan: 10 },
      { name: '將眼', fan: 1 },
      { name: '老少', fan: 2 },
      { name: '無字', fan: 1 },
      { name: '連2拉2', fan: 5 },
    ]);
    expect(result.fanTotal).toBe(22);
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
      { name: '五門齊', fan: 10 },
      { name: '不求人', fan: 5 },
    ]);
    expect(result.fanTotal).toBe(127);
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
        { name: '二相逢', fan: 2 },
        { name: '二暗刻', fan: 3 },
        { name: '中刻', fan: 2 },
        { name: '發刻', fan: 2 },
        { name: '白刻', fan: 2 },
        { name: '將眼', fan: 1 },
      ]);
      expect(result.fanTotal).toBe(52);
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
        { name: '二相逢', fan: 2 },
        { name: '三暗刻', fan: 10 },
        { name: '圈風刻', fan: 2 },
        { name: '門風刻', fan: 2 },
        { name: '客風刻', fan: 1 },
        { name: '將眼', fan: 1 },
      ]);
      expect(result.fanTotal).toBe(48);
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

      // Also 四歸二 (all four m9 — two in the pair, two in m7m8m9), 暗龍
      // (a concealed m1-9 straight) and 一般高 (m1m2m3 ×2).
      expect(result.lines).toEqual([
        { name: '平糊', fan: 3 },
        { name: '清一色', fan: 80 },
        { name: '四歸二', fan: 10 },
        { name: '暗龍', fan: 20 },
        { name: '一般高', fan: 3 },
        { name: '一般高', fan: 3 },
        { name: '老少', fan: 2 },
        { name: '無字', fan: 1 },
        { name: '不求人', fan: 5 },
      ]);
      expect(result.fanTotal).toBe(127);
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
        { name: '老少', fan: 2 },
        { name: '不求人', fan: 5 },
      ]);
      expect(result.fanTotal).toBe(64);
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
      { name: '三相逢', fan: 10 },
      { name: '圈風刻', fan: 2 },
      { name: '門風刻', fan: 2 },
      { name: '將眼', fan: 1 },
      { name: '老少', fan: 2 },
    ]);
    expect(result.fanTotal).toBe(17);
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
        { name: '將眼', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(110);
    });

    it('scores 小三元 — two 龍牌 刻 + a 龍牌 pair', () => {
      // 刻 dR dG | 對 dW | 順 m4m5m6 p2p3p4 s4s5s6 — win on the discarded s6.
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
          'm4',
          'm5',
          'm6',
          'p2',
          'p3',
          'p4',
          's4',
          's5',
        ],
        winningTile: 's6',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '小三元', fan: 20 },
        { name: '二相逢', fan: 2 },
        { name: '二暗刻', fan: 3 },
        { name: '中刻', fan: 2 },
        { name: '發刻', fan: 2 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(32);
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
        { name: '缺一門', fan: 5 },
        { name: '將眼', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(155);
    });

    it('scores 小四喜 — three wind 刻 + a wind pair', () => {
      // 刻 wE wS wW | 對 wN | 順 m4m5m6 p2p3p4 — win on the discarded p4.
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
          'm4',
          'm5',
          'm6',
          'p2',
          'p3',
        ],
        winningTile: 'p4',
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
        { name: '缺一門', fan: 5 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(83);
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
        { name: '將眼', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(69);
    });

    it('scores 小三風 — two wind 刻 + a wind pair', () => {
      // 刻 wE wS | 對 wW | 順 m4m5m6 p2p3p4 s6s7s8 — win on the discarded s8.
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
          'm4',
          'm5',
          'm6',
          'p2',
          'p3',
          'p4',
          's6',
          's7',
        ],
        winningTile: 's8',
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
        { name: '三相逢', fan: 10 },
        { name: '二暗刻', fan: 3 },
        { name: '無字', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(20);
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
        { name: '三相逢', fan: 10 },
        { name: '二暗刻', fan: 3 },
        { name: '將眼', fan: 1 },
        { name: '無字', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(28);
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
        { name: '二相逢', fan: 2 },
        { name: '三暗刻', fan: 10 },
        { name: '無字', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(31);
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
        { name: '二相逢', fan: 2 },
        { name: '三暗刻', fan: 10 },
        { name: '無字', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(31);
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
        { name: '二相逢', fan: 2 },
        { name: '二暗刻', fan: 3 },
        { name: '老少', fan: 2 },
        { name: '無字', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(19);
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
        { name: '三相逢', fan: 10 },
        { name: '將眼', fan: 1 },
        { name: '老少', fan: 2 },
        { name: '無字', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(22);
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
        { name: '二相逢', fan: 2 },
        { name: '將眼', fan: 1 },
        { name: '無字', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(17);
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

      // m5m6m7 appears twice → also 一般高.
      expect(result.lines).toEqual([
        { name: '平糊', fan: 3 },
        { name: '四歸四', fan: 20 },
        { name: '一般高', fan: 3 },
        { name: '將眼', fan: 1 },
        { name: '無字', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(31);
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
        { name: '二相逢', fan: 2 },
        { name: '老少', fan: 2 },
        { name: '無字', fan: 1 },
        { name: '不求人', fan: 5 },
      ]);
      expect(result.fanTotal).toBe(30);
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
        { name: '二相逢', fan: 2 },
        { name: '老少', fan: 2 },
        { name: '無字', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(18);
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
        { name: '無字', fan: 1 },
        { name: '不求人', fan: 5 },
      ]);
      expect(result.fanTotal).toBe(24);
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
        { name: '無字', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(15);
    });
  });

  describe('帶么九 — 清么 / 全帶么 / 混么', () => {
    it('scores 清么 — every set a 刻 of a terminal, no 字牌 (all six 老頭 groups → 兄弟)', () => {
      // 刻 m1 m9 p1 p9 s1 | 對 s9 — win on the discarded 3rd s1.
      const hand: Hand = {
        concealed: [
          'm1',
          'm1',
          'm1',
          'm9',
          'm9',
          'm9',
          'p1',
          'p1',
          'p1',
          'p9',
          'p9',
          'p9',
          's1',
          's1',
          's9',
          's9',
        ],
        winningTile: 's1',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '對對糊', fan: 30 },
        { name: '清么', fan: 80 },
        { name: '大三兄弟', fan: 15 },
        { name: '小三兄弟', fan: 10 },
        { name: '四暗刻', fan: 30 },
        { name: '無字', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(169);
    });

    it('scores 全帶么 — every set/pair carries a plain 1/9, with a 順', () => {
      // 順 m1m2m3 p1p2p3 p7p8p9 s7s8s9 | 刻 s1 | 對 m9 — win on the discarded m3.
      const hand: Hand = {
        concealed: [
          'm1',
          'm2',
          'm9',
          'm9',
          'p1',
          'p2',
          'p3',
          'p7',
          'p8',
          'p9',
          's7',
          's8',
          's9',
          's1',
          's1',
          's1',
        ],
        winningTile: 'm3',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      // p1p2p3 + p7p8p9 is also 老少.
      expect(result.lines).toEqual([
        { name: '全帶么', fan: 15 },
        { name: '二相逢', fan: 2 },
        { name: '二相逢', fan: 2 },
        { name: '老少', fan: 2 },
        { name: '無字', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(25);
    });

    it('scores 混么 — every set/pair carries a 1/9 or 字牌, with a 順 and 字牌', () => {
      // 順 m1m2m3 p7p8p9 | 刻 s1 dR wE | 對 s9 — win on the discarded m3.
      const hand: Hand = {
        concealed: [
          'm1',
          'm2',
          'p7',
          'p8',
          'p9',
          's1',
          's1',
          's1',
          'dR',
          'dR',
          'dR',
          'wE',
          'wE',
          'wE',
          's9',
          's9',
        ],
        winningTile: 'm3',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '混么', fan: 30 },
        { name: '三暗刻', fan: 10 },
        { name: '圈風刻', fan: 2 },
        { name: '中刻', fan: 2 },
        { name: '五門齊', fan: 10 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(57);
    });
  });

  describe('將眼 / 老少 / 無字 — the always-on 1番', () => {
    it('adds 將眼 (2/5/8 pair), 老少 (123+789 one suit) and 無字 (no 字牌), stacking', () => {
      // 順 m1m2m3 m7m8m9 p2p3p4 p4p5p6 | 刻 s3 | 對 s5 — win on the discarded s3.
      const hand: Hand = {
        concealed: [
          'm1',
          'm2',
          'm3',
          'm7',
          'm8',
          'm9',
          'p2',
          'p3',
          'p4',
          'p4',
          'p5',
          'p6',
          's3',
          's3',
          's5',
          's5',
        ],
        winningTile: 's3',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '將眼', fan: 1 },
        { name: '老少', fan: 2 },
        { name: '無字', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(7);
    });

    it('drops 無字 as soon as any 字牌 is in the hand', () => {
      // same shape but the s3 刻 is a wE 刻 (also a 圈風刻 in the E round).
      const hand: Hand = {
        concealed: [
          'm1',
          'm2',
          'm3',
          'm7',
          'm8',
          'm9',
          'p2',
          'p3',
          'p4',
          'p4',
          'p5',
          'p6',
          'wE',
          'wE',
          's5',
          's5',
        ],
        winningTile: 'wE',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines.map((l) => l.name)).not.toContain('無字');
      expect(result.lines).toEqual([
        { name: '圈風刻', fan: 2 },
        { name: '將眼', fan: 1 },
        { name: '老少', fan: 2 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(8);
    });
  });

  describe('般高 / 相逢 / 四同順', () => {
    it('scores 一般高 — two identical 順 in one suit', () => {
      // 順 m1m2m3 ×2 | p1p2p3 | s7s8s9 | 刻 s4 | 對 m5 — win on the discarded s4.
      const hand: Hand = {
        concealed: [
          'm1',
          'm1',
          'm2',
          'm2',
          'm3',
          'm3',
          'p1',
          'p2',
          'p3',
          's7',
          's8',
          's9',
          's4',
          's4',
          'm5',
          'm5',
        ],
        winningTile: 's4',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '一般高', fan: 3 },
        { name: '二相逢', fan: 2 },
        { name: '將眼', fan: 1 },
        { name: '無字', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(10);
    });

    it('scores 三般高 — three identical 順 in one suit (melds force the 順 reading)', () => {
      // 吃 m1m2m3 | 順 m1m2m3 ×2 | 順 s7s8s9 | 刻 s4 | 對 p5 — win on the discarded s9.
      const hand: Hand = {
        concealed: ['m1', 'm1', 'm2', 'm2', 'm3', 'm3', 's7', 's8', 's4', 's4', 's4', 'p5', 'p5'],
        winningTile: 's9',
        melds: [{ kind: 'chi', tiles: ['m1', 'm2', 'm3'] }],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '三般高', fan: 15 },
        { name: '將眼', fan: 1 },
        { name: '無字', fan: 1 },
      ]);
      expect(result.fanTotal).toBe(17);
    });

    it('scores 四般高 — four identical 順 in one suit (two melds + two concealed)', () => {
      // 吃 m1m2m3 ×2 | 順 m1m2m3 ×2 | 刻 s4 | 對 p5 — win on the discarded s4.
      const hand: Hand = {
        concealed: ['m1', 'm1', 'm2', 'm2', 'm3', 'm3', 's4', 's4', 'p5', 'p5'],
        winningTile: 's4',
        melds: [
          { kind: 'chi', tiles: ['m1', 'm2', 'm3'] },
          { kind: 'chi', tiles: ['m1', 'm2', 'm3'] },
        ],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '四般高', fan: 30 },
        { name: '將眼', fan: 1 },
        { name: '無字', fan: 1 },
      ]);
      expect(result.fanTotal).toBe(32);
    });

    it('scores 二相逢 — the same 順 rank in two suits', () => {
      // 順 m4m5m6 p4p5p6 s1s2s3 s7s8s9 | 刻 m8 | 對 p2 — win on the discarded s3.
      const hand: Hand = {
        concealed: [
          'm4',
          'm5',
          'm6',
          'p4',
          'p5',
          'p6',
          's1',
          's2',
          's7',
          's8',
          's9',
          'm8',
          'm8',
          'm8',
          'p2',
          'p2',
        ],
        winningTile: 's3',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '二相逢', fan: 2 },
        { name: '將眼', fan: 1 },
        { name: '老少', fan: 2 },
        { name: '無字', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(9);
    });

    it('scores 三相逢 (三色同順) — the same 順 rank in all three suits', () => {
      // 順 m4m5m6 p4p5p6 s4s5s6 | 刻 m8 p2 | 對 s9 — win on the discarded m6.
      const hand: Hand = {
        concealed: [
          'm4',
          'm5',
          'p4',
          'p5',
          'p6',
          's4',
          's5',
          's6',
          'm8',
          'm8',
          'm8',
          'p2',
          'p2',
          'p2',
          's9',
          's9',
        ],
        winningTile: 'm6',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '三相逢', fan: 10 },
        { name: '二暗刻', fan: 3 },
        { name: '無字', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(17);
    });

    it('scores 四同順 — four 順 of one rank across suits, superseding 般高/相逢', () => {
      // 順 m4m5m6 ×2 | p4p5p6 | s4s5s6 | 刻 m8 | 對 p2 — win on the discarded s6.
      const hand: Hand = {
        concealed: [
          'm4',
          'm4',
          'm5',
          'm5',
          'm6',
          'm6',
          'p4',
          'p5',
          'p6',
          's4',
          's5',
          'm8',
          'm8',
          'm8',
          'p2',
          'p2',
        ],
        winningTile: 's6',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '四同順', fan: 20 },
        { name: '將眼', fan: 1 },
        { name: '無字', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(25);
    });
  });

  describe('五門齊 / 缺一門', () => {
    it('scores 五門齊 — 萬 筒 條 風 箭 all present', () => {
      // 順 m1m2m3 p1p2p3 | 刻 s9 wS dR | 對 s5 — win on the discarded m3.
      const hand: Hand = {
        concealed: [
          'm1',
          'm2',
          'p1',
          'p2',
          'p3',
          's9',
          's9',
          's9',
          'wS',
          'wS',
          'wS',
          'dR',
          'dR',
          'dR',
          's5',
          's5',
        ],
        winningTile: 'm3',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      // m1m2m3 + p1p2p3 also make a 二相逢.
      expect(result.lines).toEqual([
        { name: '二相逢', fan: 2 },
        { name: '三暗刻', fan: 10 },
        { name: '門風刻', fan: 2 },
        { name: '中刻', fan: 2 },
        { name: '五門齊', fan: 10 },
        { name: '將眼', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(30);
    });

    it('scores 缺一門 — exactly one of 萬/筒/條 missing', () => {
      // no 條 at all: 順 m2m3m4 m7m8m9 p3p4p5 | 刻 m6 p9 | 對 p8 — win on the discarded m4.
      const hand: Hand = {
        concealed: [
          'm2',
          'm3',
          'm6',
          'm6',
          'm6',
          'm7',
          'm8',
          'm9',
          'p3',
          'p4',
          'p5',
          'p9',
          'p9',
          'p9',
          'p8',
          'p8',
        ],
        winningTile: 'm4',
        melds: [],
        flowers: [],
      };

      const result = scoreHand(hand, baseContext);

      expect(result.lines).toEqual([
        { name: '二暗刻', fan: 3 },
        { name: '缺一門', fan: 5 },
        { name: '將眼', fan: 1 },
        { name: '無字', fan: 1 },
        { name: '門前清', fan: 3 },
      ]);
      expect(result.fanTotal).toBe(13);
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
