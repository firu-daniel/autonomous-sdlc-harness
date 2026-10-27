### 1. Remove the absolute checkout path from the skeptic-review finding_4 implementer record

**Site:** `harness-runs/skeptic_reviews/feat_unattended_sandbox_measurement_skeptic_review/finding_4.md` — the `- **Deviations from plan:**` bullet (line 61 as a navigation hint), at the substring `` The permission mode refused both `/bin/bash -n `` followed by the absolute checkout path to `scripts/lib/sandbox-probe/session.sh`.

**Failing test:** none — gate 6a no machine paths (`scripts/run-gates.sh`, function `machine_path_hits`, run by the `test` gate)

**Failure, quoted from the log** (the checkout root in the printed path rewritten to its repo-relative form, per the plan's path-rewrite rule):

```
  FAIL  6a no machine paths (printed output, which is the finding)
        ./harness-runs/skeptic_reviews/feat_unattended_sandbox_measurement_skeptic_review/finding_4.md:61:- **Deviations from plan:** Fix step 1 is applied as written. Step 2, the `/bin/bash -n scripts/lib/sandbox-probe/session.sh` parse check, was **not run**. The permission mode refused both `/bin/bash -n <absolute checkout root>/scripts/lib/sandbox-probe/session.sh` and `bash -n scripts/lib/sandbox-probe/session.sh` with *"Permission to use Bash has been denied because Claude Code is running in don't ask mode."* ...
run-gates: 1 failed, 24 passed
  - 6a no machine paths
FAIL: test (exit 1)
== run-test-suite.sh: gate test exited 1 ==
```

**Class:** round 1, no earlier log — not classifiable as new or persisting.

**Diagnosis:** Gate 6a (`machine_path_hits` in `scripts/run-gates.sh`) is `grep -rn "$HOME" .` over the whole checkout, excluding only `node_modules`, `dist`, `.git`, `test_run_logs`, `scratch` and `__pycache__`. `harness-runs/skeptic_reviews/` is not excluded, so any run artifact under it that carries the home directory fails the gate. The implementer that applied skeptic Finding 4 recorded the exact command the permission mode refused, and that command was written with the absolute checkout path (which sits under the home directory). This is the only hit: a recursive search of the current tree for the home directory, with the gate's own exclusions, lists `finding_4.md` and no other file. The gate's behaviour is correct. The fault is in the artifact's text, so the gate must not be touched.

**Fix:**

- [ ] In the `- **Deviations from plan:**` bullet of `harness-runs/skeptic_reviews/feat_unattended_sandbox_measurement_skeptic_review/finding_4.md`, replace the first refused command, `/bin/bash -n` + absolute checkout path + `/scripts/lib/sandbox-probe/session.sh`, with `` `/bin/bash -n <checkout root>/scripts/lib/sandbox-probe/session.sh` (the absolute path from a bare `git rev-parse --show-toplevel`) ``. This keeps the record's meaning: two distinct forms were refused, one absolute and one relative. Change nothing else in the bullet or the file.
- [ ] Do not edit `scripts/run-gates.sh`, and do not add an exclusion for `harness-runs/` or `skeptic_reviews/`. The gate is meant to catch exactly this.
- [ ] Afterwards, confirm with a plain `grep -n` of the literal home directory over that one file that it prints nothing. That is a text search, not a gate run.
