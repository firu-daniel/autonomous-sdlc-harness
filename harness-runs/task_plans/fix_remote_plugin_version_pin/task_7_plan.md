### Task 7 — Document the pinned install and the upgrade route in `docs/remote-execution.md`

**Goal:** Bring the remote-execution design of record in line with what Tasks 1–6 built. The job installs exactly the version its workflow names. Upgrading is one documented command. §6's row about pinning at install now records what was established, and states the two new behaviours the design rests on without having verified them.

**Depends on:**

- **Task 2:** `init --upgrade-workflows`, run as `npx autonomous-sdlc-harness@<version> init --upgrade-workflows`. It replaces `harness-run.yml` and `harness-resume.yml` after a `.bak`, and only when the run workflow's `HARNESS_CLI_VERSION` differs. It carries the resume workflow's `- cron:` lines, and reports each `.bak` with `git diff --no-index <path>.bak <path>`.
- **Task 3:** `doctor`'s `remote-execution` check warns when the run workflow is pinned to a version other than the CLI running it, and names that route.
- **Task 4:** the `Install the pinned plugin` step clones `https://github.com/<source repo>.git` at `autonomous-sdlc-harness--v<version>` into `$RUNNER_TEMP/harness-marketplace`, adds it with `claude plugin marketplace add ./harness-marketplace`, and installs from it. It refuses on a missing tag or a mismatched installed version. Each refusal names the route and cites "docs/remote-execution.md, section 7, Upgrading" — **this task creates that anchor as `### Upgrading` under `## 7. Turning it on`, spelled exactly so.**
- **Task 5:** the tag `autonomous-sdlc-harness--v<version>`, created by `scripts/tag-release.sh`. The release steps are `docs/development.md` → `## 7. Releasing`, written by Task 9.
- **Task 6:** `bash scripts/probe-plugin-cli.sh`, whose output this task records.

### Targets

- `docs/remote-execution.md` — the only file this task edits. The story index's `## Scope register` rows 12–17 are this task's.

**Work:**

- [ ] **§1 step 4, and §4's "Plugin install, and its pin." paragraph.**
  - In step 4, the install clause becomes: install the plugin from the marketplace repository's release tag for the workflow's version, and refuse when the tag is absent or the installed version differs.
  - Rewrite the §4 paragraph. The job clones the source named in the committed `.claude/settings.json` at the release tag and adds the clone as a directory source, so the pin is now a request and the version check its guard. The clone is the plugin's runtime root and the runner's cache is its install root (`docs/development.md` §1). `init --plugin-root-entries` grants both roots and `doctor --remote-job` grades both. Close with one sentence each on candidate 1 (a native ref: not measured to exist, see §6) and candidate 3 (a reusable workflow: pins nothing by itself, and moves tuning into inputs) as designs not taken, and why.
- [ ] **§6.** Rewrite the row *"The plugin cannot be pinned by a ref at install"*. First run `bash scripts/probe-plugin-cli.sh`, without a pipe.
  - Record the Claude Code version it printed, today's date, the commands it ran, and the relevant help lines, quoted exactly.
  - Record what was established. The tag `autonomous-sdlc-harness--v0.1.0` was created by hand: annotated, SSH-signed by the maintainer on 2026-09-09, with the message `autonomous-sdlc-harness 0.1.0`, on the initial commit. `git cat-file -p autonomous-sdlc-harness--v0.1.0` is the command that shows this.
  - Record what was not established: a `#<ref>` suffix on `marketplace add`, a `ref` in the marketplace source, a version on `plugin install`, and whether the runtime resolves anything from `<plugin>--v<version>` tags. The chosen install rests on none of them, and a later CLI that accepts one could replace the clone while the check still holds.
  - Add two unverified rows:
    - (a) At session start, the runtime uses the user-scope *directory* marketplace the job added, not the project-scope *github* entry of the same name in the committed `.claude/settings.json`. If it is wrong, the session loads the default branch's plugin after the check passed. `docs/development.md` Gate 12 observation (xii) records which.
    - (b) On a self-hosted runner whose home persists across jobs, an earlier job's marketplace entry names a `$RUNNER_TEMP` clone that no longer exists. Unverified: observation (vii) has not run.
- [ ] **§7 step 2, the marketplace-source paragraph, and "A repository adopted before this release".**
  - Step 2: the run workflow is pinned to this CLI's version, and the job installs exactly that version (§4).
  - The source paragraph: the named source must carry the release tags. A fork named with `--marketplace` must carry its own.
  - Replace the delete, plain `init` and re-tune-from-history route with `init --upgrade-workflows`, pointing at `### Upgrading`. Keep the `.gitignore`-with-the-workflows advice and the action-pins sentence, reworded to that route.
- [ ] **New `### Upgrading`**, the last subsection of `## 7. Turning it on`.
  - **The model.** The job runs exactly the version its workflow names. A release of the harness changes nothing for a repository that has not upgraded. Moving is a deliberate act.
  - **The commands**, each in its own fenced block with one command per line (the ledger's adopter-documentation lesson):

    ```
    npx autonomous-sdlc-harness@<version> init --upgrade-workflows
    ```

    ```
    git status --short
    ```

    ```
    git add .github/workflows/harness-run.yml .github/workflows/harness-resume.yml
    ```

    Add any other tracked file `init` changed, because the job's own `init` refuses a changed tracked file. Then:

    ```
    git commit -m "Upgrade the harness workflows to <version>"
    ```

    ```
    gh auth refresh -s workflow
    ```

    ```
    git push --no-verify origin <default branch>
    ```

  - **What it carries:** the cron schedule. **What it does not touch:** the runner, the timeouts, the stop switch and every tunable in §7's table, all of which are repository variables. **What survives only in the `.bak`:** any other edit. Give the diff command, and say not to commit the `.bak`. **What it does not re-render:** the outer-loop scripts under `<scriptsDir>`, which stay create-if-absent (`docs/cli.md` → `## 3. The re-run contract`), so `--force` remains their route.
  - `doctor` warns while the workflow names another version than the CLI running it.
  - What a job does when it cannot install its version: the two refusals, and what each means.
  - Why there is no auto-update: the harness never commits on the user's behalf, and every protected-branch guard and the `pre-push` hook refuse a push to the default branch.

**Verification:**

- `git grep -n -e "Delete them and run a plain" -e "cannot be pinned by a ref" -- docs/remote-execution.md` returns nothing. The old route and the old row wording are both gone.
- Each command in `### Upgrading` sits alone in its own fenced block, and the `### Upgrading` heading text is exactly the anchor Task 4's messages cite.
- The version string and help lines in the §6 row are the ones this run's `bash scripts/probe-plugin-cli.sh` printed, not remembered ones.

**Deviations from plan:** The §6 row carries the probe's version, date and command, and points at a new `### The plugin-install probe` subsection under `## 6.`, which quotes the help lines in fenced blocks and holds the established and not-established records. Verbatim multi-line help output does not fit in a table cell. The probe on Claude Code 2.1.284 also printed a `claude plugin tag` command that creates `{name}--v{version}` tags. That line is quoted there as matching the release tag's shape, and the runtime's use of such tags is still recorded as not established.
