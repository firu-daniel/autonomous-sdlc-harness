### Task 7 — Key per-unit layer reviews by next free index and hand each fix the file its own layer returned

**Goal:** Fix defect 3. In `plugin/instructions/unit_loop_core.md`, every layer of a unit writes `review_<i>.md` into the row's one `Per-item findings folder`, each layer with its own counter that restarts at `0`. For a `**Finding K**` / `**Test K**` unit tagged with two layers, the second layer's `review_0.md` overwrites the first's. The next fix iteration then reads "the most recent `review_*.md` in the row's `Per-item findings folder`" and can hand one layer the other layer's findings. After this task:

- the reviewer's `iteration:` is the **next free index** in that folder, so no layer overwrites another;
- the fix iteration reads the **`findings_file:` this layer's reviewer returned** on its last FAIL;
- the round-counting module knows a multi-layer item folder interleaves layers.

Story-plan `**Task K**` units are single-layer and keep working unchanged.

**Source:** `plugin/instructions/unit_loop_core.md` → `## The unit loop` step 3, `### Per-unit review step`, `### Placeholder resolution`.

### Targets

- `plugin/instructions/unit_loop_core.md` (step 3, `### Per-unit review step`, `### Placeholder resolution`; Task 10 edits step 5 of this file and depends on this task)
- `plugin/agents/layer-reviewer.md` (`## Resolved values` lead sentence's list of fenced-block placeholders; `## Invocation contract` → the `iteration` row and the `iteration:` line of the unit's quoted fenced block; Task 8 edits this file's `description:` and depends on this task)
- `plugin/instructions/improvement_observations_instructions.md` (the "**net-new vs re-raised**" paragraph)

**The interface, stated for both sides.**

- **Reviewer dispatch.** The fenced block in `### Per-unit review step` keeps its keys (`task_file` / `task_heading` / `findings_folder` / `iteration` / `context_notes`). Its `iteration:` value becomes the next free index in the row's `Per-item findings folder`. Resolve it immediately before **each** reviewer dispatch, because the previous layer or the previous iteration may have just added a file, including a PASS-with-Should/Nice file: `ls <findings_folder>`, take one past the highest `review_<n>.md`, or `0` when absent or empty. The loop counter `iteration` stays per layer, per unit, resets in step 3 and caps at `>= 5`. It is what the heartbeat's `iter` shows, and never a file index.
- **Quoting site — option (a) of the review's choice, stated so no implementer re-decides it.** `layer-reviewer.md` → `## Invocation contract` restates this fenced block as a schema (*"The unit itself arrives in a fenced block whose four keys are fixed"*) with its own placeholder names (`<task_file>` / `<task_heading>` / `<findings_folder>`, no `context_notes:` line) — it is not a verbatim quote, and its other lines stay as they are. A placeholder spelling is interface (`.claude/context/plugin.md` → `## What this layer is`), so the rename of the `iteration:` value lands on **both** sides: the agent block's `iteration: <iteration>` becomes `iteration: <review_index>`, matching the caller's `iteration:` line, and the agent's `## Resolved values` lead sentence, which lists the fenced block's placeholders, names `<review_index>` instead of `<iteration>`. The old name is not kept with a redefined value (option (b)), because `<iteration>` stays the loop's cap counter and one name cannot be both.
- **Reviewer return** (`layer-reviewer.md` → `## Output contract`, unchanged): `verdict: PASS` (1 line), or `verdict: FAIL` / `findings_file: <full_path>` / `must_fix_count: <N>`. The findings file's title already names its layer: `# <layer> review — <task_heading> — iteration {iteration}`.
- **Fix iteration.** Step 3's prompt stays `Fix <heading> per <findings_file> from <detail_file>.`. `<findings_file>` is now **the `findings_file:` value this layer's reviewer returned on its most recent `verdict: FAIL`**, never a listing of the folder. The `iteration >= 5` escalation's "path to the latest findings file" is that same value.

**Work:**

- [ ] `unit_loop_core.md` step 3: replace "where `<findings_file>` is the most recent `review_*.md` in the row's `Per-item findings folder`" with the returned-path rule, and say why: a multi-layer unit shares the folder.
- [ ] `### Per-unit review step`: four changes.
  - Change the block's `iteration: <iteration>` to the separately named next-free index `iteration: <review_index>` (this exact name; the agent side quotes it).
  - State its resolution as above, in the sentence that introduces the block (which today says "`iteration:` is this loop's own counter").
  - Keep the "`iteration` is reset to `0` at the start of each layer of each unit" sentence, marked as the cap counter.
  - In the FAIL arm, name the escalation path as the returned `findings_file:`.
- [ ] `### Placeholder resolution` → the "**Three kinds of name are neither**" paragraph: add `<review_index>`, defined at its point of use in `### Per-unit review step`, beside `<iteration>`'s existing definition as the loop's own counter.
- [ ] `layer-reviewer.md` → `## Invocation contract` → the `iteration` row (today *"Integer `i` — the review loop's own counter for this layer of this unit."*): replace it with *"Integer supplied by the caller — the index your findings file is named with and titled by; do not re-derive it. The unit loop resolves it as the next free index in `findings_folder`, which every layer of the unit shares."* In the same section, change the quoted fenced block's `iteration: <iteration>` to `iteration: <review_index>`, so its `iteration:` line matches `### Per-unit review step`'s `iteration:` line; change no other line of that block. In `## Resolved values`'s lead sentence, change `<task_file>` / `<task_heading>` / `<findings_folder>` / `<iteration>` (the fenced dispatch block in that same section) to `<task_file>` / `<task_heading>` / `<findings_folder>` / `<review_index>`, so the placeholder the block now carries is declared. Leave the file template's `review_{iteration}.md` / `iteration {iteration}` tokens alone. Leave the `findings_folder` row, the file template and `## Output contract` unchanged. Leave the paragraph "A `FAIL` increments the caller's `iteration` and re-dispatches the implementer with your findings file" unchanged too, since the caller's counter still increments.
- [ ] `improvement_observations_instructions.md` → the paragraph opening "The **net-new vs re-raised** split": add to its round-shape description that a per-item `item_<N>/` / `item_<K>/` folder of a multi-layer unit interleaves its layers in one `review_<n>.md` series. Partition that root's sorted list by the layer each file's title names (`# <layer> review — …`, a title read, inside the narrow exception's headings-only rule) before diffing each entry against its predecessor. The unit's round **count** stays the total.

**Verification:**

- `git grep -n -E -e 'most recent .?review_' -- plugin` returns nothing.
- Walk a two-layer `**Finding 3**` unit (`_(layer: cli, plugin)_`) on paper:
  - `cli` reviewer FAILs, writes `review_0.md`, returns its path;
  - the `cli` fix is handed `review_0.md`, and the re-review PASSes clean (no file);
  - the `plugin` reviewer FAILs and writes `review_1.md`, never `review_0.md`;
  - the `plugin` fix is handed `review_1.md`, never `cli`'s file.

  Also confirm a story `**Task 2**` unit gets `review_0.md`, `review_1.md`, … exactly as before.
- `git grep -n 'review loop.s own counter' -- plugin/agents/layer-reviewer.md` returns nothing. `git grep -n '<review_index>' -- plugin cli/templates docs` shows the binding and its uses in `unit_loop_core.md`, and no hit outside that file except two in `plugin/agents/layer-reviewer.md`: the `## Resolved values` lead sentence and the quoted fenced block's `iteration: <review_index>` line, which matches the caller's `iteration:` line (the two blocks' other lines use different placeholder names by design and are not compared). `git grep -n 'iteration: <iteration>' -- plugin/agents/layer-reviewer.md` returns nothing.
- `plugin/agents/branch-reviewer.md` Pass 2 ("For each `task_<N>/` subfolder, find the highest-numbered `review_*.md`") stays correct and is not edited: `task_<N>/` folders are single-layer.
