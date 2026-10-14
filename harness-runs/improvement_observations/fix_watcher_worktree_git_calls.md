## The plan unit needed 8 review rounds and hit the task-plan loop's 5-revision cap once
- **category:** optimization
- **evidence:** `harness-runs/architecture_reviews/fix_watcher_worktree_git_calls/` holds `review_0.md`–`review_3.md` (4 FAIL rounds, 1 Must Fix each); `harness-runs/task_plan_reviews/fix_watcher_worktree_git_calls/` holds `review_0.md`–`review_3.md` (4 FAIL rounds, Must Fix 5 / 4 / 1 / 1). Round-over-round by exact finding-title match within each root — architecture: round 1 3 net-new / 0 re-raised, round 2 1 net-new / 2 re-raised, round 3 3 net-new / 1 re-raised; task-plan: rounds 1–3 all net-new (10, 8, 8), 0 re-raised. The architecture gate consumed revisions 1–4 of the first walk, so the first `task-plan-reviewer` pass (5 Must Fix) arrived at the cap and the walker printed `binding: <escalate>` with `reason: cap`; the operator re-entered and a second walk converged after 3 more revisions. Exact-title matching undercounts a re-raised finding whose title was reworded.
- **cost this run:** one operator escalation mid-planning; 23 planning dispatches.

## The task-plan writer's return carried a corpus-staleness entry
- **category:** tooling-gap
- **evidence:** `stale-rule` — `.claude/context/conventions.md` → `## Shell assets` ("Never `git add -A` or `git add .`. Staging is always an explicit repo-relative path set, passed to the commit wrapper…") and `## Commit-message policy` ("enforced by the commit wrapper") are falsified by this branch: the watcher's own artifact commits now go through `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_commit_placed`, a plumbing commit of one explicit path through a temporary index, not through `commit-on-branch.sh`.
- **cost this run:** none this run; owes a follow-up restatement (dispatched agents pass an explicit path set to the commit wrapper; the watcher's own artifact commit stages one explicit path through `hr_commit_placed`; neither uses `git add -A`/`.`, both emit no trailer), via a supervised `/autonomous-sdlc-harness:harness-analyze .claude/context/conventions.md` re-run or a hand edit.

## The unit loop's row-A commit_prefix rule produced a prefix this repository's policy forbids
- **category:** agent-contract
- **evidence:** row `A`'s `commit_prefix rule` (`plugin/instructions/unit_loop_core.md` → `## Substitution table`) maps a `fix_` branch to `fix`; dispatch #2 (`[A · Task 1 · commit] → committer`) passed `commit_prefix: fix` and the committer returned `error: commit_prefix \`fix\` is not a legal value — .claude/context/conventions.md \`## Commit-message policy\` limits the prefix vocabulary to \`chore\` … gives a story task's commit … prefix \`none\``. Dispatch #3 re-ran it with `commit_prefix: none` and committed 9a10432d.
- **cost this run:** one committer dispatch redone.
- **hypothesis:** the row's branch-name rule and the fix rows' "read the committer's designation" rule disagree on where the prefix comes from.

## Sub-agents' throwaway probe and fixture commands were refused by the permission layer
- **category:** tooling-gap
- **evidence:** five sub-agent returns this run reported a refused command — the task-plan writer's extend dispatch ("the scratch-repo command was denied"), its revision 3 dispatch (object-store overwrite test "refused by the permission system"), the Task 5 implementer ("the direct shell run was refused", REPRO rows run through a probe instead), the Task 7 implementer ("the permission layer refused a direct shell fixture"), and skeptic dispatch #45 (its probe cleanup and a `git diff` read of `cli/src/core/git.ts` denied). Each routed around it via `bash scripts/scratch-run.sh` or stopped.
- **cost this run:** two planning claims left unverified at plan time (the object-store substitution was later reproduced in Task 14); one review dispatch lost (next entry); a probe script and probe repositories left in the session scratchpad.

## The first skeptic review dispatch ended without a verdict
- **category:** flow-efficiency
- **evidence:** dispatch #45 (`[C2 · skeptic-review · iter 0] → skeptic-reviewer`) returned `blocker:` — "a safety classifier stopped my output partway through", then two shell commands denied; it had reviewed only the `hr_run_*` section of `cli/templates/scripts/lib/harness-run-lib.sh`. The operator chose a plain re-dispatch; #46 completed (FAIL, 2 Must Fix, committed c85c5fc7).
- **cost this run:** one skeptic dispatch (~170 s) redone and one operator question.
