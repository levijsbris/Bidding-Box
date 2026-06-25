// Dealer and vulnerability rotation by board number, plus seat-facing angles for
// the four-orientation render layer (PRODUCT.md §6.1, US-2).

import type { Seat, Vulnerability } from './types';

const DEALERS: readonly Seat[] = ['North', 'East', 'South', 'West'];

/** The standard 16-board vulnerability cycle. */
const VULS: readonly Vulnerability[] = [
  'None', 'NS', 'EW', 'Both',
  'NS', 'EW', 'Both', 'None',
  'EW', 'Both', 'None', 'NS',
  'Both', 'None', 'NS', 'EW',
];

/** Dealer rotates N→E→S→W by board number (1-based). */
export const dealerForBoard = (n: number): Seat => DEALERS[(n - 1) % 4];

/** Vulnerability follows the 16-board cycle (1-based). */
export const vulForBoard = (n: number): Vulnerability => VULS[(n - 1) % 16];

/** Rotation angle (degrees) to face content toward each seat. South is upright. */
export const SEAT_ANGLE: Record<Seat, number> = {
  South: 0,
  West: 90,
  North: 180,
  East: 270,
};
