# Task plan review — iteration 0

## Must Fix

1. **The job-surfaces refusal still lets the refused branch's own scripts run in the post-session steps** — `task_9_plan.md` (and the statements that depend on it in `task_15_plan.md` and the story index's goal-4 decision)
   The new step `Refuse a branch that changed the job's own files` goes after `Set up Node`. `Read the configuration` comes before it in `cli/templates/github/workflows/harness-run.yml`, and that step has already written `SCRIPTS_DIR`, read from the **branch's** `harness.config.json`, to `$GITHUB_ENV`. When the new step fails, the steps gated `if: env.HARNESS_STOPPED != '1'` are skipped, because a bare `if:` carries an implicit `success()`. But the post-session steps are gated on `always() && env.SCRIPTS_DIR != ''` (`Push the branch`, `Save the state bundle`, `Upload the state bundle`) and `${{ !cancelled() && env.SCRIPTS_DIR != '' }}` (`Open the pull request and report`, `Continue, wait or stop`), and they still run. They run `bash "$SCRIPTS_DIR/push-branch.sh"` and `bash "$SCRIPTS_DIR/remote-run.sh" save|deliver|continue` from the very tree the check just refused, unsandboxed, with the job's push credential. That is the goal-4 exposure the step exists to close. Task 9's table classifies those steps as `unchanged` because "the scripts they run are the job-start checkout's". On the refusal path, the job-start checkout **is** the payload branch, so that reasoning fails there. The test Task 9 plans checks only where the step sits, so it cannot catch this.
   **Fix:** In `task_9_plan.md`, make a refusal also stop every later step that runs a `$SCRIPTS_DIR` script. For example, the refusal step writes `SCRIPTS_DIR=` (or `HARNESS_STOPPED=1` plus an empty `SCRIPTS_DIR`) to `$GITHUB_ENV` before it exits non-zero. Alternatively, move the check ahead of `Read the configuration`, with Node set up before it. State what the job then reports on a refusal, and how the run's record and notification learn of it, since `save`, `deliver` and `continue` will no longer run. Add assertions to the `cli/test/workflow-templates.test.mjs` case: on the refusal path, no `always()` or `!cancelled()` step can run a `$SCRIPTS_DIR` script. Add a `RED ONCE` line for it. Update Task 9's post-session row and `task_15_plan.md`'s post-session classification to match.

2. **Scope register: the derivation entries miss four sites the branch makes stale** — story index (`fix_watcher_worktree_git_calls_story_plan.md`), `## Scope register`
   I re-ran entries 1 and 2 verbatim. They reach exactly rows 1–20. No entry reaches these sites:
   - `docs/remote-execution.md` → `## 1. The lifecycle of a remote run`, item 4 ("**The job's setup**, in the order `harness-run.yml` runs it: … set up Node; install the `claude` CLI when absent; …"). Task 9 inserts a step into exactly that order.
   - `docs/remote-execution.md` → the same list, item 6 ("**The end of the job.** Under `always()`: `push-branch.sh` …"). This states what runs after the job, which Must Fix 1 changes.
   - `docs/watcher.md` → `## 2. The scripts`, the `create-worktree.sh` row ("then hands off to `setup-worktree.sh`"). Task 5 now hands off to the **main** checkout's script with `--target`.
   - `docs/watcher.md` → `## 2. The scripts`, the `setup-worktree.sh` row ("Bootstraps the checkout it sits in"). Task 5's `--target <dir>` makes this false.

   **Fix:** In the story index, replace the two command entries with these wider ones. Each is a strict superset of the entry it replaces, and both are re-runnable from the checkout root.
   - Entry 1: `git grep -nE "watcher's own (git )?calls|watcher's own artifact commit|reset --hard HEAD|merge --ff-only|fast-forwarded|committed through .commit-on-branch\.sh.|create-worktree\.sh --existing|--existing.{0,40}bootstrap|Bootstraps the checkout it sits in|hands off to .setup-worktree\.sh." -- docs README.md ARCHITECTURE.md ROADMAP.md CONTRIBUTING.md SECURITY.md plugin cli/templates/scripts/README.md cli/templates/state-dir`
   - Entry 2: `git grep -nE "takes four options of its own|Preflight with doctor|Install the pinned plugin|Bootstrap the checkout|Check out the run's branch|in the order .harness-run\.yml. runs it|Under .always\(\)." -- docs README.md plugin`

   Add a row for each of the four sites, with a disposition. Assign the two `docs/remote-execution.md` items to Task 15 and the two `docs/watcher.md` rows to Task 14, or record a `no-change` reason that holds. Then add the matching `**Work:**` bullets to `task_14_plan.md` and `task_15_plan.md`.

