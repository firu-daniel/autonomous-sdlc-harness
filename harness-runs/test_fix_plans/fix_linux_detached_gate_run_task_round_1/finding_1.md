### 1. Remove the home-directory path from task 18's plan

**Site:** `harness-runs/task_plans/fix_linux_detached_gate_run/task_18_plan.md`, the `- Render evidence:` bullet, which contains the substring ``its parent, `<home>`, then `daniel` `` (about line 45; use the line number only to navigate).

**Failing test:** none — 6a no machine paths

**Failure (from the log):**

```
  FAIL  6a no machine paths (printed output, which is the finding)
        ./harness-runs/task_plans/fix_linux_detached_gate_run/task_18_plan.md:45:- Render evidence: the merge script read the scratch profile from `node cli/dist/cli.js init --cwd <scratch>/notes-app --non-interactive` and applied the three clauses longest path first (scratch root `/private/tmp/claude-501/t18scratch/notes-app`, its parent, `<home>`, then `daniel`). ...
```

(The log line shows the literal home directory where `<home>` appears above. The line is rewritten here and cut short after the first sentence.)

**Diagnosis:** this failure is persisting (round 1, with no earlier logs to compare against). Gate 6a (`scripts/run-gates.sh` → `machine_path_hits`) runs `grep -rn "$HOME"` over the whole checkout. It excludes only `node_modules`, `dist`, `.git`, `test_run_logs`, `scratch`, `__pycache__` and files under `harness-runs/clarifications/<sub>/`. `harness-runs/task_plans/` is not excluded, and task 18's plan is tracked. When its render-evidence bullet was written, it recorded the operator's literal home directory as one of the substitution clauses. A grep of the current tree finds this file is the only hit, so rewriting this one bullet clears the gate. The bullet also records a machine-local scratch path under `/private/tmp/claude-501/`. 6a does not catch that path because it is not under `$HOME`, but it is the same class of machine-local material.

**Fix:** edit that one bullet in `harness-runs/task_plans/fix_linux_detached_gate_run/task_18_plan.md` and leave the rest of the plan unchanged:
- [ ] Replace the literal home-directory path in ``its parent, `…`, then `daniel` `` with the placeholder `` `<home>` ``. Replace the bare user name `` `daniel` `` with `` `<user>` ``, so the bullet still says what the four clauses were without naming this machine.
- [ ] Replace the scratch root `` `/private/tmp/claude-501/t18scratch/notes-app` `` with `` `<scratch>/notes-app` ``. The same bullet already uses that placeholder in its `--cwd` argument.
- [ ] Confirm that `grep -rn` of the home directory over `harness-runs/task_plans/` prints nothing.

Do not add an exclusion for `harness-runs/task_plans/` to `machine_path_hits`. Task plans are committed artifacts, and the gate is right to check them.
