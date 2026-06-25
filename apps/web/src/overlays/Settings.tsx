import { useRef, useState } from 'react';
import { useGame } from '../state/GameContext';
import { PALETTES, PALETTE_NAMES } from '../render/palettes';
import { serializeGame, deserializeGame, exportFilename, ImportError } from '../state/exportImport';

/** US-7/US-9/US-12: appearance, bidding layout, motion, and sound — plus game
 *  export/import (decided in scope for this build). */
export function Settings() {
  const { state, dispatch, setSettingsOpen, deviceMobile, display, pickGrid } = useGame();
  const { settings } = state;
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  // Highlight what is actually rendering: the effective mode (Compact on a
  // phone), which may differ from the saved tablet choice.
  const activeChoice: 'table' | 'compact' | 'four' =
    display.layout === 'fourGrids' ? 'four' : display.gridStyle;
  const gridActive = (choice: 'table' | 'compact' | 'four') => choice === activeChoice;

  const exportGame = () => {
    const now = new Date().toISOString();
    const blob = new Blob([serializeGame(state, now)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFilename(state, now);
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const game = deserializeGame(text);
      dispatch({ type: 'hydrate', state: game });
      setImportMsg('Game imported.');
      setSettingsOpen(false);
    } catch (e) {
      setImportMsg(e instanceof ImportError ? e.message : 'Could not import that file.');
    }
  };

  const Toggle = ({
    on,
    onToggle,
    label,
    sub,
  }: {
    on: boolean;
    onToggle: () => void;
    label: string;
    sub: string;
  }) => (
    <div className="toggle-row">
      <div>
        <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{label}</div>
        <div style={{ color: 'var(--ink-dim)', fontStyle: 'italic' }}>{sub}</div>
      </div>
      <button className="toggle" data-on={on} role="switch" aria-checked={on} aria-label={label} onClick={onToggle}>
        <span className="knob" />
      </button>
    </div>
  );

  return (
    <div className="settings-overlay" onClick={() => setSettingsOpen(false)}>
      <div className="settings-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="settings-head">
          <h2 className="h1" style={{ margin: 0, fontSize: '2rem' }}>
            Settings
          </h2>
          <button className="icon-btn" onClick={() => setSettingsOpen(false)} aria-label="Close settings">
            ×
          </button>
        </div>

        <section className="settings-card">
          <h3>Appearance</h3>
          <p className="settings-label">Colour Palettes</p>
          <p className="settings-sub">Choose your colours for the app</p>
          <div className="palette-row">
            {PALETTE_NAMES.map((name) => (
              <button
                key={name}
                className={`palette-card ${settings.palette === name ? 'palette-card--active' : ''}`}
                onClick={() => dispatch({ type: 'updateSettings', patch: { palette: name } })}
              >
                <div className="palette-swatches">
                  {PALETTES[name].swatches.map((c, i) => (
                    <span key={i} style={{ background: c }} />
                  ))}
                </div>
                <span className="palette-name">{name}</span>
              </button>
            ))}
          </div>

          <p className="settings-label">Bidding Grid</p>
          <p className="settings-sub">
            Choose how bidding is shown
            {deviceMobile && <span style={{ color: 'var(--accent)' }}> · only Compact fits on a phone</span>}
          </p>
          <div className="grid-choice-row">
            <button
              className={`grid-choice ${gridActive('table') ? 'grid-choice--active' : ''}`}
              disabled={deviceMobile}
              onClick={() => pickGrid('table')}
            >
              <span className="grid-choice-mini grid-choice-mini--table" />
              Full grid
              {deviceMobile && <span className="gc-reason">Too large for phone</span>}
            </button>
            <button
              className={`grid-choice ${gridActive('compact') ? 'grid-choice--active' : ''}`}
              onClick={() => pickGrid('compact')}
            >
              <span className="grid-choice-mini grid-choice-mini--compact" />
              Compact
            </button>
            <button
              className={`grid-choice ${gridActive('four') ? 'grid-choice--active' : ''}`}
              disabled={deviceMobile}
              onClick={() => pickGrid('four')}
            >
              <span className="grid-choice-mini grid-choice-mini--four" />
              Four grids
              {deviceMobile && <span className="gc-reason">Needs a tablet</span>}
            </button>
          </div>

          <Toggle
            on={settings.animations}
            onToggle={() => dispatch({ type: 'updateSettings', patch: { animations: !settings.animations } })}
            label="Animations"
            sub="Grid rotation and transitions"
          />
        </section>

        <section className="settings-card">
          <h3>Audio</h3>
          <Toggle
            on={settings.sound}
            onToggle={() => dispatch({ type: 'updateSettings', patch: { sound: !settings.sound } })}
            label="Sound Effects"
            sub="Spoken bid announcements"
          />
        </section>

        <section className="settings-card">
          <h3>Game Data</h3>
          <p className="settings-sub">
            Games are stored on this device only. Export to back up or move a game.
          </p>
          <div className="settings-actions">
            <button className="btn-primary" onClick={exportGame}>
              Export Game
            </button>
            <button className="btn-primary" onClick={() => fileRef.current?.click()}>
              Import Game
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onImportFile(f);
                e.target.value = '';
              }}
            />
          </div>
          {importMsg && (
            <p className="settings-sub" style={{ color: 'var(--accent)' }}>
              {importMsg}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
