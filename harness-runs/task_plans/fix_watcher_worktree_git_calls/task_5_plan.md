### Task 5 — `create-worktree.sh --existing` checks before it checks out, and bootstraps with the main checkout's `setup-worktree.sh`

**Goal:** Close the exposed sites `create-worktree.sh --existing` has today.

- **The checkout installs the branch's protected paths.** `git -C "$main_repo" worktree add "$worktree_dir" "$branch"` checks out a branch a run wrote. The main repository's `core.hooksPath` is the repo-relative `githooks` `init` writes, and it resolves inside the new working tree, so that checkout ran the **branch's** committed `githooks/reference-transaction`. This was probed at plan time on git 2.50.1. The same checkout installs the branch's `.claude/settings*.json`, `.mcp.json` and hooks directory.
- **The bootstrap is the branch's own.** It then runs **that branch's** `<scriptsDir>/setup-worktree.sh`, which `eval`s the branch's `commands.depInstall` and `commands.build` and points `core.hooksPath` at the branch's hooks directory.

After this task:

- **The checkout installs nothing unchecked.** `--existing` adds the copy with `--no-checkout` under the pins. It checks the tip it read once with the protected-surface check, then populates the copy from that same commit.
- **The bootstrap is the main checkout's.** It bootstraps with the **main** checkout's `setup-worktree.sh`, aimed at the copy through a new `--target`. Every configured value comes from the main checkout's `harness.config.json`.

**Default mode cuts from origin's answer, not from a ref.** Today it tolerates a failed `fetch origin <defaultBranch>` and cuts from `refs/remotes/origin/<defaultBranch>` as that ref stands. A sandboxed session can write that ref (the common directory's `refs/` / `packed-refs`), so offline, or racing the fetch, the cut could come from a tree a previous run chose, and `worktree add` would check out its protected paths and run its hooks. After this task default mode cuts from `HR_RUN_TRUSTED_BASE`, the commit `ls-remote` reported and the fetch brought, and refuses with exit 2 when that cannot be established. Only then is it inventory class (a), a trusted tree.

**Depends on:** Task 1, whose `cli/templates/scripts/lib/harness-run-lib.sh` provides:

> `hr_run_main_set_var <main>`: sets `HR_RUN_MAIN`. It returns 0 only for a `.git` that is a real directory with no `commondir`, and otherwise 1 with `HR_RUN_REFUSAL`.
>
> `hr_run_copy_check_var <main> <copy>`: 0 trusted or 1 untrusted (`HR_RUN_REFUSAL`). It sets `HR_RUN_MAIN`, `HR_RUN_COPY_TOP`, `HR_RUN_COPY_GITDIR`, `HR_RUN_COPY_BRANCH` (empty when detached) and `HR_RUN_COPY_TIP`.
>
> `hr_run_main_git <args…>`: `git -C "$HR_RUN_MAIN" -c core.hooksPath=/dev/null -c core.fsmonitor=false -c submodule.recurse=false <args…>`.
>
> `hr_run_copy_git <args…>`: the same pins, with `GIT_DIR="$HR_RUN_MAIN/.git"`, `GIT_INDEX_FILE="$HR_RUN_COPY_GITDIR/index"` and `GIT_WORK_TREE="$HR_RUN_COPY_TOP"`.
>
> `hr_run_trusted_base_var`: sets `HR_RUN_TRUSTED_BASE` to the default branch's commit as `ls-remote origin refs/heads/<defaultBranch>` reports it, after a destination-less fetch of that ref and a `cat-file -e` of the object. It reads no local ref of the default branch. 0, or 1 with `HR_RUN_REFUSAL` (no origin URL, unreachable origin, no such ref, or the object missing after the fetch). `hr_run_main_set_var` clears it; set, it returns 0 with no network call.
>
> `hr_run_surface_check_var <tip> tree`: 0, or 1 with `HR_RUN_SURFACE_REFUSAL` naming each differing path. It compares `<tip>`'s tree against `HR_RUN_TRUSTED_BASE` at their merge base, calling `hr_run_trusted_base_var` itself, on the protected set read from the main checkout's configuration. No trusted base is a refusal, never a fallback to `refs/remotes/origin/<defaultBranch>` or `refs/heads/<defaultBranch>`.

**Where this task stops.** The watcher's call of `create-worktree.sh --existing` is **Task 6's** and `remote-run.sh review`'s is **Task 7's**. Neither changes its command line. Both already treat a non-zero exit as *working-copy recreation failed*.

