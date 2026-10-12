### Task 5 — Apply the refusal and the pin in `refresh-branch.sh`, and let it refresh a named checkout

**Goal:** Give `refresh-branch.sh` the same protection Task 4 gives `push-branch.sh`: refuse an untrusted per-working-copy git configuration before the first git call, and pin `core.hooksPath` on every later one. This script's refusal follows its own exit map, so it is **exit 1**: *"the script cannot proceed and changed nothing"*. Also give it an optional checkout argument. Today it always refreshes the checkout its own file sits in. The copy the profile runs unsandboxed is the **main checkout's** (Task 2), so without a target argument that copy could only ever refresh the main checkout.

**Depends on:** Task 4, which adds these functions to `cli/templates/scripts/lib/harness-run-lib.sh`. This task calls them unchanged:

- `hr_checkout_top_nogit <dir>` — prints the nearest ancestor of `<dir>`, inclusive, holding a `.git` entry; returns 1 when there is none. It uses no git.
- `hr_worktree_config_check_var <top>` — sets `HR_WT_CONFIG_REFUSAL`. Returns 0 when `<top>`'s per-working-copy config is absent, empty, or holds exactly `core.hooksPath` at `<top>/<githooksDir>`; returns 1 otherwise.
- `hr_pinned_hooks_path <top>` — called directly, never inside `$(…)`. Sets `HR_PINNED_HOOKS_PATH` to the main repository's configured hooks directory, made absolute, and `HR_PINNED_HOOKS_REFUSAL` to `''`. Returns 1 on failure, and also when that directory is neither `<main>/<githooksDir>` nor `<main>/.git/hooks` (the two Task 3 protects), with `HR_PINNED_HOOKS_REFUSAL` set to one sentence naming the directory and the remedy.

Task 4's pinning pattern is the template: export `GIT_CONFIG_COUNT=1`, `GIT_CONFIG_KEY_0=core.hooksPath` and `GIT_CONFIG_VALUE_0`, and add `-c core.hooksPath="$pinned"` to every git call the script spells.

**Where this task stops.** The target validation (refuse any `<repo-dir>` but the main checkout or a worktree it lists) is **Task 24's**, which inserts its check ahead of this task's. No plugin asset invokes `refresh-branch.sh` today; `plugin/docs/AUTONOMOUS_FLOW.md` only names it. So no corpus spelling changes here. `doctor`'s `base-freshness` remedy prints the bare `--local` form for a person to run, and it stays correct.

### Targets

- `cli/templates/scripts/refresh-branch.sh` — the argument, the check, the pin, and its header, usage and `REPRO` block.
- `cli/test/refresh-branch-worktree-config.test.mjs` (new) — the accompanying suite.

**Work:**

- [ ] Argument: accept one optional positional `<repo-dir>` after the flags: `refresh-branch.sh [--local] [<repo-dir>]`. With it, the checkout is the one holding `<repo-dir>`. Without it, it is this file's own location, unchanged. A second positional argument stays a usage error (exit 1). Update `Usage` and the argument-parsing `case`.
- [ ] Check and pin, before the first git call (the current `hr_repo_root "$script_dir"`):
  1. `top_nogit=$(hr_checkout_top_nogit "<target>")`. None → the existing not-a-repository line, exit 1.
  2. `hr_worktree_config_check_var "$top_nogit"`. On 1, print `refresh-branch.sh: refusing to refresh: $HR_WT_CONFIG_REFUSAL` to stderr and exit 1.
  3. `hr_pinned_hooks_path "$top_nogit"`, then `pinned=$HR_PINNED_HOOKS_PATH`. On 1, refuse with exit 1, printing `$HR_PINNED_HOOKS_REFUSAL` when it is non-empty, else naming the step.
  4. Export the `GIT_CONFIG_*` triple.
  5. Add `-c core.hooksPath="$pinned"` to every git call in the body: the fetch, the merges, `merge --abort`, the status checks and the rev-parses.

  The pin matters here, not only for a push: `git merge` runs the `pre-merge-commit`, `commit-msg` and `post-merge` hooks from `core.hooksPath`.
- [ ] Header: add the same `THE PER-WORKING-COPY CONFIG IS NOT TRUSTED.` paragraph as `push-branch.sh`. Point at it rather than restating the pin derivation: *"derivation: `lib/harness-run-lib.sh` → `hr_pinned_hooks_path`"*. Add the exit-map note that a refusal is exit 1. Add `REPRO` rows for the main-checkout copy refreshing a worktree, a foreign key, and the pin.
- [ ] `cli/test/refresh-branch-worktree-config.test.mjs`: open with the rule the suite enforces. Build the same shape of fixture as Task 4's suite, as its own file-local builder, since suites do not share fixture helpers here (`.claude/context/cli.md` → `## Not determined`). That shape is: a bare origin, a main checkout carrying the scripts and `core.hooksPath=githooks`, and a linked worktree on a feature branch bootstrapped like `setup-worktree.sh` step 4. Move the default branch on and publish it. Each hooks directory carries a `post-merge` hook that appends its own name to a marker file. Drive the **main checkout's** copy with the worktree as `<repo-dir>` and assert:
  - (a) exit 0; the worktree's branch now contains the base commit; the main checkout's `HEAD` and branch are unchanged; and only the main checkout's `post-merge` marker exists;
  - (b) a foreign key in the worktree's `config.worktree` → exit 1, a `refusing to refresh:` line naming the key, and `git -C <wt> rev-parse HEAD` unchanged;
  - (c) `--local` with `<repo-dir>` → exit 0 with no fetch. Point origin's URL at a non-existent path first, to prove nothing touched the network;
  - (d) no argument from the worktree's own copy still refreshes the worktree, as before.

**Verification:**

- `npm test --workspace cli -- test/refresh-branch-worktree-config.test.mjs` passes.
- Case (a) is the end-to-end proof that the excluded spelling Task 2 names, `bash <main checkout>/<scriptsDir>/refresh-branch.sh <worktree>`, refreshes the worktree and never the main checkout.
- Grep `refresh-branch.sh` for a `git` call after the check that carries no `-c core.hooksPath`, and find none.

**Deviations from plan:**

- Added a fifth suite case, (e): a second positional argument exits 1 with the new usage line, the worktree's HEAD unchanged — the plan states that behaviour but lists no case for it.
- The fixture leaves both `githooks/` directories untracked: overwriting a tracked hook in the worktree, as Task 4's fixture does, would dirty its tree and trip the wrapper's uncommitted-changes refusal (exit 1) before any merge.
- An argument beginning with `-` other than `--local` stays an unknown-argument usage error rather than being taken as `<repo-dir>`.
- Pin proof beyond the plan: a throwaway mutation (`harness-runs/scratch/t5_mutate.py`, run through `scripts/scratch-run.sh`) stripped every `-c core.hooksPath="$pinned"` and the `GIT_CONFIG_*` export; cases (a) and (d) failed, (b), (c), (e) passed; the script was restored and the suite re-run green.
- Verification: `commands.test` and the byte-identity suite (`cli/test/outer-loop-scripts.test.mjs`) are deferred to the Run gates phase. The repository's own self-adopted `scripts/refresh-branch.sh` copy is outside the `cli` layer and was not touched (Task 4 likewise left `scripts/push-branch.sh`).
