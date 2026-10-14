## Story-task commits took `chore:` from row A's branch-name rule while the repository policy designates no prefix
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` → `## Substitution table` row `A`'s `commit_prefix rule` cell maps a `chore_` branch to `chore`, so all 13 Phase-A dispatches passed `commit_prefix: chore` (commits 3b995e5b … c5035042). `.claude/context/conventions.md` → `## Commit-message policy` designates `none` for "Adding new work — a story task's commit" and reserves `chore` for the flow's fixed-form subjects. The committer's return on the Task 1 commit (3b995e5b) flagged the conflict and used the passed `chore` as its contract requires. The fix rows, which defer to the policy, passed `none` (commits 78aa504c … 30f297bc).
- **cost this run:** 13 story-task commits carry a prefix the repository's own policy does not designate for them.
- **hypothesis:** the row-`A` cell predates the policy-driven designation the fix rows read.

## `layer-implementer` skipped the unit's own type check on two prose-only units
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 2 says a unit runs `<typecheck_cmd>`. The Task 2 return ("`<typecheck_cmd>` was not run. The only change is Markdown in an agent definition") and the code-review Finding 2 return (commit 24dd0608: "I ran no typecheck command. The change touches only a prose agent definition") both ran none. The other 18 implementer returns this run ran `bash scripts/typecheck.sh`.
- **cost this run:** none observed — the Phase G round-1 run of `bash scripts/run-test-suite.sh task_round_1` printed `pass`.

## Repeated defect class: a shared cross-agent sentence forked by the thinning, 4 review items across 2 reviewers
- **category:** optimization
- **evidence:** readiness titles in `harness-runs/code_reviews/chore_thin_prose_family_unit_loop_code_review.md` (Finding 4 — the path-placeholder sentence "22 agents carry verbatim" forked; Finding 5 — the site-anchor definition "six other agents carry verbatim" rewritten; both `branch-reviewer`) and `harness-runs/skeptic_reviews/chore_thin_prose_family_unit_loop_skeptic_review.md` (Finding 1 — the `## Resolved values` opening clause "six other agents carry verbatim" forked; Finding 2 — the harness-doctrine sentence forked; both `skeptic-reviewer`). 4 review items, the units they fix being Tasks 2/6 (preambles), 7, 6 and 3.
- **cost this run:** 4 fix dispatch pairs (implementer + committer) restoring wording the tasks had removed.

## Zero-yield reviewer: `architecture-reviewer` ran 4 times and wrote no finding
- **category:** optimization
- **evidence:** 3 plan-review dispatches (planning iterations 0–2) and 1 implemented-branch dispatch (Phase A2), each returning `verdict: PASS`; `harness-runs/architecture_reviews/chore_thin_prose_family_unit_loop/` and `harness-runs/architecture_branch_reviews/chore_thin_prose_family_unit_loop_arch_review.md` do not exist.
- **cost this run:** 4 dispatches with no finding on a diff that touches only `plugin/agents/*.md`, `.claude/context/conventions.md` and run artifacts.

## Index-only commit
- **category:** optimization
- **evidence:** `Task 13` — c5035042 — "up-front word counts recorded in story index" (subject `chore: Mark Task 13 done — up-front word counts recorded in story index`; the committer's return carried `staged: index-only`).
- **cost this run:** none — the task's deliverable was a story-index table edit by design.
