// note.ts — the note as the app talks about it, as opposed to the note as storage holds it
// (`../data/noteRecord.ts`). The two are deliberately separate types: this one is free to use
// whatever shape reads best in code, storage is bound to what JSON can carry, and the mapper is
// where the two meet. Nothing here imports from `../data/` or `../presentation/`.

/**
 * One note.
 *
 * `createdAt` is a `Date` — the record it is mapped from carries epoch milliseconds. `pinned` is
 * required here even though `NoteRecord.pinned` is optional: the optionality is a storage concern
 * that stops at the mapper, so above this layer a note is always either pinned or not. `updatedAt`
 * is required for the same reason even though `NoteRecord.updatedAt` is optional, and its `null`
 * member is the answer "never edited" rather than a missing key nobody had to consider — so every
 * note above this layer answers the question.
 */
export interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date | null;
  archived: boolean;
  pinned: boolean;
}

/** Which notes a listing asks for. `'all'` is both halves, not a third state. */
export type NoteFilter = 'active' | 'archived' | 'all';
