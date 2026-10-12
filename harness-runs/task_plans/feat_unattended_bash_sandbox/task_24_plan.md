### Task 24 — Make both unsandboxed wrappers refuse any target but the main checkout or a worktree it lists

**Goal:** `sandbox.excludedCommands` names `Bash(bash <repoRoot>/<scriptsDir>/push-branch.sh:*)` and its `refresh-branch.sh` twin (Task 2), and `:*` accepts any argument. A sandboxed command could build a repository, for example under `<state_dir>/scratch/`, whose own `.git/config` sets `core.sshCommand`, a credential helper or similar. It could then pass that directory to the main checkout's copy, which would run that configuration unsandboxed, with the SSH key readable and the network open. A rewritten `.git` pointer or `commondir` reaches the same place by another route.

So before its first git call each wrapper refuses, under its own exit contract, unless the target is one of two things:

- **the main checkout itself**; or
- **a worktree the main repository lists**: the target's `.git` is a pointer file to `<main>/.git/worktrees/<name>`, that directory's `commondir` resolves to `<main>/.git`, and that directory's own `gitdir` file points back at `<target>/.git`. That last condition is how git itself records that it lists a worktree.

The main checkout is derived from the **script's own location**, never from the argument. This is the user's ruling, and it closes the former *"`.git` pointer / `commondir` not detected"* residual.

**Depends on:**

- Task 4, which adds to `cli/templates/scripts/lib/harness-run-lib.sh`:
  - `hr_checkout_top_nogit <dir>` — prints the nearest ancestor of `<dir>`, inclusive, holding a `.git` entry; returns 1 when there is none. No git.
  - `hr_gitdir_nogit <top>` — prints the canonical gitdir: `<top>/.git` itself when it is a directory; for a pointer file whose first line is `gitdir: <p>`, `<p>` resolved against `<top>`. Returns 1 otherwise. No git.
  - `hr_common_dir_nogit <top>` — prints the canonical git common dir: `<gitdir>/commondir` resolved against the gitdir when that file exists, else the gitdir. Returns 1 unless its basename is `.git`. No git.
  - `hr_worktree_config_check_var <top>` and `hr_pinned_hooks_path <top>`.

  Task 4 also inserts, in `push-branch.sh`, the sequence `top_nogit` → config check → pin → git.
- Task 5, which does the same in `refresh-branch.sh` and adds its optional `<repo-dir>` argument.

This task inserts its check **between** computing `top_nogit` and Task 4's config check, in both scripts.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` — two functions.
- `cli/templates/scripts/push-branch.sh` — the call and a header paragraph.
- `cli/templates/scripts/refresh-branch.sh` — the call and a header paragraph.
- `cli/test/wrapper-target-check.test.mjs` (new) — the accompanying suite.

**Library contract.** A sourced library sets no shell options (`.claude/context/conventions.md` → `## Shell assets`). Bash 3.2 floor. Canonicalize every directory with `cd -P … && pwd -P` in a subshell, so a symlink cannot alias one path as another.

