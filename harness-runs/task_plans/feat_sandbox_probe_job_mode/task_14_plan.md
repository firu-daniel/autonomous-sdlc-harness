### Task 14 — Add the runner workflow `scripts/sandbox-probe-runner.yml`

**Goal:** A workflow file the person commits **by hand** to the Gate 12 repository `firu-daniel/harness-gate12`, as `.github/workflows/sandbox-probe-runner.yml`. It does there what a `harness-run.yml` job does up to its launch, then runs the probe in job mode against that checkout and uploads what the probe kept. **It never runs in this repository.** It lives under `scripts/`, never under `.github/`, and `scripts/publish-main.sh` removes `scripts/` from `main` and every release tag. This repository cannot host its own remote runs (`docs/development.md` → **This repository cannot host its own remote runs.**).

**Depends on:**

- **Task 5:** `bash <probe>/scripts/sandbox-probe.sh run --job <checkout> --runner-controls <file>`. Job mode's doctor is `npx --yes autonomous-sdlc-harness@$HARNESS_CLI_VERSION doctor --cwd <checkout> --remote-job` when `HARNESS_CLI_VERSION` is set (Task 3).
- **Task 7:** the runner controls file, one `<key>\t<value>` line per reading, a value never carrying a tab or newline. The closed key set:
  - `image-os`, `image-version`, `uname-r`, `probe-commit`, `cli-version`;
  - `sysctl-before`, `apparmor-profile-before`, `bwrap-before`, `socat-before`;
  - `sudo-control` (`exit <n>`);
  - `imds-control` (`http <code>` or `no answer: curl exit <n>`);
  - `sysctl-after`, `apparmor-profile-after`, `bwrap-after`, `socat-after`, `bwrap-version`;
  - `bwrap-start` (`exit 0` or `exit <n>: <first stderr line>` of `bwrap --ro-bind / / --dev /dev --unshare-all --proc /proc true`);
  - `ssh-config` (`created` or `existed`).

  Presence values are `present` or `absent`, paths are `command -v`'s or `absent`, and the sysctl is the file's content or `absent`.
- **Task 8:** the canary's name, `SP_RUNNER_CANARY_NAME=SBX_PROBE_CANARY`.

The job steps it copies are `cli/templates/github/workflows/harness-run.yml`'s, at this branch's tree, which is the tree the release is cut from.

**Where this task stops.** One new file. Gate 15's instructions for committing, running and reading it are Task 15's, and its test is Task 22's.

### Targets

- `scripts/sandbox-probe-runner.yml` (new)

**Work:**

- [ ] **The header comment** says what the file is and where it goes: committed by hand to the Gate 12 repository's default branch, never to this one. It names what it uploads and that it keeps no response body and prints no secret. It cites Gate 15. Then the workflow-level keys:
  - `name: sandbox-probe-runner`;
  - `on: workflow_dispatch` with two required string inputs: `probe_commit`, the full commit of this repository to take the probe from, and `cli_version`, the released CLI version under test;
  - `permissions: contents: write`, for the probe branch's push and deletion;
  - `concurrency: { group: sandbox-probe-runner, cancel-in-progress: false }`;
  - `defaults.run.shell: bash`.

  One job, `probe`:
  - `runs-on: ${{ vars.HARNESS_RUNNER || 'ubuntu-latest' }}`, the job's own expression, so it measures the runner a job would get;
  - `timeout-minutes: 120`;
  - `env: HARNESS_CLI_VERSION: ${{ inputs.cli_version }}`.
