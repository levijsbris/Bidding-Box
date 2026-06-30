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

/**
 * A per-seat bid card with mirrored indices in opposite corners (like a real
 * playing card), plus a central suit pip — so the bid reads from both the owning
 * seat and the opposite side without a second stacked card. Sizes are CSS-driven
 * (.bc-* classes) so mobile/accessibility can scale them.
 */
export function MirrorCard({ call, newest = false }: { call: Call; newest?: boolean }) {
  const isBid = call.kind === 'bid';
  const corner = isBid ? (
    <>
      <span className="bc-cnr-lvl">{call.level}</span>
      <span className={isRed(call.strain) ? 'suit-red bc-cnr-suit' : 'suit-black bc-cnr-suit'}>
        {STRAIN_SYMBOL[call.strain]}
      </span>
    </>
  ) : (
    <span className="bc-cnr-word">
      {call.kind === 'double' ? 'X' : call.kind === 'redouble' ? 'XX' : 'Pass'}
    </span>
  );
  const label = isBid
    ? `${call.level} ${STRAIN_LABEL[call.strain]}`
    : call.kind === 'double'
      ? 'Double'
      : call.kind === 'redouble'
        ? 'Redouble'
        : 'Pass';
  return (
    <span className={`bc-card ${newest ? 'bc-card--newest' : ''}`} role="img" aria-label={label}>
      <span className="bc-corner bc-corner--tl" aria-hidden="true">
        {corner}
      </span>
      {isBid && (
        <span className="bc-pip" aria-hidden="true">
          <span className={isRed(call.strain) ? 'suit-red' : 'suit-black'}>
            {STRAIN_SYMBOL[call.strain]}
          </span>
        </span>
      )}
      <span className="bc-corner bc-corner--br" aria-hidden="true">
        {corner}
      </span>
    </span>
  );
}
