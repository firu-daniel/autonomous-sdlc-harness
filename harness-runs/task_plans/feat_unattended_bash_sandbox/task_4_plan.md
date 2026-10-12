### Task 4 — Add the per-working-copy config refusal and the hooks pin to the run library, and apply both in `push-branch.sh`

**Goal:** Stop the unsandboxed `push-branch.sh` from trusting git configuration a sandboxed command could have written. Inside a linked worktree, `.git/worktrees/<name>/config.worktree` is writable from the sandbox, and its path differs per worktree, so no profile entry can name it. `setup-worktree.sh` writes exactly one key there, `core.hooksPath`. So, before its first git call, the wrapper refuses when that file holds anything but that key at that value. Every later git call then runs with `core.hooksPath` pinned to a directory the sandbox cannot write. The refusal keeps the wrapper's exit contract: `push-branch.sh` stays non-fatal and exits 0.

**Depends on:** none in this branch's order. Task 2 makes the main checkout's copy of this script a named `sandbox.excludedCommands` entry. Task 3 protects that copy, its `lib/` directory, the main checkout's hooks directory, `<main>/.git/hooks`, the main checkout's `harness.config.json`, and the main repository's `.git/config` and `.git/config.worktree`. This task is correct with or without them: the library functions and the wrapper change stand alone, and its suite drives them directly.

**Where this task stops.** `refresh-branch.sh` gets the same treatment in **Task 5**, which calls the library functions below unchanged. The watcher's **own** git calls in a worktree are not this task's: its staging and commit of a dropped review, and its `status`, `fetch` and `merge` there. They are residual 1 in the story's context, and the wrapper header states it. Validating the wrapper's **target** (the main checkout, or a worktree it lists) is **Task 24's**, which inserts its check ahead of this task's and calls `hr_checkout_top_nogit` below unchanged.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` — seven functions.
- `cli/templates/scripts/setup-worktree.sh` — compute its hooks value through the shared function.
- `cli/templates/scripts/push-branch.sh` — the check, the pin, and its header and `REPRO` block.
- `cli/test/push-branch-worktree-config.test.mjs` (new) — the accompanying suite.

**Library contract** (`harness-run-lib.sh`), consumed by Task 5 exactly as written. A sourced library sets no shell options (`.claude/context/conventions.md` → `## Shell assets`), and each function carries a doc comment in the file's style.

| Function | Prints / sets | Returns | Uses git? |
|---|---|---|---|
| `hr_checkout_top_nogit <dir>` | the nearest ancestor of `<dir>`, inclusive, holding a `.git` entry (file or directory) | 1 when none | no |
| `hr_gitdir_nogit <top>` | the gitdir of the checkout at `<top>`, canonical (`cd -P … && pwd -P` in a subshell). `<top>/.git` itself when it is a directory. When `<top>/.git` is a file whose first line is `gitdir: <p>`, `<p>` resolved against `<top>` when relative. | 1 otherwise | no |
| `hr_common_dir_nogit <top>` | the git common dir, canonical. Takes `hr_gitdir_nogit <top>`'s answer; prints `<gitdir>/commondir`'s content resolved against the gitdir when that file exists, else the gitdir itself. | 1 when `hr_gitdir_nogit` fails, or unless the result's basename is `.git` | no |
| `hr_worktree_config_file <top>` | the per-working-copy config path: `<gitdir>/config.worktree`, with `<gitdir>` from `hr_gitdir_nogit <top>` (for a directory `.git` that is `<top>/.git/config.worktree`). | 1 when `hr_gitdir_nogit` fails | no |
| `hr_worktree_hooks_path <top>` | `<top>/<hr_githooks_dir <top>>` — the value `setup-worktree.sh` writes | 1 when `hr_githooks_dir` fails | no (jq) |
| `hr_worktree_config_check_var <top>` | sets `HR_WT_CONFIG_REFUSAL` to `''` or to one sentence naming each offending key (names only, never values) or the wrong-value case | 0 when the file is absent, empty, or holds exactly one `core.hooksPath` equal to `hr_worktree_hooks_path <top>`; 1 otherwise, including a file `git` cannot parse | `git -C / config --file <f> --list` only, so the git process loads no repository's configuration; key names compared case-insensitively, as git compares section and variable names |
| `hr_pinned_hooks_path <top>` | sets `HR_PINNED_HOOKS_PATH` to the absolute hooks directory to pin, and `HR_PINNED_HOOKS_REFUSAL` to `''` or one refusal sentence; prints nothing. Called directly, never inside `$(…)`, so both variables survive (the `hr_worktree_config_check_var` pattern). `<common>` is `hr_common_dir_nogit <top>`'s answer (so it is named `.git`), and `<main>` is its parent. Read `core.hooksPath` from `<common>/config` with `git -C / config --file … --get`. An absolute value is taken as is; a relative one is joined to `<main>`; unset gives `<common>/hooks`. **The resolved directory is then accepted only when it equals one of exactly two directories Task 3 write-protects on both sides:** `<main>/<hr_githooks_dir <main>>` (read from the main checkout's `harness.config.json`, which Task 3 item 7 protects) or `<common>/hooks` (Task 3 item 3). Both sides are compared canonically (`cd -P … && pwd -P` in a subshell where the directory exists, else the lexical absolute path with `.`/`..` segments and a trailing slash removed). Any other directory — a foreign `core.hooksPath` such as `.husky`, which `init` deliberately leaves in place (`cli/src/generators/githooks.ts` → choice 1) — leaves `HR_PINNED_HOOKS_PATH` empty and sets `HR_PINNED_HOOKS_REFUSAL` to one sentence naming the resolved directory and the remedy (point `core.hooksPath` at `githooksDir`, or set `githooksDir` to that directory and re-run `init` so the profile protects it). | 1 on any failure, and on a directory outside the two | as the row above |

