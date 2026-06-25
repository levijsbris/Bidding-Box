import { useGame } from '../state/GameContext';
import { TopBar } from '../components/TopBar';

/** US-1: start a session with one or two choices, then a single Start action. */
export function NewGame() {
  const { state, dispatch } = useGame();

  const Toggle = ({
    option,
    title,
    sub,
  }: {
    option: 'trackVulnerability' | 'calculateScore';
    title: string;
    sub: string;
  }) => (
    <div className="row-flex">
      <div>
        <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>{title}</div>
        <div style={{ color: 'var(--ink-dim)', fontStyle: 'italic' }}>{sub}</div>
      </div>
      <button
        className="toggle"
        data-on={state[option]}
        role="switch"
        aria-checked={state[option]}
        aria-label={title}
        onClick={() => dispatch({ type: 'toggleOption', option })}
      >
        <span className="knob" />
      </button>
    </div>
  );

  return (
    <div className="app-shell">
      <TopBar centerLabel="Game" />
      <div className="center-col">
        <h1 className="h1" style={{ fontSize: '3rem', margin: 0 }}>
          New Game
        </h1>
        <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Toggle option="trackVulnerability" title="Vulnerability" sub="Show and track vulnerability" />
          <Toggle option="calculateScore" title="Calculate score" sub="Show score after each hand" />
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn-primary" onClick={() => dispatch({ type: 'startGame' })}>
          Start Game
        </button>
      </div>
    </div>
  );
}
