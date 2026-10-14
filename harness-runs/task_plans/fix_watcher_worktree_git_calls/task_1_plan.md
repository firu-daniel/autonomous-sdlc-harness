### Task 1 — The run library's hardened git primitives for the watcher family

**Goal:** Give `cli/templates/scripts/lib/harness-run-lib.sh` the primitives every watcher-family script needs to run git in a run's working copy without reading anything the run planted. These are the `GIT_*` drop, the copy check, the two pinned git runners, the trusted base, the protected-surface check, a plumbing fast-forward and reset, a symlink-safe placement, a plumbing commit and a main-side landed test. Each is built from the helpers that already ship: `hr_wrapper_target_check_var`, `hr_wrapper_branch_var`, `hr_remote_url_configured`, `hr_branch_is_protected`, `hr_default_branch`, `hr_githooks_dir`, `hr_scripts_dir`, `hr_phase_enabled`, `hr_docs_retrieval_applies`.

**Where this task stops.** This task owns the library file alone and calls nothing new from any script.

- **Task 2** moves `push-branch.sh` and `refresh-branch.sh` onto `hr_git_env_drop`.
- **Task 5** uses `hr_run_main_set_var`, `hr_run_copy_check_var`, `hr_run_copy_git`, `hr_run_trusted_base_var` and `hr_run_surface_check_var` from `create-worktree.sh`, the last two in default mode too.
- **Task 6** rewires the watcher, **Task 7** `remote-run.sh` and **Task 8** `cleanup-merged-worktrees.sh`.
- **Task 3** owns the TypeScript set that `hr_run_protected_rel_paths` mirrors.
- **Task 10** owns this library's own test cases.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh`

**The contract this task defines.** Tasks 2 and 5–8 and 10–13 restate it verbatim and rely on it. Every function prints nothing unless stated. Every function suffixed `_var` sets globals and must be called directly, never inside `$(…)`.

