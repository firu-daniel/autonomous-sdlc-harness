### Task 5 — Move the watcher and walker helpers, and the outer-loop suites built on them, to the fresh-init scripts directory

**Goal:** The two shared driver helpers, and the outer-loop suites that drive the scripts a configless `init` wrote, read the scripts directory from the shared constant. Once done, each suite passes against the Task 1 / Task 2 CLI.

**Depends on:**
- **Task 2**, which re-exports this from `cli/test/helpers/fixture.mjs`:

  ```js
  export { INIT_SCRIPTS_DIR } from '../../dist/config/model.js';
  ```

  The value is `'harness-scripts'`.
- **Task 2's warning.** A config without `scriptsDir` now carries a warning-severity problem at path `scriptsDir` (`cli/src/config/check.ts`).

**The rule every suite here is moved by.** It is the same rule Tasks 3, 4 and 6 apply:
- A path naming the adopter's scripts directory moves to `INIT_SCRIPTS_DIR` when the scripts were written by an `init` that **generated** the config — the fixture held no `harness.config.json` at the first `init`.
- It stays when the suite **seeded** its own config.
- A suite that builds its scripts directory by copying templates, like `create-worktree.test.mjs`'s `cp(join(TEMPLATE_SCRIPTS, name), join(d, 'scripts', name))`, keeps its own directory as long as its own config agrees with it.
- Paths into the package's own `templates/scripts/` never move.

### Targets

- `cli/test/helpers/watcher.mjs` — `WATCHER_PATH`, `NOTIFY_PATH`.
- `cli/test/helpers/walker.mjs` — `WALKER_PATH`, `WALKER_GRAPH_PATH`.
- The watcher-driven suites: `cli/test/watcher-remote-job.test.mjs`, `cli/test/watcher-remote-park-sequence.test.mjs`, `cli/test/watcher-usage-resume.test.mjs`, `cli/test/restart-watcher-remote.test.mjs` and `cli/test/registry-writer.test.mjs`.
- The walker and ledger suites: `cli/test/flow-walker-resume.test.mjs`, `cli/test/flow-walker-ui-and-reentry.test.mjs`, `cli/test/branch-naming.test.mjs` and `cli/test/ledger-phases.test.mjs`.
- The script-family suites: `cli/test/outer-loop-scripts.test.mjs`, `cli/test/run-test-suite.test.mjs` and `cli/test/create-worktree.test.mjs` — the last only where the rule reaches it.

**Work:**

- [x] **The two helpers.**
  - **`helpers/watcher.mjs`.** `createWatcherFixture` runs a configless `init`, so its `WATCHER_PATH` and `NOTIFY_PATH` become `` `${INIT_SCRIPTS_DIR}/autonomous-watcher.sh` `` and `` `${INIT_SCRIPTS_DIR}/autonomous-notify.sh` ``.
  - **`helpers/walker.mjs`.** `WALKER_PATH` and the exported `WALKER_GRAPH_PATH` follow the rule against that helper's own fixture: it seeds a `package.json`, so read whether it seeds a config.
- [x] **The watcher-driven suites.** `watcher-remote-job` (`join(w.dir, 'scripts', …)`, `join(j.dir, 'scripts')`), `watcher-remote-park-sequence`, `watcher-usage-resume`, `restart-watcher-remote` (`SCRIPT_PATH`) and `registry-writer` (`LIB_PATH` and the watcher and `remote-run.sh stop` paths) all move by the rule.
- [x] **The walker and ledger suites.** `flow-walker-resume` (the `commit-on-branch.sh` flip), `flow-walker-ui-and-reentry` (the library path), `branch-naming` (`LIB_PATH`) and `ledger-phases` (`LIB_PATH`). Each of the last two seeds a config, so check whether it carries `scriptsDir` before moving anything.
- [x] **The script-family suites.**
  - **`outer-loop-scripts.test.mjs`.** Its `SCRIPTS_DIR` and the `hr_commit_placed "$PWD/scripts/commit-on-branch.sh"` line follow the rule. Its byte-for-byte template comparison is unchanged, since it compares the written copy to the template wherever the copy landed.
  - **`run-test-suite.test.mjs`.** Its `WRAPPER` follows the rule.
  - **`create-worktree.test.mjs`.** Its own `scripts/` copy stays if its seeded config is consistent with it.
- [x] **List what stays.** Record, in one comment line per suite, every reference left at `scripts` on purpose and the seeded config that justifies it. In this task's return, name each listed suite that needed no edit and why.

**Verification:**

- Run each edited test file on its own, from the repository root, as one foreground command each: `npm test --workspace cli -- test/<file>.test.mjs`. Run only the files this task actually edited.
- A suite reached only through an edited helper and not itself edited — for example one built on `createWatcherFixture` — is not run here, per the test-run rule. It runs at Run gates.
- Every run passes, with its counts read back.
- Grep the edited files for `'scripts'` and `scripts/`. Every remaining hit is a `templates/scripts` package path, a seeded config's own value, or a site carrying the stay comment.

**Deviations from plan:**
- `outer-loop-scripts.test.mjs` serves two regimes, so `SCRIPTS_DIR` moved to `INIT_SCRIPTS_DIR` for the configless fixtures, a new `SEEDED_SCRIPTS_DIR = 'scripts'` (stay comment) is passed to `sourceAndCall` by the five reader cases built on `seededConfig()`, which omits `scriptsDir`, and template reads go through a `TEMPLATE_SCRIPTS` constant so no `templates/scripts` path follows `SCRIPTS_DIR`. The two `'the default scriptsDir'` subtest names became `"a generated config's scriptsDir"`.
- `run-test-suite.test.mjs` and `create-worktree.test.mjs` move nothing (each seeds a config without `scriptsDir`); each carries one stay-comment line, per "List what stays", so neither is a no-edit suite.
