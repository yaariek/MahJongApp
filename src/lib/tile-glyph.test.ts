import { describe, expect, it } from 'vitest';

import { ALL_TILES } from '../core/tiles/tiles';
import { tileGlyph, tileLabel } from './tile-glyph';

describe('tileGlyph', () => {
  it('maps the three number suits to their per-suit Unicode base (block order 萬→條→筒)', () => {
    expect(tileGlyph('m1')).toBe(String.fromCodePoint(0x1f007));
    expect(tileGlyph('m9')).toBe(String.fromCodePoint(0x1f00f));
    expect(tileGlyph('s1')).toBe(String.fromCodePoint(0x1f010));
    expect(tileGlyph('s9')).toBe(String.fromCodePoint(0x1f018));
    expect(tileGlyph('p1')).toBe(String.fromCodePoint(0x1f019));
    expect(tileGlyph('p9')).toBe(String.fromCodePoint(0x1f021));
  });

  it('maps winds and dragons in block order', () => {
    expect(tileGlyph('wE')).toBe(String.fromCodePoint(0x1f000));
    expect(tileGlyph('wN')).toBe(String.fromCodePoint(0x1f003));
    expect(tileGlyph('dR')).toBe(String.fromCodePoint(0x1f004));
    expect(tileGlyph('dW')).toBe(String.fromCodePoint(0x1f006));
  });

  it('handles the bamboo/chrysanthemum swap in the flower block', () => {
    expect(tileGlyph('hp1')).toBe(String.fromCodePoint(0x1f022)); // 梅
    expect(tileGlyph('hp2')).toBe(String.fromCodePoint(0x1f023)); // 蘭
    expect(tileGlyph('hp3')).toBe(String.fromCodePoint(0x1f025)); // 菊
    expect(tileGlyph('hp4')).toBe(String.fromCodePoint(0x1f024)); // 竹
    expect(tileGlyph('hs1')).toBe(String.fromCodePoint(0x1f026)); // 春
    expect(tileGlyph('hs4')).toBe(String.fromCodePoint(0x1f029)); // 冬
  });

  it('produces a non-empty glyph and label for every one of the 42 tiles', () => {
    for (const id of ALL_TILES) {
      expect(tileGlyph(id).length).toBeGreaterThan(0);
      expect(tileLabel(id).length).toBeGreaterThan(0);
    }
  });
});

describe('tileLabel', () => {
  it('renders Han characters', () => {
    expect(tileLabel('m3')).toBe('3萬');
    expect(tileLabel('p5')).toBe('5筒');
    expect(tileLabel('s9')).toBe('9條');
    expect(tileLabel('wE')).toBe('東');
    expect(tileLabel('dG')).toBe('發');
    expect(tileLabel('hp3')).toBe('菊');
    expect(tileLabel('hs2')).toBe('夏');
  });
});
