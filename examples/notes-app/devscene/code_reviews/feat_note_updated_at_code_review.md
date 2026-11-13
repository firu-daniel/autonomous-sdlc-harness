# Code review — `feat_note_updated_at`

Branch `feat_note_updated_at`, reviewed 2026-09-07 against `main` at the whole-branch level. The
reviewed diff is 8 files and 211 insertions across all five configured layers — `src/data/noteRecord.ts`,
`src/domain/note.ts`, `src/domain/noteMapper.ts`, `src/domain/notesService.ts`,
`src/presentation/noteListView.ts`, `styles.css`, `test/notesService.test.mjs` and
`test/notesStore.test.mjs`. 17 run-artifact files excluded from the reviewed diff. Both harness
commands pass on the branch as it stands: `bash scripts/typecheck.sh` exits 0 and `bash scripts/test.sh`
runs 42 cases with 0 failures. `harness.config.json` sets `phases.parity` to `false`, so no reference
implementation was compared against and the intentional-divergence section below is empty by
construction; `phases.docs` is `false`, so no documentation corpus was consulted.

**The branch is in good shape.** The compatibility surface — the one thing this change could break
for notes already in a browser — is handled correctly at every hop, and I checked it adversarially
rather than by reading the plan: `isNoteRecord` widens with a `Number.isFinite` clause matching
`createdAt`'s own; `toNote` resolves absence with `record.updatedAt === undefined ? …` rather than
with a truthiness check, so a genuine `updatedAt` of `0` maps to `new Date(0)`; the shape that would
have collapsed zero into never-edited is `record.updatedAt ? new Date(record.updatedAt) : null`, or
a `||` fallback, and neither is what the mapper does; `toRecord` mirrors it with
`note.updatedAt === null ? undefined : …`, so a never-edited note stays keyless in storage however
often it is rewritten; and the presentation branches on `=== null` too. There is no point in the round trip
where zero and absent are conflated. The stamp sits in `editNote`'s own `change` callback and not in
the shared `update` helper, so `setArchived` and `setPinned` cannot stamp, and `deleteNote` does not
route through `update` at all. Pass 0's grep sweep found no escapes, and the one new exported symbol
(`UPDATED_AT_WHEN_ABSENT`) is consumed outside its defining file, in `src/domain/noteMapper.ts`.

**The presentation layer and the stylesheet were scanned against their own documents and came back
clean** — recorded here rather than left implicit, because a layer that draws no finding is otherwise
indistinguishable from a layer that was never opened. In `src/presentation/noteListView.ts` against
`.claude/context/presentation.md` (`## Two harness contracts`, `## Copy, styling and structure`): the
new element is published through `qa()` wrapping the creation expression itself, never a hand-written
`setAttribute('data-qa-…')`; its id `note-edited` is kebab-case and carries the `note-` surface prefix
rather than coining a new one; its status token is written in **both** states, `never-edited` as well
as `edited`, so a test waits on a token rather than on an absence, and the `data-qa-value` it publishes
is the epoch-millisecond number rather than the locale-dependent rendered line; the element sets
`className` and nothing else about appearance — no inline `style`, no sizing value in TypeScript; and
the never-edited state, being both visual and testable, is expressed once as the token and styled
through the attribute selector `.note__edited[data-qa-status='never-edited']` rather than by also
toggling a modifier class. The accompanying set that document requires for a new control inside an
existing region is complete: id, status token, CSS rule for the state it shows, and the UI-test-plan
scenarios — all seven files under `sdlc-harness/ui_test_plans/feat_note_updated_at/` read `note-edited`
— which stand in for the unit test this layer deliberately does not get. In `styles.css` against
`.claude/context/conventions.md` (the `general` layer section): `.note__edited` is BEM (`block__element`),
its colour reads the shared token back through `var(--muted)` rather than re-declaring the literal, and
its `0.875rem` and `0.5rem` values match the sites `.filters__control` and `.note__body` already use —
the one-site-literal rule invents no new `:root` token here, and none was invented.

Three findings, none of them a defect in shipped behaviour. One is a **commitment the plan corpus made
and the branch did not meet**: the story index's `Top risks` binds Task 5 to assert that *all three*
non-stamping actions leave the stamp alone — `setArchived`, `setPinned` and `deleteNote` — and
`task_5_plan.md` narrowed that to two plus the never-edited-rewrite case, ruling `deleteNote` out; the
suite followed the task plan. The task plan overrode the story index, and Finding 1 restores the story
index's ask. It stays Should Fix because the shipped behaviour is right — `deleteNote` reaches storage
directly and cannot move a sibling's stamp today — so the gap is a missing assertion over correct code,
not a defect. The second is the new comment above the stamp, which names `deleteNote` as a caller of
`update` ten lines above the function that is not one. The third is a commit subject that is not the
form `.claude/context/conventions.md` requires. There are no Must Fix items.

One item needs a decision nobody in this loop owns, so it is recorded in the reviewer's return as a
question rather than filed as a finding, and it is this: `editNote` stamps `updatedAt`
unconditionally, so re-submitting the edit form with the title and body unchanged still marks the note
edited. The task prompt fixes only that an edit stamps while archiving, pinning and
deleting do not; whether a content-preserving edit counts as an edit is a product call its author
owes, and not one this review can settle.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 3** — Correct the stamp comment so it stops naming `deleteNote` as a caller of `update` _(layer: domain)_
2. [x] **Finding 1** — Assert that `deleteNote` leaves another note's stamp alone _(layer: tests)_
3. [x] **Finding 2** — Reword the Task 1 commit subject to a bare imperative sentence; do it only after phase `D` closes _(layer: general)_

## Must Fix

_None._

## Should Fix

### 1. `deleteNote` is the one non-stamping action the suite never pins

→ [finding_1.md](feat_note_updated_at_code_review/finding_1.md)

## Nice to Have

### 3. The new comment above the stamp names `deleteNote` as a caller of `update`, and it is not one

→ [finding_3.md](feat_note_updated_at_code_review/finding_3.md)

### 2. The Task 1 commit subject is not a bare imperative sentence

→ [finding_2.md](feat_note_updated_at_code_review/finding_2.md)

## Out of scope / verified-OK (intentional divergences / call-outs)

_Empty by construction: `harness.config.json` sets `phases.parity` to `false`, so this branch is held
against no reference implementation and there is no divergence to call out._
