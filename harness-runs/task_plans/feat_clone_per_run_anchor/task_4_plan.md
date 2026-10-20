### Task 4 — Keep the test suite isolated from the anchor: blank it in `ISOLATED_ENV` and at every suite's own environment spread

**Goal:** Make sure a `HARNESS_MAIN_REPO` set in the parent never reaches a subprocess the suite starts. The launcher sets it for a whole session, so the Run gates' `node --test` and every child inherit it. A suite that runs a QA-lock helper would then act on the **real** main checkout. Blank the variable wherever the suite builds a child's environment from `process.env`, the way `HARNESS_GITHUB_DEFAULT_COMMIT` is already blanked, and prove the shared runners hand a child an empty value.

**Depends on:** Task 1, which exports `MAIN_REPO_ANCHOR_VARIABLE` (`'HARNESS_MAIN_REPO'`) from `cli/src/core/mainRepoAnchor.ts`, compiled to `cli/dist/core/mainRepoAnchor.js`. Every blank here is written `[MAIN_REPO_ANCHOR_VARIABLE]: ''`, imported, never retyped. The one reader the blank protects against today is `hc_main_root` (Task 7), which treats an empty value as absent. Task 14's QA-lock cases set the variable explicitly, and only to a fixture's own main checkout.

**Where this task stops.** Running the whole suite with the variable set to a real directory in the parent shell is the task prompt's own check, and it is a person's step: `## Manual setup required` item 3 in the story index. No unit runs the configured test command (`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`). This task makes that run safe and proves the mechanism with a test of its own.

### Targets

- `cli/test/helpers/fixture.mjs` — `ISOLATED_ENV` and its doc comment.
- `cli/test/docs-retrieval.test.mjs`, `cli/test/outer-loop-scripts.test.mjs`, `cli/test/watcher-remote-job.test.mjs`, `cli/test/watcher-remote-park-sequence.test.mjs`, `cli/test/workflow-templates.test.mjs`, `cli/test/test-timeout.test.mjs` — each own `process.env` spread.
- The children that inherit `process.env` whole and run a script of this tree, found while planning by the grep in the third Work bullet:
  - `cli/test/outer-loop-scripts.test.mjs` → `sourceAndCall` (`execFile('bash', ['-c', script, '_', …LIB_FILE…, dir], { cwd: dir, encoding: 'utf8' }, …)`), the case *"the library is sourced-only: running it directly does nothing and exits 0"* (`execFile('bash', [join(dir, LIB_PATH)], { cwd: dir, encoding: 'utf8' }, …)`), and the case *"hr_registry_set then hr_registry_get round-trips a value through a fresh registry file"* (`execFile('bash', ['-c', script, '_', join(dir, LIB_PATH), registry], { cwd: dir, encoding: 'utf8' }, …)`). Each sources or runs the generated `harness-run-lib.sh`.
  - `cli/test/daemon.test.mjs` → `shellSlug` (`execFile('bash', ['-c', script, 'bash', libPath, repoRoot], { encoding: 'utf8' }, …)`), which sources the generated `harness-run-lib.sh`.
- `cli/test/main-anchor-isolation.test.mjs` (new).

**Work:**

