# User-Review Fix Plan: feat_forge_run_control

## Context

**Branch:** `feat_forge_run_control`
**Source user review:** `harness-runs/user_reviews/feat_forge_run_control_review_2.md`
**Summary:** The user flagged three things in round 2:

1. A review round drops the summary text of *Comment* and *Approve* reviews.
2. Four rows of `docs/github-run-control.md` §8 are still marked unverified, though each has since been checked.
3. Gate 12 (xiv) has a two-account review step that will not be run. It also still plans for the pull request's author to review.

All three observations are valid, and each becomes one fix.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom. The committing role flips each one to `[x]` as that fix's commit lands, and only that role flips a marker. `[ ]` markers anywhere else, including sub-step bullets inside the per-finding files, are informational only. They are never the iteration source, and the committer does not touch them.

Each entry resolves to a self-contained `harness-runs/user_reviews/feat_forge_run_control_fix_plan_2/finding_<K>.md` through its `**Finding K**` reference, one-to-one with the `### K. <title>` pointers below. The list is sorted from lowest blast radius to the widest change. Findings 2 and 3 both edit Gate 12 (xiv)'s **What it settles.** paragraph in `docs/development.md`, so Finding 2 comes first.

1. [x] **Finding 2** — Record the evidence for the four §8 rows of `docs/github-run-control.md` and the decision not to use `queue: max`, with its one consequence. Drop those rows from Gate 12's **What it settles.** _(layer: general)_
2. [ ] **Finding 3** — Replace Gate 12 (xiv)'s two-account review step with a one-account pending-reviews step. State that the reviewing account must not be the pull request's author. _(layer: general)_
3. [ ] **Finding 1** — Keep the summary body of every review from an authorised reviewer, whatever its state. Record its id, and name its state in the provenance line. A *Comment* or *Approve* review still starts no round. Update the fix-plan writer and §2 of `docs/github-run-control.md` to match. _(layer: cli, plugin, general)_

---

## Must Fix

### 1. A "Comment" or "Approve" review's summary text is dropped from the round
→ [finding_1.md](feat_forge_run_control_fix_plan_2/finding_1.md)

### 3. Gate 12 (xiv)'s two-account review step cannot be run, and leg (e) still plans a review leg from the pull request's author
→ [finding_3.md](feat_forge_run_control_fix_plan_2/finding_3.md)

---

## Should Fix

### 2. Four rows of `github-run-control.md` §8 still read "not retrieved here", though each has been checked
→ [finding_2.md](feat_forge_run_control_fix_plan_2/finding_2.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK

No observation was invalid. Three interpretation notes, so the user can check this plan's reading of the review:

- **Observation 1, "Skip a review whose body is empty."** This plan applies the skip to reviews that ride along (*Comment*, *Approve*, dismissed). A review requesting changes with an empty body is still written as `(The review carries no summary.)`, as it is today. That review is what starts the round, and its draft inline comments are kept through its id. The fix-plan writer already treats that placeholder as no observation. A draft review in the `PENDING` state is never taken, because it has not been submitted.
- **Observation 1, "naming the review's state."** The `## Review by @<login>` heading stays the same for every state, so the fix-plan writer's parsing does not change. The state is named in the section's closing provenance line instead: `Requested changes on`, `Commented on`, `Approved`, or `Reviewed … dismissed`.
- **Observation 3, the §8 row "A pull request's author cannot request changes on their own pull request".** Finding 3 removes the Gate 12 clause that settled this row through leg (e) run as the author, because that leg can no longer be run. The row in `docs/github-run-control.md` §8 is left unchanged, because the review gives no source for GitHub's rule. Supplying a source would be a separate edit.

---

## Source observations

Verbatim copy of `harness-runs/user_reviews/feat_forge_run_control_review_2.md`, so this fix plan is self-contained.

1. A pull-request review submitted as "Comment" or "Approve" has its inline comments collected into the next round, but its summary text is dropped: `round_collect` keeps a review's body only when its state is `changes_requested`. A reviewer who writes their feedback in the summary of a "Comment" review loses it silently. Keep the body of every review, whatever its state, from an authorised reviewer since the previous round, record its id in the round marker so it is never taken twice, and attribute it as the `## Review by @<login>` sections are (naming the review's state). As with inline comments today, a "Comment" or "Approve" review does not start a round on its own; it rides along in the next round that a review requesting changes starts. Skip a review whose body is empty. Update the fix-plan writer's reading of the round shape and `docs/github-run-control.md` §2 to match.

2. `docs/github-run-control.md` §8 records four rows as unverified ("not retrieved here"), but each has since been checked:
- *A concurrency group spans workflows in one repository*: confirmed by GitHub's concurrency documentation (docs.github.com, "Control the concurrency of workflows and jobs"): "concurrency group names must be unique across workflows to avoid canceling in-progress jobs or runs from other workflows".
- *An artifact uploaded by a job is listable before its workflow run completes*: confirmed by GitHub's changelog of 2023-12-14, "GitHub Actions – Artifacts v4 is now generally available": "This allows the artifact to become immediately available to download from the API after being uploaded, which was not possible before." The Artifacts REST reference is silent on it.
- *The jobs API names a job with no `name:` key by its key*: GitHub's documentation is silent. It was observed on `firu-daniel/harness-gate12`: the jobs API for run 36833810996 of `harness-run.yml` answers `run` and `warm`, and neither job carries a `name:` key.
- *`concurrency: queue: max`*: verified in GitHub's workflow syntax reference (`concurrency.queue`: `single` is the default, keeping at most one pending run that a newer one cancels and replaces; `max` keeps up to 100 pending runs, cancelling any beyond that, and cannot be combined with `cancel-in-progress: true`) and in the changelog of 2026-05-07. It is deliberately not used: 100 pending jobs is still a hard limit, and the end-of-run `collect` job needs no queue. State that decision and its reason in the row, and the one consequence of keeping the default `single` queue on `harness-review-<branch>`: when three or more reviews land while a review job is running, a pending review job can be replaced, and that reviewer's review is still collected but gets no reply.
Update each row's source and status, and `docs/development.md` → Gate 12 → **What it settles.** wherever it lists these rows as still to be settled.

3. Gate 12 (xiv)'s new step asks a second account with write access to submit a review requesting changes at the same moment as the first. We will not test the two-user scenario. GitHub also never lets a pull request's author approve or request changes on it, and the harness's draft pull request is authored by the owner of `HARNESS_GIT_TOKEN` (else `github-actions[bot]`), so the account that owns that token cannot run any review leg. Replace that step with a one-account pending-reviews step: from one account with write access that is not the pull request's author, submit a review requesting changes; while the round it starts is running, submit a second and then, back to back, a third and a fourth. It passes when no review is refused, each review job that ran replied "collected" (a replaced pending review job may post no reply, which is recorded, not failed), no second round commit appears while the first round runs, and once it completes the `collect` job places one round carrying the bodies of all three later reviews and the next `harness run` run follows. State in leg (e)/(f)'s setup that the reviewing account must not be the pull request's author.
