// Four colour palettes, switchable live (PRODUCT.md §6.3, US-9). Suits also carry
// shape + label everywhere, so colour is never the only signal (US-10).

import type { PaletteName } from '../state/types';

export interface Palette {
  swatches: string[];
  vars: Record<string, string>;
}

export const PALETTES: Record<PaletteName, Palette> = {
  'Felt Green': {
    swatches: ['#1f4a3a', '#2e6b52', '#c0392b', '#f0ce78'],
    vars: {
      '--bg': '#1c4435', '--surface': '#225239', '--surface-2': '#2c6347', '--surface-3': '#367556',
      '--ink': '#f4f7f4', '--ink-dim': '#c6dccf', '--accent': '#f0ce78', '--accent-ink': '#1c2a20',
      '--danger': '#c0392b', '--danger-ink': '#ffffff', '--line': '#3a6e54', '--focus': '#ffe08a',
      '--red-suit': '#ff6b6b', '--black-suit': '#f4f7f4',
    },
  },
  'Navy Blue': {
    swatches: ['#13243f', '#1f3a63', '#1fb8c4', '#d4541f'],
    vars: {
      '--bg': '#0f1f38', '--surface': '#162b4c', '--surface-2': '#1f3a63', '--surface-3': '#28497a',
      '--ink': '#eef4fb', '--ink-dim': '#a9c0dd', '--accent': '#1fb8c4', '--accent-ink': '#06222a',
      '--danger': '#d4541f', '--danger-ink': '#ffffff', '--line': '#2c4d7d', '--focus': '#5fe0ea',
      '--red-suit': '#ff8a8a', '--black-suit': '#eef4fb',
    },
  },
  'High Contrast': {
    swatches: ['#000000', '#2a2a2a', '#ffd400', '#ffffff'],
    vars: {
      '--bg': '#000000', '--surface': '#111111', '--surface-2': '#1c1c1c', '--surface-3': '#2a2a2a',
      '--ink': '#ffffff', '--ink-dim': '#d6d6d6', '--accent': '#ffd400', '--accent-ink': '#000000',
      '--danger': '#ff3b30', '--danger-ink': '#000000', '--line': '#4a4a4a', '--focus': '#ffd400',
      '--red-suit': '#ff5b52', '--black-suit': '#ffffff',
    },
  },
  'Warm Parchment': {
    swatches: ['#9e2b25', '#2f6f8f', '#e7dcc3', '#f3ecdc'],
    vars: {
      '--bg': '#ece3cf', '--surface': '#f3ecdc', '--surface-2': '#e3d8bd', '--surface-3': '#d6c7a3',
      '--ink': '#2b2417', '--ink-dim': '#6a5d44', '--accent': '#9e2b25', '--accent-ink': '#f3ecdc',
      '--danger': '#9e2b25', '--danger-ink': '#f3ecdc', '--line': '#c9b78f', '--focus': '#9e2b25',
      '--red-suit': '#b3261e', '--black-suit': '#2b2417',
    },
  },
};

export const PALETTE_NAMES = Object.keys(PALETTES) as PaletteName[];

export function applyPalette(name: PaletteName, animations: boolean): void {
  const { vars } = PALETTES[name];
  for (const [k, v] of Object.entries(vars)) {
    document.documentElement.style.setProperty(k, v);
  }
  document.body.classList.toggle('no-anim', !animations);
}
