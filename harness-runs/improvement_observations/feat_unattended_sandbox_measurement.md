## A shell syntax check (`bash -n`) is refused in the unattended run, so no unit could parse the shell it wrote
- **category:** tooling-gap
- **evidence:** the orchestrator's own `bash -n scripts/lib/sandbox-probe/session.sh` was refused with "Permission to use Bash has been denied because Claude Code is running in don't ask mode". The same refusal was reported in the returns of the implementers of Tasks 4, 6, 8, 11, 12 and 18, code-review Findings 1, 3, 4, 6 and 7, and skeptic Findings 2, 3 and 4; Task 4's is recorded as an evidence downgrade in `harness-runs/task_plans/feat_unattended_sandbox_measurement/task_4_plan.md`. `bash --version` (Task 6, Task 17) and `printenv HOME` (Phase G test-fix-plan-writer) were refused the same way.
- **cost this run:** `scripts/lib/sandbox-probe/session.sh` (commit 5bf977fa) was committed unparsed and stayed broken through Phases A, A2 and B; the skeptic Finding 4 fix (07387e04) and the shell edits of every code-review and skeptic fix were committed with no parse check.
- **hypothesis:** the implementers who did get a parse result reached `/bin/bash -n` only indirectly, through `scripts/scratch-run.sh` probe files (Tasks 1, 5, 7, 10).

## The probe's test suites pass while the probe library they source fails to parse
- **category:** silent-failure
- **evidence:** Task 13's implementer return reports `sandbox-probe-judge.test.mjs` 29/29 pass and Task 14's reports `sandbox-probe-shell.test.mjs` 12/12 pass, each while sourcing printed `session.sh: line 313: syntax error near unexpected token '<'` on stderr; Task 13 and 14 loosened their stderr assertions to the probe's own lines because of it (their `**Deviations from plan:**` notes). Run gates round 1 failed only on gate 6a and round 2 printed `pass`.
- **cost this run:** no automated gate detects a probe library that does not source; the defect was turned into a finding only at the Phase C2.2 meta-review (`harness-runs/skeptic_review_plan_reviews/feat_unattended_sandbox_measurement/review_0.md`).

## Two end-of-branch reviewers passed over a parse failure the branch's own detail files recorded
- **category:** agent-contract
- **evidence:** `harness-runs/task_plans/feat_unattended_sandbox_measurement/task_5_plan.md`, `task_7_plan.md` and `task_9_plan.md` record the `session.sh` parse failure in their deviation notes, and 13 Phase A / Phase C implementer returns flagged it. The Phase B `branch-reviewer` index (`harness-runs/code_reviews/feat_unattended_sandbox_measurement_code_review.md`, 9 findings) does not raise it, and the first C2.1 `skeptic-reviewer` return listed wiring and the launch line as checks that held. It became skeptic Finding 4 only after the C2.2 meta-review, whose dispatch carried an orchestrator `context_notes:` line naming those three detail files (`harness-runs/dispatch_additions/feat_unattended_sandbox_measurement.md`, key `#66`).
- **cost this run:** two extra C2 rounds (dispatches #67–#70), and the defect's discovery depended on a dispatch addition rather than on a reviewer's own pass.

## Run gates round 1 failed only on a machine path an implementer wrote into a review finding
- **category:** agent-contract
- **evidence:** `harness-runs/test_fix_plans/feat_unattended_sandbox_measurement_task_round_1.md` → Finding 1: gate 6a ("no machine paths") failed on the absolute checkout path the skeptic Finding 4 implementer wrote into its `**Deviations from plan:**` note in `harness-runs/skeptic_reviews/feat_unattended_sandbox_measurement_skeptic_review/finding_4.md`; the log was `harness-runs/test_run_logs/feat_unattended_sandbox_measurement/task_round_1.log`, and fix commit 8f0c2161 replaced it with a placeholder.
- **cost this run:** one extra full gate round and 5 dispatches (#81–#85).

## A plain `rm` of a scratch probe file is refused, so implementers leave probe files behind
- **category:** tooling-gap
- **evidence:** the implementers of Tasks 7, 9, 10 and 19 and code-review Finding 9 each reported their `rm` of a scratch probe refused; `harness-runs/scratch/task19_controls_probe.py`, `rf_syntax.py`, `pf_l2_probe.py`, `pf_session_probe.py`, `legs_protection_probe.py` and `finding9_interim_trap.py` were left in this checkout (git-ignored), and the Finding 9 probe also left an empty fixture directory under the session's temp directory.
- **cost this run:** untracked scratch files accumulate in the run copy; nothing was committed from them.

## The plan needed 6 review rounds across two gates and one operator park
- **category:** optimization
- **evidence:** the plan unit's review roots hold `harness-runs/architecture_reviews/feat_unattended_sandbox_measurement/review_0.md`–`review_2.md` (3 rounds) and `harness-runs/task_plan_reviews/feat_unattended_sandbox_measurement/review_0.md`–`review_2.md` (3 rounds): 6 round artifacts, plus the PASS rounds that wrote no file. The first walk hit the 5-revision cap and parked (`question_1.md`, answered `(a)`); the resumed walk took 2 more writer revisions before both gates passed. The per-round net-new / re-raised split is unmeasurable here: these files carry only `## Must Fix` / `## Should Fix` / `## Nice to Have` section headings and no per-finding heading, and the headings-only read admits nothing else.
- **cost this run:** one operator park and resume, and 6 dispatches in the resumed planning walk (#1–#6 of this session's planning half).

## The conventions document's testing bar lists 9 of the 15 gates this branch now defines
- **category:** tooling-gap
- **evidence:** the `task-plan-writer` returns of this run carried a `## Corpus staleness` section with one `stale-rule` entry: `.claude/context/conventions.md` → `## The testing bar`, the sentence *"The full bar is `docs/development.md` → `## 5. Verifying a change`, whose gates are …"*, names gates 1–9 only, while §5 had fourteen and Task 17 added Gate 15.
- **cost this run:** owes a follow-up restatement — a supervised `/autonomous-sdlc-harness:harness-analyze .claude/context/conventions.md` re-run (answer `skip` for every already-filled document, never `--yes`) or a hand edit pointing the sentence at §5 for the list.
