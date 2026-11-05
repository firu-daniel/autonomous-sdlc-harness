### Task 1 — Drop `actions/checkout`'s three inert sparse keys from `config.worktree` in `setup-worktree.sh`, through a new library function

**Goal:** Make `setup-worktree.sh` leave every `config.worktree` it makes live in a shape the wrappers' unchanged single-key rule accepts. It removes exactly `core.sparseCheckout`, `core.sparseCheckoutCone` and `index.sparse` when each sits there once at the literal value `false`, the shape `actions/checkout`'s `git sparse-checkout disable` leaves. It changes nothing else.

**Where this task stops.** This task does not edit `hr_worktree_config_check_var` or any wrapper. The rule *"only `core.hooksPath` may be set there"* and every refusal sentence stay byte-identical (task prompt, goal 4). It adds no test file: the fixture test that exercises it is **Task 2's**, which depends on this task and calls the function only through `setup-worktree.sh`. The self-adopted `scripts/` copies are **Task 7's**.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` — the new function, beside `hr_worktree_config_file` / `hr_worktree_config_check_var`.
- `cli/templates/scripts/setup-worktree.sh` — its step 4 calls it; its header and `REPRO` block describe it.

**Work:**

- [ ] **The library function, `hr_worktree_config_drop_inert_sparse_var <file>`.** Place it in `harness-run-lib.sh` directly after `hr_worktree_config_check_var`. Its contract, which Task 2 relies on exactly:
  - **When it does nothing.** It returns 0 and does nothing when `<file>` does not exist. It returns 1, with `HR_WT_SPARSE_REFUSAL` set to one sentence naming the file, when the file exists but is a symbolic link, is not a regular file, or is not readable. In that case nothing is written.
  - **What it removes.** For each of `core.sparseCheckout`, `core.sparseCheckoutCone` and `index.sparse`, it reads the key with `git -C / config --file "<file>" --get-all <key>` (`-C /`, so no repository's configuration is loaded, as `hr_worktree_config_check_var` reads). It removes the key with `git -C / config --file "<file>" --unset <key>` only when that read exits 0 and prints exactly one line, `false`.
  - **What it leaves.** A key that is absent, set more than once, value-less, or set to anything but `false` (`true` included) is left untouched.
  - **Its outputs.** It sets `HR_WT_SPARSE_DROPPED` to the comma-separated names it removed, and to empty when it removed none. It returns 1, with `HR_WT_SPARSE_REFUSAL` naming the key, when an `--unset` fails. It prints nothing.
  - **Shell constraints.** It sets no shell option, so the library rule holds. It uses Bash 3.2 forms only.
  - **Its header comment** cites:
    - the measured sequence: the task prompt's `## What was measured (2026-11-05, verbatim)`, `actions/checkout` v7.0.1's `git sparse-checkout disable` followed by `git config --local --unset-all extensions.worktreeConfig`;
    - why only these three keys at `false` count as inert: `false` is git's own default for each, and the other two are unread while `core.sparseCheckout` is not on;
    - that `hr_worktree_config_check_var` is deliberately unchanged, so any other shape is still refused.
- [ ] **The call sites in `setup-worktree.sh` step 4.** Call the function **before** `hooks_config_write`, and **outside** the `if [ -n "$hooks_dir" ] && [ -f "$hooks_dir/pre-push" ]` test. Placed there, a checkout with no hook file is cleaned too: the wrappers refuse the keys whether or not the extension is on. The files it is called on:
  - **No-argument mode:** `hr_worktree_config_file "$top"`. When `$main_repo` differs from `$top`, which happens when it is run by hand inside a linked worktree, also `hr_worktree_config_file "$main_repo"`. The switch the step turns on is repository-global, which makes the main checkout's file live too.
  - **`--target` worktree mode** (`target_kind` not `clone`): `"$target_gitdir/config.worktree"` and `hr_worktree_config_file "$main_repo"`, for the same reason.
  - **`--target` clone mode:** not called. A clone's `config.worktree` is already held to an empty, inert file by `hr_clone_target_check_var`, which ran before this point, and this mode writes only the clone's `.git/config`.
- [ ] **Reporting from `setup-worktree.sh`.** For each call that removed keys, print one line on stdout: `setup-worktree.sh: removed <names> (each false) from <file>, which actions/checkout's sparse-checkout disable leaves there`. A call that returns 1 prints `setup-worktree.sh: <HR_WT_SPARSE_REFUSAL> — leaving it` on stderr and sets `status=1`, as a failed hook write does. It does not skip the rest of the bootstrap.
- [ ] **The `setup-worktree.sh` header.** In `THE FIVE STEPS`, step 4 gains one sentence naming the drop and its limits. The `NOTE:` comment beside `hooks_config_write` gains one sentence: the extension also makes the sparse keys `actions/checkout` leaves live, so this step removes them first, and only at `false`. Add one `REPRO` row, **checkout's sparse keys**, after **ordinary**:
  - run `git -C "$d" sparse-checkout disable`, then `git -C "$d" config --local --unset-all extensions.worktreeConfig`, then re-run;
  - the expected result: exit 0, a `removed core.sparseCheckout, …` line, and `git -C / config --file "$d/.git/config.worktree" --list` printing only `core.hookspath=$d/githooks`.

**Verification:**

- Walk the new `REPRO` row by hand against a throwaway fixture under `$TMPDIR`, built as the header's `REPRO` block builds `$d`. Then plant `core.sparseCheckout true` in that fixture's `.git/config.worktree`, re-run, and see it left in place with no `removed` line.
- `git diff -- cli/templates/scripts/lib/harness-run-lib.sh` shows no change inside `hr_worktree_config_check_var`, `hr_worktree_config_file` or `hr_worktree_hooks_path`. The new function is the only added function.
- `grep -n 'remove the file, then re-run setup-worktree.sh' cli/templates/scripts/lib/harness-run-lib.sh` still prints the unchanged refusal sentence.
  - **Deviations from plan:** The REPRO walk was executed, not done by hand: the inline compound Bash form was refused by the tool layer, so the same steps ran as `harness-runs/scratch/task1_sparse_repro.py` through `bash scripts/scratch-run.sh`. That run covered the plan's cases plus a repeated `index.sparse false`, `core.sparseCheckoutCone no` and a symlinked `config.worktree`, and each matched the contract. Its fixture had no initial commit, the same as the header's `REPRO` block.