| Function | Prints / sets | Returns | Uses git? |
|---|---|---|---|
| `hr_main_checkout_of <dir>` | the main checkout top of the checkout holding `<dir>`: the parent of `hr_common_dir_nogit "$(hr_checkout_top_nogit <dir>)"`, canonical. Its doc comment names `hr_main_repo` and says why this twin does not run git: `hr_main_repo` runs `git worktree list`, which would load configuration the wrapper has not yet decided to trust. | 1 when either call fails | no |
| `hr_wrapper_target_check_var <main_top> <target_top>` | sets `HR_TARGET_REFUSAL` to `''` or to one sentence naming the condition that failed (never a file's contents) | 0 when canonical `<target_top>` equals canonical `<main_top>`; or when **all** of these hold: `<target_top>/.git` is a regular file; `<p>=$(hr_gitdir_nogit <target_top>)` succeeds and `<p>`'s parent is canonical `<main_top>/.git/worktrees`; `<p>/commondir` exists and `hr_common_dir_nogit <target_top>` equals canonical `<main_top>/.git`; `<p>/gitdir` exists and its content, resolved, is canonical `<target_top>/.git`. 1 otherwise. The `<p>/gitdir` back-pointer is the only git record this function reads directly; nothing else in the library reads it. | no |

No function in the library parses a `.git` pointer file or a `commondir` file except Task 4's `hr_gitdir_nogit` and `hr_common_dir_nogit`; both functions above call them rather than re-deriving either, so the target check and Task 4's hooks pin decide which repository is the main one by one rule.

**Work:**

- [ ] `harness-run-lib.sh`: add the two functions above, each with a doc comment in the file's style. The one for `hr_wrapper_target_check_var` states:
  - why the target is untrusted: the excluded rule's `:*` takes any argument;
  - which of git's own records it reads;
  - what a worktree registered by a sandboxed command still gets past it. A sandboxed command can create a `<main>/.git/worktrees/<name>` that passes, because a linked worktree may write the main repository's `.git` except `hooks/` and `config`. That is harmless here: such a worktree's configuration is the main repository's `.git/config`, which the sandbox cannot write, plus its `config.worktree`, which Task 4's check holds to one key. Its hooks are pinned.
- [ ] `push-branch.sh`: right after `top_nogit` is computed:
  1. `main_top=$(hr_main_checkout_of "$script_dir")`, with `script_dir` resolved from `${BASH_SOURCE[0]}` as the script's own location. On failure, print `push-branch.sh: refusing to push: cannot place this script in a main checkout` and exit 0.
  2. `hr_wrapper_target_check_var "$main_top" "$top_nogit"`. On 1, print `push-branch.sh: refusing to push: $HR_TARGET_REFUSAL` and exit 0.
- [ ] `refresh-branch.sh`: the same two steps in the same place, with `refresh-branch.sh: refusing to refresh:` on stderr and exit 1. That is its *"cannot proceed and changed nothing"* code.
- [ ] Both headers: add a `THE TARGET IS NOT TRUSTED.` paragraph above Task 4's `THE PER-WORKING-COPY CONFIG IS NOT TRUSTED.` paragraph. Name the two accepted targets and point at the library for the conditions: *"conditions: `lib/harness-run-lib.sh` → `hr_wrapper_target_check_var`"*. State the exit code. Add `REPRO` rows for a scratch repository as the target, a rewritten pointer, a rewritten `commondir`, and the clean worktree.

  Remove any wording Task 4 left that calls the `.git` pointer / `commondir` case undetected. Keep residual 1 (the watcher's own git calls).
- [ ] `cli/test/wrapper-target-check.test.mjs`: open with the rule the suite enforces. Build, as its own file-local builder under `os.tmpdir()` and torn down in process:
  - a bare origin;
  - a main checkout carrying `harness.config.json`, `githooks/`, and `scripts/push-branch.sh`, `scripts/refresh-branch.sh` and `scripts/lib/` copied from `cli/templates/scripts/`;
  - a linked worktree bootstrapped like `setup-worktree.sh` step 4;
  - a separate scratch repository with the same origin, whose `.git/config` sets `core.sshCommand` to a script that writes a marker file.

  Drive the **main checkout's** copies and assert:
  - (a) scratch repository as `push-branch.sh`'s target → exit 0, a `refusing to push:` line, no marker, origin unchanged;
  - (b) the same as `refresh-branch.sh`'s `<repo-dir>` → exit 1, `refusing to refresh:`, no marker;
  - (c) the worktree's `.git` file rewritten to `gitdir: <scratch>/.git` → push refuses, exit 0;
  - (d) the worktree's `<main>/.git/worktrees/<name>/commondir` rewritten to the scratch repository's `.git` → push refuses;
  - (e) the clean worktree → pushes, and origin's branch equals its `HEAD`;
  - (f) the main checkout as the target → proceeds.

**Verification:**

- `npm test --workspace cli -- test/wrapper-target-check.test.mjs` passes. Then run `commands.typecheck` as written. Task 4's and Task 5's suites also drive these two scripts. This task neither creates nor edits them, so they run in the Run gates phase and not here; cases (e) and (f) cover the paths they exercise.
- Cases (a) and (e) together are the end-to-end proof: an attacker-built target never reaches git, and an ordinary worktree still pushes through the excluded spelling.
- Grep `harness-run-lib.sh` for `commondir` and for `gitdir:`; every hit outside comments lies inside `hr_gitdir_nogit` or `hr_common_dir_nogit`, apart from the `<p>/gitdir` back-pointer read in `hr_wrapper_target_check_var`.
- In each script, the line calling `hr_wrapper_target_check_var` precedes every `git` invocation. Check it with `grep -n -E 'hr_wrapper_target_check_var|(^|[^_])git ' <script>` and compare line numbers.
