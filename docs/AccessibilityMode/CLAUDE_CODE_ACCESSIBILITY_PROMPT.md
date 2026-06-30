# Claude Code task — Replace the bidding-screen layout with the new accessibility design

## What you are doing (one paragraph)

`bridge-prototype.html` is a single-file, vanilla-JS Bridge bidding/scoring app meant to sit in the **centre of a table** with up to four players seated on all four sides. The bidding screen currently has three layouts (`autoRotate` "Full grid", `autoRotate` "Compact", and `fourGrids`). A new, more accessible design for that bidding screen has been finalised in a standalone reference mockup (`accessibility-bidding.html`, embedded in full at the bottom of this document). **Your job is to port the mockup's layout system, the three grid designs, and the bid-history (seat-strip) design into the real prototype, replacing the current bidding-screen rendering and its CSS.** Nothing else in the app (scoring, contract/tricks screens, rules engine, settings, palettes) changes.

This is a **replacement of existing functions and CSS**, not a new feature bolted on. The prototype already has the right architecture (state object `S`, a single `render()` that rebuilds `#app`, event delegation by `data-*` attributes, `rotateWrap`, `S.compactLevel`, the rules engine). Reuse all of it. Do **not** copy the mockup's scaffolding (its dark control bar, the device landscape/portrait toggle, the `#device` frame, its hard-coded fake bids, its `state` object) — those exist only to demo the mockup in isolation. Only the **layout CSS, the grid renderers, and the seat-strip/history renderers** transfer.

## Hard constraints

- **Single file, no build step.** Keep everything inline in `bridge-prototype.html` (vanilla JS + inline `<style>`). No new dependencies, no frameworks, no external assets.
- **Offline-only.** No network calls.
- **Preserve the rules engine and all `data-*` event contracts.** Bids must still flow through the existing `makeCall`, `isLegalCall`, `seatToBid`, `lastContractBid`, `S.compactLevel`, and the event-delegation handler. Do not re-implement legality, turn order, undo, or scoring.
- **Accessibility is the top priority** (vision impairment, arthritis, low mobility). Large targets, high contrast, read-across-the-table sizing. Keep existing `aria-label`s and add equivalents to any new buttons.
- **No overlap at any screen size.** This was the hardest problem and the mockup solves it structurally (see "The reserved-band system" below). Reproduce that system exactly; do not substitute fixed pixel offsets.
- **Respect `S.animations`.** When false, disable the transitions (the prototype already toggles a `no-anim` body class and `rotateWrap` already checks `S.animations`).

## How the mockup maps onto the prototype

| Mockup (reference) | Prototype (real code) — reuse this |
|---|---|
| `state.grid` = `'compact'` / `'full'` / `'four'` | `S.biddingLayout` (`'autoRotate'` + `S.gridStyle='compact'`), (`'autoRotate'` + `S.gridStyle='table'` → this is "full"), (`'fourGrids'`) |
| `state.active` (whose turn) | `seatToBid(S.dealer, S.bids)` — call it `turn` |
| `state.level` (compact pending level) | `S.compactLevel` |
| `state.bids[seat]` | `S.bids.filter(b=>b.seat===seat)` |
| `registerBid(level,suit)` | `makeCall({kind:'bid',level,strain})` (already legality-checked) |
| Pass/X/XX clicks | `makeCall({kind:'pass'|'double'|'redouble'})` via `data-special` |
| `face-S/W/N/E` rotation classes | `rotateWrap(turn, inner)` already rotates by `SEAT_ANGLE` = `{South:0,West:90,North:180,East:270}` |
| `sg(code,red)` suit glyph | `suitHTML(strain,size)` |
| Level buttons `data-level` | `data-clevel` |
| Suit buttons `data-suit` | `data-cstrain` |
| Full-grid cell `data-bid="2H"` | `data-bid="2H"` (already matched by `/^(\d)(.+)$/`) |
| Mockup `mcCard` (mirrored corner card) | replaces `bigCallLabel` / `bc-card` markup |
| Mockup `mcsCard` (mid mirrored card) | the four-grids history card |

So in practice: the three mockup grid renderers (`compactCentre`, `fullCentre`, `fgGrid`+`fgHist`+`fourCentre`) become the new bodies of the prototype's `biddingGridHTML()` / `biddingScreen()` / `fourGridsBody()` family, but emitting the prototype's `data-clevel/data-cstrain/data-bid/data-special` attributes and calling the prototype's legality checks to set `disabled`.

## The three designs to implement

### 1. Compact ("two-row numbers", replaces current Compact)
- Levels shown as a **two-row grid (4 + 3)** of big number buttons — `1 2 3 4` on top, `5 6 7` below.
- **No hint text.** (The current prototype renders a `.compact-hint` "Level N — pick a suit" line — remove it.)
- Below levels: a row of five suit buttons (`♣ ♦ ♥ ♠ NT`).
- Below that: a `Pass / X / XX` row (`1.7fr 1fr 1fr`).
- Tapping a level sets `S.compactLevel` (re-render, highlight it); tapping a suit makes the bid. Suit buttons are `disabled` unless `S.compactLevel` is set and the resulting call is legal.
- The whole grid is a **fixed-shape block that rotates to face the active seat** via `rotateWrap(turn, …)`.

