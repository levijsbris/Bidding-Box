import { useGame } from './state/GameContext';
import { NewGame } from './screens/NewGame';
import { Bidding } from './screens/Bidding';
import { Contract } from './screens/Contract';
import { Tricks } from './screens/Tricks';
import { Score } from './screens/Score';
import { Settings } from './overlays/Settings';
import { BidHistory } from './overlays/BidHistory';

export function App() {
  const { state, ready, settingsOpen, historyBoard, deviceMobile, setDeviceMobile } = useGame();

  // Avoid a flash of New Game before a saved game resumes (US-19).
  if (!ready) return <div id="preview" data-device="desktop" />;

  const screen = state.screen;

  return (
    <>
      <div id="preview" className={deviceMobile ? 'preview--mobile' : ''} data-device={deviceMobile ? 'mobile' : 'desktop'}>
        <div id="app">
          {screen === 'newGame' && <NewGame />}
          {screen === 'bidding' && <Bidding />}
          {screen === 'contract' && <Contract />}
          {screen === 'tricks' && <Tricks />}
          {screen === 'score' && <Score />}
          {settingsOpen && <Settings />}
          {historyBoard != null && <BidHistory />}
        </div>
      </div>
      <div id="device-toggle">
        <button className={deviceMobile ? '' : 'dt-on'} onClick={() => setDeviceMobile(false)}>
          Desktop
        </button>
        <button className={deviceMobile ? 'dt-on' : ''} onClick={() => setDeviceMobile(true)}>
          Mobile
        </button>
      </div>
    </>
  );
}