No function in the library parses a `.git` pointer file or a `commondir` file except `hr_gitdir_nogit` and `hr_common_dir_nogit`; every other function that needs a gitdir or a common dir calls them. Task 24's `hr_main_checkout_of` and `hr_wrapper_target_check_var` are built on these two rows as well. The two rows are git-free on purpose, beside the git-based `hr_main_repo` (which runs `git worktree list`): a git call here would load the very configuration the wrapper has not yet decided to trust.

**Work:**

- [ ] `harness-run-lib.sh`: add the seven functions above, in the table's order. Bash 3.2 floor: no associative arrays, no `${var,,}`; lower-case with `tr`.
- [ ] `setup-worktree.sh` step 4: replace `hooks_dir="$top/$hooks_rel"` with a call to `hr_worktree_hooks_path "$top"`. The value it writes must stay byte-identical, so the check and the writer cannot drift. Keep its `REPRO` row's expected value.
- [ ] `push-branch.sh`: right after the library is sourced and before `hr_repo_root` (its first git call):
  1. `top_nogit=$(hr_checkout_top_nogit "$repo_dir")`. None → the existing *"is not a git repository"* line, exit 0.
  2. `hr_worktree_config_check_var "$top_nogit"`. On 1, print `push-branch.sh: refusing to push: $HR_WT_CONFIG_REFUSAL` and exit 0.
  3. `hr_pinned_hooks_path "$top_nogit"`, called directly; then `pinned=$HR_PINNED_HOOKS_PATH`. On 1, print `push-branch.sh: refusing to push: ` followed by `$HR_PINNED_HOOKS_REFUSAL` when it is non-empty, else a line naming the step, then exit 0.
  4. Export `GIT_CONFIG_COUNT=1`, `GIT_CONFIG_KEY_0=core.hooksPath` and `GIT_CONFIG_VALUE_0="$pinned"`, so the library helpers' git calls that follow are pinned too.
  5. Add `-c core.hooksPath="$pinned"` to every `git` invocation spelled in the script body: the tracking `config --get`s, `rev-parse`, `ls-remote` and both `push_cmd` arrays.
- [ ] `push-branch.sh` header and `REPRO`:
  - a `THE PER-WORKING-COPY CONFIG IS NOT TRUSTED.` paragraph: why the file is checked, the allowlist of one key, why the pin names the main repository's configured hooks directory rather than the worktree's (the worktree's is sandbox-writable, and Linux skips a globbed `denyWrite`), why the pin accepts only `<main>/<githooksDir>` or `<main>/.git/hooks` (the two directories the profile write-protects on both sides, compared against the main checkout's own `harness.config.json`, which the profile also protects) and refuses a foreign `core.hooksPath`, that `GIT_CONFIG_COUNT` needs git 2.31 or newer and an older git ignores it (the explicit `-c` still pins every call the script spells), and residual 1 verbatim from the story's context. Do not state the `.git` pointer / `commondir` residual as open: Task 24 closes it, and adds its own paragraph above this one;
  - add the main-checkout invocation to `Usage` — `bash <main checkout>/<scripts_dir>/push-branch.sh <worktree>`, the form the profile runs unsandboxed;
  - add `REPRO` rows for the clean worktree, a foreign key, a wrong hooks value and the pin.
- [ ] `cli/test/push-branch-worktree-config.test.mjs`: open with the rule the suite enforces. Build the fixture under `os.tmpdir()` and tear it down in process: a bare origin; a main checkout carrying `harness.config.json`, `githooks/pre-push`, and `scripts/push-branch.sh` plus `scripts/lib/` copied from `cli/templates/scripts/`; `core.hooksPath=githooks` in its `.git/config`; and a linked worktree on a feature branch bootstrapped the way `setup-worktree.sh` step 4 does it (`extensions.worktreeConfig true`, then `config --worktree core.hooksPath <wt>/githooks`). Each `pre-push` appends its own name to a marker file. Drive the **main checkout's** copy with the worktree as its argument and assert:
  - (a) a clean worktree pushes: origin's branch equals the worktree's `HEAD`, and only the main checkout's hook marker exists, which proves the pin;
  - (b) `git -C <wt> config --worktree user.name x` → exit 0, a `refusing to push:` line naming `user.name` and not its value, and origin unchanged;
  - (c) `core.hooksPath` at another value → exit 0, refusal, origin unchanged;
  - (d) no `config.worktree` at all → pushes;
  - (e) the main checkout itself as the argument → pushes;
  - (f) a foreign `core.hooksPath` in the main `.git/config` (`.husky`, holding its own marker-writing `pre-push`) → exit 0, a `refusing to push:` line naming the resolved directory, origin unchanged, and no marker from either hooks directory;
  - (g) `core.hooksPath` unset in the main `.git/config`, with a marker-writing `pre-push` under `.git/hooks` → pushes, and only that marker exists.

**Verification:**

- `npm test --workspace cli -- test/push-branch-worktree-config.test.mjs` passes. `push-branch.sh` and `setup-worktree.sh` are copied into an adopter byte for byte, so the existing byte-identity suite covers the copy. It runs in the Run gates phase and is not run here.
- Case (a)'s marker assertion is the end-to-end proof that the pin redirects the hooks of an unsandboxed push. A pass on (b) alone proves nothing about the pin.
- Grep `push-branch.sh` for a `git` call after the check that carries no `-c core.hooksPath`, and find none.
- Grep `harness-run-lib.sh` for `commondir` and for `gitdir:`; every hit outside comments lies inside `hr_gitdir_nogit` or `hr_common_dir_nogit`.
