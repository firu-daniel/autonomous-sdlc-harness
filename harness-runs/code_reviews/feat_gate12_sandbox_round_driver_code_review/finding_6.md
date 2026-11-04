### 6. FR5 is graded on the two steps' conclusions, not the step logs its Read from names, and its line declares no departure

**File:** `scripts/lib/gate12-sandbox-round/grade-full-run.sh` (`g12_grade_full_run`): "g12_fr_print FR5"

The **Read from** cell for FR5 in `docs/sandbox-verification.md` → `## 10.` is *"the `Refuse a branch that changed the job's own files` and `Record the default branch's commit` step logs"*. `g12_fr5_arm` grades on the two steps' conclusions, as its own comment says (*"FR5: graded on the two steps' conclusions."*), and never reads either log. That is a sound reading: `Record the default branch's commit` writes both commits to `$GITHUB_ENV` and exits 1 on each failure, so its log shows neither value.

Elsewhere the driver states such a departure on the result line, as JS1 does for `status` in place of `sync`. FR5 prints `departure="none"`, so the operator filling FR5's cell is not told that the evidence is a conclusion rather than a log line.

**Fix:** give FR5's line the departure. Replace `g12_fr_print FR5` with:

```bash
  g12_fr_print FR5 "" "graded on the two steps' conclusions, not their logs: Record the default branch's commit writes HARNESS_GITHUB_DEFAULT_COMMIT and HARNESS_DEFAULT_BRANCH_COMMIT to GITHUB_ENV, which its log does not show, and exits 1 on each failure"
```

Add a `G12_FR5_DEPARTURE` variable beside `G12_FR4_DEPARTURE` holding that text, and pass `"$G12_FR5_DEPARTURE"` in this call. In the early-return branch of `g12_grade_full_run`, the one taken when `g12_full_run_jobs` fails, pass the same constant as the fourth argument of the `g12_result_line FR5 …` call. The fix runs no test.
