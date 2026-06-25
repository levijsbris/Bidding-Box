import { useGame } from './state/GameContext';
import { NewGame } from './screens/NewGame';
import { Bidding } from './screens/Bidding';
import { Contract } from './screens/Contract';
import { Tricks } from './screens/Tricks';
import { Score } from './screens/Score';
import { Settings } from './overlays/Settings';
import { BidHistory } from './overlays/BidHistory';

const OVERRIDES = [
  { key: 'auto', label: 'Auto' },
  { key: 'desktop', label: 'Desktop' },
  { key: 'mobile', label: 'Mobile' },
] as const;

export function App() {
  const { state, ready, settingsOpen, historyBoard, deviceMobile, simulatePhone, deviceOverride, setDeviceOverride } =
    useGame();

  // Avoid a flash of New Game before a saved game resumes (US-19).
  if (!ready) return <div id="preview" data-device="desktop" />;

  const screen = state.screen;

  return (
    <>
      <div
        id="preview"
        className={simulatePhone ? 'preview--mobile' : ''}
        data-device={deviceMobile ? 'mobile' : 'desktop'}
      >
        <main id="app">
          {screen === 'newGame' && <NewGame />}
          {screen === 'bidding' && <Bidding />}
          {screen === 'contract' && <Contract />}
          {screen === 'tricks' && <Tricks />}
          {screen === 'score' && <Score />}
          {settingsOpen && <Settings />}
          {historyBoard != null && <BidHistory />}
        </main>
      </div>
      {/* Dev-only preview affordance: Auto follows the real viewport; Desktop/Mobile
          pin a size for testing. The shipped app is purely viewport-responsive. */}
      {import.meta.env.DEV && (
        <div id="device-toggle" role="group" aria-label="Preview size">
          {OVERRIDES.map((o) => (
            <button
              key={o.key}
              className={deviceOverride === o.key ? 'dt-on' : ''}
              aria-pressed={deviceOverride === o.key}
              onClick={() => setDeviceOverride(o.key)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
