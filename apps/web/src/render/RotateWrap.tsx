// Renders content rotated to face a given seat. The outer span has zero
// footprint and the inner is absolutely centred and rotated, so a wide
// pre-rotation strip never pushes the layout off-screen when sideways
// (ported from the prototype's rotateWrap).

import type { ReactNode } from 'react';
import { SEAT_ANGLE, type Seat } from '../domain';

export function RotateWrap({
  facing,
  enabled = true,
  animations,
  children,
}: {
  facing: Seat;
  enabled?: boolean;
  animations: boolean;
  children: ReactNode;
}) {
  const angle = enabled ? SEAT_ANGLE[facing] : 0;
  const transition = animations ? 'transform .55s cubic-bezier(.4,0,.2,1)' : 'none';
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: 0, height: 0 }}>
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(-50%,-50%) rotate(${angle}deg)`,
          transition,
          transformOrigin: 'center center',
          display: 'inline-flex',
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </span>
    </span>
  );
}
