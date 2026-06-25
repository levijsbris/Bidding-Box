import { resultLabel } from '../domain';
import type { HistoryEntry } from '../state/types';

/** Result label for a completed board, including the passed-out case. */
export function resultText(b: HistoryEntry): string {
  if (!b.contract) return 'Passed out';
  return resultLabel(b.contract, b.nsTricks);
}
