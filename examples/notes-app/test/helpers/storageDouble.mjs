// storageDouble.mjs — the in-memory `localStorage` every test in this suite runs against.
//
// It is a module, imported by both `notesStore.test.mjs` and `notesService.test.mjs`, because a
// second copy is a drift surface. It runs nothing at import time on purpose: every test file in
// the suite imports it, so anything it did at import would run once per file, ahead of the cases
// that file installed it for.
//
// Call the factory *before* importing the module under test — hence the dynamic `await import`
// in the test files — so the modules never see a global that is missing.

/**
 * Installs an in-memory `globalThis.localStorage` and returns a handle over it.
 *
 * @param {Record<string, string>} [initial] entries the store starts with.
 * @returns {{
 *   getRaw(key: string): string | null,
 *   setRaw(key: string, value: string): void,
 *   reset(entries?: Record<string, string>): void,
 *   failWrites(error: Error): void,
 *   allowWrites(): void,
 *   uninstall(): void,
 * }}
 */
export function installStorageDouble(initial = {}) {
  const entries = new Map(Object.entries(initial));
  /** @type {Error | null} */
  let writeFailure = null;

  globalThis.localStorage = {
    get length() {
      return entries.size;
    },
    key(index) {
      return [...entries.keys()][index] ?? null;
    },
    getItem(key) {
      return entries.has(key) ? entries.get(key) : null;
    },
    setItem(key, value) {
      if (writeFailure !== null) throw writeFailure;
      entries.set(key, String(value));
    },
    removeItem(key) {
      entries.delete(key);
    },
    clear() {
      entries.clear();
    },
  };

  return {
    /** What is stored under `key`, bypassing the gateway. */
    getRaw(key) {
      return entries.has(key) ? entries.get(key) : null;
    },
    /** Seeds `key` directly — including values the gateway itself would never write. */
    setRaw(key, value) {
      entries.set(key, String(value));
    },
    /** Empties the store and re-allows writes. Call between cases. */
    reset(replacement = {}) {
      entries.clear();
      for (const [key, value] of Object.entries(replacement)) entries.set(key, String(value));
      writeFailure = null;
    },
    /** Makes every subsequent `setItem` throw `error` — a quota failure, say. */
    failWrites(error) {
      writeFailure = error;
    },
    allowWrites() {
      writeFailure = null;
    },
    uninstall() {
      delete globalThis.localStorage;
    },
  };
}
