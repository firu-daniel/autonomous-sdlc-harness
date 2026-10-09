### Task 8 — Harden `harness-resume.yml` and `harness-trigger.yml` the same way

**Goal:** The resume poller and the issue-trigger workflow pass `zizmor 1.30.1 --offline --no-config`. The two exceptions are `artipacked` on each file's checkout, and each is justified in its header: the trigger's job pushes the new run branch through that checkout's credential, and the poller's job runs `git ls-remote … origin` through it, which a private repository refuses without it. Neither workflow loses a capability: `docs/remote-execution.md` (`### Resuming without the local watcher`) and `docs/github-issue-trigger.md` remain the bar.

**Depends on:** Task 7. The header blocks below follow its shape in `harness-run.yml`, so the four templates read alike:
- the `# ACTION PINS.` wording, with SHA pins and the version on the line above each `uses:`;
- `permissions: {}` at the top with per-job grants;
- `# THE CHECKOUT CREDENTIAL.`, which `harness-resume.yml` gains here.

**Where this task stops.** It edits these two templates only. The test suite is Task 10's — it asserts today that each file's permissions sit in a workflow-level block, and it fails here until Task 10 lands. The documentation is Task 16's.

### Targets

- `cli/templates/github/workflows/harness-resume.yml`
- `cli/templates/github/workflows/harness-trigger.yml`

**Work:**

- [ ] **Pin the three `uses:` lines.** `harness-resume.yml` has `actions/checkout@v5` and `actions/upload-artifact@v6`, and `harness-trigger.yml` has `actions/checkout@v5`. Use the SHAs resolved on 2026-10-09:
  - `actions/checkout` → `fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09`, `# actions/checkout v5.1.0`;
  - `actions/upload-artifact` → `b7c566a772e6b6bfb58ed0dc250532a479d7789f`, `# actions/upload-artifact v6.0.0`.

  Each version comment goes on the line **above** its `uses:`, never trailing, because of the header rule against ` #` in a plain scalar. Rewrite each file's `# ACTION PINS.` block on Task 7's wording, including that `init --upgrade-workflows` re-renders `harness-resume.yml` but **not** `harness-trigger.yml`. The trigger takes new pins only from `init --force` (`cli/src/generators/githubWorkflows.ts` → choices 4 and 5).
- [ ] **`harness-resume.yml`: move the permissions to the job.** Set `permissions: {}` at workflow level, and give the `poll` job the set the file grants today, unchanged: `contents: read`, `actions: write`, `issues: write`, `pull-requests: write`. Update `# THE PERMISSIONS.` to say they sit on the job, so a second job added later inherits nothing.
- [ ] **`harness-resume.yml`: keep the persisted credential, and justify it.** Do **not** add `persist-credentials: false` to the `poll` checkout.
  - **Why it is needed.** `poll` does not reach GitHub only through `gh`. `cli/templates/scripts/remote-run.sh` → `verb_poll` → `poll_pass` → `poll_branch` calls `remote_branch_exists "$branch"` for every run it examines, and that function runs `git -C "$root" ls-remote --exit-code --heads origin "refs/heads/$1"` inside the checkout, authenticated by the credential `actions/checkout` persists. On a private repository that call fails without it, `poll_branch` takes its `2)` arm ("could not be checked …; proceeding") on every tick, and its `1)` arm — which skips a deleted run branch and drops its poll state — can never fire. Removing the credential would loosen what `docs/remote-execution.md` says the poller does, which the prompt forbids.
  - **The header.** Add a `# THE CHECKOUT CREDENTIAL.` block, on Task 7's wording, giving that reason — `remote-run.sh` → `remote_branch_exists`, cited by basename — as why `artipacked` stands on this checkout.
  - **The upload.** In the same block, state that the `harness-poll-state` upload's `path:` (`${{ env.POLL_STATE_DIR }}`) is `<stateDir>/autonomous_logs/poll_state/current` — set by the job's configuration step from `harness.config.json`'s `stateDir` — a subdirectory of the state directory that does not contain `.git/`, so the upload cannot carry the persisted credential.
- [ ] **`harness-trigger.yml`: move the permissions to the job.** Set `permissions: {}` at workflow level, and give the `trigger` job the file's current set, unchanged: `contents: write`, `actions: write`, `issues: write`.
- [ ] **`harness-trigger.yml`: keep the persisted credential, and justify it.** `remote-run.sh trigger` runs `remote-run.sh start`, and `verb_start` pushes the branch through `hr_push_landed "$script_dir/push-branch.sh"` with the checkout's credential.
  - **The header.** Extend `# THE CHECKOUT.` with that reason as why `artipacked` stands on this checkout, and with the fact that this job uploads no artifact.
  - **What stays as it is.** The existing no-`secrets.` rule and the `github.token` (never `HARNESS_GIT_TOKEN`) rule are unchanged.

**Verification:**

- **The scratch-probe audit.** Copy both edited templates into a directory under `harness-runs/scratch/`, as `.github/workflows/`, and run `uvx zizmor@1.30.1 --offline --no-config --format=plain <dir>/.github` through a probe run with `bash scripts/scratch-run.sh <probe>`. The only findings left are `artipacked` on `harness-resume.yml`'s `poll` checkout and on `harness-trigger.yml`'s checkout.
- **YAML and lint.** The same probe parses both files as YAML, and runs `actionlint -shellcheck= -pyflakes=` where it is on `PATH`.
- **No token.** `grep -n "{{"` on both files finds no template token.
- **Byte-stable lines.** `git diff` touches no `run:` body, `if:` or trigger key.

**Deviations from plan:** `harness-trigger.yml`'s `# WHO WRITES IT.` said the file "carries no version pin", which the new sha pin made false; reworded to "no CLI version pin" (no `run:`, `if:` or trigger key touched). The zizmor probe reported 2 findings shown (`artipacked` on both checkouts, as planned) and 6 suppressed by zizmor's default persona; the suppressed ones were not listed.
