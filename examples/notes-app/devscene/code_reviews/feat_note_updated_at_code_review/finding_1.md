### 1. `deleteNote` is the one non-stamping action the suite never pins

**Where:** [test/notesService.test.mjs:336](../../../test/notesService.test.mjs#L336) — inside the
`// --- updatedAt crossing the mapper, and what stamps it (Task 5) ---` group, as the last of the
non-stamping-action cases: after `test('archiving a note that has never been edited leaves it keyless
in storage', …)` closes at line 334, and immediately before the `// The long-ago stamp again…`
comment that introduces the rejected-edit case.

**The problem.**

**The plan corpus disagrees with itself here, and the suite followed the half that asks for less.**

The story index commits Task 5 to all three non-stamping actions
(`sdlc-harness/story_plans/feat_note_updated_at_story_plan.md`, `## Context`, `Top risks`) —
quoted here to the end of the sentence, because the second half is the commitment:

> The second risk is the stamp leaking into the actions that share `update` with `editNote`, which
> would make archiving or pinning look like an edit; Task 2 places the stamp inside `editNote`'s
> callback for exactly that reason and **Task 5 asserts all three non-stamping actions leave the
> value alone.**

"All three" is fixed by the clause before it — the actions that paragraph believes share `update`:
`setArchived`, `setPinned` and `deleteNote`.

`sdlc-harness/task_plans/feat_note_updated_at/task_5_plan.md` then narrowed that to two plus a
different third. Its checklist bullet reads "The three actions that do **not** stamp: … `setArchived`,
`setPinned` and (for the keyless half) a never-edited note", counting the never-edited-rewrite case as
the third, and its fourth `Work:` bullet rules the remaining action out:

> `deleteNote` removes the note, so its claim is the one it already has — nothing to stamp — and
> **needs no new case here.**

The shipped suite implements the task plan exactly: `test('setArchived leaves the stamp of a note
edited earlier alone', …)`, `test('setPinned leaves the stamp of a note edited earlier alone', …)` and
`test('archiving a note that has never been edited leaves it keyless in storage', …)` are all present,
and no `deleteNote` case is. So the implementer is not at fault and neither is the reviewer of Task 5
in isolation — **the task plan overrode the story index's explicit commitment, by substitution rather
than by contradiction, and the whole-branch level is the first place both documents are open at once.
This finding restores the story index's ask.**

**Why this is Should Fix and not Must Fix.** Nothing in shipped behaviour is wrong. `deleteNote` in
`src/domain/notesService.ts:112-119` does not route through `update` at all — it reads raw records,
splices the matched index and writes the array back — so no `NoteRecord` other than the deleted one
crosses `toNote` or `toRecord` on that path and no sibling's stamp can move. The gap is a missing
assertion over correct code, not a defect.

**Why the story index's ask is the better one.** The task plan's bullet reasons about the note being
*deleted* — it has no stamp left to preserve, which is true and is not what a case here would pin. The
case below pins a *sibling*: a note the delete never names, whose stamp must survive the write. That
claim holds today only because of an implementation property the task plan does not mention and the
branch's own second stated risk is about changing. The obvious future refactor is precisely the one
that risk describes — rewriting `deleteNote` in terms of `update`, or giving `update` a delete mode,
the natural cleanup once three of the four mutators already share it. The moment that lands,
`deleteNote` inherits the shared read-modify-write path and the property that protects it today is
gone. `setArchived` and `setPinned` are held by their cases at that point; `deleteNote` is not. A
sibling note's stamp could be rewritten by a delete and the suite would stay green.

`.claude/context/tests.md` (`## Assertions`) also states that a no-op is asserted against storage
rather than against a return value, and that a case existing to pin a boundary says which boundary in
a comment — the case below follows both.

See also Finding 3: the source comment Task 2 added carries the same false premise about `deleteNote`
and `update` that the story index's paragraph does. The two fixes are independent and can land in
either order.

**The fix.**

Add this case to `test/notesService.test.mjs` as the last of the non-stamping-action cases in the
Task 5 group — after the `archiving a note that has never been edited…` case closes at line 334 and
immediately before the `// The long-ago stamp again, and for the same reason:` comment that introduces
`test('a rejected edit stamps nothing and leaves the store unchanged', …)`. Everything it uses is
already in the file: `seedEditedLongAgo`, `stored`, and the `addNote` / `deleteNote` bindings from the
module prologue at line 13.

```js
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
```

Sub-steps:

- [x] Insert the case above as the last of the non-stamping-action cases in the Task 5 group of
      `test/notesService.test.mjs`.
- [x] Run `bash scripts/test.sh` and confirm it prints `PASS: test` with the new case present in the
      run's own case list and 0 failures. Do not assert a case count: the task plan's first
      `Verification:` bullet fixes "the run's own case list is the invariant, not a number written
      here".

Notes for the implementer, so nothing has to be re-derived:

- `seedEditedLongAgo()` replaces the whole store with the single `legacy-2` record carrying
  `updatedAt: 1_700_000_002_000`, and returns that number. `addNote` then appends, so the stored array
  is `[legacy-2, doomed]` and `stored()[0]` is `legacy-2` after the delete.
- `deleteNote` returns `true` on a hit, so asserting the return value is what makes the case fail loudly
  if the id lookup ever breaks, rather than passing vacuously on a delete that did nothing.
- Assert on `stored()` rather than on `listNotes`: the claim is about what is on disk, and reading it
  back through the gateway would let a mapper that reconstructed the value pass.
