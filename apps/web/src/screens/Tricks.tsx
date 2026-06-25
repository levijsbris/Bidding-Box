import { useGame } from '../state/GameContext';
import { TopBar } from '../components/TopBar';
import { Suit } from '../render/Suit';

/** US-14: a two-sided trick counter, readable and operable from both long sides,
 *  bound to one value. */
export function Tricks() {
  const { state, dispatch } = useGame();
  const c = state.board.contract;
  if (!c) return null;

  const setTricks = (value: number) => dispatch({ type: 'setTricks', value });

  const Prompt = () => (
    <div className="trick-prompt">
      <div className="trick-q">Tricks won by N/S</div>
      <div className="trick-contract">
        Contract:{' '}
        <strong>
          {c.level}
          <Suit strain={c.strain} size={18} /> by {c.declarer}
        </strong>
      </div>
    </div>
  );

  const Counter = () => (
    <div className="trick-counter">
      <button className="trick-btn" onClick={() => setTricks(state.board.nsTricks - 1)} aria-label="One fewer trick">
        −
      </button>
      <div className="trick-num" aria-live="polite">
        {state.board.nsTricks}
      </div>
      <button className="trick-btn" onClick={() => setTricks(state.board.nsTricks + 1)} aria-label="One more trick">
        +
      </button>
    </div>
  );

  return (
    <div className="app-shell">
      <TopBar centerLabel="Game" />
      <div className="trick-split">
        <div className="trick-zone trick-zone--top">
          <Prompt />
          <Counter />
          <button className="btn-primary btn-primary--filled" onClick={() => dispatch({ type: 'confirmScore' })}>
            Add Score
          </button>
        </div>
        <div className="trick-seam" />
        <div className="trick-zone">
          <Prompt />
          <Counter />
          <div className="trick-actions">
            <button className="btn-primary" onClick={() => dispatch({ type: 'go', screen: 'contract' })}>
              Back
            </button>
            <button className="btn-primary btn-primary--filled" onClick={() => dispatch({ type: 'confirmScore' })}>
              Add Score
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
