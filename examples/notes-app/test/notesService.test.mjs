// notesService.test.mjs — one case per exported action, plus the two properties that are easy to
// lose in a refactor: the mapper boundary (`Date` in the entity, a number in storage) and the
// no-op paths writing nothing at all.

import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { installStorageDouble } from './helpers/storageDouble.mjs';

// Install before importing the module under test, and import the *compiled* output — `pretest`
// builds `dist/`, and Node cannot load the `.ts` source.
const storage = installStorageDouble();
const { NOTES_STORAGE_KEY } = await import('../dist/data/noteRecord.js');
const { listNotes, addNote, editNote, setArchived, setPinned, deleteNote, ValidationError } =
  await import('../dist/domain/notesService.js');

/** What is actually on disk, bypassing the gateway. */
const stored = () => JSON.parse(storage.getRaw(NOTES_STORAGE_KEY) ?? '[]');

beforeEach(() => storage.reset());

test('addNote persists the record and returns the mapped entity', () => {
  const note = addNote('Alpha', 'first');

  assert.equal(note.title, 'Alpha');
  assert.equal(note.archived, false);
  assert.ok(note.createdAt instanceof Date);

  const records = stored();
  assert.equal(records.length, 1);
  assert.equal(records[0].id, note.id);
  // The boundary: a `Date` on the entity, epoch milliseconds in storage.
  assert.equal(records[0].createdAt, note.createdAt.getTime());
});

test('addNote rejects a blank title and persists nothing', () => {
  assert.throws(() => addNote('   ', 'body'), ValidationError);
  assert.equal(storage.getRaw(NOTES_STORAGE_KEY), null);
});

test('listNotes returns every note under the all filter, in stored order', () => {
  addNote('Alpha', 'first');
  addNote('Beta', 'second');

  assert.deepEqual(
    listNotes('all').map((note) => note.title),
    ['Alpha', 'Beta'],
  );
});

test('editNote applies the patch and leaves absent fields alone', () => {
  const created = addNote('Alpha', 'first');

  const edited = editNote(created.id, { body: 'rewritten' });

  assert.equal(edited.title, 'Alpha');
  assert.equal(edited.body, 'rewritten');
  assert.equal(stored()[0].body, 'rewritten');
});

test('editNote returns undefined for an unknown id', () => {
  assert.equal(editNote('nope', { body: 'x' }), undefined);
});

test('setArchived flips the flag and moves the note between the filters', () => {
  const created = addNote('Alpha', 'first');

  const archived = setArchived(created.id, true);

  assert.equal(archived.archived, true);
  assert.deepEqual(listNotes('active'), []);
  assert.deepEqual(
    listNotes('archived').map((note) => note.id),
    [created.id],
  );
  assert.deepEqual(
    listNotes('all').map((note) => note.id),
    [created.id],
  );
});

test('setArchived returns undefined for an unknown id', () => {
  assert.equal(setArchived('nope', true), undefined);
});

test('deleteNote removes the note and reports it', () => {
  const created = addNote('Alpha', 'first');

  assert.equal(deleteNote(created.id), true);
  assert.deepEqual(stored(), []);
});

test('deleteNote on an unknown id returns false and leaves the store unchanged', () => {
  addNote('Alpha', 'first');
  const before = storage.getRaw(NOTES_STORAGE_KEY);

  assert.equal(deleteNote('nope'), false);
  assert.equal(storage.getRaw(NOTES_STORAGE_KEY), before);
});

// --- pinned crossing the mapper (Task 2) ------------------------------------------------------
// `NoteRecord.pinned` is optional and `Note.pinned` is not; `noteMapper.ts` is the only place the
// two meet. These four pin that boundary: both directions on a fresh note, both read-side cases of
// a stored record — `pinned` absent and `pinned: true` — and the forward normalization any
// rewrite performs on one.

/** A record as builds before pinning wrote it: every field except `pinned`. */
const prePinningRecord = {
  id: 'legacy-1',
  title: 'Legacy',
  body: 'written before pinning existed',
  createdAt: 1_700_000_000_000,
  archived: false,
};

test('addNote starts a note unpinned, in the entity and in storage', () => {
  const note = addNote('Alpha', 'first');

  assert.equal(note.pinned, false);
  // The boundary, the way `createdAt` is pinned above: the entity's value is what landed.
  assert.equal(stored()[0].pinned, note.pinned);
});

