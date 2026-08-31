import { describe, expect, it } from 'vitest';
import { amountPerLoser, netBySeat, settle, SettlementInput } from './settlement';

const base = { seats: [0, 1, 2, 3], winnerSeat: 0 };

describe('amountPerLoser', () => {
  it('is 底 + 番總 when 番底 defaults to 1', () => {
    expect(amountPerLoser(5, { base: 10 })).toBe(15);
  });

  it('scales each 番 by 番底 when set', () => {
    expect(amountPerLoser(5, { base: 10, fanValue: 4 })).toBe(30);
  });
});

describe('settle — win by discard (放銃一家付)', () => {
  const input: SettlementInput = {
    ...base,
    fanTotal: 5,
    discarderSeat: 2,
    rules: { base: 10 },
  };

  it('only the discarder pays', () => {
    const transfers = settle(input);
    expect(transfers).toEqual([{ from: 2, to: 0, amount: 15, reason: '放銃' }]);
  });

  it('nets to zero', () => {
    const net = netBySeat(settle(input));
    expect(net.get(0)).toBe(15);
    expect(net.get(2)).toBe(-15);
    expect([...net.values()].reduce((a, b) => a + b, 0)).toBe(0);
  });
});

describe('settle — self-draw (自摸)', () => {
  const input: SettlementInput = {
    ...base,
    fanTotal: 3,
    discarderSeat: null,
    rules: { base: 10 },
  };

  it('all three losers pay the full amount', () => {
    const transfers = settle(input);
    expect(transfers).toHaveLength(3);
    expect(transfers.every((t) => t.amount === 13 && t.to === 0)).toBe(true);
    expect(transfers.map((t) => t.from).sort()).toEqual([1, 2, 3]);
  });

  it('winner receives 3× and it nets to zero', () => {
    const net = netBySeat(settle(input));
    expect(net.get(0)).toBe(39);
    expect([...net.values()].reduce((a, b) => a + b, 0)).toBe(0);
  });
});

describe('settle — 放銃三家分 house rule', () => {
  it('splits the discard win across all three losers', () => {
    const transfers = settle({
      ...base,
      fanTotal: 5,
      discarderSeat: 2,
      rules: { base: 10, splitDiscardPayment: true },
    });
    expect(transfers).toHaveLength(3);
    expect(transfers.every((t) => t.amount === 5)).toBe(true);
    expect([...netBySeat(transfers).values()].reduce((a, b) => a + b, 0)).toBe(0);
  });
});
