### Task 4 — Pin the widened guard in `test/notesStore.test.mjs`: absent accepted, wrong-typed dropped

**Goal:** Hold the compatibility half of this branch in the suite: a record written before
`updatedAt` existed still loads and is left exactly as it was, a stored `updatedAt` is carried
through untouched, and a record whose `updatedAt` is not a usable number is dropped while its
siblings survive.

**Depends on:** Task 1, which widens `isNoteRecord` in `src/data/noteRecord.ts` with the clause
`candidate.updatedAt === undefined || (typeof candidate.updatedAt === 'number' && Number.isFinite(candidate.updatedAt))`
and adds `updatedAt?: number` (epoch milliseconds) to `NoteRecord`. This task exercises that clause
through `readAll`, which is the caller the guard already reaches the suite through; it changes no
source file. A new or widened guard clause ships with a case for the value **accepted** and a case
for the value **dropped** (`.claude/context/data-layer.md`, `## Adding to this layer`).

### Targets

- `test/notesStore.test.mjs` — a new case group at the end of the file.

**Work:**

- [ ] Add a group banner in the file's own form — a `//` comment block above the new cases saying
      what they pin and why, the way the existing `pinned` block does ("The three cases below are
      that decision"): `updatedAt` is optional on the record so that notes written before this
      branch survive `readAll`, and absence is left unrepaired rather than migrated. Change nothing
      above it: the module-scope fixtures `alpha` and `beta` already carry no `updatedAt`, so they
      are pre-branch records as they stand, and the prologue, the `beforeEach` and every existing
      case stay exactly as they are.
- [ ] Case — absence accepted and left unrepaired, named as a sentence about behaviour in the file's
      register (e.g. `'readAll keeps a record written before updatedAt existed and leaves the key
      absent'`): seed `[alpha]` through `storage.setRaw(NOTES_STORAGE_KEY, …)`, assert
      `deepEqual(readAll(), [alpha])`, and assert the read-back record has **no** `updatedAt` key —
      `assert.ok(!('updatedAt' in readAll()[0]), …)` with a message stating the claim, since a bare
      `false` would print nothing useful. The gateway repairs nothing on the way in.
- [ ] Case — a stored value carried through intact: seed
      `[{ ...alpha, updatedAt: 1_700_000_002_000 }]` and assert `readAll()` returns it with
      `updatedAt` unchanged. Use the `1_700_000_00…` underscore form the file's existing fixtures
      use, and a value distinct from their `createdAt`s so a case that confused the two fields
      fails.
- [ ] Case — the unusable value dropped, siblings surviving, in the shape of the existing
      `'readAll drops a record failing the guard and keeps its siblings'`: seed
      `[alpha, { ...beta, updatedAt: 'yesterday' }]` and assert `deepEqual(readAll(), [alpha])`.
      Add the non-finite half in the same case or its own — `{ ...beta, updatedAt: Number.NaN }`
      seeded through `JSON.stringify` arrives as `null`, which is not a number and is dropped for
      the same reason, so seed the non-finite case as a raw JSON string (`'[…,{"updatedAt":1e999}]'`,
      which parses to `Infinity`) if you want `Number.isFinite` itself covered rather than only the
      `typeof` half.

**Verification:**

- `bash scripts/test.sh` prints `PASS: test`, with the new cases passing and every pre-existing case
  in both suite files still green — `pretest` rebuilds `dist/` first, so a change to `src/` that
  this run does not rebuild is invisible; never run `node --test` against a stale `dist/`.
- Read the dropped-value case against Task 1's guard clause and confirm it is a case that would fail
  without it — a case that passes with and without the `updatedAt` disjunct pins nothing. If you
  check it by deleting the disjunct rather than by reading, restore the file before committing and
  re-run the suite.
- The file still imports `NOTES_STORAGE_KEY` from the compiled module rather than spelling the key,
  installs exactly one double at module scope, and contains no `describe` block and no second
  patched global.
