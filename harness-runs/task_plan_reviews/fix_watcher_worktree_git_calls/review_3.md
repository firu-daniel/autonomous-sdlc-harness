# Task plan review — iteration 3

Iteration 2's one Must Fix is resolved. The story index's decision, `task_5_plan.md`'s `--target` bullet, `task_9_plan.md`'s header bullet and payload-class row, `task_14_plan.md`'s fact list and residual item 1, and `task_15_plan.md`'s npm fact and §11 residual now all name both bootstrap commands, `commands.depInstall` and `commands.build`, as the stated residual, with the same reason.

These checks hold:

- **Index and correspondence.** The index has `# Story:`, then `## Context` with `Top risks:` and `Manual setup required:`, then `## Phase 2 Readiness — Ordered Fix List` immediately after it. There is no `## Tasks` heading. Its 15 entries match the 15 per-task files 1:1, and each heading agrees with its filename.
- **Tags, order and budgets.** Every entry has a single layer tag: `cli` for Tasks 1–13, then `general` for Tasks 14–15, last. Every `**Depends on:**` link points backward. Every task has 20 points or fewer and 5 `**Work:**` bullets or fewer.
- **Conventions documents.** No task targets one.
- **Test runs.** No `**Verification:**` bullet asks for a forbidden test run.
- **Cited anchors.** I checked the cited anchors in `harness-run-lib.sh`, `push-branch.sh`, `refresh-branch.sh`, `commit-on-branch.sh`, `create-worktree.sh`, `setup-worktree.sh`, `autonomous-watcher.sh`, `remote-run.sh`, `cleanup-merged-worktrees.sh` and `harness-run.yml`. They resolve, and the anchors I checked against prose are wrapped across comment lines, not missing.
- **Scope register.** I re-ran derivation entries 1 and 2 verbatim. Every hit is a row:
  - entry 1 reaches rows 1, 2, 4–9, 14, 15, 20, 23 and 24;
  - entry 2 reaches rows 3, 10–13, 16–19, 21 and 22;
  - entry 3 reaches no rule in `harness-runs/lessons.md`.

## Must Fix

1. **The surface check measures against a ref the sandbox can write, so a run can choose its own base.** Files: the story index (`fix_watcher_worktree_git_calls_story_plan.md`, `## Context` → the third and the goal-4 **Decisions** bullets), `task_1_plan.md`, `task_6_plan.md`, `task_5_plan.md`, `task_11_plan.md`, `task_12_plan.md` and `task_13_plan.md`.

   **What the base is today.** `task_1_plan.md` → `hr_run_surface_check_var` sets **Base:** to `merge-base <tip> refs/remotes/origin/<defaultBranch>`, else `merge-base <tip> refs/heads/<defaultBranch>`, read from the main repository. Both refs live in the common directory's `refs/` / `packed-refs`, which a sandboxed session can write:
   - the task prompt (*"In the common directory, `objects/`, `refs/`, `packed-refs`, `info/` and `modules/<name>/config` stay writable too"*);
   - `cli/src/generators/writeProtection.ts` → `protectedPaths` has no `refs` entry;
   - `harness-run-lib.sh` → `hr_wrapper_main_of`'s comment says *"a linked worktree may write the main repository's `.git` except `hooks/` and `config`"*.

   **The attack.** A session commits a payload `.claude/settings.json` or `githooks/reference-transaction` through plumbing. It then points `refs/remotes/origin/<defaultBranch>` at its own tip. `merge-base(tip, base)` is now the tip, so the `tree` diff is empty and the check passes.
   - The watchdog's `hr_run_reset_var` then installs the payload in the copy, and the resumed session loads that settings file's hooks unsandboxed.
   - The review reuse's `copy` check and the remote arm's `hr_run_fast_forward_var` tree check are defeated the same way.
   - The plan names no fetch and no other anchor that sets the base before these checks. `create-worktree.sh --existing`'s existing fetch is `fetch origin "$branch"` only.

   **Job mode has the same hole.** The watchdog's `doctor --cwd "$MAIN_REPO" --job-surfaces=…` (`task_6_plan.md`) reads both the trusted configuration and the merge base from `refs/remotes/origin/<github default>` in the checkout the session has just been writing. The session can rewrite that ref there too.

   **The workflow step is not affected.** `task_9_plan.md`'s step runs on a fresh `actions/checkout`, before any session.

   **Related.** `task_5_plan.md` and `task_6_plan.md` class default-mode `create-worktree.sh` as (a), a trusted tree. Default mode tolerates a failed `fetch origin <defaultBranch>` and then cuts from `refs/remotes/origin/<defaultBranch>` as it stands. Offline, that cut comes from a ref a previous run could have set.

   The plan's own design claim is *"The design does not rely on the Linux glob entries"* and *"a run's commits can carry any content at any path"*. A sandbox-writable ref as the trust anchor breaks the guarantee on every platform.

   **Fix:** Take the base from something the sandbox cannot set, and state the choice and its reason in the story index's decision bullet. For example:
   - Fetch `refs/heads/<defaultBranch>` through `hr_run_main_git` immediately before the check, after `hr_remote_url_configured`. Then judge against that fetch's own result: `FETCH_HEAD`'s object id read right after the fetch, or `ls-remote`'s answer. Do not trust the remote-tracking ref as it stood.
   - Or compare the protected set against the main checkout's own copies of those paths. Those are literal, non-glob `denyWrite` entries.

   Either way, refuse rather than fall back to `refs/heads/<defaultBranch>` when no trusted base can be established.

   For job mode, have `harness-run.yml` record the default branch's commit id at job start, after its refusal step, in the `run` job's environment. The watchdog then passes it to `doctor` (for example `--job-surfaces=<branch>@<sha>` or a second option), and `doctor` reads the trusted configuration and the base from that object id, never from a ref the session can move.

   Update every per-task file that restates `hr_run_surface_check_var`'s contract or the watchdog's call: Tasks 1, 5, 6, 11, 12 and 13. Restate the default-mode class (a) claim in `task_5_plan.md` and `task_6_plan.md` under the same rule.

   Add a planted-payload case with a `RED ONCE` line where the base ref is forged to the payload tip:
   - `task_12_plan.md`: local and job-mode watchdog;
   - `task_11_plan.md`: review reuse and remote arm;
   - `task_13_plan.md`: `remote-run.sh review`.

   The mutation that turns each red is "use the local `refs/remotes/origin/<defaultBranch>` as the base". Each case asserts no marker and the refusal outcome.

