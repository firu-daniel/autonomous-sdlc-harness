## Row A's commit_prefix rule disagrees with the adopting repository's commit policy
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` (main checkout) → `## Substitution table`, row `A`, `commit_prefix rule` cell: "from the branch name: `feat_` → `feat`, `fix_` → `fix` …". The orchestrator applied it and dispatched the Task 1 committer with `commit_prefix: fix`, giving commit a8d79dde `fix: Task 1 — Generate excludedCommands in the bash wrapper form`. The committer's return flagged that `.claude/context/conventions.md` → `## Commit-message policy` gives a story task's commit the prefix `none`. Tasks 2–5 were then dispatched with `commit_prefix: none` (ba92bbd5, ea67e3d9, 5c14a70b, 030090cc).
- **cost this run:** one task commit on the branch carries a prefix the repository's policy forbids; the remaining four use the policy's form, so the branch's task commits are inconsistent.
- **hypothesis:** the fix rows defer to `committer.md`'s designation, while row `A` alone derives the prefix from the branch name.

## The manual entry point left the task prompt untracked, and Run gates round 1 failed on it
- **category:** silent-failure
- **evidence:** at session start `git status` showed `harness-runs/task_prompts/fix_sandbox_excluded_commands_form_task_prompt.md` untracked. In the manual entry point no step commits it; the clean-tree register's entry 1 is the watcher's. Every committer return from Task 1 onward reported the tree not clean because of that file. `bash scripts/run-test-suite.sh task_round_1` printed `fail harness-runs/test_run_logs/fix_sandbox_excluded_commands_form/task_round_1.log`. The round-1 test fix plan's one fixable finding was "Task prompt quotes an absolute home-directory path, failing gate 6a". Its fix commit a4cac861 also brought the prompt under version control. Round 2 printed `pass`.
- **cost this run:** one Run gates round and 5 dispatches (test-fix-plan-writer, architecture-reviewer, committer, layer-implementer, committer).

## The test fix plan counts BLOCKED gates as not-fixable failures
- **category:** agent-contract
- **evidence:** `test-fix-plan-writer`'s return for `harness-runs/test_fix_plans/fix_sandbox_excluded_commands_form_task_round_1.md` carried `fixable: 1` and `not_fixable: 3`. Its `## Not fixable on this branch` section lists gates 13a, 13b and 13c, which are BLOCKED because the Python environment is not provisioned on this host. The same section says `run-gates` does not count them as failures (`1 failed, 24 passed`). Round 2's log reports them BLOCKED again, and round 2 printed `pass`.
- **cost this run:** the return's `not_fixable: 3` reads as three failures. The orchestrator relayed them as such in its Done summary, and it took a manual read to correct that.
