## Plan convergence took 6 review rounds, each surfacing net-new Must Fix findings
- **category:** optimization
- **evidence:** trip-wire *Convergence churn* on the plan unit. Rounds: `harness-runs/task_plan_reviews/feat_docs_retrieval_backend_comparison/review_0.md`–`review_2.md` (3) and `harness-runs/architecture_reviews/feat_docs_retrieval_backend_comparison/review_0.md`–`review_2.md` (3) = 6 (`phases.parity` is false, so no parity root). Per round, by finding title against the same root's predecessor — task-plan review: r0 6 findings; r1 2 Must Fix net-new, 4 Should Fix re-raised, 2 Should Fix net-new; r2 2 Must Fix net-new, 6 Should Fix re-raised, 4 Should Fix net-new. Architecture review: r0 3 findings; r1 1 Must Fix net-new, 1 Should Fix re-raised, 3 Should Fix net-new; r2 1 Must Fix net-new, 4 Should Fix re-raised, 3 Should Fix net-new. Every round's Must Fix set was net-new; the loop reached its 5-revision cap and needed two operator-granted extensions.
- **cost this run:** two live escalations to the operator during planning; plan convergence spanned the cap.
- **hypothesis:** guess — each review round reads only part of the plan's surface, so Must Fix findings arrive in successive slices rather than being re-raised.

## Plan-review Should Fix findings left open at convergence were re-raised as implementation-phase findings
- **category:** flow-efficiency
- **evidence:** three Should Fix findings carried as "still open" through the final plan-review rounds reappeared as implemented-branch findings. `harness-runs/task_plan_reviews/feat_docs_retrieval_backend_comparison/review_0.md` Should Fix 1 (the `@python` block's threshold provenance) — re-raised in `review_1.md` and `review_2.md` — is `harness-runs/skeptic_reviews/feat_docs_retrieval_backend_comparison_skeptic_review.md` Finding 1 (fixed in `4a5eaa4`). Same file's Should Fix 2 (`packageVersion` has no path into the record) is `harness-runs/code_reviews/feat_docs_retrieval_backend_comparison_code_review.md` Finding 3 (fixed in `c060168`). `harness-runs/architecture_reviews/feat_docs_retrieval_backend_comparison/review_2.md` Should Fix "The wrapper invocation is spelled in two modules" is `harness-runs/architecture_branch_reviews/feat_docs_retrieval_backend_comparison_arch_review.md` Finding 2 (fixed in `04fed97`). `review_2.md`'s Should Fix on a defect "named as work for its own branch" is the `branch-reviewer`'s `## Questions` item at Phase B.
- **cost this run:** three implement → commit cycles (6 dispatches) for findings already identified at planning time.

## Run gates needed 4 runs; gate 13b failed three rounds running on one mypy cause
- **category:** optimization
- **evidence:** trip-wire *Convergence churn* on the Run gates phase. `harness-runs/test_fix_plans/feat_docs_retrieval_backend_comparison_task_round_1.md`, `_round_2.md`, `_round_3.md` (3 test fix plans; the round-4 run printed `pass`). Finding 1 of each round is gate 13b (Python typecheck): r1 "mypy follows the installed `models` extra into numpy stubs that need Python 3.12" (fix `50ec19a`), r2 "mypy still reaches numpy's 3.12-only stubs, through psycopg's type-only import" (fix `53adc21`), r3 "mypy ignores `follow_imports = \"skip\"` for numpy because numpy ships `.pyi` stubs" (fix `d0bd70a`). By heading each round is net-new; all three share one failing gate and one root cause (numpy's stubs reached under `python_version = "3.11"`). Each implementer reported it did not run gate 13b, as its finding instructed. Gate 6a similarly needed two rounds (r1 `scratch`, r2 `__pycache__`).
- **cost this run:** 3 gate runs, 3 test-fix-plan writers, 3 architecture gates, 3 plan commits and 5 fix units (19 dispatches, #82–#100) for one config setting and one gate exclusion.
- **hypothesis:** guess — a fix unit that cannot run the one gate it fixes iterates by full gate rounds.

## Restarting the planning walker after a cap escalation printed the initial-draft prompt
- **category:** agent-contract
- **evidence:** at the planning cap the operator chose "One more revision"; re-entering with `bash scripts/flow-walker.sh start --entry plan_writer --flow task_plan_writing` printed `prompt: initial` with the revision cap reset, although a story index and open architecture `review_2.md` Must Fix existed. The orchestrator dispatched the revision prompt instead of the one the walker printed.
- **cost this run:** one hand-substituted dispatch prompt; the walker's printed routing could not be followed as-is after an escalation answer.

## Row A's `commit_prefix` rule and the repository's commit policy disagreed on the first task commit
- **category:** agent-contract
- **evidence:** the Task 13 commit `f388180 feat: Export embedder extraction options as one constant (Task 13)` carries a branch-name-derived `feat:` prefix; the committer reported that `.claude/context/conventions.md`'s commit-message policy designates no prefix (`none`) for that class. Every later task was dispatched with `commit_prefix: none`. `f388180` was left as is, since changing it needs a history rewrite.
- **cost this run:** one commit on the branch whose subject does not follow the repository's policy.

## A committer amended a commit with a raw `git commit --amend` outside the commit wrapper
- **category:** agent-contract
- **evidence:** the Task 8 committer landed `44c6b8d`, then ran `git commit --amend` directly to correct the subject, producing `9b4b79e Compare two backends' blocks per query in backend-comparison (Task 8)`, which it pushed. The amend did not go through `scripts/commit-on-branch.sh`.
- **cost this run:** none observed beyond one rewritten local SHA; the commit wrapper's checks were bypassed for that amend.

## Selecting the TypeScript backend with `config set` stopped the TypeScript MCP server on a published runtime
- **category:** silent-failure
- **evidence:** in the operator's step-7 agent session, after `node cli/dist/cli.js config set docs.retrievalBackend typescript`, the TypeScript session's `system/init` listed `harness-docs` as `failed` and the agent answered without searching. The machine-wide runtime `init` installed was the published `autonomous-sdlc-harness@0.5.0`, whose schema rejects `docs.retrievalBackend: unknown key`; this checkout also reports `0.5.0` but has the key. `doctor` passed all six retrieval checks on that same repository. Recorded in `docs/retrieval-eval-results.md` → `### One agent session through .mcp.json`; the hand-run protocol now carries the workaround (`f629263`).
- **cost this run:** one operator agent session redone by hand; `doctor` gave no warning.

## The planner reported corpus staleness: `docs-retrieval-service/` is covered only by the catch-all layer
- **category:** tooling-gap
- **evidence:** the `task-plan-writer`'s return carried `## Corpus staleness` with one `undescribed-layer` entry: `docs-retrieval-service/`, the Python package with its own uv / ruff / mypy toolchain and gate 13, falls under the `general` catch-all layer (`path: "."`) with no conventions document of its own.
- **cost this run:** that directory's work was planned and reviewed against the cross-layer conventions only. It owes the supervised remedy: a `/autonomous-sdlc-harness:harness-analyze` run answered `skip` for every already-filled document (never `--yes`), then `npx autonomous-sdlc-harness config set layers`.
