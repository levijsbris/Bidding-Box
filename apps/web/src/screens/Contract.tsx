import { partnerOf, leftOf, SEATS, STRAIN_LABEL, type Seat } from '../domain';
import { useGame } from '../state/GameContext';
import { TopBar } from '../components/TopBar';
import { RotateWrap } from '../render/RotateWrap';
import { Suit } from '../render/Suit';

/** US-13: the contract, declarer, and each seat's role shown facing every edge. */
export function Contract() {
  const { state, dispatch, setHistoryBoard } = useGame();
  const { board, settings, calculateScore } = state;
  const c = board.contract;

  if (!c) {
    return (
      <div className="app-shell">
        <TopBar centerLabel="Game" />
        <div className="sr-only" role="status" aria-live="polite">
          Passed out. No contract this board.
        </div>
        <div className="center-col">
          <h1 className="h1" style={{ fontSize: '2.4rem' }}>
            Passed Out
          </h1>
          <p style={{ color: 'var(--ink-dim)' }}>No contract was reached this board.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-primary" onClick={() => dispatch({ type: 'go', screen: 'bidding' })}>
              Back to Bidding
            </button>
            <button
              className="btn-primary btn-primary--filled"
              onClick={() => dispatch({ type: 'finishWithoutScore' })}
            >
              Next Hand
            </button>
          </div>
        </div>
      </div>
    );
  }

  const declarer = c.declarer;
  const dummy = partnerOf(declarer);
  const leader = leftOf(declarer);

  const roleFor = (seat: Seat): { role: string; note?: string } => {
    if (seat === declarer) return { role: 'Declarer' };
    if (seat === dummy) return { role: 'Dummy Hand' };
    if (seat === leader) return { role: 'Defender', note: 'Opening Lead' };
    return { role: 'Defender' };
  };
  const onSide = (seat: Seat) => seat === declarer || seat === dummy;

  const Badge = ({ seat }: { seat: Seat }) => {
    const r = roleFor(seat);
    return (
      <div className={`role-badge ${onSide(seat) ? 'role-badge--decl' : ''}`}>
        <div className="role-seat">{seat}</div>
        <div className="role-name">{r.role}</div>
        {r.note && <div className="role-note">{r.note}</div>}
      </div>
    );
  };

  const dbl = c.doubled === 'doubled' ? ' X' : c.doubled === 'redoubled' ? ' XX' : '';
  const ContractInner = () => (
    <>
      {c.level}
      <Suit strain={c.strain} size={30} />
      {dbl && <span className="fc-dbl">{dbl}</span>}
    </>
  );

  const byRole = Object.fromEntries(SEATS.map((s) => [s, <Badge key={s} seat={s} />]));

  const spokenDbl = c.doubled === 'doubled' ? ' doubled' : c.doubled === 'redoubled' ? ' redoubled' : '';
  return (
    <div className="app-shell">
      <TopBar centerLabel="Game" />
      <div className="sr-only" role="status" aria-live="polite">
        {`Contract ${c.level} ${STRAIN_LABEL[c.strain]}${spokenDbl} by ${declarer}.`}
      </div>
      <div className="screen-body">
        <div className="contract-grid">
          <div className="role role--north">
            <RotateWrap facing="North" animations={settings.animations}>
              {byRole.North}
            </RotateWrap>
          </div>
          <div className="role role--west">
            <RotateWrap facing="West" animations={settings.animations}>
              {byRole.West}
            </RotateWrap>
          </div>
          <div className="role role--center">
            <div className="fourcard">
              <div className="fc-edge fc-edge--top">
                <ContractInner />
              </div>
              <div className="fc-edge fc-edge--bottom">
                <ContractInner />
              </div>
              <div className="fc-edge fc-edge--left">
                <ContractInner />
              </div>
              <div className="fc-edge fc-edge--right">
                <ContractInner />
              </div>
              <div className="fc-centre">
                <div className="fc-by">by</div>
                <div className="fc-by-seat">{declarer}</div>
              </div>
            </div>
          </div>
          <div className="role role--east">
            <RotateWrap facing="East" animations={settings.animations}>
              {byRole.East}
            </RotateWrap>
          </div>
          <div className="role role--south">{byRole.South}</div>
        </div>
        <div className="contract-actions">
          <button className="icon-btn" onClick={() => dispatch({ type: 'go', screen: 'bidding' })} aria-label="Back">
            ↺
          </button>
          <button className="btn-primary" onClick={() => setHistoryBoard('live')}>
            Bid History
          </button>
          <button
            className="btn-primary btn-primary--filled"
            onClick={() =>
              calculateScore
                ? dispatch({ type: 'go', screen: 'tricks' })
                : dispatch({ type: 'finishWithoutScore' })
            }
          >
            {calculateScore ? 'Add Score' : 'Next Hand'}
          </button>
        </div>
      </div>
    </div>
  );
}
