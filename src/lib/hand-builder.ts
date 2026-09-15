/**
 * Turn an assembled `ScoringDraft` into a `core/scoring` `Hand`, or throw a
 * `HandBuildError` whose message is safe to show the user inline.
 *
 * Pure: no framework imports. May import from src/core.
 */

import { rankOf, suitOf, type PlayingTileId } from '../core/tiles/tiles';
import type { Hand, Meld } from '../core/scoring';
import {
  expectedConcealedCount,
  meldCapacity,
  type MeldDraft,
  type ScoringDraft,
} from './scoring-draft';

export class HandBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HandBuildError';
  }
}

const KIND_LABEL = { chi: '吃', pon: '碰', kan: '槓' } as const;

function validateMeld(meld: MeldDraft, index: number): void {
  const label = `Meld ${index + 1}`;
  const kindName = KIND_LABEL[meld.kind];

  if (meld.tiles.length !== meldCapacity(meld.kind)) {
    throw new HandBuildError(
      `${label}: a ${kindName} needs ${meldCapacity(meld.kind)} tiles, has ${meld.tiles.length}.`,
    );
  }

  if (meld.kind === 'pon' || meld.kind === 'kan') {
    if (!meld.tiles.every((t) => t === meld.tiles[0])) {
      throw new HandBuildError(`${label}: a ${kindName} must be the same tile repeated.`);
    }
    return;
  }

  // chi — three consecutive tiles of one suit
  const suits = new Set(meld.tiles.map((t) => suitOf(t)));
  if (suits.size !== 1 || suits.has(null)) {
    throw new HandBuildError(`${label}: a ${kindName} must be three tiles of one suit.`);
  }
  const ranks = meld.tiles.map((t) => rankOf(t) as number).sort((a, b) => a - b);
  if (ranks[1] !== ranks[0] + 1 || ranks[2] !== ranks[1] + 1) {
    throw new HandBuildError(`${label}: a ${kindName} must be three consecutive tiles.`);
  }
}

export function buildHand(draft: ScoringDraft): Hand {
  const { hand } = draft;
  const target = expectedConcealedCount(hand.melds.length);

  if (hand.concealed.length !== target) {
    throw new HandBuildError(
      `Need ${target} concealed tiles (winning tile included) for ${hand.melds.length} meld(s), have ${hand.concealed.length}.`,
    );
  }
  if (
    hand.winningIndex === null ||
    hand.winningIndex < 0 ||
    hand.winningIndex >= hand.concealed.length
  ) {
    throw new HandBuildError('Mark which tile you won on (tap ☆ on a concealed tile).');
  }

  hand.melds.forEach(validateMeld);

  const concealed: PlayingTileId[] = [...hand.concealed];
  const [winningTile] = concealed.splice(hand.winningIndex, 1);

  const melds: Meld[] = hand.melds.map((m) => ({
    kind: m.kind,
    tiles: [...m.tiles],
    ...(m.kind === 'kan' ? { concealed: m.concealed } : {}),
  }));

  return { concealed, melds, winningTile, flowers: [...hand.flowers] };
}
