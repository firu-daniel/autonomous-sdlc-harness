# general review — 2. `scripts/launch-sandboxed-gates.sh` is committed `100644` — iteration 2

Scope checked: the whole uncommitted set (`git status --short`: ` M` on the task file and on `scripts/launch-sandboxed-gates.sh`, nothing staged, no `??` paths). I ran these commands and they showed the following:
- `git diff HEAD` shows only `old mode 100644` / `new mode 100755` for the script, with no content hunk.
- `git ls-files -s` still records the index entry as `100644 69699c05…`, which matches the deviation note. The committer stages it.
- `ls -la` shows `-rwxr-xr-x`.
- `cli/templates/scripts/launch-sandboxed-gates.sh` does not appear in the change set.
- `git ls-files -s scripts` confirms the sibling main-checkout wrappers the plan names (`commit-on-branch.sh`, `push-branch.sh`, `refresh-branch.sh`, `run-test-suite.sh`) are `100755`.

The `**Deviations from plan:**` bullet agrees with `harness-runs/clarifications/fix_linux_detached_gate_run/answer_2.md` (Q1 — (a)), so I do not grade it as a deviation.

## Should Fix
1. **The deviation note cites the clarification files by bare filename, and neither filename resolves from the task file's folder** — `harness-runs/user_reviews/fix_linux_detached_gate_run_fix_plan_2/finding_2.md` (`**Deviations from plan:**`) — "(question_2.md, Q1). Under answer_2.md Q1 (a)"
   The task file's folder holds only `finding_1.md` and `finding_2.md`. The cited files are `harness-runs/clarifications/fix_linux_detached_gate_run/question_2.md` and `.../answer_2.md` (found with `find harness-runs -name question_2.md -o -name answer_2.md`). A reader checking the deviation's authority, such as `branch-reviewer`'s Pass 2, has to search for them. Both targets exist and say what the note claims, so no decision turns on this.
   **Fix:** Use the repo-relative paths: "(`harness-runs/clarifications/fix_linux_detached_gate_run/question_2.md`, Q1). Under `harness-runs/clarifications/fix_linux_detached_gate_run/answer_2.md` Q1 (a)".
