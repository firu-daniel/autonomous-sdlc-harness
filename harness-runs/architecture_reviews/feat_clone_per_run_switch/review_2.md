# Architecture review — iteration 2

The iteration-1 Must Fix is resolved in the artifact. `task_13_plan.md` → `run_profile_check` now states the sandbox clause as a declared mirror of `shippedSandboxSettings` and of `applySandbox`'s opt-out shape. `task_5_plan.md` declares that mirror in `sandboxProfile.ts`'s header. `task_14_plan.md` → **The mirrors.** holds the values equal, and its opt-out perturbation uses a profile a real `init` rendered. `task_26_plan.md` restates the exception to match.

The story index has no `## Rejected findings` section. So the three iteration-1 Should Fix items, none of which was applied, are carried below as unaddressed.

## Must Fix

1. **Tasks 7 and 11 break three caller rules written in the run library's headers, and Task 1, the only task allowed to edit the library, amends none of them** — `task_1_plan.md` (where the fix goes), with the breaking calls in `task_7_plan.md` and `task_11_plan.md`. This violates `.claude/context/cli.md` → `## What "done" means here`: *"A reviewer holds a change to its module's own header. Where the header states a rule, the change either satisfies it or amends the header in the same edit."* It also violates `.claude/context/conventions.md` → `### Where a new responsibility goes`: *"A responsibility that already has a home does not get a second one."*

   `cli/templates/scripts/lib/harness-run-lib.sh` states three caller rules that this branch breaks:
   - `hr_registry_drop`'s comment: *"only `hr_clone_create_var`'s rollback calls it"*. Task 7's rollback step 3 calls `hr_registry_drop` from `create-worktree.sh`, and so does Task 11's `start_remove_copy` step 4 in `remote-run.sh`.
   - `hr_registry_restore`'s comment: *"only `hr_clone_create_var`'s rollback calls it"*. Task 7's rollback step 3, *"or put the previous one back"*, is that function called from `create-worktree.sh`.
   - `hr_clone_create_var`'s header refuses *"a registry directory that does not exist, since only the watcher makes it"*. Task 7's first **Work** bullet makes `create-worktree.sh` `mkdir -p` `<stateDir>/autonomous_logs/` when it is absent. That is a second creator of a directory the library says only the watcher creates (`autonomous-watcher.sh` → `mkdir -p "$INBOX_DIR" "$LOGS_DIR" …`).

   `task_1_plan.md` says it is *"the only one that edits the library"*. Its **Restate the section headers.** bullet rewrites *"No script calls either"*, but it leaves all three of these sentences alone. Tasks 7 and 11 cannot amend them, because they do not own the file. After this branch, the library's headers would state caller rules the branch's own scripts break, and a reader who trusts *"only … calls it"* would miss two callers.

   **Fix:**
   - `task_1_plan.md` → **Restate the section headers.**: add a bullet that restates three comments.
     - `hr_registry_drop`'s and `hr_registry_restore`'s comments name their callers after this branch: `hr_clone_create_var`'s rollback, `create-worktree.sh`'s failure rollback (Task 7) and, for `hr_registry_drop`, `remote-run.sh`'s `start_remove_copy` (Task 11).
     - `hr_clone_create_var`'s refusal clause no longer says *"only the watcher makes it"*. It names both creators of the registry directory: the watcher, and `create-worktree.sh` when a trigger job's fresh checkout has none (Task 7). Keep the refusal itself unchanged.
   - `task_7_plan.md` and `task_11_plan.md` → **Depends on:** Task 1: list these restated comments, so each implementer can see its call is now a declared one.

## Should Fix

1. **Two scripts still hand-roll per-branch registry reads that the library already provides** — `task_9_plan.md`, first **Work** bullet (*"read its registry record's `worktree` and `copy_kind` with `jq` over the file, never creating it"*), and `task_11_plan.md`, first **Work** bullet (`had_record`, *"reading the registry without creating it"*, with no reader named). This was raised in iterations 0 and 1. It is neither applied nor recorded under `## Rejected findings`.

   `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_registry_peek <file> <branch> <key>` already reads one record field without creating the file, as *"The read a check makes"*. Task 1 uses it for the same read inside `hr_run_copy_live_var`. Rule: `.claude/context/conventions.md` → `### Where a new responsibility goes` (*"Before adding a copy of anything, grep for it"*).

   **Fix:**
   - In Task 9, read `worktree` and `copy_kind` with `hr_registry_peek`. Keep the script's existing enumeration `jq`, which `hr_registry_peek` does not cover, and keep the fail-closed refusal for an unreadable registry.
   - In Task 11, name `hr_registry_peek "$registry" "$branch" branch` (or any field) as the `had_record` test. Its return value already tells a present record from an absent one.

2. **`branch-prompt.md`'s restated one-live-copy rule still names no owner** — `task_20_plan.md`. This was raised in iterations 0 and 1. It is neither applied nor recorded.

   `.claude/context/plugin.md` → `## Citation` says to cite anything outside the plugin by its repo-relative path plus a symbol anchor. The plan's **Depends on:** names `hr_run_copy_live_var`, but no **Work** bullet carries that citation into the command. Without it, a later change to the rule has no grep path back to check (b).

   **Fix:** in the rewritten check (b), add one prose citation, `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_run_copy_live_var`, named as the rule the three conditions restate.

3. **No task adds the new machine-state artifact to the two lists of what the machine state directory holds** — `task_21_plan.md`, and no task targets `cli/src/machine/paths.ts`. This was raised in iteration 1 and is not applied.

   `.claude/context/cli.md` → `## How a module in this layer is written` → **Machine-scoped state is not an adopter's file.** requires that what is written outside the target repository be enumerated, with one owner per piece. Two lists still enumerate the directory without `run-profiles/`:
   - `docs/watcher.md` → `## 5. Machine-level usage lane` → `### The two paths` (the tree showing `usage-state.json` and `run-lane.lock/`);
   - `cli/src/machine/paths.ts` → `machineStateDir`'s JSDoc (*"What lives in it is … the usage lane's two artifacts … and the registry of initialized repositories"*).

   Task 1 updates the library's own artifact list, and Task 21's work stops at §1–§2.

   **Fix:**
   - In Task 21, add `run-profiles/<slug>/<branch>.json` to §5's directory tree, or add a sentence there pointing at the new `### The per-run profile` subsection, with `hr_run_profile_file` as its owner.
   - Add one clause to `machineStateDir`'s JSDoc. Put it in a `cli` task as a JSDoc-only target, either Task 6 (already a `cli/src` task) or a new small task.

## Nice to Have

1. `task_20_plan.md`: condition 2 (*"the registry record's `worktree` … names a path that exists"*) can never fire on its own in this command, because check (a) already rejects any registry record for the branch. Say so in one clause, or drop it from (b), so the command does not appear to rely on a test it never reaches. This was carried over from iterations 0 and 1.
