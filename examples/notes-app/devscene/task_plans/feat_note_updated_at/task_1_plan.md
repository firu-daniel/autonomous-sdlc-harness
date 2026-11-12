### Task 1 — Add optional `updatedAt` to `NoteRecord` with `UPDATED_AT_WHEN_ABSENT` and its guard clause

**Goal:** Give the persisted shape a last-edited instant that a record already in someone's browser
can lack: `updatedAt?: number` on `NoteRecord` — epoch milliseconds, like `createdAt`, because this
interface holds only what JSON can carry — the named constant `UPDATED_AT_WHEN_ABSENT` beside
`PINNED_WHEN_ABSENT` stating what an absent field means, and the clause in `isNoteRecord` that lets
a pre-branch record through untouched.

**Where this layer stops.** This task names the default and vets the field; it resolves nothing.
Turning an absent `updatedAt` into the entity's value is `toNote`'s, in **Task 2**, which imports
`UPDATED_AT_WHEN_ABSENT` from here exactly as it already imports `PINNED_WHEN_ABSENT`
(`.claude/context/data-layer.md`, `## What this layer may import, and who maps its types`). This
layer knows no `Date`, generates no timestamp — `new Date()` is the domain's, in
`src/domain/notesService.ts` — and `src/data/notesStore.ts` needs no edit at all: `readAll` filters
through `isNoteRecord` and `writeAll` serializes whatever it is handed, so both pick the new field
up for free.

### Targets

- `src/data/noteRecord.ts` — the field, the constant, the guard clause, and the interface's JSDoc.

**Work:**

- [ ] `NoteRecord`: add `updatedAt?: number;` after `createdAt` (before or after `pinned` — both are
      the optional tail). Optional, not required: `.claude/context/data-layer.md` (`## The persisted
      shape`) — declaring it required would make `isNoteRecord` reject every record already in
      storage and `readAll` drop them without a word. Extend the interface's existing JSDoc block to
      say what the field is: epoch milliseconds of the last edit of the note's own content, absent
      on a note that has never been edited.
- [ ] Add, beside `PINNED_WHEN_ABSENT` and in the same one-line-JSDoc form:
      `export const UPDATED_AT_WHEN_ABSENT = null;`. Its JSDoc carries this branch's central
      decision in words, because the decision must be visible in the code rather than implied by a
      default: **two unlike things arrive at an absent `updatedAt` — a record written before this
      branch existed, and a note genuinely never edited since it was created — and they are one
      state, "never edited", not two.** The constant is `null` rather than a number precisely
      because never-edited is a real state: there is no instant to fall back to, and `createdAt` is
      not one (a note's creation is not an edit of it).
- [ ] `isNoteRecord`: add the clause
      `(candidate.updatedAt === undefined || (typeof candidate.updatedAt === 'number' && Number.isFinite(candidate.updatedAt)))`,
      alongside the existing `pinned` clause. Two rules meet here: an optional field is accepted
      **only** as `undefined` or its declared type, and a field is checked for usability and not
      merely for `typeof` — `createdAt` is the precedent for the `Number.isFinite` half. Carry a
      short comment saying the absence is deliberate compatibility, in the register of the existing
      `// Absence is the compatibility surface…` line rather than repeating it verbatim.

**Verification:**

- `bash scripts/typecheck.sh` prints `PASS: typecheck` and `bash scripts/test.sh` prints
  `PASS: test`. The existing suite must be green **unchanged** by this task: nothing here alters a
  rule already covered, and `test/notesStore.test.mjs` in particular still passes every one of its
  `readAll` cases, including `'readAll keeps a pre-pinning record and leaves the absent pinned key
  absent'`.
- Read the guard back and confirm a record with **no** `updatedAt` key satisfies it and one with
  `updatedAt: 'yesterday'` or `updatedAt: NaN` does not — the two cases Task 4 turns into suite
  cases against the compiled module.
- Nothing in `src/data/` gained a `Date`, a clock call, or a second spelling of the storage key, and
  `src/data/notesStore.ts` is unchanged.
