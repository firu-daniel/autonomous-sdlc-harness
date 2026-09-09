// notesService.ts — one function per thing a user can do to their notes, and the project's one
// business rule.
//
// Every function here reads through `readAll()`, works in domain types, and persists through
// `writeAll()`; no file outside `src/data/` touches browser storage at all, and no file outside
// `noteMapper.ts` converts between the two shapes. Read-modify-write over the whole list is the
// right shape for a store this small — it keeps the persisted order the visible order — and it
// is the reason each mutator returns what it wrote rather than making the caller re-read.
//
// `writeAll` throws `StorageWriteError`, and nothing here catches it: a note that did not
// persist must not be reported to the surface as saved.

import { readAll, writeAll } from '../data/notesStore.js';
import type { NoteRecord } from '../data/noteRecord.js';
import type { Note, NoteFilter } from './note.js';
import { toNote, toRecord } from './noteMapper.js';

/** Raised when a caller's input breaks a rule in this file. Distinct from a storage failure. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** Fields `editNote` may change. Anything absent is left as it was. */
export interface NotePatch {
  title?: string;
  body?: string;
}

/**
 * The rule: a note has a non-blank title. Stated once, here, and applied wherever a title is set
 * — a second expression of it in the surface or in a mapper would be the copy that goes stale.
 * Returns the trimmed title to store, so "  Alpha  " and "Alpha" are the same note title.
 */
function requireTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed === '') throw new ValidationError('a note needs a title');
  return trimmed;
}

/**
 * Pinned notes first, then the rest, each group in the order it was already in. A partition
 * rather than a `.sort()`: stored order inside each group is preserved by construction, and the
 * caller's array is not mutated in place.
 */
function pinnedFirst(notes: Note[]): Note[] {
  return [...notes.filter((note) => note.pinned), ...notes.filter((note) => !note.pinned)];
}

/** The notes matching `filter`, pinned first, stored order preserved inside each group. */
export function listNotes(filter: NoteFilter): Note[] {
  const notes = readAll().map(toNote);
  // Match first, order once on the single return — an early return for `all` would leave that
  // view unordered.
  const matching =
    filter === 'all' ? notes : notes.filter((note) => note.archived === (filter === 'archived'));
  return pinnedFirst(matching);
}

/**
 * Appends a note and returns it. Throws `ValidationError` on a blank title, before touching
 * storage, so a rejected note leaves nothing behind.
 */
export function addNote(title: string, body: string): Note {
  const note: Note = {
    id: crypto.randomUUID(),
    title: requireTitle(title),
    body,
    createdAt: new Date(),
    updatedAt: null,
    archived: false,
    pinned: false,
  };
  const records = readAll();
  records.push(toRecord(note));
  writeAll(records);
  return note;
}

/**
 * Applies `patch` to the note with `id` and returns the result, or `undefined` if there is no
 * such note. Throws `ValidationError` if the patch would blank the title.
 */
export function editNote(id: string, patch: NotePatch): Note | undefined {
  return update(id, (note) => ({
    ...note,
    title: patch.title === undefined ? note.title : requireTitle(patch.title),
    body: patch.body ?? note.body,
    // Stamped here rather than in `update`: `setArchived` and `setPinned` share that helper, and
    // archiving or pinning a note is not an edit of it. `deleteNote` does not go through `update`
    // at all — it splices the raw record array and writes it back.
    updatedAt: new Date(),
  }));
}

/** Archives or restores the note with `id`, or returns `undefined` if there is no such note. */
export function setArchived(id: string, archived: boolean): Note | undefined {
  return update(id, (note) => ({ ...note, archived }));
}

/**
 * Pins or unpins the note with `id` — `pinned` is the state it moves to — or returns `undefined`
 * if there is no such note. Where the note then appears in a listing is `listNotes`' business;
 * this writes the flag and nothing else.
 */
export function setPinned(id: string, pinned: boolean): Note | undefined {
  return update(id, (note) => ({ ...note, pinned }));
}

/** Removes the note with `id`. `false` — and no write — when there is no such note. */
export function deleteNote(id: string): boolean {
  const records = readAll();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) return false;
  records.splice(index, 1);
  writeAll(records);
  return true;
}

/**
 * Read-modify-write for the one-note mutators: locates `id`, hands `change` the mapped entity,
 * persists what it returns. `change` throwing — `requireTitle` does — leaves storage untouched,
 * because the write happens after it returns.
 */
function update(id: string, change: (note: Note) => Note): Note | undefined {
  const records: NoteRecord[] = readAll();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) return undefined;

  const updated = change(toNote(records[index]));
  records[index] = toRecord(updated);
  writeAll(records);
  return updated;
}