### Targets

- `cli/templates/scripts/create-worktree.sh`
- `cli/templates/scripts/setup-worktree.sh`
- `cli/test/create-worktree.test.mjs`

**Work:**

- [ ] **`create-worktree.sh`, `--existing` arm, in this order.**
  1. Place the main checkout with `hr_wrapper_main_of "$script_dir"`. Refuse with exit 1 unless it equals `main_repo` canonically.
  2. Call `hr_run_main_set_var`.
  3. The existing fetch and existence tests stay as they are.
  4. Read the tip **once**: `refs/heads/<branch>` when local, else `refs/remotes/origin/<branch>`.
  5. Run `hr_run_surface_check_var <tip> tree`. A refusal is **exit 2** ("refusal — nothing was created"), with the refusal sentence.
  6. `hr_run_main_git worktree add --no-checkout <dir> <branch>`.
  7. Run `hr_run_copy_check_var <main> <dir>`. Then require `HR_RUN_COPY_BRANCH` = `<branch>` and `refs/heads/<branch>` = the tip read in step 4.
  8. `hr_run_copy_git read-tree --reset -u --no-recurse-submodules <tip>`.

  **Cleanup on every exit path.** If any step from 7 on fails, remove only what this run created, whatever the exit: the copy, through `hr_run_main_git worktree remove --force <dir>` and then `worktree prune`, and the local branch, deleted only when `worktree add` DWIM-created it. Then exit 2.

  **Default mode**, after its existing no-`origin` refusal: keep today's `git -C "$main_repo" fetch origin "$default_branch" || true`, which keeps the remote-tracking ref current for `--set-upstream-to` below. Then `hr_run_main_set_var "$main_repo"` and `hr_run_trusted_base_var`; a refusal is **exit 2** naming origin, nothing created. Replace the `show-ref` test of `refs/remotes/origin/<default>` and the cut with `git -C "$main_repo" worktree add -b "$branch" "$worktree_dir" "$HR_RUN_TRUSTED_BASE"`, then `git -C "$main_repo" branch --set-upstream-to="origin/$default_branch" "$branch"`, which writes the same `branch.<b>.remote` / `branch.<b>.merge` today's `worktree add -b … origin/<default>` writes, so `push-branch-worktree-config.test.mjs` case (l) stays green unchanged. The cut's tree is origin's, so its hooks and protected paths are trusted and default mode pins nothing new. Update the `no base ref` REPRO row: the failed fetch is no longer tolerated; `ls-remote` finding no ref is what refuses, still exit 2.
- [ ] **`create-worktree.sh`, the bootstrap for `--existing` without `--no-bootstrap`:** run `bash "$script_dir/setup-worktree.sh" --target "$worktree_dir"`. That is this checkout's own copy, which is the main checkout's once step 1 above has passed. It never runs the copy's `<scriptsDir>/setup-worktree.sh`. Default mode keeps today's bootstrap resolution unchanged. Update the header:
  - `THE TWO MODES` and `WHAT IT NEVER DOES` describe the check, the `--no-checkout` population and the main-side bootstrap.
  - The exit map adds the surface refusal to exit 2.
  - A REPRO row reproduces a refused `--existing` cut of a branch that committed `.claude/settings.json` through plumbing.
- [ ] **`setup-worktree.sh`: an optional `--target <dir>`.**
  - Without it, behaviour is byte-identical to today.
  - With it:
    - Refuse unless the script's own checkout places as a main checkout through `hr_wrapper_main_of`, and `<dir>` passes `hr_wrapper_target_check_var` against it.
    - Read **every** configured value — `appDir`, `qa.credentialsPath`, `githooksDir`, `commands.depInstall`, `commands.build` — from the main checkout's `harness.config.json`, and run each step in `<dir>`.
    - Write the `core.hooksPath` value as `<dir>/<main githooksDir>`.
  - Update the header's `Usage:` line, `WHO RUNS IT` and the five steps. State the residual for **both** bootstrap commands: the main checkout's `commands.depInstall` and `commands.build` still run in the copy, against the copy's own `package.json` — the install runs its lifecycle scripts and a build such as `npm run build` runs its `scripts.build` / `prebuild` / `postbuild` — and both start npm in the copy, so a run-written project `.npmrc` or `node_modules/` still applies. `package.json` is not in `copySurfacePaths`, so the surface check does not see a changed script entry. This is code execution by nature and runs unsandboxed; the reason is that a package manager runs the manifest's lifecycle and script entries by nature, and no out-of-session sandbox runtime ships to run them in.
