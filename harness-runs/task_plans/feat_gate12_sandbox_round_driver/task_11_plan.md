### Task 11 — Test `plant`: the plumbing branches, the dispatch and the state file

**Goal:** Hold `plant` (Tasks 3 and 4) to the round's step 7, as `docs/sandbox-verification.md` → `## 10.` gives each row:
- each arm is its own branch cut from the GitHub default branch's tip;
- each carries exactly its planted paths;
- each is pushed and dispatched through the repository's own `remote-run.sh`, and recorded;
- the operator's checkout is never touched.

**Depends on:**
- Task 10: `cli/test/helpers/gate12-round.mjs`, providing `makeGate12Fixture`, `ghStub`, `ghStubRuns`, `runRound` and `cleanup`.
  - A `run list` route with `synthesiseRun: true` answers `run list … --branch <b>` with one run titled `harness run <b>`, its `databaseId` allotted sequentially per distinct branch from `firstId` (default `1001`) and stable across repeated lookups of that branch.
  - `ghStubRuns(dir)` returns the `{ <branch>: <databaseId> }` map the stub allotted, so this suite reads each planted branch's run ID without knowing the run-time stamp in its name.
  - A fixed-stdout `run list` route (for example `[]`) answers statically; this suite's lookup-exhaustion case uses one.
  - The fixture's seed commit carries a `.gitignore` holding `<stateDir>/scratch/*` (default `sdlc-harness/scratch/*`), the scratch contents rule `init`'s managed block renders (`{{scratchGlob}}`). The state file `plant` writes under `<stateDir>/scratch/gate12-sandbox-round/` is therefore ignored, and the stub `remote-run.sh` logs its argv outside the checkout, so the before/after `git status --porcelain` comparison below holds without any adjustment in this suite.
- Task 3: `plant --repo <slug> [--row <ID>]...`.
  - Branch names are `gate12_<row lower-case>_<arm>_<UTC yyyymmddHHMMSS>`.
  - Two commits: the task prompt at `<stateDir>/task_prompts/<branch>_task_prompt.md`, subject `chore: add task prompt for <branch>`, then `chore: Plant <row> <arm> for Gate 12`.
  - Dispatch is `bash <scriptsDir>/remote-run.sh dispatch <branch> --engine task`. The run ID comes from `gh run list … --json databaseId,createdAt,displayTitle`, title `harness run <branch>`, retried `G12_RUN_LOOKUP_TRIES` times `G12_RUN_LOOKUP_DELAY_SECS` apart.
  - The state file is `<stateDir>/scratch/gate12-sandbox-round/state.json`, holding `branches[]` and `runs[]`.
- Task 4's arms:
  - JS1 `settings` (`.claude/settings.json` with `"gate12Plant": "JS1"`) and `remote-run` (`<scriptsDir>/remote-run.sh`, mode `100755`);
  - JS4 `npmrc` (`.npmrc`, `gate12-js4-marker.cjs`) and `node-modules` (`node_modules/autonomous-sdlc-harness/package.json`, `…/bin.js`, `node_modules/.bin/autonomous-sdlc-harness` as `120000`);
  - SB2 `clarifications` (`gate12-sb2-token.txt` and the `120000` link `<stateDir>/clarifications/<branch>/gate12-link.md`, with the token in `tokens.SB2`);
  - RJ2 `profile` (`.claude/settings.autonomous.json` with `sandbox.enabled: false`).

### Targets

- `cli/test/gate12-sandbox-round-plant.test.mjs` (new).

**Work:**

- [ ] Header. The rule: each plant is one pushed branch per arm, built by plumbing from the default branch's tip, carrying exactly its paths. It is dispatched through the repository's own `remote-run.sh` and recorded before it is pushed. The operator's checkout, index and `HEAD` are unchanged. State that it reads no tree.
- [ ] `plant` with no `--row`: six branches on the bare origin, one per arm. For each:
  - its parent chain is `prompt commit → seed tip`;
  - `git diff-tree --no-commit-id -r` of the plant commit lists exactly the arm's paths with their modes;
  - the SB2 link's blob is a relative target that resolves to `gate12-sb2-token.txt`, and that file holds `tokens.SB2`.
- [ ] The stub `remote-run.sh` log holds one `dispatch <branch> --engine task` per branch. With a `synthesiseRun: true` `run list` route, the state's `runs[]` holds each branch with the run ID `ghStubRuns` maps that branch to, and the six IDs are distinct. The fixture checkout's `git status --porcelain`, `git rev-parse HEAD` and index hash are byte-identical before and after.
- [ ] `--row SB4` plants nothing and says so. A second `plant --row JS1` refuses the already-recorded arms and names `teardown`.
- [ ] With `G12_RUN_LOOKUP_TRIES=2` and `G12_RUN_LOOKUP_DELAY_SECS=0`, a `gh run list` route that never lists the run:
  - exits 3;
  - records the branch in `branches[]` with `run_id: null` in `runs[]`;
  - names the `gh run list` command on stderr.

**Verification:**

- `npm test --workspace cli -- test/gate12-sandbox-round-plant.test.mjs` passes. It is this task's own new test file.
