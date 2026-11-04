### Task 10 — Test the entry point, the row table and the preflight refusals, with a shared Gate 12 fixture helper

**Goal:** Give every round-driver suite one fixture helper: a throwaway "Gate 12" repository under the system temp directory with a `gh` stub. Then hold Tasks 1 and 2 to their contract: the usage, `--list`, the result-line refusals and each preflight refusal, with nothing created on a refusal.

**Depends on:**
- Task 1: `scripts/gate12-sandbox-round.sh`.
  - Subcommands: `--help`, `--list`, `plant`, `default-branch`, `grade` and `teardown`, each but the first two requiring `--repo <owner>/<name>`.
  - `--list` prints the `G12_ROWS` table, tab-separated `<row> <round step> <route> <arms> <note>`, rows FR1–FR7, JS1, JS4, SB2, SB4, RJ2, JS3, JS3N, SB3 and RJ3.
  - Exit 1 is usage, 2 a preflight refusal, 3 a `gh`/`git` failure.
- Task 2: `g12_preflight`'s refusals, in order:
  1. a missing `git`, `gh` or `jq`;
  2. not a checkout, or the script's own repository;
  3. no `harness.config.json`;
  4. an origin URL whose GitHub slug is not `--repo`;
  5. a default branch whose `.github/workflows/harness-run.yml` lacks `Install the sandbox prerequisites`.

### Targets

- `cli/test/helpers/gate12-round.mjs` (new) — the shared fixture.
- `cli/test/gate12-sandbox-round-cli.test.mjs` (new) — this task's suite.

**Work:**

- [ ] `helpers/gate12-round.mjs` → `makeGate12Fixture({ withInstallStep = true, stateDir = 'sdlc-harness', scriptsDir = 'scripts', remoteRunExit = 0 })`. Under `os.tmpdir()`, never inside this checkout, it creates:
  - a bare origin;
  - a checkout whose raw `remote.origin.url` is `https://github.com/fixture/gate12.git`, with `url.<bare path>.insteadOf` set to that URL in the checkout's own config, so pushes reach the bare repository;
  - a seed commit on `main` carrying `harness.config.json`, `.claude/settings.json`, `.github/workflows/harness-run.yml` (copied from `cli/templates/github/workflows/harness-run.yml`, with the `Install the sandbox prerequisites` step name removed when `withInstallStep` is false), an executable stub `<scriptsDir>/remote-run.sh` that appends its argv to a log and exits `remoteRunExit` (default `0`; Task 12's failed-dispatch case passes `3`), and a **`.gitignore`** holding the one line `<stateDir>/scratch/*` — the scratch contents rule `init`'s managed block renders for the configured `stateDir` (`cli/templates/repo/gitignore` → `{{scratchGlob}}`, filled from `contentsIgnoredDirectory(stateDir, 'scratch').contents` in `cli/src/generators/repoRoot.ts`, i.e. `${stateDir}/scratch/*`). So the fixture ignores the script's state file, `<stateDir>/scratch/gate12-sandbox-round/state.json` (Task 2's `g12_scratch_dir`), the way an adopted Gate 12 repository does, and a `git status --porcelain` taken before and after a `plant` is comparable. The stub's argv log is written under the fixture's temp directory, **outside** the checkout.
  
  Isolate git configuration through `cli/test/helpers/isolated-gitconfig`, as the other fixture suites do.
