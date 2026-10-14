### Task 9 — Add the committer's `unit_findings_folder` argument and exclude it from subject reconciliation

**Goal:** Fix the committer half of defect 6. Wherever `<per_unit_review>` is `on`, the unit loop leaves per-unit `layer-reviewer` findings untracked under the row's `Per-item findings folder` when the committer runs. That covers the semi-autonomous plan and user-review flows and the autonomous user-review flow. The committer's step 3 stages "the code files shown by `git status --short`", so it sweeps them in. Its **Subject reconciliation** test ("does the staged set contain any path other than `plan_path` and the unit's own detail file?") then answers **Yes** for every unit that had a FAIL iteration or a PASS-with-Should/Nice file. That loses the `mark <unit token> done — …` subject and the `staged: index-only` return line that `unit_loop_core.md` step 6 and `improvement_observations_instructions.md` row (d) read.

After this task, a new optional argument names that folder. The committer stages it **explicitly**, so it lands in the commit meant for it, the unit's own, and it is **excluded from reconciliation**, so the test sees only the unit's work.

**Where this task stops.** This task defines the argument and the committer's handling. Passing it is **Task 10's**, which edits the unit loop's step 5 and depends on this task. Until Task 10 lands, no caller sends the argument and the committer behaves exactly as today.

### Targets

- `plugin/agents/committer.md`

**The argument, exactly as Task 10 will send it:**

```
unit_findings_folder: <the active substitution row's Per-item findings folder>
```

- Optional, and only for `mode: task` and `mode: review_item`. It is sent only when the flow's `<per_unit_review>` is `on`, and omitted entirely when it is `off`.
- It is a repo-relative folder path ending in `/`, e.g. `<state_dir>/task_plan_point_reviews/<branch>_task_plan/task_3/` (row `A`) or `<state_dir>/review_plan_point_reviews/<branch>_review/item_2/` (row `C`).
- It may not exist: a unit whose every review PASSed clean wrote no file.

**Work:**

- [ ] `## Invocation contract`: add the `unit_findings_folder` bullet, after `meta_findings_folder`, with the shape above. Say it is distinct from `meta_findings_folder`, which is `review_plan_file`-only and names a meta-review tree. In `### Which caller sends which mode`, add to the row-`A` and fix-row/`UR-A` rows that the unit loop's step 5 adds `unit_findings_folder` when per-unit review is on.
- [ ] `### Standard procedure` step 3, the `task` and `review_item` bullets: two changes.
  - When `unit_findings_folder` was passed, add it to the explicit set as its own path, **unconditionally, with no existence guard**. The wrapper warns and skips a path that does not exist, which is the same rule the `review_plan_file` bullet states for its folders.
  - Exclude from "the code files shown by `git status --short`" every entry at or under that folder, including git's collapsed `?? <dir>/` line for an untracked parent of it, so it is never listed twice and never treated as code.
- [ ] `## Commit-message policy` → **Subject reconciliation**: change the test to "does the staged set contain any path other than `plan_path`, the unit's own detail file, and `unit_findings_folder` (when passed)?", and say why: reviewer findings are run artifacts of this unit, not its work. Leave unchanged the disposition / already-passing placement rules, the `staged: index-only` consequence and the parsed `record disposition of ` interface.
- [ ] Step 4's sentence enumerating "exactly the explicit set you computed in step 3", and `## Output contract`'s `staged: index-only — <the step-3 stage-path set> was the whole diff …` line: name the folder as part of the set and as not a work file. The return's line counts (5, or 6 with `staged:`) do not change.

**Verification:**

- `git grep -n 'unit_findings_folder' -- plugin` shows the definition and every use inside `committer.md`, spelled identically. After Task 10, it also shows the sender in `unit_loop_core.md`.
- Walk two units on paper:
  - **Row `C`, per-unit review on, one layer: the first review FAILs, and the fix iteration returns `blocker: prohibited — …`.** Staged: index, detail file, `unit_findings_folder`. Reconciliation answers **No**, the subject is `record disposition of Finding 2 — <cause>`, and the return carries `staged: index-only — …`. Today it answers Yes.
  - **Row `A`, per-unit review off.** No argument; byte-identical behaviour.
- **Deviations from plan:** Three restatements of the reconciliation test inside `committer.md` — the `disposition` bullet in `## Invocation contract`, the "never in both and never in neither" invariant in **Subject reconciliation**, and the `## Output contract` sixth-line lead-in — each said "nothing but the index and the detail file"; each now also names `unit_findings_folder` (when passed) so it matches the changed test. The placement rules themselves are unchanged. The same restatement in `plugin/instructions/unit_loop_core.md` (the "Passing the argument is what puts the disposition on the commit's record" paragraph) and `plugin/instructions/improvement_observations_instructions.md` (the **Index-only commit** row) lies outside this task's target and was not edited.
- The `ui_test_pass` and `review_plan_file` procedures are untouched (`git diff` shows no hunk under `### ui_test_pass procedure` or the `review_plan_file` bullet).
