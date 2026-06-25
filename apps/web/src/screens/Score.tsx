import { type Contract } from '../domain';
import { useGame } from '../state/GameContext';
import { TopBar } from '../components/TopBar';
import { Suit } from '../render/Suit';
import { resultText } from './result';

function ContractCell({ c }: { c: Contract | null }) {
  if (!c) return <>—</>;
  const dbl = c.doubled === 'doubled' ? ' X' : c.doubled === 'redoubled' ? ' XX' : '';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {c.declarer[0]}: {c.level}
      <Suit strain={c.strain} size={16} />
      {dbl}
    </span>
  );
}

/** US-15/US-16: running duplicate score, dual-readable, with re-openable auctions. */
export function Score() {
  const { state, dispatch, setHistoryBoard, newGameFromScratch } = useGame();
  let running = 0;
  const rows = state.history.map((b) => {
    running += b.scoreNS - b.scoreEW;
    return { b, running };
  });
  const nsAhead = running >= 0;

  const Panel = () => (
    <div className="score-panel">
      <h1 className="h1 score-title">{nsAhead ? 'N/S' : 'E/W'} Win</h1>
      <table className="score-table">
        <thead>
          <tr>
            <th>Board</th>
            <th>Contract</th>
            <th>Result</th>
            <th>N/S</th>
            <th>E/W</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ b, running: r }) => {
            const hasBids = b.bids && b.bids.length > 0;
            return (
              <tr
                key={b.board}
                className={hasBids ? 'score-row--click' : ''}
                onClick={hasBids ? () => setHistoryBoard(b.board) : undefined}
              >
                <td>
                  {b.board}
                  {hasBids && <span className="row-hint"> bids</span>}
                </td>
                <td>
                  <ContractCell c={b.contract} />
                </td>
                <td>{resultText(b)}</td>
                <td>{b.scoreNS ? '+' + b.scoreNS : ''}</td>
                <td>{b.scoreEW ? '+' + b.scoreEW : ''}</td>
                <td>{r >= 0 ? 'NS +' + r : 'EW +' + -r}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="score-actions">
        <button className="icon-btn" onClick={() => dispatch({ type: 'go', screen: 'contract' })} aria-label="Back">
          ↺
        </button>
        <button className="btn-primary" onClick={() => dispatch({ type: 'nextHand' })}>
          Next Hand
        </button>
        <button className="btn-primary btn-primary--filled" onClick={newGameFromScratch}>
          New Game
        </button>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <TopBar centerLabel="Game" />
      <div className="score-split">
        <div className="score-zone score-zone--top">
          <Panel />
        </div>
        <div className="score-seam" />
        <div className="score-zone">
          <Panel />
        </div>
      </div>
    </div>
  );
}
