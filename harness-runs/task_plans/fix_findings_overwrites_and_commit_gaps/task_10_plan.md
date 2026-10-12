### Task 10 — Pass `unit_findings_folder` from the unit loop's commit step

**Goal:** Fix the loop half of defect 6. Every `committer` dispatch from `## The unit loop` step 5 sends the unit's per-unit review folder as `unit_findings_folder:` whenever `<per_unit_review>` is `on`. The reviewer findings that loop wrote are then committed by the unit's own commit and kept out of the committer's subject reconciliation, so `staged: index-only` reaches step 6's progress line again.

**Depends on:** Task 9, which defines the argument in `plugin/agents/committer.md`. Also Task 7, which edits steps 3–4 and `### Per-unit review step` of the same file; this task edits step 5 and the substitution table's notes only.

**The argument, exactly as Task 9 defines it:**

```
unit_findings_folder: <the active substitution row's Per-item findings folder>
```

- Optional; `mode: task` / `mode: review_item` only.
- Sent **only** when `<per_unit_review>` is `on`. When it is `off`, omit the line entirely, so the dispatch is byte-for-byte what it is today.
- The value is the row's `Per-item findings folder` cell as resolved for this unit, e.g. row `A`: `<per_task_findings_root>task_<K>/`; row `UR-A`: `<per_item_findings_root>item_<K>/`. Send it unconditionally: the committer passes it with no existence guard, and the wrapper skips an absent path.

### Targets

- `plugin/instructions/unit_loop_core.md` (step 5; `#### Row A` → **Committer staging**; `#### Row UR-A` → **Committer staging**)

**Work:**

- [ ] `## The unit loop` step 5: add "and, when `<per_unit_review>` is `on`, `unit_findings_folder:` set to the row's `Per-item findings folder`" to the dispatch's argument list, beside `<committer_push>` and the `disposition:` / `already_passing:` rule. Add one sentence of why: those files are this unit's run artifacts, and the argument both commits them and keeps them out of the committer's work-file test. Do **not** add a new binding: `<per_unit_review>` already exists, and `## Mode contract — bindings this file uses` declares exactly three.
- [ ] `#### Row A` and `#### Row UR-A`, their **Committer staging** bullets: append that with per-unit review on, the unit's findings folder is staged too, through `unit_findings_folder`. The other fix rows inherit step 5 and need no cell change, because the substitution table's `committer extra args` column holds per-row values and this argument is uniform.

**Verification:**

- `git grep -n 'unit_findings_folder' -- plugin` shows the sender in `unit_loop_core.md` step 5 and the named exceptions, and the receiver in `committer.md`, spelled identically.
- End to end on paper, semi-autonomous Phase C, row `C`, `**Finding 2**`, `_(layer: domain)_`:
  - the reviewer FAILs, writing `<per_review_findings_root>item_1/review_0.md`;
  - the fix is a disposition, so no code changes;
  - step 5 sends `unit_findings_folder: <per_review_findings_root>item_1/`;
  - the committer stages index, detail file and folder, and reconciliation answers No;
  - step 6's line carries `staged: index-only — …` and `dispositioned: …`.
- Autonomous plan flow (`<per_unit_review>` `off`): the step-5 dispatch carries no `unit_findings_folder:` line.
