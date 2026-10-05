# Architecture review — iteration 0

## Must Fix

1. **Task 5 puts a second writer into `remote_superseded/` in the watcher, outside the library that owns that directory** — `task_5_plan.md` (Work, first bullet: *"move it aside with one `mv` (find a free `<epoch>-<n>` exactly as `hr_remote_bundle_restore` does)"*; Targets list only `autonomous-watcher.sh`). Rules: `.claude/context/conventions.md` → `### Where a new responsibility goes` (*"A responsibility that already has a home does not get a second one"* and *"Before adding a copy of anything, grep for it"*), and `.claude/context/cli.md` → `## What "done" means here` (*"A reviewer holds a change to its module's own header. Where the header states a rule, the change either satisfies it or amends the header in the same edit"*).
   `cli/templates/scripts/lib/harness-run-lib.sh` already owns this responsibility. Its header → `THE WRITE EXCEPTIONS TO "WRITES NOTHING", AND THEIR FENCES`, entry 3 (THE REMOTE STATE BUNDLE), names the move-aside directory `autonomous_logs/remote_superseded/` and says it is *"Written only by `hr_remote_status_write`, `hr_remote_bundle_write` and `hr_remote_bundle_restore`"*. It also says *"Nothing outside this list writes at all; a section that adds a writer adds its entry here."* The free-name search (`<epoch>`, then `<epoch>-<n>`) lives in `hr_remote_bundle_restore`, under the paragraph `THE CLARIFICATION DIRECTORY IS REPLACED WHOLESALE, AND NOTHING IS DELETED`. As planned, Task 5 breaks that fence in two ways. A second script (`autonomous-watcher.sh` → `run_job`) writes into the library's fenced directory, and it does so with a hand-copied second version of the free-name algorithm. If the two copies drift, a later aside move can land on a directory an earlier one already used. `cli/src/core/repoPaths.ts` is the conventions document's own example of what drifted copies cost. The plan also never amends the library header, so that header would go on claiming a monopoly the code no longer has.
   **Fix:** Rewrite Task 5 so that the aside move is a library function:
   - Add `cli/templates/scripts/lib/harness-run-lib.sh` to Task 5's Targets.
   - Extract the free-name search and the single `mv` into a new library function, e.g. `hr_remote_move_aside <root> <rel_path>`. It moves `<state_dir>/<rel_path>` to `autonomous_logs/remote_superseded/<epoch>[-<n>]/<rel_path>` and never removes anything.
   - Make `hr_remote_bundle_restore` call the new function for its clarification-directory move, so the algorithm keeps one body.
   - Have `run_job` call the same function for `PAUSE_PROGRESS.md`.
   - Amend the library header in the same task: entry 3's *"Written only by"* list gains the new function, and its fence names `PAUSE_PROGRESS.md` as something that can be moved aside.
   - Change Task 5's Work bullet and its `HR_REMOTE_SUPERSEDED_DIR` reference to match.
   - Task 5's existing `watcher-remote-job.test.mjs` cases still cover the behaviour. Add one Verification bullet: `grep -n "remote_superseded\|HR_REMOTE_SUPERSEDED_DIR" cli/templates/scripts/autonomous-watcher.sh` finds no path built in the watcher.

## Should Fix

1. **Task 9 plans a second read of GitHub's default branch instead of sharing `verb_warm`'s** — `task_9_plan.md` (*"`gh repo view --json defaultBranchRef`, as `verb_warm` reads it"*). Rule: `.claude/context/conventions.md` → `### Where a new responsibility goes` (*"Before adding a copy of anything, grep for it"*). `verb_warm` in `cli/templates/scripts/remote-run.sh` already holds the call, the `jq` parse of `.defaultBranchRef.name` and the `GH_ERR` text for an empty answer. Task 9 already requires the provenance-line parser to be shared rather than copied (`forge_issue_var` / `forge_issue_at_commit_var`). **Fix:** move that read into one helper, e.g. `gh_default_branch_var`, which both `verb_warm` and `verb_stop --branch-gone` call. Add a Verification bullet: `grep -n "defaultBranchRef" cli/templates/scripts/remote-run.sh` shows one call site outside the header.

2. **Task 8 spells the ledger path a second time** — `task_8_plan.md` (*"Read the ledger from `refs/remotes/origin/<branch>:<state_dir>/flow_progress/<branch>_progress.md`"*). `forge_recognised` in `cli/templates/scripts/remote-run.sh` already builds that path inline. Rule: the same *"Before adding a copy of anything, grep for it"*. **Fix:** have Task 8 factor the path into one small helper, used by both `forge_recognised` and `control_status`. Otherwise a later rename of the ledger file would have to find two spellings.

## Nice to Have

_None._
