# Bridge Table Companion — Documentation

This folder holds the architecture and design documentation for the Bridge Table
Companion: an offline-first, table-centre Bridge bidding and scoring aid that sits
in the middle of a table and serves up to four players seated on all four sides at
once.

> **Status: built.** The application is implemented as a React + TypeScript PWA in
> `apps/web` and runs fully offline. These documents describe the **as-built**
> system. The root [`/README.md`](../README.md) is the developer quick-start.

## What's in here

| File | What it is | Read it for |
|---|---|---|
| `PRODUCT.md` | Product description, benefits, functional detail, user stories | The "what and why" — features, accessibility goals, user stories with acceptance criteria. |
| `ARCHITECTURE.md` | **As-built** technical architecture (C4 context/container/component, cloud/deployment diagrams, CI/CD, IaC, testing, responsive, accessibility, PWA) | The "how it's built" — React + TypeScript PWA, offline-only, monorepo, GitHub Actions, GitHub Pages + Terraform/GCP hosting. |
| `DATA_MODEL.md` | Data model | The persistence shapes: the **local IndexedDB** game shape that exists today (§0), and the **deferred** Firestore model it maps to. |
| `API_SPEC.md` | API specification for the **deferred** backend | The future backend contract, and the canonical statement of the Bridge rules + scoring logic (§6) the shipped engine implements. |
| `bridge-prototype.html` | The original single-file prototype | The historical reference the app was ported from. The **shipped app in `apps/web` is now the source of truth**; the prototype is kept for provenance. |

## Suggested reading order

1. `PRODUCT.md` — understand the product and the user stories.
2. `ARCHITECTURE.md` — the as-built architecture and diagrams.
3. `DATA_MODEL.md` and `API_SPEC.md` — data shapes and the rules/scoring logic
   (note: the backend they describe is **deferred** — see scope below).

## Critical scope note

**The build is OFFLINE-ONLY.**

- Rules and scoring run **on-device in TypeScript** (`apps/web/src/domain`). There
  is **one** engine, in the client, unit-tested against golden fixtures.
- Persistence is **IndexedDB** in the browser (`apps/web/src/state/repository.ts`),
  with JSON game export/import.
- **No backend is built.** The C# / Cloud Functions / Firestore content in
  `ARCHITECTURE.md` §4, `DATA_MODEL.md`, and `API_SPEC.md` describes a **deferred**
  future milestone (online sync, multi-device, app-store). It is documented so the
  current structure stays compatible — it is not built.
- Cloud is used only to **host the static web app**: **GitHub Pages** (live,
  installable PWA over HTTPS) and **GCP static hosting via Terraform** (test/prod,
  gated on repo variables). Local dev needs no backend, no emulator, and no GCP
  credentials.

## The build, in brief (from ARCHITECTURE.md)

- **Frontend:** React 18 + TypeScript SPA, PWA (Vite 5, `vite-plugin-pwa`/Workbox).
- **Engine:** pure, framework-free TypeScript (`src/domain`) + golden fixtures.
- **State:** pure reducer + React context; IndexedDB repository; JSON export/import.
- **Repo:** GitHub monorepo (npm workspaces: `apps/web`, `e2e`).
- **CI/CD:** GitHub Actions — lint, typecheck, unit tests (coverage gate), build,
  Playwright E2E, axe accessibility, and deploy (Pages + GCP).
- **Infra:** Terraform on GCP (static hosting; backend modules deferred).
- **Local dev:** Vite dev server on **port 5273** (`host: true` for LAN/tablet
  access); Docker Compose + `.devcontainer`; seeded IndexedDB fixtures.
- **Testing:** unit coverage on the pure layer; E2E on key flows across
  desktop/tablet/phone; axe a11y across all palettes.
- **App form:** installable PWA now (iOS Add to Home Screen, fullscreen, offline);
  Capacitor native build is a future milestone.

## Running it

```bash
npm install            # install all workspaces
npm run dev            # Vite dev server -> http://localhost:5273  (also LAN URL)
npm test               # unit tests
npm run test:coverage  # unit tests + coverage gate
npm run lint           # eslint
npm run typecheck      # tsc
npm run build          # production build (apps/web/dist)
npm run e2e            # Playwright (desktop/tablet/phone) incl. axe a11y
```

GitHub Pages deploys automatically from `main` (see `.github/workflows/pages.yml`).

## Feature checklist (delivered)

- Five screens: New Game → Bidding → Contract → Tricks → Score, plus Settings and
  Bid History overlays. ✔
- Real Bridge rules: legal-bid validation, doubles/redoubles, auction completion,
  declarer derivation. ✔
- Correct duplicate scoring (made/overtricks/doubled/vulnerable/slams/undertricks)
  with running totals, verified by golden fixtures. ✔
- Dealer + vulnerability rotation by board. ✔
- Three bidding display modes: Full grid, Compact, Four grids (no rotation). ✔
- Four-orientation rendering; fit-to-screen for the centre grid and four-grids. ✔
- Four colour palettes (all WCAG AA); suits by shape **and** label. ✔
- **Responsive**: adapts to the real viewport (no manual toggle needed). ✔
- **Accessibility extra-large mode**; focus-managed dialogs; live regions; zoom
  enabled; axe-clean across palettes. ✔
- **Double-sided bid cards** (mirrored corners); **shortest-path** centre-panel rotation. ✔
- Undo from any seat; offline persistence and resume after reload; JSON
  export/import. ✔
- Installable PWA with iOS standalone support. ✔
