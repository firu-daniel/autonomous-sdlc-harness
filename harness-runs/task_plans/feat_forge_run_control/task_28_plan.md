### Task 28 — Bring `docs/remote-execution.md` §7 and §11 level with run control

**Goal:** The setup section of remote execution names the workflows `init` now writes and the one setting a draft pull request needs. Its secrets-and-variables table gives `HARNESS_GIT_TOKEN`'s second use and the trigger label's new default. Its upgrade section says the control workflow shares the trigger's re-run route. Its security section states the fork rule beside the self-hosted-runner warning — *"State the rule where an adopter will read it, next to `docs/remote-execution.md` → `## 11. Security`'s self-hosted-runner warning"* (the *Fork pull requests* lead, acceptance 6) — and what comments make public.

**Depends on:** Tasks 2, 6, 14, 15 and 16. Restated so this file stands alone:

- **Workflows.** `init` writes `harness-control.yml` beside `harness-trigger.yml` when `forge` is `github` and `execution.target` is `github-actions`. Like the trigger it carries no pin, is never re-rendered by `init --upgrade-workflows`, and is replaced by `init --force` after a `.bak`.
- **The run workflow's tokens.** It now holds `issues: write` and `pull-requests: write`. Its `deliver` step opens the draft pull request with `HARNESS_GIT_TOKEN` when set, so the adopter's CI runs on it without an approval click (research S3). Otherwise it uses the job token, which needs *Allow GitHub Actions to create and approve pull requests* (S4, C3). To open the pull request, `HARNESS_GIT_TOKEN` needs *Pull requests* write beside *Contents* write and, for workflow files, *Workflows* write as a fine-grained token, or `repo` plus `workflow` as a classic one (research S2, **Consequence**). A token set only for pushes and workflow edits may lack *Pull requests* write; `deliver` then opens no pull request and its `completed` comment names `gh`'s error (Task 6).
- **The cost of that token (Task 6's decision, to be stated wherever the token is recommended).** A pull request opened with `HARNESS_GIT_TOKEN` is authored by the token's owner, and GitHub does not let a pull request's author request changes on their own pull request. So when the token is a person's own, that person cannot start a round from GitHub with *Request changes* on the delivered pull request. The way on is a token of a machine account, or starting the round locally with `/autonomous-sdlc-harness:branch-user-review`. Without the token, anyone with write access can request changes, and CI waits for the approval click (S3). The author rule is GitHub's documented behaviour, not retrieved in `docs/github-integration-research.md`. `docs/github-run-control.md` → `## 4.` (Task 24) carries the full statement.
- **The trigger label.** `HARNESS_TRIGGER_LABEL`'s default is `sdlc-harness`. A workflow written by the previous release keeps `harness` until `init --force`.
- **Forks.** A fork's review never runs `harness-control.yml` (its `if:`); a comment on a fork's pull request is refused by `control`; `pull_request_target` is used nowhere; and no step checks out or runs a pull request's head.

**Where this task stops.** §1, §3 and §5 are Task 27's. The adopter's how-to is `docs/github-run-control.md`'s (Tasks 23–25), which this task links to and never restates.

### Targets

- `docs/remote-execution.md` — `## 7. Turning it on` step 2, `### Every secret and variable`, `### Upgrading`, and `## 11. Security`.

**Work:**

- [ ] **`## 7.` step 2, *Write the two workflows***: the sentence on `forge` names both forge workflows, `harness-trigger.yml` and `harness-control.yml`, linking [`github-issue-trigger.md`](github-issue-trigger.md) and [`github-run-control.md`](github-run-control.md). Add after step 5 one optional step: switch on *Allow GitHub Actions to create and approve pull requests* (Settings → Actions → General → Workflow permissions) so a completed run can open its draft pull request with the job's token, unless `HARNESS_GIT_TOKEN` is set. This is prose with no command, because a `gh api` call that writes the setting also overwrites the default token permissions.
- [ ] **`### Every secret and variable`**:
  - The `HARNESS_GIT_TOKEN` row's *Read by* adds the `deliver` step, and its *Required* cell gains the second reason: set it so your CI runs on the draft pull request without an approval click. The same cell states the access the token then needs to open the pull request, citing [`github-integration-research.md`](github-integration-research.md) → S2: a fine-grained token with *Pull requests* write beside *Contents* write and, for workflow files, *Workflows* write; or a classic token with `repo` plus `workflow`. It also states what a token without *Pull requests* write produces: no pull request, and a `completed` comment naming `gh`'s error. One more clause states the cost under **Depends on**: the pull request's author is then the token's owner, who cannot request changes on it, so use a token of a machine account, or start rounds locally with `/autonomous-sdlc-harness:branch-user-review`, linking [`github-run-control.md`](github-run-control.md) → `## 4.`
  - The `HARNESS_TRIGGER_LABEL` row's default becomes `sdlc-harness`, with *`harness` in a workflow written by an earlier release*.
  - The `HARNESS_TRIGGER_ALLOWED_BOTS` row's *Read by* adds `remote-run.sh control`: a listed bot's commands and reviews are obeyed too.
  - The closing *list of record* sentence names the `control` job's `env:` in `harness-control.yml`.
- [ ] **`### Upgrading`**: the bullet *"**It does not re-render `harness-trigger.yml`.**"* names `harness-control.yml` too: both share the scripts' route, `init --force`. Add one sentence: a repository that re-renders the two pinned workflows without `--force` gets a `deliver` step whose script verb is missing until `--force` runs, and that step is `continue-on-error`, so the run still finishes.
- [ ] **`## 11. Security`**:
  - The self-hosted-runner paragraph's list of what the harness's own workflows trigger on gains `harness-control.yml`'s `issue_comment` and `pull_request_review`, which are not `pull_request` events.
  - Directly after that paragraph, a new one, `**Pull requests from forks.**`, stating the four fork facts under **Depends on**, citing research C2, and linking [`github-run-control.md`](github-run-control.md) → `## 6.`
  - The *What a reader of the repository's Actions runs can see* paragraph gains: with `forge` `github`, park questions, answers and review text also become issue and pull-request comments, public on a public repository.
- [ ] Keep every existing fenced command in these sections unchanged. A new command added here sits in its own fenced block.

**Verification:**

- `git grep -n "| \`harness\` |" -- docs/remote-execution.md` finds nothing: the variable table names the new default.
- `git grep -n "machine account" -- docs/remote-execution.md` hits the `HARNESS_GIT_TOKEN` row of `### Every secret and variable`.
- `git grep -n "pull_request_target" -- docs/remote-execution.md` has its hits only in the new fork paragraph.
- `git grep -n "harness-control.yml" -- docs/remote-execution.md` has hits in `## 7.` step 2, `### Every secret and variable`, `### Upgrading` and `## 11.`

**Deviations from plan:** The optional step added after step 5 is numbered `5a` rather than `6`, so steps 6 and 7 and any citation of them keep their numbers.
