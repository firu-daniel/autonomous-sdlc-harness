### Task 19 — Gate 12 (xiv) legs for this branch's behaviour

**Goal:** Change and add the Gate 12 → (xiv) legs in `docs/development.md` that this branch's fixes need, as the acceptance criteria name them: *"leg (d) without a workaround, close/delete stops"*, plus the `status` command, the refused control run's conclusion, the wrong-ref refusal and the `stopped` wording. These legs are run by hand on `firu-daniel/harness-gate12` after a release. No task runs them. The design-change legs (*"`isDraft` at each transition, resolved threads, phase comments"*) belong to roadmap item 19's branch, and this task does not write them.

**Depends on:** Task 18, the last docs task. Each leg below checks a behaviour stated in `docs/github-run-control.md` (Tasks 16 and 17) or `docs/remote-execution.md` (Task 18), which already carry it:
- **Task 1:** a park answered, paused and resumed completes and delivers;
- **Task 2:** a question comment carries one answer instruction and a copy block;
- **Task 5:** a resume after a stop is told there is no pause note;
- **Task 6:** a wrong-ref dispatch fails in `wrong-ref`;
- **Task 7:** replies after a stop say `stopped`;
- **Task 8:** `@sdlc-harness status` replies and changes nothing;
- **Tasks 11–13:** a close or deletion stops the run, and a refused command's control run concludes `success`;
- **Task 17:** the pull request's link is the `completed` comment.

**Where this task stops.** The (xiv) legs and their *What it settles* paragraph. The Round 6 record and roadmap row 19 are **Task 15**'s. The record of a future round 7 is written when it is run, not here.

### Targets

- `docs/development.md` → `## 5. Verifying a change` → Gate 12 → **(xiv) Run control from GitHub with the machine off**: legs (a), (c), (d), (f) and (g), new legs (h) and (i), and *What it settles*.

**Work:**

- [ ] Leg (a): the park's comment carries one answer instruction, the `@sdlc-harness answer <n>` form, and ends with the copy block. Record that `answer_<n>.md` appears nowhere in it. Leg (c) gains a sentence: let the paused-then-resumed run go on to leg (d) **without** any *Run workflow* recovery.
- [ ] Leg (d):
  - it now passes on the run leg (c) resumed, with no workaround (finding 1);
  - replace *"the issue's timeline shows the pull request"* with *"the issue's `completed` comment names the pull request's URL"*;
  - add, where `HARNESS_GIT_TOKEN` is set, a recording of whether the timeline shows a `cross-referenced` event (the §8 row);
  - keep `isDraft` `true`, as today. The flip is item 19's.
- [ ] Leg (f):
  - the unknown-verb reply lists the six commands;
  - `@sdlc-harness status` on the issue and on the pull request, each in its own fenced block, passes when the reply names the state, the next ledger entry and the latest run, and when no label changes and no `harness run` run follows;
  - the refused command's `harness control` run concludes `success`. Record it with `gh run list --repo <owner>/<scratch-repo> --workflow harness-control.yml`, alone in its fence.
- [ ] Leg (g), after the stop:
  - `@sdlc-harness pause` replies `` `stopped` `` and never `paused`;
  - after `@sdlc-harness resume`, the job's log carries the stop/kill launch clause and no `PAUSE_PROGRESS.md` clause.

  New leg **(h) Close and delete**, one fenced command per step:
  - close the issue of a running run (passes with a `stopped` comment naming the closer and *"closed issue"*, both labels `sdlc-harness: stopped`, and the run cancelled with its artifact still listed);
  - `@sdlc-harness resume`, then close the pull request;
  - resume again, then delete the branch on `origin` (passes with the `stopped` comment on the issue saying it cannot be resumed, and no `harness-resume.yml` dispatch for it);
  - a triage close, recorded as not runnable on a personal-account repository, as (f) records the triage refusal.

  New leg **(i) A dispatch from the wrong ref**: dispatch `harness-run.yml` with `--ref <default branch>` and `-f branch=<slug>`. It passes when the run's `wrong-ref` job fails naming `<slug>`, and its `run` job is skipped.
- [ ] *What it settles*: name the §8 rows Task 17 added that (h) and (d) settle — the `delete` event's default-branch workflow, the merge-commit workflow copy for a `pull_request` close, the contents read after a deletion, the default-branch stop marker for a deleted branch, and the `HARNESS_GIT_TOKEN` cross-reference row where it applies. Update the closing *"What still owes a first recording"* sentence of the Gate 12 history, replacing *"(xiv)'s leg (d) without a workaround, which waits on finding 1"* with legs (h) and (i) and the re-run of (d).

**Verification:**

- Every command the new and changed legs hand a reader sits alone in a fenced block (`harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block"*). Scan the (xiv) section for an inline `gh` or `git` command.
- Each *Passes when* sentence names something observable on GitHub: a reply's first line, a label, a run's conclusion or an event. None is a figure measured by a run inside its own session (`harness-runs/lessons.md` → the wall-clock rule).
- The §8 row names cited in *What it settles* match Task 17's row text exactly.
