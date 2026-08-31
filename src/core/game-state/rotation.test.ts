import { describe, expect, it } from 'vitest';
import { HandResult, RotationState, initialRotation, nextRotation, seatWind } from './rotation';

const replay = (results: HandResult[], state = initialRotation()): RotationState =>
  results.reduce((s, r) => nextRotation(s, r), state);

describe('seatWind', () => {
  it('assigns 東 to the dealer and 南西北 counter-clockwise', () => {
    const s = initialRotation({ dealerSeat: 1 });
    expect(seatWind(s, 1)).toBe('E');
    expect(seatWind(s, 2)).toBe('S');
    expect(seatWind(s, 3)).toBe('W');
    expect(seatWind(s, 0)).toBe('N');
  });
});

describe('nextRotation', () => {
  it('keeps the dealer and increments 連莊 on a dealer win', () => {
    const s = nextRotation(initialRotation(), { type: 'dealerWin' });
    expect(s.dealerSeat).toBe(0);
    expect(s.linZong).toBe(1);
    expect(s.handNumber).toBe(2);
  });

  it('keeps the dealer on a 荒莊 by default', () => {
    const s = nextRotation(initialRotation(), { type: 'draw' });
    expect(s.dealerSeat).toBe(0);
    expect(s.linZong).toBe(1);
  });

  it('passes the dealer counter-clockwise and resets 連莊 on a non-dealer win', () => {
    const s = replay([{ type: 'dealerWin' }, { type: 'nonDealerWin' }]);
    expect(s.dealerSeat).toBe(1);
    expect(s.linZong).toBe(0);
    expect(s.roundWind).toBe('E');
  });

  it('advances the round wind after a full lap of the table', () => {
    const s = replay(Array(4).fill({ type: 'nonDealerWin' }));
    expect(s.dealerSeat).toBe(0);
    expect(s.roundWind).toBe('S');
    expect(s.roundIndex).toBe(1);
    expect(s.finished).toBe(false);
  });

  it('finishes the game after the final round wind laps (default 4 rounds)', () => {
    const s = replay(Array(16).fill({ type: 'nonDealerWin' }));
    expect(s.finished).toBe(true);
    expect(nextRotation(s, { type: 'nonDealerWin' })).toBe(s); // no-op once finished
  });

  it('respects a 1-round (東-only) game', () => {
    const s = replay(Array(4).fill({ type: 'nonDealerWin' }), initialRotation({ totalRounds: 1 }));
    expect(s.finished).toBe(true);
  });

  it('連莊 delays the lap: dealer 0 wins twice then loses, still dealer 1 next', () => {
    const s = replay([{ type: 'dealerWin' }, { type: 'dealerWin' }, { type: 'nonDealerWin' }]);
    expect(s.dealerSeat).toBe(1);
    expect(s.roundWind).toBe('E');
    expect(s.handNumber).toBe(4);
  });
});
