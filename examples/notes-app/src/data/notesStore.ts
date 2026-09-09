// notesStore.ts — the browser-storage gateway. Every read and write of notes goes through
// these two functions; no other file in the project touches `localStorage`.

import { NOTES_STORAGE_KEY, isNoteRecord, type NoteRecord } from './noteRecord.js';

/** Raised when the notes could not be persisted. Carries the underlying failure as `cause`. */
export class StorageWriteError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'StorageWriteError';
  }
}

/**
 * Every readable note, oldest entry order preserved. Returns `[]` when the key is absent, the
 * JSON is malformed, or the stored value is not an array; individual elements that fail
 * `isNoteRecord` are dropped and their well-formed siblings survive.
 */
export function readAll(): NoteRecord[] {
  // Read the global at call time, never at module load: the browser installs it before the
  // bundle runs, but a test installs its double around the import.
  const raw = globalThis.localStorage.getItem(NOTES_STORAGE_KEY);
  if (raw === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  return parsed.filter(isNoteRecord);
}

/** Replaces the stored notes. A write that does not land raises `StorageWriteError`. */
export function writeAll(records: NoteRecord[]): void {
  try {
    globalThis.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(records));
  } catch (cause) {
    throw new StorageWriteError(
      `could not persist ${records.length} note(s) to '${NOTES_STORAGE_KEY}'`,
      { cause },
    );
  }
}
