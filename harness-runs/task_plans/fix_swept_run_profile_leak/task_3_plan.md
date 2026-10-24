### Task 3 — Isolate the other sweep-running suites' state directory, and prove the watcher-rendered profile is the one swept

**Goal:** Two other suites run a real sweep that reaches a copy removal. After Task 1, each of those sweeps also resolves a per-run profile path under the machine state directory. Give each one a temp `XDG_STATE_HOME`, so no test resolves or deletes anything under the real one. In the suite where the real watcher renders a profile, assert that the sweep removes that same file. That proves end to end that the sweep finds the profile *"by the same path the watcher wrote it to"*.

**Depends on:** Task 1, whose sweep prints `cleanup-merged-worktrees.sh: removed run profile <file> for '<branch>'` after `removed clone|worktree …`. The path it deletes is `hr_run_profile_file "$(hr_repo_slug <main checkout>)" <branch>` under the sweep's `XDG_STATE_HOME`. Task 2 owns `cli/test/cleanup-run-copies.test.mjs`, and this task does not touch it. `cli/test/outer-loop-scripts.test.mjs`'s hanging-fetch case exits before any copy is considered, so it needs nothing here.

### Targets

- `cli/test/run-copy-migration.test.mjs` — its `sweep` passes `f.watcherEnv()`, plus one assertion.
- `cli/test/cleanup-worktree-record.test.mjs` — its fixture's `sweep` passes a temp `XDG_STATE_HOME`.

**Work:**

- [ ] `run-copy-migration.test.mjs`: the `sweep` closure in the legacy-sweep case passes `f.watcherEnv()` to `runBash`. That is the same environment the watcher ran under when it rendered the legacy run's profile. Before the real sweep, capture `f.settingsArg(f.wt)`, the profile path the watcher passed to the legacy run's session, which an earlier assertion in this file already equates with `hr_run_profile_file`. Assert that the file exists before the sweep and is gone after it, and that the real stdout carries `removed run profile ${thatPath} for '${LEGACY}'`. The new clone run's profile (`newSettings`, for `NEW`) is still there afterwards, because its upstream is not gone. Add a sentence to the header saying the sweep runs under the fixture's own `XDG_STATE_HOME` and removes the profile the watcher rendered.
- [ ] `cleanup-worktree-record.test.mjs`: the fixture's `sweep` passes `{ XDG_STATE_HOME: join(scratch, 'state') }`, using the per-case `scratch` directory the fixture already makes and tears down. Add one sentence to the header stating it. No assertion in this suite changes. Its subject is the legacy arm's target check, and the profile is `cleanup-run-copies.test.mjs`'s.

**Verification:**

- `npm test --workspace cli -- test/run-copy-migration.test.mjs` and `npm test --workspace cli -- test/cleanup-worktree-record.test.mjs`, each run from the repository root as one plain foreground command, exit 0 with `fail 0`.
- `git grep -n "cleanup-merged-worktrees.sh'" -- cli/test/run-copy-migration.test.mjs cli/test/cleanup-worktree-record.test.mjs`: every `sweep` definition these hits lead to passes an `XDG_STATE_HOME` under the fixture's temp tree.
