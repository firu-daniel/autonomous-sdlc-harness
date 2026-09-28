# User-Review Fix Plan: feat_remote_execution_github_actions

## Context

**Branch:** `feat_remote_execution_github_actions`
**Source user review:** `harness-runs/user_reviews/feat_remote_execution_github_actions_review.md`
**Summary:** The user's hands-on review of remote execution on GitHub Actions flagged four gaps. Two are in the resume poller's control loop: a race that can disable the poller while a finishing job enables it, and unbounded, silent retries of a failing re-dispatch. The other two are coverage gaps: storage and artifact retention, where an expired state bundle is silently treated as a first job, and the interactive-test phase, which has no remote path.

All four observations were checked against the current working tree and all four hold. None were invalid.

---

## Phase 2 Readiness — Ordered Fix List

**This list is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom, and the committing role flips each one to `[x]` as its fix lands. `[ ]` markers anywhere else, including the sub-step bullets inside the per-finding files, are informational only. The committer never touches them.

Each entry resolves to a self-contained `harness-runs/user_reviews/feat_remote_execution_github_actions_fix_plan/finding_<K>.md` via its `**Finding K**` reference. Sorted lowest blast-radius first. Findings 1, 2 and 3 all edit `remote-run.sh`, so they run in that order.

1. [x] **Finding 1** — `poll` counts a not-yet-completed run carrying a usage-paused bundle as waiting, and re-checks after its own disable, re-enabling the poller when a job enabled it mid-tick; stub-driven interleaving test. _(layer: cli, general)_
2. [x] **Finding 2** — Bound the poller's failed re-dispatches (a count carried in a `harness-poll-state` artifact, plus a stateless deadline), then send one `paused` notification and stop counting the branch as waiting. _(layer: cli, general)_
3. [x] **Finding 3** — Document storage and the 14 GB runner disk; set `retention-days` on the state bundle; tell an expired bundle from an absent one in `restore`/`sync`/`status` and the remote arms of `branch-status`/`branch-answer`/`branch-resume`; best-effort retention check in `doctor --check-github`. _(layer: cli, plugin, general)_
4. [ ] **Finding 4** — Declare QA unsupported remotely: job mode records a `remote-skipped:` line in the ledger (its §1.3 contract first), skips Phase E / R4, reports the skip through an override in each autonomous fork (the cores get mode-free pointers only), and sends one notification; `doctor` warns when `phases.qa` is on with remote execution, a QA section in `docs/remote-execution.md`, and a Gate 12 observation. _(layer: cli, plugin, general)_

---

## Must Fix

### 1. `remote-run.sh poll` can disable the resume poller while a finishing job is enabling it
→ [finding_1.md](feat_remote_execution_github_actions_fix_plan/finding_1.md)

### 2. A failing re-dispatch keeps the resume poller ticking forever, with no notification
→ [finding_2.md](feat_remote_execution_github_actions_fix_plan/finding_2.md)

### 3. Storage and artifact retention are uncovered, and an expired state bundle is silently treated as a first job
→ [finding_3.md](feat_remote_execution_github_actions_fix_plan/finding_3.md)

### 4. The interactive-test (QA) phase has no remote path
→ [finding_4.md](feat_remote_execution_github_actions_fix_plan/finding_4.md)

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Out of scope / verified-OK

_None._ Every observation was checked against the current code and holds:

- Observation 1: `poll_branch` → "[ \"$state\" = completed ] || return 1". `continue_wait_poller` runs inside the job's last step, while the run is still `in_progress`.
- Observation 2: `poll_branch` → "dispatching $branch failed ($REDISPATCH_ERR); still waiting", return 0.
- Observation 3: `docs/remote-execution.md` → `## 10.` has no storage text. `Upload the state bundle` sets no `retention-days`. `has_bundle`'s "(.expired != true)" makes an expired bundle look absent.
- Observation 4: `harness-run.yml`, `docs/remote-execution.md` and `cli/templates/repo/mcp.json` carry nothing for QA in a job.

For Observation 4 the plan takes option (b), and `finding_4.md` gives the reasons.

---

## Source observations

Verbatim copy of `harness-runs/user_reviews/feat_remote_execution_github_actions_review.md`, so this fix plan is self-contained. **This section stays in the index.**

1. `remote-run.sh poll` can disable the resume poller while a job is enabling it, stranding a usage-paused run. `poll_branch` skips a branch's newest `harness run <branch>` run unless its state is `completed` (`[ "$state" = completed ] || return 1`), so that run is not counted as waiting, but `continue_wait_poller` runs `gh workflow enable harness-resume.yml` from the job's own last step, while that run is still in progress. The failure sequence: the poller is already enabled for another paused run; a tick lists the runs while job A is still in progress, so A is not counted as waiting; A's `continue` enables the poller, which is already enabled; the tick finds nothing due and `verb_poll` runs `gh workflow disable harness-resume.yml`. A has ended on `decision: wait-poller` with no poller left to resume it, and waits for a manual `/autonomous-sdlc-harness:branch-resume` although its `paused` notification promised an automatic resume at the reset. Close the window so that a job which enables the poller during a tick is never left without one. One option: after disabling, re-list the runs and re-enable if a run that finished since the tick's first listing carries `status: paused` / `pause_reason: usage`. Another: count a branch whose newest `harness run` run is still queued or in progress as waiting. The fix must not keep the poller ticking for the whole of an ordinary long job that never pauses. Add a `remote-run.test.mjs` case with a stubbed run list that reproduces the interleaving and asserts that the poller ends enabled.

