### Task 6 — The watcher's review drop, artifact commits and stall watchdog on the hardened primitives

**Goal:** Every git call `cli/templates/scripts/autonomous-watcher.sh` makes in or on a run's working copy is hardened or no longer happens. The table below is this file's rows of the inventory. Outcomes on an honest copy stay exactly what they are today.

| Site (anchor) | Class today | Payloads that reach it | After this task |
|---|---|---|---|
| `process_inbox_file`, review path, reused copy: `hr_current_branch "$worktree"` | (b) reads only (`symbolic-ref`) | the `.git` pointer or record (Linux) can redirect the answer | branch read once from main: `hr_run_copy_check_var` → `HR_RUN_COPY_BRANCH` |
| the same: `git -C "$worktree" status --short` | (c) | `config.worktree` `core.fsmonitor`; a nested repository's own config, behind a gitlink the run added (probed at plan time); `modules/*/config`; `.gitattributes` drivers; the `.git` pointer or record (Linux) | `hr_run_copy_clean`, then `hr_run_surface_check_var refs/heads/<branch> copy` |
| remote arm: `git -C "$worktree" fetch origin "$branch"` | (c) | `config.worktree` (`core.sshCommand`, `remote.*`); hooks (`reference-transaction`); on-demand submodule fetch under `modules/*/config` | `hr_remote_url_configured`, then `hr_run_main_git fetch --no-recurse-submodules origin "+refs/heads/<b>:refs/remotes/origin/<b>"` |
| remote arm: `git -C "$worktree" merge --ff-only "origin/$branch"` | (c) | a committed protected path a checkout writes (hooks directory, `.claude/settings*.json`, `.mcp.json`); `post-merge` and `reference-transaction` hooks; fsmonitor; `.gitattributes` drivers | `hr_run_fast_forward_var refs/remotes/origin/<b>` |
| `remote_commit_and_push` → `hr_commit_placed` (`git add`, `diff --cached`, `commit-on-branch.sh`'s `add` / `commit` with the copy's hooks) | (c) | hooks (`pre-commit`, `commit-msg`, `post-commit`, `reference-transaction`); `config.worktree`; anything else staged in the run's index | `hr_commit_placed "$RUN_MAIN" …` (plumbing, no hook, only `<rel>`) |
| the same: `hr_push_landed` (`rev-parse HEAD`, `fetch`, `merge-base` in the copy) | (c) through the fetch | `config.worktree`; hooks | the library's main-side `hr_push_landed`; `push-branch.sh` itself is already hardened |
| task and docs drops: `hr_commit_placed` in a copy `create-worktree.sh` has just cut | (c) today: the cut comes from `refs/remotes/origin/<defaultBranch>` as that sandbox-writable ref stands, and a failed fetch is tolerated | a forged `refs/remotes/origin/<defaultBranch>` | (a) trusted tree after Task 5: the cut is from the commit origin reported (`HR_RUN_TRUSTED_BASE`), or `create-worktree.sh` refuses with exit 2, which the drop already treats as a failed recreation; no session has run there. Same new call as above, for one code path |
| `check_stalled_runs`: `git -C "$worktree" reset --hard HEAD` | (c) | a committed protected path the reset writes, followed by a resumed session that loads it; `reference-transaction`; fsmonitor; submodules; in job mode, run-authored outer-loop scripts the post-session steps then run | `hr_run_copy_check_var` + `hr_run_reset_var`. In job mode only, first `npx --yes "autonomous-sdlc-harness@$HARNESS_CLI_VERSION" doctor --cwd "$MAIN_REPO" --job-surfaces="$HARNESS_GITHUB_DEFAULT_BRANCH@$HARNESS_GITHUB_DEFAULT_COMMIT"`, run from a fresh `mktemp -d` directory, never from the checkout. The `@<commit>` is the default branch's commit `harness-run.yml` recorded before any session ran, so neither the trusted configuration nor the base is read from a ref the session could move |
| job mode: the `npx` that runs that check | (c) if run from the checkout | a project `.npmrc` (`registry=` to a host serving any code under the pinned version, `node-options=--require …`) and a `node_modules/autonomous-sdlc-harness` at the pinned version, which `npx` prefers over a fetch. In job mode the session can write either **directly** in the checkout, with no commit, and neither is a job surface | run with its working directory a fresh `mktemp -d` directory holding no `package.json`, `.npmrc` or `node_modules`, naming the repository through the CLI's global `--cwd` |
| `footprint_grade`: `git -C "$root" rev-parse --show-toplevel` on registry roots | (b) reads only | none: registry roots are adopters' main checkouts, and `rev-parse` runs no hook or fsmonitor | unchanged; one comment line stating the class |
| `create-worktree.sh` / `--existing` calls | — | — | unchanged command lines; Task 5 hardened the script |

