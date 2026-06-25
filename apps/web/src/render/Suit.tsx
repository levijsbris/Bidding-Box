// Suit and call rendering. Every suit shows its symbol AND an accessible label,
// so colour is never the only signal (PRODUCT.md §6.3, US-10).

import { isRed, STRAIN_LABEL, STRAIN_SYMBOL, type Call, type Strain } from '../domain';

export function Suit({ strain, size = 24 }: { strain: Strain; size?: number }) {
  if (strain === 'NT') {
    return (
      <span style={{ fontSize: size * 0.7, fontWeight: 800 }} aria-label="No Trump">
        NT
      </span>
    );
  }
  return (
    <span
      className={isRed(strain) ? 'suit-red' : 'suit-black'}
      style={{ fontSize: size, lineHeight: 1 }}
      role="img"
      aria-label={STRAIN_LABEL[strain]}
    >
      {STRAIN_SYMBOL[strain]}
    </span>
  );
}

/** Inline label used in auction tables (e.g. "2♥", "Pass", "X"). */
export function CallLabel({ call }: { call: Call }) {
  if (call.kind === 'pass') return <>Pass</>;
  if (call.kind === 'double') return <>X</>;
  if (call.kind === 'redouble') return <>XX</>;
  return (
    <span className="call-inline">
      {call.level}
      <Suit strain={call.strain} size={16} />
    </span>
  );
}

/** Larger stacked label for per-seat bid cards: level on top, suit below. */
export function BigCallLabel({ call }: { call: Call }) {
  if (call.kind === 'pass') return <span className="bc-word">Pass</span>;
  if (call.kind === 'double') return <span className="bc-word">X</span>;
  if (call.kind === 'redouble') return <span className="bc-word">XX</span>;
  return (
    <span className="bc-bid">
      <span className="bc-lvl">{call.level}</span>
      <Suit strain={call.strain} size={24} />
    </span>
  );
}
