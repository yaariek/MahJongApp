/**
 * Tile → display string. Two modes:
 *   'glyph' — Unicode Mahjong Tiles block (U+1F000–U+1F02B)
 *   'label' — Han characters, never depends on the Unicode block (fallback for
 *             devices whose system font lacks / mangles the tile glyphs)
 *
 * Pure: no framework imports. May import from src/core.
 *
 * The Unicode block orders the number suits 萬 → 條 → 筒, which is NOT core's
 * canonical 萬 → 筒 → 條 (`SUITS = ['m','p','s']`). And in the flower block,
 * BAMBOO (竹, U+1F024) comes before CHRYSANTHEMUM (菊, U+1F025), the reverse of
 * core's `hp1..hp4` = 梅蘭菊竹. So we branch per family and never linear-index
 * into `PLAYING_TILES`. `tile-glyph.test.ts` pins every family.
 */

import {
  DRAGON_TILES,
  FLOWER_TILES,
  WIND_TILES,
  isFlower,
  isSuited,
  type DragonTileId,
  type TileId,
  type WindTileId,
} from '../core/tiles/tiles';

export type RenderMode = 'glyph' | 'label';

/** Default rendering for the tile picker. Flip to 'label' to debug font gaps. */
export const RENDER_MODE: RenderMode = 'glyph';

const CODEPOINT_M1 = 0x1f007; // 🀇  萬 1..9  → U+1F007..U+1F00F
const CODEPOINT_S1 = 0x1f010; // 🀐  條 1..9  → U+1F010..U+1F018
const CODEPOINT_P1 = 0x1f019; // 🀙  筒 1..9  → U+1F019..U+1F021
const CODEPOINT_WIND_E = 0x1f000; // 🀀  東南西北 → U+1F000..U+1F003
const CODEPOINT_DRAGON_R = 0x1f004; // 🀄  中發白  → U+1F004..U+1F006
const CODEPOINT_SEASON_1 = 0x1f026; // 🀦  春夏秋冬 → U+1F026..U+1F029

/** hp1..hp4 = 梅蘭菊竹; the block swaps bamboo (竹) and chrysanthemum (菊). */
const PLANT_FLOWER_CODEPOINT: Record<'hp1' | 'hp2' | 'hp3' | 'hp4', number> = {
  hp1: 0x1f022, // 梅 plum
  hp2: 0x1f023, // 蘭 orchid
  hp3: 0x1f025, // 菊 chrysanthemum
  hp4: 0x1f024, // 竹 bamboo
};

const SUIT_LABEL = { m: '萬', p: '筒', s: '條' } as const;
const WIND_LABEL: Record<WindTileId, string> = { wE: '東', wS: '南', wW: '西', wN: '北' };
const DRAGON_LABEL: Record<DragonTileId, string> = { dR: '中', dG: '發', dW: '白' };
const FLOWER_LABEL: Record<string, string> = {
  hp1: '梅',
  hp2: '蘭',
  hp3: '菊',
  hp4: '竹',
  hs1: '春',
  hs2: '夏',
  hs3: '秋',
  hs4: '冬',
};

function isPlantFlower(id: string): id is 'hp1' | 'hp2' | 'hp3' | 'hp4' {
  return id === 'hp1' || id === 'hp2' || id === 'hp3' || id === 'hp4';
}

/** Unicode Mahjong Tile glyph for a tile id. */
export function tileGlyph(id: TileId): string {
  if (isSuited(id)) {
    const base = id[0] === 'm' ? CODEPOINT_M1 : id[0] === 's' ? CODEPOINT_S1 : CODEPOINT_P1;
    return String.fromCodePoint(base + Number(id[1]) - 1);
  }
  if (isFlower(id)) {
    if (isPlantFlower(id)) return String.fromCodePoint(PLANT_FLOWER_CODEPOINT[id]);
    // seasons hs1..hs4 sit at FLOWER_TILES index 4..7
    return String.fromCodePoint(CODEPOINT_SEASON_1 + FLOWER_TILES.indexOf(id) - 4);
  }
  if (id[0] === 'w') {
    return String.fromCodePoint(CODEPOINT_WIND_E + WIND_TILES.indexOf(id as WindTileId));
  }
  return String.fromCodePoint(CODEPOINT_DRAGON_R + DRAGON_TILES.indexOf(id as DragonTileId));
}

/** Han-character label for a tile id (independent of the Unicode block). */
export function tileLabel(id: TileId): string {
  if (isSuited(id)) return `${id[1]}${SUIT_LABEL[id[0] as keyof typeof SUIT_LABEL]}`;
  if (isFlower(id)) return FLOWER_LABEL[id];
  if (id[0] === 'w') return WIND_LABEL[id as WindTileId];
  return DRAGON_LABEL[id as DragonTileId];
}

/** What `<TileFace>` should render for the given mode. */
export function tileText(id: TileId, mode: RenderMode = RENDER_MODE): string {
  return mode === 'glyph' ? tileGlyph(id) : tileLabel(id);
}
