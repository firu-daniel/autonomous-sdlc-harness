## The plan writer reported corpus staleness in `.claude/context/conventions.md`
- **category:** tooling-gap
- **evidence:** the `task-plan-writer`'s first return carried a `## Corpus staleness` section with one `stale-rule` entry: `.claude/context/conventions.md` → `## Shell assets`, the bullet "A command an unattended run issues must be spellable as a literal.", says a bare `${IDENT}` is admitted. This branch moves every commit point to the main checkout's `commit-on-branch.sh`, whose only grant is the profile's literal `allow` entry, which any `$` expansion loses, bare `${IDENT}` included.
- **cost this run:** none this run; the document owes a restatement that a call to a main-checkout wrapper (commit, push, refresh) carries no `$` at all — a supervised `/autonomous-sdlc-harness:harness-analyze .claude/context/conventions.md` re-run answered `skip` for every already-filled document, or a hand edit.

## The plan needed 3 review rounds before convergence
- **category:** optimization
- **evidence:** convergence churn on the plan unit — 3 round artifacts across its review roots: `harness-runs/task_plan_reviews/fix_sandbox_worktree_record_writes/review_0.md`, `review_1.md`, and `harness-runs/architecture_reviews/fix_sandbox_worktree_record_writes/review_0.md` (no business-parity folder; `phases.parity` is false). Task-plan root, round 1 against round 0, by heading: 6 headings, 1 re-raised (the Should Fix on `task_2_plan.md`'s mutation check, which the round-1 heading itself labels "carried over from iteration 0"), 5 net-new. Architecture root: one round only, no predecessor to diff.
- **cost this run:** 4 extra dispatches (two writer revisions and their re-reviews) beyond a first-pass convergence.

## Story-task commits took a `fix:` prefix the project's commit policy does not allow
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` row `A`'s `commit_prefix rule` maps a `fix_` branch to `fix`, so Tasks 1–11 were dispatched with `commit_prefix: fix` and committed as `fix: Task N — …` (first: 5b15b740). `.claude/context/conventions.md` → `## Commit-message policy` designates `none` for a story task's commit and lists `chore` as the only prefix token in use. The committer's return on Task 1 flagged the conflict and used the value given; the review-fix rows (by designation) correctly took `none`.
- **cost this run:** 11 commits on the branch carry a prefix outside the project's policy vocabulary.
- **hypothesis:** row `A`'s branch-name rule and the committer's "token outside that policy is not a legal value" rule disagree whenever an adopter's policy designates `none` for new work.

## A temporary fixture could not be removed after a unit's end-to-end check
- **category:** tooling-gap
- **evidence:** the Task 4 `layer-implementer` return: its `rm -rf` of the throwaway `init` fixture it built under the system temp directory was refused, leaving the fixture in place.
- **cost this run:** one stray fixture directory left in the system temp directory.

## The branch reviewer's Pass 0 grep sweep had no patterns configured
- **category:** silent-failure
- **evidence:** the Phase B `branch-reviewer` return: "The grep half did not run: this agent's sweep table has no regexes filled in for this project, so it checked nothing. That is a setup gap, not a clean result."
- **cost this run:** Pass 0's grep sweep contributed nothing to the end-of-branch review.

## The branch reviewer could not run a fixture to confirm its Must Fix
- **category:** tooling-gap
- **evidence:** the Phase B `branch-reviewer` return on Finding 1 (submodule under a passed directory): "I confirmed this by reading the code only: a fixture run I tried was refused permission."
- **cost this run:** the Must Fix was graded from a code read alone; its reproduction was first run by the fixing implementer's new test case (l).

## The task prompt itself carried a machine path and failed the first Run gates round
- **category:** convention
- **evidence:** Phase G round 1 printed `fail harness-runs/test_run_logs/fix_sandbox_worktree_record_writes/task_round_1.log`; the test fix plan `harness-runs/test_fix_plans/fix_sandbox_worktree_record_writes_task_round_1.md` traced it to one finding — line 3 of `harness-runs/task_prompts/fix_sandbox_worktree_record_writes_task_prompt.md` citing a file by its home-directory path, which the no-machine-paths gate rejects. Fixed in 508ef41e by rewriting it to `<home>/…`; round 2 passed.
- **cost this run:** one extra gate round and five dispatches (fix-plan writer, architecture gate, plan commit, implementer, fix commit).
