# Bridge Table Companion — Architecture Document

## 0. About this document

This describes the **as-built** architecture of the Bridge Table Companion: an
offline-first, table-centre Bridge bidding and scoring aid. The application has
been implemented as a **React + TypeScript single-page app (PWA)** whose rules and
scoring run entirely on-device, persisting to the browser's IndexedDB. There is
**no backend**: a C# / Cloud Functions / Firestore service remains a documented
**deferred** milestone (see §4) so today's choices stay compatible with it, but it
is not built.

It uses the **C4 model** (Context → Container → Component) plus deployment/cloud,
pipeline, and runtime diagrams. All diagrams are Mermaid and render on GitHub.

> **Status legend.** **(built)** = implemented and in the repository today.
> **(deferred)** = intended future work, documented but not built.

### Guiding decisions (the short version)

| Decision | Choice | Why |
|---|---|---|
| Offline behaviour | **Offline-first (built).** A full game plays with no network. | The product is one device on a table; connectivity must never be required mid-game. |
| Rules + scoring | **TypeScript only (built)**, pure modules in the client. | Offline-only — no server authority, so the engine lives once, in `src/domain`, fully unit-tested against golden fixtures. |
| Frontend | **React 18 + TypeScript SPA, PWA** (Vite 5, `vite-plugin-pwa`/Workbox). | Rich four-orientation UI; installable to the home screen; reused for a native shell later. |
| State | **Pure reducer + React context** (`src/state`). | A single, testable source of truth orchestrating the engine and persistence. |
| Persistence (local) | **IndexedDB** via `idb`, single `current` game document. | True offline storage; resume after reload. |
| Persistence (cloud) | **Deferred** (Firestore, when a backend arrives). | Not needed for offline play. |
| Backend | **Deferred.** | Offline play needs none; keeping it out removes a whole class of complexity. |
| Repo | **GitHub monorepo** (npm workspaces). | One source of truth for app, infra, seed, and tests. |
| CI/CD | **GitHub Actions** (6 workflows). | Lint, typecheck, unit+coverage, build, Playwright E2E, axe a11y, deploy. |
| Hosting | **GitHub Pages (built)** for the live installable PWA; **GCP static hosting via Terraform (built, gated)** for the test/prod web target. | Pages gives trusted HTTPS for iPad/PWA testing now; GCP is the reproducible production host, activated when project vars are set. |
| Local dev | **Vite dev server (port 5273)**, Docker Compose + devcontainer, seeded fixtures. | Consistent toolchain; LAN-reachable for tablet testing. |
| Native | **Capacitor** wrapper (future) + installable PWA (now). | Reuse the same source as the iOS/Android shell. |

---

## 1. System context (C4 L1)

```mermaid
C4Context
    title System Context — Bridge Table Companion (offline-only, as built)

    Person(players, "Players (up to 4)", "Seated on four sides of one device; mixed ability / accessibility needs")
    Person(host, "Host", "Starts the game and sets options")

    System(bridge, "Bridge Table Companion", "Offline-first React + TypeScript PWA; rules + scoring run on-device; state in IndexedDB")

    System_Ext(github, "GitHub", "Source, CI/CD (Actions), and GitHub Pages hosting")
    System_Ext(ghpages, "GitHub Pages", "Trusted-HTTPS static host for the installable PWA")
    System_Ext(gcp, "Google Cloud Platform", "Static web hosting via Terraform (test/prod); Cloud Functions + Firestore deferred")
    System_Ext(store, "App Stores", "Apple App Store / Google Play (deferred — future Capacitor build)")

    Rel(players, bridge, "Bid, score, review — from any seat", "touch")
    Rel(host, bridge, "New game, settings", "touch")
    Rel(bridge, ghpages, "Served as a static PWA (current)", "HTTPS")
    Rel(bridge, gcp, "Served as a static web app (test/prod)", "HTTPS")
    Rel(github, ghpages, "Build + deploy", "GitHub Actions")
    Rel(github, gcp, "Terraform apply + deploy (WIF)", "GitHub Actions")
    Rel(bridge, store, "Distributed via (deferred)", "native build")
```

