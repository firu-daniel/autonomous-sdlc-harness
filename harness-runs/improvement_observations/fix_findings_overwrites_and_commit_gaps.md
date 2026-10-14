## Plan convergence needed 4 review rounds across two gates
- **category:** optimization
- **evidence:** the plan unit's round artifacts total 4 — `harness-runs/architecture_reviews/fix_findings_overwrites_and_commit_gaps/review_0.md`, `review_1.md` (then a PASS at index 2 that wrote no file, twice) and `harness-runs/task_plan_reviews/fix_findings_overwrites_and_commit_gaps/review_0.md`, `review_1.md` (then a PASS at index 2). Architecture round 1 vs round 0, per the writer's iteration-2 return: 1 net-new Must Fix (Task 13), 2 Should Fix re-raised from round 0 (Tasks 9 and 10) and never applied because revision mode applies Must Fix only. Task-plan round 1 vs round 0: net-new/re-raised split unmeasurable — neither file carries per-finding headings, only the three severity headings.
- **cost this run:** 13 planning dispatches before convergence (5 `task-plan-writer`, 5 `architecture-reviewer`, 3 `task-plan-reviewer`), per `harness-runs/.dispatch_counter` at convergence
- **hypothesis:** (guess) Should Fix items that are re-raised every round but never applied by revision mode add a round's worth of reviewer reading without changing the plan.

## The planner flagged a stale fixed-subject list in the general conventions document
- **category:** tooling-gap
- **evidence:** the `task-plan-writer`'s first return carried a `## Corpus staleness` section with one `stale-rule` entry: `.claude/context/conventions.md` → `## Commit-message policy` → **Fixed-form subjects** — this branch's Task 4 adds the fixed subject `chore: Record lessons for <branch>` (home: `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 5`), so the list stops being the complete set its **Provenance** paragraph claims. Task 4's implementer independently flagged the same gap in its return.
- **cost this run:** none on this branch; owes a follow-up restatement adding `- chore: Record lessons for <branch>` to that list — a hand edit, or a supervised `/autonomous-sdlc-harness:harness-analyze` run over the `general` layer's conventions document answered `skip` for every other already-filled document.

## Row A's branch-name commit prefix is outside this repository's commit-prefix vocabulary
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` → `## Substitution table` row `A`'s `commit_prefix rule` maps `fix_` → `fix`, so Tasks 1–8 were dispatched with `commit_prefix: fix` and landed as `fix: …` (49887141, 71a716e4, 19fb60d3, 732a9361, a22b6a44, 977d20f1, ddd83475, 0e7a980b). `.claude/context/conventions.md` → `## Commit-message policy` designates `none` for a story-task commit and names `chore` as the only prefix token in use; `plugin/agents/committer.md` → `## Invocation contract` says a token outside that policy "is not a legal value". The Task 8 committer return flagged the conflict; Tasks 9–17 and every fix row were then dispatched with `commit_prefix: none`.
- **cost this run:** 8 commits on the branch carry a prefix the repository policy does not allow; the branch's commit subjects are inconsistent (8 with `fix:`, the rest unprefixed)
- **hypothesis:** (guess) the row-A rule predates the per-class designation the fix rows already read from `<commit_conventions>`.

## The plugin layer's manifest gate could not run inside implementer dispatches
- **category:** tooling-gap
- **evidence:** the Task 7 and Task 15 `layer-implementer` returns each report that `claude plugin validate --strict plugin` needed an approval that was not given, so the gate was not run for either unit.
- **cost this run:** plugin units shipped without the layer's manifest check; Phase G's whole-tree gates were the only verification

## Gate 13's Python legs were BLOCKED in both Run gates rounds
- **category:** tooling-gap
- **evidence:** `harness-runs/test_run_logs/fix_findings_overwrites_and_commit_gaps/task_round_1.log` and `task_round_2.log` both report `BLOCKED 13a Python lint`, `13b Python typecheck`, `13c Python tests` — "uv or the synced Python environment is missing; run bash scripts/python-service.sh sync"; the wrapper still printed `pass` on round 2.
- **cost this run:** Phase G passed with the Python service's lint, type check and tests unrun

## The default branch fails gate 6d, which cost this branch a Run gates round
- **category:** silent-failure
- **evidence:** round 1 (`harness-runs/test_run_logs/fix_findings_overwrites_and_commit_gaps/task_round_1.log`) failed only gate 6d on 25 bare `/branch-*` spellings in `docs/work-report-research/`, which the `test-fix-plan-writer` traced to `dev`'s #98 meeting the spelling check from #7 — none of the sites were touched by this branch's tasks. Fixed on this branch by e9dde72e (test fix plan `harness-runs/test_fix_plans/fix_findings_overwrites_and_commit_gaps_task_round_1.md`).
- **cost this run:** one extra gate round and 4 dispatches (writer, architecture gate, implementer, committer) spent on files outside the task's scope; the branch diff now carries 12 unrelated docs edits

## The task-plan writer could not run its scope-register checks together
- **category:** tooling-gap
- **evidence:** the `task-plan-writer`'s iteration-4 return reports that "a shell guard blocked running them together", so register checks E1, E1b, E1m, E2, E4, E5 and the E6 walk were not re-run on that revision; only E3 was.
- **cost this run:** the final plan revision's scope register was re-verified on one of its seven checks