### 2. Full ("auto-scroll", replaces current Full grid)
- A scrollable 7-row grid: each row is `levelLabel  ♣ ♦ ♥ ♠ NT` (no separate suit header row — the current prototype's header row is removed).
- Each suit cell is a direct one-tap bid (`data-bid="<level><strain>"`), `disabled` when illegal.
- A small `auto-scrolls after each bid` tagline (keep it subtle; it's informational).
- A `Pass / X / XX` row pinned below the scroll area (does not scroll).
- **Auto-scroll:** after a legal bid, scroll the grid so the relevant level row is at the top. Use the existing post-render hook pattern (`requestAnimationFrame` in `render()`), scrolling `#scrollwrap` to the `#lv-<level>` row via `scrollIntoView({block:'start'})`. Respect `S.animations` (use `scroll-behavior:smooth` only when animations are on).
- Also a **fixed-shape block that rotates to face the active seat**.
- NOTE: the user is aware scrolling carries a "scroll-by-accident" risk for some users; keep the scroll area generous and the rows tall so mis-taps are unlikely, but this design is intentionally the scrolling one.

### 3. Four grids (replaces current fourGrids)
- One compact grid **per seat, pinned to that seat's edge**, each rotated to face its player (North 180°, South 0°, West 90°, East 270°).
- Each seat's grid is the **two-row-numbers compact design** (4+3 levels, suit row, Pass/X/XX).
- **Only the active seat's grid is enabled; the others are dimmed.** The active seat's grid **grows in place at its own edge** (it does not move to the centre).
- **Bid history is a separate seat-strip per seat, pinned at the very edge (outermost), independent of the grid.** This is the critical fix: history and grid are **two separately-anchored absolute layers**, so when the active grid grows it expands *toward the table centre* and can never push the history. History uses the mid-size mirrored card (`mcsCard`).
- History strip = undo button + seat name + that seat's mirrored bid cards (last 3).

## The reserved-band system (this is what prevents overlap — implement exactly)

Define these CSS custom properties on the bidding screen's root container:

```css
--bandEnd: clamp(96px, 15vh, 150px);   /* reserved space at TOP and BOTTOM edges (for N/S history) */
--bandSide: clamp(108px, 15vw, 170px); /* reserved space at LEFT and RIGHT edges (for W/E history) */
--gap: 10px;                            /* breathing gap between a band and the grid */
--fgGridOffset: clamp(86px, 12vmin, 120px); /* four-grids: distance from each edge to its grid; tuned to hug the history strip and keep opposing grids apart */
```

Rules that make overlap impossible:

1. **Single-grid screens (Compact, Full):** the four history seat-strips are absolutely positioned pinned to the body edges (N at `top`, S at `bottom`, W at `left`, E at `right`, each rotated to face its seat). The grid is a **fixed-shape block centred** in the body. The grid's width AND max-height are both capped to the **smaller** of the horizontal and vertical centre regions:
   ```css
   width: min(540px,
     calc(100vw - 2*var(--bandSide) - 2*var(--gap)),
     calc(100vh - 52px - 2*var(--bandEnd) - 2*var(--gap)));   /* 52px ≈ top bar height; use the real value */
   max-height: min(
     calc(100vh - 52px - 2*var(--bandEnd) - 2*var(--gap)),
     calc(100vw - 2*var(--bandSide) - 2*var(--gap)));
   ```
   The `min` of *both* axes matters because the grid **rotates** to face side players — a 90° turn swaps width and height, so it must fit either way.

2. **Four-grids:** history strips pin to the edges (inside the bands). Grids anchor at `--fgGridOffset` from each edge (hugging just past the history strip), so they grow toward the centre. The active (grown) grid is additionally capped so it cannot reach the opposite seat's grid:
   ```css
   .mini.active{
     width: min(380px,
       calc(100vw - 2*var(--bandSide) - 4*var(--gap)),
       calc((100vh - 52px - 2*var(--bandEnd)) * 0.62),
       calc((100vw - 2*var(--bandSide)) * 0.62));
   }
   ```

3. **Everything scales together.** Every grid button height/font, every card size, and the row labels use `clamp(...vmin...)` so as the screen shrinks the grids shrink with the bands. No fixed-pixel element may stay large enough to force an overlap. The bands have readable minimums (`96px`/`108px`) as the floor.

> Do not replace this with fixed pixel insets. Earlier iterations used fixed offsets and they overlapped when the screen shrank. The band system is the fix.

## The mirrored-corner bid card (history cards)

Both the single-grid seat strips and the four-grids history use the **mirrored-corner** card design (playing-card style):
- Small `level` + `suit` index in two **opposite corners**, one rotated 180°, so it reads from both long sides.
- Large centre glyph (the suit; for NT show `<level>NT` in the centre).
- Red suits (♦♥) in the red colour, black suits (♣♠) in ink; NT in ink.
- Pass/X/XX render as a word card (`Pass` / `X` / `XX`).
- `newest` card gets the accent border.

Two sizes:
- `.mc` — larger, for the Compact/Full single-screen seat strips: `width:clamp(54px,7.5vmin,78px); height:clamp(74px,10.2vmin,106px)` with `clamp`ed inner fonts.
- `.mcs` — mid, for the four-grids history strip: ~`46×62px`.

(There is already a `BID_CARD_MIRRORED.md` spec in the repo describing this card and a reference renderer — reuse/align with it. The mockup's `mcCard`/`mcsCard` functions are the concrete implementations to port.)

## Rotation model (important conceptual point)

The bidding grid is a **fixed-size block that rotates to face whoever is bidding** — it does **not** scale to the device orientation. South upright (0°), West 90°, North 180°, East 270°. The device being landscape or portrait must **not** distort the grid; every player reads the identical shape, just turned toward them. The prototype's `rotateWrap(turn, inner)` already does exactly this (zero-footprint outer span + absolutely-centred rotated inner), so wrap the grid block in `rotateWrap(turn, gridBlock)`. The reserved-band caps above already account for the rotated footprint.

For the mockup's demo, bids auto-advance the active seat so you can preview every angle. In the **real** app the turn advances naturally via `seatToBid` after each `makeCall`, so the grid will rotate to the next bidder on its own — no extra code needed beyond wrapping in `rotateWrap(turn, …)`.

## Integration steps (suggested order)

1. **Read the current bidding code** in `bridge-prototype.html`: `biddingScreen()`, `biddingGridHTML()`, `seatCard()`, `bigCallLabel()`, `fourGridsBody()`, `fgSeatBlock()`, `miniGridFor()`, `fgBidLabel()`, `rotateWrap()`, the `.auto-layout`/`.seat-pos`/`.fg-*` CSS, and the event-delegation block. These are what you're replacing.
2. **Add the reserved-band CSS variables** to the bidding screen root, plus the new layout CSS (single-grid `.single` edge-pins + centred `.gridblock`; four-grids `.fgh-*` history anchors + `.fgg-*` grid anchors). Port the mockup's CSS for `.compact`, `.full`, `.mini`/`.mini.active`, `.mc`, `.mcs`, `.fg-hist`, button (`.gb`) styles — renaming to fit the prototype's conventions but keeping the exact sizing/`clamp` values.
3. **Rewrite the three renderers** to emit prototype `data-*` attributes and use `isLegalCall` for `disabled`:
   - Compact → two-row levels (4+3), no hint, suit row, special row.
   - Full → auto-scroll 7-row grid, no suit header, `#lv-<n>` row ids, `#scrollwrap`.
   - Four grids → per-seat `fgHist` (edge-pinned) + `fgGrid` (offset-anchored), active grows.
4. **Wrap single-grid block** in `rotateWrap(turn, gridBlock)`; four-grids wraps each seat's block in `rotateWrap(seat, …)`.
5. **Auto-scroll hook:** in `render()` (or the existing post-paint `requestAnimationFrame` block), if `S.screen==='bidding'` and layout is "full", scroll `#scrollwrap` to the active level row. Replace the now-unneeded `fitFourGrids()` JS measuring approach with the pure-CSS band system (the four-grids no longer needs JS scaling — the CSS caps handle it). Remove `fitFourGrids` if nothing else references it.
6. **Keep the settings grid-picker** (`data-gridpick="table|compact|four"`) working — it already sets `S.biddingLayout`/`S.gridStyle`. The three picks now map to the three new designs.
7. **Verify** against the checklist below.

## Acceptance checklist

- [ ] All three layouts render and are selectable from settings (`data-gridpick`).
- [ ] **No overlap** between any grid and any history/seat strip at: wide landscape, narrow portrait, and several sizes in between. Resize continuously — nothing collides.
- [ ] Compact: two-row (4+3) levels, **no hint text**, suit row, Pass/X/XX; illegal suits disabled until a level is picked.
- [ ] Full: no suit header row; one-tap suit cells; **auto-scrolls** to the relevant level after a bid; Pass/X/XX pinned below and not scrolling.
- [ ] Four grids: four edge-pinned grids each facing their seat; only the active one enabled; active grid **grows in place at its edge** (does not jump to centre); **history strips never move** when the active grid grows.
- [ ] Bidding grid is a **fixed shape that rotates** to face the bidder; device orientation does not distort it; turns rotate the grid as play proceeds.
- [ ] History/seat cards use the **mirrored-corner** design, sized to read across a table; newest card highlighted.
- [ ] Legality, turn order, undo (`data-act="undo"`), doubles/redoubles, and scoring all still work via the existing engine — unchanged.
- [ ] `S.animations=false` disables transitions and smooth scroll.
- [ ] Existing `aria-label`s preserved; new buttons have labels. Suit buttons keep `aria-label="${STRAIN_LABEL[strain]}"`.
- [ ] No console errors; single file; no new dependencies.

## Validation note (environment)

Headless browsers/Playwright are blocked in this environment, so validate structurally: confirm the three layouts produce the expected DOM (correct `data-*` attributes, four history strips + four grids in four-grids mode, no hint text in compact, no suit-header row in full), and that legality `disabled` flags match `isLegalCall`. The user will do the visual/responsive pass on a real tablet. Do not claim visual verification you cannot perform.

---

## Reference mockup (authoritative for layout, sizing, and the three designs)

The complete, finalised mockup is below. Treat its **CSS values, the reserved-band system, the rotation model, and the three grid renderers (`compactCentre`, `fullCentre`, `fgGrid`+`fgHist`+`fourCentre`) and card renderers (`mcCard`, `mcsCard`) as the source of truth.** Ignore its demo scaffolding (`#bar` control strip, `#device` frame, landscape/portrait toggle, its own `state` object and hard-coded bids, `gridtype`/`orient` handlers) — those do not transfer; the prototype's `S`, `render()`, `rotateWrap`, and event delegation replace them.

```html
<!-- accessibility-bidding.html — paste of the reference mockup follows -->
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Accessibility — Bidding (responsive)</title>
<style>
:root{
  --felt:#1c4435;--surf:#225239;--s2:#2c6347;--s3:#367556;--ink:#f4f7f4;--dim:#bcd4c6;
  --accent:#e9c46a;--aink:#1c2a20;--red:#ff6b6b;--line:#3a6e54;--focus:#ffe08a;
  /* ONE reserved band per edge holds that seat's history strip. Everything derives from
     these so the grid and history can never collide: history lives inside the band, grid
     lives in the centre region between opposing bands and is sized to fit it. */
  --bandEnd:clamp(96px,15vh,150px);   /* reserved space at TOP and BOTTOM edges */
  --bandSide:clamp(108px,15vw,170px); /* reserved space at LEFT and RIGHT edges */
  --gap:10px;                          /* breathing gap between a band and the grid */
  /* four-grids: distance from each edge to its grid. Smaller than the full band so the grid
     hugs its own history strip (less edge gap) and sits further from the opposite grid. */
  --fgGridOffset:clamp(86px,12vmin,120px);
  /* legacy aliases kept so any stragglers still resolve */
  --edge:var(--bandSide);--edgeTop:var(--bandEnd);--edgeBot:var(--bandEnd);
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{height:100%;margin:0}
body{background:#0d0d0f;color:var(--ink);font-family:'Inter',system-ui,-apple-system,sans-serif;overflow:hidden}
#bar{position:fixed;top:0;left:0;right:0;height:52px;z-index:50;background:#16161a;display:flex;align-items:center;gap:6px;padding:0 12px;border-bottom:1px solid #2a2a30}
#bar .grp{display:flex;gap:4px;background:#000;border-radius:9px;padding:4px}
#bar button{border:none;background:transparent;color:#b8b8c0;font:inherit;font-weight:700;font-size:13px;padding:7px 13px;border-radius:6px;cursor:pointer;white-space:nowrap}
#bar button.on{background:var(--accent);color:#1c2a20}
#bar .lbl{color:#7a7a82;font-size:12px;font-weight:700;margin-right:2px}
#bar .spacer{flex:1}
#bar .hint{color:#7a7a82;font-size:11px}
#stage{position:absolute;top:52px;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:#0d0d0f;padding:16px}
#device{position:relative;background:var(--felt);overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.5);transition:width .5s cubic-bezier(.4,0,.2,1),height .5s cubic-bezier(.4,0,.2,1),border-radius .5s}
#device.landscape{width:min(100%,1180px);height:min(100%,760px);border-radius:18px}
#device.portrait{width:min(100%,740px);height:min(100%,980px);border-radius:26px}
.app{position:absolute;inset:0;display:flex;flex-direction:column}
.topbar{display:flex;align-items:center;gap:8px;padding:12px 14px;flex:0 0 auto;z-index:5}
.pill{padding:8px 13px;border-radius:10px;font-weight:700;font-size:14px;background:var(--s2);color:var(--ink);white-space:nowrap}
.pill--safe{background:var(--surf);color:var(--dim)}
.pill--turn{background:var(--accent);color:var(--aink)}
.pill--score{background:var(--accent);color:var(--aink)}
.topbar .spacer{flex:1}
.cog{width:48px;height:48px;border-radius:12px;display:grid;place-items:center;background:transparent;color:var(--ink);font-size:22px;border:none;cursor:pointer}

/* ===== SKELETON: 3x3 grid; edge tracks hold seats, centre holds the bidding UI =====
   This is what prevents overlap: the centre track is a real grid cell, bounded. */
.skeleton{flex:1;min-height:0;display:grid;
  grid-template-columns:var(--edge) minmax(0,1fr) var(--edge);
  grid-template-rows:var(--edgeTop) minmax(0,1fr) var(--edgeBot);
  grid-template-areas:
    ".    north ."
    "west centre east"
    ".    south .";
}
.cell-n{grid-area:north;display:flex;align-items:center;justify-content:center}
.cell-s{grid-area:south;display:flex;align-items:center;justify-content:center}
.cell-w{grid-area:west;display:flex;align-items:center;justify-content:center}
.cell-e{grid-area:east;display:flex;align-items:center;justify-content:center}
.cell-c{grid-area:centre;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;padding:8px;container-type:size;container-name:centre}
.rot180{transform:rotate(180deg)}
.rot90{transform:rotate(90deg)}
.rot270{transform:rotate(-90deg)}

/* ===== SINGLE-GRID (Compact/Full): everything absolutely positioned in one space.
   Seats pin to body edges; the fixed-size grid centres between them. Because both use
   the same coordinate system, the grid can be sized to never reach the seats. ===== */
.single{position:absolute;inset:0}
.single .seatpin{position:absolute}
.single .sp-n{top:10px;left:50%;transform:translateX(-50%) rotate(180deg)}
.single .sp-s{bottom:10px;left:50%;transform:translateX(-50%)}
.single .sp-w{left:14px;top:50%;transform:translateY(-50%) rotate(90deg)}
.single .sp-e{right:14px;top:50%;transform:translateY(-50%) rotate(-90deg)}
.single .gridblock{position:absolute;top:50%;left:50%}

.red{color:var(--red)}
.gb{background:var(--s2);border:2px solid transparent;border-radius:13px;color:var(--ink);font-weight:800;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .1s;user-select:none}
.gb:active{transform:scale(.96)}
.gb.sel{border-color:var(--accent)}.gb.dim{opacity:.32;pointer-events:none}
.gb.special{background:var(--accent);color:var(--aink)}
.gb.nt{font-size:.62em}

/* ---- seat strip (compact/full) ---- */
.seat{display:flex;align-items:center;gap:12px;background:var(--surf);border:2px solid transparent;border-radius:18px;padding:10px 12px;max-width:100%}
.seat.active{border-color:var(--accent)}
.seat .nm{font-weight:800;font-size:16px;text-align:center;line-height:1.05;flex:0 0 auto}
.seat .nm .cue{display:block;font-size:11px;color:var(--accent);font-weight:700}
.seat .cards{display:flex;gap:9px;overflow:hidden}
.undo{width:50px;height:50px;border-radius:50%;border:2px solid var(--line);background:transparent;color:var(--ink);font-size:22px;display:grid;place-items:center;cursor:pointer;flex:0 0 auto}
/* side seats: their on-screen width is bounded by --edgeTop-ish; cap card count visually */
.cell-w .seat,.cell-e .seat{max-width:none}

/* ---- mirrored-corner bid card ---- */
.mc{position:relative;width:clamp(54px,7.5vmin,78px);height:clamp(74px,10.2vmin,106px);background:var(--s2);border:2px solid transparent;border-radius:13px;flex:0 0 auto}
.mc.newest{border-color:var(--accent)}
.mc .idx{position:absolute;display:flex;flex-direction:column;align-items:center;line-height:.86;font-weight:800}
.mc .idx .l{font-size:clamp(16px,2.2vmin,23px)}.mc .idx .s{font-size:clamp(14px,1.9vmin,20px)}
.mc .tl{top:7px;left:8px}.mc .br{bottom:7px;right:8px;transform:rotate(180deg)}
.mc .ctr{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:clamp(26px,3.5vmin,36px);font-weight:800;line-height:1}
.mc .ctr.nt{font-size:27px}
.mc.callcard{display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800}
.mc.empty{display:flex;align-items:center;justify-content:center;color:var(--dim);font-size:30px;opacity:.5}

/* ===== COMPACT & FULL share a FIXED-SIZE grid block that ROTATES to face the bidder.
   Because the block has fixed px dimensions and only rotates, the device orientation
   never distorts it — every player reads the same shape, just turned toward them. ===== */
.gridblock{position:absolute;top:50%;left:50%;transition:transform .45s cubic-bezier(.4,0,.2,1);transform-origin:center center}
.gridblock.face-S{transform:translate(-50%,-50%) rotate(0deg)}
.gridblock.face-W{transform:translate(-50%,-50%) rotate(90deg)}
.gridblock.face-N{transform:translate(-50%,-50%) rotate(180deg)}
.gridblock.face-E{transform:translate(-50%,-50%) rotate(270deg)}

/* COMPACT V2 — fixed size, sized to clear the seats */
.compact{
  /* width must fit the horizontal centre region AND (since the grid rotates to face side
     players) the vertical region too, so a 90deg turn never overlaps the side bands */
  width:min(540px,
    calc(100vw - 2*var(--bandSide) - 2*var(--gap)),
    calc(100vh - 52px - 2*var(--bandEnd) - 2*var(--gap)));
  max-height:min(
    calc(100vh - 52px - 2*var(--bandEnd) - 2*var(--gap)),
    calc(100vw - 2*var(--bandSide) - 2*var(--gap)));
  display:flex;flex-direction:column;gap:2.2vmin}
.compact .levels{display:grid;grid-template-columns:repeat(4,1fr);gap:2vmin}
.compact .levels .gb{height:clamp(72px,12vmin,104px);font-size:clamp(34px,6vmin,48px)}
.compact .suits{display:grid;grid-template-columns:repeat(5,1fr);gap:2vmin}
.compact .suits .gb{height:clamp(74px,12.5vmin,108px);font-size:clamp(34px,6.2vmin,50px)}
.compact .passrow{display:grid;grid-template-columns:1.7fr 1fr 1fr;gap:2vmin}
.compact .passrow .gb{height:clamp(50px,8vmin,64px);font-size:clamp(17px,2.6vmin,22px)}

/* FULL V4 — height bounded; everything scales with vmin so it grows/shrinks with the screen */
.full{
  width:min(580px,
    calc(100vw - 2*var(--bandSide) - 2*var(--gap)),
    calc(100vh - 52px - 2*var(--bandEnd) - 2*var(--gap)));
  max-height:min(
    calc(100vh - 52px - 2*var(--bandEnd) - 2*var(--gap)),
    calc(100vw - 2*var(--bandSide) - 2*var(--gap)));
  display:flex;flex-direction:column;gap:1.4vmin}
.full .tagline{text-align:center;font-size:clamp(11px,1.6vmin,14px);font-weight:700;color:var(--accent);flex:0 0 auto}
.full .scrollwrap{flex:1 1 auto;min-height:120px;overflow-y:auto;border-radius:12px;scroll-behavior:smooth}
.full .grid{display:grid;grid-template-columns:clamp(38px,5vmin,52px) repeat(5,1fr);gap:clamp(8px,1.4vmin,12px)}
.full .rowlabel{display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--dim);font-size:clamp(20px,3.4vmin,28px);scroll-margin-top:4px}
.full .grid .gb{height:clamp(52px,8.5vmin,76px);font-size:clamp(24px,4.4vmin,34px)}
.full .passrow{display:grid;grid-template-columns:1.7fr 1fr 1fr;gap:clamp(8px,1.4vmin,12px);flex:0 0 auto}
.full .passrow .gb{height:clamp(46px,7vmin,58px);font-size:clamp(16px,2.6vmin,20px)}

/* ===== FOUR GRIDS: each seat pinned to its edge; history is a seat-strip BELOW the grid ===== */
.seatblock{display:flex;flex-direction:column;align-items:center;gap:10px}
.mini{background:var(--surf);border:1px solid var(--line);border-radius:12px;padding:10px;opacity:.55;transition:opacity .2s,padding .2s;width:min(260px, calc(100vw - 2*var(--bandSide) - 4*var(--gap)));box-sizing:border-box}
.mini.active{opacity:1;box-shadow:0 0 0 2px var(--accent)}
.mini .nm{font-size:13px;font-weight:800;text-align:center;margin-bottom:7px}
.mini .nm .cue{color:var(--accent);font-size:11px;margin-left:4px}
.mini .lv{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:5px}
.mini .lv .gb{height:clamp(26px,4.5vmin,32px);font-size:clamp(13px,2.4vmin,16px);border-radius:8px}
.mini .su{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}
.mini .su .gb{height:clamp(26px,4.5vmin,32px);font-size:clamp(13px,2.5vmin,17px);border-radius:8px}
.mini .spec{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:5px;margin-top:5px}
.mini .spec .gb{height:clamp(24px,4vmin,28px);font-size:clamp(11px,2vmin,13px);border-radius:8px}
/* active seat grid grows (history strip stays the same readable size), bounded to fit region */
.mini.active{padding:14px;width:min(380px, calc(100vw - 2*var(--bandSide) - 4*var(--gap)), calc((100vh - 52px - 2*var(--bandEnd))*0.62), calc((100vw - 2*var(--bandSide))*0.62))}
.mini.active .nm{font-size:clamp(14px,2.6vmin,17px);margin-bottom:11px}
.mini.active .lv{gap:9px;margin-bottom:9px}
.mini.active .lv .gb{height:clamp(40px,7vmin,54px);font-size:clamp(20px,3.8vmin,26px);border-radius:12px}
.mini.active .su{gap:9px}
.mini.active .su .gb{height:clamp(42px,7.2vmin,56px);font-size:clamp(21px,4vmin,28px);border-radius:12px}
.mini.active .spec{gap:9px;margin-top:9px}
.mini.active .spec .gb{height:clamp(36px,5.5vmin,44px);font-size:clamp(14px,2.6vmin,17px);border-radius:12px}
/* the history seat-strip (same component used for Compact/Full single screens) */
.fg-hist{display:flex;align-items:center;gap:10px;background:var(--surf);border:1px solid var(--line);border-radius:14px;padding:8px 10px}
.fg-hist .undo{width:42px;height:42px;font-size:18px}
.fg-hist .nm2{font-size:12px;font-weight:800;color:var(--dim)}
.fg-hist .cards{display:flex;gap:7px}
/* mid-size mirrored card for the four-grids history strip */
.mcs{position:relative;width:46px;height:62px;background:var(--s2);border:2px solid transparent;border-radius:9px;flex:0 0 auto}
.mcs.newest{border-color:var(--accent)}
.mcs .idx{position:absolute;display:flex;flex-direction:column;align-items:center;line-height:.84;font-weight:800}
.mcs .idx .l{font-size:14px}.mcs .idx .s{font-size:12px}
.mcs .tl{top:4px;left:5px}.mcs .br{bottom:4px;right:5px;transform:rotate(180deg)}
.mcs .ctr{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:22px;font-weight:800}
.mcs .ctr.nt{font-size:15px}
.mcs.callcard{display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800}
.mcs.empty{display:flex;align-items:center;justify-content:center;color:var(--dim);opacity:.5;font-size:18px}
/* edge anchors: every seat at its edge, facing its player. Rotation is applied to the
   whole block so "below the grid" (history) always ends up toward the table centre. */
/* History strips pin to the very edge (fixed) — identical placement to Compact/Full seats.
   Grids pin inboard of the history and grow toward the centre, so a growing active grid
   never displaces the fixed history. The two are independent absolutely-positioned layers. */
.fg-pos{position:absolute;transition:all .4s cubic-bezier(.4,0,.2,1)}
/* history at edge */
.fgh-n{top:10px;left:50%;transform:translateX(-50%) rotate(180deg)}
.fgh-s{bottom:10px;left:50%;transform:translateX(-50%)}
.fgh-w{left:14px;top:50%;transform:translateY(-50%) rotate(90deg)}
.fgh-e{right:14px;top:50%;transform:translateY(-50%) rotate(-90deg)}
/* grid inboard of the history. Rotation uses center origin (keeps the box where it's
   anchored). The grid box is pinned by its player-side edge, so growth pushes its inner
   edge toward the table centre and the history at the outer edge never moves. */
.fgg-n{top:var(--fgGridOffset);left:50%;transform:translateX(-50%) rotate(180deg)}
.fgg-s{bottom:var(--fgGridOffset);left:50%;transform:translateX(-50%)}
.fgg-w{left:var(--fgGridOffset);top:50%;transform:translateY(-50%) rotate(90deg)}
.fgg-e{right:var(--fgGridOffset);top:50%;transform:translateY(-50%) rotate(-90deg)}

#toast{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:var(--accent);color:var(--aink);font-weight:800;font-size:18px;padding:12px 22px;border-radius:12px;opacity:0;transition:opacity .25s;pointer-events:none;z-index:40}
#toast.show{opacity:1}
@media (prefers-reduced-motion:reduce){*{transition:none!important}.full .scrollwrap{scroll-behavior:auto}}
</style>
</head>
<body>
<div id="bar">
  <span class="lbl">Grid type</span>
  <div class="grp" id="gridtype">
    <button data-g="compact" class="on">Compact (2-row)</button>
    <button data-g="full">Full (auto-scroll)</button>
    <button data-g="four">Four grids</button>
  </div>
  <span class="spacer"></span>
  <span class="hint" id="hint">fixed grid zone · seats can't be overlapped</span>
  <span class="spacer"></span>
  <span class="lbl">Screen</span>
  <div class="grp" id="orient">
    <button data-o="landscape" class="on">Landscape</button>
    <button data-o="portrait">Portrait</button>
  </div>
</div>

<div id="stage">
  <div id="device" class="landscape">
    <div class="app">
      <div class="topbar">
        <span class="pill pill--safe">N/S Safe</span>
        <span class="pill pill--safe">E/W Safe</span>
        <span class="pill pill--turn" id="turnpill">South's turn</span>
        <span class="spacer"></span>
        <span class="pill pill--score">N/S: 0</span>
        <span class="pill pill--score">E/W: 0</span>
        <button class="cog">&#9881;</button>
      </div>
      <div class="skeleton" id="skeleton"></div>
      <div id="toast"></div>
    </div>
  </div>
</div>

<script>
var SUITS=[['C','\u2663',0],['D','\u2666',1],['H','\u2665',1],['S','\u2660',0],['NT','NT',0]];
var SUITLABEL={C:'Clubs',D:'Diamonds',H:'Hearts',S:'Spades',NT:'No Trump'};
var SY={C:'\u2663',D:'\u2666',H:'\u2665',S:'\u2660',NT:'NT'};
var RED={D:1,H:1};
var SEATS=['North','East','South','West'];
var state={grid:'compact',orient:'landscape',active:'South',level:2,
  bids:{North:[{l:2,s:'D'}],East:[],South:[],West:[]}};
function sg(code,red){if(code==='NT')return '<span class="nt">NT</span>';return '<span class="'+(red?'red':'')+'">'+SY[code]+'</span>';}

/* ---- mirrored card (seat strips) ---- */
function mcCard(b){
  if(b.kind){var w=b.kind==='pass'?'Pass':b.kind==='double'?'X':'XX';return '<span class="mc callcard'+(b.newest?' newest':'')+'">'+w+'</span>';}
  var red=RED[b.s],cc=red?'red':'',isNT=b.s==='NT';
  var idx='<span class="l">'+b.l+'</span><span class="s '+cc+'">'+(isNT?'NT':SY[b.s])+'</span>';
  var ctr=isNT?'<span class="ctr nt">'+b.l+'NT</span>':'<span class="ctr '+cc+'">'+SY[b.s]+'</span>';
  return '<span class="mc'+(b.newest?' newest':'')+'"><span class="idx tl">'+idx+'</span>'+ctr+'<span class="idx br">'+idx+'</span></span>';
}
/* ---- tiny history card (four-grids history column) ---- */
function histCard(b){
  if(b.kind){var w=b.kind==='pass'?'P':b.kind==='double'?'X':'XX';return '<span class="histcard'+(b.newest?' newest':'')+'"><span class="hc">'+w+'</span></span>';}
  var red=RED[b.s],cc=red?'red':'',isNT=b.s==='NT';
  var sym=isNT?'NT':SY[b.s];
  return '<span class="histcard'+(b.newest?' newest':'')+'"><span class="hl">'+b.l+'</span><span class="hc '+cc+'" style="font-size:'+(isNT?'11px':'16px')+'">'+sym+'</span><span class="hs">'+b.l+'</span></span>';
}
/* mid-size mirrored card for four-grids history strip */
function mcsCard(b){
  if(b.kind){var w=b.kind==='pass'?'Pass':b.kind==='double'?'X':'XX';return '<span class="mcs callcard'+(b.newest?' newest':'')+'">'+w+'</span>';}
  var red=RED[b.s],cc=red?'red':'',isNT=b.s==='NT';
  var idx='<span class="l">'+b.l+'</span><span class="s '+cc+'">'+(isNT?'NT':SY[b.s])+'</span>';
  var ctr=isNT?'<span class="ctr nt">'+b.l+'NT</span>':'<span class="ctr '+cc+'">'+SY[b.s]+'</span>';
  return '<span class="mcs'+(b.newest?' newest':'')+'"><span class="idx tl">'+idx+'</span>'+ctr+'<span class="idx br">'+idx+'</span></span>';
}
function seatStrip(name,active,limit){
  var cards=state.bids[name]||[];
  var shown=cards.slice(-(limit||4));
  var html=shown.length?shown.map(function(b,i){b.newest=(i===shown.length-1);return mcCard(b)}).join(''):'<span class="mc empty">\u2014</span>';
  return '<div class="seat'+(active?' active':'')+'"><button class="undo" aria-label="Undo">\u21BA</button><div class="nm">'+name+(active?'<span class="cue">to bid</span>':'')+'</div><div class="cards">'+html+'</div></div>';
}

/* ---------- COMPACT V2 ---------- */
function compactCentre(){
  var levels='';for(var i=1;i<=7;i++){levels+='<div class="gb'+(i===1?' dim':'')+(state.level===i?' sel':'')+'" data-level="'+i+'">'+i+'</div>';}
  var suits=SUITS.map(function(s){return '<div class="gb'+(s[0]==='NT'?' nt':'')+'" data-suit="'+s[0]+'">'+sg(s[0],s[2])+'</div>'}).join('');
  return '<div class="compact"><div class="levels">'+levels+'</div><div class="suits">'+suits+'</div>'+
    '<div class="passrow"><div class="gb special" data-call="pass">Pass</div><div class="gb special" data-call="double">X</div><div class="gb special" data-call="redouble">XX</div></div></div>';
}
/* ---------- FULL V4 ---------- */
function fullCentre(){
  var rows='';
  for(var L=1;L<=7;L++){
    rows+='<div class="rowlabel" id="lv-'+L+'">'+L+'</div>'+SUITS.map(function(s){return '<div class="gb'+(L===1?' dim':'')+(s[0]==='NT'?' nt':'')+'" data-bid="'+L+'-'+s[0]+'">'+sg(s[0],s[2])+'</div>'}).join('');
  }
  return '<div class="full"><div class="tagline">auto-scrolls after each bid</div>'+
    '<div class="scrollwrap" id="scrollwrap"><div class="grid">'+rows+'</div></div>'+
    '<div class="passrow"><div class="gb special" data-call="pass">Pass</div><div class="gb special" data-call="double">X</div><div class="gb special" data-call="redouble">XX</div></div></div>';
}
/* ---------- FOUR GRIDS ---------- */
function fgGrid(name,active){
  var levels='';for(var i=1;i<=7;i++){levels+='<div class="gb'+(i===1?' dim':'')+(active&&state.level===i?' sel':'')+'" '+(active?'data-level="'+i+'"':'')+'>'+i+'</div>';}
  var suits=SUITS.map(function(s){return '<div class="gb'+(s[0]==='NT'?' nt':'')+'" '+(active?'data-suit="'+s[0]+'"':'')+'>'+sg(s[0],s[2])+'</div>'}).join('');
  var spec='<div class="spec"><div class="gb special" '+(active?'data-call="pass"':'')+'>Pass</div><div class="gb special" '+(active?'data-call="double"':'')+'>X</div><div class="gb special" '+(active?'data-call="redouble"':'')+'>XX</div></div>';
  return '<div class="mini'+(active?' active':'')+'" '+(active?'':'data-seat="'+name+'"')+'><div class="nm">'+name+(active?'<span class="cue">your turn</span>':'')+'</div><div class="lv">'+levels+'</div><div class="su">'+suits+'</div>'+spec+'</div>';
}
function fgHist(name){
  var bids=state.bids[name]||[];
  var shown=bids.slice(-3);
  var cards=shown.length?shown.map(function(b,i){b.newest=(i===shown.length-1);return mcsCard(b)}).join(''):'<span class="mcs empty">\u2014</span>';
  return '<div class="fg-hist"><button class="undo" aria-label="Undo">\u21BA</button><div class="nm2">'+name+'</div><div class="cards">'+cards+'</div></div>';
}
function fourCentre(){
  // History strips pinned at each edge (fixed); grids pinned inboard (grow toward centre).
  // The two are separate layers, so a growing active grid can't move the fixed history.
  var hAnchor={North:'fgh-n',East:'fgh-e',South:'fgh-s',West:'fgh-w'};
  var gAnchor={North:'fgg-n',East:'fgg-e',South:'fgg-s',West:'fgg-w'};
  var out='';
  SEATS.forEach(function(name){
    out+='<div class="fg-pos '+hAnchor[name]+'">'+fgHist(name)+'</div>';
    out+='<div class="fg-pos '+gAnchor[name]+'">'+fgGrid(name,name===state.active)+'</div>';
  });
  return '<div class="fourwrap">'+out+'</div>';
}

function render(){
  var sk=document.getElementById('skeleton');
  document.getElementById('turnpill').textContent=state.active+"'s turn";
  sk.style.gridTemplateColumns='1fr';sk.style.gridTemplateRows='1fr';sk.style.gridTemplateAreas='"centre"';
  if(state.grid==='four'){
    sk.innerHTML='<div class="cell-c" style="padding:0;container-type:normal">'+fourCentre()+'</div>';
    return;
  }
  // Compact/Full: one absolute layer; seats pinned to body edges; fixed grid centred & rotated to face the bidder
  var face={South:'face-S',West:'face-W',North:'face-N',East:'face-E'}[state.active]||'face-S';
  var grid=state.grid==='compact'?compactCentre():fullCentre();
  sk.innerHTML='<div class="single">'+
    '<div class="seatpin sp-n">'+seatStrip('North',state.active==='North',3)+'</div>'+
    '<div class="seatpin sp-w">'+seatStrip('West',state.active==='West',2)+'</div>'+
    '<div class="seatpin sp-e">'+seatStrip('East',state.active==='East',2)+'</div>'+
    '<div class="seatpin sp-s">'+seatStrip('South',state.active==='South',4)+'</div>'+
    '<div class="gridblock '+face+'">'+grid+'</div>'+
  '</div>';
}
function toast(m){var t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(window._tt);window._tt=setTimeout(function(){t.classList.remove('show')},1300);}
function nextSeat(s){return SEATS[(SEATS.indexOf(s)+1)%4];}
function bidByActive(level,suit){
  state.bids[state.active].push({l:level,s:suit});
  toast(state.active+' bids '+level+(suit==='NT'?'NT':' '+SUITLABEL[suit]));
  state.active=nextSeat(state.active);state.level=2;
  render();
  if(state.grid==='full'){var el=document.getElementById('lv-'+Math.min(7,level));if(el&&el.scrollIntoView)el.scrollIntoView({block:'start'});}
}
document.getElementById('skeleton').addEventListener('click',function(e){
  var seatEl=e.target.closest('[data-seat]');
  if(seatEl){state.active=seatEl.dataset.seat;state.level=2;render();return;}
  var lv=e.target.closest('[data-level]');if(lv){state.level=+lv.dataset.level;render();return;}
  var su=e.target.closest('[data-suit]');if(su){bidByActive(state.level,su.dataset.suit);return;}
  var bid=e.target.closest('[data-bid]');if(bid){var p=bid.dataset.bid.split('-');state.level=+p[0];bidByActive(+p[0],p[1]);return;}
  var c=e.target.closest('[data-call]');if(c){var k=c.dataset.call;state.bids[state.active].push({kind:k});toast(state.active+' '+(k==='pass'?'passes':k==='double'?'doubles':'redoubles'));state.active=nextSeat(state.active);state.level=2;render();return;}
});
var HINT={compact:'fixed grid zone · seats reserved, no overlap',full:'auto-scroll grid · seats reserved, no overlap',four:'history sits below each grid · active grid grows'};
document.getElementById('gridtype').addEventListener('click',function(e){var btn=e.target.closest('button');if(!btn)return;document.querySelectorAll('#gridtype button').forEach(function(b){b.classList.remove('on')});btn.classList.add('on');state.grid=btn.dataset.g;state.active='South';state.level=2;document.getElementById('hint').textContent=HINT[state.grid];render();});
document.getElementById('orient').addEventListener('click',function(e){var btn=e.target.closest('button');if(!btn)return;document.querySelectorAll('#orient button').forEach(function(b){b.classList.remove('on')});btn.classList.add('on');state.orient=btn.dataset.o;document.getElementById('device').className=state.orient;});
render();
</script>
</body>
</html>

```
