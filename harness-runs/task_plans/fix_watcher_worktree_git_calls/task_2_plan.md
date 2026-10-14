### Task 2 — The two wrappers take the `GIT_*` drop from the library, and their headers stop restating residual 1

**Goal:** `push-branch.sh` and `refresh-branch.sh` each stop carrying the `GIT_*` unset inline and call the library's `hr_git_env_drop` instead, with **byte-for-byte the same behaviour**: the same names dropped before the first git call, `GIT_SSH_COMMAND` kept, and every refusal, exit status and message unchanged. Two header comments stop restating residual 1, which this branch narrows: `push-branch.sh`'s, and `commit-on-branch.sh`'s, which says every unattended commit point calls it. No behaviour of `commit-on-branch.sh` changes. It remains the dispatched agents' commit wrapper, exactly as shipped.

**Depends on:** Task 1, which adds to `cli/templates/scripts/lib/harness-run-lib.sh`:

> `hr_git_env_drop` — unsets each of `GIT_DIR GIT_COMMON_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_OBJECT_DIRECTORY GIT_ALTERNATE_OBJECT_DIRECTORIES GIT_NAMESPACE GIT_CEILING_DIRECTORIES GIT_TEMPLATE_DIR GIT_CONFIG_PARAMETERS GIT_CONFIG_COUNT GIT_CONFIG_GLOBAL GIT_CONFIG_SYSTEM GIT_EXEC_PATH` and every name `${!GIT_TRACE*}` lists; keeps `GIT_SSH_COMMAND`; leaves no variable of its own set; returns 0.

### Targets

- `cli/templates/scripts/push-branch.sh`
- `cli/templates/scripts/refresh-branch.sh`
- `cli/templates/scripts/commit-on-branch.sh` (header comment only)

**Work:**

- [ ] **`push-branch.sh` and `refresh-branch.sh`.**
  - Delete the inline `unset GIT_DIR … GIT_EXEC_PATH` statement and its `for hr_trace_var in ${!GIT_TRACE*}` loop.
  - Call `hr_git_env_drop` as the first statement after the library is sourced (`. "$hr_lib"`), ahead of argument parsing and every git call.
  - Keep each script's missing-library refusal exactly where and as it is. No git runs before it either way.
  - Every other line of logic is untouched. Above all, `push-branch.sh` keeps its own `hr_pinned_hooks_path` pin to the main repository's hooks: the push must still run the `pre-push` backstop.
- [ ] **Both scripts' `THE INHERITED GIT ENVIRONMENT IS DROPPED.` header paragraphs**, and their in-body comment on the unset. Reword "Before anything else this script unsets …" to say the script drops those names through `lib/harness-run-lib.sh` → `hr_git_env_drop` as its first statement after sourcing the library, before any git call. Keep the list of names and the reasoning as they are: they remain the one place the reasons are stated.
- [ ] **`push-branch.sh`, the paragraph beginning `Residual: the watcher's **own** git calls`**, under `THE PER-WORKING-COPY CONFIG IS NOT TRUSTED.`. Replace it with one sentence: the watcher family's own git calls in a run's copy no longer go through this check. They run no hook, never read the record's `config.worktree`, and refuse a tree that changes a protected path (`lib/harness-run-lib.sh` → the section *The watcher family's git in a run's copy*; `docs/cli.md` §6).
- [ ] **`commit-on-branch.sh`'s opening sentence**, "the deterministic commit wrapper every unattended commit point calls". Reword it to say the wrapper every **dispatched agent's** unattended commit point calls. Add one clause saying the run watcher's own artifact commit no longer goes through it: it commits through `lib/harness-run-lib.sh` → `hr_commit_placed`, from plumbing, running no hook. Change nothing else in the file.

**Verification:**

- `bash -n` exits 0 on all three files.
- For each of `push-branch.sh` and `refresh-branch.sh`, run this throwaway-fixture check by hand. Export `GIT_DIR`, `GIT_TRACE` and `GIT_CONFIG_PARAMETERS` pointing at a decoy before invoking the main checkout's copy aimed at a linked worktree. The outcome is identical to the shipped script's on the same fixture: same exit, same stdout and stderr lines, and the decoy untouched.
- `git diff` on `commit-on-branch.sh` shows comment lines only.
- `git grep -n 'unset GIT_DIR' -- cli/templates/scripts` hits only `lib/harness-run-lib.sh`.
