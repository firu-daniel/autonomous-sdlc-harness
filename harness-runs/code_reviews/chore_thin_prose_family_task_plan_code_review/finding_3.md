### 3. Restore the multi-file split-signal examples in the writer's story-point scale

**Severity:** Should Fix

**Site:** `plugin/agents/task-plan-writer.md` → `## Process` step 7, the `**Story points.**` paragraph. The text in question is *"`25` / `50` / `100` estimate a capability — a self-contained unit over the cap / a multi-layer slice / an end-to-end feature — and are the signal to split it"*.

**Problem.** The story index says *"Behaviour does not change"* and *"every edge case stays"*. The compressed scale changes which tasks the writer splits.

At the baseline, the split-signal anchors gave concrete examples of work that is over the 20-point cap:
- `25`: *"one unit with the required accompanying set its conventions document mandates, or a focused multi-file edit"*.
- `50`: *"one new behaviour threaded through several layers and wired into a surface, or a non-trivial multi-file refactor"*.

The new `25` anchor, *"a self-contained unit over the cap"*, is circular: a writer cannot know a unit is over the cap until it has scored it. The new `50` anchor, *"a multi-layer slice"*, no longer covers a single-layer refactor.

The reader who reaches the wrong answer is the writer scoring either of these:
- a non-trivial multi-file refactor inside one layer;
- one new unit plus the required accompanying set its conventions document mandates.

The baseline scale put both above 20, so they had to be split. The new scale matches both to *"`20` — a full single-layer task, the cap"*. The writer therefore ships them as one 20-point task, and the reviewer's `_(points: <N>)_` ≤ 20 check cannot catch it.

**Fix.**

- [ ] In `plugin/agents/task-plan-writer.md` → the `**Story points.**` paragraph, replace:

  ```markdown
  `25` / `50` / `100` estimate a capability — a self-contained unit over the cap / a multi-layer slice / an end-to-end feature — and are the signal to split it, never a task's value.
  ```

  with:

  ```markdown
  `25` / `50` / `100` estimate a capability — one unit with the required accompanying set its conventions document mandates, or a focused multi-file edit / one behaviour threaded through several layers into a surface, or a non-trivial multi-file refactor / an end-to-end feature — and are the signal to split it, never a task's value.
  ```

  Leave the rest of the paragraph unchanged.

**Verification.**
- `grep -c -F 'or a non-trivial multi-file refactor' plugin/agents/task-plan-writer.md` and `grep -c -F 'or a focused multi-file edit' plugin/agents/task-plan-writer.md` are both non-zero.
- `wc -w plugin/agents/task-plan-writer.md` stays below the baseline count of 6335.
