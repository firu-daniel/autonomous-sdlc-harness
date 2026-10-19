# Task plan review — iteration 1

## Must Fix

1. **Scope register: derivation entry A misses corpus files that describe the commit wrapper without naming its file (disposition ii)** — story index (`fix_sandbox_worktree_record_writes_story_plan.md`) → `## Scope register`.
   Entry A greps only for the literal `commit-on-branch`, so it misses every corpus site that says "commit wrapper" or "commit-wrapper" instead. One of those sites becomes false on this branch:
   - `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` → the `<app_root>` row of `## Resolved values` says *"a commit-wrapper call a fork adds names its script path repo-relative and runs from `<repo_root>`, and a fork naming a push may name the main checkout's copy of the push wrapper instead"*.
   - The same file's paragraph **`<app_root>` is declared here, not consumed here.** repeats it: *"a commit-wrapper call a fork adds names its `<scripts_dir>` script path repo-relative and runs from `<repo_root>`"*.

   Task 8 moves both fork commit points over this core, Override 3 and Override 5, to `bash <MAIN_REPO>/<scripts_dir>/commit-on-branch.sh --repo <repo_root> …`. That leaves this core stating the old spelling as the rule. It is the same false statement the plan already corrects in the fork's own `<app_root>` row (register row 25, Task 8).

   The corrected entry also reaches `docs/flow-graph-walker.md` → **Which record wins.** (*"that flip is re-applied, idempotently through the commit wrapper's exit 3"*). That sentence stays true, so it needs only a `no-change` row.

   Sites the corrected entry newly reaches: `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` and `docs/flow-graph-walker.md`.
   **Fix:** Replace entry A with this strictly wider command. Run from the checkout root, it returns entry A's 27 files plus the two above:
   `grep -rliE --include='*.md' --include='*.json' --include='*.txt' 'commit-on-branch|commit[ -]wrapper' plugin docs README.md ARCHITECTURE.md ROADMAP.md llms.txt CONTRIBUTING.md cli/README.md cli/scripts cli/templates/README.md cli/templates/claude cli/templates/scripts/README.md examples/notes-app/.claude examples/notes-app/README.md`
   Then make these changes:
   - Add a `change` row for the core's `<app_root>` row and its **`<app_root>` is declared here, not consumed here.** paragraph, owned by a `plugin` task. Task 8, which already edits the fork, is the natural owner.
   - Add that file to the owning task's `### Targets`, with a Work bullet restating both sentences: a commit-wrapper call a fork adds names the main checkout's copy, `<MAIN_REPO>/<scripts_dir>/commit-on-branch.sh`, with `--repo <repo_root>`, as the push does. Keep the core literal-free under `plugin/instructions/mode_contract.md` rule (4).
   - Add a `no-change` row for `docs/flow-graph-walker.md` → **Which record wins.**, with its reason.

2. **Task 8 leaves the planning fork's `<app_dir>` row stating the old commit spelling** — `task_8_plan.md`. Also extend the story index's register row 24.
   `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Resolved values` → the `<app_dir>` row says *"no step this file states consumes that root — the commit wrapper's `<scripts_dir>` path below is repo-relative and runs from `$REPO_ROOT`, and the push wrapper is named under `<MAIN_REPO>`"*. Task 8 moves every commit block in this file to `<MAIN_REPO>`'s copy with `--repo <repo_root>`. After that, this row contradicts the blocks below it, and it is a resolved-values row an agent reads before it reaches them.
   Task 8's Work bullets for this file list the two **Commit mechanism** paragraphs, the "Pass all six" paragraph, the ledger paragraphs and the two "If a hook fails" sentences, but not this row. Its closing greps (`'commit-on-branch.sh --repo "\$REPO_ROOT"'`, `'bash <scripts_dir>/commit-on-branch.sh'`) cannot catch it, because the row never names the file. The same file family's `<app_root>` row in `user_review_fix_plan_writing_instructions_autonomous.md` is already handled by Task 8, so this is the matching gap in the sibling fork. It is the story index's second `Top risks:` failure mode: a commit point read as the old spelling fails at its first commit.
   **Fix:**
   - In `task_8_plan.md`, add the `<app_dir>` row to the `task_plan_writing_instructions_autonomous.md` Work bullet. Restate it as: the commit wrapper and the push wrapper are both named under `<MAIN_REPO>`, the commit with `--repo <repo_root>`. Keep the row's statement that no step consumes the app root.
   - Add a Verification grep that catches a prose restatement, not only an invocation. For example, `grep -rn -i 'commit wrapper.*repo-relative\|commit-wrapper.*repo-relative' plugin/instructions plugin/agents plugin/commands` prints nothing.
   - In the story index, add the `<app_dir>` row to register row 24's Site cell.

## Should Fix

1. **The wrapper's internal `git add -- <path>` is still described in five commit points after Task 1 removes it.** `task_plan_writing_instructions_autonomous.md` (both **Exact staging + commit** paragraphs), `user_review_fix_plan_writing_instructions_autonomous.md` (**Exact staging + commit**), `improvement_observations_instructions.md` (**Exact staging + commit**) and `docs_orchestration_instructions_autonomous.md` (`## Commit mechanics (single source of truth)`'s closing contract paragraph, *"(`git add -- …`, never `git add -A`/`.`)"*) all say the wrapper stages with `git add`. Task 1 makes that false. `task_7_plan.md`'s Verification even keeps such lines (*"Any hit that remains describes what the wrapper does internally"*). In Tasks 6–8, restate each one as "the wrapper commits exactly those paths", and drop that Verification allowance.
2. **`task_1_plan.md` places the new library functions in the wrong section for the write exception it extends.** The Work bullet puts `hr_run_blob_var` and `hr_commit_paths_var` in `THE WATCHER FAMILY'S GIT IN A RUN'S COPY`, which is write exception 5. It then adds them to write exception 4's "Written only by" list. `hr_commit_placed` sits under `# THE ARTIFACT PLACEMENT.`, whose header says *"Write exception 4 in the header is this section's"*. Choose one: either put the functions in the artifact-placement section under exception 4, or keep the section and list them under exception 5. Then widen that exception's fence from *"the copy's index entry for `<rel>`"* to the given paths, since the wrapper now writes through it too.
3. **`task_4_plan.md` rewords only one of `profile-sandbox`'s two wrapper-failure messages.** `cli/src/doctor/checks.ts` also carries the stale-spelling finding, *"…without it that wrapper runs sandboxed and its SSH push or fetch fails"*. That message is just as false for the commit wrapper. Reword it in the same edit, with the same "true of all three" message.
4. **`task_2_plan.md` → Verification, the mutation check, carried over from iteration 0 and neither resolved nor recorded.** "Comment out the `hr_wrapper_target_check_var` call in the fixture's copy of the script" cannot be done by hand. The suite copies `cli/templates/scripts/commit-on-branch.sh` at run time, and the task "changes no script". State that the mutation is made on the template and reverted before the report, with `git diff cli/templates/scripts` empty afterwards. Or record a rejection with its reason.

## Nice to Have

1. Register row 46 merges WR1, WR2 and WR3 into one row. The register format asks for one row per candidate site, so split it into three.
