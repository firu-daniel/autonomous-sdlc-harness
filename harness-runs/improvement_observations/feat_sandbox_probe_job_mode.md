## Code-review fix entries tagged `(layer: cli, general)` ran the cli layer first although its step depended on the general layer's change
- **category:** agent-contract
- **evidence:** In `harness-runs/code_reviews/feat_sandbox_probe_job_mode_code_review.md`, Findings 5, 6, 3, 1 and 2 are tagged `_(layer: cli, general)_`, so the unit loop dispatched the `cli` layer first. Dispatches #62 (Finding 5) and #65 (Finding 6) returned unmarked blockers and made no edit. #62's reason was that the root `package-lock.json` is outside the `cli` path. #65's reason was that steps 1–4 edit `scripts/lib/sandbox-probe/*.sh` and that step 5's test needs `sp__linux_refusal_names`, which step 1 defines. Dispatches #68, #71 and #74 each wrote only that finding's test and reported it red until the `general` dispatch landed the code. The orchestrator recorded an ask-vs-assume assumption and continued to the `general` layer for #62/#65 (`harness-runs/dispatch_additions/feat_sandbox_probe_job_mode.md`).
- **cost this run:** 2 dispatches produced nothing (#62, #65); 3 more left their unit's tests red between layers (#68, #71, #74).
- **hypothesis:** (a guess) the tag order put `cli` first where the fix's dependency ran the other way.

## A unit was committed with its own test known red, and Phase G spent a gate round on it
- **category:** flow-efficiency
- **evidence:** Code-review Finding 2's `general` dispatch (#75) reported `cli/test/sandbox-probe-job-launch.test.mjs` at 18/20, because the fixture written by the earlier `cli` dispatch (#74) planted a writable placeholder. The return carried no blocker line, and `<per_unit_review>` is `off`, so the unit committed as `54ee7957`. Run gates round 1 failed on exactly that subtest (`harness-runs/test_run_logs/feat_sandbox_probe_job_mode/task_round_1.log`, `harness-runs/test_fix_plans/feat_sandbox_probe_job_mode_task_round_1.md`). The fix `de22c99d` then made round 2 pass.
- **cost this run:** one extra gate round (two full-suite runs instead of one), plus 5 dispatches (#78–#82).

## Implementers' by-hand verification commands were refused under the unattended profile
- **category:** tooling-gap
- **evidence:** Several implementer returns record the plan's by-hand `bash -c '…'` check, or a plain `bash -n <file>`, as refused with `Permission to use Bash has been denied because Claude Code is running in don't ask mode.`:
  - Task 6 (#11) and Task 3 (#5) left the check unrun and recorded an evidence downgrade.
  - Task 2 (#3) also left its parse unrun.
  - Tasks 1, 4, 7, 12 and 13 (#1, #7, #13, #23, #25) routed their checks through `scripts/scratch-run.sh` instead.
  - Task 11 (#21) and architecture fix #72 relied on the typecheck's shell-parse step in place of `bash -n`.

  Separately, `rm` of the scratch probes was refused for Tasks 1, 4, 10, 14 and 15 (#1, #7, #19, #27, #29), so they remain under `harness-runs/scratch/` (git-ignored).
- **cost this run:** at least 3 tasks (2, 3, 6) shipped a plan-specified check unrun, verified only by reading the code.

## Plan-stage Should Fix items were never applied, and one came back as a code-review finding
- **category:** agent-contract
- **evidence:** In revision mode, `task-plan-writer` applied only Must Fix. Its returns at planning #6 and #9 each named the open Should Fix items and said the orchestrator would have to ask for them; the dispatch-discipline policy bars the orchestrator from adding that request. The plan-stage architecture Should Fix (`harness-runs/architecture_reviews/feat_sandbox_probe_job_mode/review_0.md`) was that `js-yaml` is undeclared in `cli/package.json`. It survived planning and implementation and was raised again as code-review Finding 5, fixed by `ad15f0af`. The writer also reported stray `</content>` / `</invoke>` lines at the end of every plan file, raised twice and left in place.
- **cost this run:** one code-review fix unit (3 dispatches: #62, #63, #64) for an item the plan stage had already found.

## The plan needed 3 review rounds (optimization: convergence churn)
- **category:** optimization
- **evidence:** There are 3 round artifacts across the plan unit's roots: `harness-runs/architecture_reviews/feat_sandbox_probe_job_mode/review_0.md`, plus `harness-runs/task_plan_reviews/feat_sandbox_probe_job_mode/review_0.md` and `review_1.md`. The business-parity root is absent (`phases.parity` is false). The net-new vs re-raised split could not be established: both task-plan review files carry only the section headings `## Must Fix` / `## Should Fix` / `## Nice to Have`, with no per-finding headings to match across rounds.
- **cost this run:** 3 writer revisions (planning #3, #6, #9) before convergence.
