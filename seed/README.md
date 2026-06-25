# Seed fixtures

Versioned game fixtures used for local development, the deployed test environment,
and as deterministic anchors for E2E tests (ARCHITECTURE.md §9).

Because the app is **offline-only**, the "database" is the browser's IndexedDB.
A fixture is a game in the same export format the app reads and writes, so it can
be loaded in three equivalent ways:

1. **Settings → Game Data → Import Game** — pick a fixture file. (Works today.)
2. **Dev query flag** *(planned)* — `?seed=sample-game` loads the matching
   fixture into IndexedDB on boot. The seam lives in `apps/web/src/state`.
3. **E2E setup** *(planned)* — tests seed IndexedDB before asserting.

Fixtures are chosen to cover the scoring branches and auction states the UI must
render. `sample-game.json` includes a made part-score/game and a passed-out board;
add more (doubled making, slam, undertrick set) alongside it as needed.

Seeding is **idempotent** (clear-then-load), so re-runs are safe. When the
deferred backend arrives, the identical fixtures will also seed Firestore.
