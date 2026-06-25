// Golden scoring fixtures — every duplicate-scoring branch has a case with a
// hand-computed expected score (ARCHITECTURE.md §11). The engine must reproduce
// these exactly; a future C#/WASM port would be held to the same fixtures.

import type { Contract, ScoreResult, Vulnerability } from '../types';

export interface ScoringFixture {
  name: string;
  contract: Contract;
  nsTricks: number;
  vul: Vulnerability;
  expected: ScoreResult;
}

export const SCORING_FIXTURES: ScoringFixture[] = [
  {
    name: '3NT N made exactly, non-vul (game)',
    contract: { level: 3, strain: 'NT', declarer: 'North', doubled: 'none' },
    nsTricks: 9,
    vul: 'None',
    expected: { scoreNS: 400, scoreEW: 0 }, // 100 + 300
  },
  {
    name: '4H S made +1, non-vul (overtrick, undoubled)',
    contract: { level: 4, strain: 'H', declarer: 'South', doubled: 'none' },
    nsTricks: 11,
    vul: 'None',
    expected: { scoreNS: 450, scoreEW: 0 }, // 120 + 300 + 30
  },
  {
    name: '2C E part-score made, non-vul (EW declares)',
    contract: { level: 2, strain: 'C', declarer: 'East', doubled: 'none' },
    nsTricks: 5, // EW take 8
    vul: 'None',
    expected: { scoreNS: 0, scoreEW: 90 }, // 40 + 50
  },
  {
    name: '4S S doubled made exactly, vulnerable',
    contract: { level: 4, strain: 'S', declarer: 'South', doubled: 'doubled' },
    nsTricks: 10,
    vul: 'NS',
    expected: { scoreNS: 790, scoreEW: 0 }, // 240 + 500 + 50
  },
  {
    name: '3NT N doubled made +1, vulnerable (doubled overtrick)',
    contract: { level: 3, strain: 'NT', declarer: 'North', doubled: 'doubled' },
    nsTricks: 10,
    vul: 'Both',
    expected: { scoreNS: 950, scoreEW: 0 }, // 200 + 500 + 50 + 200
  },
  {
    name: '6NT N small slam made, vulnerable',
    contract: { level: 6, strain: 'NT', declarer: 'North', doubled: 'none' },
    nsTricks: 12,
    vul: 'Both',
    expected: { scoreNS: 1440, scoreEW: 0 }, // 190 + 500 + 750
  },
  {
    name: '7S S grand slam made, non-vul',
    contract: { level: 7, strain: 'S', declarer: 'South', doubled: 'none' },
    nsTricks: 13,
    vul: 'None',
    expected: { scoreNS: 1510, scoreEW: 0 }, // 210 + 300 + 1000
  },
  {
    name: '1NT S redoubled made exactly, vulnerable',
    contract: { level: 1, strain: 'NT', declarer: 'South', doubled: 'redoubled' },
    nsTricks: 7,
    vul: 'NS',
    expected: { scoreNS: 760, scoreEW: 0 }, // 160 + 500 + 100
  },
  {
    name: '3NT N down 2, non-vul (undoubled penalty)',
    contract: { level: 3, strain: 'NT', declarer: 'North', doubled: 'none' },
    nsTricks: 7,
    vul: 'None',
    expected: { scoreNS: 0, scoreEW: 100 }, // 2 * 50
  },
  {
    name: '4S S doubled down 3, non-vul',
    contract: { level: 4, strain: 'S', declarer: 'South', doubled: 'doubled' },
    nsTricks: 7,
    vul: 'None',
    expected: { scoreNS: 0, scoreEW: 500 }, // 100 + 200 + 200
  },
  {
    name: '4H N doubled down 1, vulnerable',
    contract: { level: 4, strain: 'H', declarer: 'North', doubled: 'doubled' },
    nsTricks: 9,
    vul: 'NS',
    expected: { scoreNS: 0, scoreEW: 200 }, // (200 + 0) * 1
  },
  {
    name: '2C N redoubled down 1, non-vul',
    contract: { level: 2, strain: 'C', declarer: 'North', doubled: 'redoubled' },
    nsTricks: 7, // needs 8, down 1
    vul: 'None',
    expected: { scoreNS: 0, scoreEW: 200 }, // 100 * 2
  },
  {
    name: '5S S doubled down 4, non-vul (4th undertrick at 300)',
    contract: { level: 5, strain: 'S', declarer: 'South', doubled: 'doubled' },
    nsTricks: 7, // needs 11, down 4
    vul: 'None',
    expected: { scoreNS: 0, scoreEW: 800 }, // 100 + 200 + 200 + 300
  },
  {
    name: '1NT N redoubled made +1, non-vul (redoubled overtrick)',
    contract: { level: 1, strain: 'NT', declarer: 'North', doubled: 'redoubled' },
    nsTricks: 8,
    vul: 'None',
    expected: { scoreNS: 760, scoreEW: 0 }, // 160 + 300 + 100 + (1*100*2)
  },
  {
    name: '5D S made exactly, vulnerable (minor-suit game)',
    contract: { level: 5, strain: 'D', declarer: 'South', doubled: 'none' },
    nsTricks: 11,
    vul: 'Both',
    expected: { scoreNS: 600, scoreEW: 0 }, // 100 + 500
  },
];