**Key point:** there is **no backend**. The app plays a complete game entirely
on-device from local storage. Cloud providers serve only the **static app shell**;
the device then runs against local IndexedDB. Cloud Functions and Firestore are
deferred (§4).

---

## 2. Container view (C4 L2)

```mermaid
C4Container
    title Container View — Bridge Table Companion (as built)

    Person(players, "Players", "Four seats, one device")

    System_Boundary(app, "Bridge Table Companion (browser)") {
        Container(spa, "React SPA", "TypeScript, React 18, Vite", "All UI: 5 screens, 2 overlays, four-orientation rendering, responsive + accessibility")
        Container(engine, "Domain engine", "Pure TypeScript (src/domain)", "Legal-bid validation, auction completion, declarer derivation, duplicate scoring, dealer/vulnerability rotation")
        Container(store, "State store", "TypeScript reducer + React context (src/state)", "Single source of truth; orchestrates engine + persistence; export/import")
        Container(localdb, "Local Store", "IndexedDB (idb)", "One game document; full offline persistence and resume")
        Container(sw, "Service Worker", "Workbox (vite-plugin-pwa)", "App-shell precache; offline load; installable")
    }

    System_Boundary(hosting, "Static hosting (build target)") {
        Container(pages, "GitHub Pages", "Static + CDN", "Live installable PWA over HTTPS")
        Container(gcs, "GCP static hosting", "GCS website bucket (Terraform)", "Test/prod web target (gated)")
    }

    System_Boundary(cloud, "Backend (deferred)") {
        Container(api, "Bridge API", "C# .NET, Cloud Functions", "Sync + persistence authority")
        ContainerDb(fs, "Firestore", "Native mode", "Cloud game state")
    }

    Rel(players, spa, "Interact", "touch")
    Rel(spa, engine, "Validate + derive", "function calls")
    Rel(spa, store, "Dispatch actions / read state")
    Rel(store, engine, "Apply rules + scoring")
    Rel(store, localdb, "Load / save game", "IndexedDB API")
    Rel(spa, sw, "Cached app shell", "fetch")
    Rel(players, pages, "Loads app", "HTTPS")
    Rel(players, gcs, "Loads app (test/prod)", "HTTPS")
    Rel(store, api, "Push/pull state (deferred)", "HTTPS/JSON")
    Rel(api, fs, "Read/write (deferred)", "gRPC")
```

### 2.1 The engine lives once, in TypeScript

The Bridge engine runs **only client-side**, as pure framework-free modules in
`apps/web/src/domain`. Because the app is offline-only there is no competing
server authority — a single implementation to build, test, and trust. It is held
to **golden JSON-style fixtures** in unit tests (≈96%+ coverage on the domain).
If a backend is added later, those fixtures and `API_SPEC.md` §6 are the contract
a server would be held to.

```mermaid
flowchart LR
    Spec[Rules spec + golden fixtures] --> TS[TypeScript engine - on-device authority]
    TS -. validated against .-> Fix[(Vitest fixtures)]
    TS -. reused by .-> Future[Native shell / WASM - future]
```

---

## 3. Component view (C4 L3) — the React SPA

The app is organised into pure domain, state, render helpers, screens, and
overlays. Arrows are runtime dependencies.

