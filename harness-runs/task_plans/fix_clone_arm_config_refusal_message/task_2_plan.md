### Task 2 — Resolve the main checkout's configuration before the target check in `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh`, with a clone-target suite

**Goal:** All three unsandboxed git wrappers report a main-checkout configuration they cannot resolve with their own `cannot resolve '<main>/harness.config.json'` line, on every target: the main checkout, a linked worktree and a clone. They do this by loading that configuration right after `hr_wrapper_main_of` and before `hr_wrapper_target_check_var`.

**Depends on:** Task 1. Task 1 makes `hr_clone_target_check_var` (in `cli/templates/scripts/lib/harness-run-lib.sh`) refuse a failed `hr_state_path` with the sentence `… and the run registry that would record a clone of <main> cannot be located, because '<main>/harness.config.json' cannot be resolved`. It keeps `… and the run registry records no clone of <main> at that path` for a readable configuration with no matching record. Its return status is unchanged, `0` or `1`. This task does not touch the library. Once the wrappers load the configuration first, they no longer reach Task 1's sentence in the two cases below. Its registry sentence is still what a wrapper prints for a clone with no record.

**Why the hoist is safe.** `main_top` comes from `hr_wrapper_main_of "$script_dir"`, the script's own location, never from the argument. `hr_config_load "$main_top"` reads only `<main_top>/harness.config.json`, makes no git call and reads nothing of the target. So the rule "the target is settled before the first git call" still holds, as does each header's THE TARGET'S `harness.config.json` IS NOT TRUSTED EITHER. Call it **unsubstituted**, never inside `$(…)`, so the per-process cache is warmed in the wrapper's own shell. The clone arm's `$(hr_state_path …)` and the later `hr_pinned_hooks_path` / `hr_branch_is_protected` then reuse that cache.

### Targets

- `cli/templates/scripts/commit-on-branch.sh`
- `cli/templates/scripts/push-branch.sh`
- `cli/templates/scripts/refresh-branch.sh`
- `cli/test/wrapper-clone-config-refusal.test.mjs` (new)

**Work:**

- [ ] **`commit-on-branch.sh`.** Move the existing block `if ! hr_config_load "$main_top"; then … exit 1; fi` from after the `hr_worktree_config_check_var` check to directly after the `hr_wrapper_main_of` block and before `hr_wrapper_target_check_var`.
  - Keep both echo lines byte-identical: `cannot resolve '$main_top/harness.config.json' — refusing to commit` and its parenthesised causes line. They go to stderr, exit 1.
  - Leave the protected-branch `2)` arm as it is.
  - Rewrite the block's comment to say it now runs ahead of the target check, so a clone target gets this refusal rather than the clone arm's registry sentence. It also still runs ahead of the pin.
  - Amend any header sentence that states the old order.
- [ ] **`push-branch.sh`.** Insert, directly after the `hr_wrapper_main_of` block and before `hr_wrapper_target_check_var`: `if ! hr_config_load "$main_top"; then echo "push-branch.sh: cannot resolve '$main_top/harness.config.json' — refusing to push"; exit 0; fi`.
  - This is the literal the script's own protected `2)` arm already prints: one stdout line, exit 0, keeping the visible and non-fatal contract.
  - Leave `cfg_root="$main_top"` and the protected arm in place.
  - On the main checkout and worktree targets, this line now replaces the pin's `cannot resolve githooksDir from …` line in the two cases. Say so in the comment.
- [ ] **`refresh-branch.sh`.** Move the existing `cfg_root="$main_top"` assignment and its `if ! hr_config_load "$cfg_root"; then … exit 1; fi` block (both stderr lines byte-identical, `… — refusing to merge`) to directly after the `hr_wrapper_main_of` block and before `hr_wrapper_target_check_var`.
  - It moves ahead of the target check, the pin and the git-version check.
  - Leave the `hr_default_branch` read and everything after it where they are.
  - Update the comments that mention the old position.
- [ ] **`cli/test/wrapper-clone-config-refusal.test.mjs` (new).** Open with the rule it enforces: on a registered clone, the main checkout's three wrappers name an unresolvable configuration with the same `cannot resolve` line and exit status as on the main checkout, move no ref, and keep the registry sentence for a clone the readable registry does not record.
  - Build a file-local fixture under the system temp directory, as `cli/test/wrapper-clone-arm.test.mjs` → `fixture` does: a bare origin; a main checkout on `trunk` carrying `harness.config.json`, `githooks/`, the three wrappers and `lib/` copied from `cli/templates/scripts/`; `core.hooksPath githooks`; and the clone of `feat_c` made by `hr_clone_create_var`.
  - Define three unresolvable forms, covering the prompt's two causes. The first cause, an unreadable configuration, has two forms, because `hr_config_load` returns `2` for one and `1` ("not adopted") for the other, and the hoisted `if ! hr_config_load` must refuse on both:
    - **(i) truncated** (status `2`): the main `harness.config.json` truncated to `{"version":`;
    - **(ii) absent** (status `1`): the file removed.
    - The second cause, an old `jq`, is the third form: **(iii)** a `jq` stand-in first on `PATH` that answers `--version` with `jq-1.4` and exits 3 for any program (status `2`).
  - Cases:
    - **(a) `commit-on-branch.sh --repo <clone>`.** Under each of (i)–(iii), with an edited tracked file in the clone:
      - exit 1;
      - stderr matches `^commit-on-branch\.sh: cannot resolve '<main>/harness\.config\.json' — refusing to commit$` and the parenthesised causes line;
      - no `refusing to commit:` line;
      - `refs/heads/feat_c` is unchanged in both the main checkout and the clone, and the clone's `status --porcelain` is unchanged;
      - the same call with `--repo <main>` gives the same exit status and byte-identical stderr;
      - restoring the file, or dropping the shim, makes the clone call exit 0 with both refs moved together.
    - **(b) Registry line kept.** Readable configuration, the registry's `runs.feat_c` record removed:
      - exit 1;
      - stderr matches `refusing to commit: .*, and the run registry records no clone of .* at that path$`;
      - both refs unchanged.
    - **(c) `push-branch.sh <clone>`.** Under each of (i)–(iii), so the absent form's status `1` is driven through the push hoist too:
      - exit 0;
      - stdout has `^push-branch\.sh: cannot resolve '<main>/harness\.config\.json' — refusing to push$`;
      - origin's refs are byte-identical before and after;
      - the main-checkout target prints the same line.
    - **(d) `refresh-branch.sh` on the clone.** Called the way `wrapper-clone-arm.test.mjs` calls it. Under each of (i)–(iii), so the absent form's status `1` is driven through the refresh hoist too:
      - exit 1;
      - stderr has the `refusing to merge` cannot-resolve line and its causes line;
      - the clone's and the main checkout's `refs/heads/feat_c` are unchanged.
    - **(e) Scratch repository.** With the configuration readable, a scratch repository passed as `--repo` is still refused by the target check, exit 1, with its `HEAD` unchanged. This is the control that the hoist did not open the trust check.

**Verification:**

- `cli/test/wrapper-clone-config-refusal.test.mjs` passes, case by case as above.
- In each of the three wrappers, `hr_config_load "$main_top"` (or `"$cfg_root"`, set from `main_top`) is the first call after the `hr_wrapper_main_of` block. It appears once, unsubstituted, and no git call or target read precedes `hr_wrapper_target_check_var` that did not precede it before.
- The three wrappers' `cannot resolve` literals are byte-identical to the ones they carried before this task. Re-derive them with `git diff` on the three files: the only changes are to lines moved or added and to comments.