| Function | Contract |
|---|---|
| `hr_git_env_drop` | Unsets each of `GIT_DIR GIT_COMMON_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_OBJECT_DIRECTORY GIT_ALTERNATE_OBJECT_DIRECTORIES GIT_NAMESPACE GIT_CEILING_DIRECTORIES GIT_TEMPLATE_DIR GIT_CONFIG_PARAMETERS GIT_CONFIG_COUNT GIT_CONFIG_GLOBAL GIT_CONFIG_SYSTEM GIT_EXEC_PATH` and every name `${!GIT_TRACE*}` lists. Keeps `GIT_SSH_COMMAND`. Its loop variable is `local`, so it leaves no variable of its own set. Returns 0. |
| `hr_run_main_set_var <main>` | Sets `HR_RUN_MAIN` to `<main>` canonical, and clears `HR_RUN_TRUSTED_BASE`, so a base established for another checkout or an earlier operation is never reused. Returns 0 only when `<main>/.git` is a real directory, not a symlink, holding no `commondir`: the directory arm of `hr_wrapper_main_of`. Otherwise returns 1 with `HR_RUN_REFUSAL` set to one sentence. |
| `hr_run_copy_check_var <main> <copy>` | Calls `hr_run_main_set_var <main>`, then `hr_checkout_top_nogit <copy>`, then `hr_wrapper_target_check_var`, then `hr_wrapper_branch_var`. Sets `HR_RUN_MAIN`, `HR_RUN_COPY_TOP` (canonical), `HR_RUN_COPY_GITDIR` (`HR_TARGET_GITDIR`), `HR_RUN_COPY_BRANCH` (empty on a detached, unreadable or invalid HEAD, or one starting with `-`) and `HR_RUN_COPY_TIP`. The tip is the copy's HEAD commit read from the main repository, as `HEAD^{commit}` for the main checkout and `worktrees/<name>/HEAD^{commit}` for a worktree, and is empty when unborn. Returns 0 trusted, 1 untrusted with `HR_RUN_REFUSAL`. **It does not call `hr_worktree_config_check_var`**: no runner below lets git read the record's `config.worktree`. |
| `hr_run_main_git <args…>` | `git -C "$HR_RUN_MAIN" -c core.hooksPath=/dev/null -c core.fsmonitor=false -c submodule.recurse=false <args…>` |
| `hr_run_copy_git <args…>` | `GIT_DIR="$HR_RUN_MAIN/.git" GIT_INDEX_FILE="$HR_RUN_COPY_GITDIR/index" GIT_WORK_TREE="$HR_RUN_COPY_TOP" git -C "$HR_RUN_COPY_TOP" -c core.hooksPath=/dev/null -c core.fsmonitor=false -c submodule.recurse=false <args…>` |
| `hr_run_copy_clean` | 0 when `hr_run_copy_git diff --quiet --no-ext-diff --ignore-submodules` and `hr_run_copy_git diff-index --cached --quiet --ignore-submodules "$HR_RUN_COPY_TIP" --` both pass. 1 otherwise, including an empty tip. |
| `hr_run_protected_rel_paths <main>` | Prints the worktree-relative protected set, one path per line, from **`<main>/harness.config.json`** alone: `<githooksDir>`, `.mcp.json`, `.claude/settings.json` and `.claude/settings.local.json`. Where docs retrieval applies, it adds `<scriptsDir>/docs-search-server.sh` and `<scriptsDir>/lib`. The order and spelling match `copySurfacePaths` in `cli/src/generators/writeProtection.ts` (Task 3), and this function is that function's declared shell mirror. Returns 1 when the configuration cannot be read. |
| `hr_run_trusted_base_var` | Uses `HR_RUN_MAIN`. Sets `HR_RUN_TRUSTED_BASE` to the default branch's commit **as origin reports it now**, never as any local ref states it. In this order: `defaultBranch` from `<main>/harness.config.json`; `hr_remote_url_configured "$HR_RUN_MAIN" origin`; `hr_run_main_git ls-remote --exit-code origin "refs/heads/<defaultBranch>"`, taking the object id of the one output line whose ref field is exactly `refs/heads/<defaultBranch>` and requiring 40 or 64 lower-case hex characters; `hr_run_main_git fetch --quiet --no-recurse-submodules origin "refs/heads/<defaultBranch>"` with **no destination**, so it writes objects and `FETCH_HEAD` and moves no ref; then `hr_run_main_git cat-file -e "<oid>^{commit}"`. It reads none of `refs/remotes/origin/<defaultBranch>`, `refs/heads/<defaultBranch>` or `FETCH_HEAD`: each is in the common directory's `refs/` / `packed-refs` / root, which a sandboxed session can write. Any step failing returns 1 with `HR_RUN_REFUSAL` naming it (*cannot establish the default branch's commit from origin: …*), and nothing falls back to a local ref. Returns 0 at once, with no network call, when `HR_RUN_TRUSTED_BASE` is already set. |
| `hr_run_surface_check_var <tip> <mode>` | Uses the `HR_RUN_*` globals. **Base:** `merge-base <tip> "$HR_RUN_TRUSTED_BASE"`, after `hr_run_trusted_base_var` (so at most one `ls-remote` and one fetch per `hr_run_main_set_var` / `hr_run_copy_check_var`). It never names `refs/remotes/origin/<defaultBranch>` or `refs/heads/<defaultBranch>`. No trusted base, or no merge base, is a refusal, never a fallback, with `HR_RUN_SURFACE_REFUSAL` carrying `HR_RUN_REFUSAL`'s sentence or naming the missing merge base. **`tree`:** `hr_run_main_git diff --quiet --no-ext-diff --no-textconv <base> <tip> -- <set>`. **`copy`:** `tree`, plus `hr_run_copy_git diff --quiet --no-ext-diff --no-textconv --ignore-submodules <tip> -- <set>`, plus no output from `hr_run_copy_git ls-files --others -- <set>` (ignored files included). **`reset`:** `tree` plus that untracked test. Returns 0 or 1. On 1 it sets `HR_RUN_SURFACE_REFUSAL` naming each differing path (`--name-only`) and the base, never a file's contents. |
| `hr_run_fast_forward_var <ref>` | Moves `refs/heads/$HR_RUN_COPY_BRANCH` and the copy's index and tree from `HR_RUN_COPY_TIP` to `<ref>`'s commit. Returns 0 when moved, or when already there with nothing written; on 0 it sets `HR_RUN_COPY_TIP` to the new commit. Returns 1 when refused or failed with nothing changed, with `HR_RUN_FF_REFUSAL` set. Returns 5 when the branch moved, the tree refused and the put-back also failed: `refresh-branch.sh`'s exit 5. |
| `hr_run_reset_var` | The watchdog's reset of `HR_RUN_COPY_TIP`. Returns 0 when reset, 1 when refused with nothing written (`HR_RUN_RESET_REFUSAL`, from the `reset` surface check), and 3 when `read-tree` failed after the check passed. |
| `hr_run_path_safe <top> <rel>` | 0 when no existing component of `<top>/<rel>` strictly below `<top>` is a symlink, and the leaf is absent or a regular file. 1 otherwise. Git-free. |
| `hr_place_artifact <worktree> <src_file> <rel>` | Signature unchanged. Also returns 1, copying nothing, when `hr_run_path_safe <worktree> <rel>` fails, both before its `mkdir -p` and again after it. |
| `hr_commit_placed <main> <worktree> <rel> <subject>` | **New signature**: the first argument was the commit wrapper's path. Returns 0 committed (the line `committed <short sha> on <branch>` to stdout), 3 when the placed blob equals `<tip>:<rel>` and nothing is committed, 2 on a protected-branch refusal from `<main>`'s configuration, and 1 on anything else: an untrusted copy, a detached HEAD, an unsafe path, an unresolvable configuration or a git failure. |
| `hr_push_landed <push_wrapper> <worktree> <branch>` | Signature and exit map (0 / 1 / 2 with `HR_PUSH_REMOTE_TIP`) unchanged. The main checkout is now `hr_wrapper_main_of "$(dirname <push_wrapper>)"`, and every read is `refs/heads/<branch>` against it, never the worktree's `HEAD`. |

**Work:**

- [ ] **The `GIT_*` drop, the copy check and the two runners.**
  - Add `hr_git_env_drop` in a new section placed before the one titled *Git-free resolution and the per-working-copy configuration*, exactly as the table states. Its comment says it is the one statement of the list `push-branch.sh` and `refresh-branch.sh` used to carry inline, and that it must be called before a caller's first git call. The names, the `${!GIT_TRACE*}` loop and the kept `GIT_SSH_COMMAND` are byte-identical to the `unset GIT_DIR GIT_COMMON_DIR GIT_WORK_TREE …` line in `push-branch.sh`.
  - Add `hr_run_main_set_var`, `hr_run_copy_check_var`, `hr_run_main_git`, `hr_run_copy_git` and `hr_run_copy_clean` in a new section headed *The watcher family's git in a run's copy*. That section's header paragraph states the three rules:
    - No hook runs, because `core.hooksPath=/dev/null` holds none.
    - The record is read once by the checks and never again. Only `<record>/index` is borrowed, so git never reads the `.git` pointer, the record's `commondir`, its `HEAD` or its `config.worktree`.
    - Every call names `refs/heads/<branch>`, never `HEAD`, because `HEAD` under `GIT_DIR=<main>/.git` is the main checkout's.

    It also states why `hr_worktree_config_check_var` is skipped here and kept in the wrappers.
- [ ] **The protected set, the trusted base and the check.** Add `hr_run_protected_rel_paths`, `hr_run_trusted_base_var` and `hr_run_surface_check_var` as tabled. Comment `hr_run_trusted_base_var` with **why the base is origin's answer and not a ref**: a sandboxed session can write the common directory's `refs/` and `packed-refs`, so a run that points `refs/remotes/origin/<defaultBranch>` at its own tip makes `merge-base(tip, base)` the tip and every diff empty. `ls-remote`'s answer is held in a shell variable no session can reach, and `cat-file -e` proves the fetch brought that object. A run that cannot reach origin is refused: an unattended run needs the network for its model API in any case. Read retrieval with the library's existing reader. Take each value through the library's configuration readers at `<main>`, never at the copy. Join pathspecs as separate arguments, never a string.
- [ ] **The plumbing fast-forward and reset.**
  - `hr_run_fast_forward_var <ref>`, in this order:
    1. Refuse an empty branch or tip.
    2. Resolve `<ref>^{commit}` once.
    3. Return 0 when it equals the tip.
    4. Refuse unless the tip is an ancestor (`merge-base --is-ancestor`): the `merge --ff-only` refusal.
    5. Refuse unless `hr_run_copy_clean`.
    6. Refuse unless `hr_run_surface_check_var <new> tree`.
    7. `hr_run_copy_git read-tree -n --no-recurse-submodules -m -u <tip> <new>`.
    8. `hr_run_main_git update-ref -m "<what>" refs/heads/<branch> <new> <tip>`, a compare-and-swap.
    9. The real `read-tree`.
    10. On its failure, put the branch back with a second guarded `update-ref` (1), or return 5 when that fails too. This is `refresh-branch.sh`'s sequence with no merge commit.
  - `hr_run_reset_var`, in this order:
    1. Refuse an empty tip.
    2. Refuse unless `hr_run_surface_check_var "$HR_RUN_COPY_TIP" reset`, which includes an unreachable origin: the trusted base is part of the check.
    3. `hr_run_copy_git read-tree --reset -u --no-recurse-submodules "$HR_RUN_COPY_TIP"`. It moves no ref, so no ref hook and no `ORIG_HEAD`.
    4. Return 3 on that call's failure.
- [ ] **Placement, the commit and the landed test.**
  - Add `hr_run_path_safe`, and the refusal in `hr_place_artifact`.
  - Rewrite `hr_commit_placed` to the new signature, in this order:
    1. `hr_run_copy_check_var`, with a refusal or an empty branch returning 1.
    2. `hr_branch_is_protected <main> <branch>`: 0 returns 2, and 2 returns 1, with commit-on-branch.sh's refusal sentences.
    3. `hr_run_path_safe`.
    4. Take the blob from `hr_run_main_git hash-object -w --no-filters -- <top>/<rel>`. `--no-filters`, so no filter driver a run-written `.gitattributes` selects ever runs. Comment the cost: a CRLF artifact under an eol-normalising attribute is stored as-is.
    5. Return 3 when the blob equals `<tip>:<rel>`.
    6. Build a temporary index made with `mktemp` and removed on every exit path: `read-tree <tip>`, then `update-index --add --cacheinfo 100644,<blob>,<rel>`, then `write-tree`. The commit therefore carries **only** `<rel>` over the tip, never anything else the run staged.
    7. `commit-tree -p <tip> -m <subject>`.
    8. Guarded `update-ref`.
    9. `hr_run_copy_git update-index --add --cacheinfo 100644,<blob>,<rel>`, so the copy reads clean.
  - Rewrite `hr_push_landed`'s reads to the main checkout as tabled. Its fetch becomes `git -C <main> -c core.hooksPath=/dev/null -c submodule.recurse=false fetch --quiet --no-recurse-submodules origin "+refs/heads/<branch>:refs/remotes/origin/<branch>"`, only after `hr_remote_url_configured <main> origin`, which returns 1 when it fails.
  - Update the header comment of the section that holds these, *THE ARTIFACT PLACEMENT*, to the new contract.
- [ ] **The library's file header, amended in the same edit** (`.claude/context/cli.md` → `## What "done" means here` → *A reviewer holds a change to its module's own header*). Every rule the header states that the work above breaks is restated:
  1. **`THE WRITE EXCEPTIONS TO "WRITES NOTHING", AND THEIR FENCES.`** gains entry 5 for the section *The watcher family's git in a run's copy*. Its writers are `hr_run_fast_forward_var`, `hr_run_reset_var` and `hr_run_trusted_base_var`, whose fetch writes objects and `FETCH_HEAD` in the main repository and moves no ref. Fence: `refs/heads/<branch>`, moved only by a compare-and-swap `update-ref` against the tip read by `hr_run_copy_check_var`, plus the copy's index (`<record>/index`) and working tree. The entry also states that `hr_run_main_git` and `hr_run_copy_git` are general-purpose runners that write only what their caller's arguments ask, so a caller that drives a writing git command through them (Task 5's `worktree add`, `read-tree` and cleanup `worktree remove`) owns that write.
  2. **Entry 4's fence** (*THE ARTIFACT PLACEMENT*) is rewritten for the new `hr_commit_placed` and `hr_push_landed`. Delete *"plus whatever the two caller-named wrappers do"*: no commit wrapper is named any more. The fence now lists the objects `hash-object -w` and `commit-tree` write to the main repository, a `mktemp` temporary index removed on every exit path, `refs/heads/<branch>` by compare-and-swap, and the copy's index entry for `<rel>`. `hr_push_landed`'s fetch now force-writes `refs/remotes/origin/<branch>` in the **main** checkout, not in `<worktree>`.
  3. **The read-only roster**, the paragraph opening *"A caller that calls no `hr_lane_*`, …"*, gains `hr_run_fast_forward_var`, `hr_run_reset_var`, `hr_run_trusted_base_var`, `hr_run_surface_check_var` (through it), `hr_run_main_git` and `hr_run_copy_git`.
  4. **`JURISDICTION`** is extended past *"the two wrappers the permission profile runs unsandboxed, `push-branch.sh` and `refresh-branch.sh`"*. The watcher family's callers (`autonomous-watcher.sh`, `create-worktree.sh --existing`, `remote-run.sh`, `cleanup-merged-worktrees.sh` and `setup-worktree.sh --target`) also pass the main checkout for every configured value and keep git off the target's records. `setup-worktree.sh --target <dir>` (Task 5) places its own checkout with `hr_wrapper_main_of`, checks `<dir>` with `hr_wrapper_target_check_var`, and reads every configured value (`appDir`, `qa.credentialsPath`, `githooksDir`, `commands.*`) from the main checkout. They skip `hr_worktree_config_check_var` because no runner lets git read the record's `config.worktree`. The paragraph points at the section *The watcher family's git in a run's copy* for the detail.
  5. **A new mirror block**, beside the two existing `MIRROR…` blocks: `MIRROR OF \`cli/src/generators/writeProtection.ts\` → \`copySurfacePaths\``. It names `hr_run_protected_rel_paths` as the mirror, and says a change to that set's order or spelling there is an edit here.
  6. **Two function comments are widened.** `hr_wrapper_main_of`'s *"for `push-branch.sh` and `refresh-branch.sh` only"* and `hr_wrapper_target_check_var`'s *"a checkout an unsandboxed wrapper may run git in"* both name the watcher-family callers of item 4 as well. Because the widening points at item 4's list, it covers `setup-worktree.sh --target` (Task 5's caller of both functions) with no further edit. Neither function's behaviour changes.

