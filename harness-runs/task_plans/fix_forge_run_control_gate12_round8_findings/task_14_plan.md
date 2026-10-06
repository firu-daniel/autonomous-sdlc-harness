### Task 14 — `docs/github-run-control.md`: branch recognition, the recorded engine, the push rule, the `not_started` comment, and §8

**Goal:** `docs/github-run-control.md` is the design of record for working a run from GitHub. This task makes it state what Tasks 3 to 10 changed in that surface.

**Depends on:** Tasks 3 to 10. The facts each one shipped, restated so this file needs no other:
- **Task 10.** A branch can be commanded when any of three holds:
  - its origin tip carries the flow-progress ledger;
  - the command was typed on an issue, the branch is the one that issue's genuine `started` marker names (bot-authored, opening with the trigger's sentence, ending with exactly that marker), **and the branch still exists on origin**. That covers a first run GitHub never started, whose branch carries only its task prompt and no ledger. An issue keeps its marker after its branch is deleted, so a marker-named branch gone from origin is refused with ``\`<branch>\` no longer exists on origin, so its run cannot be resumed or commanded``, matching the `delete` job's own comment, and never as "not a harness branch";
  - a `harness run <branch>` run is queued, waiting, requested, pending or in progress, which also covers a pull request whose head has no ledger yet.

  A failed listing, or a failed check of whether the branch still exists on origin, is a refusal naming the read. The new refusal, reachable now only on a pull request, reads ``… is not a harness branch: its tip carries no flow-progress ledger, and no `harness run <branch>` run is queued or in progress``.
- **Tasks 5 to 7.** For a run whose `run` job GitHub never started (it ended `cancelled` or `failure` with no step listed), `resume` and `answer` use the engine its dispatch recorded:
  - the trigger's `started` comment means `task`;
  - a `round` comment means `user_review`;
  - `control`'s reply after a successful dispatch carries ` engine=<engine>` in its `reply` marker, exactly `<!-- sdlc-harness event=reply branch=<branch> engine=<engine> -->`;
  - only a `github-actions[bot]` comment counts, posted no earlier than 120 s before the run's `createdAt`.

  A never-started run whose engine is recovered is `paused` (`killed`) even when no run carries a bundle, so a branch's **first** run that GitHub never started resumes by `@sdlc-harness resume` **on its issue** with engine `task`, from the trigger's `started` comment. Task 10 is what lets `control` accept that branch, which has no ledger. With no such comment, the existing refusal naming the Run workflow form stands, and a first run with no bundle stays `failed`.
- **Task 8.** `collect` posts one `not_started` comment on the target ("GitHub did not start the job of the harness run on `<branch>`, so nothing ran and the branch is unchanged.", the reason, then the way on). It sets `sdlc-harness: paused` when an older run carries a bundle or the engine is recorded, else `sdlc-harness: failed`. The way on is `@sdlc-harness resume` when the engine is recorded, else the Run workflow form. Its round-placement failure comment now offers re-running the `collect` job, with no new review needed.
- **Tasks 3 and 4.** `push-branch.sh` retries a push the remote refused, at most three attempts in all, and never retries a `[rejected]` (lost-race) push. A placement failure names "the remote refused the push" or "`origin/<branch>` moved to `<sha>`".

**Where this task stops.** `docs/remote-execution.md` (Task 13) owns the run-lifecycle design: the poll bound, the poller, the runner wait and the `## 6.` rows. This file cites it for those. `docs/development.md` is **Task 15's**.

### Targets

- `docs/github-run-control.md`:
  - `## 1.` → the command table's `answer` and `resume` rows, and **Who and where.**;
  - `## 2.` → **A push that loses a race fails loudly, and is never fetched, rebased or retried.**, **How it is sent.**, and the `collect` bullets;
  - `## 5.` → the lifecycle table;
  - `## 8.` → the not-verified table.

**Work:**

- [ ] **`## 1.`**
  - `resume` row → *Accepted when*: add "a run whose job GitHub never started resumes with the engine its dispatch's comment recorded, a branch's first run included (§5)". Make the same addition, less the first-run clause, to the `answer` row.
  - **Who and where.**: add which branch a command acts on. Its tip carries the ledger; or, for a command on an issue, it is the branch that issue's genuine `started` marker names and it still exists on origin; or a `harness run <branch>` run is queued or in progress. A branch the issue names that has been deleted is refused as deleted. So a run can be stopped or paused from its first minute (Gate 12 round 8, finding 5), and a first run GitHub never started can be resumed from its issue (finding 3).
- [ ] **`## 2.`**
  - Keep the bold rule sentence about a lost race, which still holds. Add after its bullets: a push the remote **refused**, a server-side failure that is not a lost race, is retried by `push-branch.sh` at most three attempts in all, because a retry there replays nothing and rebases nothing (Gate 12 round 8, finding 2). Placement then names which of the two happened.
  - In the `collect` bullet and **How it is sent.**, state that a round `collect` could not place leaves one comment offering a re-run of the `collect` job, or a new review.
- [ ] **`## 5.`**
  - Add a lifecycle-table row for `not_started`, in the table's column order:
    - *Where it is posted*: the target;
    - *What it says*: GitHub did not start the run's job, and why;
    - *The next GitHub action*: `@sdlc-harness resume` when the engine is recorded, else the **Run workflow** form;
    - *The label it sets*: `sdlc-harness: paused`, or `failed` when no bundle exists and no engine is recorded.

    Name `collect` as its poster.
  - After the table, one sentence: a reply that follows a dispatch carries ` engine=<engine>` in its hidden marker, which is how a run that never started keeps its engine.
- [ ] **`## 8.`** Add two not-verified rows:
  - a dispatcher's comment lands within `DISPATCH_MARKER_SLACK_SECS` (120 s) of the run it dispatched (what rests on it: resuming a never-started run without the form; if wrong: `resume` is refused with the form named, as before);
  - `collect` runs after a `run` job GitHub cancelled before any step, while it gets a runner itself (round 8 observed it once; if wrong: nothing reports such a run, and the labels stay `running`).

  Leave the opening sentence and every existing row as they are. Round 8 moved no row of this table.

**Verification:**

- Grep `docs/github-run-control.md` for `not_started`, `engine=`, `re-run` and `queued or in progress`: each is present.
- The `## 2.` lost-race sentence is still present byte for byte.
- Every quoted reply, refusal and comment sentence matches the literal in `cli/templates/scripts/remote-run.sh`. Grep the template for each quoted string.
- Every link this task adds to `remote-execution.md` names a heading that exists there, including Task 13's `### When GitHub fails or lags`.
