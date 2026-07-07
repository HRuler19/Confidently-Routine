// Persistence backend for the app's data collections.
//
// The app keeps every collection in an in-memory Solid signal and reads/filters
// it synchronously; this module is only about where those signals get persisted
// to and hydrated from. Two backends implement the same tiny key/value contract:
//
//   - browser: localStorage, exactly as the app always did. Reads are
//     synchronous, so collections can initialise at module load with no async
//     step and the plain web/PWA build (and the unit + e2e suites) behave
//     identically to before.
//   - Tauri (desktop + mobile): a real on-disk SQLite database. A single kv
//     table holds one JSON blob per store key - the same shape localStorage
//     used - because the app loads each collection fully into memory and filters
//     in JS, so it never needs relational queries. The win is durability and no
//     ~5MB localStorage quota, not a schema. SQLite has no synchronous API, so
//     these backends hydrate through the async hydrateStores() pass instead.

export const isTauri = "__TAURI_INTERNALS__" in window;

export interface StorageBackend {
  /** Present only on synchronous backends (localStorage). When available,
      collections read their initial value at module load with zero async,
      preserving the browser's original boot behaviour. */
  getItemSync?(key: string): string | null;
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const browserBackend: StorageBackend = {
  getItemSync: (key) => localStorage.getItem(key),
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => {
    localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    return Promise.resolve();
  },
};

// Structural view of the bits of @tauri-apps/plugin-sql's Database we use, so
// this file needs no static import of the plugin (it's dynamically imported
// only inside Tauri, keeping it out of the browser bundle's hot path).
interface SqlDatabase {
  execute(query: string, bindValues?: unknown[]): Promise<unknown>;
  select<T>(query: string, bindValues?: unknown[]): Promise<T>;
}

let dbPromise: Promise<SqlDatabase> | null = null;

function getDb(): Promise<SqlDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const { default: Database } = await import("@tauri-apps/plugin-sql");
      const db = (await Database.load("sqlite:confidently.db")) as unknown as SqlDatabase;
      await db.execute("CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
      return db;
    })();
  }
  return dbPromise;
}

// Serialise every mutation through one promise chain. Each write stores the
// full current state of a key and writes are issued in the right order from
// synchronous UI actions - but tauri-plugin-sql runs on a connection pool, so
// without this two rapid writes to the same key (e.g. completing a recurring
// task, which rewrites the task list and then appends the next occurrence)
// could commit out of order and persist a stale array, losing data on the next
// launch. Chaining guarantees they land in issue order, keeping last-write-wins
// correct. Errors are swallowed per-link so one failure can't stall the queue.
let writeChain: Promise<void> = Promise.resolve();

function enqueueWrite(op: (db: SqlDatabase) => Promise<unknown>): Promise<void> {
  writeChain = writeChain.then(async () => {
    try {
      const db = await getDb();
      await op(db);
    } catch (e) {
      console.error("SQLite write failed:", e);
    }
  });
  return writeChain;
}

const sqliteBackend: StorageBackend = {
  async getItem(key) {
    const db = await getDb();
    const rows = await db.select<{ value: string }[]>("SELECT value FROM kv WHERE key = $1", [key]);
    return rows.length > 0 ? rows[0].value : null;
  },
  setItem(key, value) {
    return enqueueWrite((db) =>
      db.execute("INSERT INTO kv (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2", [
        key,
        value,
      ]),
    );
  },
  removeItem(key) {
    return enqueueWrite((db) => db.execute("DELETE FROM kv WHERE key = $1", [key]));
  },
};

export const backend: StorageBackend = isTauri ? sqliteBackend : browserBackend;