test('a record written before pinning existed reads back as unpinned', () => {
  storage.setRaw(NOTES_STORAGE_KEY, JSON.stringify([prePinningRecord]));

  const [note] = listNotes('all');

  assert.equal(note.id, 'legacy-1');
  assert.equal(note.pinned, false);
});

// `listNotes` rather than `setPinned`: `setPinned` routes through `update`, whose `change` callback
// overwrites `pinned` after `toNote` has run, so its return value cannot distinguish a correct
// `toNote` from one that dropped the field.
test('a record stored as pinned reads back as a pinned note', () => {
  storage.setRaw(NOTES_STORAGE_KEY, JSON.stringify([{ ...prePinningRecord, pinned: true }]));

  const [note] = listNotes('all');

  assert.equal(note.id, 'legacy-1');
  assert.equal(note.pinned, true);
});

test('rewriting a record written before pinning existed gives it the field explicitly', () => {
  storage.setRaw(NOTES_STORAGE_KEY, JSON.stringify([prePinningRecord]));

  setArchived('legacy-1', true);

  const record = stored()[0];
  assert.ok('pinned' in record, 'the rewrite writes `pinned` rather than leaving it absent');
  assert.equal(record.pinned, false);
});

// --- setPinned and pinned-first listing (Task 3) -----------------------------------------------
// The action owns both directions of the transition; the ordering rule lives in `listNotes` and
// is asserted on all three filters, because `all` is the branch an early return would skip.

/** Three notes in stored order, with the middle one pinned — the ordering fixture. */
const threeWithMiddlePinned = () => {
  const alpha = addNote('Alpha', 'first');
  const beta = addNote('Beta', 'second');
  const gamma = addNote('Gamma', 'third');
  setPinned(beta.id, true);
  return { alpha, beta, gamma };
};

test('setPinned pins the note in the entity and in storage', () => {
  const created = addNote('Alpha', 'first');

  const pinned = setPinned(created.id, true);

  assert.equal(pinned.pinned, true);
  assert.equal(stored()[0].pinned, true);
});

test('setPinned with false unpins the note again', () => {
  const created = addNote('Alpha', 'first');
  setPinned(created.id, true);

  const unpinned = setPinned(created.id, false);

  assert.equal(unpinned.pinned, false);
  assert.equal(stored()[0].pinned, false);
});

test('setPinned on an unknown id returns undefined and leaves the store unchanged', () => {
  addNote('Alpha', 'first');
  const before = storage.getRaw(NOTES_STORAGE_KEY);

  assert.equal(setPinned('nope', true), undefined);
  assert.equal(storage.getRaw(NOTES_STORAGE_KEY), before);
});

test('listNotes puts the pinned note first under the active filter', () => {
  const { alpha, beta, gamma } = threeWithMiddlePinned();

  assert.deepEqual(
    listNotes('active').map((note) => note.id),
    [beta.id, alpha.id, gamma.id],
  );
});

test('listNotes puts the pinned note first under the all filter too', () => {
  const { alpha, beta, gamma } = threeWithMiddlePinned();

  assert.deepEqual(
    listNotes('all').map((note) => note.id),
    [beta.id, alpha.id, gamma.id],
  );
});

test('listNotes puts the pinned note first under the archived filter too', () => {
  const { alpha, beta, gamma } = threeWithMiddlePinned();
  for (const note of [alpha, beta, gamma]) setArchived(note.id, true);

  assert.deepEqual(
    listNotes('archived').map((note) => note.id),
    [beta.id, alpha.id, gamma.id],
  );
});

test('setPinned does not reorder the persisted array', () => {
  const { alpha, beta, gamma } = threeWithMiddlePinned();

  // Ordering is a listing concern: the stored order is the gateway's contract and stays put.
  assert.deepEqual(
    stored().map((record) => record.id),
    [alpha.id, beta.id, gamma.id],
  );
});

// --- updatedAt crossing the mapper, and what stamps it (Task 5) --------------------------------
// `NoteRecord.updatedAt` is optional epoch milliseconds and `Note.updatedAt` is a required
// `Date | null`, where `null` is the real state "never edited" — `noteMapper.ts` is the only place
// the two meet, in both directions. The other half of this group is the stamping rule: only an
// edit of a note's own content moves the value, so archiving and pinning leave it exactly as it
// was, and a rejected edit leaves it alone too.

/** A record as builds before this branch wrote it: every field except `updatedAt`. */
const preUpdatedAtRecord = {
  id: 'legacy-2',
  title: 'Legacy',
  body: 'written before updatedAt existed',
  createdAt: 1_700_000_001_000,
  archived: false,
  pinned: false,
};