**Depends on:**

- **Task 1** (`cli/templates/scripts/lib/harness-run-lib.sh`). Its interfaces, as this file calls them:
  - `hr_run_copy_check_var <main> <copy>` → 0 trusted or 1 untrusted (`HR_RUN_REFUSAL`). It sets `HR_RUN_MAIN`, `HR_RUN_COPY_TOP`, `HR_RUN_COPY_GITDIR`, `HR_RUN_COPY_BRANCH` (empty on a detached or invalid HEAD) and `HR_RUN_COPY_TIP`.
  - `hr_run_main_git <args…>`: `git -C "$HR_RUN_MAIN"` with `-c core.hooksPath=/dev/null -c core.fsmonitor=false -c submodule.recurse=false`.
  - `hr_run_copy_clean` → 0 when the copy has no tracked change, else 1.
  - `hr_run_surface_check_var <tip> copy` → 0, or 1 with `HR_RUN_SURFACE_REFUSAL`.
  - `hr_run_fast_forward_var <ref>` → 0, 1 (`HR_RUN_FF_REFUSAL`) or 5.
  - `hr_run_reset_var` → 0, 1 refused (`HR_RUN_RESET_REFUSAL`) or 3 when `read-tree` failed.
  - `hr_run_path_safe <top> <rel>` → 0 or 1.
  - `hr_place_artifact <worktree> <src> <rel>` → 0, or 1, which now includes an unsafe path.
  - `hr_commit_placed <main> <worktree> <rel> <subject>` → 0, 3 identical, 2 protected, or 1.
  - `hr_push_landed <push_wrapper> <worktree> <branch>` → 0, 1, or 2 with `HR_PUSH_REMOTE_TIP`; its signature is unchanged.
  - `hr_remote_url_configured <main> <remote>`.
- **Task 4:** the option `doctor --job-surfaces=<branch>[@<commit>]` exits 0 when the branch's own commits changed no job surface and non-zero otherwise. With `@<commit>` (40 or 64 hex characters after the value's last `@`), it reads the trusted `harness.config.json` from `<commit>:harness.config.json` and takes the base as `merge-base(HEAD, <commit>)`, reading no `refs/remotes/origin/*` ref; `<branch>` only labels its messages. The repository it checks is the CLI's resolved root. `--cwd <path>` is the CLI's existing **global** option (`cli/src/cli.ts` → `GLOBAL_OPTIONS`, `{ key: 'cwd', aliases: ['--cwd'] }`), which `parseArgv` consumes before `doctor` parses its own options, so Task 4's refusal of `--job-surfaces=` beside another `doctor` option never sees it. Commands never read `process.cwd()` themselves (`cli/src/commands/registry.ts`), and `cli/src/core/git.ts` → `runGit` passes the root as the child's `cwd`, so the check reads the checkout's refs whatever directory `npx` runs in.
- **Task 5:** `create-worktree.sh --existing` now refuses, with exit 2 and nothing left behind, a branch whose tip changes a protected path, and bootstraps from the main checkout's script and configuration.

