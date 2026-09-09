// noteMapper.ts — the only place a `NoteRecord` becomes a `Note` or the reverse.
//
// One difference between the two types carries the whole boundary: `createdAt` is a `Date` here
// and epoch milliseconds there. That is enough for the rule to matter — the moment a second file
// constructs a `Date` from a record, the storage shape has leaked into a caller and the next
// change to it has two sites. So: no `Date` anywhere in `src/data/`, and no mapping inline in
// `notesService.ts`.
//
// The other thing that stops here: `NoteRecord.pinned` and `NoteRecord.updatedAt` are optional
// while `Note.pinned` and `Note.updatedAt` are not, so `PINNED_WHEN_ABSENT` and
// `UPDATED_AT_WHEN_ABSENT` are resolved in `toNote` and in no other file. The two fields part
// company in `toRecord`: it always writes `pinned`, so a record rewritten after this branch
// carries it explicitly, and deliberately does not always write `updatedAt` — a note that has
// never been edited has no instant to write, so the property is set to `undefined`, which
// `JSON.stringify` omits. That keeps a never-edited note keyless in storage however often it is
// rewritten, and it reads back as never edited rather than as edited-at-some-invented-time.

import { PINNED_WHEN_ABSENT, UPDATED_AT_WHEN_ABSENT, type NoteRecord } from '../data/noteRecord.js';
import type { Note } from './note.js';

/** The domain view of a stored record. */
export function toNote(record: NoteRecord): Note {
  return {
    id: record.id,
    title: record.title,
    body: record.body,
    createdAt: new Date(record.createdAt),
    updatedAt: record.updatedAt === undefined ? UPDATED_AT_WHEN_ABSENT : new Date(record.updatedAt),
    archived: record.archived,
    pinned: record.pinned ?? PINNED_WHEN_ABSENT,
  };
}

/** The storage view of a note. Inverse of {@link toNote}. */
export function toRecord(note: Note): NoteRecord {
  return {
    id: note.id,
    title: note.title,
    body: note.body,
    createdAt: note.createdAt.getTime(),
    updatedAt: note.updatedAt === null ? undefined : note.updatedAt.getTime(),
    archived: note.archived,
    pinned: note.pinned,
  };
}
