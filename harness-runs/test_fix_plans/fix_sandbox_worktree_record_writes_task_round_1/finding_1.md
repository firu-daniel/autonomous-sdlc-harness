### 1. Replace the home-directory path in this branch's task prompt with `<home>/…`

**Site:** `harness-runs/task_prompts/fix_sandbox_worktree_record_writes_task_prompt.md`, at the substring `harness-sandbox-tests/sandbox-verification-issues.md` in the paragraph that begins "It starts from a `dev` that carries". This is around line 3, which is only a navigation hint.

**Failing test:** `scripts/run-gates.sh`, `6a no machine paths`

**Failure (from the log):**

```
  FAIL  6a no machine paths (printed output, which is the finding)
        ./harness-runs/task_prompts/fix_sandbox_worktree_record_writes_task_prompt.md:3:It starts from a `dev` that carries `chore_sandbox_manual_verification` and `fix_sandbox_excluded_commands_form`, whose corrected `excludedCommands` form goal 3 relies on. Read `docs/sandbox-verification.md`'s rows and `<home>/Work/harness-sandbox-tests/sandbox-verification-issues.md` #1 before designing anything.
```

**Diagnosis:** This failure is new in round 1; there is no earlier log. Gate 6a (`machine_path_hits` in `scripts/run-gates.sh`) greps the whole tree for the running user's `$HOME` literal, and only `test_run_logs`, `scratch`, `__pycache__`, `node_modules`, `dist` and `.git` are excluded. The task prompt for this branch was committed (`chore: task prompt`) with the absolute home-directory path to the sandbox-tests issues file written out in full. It is the only hit. The other committed task prompts already write such paths as `<home>/Work/…`. For example, `harness-runs/task_prompts/fix_sandbox_excluded_commands_form_task_prompt.md` cites the same issues file as `<home>/Work/harness-sandbox-tests/sandbox-verification-issues.md` #9. The conventions rule `.claude/context/conventions.md` → "The self-containment gate binds every commit" forbids naming a location on the authoring machine anywhere in the tree.

**Fix:** In `harness-runs/task_prompts/fix_sandbox_worktree_record_writes_task_prompt.md`, replace the home-directory prefix of that path with the literal `<home>`. The citation then reads `` `<home>/Work/harness-sandbox-tests/sandbox-verification-issues.md` #1 ``. Leave the rest of the sentence and the file unchanged.

- [ ] After the edit, grep the file for the home-directory literal and confirm it prints nothing.
- **Deviations from plan:** The finding names a gate script (`scripts/run-gates.sh`, `6a no machine paths`), not a test file, so the row-`G.4` single-file run was skipped under the fix-site fallback; a gate script is never run by a unit. The fix site was read before the edit and still carried the home-directory literal on line 3, so the fix was implemented. The close rests on `grep -n "$HOME"` over the edited task prompt printing nothing (count `0`) and on `bash scripts/typecheck.sh` printing `PASS: typecheck`; gate 6a itself is verified by the Run gates phase.
