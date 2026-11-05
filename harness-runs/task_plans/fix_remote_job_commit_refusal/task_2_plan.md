### Task 2 — Replay the checkout's two commands on a fixture and show `commit-on-branch.sh` and `push-branch.sh` accept the bootstrapped target

**Goal:** A fixture test that reproduces the round-13 sequence end to end. It runs `git sparse-checkout disable`, then `git config --local --unset-all extensions.worktreeConfig`, then the shipped `setup-worktree.sh`, then shows both wrappers accepting the target. It also proves the drop removes nothing beyond the three inert keys.

**Depends on:** Task 1. That task adds `hr_worktree_config_drop_inert_sparse_var` to `cli/templates/scripts/lib/harness-run-lib.sh` and calls it from `cli/templates/scripts/setup-worktree.sh` step 4 on these files:
- **No-argument mode:** the bootstrapped checkout's `config.worktree`, plus the main checkout's when the two differ.
- **`--target` worktree mode:** the target record's `config.worktree` and the main checkout's.

It removes each of `core.sparseCheckout`, `core.sparseCheckoutCone` and `index.sparse` only when the file holds it once at the literal `false`, and prints `setup-worktree.sh: removed <names> (each false) from <file>, …` when it removed any. This task exercises that only through `setup-worktree.sh` and the two wrappers, and edits neither script.

### Targets

- `cli/test/setup-worktree-checkout-sparse.test.mjs` (new).

**Work:**

- [ ] **The header and the fixture.** Open the file with the rule it enforces: *after `actions/checkout`'s two commands and the shipped `setup-worktree.sh`, both main-checkout wrappers accept the target; the bootstrap removes only the three sparse keys at `false`, and every other shape is still refused.* Build the fixture by hand, as `cli/test/push-branch-worktree-config.test.mjs` → `worktreeFixture` does:
  - under `os.tmpdir()`, through `mkdtemp` and `realpath`, torn down in `t.after`;
  - a bare origin, and a main checkout on a non-protected branch carrying `harness.config.json` (`githooksDir: "githooks"`, empty `commands`);
  - a `githooks/pre-push` that exits 0;
  - `scripts/` holding `setup-worktree.sh`, `commit-on-branch.sh`, `push-branch.sh` and `lib/`, copied from `PACKAGE_ROOT/templates/scripts`;
  - one seed commit, and `origin` added.

  Use `runGit` and `runBash` from `./helpers/fixture.mjs`.
- [ ] **(a) The measured sequence.**
  1. In the main checkout, run `git sparse-checkout disable`, then `git config --local --unset-all extensions.worktreeConfig`.
  2. **Assert the precondition:** `git -C / config --file <main>/.git/config.worktree --list` holds exactly the three keys, each `=false`. On failure, the message carries `git --version`.
  3. Run `bash <main>/scripts/setup-worktree.sh`, and assert exit 0 and the `removed` line.
  4. Assert `--list` on the same file now prints only `core.hookspath=<main>/githooks`.
  5. Write a new file and run `bash <main>/scripts/commit-on-branch.sh --repo <main> <file> -- "feat: Sparse replay"`. Assert exit 0 and that the branch tip moved to a commit whose only change is that file.
  6. Run `bash <main>/scripts/push-branch.sh <main>`, and assert `push-branch.sh: pushed <branch> to origin`, no `refusing to push:` line, and origin's branch equal to the local tip.
- [ ] **(b) The failure reproduces without the drop, and (c) the drop is not version-bound.**
  - **(b)** After the same two checkout commands, turn the extension on and set `core.hooksPath` by hand, as `setup-worktree.sh` did before Task 1: `git config extensions.worktreeConfig true` and `git config --worktree core.hooksPath <main>/githooks`. Assert that `commit-on-branch.sh` exits non-zero and `push-branch.sh` prints `refusing to push:`, each naming `core.sparsecheckout, core.sparsecheckoutcone, index.sparse`, and that origin is unchanged.
  - **(c)** With no `sparse-checkout` call, plant the three keys at `false` with `git -C / config --file <main>/.git/config.worktree <key> false`. Run `setup-worktree.sh`, then assert as in (a). This case does not depend on what the host's git writes.
- [ ] **(d) Nothing else is removed: goal 4.** Two sub-cases, each after the replay:
  - Add `core.sparseCheckout true` (replacing its `false`). Run `setup-worktree.sh`, then assert that `core.sparsecheckout=true` survives in the file and that `push-branch.sh` still prints `refusing to push:` naming `core.sparsecheckout`.
  - Add `user.name x` as a fourth key. Assert that only the three `false` keys are removed, `user.name` survives, and `push-branch.sh` refuses naming `user.name` and not its value.

  In both, origin is unchanged.
- [ ] **(e) A local linked worktree, through `--target`.** Plant the three `false` keys in the main checkout's `.git/config.worktree`. `git worktree add` a worktree on a second branch, then run `bash <main>/scripts/setup-worktree.sh --target <wt>`, and assert:
  - the main checkout's file no longer holds the three keys;
  - the worktree record's `config.worktree` holds only `core.hookspath=<wt>/githooks`;
  - `push-branch.sh <wt>` pushes that branch;
  - `commit-on-branch.sh --repo <main>` lands a commit on the main checkout's branch.

  No clone case is added: the clone arm writes no `config.worktree` (`setup-worktree.sh` → `hooks_config_write`'s clone branch), and the wrappers skip `hr_worktree_config_check_var` for a clone.

**Verification:**

- `npm test --workspace cli -- test/setup-worktree-checkout-sparse.test.mjs`, from the repository root, as one plain foreground command: every case passes.
- Cases (a), (c) and (e) fail when `setup-worktree.sh`'s calls to the drop are removed in a fixture copy, never in the tracked template. Confirm this once by hand and record it in the file's header as the red-once mutation, as `cli/test/watcher-ledger-classification.test.mjs`'s header records its own. Case (b) passes either way: it is the reproduction, not the fix's guard.
- `grep -n "tmpdir()" cli/test/setup-worktree-checkout-sparse.test.mjs` shows the only fixture root. No path in the file points into this checkout.

**Deviations from plan:**

- (d)'s foreign key is planted as `user.name sandbox-written-value`, not `user.name x`: a one-letter value cannot carry the "never its value" assertion, because `x` occurs elsewhere in the wrapper's output. This is the value `push-branch-worktree-config.test.mjs` → case (b) uses.
- Red-once mutation: run on 2026-11-05 through `bash scripts/scratch-run.sh harness-runs/scratch/sparse-drop-mutation.mjs`. The script copies `cli/templates/scripts` to a temp directory, replaces the copy's `drop_inert_sparse "$f"` line with `:`, and runs a copy of the suite against that copy; the tracked template was not touched. Result: `# pass 1`, `# fail 5`. (a), (c) and (e) failed on the `removed` line, as the plan expected. Both (d) cases failed as well: one on the `removed` line, the other on the file still holding `core.sparsecheckoutcone=false` and `index.sparse=false`. (b) passed. The plan said only (a), (c) and (e) would fail; the file header records the result that was measured.
