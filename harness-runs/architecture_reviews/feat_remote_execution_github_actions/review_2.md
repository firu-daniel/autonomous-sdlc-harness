# Architecture review — iteration 2

Both Must Fix findings from iteration 1 are resolved in the plan:

- Task 14 names both bullets of `permissionProfile.ts`'s `## What this module deliberately does not do` as Targets and amends them in the same edit. It takes route (a): "written or kept" comes from the write engine's `WriteEffect`, and the generator makes no existence test of its own. It also de-duplicates the carried-forward entries against the generated ones, so each `allow` line has one producer.
- Tasks 10, 11 and 12 qualify these watcher-header sentences in place, each with a verification grep: "knows only about", the hold-marker bullet, the lane's "CONSULT that record" and `THE TWO RESUME PASSES`. Task 11 also qualifies the two "not committed" review sentences.

The one new Must Fix below has the same shape: Task 9's job mode makes two more watcher-header guarantees false, and no task qualifies them.

## Must Fix

1. **Job mode (Task 9) and remote dispatch (Task 11) make the watcher header's `WHO RUNS IT.` and `ANCHORS ARE DERIVED, NEVER REMEMBERED.` guarantees false, and no task qualifies them.** Offending files: `task_9_plan.md`, and `task_11_plan.md` for the remote-record half. Rule violated: `.claude/context/cli.md` → `## What "done" means here`: *"Where the header states a rule, the change either satisfies it or amends the header in the same edit — a header a review reads as a guarantee is worth exactly what the code under it still does."* Iteration 1 applied this rule to Tasks 10–12.

   `cli/templates/scripts/autonomous-watcher.sh` states these as unqualified guarantees:
   - **`WHO RUNS IT.`**: *"The service manager (`daemon install` renders the unit), or a person by hand for a single `tick` or a `status`. NEVER a dispatched agent"*. After Task 9, a third runner exists: the GitHub Actions workflow step that runs `HARNESS_JOB_MODE=1 autonomous-watcher.sh job …` (Task 15). The "NEVER a dispatched agent" half stays true. The list of runners does not.
   - **`ANCHORS ARE DERIVED, NEVER REMEMBERED.`**: *"the MAIN checkout … holds the inbox, the logs, the registry and the kill switch, so every run is tailable and stoppable from ONE place while executing in its own sibling working copy"*. The `# Anchors.` block comment above `MAIN_REPO=` repeats it: *"All central state lives in the MAIN checkout; a run executes in a sibling working copy."* Task 9 states the opposite for job mode: *"In the job's checkout `MAIN_REPO` and the working copy are the same directory."* After Task 11, a remote run does not execute in its sibling working copy either. That copy is a local **mirror**, and the run is neither tailable nor stoppable from the main checkout without `remote-run.sh sync` / `stop`.

   Task 9's Targets name only *"the header's subcommand list and exit map"* and a new `JOB MODE` block. A block elsewhere leaves both sentences reading as guarantees. That is the situation iteration 1's finding 2 described for Tasks 10–12.

   **Fix:**
   - In `task_9_plan.md`, add to **Targets** the header's `WHO RUNS IT.` paragraph, the `ANCHORS ARE DERIVED, NEVER REMEMBERED.` paragraph, and the `# Anchors.` block comment above `MAIN_REPO=`. Add a Work bullet that qualifies each **in place** and points at `JOB MODE`:
     - `WHO RUNS IT` adds the workflow's harness step, under `job` with `HARNESS_JOB_MODE=1`, as the one other runner. It stays never a dispatched agent.
     - The anchors sentence and the `# Anchors.` comment add that under `job` the main checkout and the working copy are the same directory, the job's own checkout.
   - In `task_11_plan.md`, extend the same `ANCHORS` qualification for a remote record. The run executes in a GitHub Actions job. Its local working copy is a mirror that `remote-run.sh sync` fills. It is stopped through `remote-run.sh stop`. Point at `REMOTE DISPATCH`.
   - Give Task 9 a verification grep, for example `grep -n -E "WHO RUNS IT|while executing in its own|a run executes in a" cli/templates/scripts/autonomous-watcher.sh`. Each hit must be followed, in the same passage, by its job-mode qualification. Extend Task 11's existing grep with the anchors sentence and its remote qualification.