- [ ] **`ISOLATED_ENV`.** Import `MAIN_REPO_ANCHOR_VARIABLE` from `../../dist/core/mainRepoAnchor.js`, beside the module's existing `dist` re-export, and add `[MAIN_REPO_ANCHOR_VARIABLE]: ''`. Extend the doc comment by one paragraph in the form of its `HARNESS_GITHUB_DEFAULT_COMMIT` one: the watcher exports the anchor to every session it launches, a session's gate runs included, and a case whose subject is the anchor passes it explicitly.
- [ ] **The suites that build their own environment.** At each spread of `process.env` that does not pass through `fixture.mjs`'s runners, add the same blank after the spread and before the case's own values, so a case's explicit value still wins:
  - `docs-retrieval.test.mjs` (`...process.env, ...retrievalEnv(…)`);
  - `outer-loop-scripts.test.mjs` (the launcher `spawn`'s `{ ...process.env, ...env }`);
  - `watcher-remote-job.test.mjs` (`...process.env, ...j.jobEnv({})`);
  - `watcher-remote-park-sequence.test.mjs` (`...process.env, ...jobEnv(env)`);
  - `workflow-templates.test.mjs` (each of its `...process.env` spreads);
  - `test-timeout.test.mjs` (the `env` it derives from `process.env`).

  Import the constant in each.
- [ ] **The children that inherit everything.** The planning grep was `grep -rn -E '\b(execFile|execFileSync|spawn|spawnSync|execSync)\(' cli/test`. Each hit was classified. Give each call site the `### Targets` list names under *"The children that inherit `process.env` whole"* an `env: { ...process.env, [MAIN_REPO_ANCHOR_VARIABLE]: '' }` beside its existing `cwd` / `encoding`, and import the constant in `daemon.test.mjs`. Leave these hits alone, for the reason given:
  - **An external tool, no script of this tree:** `run-test-suite.test.mjs` `spawnSync('true')`; `remote-run.test.mjs`'s three `execFileSync('jq', …)`; `outer-loop-scripts.test.mjs`'s two `execFileSync('/bin/sh', ['-c', 'command -v …'])`; `init.test.mjs` `execFileSync('git', ['--version'])`; `test-timeout.test.mjs` `execResult('pgrep', …)`.
  - **Code text inside a stub the case writes, which runs `git`:** `remote-control-review.test.mjs` (`execFileSync('git', ['ls-remote', …])`) and `remote-trigger.test.mjs` (`execFileSync('git', ['--git-dir', …])`).
  - **Sources a data file the case itself wrote, not a script of this tree:** `push-destination.test.mjs` (`. "$1"; printf %s "$HARNESS_PUSH_URL"` over `push.env.sourced`).
  - **Already states a complete environment that carries nothing of `process.env`:** `retrieval-python-backend.test.mjs` `libraryPath` (`env: { PATH: path, HOME: home }`), `outer-loop-scripts.test.mjs` `sourceAndCallWithEnv` and `runWatcher`.
  - **Already passes an `env` handled elsewhere in this task:** `helpers/fixture.mjs`'s two runners (first bullet), and the spreads the second bullet names, `test-timeout.test.mjs`'s `topLevelRunnerEnv` included.

  Re-run the grep before editing. A hit that is in neither list goes in the deviation notes with its class, and is edited only if it runs a script of this tree.
- [ ] **`cli/test/main-anchor-isolation.test.mjs`.** Open with the rule it enforces: no child the suite's runners start sees the parent's anchor.
  - **(a)** Spawn a `node` child with `HARNESS_MAIN_REPO` set to a temp directory holding one marker file. The child imports `./helpers/fixture.mjs`'s `runBash` and runs `printf '%s' "${HARNESS_MAIN_REPO-unset}"` through it. Assert the printed value is the empty string, and that the temp directory still holds exactly its marker file.
  - **(b) Source guard.** Read every `cli/test/**/*.mjs`. Every file that spreads `...process.env` also names `ISOLATED_ENV` or `MAIN_REPO_ANCHOR_VARIABLE`. The case's own header says why: a new suite that builds its own environment must blank the anchor too.

**Verification:**

- `bash scripts/typecheck.sh` exits 0.
- From the repository root, each as one plain foreground command, the files this task created or edited:
  - `npm test --workspace cli -- test/main-anchor-isolation.test.mjs`
  - `npm test --workspace cli -- test/docs-retrieval.test.mjs`
  - `npm test --workspace cli -- test/outer-loop-scripts.test.mjs`
  - `npm test --workspace cli -- test/watcher-remote-job.test.mjs`
  - `npm test --workspace cli -- test/watcher-remote-park-sequence.test.mjs`
  - `npm test --workspace cli -- test/workflow-templates.test.mjs`
  - `npm test --workspace cli -- test/test-timeout.test.mjs`
  - `npm test --workspace cli -- test/daemon.test.mjs`

  Read each run's `# tests`, `# pass` and `# fail` counts and its exit status: `# fail 0` on every one.
- `grep -rln '\.\.\.process\.env' cli/test` lists only files that also match `grep -rln 'ISOLATED_ENV\|MAIN_REPO_ANCHOR_VARIABLE' cli/test`.
