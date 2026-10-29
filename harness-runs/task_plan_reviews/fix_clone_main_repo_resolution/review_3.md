# Task plan review — iteration 3

The iteration-2 Must Fix is resolved: `task_5_plan.md` → **Verification:** no longer carries *"Run no test file: this task creates or edits none."* Five of the six iteration-2 Should Fix items are now resolved in the files:

- `jq` is used on the clone arm only (`task_1_plan.md`, plus the `jq`-off-`PATH` case in `task_7_plan.md`).
- The quoted anchor *"at the main worktree's root"* replaces the line coordinates.
- `task_12_plan.md` takes the blocker route instead of editing the README.
- `task_6_plan.md` records the (f2) mutation.
- The `task_2_plan.md` roster grep is scoped to `## Who may cite this`.

The roadmap-number question is argued in `task_10_plan.md`.

The scope register was derived again from this tree:

- D1–D4 were re-run verbatim. They reach 22, 7, 13 and 3 lines/files respectively, and every site they reach is already one of rows 1–39.
- D5 was walked again over `harness-runs/lessons.md` and `harness-runs/improvement_suggestions.md`. It reaches no entry.
- The closure test holds.

The readiness list and the per-task files correspond 1:1 (12 and 12). No `**Depends on:**` points forward. Every task is single-layer and within 20 points and 5 **Work:** bullets.

## Must Fix

1. **`task_6_plan.md`: a Work bullet names a tree guard the task neither creates nor edits.**
   - **Work:** → **`helpers/run-copy-layouts.mjs`.**, last paragraph: *"Spread no `process.env`: the tree guard `test/main-anchor-isolation.test.mjs` requires any spread to blank the anchor in the same object."*
   - `test/main-anchor-isolation.test.mjs` is a `harness.config.json` `treeGuards` entry (`covers: "cli/test/**/*.mjs"`). Task 6 neither creates nor edits it.
   - `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 4 says: *"No plan names a tree guard the task neither creates nor edits … the guard run is the loop's, never the plan's"*. It also says every reviewer raises a breach as a **Must Fix**.
   - Point 7 already selects this guard for Task 6, because its new files match `cli/test/**/*.mjs`. So the plan gains nothing by naming it, and naming it breaks the rule.

   **Fix:** In `task_6_plan.md`, rewrite that sentence so it states the constraint without naming the guard file. For example: *"Spread no `process.env`; where a spread is unavoidable, blank `MAIN_REPO_ANCHOR_VARIABLE` in the same object, as `cli/test/helpers/fixture.mjs`'s isolated environment does."* Do not name any `treeGuards` test anywhere in the file, and add no sentence about which tests the task runs.

## Should Fix

None.

## Nice to Have

1. **`task_12_plan.md` → `### Targets`: the README paragraph splits the bullet list.** The sentence *"`examples/notes-app/README.md` is **not** a target…"* sits between the second and third target bullets, so `settings.autonomous.json` reads as a stray item. Move the paragraph below the three bullets.
2. **`task_3_plan.md`: say the tree is red between Tasks 3 and 6** (carried from earlier rounds). After Task 3, `cli/test/qa-user-locks.test.mjs` case (f) fails until Task 6 rewrites it. Add a sentence under **Where this task stops.** so a later reader does not have to investigate it.
