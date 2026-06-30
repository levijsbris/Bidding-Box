# Bridge Table Companion

An **offline-first, table-centre Bridge bidding and scoring aid**. One device sits
flat in the middle of the table and serves up to four players seated on all four
sides at once — every screen renders to face each seat. Accessibility is the
default, not an add-on.

> The full product brief, architecture, data model, API spec, and the original
> working prototype live in [`docs/`](./docs). The prototype
> (`docs/bridge-prototype.html`) is the behavioural source of truth.

## Scope of this build

**Offline-only.** Rules and scoring run on-device in TypeScript (one engine, in
the client). Persistence is **IndexedDB**; the app plays a complete game with no
network. The C# / Cloud Functions / Firestore backend described in the docs is
**deferred** — today's structure stays compatible with it, but it is not built.
GCP is used now only to host the static web app.

## Stack

- **Frontend:** React + TypeScript SPA, PWA-capable (Vite, `vite-plugin-pwa`).
- **Engine:** pure, framework-free TypeScript (`apps/web/src/domain`) with golden
  fixtures, held to 100% coverage.
- **State/persistence:** a pure reducer + IndexedDB repository, with JSON
  export/import of games.
- **Tests:** Vitest (unit) + Playwright (E2E on key flows).
- **Infra/CI:** Terraform (GCP static hosting) + GitHub Actions.

## Monorepo layout

```
apps/web/            React SPA + PWA + the TS engine
  src/domain/        rules, scoring, rotation (pure, unit-tested) + fixtures
  src/state/         reducer, IndexedDB repository, export/import
  src/render/        orientation, palettes, suits, speech
  src/screens/       NewGame, Bidding, Contract, Tricks, Score
  src/overlays/      Settings, BidHistory
e2e/                 Playwright specs for key user flows
seed/                versioned game fixtures (importable)
infra/terraform/     GCP static-hosting IaC (backend modules deferred)
.github/workflows/   CI, E2E, infra, deploy, release
.devcontainer/       reproducible toolchain
docker-compose.yml   local frontend container
```

## Getting started

```bash
npm install            # install all workspaces
npm run dev            # Vite dev server (http://localhost:5173)
npm test               # unit tests
npm run test:coverage  # unit tests + coverage gate
npm run lint           # eslint
npm run typecheck      # tsc
npm run build          # production build (apps/web/dist)
npm run e2e            # Playwright (builds + serves the app)
```

Or with Docker: `docker compose up`.

## Notable decisions vs. the prototype

The prototype is the behavioural reference, but the port deliberately fixes three
things (see commit history / `docs`):

1. **Persistence** — the prototype kept state in memory only; the app persists to
   IndexedDB and resumes after reload.
2. **"Track Vulnerability" off** now scores every board **non-vulnerable** (the
   prototype still applied the 16-board cycle).
3. **Board history** is recorded even when scoring is off or the board is passed
   out, so past auctions remain reviewable.

## Accessibility

Large high-contrast type and tap targets, four live-switchable palettes, suits
identified by shape **and** label (never colour alone), a no-rotation Four-grids
mode, an animations toggle that honours the OS reduced-motion setting, and
optional (off-by-default) spoken bids.

Treated as acceptance criteria, not polish, and held to **WCAG 2.1/2.2 AA**:

- **Audited automatically** — `e2e/tests/a11y.spec.ts` runs axe-core over every
  screen in all four palettes (desktop) and the compact layout (phone), checking
  contrast, names/roles, and target sizes. All four palettes meet AA contrast.
- **Keyboard** — Settings and Bid History are proper dialogs: focus moves in on
  open, is trapped, closes on Escape, and returns to the trigger. Visible focus
  rings throughout.
- **Zoom** — pinch/zoom is allowed (no `user-scalable=no`).
- **Screen readers** — `<main>` landmark; polite live regions announce whose
  turn it is and the derived contract; all icon buttons carry labels.
- **Extra-large mode** — a Settings toggle that scales text, controls, and the
  bidding grid up across every screen for low vision / limited dexterity (works
  alongside any bidding layout; Compact gives the largest targets).
- **Double-sided bid cards** — each card shows its index in opposite corners
  (like a playing card) so a seat's bids read from the opposite side too.
- **Rotation** — the centre panel always turns the shorter way (≤180°) following
  the clockwise play order, so it never does a disorienting long spin.
