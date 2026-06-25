// Local persistence boundary (ARCHITECTURE.md §3). The whole game state is kept
// under a single key so a reload resumes exactly where the table left off
// (US-19, E2E flow F9). idb wraps IndexedDB with promises.

import { openDB, type IDBPDatabase } from 'idb';
import { SCHEMA_VERSION, type GameState } from './types';

const DB_NAME = 'bridge-table-companion';
const STORE = 'game';
const CURRENT_KEY = 'current';

let dbPromise: Promise<IDBPDatabase> | null = null;

function db(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE)) {
          database.createObjectStore(STORE);
        }
      },
    });
  }
  return dbPromise;
}

/** Migrate persisted state across schema versions. Currently a passthrough. */
export function migrate(state: GameState): GameState {
  // Future migrations switch on state.schemaVersion here.
  return { ...state, schemaVersion: SCHEMA_VERSION };
}

export async function loadGame(): Promise<GameState | null> {
  try {
    const raw = (await (await db()).get(STORE, CURRENT_KEY)) as GameState | undefined;
    return raw ? migrate(raw) : null;
  } catch {
    // A corrupt/unavailable store should never block play.
    return null;
  }
}

export async function saveGame(state: GameState): Promise<void> {
  try {
    await (await db()).put(STORE, state, CURRENT_KEY);
  } catch {
    // Best-effort persistence; the in-memory game continues regardless.
  }
}

export async function clearGame(): Promise<void> {
  try {
    await (await db()).delete(STORE, CURRENT_KEY);
  } catch {
    /* ignore */
  }
}
