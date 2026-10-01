### Task 27 — Bring `docs/remote-execution.md` §1, §3 and §5 level with run control

**Goal:** The design of record for remote execution states that a run executing on GitHub with `forge` `github` ends in a draft pull request, that its lifecycle events reach its issue or pull request as comments beside the push notifications, and that comments and reviews now steer it, with the **Run workflow** form kept as the fallback (the prompt's *"Whether the Actions-tab Run workflow route that branch documented stays documented as a fallback. It should."*). Its `## 5.` stops listing run control and the draft pull request as open.

**Depends on:** Tasks 6, 7, 8, 10–13 and 25. Restated so this file stands alone:

- `deliver`, a `harness-run.yml` step after the push, opens a draft pull request for a completed run when `forge` is `github`, with `HARNESS_GIT_TOKEN` when set, else with the job token, which needs GitHub's pull-request setting.
- `report`, called from the watcher's job-mode `notify()` and from `continue` and `poll`, posts a lifecycle comment and keeps one `sdlc-harness: <state>` label on the issue and the pull request. `autonomous-notify.sh` is unchanged, and a `budget` continuation stays silent.
- `harness-control.yml` and `remote-run.sh control` turn `@sdlc-harness` comments and reviews requesting changes into the same dispatches the local commands send, through the existing `dispatch`, `pause`, `stop` and `review` verbs. `verb_dispatch` stays the shell side's one producer of the inputs, and no input was added.
- `docs/github-run-control.md` is the document of record for all of it, with `## The GitHub entry point` as its summary.

**Where this task stops.** `## 7.` (setup, secrets, upgrading) and `## 11.` (security) are Task 28's. `### Working a run from GitHub alone` keeps its heading byte-identical, because `plugin/commands/branch-resume.md` step 6 cites it. Its body changes. `## 6.`'s *What is not verified here* gains nothing here: run control's rows are in `docs/github-run-control.md` → `## 8.`

### Targets

- `docs/remote-execution.md` — the opening's cites paragraph, `## 1.` step 8 and `### Working a run from GitHub alone`, `## 3.` → `### Notifications`, and `## 5.`

**Work:**

- [ ] **The opening's cites paragraph**: add [`github-run-control.md`](github-run-control.md), for working a run from GitHub through comments, reviews and its draft pull request, beside the issue trigger's document.
- [ ] **`## 1.` step 8, *Done.***: replace *"No pull request is opened (§5)."* with the draft pull request. With `forge` `github`, the job's `deliver` step opens one after the push, linked to the issue that started the run, and posts the `completed` comment naming it. Without `forge` `github`, none is opened. The flow itself opens none either way (§5).
- [ ] **`### Working a run from GitHub alone`**, heading unchanged:
  - A new first paragraph: with `forge` `github`, a maintainer with no local setup works a run by comments and reviews ([`github-run-control.md`](github-run-control.md) → `## The GitHub entry point`).
  - The existing **Run workflow** text follows, introduced as the fallback that works with or without `forge` — for example when a park's bundle must be read in full, or when the control workflow is not installed.
  - Every existing bullet and fenced command stays.
- [ ] **`### Notifications`**: one paragraph after the decision. With `forge` `github`, each lifecycle event the job sends also reaches the run's pull request, else its issue, as a comment naming the next GitHub action, and moves its state label. The notification itself and its text are unchanged, so a maintainer gets both. A `budget` continuation sends neither. Link [`github-run-control.md`](github-run-control.md) → `## 5.`
- [ ] **`## 5. The seam, and what stays open`**:
  - The first paragraph says the control half has plugged into the seam too. `remote-run.sh control`, called by `harness-control.yml`, sends its dispatches through the same verbs, so `verb_dispatch` is still the one producer, and no input was added: the issue is read from the task prompt's provenance line on the branch, and the pull request is looked up at post time.
  - *"**\"Done\" is still a pushed branch.**"* becomes a paragraph on the draft pull request: `push-branch.sh` still opens none, and with `forge` `github` the run workflow's `deliver` step opens one after the run.
  - *"**What stays open**"* names only what is still open: adapters beyond GitHub, and running the interactive-test phase remotely (`ROADMAP.md`'s *Cloud QA* row).

**Verification:**

- `git grep -n "feat_forge_run_control" -- docs/remote-execution.md` finds nothing.
- `git grep -n "^### Working a run from GitHub alone$" -- docs/remote-execution.md` finds the heading, unchanged.
- `git grep -n "No pull request is opened\|opens no pull request" -- docs/remote-execution.md` has hits only in sentences that also name the run workflow's `deliver` step.
