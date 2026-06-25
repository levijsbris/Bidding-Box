// React glue around the pure reducer: hydrates from IndexedDB, persists on every
// change, holds transient UI state (compact-picker level, overlays, device form
// factor), and applies side effects (palette, spoken bids).

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { seatToBid, type Call, type Level } from '../domain';
import { applyPalette } from '../render/palettes';
import { speakCall } from '../render/speak';
import { reducer, initialState, type Action } from './reducer';
import { loadGame, saveGame, clearGame } from './repository';
import type { GameState, GridStyle } from './types';

/** Which auction the Bid History overlay is showing: live board, a past board #, or closed. */
export type HistoryBoard = 'live' | number | null;

export interface GameContextValue {
  state: GameState;
  dispatch: (action: Action) => void;
  ready: boolean;

  // transient UI state
  compactLevel: Level | null;
  setCompactLevel: (n: Level | null) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  historyBoard: HistoryBoard;
  setHistoryBoard: (b: HistoryBoard) => void;
  deviceMobile: boolean;
  setDeviceMobile: (mobile: boolean) => void;

  // action wrappers with side effects
  makeCall: (call: Call) => void;
  undo: () => void;
  pickGrid: (choice: 'table' | 'compact' | 'four') => void;
  newGameFromScratch: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [ready, setReady] = useState(false);
  const [compactLevel, setCompactLevel] = useState<Level | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyBoard, setHistoryBoard] = useState<HistoryBoard>(null);
  const [deviceMobile, setDeviceMobileState] = useState(false);
  const hydrated = useRef(false);

  // Resume a saved game on first load (US-19, E2E flow F9).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadGame();
      if (!cancelled) {
        if (saved) {
          dispatch({ type: 'hydrate', state: saved });
        } else if (window.matchMedia?.('(prefers-reduced-motion:reduce)').matches) {
          dispatch({ type: 'updateSettings', patch: { animations: false } });
        }
        hydrated.current = true;
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist after every change once hydration has happened.
  useEffect(() => {
    if (hydrated.current) void saveGame(state);
  }, [state]);

  // Live palette + animation toggle.
  useEffect(() => {
    applyPalette(state.settings.palette, state.settings.animations);
  }, [state.settings.palette, state.settings.animations]);

  const makeCall = (call: Call) => {
    const turn = seatToBid(state.board.dealer, state.board.bids);
    speakCall(turn, call, state.settings.sound);
    dispatch({ type: 'makeCall', call });
    setCompactLevel(null);
  };

  const undo = () => {
    dispatch({ type: 'undo' });
    setCompactLevel(null);
  };

  const pickGrid = (choice: 'table' | 'compact' | 'four') => {
    if (choice === 'four') {
      dispatch({ type: 'updateSettings', patch: { biddingLayout: 'fourGrids' } });
    } else {
      dispatch({
        type: 'updateSettings',
        patch: { biddingLayout: 'autoRotate', gridStyle: choice as GridStyle },
      });
    }
    setCompactLevel(null);
  };

  const newGameFromScratch = () => {
    void clearGame();
    dispatch({ type: 'newGame' });
  };

  // Switching to a phone coerces unsupported layouts (only Compact fits, US-18).
  const setDeviceMobile = (mobile: boolean) => {
    setDeviceMobileState(mobile);
    if (mobile) {
      if (state.settings.biddingLayout === 'fourGrids') {
        dispatch({
          type: 'updateSettings',
          patch: { biddingLayout: 'autoRotate', gridStyle: 'compact' },
        });
      } else if (state.settings.gridStyle === 'table') {
        dispatch({ type: 'updateSettings', patch: { gridStyle: 'compact' } });
      }
    }
  };

  const value: GameContextValue = {
    state,
    dispatch,
    ready,
    compactLevel,
    setCompactLevel,
    settingsOpen,
    setSettingsOpen,
    historyBoard,
    setHistoryBoard,
    deviceMobile,
    setDeviceMobile,
    makeCall,
    undo,
    pickGrid,
    newGameFromScratch,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