## Should Fix

These have been carried since iteration 0 or 1 and are still not addressed. None blocks.

- **`task_15_plan.md` still re-spells `retrievalApplies`.** The workflow still reads "whether retrieval applies from `harness.config.json` with `jq`", against `cli/src/config/model.ts` → `retrievalApplies`: *"Declared once, here … Import it; do not re-spell it"*. Fix it one of two ways:
  - Declare the exact `jq` expression in the template header as a mirror, and name the template in `retrievalApplies`' doc comment.
  - Restore the cache unconditionally and let `init` decide.
- **`task_26_plan.md` still credits Task 2 with names Task 2 does not own.** Task 26 attributes `HARNESS_MAX_CHAIN`, `HARNESS_SELF_PAUSE_AFTER_MINUTES` and `HARNESS_STEP_TIMEOUT_MINUTES` to "Task 2's names" and verifies them against "Task 2's constants". `task_2_plan.md`'s export table does not carry them. `HARNESS_REMOTE_SLUG` and `HARNESS_JOB_MODE` have the same problem. Fix it one of two ways:
  - Add them to Task 2's table, with their mirrors.
  - Have Tasks 26 and 29 name `harness-run.yml`'s header and `remote-run.sh`'s header as the owners, and verify against those.
- **`harness-state` is still not declared as a mirror in `remote-run.sh`.** Tasks 6, 7 and 8 use `-n harness-state`. Task 5's mirror declaration and its verification grep cover only `harness-run.yml` and `HARNESS_GH_CLI`. Add `harness-state`, as a named mirror of `STATE_ARTIFACT_NAME`, to Task 5's declared mirrors and its grep.
- **The remote state bundle still has two formats of record.** Task 4 makes the library section `THE REMOTE STATE BUNDLE` the format of record. Task 24's new `plugin/docs/AUTONOMOUS_FLOW.md` owner row calls `docs/remote-execution.md` *"its format of record"*. That breaks `.claude/context/conventions.md` → *"A responsibility that already has a home does not get a second one."* Keep one owner. For example, Task 24's row and Task 28's section cite the library section for the format.
- **`task_6_plan.md` still fixes only the readers sentence of `cli/templates/state-dir/autonomous_logs/README.md`.** That README also says *"Everything here is written by the run daemon"*. After Tasks 4–8, `remote-run.sh` writes `registry.json`, `remote_status.json`, `remote_download/`, `remote_superseded/` and `<branch>.remote.log` there. Add the writers sentence to Task 6's Targets.
- **`task_15_plan.md` still records the measurement in two places.** `.claude/context/conventions.md` → `### Where a new responsibility goes` puts *"a measured fact or a decision of record"* in `docs/`. The full record (command, date, figures) belongs in `docs/remote-execution.md` → `### Runs longer than a job`. The shipped template should carry the derived default and a pointer to that section, not a second copy that names this repository's own `harness-runs/autonomous_logs/`.
- **New: `task_18_plan.md` names `remote-run.sh` in `requiredBinaries`' source text without arguing it.** `.claude/context/cli.md` → `## How a module in this layer is written` → *"One string, one producer"* permits a `.sh` name spelled as a literal only inside a message, with the boundary argued in its own doc comment (`cli/src/doctor/checks.ts` → `WORKTREE_SCRIPT`, `REFRESH_SCRIPT`). Say in Task 18 that the name is message-only, and argue it in the doc comment of that entry or its constant.

## Nice to Have

- This note has stood since iteration 0. Between Task 5 and Task 21, `remote-run.sh` is in the shipped table with `agentInvocable: false` but is not yet on `DENY_SCRIPT_BASENAMES`. One sentence in Task 5 saying that no adopter receives the script before the branch merges would make that window explicit.