```mermaid
flowchart TD
    subgraph UI[Presentation - React]
        Screens["screens/: NewGame, Bidding, Contract, Tricks, Score"]
        Overlays["overlays/: Settings, BidHistory"]
        Comp["components/: TopBar"]
    end
    subgraph Render[Render helpers - src/render]
        Rotate["RotateWrap + useFacingAngle (shortest-path rotation)"]
        Suit["Suit / call labels (shape + label)"]
        Palettes["palettes (4, WCAG AA)"]
        Hooks["useMediaQuery, useDialog, speak"]
    end
    subgraph StateLayer[State + persistence - src/state]
        Ctx["GameContext (provider): hydrate, persist, device detect, side effects"]
        Reducer["reducer (pure actions)"]
        Display["display (effective layout)"]
        Board["board (fresh board, vul rule)"]
        Repo["repository (IndexedDB via idb)"]
        IO["exportImport (JSON)"]
    end
    subgraph Domain[Domain engine - src/domain, pure + tested]
        Auction["auction: legality, completion, declarer"]
        Scoring["scoring: duplicate scoring"]
        Rotation["rotation: dealer + vulnerability cycle, seat angles"]
        Types["types + constants + fixtures"]
    end

    Screens --> Ctx
    Overlays --> Ctx
    Comp --> Ctx
    Screens --> Render
    Overlays --> Render
    Ctx --> Reducer
    Ctx --> Repo
    Ctx --> Display
    Ctx --> Hooks
    Reducer --> Board
    Reducer --> Auction
    Reducer --> Scoring
    Board --> Rotation
    Repo --> IDB[(IndexedDB)]
    IO --> Repo
    Auction --> Types
    Scoring --> Types
    Rotation --> Types
```

| Component | Responsibility |
|---|---|
| `screens/` | The five screens mapped 1:1 to the product flow (NewGame → Bidding → Contract → Tricks → Score). |
| `overlays/` | Settings (palette, layout, animations, sound, **extra-large accessibility**, export/import) and BidHistory (dual-flip auction), both accessible dialogs. |
| `render/` | Four-sided rendering (`RotateWrap` + `useFacingAngle`), shape+label suits, palettes, `useMediaQuery` (viewport device detection), `useDialog` (focus trap/Escape/restore), optional spoken bids. |
| `state/` | `GameContext` provider (hydrate from IndexedDB, persist on change, device/display state, palette/speech side effects, action wrappers); `reducer` (pure); `repository` (idb); `exportImport`; `display` (effective layout). |
| `domain/` | Pure, framework-free engine: `auction`, `scoring`, `rotation`, `types`, `constants`, `fixtures`. The on-device authority, unit-tested. |

---

## 4. Backend (C# Cloud Functions) — **deferred**

> **Not built.** Retained as the intended design for a future online / app-store
> version so present-day choices stay compatible. No backend code, Firestore, or
> Cloud Functions are provisioned. `DATA_MODEL.md` and `API_SPEC.md` describe this
> milestone; today the equivalent shapes live locally (IndexedDB) — see
> `DATA_MODEL.md` §0.

```mermaid
flowchart TD
    HTTP[HTTPS request] --> Fn[Cloud Function entrypoint - .NET isolated]
    Fn --> Val[Request validation + auth]
    Val --> Rules[Bridge rules + scoring services]
    Rules --> RepoC[Firestore repository]
    RepoC --> FS[(Firestore)]
    Rules --> Resp[Domain -> DTO mapping]
    Resp --> HTTP
```

When introduced, the team chooses between porting the engine to C# (held to the
same fixtures) or sharing the TypeScript engine via WASM. That decision is
deferred along with the backend.

---

## 5. Deployment & cloud architecture

### 5.1 Environments

| Environment | Purpose | Frontend host | Backend | Data |
|---|---|---|---|---|
| **Local** | Day-to-day dev | Vite dev server (`:5273`) | — | Seeded IndexedDB fixtures |
| **Pages** (live now) | Shareable installable PWA / device testing | **GitHub Pages** (HTTPS) | — | Browser IndexedDB |
| **Test** | Shared QA + E2E | **GCP static hosting** (Terraform, gated) | — | Browser IndexedDB |
| **Production** | Public web, then app store | **GCP static hosting / CDN** (Terraform, gated) | Deferred | Browser IndexedDB |

"Data" is always the **browser's IndexedDB**, not a server database. GitHub Pages
is active today (used for iPad/PWA testing at `/<repo>/` base); GCP hosting is
fully scaffolded in Terraform and activates once the `GCP_PROJECT_ID` repo
variable is set.

### 5.2 Cloud architecture (build + serve)