2. When the resume poller's re-dispatch of a due usage-paused run fails, `poll_branch` counts the branch as still waiting (`dispatching <branch> failed (...); still waiting`, return 0). The poller therefore stays enabled and retries on every tick with no bound and no notification. A persistent failure keeps it ticking indefinitely, billed at least one minute per tick on a private repository, while the run never resumes and the only trace is a log line in each tick's job. Examples are `harness-run.yml` removed from the default branch, the workflow disabled, or `actions: write` withdrawn. Bound it: after a set number of consecutive failed dispatches for a branch, or once the branch's reset is more than a set time in the past, send one `paused` notification naming `gh`'s error and `/autonomous-sdlc-harness:branch-resume <branch>`, and stop counting that branch as waiting so the poller can disable itself. The count has to survive between ticks, so say where it lives. Add `remote-run.test.mjs` cases for a stubbed dispatch that always fails (exactly one notification, then a disable) and for one that fails once and then succeeds (dispatched, no notification).

3. Storage and artifact retention are not covered. (a) `docs/remote-execution.md` → `## 10. What it costs` gives compute costs only. Add a short storage paragraph: artifact storage included per plan (Free 500 MB, Pro 1 GB, Team 2 GB, Enterprise Cloud 50 GB, then $0.25/GB-month), cache storage 10 GB per repository (then $0.07/GB-month), public repositories free, with the harness's own use stated as negligible (a `harness-state` bundle of a few KB per job, about 300 MB of retrieval cache). Cite https://docs.github.com/en/billing/concepts/product-billing/github-actions and https://docs.github.com/en/actions/reference/limits with the retrieval date. State the standard hosted Linux runner's 14 GB SSD (https://docs.github.com/en/actions/reference/runners/github-hosted-runners): the checkout, the toolchain, the plugin, the retrieval runtime and the adopter's own dependencies and build output all share it. Name a self-hosted runner as the route for a repository too large for that. The harness does nothing about repository size beyond saying so. (b) The `harness-state` artifact is the only remote copy of a run's clarifications, park-loop count, auto-resume count and walker state. `restore` selects only a run carrying an **unexpired** artifact: with none, `--resume answer` exits 2, and `--resume none|pause` proceeds silently as an ordinary first job. The `Upload the state bundle` step in `harness-run.yml` sets no `retention-days`, so the repository's setting applies: 90 days by default, and a repository or organisation can lower it to a single day. A run left parked or paused longer than that cannot be answered, its question may no longer be readable, and a resumed run silently loses its counts. Set `retention-days` explicitly on that step, at the maximum the repository allows, and state why in the workflow header. Give `doctor --check-github` a best-effort check that reads the repository's artifact retention (`gh api repos/{owner}/{repo}/actions/permissions/artifact-and-log-retention`, which needs admin access): `warn` below a threshold you set and argue, and report the check as skipped when the read is forbidden. When `restore`, or the remote arms of `branch-status` / `branch-answer`, find that the newest `harness run` run's bundle has expired, say so plainly instead of treating it as a first job, and name the way on, which is resuming from the committed ledger or re-dropping the task. Document the retention limit in `docs/remote-execution.md`.

4. The interactive-test (QA) phase has no remote path. Neither `harness-run.yml` nor `docs/remote-execution.md` mentions it, and the branch never exercised it, because this repository runs with `phases.qa: false`. With `phases.qa: true`, a remote run would reach Phase E on a runner and most likely park there. `cli/templates/repo/mcp.json` declares the `playwright` and `chrome-devtools` servers without a headless flag, and a runner has no display, so the first navigation most likely fails. `ubuntu-latest` ships Google Chrome, but nothing starts a display server or passes `--headless`. The job also installs none of the application's own dependencies beyond what `setup-worktree.sh` does, so `commands.devServer` may not start. The gitignored QA credentials file (`<qa_creds_path>`) is absent in the job, so every auth-gated test reports `blocked`. Either (a) support it: run the browser servers headless in job mode (or under `xvfb-run`) without changing the local declaration, make sure the dev server's dependencies are installed before Phase E, supply the QA credentials through a repository secret written to `<qa_creds_path>` by a workflow step (never echoed), and state which browser the runner provides and how a self-hosted runner gets one; or (b) declare QA unsupported remotely: skip Phase E in job mode with its own report wording and one notification, so the branch still ends at "ready for review" with the skip recorded. Whichever is chosen, `doctor --check-github` warns when `phases.qa` is `true` and `execution.target` is `github-actions` while a prerequisite is missing, `docs/remote-execution.md` gets a QA section, and Gate 12 gains a QA step, or records that the step is skipped.
