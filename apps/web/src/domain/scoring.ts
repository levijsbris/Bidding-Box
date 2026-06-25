// Duplicate-Bridge scoring. A typed port of the prototype's scoreContract,
// verified against standard duplicate scoring across all doubled/vulnerable
// branches (PRODUCT.md §6.4, API_SPEC.md §6).

import { pairOf } from './constants';
import type { Contract, ScoreResult, Vulnerability } from './types';

/** Is the given pair vulnerable under this board's vulnerability? */
export function isVul(pair: 'NS' | 'EW', vul: Vulnerability): boolean {
  if (vul === 'Both') return true;
  if (vul === 'None') return false;
  return vul === pair;
}

/**
 * Score one board. `nsTricks` is the number of tricks won by North/South (0–13);
 * the engine converts to declarer tricks internally. Returns the per-side score,
 * one of which is always zero.
 */
export function scoreContract(
  contract: Contract,
  nsTricks: number,
  vul: Vulnerability,
): ScoreResult {
  const dPair = pairOf(contract.declarer);
  const dTricks = dPair === 'NS' ? nsTricks : 13 - nsTricks;
  const vulnerable = isVul(dPair, vul);
  const needed = contract.level + 6;
  const made = dTricks >= needed;
  const { level, strain, doubled } = contract;
  let score = 0;

  if (made) {
    const perTrick = strain === 'C' || strain === 'D' ? 20 : 30;
    let trickScore = level * perTrick;
    if (strain === 'NT') trickScore += 10;
    if (doubled === 'doubled') trickScore *= 2;
    if (doubled === 'redoubled') trickScore *= 4;
    score += trickScore;

    // Game (>=100) vs part-score bonus. trickScore is post-doubling, so a
    // doubled part-score that reaches 100 correctly earns the game bonus.
    score += trickScore >= 100 ? (vulnerable ? 500 : 300) : 50;
    if (level === 6) score += vulnerable ? 750 : 500; // small slam
    if (level === 7) score += vulnerable ? 1500 : 1000; // grand slam
    if (doubled === 'doubled') score += 50; // insult bonus
    if (doubled === 'redoubled') score += 100;

    const over = dTricks - needed;
    if (over > 0) {
      if (doubled === 'none') {
        score += over * perTrick;
      } else {
        const per = vulnerable ? 200 : 100;
        const mult = doubled === 'redoubled' ? 2 : 1;
        score += over * per * mult;
      }
    }
  } else {
    const under = needed - dTricks;
    let pen = 0;
    if (doubled === 'none') {
      pen = under * (vulnerable ? 100 : 50);
    } else {
      const mult = doubled === 'redoubled' ? 2 : 1;
      if (vulnerable) {
        pen = (200 + (under - 1) * 300) * mult;
      } else {
        for (let i = 1; i <= under; i++) {
          if (i === 1) pen += 100;
          else if (i <= 3) pen += 200;
          else pen += 300;
        }
        pen *= mult;
      }
    }
    score = -pen;
  }

  if (dPair === 'NS') {
    return score >= 0 ? { scoreNS: score, scoreEW: 0 } : { scoreNS: 0, scoreEW: -score };
  }
  return score >= 0 ? { scoreNS: 0, scoreEW: score } : { scoreNS: -score, scoreEW: 0 };
}

/** Human-readable result label, e.g. "Made", "Made +2", "Down 1". */
export function resultLabel(contract: Contract, nsTricks: number): string {
  const dPair = pairOf(contract.declarer);
  const dTricks = dPair === 'NS' ? nsTricks : 13 - nsTricks;
  const diff = dTricks - (contract.level + 6);
  if (diff === 0) return 'Made';
  if (diff > 0) return `Made +${diff}`;
  return `Down ${-diff}`;
}