**Verification:**

- `bash -n cli/templates/scripts/lib/harness-run-lib.sh` exits 0. A grep of the file for `mapfile`, `declare -A` and `,,}` finds nothing.
- **By hand, against a throwaway fixture.** Build `git init` main, a bare origin, a `harness.config.json` with `defaultBranch`, `githooksDir` and `stateDir`, a linked worktree on a branch, and the library sourced in a `bash -c`. Then check each of these:
  - `hr_commit_placed` commits only `<rel>` even with another path staged in the worktree's index, and returns 3 on a second identical call.
  - A `githooks/pre-commit` committed on the branch that writes a marker never fires.
  - `hr_run_surface_check_var <tip> tree` returns 1 naming `.claude/settings.json` after a plumbing commit changed it, and 0 before.
  - **A forged base.** With that payload tip, point both `refs/remotes/origin/<defaultBranch>` and `refs/heads/<defaultBranch>` in the main repository at it (`update-ref`). `hr_run_surface_check_var <tip> tree` still returns 1 naming `.claude/settings.json`, because the base is the bare origin's commit. With the origin's URL pointed at a missing path, it returns 1 naming origin, not 0.
  - `hr_run_reset_var` discards an uncommitted tracked edit and leaves `refs/heads/<branch>` unchanged.
  - A `core.fsmonitor` in a nested repository's config never writes its marker under `hr_run_copy_clean`.
