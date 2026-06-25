import { describe, it, expect } from 'vitest';
import { scoreContract, resultLabel, isVul } from './scoring';
import { SCORING_FIXTURES } from './fixtures/scoring.fixtures';

describe('scoreContract — golden fixtures', () => {
  for (const f of SCORING_FIXTURES) {
    it(f.name, () => {
      expect(scoreContract(f.contract, f.nsTricks, f.vul)).toEqual(f.expected);
    });
  }
});

describe('isVul', () => {
  it('Both is always vulnerable', () => {
    expect(isVul('NS', 'Both')).toBe(true);
    expect(isVul('EW', 'Both')).toBe(true);
  });
  it('None is never vulnerable', () => {
    expect(isVul('NS', 'None')).toBe(false);
    expect(isVul('EW', 'None')).toBe(false);
  });
  it('matches only the named pair', () => {
    expect(isVul('NS', 'NS')).toBe(true);
    expect(isVul('EW', 'NS')).toBe(false);
  });
});

describe('resultLabel', () => {
  it('reports made / overtricks / undertricks from the declarer side', () => {
    const c = { level: 4, strain: 'H', declarer: 'South', doubled: 'none' } as const;
    expect(resultLabel(c, 10)).toBe('Made');
    expect(resultLabel(c, 12)).toBe('Made +2');
    expect(resultLabel(c, 8)).toBe('Down 2');
  });
  it('converts NS tricks for an EW declarer', () => {
    const c = { level: 2, strain: 'C', declarer: 'East', doubled: 'none' } as const;
    // EW take 8, need 8 → made
    expect(resultLabel(c, 5)).toBe('Made');
  });
});
