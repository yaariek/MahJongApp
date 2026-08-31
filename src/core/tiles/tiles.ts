/**
 * The Taiwanese tile vocabulary: 34 playing tiles + 8 flowers = 42 faces.
 *
 * A tile is identified by a short string id so hands are easy to log, diff,
 * and feed to / from the recognition layer:
 *
 *   m1..m9   萬  (characters / wan)
 *   p1..p9   筒  (dots / tong)
 *   s1..s9   條  (bamboo / tiao)
 *   wE wS wW wN   winds  東南西北
 *   dR dG dW      dragons 紅中 / 青發 / 白板
 *   hp1..hp4     flowers – plants  梅蘭菊竹
 *   hs1..hs4     flowers – seasons 春夏秋冬
 */

export type Suit = 'm' | 'p' | 's';
export const SUITS: readonly Suit[] = ['m', 'p', 's'] as const;

export type SuitTileId = `${Suit}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`;
export type WindTileId = 'wE' | 'wS' | 'wW' | 'wN';
export type DragonTileId = 'dR' | 'dG' | 'dW';
export type HonorTileId = WindTileId | DragonTileId;
export type FlowerTileId = 'hp1' | 'hp2' | 'hp3' | 'hp4' | 'hs1' | 'hs2' | 'hs3' | 'hs4';

/** Any tile that can be part of a hand (excludes flowers, which sit to the side). */
export type PlayingTileId = SuitTileId | HonorTileId;
export type TileId = PlayingTileId | FlowerTileId;

export const WIND_TILES: readonly WindTileId[] = ['wE', 'wS', 'wW', 'wN'] as const;
export const DRAGON_TILES: readonly DragonTileId[] = ['dR', 'dG', 'dW'] as const;
export const FLOWER_TILES: readonly FlowerTileId[] = [
  'hp1',
  'hp2',
  'hp3',
  'hp4',
  'hs1',
  'hs2',
  'hs3',
  'hs4',
] as const;

export const SUIT_TILES: readonly SuitTileId[] = SUITS.flatMap((suit) =>
  ([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((n) => `${suit}${n}` as SuitTileId),
);

export const PLAYING_TILES: readonly PlayingTileId[] = [
  ...SUIT_TILES,
  ...WIND_TILES,
  ...DRAGON_TILES,
];

export const ALL_TILES: readonly TileId[] = [...PLAYING_TILES, ...FLOWER_TILES];

export function isFlower(id: TileId): id is FlowerTileId {
  return id.startsWith('h');
}

export function isHonor(id: TileId): id is HonorTileId {
  return id.startsWith('w') || id.startsWith('d');
}

export function isSuited(id: TileId): id is SuitTileId {
  return id.length === 2 && (id[0] === 'm' || id[0] === 'p' || id[0] === 's');
}

/** Numeric rank 1..9 for a suited tile, or null for honors / flowers. */
export function rankOf(id: TileId): number | null {
  return isSuited(id) ? Number(id[1]) : null;
}

export function suitOf(id: TileId): Suit | null {
  return isSuited(id) ? (id[0] as Suit) : null;
}
