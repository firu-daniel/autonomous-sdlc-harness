# Task plan review — iteration 1

Both iteration-0 Must Fix findings are resolved in the artifact. The branch fold is stated in `task_7_plan.md` and restated in Tasks 8, 9, 10 and 12. E1 and E2 now carry the wider commands, and rows 36–38 exist. I re-ran E1, E2, E3, E4 and E6 verbatim, and every site they reach has a row. I re-walked E5, which gives the finding below.

## Must Fix

1. **Scope register: E5's decision rule misses a ledger rule that governs a target of this branch.** File: story index (`fix_forge_trigger_run_lineage_story_plan.md`), `## Scope register`.
   I re-walked E5 (artifact `harness-runs/lessons.md`, its headings in order, then each rule). Its decision rule reaches a rule only when the rule governs one of these:
   - a temporary working copy;
   - a scratch path;
   - remote run state;
   - a branch-scoped command;
   - an expiring store;
   - an adopter-run command;
   - a design decision measured under a stub.

   Under `## Unattended control loops`, the ledger holds this rule: *"Every automatic retry in an unattended path is bounded by a count or a deadline. When the bound is reached, send exactly one notification naming the error and the manual way on, then stop retrying."* It governs `trigger_run_url`'s lookup loop (`cli/templates/scripts/remote-run.sh` → `trigger_run_url`, bounded by `TRIGGER_RUN_LOOKUP_TRIES`). That loop runs in the unattended trigger job. Task 2 changes the loop's match condition: it now also requires `headSha` to equal the pushed commit. Once the bound is reached, the comment falls back to the filtered run list. The plan honours the rule, but no entry reaches it, so the register has no row for it.
   **Fix:** Widen E5's decision rule in the story index to *"a rule is reached when it governs a temporary working copy, a scratch path, remote run state, a branch-scoped command, an expiring store, an adopter-run command, an automatic retry or lookup loop in an unattended path, or a design decision measured under a stub"*. Then add the row: `harness-runs/lessons.md` → *"Every automatic retry in an unattended path is bounded by a count or a deadline…"*, Copy `—`, Evidence `E5, automatic retry`, Disposition `no-change`, reason: *a constraint Task 2 honours: the lookup stays bounded by `TRIGGER_RUN_LOOKUP_TRIES`, and when it runs out the comment names the filtered run list once*.

## Should Fix

- **The story index's `## Context` says "Every legitimate own-lineage run is included". One case contradicts that claim.** Suppose the branch has been merged into the default branch with a merge commit, and work then continues on it, for example a user-review commit. `git rev-list origin/<default>..HEAD` then lists only the commits made after the merge. Every earlier own run is excluded and logged as "from before its current lineage", so the job starts as a first job and loses its clarification history. It never restores another lineage's state, but the claim is still false. The fallback paragraph covers only "no commit beyond" the default branch. Name this case in `## Context` and in the `docs/remote-execution.md` → **Central state.** wording Task 10 writes, together with its outcome. Alternatively, have `task_1_plan.md` test it.
- **`task_7_plan.md`: a Work bullet contradicts the interface.** The interface says the character tests run on `<dir>` "as the caller typed it", with the caller's directory passed as `<base>`. The **Argument handling** bullet says "Resolve it against `PWD` beside the existing `out_dir` resolution". That is the `out_dir` idiom, which rewrites the variable to `${PWD}/<dir>` before the test. Done that way, `hr_scratch_path_var`'s `charset` test would run on the absolute caller path, and a checkout under a directory with a space would refuse every `discard`. Reword the bullet: capture `PWD` into a separate variable for `<base>`, and leave `<dir>` raw.
- **`task_7_plan.md`: `cli/templates/state-dir/scratch/README.md` has two more sentences that the new use makes false.** They are *"A file here is written by the dispatched implementer or reviewer that needs the answer. **Nothing reads it**"*. The fetch directories are written by a slash command and read by it (`open_questions:`, `<scratch>/clarifications/…`). Add these sentences to the amend list and to the Verification read.
- **`task_12_plan.md`, leg (d) step 2: the old `<slug>_2` run must be finished before the explicit `start`.** Leg (a) starts a real run on `<slug>_2`, and leg (d) deletes its branch without first waiting for that run or stopping it. If the run is still in progress, Task 1's `skipped` line (finished runs only) does not appear, and the pass condition fails for a reason unrelated to the fix. A run still in flight on a deleted branch is also an uncontrolled variable. Add a step that waits for `<slug>_2`'s `harness run` to be `completed`, or stops it with `remote-run.sh stop <slug>_2`, before the delete. Record its `gh run list … --json databaseId,headSha,status` output. Preferably require that the run carries a state artifact, so that leg (d) reproduces the round-5 defect itself (a bundle that *would* have been placed).
- **Carried from iteration 0, still not applied:**
  - `task_10_plan.md` → `### Targets` still places **Planning drafts cross the job boundary in the bundle.** under `## 4.`. It sits in `## 3. A remote run supervises itself` → `### Runs longer than a job`.
  - `task_10_plan.md` → `**Depends on:**` still omits Task 2, although its new `## 6.` row states the trigger comment's lookup.
  - `task_12_plan.md` → `**Depends on:**` still omits Tasks 10 and 11, although it amends (xiii)'s opening to cite the rows those two tasks add.
- **`task_11_plan.md`: say "append" rather than "amend" for the round-5 verified row.** As written, the task amends that row's second sentence ("the defect it records was fixed in `fix_forge_trigger_run_lineage`…"). That sentence records what round 5 observed. Task 12 deliberately leaves round 5's observed text in `docs/development.md` untouched, and this row should get the same treatment: keep the observed sentence and append the fixed-but-not-yet-re-observed note after it (`.claude/context/conventions.md` → `## Documents of record`).

## Nice to Have

- Carried from iteration 0: `task_6_plan.md` still calls `hr_scratch_path_var` only after `repo_root` resolves. A `..` argument given where no root resolves would therefore exit 68 instead of 65. Either keep the two raw-character tests ahead of root resolution, or record the change in the task's return beside the `itself` tightening.
