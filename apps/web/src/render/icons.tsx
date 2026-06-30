// Simple line icons (currentColor, em-sized so they scale with the button font).

/** A clean minimal gear: a centre ring with eight spokes. */
export function GearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="3.4" />
      <line x1="12" y1="2.5" x2="12" y2="5.2" />
      <line x1="12" y1="18.8" x2="12" y2="21.5" />
      <line x1="2.5" y1="12" x2="5.2" y2="12" />
      <line x1="18.8" y1="12" x2="21.5" y2="12" />
      <line x1="5.3" y1="5.3" x2="7.2" y2="7.2" />
      <line x1="16.8" y1="16.8" x2="18.7" y2="18.7" />
      <line x1="5.3" y1="18.7" x2="7.2" y2="16.8" />
      <line x1="16.8" y1="7.2" x2="18.7" y2="5.3" />
    </svg>
  );
}
