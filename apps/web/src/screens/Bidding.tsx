import { useLayoutEffect, useRef } from 'react';
import {
  isLegalCall,
  lastContractBid,
  seatToBid,
  LEVELS,
  STRAINS,
  STRAIN_LABEL,
  STRAIN_SYMBOL,
  SEATS,
  isRed,
  type Call,
  type Level,
  type Seat,
  type Strain,
} from '../domain';
import { useGame } from '../state/GameContext';
import { TopBar } from '../components/TopBar';
import { useFacingAngle } from '../render/useFacingAngle';
import { MirrorCard } from '../render/Suit';

// Which of the three accessible bidding designs to render.
type Layout = 'compact' | 'full' | 'four';

export function Bidding() {
  const { state, display } = useGame();
  const { board } = state;
  const turn = seatToBid(board.dealer, board.bids);
  const label = board.bids.length === 0 ? `${turn} to open` : `${turn}'s turn`;
  const layout: Layout =
    display.layout === 'fourGrids' ? 'four' : display.gridStyle === 'table' ? 'full' : 'compact';

  return (
    <div className="app-shell">
      <TopBar centerLabel={label} />
      <div className="sr-only" role="status" aria-live="polite">
        {label}
      </div>
      <div className="screen-body">
        {/* container-type:size — bands/grid caps are measured against this box */}
        <div className="bidding-area" data-layout={layout}>
          {layout === 'four' ? <FourGrids turn={turn} /> : <SingleLayout turn={turn} layout={layout} />}
        </div>
      </div>
    </div>
  );
}

// ---- shared suit glyph for grid buttons (em-sized; button carries the aria-label) ----
function GridSuit({ strain }: { strain: Strain }) {
  if (strain === 'NT') return <span className="gb-nt" aria-hidden="true">NT</span>;
  return (
    <span className={isRed(strain) ? 'suit-red' : 'suit-black'} aria-hidden="true">
      {STRAIN_SYMBOL[strain]}
    </span>
  );
}

// ===== Single-grid layouts (Compact / Full): seats pinned to the four edges, a
// fixed-shape grid centred and rotated to face the active bidder. =====
function SingleLayout({ turn, layout }: { turn: Seat; layout: 'compact' | 'full' }) {
  const { state } = useGame();
  const angle = useFacingAngle(turn);
  const transition = state.settings.animations
    ? 'transform .45s cubic-bezier(.4,0,.2,1)'
    : 'none';
  return (
    <div className="single">
      <div className="seatpin sp-n">
        <SeatStrip seat="North" turn={turn} limit={3} />
      </div>
      <div className="seatpin sp-w">
        <SeatStrip seat="West" turn={turn} limit={2} />
      </div>
      <div className="seatpin sp-e">
        <SeatStrip seat="East" turn={turn} limit={2} />
      </div>
      <div className="seatpin sp-s">
        <SeatStrip seat="South" turn={turn} limit={4} />
      </div>
      <div
        className="gridblock"
        style={{ transform: `translate(-50%,-50%) rotate(${angle}deg)`, transition }}
      >
        {layout === 'compact' ? <CompactGrid /> : <FullGrid />}
      </div>
    </div>
  );
}

// ---- Compact: two-row levels (4 + 3), suit row, Pass/X/XX (no hint text) ----
function CompactGrid() {
  const { state, compactLevel, setCompactLevel, makeCall } = useGame();
  const { board } = state;
  const legal = (c: Call) => isLegalCall(c, board.dealer, board.bids);
  return (
    <div className="compact">
      <div className="levels">
        {LEVELS.map((lvl) => {
          const any = STRAINS.some((s) => legal({ kind: 'bid', level: lvl, strain: s }));
          return (
            <button
              key={lvl}
              className={`gb ${compactLevel === lvl ? 'sel' : ''} ${any ? '' : 'dim'}`}
              disabled={!any}
              aria-label={`Level ${lvl}`}
              aria-pressed={compactLevel === lvl}
              onClick={() => setCompactLevel(lvl)}
            >
              {lvl}
            </button>
          );
        })}
      </div>
      <div className="suits">
        {STRAINS.map((s) => {
          const ok = compactLevel ? legal({ kind: 'bid', level: compactLevel, strain: s }) : false;
          return (
            <button
              key={s}
              className={`gb ${s === 'NT' ? 'nt' : ''} ${ok ? '' : 'dim'}`}
              disabled={!ok}
              aria-label={STRAIN_LABEL[s]}
              onClick={() => compactLevel && makeCall({ kind: 'bid', level: compactLevel, strain: s })}
            >
              <GridSuit strain={s} />
            </button>
          );
        })}
      </div>
      <SpecialRow />
    </div>
  );
}

