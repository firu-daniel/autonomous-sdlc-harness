### Task 6 — Move the `remote-run.sh`, `push-branch.sh` and workflow-render suites to the fresh-init scripts directory

**Goal:** The remote-execution suites drive `remote-run.sh` and `push-branch.sh` inside a fixture a configless `init` wired. They read the scripts directory from the shared constant, and each passes against the Task 1 / Task 2 CLI.

**Depends on:**
- **Task 2**, which re-exports this from `cli/test/helpers/fixture.mjs`:

  ```js
  export { INIT_SCRIPTS_DIR } from '../../dist/config/model.js';
  ```

  The value is `'harness-scripts'`.
- **Task 2's warning.** A config without `scriptsDir` carries a warning-severity problem at path `scriptsDir`.
- **Task 5**, which changes no file here. The order only keeps the three suite-migration tasks in one sequence.

**The fixture shape these suites share.** For example `cli/test/remote-open.test.mjs` → `openFixture`:
1. `createFixture` with only a `package.json`;
2. a configless `runCli(dir, ['init'])`;
3. then `execution`/`forge` patched into the generated `harness.config.json`.

So the scripts were written by an `init` that generated the config, and under the rule below every `const SCRIPT = 'scripts/remote-run.sh'` moves.

**The rule every suite here is moved by.** It is the same rule Tasks 3–5 apply:
- A path naming the adopter's scripts directory moves to `INIT_SCRIPTS_DIR` when the scripts were written by an `init` that generated the config.
- It stays when the suite seeded its own config first.
- Paths into the package's own `templates/scripts/` never move — for example `cli/test/remote-names.test.mjs`'s `join(PACKAGE_ROOT, 'templates', 'scripts', …)` reads.

### Targets

- `cli/test/remote-run.test.mjs`
- `cli/test/remote-start.test.mjs`
- `cli/test/remote-collect.test.mjs`
- `cli/test/remote-open.test.mjs`
- `cli/test/remote-deliver.test.mjs`
- `cli/test/remote-deliver-threads.test.mjs`
- `cli/test/remote-report.test.mjs`
- `cli/test/remote-progress.test.mjs`
- `cli/test/remote-trigger.test.mjs`
- `cli/test/remote-control.test.mjs`
- `cli/test/remote-control-close.test.mjs`
- `cli/test/remote-control-mention.test.mjs`
- `cli/test/remote-control-needs-agent.test.mjs`
- `cli/test/remote-control-review.test.mjs`
- `cli/test/push-branch-retry.test.mjs`
- `cli/test/push-branch-deleted-upstream.test.mjs`

**Work:**

- [ ] **The suites built on one fixture shape.** In each of the twelve suites whose only reference is a module-level `const SCRIPT = 'scripts/remote-run.sh'`, it becomes `` `${INIT_SCRIPTS_DIR}/remote-run.sh` ``:
  - `remote-open`, `remote-deliver`, `remote-deliver-threads`, `remote-report` and `remote-progress`;
  - `remote-trigger`, `remote-control`, `remote-control-close`, `remote-control-mention`, `remote-control-needs-agent` and `remote-control-review`;
  - `remote-start` (plus its `join(f.dir, 'scripts', 'push-branch.sh')`).
- [ ] **`remote-collect.test.mjs`.** `SCRIPT` and `NOTIFY` move by the rule.
- [ ] **`remote-run.test.mjs`.** `SCRIPT` and `NOTIFY` move by the rule, and so do these, wherever their fixture is a configless `init`:
  - the inline `. scripts/lib/harness-run-lib.sh && …` command strings;
  - the `scripts/flow-walker.sh` invocations.

  Build each from the constant rather than retyping `harness-scripts`.
- [ ] **`push-branch-retry.test.mjs` and `push-branch-deleted-upstream.test.mjs`.** `SCRIPT = join('scripts', 'push-branch.sh')` moves by the rule.
- [ ] **Read, and leave unless the rule reaches them.** Three suites reach `init` but carry no scripts-directory literal: `cli/test/trigger-workflow-init.test.mjs`, `cli/test/workflow-plugin-pin.test.mjs` and `cli/test/retrieval-loading.test.mjs`. Edit one only if it asserts warning-free output over a seeded config that now produces Task 2's warning. Name each in this task's return as edited or unchanged, with the reason.

**Verification:**

- Run each edited test file on its own, from the repository root, as one foreground command each: `npm test --workspace cli -- test/<file>.test.mjs`, for exactly the files this task edited. Each passes, with its counts read back.
- Grep the edited files for `'scripts/` and `'scripts'`. Every remaining hit is a `templates/scripts` package path or a seeded config's own value.
