import { describe, expect, it } from 'vitest';

import {
  canCalculate,
  expectedConcealedCount,
  initialScoringDraft,
  scoringDraftReducer,
  tileUsage,
  type ScoringDraft,
  type ScoringDraftAction,
} from './scoring-draft';

const run = (draft: ScoringDraft, actions: ScoringDraftAction[]): ScoringDraft =>
  actions.reduce(scoringDraftReducer, draft);

describe('expectedConcealedCount', () => {
  it('is (5 - melds) * 3 + 2', () => {
    expect(expectedConcealedCount(0)).toBe(17);
    expect(expectedConcealedCount(1)).toBe(14);
    expect(expectedConcealedCount(2)).toBe(11);
    expect(expectedConcealedCount(4)).toBe(5);
  });
});

describe('scoringDraftReducer', () => {
  it('returns a new reference on change and the same reference on a no-op', () => {
    const start = initialScoringDraft();
    const added = scoringDraftReducer(start, { type: 'ADD_TILE', tile: 'm1' });
    expect(added).not.toBe(start);
    expect(added.hand).not.toBe(start.hand);

    // removing an out-of-range index is a no-op
    const noop = scoringDraftReducer(added, { type: 'REMOVE_CONCEALED', index: 9 });
    expect(noop).toBe(added);
  });

  it('routes ADD_TILE to the focused bucket and caps a tile at 4 copies', () => {
    let draft = run(initialScoringDraft(), [
      { type: 'ADD_TILE', tile: 'm1' },
      { type: 'ADD_TILE', tile: 'm1' },
      { type: 'ADD_TILE', tile: 'm1' },
      { type: 'ADD_TILE', tile: 'm1' },
      { type: 'ADD_TILE', tile: 'm1' }, // 5th ignored
    ]);
    expect(draft.hand.concealed).toEqual(['m1', 'm1', 'm1', 'm1']);

    draft = run(draft, [
      { type: 'ADD_MELD' }, // focus jumps to the new meld
      { type: 'SET_MELD_KIND', index: 0, kind: 'pon' },
      { type: 'ADD_TILE', tile: 'p5' },
      { type: 'ADD_TILE', tile: 'p5' },
      { type: 'ADD_TILE', tile: 'p5' },
      { type: 'ADD_TILE', tile: 'p5' }, // pon is full at 3
    ]);
    expect(draft.hand.melds[0].tiles).toEqual(['p5', 'p5', 'p5']);
    expect(draft.hand.focus).toEqual({ kind: 'meld', index: 0 });
  });

  it('caps flowers at one copy each regardless of focus', () => {
    const draft = run(initialScoringDraft(), [
      { type: 'ADD_FLOWER', tile: 'hp1' },
      { type: 'ADD_FLOWER', tile: 'hp1' }, // ignored
      { type: 'ADD_FLOWER', tile: 'hs2' },
    ]);
    expect(draft.hand.flowers).toEqual(['hp1', 'hs2']);
    expect(tileUsage(draft).get('hp1')).toBe(1);
  });

  it('keeps winningIndex pointing at the same tile when an earlier tile is removed', () => {
    let draft = run(initialScoringDraft(), [
      { type: 'ADD_TILE', tile: 'm1' },
      { type: 'ADD_TILE', tile: 'm2' },
      { type: 'ADD_TILE', tile: 'm3' },
      { type: 'MARK_WINNING', index: 2 },
    ]);
    expect(draft.hand.winningIndex).toBe(2);

    draft = scoringDraftReducer(draft, { type: 'REMOVE_CONCEALED', index: 0 });
    expect(draft.hand.concealed).toEqual(['m2', 'm3']);
    expect(draft.hand.winningIndex).toBe(1);

    draft = scoringDraftReducer(draft, { type: 'REMOVE_CONCEALED', index: 1 });
    expect(draft.hand.winningIndex).toBeNull();
  });

  it('toggles the winning mark off when the same tile is marked twice', () => {
    const draft = run(initialScoringDraft(), [
      { type: 'ADD_TILE', tile: 'm1' },
      { type: 'MARK_WINNING', index: 0 },
      { type: 'MARK_WINNING', index: 0 },
    ]);
    expect(draft.hand.winningIndex).toBeNull();
  });

  it('trims meld tiles and clears 暗槓 when the kind shrinks from kan', () => {
    let draft = run(initialScoringDraft(), [
      { type: 'ADD_MELD' },
      { type: 'SET_MELD_KIND', index: 0, kind: 'kan' },
      { type: 'ADD_TILE', tile: 's7' },
      { type: 'ADD_TILE', tile: 's7' },
      { type: 'ADD_TILE', tile: 's7' },
      { type: 'ADD_TILE', tile: 's7' },
      { type: 'SET_MELD_CONCEALED', index: 0, value: true },
    ]);
    expect(draft.hand.melds[0].tiles).toHaveLength(4);
    expect(draft.hand.melds[0].concealed).toBe(true);

    draft = scoringDraftReducer(draft, { type: 'SET_MELD_KIND', index: 0, kind: 'pon' });
    expect(draft.hand.melds[0].tiles).toEqual(['s7', 's7', 's7']);
    expect(draft.hand.melds[0].concealed).toBe(false);
  });

  it('re-homes focus when the focused meld is removed', () => {
    const draft = run(initialScoringDraft(), [
      { type: 'ADD_MELD' },
      { type: 'ADD_MELD' },
      { type: 'SET_FOCUS', bucket: { kind: 'meld', index: 1 } },
      { type: 'REMOVE_MELD', index: 1 },
    ]);
    expect(draft.hand.melds).toHaveLength(1);
    expect(draft.hand.focus).toEqual({ kind: 'concealed' });
  });

  it('never lets the discarder seat equal the winner seat', () => {
    const draft = scoringDraftReducer(initialScoringDraft(), {
      type: 'SET_RULES',
      patch: { winnerSeat: 1 },
    });
    expect(draft.rules.winnerSeat).toBe(1);
    expect(draft.rules.discarderSeat).not.toBe(1);
  });
});

describe('canCalculate', () => {
  it('is false until the hand is structurally complete', () => {
    const empty = initialScoringDraft();
    expect(canCalculate(empty)).toBe(false);

    // 17 concealed tiles (no melds) that form 對對 shape, winning tile marked
    const tiles = [
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
      's9',
      'dR',
      'dR',
    ] as const;
    let draft = tiles.reduce<ScoringDraft>(
      (d, tile) => scoringDraftReducer(d, { type: 'ADD_TILE', tile }),
      empty,
    );
    expect(canCalculate(draft)).toBe(false); // no winning tile yet

    draft = scoringDraftReducer(draft, { type: 'MARK_WINNING', index: 14 });
    expect(canCalculate(draft)).toBe(true);

    draft = scoringDraftReducer(draft, { type: 'SET_RULES', patch: { base: '-1' } });
    expect(canCalculate(draft)).toBe(false); // 底 must be >= 0
  });
});
