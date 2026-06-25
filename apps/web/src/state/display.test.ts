import { describe, it, expect } from 'vitest';
import { effectiveDisplay } from './display';
import { DEFAULT_SETTINGS } from './reducer';

describe('effectiveDisplay', () => {
  it('uses the saved settings on a wide screen', () => {
    expect(effectiveDisplay({ ...DEFAULT_SETTINGS, gridStyle: 'table' }, false)).toEqual({
      layout: 'autoRotate',
      gridStyle: 'table',
    });
    expect(effectiveDisplay({ ...DEFAULT_SETTINGS, biddingLayout: 'fourGrids' }, false)).toEqual({
      layout: 'fourGrids',
      gridStyle: 'table',
    });
  });

  it('forces Compact on a phone without touching saved settings', () => {
    const saved = { ...DEFAULT_SETTINGS, biddingLayout: 'fourGrids' as const, gridStyle: 'table' as const };
    expect(effectiveDisplay(saved, true)).toEqual({ layout: 'autoRotate', gridStyle: 'compact' });
    // The saved object is unchanged — the tablet choice survives.
    expect(saved.biddingLayout).toBe('fourGrids');
    expect(saved.gridStyle).toBe('table');
  });
});
