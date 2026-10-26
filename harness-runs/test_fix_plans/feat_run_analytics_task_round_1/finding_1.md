### 1. Gate 6a: the home directory is spelled out in `task_9_plan.md`

**Site:** `harness-runs/task_plans/feat_run_analytics/task_9_plan.md`, the `- Gate-6a probe:` bullet under `**Deviations from plan:**` (around line 31). It ends with the substring `` and `grep -n `` followed by the literal home directory and ` over all five targets printed nothing.`.

**Failing test:** none — test (gate 6a no machine paths, `scripts/run-gates.sh` → `machine_path_hits`)

**Failure (from the log, home path rewritten):**

```
FAIL  6a no machine paths (printed output, which is the finding)
./harness-runs/task_plans/feat_run_analytics/task_9_plan.md:31:  - Gate-6a probe: … The real gate 6a (`scripts/run-gates.sh` → `machine_path_hits`) greps for `$HOME`, and `grep -n <home>` over all five targets printed nothing.
```

**Diagnosis (first round, no earlier log):** Gate 6a runs `grep -rn "$HOME" .`, excluding only `node_modules`, `dist`, `.git`, `test_run_logs`, `scratch` and `__pycache__`. `harness-runs/task_plans/` is not excluded. The Task 9 implementer added a deviation note recording that it had grepped for the home directory, and it wrote the expanded absolute home path into that note. The note is the only line gate 6a printed. The rest of the bullet is harmless: `/Users/<segment>` and `strip_home("/Users/")` do not match `$HOME`.

**Fix:**

- [ ] In that bullet, replace the spelled-out home directory with a form that does not expand to it, for example `` `grep -n "$HOME"` `` (the literal, unexpanded variable). Keep the rest of the sentence as it is.
- [ ] Before finishing, read the whole file again and confirm that no other line spells out the absolute home directory or the checkout root.

Change nothing else. Do not add `harness-runs/task_plans` to the gate's exclusions in `scripts/run-gates.sh`: the gate exists to catch exactly this.
