import { describe, it, expect } from 'vitest';
import {
  isLegalCall,
  isAuctionComplete,
  isPassedOut,
  deriveContract,
  seatToBid,
  lastContractBid,
  currentDoubleState,
} from './auction';
import type { BidEntry, Call, Seat } from './types';

// Helper: build an auction from the dealer and a list of calls (turn order
// derived automatically), so tests read like a real auction.
function auction(dealer: Seat, calls: Call[]): BidEntry[] {
  const seats: Seat[] = ['North', 'East', 'South', 'West'];
  const start = seats.indexOf(dealer);
  return calls.map((call, i) => ({ seat: seats[(start + i) % 4], call }));
}

const bid = (level: number, strain: string): Call =>
  ({ kind: 'bid', level, strain } as Call);
const pass: Call = { kind: 'pass' };
const dbl: Call = { kind: 'double' };
const redbl: Call = { kind: 'redouble' };

describe('seatToBid', () => {
  it('opens with the dealer and rotates clockwise', () => {
    expect(seatToBid('North', [])).toBe('North');
    expect(seatToBid('North', auction('North', [pass]))).toBe('East');
    expect(seatToBid('North', auction('North', [pass, pass, pass]))).toBe('West');
    expect(seatToBid('North', auction('North', [pass, pass, pass, pass]))).toBe('North');
  });
});

describe('isLegalCall — bids must outrank', () => {
  it('any opening bid is legal', () => {
    expect(isLegalCall(bid(1, 'C'), 'North', [])).toBe(true);
    expect(isLegalCall(bid(7, 'NT'), 'North', [])).toBe(true);
  });
  it('a higher bid is legal, an equal or lower one is not', () => {
    const bids = auction('North', [bid(2, 'H')]);
    expect(isLegalCall(bid(2, 'S'), 'North', bids)).toBe(true); // same level, higher strain
    expect(isLegalCall(bid(3, 'C'), 'North', bids)).toBe(true); // higher level
    expect(isLegalCall(bid(2, 'H'), 'North', bids)).toBe(false); // equal
    expect(isLegalCall(bid(2, 'C'), 'North', bids)).toBe(false); // lower strain
    expect(isLegalCall(bid(1, 'NT'), 'North', bids)).toBe(false); // lower level
  });
  it('strain ranking is C<D<H<S<NT', () => {
    const bids = auction('North', [bid(1, 'C')]);
    for (const s of ['D', 'H', 'S', 'NT']) {
      expect(isLegalCall(bid(1, s), 'North', bids)).toBe(true);
    }
  });
});

describe('isLegalCall — pass is always legal', () => {
  it('passes are legal at any point', () => {
    expect(isLegalCall(pass, 'North', [])).toBe(true);
    expect(isLegalCall(pass, 'North', auction('North', [bid(1, 'C')]))).toBe(true);
  });
});

describe('isLegalCall — double', () => {
  it('illegal with no contract bid', () => {
    expect(isLegalCall(dbl, 'North', [])).toBe(false);
  });
  it('legal against an opponent, illegal against your own side', () => {
    // N opens 1H; East (opponent) may double.
    expect(isLegalCall(dbl, 'North', auction('North', [bid(1, 'H')]))).toBe(true);
    // N 1H, E pass, S (partner) may NOT double N's bid.
    expect(isLegalCall(dbl, 'North', auction('North', [bid(1, 'H'), pass]))).toBe(false);
  });
  it('illegal when already doubled', () => {
    const bids = auction('North', [bid(1, 'H'), dbl]);
    expect(isLegalCall(dbl, 'North', bids)).toBe(false);
  });
  it('legal even after intervening passes (1H-P-P-X)', () => {
    expect(isLegalCall(dbl, 'North', auction('North', [bid(1, 'H'), pass, pass]))).toBe(true);
  });
});

