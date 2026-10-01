## The plan needed 6 review rounds across two gates before it converged
- **category:** optimization
- **evidence:** round artifacts on disk: `harness-runs/task_plan_reviews/feat_docs_retrieval_backend_selection/review_0.md`–`review_3.md` (4 FAIL rounds) and `harness-runs/architecture_reviews/feat_docs_retrieval_backend_selection/review_0.md`–`review_1.md` (2 FAIL rounds); the final revision passed both gates without writing a file. Per round, finding titles diffed against the same root's predecessor — task-plan-reviewer: review_1 3 net-new / 3 re-raised, review_2 2 net-new / 3 re-raised, review_3 2 net-new / 4 re-raised (the re-raised ones are the same Should Fix / Nice to Have items: the forward-link window, `task_4_plan.md`'s two iteration-0 Should Fix items, `task_15_plan.md`'s Verification bullet); architecture-reviewer: review_1 3 net-new / 1 re-raised. The loop hit the 5-revision cap and parked (`harness-runs/clarifications/feat_docs_retrieval_backend_selection/question_1.md`); this session resumed it with the operator's ruling, and the plan converged on the first resumed revision plus one more.
- **cost this run:** one park and an operator ruling; 6 plan-review rounds before implementation started.
- **hypothesis:** guess only — the Should Fix items carried unresolved from round to round kept every round's findings list long, even though only the Must Fix items blocked.

## The same finding class — a literal or rule copied outside its owning module without a declared mirror — hit 4 units
- **category:** optimization
- **evidence:** finding titles in this run's review indices: the plan (architecture-reviewer, `harness-runs/architecture_reviews/feat_docs_retrieval_backend_selection/review_1.md`, both Must Fix: Task 7 retypes the console-script name, Task 5 spells `fetch-models`); Task 1's `cli/src/config/model.ts` and Task 2's `cli/src/retrieval/pythonBackend.ts` (architecture-reviewer, `harness-runs/architecture_branch_reviews/feat_docs_retrieval_backend_selection_arch_review.md` Findings 1 and 2); Task 5's `cli/src/doctor/checks.ts` (branch-reviewer, `harness-runs/code_reviews/feat_docs_retrieval_backend_selection_code_review.md` Finding 5).
- **cost this run:** 2 Must Fix at plan time (part of the park), 3 fix units after Phase A.

## Story-task commits took the branch-name prefix `feat:`, which this repository's commit policy designates `none` for
- **category:** agent-contract
- **evidence:** `git log --format='%h %s' dev..HEAD` shows 15 subjects beginning `feat: ` — the 15 Task commits (e.g. `38932c5 feat: Add docs.retrievalBackend to config model and check (Task 1)`). The orchestrator passed `commit_prefix: feat` per `plugin/instructions/unit_loop_core.md` → `## Substitution table` row `A`'s `commit_prefix rule` (from the branch name, `feat_` → `feat`), which `plugin/agents/committer.md` names as the closed source for a story task. `.claude/context/conventions.md` → `## Commit-message policy` designates `none` for the class **Adding new work — a story task's commit**. The B.2 `review-plan-reviewer` return noted the mismatch; the fix rows, which read the designation, produced conforming subjects.
- **cost this run:** 15 pushed commits whose subjects break the project's commit policy; they cannot be rewritten in an unattended run.

## Implementers' verification commands were refused by the permission profile
- **category:** tooling-gap
- **evidence:** implementer returns: Task 3 and Task 4 — `bash -n` on the run library and on the launcher template refused, syntax resting on the test run instead; Task 8 — `npx ajv test …` refused ("This command requires approval"), replaced by a scratch script through `scripts/scratch-run.sh`; Task 13 — `uv tool install --help`, `uv --version` and `git tag` refused, so the documented install command `uv tool install ".[models]"` and the `autonomous-sdlc-harness--v<version>` tag form were written unverified (the implementer recorded both as deviations in `harness-runs/task_plans/feat_docs_retrieval_backend_selection/task_13_plan.md`).
- **cost this run:** three tasks shipped checks that rest on a substitute or on reading alone; Task 13's install command is unverified until a human runs it.

## The committer's subject for code-review Finding 4 dropped the unit token to fit the length cap
- **category:** agent-contract
- **evidence:** commit `400a960` subject `Give the unreadable self-check failure of Python deps the install remedy`; the committer's own return says the title was about 88 characters over the 72-character cap, that the rule then requires the subject to name the entry, and that it reworded the title instead and left out `Finding 4`.
- **cost this run:** one pushed commit whose subject cannot be traced to its finding by token; not corrected (no amend or force-push in an unattended run).

## Corpus staleness reported by the plan writer
- **category:** tooling-gap
- **evidence:** the `task-plan-writer` return carried a `## Corpus staleness` section with one entry: `undescribed-layer` — `docs-retrieval-service/`, the Python docs-retrieval package (source, tests, compose file, README) landed by `feat_docs_retrieval_python_backend`, covered only by the catch-all `general` row (`path: "."`); Tasks 9, 10 and 15 edit it.
- **cost this run:** the debt this branch owes — the supervised remedy in the writer's spelling: run `/autonomous-sdlc-harness:harness-analyze` in a session in this repository and answer `skip` for every document that is already filled (not `--yes`), then apply the layer profile with `npx autonomous-sdlc-harness config set layers`; `doctor`'s `layer-drift` check reports the same directory.
