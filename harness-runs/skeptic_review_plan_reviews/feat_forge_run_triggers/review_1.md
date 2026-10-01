# Review plan meta-review — iteration 1

## Must Fix
1. **The diff exhibits the `## Unattended control loops` lesson categories and the review neither raises a finding nor gives a clean pass for them.** This refers to "Structure" (a missed check). The offending file is the index, `harness-runs/skeptic_reviews/feat_forge_run_triggers_skeptic_review.md`.
   The branch adds a new unattended path, the `harness-trigger.yml` job running `remote-run.sh trigger`, and that path carries an automatic retry with new timing constants:
   - `cli/templates/scripts/remote-run.sh` → `trigger_run_url` loops on `gh run list` up to `TRIGGER_RUN_LOOKUP_TRIES=6` times, `sleep`ing `TRIGGER_LOOKUP_SECS_DEFAULT=5` (overridable by `HARNESS_TRIGGER_LOOKUP_SECS`) between tries;
   - `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_derive_branch` retries candidate names up to `HR_BRANCH_SUFFIX_MAX=99`.

   `adopt` also brings in runs whose `harness-state` artifact may already have expired. These are exactly the classes `harness-runs/lessons.md` → `## Unattended control loops` records: every automatic retry is bounded and ends in one notification naming the manual way on, and state in an expiring store is reported as expired and never treated as absent. The index's only mention of the ledger is in `**De-duplicated against:**`: "nothing below is a `harness-runs/lessons.md` entry". That says no finding repeats a lesson. It is not a check that the diff honours the lessons it exhibits. No `**Verified and not raised:**` bullet covers them, and no finding does either.
   Spot-checking shows they hold. `trigger_run_url` is bounded and falls back to the branch's filtered run-list URL. `hr_derive_branch` returns 3 once the suffix cap is reached. `adopt_one` runs `sync`, whose case 2 (`sync_expired`) writes `paused` / `expired`. So this Must Fix asks for the missing rationale, not for a code change.
   **Fix:** In the index, under `## Context` → `**Verified and not raised:**`, add one bullet for the `harness-runs/lessons.md` categories the diff exhibits. Have it state, from a first-hand read, that the following hold:
   - `trigger_run_url`'s lookup retry is bounded by `TRIGGER_RUN_LOOKUP_TRIES` and ends in the filtered run-list URL, not a failure;
   - `hr_derive_branch`'s suffix loop is bounded by `HR_BRANCH_SUFFIX_MAX` and its exhaustion reaches the issue as a comment;
   - a run adopted with an expired bundle is recorded `paused` / `expired` through `sync` case 2, not as a fresh or absent run.

   If any of them does not hold, raise it instead as a new `finding_4.md` in `harness-runs/skeptic_reviews/feat_forge_run_triggers_skeptic_review/`. Give it a site anchor, a `### 4. Title` pointer under the right severity section and a readiness entry tagged `_(layer: cli)_`.
