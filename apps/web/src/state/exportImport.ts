// Lightweight JSON export/import of a game. IndexedDB is the only store, so
// clearing site data loses games; this is cheap insurance for testing and for
// moving a game between devices (README open question 1 — decided: include now).

import { SCHEMA_VERSION, type GameState } from './types';
import { migrate } from './repository';

export interface GameExport {
  app: 'bridge-table-companion';
  schemaVersion: number;
  exportedAt: string;
  game: GameState;
}

export function serializeGame(state: GameState, now: string): string {
  const payload: GameExport = {
    app: 'bridge-table-companion',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now,
    game: state,
  };
  return JSON.stringify(payload, null, 2);
}

export class ImportError extends Error {}

/** Parse and validate an exported game, returning migrated state. */
export function deserializeGame(json: string): GameState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new ImportError('File is not valid JSON.');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new ImportError('File is not a recognised game export.');
  }
  const obj = parsed as Partial<GameExport>;
  if (obj.app !== 'bridge-table-companion' || !obj.game) {
    throw new ImportError('File is not a Bridge Table Companion game.');
  }
  const game = obj.game as GameState;
  if (!game.board || !Array.isArray(game.history) || !game.settings) {
    throw new ImportError('Game data is incomplete or corrupt.');
  }
  return migrate(game);
}

/** Filename suggestion for an exported game. */
export function exportFilename(state: GameState, now: string): string {
  const stamp = now.replace(/[:.]/g, '-');
  return `bridge-game-board-${state.board.boardNumber}-${stamp}.json`;
}