**Where this task stops.** `harness-run.yml`'s job-level `HARNESS_GITHUB_DEFAULT_BRANCH` env, and the `HARNESS_GITHUB_DEFAULT_COMMIT` its `Record the default branch's commit` step writes to `$GITHUB_ENV` from the fresh checkout before any session, are **Task 9's**. This task reads both and fails closed when either is absent. The trusted base the local surface checks use is Task 1's `hr_run_trusted_base_var`, called inside `hr_run_surface_check_var` and `hr_run_reset_var`; this task adds no base logic of its own. The payload tests are **Tasks 11 and 12's**. Nothing here touches `spawn_engine`, which `fix_run_job_credential_exposure` also edits.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh`

**Work:**

- [ ] **Placement and the state directory.**
  - At startup, after `MAIN_REPO`, compute `RUN_MAIN` with `hr_wrapper_main_of "$SCRIPT_DIR"`. It stays empty when that fails or disagrees with `MAIN_REPO` canonically. **Never fatal**: each hardened site below refuses on an empty `RUN_MAIN` with the reason *cannot place the watcher in a main checkout*.
  - Change `run_state_dir`: take the **main** checkout's `stateDir`. When the copy's own configuration resolves to a different one, return 1, the closed "unresolvable" outcome every caller already has. A copy whose configuration cannot be read still takes the main checkout's, as today.
  - The review path places its file through `hr_place_artifact` instead of its bare `mkdir -p` and `cp`, keeping the identical-content and different-content checks before it.
  - The watchdog writes `PAUSE_PROGRESS.md` only when `hr_run_path_safe "$worktree" "$state_rel/PAUSE_PROGRESS.md"` passes. Otherwise it gives up with `why="…the state directory in $worktree is not safe to write"`.
- [ ] **The review path, reused copy.**
  - Replace `hr_current_branch` and the `status --short` test with `hr_run_copy_check_var "$RUN_MAIN" "$worktree"`. An untrusted copy fails with `reuse_fail="the working copy $worktree is not one this repository lists ($HR_RUN_REFUSAL)…"`.
  - Then run today's branch comparison against `HR_RUN_COPY_BRANCH`, with today's message.
  - Then `hr_run_copy_clean`, with today's *uncommitted tracked changes* message.
  - After reuse or recreation, and after the remote arm's fast-forward below, run `hr_run_surface_check_var "refs/heads/$branch" copy`. Refuse through `fail_before_launch` with a reason naming the paths and saying the branch carries changes to files that run outside the sandbox.
- [ ] **The remote arm and every artifact commit.**
  - Replace the bare fetch with:
    1. `hr_remote_url_configured "$HR_RUN_MAIN" origin`;
    2. `hr_run_main_git fetch --no-recurse-submodules origin "+refs/heads/$branch:refs/remotes/origin/$branch"`.

    Replace the bare merge with `hr_run_fast_forward_var "refs/remotes/origin/$branch"`, where 1 and 5 both fail through `fail_before_launch`. Keep the log and notify wording's subject, naming the step that failed.
  - `remote_commit_and_push` and the task and docs local arms call `hr_commit_placed "$RUN_MAIN" "$worktree" "$rel" "$subject"`. The rc mapping is unchanged:
    - 3: identical re-drop, skipped.
    - 0: committed.
    - anything else: the remote arm blocks, and the local arms log the warning and launch anyway.

    The log text names the watcher's commit instead of `commit-on-branch.sh`.
  - Delete `COMMIT_ON_BRANCH`, and fix the comment block above `CREATE_WORKTREE` that argued for routing the commit through the wrapper.
