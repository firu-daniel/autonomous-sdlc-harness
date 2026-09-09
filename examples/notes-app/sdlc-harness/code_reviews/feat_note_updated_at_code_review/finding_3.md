### 3. The new comment above the stamp names `deleteNote` as a caller of `update`, and it is not one

**Where:** [src/domain/notesService.ts:91](../../../src/domain/notesService.ts#L91) — the two comment
lines Task 2 added inside `editNote`'s `change` callback, immediately above `updatedAt: new Date(),`.

**The problem.**

The comment the branch ships reads:

```ts
    // Stamped here rather than in `update`: `setArchived`, `setPinned` and `deleteNote` share that
    // helper, and neither archiving nor pinning a note is an edit of it.
```

`deleteNote` does not share that helper. Ten lines below the comment
([src/domain/notesService.ts:112-119](../../../src/domain/notesService.ts#L112)) it reaches storage
directly — `readAll()`, `findIndex`, `splice`, `writeAll` — and never calls `update`, never crosses
`toNote` or `toRecord`, and so was never a route by which a stamp could leak. The three functions that
do route through `update` are `editNote` itself, `setArchived` and `setPinned`.

The sentence is also self-inconsistent on its own terms: it names three functions as sharing the
helper and then justifies only two of them ("neither archiving nor pinning"). The reader who notices
that has to go and check; the reader who does not carries the false premise forward.

Nothing executable is wrong, which is why this is **Nice to Have**. What makes it worth a finding
rather than nothing at all is where the false claim points. This branch's own second stated risk
(`sdlc-harness/story_plans/feat_note_updated_at_story_plan.md`, `## Context`, `Top risks`) is the
stamp leaking into whatever shares `update` with `editNote`, and the obvious future refactor is
routing `deleteNote` through `update` too. This comment tells the implementer who arrives to do that
refactor that it has already happened — the exact reader whose wrong answer costs something. And
`.claude/context/conventions.md` (`## Not determined`) already records two existing header comments
that contradict the code beneath them as open questions, on the stated ground that a stale comment is
what the next implementer copies; this branch adds a third of the same kind.

The claim is inherited rather than invented: the story index's `## Context` states "`setArchived`,
`setPinned` and `deleteNote` route through the same helper", and Task 2 wrote the comment from it.
The story plan is a point-in-time artifact of a finished round and is not the fix target here — the
source comment is, because it is the durable copy.

**The fix.**

Replace the two comment lines at `src/domain/notesService.ts:91-92` with:

```ts
    // Stamped here rather than in `update`: `setArchived` and `setPinned` share that helper, and
    // archiving or pinning a note is not an edit of it. `deleteNote` does not go through `update`
    // at all — it splices the raw record array and writes it back.
```

Sub-steps:

- [x] Replace lines 91-92 with the three lines above. All three fit inside the file's existing
      ~100-column wrap (97, 98 and 69 characters), so no reflow of surrounding code is needed.
- [x] Run `bash scripts/typecheck.sh` and `bash scripts/test.sh` and confirm both print `PASS`. This
      is a comment-only edit, so both must pass unchanged; the suite still runs 42 cases unless
      Finding 1 has already landed.

Cross-reference: Finding 1 argues for a `deleteNote` case in the suite and rests on the same true
fact this comment gets wrong. The two are independent edits in different layers and can land in
either order.
