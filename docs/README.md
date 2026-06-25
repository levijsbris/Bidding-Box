# Bridge Table Companion — Handoff Pack

This folder is the complete brief for building the Bridge Table Companion: an offline-first, table-centre Bridge bidding and scoring aid that sits in the middle of a table and serves up to four players seated on all four sides at once.

## What's in here

| File | What it is | Read it for |
|---|---|---|
| `PRODUCT.md` | Product description, benefits, functional detail, user stories | The "what and why" — features, accessibility goals, 19 user stories with acceptance criteria. |
| `ARCHITECTURE.md` | Technical architecture (C4 context/container/component, deployment, CI/CD, IaC, testing) | The "how it's built" — React + TypeScript, offline-only, monorepo, GitHub Actions, Terraform on GCP. |
| `DATA_MODEL.md` | Data model (collections, fields, ERD, indexes, denormalisation) | The persistence shapes. Written for Firestore (the deferred backend); the same shapes apply to local IndexedDB today. |
| `API_SPEC.md` | API specification mapped to the UI | The contract for the deferred backend. Also the canonical statement of the Bridge rules + scoring logic (§6). |
| `bridge-prototype.html` | The working single-file prototype | The reference implementation — the actual UI, rules engine, scoring, and four-orientation rendering, all working. **Treat this as the source of truth for behaviour.** |

## Suggested reading order

1. `PRODUCT.md` — understand the product and the user stories.
2. `bridge-prototype.html` — open it in a browser; it works. Use the Desktop/Mobile toggle (top-right) and try all four colour palettes and the three bidding-grid modes.
3. `ARCHITECTURE.md` — the build approach and scope.
4. `DATA_MODEL.md` and `API_SPEC.md` — the data shapes and rules logic (note: backend is deferred — see scope below).

## Critical scope note for this build

**The current build is OFFLINE-ONLY.**

- Rules and scoring run **on-device in TypeScript**. There is **one** engine, in the client.
- Persistence is **IndexedDB** in the browser.
- **No backend is built now.** The C# / Cloud Functions / Firestore content in `ARCHITECTURE.md`, `DATA_MODEL.md`, and `API_SPEC.md` describes a **deferred** future milestone (online sync, multi-device, app-store). It is included so today's structure stays compatible with it — do not build it yet.
- GCP is used now only to **host the static web app**. Local dev needs no backend, no emulator, and no GCP credentials.

When in doubt about behaviour, the prototype wins.

## The build, in brief (from ARCHITECTURE.md)

- **Frontend:** React + TypeScript SPA, PWA-capable. Ports the prototype's screens, four-orientation rendering, rules engine, and scoring.
- **Repo:** GitHub monorepo.
- **CI/CD:** GitHub Actions — lint, unit tests (coverage gate), build, Playwright E2E on key flows, deploy web via Terraform.
- **Infra:** Terraform on GCP (static hosting now; backend modules deferred).
- **Local dev:** containerised frontend + seeded IndexedDB fixtures; `.devcontainer` for a consistent toolchain.
- **Testing:** unit coverage on all code; E2E on every key user flow (listed in `ARCHITECTURE.md` §11.1).
- **Future:** Capacitor wrapper for iOS/Android app-store builds; installable PWA in the interim.

## Open questions worth confirming before/early in the build

These were flagged during design and are cheap to decide now, expensive later:

1. **Game export/import** — IndexedDB is the only store, so clearing browser data loses saved games. A lightweight export/import would mitigate this for testing. Include now, or defer?
2. **Engine reuse path** — if/when the backend arrives, the team chooses between porting the engine to C# (held to the same fixtures) or sharing the TS engine via WASM. Not needed now; noted so the engine is written as a clean, framework-free, portable module.

## Prototype feature checklist (what "done" looks like for parity)

- Five screens: New Game → Bidding → Contract → Tricks → Score, plus Settings overlay and Bid History popup.
- Real Bridge rules: legal-bid validation, doubles/redoubles, auction completion (3 passes after a bid; 4 passes = passed out), declarer derivation.
- Correct duplicate scoring (made/overtricks/doubled/vulnerable/slams/undertricks) with running totals.
- Dealer + vulnerability rotation by board.
- Three bidding display modes: Full grid, Compact, Four grids (Four grids = no rotation, for vertigo).
- Four-orientation rendering; four-grids edge-pinned and auto-scaled to fit any screen.
- Four colour palettes; suits identified by shape + label (never colour alone).
- Accessibility: large targets, high-contrast palette, animations toggle, reduced-motion support, optional spoken bids (off by default).
- Mobile fallback: only Compact fits a phone; Full grid and Four grids disabled with a clear reason; scrollable settings selectors.
- Undo from any seat; offline persistence and resume after reload.
