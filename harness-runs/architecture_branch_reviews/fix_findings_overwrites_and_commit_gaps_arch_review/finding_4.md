### 4. Extend the unit loop's `<per_unit_review>` `Used at` cell to step 5 and the two committer-staging bullets

**Severity:** Should Fix
**Layer:** plugin

**Site.** `plugin/instructions/unit_loop_core.md` → `## Mode contract — bindings this file uses`, the `<per_unit_review>` row. Its `Used at` cell currently reads:

> `## The unit loop` step 4 (the extension point); the whole of `### Per-unit review step`, including its `iteration >= 5` convergence cap; `## Layer routing table` (its `Reviewer` column)

**Problem.** This branch adds three new consumers of the `<per_unit_review>` binding in this file:

- `## The unit loop` step 5 now sends `unit_findings_folder:` *"when `<per_unit_review>` is `on`"* and omits it when that is `off`.
- The row-`A` **Committer staging** bullet (`<per_task_findings_root>task_<K>/`) now opens *"With `<per_unit_review>` `on`, it also stages the unit's findings folder"*.
- The shared `review_item` **Committer staging** bullet (`<per_item_findings_root>item_<K>/`) opens the same way.

The binding table does not list any of them. `plugin/instructions/mode_contract.md` makes a core declare each binding against the sections that consume it. The sibling cores say their `Used at` column is *"load-bearing, not documentation"*: it is what tells a flow entering by reference which bindings it must supply (`plugin/instructions/plan_orchestration_instructions_core.md` → `## Mode contract — bindings this file uses`). `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule` makes that mechanism bind every instruction file.

There is no runtime gap today, because every flow that reaches step 5 has already consumed `<per_unit_review>` at step 4. That is why this is Should Fix rather than Must Fix. The table is still the index of the binding's use sites, and it is now incomplete.

**Fix.** Add the three new sites to the end of that `Used at` cell. For example, append:

> ; `## The unit loop` step 5 (whether `unit_findings_folder:` is sent); the row `A` and `review_item` **Committer staging** bullets (whether the unit's findings folder is staged)

Leave the row's `Meaning (short)` cell and the other two rows unchanged.