describe('isLegalCall — redouble', () => {
  it('only by the doubled side, when doubled', () => {
    // N 1H, E X → South (N/S, the doubled side) may redouble.
    const bids = auction('North', [bid(1, 'H'), dbl]);
    expect(seatToBid('North', bids)).toBe('South');
    expect(isLegalCall(redbl, 'North', bids)).toBe(true);
  });
  it('illegal by the doubling side', () => {
    // N 1H, E X, S pass → West (E/W, doubling side) may NOT redouble.
    const bids = auction('North', [bid(1, 'H'), dbl, pass]);
    expect(isLegalCall(redbl, 'North', bids)).toBe(false);
  });
  it('illegal when not doubled', () => {
    expect(isLegalCall(redbl, 'North', auction('North', [bid(1, 'H')]))).toBe(false);
  });
  it('illegal with no contract bid at all', () => {
    expect(isLegalCall(redbl, 'North', auction('North', [pass]))).toBe(false);
  });
});

describe('currentDoubleState resets on a new contract bid', () => {
  it('a fresh bid clears doubling', () => {
    const bids = auction('North', [bid(1, 'H'), dbl, redbl, bid(2, 'H')]);
    expect(currentDoubleState(bids)).toBe('none');
  });
});

describe('isAuctionComplete', () => {
  it('not complete under four calls', () => {
    expect(isAuctionComplete(auction('North', [pass, pass, pass]))).toBe(false);
  });
  it('three passes after a bid completes the auction', () => {
    expect(isAuctionComplete(auction('North', [bid(1, 'H'), pass, pass, pass]))).toBe(true);
  });
  it('two passes after a bid is not complete', () => {
    expect(isAuctionComplete(auction('North', [bid(1, 'H'), pass, pass]))).toBe(false);
  });
  it('four opening passes complete (passed out)', () => {
    expect(isAuctionComplete(auction('North', [pass, pass, pass, pass]))).toBe(true);
  });
});

describe('isPassedOut', () => {
  it('true only for exactly four opening passes', () => {
    expect(isPassedOut(auction('North', [pass, pass, pass, pass]))).toBe(true);
    expect(isPassedOut(auction('North', [bid(1, 'H'), pass, pass, pass]))).toBe(false);
  });
});

describe('lastContractBid', () => {
  it('finds the highest/last actual bid, ignoring passes and doubles', () => {
    const bids = auction('North', [bid(1, 'H'), bid(2, 'S'), dbl, pass]);
    expect(lastContractBid(bids)).toMatchObject({ level: 2, strain: 'S', seat: 'East' });
  });
  it('returns null with no bids', () => {
    expect(lastContractBid(auction('North', [pass, pass]))).toBeNull();
  });
});

describe('deriveContract', () => {
  it('passed out → null', () => {
    expect(deriveContract('North', auction('North', [pass, pass, pass, pass]))).toBeNull();
  });
  it('declarer is the first of the winning pair to name the strain', () => {
    // N 1H, P, S 2H, P, P, P → contract 2H by N/S; North named hearts first.
    const bids = auction('North', [bid(1, 'H'), pass, bid(2, 'H'), pass, pass, pass]);
    expect(deriveContract('North', bids)).toMatchObject({
      level: 2,
      strain: 'H',
      declarer: 'North',
      doubled: 'none',
    });
  });
  it('partner who bid the strain first is declarer, not the last bidder', () => {
    // Dealer South. S 1S, P, N 4S, P, P, P → 4S by N/S; South named spades first.
    const bids = auction('South', [bid(1, 'S'), pass, bid(4, 'S'), pass, pass, pass]);
    expect(deriveContract('South', bids)).toMatchObject({ strain: 'S', declarer: 'South' });
  });
  it('carries the doubling state', () => {
    const bids = auction('North', [bid(1, 'H'), dbl, redbl, pass, pass, pass]);
    expect(deriveContract('North', bids)?.doubled).toBe('redoubled');
  });
});
