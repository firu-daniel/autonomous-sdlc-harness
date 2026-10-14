### Task 15 — `docs/remote-execution.md`: the job's surfaces, the job-mode watchdog and the post-release check

**Goal:** Settle goal 4 in `docs/remote-execution.md`, the document that owns the remote job. It states:

- what the `run` job now refuses, and why it comes before everything that runs from the branch;
- what stays open, each with its reason;
- how the post-session steps are classified;
- that the job-mode stall watchdog now checks before it resets;
- that the check on a real GitHub job is a **post-release follow-up**, not yet run.

**Depends on:** Tasks 4, 6 and 9. The facts this task states:

- **The `run` job's new step, and the order it sets.** The job now runs `Check out the run's branch`, `Check for jq and gh`, `Set up Node` (moved up from after `Read the configuration`), `Refuse a branch that changed the job's own files`, `Record the default branch's commit` (which writes the fresh checkout's `refs/remotes/origin/<default>` commit id to `$GITHUB_ENV` as `HARNESS_GITHUB_DEFAULT_COMMIT`, before any session), `Read the configuration`, `Install the claude CLI when absent`, then the rest unchanged. The new step therefore precedes `Read the configuration`, `Install the pinned plugin`, `Generate the job's permission profile`, `Bootstrap the checkout` and every `$SCRIPTS_DIR` step. It runs the **pinned** CLI with `working-directory: ${{ runner.temp }}`: `npx --yes "autonomous-sdlc-harness@$HARNESS_CLI_VERSION" doctor --cwd "$GITHUB_WORKSPACE" --job-surfaces="$HARNESS_GITHUB_DEFAULT_BRANCH"`, and on a non-zero exit adds one `::error::` annotation and fails.
- **Every `run`-job `npm` / `npx` runs outside the checkout.** The new step, `Install the claude CLI when absent`, `Generate the job's permission profile` and `Preflight with doctor` run with `working-directory: ${{ runner.temp }}`, the two CLI calls naming the repository with the global `--cwd "$GITHUB_WORKSPACE"`. The reason: npm reads a project `.npmrc` from the nearest directory above its working directory holding a `package.json`, where `registry=` can serve any code under the pinned version and `node-options=` runs code in npm's children, and `npx` runs a satisfying local `node_modules` package without fetching. Neither path is a job surface. `Bootstrap the checkout`'s two configured commands, `commands.depInstall` and `commands.build`, are the npm runs left in the checkout, so both still read a branch-written `.npmrc` or `node_modules/`.
- **What a refusal stops, and what it reports.** `Read the configuration` is the only `run`-job step that sets `SCRIPTS_DIR`, and every `always()`, `!cancelled()` and `cancelled()` step is gated on `env.SCRIPTS_DIR != ''`. A refused job, or one whose step failed for any other reason, therefore runs **no** script from the branch's tree after the refusal, post-session steps included. That is the run-actor gate's existing precedent. The job ends `failure`, and the step's log and annotation name each changed path. No state bundle is saved, so `remote-run.sh sync` maps the run by its existing no-bundle rule: `paused` / `killed` when an older run of the branch carries a bundle, else `failed`. Nothing chains, `poll` never re-dispatches it, and the job sends no notification, as with the run-actor gate's refusal.
- **What that option checks.** `doctor --job-surfaces=<branch>` reads `harness.config.json` from `refs/remotes/origin/<branch>`, which is GitHub's default branch, the one the `collect` job already reads its configuration from. It takes `defaultBranch` from it. It fails when the branch's own commits since `merge-base(HEAD, origin/<defaultBranch>)` changed any path of `jobSurfacePaths`:
  - the outer-loop scripts and `<scriptsDir>/lib`;
  - `<githooksDir>`;
  - `.mcp.json`;
  - `.claude/settings.autonomous.json`, `.claude/settings.json` and `.claude/settings.local.json`;
  - `harness.config.json`;
  - `<scriptsDir>/docs-search-server.sh`, where retrieval applies.
- **The job-mode watchdog.** It runs the same check before its reset, in the form `--job-surfaces=<branch>@$HARNESS_GITHUB_DEFAULT_COMMIT`, so the trusted configuration and the base come from the commit recorded before any session and not from the checkout's `refs/remotes/origin/*`, which the session can rewrite. It runs it from a fresh `mktemp -d` directory with `--cwd` naming the job checkout, because the session can write `.npmrc` or `node_modules/` there directly, without a commit no check could see. It gives up on a non-zero exit. The reset itself is a surface-checked `read-tree --reset` that runs no hook (`docs/watcher.md` → `### Where the family runs git in a run's copy, and under what pins`).
- **The post-session steps on a job that passed the check.** `Push the branch`, `Save the state bundle`, `Open the pull request and report`, `Continue, wait or stop` and `Notify a cancelled job` run unsandboxed in the tree the session wrote:
  - `push-branch.sh` is hardened;
  - `save`, `deliver` and `continue` read state-directory files as data and read refs against the runner-owned `.git/config`.

  The scripts they run are the job-start checkout's, which the check has just found equal to the default branch's on every job surface. The session cannot write those afterwards, because their `denyWrite` entries are literal main-checkout paths, not the unverified worktree globs. The one route that would replace them mid-job, the watchdog's reset, now checks first. On a refused job none of these steps runs (above).

### Targets

- `docs/remote-execution.md`

**Work:**

- [ ] **`## 1. The lifecycle of a remote run`, items 4 and 6.**
  - **Item 4, `**The job's setup**, in the order `harness-run.yml` runs it`:** rewrite the order to match the template. After "check for `jq` and `gh`" comes "set up Node; refuse a branch whose own commits changed a file the job runs or loads, with the pinned CLI's `doctor --job-surfaces` (§11)", then "read `scriptsDir` and whether docs retrieval applies …", then "install the `claude` CLI when absent" and the rest as they stand. Remove "set up Node" from its old place after the configuration read.
  - **Item 6, `**The end of the job.**`:** keep the `always()`, `!cancelled()` and `cancelled()` lists. Add one sentence: each of those steps runs only once `scriptsDir` has been read, so a job stopped before that, by the run-actor gate, by the refusal in item 4 or by any earlier failed step, runs none of them, saves no bundle and sends no notification. Point to §11 for how such a run is recorded.