// ---- Full: scrollable 7-row grid (level + 5 suit cells), auto-scrolls; Pass row pinned ----
function FullGrid() {
  const { state, makeCall } = useGame();
  const { board, settings } = state;
  const legal = (c: Call) => isLegalCall(c, board.dealer, board.bids);
  const scrollRef = useRef<HTMLDivElement>(null);

  // After each bid, scroll so the lowest still-legal level is at the top.
  useLayoutEffect(() => {
    const wrap = scrollRef.current;
    if (!wrap) return;
    const last = lastContractBid(board.bids);
    const level = last ? last.level : 1;
    const row = wrap.querySelector<HTMLElement>(`#lv-${level}`);
    if (row) wrap.scrollTo({ top: row.offsetTop, behavior: settings.animations ? 'smooth' : 'auto' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.bids.length]);

  return (
    <div className="full">
      <div className="tagline">auto-scrolls after each bid</div>
      <div className="scrollwrap" ref={scrollRef} data-anim={settings.animations ? 'on' : 'off'}>
        <div className="grid">
          {LEVELS.map((lvl) => (
            <Row key={lvl} lvl={lvl} legal={legal} makeCall={makeCall} />
          ))}
        </div>
      </div>
      <SpecialRow />
    </div>
  );
}

function Row({
  lvl,
  legal,
  makeCall,
}: {
  lvl: Level;
  legal: (c: Call) => boolean;
  makeCall: (c: Call) => void;
}) {
  return (
    <>
      <div className="rowlabel" id={`lv-${lvl}`}>
        {lvl}
      </div>
      {STRAINS.map((s) => {
        const ok = legal({ kind: 'bid', level: lvl, strain: s });
        return (
          <button
            key={s}
            className={`gb ${s === 'NT' ? 'nt' : ''} ${ok ? '' : 'dim'}`}
            disabled={!ok}
            aria-label={`${lvl} ${STRAIN_LABEL[s]}`}
            onClick={() => makeCall({ kind: 'bid', level: lvl, strain: s })}
          >
            <GridSuit strain={s} />
          </button>
        );
      })}
    </>
  );
}

// Pass / Double / Redouble row, shared by Compact and Full.
function SpecialRow() {
  const { state, makeCall } = useGame();
  const { board } = state;
  const legal = (c: Call) => isLegalCall(c, board.dealer, board.bids);
  const dOk = legal({ kind: 'double' });
  const rOk = legal({ kind: 'redouble' });
  return (
    <div className="passrow">
      <button className="gb special" aria-label="Pass" onClick={() => makeCall({ kind: 'pass' })}>
        Pass
      </button>
      <button
        className={`gb special ${dOk ? '' : 'dim'}`}
        disabled={!dOk}
        aria-label="Double"
        onClick={() => makeCall({ kind: 'double' })}
      >
        X
      </button>
      <button
        className={`gb special ${rOk ? '' : 'dim'}`}
        disabled={!rOk}
        aria-label="Redouble"
        onClick={() => makeCall({ kind: 'redouble' })}
      >
        XX
      </button>
    </div>
  );
}

// ---- seat history strip (Compact / Full) ----
function SeatStrip({ seat, turn, limit }: { seat: Seat; turn: Seat; limit: number }) {
  const { state, undo } = useGame();
  const { bids } = state.board;
  const active = turn === seat;
  const mine = bids.filter((b) => b.seat === seat).slice(-limit);
  const isLastBidder = bids.length > 0 && bids[bids.length - 1].seat === seat;
  const canUndo = bids.length > 0;
  return (
    <div className={`seat ${active ? 'active' : ''}`}>
      <button
        className={`undo ${isLastBidder ? 'undo--live' : ''}`}
        disabled={!canUndo}
        onClick={undo}
        aria-label={`Undo last bid (${seat})`}
      >
        ↺
      </button>
      <div className="nm">
        {seat}
        {active && <span className="cue">to bid</span>}
      </div>
      <div className="cards">
        {mine.length === 0 ? (
          <span className="mc-empty" aria-hidden="true">
            —
          </span>
        ) : (
          mine.map((b, i) => (
            <MirrorCard key={i} call={b.call} newest={isLastBidder && i === mine.length - 1} />
          ))
        )}
      </div>
    </div>
  );
}

// ===== Four grids: each seat pinned to its edge. History strips pin to the very
// edge (fixed); grids pin inboard and the active one grows toward the centre, so
// a growing grid can never push the fixed history. Nothing rotates. =====
function FourGrids({ turn }: { turn: Seat }) {
  const hAnchor: Record<Seat, string> = {
    North: 'fgh-n',
    East: 'fgh-e',
    South: 'fgh-s',
    West: 'fgh-w',
  };
  const gAnchor: Record<Seat, string> = {
    North: 'fgg-n',
    East: 'fgg-e',
    South: 'fgg-s',
    West: 'fgg-w',
  };
  return (
    <div className="fourwrap">
      {SEATS.map((seat) => (
        <div key={seat}>
          <div className={`fg-pos ${hAnchor[seat]}`}>
            <FgHist seat={seat} />
          </div>
          <div className={`fg-pos ${gAnchor[seat]}`}>
            <FgGrid seat={seat} active={seat === turn} />
          </div>
        </div>
      ))}
    </div>
  );
}

function FgGrid({ seat, active }: { seat: Seat; active: boolean }) {
  const { state, compactLevel, setCompactLevel, makeCall } = useGame();
  const { board } = state;
  const legal = (c: Call) => isLegalCall(c, board.dealer, board.bids);
  const dOk = active && legal({ kind: 'double' });
  const rOk = active && legal({ kind: 'redouble' });
  return (
    <div className={`mini ${active ? 'active' : ''}`}>
      <div className="nm">
        {seat}
        {active && <span className="cue">your turn</span>}
      </div>
      <div className="lv">
        {LEVELS.map((lvl) => {
          const any = STRAINS.some((s) => legal({ kind: 'bid', level: lvl, strain: s }));
          return (
            <button
              key={lvl}
              className={`gb ${active && compactLevel === lvl ? 'sel' : ''} ${active && any ? '' : 'dim'}`}
              disabled={!(active && any)}
              aria-label={`Level ${lvl}`}
              onClick={() => active && setCompactLevel(lvl)}
            >
              {lvl}
            </button>
          );
        })}
      </div>
      <div className="su">
        {STRAINS.map((s) => {
          const ok = active && compactLevel ? legal({ kind: 'bid', level: compactLevel, strain: s }) : false;
          return (
            <button
              key={s}
              className={`gb ${s === 'NT' ? 'nt' : ''} ${ok ? '' : 'dim'}`}
              disabled={!ok}
              aria-label={STRAIN_LABEL[s]}
              onClick={() => active && compactLevel && makeCall({ kind: 'bid', level: compactLevel, strain: s })}
            >
              <GridSuit strain={s} />
            </button>
          );
        })}
      </div>
      <div className="spec">
        <button className="gb special" disabled={!active} aria-label="Pass" onClick={() => active && makeCall({ kind: 'pass' })}>
          Pass
        </button>
        <button className={`gb special ${dOk ? '' : 'dim'}`} disabled={!dOk} aria-label="Double" onClick={() => active && makeCall({ kind: 'double' })}>
          X
        </button>
        <button className={`gb special ${rOk ? '' : 'dim'}`} disabled={!rOk} aria-label="Redouble" onClick={() => active && makeCall({ kind: 'redouble' })}>
          XX
        </button>
      </div>
    </div>
  );
}

function FgHist({ seat }: { seat: Seat }) {
  const { state, undo } = useGame();
  const { bids } = state.board;
  const mine = bids.filter((b) => b.seat === seat).slice(-3);
  const isLastBidder = bids.length > 0 && bids[bids.length - 1].seat === seat;
  const canUndo = bids.length > 0;
  return (
    <div className="fg-hist">
      <button
        className={`undo ${isLastBidder ? 'undo--live' : ''}`}
        disabled={!canUndo}
        onClick={undo}
        aria-label={`Undo last bid (${seat})`}
      >
        ↺
      </button>
      <div className="nm2">{seat}</div>
      <div className="cards">
        {mine.length === 0 ? (
          <span className="mc-empty" aria-hidden="true">
            —
          </span>
        ) : (
          mine.map((b, i) => (
            <MirrorCard key={i} call={b.call} newest={isLastBidder && i === mine.length - 1} />
          ))
        )}
      </div>
    </div>
  );
}
