# Architecture review — iteration 2

The iteration-1 Must Fix is resolved. `task_3_plan.md` → **The header** → `GATE ROUNDS` → **The lane** and **Discovery** now resolve the lane with `hr_test_run_lane_dir "$state_dir" "$branch"`, taking `state_dir` from `hr_state_dir "$top"` as `run-test-suite.sh` does (`state_dir="$(hr_state_dir "$root")"`, then `log_dir="$(hr_test_run_lane_dir "$state_dir" "$branch")"`). Assembling the path from `hr_state_path`, `HR_TEST_RUN_LOG_SUBDIR` and `hr_sanitize_branch` is now forbidden in so many words. `cli/templates/scripts/lib/harness-run-lib.sh` is a comments-only target that names the third caller in `THE RUN GATES LANE`, in `hr_test_run_lane_dir`'s `Callers:` line and in the file header's lane clause. A grep check and a `git diff -U0` comment-only check go with it. `task_6_plan.md` carries the self-adopted `scripts/lib/harness-run-lib.sh` with a `cmp` line. Template and copy are byte-identical today, which I checked with `cmp`, so the whole-file copy carries over only Task 3's edits.

I found no new layer-placement, dependency-direction or test-run-rule violation in Tasks 1–7. Every new test is the task's own file and reads one fixed file, so none is a tree guard.

## Must Fix

None.

## Should Fix

1. **(Re-raised a second time: not applied in iteration 1 or iteration 2, and not recorded under `## Rejected findings`.) A shipped template still cites files that exist only in this repository** — `task_1_plan.md` → **The header**, the bullet *"Say this is the only mode that reads Run gates records, and that it reads the formats `scripts/lib/gate-round-lib.sh` → `THE RECORDS` and `scripts/lib/test-timing-reporter.mjs` → `THE RECORD` define, without changing them."* This bullet is unchanged since iteration 0.
   Rule sources:
   - `.claude/context/cli.md` → `## What this layer owns, and what it is not` → *"Settle which audience a file serves before editing it. … `cli/templates` and `cli/scripts` change what a future adopter receives"*.
   - `harness-runs/lessons.md` → *Unattended control loops* → *"In a revision round, a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason. It is never held for a go-ahead the loop does not relay."*

   `cli/templates/scripts/lib/run-analytics.jq` is written into every adopting repository. Neither cited file ships under `cli/templates` or `cli/src`. So in an adopter's checkout the header would name two files that do not exist as the owners of the format this mode validates. The story index's own reasoning rests on the shipped `run-test-suite.sh` → `WHAT A GATE IS TOLD` instead.
   **Fix:** In `task_1_plan.md` → **The header**, replace that bullet with this. The template header states the accepted record shapes itself, as the reader's contract; the **Validation** bullets already list them in full. It cites `run-test-suite.sh` → `WHAT A GATE IS TOLD` as the shipped allowance for a gate to write `<label>.<suffix>` records. It names this repository's producers only as the current writers of those shapes, never as the format's owners, for example *"in the harness's own repository, `scripts/lib/gate-round-lib.sh` and `scripts/lib/test-timing-reporter.mjs` write them"*. Add a matching **Verification:** text check: the template header names neither file as the owner of the format. If the writer rejects this finding, record it under a `## Rejected findings` section of the story index with the reason. Leaving it unaddressed for a third round breaks the ledger rule above.

## Nice to Have

None.
