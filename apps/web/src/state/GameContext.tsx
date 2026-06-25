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
import { useMediaQuery } from '../render/useMediaQuery';
import { effectiveDisplay, type DisplayMode } from './display';
import { reducer, initialState, type Action } from './reducer';
import { loadGame, saveGame, clearGame } from './repository';
import type { GameState, GridStyle } from './types';

/** Which auction the Bid History overlay is showing: live board, a past board #, or closed. */
export type HistoryBoard = 'live' | number | null;

/** Device handling: follow the real viewport (`auto`) or pin a preview. */
export type DeviceOverride = 'auto' | 'desktop' | 'mobile';

// A phone-class viewport: too narrow for the full grid, or too short (landscape
// phones). The full four-sided experience targets a tablet; below this we fall
// back to Compact (PRODUCT.md §7, US-18).
const MOBILE_QUERY = '(max-width: 820px), (max-height: 520px)';

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

  // responsive device state (viewport-driven, with optional preview override)
  deviceMobile: boolean; // effective form factor used for layout
  deviceOverride: DeviceOverride;
  setDeviceOverride: (o: DeviceOverride) => void;
  simulatePhone: boolean; // show the phone frame (simulating mobile on a wide screen)
  display: DisplayMode; // how the bidding screen should render right now

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
  const [deviceOverride, setDeviceOverride] = useState<DeviceOverride>('auto');
  const hydrated = useRef(false);

  // The app responds to the real viewport by default; the override only pins a
  // preview for testing on a different-sized screen.
  const viewportMobile = useMediaQuery(MOBILE_QUERY);
  const deviceMobile =
    deviceOverride === 'mobile' ? true : deviceOverride === 'desktop' ? false : viewportMobile;
  // Only draw the simulated phone frame when forcing mobile on a wide screen;
  // a genuinely narrow viewport fills the screen instead.
  const simulatePhone = deviceOverride === 'mobile' && !viewportMobile;
  const display = effectiveDisplay(state.settings, deviceMobile);

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
    deviceOverride,
    setDeviceOverride,
    simulatePhone,
    display,
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