- `git grep -n 'git -C "\$worktree"' -- cli/templates/scripts/lib/harness-run-lib.sh` finds no hit inside `hr_commit_placed` or `hr_push_landed`.
- `sed -n '/^hr_run_trusted_base_var()/,/^}/p;/^hr_run_surface_check_var()/,/^}/p' cli/templates/scripts/lib/harness-run-lib.sh | grep -nE 'refs/remotes/|refs/heads/\$|FETCH_HEAD'` prints only the `ls-remote` / `fetch` argument `refs/heads/<defaultBranch>` lines: neither function reads a local ref of the default branch.
- **The file header matches the new contract.** `grep -nE 'hr_run_fast_forward_var|hr_run_reset_var|copySurfacePaths' cli/templates/scripts/lib/harness-run-lib.sh` hits the header's write-exception list, its read-only roster and the new mirror block, all above the first function definition. Within the header, `plus whatever the two caller-named wrappers do` no longer appears, and `JURISDICTION` names both `autonomous-watcher.sh` and `setup-worktree.sh`.

- **Deviations from plan:**
  - `hr_run_trusted_base_var`'s fetch carries `--refmap=`. Without it git's opportunistic remote-tracking update moves `refs/remotes/origin/<defaultBranch>` even with no destination, so the contract's "moves no ref" would be false. Fixture check *trusted base fetch moved no ref* passed: a forged `refs/remotes/origin/main` stayed where it was put.
  - `hr_run_main_git` and `hr_run_copy_git` return 1 without running git when the `HR_RUN_*` globals they need are empty. Otherwise an unset `HR_RUN_MAIN` would make the call `git -C ""`, which runs git in the caller's directory.
  - `hr_run_main_set_var` also clears `HR_RUN_COPY_TOP`, `HR_RUN_COPY_GITDIR`, `HR_RUN_COPY_BRANCH` and `HR_RUN_COPY_TIP`, so a copy checked against one main checkout is never reused after a switch to another. `hr_run_copy_check_var` sets them again.
  - `hr_run_surface_check_var` makes one `diff --name-only --exit-code --no-renames` call per side where the plan had `diff --quiet` followed by `--name-only`. The answer is the same. `--no-renames` makes a rename into the set name its new path as an addition.
  - `hr_run_path_safe` also refuses an absolute `<rel>`, a `..` segment and an existing intermediate component that is not a directory.
  - `hr_commit_placed` also refuses (1) when `<worktree>` is not the canonical top of its checkout, and when the tip is unborn. Its temporary index is `index` inside a `mktemp -d` directory, and `rm -rf` removes that directory on every path past its creation.
  - `hr_push_landed` places the main checkout before it runs the wrapper. When it cannot place it, the function returns 1 without pushing.
  - Beyond items 1–6, two more header paragraphs were amended. *FILE DISCIPLINE* now names git's and the push wrapper's stderr pass-through, `hr_commit_placed`'s refusal lines, and the stderr of the writing calls made by fast-forward and reset. *NAMING* lists the new `HR_RUN_*` globals and states the one reuse exception, `HR_RUN_TRUSTED_BASE`.
  - Verification bullet 1: the grep for `mapfile` / `,,}` hits one line, the header's existing *BASH 3.2 IS THE FLOOR* sentence, which names those constructs as forbidden. No code uses them.
  - The fixture checks ran through `bash scripts/scratch-run.sh harness-runs/scratch/task1_fixture.py` under `/bin/bash` 3.2.57 and git 2.50.1, with 28 of 28 passing.
