// Auction rules: legality, turn order, completion, and contract/declarer
// derivation. A direct, typed port of the prototype engine (the behavioural
// source of truth) — see docs/bridge-prototype.html and API_SPEC.md §6.

import { bidRank, nextSeat, pairOf } from './constants';
import type { BidEntry, Call, Contract, ContractBid, Doubling, Seat } from './types';

/** The most recent actual contract bid (ignoring passes/doubles), or null. */
export function lastContractBid(bids: BidEntry[]): ContractBid | null {
  for (let i = bids.length - 1; i >= 0; i--) {
    const c = bids[i].call;
    if (c.kind === 'bid') return { level: c.level, strain: c.strain, seat: bids[i].seat };
  }
  return null;
}

/** The live doubling state. A new contract bid resets it to 'none'. */
export function currentDoubleState(bids: BidEntry[]): Doubling {
  let st: Doubling = 'none';
  for (const b of bids) {
    if (b.call.kind === 'bid') st = 'none';
    else if (b.call.kind === 'double') st = 'doubled';
    else if (b.call.kind === 'redouble') st = 'redoubled';
  }
  return st;
}

/** Whose turn it is, given the dealer opens and play rotates clockwise. */
export function seatToBid(dealer: Seat, bids: BidEntry[]): Seat {
  let seat = dealer;
  for (let i = 0; i < bids.length; i++) seat = nextSeat(seat);
  return seat;
}

/** Whether a call is legal for the seat currently on turn. */
export function isLegalCall(call: Call, dealer: Seat, bids: BidEntry[]): boolean {
  const turn = seatToBid(dealer, bids);
  if (call.kind === 'pass') return true;

  if (call.kind === 'bid') {
    const last = lastContractBid(bids);
    if (!last) return true;
    return bidRank(call.level, call.strain) > bidRank(last.level, last.strain);
  }

  if (call.kind === 'double') {
    // Only against a live opposing contract bid, when not already doubled.
    const last = lastContractBid(bids);
    if (!last) return false;
    if (pairOf(last.seat) === pairOf(turn)) return false;
    return currentDoubleState(bids) === 'none';
  }

  if (call.kind === 'redouble') {
    // Only by the side whose contract bid was doubled.
    const last = lastContractBid(bids);
    if (!last) return false;
    if (pairOf(last.seat) !== pairOf(turn)) return false;
    return currentDoubleState(bids) === 'doubled';
  }

  return false;
}

/** Auction closes after three passes following a bid, or four passes from the open. */
export function isAuctionComplete(bids: BidEntry[]): boolean {
  if (bids.length < 4) return false;
  const last3 = bids.slice(-3);
  const allPass3 = last3.every((b) => b.call.kind === 'pass');
  const hasBid = bids.some((b) => b.call.kind === 'bid');
  if (allPass3 && hasBid) return true;
  if (bids.length === 4 && bids.every((b) => b.call.kind === 'pass')) return true;
  return false;
}

/** Four passes with no contract bid — no contract this board. */
export function isPassedOut(bids: BidEntry[]): boolean {
  return bids.length === 4 && bids.every((b) => b.call.kind === 'pass');
}

/**
 * Derive the final contract: level/strain of the last contract bid, doubling
 * state, and the declarer = the first player of the winning partnership to have
 * named the final strain (API_SPEC.md §6).
 */
export function deriveContract(dealer: Seat, bids: BidEntry[]): Contract | null {
  const last = lastContractBid(bids);
  if (!last) return null;
  const winningPair = pairOf(last.seat);
  let declarer: Seat | null = null;
  let seat = dealer;
  for (const b of bids) {
    if (b.call.kind === 'bid' && b.call.strain === last.strain && pairOf(seat) === winningPair) {
      declarer = seat;
      break;
    }
    seat = nextSeat(seat);
  }
  return {
    level: last.level,
    strain: last.strain,
    declarer: declarer ?? last.seat,
    doubled: currentDoubleState(bids),
  };
}
