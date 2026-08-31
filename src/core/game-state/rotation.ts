/**
 * Seat winds and dealer / round-wind rotation for Taiwanese mahjong.
 *
 * Four players sit in a fixed order, addressed by seat index 0..3. One seat is
 * the dealer (莊家). The dealer's seat wind (門風) is 東; going counter-clockwise
 * in play order the others are 南, 西, 北. The round wind (圈風) starts at 東 and
 * advances every time the dealer button completes a full lap of the table.
 *
 * A game runs `totalRounds` round-winds (default 4 → 東南西北, i.e. "四圈"); set
 * it to 1 for a quick 東-only game. When the dealer would lap past the starting
 * seat on the final round, the game is finished.
 */

export type Wind = 'E' | 'S' | 'W' | 'N';
export const WINDS: readonly Wind[] = ['E', 'S', 'W', 'N'] as const;

export interface RotationState {
  /** Seat index 0..3 currently holding the dealer button. */
  dealerSeat: number;
  /** 圈風 for the current hand. */
  roundWind: Wind;
  /** Consecutive hands the current dealer has held the button (0 on their first). */
  linZong: number;
  /** 1-based counter over every hand played in the game. */
  handNumber: number;
  /** Seat that opened the current round; used to detect a full lap. */
  roundStartSeat: number;
  /** How many round-winds this game plays before finishing. */
  totalRounds: number;
  /** Zero-based index of the round wind currently in progress. */
  roundIndex: number;
  finished: boolean;
}

export type HandResult =
  | { type: 'dealerWin' }
  | { type: 'nonDealerWin' }
  /** 荒莊 — nobody wins. */
  | { type: 'draw' };

export interface RotationConfig {
  dealerSeat?: number;
  totalRounds?: number;
  /** Does a 荒莊 keep the dealer in place? True in most house rules. */
  drawKeepsDealer?: boolean;
}

export function initialRotation(config: RotationConfig = {}): RotationState {
  const dealerSeat = config.dealerSeat ?? 0;
  return {
    dealerSeat,
    roundWind: WINDS[0],
    linZong: 0,
    handNumber: 1,
    roundStartSeat: dealerSeat,
    totalRounds: config.totalRounds ?? 4,
    roundIndex: 0,
    finished: false,
  };
}

/** 門風 for a seat: dealer is 東, then 南 / 西 / 北 counter-clockwise. */
export function seatWind(state: RotationState, seat: number): Wind {
  const offset = (((seat - state.dealerSeat) % 4) + 4) % 4;
  return WINDS[offset];
}

/** Apply a hand result and return the next rotation state (pure). */
export function nextRotation(
  state: RotationState,
  result: HandResult,
  config: RotationConfig = {},
): RotationState {
  if (state.finished) return state;

  const drawKeepsDealer = config.drawKeepsDealer ?? true;
  const dealerKeeps = result.type === 'dealerWin' || (result.type === 'draw' && drawKeepsDealer);

  if (dealerKeeps) {
    return {
      ...state,
      linZong: state.linZong + 1,
      handNumber: state.handNumber + 1,
    };
  }

  const nextDealer = (state.dealerSeat + 1) % 4;
  const lappedRound = nextDealer === state.roundStartSeat;

  let { roundWind, roundIndex, roundStartSeat } = state;
  let finished = false;

  if (lappedRound) {
    roundIndex += 1;
    if (roundIndex >= state.totalRounds) {
      finished = true;
    } else {
      roundWind = WINDS[roundIndex % WINDS.length];
      roundStartSeat = nextDealer;
    }
  }

  return {
    ...state,
    dealerSeat: nextDealer,
    roundWind,
    roundIndex,
    roundStartSeat,
    linZong: 0,
    handNumber: state.handNumber + 1,
    finished,
  };
}
