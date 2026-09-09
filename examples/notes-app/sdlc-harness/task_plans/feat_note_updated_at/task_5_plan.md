### Task 5 — Pin the mapper boundary and the stamping rule in `test/notesService.test.mjs`

**Goal:** Hold the two claims this branch is about: `updatedAt` crosses the mapper in both
directions with never-edited as a real state on the entity side, and **only** an edit of a note's
own content stamps it.

**Depends on:** Task 2, which produces, in the domain layer:

- `Note.updatedAt: Date | null` on `src/domain/note.ts` — required property, `null` meaning the note
  has never been edited;
- `toNote` resolving an absent `NoteRecord.updatedAt` to `UPDATED_AT_WHEN_ABSENT` (`null`) and a
  stored number to a `Date`, and `toRecord` writing the key out again for `null` so a never-edited
  note stays keyless in storage;
- `addNote` starting a note at `updatedAt: null`, `editNote` stamping `new Date()` inside its own
  `change` callback, and `setArchived` / `setPinned` / `deleteNote` left unchanged.

It also depends on Task 1 for the record shape it seeds (`updatedAt?: number`, epoch milliseconds).
This task changes no source file. A new field crossing the mapper ships with cases in **both**
directions, including a record written before the field existed
(`.claude/context/conventions.md`, `## The testing bar`).

### Targets

- `test/notesService.test.mjs` — a new case group at the end of the file.

**Work:**

- [ ] Open the group with a banner in the file's own form —
      `// --- updatedAt crossing the mapper, and what stamps it -------------------------------` —
      followed by two or three comment lines saying what the group pins, the way the existing
      `pinned` and `setPinned` banners do. Under it, add one module-scope fixture beside
      `prePinningRecord`: `preUpdatedAtRecord`, a plain object literal with `id: 'legacy-2'`, a
      title, a body, a numeric `createdAt`, `archived: false`, `pinned: false` and **no**
      `updatedAt` key, with a one-line JSDoc saying it is a record as builds before this branch
      wrote it. Leave the prologue, the `beforeEach`, `stored()` and every existing case untouched.
- [ ] Read direction, both halves, driven through `listNotes('all')` after seeding with
      `storage.setRaw`: a record with no `updatedAt` reads back as a note with `updatedAt === null`
      (never edited), and `{ ...preUpdatedAtRecord, updatedAt: 1_700_000_002_000 }` reads back with
      `updatedAt instanceof Date` whose `getTime()` is that number. Carry a comment saying why the
      cases go through `listNotes` rather than a mutator — a mutator's `change` callback overwrites
      or restamps the field after `toNote` has run, so its return value cannot distinguish a correct
      `toNote` from one that dropped the field, the same reason the existing pinned read-side case
      states.
- [ ] Write direction and the stamp: `addNote` returns a note with `updatedAt === null` and writes a
      record with **no** `updatedAt` key (`assert.ok(!('updatedAt' in stored()[0]), …)` with a
      message, since a bare `false` prints nothing); `editNote` on that note returns a
      `Date` and stores the same instant as a number — assert
      `stored()[0].updatedAt === edited.updatedAt.getTime()`, which is the mapper boundary the
      existing `createdAt` case pins in the same words — and leaves `stored()[0].createdAt` exactly
      as it was.
- [ ] The three actions that do **not** stamp: after an `editNote` has stamped a note, each of
      `setArchived`, `setPinned` and (for the keyless half) a never-edited note leaves the value
      alone — capture `stored()[0].updatedAt` before, run the action, assert it is identical after;
      and a never-edited note rewritten by `setArchived` still has **no** `updatedAt` key, which is
      `toRecord`'s inverse half. `deleteNote` removes the note, so its claim is the one it already
      has — nothing to stamp — and needs no new case here.
- [ ] A rejected edit stamps nothing: `assert.throws(() => editNote(id, { title: '   ' }), ValidationError)`
      on a note, with the raw stored value captured before the call and compared after
      (`storage.getRaw(NOTES_STORAGE_KEY)`), so a `requireTitle` that started throwing *after* the
      stamp was applied fails here. Name every case as a sentence about behaviour, subject first.

**Verification:**

- `bash scripts/test.sh` prints `PASS: test`: the new cases pass and **every** pre-existing case in
  both suite files stays green — the run's own case list is the invariant, not a number written
  here. `pretest` rebuilds `dist/` first, and a run against a stale `dist/` proves nothing about the
  source.
- Each new case is one that would fail if its rule were removed — read them against Task 2's code
  and confirm it: a stamp moved from `editNote`'s callback into `update` breaks the non-stamping
  cases, a missing `updatedAt` line in `toRecord` breaks the write-direction case, and a missing one
  in `toNote` breaks the read-direction cases. This is the story index's second `Top risks:` entry
  made checkable.
- No case asserts on a DOM node or a `data-qa-*` attribute — those belong to the interactive QA
  phase — and no case installs a second double or reaches outside the process.

**Deviations from plan:** The plan's third and fifth `Work:` bullets specify setting the
non-stamping and rejected-edit cases up with a live `editNote` and capturing `stored()[0].updatedAt`
before the action. Implemented with the stamp **seeded raw as a past instant**
(`seedEditedLongAgo`, `updatedAt: 1_700_000_002_000`) instead, because the plan's own second
`Verification:` bullet is not met by the literal version: a mutation moving the stamp out of
`editNote` into `update` restamps within the same millisecond as the setup edit, so
`setArchived` / `setPinned` / a pre-validation stamp write all reproduce the captured value byte for
byte and the cases pass on broken code. The capture-before/compare-after shape and the raw-storage
assertion are unchanged; only the origin of the stamp is. Measured with a throwaway mutation script
under `sdlc-harness/scratch/` (since deleted): with the seeded instant, all seven mutations tried —
`editNote` stops stamping, the stamp moves into `update`, `toRecord` drops `updatedAt`, `toRecord`
invents one from `createdAt`, `toNote` drops `updatedAt`, `addNote` starts stamped, `editNote`
stamps in a separate write before validating — are each caught by at least one of the eight new
cases, and every new case is caught by at least one mutation.
