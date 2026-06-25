// How the bidding screen should render right now, derived from the user's saved
// settings and the effective device form factor. This is computed per-render and
// never mutates stored settings, so a phone falls back to Compact while the
// user's tablet choice (Full grid / Four grids) is preserved for when the
// viewport is wide again (US-7/US-18).

import type { BiddingLayout, GameSettings, GridStyle } from './types';

export interface DisplayMode {
  layout: BiddingLayout;
  gridStyle: GridStyle;
}

export function effectiveDisplay(settings: GameSettings, deviceMobile: boolean): DisplayMode {
  if (deviceMobile) {
    // Only Compact fits a phone — Full grid and Four grids need a tablet.
    return { layout: 'autoRotate', gridStyle: 'compact' };
  }
  return { layout: settings.biddingLayout, gridStyle: settings.gridStyle };
}
