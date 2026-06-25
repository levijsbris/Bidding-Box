import { SEATS, type BidEntry, type Seat } from '../domain';
import { useGame } from '../state/GameContext';
import { CallLabel, Suit } from '../render/Suit';
import { resultText } from '../screens/result';

/** Build the auction as a four-column table headed by seat, dealer first. */
function AuctionTable({ bids, dealer }: { bids: BidEntry[]; dealer: Seat }) {
  const start = SEATS.indexOf(dealer);
  const cols = [0, 1, 2, 3].map((i) => SEATS[(start + i) % 4]);
  const rows: (BidEntry | null)[][] = [];
  let row: (BidEntry | null)[] = [];
  bids.forEach((b, i) => {
    row.push(b);
    if (row.length === 4) {
      rows.push(row);
      row = [];
    }
    if (i === bids.length - 1 && row.length) {
      while (row.length < 4) row.push(null);
      rows.push(row);
    }
  });

  return (
    <table className="bh-table">
      <thead>
        <tr>
          {cols.map((c) => (
            <th key={c}>
              {c}
              {c === dealer && <em>dealer</em>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={4} className="bh-empty">
              No bids yet
            </td>
          </tr>
        ) : (
          rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((b, ci) => (
                <td key={ci}>{b ? <CallLabel call={b.call} /> : ''}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

/** US-16: the full auction, dual-flipped so both long sides can read it. */
export function BidHistory() {
  const { state, historyBoard, setHistoryBoard } = useGame();
  if (historyBoard == null) return null;

  let bids: BidEntry[];
  let dealer: Seat;
  let title: string;
  let sub: React.ReactNode = '';

  if (historyBoard === 'live') {
    bids = state.board.bids;
    dealer = state.board.dealer;
    title = 'Bidding History';
    const c = state.board.contract;
    if (c) {
      const dbl = c.doubled === 'doubled' ? ' X' : c.doubled === 'redoubled' ? ' XX' : '';
      sub = (
        <>
          Contract: {c.level}
          <Suit strain={c.strain} size={16} /> by {c.declarer}
          {dbl}
        </>
      );
    }
  } else {
    const rec = state.history.find((b) => b.board === historyBoard);
    if (!rec) return null;
    bids = rec.bids;
    dealer = rec.dealer;
    title = `Board ${rec.board} — Bidding`;
    const c = rec.contract;
    sub = c ? (
      <>
        {c.level}
        <Suit strain={c.strain} size={16} /> by {c.declarer} · {resultText(rec)}
      </>
    ) : (
      'Passed out'
    );
  }

  const Panel = () => (
    <div className="bh-panel">
      <div className="bh-scroll">
        <AuctionTable bids={bids} dealer={dealer} />
      </div>
    </div>
  );

  return (
    <div className="bh-overlay" onClick={() => setHistoryBoard(null)}>
      <div className="bh-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bh-zone bh-zone--top">
          <Panel />
        </div>
        <div className="bh-bar">
          <span className="bh-title">{title}</span>
          {sub && <span className="bh-sub">{sub}</span>}
          <span className="bh-spacer" />
          <button className="icon-btn" onClick={() => setHistoryBoard(null)} aria-label="Close">
            ×
          </button>
        </div>
        <div className="bh-zone">
          <Panel />
        </div>
      </div>
    </div>
  );
}
