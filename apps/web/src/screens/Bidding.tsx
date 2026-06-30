import { useEffect, useLayoutEffect, useRef } from 'react';
import {
  isLegalCall,
  lastContractBid,
  seatToBid,
  LEVELS,
  STRAINS,
  STRAIN_LABEL,
  SEATS,
  type Call,
  type Seat,
} from '../domain';
import { useGame } from '../state/GameContext';
import { TopBar } from '../components/TopBar';
import { RotateWrap } from '../render/RotateWrap';
import { useFacingAngle } from '../render/useFacingAngle';
import { Suit, MirrorCard } from '../render/Suit';

export function Bidding() {
  const { state, display } = useGame();
  const { board } = state;
  const turn = seatToBid(board.dealer, board.bids);
  const label = board.bids.length === 0 ? `${turn} to open` : `${turn}'s turn`;

  return (
    <div className="app-shell">
      <TopBar centerLabel={label} />
      {/* Announce turn changes to screen readers (the visual turn pill is hidden on
          phones and isn't a live region). */}
      <div className="sr-only" role="status" aria-live="polite">
        {label}
      </div>
      <div className="screen-body">
        {display.layout === 'fourGrids' ? <FourGrids turn={turn} /> : <AutoLayout turn={turn} />}
      </div>
    </div>
  );
}

// ---- auto-rotate layout: a single grid that turns to face the active bidder ----

function AutoLayout({ turn }: { turn: Seat }) {
  const { state, deviceMobile, display } = useGame();
  const { settings } = state;
  const accessible = settings.accessibility;
  const layoutRef = useRef<HTMLDivElement>(null);
  // Continuous angle so the centre grid rotates the short way each turn.
  const gridAngle = useFacingAngle(turn);
  // Grow the active bidder's grid to fill the space between the seat cards. On a
  // phone the four-sided layout is tight, so this reclaims the empty centre and
  // gives comfortable touch targets; it never overlaps the cards (measured).
  // Accessibility mode lets it grow much larger to fill the table.
  const maxScale = accessible ? (deviceMobile ? 2.8 : 3.4) : deviceMobile ? 1.7 : 1;
  useFitAutoGrid(layoutRef, turn, maxScale, [
    turn,
    state.board.bids.length,
    display.gridStyle,
    deviceMobile,
    accessible,
  ]);
  return (
    <div className="auto-layout" ref={layoutRef}>
      <div className="auto-center">
        <RotateWrap facing={turn} animations={settings.animations} angle={gridAngle}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <BiddingGrid />
          </div>
        </RotateWrap>
      </div>
      {SEATS.map((seat) => (
        <div key={seat} className={`seat-pos seat-pos--${seat.toLowerCase()}`}>
          <RotateWrap facing={seat} animations={settings.animations}>
            <SeatCard seat={seat} turn={turn} />
          </RotateWrap>
        </div>
      ))}
    </div>
  );
}

/**
 * Scale the centre bidding grid to fill the rectangle between the four seat
 * cards. Measures natural (pre-transform) grid size and the on-screen card
 * boxes, accounts for the active rotation (E/W swaps the grid's width/height),
 * and writes a CSS scale. Caps growth on phones; on desktop it only shrinks if
 * the cards would ever crowd the grid.
 */
