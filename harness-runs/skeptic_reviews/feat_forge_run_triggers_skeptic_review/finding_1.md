### 1. The GitHub route never names the *Use workflow from* ref, so a run dispatched by following it runs from the default branch, where `sync` and `restore` cannot find it

> **Self-contained per-finding file** for the `feat_forge_run_triggers` skeptic-review index (`harness-runs/skeptic_reviews/feat_forge_run_triggers_skeptic_review.md`). The implementer reads only this file. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**Files:**

- `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_github_answer_route`, `hr_github_resume_route`): "Run workflow on %s with action run, branch `%s`"
- `cli/templates/scripts/remote-run.sh` (`verb_trigger`, the exit-3 `trigger_finish` call): "Start it by hand: **Actions → \`$WORKFLOW_RUN_FILE\` → Run workflow**, with \`action\` \`run\` and \`branch\` \`$branch\`."
- `docs/remote-execution.md` → `## 3.` → `### Notifications`, the quoted `parked` detail: "then Run workflow on harness-run.yml with action run, branch `<branch>`"

**Problem.** A remote-only maintainer follows these texts to act on a run. The **Run workflow** form of `harness-run.yml` has two branch fields: the *Use workflow from* ref, which defaults to the repository's default branch, and the `branch` input. The notification route and the trigger's hand-start comment name only the `branch` input. A maintainer who fills in exactly what they say leaves *Use workflow from* at the default branch.

That run then goes wrong, and the cause is reachable in code:

- `harness-run.yml` has no guard comparing `github.ref` with `inputs.branch`. The job checks out `ref: ${{ inputs.branch }}` and runs, but GitHub records the run under the default branch as its head branch.
- Every lookup of a branch's runs filters by head branch. `list_runs` (used by `sync` and `status`), `previous_bundle_run` (used by `restore`) and `trigger_run_url` all call `gh run list --workflow harness-run.yml --branch "$branch"`. None of them can see the run.
- **The first answer from GitHub works.** The job's `restore --resume answer` finds the parked run, because that run's head branch is `<branch>`.
- **What follows does not.** If the resumed run parks again or pauses, its bundle sits on a default-branch run. The next GitHub-route answer, or a `continue` chain (which re-dispatches with `--ref "$branch"`), runs `previous_bundle_run`. That skips the newer run and restores the **older** bundle: the first park's clarifications and flow state. On a local machine, `remote-run.sh sync` reports the older run as newest and leaves the record stale.
- **The run also switches plugin versions.** `docs/remote-execution.md` → `### Upgrading` states that every dispatch goes with `--ref <branch>` so that "a run never changes plugin version under itself", and that "dispatching from the default branch was not taken". A form dispatch from the default branch runs the default branch's `harness-run.yml` pin, which is exactly that switch.

`docs/remote-execution.md` → `### Working a run from GitHub alone` states the requirement ("Every action below picks the run's branch under *Use workflow from*"). But the notification is the only text a remote-only maintainer sees in the moment, and neither producer carries that requirement. The hand-start comment in the trigger has no document pointer at all. Code-review Finding 1 added `engine` to the same producers, and this is the other field they omit.

**Fix.**

- [ ] In `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_github_answer_route`, replace the `printf` line and its argument line with:

  ```bash
  printf 'or from GitHub: take the question from the run'"'"'s `%s` artifact, then Run workflow on %s from the branch `%s` (Use workflow from), with action run, branch `%s`, %s, resume answer%s and answers `{"<n>": "<your answer>"}` (docs/remote-execution.md, section 1)' \
    "$HR_REMOTE_STATE_ARTIFACT" "$HR_REMOTE_WORKFLOW_RUN_FILE" "$branch" "$branch" "$eng" "$clear"
  ```

- [ ] In the same file → `hr_github_resume_route`, replace the `printf` line and its argument line with:

  ```bash
  printf 'or from GitHub: Run workflow on %s from the branch `%s` (Use workflow from), with action run, branch `%s`, %s and resume pause (docs/remote-execution.md, section 1)' \
    "$HR_REMOTE_WORKFLOW_RUN_FILE" "$branch" "$branch" "$eng"
  ```

- [ ] In the comment block above `hr_github_answer_route`, after the sentence ending "an empty <engine> prints where to read the run's own instead.", add: `It names the branch twice, as the form's *Use workflow from* ref and as the \`branch\` input: a run dispatched from the default branch is listed under that branch, where every \`gh run list --branch <branch>\` lookup (\`sync\`, \`status\`, \`restore\`) misses it.`
- [ ] In `cli/templates/scripts/remote-run.sh` → `verb_trigger`, in the exit-3 case's `trigger_finish` body, change `Start it by hand: **Actions → \`$WORKFLOW_RUN_FILE\` → Run workflow**, with \`action\` \`run\` and \`branch\` \`$branch\`."` to `Start it by hand: **Actions → \`$WORKFLOW_RUN_FILE\` → Run workflow**, with *Use workflow from* set to \`$branch\`, \`action\` \`run\` and \`branch\` \`$branch\`."`
- [ ] In `docs/remote-execution.md` → `### Notifications`, replace the quoted `parked` detail line with:

  ```
  answer with /autonomous-sdlc-harness:branch-answer <branch>; or from GitHub: take the question from the run's `harness-state` artifact, then Run workflow on harness-run.yml from the branch `<branch>` (Use workflow from), with action run, branch `<branch>`, engine `<engine>`, resume answer and answers `{"<n>": "<your answer>"}` (docs/remote-execution.md, section 1)
  ```

- [ ] In `cli/test/watcher-remote-job.test.mjs`, in the case `a stub that writes question_1.md is parked / stop, naming branch-answer`, add `assert.match(parked[0].detail, /from the branch `[^`]+` \(Use workflow from\)/);` after the `/engine `task`/` assertion.
- [ ] In `cli/test/remote-trigger.test.mjs`, in the case that runs with `STUB_FAIL_ON: 'workflow run'`, add `assert.match(posted[0].body, /Use workflow from\* set to/);` after the `/harness-run\.yml.*Run workflow/s` assertion.
- [ ] Run only those two edited files, one at a time, from `cli/`: `npm test -- test/watcher-remote-job.test.mjs` and `npm test -- test/remote-trigger.test.mjs`. The existing `/Run workflow on harness-run\.yml .*resume answer/`, `/Run workflow on harness-run\.yml .*resume pause/` and `/harness-run\.yml.*Run workflow/s` assertions still match the new text unchanged.
