# Story: Record when a note was last edited

## Context

This branch gives a note a **last-edited instant** and shows it on the row. A note that nobody has
edited since it was created shows nothing at all — never-edited is a real state of a note, not a
zero and not a fallback to `createdAt`. The work runs the full depth of the app, so it is cut into
six single-layer tasks in the project's own bottom-up order (`.claude/context/conventions.md`,
`## How a change flows, and the order files are created in`): the persisted field and its guard
clause, then the entity plus both mapper directions plus the one action that stamps, then the row
that renders it, then the two suite files, then the stylesheet last as the catch-all layer.

**Two decisions are taken here once, and every task below is written against them.**

*One state, not two.* Absence is the compatibility surface and two unlike things arrive at it — a
record written before this branch existed, and a note genuinely never edited since it was created.
This branch declares them **one state, "never edited"**, and says so in code rather than implying
it with a default: `updatedAt?: number` is optional on `NoteRecord`, the named constant
`UPDATED_AT_WHEN_ABSENT = null` beside `PINNED_WHEN_ABSENT` states in its own JSDoc that both
arrivals mean the same thing, and `Note.updatedAt` is `Date | null` — a **required** property whose
`null` member *is* that state, so no caller can forget to consider it. Nothing is migrated or
repaired on read: `readAll` drops what fails the guard (`.claude/context/data-layer.md`,
`## Failure, as a caller sees it`), so the guard clause has to accept an absent field, and a
pre-branch record is left with the key still absent.

*The row publishes a machine-readable value and hides itself through its own state token.* A
rendered date line is not something a test can assert on — `toLocaleString()` output depends on the
machine — so the `note-edited` element carries the instant as `data-qa-value`, epoch milliseconds,
the same number storage holds. The element is **always** built, in both states, carrying
`data-qa-status="edited"` or `"never-edited"`: `.claude/context/presentation.md` requires a status
token in every state including the neutral one, "because a test waits on a token and cannot wait on
an absence", and requires that a state which is both visual and testable be expressed once as that
token and styled through an attribute selector rather than a second modifier class. So "renders
nothing at all" is delivered by `.note__edited[data-qa-status='never-edited'] { display: none; }` in
Task 6 — the same shape as the existing `.filters__control[data-qa-status='selected']` rule — not by
omitting the element and leaving the never-edited state with nothing a test can read.

Architecture constraints this branch does **not** get to relax. The clock stays where it already is:
`src/domain/notesService.ts` is the only module that calls `new Date()`, the mapper is pure and
`src/data/` never invents a timestamp (`.claude/context/domain.md`, `## The mapping between the
stored shape and the entity`; `.claude/context/data-layer.md`, "A record arrives with `id` and
`createdAt` already set by its caller"). The stamp lives in `editNote`'s own `change` callback and
**not** in the shared `update` helper, because `setArchived`, `setPinned` and `deleteNote` route
through the same helper and archiving or pinning a note is not an edit of it. No runtime dependency
is added, no relative-time formatting, no change to listing order, and no change to `createdAt`.
`app.ts` needs no edit at all: `onEditSaved` already ends in `refresh()`, which re-reads through
`listNotes(filter)` and re-renders every row, so the new line updates itself on the existing path
(`.claude/context/conventions.md`, `## State, and where the truth lives`). There is no DOM test
runner in this project, so the row is verified in the interactive QA phase; the scenario for it
belongs to this run's own UI test plan under `sdlc-harness/ui_test_plans/feat_note_updated_at/`,
which the QA plan writer owns — no task here edits the harness-generated trees.

**Top risks:** the one thing this branch can break for notes already in someone's browser is the
guard, so Task 1 owns the `isNoteRecord` clause alone and Task 4 pins both halves of it — the
pre-branch record accepted and left unrepaired, and a wrong-typed `updatedAt` dropped with its
siblings surviving. The second risk is the stamp leaking into the actions that share `update` with
`editNote`, which would make archiving or pinning look like an edit; Task 2 places the stamp inside
`editNote`'s callback for exactly that reason and Task 5 asserts all three non-stamping actions
leave the value alone. The third is a row that renders an unassertable date: Task 3 publishes the
epoch-millisecond value a test reads back deterministically, and Task 6 supplies the attribute
selector that makes the never-edited state show nothing while still publishing a token.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks
the `[ ]` entries below top-to-bottom; the committer flips each one to `[x]` as that task's commit
lands. **Only the committing role flips a marker** — the `committer` agent in every flow that
dispatches one, the orchestrator itself in the supervised flow, which dispatches none: an
implementer never changes a marker here, and never edits any other line of this section. `[ ]`
markers anywhere else (the sub-step bullets inside the per-task files) are informational progress
markers only — they are never the iteration source and the committer does not touch them.

Each entry resolves 1:1 to a self-contained
`sdlc-harness/task_plans/feat_note_updated_at/task_<K>_plan.md` file. Ordered bottom-up by ship
sequence, with the catch-all layer last.

1. [x] **Task 1** — Add optional `updatedAt` to `NoteRecord` with `UPDATED_AT_WHEN_ABSENT` and its guard clause _(layer: data)_ _(points: 10)_
2. [x] **Task 2** — Carry `updatedAt` on `Note`, map it both ways, and stamp it in `editNote` alone _(layer: domain)_ _(points: 15)_
3. [x] **Task 3** — Render the row's "Edited …" line, published as `note-edited` with the instant as its value _(layer: presentation)_ _(points: 10)_
4. [x] **Task 4** — Pin the widened guard in `test/notesStore.test.mjs`: absent accepted, wrong-typed dropped _(layer: tests)_ _(points: 8)_
5. [x] **Task 5** — Pin the mapper boundary and the stamping rule in `test/notesService.test.mjs` _(layer: tests)_ _(points: 15)_
6. [x] **Task 6** — Style `.note__edited` and hide the never-edited state through its status attribute selector _(layer: general)_ _(points: 5)_