- [ ] **`cli/test/create-worktree.test.mjs`: new cases, each with a label the `RED ONCE` block cites.** Each payload case uses its own branch carrying **one** payload, committed through `hash-object` / `update-index` / `commit` without writing the working-tree file, that writes a marker named for itself. The fixture's main `.git/config` sets the repo-relative `core.hooksPath` `githooks` that `init` writes, so an unpinned checkout resolves hooks inside the new copy, as the plan-time probe observed.
  - **(E1)** `githooks/reference-transaction`, **(E2)** `githooks/post-checkout`, **(E3)** `.claude/settings.json` and **(E4)** `.mcp.json` → each: exit 2, no directory left at the derived path, no new local branch, no marker, and no file at the planted path anywhere under the derived path.
  - **(E5)** An honest existing branch → the copy is populated at the tip, its `git status --porcelain` is empty, and `deps.marker` comes from the **main** checkout's `commands.depInstall` even when the branch's `harness.config.json` names a different command that writes `branch-deps.marker`, which stays absent.
  - **(E6)** `--existing --no-bootstrap` on an honest branch → populated, and no `deps.marker`.
  - **(E7) A forged base, `--existing`.** A branch commits `.claude/settings.json` through plumbing; then point the main repository's `refs/remotes/origin/trunk` **and** `refs/heads/trunk` at that tip with `update-ref`. → exit 2, nothing left behind, the planted file nowhere under the derived path.
  - **(E8) A forged base, default mode, origin unreachable.** Commit a `.claude/settings.json` payload and a marker-writing `githooks/post-checkout` on a side commit, point `refs/remotes/origin/trunk` at it, and set `remote.origin.url` to a missing path. `create-worktree.sh feat/f` → exit 2 naming origin, no directory, no `feat/f` branch, no marker.
- [ ] **A `RED ONCE` block in the test file's header, one line per case.** Each mutation reaches its case's payload past every other guard. Apply each once, run the file, record the failing assertion, and revert. Step 5's surface check refuses every payload case before step 6 runs, and step 6's `hr_run_main_git` pins `core.hooksPath=/dev/null` for the checkout `worktree add` spawns, so a mutation of step 6 alone reaches nothing; the hook cases' mutations remove both.
  - **(E1)** skip the surface check **and** replace steps 6–8 with today's unpinned `git -C "$main_repo" worktree add "$worktree_dir" "$branch"` → the `reference-transaction` marker appears.
  - **(E2)** the same mutation → the `post-checkout` marker appears.
  - **(E3)** skip the surface check alone → exit 0, and the copy's working-tree `.claude/settings.json` is the planted one.
  - **(E4)** skip the surface check alone → exit 0, and the copy's working-tree `.mcp.json` is the planted one.
  - **(E5)** run the copy's `<scriptsDir>/setup-worktree.sh` instead of `$script_dir/setup-worktree.sh` → `branch-deps.marker` appears.
  - **(E6)** run the bootstrap whatever `--no-bootstrap` says → `deps.marker` appears.
  - **(E7)** use the local `refs/remotes/origin/<defaultBranch>` as the base in `hr_run_surface_check_var` in place of `HR_RUN_TRUSTED_BASE` → exit 0, and the copy's working-tree `.claude/settings.json` is the planted one.
  - **(E8)** restore today's default-mode `show-ref` test and cut from `origin/$default_branch` in place of the trusted-base refusal → exit 0, the copy carries the planted `.claude/settings.json`, and the `post-checkout` marker appears.

  **A mutation that leaves its case green** means one of two things. First, check by hand that the fixture reaches the payload, and fix the fixture if it does not. If the payload genuinely never reached the pre-Task-5 `--existing` either, the case is a regression guard: record that in the header as *"regression guard: the pre-hardening `--existing` did not reach this payload"*, and give it a second mutation that does turn it red. Never drop a line.

**Verification:**

- `npm test --workspace cli -- test/create-worktree.test.mjs` passes, and every `RED ONCE` mutation was run and observed failing as recorded.
- `bash -n` exits 0 on both scripts.
- The `--existing` REPRO rows in `create-worktree.sh`'s header, run by hand against a throwaway fixture, give the outcomes they state.
