### Task 2 — Carry `updatedAt` on `Note`, map it both ways, and stamp it in `editNote` alone

**Goal:** Make the last-edited instant a first-class part of the entity — `Note.updatedAt` as
`Date | null` — convert it in both mapper directions, and stamp it in the one action that is an
edit of the note's own content. `editNote` stamps; `setArchived`, `setPinned` and `deleteNote` do
not, because archiving or pinning a note is not an edit of it.

**Depends on:** Task 1, which produces, in `src/data/noteRecord.ts`:
`updatedAt?: number` on `NoteRecord` (epoch milliseconds, absent on a note never edited) and
`export const UPDATED_AT_WHEN_ABSENT = null`, whose JSDoc states that a pre-branch record and a
never-edited note are **one** state. This task imports that constant — it does not re-declare the
default, and it does not restate the storage clause: shared constants are imported, never restated
(`.claude/context/domain.md`, `## What may reach this layer, and what may not`).

**Where this layer stops.** Nothing here renders or formats. The row that shows the instant is
**Task 3's**, and it consumes exactly the property this task defines: `updatedAt: Date | null` on
`Note`, `null` meaning never edited. This task also touches no clock outside
`src/domain/notesService.ts`: the mapper stays pure — it imports only types and a constant, and
converting a stored number into a `Date` is a conversion, while `new Date()` in the service is a
creation (`.claude/context/domain.md`, `## The mapping between the stored shape and the entity`).

### Targets

- `src/domain/note.ts` — the entity property.
- `src/domain/noteMapper.ts` — both directions, and the file header.
- `src/domain/notesService.ts` — `addNote`'s initial value and `editNote`'s stamp.

**Work:**

- [ ] `note.ts`: add `updatedAt: Date | null;` to `Note`, after `createdAt`. A **required** property
      with a `null` member, not an optional one: optionality is a storage concern that stops at the
      mapper, so above this layer every note answers the question, and `null` is the answer "never
      edited" rather than a missing key nobody had to consider. Extend the interface's JSDoc
      paragraph, which already explains `createdAt` and `pinned`, with a sentence saying so.
- [ ] `noteMapper.ts` — `toNote`: add
      `updatedAt: record.updatedAt === undefined ? UPDATED_AT_WHEN_ABSENT : new Date(record.updatedAt)`,
      importing `UPDATED_AT_WHEN_ABSENT` from `../data/noteRecord.js` beside the existing
      `PINNED_WHEN_ABSENT` import. This is the **only** file that resolves the absent value, and the
      only file that builds a `Date` from a stored number.
- [ ] `noteMapper.ts` — `toRecord`: add the exact inverse,
      `updatedAt: note.updatedAt === null ? undefined : note.updatedAt.getTime()`. Writing the
      property as `undefined` keeps the key out of the serialized record (`JSON.stringify` omits it),
      so a never-edited note rewritten by any mutator stays keyless in storage and reads back as
      never edited. Update the file header's third paragraph: it currently says `toRecord` "always
      writes the field, so a record rewritten after this branch carries it explicitly", which is true
      of `pinned` and deliberately **not** true of `updatedAt` — state the difference and why (there
      is no instant to write for a note that has never been edited).
- [ ] `notesService.ts` — `addNote`: add `updatedAt: null` to the `Note` literal it builds, beside
      `pinned: false`. A note is created, not edited, so it starts in the never-edited state; the
      property is required, so the literal must say it. Do not reach for `new Date()` here a second
      time and do not reuse the `createdAt` value.
- [ ] `notesService.ts` — `editNote`: stamp inside its own `change` callback —
      `updatedAt: new Date()` in the object it returns, beside the existing `title` and `body`
      lines. **Not** in `update`: `setArchived`, `setPinned` and `deleteNote` reach storage through
      that same helper, and a stamp there would make archiving or pinning look like an edit. Leave
      those three functions and `update` byte-unchanged, and leave `createdAt` alone in every path —
      `update` maps the stored record through `toNote`, so the original `createdAt` is carried
      through and never rewritten.

**Verification:**

- `bash scripts/typecheck.sh` prints `PASS: typecheck` and `bash scripts/test.sh` prints
  `PASS: test`, with the existing suite unchanged and green — a blank title is still rejected,
  `readAll` still never throws, `writeAll` still does, and pinned notes still list first.
- Read the diff of `src/domain/notesService.ts` and confirm the only functions changed are `addNote`
  and `editNote`: `setArchived`, `setPinned`, `deleteNote`, `update`, `requireTitle`, `pinnedFirst`
  and `listNotes` are untouched, which is the story index's second `Top risks:` entry.
- `toNote` and `toRecord` are inverses over the new field in both directions — absent ⇄ `null`,
  a number ⇄ a `Date` of the same instant — so neither direction drops it silently. Task 5 turns
  this into suite cases; check it here by reading the two functions side by side.
- A rejected edit stamps nothing: `requireTitle` throws inside `change`, and `update` writes only
  after `change` returns, so the storage value is untouched — confirm the ordering still holds after
  the edit.
