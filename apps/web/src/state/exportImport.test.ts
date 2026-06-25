import { describe, it, expect } from 'vitest';
import { serializeGame, deserializeGame, exportFilename, ImportError } from './exportImport';
import { initialState } from './reducer';

const NOW = '2026-06-24T12:00:00.000Z';

describe('export / import round-trip', () => {
  it('serializes and deserializes back to the same game', () => {
    const state = initialState();
    state.history.push({
      board: 1, dealer: 'North', contract: null, nsTricks: 0, scoreNS: 0, scoreEW: 0, bids: [],
    });
    const json = serializeGame(state, NOW);
    const back = deserializeGame(json);
    expect(back.history).toHaveLength(1);
    expect(back.board.boardNumber).toBe(1);
  });

  it('builds a stable filename without illegal characters', () => {
    expect(exportFilename(initialState(), NOW)).toBe('bridge-game-board-1-2026-06-24T12-00-00-000Z.json');
  });
});

describe('import validation', () => {
  it('rejects non-JSON', () => {
    expect(() => deserializeGame('not json')).toThrow(ImportError);
  });
  it('rejects a foreign file', () => {
    expect(() => deserializeGame(JSON.stringify({ app: 'something-else' }))).toThrow(ImportError);
  });
  it('rejects incomplete game data', () => {
    const bad = JSON.stringify({ app: 'bridge-table-companion', game: { board: null } });
    expect(() => deserializeGame(bad)).toThrow(ImportError);
  });
});
