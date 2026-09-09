// notesStore.test.mjs — the gateway's two error idioms, pinned.

import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { installStorageDouble } from './helpers/storageDouble.mjs';

// Install before importing the module under test, and import the *compiled* output — `pretest`
// builds `dist/`, and Node cannot load the `.ts` source.
const storage = installStorageDouble();
const { NOTES_STORAGE_KEY } = await import('../dist/data/noteRecord.js');
const { readAll, writeAll, StorageWriteError } = await import('../dist/data/notesStore.js');

const alpha = { id: 'a', title: 'Alpha', body: 'first', createdAt: 1_700_000_000_000, archived: false };
const beta = { id: 'b', title: 'Beta', body: 'second', createdAt: 1_700_000_001_000, archived: true };

beforeEach(() => storage.reset());

test('readAll returns [] when the key is absent', () => {
  assert.deepEqual(readAll(), []);
});

test('readAll returns the stored records in order', () => {
  storage.setRaw(NOTES_STORAGE_KEY, JSON.stringify([alpha, beta]));
  assert.deepEqual(readAll(), [alpha, beta]);
});

test('readAll returns [] on malformed JSON rather than throwing', () => {
  storage.setRaw(NOTES_STORAGE_KEY, '{not json');
  assert.deepEqual(readAll(), []);
});

test('readAll returns [] when the stored value is not an array', () => {
  storage.setRaw(NOTES_STORAGE_KEY, JSON.stringify({ id: 'a' }));
  assert.deepEqual(readAll(), []);
});

test('readAll drops a record failing the guard and keeps its siblings', () => {
  storage.setRaw(NOTES_STORAGE_KEY, JSON.stringify([alpha, { ...beta, createdAt: 'yesterday' }, null]));
  assert.deepEqual(readAll(), [alpha]);
});

test('writeAll persists what readAll then reads back', () => {
  writeAll([alpha, beta]);
  assert.equal(storage.getRaw(NOTES_STORAGE_KEY), JSON.stringify([alpha, beta]));
  assert.deepEqual(readAll(), [alpha, beta]);
});

test('writeAll throws StorageWriteError when the write does not land', () => {
  const quota = new Error('QuotaExceededError');
  storage.failWrites(quota);
  assert.throws(
    () => writeAll([alpha]),
    (error) => error instanceof StorageWriteError && error.cause === quota,
  );
});

// `pinned` is optional on the record so that notes written before this branch survive `readAll`.
// The three cases below are that decision: absence accepted and left unrepaired, a real boolean
// carried through, a wrong-typed value dropped.

test('readAll keeps a pre-pinning record and leaves the absent pinned key absent', () => {
  storage.setRaw(NOTES_STORAGE_KEY, JSON.stringify([alpha]));
  const [record] = readAll();
  assert.deepEqual(record, alpha);
  assert.equal(Object.hasOwn(record, 'pinned'), false);
});

test('readAll carries a stored pinned flag through intact', () => {
  const pinned = { ...alpha, pinned: true };
  storage.setRaw(NOTES_STORAGE_KEY, JSON.stringify([pinned]));
  assert.deepEqual(readAll(), [pinned]);
});

test('readAll drops a record whose pinned is not a boolean and keeps its siblings', () => {
  storage.setRaw(NOTES_STORAGE_KEY, JSON.stringify([alpha, { ...beta, pinned: 'yes' }]));
  assert.deepEqual(readAll(), [alpha]);
});

// `updatedAt` is optional on the record so that notes written before this branch survive `readAll`,
// and its absence is left unrepaired rather than migrated to a value on the way in. The cases below
// are that decision: absence accepted and left absent, a stored instant carried through, and a value
// that is not a usable number dropped — the wrong type and the non-finite number in turn.

test('readAll keeps a record written before updatedAt existed and leaves the key absent', () => {
  storage.setRaw(NOTES_STORAGE_KEY, JSON.stringify([alpha]));
  const [record] = readAll();
  assert.deepEqual(record, alpha);
  assert.ok(!('updatedAt' in record), 'readAll invented an updatedAt the stored record did not carry');
});

test('readAll carries a stored updatedAt through intact', () => {
  const edited = { ...alpha, updatedAt: 1_700_000_002_000 };
  storage.setRaw(NOTES_STORAGE_KEY, JSON.stringify([edited]));
  assert.deepEqual(readAll(), [edited]);
});

test('readAll drops a record whose updatedAt is not a number and keeps its siblings', () => {
  storage.setRaw(NOTES_STORAGE_KEY, JSON.stringify([alpha, { ...beta, updatedAt: 'yesterday' }]));
  assert.deepEqual(readAll(), [alpha]);
});

test('readAll drops a record whose updatedAt is not finite and keeps its siblings', () => {
  // Seeded as raw JSON because `JSON.stringify(Infinity)` emits `null`, which the guard rejects on
  // its `typeof` half instead: `1e999` parses back to Infinity, so this is the only shape that
  // reaches `Number.isFinite`.
  const betaWithInfinity =
    '{"id":"b","title":"Beta","body":"second","createdAt":1700000001000,"archived":true,"updatedAt":1e999}';
  storage.setRaw(NOTES_STORAGE_KEY, `[${JSON.stringify(alpha)},${betaWithInfinity}]`);
  assert.deepEqual(readAll(), [alpha]);
});
