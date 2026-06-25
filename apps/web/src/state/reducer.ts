// Pure game-state reducer — the single orchestration point between the UI and
// the domain engine (ARCHITECTURE.md §3, "Game state store"). No React, no I/O,
// so it is fully unit-tested.

import {
  deriveContract,
  isAuctionComplete,
  isPassedOut,
  scoreContract,
  seatToBid,
} from '../domain';
import type { Call } from '../domain';
import { freshBoard } from './board';
import { SCHEMA_VERSION, type GameSettings, type GameState, type HistoryEntry, type Screen } from './types';

export const DEFAULT_SETTINGS: GameSettings = {
  palette: 'Felt Green',
  gridStyle: 'table',
  biddingLayout: 'autoRotate',
  animations: true,
  sound: false,
};

export function initialState(): GameState {
  return {
    schemaVersion: SCHEMA_VERSION,
    screen: 'newGame',
    trackVulnerability: true,
    calculateScore: true,
    settings: { ...DEFAULT_SETTINGS },
    board: freshBoard(1, true),
    history: [],
  };
}

export type Action =
  | { type: 'hydrate'; state: GameState }
  | { type: 'toggleOption'; option: 'trackVulnerability' | 'calculateScore' }
  | { type: 'startGame' }
  | { type: 'makeCall'; call: Call }
  | { type: 'undo' }
  | { type: 'setTricks'; value: number }
  | { type: 'confirmScore' }
  | { type: 'finishWithoutScore' } // passed-out, or scoring disabled
  | { type: 'nextHand' } // from the score screen (already recorded)
  | { type: 'newGame' }
  | { type: 'go'; screen: Screen }
  | { type: 'updateSettings'; patch: Partial<GameSettings> };

/** Snapshot the current board onto the score sheet exactly once per board. */
function recordBoard(s: GameState): HistoryEntry {
  const { board } = s;
  let scoreNS = 0;
  let scoreEW = 0;
  if (board.contract && s.calculateScore) {
    const r = scoreContract(board.contract, board.nsTricks, board.vulnerability);
    scoreNS = r.scoreNS;
    scoreEW = r.scoreEW;
  }
  return {
    board: board.boardNumber,
    dealer: board.dealer,
    contract: board.contract,
    nsTricks: board.nsTricks,
    scoreNS,
    scoreEW,
    bids: board.bids.slice(),
  };
}

export function reducer(s: GameState, action: Action): GameState {
  switch (action.type) {
    case 'hydrate':
      return action.state;

    case 'toggleOption':
      // Only meaningful before a game starts (New Game screen).
      return { ...s, [action.option]: !s[action.option] };

    case 'startGame':
      return {
        ...s,
        screen: 'bidding',
        history: [],
        board: freshBoard(1, s.trackVulnerability),
      };

    case 'makeCall': {
      const turn = seatToBid(s.board.dealer, s.board.bids);
      const bids = [...s.board.bids, { seat: turn, call: action.call }];
      let board = { ...s.board, bids };
      let screen = s.screen;
      if (isAuctionComplete(bids)) {
        board = {
          ...board,
          contract: isPassedOut(bids) ? null : deriveContract(board.dealer, bids),
        };
        screen = 'contract';
      }
      return { ...s, board, screen };
    }

    case 'undo':
      return { ...s, board: { ...s.board, bids: s.board.bids.slice(0, -1) } };

    case 'setTricks':
      return {
        ...s,
        board: { ...s.board, nsTricks: Math.max(0, Math.min(13, action.value)) },
      };

    case 'confirmScore':
      return { ...s, history: [...s.history, recordBoard(s)], screen: 'score' };

    case 'finishWithoutScore': {
      const history = [...s.history, recordBoard(s)];
      const n = s.board.boardNumber + 1;
      return { ...s, history, screen: 'bidding', board: freshBoard(n, s.trackVulnerability) };
    }

    case 'nextHand': {
      const n = s.board.boardNumber + 1;
      return { ...s, screen: 'bidding', board: freshBoard(n, s.trackVulnerability) };
    }

    case 'newGame':
      return {
        ...s,
        screen: 'newGame',
        history: [],
        board: freshBoard(1, s.trackVulnerability),
      };

    case 'go':
      return { ...s, screen: action.screen };

    case 'updateSettings':
      return { ...s, settings: { ...s.settings, ...action.patch } };

    default:
      return s;
  }
}
