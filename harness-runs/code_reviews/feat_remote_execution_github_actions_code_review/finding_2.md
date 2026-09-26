### 2. `STATE_ARTIFACT_NAME` is exported and nothing consumes it, so the artifact-name mirror is unguarded

**File:** `cli/src/remote/githubActions.ts` (`STATE_ARTIFACT_NAME`) — "export const STATE_ARTIFACT_NAME = 'harness-state';"

**Problem.** This branch adds `STATE_ARTIFACT_NAME` as the single owner of the Actions artifact name. The module header says a rename is an edit to each of its declared mirrors. A repo-wide search (`git grep -n -w STATE_ARTIFACT_NAME`, excluding `harness-runs/`) finds only the declaration and the shell mirror's own variable in `cli/templates/scripts/remote-run.sh`. Nothing in `cli/src` or `cli/test` imports it, so the export is dead.

That matters because the name is spelled three times, and nothing checks that the three agree:

- the owner, `cli/src/remote/githubActions.ts`;
- `cli/templates/scripts/remote-run.sh` → `STATE_ARTIFACT_NAME='harness-state'`, which `sync`, `restore` and `poll` download by;
- `cli/templates/github/workflows/harness-run.yml` → the `Upload the state bundle` step's `name: harness-state`.

If the upload name and the download name drift, the failure is silent:

- `has_bundle` finds no artifact;
- `sync` falls to its "no bundle" cases and records `paused` / `killed` or `failed`;
- `restore` treats every job as a first job, so a chained continuation loses its clarifications, walker state and counters.

`cli/test/workflow-templates.test.mjs` reads both templates as text but never checks the artifact name. `cli/test/remote-names.test.mjs` checks only the workflow paths.

**Fix.** Give the constant its consumer: a test that pins both mirrors to it.

- [ ] In `cli/test/workflow-templates.test.mjs`, import `STATE_ARTIFACT_NAME` next to the existing names from `../dist/remote/githubActions.js`. Then add a case after `'continue runs unless cancelled; the upload and the final push always run'`:
  ```js
  test('the uploaded artifact is the one remote-run.sh downloads: STATE_ARTIFACT_NAME in both mirrors', () => {
    const upload = stepCarrying('actions/upload-artifact');
    assert.match(upload, new RegExp(`^\\s*name: ${STATE_ARTIFACT_NAME}$`, 'm'));
    const script = readFileSync(join(PACKAGE_ROOT, 'templates', 'scripts', 'remote-run.sh'), 'utf8');
    assert.match(script, new RegExp(`^STATE_ARTIFACT_NAME='${STATE_ARTIFACT_NAME}'$`, 'm'));
  });
  ```
- [ ] Add one sentence to that file's header contract paragraph: "the upload step's artifact name and `remote-run.sh`'s `STATE_ARTIFACT_NAME` are both `cli/src/remote/githubActions.ts` → `STATE_ARTIFACT_NAME`".