function useFitAutoGrid(
  ref: React.RefObject<HTMLDivElement>,
  turn: Seat,
  maxScale: number,
  deps: unknown[],
) {
  const fit = () => {
    const layout = ref.current;
    if (!layout) return;
    const grid = layout.querySelector<HTMLElement>('.grid-wrap');
    if (!grid) return;
    const gw = grid.offsetWidth;
    const gh = grid.offsetHeight;
    if (!gw || !gh) return;

    const base = layout.getBoundingClientRect();
    const rectOf = (sel: string) => {
      const el = layout.querySelector<HTMLElement>(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left - base.left, right: r.right - base.left, top: r.top - base.top, bottom: r.bottom - base.top };
    };
    const W = layout.clientWidth;
    const H = layout.clientHeight;
    const west = rectOf('.seat-pos--west .bid-seat');
    const east = rectOf('.seat-pos--east .bid-seat');
    const north = rectOf('.seat-pos--north .bid-seat');
    const south = rectOf('.seat-pos--south .bid-seat');

    const margin = 14;
    const freeW = (east ? east.left : W) - (west ? west.right : 0) - margin * 2;
    const freeH = (south ? south.top : H) - (north ? north.bottom : 0) - margin * 2;

    const sideways = turn === 'East' || turn === 'West';
    const onScreenW = sideways ? gh : gw;
    const onScreenH = sideways ? gw : gh;

    let scale = Math.min(maxScale, freeW / onScreenW, freeH / onScreenH);
    if (!Number.isFinite(scale) || scale <= 0) scale = 1;
    scale = Math.max(0.55, scale);
    grid.style.setProperty('--auto-grid-scale', scale.toFixed(3));
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useLayoutEffect(() => {
    requestAnimationFrame(fit);
  }, deps);

  useEffect(() => {
    let timer: number | undefined;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(fit, 80);
    };
    window.addEventListener('resize', onResize);
    if (document.fonts?.ready) void document.fonts.ready.then(fit);
    return () => {
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */
}

function BiddingGrid() {
  const { state, display, compactLevel, setCompactLevel, makeCall } = useGame();
  const { board } = state;
  const last = lastContractBid(board.bids);
  const legal = (c: Call) => isLegalCall(c, board.dealer, board.bids);

  const dOk = legal({ kind: 'double' });
  const rOk = legal({ kind: 'redouble' });

  return (
    <div className="grid-wrap">
      {display.gridStyle === 'table' ? (
        <div className="grid-table">
          {LEVELS.map((lvl) => (
            <div className="grid-row" key={lvl}>
              <span className="row-label">{lvl}</span>
              {STRAINS.map((s) => {
                const ok = legal({ kind: 'bid', level: lvl, strain: s });
                const sel = last?.level === lvl && last?.strain === s;
                return (
                  <button
                    key={s}
                    className={`call-btn grid-cell grid-cell--suitonly ${sel ? 'call-btn--selected' : ''}`}
                    disabled={!ok}
                    aria-label={`${lvl} ${STRAIN_LABEL[s]}`}
                    onClick={() => makeCall({ kind: 'bid', level: lvl, strain: s })}
                  >
                    <Suit strain={s} size={30} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid-compact">
          <div className="compact-levels">
            {LEVELS.map((lvl) => {
              const any = STRAINS.some((s) => legal({ kind: 'bid', level: lvl, strain: s }));
              return (
                <button
                  key={lvl}
                  className={`call-btn grid-cell ${compactLevel === lvl ? 'call-btn--selected' : ''}`}
                  disabled={!any}
                  onClick={() => setCompactLevel(lvl)}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
          <div className="compact-hint">
            {compactLevel ? `Level ${compactLevel} — pick a suit` : 'Pick a level'}
          </div>
          <div className="compact-strains">
            {STRAINS.map((s) => {
              const ok = compactLevel
                ? legal({ kind: 'bid', level: compactLevel, strain: s })
                : false;
              return (
                <button
                  key={s}
                  className="call-btn grid-cell"
                  disabled={!ok}
                  aria-label={STRAIN_LABEL[s]}
                  onClick={() =>
                    compactLevel && makeCall({ kind: 'bid', level: compactLevel, strain: s })
                  }
                >
                  <Suit strain={s} size={22} />
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="special-row">
        <button className="call-btn call-btn--special special-pass" onClick={() => makeCall({ kind: 'pass' })}>
          Pass
        </button>
        <button
          className="call-btn call-btn--special"
          disabled={!dOk}
          aria-label="Double"
          onClick={() => makeCall({ kind: 'double' })}
        >
          X
        </button>
        <button
          className="call-btn call-btn--special"
          disabled={!rOk}
          aria-label="Redouble"
          onClick={() => makeCall({ kind: 'redouble' })}
        >
          XX
        </button>
      </div>
    </div>
  );
}

function SeatCard({ seat, turn }: { seat: Seat; turn: Seat }) {
  const { state, deviceMobile, undo } = useGame();
  const { bids } = state.board;
  const side = seat === 'East' || seat === 'West';
  const active = turn === seat;
  const limit = deviceMobile ? (side ? 2 : 3) : side ? 4 : 6;

  const all = bids.filter((b) => b.seat === seat);
  const mine = all.slice(-limit);
  const more = all.length > limit ? all.length - limit : 0;
  const lastBidder = bids.length ? bids[bids.length - 1].seat : null;
  const isLastBidder = lastBidder === seat;
  const canUndo = bids.length > 0;

  // Each card is double-sided via mirrored corners (see MirrorCard), so a single
  // strip is readable from both this seat and the opposite side.
  return (
    <div className={`bid-seat ${active ? 'bid-seat--active' : ''}`}>
      <div className="bc-head">
        <button
          className={`bc-back ${isLastBidder ? 'bc-back--live' : ''}`}
          disabled={!canUndo}
          onClick={undo}
          aria-label={`Undo last bid (${seat})`}
        >
          ↺
        </button>
        <div className="bc-name">
          {seat}
          {active && <span className="bc-turn">to bid</span>}
        </div>
      </div>
      <div className="bc-cards">
        {mine.length === 0 ? (
          <div className="bc-empty">—</div>
        ) : (
          <>
            {more > 0 && <span className="bc-more">+{more}</span>}
            {mine.map((b, i) => (
              <MirrorCard key={i} call={b.call} newest={isLastBidder && i === mine.length - 1} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ---- four grids: a fixed grid at each edge, nothing rotates (US-8) ----

function FourGrids({ turn }: { turn: Seat }) {
  const layoutRef = useRef<HTMLDivElement>(null);
  const { state } = useGame();
  useFitFourGrids(layoutRef, [state.board.bids.length, state.settings.gridStyle]);

  return (
    <div className="auto-layout fg-layout" ref={layoutRef}>
      {SEATS.map((seat) => (
        <div key={seat} className={`fg-seat fg-seat--${seat.toLowerCase()}`}>
          <div className="fg-seat-inner">
            <FgSeatBlock seat={seat} turn={turn} />
          </div>
        </div>
      ))}
    </div>
  );
}

function FgSeatBlock({ seat, turn }: { seat: Seat; turn: Seat }) {
  const { state } = useGame();
  const mine = state.board.bids.filter((b) => b.seat === seat);
  const shown = mine.slice(-5);
  const more = mine.length > 5 ? mine.length - 5 : 0;
  return (
    <div className="fg-block">
      <div className="fg-bids">
        {shown.length === 0 ? (
          <span className="fgb-empty">no bids yet</span>
        ) : (
          <>
            {more > 0 && <span className="fgb-more">+{more}</span>}
            {shown.map((b, i) => (
              <MirrorCard key={i} call={b.call} />
            ))}
          </>
        )}
      </div>
      <MiniGrid seat={seat} turn={turn} />
    </div>
  );
}

function MiniGrid({ seat, turn }: { seat: Seat; turn: Seat }) {
  const { state, compactLevel, setCompactLevel, makeCall, undo } = useGame();
  const { board } = state;
  const active = seat === turn;
  const legal = (c: Call) => isLegalCall(c, board.dealer, board.bids);
  const canUndo = board.bids.length > 0;
  const dOk = active && legal({ kind: 'double' });
  const rOk = active && legal({ kind: 'redouble' });

  return (
    <div className={`fg-grid ${active ? 'fg-grid--active' : ''}`}>
      <div className="fg-name">
        {seat}
        {active && <span className="fg-turn">your turn</span>}
      </div>
      <div className="fg-levels">
        {LEVELS.map((lvl) => {
          const any = STRAINS.some((s) => legal({ kind: 'bid', level: lvl, strain: s }));
          const sel = active && compactLevel === lvl;
          return (
            <button
              key={lvl}
              className={`call-btn fg-cell ${sel ? 'call-btn--selected' : ''}`}
              disabled={!(active && any)}
              onClick={() => active && setCompactLevel(lvl)}
            >
              {lvl}
            </button>
          );
        })}
      </div>
      <div className="fg-suits">
        {STRAINS.map((s) => {
          const ok = active && compactLevel ? legal({ kind: 'bid', level: compactLevel, strain: s }) : false;
          return (
            <button
              key={s}
              className="call-btn fg-cell"
              disabled={!ok}
              aria-label={STRAIN_LABEL[s]}
              onClick={() => active && compactLevel && makeCall({ kind: 'bid', level: compactLevel, strain: s })}
            >
              <Suit strain={s} size={18} />
            </button>
          );
        })}
      </div>
      <div className="fg-spec">
        <button className="call-btn call-btn--special" disabled={!active} onClick={() => active && makeCall({ kind: 'pass' })}>
          Pass
        </button>
        <button className="call-btn call-btn--special" disabled={!dOk} onClick={() => active && makeCall({ kind: 'double' })}>
          X
        </button>
        <button className="call-btn call-btn--special" disabled={!rOk} onClick={() => active && makeCall({ kind: 'redouble' })}>
          XX
        </button>
      </div>
      {active && (
        <button className="fg-back" disabled={!canUndo} onClick={undo} aria-label="Undo last bid">
          ↺ Back
        </button>
      )}
    </div>
  );
}

/**
 * Shrink the four-grids cluster uniformly so all four blocks stay fully on-screen
 * from a large tablet down to a phone (PRODUCT.md §6.2, E2E flow F7). Ported from
 * the prototype's fitFourGrids.
 */
function useFitFourGrids(ref: React.RefObject<HTMLDivElement>, deps: unknown[]) {
  const fit = () => {
    const layout = ref.current;
    if (!layout) return;
    layout.style.setProperty('--fg-scale', '1');
    const avH = layout.clientHeight;
    const avW = layout.clientWidth;
    if (!avH || !avW) return;
    const inners = layout.querySelectorAll<HTMLElement>('.fg-seat-inner');
    let blockH = 0;
    let blockW = 0;
    inners.forEach((n) => {
      if (n.offsetHeight > blockH) blockH = n.offsetHeight;
      if (n.offsetWidth > blockW) blockW = n.offsetWidth;
    });
    if (!blockH || !blockW) return;
    const margin = 20;
    const vScale = (avH - margin) / (blockH * 2);
    const hScale = (avW - margin) / (blockH * 2);
    const ewVfit = (avH - margin) / blockW;
    const nsHfit = (avW - margin) / blockW;
    const scale = Math.min(1, vScale, hScale, ewVfit, nsHfit);
    layout.style.setProperty('--fg-scale', scale.toFixed(3));
  };

  // `deps` is a caller-provided array the exhaustive-deps rule can't analyse;
  // the effects intentionally re-fit on those inputs and on window/font changes.
  /* eslint-disable react-hooks/exhaustive-deps */
  useLayoutEffect(() => {
    requestAnimationFrame(fit);
  }, deps);

  useEffect(() => {
    let timer: number | undefined;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(fit, 80);
    };
    window.addEventListener('resize', onResize);
    if (document.fonts?.ready) void document.fonts.ready.then(fit);
    return () => {
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */
}
