# User-Review Fix Plan: feat_forge_run_control

## Context

**Branch:** `feat_forge_run_control`
**Source user review:** `harness-runs/user_reviews/feat_forge_run_control_review.md`
**Summary:** The user flagged three connected defects in pull-request review rounds on GitHub, plus an out-of-scope boundary and an open question:

1. A review requesting changes is refused while a run is in flight, and the reviewer must resubmit.
2. A round collects only the submitting reviewer's body and comments.
3. Nothing starts the next round when a run finishes.

All three are valid. They become four fixes: one per observation, and one for the design of record. The design-of-record fix also records this plan's decision on the push-race question.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom. The committing role flips each one to `[x]` as that fix's commit lands, and only that role flips a marker. `[ ]` markers anywhere else, including sub-step bullets inside the per-finding files, are informational only: they are never the iteration source, and the committer does not touch them.

Each entry resolves to a self-contained `harness-runs/user_reviews/feat_forge_run_control_fix_plan/finding_<K>.md` through its `**Finding K**` reference, one-to-one with the `### K. <title>` pointers below. The list is sorted from lowest blast radius to the widest change. Finding 2's collector comes first, because Findings 1 and 3 both call it. Finding 1's settledness test and serialization come next, because Finding 3 reuses both.

1. [ ] **Finding 2** — Collect every review requesting changes and every inline comment from all authorised reviewers since the previous round, deduplicated by ids recorded in a round marker. Update the fix-plan writer's reading of the round shape. _(layer: cli, plugin)_
2. [ ] **Finding 1** — Accept and acknowledge a review while a run is in flight, never refusing it. Add a shared settledness test at `run`-job granularity, serialize review jobs per branch, and have `review` wait for its dispatch to be listed. _(layer: cli)_
3. [ ] **Finding 3** — Add a `collect` verb and a `collect` job in `harness-run.yml` that start the next round automatically when a run ends with collected reviews. _(layer: cli)_
4. [ ] **Finding 4** — Bring `docs/github-run-control.md` and Gate 12 (xiv) in line with Findings 1–3, and record the no-retry decision on lost pushes. _(layer: general)_

---

## Must Fix

### 1. A review requesting changes is refused while a run is in flight, and the reviewer is told to resubmit
→ [finding_1.md](feat_forge_run_control_fix_plan/finding_1.md)

### 2. A round collects only the submitting reviewer's review and comments, so other reviewers' input and refused reviews are lost
→ [finding_2.md](feat_forge_run_control_fix_plan/finding_2.md)

### 3. Reviews collected during a run never start the next round on their own
→ [finding_3.md](feat_forge_run_control_fix_plan/finding_3.md)

### 4. The design of record still says a review in flight is refused and must be resubmitted, and the push-race question is undecided
→ [finding_4.md](feat_forge_run_control_fix_plan/finding_4.md)

---

## Should Fix

None.

---

## Nice to Have

None.

---

## Out of scope / verified-OK

No observation was invalid. Two notes on the parts of the review that are not observations to fix:

- **"Not in scope: delivering new reviews into a run that is already in flight."** This is honoured. No finding touches a run in flight. A review arriving during a run is only acknowledged and listed, and it reaches the flow only as the next round's file, placed after the run's `run` job has completed (Finding 1, item 2; Finding 3).
- **Observation 2, the outdated-comment clause.** Verified as already implemented. Read `cli/templates/scripts/remote-run.sh` (`control_review_round`), at "original line \(.original_line) (outdated)": a comment whose `line` is null is headed with its original line and `(outdated)`, `Made on commit` uses `original_commit_id // commit_id`, and the `diff_hunk` is fenced. `cli/test/remote-control-review.test.mjs` asserts this (`an outdated comment reads original line <n> (outdated)`). Finding 2 keeps this rendering unchanged and extends it to every reviewer's comments.
- **Observation 3, `concurrency: queue: max`.** Not verified by this writer, because no retrieval of GitHub's documentation was available in this session. As the user directed, nothing relies on it: Finding 3 takes the user's stated alternative, a collection at the end of the run. Finding 4 records the claim as unverified in `docs/github-run-control.md` §8.

---

## Source observations

Verbatim copy of `harness-runs/user_reviews/feat_forge_run_control_review.md`, so this fix plan is self-contained.

1. A pull-request review that requests changes while a run of the branch is in flight is refused, and the reviewer is told to submit it again once the run finishes. In a team, several members review the same pull request, and having their review refused is frustrating: they have to notice when the run finishes (often 2–3 hours later) and resubmit by hand. Change this so a review requesting changes is never refused because a run is in flight. Accept it immediately and reply on the pull request that it has been collected and will be part of the next user-review round, instead of asking the reviewer to resubmit. Nothing a reviewer submitted may be lost.

2. A round takes only the body of the review that started it, plus that one reviewer's inline comments (`control_review_round` filters on the submitting actor). A refused review's body is lost, and inline comments by other reviewers are left out unless each of them resubmits. Change round collection so that when a round starts, it gathers every review requesting changes, and every inline comment, from all authorised reviewers since the previous round was committed. Include each review's body (attributed to its reviewer) as well as its inline comments, so several reviews submitted while a run was in flight become one round. Mark inline comments made against code that has since moved as outdated, keeping their original line, commit and diff hunk, so the fix-plan writer can find where the code went. This also covers two reviews submitted at the same moment: one round collects both, instead of two jobs racing to push rounds with the same number.

3. When a run (including a user-review round) finishes and reviews requesting changes arrived while it was running, start the next user-review round from them automatically, without anyone resubmitting. A reviewer should wait for at most the run in flight, not for a resubmission. A pending round must not be cancelled by a newer one: GitHub Actions reportedly added `concurrency: { queue: max }` on 2026-05-07, which keeps up to 100 pending runs in order instead of replacing the single pending one. That was the documented reason for refusing rather than queueing (`docs/github-run-control.md` §1 and the row in §8). Verify this against GitHub's own documentation before relying on it; a check at the end of the run that collects pending reviews is an alternative.

Not in scope: delivering new reviews into a run that is already in flight (for example, at checkpoints between tasks). A round's fixes are planned first, and the plan verifies each claim and can reject an issue, so input arriving after planning has started must wait for the next round.

Open question for the fix plan to decide: whether pushes from the control job and the run should fetch, rebase and retry when a push loses a race. Decide whether it is needed once steps 1–3 ensure only one writer is active on the branch at a time, and what it could break.
