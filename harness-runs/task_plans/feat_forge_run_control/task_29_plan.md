### Task 29 — Document the new verbs, the control workflow and the doctor checks in `docs/cli.md` and `docs/watcher.md`

**Goal:** The CLI's reference and the outer loop's reference describe what this branch added to them:

- `init` writes a fourth workflow, and its closing report names the label `sdlc-harness` and the pull-request setting;
- the re-run contract has a row for `harness-control.yml`;
- `doctor`'s `forge` and `remote-github` checks grade the control workflow, the setting and the effective trigger label;
- `remote-run.sh` has three new verbs, and the watcher's job-mode notifications also reach GitHub.

**Depends on:** Tasks 3, 6, 7, 10, 16, 17 and 18. Restated so this file stands alone:

- **`init` and the re-run contract.** `init` writes `.github/workflows/harness-control.yml` exactly when it writes `harness-trigger.yml`, under `forgeTriggerApplies`, create-if-absent and copied verbatim, with no pin: `--upgrade-workflows` leaves it, `--force` replaces it after a `.bak`, and it needs no `.gitignore` line. The closing report names `gh label create sdlc-harness` and the *Allow GitHub Actions to create and approve pull requests* setting, or `HARNESS_GIT_TOKEN`. Beside `HARNESS_GIT_TOKEN` the report prints the cost Task 6 decided (Task 16's report step): the pull request's author is then the token's owner, who cannot request changes on it, so a solo maintainer uses a token of a machine account or starts review rounds locally with `/autonomous-sdlc-harness:branch-user-review`.
- **`forge`.** It warns when `harness-control.yml` is absent or not carried by `origin/<defaultBranch>`. Its pass names the whole coupling as delivered.
- **`remote-github`**, where the forge coupling applies, asks:
  - `gh workflow view harness-control.yml` — a `warn` when unknown;
  - `repos/{owner}/{repo}/actions/permissions/workflow` — a `warn` when the setting is off without `HARNESS_GIT_TOKEN`, a note when it is off with it, and a not-checked note when the read is refused;
  - the label the committed trigger workflow falls back to when `HARNESS_TRIGGER_LABEL` is unset — a note when that is the earlier release's `harness`.
- **`remote-run.sh`'s new verbs.**
  - `report <event> <branch>`, a lifecycle comment and state label, called by the watcher in job mode and by the run workflow's cancelled step.
  - `deliver <branch> <bundle_dir>`, the draft pull request and the `completed` comment, from the run workflow.
  - `control`, the comment and review adapter, from `harness-control.yml`.

  `stop` gained `--actor`. `review` gained `--allow-no-run`, `--actor` and `--source`.

**Where this task stops.** The design of record is `docs/github-run-control.md`'s, and `docs/remote-execution.md`'s rows are Tasks 27 and 28's; this task links to both.

### Targets

- `docs/cli.md` — `## 2. \`init\`` (the closing report's GitHub steps), `## 3. The re-run contract` (the table), and `## 7. \`doctor\`` (the `remote-execution` / `remote-github` bullet and the `forge` bullet).
- `docs/watcher.md` — `## 1.` step 8, and the scripts table's `remote-run.sh` row.

**Work:**

- [ ] **`docs/cli.md` → `## 2.`**: in the paragraph on the planning order, the sentence on `harness-trigger.yml` names `harness-control.yml` with it. The closing report's GitHub steps become: the trigger label, *`sdlc-harness` unless the repository variable `HARNESS_TRIGGER_LABEL` names another*, with its `gh label create`, then the pull-request setting step and the comment commands. The pull-request setting step names `HARNESS_GIT_TOKEN` as the alternative and, beside it, the same advice the report prints: the pull request's author is then the token's owner, who cannot request changes on it, so a solo maintainer uses a token of a machine account or starts review rounds locally with `/autonomous-sdlc-harness:branch-user-review` (in its own fenced block). Link [`github-run-control.md`](github-run-control.md), and `## 4.` of it for the token's cost.
- [ ] **`docs/cli.md` → `## 3.`**: a table row for `.github/workflows/harness-control.yml` under the trigger's, with the same condition, policy and reasons, worded as that row is.
- [ ] **`docs/cli.md` → `## 7.`**:
  - The `remote-github` part of the bullet names the three new questions, each with its grade and reason. The trigger's confirmation clause now names both workflows. The label asked about is the variable, else the committed workflow's fallback, else `sdlc-harness`.
  - The `forge` bullet names the control workflow's two `warn`s and the pass's delivered coupling, and drops any *still to come*.
- [ ] **`docs/watcher.md`**:
  - Step 8 of `## 1.` gains a sentence: in a job with `forge` `github`, each event is also passed to `remote-run.sh report`, which comments on the run's issue or pull request; the notification itself is unchanged.
  - The `remote-run.sh` row's description adds, in the run job, `report` and `deliver`, and in the control job, `control`, which turns a comment or a review into a harness action. Its *Called by* cell adds the control job and the watcher's job-mode `notify`. The *no — withheld* column is unchanged: the basename is still deny-listed.
- [ ] Every command named in these sections that a reader types stays in, or goes into, its own fenced block.

**Verification:**

- `git grep -n "harness-control.yml" -- docs/cli.md` has hits in `## 2.`, `## 3.` and `## 7.`
- `git grep -n "\`harness\` unless" -- docs/cli.md` finds nothing.
- `git grep -n "machine account" -- docs/cli.md` hits `## 2.`'s closing-report paragraph.
- `git grep -n -E "\bcontrol\b.*\breport\b.*\bdeliver\b|\breport\b.*\bdeliver\b" -- docs/watcher.md` hits the `remote-run.sh` row.