```mermaid
flowchart TB
    Dev[Developer] -->|git push| GH[GitHub repo]

    subgraph Actions[GitHub Actions CI/CD]
        CI["ci.yml — lint, typecheck, unit/coverage, build"]
        E2E["e2e.yml — Playwright + axe"]
        PagesJob["pages.yml — build base=/repo/ then deploy"]
        Infra["infra.yml — terraform fmt/validate/plan/apply"]
        DeployTest["deploy-test.yml — build then upload"]
        Release["release.yml — tag v* then prod"]
    end

    GH --> Actions
    PagesJob -->|deploy| Pages[(GitHub Pages - HTTPS CDN)]
    Infra -->|WIF| GCP
    DeployTest -->|WIF upload dist| GCP
    Release -->|WIF upload dist| GCP

    subgraph GCP[GCP project per environment]
        Bucket[GCS website bucket + public read]
        CDN[Cloud CDN / custom domain - future]
        Bucket --- CDN
    end

    subgraph Client[User device - tablet centre-table]
        Browser[Browser / installed PWA]
        SW[Service Worker - app-shell cache]
        IDB[(IndexedDB - game state)]
        Browser --- SW
        Browser <--> IDB
    end

    Pages -->|GET app shell| Browser
    CDN -->|GET app shell| Browser
    Release -. deferred .-> Native[Capacitor native build -> App Stores]
```

- **Auth to GCP:** GitHub Actions uses **Workload Identity Federation** (no
  long-lived service-account keys). Deploy/infra jobs are guarded by repo
  variables (`GCP_PROJECT_ID`, `GCP_WIF_PROVIDER`, `GCP_DEPLOY_SA`, bucket names)
  and no-op until those are set.
- **The only cloud surface is static hosting.** Once loaded, the device runs
  entirely against the service worker cache and IndexedDB.

### 5.3 Local development

```mermaid
flowchart TB
    Dev[Developer] --> Vite["Vite dev server :5273, host:true"]
    Vite --> Browser[Desktop browser]
    Vite -->|same Wi-Fi LAN| Tablet[iPad / tablet]
    Seed[seed/fixtures] -. import via Settings .-> IDB[(IndexedDB)]
    note["docker compose up runs the same Vite container.<br/>.devcontainer pins Node 20 + Terraform.<br/>No backend / emulator needed."]
```

`host: true` binds the dev server to the LAN so a tablet on the same Wi-Fi can
load `http://<mac-ip>:5273`. The PWA service worker is only active in the
production build / on HTTPS hosts (Pages/GCP), so true offline + install is tested
there.

---

## 6. Monorepo structure (as built)

```
bridge-table-companion/
├─ apps/web/                      # React + TypeScript SPA, PWA, IndexedDB
│  ├─ index.html                  # PWA + iOS standalone meta + apple-touch-icon
│  ├─ vite.config.ts              # Vite + PWA + Vitest config; base, port 5273
│  ├─ public/                     # favicon.svg, icon-192/512.png, apple-touch-icon.png
│  └─ src/
│     ├─ domain/                  # rules, scoring, rotation (pure) + fixtures + *.test.ts
│     ├─ state/                   # reducer, GameContext, repository (idb), exportImport, display, board
│     ├─ render/                  # RotateWrap, useFacingAngle, useMediaQuery, useDialog, palettes, Suit, speak
│     ├─ screens/                 # NewGame, Bidding, Contract, Tricks, Score, result
│     ├─ overlays/                # Settings, BidHistory
│     ├─ components/              # TopBar
│     ├─ App.tsx / main.tsx       # composition + entry
│     └─ index.css                # all styles (palettes, responsive, accessibility)
├─ e2e/                           # Playwright: game-flow, offline-resume, responsive, a11y (axe)
├─ seed/                          # versioned game fixtures (importable)
├─ infra/terraform/               # GCP static-hosting IaC (modules/hosting; envs test/prod)
├─ .github/workflows/             # ci, e2e, pages, infra, deploy-test, release
├─ docker-compose.yml             # local frontend container
├─ .devcontainer/                 # reproducible Node 20 + Terraform toolchain
└─ (deferred) services/api/       # C# .NET Cloud Functions — added with the backend
```

