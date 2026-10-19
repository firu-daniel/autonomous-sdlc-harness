### 1. Replace the machine path in the round-2 architecture review artifact

**Site:** `harness-runs/architecture_reviews/feat_clone_per_run/review_2.md` — the bullet beginning `- **Test-run rule** (` (around line 21, navigation hint only).

**Failing test:** `scripts/run-gates.sh` — `6a no machine paths` (gate 6, self-containment; driven by `bash scripts/test.sh`).

**Failure, as the log reports it:**

```
  FAIL  6a no machine paths (printed output, which is the finding)
        ./harness-runs/architecture_reviews/feat_clone_per_run/review_2.md:21:- **Test-run rule** (`<home>/Work/autonomous-sdlc-harness/plugin/instructions/unit_loop_core.md` → `## The test-run rule`).
```

**Diagnosis.** First observed this round (no earlier logs). Gate 6a (`machine_path_hits` in `scripts/run-gates.sh`) greps the whole checkout for the running user's `$HOME` string, excluding only `node_modules`, `dist`, `.git`, `test_run_logs`, `scratch` and `__pycache__`; `harness-runs/architecture_reviews/` is not excluded. The file `harness-runs/architecture_reviews/feat_clone_per_run/review_2.md` is tracked and was committed on this branch (commit `7c5e5539`, "chore: Add task plan for feat_clone_per_run"). Its "Test-run rule" bullet cites the unit-loop document by the absolute plugin path the reviewer resolved at runtime instead of the portable `${CLAUDE_PLUGIN_ROOT}` form. A grep of the current tree confirms this is the only hit outside `.git`.

**Fix.** In `harness-runs/architecture_reviews/feat_clone_per_run/review_2.md`, in that one bullet, replace the absolute path prefix that ends in `/plugin/instructions/unit_loop_core.md` with `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md`, so the bullet reads:

```
- **Test-run rule** (`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`).
```

Change nothing else in the file. Do not add an exclusion to gate 6a and do not edit `scripts/run-gates.sh`; the gate is right, and the artifact is what's wrong.

- [ ] After the edit, check that a literal-string grep of `harness-runs/architecture_reviews/feat_clone_per_run/` for the home-directory prefix prints nothing. This is a grep, not a test run.