- [ ] `helpers/gate12-round.mjs` → `ghStub(dir, routes)` writes an executable `gh` on a `PATH` directory, in the shape `cli/test/watcher-remote-dispatch.test.mjs` uses (`GH_STUB`). It:
  - logs each argv as one JSON line;
  - answers from a routes file keyed by argv prefix (stdout, stderr, exit code);
  - keeps mutable state for `repo edit --default-branch`, `variable set`, `variable delete` and `variable list`, so restore can be asserted;
  - **synthesises the run listing for a branch named at run time.** A route keyed `run list` may carry `synthesiseRun: true` (with an optional `status`, default `queued`, and `firstId`, default `1001`) instead of a fixed stdout. The stub then answers `run list … --branch <b>` — `<b>` read from the argv's `--branch` value — with a JSON array of one run `{"databaseId": <id>, "createdAt": <ISO-8601 now>, "displayTitle": "harness run <b>", "status": <status>}`. `<id>` is allotted sequentially per distinct `<b>`, from `firstId` in the order the branches are first asked about, and kept in the stub's state file, so a repeated lookup of one branch returns the same ID. A `run list` with no `--branch` answers `[]`. A fixed-stdout `run list` route, such as `[]`, still answers statically: synthesis is opt-in per route.
  
  Export `ghStubRuns(dir)`, which returns the stub's `{ <branch>: <databaseId> }` map, so a suite asserts the exact ID the script recorded for a branch whose `<UTC yyyymmddHHMMSS>` stamp it could not know in advance. A `run view <id> …` is answered by an ordinary `run view` prefix route.
  
  Export `runRound(fixture, args, { env })`, which **builds on `runBash(cwd, args, env)` from `cli/test/helpers/fixture.mjs`** — never a spawn of its own — with the argument vector `[<WORKSPACE_ROOT>/scripts/gate12-sandbox-round.sh, ...args]`, `cwd` the fixture checkout, and an `env` override carrying only `PATH` (the stub directory first) plus the caller's `env`. `runBash` applies that over its isolated environment, which blanks `MAIN_REPO_ANCHOR_VARIABLE`, so no child sees the parent's anchor.
  
  Export `spawnRound(fixture, args, { env })` for the one case that must signal its child (Task 12's `SIGINT`): `spawn('bash', [...])` with the same argument vector and `cwd`, whose `env` is one object `{ ...process.env, GIT_CONFIG_GLOBAL: <isolated gitconfig>, GIT_CONFIG_NOSYSTEM: '1', [MAIN_REPO_ANCHOR_VARIABLE]: '', PATH: … , ...env }`, imported from `../../dist/core/mainRepoAnchor.js` as `cli/test/outer-loop-scripts.test.mjs`'s signalled launcher case does. The anchor is blanked **in the same object as the `process.env` spread**, because the repository's anchor-isolation tree guard reads every `cli/test/**/*.mjs` source for a spread that does not. No other spread of `process.env` appears in this helper or in any round-driver suite.
  
  Also export `cleanup`, which removes only the fixture directories this helper created.
- [ ] Suite header. State the rule the suite enforces: the script refuses to run anywhere but an adopted, explicitly named Gate 12 repository and creates nothing when it refuses; `--list` is the single row table. Also state that it reads one fixed script, not a tree, so it owes no `treeGuards` entry.
- [ ] Cases:
  - `--help` exits 0, and `--list` prints exactly one line per row above, whose first fields are those rows in that order.
  - `plant` with no `--repo` exits 1. `grade --repo fixture/gate12 --row XX` exits 1.
  - Each preflight refusal exits 2 with no state file written, asserted on disk:
    - `--repo other/repo` (slug mismatch);
    - a fixture without `harness.config.json`;
    - `withInstallStep: false`;
    - a copy of `scripts/gate12-sandbox-round.sh` and `scripts/lib/gate12-sandbox-round/` placed **inside** the fixture and run from it (the script's own repository).
  - A `gh repo view` route answering non-zero exits 3.
  - The helper's own ignore rule: a file written under `<stateDir>/scratch/gate12-sandbox-round/` of a fresh fixture checkout leaves `git status --porcelain` empty. The helper's own exit option: with `remoteRunExit: 3`, invoking the stub `<scriptsDir>/remote-run.sh` directly exits 3 and still logs its argv.
  - The helper's own run synthesis, driven by invoking the stub `gh` directly: two `run list --branch <b>` calls for one branch and one for another, against a `synthesiseRun: true` route, answer `harness run <b>` titles with IDs `1001`, `1001` and `1002`, and `ghStubRuns` returns that map.

**Verification:**

- `npm test --workspace cli -- test/gate12-sandbox-round-cli.test.mjs` passes. It is this task's own new test file.
- No path under this checkout is created or changed by the run: every fixture sits under the system temp directory.
- A grep of `cli/test/helpers/gate12-round.mjs` for `...process.env` finds only `spawnRound`'s, and that object also names `MAIN_REPO_ANCHOR_VARIABLE`.
