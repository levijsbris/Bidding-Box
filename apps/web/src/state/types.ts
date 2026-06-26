import type { BidEntry, Contract, Seat, Vulnerability } from '../domain';

export type Screen = 'newGame' | 'bidding' | 'contract' | 'tricks' | 'score';

export type GridStyle = 'table' | 'compact';
export type BiddingLayout = 'autoRotate' | 'fourGrids';
export type PaletteName = 'Felt Green' | 'Navy Blue' | 'High Contrast' | 'Warm Parchment';

export interface GameSettings {
  palette: PaletteName;
  gridStyle: GridStyle;
  biddingLayout: BiddingLayout;
  animations: boolean;
  sound: boolean;
  /** Extra-large mode: scales text and controls up across all screens. */
  accessibility: boolean;
}

/** The board currently in play. */
export interface BoardState {
  boardNumber: number;
  dealer: Seat;
  vulnerability: Vulnerability;
  bids: BidEntry[];
  contract: Contract | null;
  nsTricks: number;
}

/** A completed board recorded on the running score sheet. */
export interface HistoryEntry {
  board: number;
  dealer: Seat;
  contract: Contract | null;
  nsTricks: number;
  scoreNS: number;
  scoreEW: number;
  bids: BidEntry[];
}

/** The full durable game state — persisted to IndexedDB for resume-after-reload. */
export interface GameState {
  schemaVersion: number;
  screen: Screen;
  trackVulnerability: boolean;
  calculateScore: boolean;
  settings: GameSettings;
  board: BoardState;
  history: HistoryEntry[];
}

export const SCHEMA_VERSION = 1;
