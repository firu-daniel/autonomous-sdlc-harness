## `jq` and `cp` invocations refused inside implementer and reviewer dispatches
- **category:** tooling-gap
- **evidence:** from the sub-agents' own returns this session: the Task 1 `layer-implementer` reported "a direct `jq` call from Bash was refused in this session"; the Task 2 `layer-implementer` reported both `jq -r -f <program> --arg mode markdown harness-runs/run_analytics/feat_gate_timings_failed_first/run-analytics.json` runs refused with "Permission to use Bash has been denied because Claude Code is running in don't ask mode"; the Task 6 `layer-implementer` and the code-review Finding 2 `cli` `layer-implementer` each reported a plain template-to-copy `cp` refused; the Phase C2 `skeptic-reviewer` reported its runs of the script and the jq programs against a sample input denied.
- **cost this run:** Task 2's planned schema-1 old-vs-new byte comparison of `cli/templates/scripts/lib/run-analytics-report.jq` was never executed (recorded as an evidence downgrade in `harness-runs/task_plans/feat_run_analytics_gate_timings/task_2_plan.md`); the skeptic review rests on reading only; two byte-for-byte copies were made by hand-applied edits and checked by `cmp`.
- **hypothesis:** the unattended profile allows `jq` only through the shipped wrappers and has no entry for a bare `cp`.

## Every Bash call refused for one whole implementer dispatch
- **category:** tooling-gap
- **evidence:** the code-review Finding 2 `general` `layer-implementer` dispatch (heartbeat `[C · Item 2 · general · iter 0] → layer-implementer  (#22)`) returned "this agent's Bash calls are being refused"; `bash scripts/typecheck.sh` and its fallback were not run, and the `cmp` of `cli/templates/state-dir/run_analytics/README.md` against `harness-runs/run_analytics/README.md` was not re-run. The dispatches before and after it (#21, #24, #25) ran `bash scripts/typecheck.sh` successfully.
- **cost this run:** one unit committed with its type check recorded as not run; whole-tree type check left to the Run gates round, which passed.

## The run copy has no local `<default_branch>` ref, so `dev..HEAD` ranges fail
- **category:** agent-contract
- **evidence:** the Phase B `branch-reviewer` ("This run copy has no local `dev` branch, so I diffed against `origin/dev...HEAD`"), the B.2 `review-plan-reviewer`, and the D.1 `statistics-plan-writer` ("`git log dev..HEAD` failed. I ran the disposition check over `origin/dev..HEAD` instead") each fell back to `origin/dev`; the Phase A2 and C2 dispatches were given `diff_base: dev`.
- **cost this run:** three agents each re-derived the base on their own; no wrong output observed.
- **hypothesis:** the run copy is a clone carrying only the remote-tracking `origin/dev`.

## A multi-layer finding's second-layer dispatch had nothing left to do
- **category:** flow-efficiency
- **evidence:** code-review Finding 2 is tagged `_(layer: cli, general)_` in `harness-runs/code_reviews/feat_run_analytics_gate_timings_code_review.md`. The `cli` dispatch (#21) also edited the `general`-layer path `harness-runs/run_analytics/README.md`, reporting it was "outside the `cli/` path I was dispatched with"; the `general` dispatch (#22) then returned "Finding 2's fix was already in both READMEs when I started". Finding 3 (`cli, plugin`), by contrast, was split cleanly: each dispatch edited only its own layer.
- **cost this run:** one implementer dispatch produced no change.

## Plan convergence needed 8 review-round artifacts across a park
- **category:** optimization
- **evidence:** the plan unit's roots `harness-runs/architecture_reviews/feat_run_analytics_gate_timings/` (`review_0`–`review_3`) and `harness-runs/task_plan_reviews/feat_run_analytics_gate_timings/` (`review_0`–`review_3`) hold 8 FAIL artifacts, plus PASS rounds that wrote no file. Per round, by finding title, against the same root's predecessor — architecture: r0 3 findings; r1 1 net-new, 1 re-raised; r2 0 net-new, 1 re-raised; r3 1 net-new. Task-plan: r0 4 findings; r1 3 net-new, 1 re-raised; r2 3 net-new, 0 re-raised; r3 1 net-new, 2 re-raised. The loop hit its 5-revision cap and parked (`harness-runs/clarifications/feat_run_analytics_gate_timings/question_1.md`) before this session resumed it.
- **cost this run:** one park-and-resume cycle; 11 planning dispatches this session after the resume.

## The same defect class hit 4 review units
- **category:** optimization
- **evidence:** all three findings of `harness-runs/code_reviews/feat_run_analytics_gate_timings_code_review.md` (Findings 1–3) and Finding 1 of `harness-runs/skeptic_reviews/feat_run_analytics_gate_timings_skeptic_review.md` are prose or comments that this branch's own changes left out of date: the `branch-reviewer`'s return ("All three are prose or comments that the branch's changes left out of date") and the skeptic finding's title ("a header label this branch renamed"). Citing reviewers: `branch-reviewer`, `skeptic-reviewer`.
- **cost this run:** four fix units in Phases C and C2.

## Three end-of-branch reviewers produced no change
- **category:** optimization
- **evidence:** the Phase A2 `architecture-reviewer`, the B.2 `review-plan-reviewer` and the C2.2 `review-plan-reviewer` each ran on their one unit and returned `verdict: PASS` with no file written (no `harness-runs/architecture_branch_reviews/feat_run_analytics_gate_timings_arch_review.md`, `harness-runs/review_plan_reviews/feat_run_analytics_gate_timings/` or `harness-runs/skeptic_review_plan_reviews/feat_run_analytics_gate_timings/` exists).
- **cost this run:** 3 dispatches with no resulting change.
