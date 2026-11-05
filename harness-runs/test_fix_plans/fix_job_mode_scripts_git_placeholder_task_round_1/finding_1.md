### 1. Replace the absolute home path in the branch's task prompt

**Site:** `harness-runs/task_prompts/fix_job_mode_scripts_git_placeholder_task_prompt.md`, the numbered item beginning `1. The base profile write-protects`, at the sentence `Locally: \`…/Work/harness-gate12/harness-scripts/.git\`.` (line 37 as a navigation hint). The file is tracked on this branch (added by commit `a1ccf8d4`).

**Failing test:** none — no machine paths (gate 6a, `scripts/check-machine-paths.sh` run by `scripts/run-gates.sh`)

**Failure, from the log** (home directory rewritten to `<home>`):

```
  FAIL  6a no machine paths (printed output, which is the finding, 2 s)
        ./harness-runs/task_prompts/fix_job_mode_scripts_git_placeholder_task_prompt.md:37:1. The base profile write-protects `<checkout>/<scriptsDir>/.git` at each scripts-directory level by exact path, by design. Locally: `<home>/Work/harness-gate12/harness-scripts/.git`. The path does not exist.
```

**Diagnosis:** gate 6a prints every line in the working tree that contains the running user's `$HOME` literally, and any printed line fails the gate. The task prompt quotes the operator's local example path in full, home directory included. The rest of the sentence already uses placeholders (`<checkout>/<scriptsDir>/.git`), so the absolute example adds nothing a reader needs. The directories the check skips (`test_run_logs`, `scratch`, `clarifications` subfolders) do not include `task_prompts`, so the file is in scope.

**Fix:** in that one sentence, replace the absolute path in the `Locally:` example with a form that does not contain the home directory, and leave the rest of the line as it is. For example, `Locally: \`<home>/Work/harness-gate12/harness-scripts/.git\`.`, or `Locally: \`<checkout>/harness-scripts/.git\` (scriptsDir \`harness-scripts\`).`. Make no other edit to the prompt.

- [ ] Rewrite the `Locally:` path on the matching line.
- [ ] Grep the file for the literal home directory and confirm nothing else matches.

**Deviations from plan:** The finding names no test file (`none — no machine paths`), so the row-`G.4` check took the fix-site fallback: the fix site still carried the absolute path, so the fix was implemented as `Locally: \`<home>/Work/harness-gate12/harness-scripts/.git\`.`. Gate 6a (`scripts/check-machine-paths.sh`) was not run — a gate script, which no unit runs; it is deferred to the Run gates phase, since `scripts/run-gates.sh` (named by `commands.test`) runs it. The close rests instead on `grep -c` for the literal home directory over the task prompt returning `0`, plus the selected tree guard `test/no-container-home-paths.test.mjs` passing (`# pass 1`, `# fail 0`).