- [ ] **The stall watchdog**, after its three existing give-up conditions:
  1. `hr_run_copy_check_var "$RUN_MAIN" "$worktree"`. Refused → give up, with `why` naming `HR_RUN_REFUSAL`.
  2. In job mode only, the job-surfaces check, **run from outside the checkout**:
     - `scratch=$(mktemp -d)`; a failure → give up.
     - `( cd "$scratch" && npx --yes "autonomous-sdlc-harness@$HARNESS_CLI_VERSION" doctor --cwd "$MAIN_REPO" --job-surfaces="$HARNESS_GITHUB_DEFAULT_BRANCH@$HARNESS_GITHUB_DEFAULT_COMMIT" )`, then `rm -rf "$scratch"` whatever its exit.
     - A non-zero exit, or `HARNESS_CLI_VERSION`, `HARNESS_GITHUB_DEFAULT_BRANCH`, `HARNESS_GITHUB_DEFAULT_COMMIT` or `MAIN_REPO` empty, → give up.

     **Why the `@<commit>`.** In job mode the session has just been writing `$MAIN_REPO`'s `.git/refs` and `packed-refs`, so `refs/remotes/origin/<default>` there could point at the session's own tip, which would make the merge base the tip and the check pass. The commit id came from the fresh checkout before any session and sits in this process's environment, which the session cannot change. Say this in the same comment.

     **Why not from `$MAIN_REPO`.** In job mode that is the checkout the sandboxed session has just been writing. npm reads a project `.npmrc` from the nearest directory above its working directory that holds a `package.json` (the plan review observed `registry=` taking effect that way on npm 10.9.8), and `npx` runs a local `node_modules` package that satisfies the spec instead of fetching it. Either would run code the session chose in the unsandboxed watcher, and the session can bring on a stall at will. A fresh temporary directory has neither, and `--cwd` still names the checkout. Say this in a two-line comment above the call.
  3. `hr_run_reset_var`. Its surface check takes its base from origin through `hr_run_trusted_base_var`, so an unreachable origin is also a refusal. 1 → give up with `why` naming `HR_RUN_RESET_REFUSAL`. 3 → today's "reset failed … resuming anyway" log line. 0 → proceed.

  Giving up is today's path: `registry_set status failed`, `notify failed`, clear `stall_killing`, `continue`. The `PAUSE_PROGRESS.md` text still says `git reset --hard HEAD`. Reword it to "reset to the last commit", because the engine reads it.
- [ ] **The header.**
  - Update `JOB MODE`'s watchdog bullet, `REMOTE DISPATCH`'s fast-forward and commit sentences, and the watchdog paragraph so each states the pins, the surface refusal and the no-hook commit.
  - Add one paragraph, *THE WATCHER'S GIT IN A RUN'S COPY*, carrying the table above in prose, class by class, and pointing at `lib/harness-run-lib.sh` → the section *The watcher family's git in a run's copy*.
  - Add the REPRO rows for:
    - a refused reuse, on a copy whose branch committed `.mcp.json` through plumbing;
    - a refused watchdog reset;
    - a remote-arm fast-forward refused on a payload tip.

**Verification:**

- `bash -n cli/templates/scripts/autonomous-watcher.sh` exits 0.
- `git grep -nE 'git -C "\$worktree"' -- cli/templates/scripts/autonomous-watcher.sh` finds no hit.
- `git grep -n 'COMMIT_ON_BRANCH' -- cli/templates/scripts/autonomous-watcher.sh` finds none.
- `git grep -n 'npx' -- cli/templates/scripts/autonomous-watcher.sh` shows the one job-surfaces call, inside the `cd "$scratch"` subshell, carrying `--cwd "$MAIN_REPO"` and `@$HARNESS_GITHUB_DEFAULT_COMMIT`.
- `git grep -nE 'refs/remotes/origin/\$\{?(default|DEFAULT)' -- cli/templates/scripts/autonomous-watcher.sh` finds no hit: the watcher names no local ref of the default branch as a base.
- The new REPRO rows, run by hand against a throwaway fixture with one `tick`, give the outcomes they state. An honest identical re-drop of a task prompt still logs *already committed (identical re-drop)* and makes no commit.
