/**
 * Settlement: turn a hand's 番 total into concrete money transfers between
 * players.
 *
 * The payment one losing player owes is:
 *
 *     底 + 番總 × 番底
 *
 * where 番總 already includes any 連莊 / 拉莊 番 (the pattern evaluators add
 * those upstream), 底 is a fixed per-hand base, and 番底 is a per-番 multiplier
 * that defaults to 1 — so by default the formula is simply `底 + 番總`.
 *
 * - Win by discard (放銃): only the discarder pays, unless `splitDiscardPayment`.
 * - Self-draw (自摸): each of the other three players pays the full amount.
 */

export interface SettlementRules {
  /** 底 — fixed base every loser pays on top of the 番. */
  base: number;
  /** 番底 — value of one 番. Default 1. */
  fanValue?: number;
  /** 放銃三家分 — split a discard win across all three losers instead of the
   *  discarder alone. Default false (standard 放銃一家付). */
  splitDiscardPayment?: boolean;
}

export interface SettlementInput {
  /** 番總 — hand 番 + 連莊/拉莊 番, already summed. */
  fanTotal: number;
  /** The four seat indices in play, e.g. [0, 1, 2, 3]. */
  seats: number[];
  winnerSeat: number;
  /** Discarder's seat, or null for a self-draw (自摸). */
  discarderSeat: number | null;
  rules: SettlementRules;
}

export interface Transfer {
  from: number;
  to: number;
  amount: number;
  reason: string;
}

/** `底 + 番總 × 番底` — what a single losing player owes. */
export function amountPerLoser(fanTotal: number, rules: SettlementRules): number {
  return rules.base + fanTotal * (rules.fanValue ?? 1);
}

export function settle(input: SettlementInput): Transfer[] {
  const full = amountPerLoser(input.fanTotal, input.rules);
  const losers = input.seats.filter((s) => s !== input.winnerSeat);

  if (input.discarderSeat === null) {
    return losers.map((from) => ({
      from,
      to: input.winnerSeat,
      amount: full,
      reason: '自摸',
    }));
  }

  if (input.rules.splitDiscardPayment) {
    const share = full / losers.length;
    return losers.map((from) => ({
      from,
      to: input.winnerSeat,
      amount: share,
      reason: '放銃分攤',
    }));
  }

  return [
    {
      from: input.discarderSeat,
      to: input.winnerSeat,
      amount: full,
      reason: '放銃',
    },
  ];
}

/** Net position per seat from a list of transfers (positive = receives). */
export function netBySeat(transfers: Transfer[]): Map<number, number> {
  const net = new Map<number, number>();
  const bump = (seat: number, delta: number) => net.set(seat, (net.get(seat) ?? 0) + delta);
  for (const t of transfers) {
    bump(t.from, -t.amount);
    bump(t.to, t.amount);
  }
  return net;
}