- [ ] **`**Job mode runs exactly one run, in the job's own checkout**`.** Keep the reason job mode is refused outside the workflow. Add that the watchdog's reset there is surface-checked and preceded by `doctor --job-surfaces`, run from a temporary directory rather than the checkout the session wrote, so a reset never installs a run-authored script the post-session steps would then run, and the check's own `npx` never reads a session-written `.npmrc` or `node_modules/`.
- [ ] **`### Stalls` → `**Decision:** the watcher's stall watchdog runs in job mode unchanged …`.** Reword "unchanged" to say the watchdog's tiers and tunables are unchanged, while its reset now gives up, with a `failed` record, on a copy check, surface check or `doctor --job-surfaces` refusal.
- [ ] **`## 11. Security`: a new paragraph, `**The branch's own files are checked before the job trusts them.**`** It holds the step, what it compares, the trusted configuration's source, why it and every other `run`-job `npm` / `npx` step runs from `$RUNNER_TEMP` with `--cwd` (a branch's `.npmrc` or `node_modules/` is not a job surface, and npm would read it from the checkout), why it precedes the configuration read (a refusal leaves `scriptsDir` unread, so no post-session step runs a script from the refused tree), what a refused job reports and how its run is recorded (both above), the post-session classification for a job that passed, and two residuals, each with its reason:
  - **The workflow file itself runs as the branch carries it.** Cite §9 → `**The residual risk, in both set-ups.**` rather than restating it.
  - **`Bootstrap the checkout`'s configured commands, `commands.depInstall` and `commands.build`, run against the branch's own manifest unsandboxed.** The install runs the manifest's lifecycle scripts and a build such as `npm run build` runs its `scripts.build` / `prebuild` / `postbuild`; `package.json` is not in `jobSurfacePaths`. A package manager runs the manifest's lifecycle and script entries by nature, the checkout's persisted credential is in reach of both, and no out-of-session sandbox runtime ships. They are the npm runs left in the checkout, so both still read the branch's `.npmrc` or `node_modules/`. Also cite `docs/cli.md` §6, residual 1.
- [ ] **The same paragraph's last sentence — the post-release check, stated as not yet run.** This branch verified the change by test, through `cli/test/workflow-templates.test.mjs` and `cli/test/doctor-job-surfaces.test.mjs`. The check on a real job follows the release that carries it:
  1. re-render the test repository's workflows with `npx autonomous-sdlc-harness@<version> init --upgrade-workflows`;
  2. commit and push every path the upgrade's `git add` line prints;
  3. run one job on a branch whose earlier job committed a goal-4 payload;
  4. record the outcome here.

  Put the two commands in fenced blocks, one per line: the ledger rule *every command an adopter is meant to run sits in a fenced block*.

**Verification:**

- `git grep -n "stall watchdog runs in job mode unchanged" -- docs/remote-execution.md` finds no hit.
- `git grep -n "job-surfaces" -- docs/remote-execution.md` hits the new paragraph, the two edited ones and item 4 of `## 1`.
- In `## 1`, item 4, "set up Node" appears once, before the refusal, and the refusal comes before "read `scriptsDir`", matching the order of the `run` job's steps in `cli/templates/github/workflows/harness-run.yml`.
- Re-running the story index's derivation entries 1 and 2 verbatim gives `docs/remote-execution.md` hits that are a subset of the register rows (`⊆ the register rows`). Rows 9–13 keep their `no-change` reasons true against the edited text.
- Every command in the new paragraph sits in its own fenced block. No line number is cited.
- `git grep -n "RUNNER_TEMP\|runner.temp" -- docs/remote-execution.md` hits the new `## 11` paragraph, and the steps it names as running from there match the steps carrying `working-directory` in `cli/templates/github/workflows/harness-run.yml`.

**Deviations from plan:**

- Re-running derivation entry 2 verbatim over `docs/remote-execution.md` adds two hits no register row names: the new `## 11` paragraph's `**Every run-job npm / npx runs outside the checkout.**` bullet (`Preflight with doctor`) and its `Bootstrap the checkout` residual bullet. Both are this task's own new text, not a pre-existing restatement, so the closure invariant holds over the sites that existed before the edit; every other hit is rows 9–13, 21 or 22, and rows 7 and 8 no longer match (their `reset --hard HEAD` was reworded away).
- `## 1`, item 4 also names `Record the default branch's commit` after the refusal ("then record the default branch's commit"), so the listed order matches the template's step order in `cli/templates/github/workflows/harness-run.yml`.
- Step 2 of the post-release check fences `git add <every path on the git add line the upgrade's report prints>` and points to §7, *Upgrading*, for the commit and push commands rather than repeating them.