`apps/*` and `e2e` are **npm workspaces**; root scripts (`dev`, `build`, `test`,
`test:coverage`, `lint`, `typecheck`, `e2e`) fan out to them.

---

## 7. CI/CD (GitHub Actions)

```mermaid
flowchart LR
    PR[Pull request] --> CI[ci.yml<br/>lint - typecheck - unit/coverage - build]
    PR --> E2E[e2e.yml<br/>Playwright + axe]
    CI --> Gate{All green?}
    E2E --> Gate
    Gate -->|no| Block[Block merge]
    Gate -->|yes| Merge[Merge to main]

    Merge --> Pages["pages.yml — build base=/repo/ then deploy to GitHub Pages"]
    Merge --> DeployTest["deploy-test.yml — build then upload to GCS test (gated)"]
    PRinfra["PR touching infra/"] --> Infra["infra.yml — fmt, validate, plan"]
    Merge --> InfraApply["infra.yml — apply test (gated)"]
    Tag["git tag v*"] --> Release["release.yml — test, build, upload to GCS prod (gated)"]
```

| Workflow | Trigger | Does |
|---|---|---|
| `ci.yml` | PR + push main | Lint, typecheck, unit tests with **coverage gate**, build; uploads coverage. |
| `e2e.yml` | PR | Build web, install Playwright browsers, run E2E (incl. axe a11y). |
| `pages.yml` | push main | Build with `VITE_BASE=/Bidding-Box/`, deploy to **GitHub Pages**. |
| `infra.yml` | PR/`push` touching `infra/` | `terraform fmt`/`validate`/`plan` (PR), `apply` test (main) — gated + WIF. |
| `deploy-test.yml` | push main | Build, upload `dist` to GCS test bucket — gated + WIF. |
| `release.yml` | tag `v*` | Re-run tests, build, upload to GCS prod bucket — gated + WIF. |

- **Coverage gate:** enforced for `apps/web`. Scoped to the pure layer
  (`src/domain`, `src/state`): domain ≈96% lines / 100% functions / 88% branches;
  React glue and the IndexedDB repository are exercised by E2E instead.
- **Auth to GCP:** Workload Identity Federation; GCP jobs no-op without repo vars.

---

## 8. Infrastructure as Code (Terraform on GCP)

```mermaid
flowchart TD
    subgraph TF[infra/terraform]
        Mod["modules/hosting (GCS website bucket + public read)"]
        Test[envs/test]
        Prod[envs/prod]
        Later["modules: functions, firestore, secret-manager - deferred"]
    end
    Mod --> Test
    Mod --> Prod
    Test --> GA["GitHub Actions — plan + apply via WIF"]
    Prod --> GA
    GA --> GCP[(GCP projects - static hosting)]
    Later -.->|added with backend| Mod
```

- **State:** remote Terraform state in a GCS bucket (`backend "gcs"`, one prefix
  per environment); one project per environment.
- **Module (now):** `hosting` — a website-enabled GCS bucket with public object
  read and SPA fallback (`index.html` as 404). A CDN / custom domain fronts it in
  production.
- **Modules (deferred):** Firestore, Cloud Functions, Secret Manager.
- **No manual console changes** — environments are reproducible and diffable.

---

## 9. Data seeding

Because the app is offline-only, the "database" is the browser's IndexedDB.
`seed/fixtures/*.json` are games in the app's **export format**, loadable today via
**Settings → Game Data → Import Game**. A dev query-flag seed and E2E seeding are
planned seams. Fixtures cover scoring branches and auction states; `sample-game`
includes a made part-score and a passed-out board. See `seed/README.md`.

---

## 10. Testing strategy

```mermaid
flowchart TD
    subgraph Pyramid[Test pyramid]
        U["Unit (Vitest, jsdom): domain engine + state reducer/display/export — golden fixtures"]
        E["E2E (Playwright): key flows across desktop / tablet / phone projects"]
        A["Accessibility (axe-core): every screen x 4 palettes + mobile"]
    end
    U --> E
    E --> A
    Golden[(Domain fixtures)] --> U
```

