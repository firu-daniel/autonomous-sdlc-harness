### 1. The task prompt names a machine path under the home directory

**File:** `harness-runs/task_prompts/fix_upgrade_route_gate12_findings_task_prompt.md`, section `## Evidence`, the bullet beginning `- The rendered workflows before and after the upgrade:` (line 86 at plan time, navigation hint only). Its continuation line holds the substring `harness-gate12-test-steps/round4-rendered-workflows/`.

**Failing test:** none — gate 6a no machine paths (`scripts/run-gates.sh` → `machine_path_hits`).

**Failure, quoted from the gate log (machine paths rewritten):**

```
== gate 6 — self-containment
  FAIL  6a no machine paths (printed output, which is the finding)
        ./harness-runs/task_prompts/fix_upgrade_route_gate12_findings_task_prompt.md:86:  `<home>/Work/harness-gate12-test-steps/round4-rendered-workflows/`.
...
run-gates: 1 failed, 19 passed
  - 6a no machine paths
```

**Class:** first round (no earlier log to compare). The file entered the branch in commit `2f4d13e` (`chore: add task prompt for fix_upgrade_route_gate12_findings`) and is tracked.

**Diagnosis.** Gate 6a greps the whole tree for the running user's `$HOME` (excluding `node_modules`, `dist`, `.git` and `test_run_logs`) and fails on any output. `.claude/context/conventions.md` states the rule: *"The self-containment gate binds every commit: nothing in this tree may name a location on the machine that wrote it."* `harness-runs/` is not excluded, and the task prompt is tracked there. Its `## Evidence` list names the directory holding the Gate 12 round-4 rendered workflows as an absolute path under the author's home directory. That is the only hit: `git grep` finds no other tracked file naming `harness-gate12-test-steps`.

**Fix.**

- [ ] In `harness-runs/task_prompts/fix_upgrade_route_gate12_findings_task_prompt.md` → `## Evidence`, rewrite the continuation line of the bullet `- The rendered workflows before and after the upgrade:` so that it no longer contains an absolute path. Replace the absolute prefix up to `/Work` with the literal placeholder `<home>`, giving `` `<home>/Work/harness-gate12-test-steps/round4-rendered-workflows/` `` followed by the unchanged sentence-ending `.`, and append ` (machine-local; not part of this repository)` before that `.` so that a reader knows the directory is not in the tree. Change no other line of the file. The prompt's other evidence items are run IDs and carry no path.
- [ ] Confirm with `git grep -nF` on the literal home-directory prefix that no tracked file still names it. The line above is the only site at plan time.

**Deviations from plan:**

- Gate 6a (`scripts/run-gates.sh` → `machine_path_hits`) was not run: the finding names no test file (`none — gate 6a`), and a gate script is never run by a unit, so it is deferred to the Run gates phase. Fix-site fallback taken: the fix site did not carry the fix, so it was implemented; the close rests on reading the edited line and on `git grep -nF` for the home-directory prefix over the working tree, which returned no match.