- [ ] **The job's own steps, each `run:` body copied byte for byte from `harness-run.yml`'s step of the same name**, dropping only their `if: env.HARNESS_STOPPED != '1'` lines. Each `uses:` keeps the template's pin and its `# <action> <version>` comment. In this order:
  1. `Check out the run's branch`, but with `ref: ${{ github.event.repository.default_branch }}`, so the checkout is at `$GITHUB_WORKSPACE` as a job's is; step 9 below then moves it onto the configuration's `defaultBranch` when the two differ;
  2. `Check for jq and gh`;
  3. `Set up Node`;
  4. `Read the configuration`;
  5. `Install the claude CLI when absent`;
  6. `Set the git identity`;
  7. `Install the pinned plugin`;
  8. `Generate the job's permission profile`.

  Then three new steps. The first is **inserted between steps 4 and 5** (it runs before `Install the claude CLI when absent`); the other two follow step 8.

  9. **`Switch to the configured default branch`**, directly after `Read the configuration`, so `jq` is known present and every later copied step runs on the branch it leaves checked out. Job-mode preflight check 3 runs *as today* (Task 3) and refuses a checkout that is not on `harness.config.json` → `defaultBranch` (`scripts/lib/sandbox-probe/preflight.sh`, check 3: *"the main checkout … is on '…', not the default branch '…'"*). GitHub's default branch and the configuration's `defaultBranch` are two separate values — the template's own `Record the default branch's commit` reads `HARNESS_GITHUB_DEFAULT_BRANCH` and `defaultBranch` apart — and they can differ. The step:
     - reads `defaultBranch` with `jq -r '.defaultBranch // empty' harness.config.json`, and refuses, naming the file, when it is empty;
     - when it differs from `${{ github.event.repository.default_branch }}`, runs `git fetch --quiet origin "+refs/heads/$cfg:refs/remotes/origin/$cfg"`, and refuses, naming **both** values (*"the configuration's defaultBranch '<cfg>' is not on origin; GitHub's default branch is '<gh>'"*), when the fetch fails;
     - then `git switch --quiet -C "$cfg" "origin/$cfg"`, and refuses when `git symbolic-ref --short HEAD` is not `$cfg` afterwards;
     - prints both values to the log, so a reader sees which branch the probe measured.

     It sits before the probe and the install step, so every later step, the runner controls included, reads the branch preflight will accept.
  10. **`Check the OAuth credential`**: fails, naming the secret, when `CLAUDE_CODE_OAUTH_TOKEN` is empty. It reads the secret into an `env:` value and never echoes it. It is named apart from the template's `Check the credentials`, which accepts either of two secrets, so Task 22's same-name comparison never pairs them.
  11. **`Take the probe from the marketplace repository`**: reads `.claude/settings.json` → `extraKnownMarketplaces["autonomous-sdlc-harness"].source.repo`, as `Install the pinned plugin` does. It `git clone --quiet`s that repository into `$RUNNER_TEMP/sandbox-probe-src` and checks out `inputs.probe_commit` detached. It refuses when the input is not 40 hex characters or `rev-parse HEAD` differs from it.
- [ ] **`Record the runner and the controls`**, a new step before the install step. It writes `$RUNNER_TEMP/sandbox-probe-out/controls.tsv` through one shell function that replaces a tab or newline in a value with a space, then `printf '%s\t%s\n'`. It records:
  - `image-os` from `$ImageOS`, `image-version` from `$ImageVersion`, `uname-r` from `uname -r`;
  - `probe-commit` from the probe clone's `rev-parse HEAD`, and `cli-version`;
  - the four `-before` keys;
  - **`sudo-control`**: `sudo -n true`, its exit status only;
  - **`imds-control`**: `curl -sS -o /dev/null -w '%{http_code}' --max-time 5 http://169.254.169.254/`, with no `Metadata` header. It writes `http <code>` when curl exits 0, else `no answer: curl exit <n>`. The response body goes to `/dev/null` and is never kept or printed;
  - **`ssh-config`**: creates `~/.ssh/config` holding one comment line, mode 600 under a mode-700 `~/.ssh`, when absent (`created`), else `existed`. This is PD21's placeholder, so S1 and S2 can tell a refusal from an absence.
- [ ] **The install, the after-readings and the bootstrap.**
  - **`Install the sandbox prerequisites`**: its `run:` body copied byte for byte from the template.
  - **`Record the readings after the install step`**, new: appends the five `-after`/version keys and `bwrap-start`, running the `bwrap` line once as the runner user, with stderr's first line kept.
  - **`Bootstrap the checkout`**: copied from the template.
- [ ] **`Run the probe in job mode`, then `Upload the evidence`.**
  - **The run step** carries `timeout-minutes: 90`. Its `env:` holds `IN_OAUTH: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}` and `SBX_PROBE_CANARY: sbx-probe-canary-${{ github.run_id }}`, which is not a secret. The body:
    - exports the token as the template's `Run the harness` does, then unsets `IN_OAUTH`;
    - sets `TMPDIR="$RUNNER_TEMP/sandbox-probe-tmp"`, created first, so the probe's evidence directory lands there;
    - runs `bash "$RUNNER_TEMP/sandbox-probe-src/scripts/sandbox-probe.sh" run --job "$GITHUB_WORKSPACE" --runner-controls "$RUNNER_TEMP/sandbox-probe-out/controls.tsv"`, with stdout and stderr to `run.stdout` and `run.stderr` in the out directory;
    - writes the exit status to `exit.txt`, then prints both files to the log.

    It ends `exit 0`, so the upload always runs, and the last step fails the job on a non-zero probe exit.
  - **`Upload the evidence`**, under `if: always()`: the template's `actions/upload-artifact` pin, `name: sandbox-probe-evidence`, `retention-days: 3`, `if-no-files-found: warn`. Its `path:` lists exactly `${{ runner.temp }}/sandbox-probe-out/` and `${{ runner.temp }}/sandbox-probe-tmp/sandbox-probe-evidence.*`. Nothing else leaves the runner. The kept streams can quote what a session read, and the canary design keeps every real secret out of them.
  - **`Report the probe's exit status`**: prints `exit.txt` and exits with it.

**Verification:**

- `grep -nE 'on:|push:|pull_request|schedule' scripts/sandbox-probe-runner.yml` shows `workflow_dispatch` as the only trigger.
- `grep -n 'echo.*IN_OAUTH\|echo.*TOKEN\|set -x' scripts/sandbox-probe-runner.yml` finds nothing.
- `grep -n 'uses:' scripts/sandbox-probe-runner.yml` lists only pins that `grep -n 'uses:' cli/templates/github/workflows/harness-run.yml` also lists.
- `grep -n 'name: Read the configuration\|name: Switch to the configured default branch\|name: Install the claude CLI when absent' scripts/sandbox-probe-runner.yml` shows the switch step between the other two, and `grep -n 'defaultBranch' scripts/sandbox-probe-runner.yml` shows it read from `harness.config.json` and named in its refusal beside GitHub's default branch.
</content>
</invoke>