/**
 * Seeds the legacy record as edited long ago and returns the stored stamp. A past instant rather
 * than one `editNote` has just written: a stamp moved out of `editNote` into `update` restamps
 * inside the same millisecond as the edit that set it up, and a freshly stamped note cannot tell
 * that from correct code.
 */
const seedEditedLongAgo = () => {
  storage.setRaw(
    NOTES_STORAGE_KEY,
    JSON.stringify([{ ...preUpdatedAtRecord, updatedAt: 1_700_000_002_000 }]),
  );
  return stored()[0].updatedAt;
};

// `listNotes` rather than a mutator, for the same reason the pinned read-side case above states:
// a mutator's `change` callback overwrites or restamps `updatedAt` after `toNote` has run, so its
// return value cannot distinguish a correct `toNote` from one that dropped the field.
test('a record written before updatedAt existed reads back as never edited', () => {
  storage.setRaw(NOTES_STORAGE_KEY, JSON.stringify([preUpdatedAtRecord]));

  const [note] = listNotes('all');

  assert.equal(note.id, 'legacy-2');
  assert.equal(note.updatedAt, null);
});

test('a record carrying updatedAt reads back as a note edited at that instant', () => {
  const stampedAt = seedEditedLongAgo();

  const [note] = listNotes('all');

  assert.equal(note.id, 'legacy-2');
  assert.ok(note.updatedAt instanceof Date);
  assert.equal(note.updatedAt.getTime(), stampedAt);
});

test('addNote starts a note never edited, and writes no updatedAt key at all', () => {
  const note = addNote('Alpha', 'first');

  assert.equal(note.updatedAt, null);
  // The inverse half of `toNote`'s resolution: never-edited has no instant to write, so the key
  // stays absent rather than being invented from `createdAt`.
  assert.ok(
    !('updatedAt' in stored()[0]),
    'a never-edited note is written without an updatedAt key',
  );
});

test('editNote stamps the note and stores the same instant as a number', () => {
  const created = addNote('Alpha', 'first');
  const createdAtBefore = stored()[0].createdAt;

  const edited = editNote(created.id, { body: 'rewritten' });

  assert.ok(edited.updatedAt instanceof Date);
  // The boundary, the way `createdAt` is pinned above: a `Date` on the entity, epoch
  // milliseconds in storage.
  assert.equal(stored()[0].updatedAt, edited.updatedAt.getTime());
  assert.equal(stored()[0].createdAt, createdAtBefore);
});

test('setArchived leaves the stamp of a note edited earlier alone', () => {
  const stampedAt = seedEditedLongAgo();

  setArchived('legacy-2', true);

  assert.equal(stored()[0].updatedAt, stampedAt);
});

test('setPinned leaves the stamp of a note edited earlier alone', () => {
  const stampedAt = seedEditedLongAgo();

  setPinned('legacy-2', true);

  assert.equal(stored()[0].updatedAt, stampedAt);
});

test('archiving a note that has never been edited leaves it keyless in storage', () => {
  const created = addNote('Alpha', 'first');

  setArchived(created.id, true);

  assert.ok(
    !('updatedAt' in stored()[0]),
    'a rewrite of a never-edited note still writes no updatedAt key',
  );
});

// The third non-stamping action, and the only one that does not share `update` with `editNote`:
// `deleteNote` splices raw records and writes them back, so no sibling ever crosses the mapper.
// Pinned here because the obvious refactor is to route it through `update` too, and that is the
// change that would start rewriting a stamp on a note the user never touched.
test('deleteNote leaves the stamp of another note edited earlier alone', () => {
  const stampedAt = seedEditedLongAgo();
  const doomed = addNote('Doomed', 'to be removed');

  assert.equal(deleteNote(doomed.id), true);

  const [remaining] = stored();
  assert.equal(remaining.id, 'legacy-2');
  assert.equal(remaining.updatedAt, stampedAt);
});

// The long-ago stamp again, and for the same reason: an `editNote` that stamped in a write of its
// own before validating would land that write in the millisecond the setup edit used.
test('a rejected edit stamps nothing and leaves the store unchanged', () => {
  seedEditedLongAgo();
  const before = storage.getRaw(NOTES_STORAGE_KEY);

  assert.throws(() => editNote('legacy-2', { title: '   ' }), ValidationError);
  assert.equal(storage.getRaw(NOTES_STORAGE_KEY), before);
});
