import { describe, it, expect } from 'vitest';
import { dealerForBoard, vulForBoard, SEAT_ANGLE } from './rotation';

describe('dealerForBoard', () => {
  it('rotates N→E→S→W by board', () => {
    expect(dealerForBoard(1)).toBe('North');
    expect(dealerForBoard(2)).toBe('East');
    expect(dealerForBoard(3)).toBe('South');
    expect(dealerForBoard(4)).toBe('West');
    expect(dealerForBoard(5)).toBe('North');
  });
});

describe('vulForBoard', () => {
  it('follows the 16-board cycle', () => {
    expect(vulForBoard(1)).toBe('None');
    expect(vulForBoard(2)).toBe('NS');
    expect(vulForBoard(4)).toBe('Both');
    expect(vulForBoard(16)).toBe('EW');
    expect(vulForBoard(17)).toBe('None'); // wraps
  });
});

describe('SEAT_ANGLE', () => {
  it('faces each seat, South upright', () => {
    expect(SEAT_ANGLE.South).toBe(0);
    expect(SEAT_ANGLE.West).toBe(90);
    expect(SEAT_ANGLE.North).toBe(180);
    expect(SEAT_ANGLE.East).toBe(270);
  });
});
