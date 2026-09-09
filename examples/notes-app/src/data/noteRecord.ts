// noteRecord.ts — the shape a note has *in storage*, and the guard that decides whether
// something read back out still has it. No behaviour lives here, and nothing in this file
// imports from `../domain/` or `../presentation/`: storage is the innermost layer.

/**
 * One note as persisted. `createdAt` and `updatedAt` are epoch milliseconds — JSON carries no
 * `Date`.
 * `pinned` is optional because records written before pinning existed do not carry it, and an
 * absent field means the note is not pinned (`PINNED_WHEN_ABSENT`). Requiring it would make
 * `isNoteRecord` reject every note already in storage and `readAll` drop them silently.
 * `updatedAt` is the instant the note's own content was last edited, and is optional for the same
 * reason plus one of its own: a note that has never been edited has no such instant to carry
 * (`UPDATED_AT_WHEN_ABSENT`).
 */
export interface NoteRecord {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  archived: boolean;
  pinned?: boolean;
  updatedAt?: number;
}

/** The single `localStorage` key the project owns. */
export const NOTES_STORAGE_KEY = 'notes-app.notes';

/** What an absent `pinned` field means: a record written before pinning existed is not pinned. */
export const PINNED_WHEN_ABSENT = false;

/**
 * What an absent `updatedAt` field means: never edited. Two unlike records arrive here — one
 * written before this field existed, and one for a note genuinely never edited since it was
 * created — and they are the same single state, not two. `null` rather than a number because
 * never-edited is a real state with no instant behind it: `createdAt` is not a fallback, since
 * creating a note is not an edit of it.
 */
export const UPDATED_AT_WHEN_ABSENT = null;

/**
 * Whether `value` is a usable `NoteRecord`. Applied to every element read back out of storage:
 * what a previous version of the app wrote, or what a user edited by hand, is untyped input.
 */
export function isNoteRecord(value: unknown): value is NoteRecord {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id !== '' &&
    typeof candidate.title === 'string' &&
    typeof candidate.body === 'string' &&
    typeof candidate.createdAt === 'number' &&
    Number.isFinite(candidate.createdAt) &&
    typeof candidate.archived === 'boolean' &&
    // Absence is the compatibility surface: a pre-pinning record has no `pinned` key at all.
    (candidate.pinned === undefined || typeof candidate.pinned === 'boolean') &&
    // Absent here too, and deliberately so: a record predating this field, like a note never
    // edited, simply carries no `updatedAt` key.
    (candidate.updatedAt === undefined ||
      (typeof candidate.updatedAt === 'number' && Number.isFinite(candidate.updatedAt)))
  );
}
