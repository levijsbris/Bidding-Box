// Optional spoken bid announcements (off by default). Information is never
// conveyed by sound alone — this is an extra, not a requirement (US-12).

import { STRAIN_LABEL } from '../domain';
import type { Call, Seat } from '../domain';

export function speakCall(seat: Seat, call: Call, enabled: boolean): void {
  if (!enabled || typeof window === 'undefined' || !window.speechSynthesis) return;
  let t = '';
  if (call.kind === 'pass') t = `${seat} passes`;
  else if (call.kind === 'double') t = `${seat} doubles`;
  else if (call.kind === 'redouble') t = `${seat} redoubles`;
  else t = `${seat} bids ${call.level} ${STRAIN_LABEL[call.strain]}`;
  const u = new SpeechSynthesisUtterance(t);
  u.rate = 0.95;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
