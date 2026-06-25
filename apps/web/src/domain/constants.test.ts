import { describe, it, expect } from 'vitest';
import { partnerOf, nextSeat, leftOf, pairOf, isRed, bidRank } from './constants';

describe('seat helpers', () => {
  it('partnerOf pairs the seats across the table', () => {
    expect(partnerOf('North')).toBe('South');
    expect(partnerOf('South')).toBe('North');
    expect(partnerOf('East')).toBe('West');
    expect(partnerOf('West')).toBe('East');
  });
  it('nextSeat and leftOf rotate clockwise', () => {
    expect(nextSeat('North')).toBe('East');
    expect(nextSeat('West')).toBe('North');
    expect(leftOf('South')).toBe('West');
  });
  it('pairOf groups the partnerships', () => {
    expect(pairOf('North')).toBe('NS');
    expect(pairOf('South')).toBe('NS');
    expect(pairOf('East')).toBe('EW');
    expect(pairOf('West')).toBe('EW');
  });
});

describe('suit + bid helpers', () => {
  it('isRed only for diamonds and hearts', () => {
    expect(isRed('D')).toBe(true);
    expect(isRed('H')).toBe(true);
    expect(isRed('S')).toBe(false);
    expect(isRed('C')).toBe(false);
    expect(isRed('NT')).toBe(false);
  });
  it('bidRank orders level then strain (C<D<H<S<NT)', () => {
    expect(bidRank(1, 'C')).toBeLessThan(bidRank(1, 'NT'));
    expect(bidRank(1, 'NT')).toBeLessThan(bidRank(2, 'C'));
    expect(bidRank(7, 'NT')).toBe(34);
  });
});
