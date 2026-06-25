import { describe, it, expect } from 'vitest';
import { reducer, initialState, type Action } from './reducer';
import type { Call } from '../domain';
import type { GameState } from './types';

const bid = (level: number, strain: string): Call => ({ kind: 'bid', level, strain } as Call);
const pass: Call = { kind: 'pass' };

function apply(s: GameState, ...actions: Action[]): GameState {
  return actions.reduce(reducer, s);
}

// Play a full auction ending in 3NT by North making, ready to score.
function gameAtContract(track = true, calc = true): GameState {
  let s = initialState();
  s = apply(s, { type: 'toggleOption', option: 'trackVulnerability' }); // flip then restore
  s = apply(s, { type: 'toggleOption', option: 'trackVulnerability' });
  s.trackVulnerability = track;
  s.calculateScore = calc;
  s = apply(s, { type: 'startGame' });
  // Dealer board 1 = North. N 3NT, P, P, P
  s = apply(
    s,
    { type: 'makeCall', call: bid(3, 'NT') },
    { type: 'makeCall', call: pass },
    { type: 'makeCall', call: pass },
    { type: 'makeCall', call: pass },
  );
  return s;
}

describe('startGame', () => {
  it('begins board 1 with dealer North and clears history', () => {
    const s = apply(initialState(), { type: 'startGame' });
    expect(s.screen).toBe('bidding');
    expect(s.board.boardNumber).toBe(1);
    expect(s.board.dealer).toBe('North');
    expect(s.history).toEqual([]);
  });
});

describe('vulnerability tracking fix', () => {
  it('board 2 is vulnerable when tracking is on', () => {
    let s = apply(initialState(), { type: 'startGame' });
    s = apply(s, { type: 'finishWithoutScore' }); // -> board 2
    expect(s.board.boardNumber).toBe(2);
    expect(s.board.vulnerability).toBe('NS');
  });
  it('every board is non-vulnerable when tracking is off', () => {
    let s = initialState();
    s.trackVulnerability = false;
    s = apply(s, { type: 'startGame' });
    expect(s.board.vulnerability).toBe('None');
    s = apply(s, { type: 'finishWithoutScore' });
    expect(s.board.vulnerability).toBe('None'); // would be NS under the cycle
  });
});

describe('makeCall completes the auction', () => {
  it('derives a contract and moves to the Contract screen', () => {
    const s = gameAtContract();
    expect(s.screen).toBe('contract');
    expect(s.board.contract).toMatchObject({ level: 3, strain: 'NT', declarer: 'North' });
  });
  it('passed-out board has no contract', () => {
    let s = apply(initialState(), { type: 'startGame' });
    s = apply(
      s,
      { type: 'makeCall', call: pass },
      { type: 'makeCall', call: pass },
      { type: 'makeCall', call: pass },
      { type: 'makeCall', call: pass },
    );
    expect(s.screen).toBe('contract');
    expect(s.board.contract).toBeNull();
  });
});

describe('undo and setTricks', () => {
  it('undo removes the last call', () => {
    let s = apply(initialState(), { type: 'startGame' });
    s = apply(s, { type: 'makeCall', call: bid(1, 'C') }, { type: 'makeCall', call: pass });
    expect(s.board.bids).toHaveLength(2);
    s = apply(s, { type: 'undo' });
    expect(s.board.bids).toHaveLength(1);
  });
  it('setTricks clamps to 0–13', () => {
    let s = gameAtContract();
    s = apply(s, { type: 'setTricks', value: 99 });
    expect(s.board.nsTricks).toBe(13);
    s = apply(s, { type: 'setTricks', value: -5 });
    expect(s.board.nsTricks).toBe(0);
  });
});

describe('confirmScore', () => {
  it('records the board with a computed score and shows the score sheet', () => {
    let s = gameAtContract();
    s = apply(s, { type: 'setTricks', value: 9 }, { type: 'confirmScore' });
    expect(s.screen).toBe('score');
    expect(s.history).toHaveLength(1);
    // 3NT making, board 1 non-vul: 400.
    expect(s.history[0]).toMatchObject({ scoreNS: 400, scoreEW: 0 });
  });
  it('records a zero score when scoring is disabled', () => {
    let s = gameAtContract(true, false);
    s = apply(s, { type: 'setTricks', value: 9 }, { type: 'confirmScore' });
    expect(s.history[0]).toMatchObject({ scoreNS: 0, scoreEW: 0 });
  });
});

describe('finishWithoutScore (history fix)', () => {
  it('records the board even when not scored, then advances', () => {
    let s = gameAtContract(true, false);
    s = apply(s, { type: 'finishWithoutScore' });
    expect(s.history).toHaveLength(1);
    expect(s.history[0].bids.length).toBeGreaterThan(0); // bid history preserved
    expect(s.board.boardNumber).toBe(2);
    expect(s.screen).toBe('bidding');
  });
  it('records a passed-out board so it appears on the sheet', () => {
    let s = apply(initialState(), { type: 'startGame' });
    s = apply(
      s,
      { type: 'makeCall', call: pass },
      { type: 'makeCall', call: pass },
      { type: 'makeCall', call: pass },
      { type: 'makeCall', call: pass },
      { type: 'finishWithoutScore' },
    );
    expect(s.history).toHaveLength(1);
    expect(s.history[0].contract).toBeNull();
  });
});

describe('nextHand does not double-record', () => {
  it('advances from the score screen without adding a second row', () => {
    let s = gameAtContract();
    s = apply(s, { type: 'setTricks', value: 9 }, { type: 'confirmScore' });
    expect(s.history).toHaveLength(1);
    s = apply(s, { type: 'nextHand' });
    expect(s.history).toHaveLength(1);
    expect(s.board.boardNumber).toBe(2);
  });
});

describe('navigation and reset', () => {
  it('go switches screens', () => {
    const s = apply(initialState(), { type: 'go', screen: 'tricks' });
    expect(s.screen).toBe('tricks');
  });
  it('newGame returns to the New Game screen and clears history', () => {
    let s = gameAtContract();
    s = apply(s, { type: 'setTricks', value: 9 }, { type: 'confirmScore' });
    s = apply(s, { type: 'newGame' });
    expect(s.screen).toBe('newGame');
    expect(s.history).toEqual([]);
    expect(s.board.boardNumber).toBe(1);
  });
  it('hydrate replaces the whole state', () => {
    const saved = gameAtContract();
    const s = apply(initialState(), { type: 'hydrate', state: saved });
    expect(s.screen).toBe('contract');
    expect(s.board.contract).not.toBeNull();
  });
});

describe('updateSettings', () => {
  it('merges a partial settings patch', () => {
    const s = apply(initialState(), { type: 'updateSettings', patch: { palette: 'Navy Blue' } });
    expect(s.settings.palette).toBe('Navy Blue');
    expect(s.settings.gridStyle).toBe('table'); // untouched
  });
});