3. **Task 13's `RED ONCE` mutation for the verb-level surface check cannot turn red, and most payload cases have no mutation** — `task_13_plan.md`
   The line "drop the surface check after the fast-forward → the `.mcp.json` case dispatches" does not work. In that case the payload sits on `origin/<branch>`, and Task 1's `hr_run_fast_forward_var` already refuses it at its own step 6 (`hr_run_surface_check_var <new> tree`) before the verb-level `copy` check is ever reached. With that check removed, the case still refuses and the test stays green. So no case exercises the `copy` check Task 7 adds after the fast-forward: the working-tree and untracked tests, and the no-op fast-forward when the mirror is already at the payload tip. Separately, goal 5 says each test "states the mutation that turns it red" and that each was "actually run red once". No mutation is listed for these cases:
   - the mirror's `config.worktree` `core.sshCommand`;
   - the nested repository's `core.fsmonitor`;
   - the cut-copy `.claude/settings.json` case;
   - the honest cut-copy case's "no `githooks/pre-commit` marker" claim.

   **Fix:** Add a mirror case that only the verb-level `copy` check catches. Either the mirror's `refs/heads/<branch>` is already at a tip that changes `.mcp.json` (so the fast-forward is a no-op), or the mirror holds an untracked file under `githooks/`. Bind the "drop the surface check after the fast-forward" mutation to that case. Give every payload case its own mutation line, and say what goes red for each.

4. **Task 11's `RED ONCE` block promises one line per payload case but lists six lines for about a dozen cases** — `task_11_plan.md`
   Goal 5 requires each test to state the mutation that turns it red. These payload cases have none:
   - local reuse: `config.worktree` `core.fsmonitor`, the `<main>/.git/modules/<name>/config` fsmonitor, the `.gitattributes` filter, the committed `.claude/settings.json` (the reuse-path `copy` surface check), the untracked `githooks/post-checkout`, and the record `HEAD` pointing at another branch;
   - remote arm: the `pre-commit` / `commit-msg` hooks already on the tip.

   A case with no stated mutation could pass just as well against the unhardened code.
   **Fix:** In `task_11_plan.md`, give each payload case its own mutation line, naming what goes red. Examples: restoring `git -C "$worktree" status --short`, restoring `hr_current_branch`, dropping the reuse-path `hr_run_surface_check_var … copy` call, and restoring `commit-on-branch.sh` for the hook case.

5. **Task 12's `RED ONCE` block leaves payload cases with no mutation** — `task_12_plan.md`
   These cases have no mutation that turns them red:
   - the nested-repository `core.fsmonitor` case;
   - the `config.worktree` `core.fsmonitor` case;
   - the job-mode `HARNESS_GITHUB_DEFAULT_BRANCH` unset case. The "skip the `npx` call" mutation covers only the stub-exit-1 case.

   Goal 5 requires every one of them.
   **Fix:** In `task_12_plan.md`, add one mutation line per payload case and name the failing assertion. Examples: run the reset without the `GIT_DIR` / `GIT_WORK_TREE` pin, or without `-c core.fsmonitor=false`, for the two fsmonitor cases; drop the empty-variable test for the unset case.

## Should Fix

1. **`fileAtRef` is specified as untrimmed, but `runGit` trims** — `task_3_plan.md`. `cli/src/core/git.ts` → `runGit` returns `.trim()`'d stdout, and the task routes `fileAtRef` through it. Either state that the text is trimmed, which is harmless for JSON, or say how an untrimmed read is obtained without a second `execFileSync` site.
2. **The bootstrap claim "this checkout's own copy, which is the main checkout's once step 1 above has passed" is not true from a linked worktree** — `task_5_plan.md`. `hr_wrapper_main_of` follows a worktree's `.git` pointer to the main checkout (`hr_main_checkout_of`). So step 1 passes when `create-worktree.sh` is run from a worktree's `scriptsDir`, and `$script_dir/setup-worktree.sh` is then the worktree's copy. Either require that `$script_dir`'s own top equals `main_repo`, or reword the claim.
3. **A changed site with no register row** — story index `## Scope register` / `task_14_plan.md`. Task 14's second bullet edits `docs/cli.md` → `## 6` → "**The excluded rule's `:*` accepts any argument …**", but the register has no row for it. Add one.
4. **An honest reused copy holding a human-created, ignored `.claude/settings.local.json` is now refused** — `task_6_plan.md` / story index `Top risks:`. The `copy` mode's `ls-files --others` includes ignored files. That file is gitignored (`cli/templates/repo/gitignore`), and an interactive session a person opens in the copy can write it. If this refusal is intended, state it as a deliberate change to an honest outcome. If not, narrow it.
