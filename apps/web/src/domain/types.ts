// Core Bridge domain types. Pure, framework-free — this module is the on-device
// rules authority (ARCHITECTURE.md §2.1). Seat/strain spellings mirror the
// prototype, which is the behavioural source of truth.

export type Seat = 'North' | 'East' | 'South' | 'West';

/** Strain ranking order: clubs < diamonds < hearts < spades < no-trump. */
export type Strain = 'C' | 'D' | 'H' | 'S' | 'NT';

export type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Pair = 'NS' | 'EW';

export type Vulnerability = 'None' | 'NS' | 'EW' | 'Both';

export type Doubling = 'none' | 'doubled' | 'redoubled';

export type CallKind = 'bid' | 'pass' | 'double' | 'redouble';

export type Call =
  | { kind: 'bid'; level: Level; strain: Strain }
  | { kind: 'pass' }
  | { kind: 'double' }
  | { kind: 'redouble' };

/** One entry in an auction: a call made by a seat. */
export interface BidEntry {
  seat: Seat;
  call: Call;
}

/** A contract bid stripped of who/what doubling — used for legality ranking. */
export interface ContractBid {
  level: Level;
  strain: Strain;
  seat: Seat;
}

/** The derived contract once the auction completes (null when passed out). */
export interface Contract {
  level: Level;
  strain: Strain;
  declarer: Seat;
  doubled: Doubling;
}

export interface ScoreResult {
  scoreNS: number;
  scoreEW: number;
}
