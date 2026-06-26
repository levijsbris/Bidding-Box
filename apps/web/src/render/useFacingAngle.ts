import { useEffect, useRef, useState } from 'react';
import { SEAT_ANGLE, type Seat } from '../domain';

/**
 * A continuously-accumulating rotation angle that always reaches the target seat
 * by the shorter direction (≤180° per change), so the centre panel never does an
 * ugly ~270° spin between turns. Ties (exactly 180°) go clockwise to match the
 * clockwise play order. Starts at the seat's angle with no animation.
 */
export function useFacingAngle(seat: Seat): number {
  const [angle, setAngle] = useState(() => SEAT_ANGLE[seat]);
  const current = useRef(SEAT_ANGLE[seat]);

  useEffect(() => {
    const target = SEAT_ANGLE[seat];
    let delta = (((target - (current.current % 360)) % 360) + 360) % 360; // 0..359, clockwise
    if (delta > 180) delta -= 360; // take the shorter way
    if (delta === -180) delta = 180; // tie → clockwise (play order)
    current.current += delta;
    setAngle(current.current);
  }, [seat]);

  return angle;
}
