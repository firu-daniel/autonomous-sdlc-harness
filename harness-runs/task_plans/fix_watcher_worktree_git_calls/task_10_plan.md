### Task 10 — Library cases: the commit primitive, the placement refusal, the `GIT_*` drop and the protected-set parity

**Goal:** Pin the run library's new contracts in `cli/test/outer-loop-scripts.test.mjs`, the suite that already sources the `init`-written library through its `libCall` helper. Bring its one call of the old `hr_commit_placed` signature to the new one.

**Depends on:**

- **Task 1** (`cli/templates/scripts/lib/harness-run-lib.sh`):
  - `hr_git_env_drop`: unsets `GIT_DIR GIT_COMMON_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_OBJECT_DIRECTORY GIT_ALTERNATE_OBJECT_DIRECTORIES GIT_NAMESPACE GIT_CEILING_DIRECTORIES GIT_TEMPLATE_DIR GIT_CONFIG_PARAMETERS GIT_CONFIG_COUNT GIT_CONFIG_GLOBAL GIT_CONFIG_SYSTEM GIT_EXEC_PATH` and every `GIT_TRACE*`, and keeps `GIT_SSH_COMMAND`.
  - `hr_run_protected_rel_paths <main>`: prints the worktree-relative protected set, one per line, from the main checkout's configuration.
  - `hr_run_path_safe <top> <rel>` and `hr_place_artifact <worktree> <src> <rel>`: 1 on a symlinked component or a non-regular leaf.
  - `hr_commit_placed <main> <worktree> <rel> <subject>`: 0 committed, 3 identical, 2 protected, 1 other. It commits **only** `<rel>` over `refs/heads/<branch>`, through a temporary index, and runs no hook.
  - `hr_push_landed <push_wrapper> <worktree> <branch>`: the signature and the 0 / 1 / 2 exit map are unchanged, and it reads refs from the main checkout placed from the wrapper's directory.
- **Task 3:** `cli/src/generators/writeProtection.ts` → `copySurfacePaths(config: HarnessConfig): readonly string[]`, importable from `cli/dist/generators/writeProtection.js`. Its header declares `hr_run_protected_rel_paths` as its shell mirror, which must print the same lines in the same order.

### Targets

- `cli/test/outer-loop-scripts.test.mjs`

**Work:**

- [ ] **Bring the existing case to the new signature.** In `the artifact placement commits one path once, skips an identical re-drop and reads landed off origin`, change the `hr_commit_placed "$PWD/${SCRIPTS_DIR}/commit-on-branch.sh" "$PWD" …` call to `hr_commit_placed "$PWD" "$PWD" …`. Every assertion stays as it is.
- [ ] **New case, *the artifact commit carries only its path and runs no hook*.**
  - The fixture's main `.git/config` sets the repo-relative `core.hooksPath` `githooks` that `init` writes. On a linked worktree, commit on the branch, with hooks pinned off during setup, an executable `githooks/pre-commit` that writes `pre-commit.marker`, **present in that worktree's working tree as well**, so a porcelain commit there would find it. Stage an unrelated file with `git add`.
  - In the **main** checkout's working tree, plant an executable `githooks/reference-transaction` that writes `ref-tx.marker`, after all setup ref updates, since `git -C <main>` resolves the relative hooks path there and `update-ref` is the one commit step that fires a hook.
  - `hr_commit_placed` the placed prompt.
  - Assert:
    - the new commit's `git show --name-only` is `<rel>` alone;
    - the unrelated file is still staged and not in the commit;
    - neither `pre-commit.marker` nor `ref-tx.marker` exists;
    - the worktree's `git status --porcelain` does not list `<rel>`.
  - A protected branch returns 2 with no commit.
- [ ] **New case, *placement refuses a path through a symlink*.**
  - With `<worktree>/<stateDir>/task_prompts` a symlink to a directory outside the fixture, `hr_place_artifact` returns 1, and nothing is written in the symlink's target.
  - With `<rel>` itself a symlink, it returns 1 and the link's target is unchanged.
- [ ] **Two parity cases.**
  - ***`hr_git_env_drop` drops exactly the wrappers' list.*** With every listed name, `GIT_TRACE_PACKET` and `GIT_SSH_COMMAND` exported, `hr_git_env_drop; env` shows none of the listed names and still shows `GIT_SSH_COMMAND`.
  - ***`hr_run_protected_rel_paths` is `copySurfacePaths`.*** For an `init`-written fixture with the default configuration, the library's lines equal `copySurfacePaths(config)` imported from `cli/dist/generators/writeProtection.js`, in order. Then overwrite that fixture's `harness.config.json` by hand with `githooksDir` changed and `phases.docs` and `docs.retrieval` both `true`, without re-running `init`, so no retrieval runtime is needed: the library reads the file only. Compare again against `copySurfacePaths` of the same parsed object.
- [ ] **A `RED ONCE` block in the header comment above the new cases.** Run each mutation once, record the failing assertion, and revert:
  - stage through the worktree's own index instead of a temporary one → the unrelated file lands in the commit;
  - replace `hr_commit_placed`'s plumbing commit with a porcelain, unpinned `git -C "$worktree" commit` of `<rel>` → `pre-commit.marker` appears (plumbing runs no `pre-commit` whatever `core.hooksPath` says, so this is the mutation that reaches the commit hook);
  - drop `-c core.hooksPath=/dev/null` from the `update-ref` call `hr_commit_placed` makes through `hr_run_main_git` → `ref-tx.marker` appears, which shows the pin itself is load-bearing;
  - skip `hr_run_path_safe` in `hr_place_artifact` → the target outside is written;
  - drop `.mcp.json` from `hr_run_protected_rel_paths` → the parity case fails.

**Verification:**

- `npm test --workspace cli -- test/outer-loop-scripts.test.mjs` passes, and each `RED ONCE` mutation was run and observed failing as recorded.
