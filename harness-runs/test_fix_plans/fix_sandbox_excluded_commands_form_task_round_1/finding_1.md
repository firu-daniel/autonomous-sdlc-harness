### 1. Task prompt quotes an absolute home-directory path, failing gate 6a

**Site:** `harness-runs/task_prompts/fix_sandbox_excluded_commands_form_task_prompt.md`, line 1 (navigation hint only) — the parenthetical ending the first paragraph, quoted substring: `sandbox-verification-issues.md` #9`. The file is currently untracked in this worktree.

**Failing test:** `scripts/run-gates.sh` — `6a no machine paths` (gate 6 — self-containment).

**Failure, from the log:**

```
  FAIL  6a no machine paths (printed output, which is the finding)
        ./harness-runs/task_prompts/fix_sandbox_excluded_commands_form_task_prompt.md:1:… (`docs/sandbox-verification.md` → the push and refresh rows; `<home>/Work/harness-sandbox-tests/sandbox-verification-issues.md` #9).
```

(The log prints the literal home-directory prefix where `<home>` stands above.)

**Diagnosis:** New this round (no earlier round). Gate 6a (`machine_path_hits` in `scripts/run-gates.sh`) runs a recursive `grep -rn "$HOME" .` over the checkout, excluding only `node_modules`, `dist`, `.git`, `test_run_logs`, `scratch` and `__pycache__`, and fails on any output. `harness-runs/task_prompts/` is not excluded, and line 1 of this branch's task prompt cites the issues file by its absolute path under the home directory. A grep of the current tree for the home-directory prefix finds this one line and no other hit outside the excluded directories (the `.git` gitdir line is filtered by the gate's second stage). No code under `cli/`, `plugin/` or `scripts/` is at fault; the gate is behaving as designed.

**Concrete fix:** In `harness-runs/task_prompts/fix_sandbox_excluded_commands_form_task_prompt.md`, line 1, replace the absolute home-directory prefix of the issues-file path with the placeholder `<home>`, so the parenthetical reads:

```
(`docs/sandbox-verification.md` → the push and refresh rows; `<home>/Work/harness-sandbox-tests/sandbox-verification-issues.md` #9).
```

This is the established form in sibling task prompts (for example `harness-runs/task_prompts/chore_gate_10_real_catalog_measurement_task_prompt.md` writes `<home>/Work/gate10-corpus`). Change nothing else in the file, and do not add an exclusion to `machine_path_hits` or otherwise weaken gate 6a.

- [ ] Rewrite the one path on line 1 to its `<home>/…` form.
- [ ] Confirm with a plain `grep -n` for the home-directory prefix over that one file that no other occurrence remains.