| Layer | Scope | Tooling | Gate |
|---|---|---|---|
| **Unit** | Rules, scoring, rotation, reducer, display, export/import. | Vitest + v8 coverage | Coverage threshold in CI. |
| **E2E** | New game → auction → contract → tricks → score; undo; offline resume; responsive reflow; settings. | Playwright (desktop Chromium, tablet WebKit/iPad, phone Chromium/Pixel 5) | Must pass to merge. |
| **Accessibility** | WCAG 2.1/2.2 A/AA incl. `target-size`. | `@axe-core/playwright` | Zero violations across all palettes (desktop) + compact (phone). |

E2E runs against `vite preview` (`:4173`) of the production build. Key flows:
new-game/settings, full auction + legal/illegal + undo, contract + roles, tricks +
score, multi-board rotation, bid history, four-grids no-rotation, palette +
accessibility toggles, offline reload, responsive resize (desktop↔mobile),
double-sided strips, and dialog keyboard behaviour.

---

## 11. Offline behaviour

```mermaid
sequenceDiagram
    participant U as Player
    participant SPA as React SPA (TS engine)
    participant IDB as IndexedDB

    U->>SPA: Make a call
    SPA->>SPA: Validate + apply (on-device engine, pure reducer)
    SPA->>IDB: Persist the game document
    SPA-->>U: UI updates (no network)
    Note over SPA,IDB: Bidding, contract, tricks, scoring — all on-device.
    U->>SPA: Reload / reopen
    SPA->>IDB: Load 'current' game
    SPA-->>U: Resume exactly where the table left off
```

- The app **never touches the network** to play. Every action is validated by the
  TypeScript engine and persisted to IndexedDB under a single `current` key.
- The **service worker** (Workbox, `autoUpdate`) precaches the app shell so the
  app loads and installs offline on HTTPS hosts.
- A lightweight **JSON export/import** mitigates IndexedDB being device-local.

---

## 12. Responsive & rendering architecture

The defining technical feature is rendering content to face each of four seats,
on any screen size.

```mermaid
flowchart TD
    VP["useMediaQuery — max-width 820px OR max-height 520px"] --> Dev{Effective device}
    Override["Preview override (dev only) — Auto / Desktop / Mobile"] --> Dev
    Dev --> Disp["effectiveDisplay(): phone -> Compact; tablet/desktop -> saved layout"]
    Disp --> Layout{Bidding layout}
    Layout --> Compact["Compact: two-row levels (4+3) + suits + Pass/X/XX"]
    Layout --> Full["Full: auto-scroll 7-row grid (one-tap cells), pinned Pass row"]
    Layout --> Four["Four grids: edge-pinned grid per seat; active grows in place; nothing rotates"]
    Compact --> Band["Reserved-band system caps the grid to the centre region between seat strips"]
    Full --> Band
```

- **Viewport-driven:** the app reacts to real window size; the on-screen
  Auto/Desktop/Mobile toggle is a **dev-only** preview override.
- **Reserved-band system (no overlap):** one band per edge holds that seat's
  history strip; the grid is a fixed-shape block capped (via container-query
  units) to the centre region between opposing bands, on **both** axes so a 90°
  rotation never collides. Four-grids pins history at the edge and the grid
  inboard, so the active grid grows toward the centre and never displaces the
  fixed history. This is pure CSS — no JS measuring.
- **Fluid sizing:** `clamp()` + container-query units so every grid/card scales
  with the band as the screen shrinks; index font never below the 12px floor.
- **Rotation:** the single-grid block rotates to face the bidder via
  `useFacingAngle` — a continuous angle that always turns the shorter way (≤180°)
  following clockwise play; South stays upright. Four-grids never rotates.
- **Double-sided cards:** each bid card shows its index in opposite corners (like
  a playing card) plus a central suit pip, so its bid reads from both the seat and
  the opposite side without a second stacked card.

---

## 13. Accessibility architecture

Accessibility is treated as acceptance criteria, held to **WCAG 2.1/2.2 AA** and
gated by the axe suite (§10).

