import { describe, expect, it } from 'vitest';
import {
  ALL_TILES,
  FLOWER_TILES,
  PLAYING_TILES,
  isFlower,
  isHonor,
  isSuited,
  rankOf,
  suitOf,
} from './tiles';

describe('tile vocabulary', () => {
  it('has 34 playing tiles + 8 flowers = 42 faces', () => {
    expect(PLAYING_TILES).toHaveLength(34);
    expect(FLOWER_TILES).toHaveLength(8);
    expect(ALL_TILES).toHaveLength(42);
  });

  it('has no duplicate ids', () => {
    expect(new Set(ALL_TILES).size).toBe(ALL_TILES.length);
  });

  it('classifies tiles', () => {
    expect(isSuited('m1')).toBe(true);
    expect(isHonor('wE')).toBe(true);
    expect(isHonor('dR')).toBe(true);
    expect(isFlower('hs3')).toBe(true);
    expect(isSuited('wE')).toBe(false);
  });

  it('reads rank and suit of suited tiles', () => {
    expect(rankOf('p7')).toBe(7);
    expect(suitOf('p7')).toBe('p');
    expect(rankOf('wN')).toBeNull();
    expect(suitOf('dG')).toBeNull();
  });
});
