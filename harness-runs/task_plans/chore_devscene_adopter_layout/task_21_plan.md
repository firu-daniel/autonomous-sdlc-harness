### Task 21 — Respell the wrapper, clone and worktree suites

**Goal:** Bring the suites that drive the commit, push, refresh, worktree, clone, cleanup and scratch wrappers in line with the renamed config file and state directory. Their fixtures write `devscene.config.json`, and the wrapper templates and run library they copy read it.

**Depends on:** Task 5 (the run library) and Task 7 (the wrapper templates), which read `devscene.config.json` and default `stateDir` to `devscene` and `scriptsDir` to `devscene-scripts`. `cli/test/helpers/run-copy-layouts.mjs` builds its main checkout from `cli/templates/scripts/lib/harness-run-lib.sh` and writes the config it reads.

**Where this task stops.** A fixture that omits `scriptsDir` now means `devscene-scripts`. `create-worktree.test.mjs`'s comment *"`scripts` stays on purpose: `CONFIG` omits `scriptsDir`, whose absent-key value this copy matches"* is resolved in one of two ways: the copy moves under `devscene-scripts`, or `CONFIG` sets `scriptsDir: 'scripts'` explicitly. Either way the comment says which. Any other case in these files that relied on that fallback is fixed the same way.

### Targets

- `cli/test/commit-on-branch-plumbing.test.mjs`, `cli/test/commit-on-branch-target-check.test.mjs`, `cli/test/push-branch-worktree-config.test.mjs`, `cli/test/refresh-branch-worktree-config.test.mjs`
- `cli/test/wrapper-target-check.test.mjs`, `cli/test/wrapper-clone-arm.test.mjs`, `cli/test/wrapper-clone-config-refusal.test.mjs`
- `cli/test/create-worktree.test.mjs`, `cli/test/setup-worktree-checkout-sparse.test.mjs`, `cli/test/setup-worktree-clone-target.test.mjs`, `cli/test/cleanup-run-copies.test.mjs`, `cli/test/job-layout-root.test.mjs`
- `cli/test/clone-create-remove.test.mjs`, `cli/test/clone-ref-order.test.mjs`, `cli/test/clone-sync.test.mjs`, `cli/test/clone-trust-check.test.mjs`, `cli/test/run-copy-clone-arm.test.mjs`, `cli/test/credential-scan-lib.test.mjs`
- `cli/test/helpers/run-copy-layouts.mjs`

**Work:**

- [ ] `helpers/run-copy-layouts.mjs`: the main checkout's config is `devscene.config.json`, both in the `writeFile` call and in `runGit(main, ['add', 'devscene.config.json', '.gitignore'])`. Apply row 2 of `## Context`'s spelling table to its state directory.
- [ ] The four commit, push and refresh suites: apply rows 1 and 2 to every fixture write, `git add` path set, asserted refusal text (`cannot resolve '…/devscene.config.json' — refusing to commit`) and comment.
- [ ] The three `wrapper-*` suites and `job-layout-root.test.mjs`: apply rows 1–3.
- [ ] `create-worktree.test.mjs`, the two `setup-worktree-*` suites and `cleanup-run-copies.test.mjs`: apply rows 1–3, and settle the absent-key comment as above.
- [ ] The four `clone-*` suites, `run-copy-clone-arm.test.mjs` and `credential-scan-lib.test.mjs`: apply rows 1 and 2.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-scripts' --` followed by this task's nineteen target paths prints nothing.
- Each target test file passes through `npm test --workspace cli -- test/<name>.test.mjs`, from the repository root, one plain foreground command per file. `helpers/run-copy-layouts.mjs` is exercised by the suites that import it.
