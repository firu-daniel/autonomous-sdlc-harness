## Test gate 11 fails in every implementer run because the retrieval runtime is not installed in the worktree
- **category:** tooling-gap
- **evidence:** every Phase C / C2 `layer-implementer` return that ran `bash scripts/test.sh` this session (dispatches #1, #3, #5, #6, #8, #10) reported gate "11 docs-retrieval relevance floor" failing with `eval: the retrieval runtime is not installed, so the optional peers cannot be loaded; missing: autonomous-sdlc-harness`, thrown by `assertRealModelsAreAvailable` in `evals/docs-retrieval/index-build.mjs`
- **cost this run:** every fix unit shipped with a red configured test command; each implementer had to argue the failure was environmental instead of the gate giving a verdict
- **hypothesis:** the worktree created for the run lacks the optional peer install the main checkout has

## Test gate 6a flagged a gitignored scratch file that no unit of this run wrote
- **category:** silent-failure
- **evidence:** implementer returns #1, #3 and #5 reported gate "6a no machine paths" failing on absolute paths inside `harness-runs/scratch/test_out.txt`, which is gitignored and absent from `git status`; later returns (#6, #8, #10) reported 6a passing with no change to that file by this run
- **cost this run:** three fix units reported a red suite for a file outside the branch diff
- **hypothesis:** gate 6a sweeps untracked ignored scratch output, not only tracked files

## Commands the permission layer refused to agents in this run
- **category:** tooling-gap
- **evidence:** park 2 (`harness-runs/clarifications/feat_run_gates_phase/question_2.md`, consumed this session) records `chmod 755 scripts/run-test-suite.sh` and `git update-index --chmod=+x scripts/run-test-suite.sh` both refused with "This command requires approval" for code-review Finding 6; implementer returns #3 and #8 report `claude plugin validate --strict plugin` refused; implementer return #14 reports `bash -n scripts/run-test-suite.sh` refused
- **cost this run:** one clarification park and a human round-trip for a one-bit mode change; the plugin manifest gate and a shell syntax check went unrun on the units that touched `plugin/` and the wrapper

## Committer `review_item` subjects carry a `Finding K:` lead where the policy designates the description alone
- **category:** agent-contract
- **evidence:** commits 375dbb4, 923ecf1, 8ccb9c7, cb7f7af (code review) and a8c8a89 (skeptic review) have subjects beginning `Finding 6:` / `Finding 5:` / `Finding 4:` / `Finding 3:` / `Finding 1:`, each dispatched with `commit_prefix: none`; 388485c and 99dc080, dispatched identically, do not; `.claude/context/conventions.md` → `## Commit-message policy` designates `none` for the fixing-existing-work class ("the subject is the description alone")
- **cost this run:** 5 of 7 fix commits carry an undesignated subject lead

## An implementer followed the branch's copy of its own agent definition over the loaded one
- **category:** shared-state
- **evidence:** skeptic Finding 1 implementer return (#19) states its loaded `layer-implementer` definition tells it to run both `<test_cmd>` and `<typecheck_cmd>`, while this branch's `plugin/agents/layer-implementer.md` runs only the type check, and that it followed the branch version; the plugin is loaded from the main checkout, which does not carry this branch's Task 6 change
- **cost this run:** that unit skipped the configured test command its loaded contract required; which contract governs a run over a branch that edits the plugin is decided per agent
- **hypothesis:** any branch that edits `plugin/agents/` runs under the main checkout's definitions, and an agent that reads the branch copy may act on either

## The plan needed 6 review rounds; most findings were re-raised rather than net-new
- **category:** optimization
- **evidence:** `harness-runs/task_plan_reviews/feat_run_gates_phase/` holds `review_0.md`–`review_3.md` and `harness-runs/architecture_reviews/feat_run_gates_phase/` holds `review_0.md`–`review_1.md` (6 rounds). By finding title, task-plan-review round 1 vs 0: 3 re-raised, 7 net-new; round 2 vs 1: 7 re-raised, 3 net-new; round 3 vs 2: 9 re-raised, 3 net-new. Architecture-review round 1 vs 0: 1 re-raised, 3 net-new. The log-path branch-segment, Task 2 refusal-cases and `G` / `RG` ledger-paragraph findings appear in all four task-plan-review rounds, and the log-path shape resurfaced as code-review Finding 5
- **cost this run:** 6 plan-review rounds before convergence

## Index-only commit in Phase A
- **category:** optimization
- **evidence:** Task 23 — 54083e0 — "acceptance walk recorded in the story index" (staged only `harness-runs/story_plans/feat_run_gates_phase_story_plan.md` and `harness-runs/task_plans/feat_run_gates_phase/task_23_plan.md`)
- **cost this run:** one unit closed with no work file committed

# User-review fix round 1 — G.4 already-passing close; test-fix-plan-writer shared-cause note

## The writer's lessons-ledger append is outside every commit's explicit path list in the user-review fix-plan fork
- **category:** silent-failure
- **evidence:** after the `user-review-fix-plan-writer` initial-write dispatch (its `## Process` step 6 appends to `harness-runs/lessons.md`), `git status --short` showed ` M harness-runs/lessons.md`; the fork's Override 3 staging list (fix-plan index, source review, per-finding folder, two gate folders) does not name it, and no later step in the fix flow stages it. The orchestrator committed it by a separate wrapper call, dd51ed8 `chore: Record user-review lessons for feat_run_gates_phase`.
- **cost this run:** one extra, off-contract commit; left alone, the tracked tree would have stayed dirty through Phase A and Phase D
- **hypothesis:** (guess) the lessons-ledger write was added to the writer after Override 3's path list was fixed

## `claude plugin validate --strict plugin` refused to the implementer in both Phase A units
- **category:** tooling-gap
- **evidence:** the Item 2 and Item 1 `layer-implementer` returns each report the direct call was refused for approval; Item 2 got the same check indirectly through `bash scripts/test.sh` gate 1a, and Item 1 did not run it (recorded as a deviation in `harness-runs/user_reviews/feat_run_gates_phase_fix_plan/finding_1.md`)
- **cost this run:** Item 1 (11 files, `plugin/` agent + instruction contracts) committed without the manifest gate its finding asked for

## Test gate 11 fails in an implementer run because the retrieval runtime is not installed in the worktree
- **category:** tooling-gap
- **evidence:** Item 2 `layer-implementer` return: `bash scripts/test.sh` 19 gates passed, gate 11 (docs-retrieval relevance floor) failed with "missing: autonomous-sdlc-harness"
- **cost this run:** Item 2 committed with a red test command whose failure is unrelated to the edit
