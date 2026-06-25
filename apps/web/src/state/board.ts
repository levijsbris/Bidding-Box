import { dealerForBoard, vulForBoard } from '../domain';
import type { BoardState } from './types';

/**
 * A fresh board for the given number. When vulnerability tracking is off we
 * score every board non-vulnerable (a deliberate fix to the prototype, which
 * always applied the cycle — see biddingbox-build-decisions).
 */
export function freshBoard(n: number, trackVulnerability: boolean): BoardState {
  return {
    boardNumber: n,
    dealer: dealerForBoard(n),
    vulnerability: trackVulnerability ? vulForBoard(n) : 'None',
    bids: [],
    contract: null,
    nsTricks: 0,
  };
}
