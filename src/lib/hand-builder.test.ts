import { describe, expect, it } from 'vitest';

import { scoreHand, type Hand, type HandContext } from '../core/scoring';
import type { PlayingTileId } from '../core/tiles/tiles';
import { buildHand, HandBuildError } from './hand-builder';
import { initialScoringDraft, type MeldDraft, type ScoringDraft } from './scoring-draft';

/** A draft with the given concealed tiles, melds, and winning tile already set. */
function draftOf(
  concealed: PlayingTileId[],
  winningTile: PlayingTileId,
  melds: MeldDraft[] = [],
): ScoringDraft {
  const base = initialScoringDraft();
  const withWinning = [...concealed, winningTile];
  return {
    ...base,
    hand: {
      ...base.hand,
      concealed: withWinning,
      winningIndex: withWinning.length - 1,
      melds,
    },
  };
}

const ctx: HandContext = {
  seatWind: 'S',
  roundWind: 'E',
  isDealer: false,
  linZong: 0,
  selfDraw: false,
};

describe('buildHand', () => {
  it('reproduces the 平糊 fixture Hand and scores it through the engine', () => {
    const draft = draftOf(
      ['p1', 'p2', 'p4', 'p5', 'p6', 's1', 's2', 's3', 's7', 's8', 's9', 'm5', 'm5'],
      'p3',
      [{ kind: 'chi', tiles: ['m1', 'm2', 'm3'], concealed: false }],
    );

    const hand = buildHand(draft);

    expect(hand).toEqual<Hand>({
      concealed: ['p1', 'p2', 'p4', 'p5', 'p6', 's1', 's2', 's3', 's7', 's8', 's9', 'm5', 'm5'],
      winningTile: 'p3',
      melds: [{ kind: 'chi', tiles: ['m1', 'm2', 'm3'] }],
      flowers: [],
    });
    expect(scoreHand(hand, ctx)).toEqual({
      lines: [
        { name: '平糊', fan: 3 },
        { name: '三相逢', fan: 10 },
        { name: '將眼', fan: 1 },
        { name: '老少', fan: 2 },
        { name: '無字', fan: 1 },
      ],
      fanTotal: 17,
    });
  });

  it('carries the 暗槓 flag through only for a concealed kan', () => {
    const draft = draftOf(
      ['m1', 'm1', 'm1', 'p2', 'p2', 'p2', 's3', 's3', 's3', 'wE', 'wE', 'wE', 'dR'],
      'dR',
      [{ kind: 'kan', tiles: ['s9', 's9', 's9', 's9'], concealed: true }],
    );
    expect(buildHand(draft).melds).toEqual([
      { kind: 'kan', tiles: ['s9', 's9', 's9', 's9'], concealed: true },
    ]);
  });

  it('throws when the concealed count is wrong', () => {
    const draft = initialScoringDraft();
    draft.hand.concealed = ['m1', 'm2', 'm3'];
    draft.hand.winningIndex = 0;
    expect(() => buildHand(draft)).toThrow(HandBuildError);
    expect(() => buildHand(draft)).toThrow(/concealed tiles/);
  });

  it('throws when no winning tile is marked', () => {
    const draft = draftOf(
      [
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
        'dR',
        'dR',
        'dG',
        'dG',
      ],
      'dG',
    );
    draft.hand.winningIndex = null;
    expect(() => buildHand(draft)).toThrow(/Mark which tile/);
  });

  it('rejects a pon that is not one repeated tile', () => {
    // 4 melds → concealed bucket (winning tile included) must be 5
    const draft = draftOf(['s1', 's2', 's3', 'dR'], 'dR', [
      { kind: 'pon', tiles: ['p1', 'p2', 'p3'], concealed: false },
      { kind: 'pon', tiles: ['s5', 's5', 's5'], concealed: false },
      { kind: 'pon', tiles: ['m1', 'm1', 'm1'], concealed: false },
      { kind: 'pon', tiles: ['m9', 'm9', 'm9'], concealed: false },
    ]);
    expect(() => buildHand(draft)).toThrow(/same tile/);
  });

  it('rejects a chi that is not three consecutive tiles', () => {
    const draft = draftOf(['s1', 's2', 's3', 'dR'], 'dR', [
      { kind: 'chi', tiles: ['p1', 'p2', 'p4'], concealed: false },
      { kind: 'pon', tiles: ['s5', 's5', 's5'], concealed: false },
      { kind: 'pon', tiles: ['m1', 'm1', 'm1'], concealed: false },
      { kind: 'pon', tiles: ['m9', 'm9', 'm9'], concealed: false },
    ]);
    expect(() => buildHand(draft)).toThrow(/consecutive/);
  });

  it('rejects a meld with the wrong number of tiles', () => {
    // 1 meld → concealed bucket (winning tile included) must be 14
    const draft = draftOf(
      ['m1', 'm2', 'm3', 'p4', 'p5', 'p6', 's7', 's8', 's9', 'wE', 'wE', 'wE', 'dR'],
      'dR',
      [{ kind: 'chi', tiles: ['s1', 's2'], concealed: false }],
    );
    expect(() => buildHand(draft)).toThrow(/needs 3 tiles/);
  });
});
