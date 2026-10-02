### Task 13 — `harness-control.yml` listens to closes and deletions, and a replied refusal ends `success`

**Goal:** Wire item 5 into the workflow, and fix item 2:
- `harness-control.yml` runs `remote-run.sh control` for `issues: [closed]`, `pull_request: [closed]` and `delete`, with prefilters that save a runner;
- the control step maps `control`'s exit 2 (a refusal it already replied to) to step success, so an ordinary refusal is never a red run with a failure e-mail, while every real failure (1, 3, 4) still fails.

**Depends on:**
- Task 11, which makes `remote-run.sh control` handle `GITHUB_EVENT_NAME` `issues`, `pull_request` and `delete`, each quietly gated and each ending in exit 0 (handled or ignored) or 3 (the stop failed). Without it, these events would reach a script that exits 1 for an unknown event name;
- Task 6, the previous editor of `cli/test/workflow-templates.test.mjs`;
- Task 8, which adds the sixth command verb, `status` (`COMMAND_VERBS = ['answer', 'pause', 'resume', 'stop', 'clear', 'status']` in `cli/src/remote/githubActions.ts`, mirrored in `remote-run.sh`). Task 8 does not target this workflow file, so this task, which ships after it, brings the header's opening summary up to six verbs.

**Why the workflow maps 2, not the script.** `remote-run.sh`'s exit map is a contract its script callers read: *"2 refused (replied)"*. Changing it to 0 would make a refusal indistinguishable from an action to any other caller. The workflow is the one consumer for which a replied refusal is a success. So the mapping is `bash "$SCRIPTS_DIR/remote-run.sh" control || [ $? -eq 2 ]`. Under the step's `bash -e -o pipefail` a left-hand failure inside `||` does not exit the shell, and `$?` is the script's status.

**Where this task stops.** The workflow file and its template test. The script is Task 11's. The docs (§1 refusals, §5 and §6 closes, the §8 rows) are **Tasks 16 and 17**'s.

### Targets

- `cli/templates/github/workflows/harness-control.yml` — `on:`, the job's `if:`, `run-name`, the control step's `run:`, and the header: its opening summary (the first sentence, *"acts on an autonomous-sdlc-harness command comment (`@sdlc-harness answer|pause|resume|stop|clear`) on an issue or pull request, and turns a pull-request review requesting changes into the next user-review round."*), THE EVENTS, THE PREFILTER, FORK PULL REQUESTS and a new A REFUSAL IS A SUCCESS paragraph.
- `cli/test/workflow-templates.test.mjs` — assertions and one behavioural case.

**Work:**

- [ ] `on:` adds `issues: types: [closed]`, `pull_request: types: [closed]` and `delete:`. Never `pull_request_target`. `run-name` becomes `harness control ${{ github.event.issue.number || github.event.pull_request.number || github.event.ref }}`, which still never matches a `harness <action> <branch>` title.
- [ ] The job's `if:` gains three `||` clauses, each a saving and never the authority:
  - `github.event_name == 'issues' && contains(join(github.event.issue.labels.*.name, ','), 'sdlc-harness: ')` — every harness issue carries a state label from its trigger on;
  - `github.event_name == 'pull_request' && github.event.pull_request.head.repo.full_name == github.repository`;
  - `github.event_name == 'delete' && github.event.ref_type == 'branch'`.

  The concurrency expression already gives every non-review event its own `harness-control-<run_id>` group. Keep it, and say so.
- [ ] The control step's `run:` becomes `bash "$SCRIPTS_DIR/remote-run.sh" control || [ $? -eq 2 ]`.
- [ ] Header:
  - the opening summary lists `` `@sdlc-harness answer|pause|resume|stop|clear|status` ``, and says, besides the comment and the review, that a close of the run's issue or pull request, or the deletion of its branch, stops the run;
  - THE EVENTS gains the three events and what each one is;
  - THE PREFILTER gains the three clauses, and the cost that every branch deletion in the repository starts a job;
  - FORK PULL REQUESTS: a `pull_request` close job runs the pull request's merge-commit copy of this file, as a review job does (C2);
  - a new paragraph, A REFUSAL IS A SUCCESS, carries the reason above;
  - `pull-requests: write` and `contents: write` stay, and cover the contents read `stop --branch-gone` makes.
- [ ] `cli/test/workflow-templates.test.mjs`:
  - assert the three triggers and their types, the three `if:` clauses, the `run-name`, and the `|| [ $? -eq 2 ]` step line; update the header list for `harness-control.yml`;
  - add one behavioural case. Extract the control step's `run:` line from the rendered template, and run it with `bash -e -o pipefail -c` and `SCRIPTS_DIR` pointing at a stub `remote-run.sh` that exits N. Assert exit 0 for N = 0 and 2, and non-zero for N = 1, 3 and 4.

**Verification:**

- `npm test -- test/workflow-templates.test.mjs` from `cli/` passes, Task 6's assertions included.
- `grep -n '${{[^ ]' cli/templates/github/workflows/harness-control.yml` finds nothing.
- `grep -n "pull_request_target" cli/templates/github/workflows/harness-control.yml` finds only the header's sentence that it is never used.
- `grep -n "answer|pause|resume|stop|clear|status" cli/templates/github/workflows/harness-control.yml` finds the opening summary, and `grep -n "answer|pause|resume|stop|clear\`" cli/templates/github/workflows/harness-control.yml` (the five-verb form) finds nothing. Re-read the opening summary: it names the close and deletion stop.