## Should Fix

1. **Raised in iterations 0–2, and neither resolved nor recorded under `## Rejected findings`: the bootstrap claim** — `task_5_plan.md`. It says the bootstrap is *"this checkout's own copy, which is the main checkout's once step 1 above has passed"*. `hr_wrapper_main_of` follows a pointer-file `.git` to the main checkout, so step 1 passes for a linked worktree's `scriptsDir` as well. Either require `hr_checkout_top_nogit "$script_dir"` to equal `main_repo`, or reword the claim.
2. **Raised in iterations 0–2, and still unaddressed: `fileAtRef`** — `task_3_plan.md`. It is specified as "untrimmed" and also routed through `runGit`, which trims (`cli/src/core/git.ts` → `runGit`). Pick one.
3. **Raised in iterations 0–2, and still unaddressed: a changed site with no register row.** `task_14_plan.md`'s second bullet edits `docs/cli.md` → "**The excluded rule's `:*` accepts any argument …**", and the story index's `## Scope register` has no row for it.
4. **Raised in iterations 0–2, and still unaddressed: ignored files** — `task_1_plan.md` (`copy` / `reset` modes, *"ignored files included"*) and `task_6_plan.md`. An honest copy holding a person-written, gitignored `.claude/settings.local.json` is now refused. Either state this in `Top risks:` as a deliberate change to an honest outcome, or narrow the untracked test.
5. **Raised in iterations 1–2, and still unaddressed: (L5) is caught by the clean test** — `task_11_plan.md`. A plumbing commit that leaves the working-tree file untouched makes the working tree differ from the index, so `hr_run_copy_clean` refuses first, and the (L5) mutation stays green. Write the working-tree file too in the fixture.
6. **Raised in iterations 1–2, and still unaddressed: `hr_push_landed`'s fetch** — `task_1_plan.md`. It omits `-c core.fsmonitor=false`, against the story index's *"Both forms also carry `-c core.fsmonitor=false -c submodule.recurse=false`"*. Route it through `hr_run_main_git`.
7. **Raised in iteration 2, and still unaddressed** — `task_8_plan.md`. `**Verification:**` says "both `RED ONCE` mutations", but the block has four, (C1)–(C4). Say "every".

## Nice to Have

1. `task_4_plan.md` → `**Verification:**` diffs `checks.ts` against `main`, but `defaultBranch` is `dev`. Diff against the merge base with `dev`.
