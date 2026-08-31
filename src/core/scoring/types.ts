import type { FlowerTileId, PlayingTileId } from '../tiles/tiles';
import type { Wind } from '../game-state/rotation';

/** An exposed meld the winner had on the table. */
export interface Meld {
  kind: 'chi' | 'pon' | 'kan';
  tiles: PlayingTileId[];
  /** Was the kan concealed (暗槓)? */
  concealed?: boolean;
}

export interface Hand {
  /** Concealed tiles in hand, NOT including the winning tile. */
  concealed: PlayingTileId[];
  melds: Meld[];
  /** The tile that completed the hand. */
  winningTile: PlayingTileId;
  /** Flowers the winner had drawn. */
  flowers: FlowerTileId[];
}

export interface HandContext {
  seatWind: Wind; // 門風
  roundWind: Wind; // 圈風
  isDealer: boolean; // 莊家
  linZong: number; // 連莊 count (0 = first hand as dealer)
  selfDraw: boolean; // 自摸
  /** Event flags that carry 番 in most Taiwanese rule sets. */
  flags?: Partial<{
    robbingKan: boolean; // 搶槓
    lastTile: boolean; // 海底撈月 / 河底撈魚
    kanDraw: boolean; // 槓上開花
    heavenly: boolean; // 天胡
    earthly: boolean; // 地胡
  }>;
}

/** One scored pattern line, e.g. { name: '對對糊', fan: 40 }. */
export interface FanLine {
  name: string;
  fan: number;
}

export interface ScoreResult {
  lines: FanLine[];
  /** 番總 — sum of every line's 番. */
  fanTotal: number;
}
