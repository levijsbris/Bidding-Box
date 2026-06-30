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
 * Mirrored-corner bid card — styled like a real playing card: the call appears as
 * a small index in two opposite corners (one rotated 180°) with a large centre
 * glyph, so it reads upright from both long sides of the table. No-trump shows
 * "{level}NT" in the centre; Pass/Double/Redouble render as a duplicated word.
 * Sizes are CSS-driven (`.mc-*`) so four-grids / mobile / accessibility can scale.
 * See docs "Bid Card Design — Mirrored Corners".
 */
export function MirrorCard({ call, newest = false }: { call: Call; newest?: boolean }) {
  // Non-bid calls: a duplicated, two-sided word, lighter than a suit bid.
  if (call.kind !== 'bid') {
    const word = call.kind === 'pass' ? 'Pass' : call.kind === 'double' ? 'X' : 'XX';
    const aria = call.kind === 'pass' ? 'Pass' : call.kind === 'double' ? 'Double' : 'Redouble';
    return (
      <span
        className={`mc-card mc-card--call ${newest ? 'mc-card--newest' : ''}`}
        role="img"
        aria-label={aria}
      >
        <span className="mc-word mc-word--top" aria-hidden="true">{word}</span>
        <span className="mc-word mc-word--mid" aria-hidden="true">{word}</span>
        <span className="mc-word mc-word--bot" aria-hidden="true">{word}</span>
      </span>
    );
  }

  const { level, strain } = call;
  const isNT = strain === 'NT';
  const colourCls = isRed(strain) ? 'suit-red' : 'suit-black';
  // Suit bids show level + suit in the corners; NT shows just the level (the big
  // "NT" lives in the centre), so an NT card isn't cluttered with three "NT"s.
  const index = isNT ? (
    <span className="mc-lvl">{level}</span>
  ) : (
    <>
      <span className="mc-lvl">{level}</span>
      <span className={`mc-suit ${colourCls}`}>{STRAIN_SYMBOL[strain]}</span>
    </>
  );
  return (
    <span
      className={`mc-card ${newest ? 'mc-card--newest' : ''}`}
      role="img"
      aria-label={`${level} ${STRAIN_LABEL[strain]}`}
    >
      <span className="mc-idx mc-idx--tl" aria-hidden="true">{index}</span>
      {isNT ? (
        <span className="mc-centre mc-centre--nt">NT</span>
      ) : (
        <span className={`mc-centre ${colourCls}`}>{STRAIN_SYMBOL[strain]}</span>
      )}
      <span className="mc-idx mc-idx--br" aria-hidden="true">{index}</span>
    </span>
  );
}
