# Bid Card Design — Mirrored Corners

The design used for per-seat bid-history cards. Implemented as the React
`MirrorCard` component (`apps/web/src/render/Suit.tsx`) with styles under `.mc-*`
in `apps/web/src/index.css`.

## 1. The idea

A bid card styled like a real playing card: the call (level + suit) appears as a
small **index in two opposite corners**, one rotated 180°, with a large suit
glyph in the centre. Because the two corners are point-symmetric, the card reads
upright from **both long sides of the table** — the player opposite sees an
upright index too. The large centre glyph is the at-a-glance anchor.

```
┌─────────────┐
│ 4           │   top-left index: level above suit, upright
│ ♥           │
│      ♥      │   centre: large suit glyph (or "4NT" for no-trump)
│           ♥ │
│           4 │   bottom-right index: same, rotated 180°
└─────────────┘
```

## 2. Anatomy and rules

- **Index (×2):** the level digit with the suit symbol directly beneath it,
  top-left (upright) and bottom-right (rotated 180°). These make it readable from
  two sides.
- **Centre glyph:** the large suit symbol. For a no-trump bid the centre instead
  reads `{level}NT` (e.g. `4NT`), since "NT" has no pip.
- **Colour:** hearts/diamonds use `--red-suit`; spades/clubs use the ink colour —
  applied to both the index suit and the centre glyph via `.suit-red`/`.suit-black`.
  Colour is never the only signal (see §5).
- **Newest bid:** keeps the accent outline (`.mc-card--newest` → `--accent` border).
- **Non-bid calls** (Pass / Double / Redouble): rendered as a centred word
  (`Pass` / `X` / `XX`) duplicated top (rotated) + middle + bottom, lighter than a
  suit bid (`.mc-card--call`).

## 3. Implementation

- Component: `MirrorCard({ call, newest })` in `apps/web/src/render/Suit.tsx`.
- Styles: `.mc-card`, `.mc-idx(--tl/--br)`, `.mc-lvl`, `.mc-suit`, `.mc-centre(--nt)`,
  and `.mc-card--call .mc-word(--top/--mid/--bot)` in `apps/web/src/index.css`.
- Used in the per-seat strips (auto-rotate Full/Compact modes) and the four-grids
  per-seat strips. The Bid History popup keeps its compact inline label — it is
  read by one person leaning over the device, so two-sided reading isn't needed.
- All theming flows from existing palette CSS variables; no new colours.

## 4. Sizes

One card shape (~0.72 width:height), scaled by context. Index font never below
12px (accessibility floor).

| Context | width × height | centre glyph | index level / suit |
|---|---|---|---|
| Desktop per-seat strip | 62 × 86 px | 26px | 18 / 15px |
| Four-grids strip (`.fg-bids .mc-card`) | 52 × 72 px | 22px | 15 / 13px |
| Mobile (`[data-device="mobile"]`) | 46 × 64 px | 20px | 14 / 12px |
| Extra-large mode (`[data-accessible="true"]`) | 70 × 96 px | 36px | 24 / 20px |

## 5. Accessibility (preserved)

- **Shape + label, never colour alone.** The suit is conveyed by its symbol shape
  *and* the card's `aria-label` (`"4 Hearts"`, `"Pass"`). Colour is decorative
  reinforcement only — colour-blind support intact.
- The whole card is one labelled element: `role="img"` with a full `aria-label`;
  the visual indices and centre glyph are `aria-hidden="true"` so a screen reader
  announces the call once.
- Honours the High Contrast (and every) palette automatically via CSS vars.
- The card carries no motion; rotation happens via the seat-facing layout, which
  already respects the animations / reduced-motion toggle.

## 6. Acceptance criteria

- A suit bid shows a small upright index top-left and a 180°-rotated index
  bottom-right, with a large centre suit glyph; reads upright from both long sides.
- A no-trump bid shows `{level}NT` in the centre and `{level}` over `NT` in both
  indices.
- Pass / Double / Redouble render as a duplicated, two-sided word, lighter than a
  suit bid.
- The newest call in a strip keeps the accent outline.
- Suit colour matches the active palette; suit identity is still conveyed without
  colour (shape + `aria-label`).
- Sizes adapt per context without the index dropping below 12px.
- No new colours; all theming from existing palette CSS variables.
