## Plan-mode architecture-reviewer returned FAIL with must_fix_count 0, forcing a revision round
- **category:** agent-contract
- **evidence:** planning iteration 1, dispatch #5 (`architecture-reviewer`, plan-review mode, `iteration: 0`) returned `verdict: FAIL`, `findings_file: harness-runs/architecture_reviews/fix_phase_g_resume_answer_reads_and_park_loop_window/review_0.md`, `must_fix_count: 0`, with the agent's own note "My contract doesn't say whether findings with zero Must Fix count as a clean review." The planning walker routed that FAIL to a `task-plan-writer` revision (dispatch #6) and an architecture re-review (dispatch #7, PASS).
- **cost this run:** 2 extra planning dispatches (one writer revision, one architecture re-review) for one Should Fix and one Nice to Have.
- **hypothesis:** (guess) the plan-review verdict rule for a findings file holding no Must Fix is unstated in the reviewer's contract.

## task-plan-writer returned a `## Questions` section whose body was "None."
- **category:** agent-contract
- **evidence:** planning dispatch #4 (`task-plan-writer`, revision of `harness-runs/task_plan_reviews/fix_phase_g_resume_answer_reads_and_park_loop_window/review_0.md`) returned a literal `## Questions` heading followed by `None.` beside its `story_file:` summary. The core's outcome table (`plugin/instructions/task_plan_writing_instructions_core.md` → `## The walker`) maps any return carrying a `## Questions` section to `--outcome questions`, which would have parked the run. The orchestrator passed `returned` instead, on its own judgement.
- **cost this run:** none; a strict reading of the outcome table would have produced a spurious park.

## Task 6 layer-implementer reported no tree guard selected for `.md` changes that `**/*.md` covers
- **category:** agent-contract
- **evidence:** the Task 6 return (`general` layer, changed paths `docs/watcher.md`, `docs/remote-execution.md`, `ARCHITECTURE.md`) said "Tree guards: none selected … no `covers` glob matches them", while `harness.config.json` → `treeGuards` carries `{ "test": "test/no-container-home-paths.test.mjs", "covers": "**/*.md" }`. The later Finding 2 unit, also in `docs/watcher.md`, did select and run that guard (1/1 pass), and the Run gates round 1 printed `pass`.
- **cost this run:** one tree guard not run at its unit; caught by nothing until a later unit and Phase G.
