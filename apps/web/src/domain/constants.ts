import type { Level, Pair, Seat, Strain } from './types';

/** Seats in clockwise order; index drives turn rotation and the dealer cycle. */
export const SEATS: readonly Seat[] = ['North', 'East', 'South', 'West'];

export const STRAINS: readonly Strain[] = ['C', 'D', 'H', 'S', 'NT'];

export const STRAIN_RANK: Record<Strain, number> = { C: 0, D: 1, H: 2, S: 3, NT: 4 };

export const STRAIN_SYMBOL: Record<Strain, string> = {
  C: '♣',
  D: '♦',
  H: '♥',
  S: '♠',
  NT: 'NT',
};

export const STRAIN_LABEL: Record<Strain, string> = {
  C: 'Clubs',
  D: 'Diamonds',
  H: 'Hearts',
  S: 'Spades',
  NT: 'No Trump',
};

/** Diamonds and hearts render red; suits also always carry a shape + label so
 *  colour is never the only signal (PRODUCT.md §6.3, US-10). */
export const RED_STRAINS: readonly Strain[] = ['D', 'H'];

export const LEVELS: readonly Level[] = [1, 2, 3, 4, 5, 6, 7];

export const isRed = (s: Strain): boolean => RED_STRAINS.includes(s);

/** A combined rank for a contract bid so two bids can be compared directly. */
export const bidRank = (level: Level, strain: Strain): number =>
  (level - 1) * 5 + STRAIN_RANK[strain];

export const partnerOf = (s: Seat): Seat =>
  ({ North: 'South', South: 'North', East: 'West', West: 'East' } as const)[s];

export const nextSeat = (s: Seat): Seat => SEATS[(SEATS.indexOf(s) + 1) % 4];

/** The opponent on the declarer's left — the opening leader. */
export const leftOf = (s: Seat): Seat => SEATS[(SEATS.indexOf(s) + 1) % 4];

export const pairOf = (s: Seat): Pair => (s === 'North' || s === 'South' ? 'NS' : 'EW');
