import { useGame } from '../state/GameContext';
import { GearIcon } from '../render/icons';

/** Shared header: vulnerability pills, an optional centre label, running totals,
 *  and the settings cog. */
export function TopBar({ centerLabel }: { centerLabel?: string }) {
  const { state, setSettingsOpen } = useGame();
  const { trackVulnerability, calculateScore, board, history } = state;

  const nsVul = board.vulnerability === 'NS' || board.vulnerability === 'Both';
  const ewVul = board.vulnerability === 'EW' || board.vulnerability === 'Both';
  const nsTotal = history.reduce((a, b) => a + b.scoreNS, 0);
  const ewTotal = history.reduce((a, b) => a + b.scoreEW, 0);

  return (
    <div className="topbar">
      {trackVulnerability && (
        <>
          <span className={`pill ${nsVul ? 'pill--vul' : 'pill--safe'}`}>
            N/S {nsVul ? 'Vul' : 'Safe'}
          </span>
          <span className={`pill ${ewVul ? 'pill--vul' : 'pill--safe'}`}>
            E/W {ewVul ? 'Vul' : 'Safe'}
          </span>
        </>
      )}
      {centerLabel && <span className="pill pill--accent pill--turn">{centerLabel}</span>}
      <span className="spacer" />
      {calculateScore && (
        <>
          <span className="pill pill--score">N/S: {nsTotal}</span>
          <span className="pill pill--score">E/W: {ewTotal}</span>
        </>
      )}
      <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="Settings">
        <GearIcon />
      </button>
    </div>
  );
}