```mermaid
mindmap
  root((Accessibility))
    Vision
      Large high-contrast text
      Four palettes - all AA contrast
      High Contrast palette
      Extra-large mode - scales UI app-wide
    Motor
      Large tap targets - >= AA target-size
      Undo reachable from every seat
    Hearing
      Never relies on audio
      Optional spoken bids - off by default
    Vestibular
      Animations toggle
      Four grids = no rotation
      Shortest-path rotation
      Respects OS reduced-motion
    Keyboard / SR
      Dialogs - focus trap, Escape, restore
      main landmark + live regions
      Zoom enabled
```

- **Extra-large mode** (`settings.accessibility` → `data-accessible`): scales
  text, controls, and the bidding grid up across all screens; Compact gives the
  largest targets.
- **Dialogs** (`useDialog`): Settings and Bid History move focus in, trap Tab,
  close on Escape, restore focus to the trigger.
- **Live regions** announce whose turn it is and the derived contract; `<main>`
  landmark; all icon buttons labelled; suits carry shape **and** label.
- Pinch-zoom is allowed; OS reduced-motion is honoured automatically.

---

## 14. PWA / path to the app store

```mermaid
flowchart LR
    React[React SPA - same codebase] --> PWA[Installable PWA - now]
    PWA --> iOS["iOS — Add to Home Screen, fullscreen, offline"]
    React --> Cap[Capacitor shell - future]
    Cap --> iOSn[iOS build -> App Store]
    Cap --> Android[Android build -> Google Play]
```

- **Now:** `vite-plugin-pwa` (Workbox, `autoUpdate`) + a fullscreen manifest, PNG
  icons, and iOS standalone meta (`apple-touch-icon`, `apple-mobile-web-app-*`).
  Installs to the iPad home screen and runs offline over HTTPS (GitHub Pages).
- **Future:** a Capacitor wrapper produces native iOS/Android builds from the same
  source; the deferred backend becomes relevant for cross-device sync.

---

## 15. Cross-cutting concerns

| Concern | Approach |
|---|---|
| **Accessibility** | First-class; AA-gated by axe; extra-large mode, palettes, focus management, live regions (§13). |
| **Observability** | Hosting/CDN logs (GCP) and Pages status now. Client error reporting is in scope; backend observability deferred. |
| **Secrets** | None for the offline app. GCP auth via Workload Identity Federation (no keys in repo); Secret Manager arrives with the backend. |
| **Security** | Data lives only on-device. Static hosting only. A future backend would re-validate all mutations with least-privilege IAM. |
| **Config** | `VITE_BASE` selects the host base path (`/` locally, `/Bidding-Box/` on Pages); Terraform vars per environment. |
| **Versioning** | Tagged releases drive prod deploys; engine fixtures and `state.schemaVersion` (with a `migrate` seam) are versioned with the app. |

---

## 16. Risks & decisions to revisit

| Item | Note |
|---|---|
| Single on-device engine | A strength today: one TypeScript implementation, no duplication. If a backend authority is later required, decide between a C# port (same fixtures) or sharing the TS engine via WASM. |
| IndexedDB as sole store | Data lives only in the browser; clearing site data loses games. Mitigated by JSON export/import; cloud backup is part of the deferred backend. |
| Two hosting targets | GitHub Pages (live) and GCP (gated) both exist. Decide the canonical production host before launch; the build supports either via `VITE_BASE`. |
| Offline-first sync conflicts (deferred) | Single-device means no conflicts today; a conflict-resolution policy is needed before multi-device shared sessions ship. |
| App-store requirements | A native (Capacitor) build introduces store review, signing, and platform testing — scope before committing. |
```

This document reflects the **as-built** offline-only application: a single
TypeScript rules-and-scoring engine running on-device, a pure reducer + IndexedDB
state layer, a responsive and accessibility-first React UI, GitHub Pages + GCP
static hosting driven by GitHub Actions, and the C# backend, Firestore, and cloud
sync all clearly marked **deferred**.
