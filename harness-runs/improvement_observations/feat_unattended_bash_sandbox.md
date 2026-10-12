## The unit loop's row-A commit_prefix rule and the committer's contract name different prefixes for a story task
- **category:** agent-contract
- **evidence:** Task 1 was dispatched to `committer` with `commit_prefix: feat`, per `plugin/instructions/unit_loop_core.md` → `## Substitution table` row `A` (*"from the branch name: `feat_` → `feat`"*). The committer used it (commit `fb5470b0`, subject `feat: Task 1 — Add the sandbox key to the config model and its check`) and returned a note that `.claude/context/conventions.md` → `## Commit-message policy` designates **`none`** for a story-task commit and that `chore` is the only prefix token in use. `plugin/agents/committer.md` → `commit_prefix` says a token outside the policy *"is not a legal value"*. Every later story-task dispatch this run passed `none`, so one commit on the branch carries the off-policy prefix.
- **cost this run:** one pushed commit (`fb5470b0`) with a subject outside the repository's commit-message policy.
- **hypothesis:** the row-A cell predates the per-commit-class designation the committer now reads.

## task-plan-writer appended scope-register rows with a Bash heredoc instead of the Write tool
- **category:** agent-contract
- **evidence:** the second revision dispatch of `task-plan-writer` this session (against `harness-runs/task_plan_reviews/feat_unattended_bash_sandbox/review_3.md`) returned: *"The rows 200–205 were appended with a Bash heredoc rather than the `Write` tool. The content is the same, but it breaks the agent's save-with-Write rule."*
- **cost this run:** none measured; the plan reviewer passed the revision on the next round.

## A recursive removal of a gitignored scratch copy was refused, leaving it on disk
- **category:** tooling-gap
- **evidence:** the implementer of architecture finding 6 (`harness-runs/architecture_branch_reviews/feat_unattended_bash_sandbox_arch_review/finding_6.md`) extracted a `git archive HEAD` copy to `harness-runs/scratch/head/` for a cycle probe and reported: *"I could not delete the extracted `git archive` copy at `harness-runs/scratch/head/` because the `rm -rf` was refused."*
- **cost this run:** a stale checkout copy left under the gitignored `harness-runs/scratch/`.

## The Run gates log keeps only the last 25 lines of a failing check, which under-reported gate 6d
- **category:** silent-failure
- **evidence:** `test-fix-plan-writer` for round 1 (`harness-runs/test_fix_plans/feat_unattended_bash_sandbox_task_round_1.md`) returned: *"`scripts/run-gates.sh` prints only the last 25 lines of a failing check's output, and the check found 26. The line it dropped, `docs/work-report-research/README.md:122`, is in the finding."* The writer recovered the 26th site by re-running the check's pattern itself.
- **cost this run:** none, because the writer re-derived the dropped line; a fix plan written only from the log would have left gate 6d failing for one more round.

## The Python-backed gate 13 checks were BLOCKED on this host
- **category:** tooling-gap
- **evidence:** round 1's log (`harness-runs/test_run_logs/feat_unattended_bash_sandbox/task_round_1.log`) reported checks 13a–13c as BLOCKED for want of a Python environment; `test-fix-plan-writer` listed them under `## Not fixable on this branch` with the remedy `bash scripts/python-service.sh sync` on the host. Round 2 printed `pass` with those checks still not exercised.
- **cost this run:** three gate checks did not run on this branch.

## The plan's corpus staleness: two conventions documents now state that an unlisted call stalls
- **category:** tooling-gap
- **evidence:** the first `task-plan-writer` revision this session returned a `## Corpus staleness` section with two `stale-rule` entries: `.claude/context/cli.md` → *"One string, one producer."* (*"drift between them is invisible until an unattended run stalls"*), and `.claude/context/conventions.md` (line hints 65, 109, 135: *"a different string and stalls"*, *"an unanswerable prompt in an unattended run is a stall"*, *"raises an approval prompt the run cannot answer"*). This branch makes `dontAsk` the unattended permission mode, under which such a call is refused at once.
- **cost this run:** both documents owe a follow-up restatement — a supervised `/autonomous-sdlc-harness:harness-analyze` run answered `skip` for every already-filled document, or a hand edit — so that each says the call is refused under the default `dontAsk` mode.

## Convergence churn: the plan needed 7 review rounds
- **category:** optimization
- **evidence:** the plan unit's rounds across its plan-convergence roots: `harness-runs/task_plan_reviews/feat_unattended_bash_sandbox/` holds `review_0`–`review_3` (4 rounds) and `harness-runs/architecture_reviews/feat_unattended_bash_sandbox/` holds `review_0`–`review_2` (3 rounds); `business_parity_reviews` was not reached (`phases.parity` is false). Per-round split by Must Fix heading: task-plan review 1 vs 0 — 4 net-new, 0 re-raised; 2 vs 1 — 0 net-new, 4 re-raised; 3 vs 2 — 3 net-new, 0 re-raised. Architecture review 1 vs 0 — 1 net-new; 2 vs 1 — 1 net-new. Round 2's four re-raised findings followed an earlier session that hit the 5-revision cap with `review_1.md` written and the plan not yet revised against it; this session resumed by sending the unrevised draft back through review (`task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability` case (d)).
- **cost this run:** one review round spent re-raising findings no revision had yet addressed.
